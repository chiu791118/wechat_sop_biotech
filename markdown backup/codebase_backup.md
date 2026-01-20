# WeChat SOP Biotech - Codebase Backup (v2.8)

完整源代碼備份，用於實現參考。

---

## 目錄

1. [Root Configuration](#root-configuration)
2. [Client - Configuration](#client-configuration)
3. [Client - Entry & App](#client-entry--app)
4. [Client - Services](#client-services)
5. [Client - Stores](#client-stores)
6. [Client - Components](#client-components)
7. [Server - Configuration](#server-configuration)
8. [Server - Entry](#server-entry)
9. [Server - Routes](#server-routes)
10. [Server - Services](#server-services)

---

## Root Configuration

### package.json

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

### .env (Template)

```env
# AI Model API Keys (Required)
GEMINI_API_KEY=your_gemini_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key

# WeChat Public Account Configuration (Required)
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret

# Google Cloud Storage (Required for public image URLs)
GCS_BUCKET_NAME=your_bucket_name
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcs-credentials.json

# Optional Configuration
PORT=3001
NODE_ENV=development
UPLOAD_DIR=./uploads
DOWNLOAD_DIR=./downloads
```

---

## Client Configuration

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

---

## Client Entry & App

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

### client/src/App.css

```css
.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.step-container {
  max-width: 900px;
  margin: 0 auto;
}

.step-card {
  margin-bottom: 16px;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1890ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.step-number.completed {
  background: #52c41a;
}

.step-number.active {
  background: #1890ff;
}

.step-number.pending {
  background: #d9d9d9;
}

.markdown-preview {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  max-height: 500px;
  overflow-y: auto;
}

.markdown-preview table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.markdown-preview th,
.markdown-preview td {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
  text-align: left;
}

.markdown-preview th {
  background: #fafafa;
}

.markdown-preview pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-preview code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.image-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.image-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-title {
  text-align: center;
  margin-bottom: 32px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}
```

### client/src/index.css

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

#root {
  min-height: 100vh;
}
```

---

## Client Services

### client/src/services/api.ts

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 600000, // 10 minutes for long AI operations
});

// Auth
export async function login(username: string, password: string) {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
}

export async function checkPermission(role: string, feature: string) {
  const response = await api.post('/auth/check-permission', { role, feature });
  return response.data;
}

// Articles
export async function getArticles() {
  const response = await api.get('/articles');
  return response.data;
}

export async function getArticle(id: string) {
  const response = await api.get(`/articles/${id}`);
  return response.data;
}

export async function createArticle(companyName: string) {
  const response = await api.post('/articles', { companyName });
  return response.data;
}

export async function updateArticle(id: string, data: Record<string, unknown>) {
  const response = await api.put(`/articles/${id}`, data);
  return response.data;
}

// Framework
export async function generateFramework(companyName: string, articleId?: string) {
  const response = await api.post('/generate-framework', { companyName, articleId });
  return response.data;
}

// PDF Upload
export async function uploadResearch(file: File, companyName: string, sessionId: string, articleId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('companyName', companyName);
  formData.append('sessionId', sessionId);
  if (articleId) formData.append('articleId', articleId);

  const response = await api.post('/upload-research', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function uploadReference(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload-reference', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// Storyline
export async function generateStoryline(researchId: string, companyName: string, articleId?: string) {
  const response = await api.post('/generate-storyline', { researchId, companyName, articleId });
  return response.data;
}

// Article
export async function generateArticle(
  companyName: string,
  researchId: string,
  storyline: string,
  referenceArticle: string,
  model: string,
  articleProjectId?: string
) {
  const response = await api.post('/generate-article', {
    companyName,
    researchId,
    storyline,
    referenceArticle,
    model,
    articleProjectId,
  });
  return response.data;
}

export async function polishArticle(articleMarkdown: string, referenceArticle: string, model: string) {
  const response = await api.post('/polish-article', { articleMarkdown, referenceArticle, model });
  return response.data;
}

// Article Split
export async function splitArticle(articleMarkdown: string, articleProjectId?: string) {
  const response = await api.post('/split-article', { articleMarkdown, articleProjectId });
  return response.data;
}

export async function generateImageText(articleMarkdown: string, articleProjectId?: string) {
  const response = await api.post('/generate-image-text', { articleMarkdown, articleProjectId });
  return response.data;
}

export async function generateArticleSkeleton(articleMarkdown: string, imageText: string, articleProjectId?: string) {
  const response = await api.post('/generate-article-skeleton', { articleMarkdown, imageText, articleProjectId });
  return response.data;
}

export async function generateImagePrompts(imageText: string, articleProjectId?: string) {
  const response = await api.post('/generate-image-prompts', { imageText, articleProjectId });
  return response.data;
}

// Images
export async function generateCover(title: string, summary: string) {
  const response = await api.post('/generate-cover', { title, summary });
  return response.data;
}

export async function generateImages(imagePrompts: string[], articleId?: string) {
  const response = await api.post('/generate-images', { imagePrompts, articleId });
  return response.data;
}

export async function finalizeArticle(articleSkeleton: string, imagePaths: string[], articleId?: string) {
  const response = await api.post('/finalize-article', { articleSkeleton, imagePaths, articleId });
  return response.data;
}

// Publish
export async function publishDraft(
  articleMarkdown: string,
  title: string,
  coverImagePath: string,
  theme: string,
  codeTheme: string
) {
  const response = await api.post('/publish-draft', {
    articleMarkdown,
    title,
    coverImagePath,
    theme,
    codeTheme,
  });
  return response.data;
}

// Session
export async function getSession(id: string) {
  const response = await api.get(`/session/${id}`);
  return response.data;
}

// Jiuqian Prompt
export async function getJiuqianPrompt() {
  const response = await api.get('/jiuqian-prompt');
  return response.data;
}

export async function saveJiuqianPrompt(prompt: string) {
  const response = await api.post('/jiuqian-prompt', { prompt });
  return response.data;
}
```

---

## Client Stores

### client/src/stores/useStore.ts

```typescript
import { create } from 'zustand';
import * as api from '../services/api';

interface User {
  username: string;
  role: 'admin' | 'advanced' | 'user';
}

interface ArticleProject {
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

interface AppState {
  // Auth
  user: User | null;
  loading: boolean;

  // Navigation
  currentStep: number;

  // Article Projects
  articles: ArticleProject[];
  currentArticle: ArticleProject | null;

  // Framework Generation
  companyName: string;
  sessionId: string | null;
  upperPart: string;
  lowerPart: string;
  upperPartFile: string;
  lowerPartFile: string;

  // Research
  researchId: string | null;
  extractedText: string;
  referenceArticle: string;

  // Article Generation
  storyline: string;
  articleMarkdown: string;
  selectedModel: 'deepseek' | 'gemini';

  // Article Split
  imageText: string;
  articleSkeleton: string;
  imagePrompts: string[];

  // Image Generation
  generatedImages: string[];
  coverImage: string;

  // Final Article
  finalArticle: string;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setCurrentStep: (step: number) => void;
  setCompanyName: (name: string) => void;
  setSelectedModel: (model: 'deepseek' | 'gemini') => void;
  setArticles: (articles: ArticleProject[]) => void;
  setCurrentArticle: (article: ArticleProject | null) => void;

  // API Actions
  checkAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  loadArticles: () => Promise<void>;
  createArticle: (companyName: string) => Promise<ArticleProject | null>;
  selectArticle: (id: string) => Promise<void>;

  generateFramework: (companyName: string) => Promise<boolean>;
  uploadResearchPdf: (file: File) => Promise<boolean>;
  uploadReferencePdf: (file: File) => Promise<boolean>;
  generateStoryline: () => Promise<boolean>;
  generateArticle: () => Promise<boolean>;
  polishArticle: () => Promise<boolean>;

  splitArticle: () => Promise<boolean>;
  generateImageText: () => Promise<boolean>;
  generateArticleSkeleton: () => Promise<boolean>;
  generateImagePrompts: () => Promise<boolean>;

  generateImages: () => Promise<boolean>;
  generateCover: (title: string, summary: string) => Promise<boolean>;
  finalizeArticle: () => Promise<boolean>;

  publishDraft: (title: string, theme: string, codeTheme: string) => Promise<boolean>;

  reset: () => void;
}

const initialState = {
  user: null,
  loading: true,
  currentStep: 1,
  articles: [],
  currentArticle: null,
  companyName: '',
  sessionId: null,
  upperPart: '',
  lowerPart: '',
  upperPartFile: '',
  lowerPartFile: '',
  researchId: null,
  extractedText: '',
  referenceArticle: '',
  storyline: '',
  articleMarkdown: '',
  selectedModel: 'deepseek' as const,
  imageText: '',
  articleSkeleton: '',
  imagePrompts: [],
  generatedImages: [],
  coverImage: '',
  finalArticle: '',
};

// Helper function to save article data to server
async function saveArticleToServer(articleId: string | undefined, data: Record<string, unknown>) {
  if (!articleId) return;
  try {
    await api.updateArticle(articleId, data);
  } catch (error) {
    console.error('Failed to auto-save article:', error);
  }
}

export const useStore = create<AppState>((set, get) => ({
  ...initialState,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setCompanyName: (name) => set({ companyName: name }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setArticles: (articles) => set({ articles }),
  setCurrentArticle: (article) => set({ currentArticle: article }),

  checkAuth: async () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      set({ user: JSON.parse(savedUser), loading: false });
    } else {
      set({ loading: false });
    }
  },

  login: async (username, password) => {
    try {
      const response = await api.login(username, password);
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        set({ user: response.user });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    set({ ...initialState, loading: false });
  },

  loadArticles: async () => {
    try {
      const articles = await api.getArticles();
      set({ articles });
    } catch (error) {
      console.error('Failed to load articles:', error);
    }
  },

  createArticle: async (companyName) => {
    try {
      const article = await api.createArticle(companyName);
      const articles = await api.getArticles();
      // Reset all article-related state when creating new article
      set({
        articles,
        currentArticle: article,
        companyName,
        currentStep: 1,
        // Reset all previous article data
        sessionId: null,
        upperPart: '',
        lowerPart: '',
        upperPartFile: '',
        lowerPartFile: '',
        researchId: null,
        extractedText: '',
        referenceArticle: '',
        storyline: '',
        articleMarkdown: '',
        imageText: '',
        articleSkeleton: '',
        imagePrompts: [],
        generatedImages: [],
        coverImage: '',
        finalArticle: '',
      });
      return article;
    } catch (error) {
      console.error('Failed to create article:', error);
      return null;
    }
  },

  selectArticle: async (id) => {
    try {
      const article = await api.getArticle(id);
      set({
        currentArticle: article,
        companyName: article.companyName,
        sessionId: article.sessionId || null,
        researchId: article.researchId || null,
        storyline: article.storyline || '',
        articleMarkdown: article.articleMarkdown || '',
        imageText: article.imageText || '',
        articleSkeleton: article.articleSkeleton || '',
        imagePrompts: article.imagePrompts || [],
        generatedImages: article.generatedImages || [],
        finalArticle: article.finalArticle || '',
        currentStep: determineStep(article),
      });
    } catch (error) {
      console.error('Failed to select article:', error);
    }
  },

  generateFramework: async (companyName) => {
    try {
      set({ loading: true });
      let { currentArticle, articles } = get();

      if (!currentArticle) {
        const newArticle = await api.createArticle(companyName);
        articles = [newArticle, ...articles];
        currentArticle = newArticle;
        set({ articles, currentArticle, companyName });
      }

      const result = await api.generateFramework(companyName, currentArticle?.id);
      set({
        companyName,
        sessionId: result.sessionId,
        upperPart: result.upperPart,
        lowerPart: result.lowerPart,
        upperPartFile: result.upperPartFile,
        lowerPartFile: result.lowerPartFile,
        loading: false,
        currentStep: 2,
      });
      return true;
    } catch (error) {
      console.error('Failed to generate framework:', error);
      set({ loading: false });
      return false;
    }
  },

  uploadResearchPdf: async (file) => {
    try {
      set({ loading: true });
      const { companyName, sessionId, currentArticle } = get();
      const result = await api.uploadResearch(file, companyName, sessionId!, currentArticle?.id);
      set({
        researchId: result.researchId,
        extractedText: result.extractedText,
        loading: false,
        currentStep: 4,
      });
      return true;
    } catch (error) {
      console.error('Failed to upload research PDF:', error);
      set({ loading: false });
      return false;
    }
  },

  uploadReferencePdf: async (file) => {
    try {
      const result = await api.uploadReference(file);
      set({ referenceArticle: result.extractedText });
      return true;
    } catch (error) {
      console.error('Failed to upload reference PDF:', error);
      return false;
    }
  },

  generateStoryline: async () => {
    try {
      set({ loading: true });
      const { researchId, companyName, currentArticle } = get();
      const result = await api.generateStoryline(researchId!, companyName, currentArticle?.id);
      set({
        storyline: result.storyline,
        loading: false,
      });
      await saveArticleToServer(currentArticle?.id, { storyline: result.storyline });
      return true;
    } catch (error) {
      console.error('Failed to generate storyline:', error);
      set({ loading: false });
      return false;
    }
  },

  generateArticle: async () => {
    try {
      set({ loading: true });
      const { companyName, researchId, storyline, referenceArticle, selectedModel, currentArticle } = get();
      const result = await api.generateArticle(
        companyName,
        researchId!,
        storyline,
        referenceArticle,
        selectedModel,
        currentArticle?.id
      );
      set({
        articleMarkdown: result.articleMarkdown,
        loading: false,
      });
      await saveArticleToServer(currentArticle?.id, { articleMarkdown: result.articleMarkdown });
      return true;
    } catch (error) {
      console.error('Failed to generate article:', error);
      set({ loading: false });
      return false;
    }
  },

  polishArticle: async () => {
    try {
      set({ loading: true });
      const { articleMarkdown, referenceArticle, selectedModel, currentArticle } = get();
      const result = await api.polishArticle(articleMarkdown, referenceArticle, selectedModel);
      set({
        articleMarkdown: result.polishedMarkdown,
        loading: false,
      });
      await saveArticleToServer(currentArticle?.id, { articleMarkdown: result.polishedMarkdown });
      return true;
    } catch (error) {
      console.error('Failed to polish article:', error);
      set({ loading: false });
      return false;
    }
  },

  splitArticle: async () => {
    try {
      set({ loading: true });
      const { articleMarkdown, currentArticle } = get();
      const result = await api.splitArticle(articleMarkdown, currentArticle?.id);
      set({
        imageText: result.imageText,
        articleSkeleton: result.articleSkeleton,
        imagePrompts: result.imagePrompts,
        loading: false,
        currentStep: 5,
      });
      await saveArticleToServer(currentArticle?.id, {
        imageText: result.imageText,
        articleSkeleton: result.articleSkeleton,
        imagePrompts: result.imagePrompts,
      });
      return true;
    } catch (error) {
      console.error('Failed to split article:', error);
      set({ loading: false });
      return false;
    }
  },

  generateImageText: async () => {
    try {
      set({ loading: true });
      const { articleMarkdown, currentArticle } = get();
      const result = await api.generateImageText(articleMarkdown, currentArticle?.id);
      set({
        imageText: result.imageText,
        loading: false,
      });
      await saveArticleToServer(currentArticle?.id, { imageText: result.imageText });
      return true;
    } catch (error) {
      console.error('Failed to generate image text:', error);
      set({ loading: false });
      return false;
    }
  },

  generateArticleSkeleton: async () => {
    try {
      set({ loading: true });
      const { articleMarkdown, imageText, currentArticle } = get();
      const result = await api.generateArticleSkeleton(articleMarkdown, imageText, currentArticle?.id);
      set({
        articleSkeleton: result.articleSkeleton,
        loading: false,
      });
      await saveArticleToServer(currentArticle?.id, { articleSkeleton: result.articleSkeleton });
      return true;
    } catch (error) {
      console.error('Failed to generate article skeleton:', error);
      set({ loading: false });
      return false;
    }
  },

  generateImagePrompts: async () => {
    try {
      set({ loading: true });
      const { imageText, currentArticle } = get();
      const result = await api.generateImagePrompts(imageText, currentArticle?.id);
      set({
        imagePrompts: result.imagePrompts,
        loading: false,
      });
      await saveArticleToServer(currentArticle?.id, { imagePrompts: result.imagePrompts });
      return true;
    } catch (error) {
      console.error('Failed to generate image prompts:', error);
      set({ loading: false });
      return false;
    }
  },

  generateImages: async () => {
    try {
      set({ loading: true });
      const { imagePrompts, currentArticle } = get();
      const result = await api.generateImages(imagePrompts, currentArticle?.id);
      const generatedImages = result.generatedImages.map((img: { url: string }) => img.url);
      set({
        generatedImages,
        loading: false,
        currentStep: 6,
      });
      await saveArticleToServer(currentArticle?.id, { generatedImages });
      return true;
    } catch (error) {
      console.error('Failed to generate images:', error);
      set({ loading: false });
      return false;
    }
  },

  generateCover: async (title, summary) => {
    try {
      set({ loading: true });
      const result = await api.generateCover(title, summary);
      set({
        coverImage: result.imageUrl,
        loading: false,
      });
      return true;
    } catch (error) {
      console.error('Failed to generate cover:', error);
      set({ loading: false });
      return false;
    }
  },

  finalizeArticle: async () => {
    try {
      set({ loading: true });
      const { articleSkeleton, generatedImages, currentArticle } = get();
      const result = await api.finalizeArticle(articleSkeleton, generatedImages, currentArticle?.id);
      set({
        finalArticle: result.finalArticle,
        loading: false,
        currentStep: 7,
      });
      await saveArticleToServer(currentArticle?.id, { finalArticle: result.finalArticle });
      return true;
    } catch (error) {
      console.error('Failed to finalize article:', error);
      set({ loading: false });
      return false;
    }
  },

  publishDraft: async (title, theme, codeTheme) => {
    try {
      set({ loading: true });
      const { finalArticle, articleMarkdown, coverImage } = get();
      const contentToPublish = finalArticle || articleMarkdown;

      if (!contentToPublish || contentToPublish.trim().length === 0) {
        throw new Error('No article content to publish.');
      }
      if (contentToPublish.startsWith('data:image/')) {
        throw new Error('Article content appears to be image data.');
      }

      await api.publishDraft(contentToPublish, title, coverImage, theme, codeTheme);
      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Failed to publish draft:', error);
      set({ loading: false });
      return false;
    }
  },

  reset: () => set({ ...initialState, loading: false }),
}));

function determineStep(article: ArticleProject): number {
  if (article.finalArticle) return 7;
  if (article.generatedImages && article.generatedImages.length > 0) return 6;
  if (article.imagePrompts && article.imagePrompts.length > 0) return 5;
  if (article.articleMarkdown) return 4;
  if (article.researchId) return 3;
  if (article.sessionId) return 2;
  return 1;
}
```

---

## Client Components

### client/src/components/Login.tsx

```tsx
import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useStore } from '../stores/useStore';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const login = useStore((state) => state.login);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    const success = await login(values.username, values.password);
    setLoading(false);

    if (!success) {
      message.error('用户名或密码错误');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">公众号自动化SOP系统</h1>
        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
```

### client/src/components/ArticleSidebar.tsx

```tsx
import { useEffect, useState } from 'react';
import { Menu, Button, Input, Modal, Typography, Avatar, Dropdown } from 'antd';
import { PlusOutlined, FileTextOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useStore } from '../stores/useStore';

const { Text } = Typography;

export default function ArticleSidebar() {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const {
    user,
    articles,
    currentArticle,
    loadArticles,
    createArticle,
    selectArticle,
    logout,
  } = useStore();

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleCreate = async () => {
    if (!newCompanyName.trim()) return;
    await createArticle(newCompanyName.trim());
    setNewCompanyName('');
    setModalVisible(false);
  };

  const menuItems = articles.map((article) => ({
    key: article.id,
    icon: <FileTextOutlined />,
    label: (
      <div style={{ lineHeight: 1.4 }}>
        <div style={{ fontWeight: 500 }}>{article.companyName}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          {new Date(article.createdAt).toLocaleDateString('zh-CN')}
        </div>
      </div>
    ),
  }));

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={() => setModalVisible(true)}
        >
          新建文章项目
        </Button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={currentArticle ? [currentArticle.id] : []}
          items={menuItems}
          onClick={({ key }) => selectArticle(key)}
          style={{ border: 'none' }}
        />
      </div>

      <div style={{ padding: 16, borderTop: '1px solid #e8e8e8' }}>
        <Dropdown menu={{ items: userMenuItems }} placement="topLeft">
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
            <div>
              <div>{user?.username}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {user?.role}
              </Text>
            </div>
          </div>
        </Dropdown>
      </div>

      <Modal
        title="新建文章项目"
        open={modalVisible}
        onOk={handleCreate}
        onCancel={() => setModalVisible(false)}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="输入公司名称"
          value={newCompanyName}
          onChange={(e) => setNewCompanyName(e.target.value)}
          onPressEnter={handleCreate}
        />
      </Modal>
    </div>
  );
}
```

### client/src/components/CompanyInput.tsx

```tsx
import { useState } from 'react';
import { Input, Button, Typography, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useStore } from '../stores/useStore';

const { Title, Paragraph } = Typography;

export default function CompanyInput() {
  const [inputValue, setInputValue] = useState('');
  const { companyName, loading, generateFramework, currentArticle } = useStore();

  const handleGenerate = async () => {
    const name = inputValue.trim() || companyName;
    if (!name) {
      message.warning('请输入公司名称');
      return;
    }

    const success = await generateFramework(name);
    if (success) {
      message.success('研究框架生成成功');
    } else {
      message.error('框架生成失败，请重试');
    }
  };

  return (
    <div>
      <Paragraph type="secondary">
        输入您要研究的生物科技公司名称，系统将自动生成11点研究框架。
      </Paragraph>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Input
          size="large"
          placeholder="例如：Argenx / Viking Therapeutics"
          value={inputValue || currentArticle?.companyName || ''}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleGenerate}
          disabled={loading}
        />
        <Button
          type="primary"
          size="large"
          icon={<SearchOutlined />}
          loading={loading}
          onClick={handleGenerate}
        >
          生成框架
        </Button>
      </div>

      <div style={{ marginTop: 16 }}>
        <Title level={5}>11点研究框架包括：</Title>
        <ol style={{ paddingLeft: 20, color: '#666' }}>
          <li>疾病背景与未满足需求</li>
          <li>作用机制（核心）</li>
          <li>资产/平台架构</li>
          <li>临床前证据</li>
          <li>临床开发状态</li>
          <li>临床有效性信号</li>
          <li>安全性与耐受性</li>
          <li>与竞争对手的差异化</li>
          <li>监管路径</li>
          <li>商业化逻辑</li>
          <li>关键风险与失败模式</li>
        </ol>
      </div>
    </div>
  );
}
```

### client/src/components/FileDownload.tsx

```tsx
import { Card, Button, Typography, Alert, Divider } from 'antd';
import { DownloadOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useStore } from '../stores/useStore';

const { Title, Paragraph, Text } = Typography;

export default function FileDownload() {
  const { upperPart, lowerPart, upperPartFile, lowerPartFile, companyName, setCurrentStep } = useStore();

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Alert
        type="info"
        message="使用说明"
        description="下载框架文件后，请在 Gemini DeepResearch 中执行深度研究，然后将研究结果合并为 PDF 文件。"
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: 'flex', gap: 16 }}>
        <Card style={{ flex: 1 }}>
          <Title level={5}>上半段框架 (1-10)</Title>
          <Paragraph type="secondary">
            包含疾病背景、机制、临床开发等核心研究指令
          </Paragraph>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(upperPart, upperPartFile || `${companyName}_framework_upper.txt`)}
            disabled={!upperPart}
          >
            下载上半段
          </Button>
        </Card>

        <Card style={{ flex: 1 }}>
          <Title level={5}>下半段框架 (11-竞争分析)</Title>
          <Paragraph type="secondary">
            包含风险分析与竞争对比研究指令
          </Paragraph>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(lowerPart, lowerPartFile || `${companyName}_framework_lower.txt`)}
            disabled={!lowerPart}
          >
            下载下半段
          </Button>
        </Card>
      </div>

      <Divider />

      <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
        <Title level={5}>下一步操作：</Title>
        <ol style={{ paddingLeft: 20 }}>
          <li>
            <Text>分别使用两个框架在 </Text>
            <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer">
              Gemini DeepResearch
            </a>
            <Text> 执行深度研究</Text>
          </li>
          <li>将两个研究结果合并为一个 PDF 文件</li>
          <li>上传合并后的 PDF 到下一步</li>
        </ol>
      </div>

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOutlined />}
          onClick={() => setCurrentStep(3)}
        >
          下一步：上传研究PDF
        </Button>
      </div>
    </div>
  );
}
```

### client/src/components/PdfUpload.tsx

```tsx
import { useState } from 'react';
import { Upload, Button, Typography, message, Modal } from 'antd';
import { UploadOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useStore } from '../stores/useStore';

const { Paragraph, Text } = Typography;
const { Dragger } = Upload;

export default function PdfUpload() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);

  const { loading, extractedText, uploadResearchPdf } = useStore();

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择 PDF 文件');
      return;
    }

    const file = fileList[0].originFileObj as File;
    const success = await uploadResearchPdf(file);

    if (success) {
      message.success('PDF 上传成功，文本已提取');
    } else {
      message.error('PDF 上传失败');
    }
  };

  return (
    <div>
      <Paragraph type="secondary">
        上传合并后的 Gemini DeepResearch 研究报告 PDF 文件。
      </Paragraph>

      <Dragger
        accept=".pdf"
        maxCount={1}
        fileList={fileList}
        beforeUpload={() => false}
        onChange={({ fileList }) => setFileList(fileList)}
        style={{ marginTop: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <FileTextOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text">点击或拖拽 PDF 文件到此区域</p>
        <p className="ant-upload-hint">支持单个 PDF 文件，最大 50MB</p>
      </Dragger>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          loading={loading}
          onClick={handleUpload}
          disabled={fileList.length === 0}
        >
          上传并提取文本
        </Button>

        {extractedText && (
          <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(true)}>
            预览提取结果
          </Button>
        )}
      </div>

      {extractedText && (
        <div style={{ marginTop: 16 }}>
          <Text type="success">
            ✓ 已成功提取 {extractedText.length} 字符
          </Text>
        </div>
      )}

      <Modal
        title="提取的文本内容"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ maxHeight: 500, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
          {extractedText}
        </div>
      </Modal>
    </div>
  );
}
```

### client/src/components/ArticlePreview.tsx

```tsx
import { useState } from 'react';
import { Button, Typography, message, Radio, Upload, Tabs, Spin } from 'antd';
import { FileTextOutlined, EditOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../stores/useStore';

const { Paragraph } = Typography;

export default function ArticlePreview() {
  const [referenceFileList, setReferenceFileList] = useState<UploadFile[]>([]);

  const {
    loading,
    storyline,
    articleMarkdown,
    selectedModel,
    setSelectedModel,
    generateStoryline,
    generateArticle,
    polishArticle,
    uploadReferencePdf,
    setCurrentStep,
  } = useStore();

  const handleGenerateStoryline = async () => {
    const success = await generateStoryline();
    if (success) {
      message.success('Storyline 生成成功');
    } else {
      message.error('Storyline 生成失败');
    }
  };

  const handleGenerateArticle = async () => {
    const success = await generateArticle();
    if (success) {
      message.success('文章生成成功');
    } else {
      message.error('文章生成失败');
    }
  };

  const handlePolish = async () => {
    const success = await polishArticle();
    if (success) {
      message.success('文章润色成功');
    } else {
      message.error('文章润色失败');
    }
  };

  const handleUploadReference = async () => {
    if (referenceFileList.length === 0) return;
    const file = referenceFileList[0].originFileObj as File;
    const success = await uploadReferencePdf(file);
    if (success) {
      message.success('参考文章已上传');
    }
  };

  const tabItems = [
    {
      key: 'storyline',
      label: 'Storyline',
      children: (
        <div>
          <Paragraph type="secondary">
            Storyline 是文章的核心叙事线，包含主题句和关键研究议题。
          </Paragraph>
          <Button
            type="primary"
            onClick={handleGenerateStoryline}
            loading={loading}
            disabled={!!storyline}
            style={{ marginBottom: 16 }}
          >
            生成 Storyline
          </Button>
          {storyline && (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{storyline}</ReactMarkdown>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'reference',
      label: '参考文章',
      children: (
        <div>
          <Paragraph type="secondary">
            上传参考文章 PDF，系统将参考其文风进行写作。（可选）
          </Paragraph>
          <Upload
            accept=".pdf"
            maxCount={1}
            fileList={referenceFileList}
            beforeUpload={() => false}
            onChange={({ fileList }) => setReferenceFileList(fileList)}
          >
            <Button icon={<FileTextOutlined />}>选择参考文章 PDF</Button>
          </Upload>
          {referenceFileList.length > 0 && (
            <Button
              type="primary"
              onClick={handleUploadReference}
              style={{ marginTop: 8 }}
              loading={loading}
            >
              上传参考文章
            </Button>
          )}
        </div>
      ),
    },
    {
      key: 'generate',
      label: '生成文章',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Paragraph strong>选择 AI 模型：</Paragraph>
            <Radio.Group
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <Radio.Button value="deepseek">DeepSeek (推荐)</Radio.Button>
              <Radio.Button value="gemini">Gemini</Radio.Button>
            </Radio.Group>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              type="primary"
              onClick={handleGenerateArticle}
              loading={loading}
              disabled={!storyline}
            >
              生成文章
            </Button>
            {articleMarkdown && (
              <Button
                icon={<EditOutlined />}
                onClick={handlePolish}
                loading={loading}
              >
                润色文章
              </Button>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'preview',
      label: '文章预览',
      children: articleMarkdown ? (
        <div className="markdown-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{articleMarkdown}</ReactMarkdown>
        </div>
      ) : (
        <Paragraph type="secondary">文章生成后将在此显示预览</Paragraph>
      ),
    },
  ];

  return (
    <div>
      <Spin spinning={loading} tip="AI 正在处理中...">
        <Tabs items={tabItems} />
      </Spin>

      {articleMarkdown && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            icon={<EditOutlined />}
            onClick={handlePolish}
            loading={loading}
            size="large"
          >
            润色文章
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => setCurrentStep(5)}
          >
            下一步：分割配图
          </Button>
        </div>
      )}
    </div>
  );
}
```

### client/src/components/ArticleSplit.tsx

```tsx
import { Card, Button, Typography, message, Tabs, Spin } from 'antd';
import { ArrowRightOutlined, ScissorOutlined, PictureOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../stores/useStore';

const { Paragraph, Text } = Typography;

export default function ArticleSplit() {
  const {
    loading,
    imageText,
    articleSkeleton,
    imagePrompts,
    splitArticle,
    generateImageText,
    generateArticleSkeleton,
    generateImagePrompts,
    setCurrentStep,
  } = useStore();

  const handleSplitAll = async () => {
    const success = await splitArticle();
    if (success) {
      message.success('文章分割完成');
    } else {
      message.error('文章分割失败');
    }
  };

  const handleGenerateImageText = async () => {
    const success = await generateImageText();
    if (success) {
      message.success('生图文本生成成功');
    } else {
      message.error('生成失败');
    }
  };

  const handleGenerateSkeleton = async () => {
    const success = await generateArticleSkeleton();
    if (success) {
      message.success('文章骨架生成成功');
    } else {
      message.error('生成失败');
    }
  };

  const handleGeneratePrompts = async () => {
    const success = await generateImagePrompts();
    if (success) {
      message.success('生图 Prompt 生成成功');
    } else {
      message.error('生成失败');
    }
  };

  const tabItems = [
    {
      key: 'all',
      label: '一键分割',
      children: (
        <div>
          <Paragraph type="secondary">
            一键完成所有分割步骤：生成生图文本、文章骨架和生图 Prompt。
          </Paragraph>
          <Button
            type="primary"
            icon={<ScissorOutlined />}
            onClick={handleSplitAll}
            loading={loading}
            size="large"
          >
            一键分割文章
          </Button>
        </div>
      ),
    },
    {
      key: 'imageText',
      label: '生图文本',
      children: (
        <div>
          <Paragraph type="secondary">
            标记适合生成 PPT 风格配图的段落。
          </Paragraph>
          <Button
            type="primary"
            onClick={handleGenerateImageText}
            loading={loading}
            disabled={!!imageText}
            style={{ marginBottom: 16 }}
          >
            生成生图文本
          </Button>
          {imageText && (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{imageText}</ReactMarkdown>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'skeleton',
      label: '文章骨架',
      children: (
        <div>
          <Paragraph type="secondary">
            用占位符替换需要配图的段落，生成文章骨架。
          </Paragraph>
          <Button
            type="primary"
            onClick={handleGenerateSkeleton}
            loading={loading}
            disabled={!imageText || !!articleSkeleton}
            style={{ marginBottom: 16 }}
          >
            生成文章骨架
          </Button>
          {articleSkeleton && (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{articleSkeleton}</ReactMarkdown>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'prompts',
      label: '生图 Prompt',
      children: (
        <div>
          <Paragraph type="secondary">
            为每个标记段落生成麦肯锡风格的 PPT 配图 Prompt。
          </Paragraph>
          <Button
            type="primary"
            icon={<PictureOutlined />}
            onClick={handleGeneratePrompts}
            loading={loading}
            disabled={!imageText || imagePrompts.length > 0}
            style={{ marginBottom: 16 }}
          >
            生成配图 Prompt
          </Button>
          {imagePrompts.length > 0 && (
            <div>
              <Text strong>共 {imagePrompts.length} 个配图 Prompt：</Text>
              <div style={{ marginTop: 16 }}>
                {imagePrompts.map((prompt, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{ marginBottom: 8 }}
                    title={`配图 ${index + 1}`}
                  >
                    <Text>{prompt}</Text>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Spin spinning={loading} tip="AI 正在处理中...">
        <Tabs items={tabItems} />
      </Spin>

      {imagePrompts.length > 0 && articleSkeleton && (
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => setCurrentStep(6)}
          >
            下一步：生成配图
          </Button>
        </div>
      )}
    </div>
  );
}
```

### client/src/components/ImageGeneration.tsx

```tsx
import { Button, Typography, message, Spin, Image, Empty, Alert } from 'antd';
import { ArrowRightOutlined, PictureOutlined } from '@ant-design/icons';
import { useStore } from '../stores/useStore';

const { Title, Paragraph, Text } = Typography;

export default function ImageGeneration() {
  const {
    user,
    loading,
    imagePrompts,
    generatedImages,
    generateImages,
    finalizeArticle,
    setCurrentStep,
  } = useStore();

  const hasPermission = user?.role === 'admin' || user?.role === 'advanced';

  const handleGenerateImages = async () => {
    if (!hasPermission) {
      message.warning('您没有图片生成权限');
      return;
    }

    const success = await generateImages();
    if (success) {
      message.success('配图生成成功');
    } else {
      message.error('配图生成失败');
    }
  };

  const handleFinalize = async () => {
    const success = await finalizeArticle();
    if (success) {
      message.success('最终文章生成成功');
      setCurrentStep(7);
    } else {
      message.error('生成失败');
    }
  };

  const handleSkip = () => {
    setCurrentStep(7);
  };

  return (
    <div>
      {!hasPermission && (
        <Alert
          type="warning"
          message="权限提示"
          description="图片生成功能仅对 admin 和 advanced 用户开放。您可以跳过此步骤直接发布文章。"
          style={{ marginBottom: 16 }}
        />
      )}

      <Paragraph type="secondary">
        根据生图 Prompt 批量生成麦肯锡风格的科学配图。
      </Paragraph>

      <div style={{ marginTop: 16 }}>
        <Text strong>待生成配图数量：{imagePrompts.length}</Text>
      </div>

      <Spin spinning={loading} tip="AI 正在生成配图...">
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <Button
            type="primary"
            icon={<PictureOutlined />}
            onClick={handleGenerateImages}
            loading={loading}
            disabled={!hasPermission || imagePrompts.length === 0 || generatedImages.length > 0}
          >
            批量生成配图
          </Button>
          <Button onClick={handleSkip}>
            跳过配图，直接发布
          </Button>
        </div>

        {generatedImages.length > 0 ? (
          <div style={{ marginTop: 24 }}>
            <Title level={5}>已生成的配图 ({generatedImages.length})</Title>
            <div className="image-grid">
              {generatedImages.map((url, index) => (
                <div key={index} className="image-card">
                  <Image
                    src={url}
                    alt={`配图 ${index + 1}`}
                    style={{ width: '100%', height: 150, objectFit: 'cover' }}
                  />
                  <div style={{ padding: 8 }}>
                    <Text type="secondary">配图 {index + 1}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 24 }}>
            <Empty description="暂无生成的配图" />
          </div>
        )}
      </Spin>

      {generatedImages.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Button
            type="primary"
            onClick={handleFinalize}
            loading={loading}
            style={{ marginRight: 12 }}
          >
            插入配图生成最终文章
          </Button>
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={() => setCurrentStep(7)}
          >
            直接进入发布
          </Button>
        </div>
      )}
    </div>
  );
}
```

### client/src/components/PublishPanel.tsx

```tsx
import { useState, memo } from 'react';
import { Button, Typography, message, Input, Select, Divider, Spin } from 'antd';
import { SendOutlined, DownloadOutlined, PictureOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../stores/useStore';

const MarkdownPreview = memo(({ content }: { content: string }) => (
  <div className="markdown-preview" style={{ maxHeight: 400 }}>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  </div>
));

const { Title, Paragraph } = Typography;

const THEMES = [
  { value: 'default', label: '默认主题' },
  { value: 'github', label: 'GitHub' },
  { value: 'condensed-night-purple', label: '紫色夜晚' },
  { value: 'channing-cyan', label: '青色' },
  { value: 'han', label: '寒' },
  { value: 'geek-black', label: '极客黑' },
];

const CODE_THEMES = [
  { value: 'github', label: 'GitHub' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'vs2015', label: 'VS2015' },
  { value: 'xcode', label: 'XCode' },
];

export default function PublishPanel() {
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState('default');
  const [codeTheme, setCodeTheme] = useState('github');

  const {
    loading,
    articleMarkdown,
    finalArticle,
    coverImage,
    companyName,
    generateCover,
    publishDraft,
  } = useStore();

  const contentToPublish = finalArticle || articleMarkdown;

  const handleGenerateCover = async () => {
    const success = await generateCover(
      title || companyName,
      contentToPublish.substring(0, 500)
    );
    if (success) {
      message.success('封面图生成成功');
    } else {
      message.error('封面图生成失败');
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      message.warning('请输入文章标题');
      return;
    }

    const success = await publishDraft(title, theme, codeTheme);
    if (success) {
      message.success('文章已发布到微信草稿箱');
    } else {
      message.error('发布失败，请检查微信配置');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([contentToPublish], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${companyName || 'article'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Spin spinning={loading} tip="处理中...">
        <div>
          <Title level={5}>文章标题</Title>
          <Input
            size="large"
            placeholder="输入文章标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginBottom: 16 }}
          />

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <Paragraph strong>排版主题</Paragraph>
              <Select
                style={{ width: '100%' }}
                value={theme}
                onChange={setTheme}
                options={THEMES}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Paragraph strong>代码高亮主题</Paragraph>
              <Select
                style={{ width: '100%' }}
                value={codeTheme}
                onChange={setCodeTheme}
                options={CODE_THEMES}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Paragraph strong>封面图片</Paragraph>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Button
                icon={<PictureOutlined />}
                onClick={handleGenerateCover}
                loading={loading}
              >
                AI 生成封面
              </Button>
              {coverImage && (
                <img
                  src={coverImage}
                  alt="封面"
                  style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4 }}
                />
              )}
            </div>
          </div>

          <Divider />

          <Title level={5}>文章预览</Title>
          <MarkdownPreview content={contentToPublish} />

          <Divider />

          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={handlePublish}
              loading={loading}
            >
              发布到草稿箱
            </Button>
            <Button
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              下载 Markdown
            </Button>
          </div>
        </div>
      </Spin>
    </div>
  );
}
```

---

## Server Configuration

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

---

## Server Entry

### server/src/env.ts

```typescript
import path from 'path';
import dotenv from 'dotenv';

// Load .env from root directory - this file must be imported first
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('Environment loaded:');
console.log('  GCS_BUCKET_NAME:', process.env.GCS_BUCKET_NAME);
console.log('  GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT SET');
```

### server/src/index.ts

```typescript
// Load environment variables FIRST
import './env';

import path from 'path';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api';

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

---

## Server Routes

### server/src/routes/api.ts

(Due to file length, see the full implementation in project files. Contains 20+ endpoints for auth, articles, framework, PDF, storyline, article generation, splitting, images, and publishing.)

---

## Server Services

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

### server/src/services/gemini.ts

(Full implementation in project files. Contains all AI prompt templates and LLM calling functions.)

### server/src/services/storage.ts

(Full implementation in project files. Contains GCS storage operations and article management.)

### server/src/services/wenyan.ts

(Full implementation in project files. Contains WeChat publishing logic with custom Markdown renderer.)

---

## Version

- **v2.8** (2026-01-17)
- Updated prompts for image generation
- Fixed state management bugs
- Switched to gemini-3-pro-image-preview model

---

*Codebase Backup - For implementation reference*
