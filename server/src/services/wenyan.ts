import { marked, type Tokens } from 'marked';
import hljs from 'highlight.js';
import axios from 'axios';
import FormData from 'form-data';

// WeChat API endpoints
const WECHAT_TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';
const WECHAT_DRAFT_URL = 'https://api.weixin.qq.com/cgi-bin/draft/add';
// Use uploadimg API for article cover images (returns a usable URL, not media_id)
const WECHAT_UPLOADIMG_URL = 'https://api.weixin.qq.com/cgi-bin/media/uploadimg';
// Use permanent material API for thumb_media_id
const WECHAT_MEDIA_UPLOAD_URL = 'https://api.weixin.qq.com/cgi-bin/material/add_material';

interface WeChatTokenResponse {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
}

interface WeChatDraftResponse {
  media_id?: string;
  errcode?: number;
  errmsg?: string;
}

interface WeChatMediaResponse {
  media_id?: string;
  url?: string;
  errcode?: number;
  errmsg?: string;
}

interface WeChatUploadImgResponse {
  url?: string;
  errcode?: number;
  errmsg?: string;
}

// WeChat-compatible CSS styles (using style block instead of inline to reduce size)
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

// WeChat content size limit (approximately 1MB for safety)
const WECHAT_CONTENT_SIZE_LIMIT = 1000000;

// Configure marked with custom renderer for marked v17+ API
// Uses clean HTML without inline styles - styles come from WECHAT_CSS
function createWeChatRenderer() {
  const renderer = new marked.Renderer();

  // Heading: uses tokens array for content
  renderer.heading = function({ tokens, depth }: Tokens.Heading): string {
    const text = this.parser.parseInline(tokens);
    return `<h${depth}>${text}</h${depth}>\n`;
  };

  // Paragraph: uses tokens array for content
  renderer.paragraph = function({ tokens }: Tokens.Paragraph): string {
    const text = this.parser.parseInline(tokens);
    return `<p>${text}</p>\n`;
  };

  // Strong: uses tokens array for content
  renderer.strong = function({ tokens }: Tokens.Strong): string {
    const text = this.parser.parseInline(tokens);
    return `<strong>${text}</strong>`;
  };

  // Em: uses tokens array for content
  renderer.em = function({ tokens }: Tokens.Em): string {
    const text = this.parser.parseInline(tokens);
    return `<em>${text}</em>`;
  };

  // List: uses items array
  renderer.list = function(token: Tokens.List): string {
    const tag = token.ordered ? 'ol' : 'ul';
    let body = '';
    for (const item of token.items) {
      body += this.listitem(item);
    }
    return `<${tag}>${body}</${tag}>\n`;
  };

  // ListItem: uses tokens array for content
  renderer.listitem = function(item: Tokens.ListItem): string {
    const text = this.parser.parse(item.tokens);
    return `<li>${text}</li>\n`;
  };

  // Blockquote: uses tokens array for content
  renderer.blockquote = function({ tokens }: Tokens.Blockquote): string {
    const text = this.parser.parse(tokens);
    return `<blockquote>${text}</blockquote>\n`;
  };

  // Table: uses header cells and rows arrays
  renderer.table = function(token: Tokens.Table): string {
    let headerRow = '<tr>';
    for (let i = 0; i < token.header.length; i++) {
      headerRow += this.tablecell(token.header[i]);
    }
    headerRow += '</tr>\n';

    let body = '';
    for (const row of token.rows) {
      body += '<tr>';
      for (const cell of row) {
        body += this.tablecell(cell);
      }
      body += '</tr>\n';
    }

    return `<table><thead>${headerRow}</thead><tbody>${body}</tbody></table>\n`;
  };

  // TableRow: marked v17 handles this differently, but we include for completeness
  renderer.tablerow = function({ text }: Tokens.TableRow<string>): string {
    return `<tr>${text}</tr>\n`;
  };

  // TableCell: uses tokens array for content
  renderer.tablecell = function(token: Tokens.TableCell): string {
    const text = this.parser.parseInline(token.tokens);
    const tag = token.header ? 'th' : 'td';
    const alignStyle = token.align ? ` style="text-align:${token.align}"` : '';
    return `<${tag}${alignStyle}>${text}</${tag}>`;
  };

  // Code block: uses text directly (skip syntax highlighting to reduce size)
  renderer.code = function({ text }: Tokens.Code): string {
    // Escape HTML entities
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre><code>${escaped}</code></pre>\n`;
  };

  // Codespan: uses text directly
  renderer.codespan = function({ text }: Tokens.Codespan): string {
    return `<code>${text}</code>`;
  };

  // Image: uses href, title, and text (alt)
  renderer.image = function({ href, title, text }: Tokens.Image): string {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<img src="${href}" alt="${text}"${titleAttr}>\n`;
  };

  // Link: uses tokens array for content
  renderer.link = function({ href, title, tokens }: Tokens.Link): string {
    const text = this.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}"${titleAttr}>${text}</a>`;
  };

  // HR: no content
  renderer.hr = function(): string {
    return `<hr>\n`;
  };

  return renderer;
}

