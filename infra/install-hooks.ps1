$repoRoot = Split-Path -Parent $PSScriptRoot
git config core.hooksPath "$repoRoot\.githooks"
Write-Host "Git hooks path set to $repoRoot\.githooks"
