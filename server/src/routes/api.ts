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
