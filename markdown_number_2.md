# WeChat SOP Biotech - 完整專案文檔

> 生成日期: 2026-01-16
> 版本: 2.0
> 此文件包含完整的前後端代碼，可用於複製部署

---

## 目錄

1. [專案概述](#專案概述)
2. [專案結構](#專案結構)
3. [環境配置](#環境配置)
4. [安裝與啟動](#安裝與啟動)
5. [根目錄配置檔案](#根目錄配置檔案)
6. [Server 端代碼](#server-端代碼)
7. [Client 端代碼](#client-端代碼)
8. [部署配置](#部署配置)
9. [Prompt 模板](#prompt-模板)

---

## 專案概述

這是一個 AI 驅動的微信公眾號文章生成與發布系統，專為生物科技研究領域設計。

### 主要功能

- 自動生成 11 點研究框架
- PDF 研究報告文本提取
- AI 生成文章（支持 DeepSeek 和 Gemini）
- 智能配圖生成（Gemini 2.0）
- 一鍵發布到微信公眾號草稿箱

### 技術棧

- **前端**: React 18 + TypeScript + Vite + Ant Design + Zustand
- **後端**: Node.js + Express + TypeScript
- **AI**: Google Gemini API + DeepSeek API
- **存儲**: Google Cloud Storage / Local Storage
- **部署**: Docker + Google Cloud Run

---

## 專案結構

```
wechat-sop-biotech/
├── client/                     # 前端應用
│   ├── src/
│   │   ├── components/         # React 組件
│   │   ├── services/           # API 服務
│   │   ├── stores/             # Zustand 狀態管理
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                     # 後端服務
│   ├── src/
│   │   ├── routes/             # API 路由
│   │   ├── services/           # 業務邏輯
│   │   ├── types/              # 類型定義
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── data/                       # 數據目錄
├── .env                        # 環境變量
├── .env.example
├── .gitignore
├── Dockerfile
├── cloudbuild.yaml
├── package.json
├── Prompt_Research_frame.txt   # 研究框架提示詞模板
└── start-local.sh
```

---

## 環境配置

### .env.example

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

# Proxy Settings (for users in mainland China)
# HTTP_PROXY=http://proxy:port
# HTTPS_PROXY=http://proxy:port
```

### .gitignore

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage
coverage/
.nyc_output/

# Uploads and downloads
uploads/
downloads/
data/

# Temporary files
tmp/
temp/
*.tmp

# OS files
Thumbs.db
```

---

## 安裝與啟動

### 本地開發

```bash
# 1. 安裝所有依賴
npm run install:all

# 2. 配置環境變量
cp .env.example .env
# 編輯 .env 填入真實的 API Keys

# 3. 啟動開發服務器
npm run dev

# 前端: http://localhost:5174
# 後端: http://localhost:3001
```

### start-local.sh

```bash
#!/bin/bash
echo "========================================"
echo " WeChat SOP Biotech - Local Development"
echo "========================================"
echo

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client && npm install && cd ..
fi

if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server && npm install && cd ..
fi

echo
echo "Starting development servers..."
echo "- Frontend: http://localhost:5173"
echo "- Backend:  http://localhost:3001"
echo

npm run dev
```

---

## 根目錄配置檔案

### package.json (根目錄)

```json
{
  "name": "wechat-sop-biotech",
  "version": "1.0.0",
  "description": "AI-driven WeChat article generation and publishing system for biotech research",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "start": "cd server && npm start",
    "install:all": "npm install && cd client && npm install && cd ../server && npm install",
    "clean": "rm -rf node_modules client/node_modules server/node_modules client/dist server/dist"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## Server 端代碼

### server/package.json

```json
{
  "name": "wechat-sop-server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "@google-cloud/storage": "^7.7.0",
    "@google/generative-ai": "^0.21.0",
    "axios": "^1.13.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "form-data": "^4.0.5",
    "highlight.js": "^11.11.1",
    "marked": "^17.0.1",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.24.1",
    "pdf-parse": "^1.1.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/marked": "^5.0.2",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.6",
    "@types/uuid": "^9.0.7",
    "@typescript-eslint/eslint-plugin": "^6.16.0",
    "@typescript-eslint/parser": "^6.16.0",
    "eslint": "^8.56.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### server/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### server/src/index.ts

```typescript
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

// Load .env from root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request timeout for long AI operations
app.use((req, res, next) => {
  res.setTimeout(600000); // 10 minutes
  next();
});

// Serve uploaded files (data directory)
// In development, tsx runs from server dir, so ./data is server/data
const dataDir = process.env.NODE_ENV === 'production' ? '/tmp/data' : path.join(process.cwd(), 'data');
app.use('/data', express.static(dataDir));
console.log('Serving static files from:', dataDir);

// API routes
app.use('/api', apiRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
```

### server/src/routes/api.ts

```typescript
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as gemini from '../services/gemini';
import * as storage from '../services/storage';
import * as wenyan from '../services/wenyan';
import * as pdf from '../services/pdf';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// In-memory session storage (use Redis in production)
const sessions: Map<string, Record<string, unknown>> = new Map();

// =====================
// Auth Routes
// =====================

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await storage.authenticateUser(username, password);

    if (user) {
      res.json({ user: { username: user.username, role: user.role } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/auth/check-permission', async (req: Request, res: Response) => {
  try {
    const { role, feature } = req.body;
    const allowed = storage.hasPermission(role, feature);
    res.json({ allowed });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// =====================
// Article Management
// =====================

router.get('/articles', async (req: Request, res: Response) => {
  try {
    const articles = await storage.getArticles();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/articles', async (req: Request, res: Response) => {
  try {
    const { companyName } = req.body;
    console.log('Creating article for company:', companyName);
    const article = await storage.createArticle(companyName);
    console.log('Article created:', article.id, article.companyName);
    res.json(article);
  } catch (error) {
    console.error('Failed to create article:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/articles/:id', async (req: Request, res: Response) => {
  try {
    const article = await storage.getArticle(req.params.id);
    if (article) {
      res.json(article);
    } else {
      res.status(404).json({ error: 'Article not found' });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/articles/:id', async (req: Request, res: Response) => {
  try {
    const article = await storage.updateArticle(req.params.id, req.body);
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// =====================
// Framework Generation
// =====================

router.post('/generate-framework', async (req: Request, res: Response) => {
  try {
    const { companyName, articleId } = req.body;
    const sessionId = uuidv4();

    const { upperPart, lowerPart } = await gemini.generateResearchFramework(companyName);

    // Store in session
    sessions.set(sessionId, { companyName, upperPart, lowerPart });

    // Update article if provided
    if (articleId) {
      await storage.updateArticle(articleId, { sessionId, companyName });
    }

    res.json({
      sessionId,
      upperPart,
      lowerPart,
      upperPartFile: `${companyName}_framework_upper.txt`,
      lowerPartFile: `${companyName}_framework_lower.txt`,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// =====================
// PDF Upload & Processing
// =====================

router.post('/upload-research', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { companyName, sessionId, articleId } = req.body;
    const researchId = uuidv4();

    const extractedText = await pdf.extractText(req.file.buffer);

    // Store in session
    const session = sessions.get(sessionId) || {};
    session.researchText = extractedText;
    session.researchId = researchId;
    sessions.set(sessionId, session);

    // Update article if provided
    if (articleId) {
      await storage.updateArticle(articleId, { researchId });
    }

    res.json({
      researchId,
      extractedText,
      textLength: extractedText.length,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/upload-reference', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const referenceId = uuidv4();
    const extractedText = await pdf.extractText(req.file.buffer);

    res.json({
      referenceId,
      extractedText,
      fullText: extractedText,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// =====================
// Storyline Generation
// =====================

router.post('/generate-storyline', async (req: Request, res: Response) => {
  try {
    const { researchId, companyName, articleId } = req.body;

    // Find session with this researchId
    let researchText = '';
    for (const [, session] of sessions) {
      if (session.researchId === researchId) {
        researchText = session.researchText as string;
        break;
      }
    }

    if (!researchText) {
      return res.status(400).json({ error: 'Research text not found' });
    }

    const storyline = await gemini.generateStoryline(researchText);

    // Update article if provided
    if (articleId) {
      await storage.updateArticle(articleId, { storyline });
    }

    res.json({ storyline, companyName });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// =====================
// Article Generation
// =====================

router.post('/generate-article', async (req: Request, res: Response) => {
  try {
    const { companyName, researchId, storyline, referenceArticle, model, articleProjectId } = req.body;

    // Find research text
    let researchText = '';
    for (const [, session] of sessions) {
      if (session.researchId === researchId) {
        researchText = session.researchText as string;
        break;
      }
    }

    if (!researchText) {
      return res.status(400).json({ error: 'Research text not found' });
    }

    const articleMarkdown = await gemini.generateArticle(
      companyName,
      storyline,
      researchText,
      referenceArticle,
      model
    );

    // Update article if provided
    if (articleProjectId) {
      await storage.updateArticle(articleProjectId, { articleMarkdown });
    }

    res.json({
      articleId: uuidv4(),
      articleMarkdown,
      companyName,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/polish-article', async (req: Request, res: Response) => {
  try {
    const { articleMarkdown, referenceArticle, model } = req.body;

    const polishedMarkdown = await gemini.polishArticle(articleMarkdown, referenceArticle, model);

    res.json({ polishedMarkdown });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// =====================
// Article Splitting
// =====================

router.post('/split-article', async (req: Request, res: Response) => {
  try {
    const { articleMarkdown, articleProjectId } = req.body;

    const imageText = await gemini.generateImageText(articleMarkdown);
    const articleSkeleton = gemini.generateArticleSkeleton(articleMarkdown, imageText);
    const imagePrompts = await gemini.generateImagePrompts(imageText);

    // Update article if provided
    if (articleProjectId) {
      await storage.updateArticle(articleProjectId, { imageText, articleSkeleton, imagePrompts });
    }

    res.json({ imageText, articleSkeleton, imagePrompts });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/generate-image-text', async (req: Request, res: Response) => {
  try {
    const { articleMarkdown, articleProjectId } = req.body;

    const imageText = await gemini.generateImageText(articleMarkdown);

    if (articleProjectId) {
      await storage.updateArticle(articleProjectId, { imageText });
    }

    res.json({ imageText });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/generate-article-skeleton', async (req: Request, res: Response) => {
  try {
    const { articleMarkdown, imageText, articleProjectId } = req.body;

    const articleSkeleton = gemini.generateArticleSkeleton(articleMarkdown, imageText);

    if (articleProjectId) {
      await storage.updateArticle(articleProjectId, { articleSkeleton });
    }

    res.json({ articleSkeleton });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/generate-image-prompts', async (req: Request, res: Response) => {
  try {
    const { imageText, articleProjectId } = req.body;

    const imagePrompts = await gemini.generateImagePrompts(imageText);

    if (articleProjectId) {
      await storage.updateArticle(articleProjectId, { imagePrompts });
    }

    res.json({ imagePrompts, paragraphCount: imagePrompts.length });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// =====================
// Image Generation
// =====================

router.post('/generate-cover', async (req: Request, res: Response) => {
  try {
    const { title, summary } = req.body;

    const result = await gemini.generateCoverImage(title, summary);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/generate-images', async (req: Request, res: Response) => {
  try {
    const { imagePrompts, articleId } = req.body;

    const generatedImages = [];
    for (let i = 0; i < imagePrompts.length; i++) {
      const result = await gemini.generateBlockImage(imagePrompts[i], i);
      generatedImages.push(result);
    }

    if (articleId) {
      await storage.updateArticle(articleId, {
        generatedImages: generatedImages.map((img) => img.url),
      });
    }

    res.json({
      totalBlocks: imagePrompts.length,
      generatedImages,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/finalize-article', async (req: Request, res: Response) => {
  try {
    const { articleSkeleton, imagePaths, articleId } = req.body;

    let finalArticle = articleSkeleton;
    imagePaths.forEach((path: string, index: number) => {
      const placeholder = `[IMAGE_PLACEHOLDER_${index + 1}]`;
      finalArticle = finalArticle.replace(placeholder, `![配图${index + 1}](${path})`);
    });

    if (articleId) {
      await storage.updateArticle(articleId, { finalArticle });
    }

    res.json({ finalArticle });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// =====================
// Publishing
// =====================

router.post('/publish-draft', async (req: Request, res: Response) => {
  try {
    const { articleMarkdown, title, coverImagePath, theme, codeTheme } = req.body;

    await wenyan.publishToWeChat(articleMarkdown, title, coverImagePath, theme, codeTheme);

    res.json({ success: true, message: 'Published to WeChat drafts' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// =====================
// Session & Misc
// =====================

router.get('/session/:id', async (req: Request, res: Response) => {
  try {
    const session = sessions.get(req.params.id);
    if (session) {
      res.json({ success: true, data: session });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/jiuqian-prompt', async (req: Request, res: Response) => {
  try {
    const prompt = await storage.getJiuqianPrompt();
    res.json({ prompt });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/jiuqian-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    await storage.saveJiuqianPrompt(prompt);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
```

### server/src/services/storage.ts

```typescript
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'wechat-sop-data';
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp/data' : './data';

// Initialize GCS client
let storage: Storage | null = null;
try {
  // Only use GCS in production or if GOOGLE_APPLICATION_CREDENTIALS is set
  if (process.env.NODE_ENV === 'production' || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    storage = new Storage();
    console.log('Using Google Cloud Storage');
  } else {
    console.log('Using local storage (development mode)');
  }
} catch (error) {
  console.warn('GCS not configured, using local storage');
}

// In-memory cache
const cache: Map<string, { data: unknown; timestamp: number }> = new Map();
const CACHE_TTL = 5000; // 5 seconds

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// =====================
// User Management
// =====================

interface User {
  username: string;
  password: string;
  role: 'admin' | 'advanced' | 'user';
}

const DEFAULT_USERS: User[] = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'advanced', password: 'advanced123', role: 'advanced' },
  { username: 'user', password: 'user123', role: 'user' },
];

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.username === username && u.password === password) || null;
}

export function hasPermission(role: string, feature: string): boolean {
  if (role === 'admin' || role === 'advanced') return true;
  if (role === 'user' && feature === 'imageGeneration') return false;
  return true;
}

async function getUsers(): Promise<User[]> {
  // Try local file first for user authentication
  const localPath = path.join(DATA_DIR, 'users.json');
  if (fs.existsSync(localPath)) {
    try {
      const contents = fs.readFileSync(localPath, 'utf-8');
      return JSON.parse(contents) as User[];
    } catch {
      // Fall through to defaults
    }
  }

  // Return default users
  return DEFAULT_USERS;
}

// =====================
// Article Management
// =====================

interface Article {
  id: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'in_progress' | 'completed';
  sessionId?: string;
  researchId?: string;
  storyline?: string;
  articleMarkdown?: string;
  imageText?: string;
  articleSkeleton?: string;
  imagePrompts?: string[];
  generatedImages?: string[];
  finalArticle?: string;
}

export async function getArticles(): Promise<Article[]> {
  try {
    const data = await readData('articles.json');
    return (data as Article[]) || [];
  } catch {
    return [];
  }
}

export async function getArticle(id: string): Promise<Article | null> {
  const articles = await getArticles();
  return articles.find((a) => a.id === id) || null;
}

export async function createArticle(companyName: string): Promise<Article> {
  console.log('Storage: Creating article for', companyName);
  const articles = await getArticles();
  console.log('Storage: Current articles count:', articles.length);

  const newArticle: Article = {
    id: uuidv4(),
    companyName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
  };

  articles.unshift(newArticle);
  console.log('Storage: Writing', articles.length, 'articles to file');
  await writeData('articles.json', articles);
  console.log('Storage: Article saved successfully');

  return newArticle;
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<Article> {
  const articles = await getArticles();
  const index = articles.findIndex((a) => a.id === id);

  if (index === -1) {
    throw new Error('Article not found');
  }

  articles[index] = {
    ...articles[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await writeData('articles.json', articles);
  return articles[index];
}

// =====================
// Jiuqian Prompt
// =====================

export async function getJiuqianPrompt(): Promise<string> {
  try {
    const data = await readData('jiuqian_prompt.txt', true);
    return data as string;
  } catch {
    return '';
  }
}

export async function saveJiuqianPrompt(prompt: string): Promise<void> {
  await writeData('jiuqian_prompt.txt', prompt, true);
}

// =====================
// File Operations
// =====================

export async function uploadFile(buffer: Buffer, filename: string): Promise<string> {
  if (storage) {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`files/${filename}`);

    await file.save(buffer, {
      metadata: { contentType: getContentType(filename) },
    });

    await file.makePublic();
    return `https://storage.googleapis.com/${BUCKET_NAME}/files/${filename}`;
  } else {
    // Local storage fallback
    const filePath = path.join(DATA_DIR, 'files', filename);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    return `/data/files/${filename}`;
  }
}

// =====================
// Internal Helpers
// =====================

async function readData(filename: string, isText: boolean = false): Promise<unknown> {
  // Check cache first
  const cached = cache.get(filename);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let data: unknown;

  if (storage) {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`data/${filename}`);

    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('File not found');
    }

    const [contents] = await file.download();
    data = isText ? contents.toString() : JSON.parse(contents.toString());
  } else {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    const contents = fs.readFileSync(filePath, 'utf-8');
    data = isText ? contents : JSON.parse(contents);
  }

  // Update cache
  cache.set(filename, { data, timestamp: Date.now() });

  return data;
}

async function writeData(filename: string, data: unknown, isText: boolean = false): Promise<void> {
  const content = isText ? (data as string) : JSON.stringify(data, null, 2);

  if (storage) {
    console.log('Storage: Writing to GCS:', filename);
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`data/${filename}`);

    await file.save(content, {
      metadata: { contentType: isText ? 'text/plain' : 'application/json' },
    });
  } else {
    const filePath = path.join(DATA_DIR, filename);
    console.log('Storage: Writing to local file:', filePath);
    console.log('Storage: Content length:', content.length, 'bytes');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Storage: File written successfully');
  }

  // Update cache
  cache.set(filename, { data, timestamp: Date.now() });
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
  };
  return types[ext] || 'application/octet-stream';
}
```

### server/src/services/pdf.ts

```typescript
import pdfParse from 'pdf-parse';

export async function extractText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${(error as Error).message}`);
  }
}
```

### server/src/types/pdf-parse.d.ts

```typescript
declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown> | null;
    version: string;
    text: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: unknown) => string;
    max?: number;
    version?: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData>;

  export = pdfParse;
}
```

### server/src/services/gemini.ts

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from './storage';

// Lazy initialization of AI clients
let genAI: GoogleGenerativeAI | null = null;
let deepseek: OpenAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return genAI;
}

function getDeepSeek(): OpenAI {
  if (!deepseek) {
    deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseURL: 'https://api.deepseek.com',
    });
  }
  return deepseek;
}

// Model configurations
const GEMINI_PRO = 'gemini-2.0-flash';
const GEMINI_FLASH = 'gemini-2.0-flash';
const DEEPSEEK_REASONER = 'deepseek-reasoner';

// =====================
// Writing Style Requirements (寫作風格要求)
// =====================

const WRITING_STYLE_REQUIREMENTS = `
行文逻辑要求(重要):使用总分结构,遵循
1)每个话题先给出总论述段落(包含结论与分论点总述),再用数个平行的段落展开论述总论述中提到的分论点(每个分论点另起一段)
2)观点先行,每段论述中第一句话必须用简单平直的语言表达该段落的核心观点,并加粗
3) 所有判断必须对应以下至少一类证据：
   - 生物学机制
   - 临床数据
   - 已上市或失败药物的先例

行文格式与风格要求:
1)（重要）全篇语言风格要冷静、理性,避免宏大叙事,专注商业事实与逻辑
2)（重要）禁止使用目录式的词组列举,都需要写成完整的句子,但不宜使用过长的复合句,易读性优先
3)（重要）必须使用整段的文字,但一个段落需要说明一个观点/ 事实,单段落不需要过长
4)（重要）避免过多地使用比喻/ 排比等修辞手法,禁止生造概念(避免使用双引号),禁止堆砌形容词
5)"这个"/"这种"等表达替换为"此类"
6)避免"不仅、还"及类似的表述,直接用并列的形式写相关内容
7)在多个小的观点/ 事实并列时,在论述段落后使用bullet列举
8)避免使用"唯一"/ "只能"/"最"等绝对性的表述,必须客观公正
9)避免使用"深远""较大"等表意不明的冗余形容词
10)不使用顿号,只使用"/ "做并列概念分隔
11)所有能被数据支撑的观点表述需要使用括号提示数据支撑
12)禁止使用"体现了"/"彰显了"等表述,改用更客观的表述方法
13)在信息复杂,涉及到对比、演进路线时,需要使用文字+表格的形式
14)禁止使用诸如"三大标准"/ "两大主流方向"/ "两大维度"之类表达
15) 禁止使用任何投资或推广性语言
16) 禁止使用未经限定的因果表达
17) 禁止以公司表述替代事实表述
18) 所有临床结果必须明确Phase、样本量、对照方式
19) 对于尚未验证的推论，必须明确标注为"尚未被临床验证"
20) 不允许省略负面或中性结果
`;

// =====================
// Step 1: Research Framework Generation (研究框架生成)
// =====================

export async function generateResearchFramework(companyName: string): Promise<{ upperPart: string; lowerPart: string }> {
  const promptTemplate = fs.readFileSync(
    path.join(__dirname, '../../../Prompt_Research_frame.txt'),
    'utf-8'
  );

  const prompt = promptTemplate.replace('[Insert biotech company name, e.g. Argenx / Viking Therapeutics]', companyName);

  const fullFramework = await callLLMFast(prompt);

  // Split framework into two parts
  const { upperPart, lowerPart } = splitFramework(fullFramework);

  return { upperPart, lowerPart };
}

function splitFramework(framework: string): { upperPart: string; lowerPart: string } {
  // Find the split point at section 11
  const section11Patterns = [
    /11\.\s*\*\*Key Risks/i,
    /11\.\s*\*\*关键风险/,
    /11\.\s*关键风险/,
    /\*\*11\./,
  ];

  let splitIndex = -1;
  for (const pattern of section11Patterns) {
    const match = framework.match(pattern);
    if (match && match.index) {
      splitIndex = match.index;
      break;
    }
  }

  if (splitIndex === -1) {
    // Fallback: split roughly in half
    splitIndex = Math.floor(framework.length * 0.8);
  }

  return {
    upperPart: framework.substring(0, splitIndex).trim(),
    lowerPart: framework.substring(splitIndex).trim(),
  };
}

// =====================
// Step 4a: Storyline Generation (故事線生成)
// =====================

export async function generateStoryline(researchText: string): Promise<string> {
  const prompt = `我正在为一家生物科技公司的研究报告撰写一份研究综述。
请基于以下研究资料，输出一个能够统领全文的biotech研究storyline（180字内）。

## 研究资料：
${researchText.substring(0, 50000)}

## 强制要求：
1. storyline必须包含一个结论性主题句，以及最多4个关键研究议题：
   主题句：
   议题1：
   议题2：
   议题3：
   议题4：

2. 主题句必须明确回答：
   "这家公司是否在科学与临床上具备成立基础"

3. 所有判断必须可追溯至机制、临床或已知同类药物数据
4. 禁止使用宏大或愿景型表述
5. 字数不超过180字
6. 直接输出storyline文本

请严格遵循要求输出storyline：`;

  return await callLLMWithFallback(prompt);
}

// =====================
// Step 4b: Article Generation (文章生成)
// =====================

export async function generateArticle(
  companyName: string,
  storyline: string,
  researchText: string,
  referenceArticle: string,
  model: string = 'deepseek'
): Promise<string> {
  const prompt = `Please think in English and output in Chinese.
You are writing for professional biotech investors and industry experts. Give yourself more time to think before you start writing.

请严格遵循每条写作要求，依据以下【Storyline】写一篇适合传播且具备专业性的微信公众号公关稿。

## Storyline（文章核心叙事线）：
${storyline}

${referenceArticle ? `## 参考文章（具体行文格式可参考此文）：
${referenceArticle.substring(0, 10000)}` : ''}

## 研究资料（必须全部涵盖，不得遗漏重要信息）：
${researchText.substring(0, 80000)}

## 公司名称：${companyName}

## 写作要求：

### 信息完整性（重要）
- 必须涵盖研究资料中的所有技术、商业模式、产业相关的关键细节
- 所有数字/ 百分比/ 金额/ 时间节点等硬核数据必须保留
- 竞争对比分析必须完整呈现
- 技术细节/ 商业模式/ 融资情况等核心内容不可省略
- 不得遗漏任何临床阶段、关键数据或失败信息
- 所有机制解释必须服务于临床结论
- 不得假设未来成功

### 篇幅与结构要求
- 文章字数必须在7000字以上，开头控制在200字内，标题要简短、引人玩味
- 使用清晰的标题层级结构，章节标题无需序号
- （重要）文章标题、章节标题禁止使用目录式的名词列举，必须用短句抛出观点/ 问题
- 文章结尾无需结语

### 输出格式要求
- 输出Markdown格式
- 必须保留所有表格（使用Markdown表格语法）
- 所有缩写首次出现必须解释

${WRITING_STYLE_REQUIREMENTS}

请直接输出Markdown格式的文章：`;

  if (model === 'deepseek') {
    return await callDeepSeek(prompt);
  } else {
    return await callGemini(prompt, GEMINI_PRO);
  }
}

// =====================
// Step 4c: Article Polish (文章潤色)
// =====================

export async function polishArticle(
  articleMarkdown: string,
  referenceArticle: string,
  model: string = 'deepseek'
): Promise<string> {
  const originalWordCount = articleMarkdown.length;

  const prompt = `Please think in English and output in Chinese. Give yourself more time to think before you start writing.

你是一位资深的投资分析公众号编辑。请对以下初稿文章进行二次润色，严格按照写作要求调整格式和风格。

## 【最重要】字数要求：
- 原文字数约 ${originalWordCount} 字
- 润色后的文章必须保持相近的字数（允许±10%浮动）
- 不要大幅缩减内容，也不要过度扩充

${referenceArticle ? `## 参考文章（具体行文格式可参考此文）：
${referenceArticle.substring(0, 10000)}` : ''}

## 待润色的初稿文章（约${originalWordCount}字）：
${articleMarkdown}

## 润色要求：

### 内容优化
- 保留原文所有关键信息/ 数据/ 论点，绝对不要删减核心内容
- 优化段落结构和逻辑连贯性
- 增强论述的深度和说服力
- 使用更精准/ 更有力的表达

### 格式要求
- 输出Markdown格式
- 保留所有表格
- 使用清晰的标题层级结构

${WRITING_STYLE_REQUIREMENTS}

请直接输出润色后的Markdown格式文章：`;

  if (model === 'deepseek') {
    return await callDeepSeek(prompt);
  } else {
    return await callGemini(prompt, GEMINI_PRO);
  }
}

// =====================
// Step 5a: Image Text Generation (生圖文本生成)
// =====================

export async function generateImageText(articleMarkdown: string): Promise<string> {
  const prompt = `Please think in English and output in Chinese. Give yourself more time to think before you start writing.
第一步：通读全文，仅筛选**在生物学、临床或药物开发层面信息密度过高**、不适合用纯文字理解的段落或表格。

你只能选择满足以下至少一项条件的内容：
1. 机制路径、靶点作用逻辑、信号通路描述
2. 临床试验设计（入组标准、终点、分组）
3. 临床结果的数据性总结（有效性 / 安全性）
4. 管线结构、适应症扩展逻辑
5. 多药物 / 多机制的对比信息
6. 所有表格（必须选）

第二步：在原文中，用【【【】】】标记你选择的段落或表格，其余文字**一个字都不要改**。

第三步：在每个被标记段落前，用不超过100字的中文，概括该段落**希望通过图示澄清的科学或临床问题**。
概括必须是完整句子，不得使用营销或宣传语言。

第四步：输出添加了概括说明和【【【】】】标记的全文。

注意：
- 禁止选择纯叙事性、判断性、结论性段落
- 禁止为了"好看"而选择内容

输出示例：

...原文...
三句完整的话概括
【【【你筛选出的段落】】】
...原文...

# 输入文章：
${articleMarkdown}

请开始处理：`;

  return await callLLMFast(prompt);
}

// =====================
// Step 5b: Article Skeleton Generation (文章骨架生成)
// =====================

export function generateArticleSkeleton(articleMarkdown: string, imageText: string): string {
  // Extract marked paragraphs from imageText
  const markedBlocks = extractMarkedBlocks(imageText);

  let skeleton = articleMarkdown;
  let placeholderIndex = 1;

  // Replace each marked block with a placeholder
  for (const block of markedBlocks) {
    const placeholder = `[IMAGE_PLACEHOLDER_${placeholderIndex}]`;
    skeleton = skeleton.replace(block, placeholder);
    placeholderIndex++;
  }

  return skeleton;
}

function extractMarkedBlocks(imageText: string): string[] {
  const blocks: string[] = [];
  const regex = /【【【([\s\S]*?)】】】/g;
  let match;

  while ((match = regex.exec(imageText)) !== null) {
    blocks.push(match[1].trim());
  }

  return blocks;
}

export function extractImageParagraphs(imageText: string): { content: string; summary: string }[] {
  const paragraphs: { content: string; summary: string }[] = [];
  const regex = /([^【】]+?)【【【([\s\S]*?)】】】/g;
  let match;

  while ((match = regex.exec(imageText)) !== null) {
    const summary = match[1].trim().split('\n').slice(-3).join('\n'); // Get last 3 lines as summary
    const content = match[2].trim();
    paragraphs.push({ summary, content });
  }

  return paragraphs;
}

// =====================
// Step 5c: Image Prompts Generation (配圖提示詞生成)
// =====================

export async function generateImagePrompts(imageText: string): Promise<string[]> {
  const paragraphs = extractImageParagraphs(imageText);
  const prompts: string[] = [];

  for (const paragraph of paragraphs) {
    const prompt = await generateSingleImagePrompt(paragraph.content, paragraph.summary);
    prompts.push(prompt);
  }

  return prompts;
}

async function generateSingleImagePrompt(content: string, summary: string): Promise<string> {
  const prompt = `Please think in English and output in English.

你的任务是：从以下段落中，提取**适合用科学示意图或数据图表表达的信息结构**。

段落内容：
${content}

概括：
${summary}

提取时，必须优先考虑以下类型（按优先级）：
1. 生物学机制结构（靶点 / 通路 / 作用关系）
2. 临床试验结构（分组、终点、时间线）
3. 临床数据结构（数值、比例、变化趋势）
4. 管线与适应症对应关系

请输出一个简洁的英文图片生成提示词（50-100词），描述应该生成什么样的科学插图。

禁止事项：
- 禁止生成抽象概念图
- 禁止生成"愿景型""总结型"图示
- 禁止补充原文中不存在的数据或结构

直接输出提示词：`;

  const result = await callLLMFast(prompt);
  return result.trim();
}

// =====================
// Step 6a: Cover Image Generation (封面圖生成)
// =====================

export async function generateCoverImage(title: string, summary: string): Promise<{ imageUrl: string; mimeType: string }> {
  const themeKeywords = extractThemeKeywords(title + ' ' + summary);

  const prompt = `A clean, professional cover image suitable for a biotech research report.

Theme:
${themeKeywords}

Visual style:
- Minimalist, restrained, research-oriented
- Soft, neutral color palette
- Flat or lightly dimensional scientific illustration style

Allowed elements:
- Molecular structures (schematic, not photorealistic)
- Cells, antibodies, proteins (simplified, educational)
- Abstract biological patterns with clear scientific reference

Strict prohibitions:
- No futuristic cityscapes
- No holograms, data streams, or glowing effects
- No people, faces, or body parts
- No text, numbers, logos

The image should convey scientific seriousness and analytical intent, not innovation hype.`;

  return await generateImage(prompt, 'cover');
}

// =====================
// Step 6b: Block Image Generation (區塊配圖生成)
// =====================

export async function generateBlockImage(imagePrompt: string, index: number): Promise<{ url: string; index: number }> {
  const fullPrompt = `Generate a professional scientific illustration or data visualization.

Content focus:
${imagePrompt}

Design requirements:
- Purpose: clarify biological mechanism, clinical trial structure, or data relationship
- Style: clean, academic, neutral
- Color usage: restrained, functional (no neon, no dramatic contrast)
- Visual language: suitable for inclusion in a scientific or equity research report

If applicable:
- Clearly label components (e.g. target, pathway step, treatment arm)
- Use arrows only to indicate causal or procedural relationships
- Maintain logical hierarchy and readability

Strict prohibitions:
- No futuristic or abstract visuals
- No cityscapes, light effects, or "technology aesthetics"
- No decorative icons
- No exaggeration or dramatization

The image must be interpretable as a scientific explanatory figure, not a marketing graphic.`;

  const result = await generateImage(fullPrompt, `block_${index}`);
  return { url: result.imageUrl, index };
}

// =====================
// Image Generation Core (Gemini 2.0)
// =====================

async function generateImage(prompt: string, prefix: string): Promise<{ imageUrl: string; mimeType: string }> {
  try {
    const client = getGenAI();

    // Use Gemini 2.0 Flash with image generation
    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseModalities: ['image', 'text'],
      } as any,
    });

    const imagePrompt = `Generate a professional scientific illustration: ${prompt}

Style requirements:
- Clean, academic, minimalist design
- Soft neutral color palette (blues, grays, whites)
- No text or labels in the image
- Suitable for biotech research report`;

    console.log('Generating image with Gemini 2.0:', prompt.substring(0, 100));

    const result = await model.generateContent(imagePrompt);
    const response = await result.response;

    // Check if response contains image data
    const parts = response.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if ((part as any).inlineData) {
        const inlineData = (part as any).inlineData;
        const base64Data = inlineData.data;
        const mimeType = inlineData.mimeType || 'image/png';

        // Save to GCS or return as data URL
        const filename = `${prefix}_${uuidv4()}.png`;
        const buffer = Buffer.from(base64Data, 'base64');

        // Try to upload to storage
        try {
          const url = await uploadFile(buffer, filename);
          return { imageUrl: url, mimeType };
        } catch {
          // Return as data URL if upload fails
          return {
            imageUrl: `data:${mimeType};base64,${base64Data}`,
            mimeType,
          };
        }
      }
    }

    // Fallback to placeholder if no image generated
    console.warn('No image data in Gemini response, using placeholder');
    const encodedText = encodeURIComponent(prefix.replace(/_/g, ' '));
    return {
      imageUrl: `https://placehold.co/800x600/e8e8e8/666?text=${encodedText}`,
      mimeType: 'image/png',
    };

  } catch (error) {
    console.error('Image generation error:', error);
    // Return placeholder on error
    const encodedText = encodeURIComponent(prefix.replace(/_/g, ' '));
    return {
      imageUrl: `https://placehold.co/800x600/e8e8e8/666?text=${encodedText}`,
      mimeType: 'image/png',
    };
  }
}

