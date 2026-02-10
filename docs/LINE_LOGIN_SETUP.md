# Wi-Care LINE Bot 登陸整合指南

## 概述
Wi-Care 系統現已整合 LINE Bot 登陸功能，讓使用者可以使用 LINE 帳號直接登入系統，無需建立額外帳號。

## 功能特性

### ✅ 已實現的功能
- ✨ LINE Bot OAuth 2.0 認證流程
- 🔐 CSRF 保護 (State/Nonce 驗證)
- 📱 LINE 登陸按鈕整合在登陸模組中
- 🔄 自動令牌交換機制
- 👤 用戶資訊自動對應到系統帳號
- 💾 安全的令牌儲存 (localStorage + sessionStorage)
- 🔒 HTTPS 友善的實現

## 系統架構

### 前端組件
- **WiCare.LoginModal.tsx** - 登陸模組，包含 LINE 登陸按鈕
- **pages/LineAuthCallbackPage.tsx** - OAuth 回調頁面，處理登陸完成
- **services/WiCare.LineLoginService.ts** - LINE 登陸服務邏輯

### 後端 API
- **POST /api/auth/line/token** - 令牌交換端點
- **GET /api/auth/line/login-url** - 獲取 LINE 登陸 URL

### 路由設置
- **AppRouter.tsx** - 新的根路由組件，支援 LINE 回調路由
- **/auth/line/callback** - 回調路由

## 使用流程

### 1️⃣ 用戶點擊 LINE 登陸按鈕
```
使用者點擊登陸頁面的 "用 LINE 登入" 按鈕
     ↓
觸發 openLineLoginWindow() 函數
     ↓
重定向到 LINE 登陸 URL
```

### 2️⃣ LINE 認證
```
使用者在 LINE 授權頁面登入
     ↓
LINE 驗證用戶身份
     ↓
重定向回應用程式 + 授權碼
```

### 3️⃣ 令牌交換
```
LineAuthCallbackPage 接收授權碼
     ↓
驗證 State 參數 (CSRF 保護)
     ↓
調用 exchangeCodeForToken(code)
     ↓
後端 API 處理令牌交換
```

### 4️⃣ 登陸完成
```
後端返回應用程式令牌和用戶資訊
     ↓
儲存令牌到 localStorage
     ↓
重定向到儀表板
```

## 配置說明

### 環境變數設置 (.env)
```bash
# LINE 登陸應用程式 ID
VITE_LINE_CLIENT_ID=your_line_client_id

# (可選) LINE 登陸重定向 URI
VITE_LINE_REDIRECT_URI=http://localhost:3000/auth/line/callback
```

### LINE 應用程式設置

1. **登入 LINE 開發者後台** - https://developers.line.biz/zh-hant/
2. **建立 Login App**
   - 應用程式類型: Web App
   - 設定名稱: Wi-Care
3. **設定 Redirect URI**
   ```
   http://localhost:3000/auth/line/callback (開發環境)
   https://yourdomail.com/auth/line/callback (正式環境)
   ```
4. **複製 Client ID** - 放入環境變數

## API 參考

### POST /api/auth/line/token
令牌交換端點

**請求:**
```json
{
  "code": "authorization_code_from_line"
}
```

**回應:**
```json
{
  "success": true,
  "message": "LINE 登陸成功",
  "data": {
    "token": "app_session_token",
    "user": {
      "id": 1,
      "username": "line_user_id",
      "name": "使用者名稱",
      "role": "nurse",
      "pictureUrl": "https://..."
    }
  }
}
```

### GET /api/auth/line/login-url
獲取 LINE 登陸 URL (如果需要後端構建)

**回應:**
```json
{
  "success": true,
  "loginUrl": "https://web.line.me/web/login?..."
}
```

## 安全考量

### ✅ 實現的安全措施
1. **State 驗證** - 防止 CSRF 攻擊
2. **Nonce 驗證** - 防止令牌重放攻擊
3. **後端令牌交換** - 前端不直接處理機密信息
4. **HTTPS 必需** - 正式環境需要 HTTPS
5. **令牌加密存儲** - localStorage 用於持久化
6. **sessionStorage** - 臨時狀態信息

