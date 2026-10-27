[CmdletBinding()]
param(
    [string]$SteamAppsPath = 'C:\Program Files (x86)\Steam\steamapps',
    [string]$ArchiveKey = $env:AFE2_AES_KEY,
    [string]$KeyPath = (Join-Path $PSScriptRoot '..\work\archive-key.txt')
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
    & node scripts/validate-catalog.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Catalog validation failed.' }
} finally { Pop-Location }
