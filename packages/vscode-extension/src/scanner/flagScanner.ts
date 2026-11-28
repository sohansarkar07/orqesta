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

import * as vscode from 'vscode';
import * as path from 'path';

export interface FlagReference {
  flagName: string;
  filePath: string;
  line: number;
  character: number;
  pattern: string;
  isDynamic: boolean;  // true = we detected a dynamic reference we can't resolve
}

export interface ScanResult {
  references: FlagReference[];
  /** File paths that were scanned */
  filesScanned: number;
  /** ISO timestamp */
  scannedAt: string;
  /** Warning about dynamic references */
  hasDynamicReferences: boolean;
}

// Patterns that indicate Flagsmith SDK usage
// Each pattern: [regex with named group 'flag', description]
const STATIC_PATTERNS: Array<[RegExp, string]> = [
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
const DYNAMIC_PATTERNS: RegExp[] = [
  /flagsmith\.isFeatureEnabled\(\s*[^'"`\)]/,
  /flagsmith\.getValue\(\s*[^'"`\)]/,
  /flagsmith\.hasFeature\(\s*[^'"`\)]/,
];

export class FlagScanner {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private scanTimeout: NodeJS.Timeout | undefined;

  constructor(diagnosticCollection: vscode.DiagnosticCollection) {
    this.diagnosticCollection = diagnosticCollection;
  }

  async scanWorkspace(): Promise<ScanResult> {
    const config = vscode.workspace.getConfiguration('orqesta');
    const includePatterns = config.get<string[]>('scanInclude', ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']);
    const excludePatterns = config.get<string[]>('scanExclude', [
      '**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/out/**',
    ]);

    const excludeGlob = `{${excludePatterns.join(',')}}`;

    let allFiles: vscode.Uri[] = [];
    for (const pattern of includePatterns) {
      const files = await vscode.workspace.findFiles(pattern, excludeGlob);
      allFiles = [...allFiles, ...files];
    }

    // Deduplicate
    const fileSet = new Set(allFiles.map((f) => f.fsPath));
    const uniqueFiles = [...fileSet].map((p) => vscode.Uri.file(p));

    const references: FlagReference[] = [];
    let hasDynamicReferences = false;

    for (const fileUri of uniqueFiles) {
      const fileRefs = await this.scanFile(fileUri);
      references.push(...fileRefs.refs);
      if (fileRefs.hasDynamic) hasDynamicReferences = true;
    }

    return {
      references,
      filesScanned: uniqueFiles.length,
      scannedAt: new Date().toISOString(),
      hasDynamicReferences,
    };
  }

  private async scanFile(uri: vscode.Uri): Promise<{ refs: FlagReference[]; hasDynamic: boolean }> {
    let content: string;
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      content = Buffer.from(bytes).toString('utf-8');
    } catch {
      return { refs: [], hasDynamic: false };
    }

    const refs: FlagReference[] = [];
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
        let match: RegExpExecArray | null;
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
  scheduleScan(onComplete: (result: ScanResult) => void): void {
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
  getUnusedFlags(
    flagsmithFlagNames: string[],
    scanResult: ScanResult,
  ): Array<{ flagName: string; note: string }> {
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

  dispose(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
  }
}
