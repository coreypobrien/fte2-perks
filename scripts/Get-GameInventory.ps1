[CmdletBinding()]
param(
    [string]$SteamAppsPath = 'C:\Program Files (x86)\Steam\steamapps',
    [string]$OutputPath = (Join-Path $PSScriptRoot '..\data\inventory\installed-game.json')
)

$ErrorActionPreference = 'Stop'
$manifestPath = Join-Path $SteamAppsPath 'appmanifest_3448650.acf'
$manifestText = Get-Content -LiteralPath $manifestPath -Raw

function Read-ManifestValue([string]$Key) {
    $pattern = '"' + [regex]::Escape($Key) + '"\s+"([^"]*)"'
    $match = [regex]::Match($manifestText, $pattern)
    if (-not $match.Success) { throw "Missing Steam manifest field: $Key" }
    return $match.Groups[1].Value
}

$installPath = Join-Path (Join-Path $SteamAppsPath 'common') (Read-ManifestValue 'installdir')
$archivePath = Join-Path $installPath 'AFE2\Content\Paks'
$archives = @(Get-ChildItem -LiteralPath $archivePath -File | Sort-Object Name | ForEach-Object {
    [ordered]@{
        path = 'AFE2/Content/Paks/' + $_.Name
        bytes = $_.Length
    }
})
if ($archives.Count -eq 0) { throw "No archives found at $archivePath" }

$inventory = [ordered]@{
    schemaVersion = 1
    capturedAtUtc = [DateTime]::UtcNow.ToString('o')
    appId = Read-ManifestValue 'appid'
    game = Read-ManifestValue 'name'
    buildId = Read-ManifestValue 'buildid'
    installPath = $installPath
    archives = $archives
}
$outputFullPath = [IO.Path]::GetFullPath($OutputPath)
New-Item -ItemType Directory -Path (Split-Path -Parent $outputFullPath) -Force | Out-Null
$inventory | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $outputFullPath -Encoding UTF8
Write-Output "Inventoried $($archives.Count) archives for build $($inventory.buildId): $outputFullPath"
