$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeVersion = (Get-Content -LiteralPath (Join-Path $projectRoot '.node-version') -Raw).Trim()
if ($nodeVersion -notmatch '^24\.\d+\.\d+$') { throw 'Expected a pinned Node 24 LTS version.' }
$toolsDirectory = Join-Path $projectRoot '.local\tools'
$nodeDirectory = Join-Path $toolsDirectory "node-v$nodeVersion-win-x64"
if (Test-Path -LiteralPath (Join-Path $nodeDirectory 'node.exe')) {
    & (Join-Path $nodeDirectory 'node.exe') --version
    exit $LASTEXITCODE
}
if (Test-Path -LiteralPath $nodeDirectory) { throw 'Partial Node directory exists; inspect it manually before retrying.' }
New-Item -ItemType Directory -Path $toolsDirectory -Force | Out-Null
$archiveName = "node-v$nodeVersion-win-x64.zip"
$archivePath = Join-Path $toolsDirectory $archiveName
$baseUrl = "https://nodejs.org/dist/v$nodeVersion"
Invoke-WebRequest "$baseUrl/$archiveName" -OutFile $archivePath
$checksums = (Invoke-WebRequest "$baseUrl/SHASUMS256.txt").Content
$checksumLine = $checksums -split "`n" | Where-Object { $_ -match ('\s' + [regex]::Escape($archiveName) + '$') }
if (@($checksumLine).Count -ne 1) { throw 'Missing or ambiguous official checksum.' }
$expectedHash = ($checksumLine.Trim() -split '\s+')[0]
if ((Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash -ne $expectedHash) { throw 'Node archive checksum mismatch.' }
Expand-Archive -LiteralPath $archivePath -DestinationPath $toolsDirectory
& (Join-Path $nodeDirectory 'node.exe') --version
exit $LASTEXITCODE
