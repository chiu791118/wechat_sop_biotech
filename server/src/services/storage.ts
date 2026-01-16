import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'wechat-sop-data';
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp/data' : './data';

// Initialize GCS client - always try to initialize for image uploads
let storage: Storage | null = null;
let gcsAvailable = false;

try {
  storage = new Storage();
  gcsAvailable = true;
  console.log('Google Cloud Storage initialized');
} catch (error) {
  console.warn('GCS initialization failed:', error);
}

// For data files (articles.json etc), always use local in development for faster access
const useLocalForData = process.env.NODE_ENV !== 'production';
if (useLocalForData) {
  console.log('Using local storage for data files (development mode)');
} else {
  console.log('Using GCS for data files');
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
  // Try GCS first if available
  if (storage && gcsAvailable) {
    try {
      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(`files/${filename}`);

      await file.save(buffer, {
        metadata: { contentType: getContentType(filename) },
      });

      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/files/${filename}`;
      console.log('Image uploaded to GCS:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('GCS upload failed, falling back to local storage:', error);
      // Fall through to local storage
    }
  }

  // Local storage fallback
  const filePath = path.join(DATA_DIR, 'files', filename);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, buffer);
  console.log('Image saved locally:', filePath);
  return `/data/files/${filename}`;
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

  // Use local storage in development, GCS in production
  if (!useLocalForData && storage) {
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

  // Use local storage in development, GCS in production
  if (!useLocalForData && storage) {
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
