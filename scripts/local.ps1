# Project-local Node takes precedence only in this process. No system PATH changes.
param([Parameter(ValueFromRemainingArguments=$true)][string[]]$NpmArgs)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeVersion = (Get-Content -LiteralPath (Join-Path $projectRoot '.node-version') -Raw).Trim()
$nodeDirectory = Join-Path $projectRoot ".local\tools\node-v$nodeVersion-win-x64"
if (-not (Test-Path -LiteralPath (Join-Path $nodeDirectory 'node.exe'))) {
    throw 'Project Node missing. Run .\scripts\setup-node.ps1 first.'
}
$originalPath = $env:PATH
$originalTelemetry = $env:ASTRO_TELEMETRY_DISABLED
try {
    $env:PATH = "$nodeDirectory;$originalPath"
    $env:ASTRO_TELEMETRY_DISABLED = '1'
    Push-Location $projectRoot
    try {
        & (Join-Path $nodeDirectory 'node.exe') (Join-Path $nodeDirectory 'node_modules\npm\bin\npm-cli.js') @NpmArgs
        $commandExitCode = $LASTEXITCODE
    } finally { Pop-Location }
} finally { $env:PATH = $originalPath; $env:ASTRO_TELEMETRY_DISABLED = $originalTelemetry }
exit $commandExitCode
