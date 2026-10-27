[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$specs = @(
    @{ Name='retoc-v0.1.5'; File='retoc.zip'; Url='https://github.com/trumank/retoc/releases/download/v0.1.5/retoc_cli-x86_64-pc-windows-msvc.zip'; Sha256='cc036b06ad3bdcf7003690b00d82719980c374e48a95bf0654f9959148d263aa' },
    @{ Name='uassetgui-v1.1.0'; File='UAssetGUI.exe'; Url='https://github.com/atenfyr/UAssetGUI/releases/download/v1.1.0/UAssetGUI.exe'; Sha256='b7d75c0893f1a60e565853ae638bc21f2416cd12c2d9d854e297abb87ceb3263' }
)
foreach ($spec in $specs) {
    $folder = Join-Path $root ('work\tools\' + $spec.Name)
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    $file = Join-Path $folder $spec.File
    if (-not (Test-Path -LiteralPath $file)) { Invoke-WebRequest -Uri $spec.Url -OutFile $file }
    if ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $spec.Sha256) { throw "Checksum mismatch: $file" }
    if ($spec.File.EndsWith('.zip')) { Expand-Archive -LiteralPath $file -DestinationPath $folder -Force }
    else { New-Item -ItemType Directory -Path (Join-Path $folder 'Data') -Force | Out-Null }
    Write-Output "Verified $($spec.Name)"
}
