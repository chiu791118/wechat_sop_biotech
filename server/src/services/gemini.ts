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
// Writing Style Requirements
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
// Research Framework Generation
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
// Storyline Generation
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
// Article Generation
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
// Image Text Generation
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
// Article Skeleton Generation
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
// Image Prompts Generation
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
// Image Generation
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

export async function generateBlockImage(imagePrompt: string, index: number): Promise<{ url: string; index: number }> {
  const fullPrompt = `Generate Image: Create a professional scientific infographic or data visualization
using ONLY the information explicitly provided in the Image Block Content.

Image Block Content is the sole source of truth for this image.
You may only reorganize, summarize, and visualize what is already present
in the Image Block Content.

Content focus:
${imagePrompt}

Use the Image Block Content to define the topic and structure the overall thought.

MUST Follow the Given "Style Spec".
Be thoughtful and exhaustive strictly within the bounds of the Image Block Content.
Minimize ALL textual redundancies in the output.
Avoid ALL ambiguities.

Hard Constraint:
Do NOT introduce any facts, numbers, names, categories, interpretations,
or claims that are not explicitly present in the Image Block Content.

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
- No cityscapes, light effects, or technology aesthetics
- No decorative icons
- No exaggeration or dramatization

The image must be interpretable as a scientific explanatory figure,
not a marketing or summary graphic.

Source Line Rule (MUST):
1. In the footer source position, output a single line beginning with 来源：.
2. Automatically extract and list all explicitly mentioned sources from the Image Block Content
   (e.g., 年报/财报/招股书/公告/官网/研报/数据库/统计机构/媒体与报告标题等).
3. De-duplicate extracted sources while preserving first-appearance order.
4. Use the Chinese semicolon ； to separate items.
5. Always end the source line with 桌面研究；久谦中台 (exactly once).
6. If no explicit sources are found, output exactly:
   来源：桌面研究；久谦中台
7. Do NOT add quotation marks anywhere in the source line.

Style Spec:
1. Purpose and tone: professional, authoritative infographic using a flat aesthetic; data-first layouts with consistent rules so all agents produce identical outputs. All visible text must be in Simplified Chinese (titles, labels, legends, footnotes, sources, and annotations).
2. Canvas and layout: 16:9 aspect (default 1920x1080 px). Margins 24 px on all sides. Chart Title headline at top-left with optional subtitle below. Chart Footer line at bottom left for BOTH footnotes and source (place footnote at one line above source). Default legend top-right inside the chart; if space is constrained, place it below the chart.
3. Typography: Microsoft YaHei (微软雅黑). Font sizes at 1920x1080: title 24px, subtitle 10, body and labels 10 px, axis ticks and legend 8px, footnotes 8 px. Title weight 600; other text 150. Use these sizes only and keep a consistent hierarchy. Left-align labels and values. Avoid mixed fonts.
4. Color system overview: Built on a clinical foundation of paper white and structure gray, this palette prioritizes content through high-contrast neutrality. Ink black softens the reading experience, while slate defines secondary hierarchy. Color serves a strict utility: Deep navy anchors the design, and alert red acts as a deliberate disruption for urgency, resulting in a distraction-free aesthetic governed purely by function.
5. Encodings and strokes: Use color to differentiate categories or phases; use size, area, or line thickness to encode magnitude. Default strokes: data lines 2 px (emphasis 3 px), axes 0.5 px, gridlines 0.5 px. Points are 4 px circles, bars have 8 px gaps and 0.5 px corner radius (sharp edges), area fills at 75% opacity. MUST Not Have gradients, glows, or ANY heavy effects.
6. Numbers, dates, and units (Chinese conventions): Use Arabic numerals; prefer scaled units 万 or 亿 to shorten large values (e.g., 2.35亿). If not scaled, use comma thousands separator (12,345). Decimals: 1 place for KPIs, 2 for financials. Percent format: 12.3%. Dates: YYYY年M月 (e.g., 2025年1月) or YYYY年Qx季度 for quarters. Currency: prefix with ¥ (e.g., ¥2.3亿). Use Chinese labels for axes, legends, and notes; employ the Chinese colon "：" in label pairs. Always state measurement units in axis titles or subtitles; place assumptions in footnotes.`;

  const result = await generateImage(fullPrompt, `block_${index}`);
  return { url: result.imageUrl, index };
}

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
// LLM Call Functions
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