// =====================
// Theme Keywords Extraction (主題關鍵詞提取)
// =====================

function extractThemeKeywords(text: string): string {
  const conceptMap: Record<string, string> = {
    '肿瘤': 'schematic representation of tumor cells and immune interaction',
    '肿瘤免疫': 'immune cells interacting with cancer cells, educational scientific style',
    '自身免疫': 'immune dysregulation illustrated through immune cell signaling pathways',
    '神经疾病': 'simplified neuronal networks and synaptic structures',
    '罕见病': 'genetic pathways and cellular dysfunction illustrated in a medical textbook style',
    '炎症': 'inflammatory signaling pathways at cellular level',
    '代谢疾病': 'metabolic pathways illustrated with organs and molecular interactions',
    '单克隆抗体': 'antibody structures binding to specific targets, clean scientific illustration',
    '双特异性抗体': 'dual-binding antibody schematic interacting with two targets',
    'ADC': 'antibody-drug conjugate structure showing linker and payload relationship',
    '小分子': 'small molecule interacting with protein binding pocket, schematic view',
    '基因治疗': 'gene delivery vectors interacting with cellular nucleus, educational style',
    'RNA疗法': 'RNA strands interacting with cellular machinery',
    '细胞治疗': 'engineered immune cells interacting with target cells',
    'CAR-T': 'CAR-T cell recognizing and binding to tumor antigen',
    '疫苗': 'antigen presentation and immune activation schematic',
  };

  for (const [key, value] of Object.entries(conceptMap)) {
    if (text.includes(key)) {
      return value;
    }
  }

  return 'minimalist scientific illustration inspired by biology and medicine, neutral academic research tone';
}

