# Script para limpiar el caché de Next.js y reiniciar
Write-Host "🧹 Limpiando caché de Next.js..." -ForegroundColor Cyan

# Detener cualquier proceso de Next.js en ejecución
Write-Host "1. Deteniendo procesos de Next.js..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Eliminar carpetas de caché
Write-Host "2. Eliminando carpetas de caché..." -ForegroundColor Yellow

if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "   ✅ .next eliminado" -ForegroundColor Green
}

if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "   ✅ node_modules/.cache eliminado" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Limpieza completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor Cyan
Write-Host "  pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "Y en el navegador:" -ForegroundColor Cyan
Write-Host "  - Presiona Ctrl+Shift+R para forzar recarga" -ForegroundColor White
Write-Host "  - O abre DevTools (F12) y haz clic en 'Vaciar caché y recargar'" -ForegroundColor White
