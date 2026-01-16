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