// =====================
// LLM Call Functions (LLM 調用函數)
// =====================

async function callDeepSeek(prompt: string): Promise<string> {
  try {
    const client = getDeepSeek();
    const response = await client.chat.completions.create({
      model: DEEPSEEK_REASONER,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 16000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('DeepSeek error:', error);
    throw error;
  }
}

async function callGemini(prompt: string, modelName: string = GEMINI_PRO): Promise<string> {
  try {
    const client = getGenAI();
    const model = client.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error('Gemini error:', error);
    throw error;
  }
}

async function callLLMWithFallback(prompt: string, maxRetries: number = 2): Promise<string> {
  // Try DeepSeek first
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callDeepSeek(prompt);
    } catch (error) {
      console.warn(`DeepSeek attempt ${i + 1} failed:`, error);
    }
  }

  // Fallback to Gemini
  console.log('Falling back to Gemini');
  return await callGemini(prompt, GEMINI_PRO);
}

async function callLLMFast(prompt: string, maxRetries: number = 3): Promise<string> {
  // Try Gemini Flash first for fast tasks
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callGemini(prompt, GEMINI_FLASH);
    } catch (error) {
      console.warn(`Gemini attempt ${i + 1} failed:`, error);
    }
  }

  // Fallback to DeepSeek
  console.log('Falling back to DeepSeek');
  return await callDeepSeek(prompt);
}
```

### server/src/services/wenyan.ts

```typescript
import { marked, type Tokens } from 'marked';
import hljs from 'highlight.js';
import axios from 'axios';
import FormData from 'form-data';

