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
      // Reload articles from server to ensure sync
      const articles = await api.getArticles();
      set({
        articles,
        currentArticle: article,
        companyName,
        currentStep: 1,
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

      // Auto-create article if none exists
      if (!currentArticle) {
        const newArticle = await api.createArticle(companyName);
        articles = [newArticle, ...articles];
        currentArticle = newArticle;
        set({ articles, currentArticle, companyName });
      }

      const result = await api.generateFramework(companyName, currentArticle?.id);
      set({
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
      // Auto-save to server
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
      // Auto-save to server
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
      // Auto-save to server
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
      // Auto-save to server
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
      // Auto-save to server
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
      // Auto-save to server
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
      // Auto-save to server
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
      // Auto-save to server
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
      // Auto-save to server
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

      // Determine which content to publish
      const contentToPublish = finalArticle || articleMarkdown;

      // Debug logging
      console.log('PublishDraft - finalArticle length:', finalArticle?.length || 0);
      console.log('PublishDraft - articleMarkdown length:', articleMarkdown?.length || 0);
      console.log('PublishDraft - contentToPublish length:', contentToPublish?.length || 0);
      console.log('PublishDraft - coverImage length:', coverImage?.length || 0);
      console.log('PublishDraft - content preview:', contentToPublish?.substring(0, 200));

      // Validate content is not image data
      if (!contentToPublish || contentToPublish.trim().length === 0) {
        throw new Error('No article content to publish. Please generate article content first.');
      }
      if (contentToPublish.startsWith('data:image/')) {
        throw new Error('Article content appears to be image data. Please generate article content first.');
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