### ⚠️ 建議的額外措施
1. 實現令牌刷新機制
2. 添加令牌過期檢查
3. 實現登出時的令牌撤銷
4. 使用安全的 Cookie 存儲敏感資訊
5. 實現速率限制防止暴力攻擊

## 用戶流程圖

```
┌─────────────────────────────────────────────────────┐
│        Wi-Care 登陸頁面                             │
│  ┌─────────────────┐  ┌──────────────────┐         │
│  │ 傳統登陸        │  │ LINE 登陸按鈕    │◄─────┐  │
│  │ (帳號/密碼)     │  └──────────────────┘      │  │
│  └─────────────────┘                              │  │
└────────────────────────────────────────────────────┘  │
                                                         │
                                                         │
                    點擊 LINE 登陸按鈕──────────────────┤
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────┐
│  LINE 授權頁面                                       │
│  (用戶輸入 LINE 帳號和密碼)                          │
└─────────────────────────────────────────────────────┘
                        │
                        │ (授權完成)
                        ▼
┌─────────────────────────────────────────────────────┐
│  /auth/line/callback                                │
│  - 驗證授權碼                                        │
│  - 驗證 State 參數                                   │
│  - 交換令牌                                          │
└─────────────────────────────────────────────────────┘
                        │
                        │ (登陸成功)
                        ▼
┌─────────────────────────────────────────────────────┐
│  Wi-Care 儀表板                                      │
│  (已登入，顯示用戶資訊)                              │
└─────────────────────────────────────────────────────┘
```

## 開發指南

### 啟動應用程式
```bash
# 終端 1: 啟動前端開發伺服器
npm run dev

# 終端 2: 啟動後端 API 伺服器
npm run server

# 或同時啟動兩個
npm run dev:all
```

### 測試 LINE 登陸流程
1. 在瀏覽器中打開 http://localhost:3000/
2. 點擊登陸模組中的 "用 LINE 登入" 按鈕
3. 系統會重定向到 LINE 登陸頁面
4. 使用 LINE 帳號進行身份驗證
5. LINE 會重定向回應用程式
6. 應用程式處理回調並完成登陸

### 調試技巧
```javascript
// 在瀏覽器控制台檢查儲存的令牌
localStorage.getItem('authToken');
localStorage.getItem('user');
sessionStorage.getItem('line_login_state');

// 檢查後端日誌
// 查看伺服器輸出中的 [LINE 登陸] 訊息
```

## 常見問題

### Q: 為什麼重定向到 LINE 失敗？
A: 檢查 CLIENT_ID 是否設定正確，並確保 Redirect URI 與 LINE 應用程式設置相符。

### Q: 令牌過期怎麼辦？
A: 系統會自動在令牌過期時提示用戶重新登陸。實現令牌刷新機制可以改善用戶體驗。

### Q: 如何登出 LINE 帳號？
A: 調用 `lineLogout()` 函數清除所有 LINE 相關的令牌和狀態信息。

### Q: 能否同時支持 LINE 和傳統登陸？
A: 可以，使用者可以選擇任一方式登陸。如果是新用戶，系統會自動建立帳號。

## 文件結構

```
wi-care-main/
├── AppRouter.tsx                           # 新增：路由根組件
├── index.tsx                               # 修改：使用 AppRouter
├── WiCare.App.tsx                          # 主應用程式
├── components/
│   └── WiCare.LoginModal.tsx              # 修改：添加 LINE 按鈕
├── pages/
│   └── LineAuthCallbackPage.tsx           # 新增：回調頁面
├── services/
│   └── WiCare.LineLoginService.ts         # 新增：LINE 登陸服務
├── server/
│   └── index.js                           # 修改：添加 LINE API 端點
├── index.css                              # 修改：添加 LINE 按鈕樣式
└── package.json
```

## 後續改進計劃

- [ ] 實現令牌刷新機制
- [ ] 添加 LINE 登陸狀態指示
- [ ] 實現用戶資訊編輯和頭像上傳
- [ ] 添加多個社交媒體登陸選項 (Google、Facebook 等)
- [ ] 實現 LINE 帳號解綁功能
- [ ] 添加登陸日誌記錄和審計

## 支持

如有問題或需要進一步協助，請參考：
- [LINE Login 官方文檔](https://developers.line.biz/en/docs/line-login/)
- Wi-Care 開發團隊

---
**最後更新**: 2026-01-16
**版本**: 1.0.0