// WeChat API endpoints
const WECHAT_TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';
const WECHAT_DRAFT_URL = 'https://api.weixin.qq.com/cgi-bin/draft/add';
const WECHAT_UPLOADIMG_URL = 'https://api.weixin.qq.com/cgi-bin/media/uploadimg';
const WECHAT_MEDIA_UPLOAD_URL = 'https://api.weixin.qq.com/cgi-bin/material/add_material';

// WeChat-compatible CSS styles
const WECHAT_CSS = `
<style>
.wx-article{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;line-height:1.75;font-size:16px;color:#333;padding:20px}
.wx-article h1{margin:1.5em 0 1em;text-align:center;font-size:1.6em;font-weight:bold;color:#1a1a1a}
.wx-article h2{margin:1.5em 0 0.8em;font-size:1.3em;font-weight:bold;color:#1a1a1a;border-bottom:1px solid #eee;padding-bottom:0.3em}
.wx-article h3{margin:1.2em 0 0.6em;font-size:1.1em;font-weight:bold;color:#1a1a1a}
.wx-article p{margin:1em 0;text-align:justify}
.wx-article strong{font-weight:bold;color:#1a1a1a}
.wx-article em{font-style:italic}
.wx-article ul,.wx-article ol{margin:1em 0;padding-left:2em}
.wx-article li{margin:0.5em 0}
.wx-article blockquote{margin:1em 0;padding:10px 20px;background-color:#f9f9f9;border-left:4px solid #ddd;color:#666}
.wx-article table{border-collapse:collapse;margin:1.5em auto;width:100%;font-size:0.9em}
.wx-article th{padding:12px 15px;text-align:left;border:1px solid #ddd;background-color:#f5f5f5;font-weight:bold}
.wx-article td{padding:12px 15px;text-align:left;border:1px solid #ddd}
.wx-article code{background-color:#f5f5f5;padding:2px 6px;border-radius:3px;font-family:Consolas,Monaco,"Courier New",monospace;font-size:0.9em}
.wx-article pre{background-color:#f8f8f8;padding:16px;border-radius:6px;overflow-x:auto;margin:1em 0}
.wx-article pre code{font-size:0.85em;line-height:1.5;padding:0;background:none}
.wx-article img{max-width:100%;height:auto;margin:1em auto;display:block}
.wx-article a{color:#576b95;text-decoration:none}
.wx-article hr{border:none;border-top:1px solid #eee;margin:2em 0}
</style>
`;

