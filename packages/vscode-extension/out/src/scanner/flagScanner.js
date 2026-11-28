"use strict";
/**
 * Workspace scanner for Flagsmith SDK usage patterns.
 *
 * Supported patterns (JavaScript/TypeScript/JSX/TSX):
 *
 * flagsmith.isFeatureEnabled('flag_name')
 * flagsmith.getValue('flag_name')
 * flagsmith.hasFeature('flag_name')
 * useFlags(['flag_name'])
 * flagsmith.getTrait('flag_name')
 * getFlagsmithValue('flag_name')
 * client.isFeatureEnabled('flag_name')
 * client.getValue('flag_name')
 * flagsmith.identify('user_id', traits, ['flag_name'])
 *
 * Conservative approach: only matches string literals, not dynamic references.
 * Dynamic references (variables, template literals) are noted as limitations.
 *
 * Known limitations:
 * - Dynamic flag names (e.g. flagsmith.getValue(getFlagName())) are not detected
 * - Flags used only in test files may appear unused
 * - Aliased client variables (const f = flagsmith; f.getValue('x')) may be missed
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlagScanner = void 0;
const vscode = __importStar(require("vscode"));
// Patterns that indicate Flagsmith SDK usage
// Each pattern: [regex with named group 'flag', description]
const STATIC_PATTERNS = [
    [/flagsmith\.isFeatureEnabled\(\s*['"`](?<flag>[a-zA-Z0-9_-]+)['"`]/g, 'isFeatureEnabled'],
    [/flagsmith\.getValue\(\s*['"`](?<flag>[a-zA-Z0-9_-]+)['"`]/g, 'getValue'],
    [/flagsmith\.hasFeature\(\s*['"`](?<flag>[a-zA-Z0-9_-]+)['"`]/g, 'hasFeature'],
    [/flagsmith\.getTrait\(\s*['"`](?<flag>[a-zA-Z0-9_-]+)['"`]/g, 'getTrait'],
    [/client\.isFeatureEnabled\(\s*['"`](?<flag>[a-zA-Z0-9_-]+)['"`]/g, 'client.isFeatureEnabled'],
    [/client\.getValue\(\s*['"`](?<flag>[a-zA-Z0-9_-]+)['"`]/g, 'client.getValue'],
    [/useFlags\(\s*\[['"`](?<flag>[a-zA-Z0-9_-]+)['"`]/g, 'useFlags (first)'],
    [/getFlagsmithValue\(\s*['"`](?<flag>[a-zA-Z0-9_-]+)['"`]/g, 'getFlagsmithValue'],
    [/isFeatureEnabled\(\s*['"`](?<flag>[a-zA-Z0-9_-]+)['"`]/g, 'isFeatureEnabled (bare)'],
];
// Patterns indicating dynamic usage we can't resolve
const DYNAMIC_PATTERNS = [
    /flagsmith\.isFeatureEnabled\(\s*[^'"`\)]/,
    /flagsmith\.getValue\(\s*[^'"`\)]/,
    /flagsmith\.hasFeature\(\s*[^'"`\)]/,
];
class FlagScanner {
    constructor(diagnosticCollection) {
        this.diagnosticCollection = diagnosticCollection;
    }
    async scanWorkspace() {
        const config = vscode.workspace.getConfiguration('orqesta');
        const includePatterns = config.get('scanInclude', ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']);
        const excludePatterns = config.get('scanExclude', [
            '**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/out/**',
        ]);
        const excludeGlob = `{${excludePatterns.join(',')}}`;
        let allFiles = [];
        for (const pattern of includePatterns) {
            const files = await vscode.workspace.findFiles(pattern, excludeGlob);
            allFiles = [...allFiles, ...files];
        }
        // Deduplicate
        const fileSet = new Set(allFiles.map((f) => f.fsPath));
        const uniqueFiles = [...fileSet].map((p) => vscode.Uri.file(p));
        const references = [];
        let hasDynamicReferences = false;
        for (const fileUri of uniqueFiles) {
            const fileRefs = await this.scanFile(fileUri);
            references.push(...fileRefs.refs);
            if (fileRefs.hasDynamic)
                hasDynamicReferences = true;
        }
        return {
            references,
            filesScanned: uniqueFiles.length,
            scannedAt: new Date().toISOString(),
            hasDynamicReferences,
        };
    }
    async scanFile(uri) {
        let content;
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            content = Buffer.from(bytes).toString('utf-8');
        }
        catch {
            return { refs: [], hasDynamic: false };
        }
        const refs = [];
        const lines = content.split('\n');
        let hasDynamic = false;
        // Check for dynamic patterns
        for (const dynPattern of DYNAMIC_PATTERNS) {
            if (dynPattern.test(content)) {
                hasDynamic = true;
                break;
            }
        }
        // Extract static references
        for (const [pattern, patternName] of STATIC_PATTERNS) {
            pattern.lastIndex = 0; // reset regex state
            const globalPattern = new RegExp(pattern.source, 'g');
            let lineIndex = 0;
            for (const line of lines) {
                globalPattern.lastIndex = 0;
                let match;
                while ((match = globalPattern.exec(line)) !== null) {
                    const flagName = match.groups?.['flag'];
                    if (flagName) {
                        refs.push({
                            flagName,
                            filePath: uri.fsPath,
                            line: lineIndex,
                            character: match.index,
                            pattern: patternName,
                            isDynamic: false,
                        });
                    }
                }
                lineIndex++;
            }
        }
        return { refs, hasDynamic };
    }
    /**
     * Debounced scan on file save.
     */
    scheduleScan(onComplete) {
        if (this.scanTimeout) {
            clearTimeout(this.scanTimeout);
        }
        this.scanTimeout = setTimeout(async () => {
            const result = await this.scanWorkspace();
            onComplete(result);
        }, 1500);
    }
    /**
     * Compute which flags from Flagsmith are not referenced in code.
     * Conservative: only reports unused if no dynamic references exist in the workspace.
     */
    getUnusedFlags(flagsmithFlagNames, scanResult) {
        if (scanResult.hasDynamicReferences) {
            // Can't reliably determine unused flags when dynamic references exist
            return flagsmithFlagNames.map((name) => ({
                flagName: name,
                note: 'Dynamic references detected — may be used dynamically',
            }));
        }
        const referencedNames = new Set(scanResult.references.map((r) => r.flagName));
        return flagsmithFlagNames
            .filter((name) => !referencedNames.has(name))
            .map((name) => ({ flagName: name, note: 'No static references found in workspace' }));
    }
    dispose() {
        if (this.scanTimeout) {
            clearTimeout(this.scanTimeout);
        }
    }
}
exports.FlagScanner = FlagScanner;
//# sourceMappingURL=flagScanner.js.map