# WeChat SOP Biotech - 項目文檔 v1

> 創建日期：2026-01-15
> 請勿自動覆蓋此文件

---

## 項目概述

WeChat SOP Biotech 是一個用於生物科技公司研究文章生成的自動化工具，支持從研究框架生成到微信公眾號發布的完整流程。

---

## 項目結構

```
wechat-sop-biotech/
├── client/                     # 前端 React 應用
│   ├── src/
│   │   ├── components/         # React 組件
│   │   │   ├── Login.tsx              # 登入頁面
│   │   │   ├── ArticleSidebar.tsx     # 左側文章列表
│   │   │   ├── CompanyInput.tsx       # Step 1: 輸入公司名稱
│   │   │   ├── FileDownload.tsx       # Step 2: 下載研究框架
│   │   │   ├── PdfUpload.tsx          # Step 3: 上傳研究 PDF
│   │   │   ├── ArticlePreview.tsx     # Step 4: 生成文章
│   │   │   ├── ArticleSplit.tsx       # Step 5: 分割配圖
│   │   │   ├── ImageGeneration.tsx    # Step 6: 生成圖片
│   │   │   └── PublishPanel.tsx       # Step 7: 發布到微信
│   │   ├── stores/
│   │   │   └── useStore.ts            # Zustand 狀態管理
│   │   ├── services/
│   │   │   └── api.ts                 # API 請求服務
│   │   ├── App.tsx                    # 主應用組件
│   │   ├── App.css                    # 主樣式
│   │   ├── index.css                  # 全局樣式
│   │   └── main.tsx                   # 入口文件
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # 後端 Express 應用
│   ├── src/
│   │   ├── routes/
│   │   │   └── api.ts                 # API 路由
│   │   ├── services/
│   │   │   ├── gemini.ts              # Gemini AI 服務
│   │   │   ├── storage.ts             # 數據存儲服務
│   │   │   ├── pdf.ts                 # PDF 處理服務
│   │   │   └── wenyan.ts              # 微信發布服務
│   │   └── index.ts                   # 服務器入口
│   └── package.json
│
├── data/                       # 數據存儲目錄
│   └── articles.json                  # 文章數據
│
├── .env                        # 環境變量配置
├── .env.example                # 環境變量範例
├── package.json                # 根目錄依賴
├── start-local.sh              # 本地啟動腳本
└── Dockerfile                  # Docker 配置
```

---

## 環境配置

### .env 文件配置

```env
# AI Model API Keys (Required)
GEMINI_API_KEY=your_gemini_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# WeChat Public Account Configuration (Required)
WECHAT_APP_ID=your_wechat_app_id_here
WECHAT_APP_SECRET=your_wechat_app_secret_here

# Google Cloud Storage (Required)
GCS_BUCKET_NAME=your_gcs_bucket_name_here

# Optional Configuration
PORT=3001
NODE_ENV=development
UPLOAD_DIR=./uploads
DOWNLOAD_DIR=./downloads
```

### 微信配置注意事項

1. 需要在微信公眾平台添加服務器 IP 到白名單
2. 需要安裝 wenyan CLI: `npm install -g @wenyan-md/cli`

---

## 啟動方式

### 本地開發

```bash
cd ~/wechat-sop-biotech
npm run dev
```

或使用啟動腳本：

```bash
./start-local.sh
```

服務地址：
- 前端：http://localhost:5174/
- 後端：http://localhost:3001

### 構建生產版本

```bash
cd client && npm run build
```

---

## 功能流程（7 個步驟）

### Step 1: 輸入公司名稱
- 輸入目標研究公司名稱
- 系統自動生成 11 點研究框架

### Step 2: 下載研究框架
- 下載上半段框架 (1-10)
- 下載下半段框架 (11-競爭分析)
- 使用 Gemini DeepResearch 執行深度研究

### Step 3: 上傳研究 PDF
- 上傳合併後的研究報告 PDF
- 系統自動提取文本

### Step 4: 生成文章
- 生成 Storyline
- 上傳參考文章（可選）
- 選擇 AI 模型（DeepSeek/Gemini）
- 生成文章
- **潤色文章**（按鈕在底部）

### Step 5: 分割配圖
- 一鍵分割文章
- 生成生圖文本
- 生成文章骨架
- 生成配圖 Prompt

### Step 6: 生成圖片
- 批量生成麥肯錫風格配圖
- 插入配圖生成最終文章
- （僅 admin/advanced 用戶可用）

### Step 7: 發布到微信
- 設置文章標題
- 選擇排版主題
- AI 生成封面
- 發布到微信草稿箱
- 下載 Markdown

---

## 主要組件說明

### App.tsx

使用 Collapse 折疊面板顯示所有步驟，用戶可以：
- 查看所有已完成的步驟內容
- 展開/收起任意步驟
- 狀態標籤：已完成（綠色）、進行中（藍色）、待處理（灰色）

### useStore.ts

Zustand 狀態管理，包含：
- 用戶認證狀態
- 文章項目管理
- 各步驟數據（框架、研究、文章、圖片等）
- API 調用方法

### ArticleSidebar.tsx

左側邊欄功能：
- 新建文章項目
- 文章列表（公司名稱 + 日期）
- 用戶信息顯示
- 登出功能

---

## API 端點

| 方法 | 路徑 | 功能 |
|------|------|------|
| POST | /api/auth/login | 用戶登入 |
| GET | /api/articles | 獲取文章列表 |
| POST | /api/articles | 創建文章項目 |
| GET | /api/articles/:id | 獲取單個文章 |
| PUT | /api/articles/:id | 更新文章 |
| POST | /api/generate-framework | 生成研究框架 |
| POST | /api/upload-research | 上傳研究 PDF |
| POST | /api/upload-reference | 上傳參考文章 |
| POST | /api/generate-storyline | 生成 Storyline |
| POST | /api/generate-article | 生成文章 |
| POST | /api/polish-article | 潤色文章 |
| POST | /api/split-article | 分割文章 |
| POST | /api/generate-images | 生成配圖 |
| POST | /api/generate-cover | 生成封面 |
| POST | /api/publish-draft | 發布到微信 |

---

## 默認用戶

| 用戶名 | 密碼 | 權限 |
|--------|------|------|
| admin | admin123 | 完整權限 |
| advanced | advanced123 | 完整權限 |
| user | user123 | 無圖片生成權限 |

---

## 技術棧

### 前端
- React 18
- TypeScript
- Vite
- Ant Design
- Zustand (狀態管理)
- React Markdown

### 後端
- Node.js
- Express
- TypeScript
- Google Cloud Storage
- Gemini AI / DeepSeek API

---

## 已知問題與解決方案

### 1. 微信發布失敗
- 確認已安裝 wenyan CLI
- 確認 IP 已加入微信白名單
- 檢查 WECHAT_APP_ID 和 WECHAT_APP_SECRET

### 2. 左側顯示舊文章
- 清除瀏覽器快取：`localStorage.clear(); location.reload();`

### 3. Step 7 輸入卡頓
- 已使用 memo 優化 Markdown 預覽組件

---

## 更新日誌

### 2026-01-15
- 修復文章潤色按鈕位置
- 改為 Collapse 折疊面板顯示所有步驟
- 優化 Step 7 發布頁面效能
- 修復日期顯示格式（中文日期）
- 清除舊文章快取問題

---

*此文檔為項目快照，請勿自動覆蓋*
