[CmdletBinding()]
param(
    [string]$SteamAppsPath = 'C:\Program Files (x86)\Steam\steamapps',
    [string]$ArchiveKey = $env:AFE2_AES_KEY,
    [string]$KeyPath = (Join-Path $PSScriptRoot '..\work\archive-key.txt'),
    [string]$PythonPath = $env:AFE2_PYTHON
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not $ArchiveKey -and (Test-Path -LiteralPath $KeyPath)) { $ArchiveKey = (Get-Content -LiteralPath $KeyPath -Raw).Trim() }
if ($ArchiveKey -notmatch '^(0x)?[0-9a-fA-F]{64}$') { throw 'Supply -ArchiveKey, set AFE2_AES_KEY, or create work/archive-key.txt with the game asset key.' }
$retoc = (Get-ChildItem -LiteralPath (Join-Path $root 'work\tools\retoc-v0.1.5') -Recurse -Filter retoc.exe | Select-Object -First 1).FullName
$uasset = Join-Path $root 'work\tools\uassetgui-v1.1.0\UAssetGUI.exe'
if (-not $retoc -or -not (Test-Path -LiteralPath $uasset)) { throw 'Run scripts/Initialize-ResearchTools.ps1 first.' }
& (Join-Path $PSScriptRoot 'Get-GameInventory.ps1') -SteamAppsPath $SteamAppsPath
$inventory = Get-Content -LiteralPath (Join-Path $root 'data\inventory\installed-game.json') -Raw | ConvertFrom-Json
if (-not $PythonPath -and (Test-Path -LiteralPath (Join-Path $root 'work\python-path.txt'))) { $PythonPath = (Get-Content -LiteralPath (Join-Path $root 'work\python-path.txt') -Raw).Trim() }
if (-not $PythonPath) { throw 'Run Initialize-NativeTools.ps1 -PythonPath PATH_TO_PYTHON or supply -PythonPath.' }
& $PythonPath (Join-Path $PSScriptRoot 'extract-native-defaults.py') --exe (Join-Path $inventory.installPath 'AFE2\Binaries\Win64\AFE2-Win64-Shipping.exe')
if ($LASTEXITCODE -ne 0) { throw 'Native default extraction failed. Unknown builds require a new audit.' }
& $PythonPath (Join-Path $PSScriptRoot 'extract-native-rules.py') --exe (Join-Path $inventory.installPath 'AFE2\Binaries\Win64\AFE2-Win64-Shipping.exe')
if ($LASTEXITCODE -ne 0) { throw 'Native rule extraction failed. Unknown builds require a new audit.' }
$pakDir = Join-Path $inventory.installPath 'AFE2\Content\Paks'
# Build-specific directories prevent stale exports from leaking into a later patch's catalog.
$assetDir = Join-Path $root ('work\build-' + $inventory.buildId + '\class-assets')
$jsonDir = Join-Path $root ('work\build-' + $inventory.buildId + '\class-json')
& $retoc -a $ArchiveKey list (Join-Path $pakDir 'pakchunk0-WindowsNoEditor.utoc') --path --size | Set-Content -LiteralPath (Join-Path $root 'work\package-list.txt') -Encoding UTF8
if ($LASTEXITCODE -ne 0) { throw 'Archive listing failed.' }
& $retoc -a $ArchiveKey to-legacy --no-shaders --version UE4_27 --filter '/Blueprints/Avocado_Classes/' $pakDir $assetDir
if ($LASTEXITCODE -ne 0) { throw 'Asset conversion failed.' }
Push-Location $root
try {
    & node scripts/export-assets.mjs $assetDir $jsonDir $uasset
    if ($LASTEXITCODE -ne 0) { throw 'JSON export failed.' }
    & node scripts/normalize-perks.mjs $jsonDir data/extracted $inventory.buildId
    if ($LASTEXITCODE -ne 0) { throw 'Normalization failed.' }
    & node scripts/build-catalog.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Effective catalog build failed.' }
    & node scripts/build-web-data.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Browser data build failed.' }
    & node scripts/validate-catalog.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Catalog validation failed.' }
} finally { Pop-Location }