// Get WeChat access token
async function getAccessToken(): Promise<string> {
  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Missing WECHAT_APP_ID or WECHAT_APP_SECRET');
  }

  const url = `${WECHAT_TOKEN_URL}?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.errcode) {
    throw new Error(`WeChat API error: ${data.errmsg} (code: ${data.errcode})`);
  }

  return data.access_token;
}

// Upload image to WeChat
async function uploadImageToWeChat(accessToken: string, imageUrl: string): Promise<string> {
  let imageBuffer: Buffer;
  let contentType = 'image/png';

  if (imageUrl.startsWith('data:')) {
    const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid data URL format');
    contentType = matches[1];
    imageBuffer = Buffer.from(matches[2], 'base64');
  } else if (imageUrl.startsWith('/data/') || imageUrl.startsWith('./data/')) {
    const fs = await import('fs');
    const path = await import('path');
    const localPath = imageUrl.startsWith('/data/')
      ? path.join(process.cwd(), imageUrl)
      : imageUrl;
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local image file not found: ${localPath}`);
    }
    imageBuffer = fs.readFileSync(localPath);
    contentType = imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
  } else {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    imageBuffer = Buffer.from(response.data);
    contentType = response.headers['content-type'] || 'image/png';
  }

  const url = `${WECHAT_MEDIA_UPLOAD_URL}?access_token=${accessToken}&type=image`;
  const formData = new FormData();
  formData.append('media', imageBuffer, {
    filename: `cover.${contentType.includes('jpeg') ? 'jpg' : 'png'}`,
    contentType: contentType,
  });

  const uploadResponse = await axios.post(url, formData, {
    headers: formData.getHeaders(),
  });

  if (uploadResponse.data.errcode) {
    throw new Error(`WeChat upload error: ${uploadResponse.data.errmsg}`);
  }

  return uploadResponse.data.media_id;
}

