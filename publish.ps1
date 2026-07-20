param(
  [Parameter(Mandatory=$true)]
  [string]$RepositoryUrl,
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".git")) {
  git init
}

git add .
$changes = git status --porcelain
if ($changes) {
  git commit -m "Add Visual FoxPro PDF secure merge demo"
}

git branch -M $Branch
$origin = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  git remote add origin $RepositoryUrl
} elseif ($origin -ne $RepositoryUrl) {
  git remote set-url origin $RepositoryUrl
}

git push -u origin $Branch
Write-Host "Push complete. GitHub repository Settings > Pages에서 Source를 GitHub Actions로 선택하세요." -ForegroundColor Green
