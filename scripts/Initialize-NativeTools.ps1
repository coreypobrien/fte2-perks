[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$PythonPath)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
& $PythonPath -m pip install --only-binary=:all: --target (Join-Path $root 'work\tools\python-packages') -r (Join-Path $PSScriptRoot 'native-requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'Native analysis dependency installation failed' }
$PythonPath | Set-Content -LiteralPath (Join-Path $root 'work\python-path.txt') -Encoding UTF8