// Render markdown to HTML
async function renderMarkdownToHtml(markdownContent: string): Promise<string> {
  const htmlBody = await marked.parse(markdownContent);
  return `${WECHAT_CSS}<section class="wx-article">${htmlBody}</section>`;
}

// Main publish function
export async function publishToWeChat(
  articleMarkdown: string,
  title: string,
  coverImagePath: string,
  theme: string = 'default',
  codeTheme: string = 'github'
): Promise<void> {
  const accessToken = await getAccessToken();

  let thumbMediaId = '';
  if (coverImagePath && coverImagePath.trim()) {
    thumbMediaId = await uploadImageToWeChat(accessToken, coverImagePath);
  }

  const htmlContent = await renderMarkdownToHtml(articleMarkdown);

  const url = `${WECHAT_DRAFT_URL}?access_token=${accessToken}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      articles: [{
        title,
        content: htmlContent,
        thumb_media_id: thumbMediaId,
      }]
    }),
  });

  const data = await response.json();
  if (data.errcode) {
    throw new Error(`WeChat draft error: ${data.errmsg}`);
  }

  console.log('Draft created successfully! Media ID:', data.media_id);
}
```

---

## Client 端代碼

### client/package.json

```json
{
  "name": "wechat-sop-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "antd": "^5.12.8",
    "zustand": "^4.4.7",
    "axios": "^1.6.5",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "@ant-design/icons": "^5.2.6"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.16.0",
    "@typescript-eslint/parser": "^6.16.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5"
  }
}
```

### client/vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/data': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
```

### client/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### client/index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>公众号自动化SOP系统 - Biotech</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### client/src/main.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
```

### client/src/App.tsx

```tsx
import { useEffect, useMemo } from 'react';
import { Layout, Spin, Collapse, Typography, Tag } from 'antd';
import { CheckCircleOutlined, LoadingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useStore } from './stores/useStore';
import Login from './components/Login';
import ArticleSidebar from './components/ArticleSidebar';
import CompanyInput from './components/CompanyInput';
import FileDownload from './components/FileDownload';
import PdfUpload from './components/PdfUpload';
import ArticlePreview from './components/ArticlePreview';
import ArticleSplit from './components/ArticleSplit';
import ImageGeneration from './components/ImageGeneration';
import PublishPanel from './components/PublishPanel';
import './App.css';

const { Sider, Content } = Layout;
const { Text } = Typography;

const STEP_CONFIG = [
  { key: 1, title: '输入公司名称', component: CompanyInput },
  { key: 2, title: '下载研究框架', component: FileDownload },
  { key: 3, title: '上传研究报告', component: PdfUpload },
  { key: 4, title: '生成文章', component: ArticlePreview },
  { key: 5, title: '分割配图', component: ArticleSplit },
  { key: 6, title: '生成图片', component: ImageGeneration },
  { key: 7, title: '发布到微信', component: PublishPanel },
];

function App() {
  const { user, loading, currentStep, checkAuth } = useStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const collapseItems = useMemo(() => {
    return STEP_CONFIG.map((step) => {
      const StepComponent = step.component;
      const isCompleted = step.key < currentStep;
      const isCurrent = step.key === currentStep;
      const isPending = step.key > currentStep;

      let statusIcon;
      let statusTag;
      if (isCompleted) {
        statusIcon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        statusTag = <Tag color="success">已完成</Tag>;
      } else if (isCurrent) {
        statusIcon = <LoadingOutlined style={{ color: '#1890ff' }} />;
        statusTag = <Tag color="processing">进行中</Tag>;
      } else {
        statusIcon = <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
        statusTag = <Tag>待处理</Tag>;
      }

      return {
        key: String(step.key),
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {statusIcon}
            <Text strong={isCurrent}>Step {step.key}: {step.title}</Text>
            {statusTag}
          </div>
        ),
        children: <StepComponent />,
        collapsible: isPending ? 'disabled' as const : undefined,
      };
    });
  }, [currentStep]);

  // Default open all completed steps and current step
  const defaultActiveKeys = useMemo(() => {
    return STEP_CONFIG
      .filter((step) => step.key <= currentStep)
      .map((step) => String(step.key));
  }, [currentStep]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout className="app-container">
      <Sider width={280} className="sidebar" theme="light">
        <ArticleSidebar />
      </Sider>
      <Content className="main-content">
        <div className="step-container">
          <Collapse
            items={collapseItems}
            defaultActiveKey={defaultActiveKeys}
            style={{ background: 'transparent' }}
            expandIconPosition="start"
          />
        </div>
      </Content>
    </Layout>
  );
}

export default App;
```

### client/src/services/api.ts 和其他組件

由於篇幅限制，其他組件代碼（stores/useStore.ts, services/api.ts, components/*）請參考專案源碼。

---

## 部署配置

### Dockerfile

```dockerfile
# Stage 1: Build client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
# Skip Puppeteer Chromium download (using Gemini API instead)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install wenyan-cli globally
RUN npm install -g @aspect/wenyan-cli

# Copy built client
COPY --from=client-builder /app/client/dist ./client/dist

# Copy built server
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/package*.json ./server/
COPY --from=server-builder /app/server/node_modules ./server/node_modules

# Copy prompt template
COPY Prompt_Research_frame.txt ./

# Create necessary directories
RUN mkdir -p uploads downloads data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start server
WORKDIR /app/server
CMD ["node", "dist/index.js"]
```

### cloudbuild.yaml

```yaml
steps:
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/wechat-sop:latest', '.']

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/wechat-sop:latest']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'wechat-sop'
      - '--image'
      - 'gcr.io/$PROJECT_ID/wechat-sop:latest'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--memory'
      - '1Gi'
      - '--timeout'
      - '300'
      - '--set-env-vars'
      - 'NODE_ENV=production'

images:
  - 'gcr.io/$PROJECT_ID/wechat-sop:latest'

options:
  logging: CLOUD_LOGGING_ONLY
```

---

## Prompt 模板

### Prompt_Research_frame.txt

```
# Role
You are a Senior Biotech Equity Research Director at a top-tier global investment bank.
You specialize in mechanism-driven analysis of innovative therapeutics.

# Goal
Your task is NOT to conduct research.
You must generate a rigorous, step-by-step Research Directive that will be executed by an advanced AI Research Agent.
This directive must be suitable for institutional biotech due diligence.

# Target Company
[Insert biotech company name, e.g. Argenx / Viking Therapeutics]

# Internal Thinking Process (do not output)
1. Identify the therapeutic area(s) and unmet medical need.
2. Determine whether the company is mechanism-first, asset-first, or platform-first.
3. Identify the most relevant clinical comparators (approved or late-stage).

# Output Instructions
Output a single cohesive Markdown code block titled:
**"Biotech Research Directive for DeepResearch"**

Tone: Precise, clinical, non-promotional.
Format: Structured directives/questions. NO tables.

# Mandatory Coverage Framework (Must Follow This Order)

1. **Disease Background & Unmet Need**
   - Define disease prevalence, severity, current standard of care.
   - Explicitly identify limitations of existing therapies.

2. **Mechanism of Action (Core)**
   - Describe biological pathway, target, and rationale.
   - Clarify why this mechanism should work *in this disease*.
   - Highlight prior validation (genetic, preclinical, clinical).

3. **Asset / Platform Architecture**
   - Distinguish between single-asset, multi-asset, or platform company.
   - If platform: explain scalability and reuse logic.

4. **Preclinical Evidence**
   - Key models used.
   - Translational relevance and limitations.

5. **Clinical Development Status**
   - Trial phases, design, endpoints.
   - Patient population and inclusion criteria.
   - Key readouts and timelines.

6. **Clinical Efficacy Signals**
   - Primary and secondary endpoints.
   - Magnitude, consistency, and durability of response.
   - Subgroup differentiation if available.

7. **Safety & Tolerability**
   - On-target vs off-target risks.
   - Known class effects.
   - Discontinuation and SAE profile.

8. **Differentiation vs Competitors**
   - Compare MOA, efficacy, safety, dosing, and convenience.
   - Explicitly identify where differentiation is *uncertain*.

9. **Regulatory Pathway**
   - Fast Track / BTD / Orphan / Accelerated Approval potential.
   - Key regulatory risks.

10. **Commercialization Logic**
    - Target patient population size.
    - Pricing benchmarks.
    - Adoption barriers (physician behavior, payer, competition).

11. **Key Risks & Failure Modes**
    - Scientific risk
    - Clinical risk
    - Regulatory risk
    - Commercial risk

# Final Requirement
- Use Chinese.
- Be explicit where data is missing or ambiguous.
- Avoid promotional language.
- Output ONLY the Research Directive inside a code block.
```

---

## 默認用戶帳號

| 用戶名 | 密碼 | 角色 | 權限 |
|--------|------|------|------|
| admin | admin123 | admin | 全部功能 |
| advanced | advanced123 | advanced | 全部功能 |
| user | user123 | user | 無圖片生成 |

---

## 注意事項

1. **API Keys**: 請確保在 `.env` 文件中配置正確的 API Keys
2. **GCS 認證**: 生產環境需要配置 Google Cloud 認證
3. **微信配置**: 需要有已認證的微信公眾號並配置 APP_ID 和 APP_SECRET
4. **圖片生成**: 使用 Gemini 2.0 Flash Experimental 模型，可能需要特殊訪問權限

---

*此文件由 Claude Code 自動生成，請勿覆蓋此版本*