// Get WeChat access token
async function getAccessToken(): Promise<string> {
  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Missing WECHAT_APP_ID or WECHAT_APP_SECRET');
  }

  const url = `${WECHAT_TOKEN_URL}?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

  const response = await fetch(url);
  const data = await response.json() as WeChatTokenResponse;

  if (data.errcode) {
    throw new Error(`WeChat API error: ${data.errmsg} (code: ${data.errcode})`);
  }

  if (!data.access_token) {
    throw new Error('Failed to get access token');
  }

  return data.access_token;
}

// Upload article content image to WeChat and get URL (for images inside article)
async function uploadArticleImageToWeChat(accessToken: string, imageUrl: string): Promise<string> {
  console.log('Uploading article image to WeChat...');
  console.log('Image URL:', imageUrl);

  // Download image from URL
  let imageBuffer: Buffer;
  let contentType = 'image/png';

  if (imageUrl.startsWith('data:')) {
    // Handle base64 data URL
    const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URL format');
    }
    contentType = matches[1];
    imageBuffer = Buffer.from(matches[2], 'base64');
  } else if (imageUrl.startsWith('/data/') || imageUrl.startsWith('./data/')) {
    // Handle local file path
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
    console.log('Local image loaded, size:', imageBuffer.length, 'bytes');
  } else if (imageUrl.startsWith('https://storage.googleapis.com/')) {
    // Download from GCS URL
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    imageBuffer = Buffer.from(response.data);
    contentType = response.headers['content-type'] || 'image/png';
    console.log('GCS image downloaded, size:', imageBuffer.length, 'bytes');
  } else {
    // Download from other URL using axios
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    imageBuffer = Buffer.from(response.data);
    contentType = response.headers['content-type'] || 'image/png';
  }

  console.log('Image downloaded, size:', imageBuffer.length, 'bytes, type:', contentType);

  // Upload to WeChat using uploadimg API (returns URL, not media_id)
  const url = `${WECHAT_UPLOADIMG_URL}?access_token=${accessToken}`;
  const extension = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
  const filename = `article_img_${Date.now()}.${extension}`;

  const formData = new FormData();
  formData.append('media', imageBuffer, {
    filename: filename,
    contentType: contentType,
  });

  const uploadResponse = await axios.post(url, formData, {
    headers: {
      ...formData.getHeaders(),
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const result = uploadResponse.data as WeChatUploadImgResponse;

  if (result.errcode) {
    throw new Error(`WeChat uploadimg error: ${result.errmsg} (code: ${result.errcode})`);
  }

  if (!result.url) {
    throw new Error('Failed to get URL from WeChat uploadimg');
  }

  console.log('Article image uploaded, WeChat URL:', result.url);
  return result.url;
}

// Upload image to WeChat and get media_id (for cover image)
async function uploadImageToWeChat(accessToken: string, imageUrl: string): Promise<string> {
  console.log('Uploading cover image to WeChat...');
  console.log('Image URL:', imageUrl);

  // Download image from URL
  let imageBuffer: Buffer;
  let contentType = 'image/png';

  if (imageUrl.startsWith('data:')) {
    // Handle base64 data URL
    const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URL format');
    }
    contentType = matches[1];
    imageBuffer = Buffer.from(matches[2], 'base64');
  } else if (imageUrl.startsWith('/data/') || imageUrl.startsWith('./data/')) {
    // Handle local file path
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
    console.log('Local image loaded, size:', imageBuffer.length, 'bytes');
  } else {
    // Download from URL using axios
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    imageBuffer = Buffer.from(response.data);
    contentType = response.headers['content-type'] || 'image/png';
  }

  console.log('Image downloaded, size:', imageBuffer.length, 'bytes, type:', contentType);

  // Upload to WeChat using FormData with axios
  const url = `${WECHAT_MEDIA_UPLOAD_URL}?access_token=${accessToken}&type=image`;
  const extension = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
  const filename = `cover.${extension}`;

  const formData = new FormData();
  formData.append('media', imageBuffer, {
    filename: filename,
    contentType: contentType,
  });

  const uploadResponse = await axios.post(url, formData, {
    headers: {
      ...formData.getHeaders(),
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const result = uploadResponse.data as WeChatMediaResponse;

  if (result.errcode) {
    throw new Error(`WeChat media upload error: ${result.errmsg} (code: ${result.errcode})`);
  }

  if (!result.media_id) {
    throw new Error('Failed to get media_id from WeChat');
  }

  console.log('Cover image uploaded, media_id:', result.media_id);
  return result.media_id;
}

// Process markdown to upload all images to WeChat and replace URLs
async function processMarkdownImages(accessToken: string, markdownContent: string): Promise<string> {
  console.log('Processing markdown images for WeChat...');

  // Find all markdown image patterns: ![alt](url) or ![alt](url "title")
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;

  // Collect all unique image URLs
  const imageUrls = new Set<string>();
  let match;
  while ((match = imagePattern.exec(markdownContent)) !== null) {
    const imageUrl = match[2];
    // Only process local or GCS URLs (skip already-uploaded WeChat URLs)
    if (!imageUrl.startsWith('http://mmbiz.') && !imageUrl.startsWith('https://mmbiz.')) {
      imageUrls.add(imageUrl);
    }
  }

  const imageUrlArray = Array.from(imageUrls);
  console.log(`Found ${imageUrlArray.length} images to upload to WeChat`);

  if (imageUrlArray.length === 0) {
    return markdownContent;
  }

  // Upload each image and create a mapping
  const urlMapping: Record<string, string> = {};

  for (const originalUrl of imageUrlArray) {
    try {
      console.log(`Uploading image: ${originalUrl}`);
      const wechatUrl = await uploadArticleImageToWeChat(accessToken, originalUrl);
      urlMapping[originalUrl] = wechatUrl;
    } catch (error) {
      console.error(`Failed to upload image ${originalUrl}:`, error);
      // Keep original URL if upload fails
    }
  }

  // Replace all image URLs in markdown
  let processedContent = markdownContent;
  for (const originalUrl of Object.keys(urlMapping)) {
    const wechatUrl = urlMapping[originalUrl];
    // Escape special regex characters in URL
    const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replacePattern = new RegExp(escapedUrl, 'g');
    processedContent = processedContent.replace(replacePattern, wechatUrl);
  }

  console.log('Markdown images processed successfully');
  return processedContent;
}

// Render markdown to HTML using built-in marked library
async function renderMarkdownToHtml(markdownContent: string): Promise<string> {
  // Validate content
  if (!markdownContent || markdownContent.trim().length === 0) {
    throw new Error('Article content is empty. Please generate article content before publishing.');
  }

  // Check if content looks like base64 image data (common mistake)
  if (markdownContent.startsWith('data:image/')) {
    throw new Error('Article content appears to be image data, not article text. Please ensure you have generated article content.');
  }

  const renderer = createWeChatRenderer();

  marked.setOptions({
    renderer,
    gfm: true,
    breaks: false,
    async: true,
  });

  // marked.parse() returns Promise in v17+, must await it
  const htmlBody = await marked.parse(markdownContent);

  // Validate rendered HTML
  if (!htmlBody || htmlBody.trim().length === 0) {
    throw new Error('Failed to render markdown to HTML. The rendered content is empty.');
  }

  // Combine CSS styles with HTML body in a wrapper div
  const fullHtml = `${WECHAT_CSS}<section class="wx-article">${htmlBody}</section>`;

  // Check content size
  const contentSize = Buffer.byteLength(fullHtml, 'utf8');
  console.log('HTML content size:', contentSize, 'bytes');

  if (contentSize > WECHAT_CONTENT_SIZE_LIMIT) {
    console.warn(`Warning: Content size (${contentSize} bytes) exceeds WeChat limit (${WECHAT_CONTENT_SIZE_LIMIT} bytes)`);
    throw new Error(`Article content is too large (${Math.round(contentSize / 1024)}KB). WeChat limit is approximately ${Math.round(WECHAT_CONTENT_SIZE_LIMIT / 1024)}KB. Please shorten the article.`);
  }

  console.log('Markdown rendered successfully, HTML preview (first 500 chars):', fullHtml.substring(0, 500));

  return fullHtml;
}

// Create draft in WeChat
async function createDraft(
  accessToken: string,
  title: string,
  content: string,
  thumbMediaId?: string
): Promise<string> {
  const url = `${WECHAT_DRAFT_URL}?access_token=${accessToken}`;

  const article = {
    title,
    author: '',
    digest: '',
    content,
    content_source_url: '',
    thumb_media_id: thumbMediaId || '',
    need_open_comment: 0,
    only_fans_can_comment: 0,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articles: [article] }),
  });

  const data = await response.json() as WeChatDraftResponse;

  if (data.errcode) {
    throw new Error(`WeChat draft error: ${data.errmsg} (code: ${data.errcode})`);
  }

  return data.media_id || '';
}

export async function publishToWeChat(
  articleMarkdown: string,
  title: string,
  coverImagePath: string,
  theme: string = 'default',
  codeTheme: string = 'github'
): Promise<void> {
  console.log('Starting WeChat publish...');
  console.log('Title:', title);
  console.log('Cover image path:', coverImagePath);
  console.log('Markdown length:', articleMarkdown.length);

  try {
    // Step 1: Get access token
    console.log('Getting access token...');
    const accessToken = await getAccessToken();
    console.log('Access token obtained');

    // Step 2: Upload cover image if provided
    let thumbMediaId = '';
    if (coverImagePath && coverImagePath.trim()) {
      console.log('Uploading cover image...');
      thumbMediaId = await uploadImageToWeChat(accessToken, coverImagePath);
    } else {
      console.log('No cover image provided, skipping upload');
    }

    // Step 3: Process article images - upload to WeChat and replace URLs
    console.log('Processing article images...');
    const processedMarkdown = await processMarkdownImages(accessToken, articleMarkdown);
    console.log('Article images processed');

    // Step 4: Render markdown to HTML
    console.log('Rendering markdown to HTML...');
    const htmlContent = await renderMarkdownToHtml(processedMarkdown);
    console.log('HTML rendered, length:', htmlContent.length);

    // Step 5: Create draft
    console.log('Creating draft...');
    if (!thumbMediaId) {
      throw new Error('Cover image (thumb_media_id) is required for WeChat drafts. Please generate or upload a cover image first.');
    }
    const mediaId = await createDraft(accessToken, title, htmlContent, thumbMediaId);
    console.log('Draft created successfully! Media ID:', mediaId);

  } catch (error) {
    console.error('Publish failed:', error);
    throw error;
  }
}

export async function checkWenyanInstalled(): Promise<boolean> {
  // No longer needed as we use built-in rendering
  return true;
}
