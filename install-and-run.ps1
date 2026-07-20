$ErrorActionPreference = "Stop"
$nodeDir = "C:\Program Files\nodejs"
$npm = Join-Path $nodeDir "npm.cmd"
$node = Join-Path $nodeDir "node.exe"

if (-not (Test-Path $node) -or -not (Test-Path $npm)) {
    throw "Node.js를 찾을 수 없습니다: $nodeDir"
}

Write-Host "Node version:" -ForegroundColor Cyan
& $node -v

Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue

Write-Host "공식 npm 저장소에서 의존성을 설치합니다..." -ForegroundColor Cyan
& $npm install --registry=https://registry.npmjs.org/
if ($LASTEXITCODE -ne 0) { throw "npm install 실패" }

Write-Host "개발 서버를 시작합니다..." -ForegroundColor Green
& $npm run dev -- --host 127.0.0.1
