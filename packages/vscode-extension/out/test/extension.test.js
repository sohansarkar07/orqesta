"use strict";
/**
 * ORQESTA VS Code Extension — Tests
 * Tests the scanner and API client types without requiring a live VS Code instance.
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
const assert = __importStar(require("assert"));
// ─── Scanner tests ────────────────────────────────────────────────────────────
// These test the core scanning logic without VS Code APIs
function extractFlagNames(content) {
    const patterns = [
        /flagsmith\.isFeatureEnabled\(\s*['"`]([a-zA-Z0-9_-]+)['"`]/g,
        /flagsmith\.getValue\(\s*['"`]([a-zA-Z0-9_-]+)['"`]/g,
        /flagsmith\.hasFeature\(\s*['"`]([a-zA-Z0-9_-]+)['"`]/g,
        /client\.isFeatureEnabled\(\s*['"`]([a-zA-Z0-9_-]+)['"`]/g,
        /client\.getValue\(\s*['"`]([a-zA-Z0-9_-]+)['"`]/g,
        /isFeatureEnabled\(\s*['"`]([a-zA-Z0-9_-]+)['"`]/g,
    ];
    const names = new Set();
    for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let m;
        while ((m = pattern.exec(content)) !== null) {
            if (m[1])
                names.add(m[1]);
        }
    }
    return [...names];
}
function hasDynamicReference(content) {
    return /flagsmith\.(isFeatureEnabled|getValue|hasFeature)\(\s*[^'"`\)]/.test(content);
}
describe('Flag Scanner — static patterns', () => {
    it('detects flagsmith.isFeatureEnabled with single quotes', () => {
        const code = `const enabled = flagsmith.isFeatureEnabled('checkout_v2');`;
        assert.deepStrictEqual(extractFlagNames(code), ['checkout_v2']);
    });
    it('detects flagsmith.getValue with double quotes', () => {
        const code = `const val = flagsmith.getValue("dark_mode");`;
        assert.deepStrictEqual(extractFlagNames(code), ['dark_mode']);
    });
    it('detects flagsmith.hasFeature', () => {
        const code = `if (flagsmith.hasFeature('new_onboarding')) {`;
        assert.deepStrictEqual(extractFlagNames(code), ['new_onboarding']);
    });
    it('detects client.isFeatureEnabled', () => {
        const code = `client.isFeatureEnabled('hero_banner')`;
        assert.deepStrictEqual(extractFlagNames(code), ['hero_banner']);
    });
    it('detects multiple flags in one file', () => {
        const code = `
      flagsmith.isFeatureEnabled('flag_a');
      flagsmith.getValue('flag_b');
      client.getValue('flag_c');
    `;
        const names = extractFlagNames(code);
        assert.ok(names.includes('flag_a'));
        assert.ok(names.includes('flag_b'));
        assert.ok(names.includes('flag_c'));
    });
    it('does NOT detect arbitrary strings as flags', () => {
        const code = `const msg = 'hello world'; const url = 'api.example.com';`;
        assert.deepStrictEqual(extractFlagNames(code), []);
    });
    it('does NOT detect template literal flag names as static', () => {
        const code = 'flagsmith.getValue(`dynamic_${name}`)';
        assert.deepStrictEqual(extractFlagNames(code), []);
    });
    it('detects dynamic reference correctly', () => {
        const code = `flagsmith.isFeatureEnabled(getFlagName())`;
        assert.strictEqual(hasDynamicReference(code), true);
    });
    it('does NOT flag static reference as dynamic', () => {
        const code = `flagsmith.isFeatureEnabled('checkout_v2')`;
        assert.strictEqual(hasDynamicReference(code), false);
    });
});
// ─── Unused flag detection ────────────────────────────────────────────────────
function getUnusedFlags(flagsmithFlags, codeFlags, hasDynamic) {
    if (hasDynamic)
        return []; // conservative — can't determine unused when dynamic refs exist
    const referenced = new Set(codeFlags);
    return flagsmithFlags.filter((f) => !referenced.has(f));
}
describe('Unused flag detection', () => {
    it('identifies flags present in Flagsmith but not in code', () => {
        const flagsmithFlags = ['flag_a', 'flag_b', 'flag_c'];
        const codeFlags = ['flag_a'];
        assert.deepStrictEqual(getUnusedFlags(flagsmithFlags, codeFlags, false), ['flag_b', 'flag_c']);
    });
    it('returns empty when all flags are referenced', () => {
        const flagsmithFlags = ['flag_a', 'flag_b'];
        const codeFlags = ['flag_a', 'flag_b'];
        assert.deepStrictEqual(getUnusedFlags(flagsmithFlags, codeFlags, false), []);
    });
    it('conservatively returns empty when dynamic references detected', () => {
        const flagsmithFlags = ['flag_a', 'flag_b'];
        const codeFlags = ['flag_a'];
        // hasDynamic=true means we can't tell if flag_b is used dynamically
        assert.deepStrictEqual(getUnusedFlags(flagsmithFlags, codeFlags, true), []);
    });
});
// ─── Missing flag detection ───────────────────────────────────────────────────
function getMissingFlags(codeFlags, flagsmithFlags) {
    const known = new Set(flagsmithFlags);
    return codeFlags.filter((f) => !known.has(f));
}
describe('Missing flag detection', () => {
    it('identifies flags in code but not in Flagsmith', () => {
        const codeFlags = ['flag_a', 'unknown_flag'];
        const flagsmithFlags = ['flag_a', 'flag_b'];
        assert.deepStrictEqual(getMissingFlags(codeFlags, flagsmithFlags), ['unknown_flag']);
    });
    it('returns empty when all code flags exist in Flagsmith', () => {
        const codeFlags = ['flag_a'];
        const flagsmithFlags = ['flag_a', 'flag_b'];
        assert.deepStrictEqual(getMissingFlags(codeFlags, flagsmithFlags), []);
    });
    it('handles empty Flagsmith list conservatively', () => {
        // If we have no Flagsmith data, we cannot report missing flags
        const codeFlags = ['flag_a'];
        const flagsmithFlags = [];
        // When flagsmithFlags is empty, we have no reference — skip diagnostics
        const result = flagsmithFlags.length > 0 ? getMissingFlags(codeFlags, flagsmithFlags) : [];
        assert.deepStrictEqual(result, []);
    });
});
// ─── Credential masking ───────────────────────────────────────────────────────
function maskToken(token) {
    if (token.length <= 8)
        return '****';
    return token.slice(0, 4) + '\u2026' + token.slice(-4);
}
describe('Credential masking', () => {
    it('masks long tokens', () => {
        assert.strictEqual(maskToken('Md2ChWkCxJeu1234'), 'Md2C\u20261234');
    });
    it('masks short tokens completely', () => {
        assert.strictEqual(maskToken('abc'), '****');
    });
    it('never exposes full token', () => {
        const token = 'npm_SuperSecretToken12345';
        const masked = maskToken(token);
        assert.ok(!masked.includes(token));
        assert.ok(masked.includes('\u2026'));
    });
});
//# sourceMappingURL=extension.test.js.map