# 腾讯云 CloudBase 一键部署脚本
# 针对环境: moon-table-werewolf-d1b30d6d383d

$EnvId = "moon-table-werewolf-d1b30d6d383d"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 开始构建并部署桌游系统至腾讯云 CloudBase" -ForegroundColor Cyan
Write-Host "🎯 目标环境 ID: $EnvId" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# 1. 运行构建
Write-Host "📦 1. 正在构建前端静态资产与服务端..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败，请检查报错！" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "✅ 构建完成！静态产物位于 dist/，服务端位于 dist-server/" -ForegroundColor Green

# 2. 检查 CloudBase CLI
Write-Host "🔍 2. 检查腾讯云 CloudBase CLI 登录状态..." -ForegroundColor Green
Write-Host "若当前电脑尚未完成本机的 CLI 授权，请运行：" -ForegroundColor Yellow
Write-Host "   npx @cloudbase/cli login" -ForegroundColor White
Write-Host "浏览器会自动打开腾讯云一键授权页面。" -ForegroundColor White

# 3. 部署静态网站托管
Write-Host "🌐 3. 正在部署静态托管到腾讯云..." -ForegroundColor Green
npx @cloudbase/cli hosting deploy dist -e $EnvId

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 部署指令执行完毕！" -ForegroundColor Green
Write-Host "静态网站访问地址: https://$EnvId-1407258995.tcloudbaseapp.com/" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
