#!/usr/bin/env pwsh
# orqesta.ps1 — convenience wrapper
# Usage: .\scripts\orqesta.ps1 <command> [args...]
# Example: .\scripts\orqesta.ps1 compare Staging Production

$root = Split-Path -Parent $PSScriptRoot
node "$root\dist\cli\index.js" @args
