# 實盤數據驗證腳本 (Real Data Verification Script)
# 用途：驗證 ESP32 伺服器是否在線並返回真實數據

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Wi-Care 系統 - 實盤數據驗證" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ESP32 伺服器設定
$ESP32_HOST = "172.20.10.9"
$ESP32_PORT = 8080
$TIMEOUT = 5000

# 步驟 1: 測試連接
Write-Host "[步驟 1] 測試 ESP32 伺服器連接..." -ForegroundColor Yellow
Write-Host "目標: http://${ESP32_HOST}:${ESP32_PORT}/status" -ForegroundColor Gray

try {
    $statusResponse = Invoke-RestMethod -Uri "http://${ESP32_HOST}:${ESP32_PORT}/status" `
                                        -Method GET `
                                        -TimeoutSec 5 `
                                        -ErrorAction Stop
    
    Write-Host "✓ 連接成功！" -ForegroundColor Green
    Write-Host "伺服器回應:" -ForegroundColor Gray
    $statusResponse | ConvertTo-Json | Write-Host -ForegroundColor Cyan
} catch {
    Write-Host "✗ 連接失敗！" -ForegroundColor Red
    Write-Host "錯誤信息: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "故障排查建議:" -ForegroundColor Yellow
    Write-Host "1. 檢查 ESP32 是否仍連接到網路" -ForegroundColor Gray
    Write-Host "2. 驗證 Arduino IDE Serial Monitor 中的 IP 地址" -ForegroundColor Gray
    Write-Host "3. 檢查防火牆是否允許 172.20.10.9:8080 的連接" -ForegroundColor Gray
    Write-Host "4. 重新上傳 fall_detection_server.ino 到 ESP32" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "[步驟 2] 測試跌倒檢測觸發..." -ForegroundColor Yellow

try {
    $triggerResponse = Invoke-RestMethod -Uri "http://${ESP32_HOST}:${ESP32_PORT}/trigger-fall" `
                                         -Method POST `
                                         -TimeoutSec 5 `
                                         -ErrorAction Stop
    
    Write-Host "✓ 觸發成功！" -ForegroundColor Green
    Write-Host "伺服器回應:" -ForegroundColor Gray
    $triggerResponse | ConvertTo-Json | Write-Host -ForegroundColor Cyan
} catch {
    Write-Host "✗ 觸發失敗！" -ForegroundColor Red
    Write-Host "錯誤信息: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[步驟 3] 驗證跌倒狀態已設置..." -ForegroundColor Yellow

try {
    $checkResponse = Invoke-RestMethod -Uri "http://${ESP32_HOST}:${ESP32_PORT}/status" `
                                       -Method GET `
                                       -TimeoutSec 5 `
                                       -ErrorAction Stop
    
    if ($checkResponse.status -eq "fall" -or $checkResponse.falling -eq $true) {
        Write-Host "✓ 跌倒狀態已激活！" -ForegroundColor Green
        Write-Host "目前狀態:" -ForegroundColor Gray
        $checkResponse | ConvertTo-Json | Write-Host -ForegroundColor Cyan
    } else {
        Write-Host "✗ 跌倒狀態未激活，請檢查 ESP32 代碼" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ 狀態檢查失敗！" -ForegroundColor Red
}

Write-Host ""
Write-Host "[步驟 4] 清除跌倒狀態..." -ForegroundColor Yellow

try {
    $clearResponse = Invoke-RestMethod -Uri "http://${ESP32_HOST}:${ESP32_PORT}/clear-fall" `
                                       -Method POST `
                                       -TimeoutSec 5 `
                                       -ErrorAction Stop
    
    Write-Host "✓ 清除成功！" -ForegroundColor Green
    Write-Host "伺服器回應:" -ForegroundColor Gray
    $clearResponse | ConvertTo-Json | Write-Host -ForegroundColor Cyan
} catch {
    Write-Host "✗ 清除失敗！" -ForegroundColor Red
}

Write-Host ""
Write-Host "[步驟 5] 最終狀態驗證..." -ForegroundColor Yellow

try {
    $finalResponse = Invoke-RestMethod -Uri "http://${ESP32_HOST}:${ESP32_PORT}/status" `
                                       -Method GET `
                                       -TimeoutSec 5 `
                                       -ErrorAction Stop
    
    if ($finalResponse.status -eq "safe" -or $finalResponse.falling -eq $false) {
        Write-Host "✓ 系統已恢復安全狀態！" -ForegroundColor Green
        Write-Host "最終狀態:" -ForegroundColor Gray
        $finalResponse | ConvertTo-Json | Write-Host -ForegroundColor Cyan
    } else {
        Write-Host "✗ 系統未恢復安全狀態" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ 最終驗證失敗！" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "實盤驗證完成！" -ForegroundColor Green
Write-Host "系統已配置為使用真實 ESP32 數據" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "後續步驟:" -ForegroundColor Cyan
Write-Host "1. 開啟 React 應用程式 (npm run dev)" -ForegroundColor Gray
Write-Host "2. 應用程式將自動連接到 ESP32 進行實時監測" -ForegroundColor Gray
Write-Host "3. 觀察 Console 日誌確認 'fetchDeviceStatus' 正在讀取真實數據" -ForegroundColor Gray
Write-Host "4. 應用應自動顯示當前的 ESP32 狀態（安全或跌倒）" -ForegroundColor Gray
