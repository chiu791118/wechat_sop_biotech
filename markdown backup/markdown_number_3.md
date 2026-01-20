# Vibe Coding 提示词 - 公众号自动化SOP系统 (v2.8)

## 项目概述

这是一个基于 AI 的微信公众号投研文章自动化生成与发布系统。系统通过多步骤工作流，从公司研究框架生成到最终发布到微信公众号草稿箱，实现全流程自动化。

### 核心功能
- 研究框架自动生成（11点框架体系）
- PDF研究报告解析与提取
- AI驱动的 Storyline 生成
- 专业投研文章自动撰写（7000字+）
- 智能配图生成与插入（麦肯锡风格 PPT）
- 一键发布到微信公众号草稿箱

### 版本历史
- **v2.8**: 更新 prompts、修复状态管理 bug、切换图片生成模型
- **v2.7**: generateSingleImagePrompt 改为麦肯锡风格标题
- **v2.6**: generateImageText 更新选择标准
- **v2.5**: generateBlockImage 添加 Style Spec

---

## 技术架构

### 整体架构
```
┌─────────────────────────────────────────────────────────────────┐
│                        前端 (React + TypeScript)                 │
│   React 18 | Ant Design 5 | Vite | Zustand (状态管理)           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        后端 (Node.js + Express)                  │
│   Express.js | TypeScript | Multer (文件上传) | pdf-parse        │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌───────────┐   ┌───────────┐   ┌───────────┐
        │ DeepSeek  │   │  Gemini   │   │  WeChat   │
        │   API     │   │   API     │   │   API     │
        │ (主模型)   │   │ (备用/图片) │   │ (发布)    │
        └───────────┘   └───────────┘   └───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Google Cloud Storage  │
                    │     (图片/数据持久化)   │
                    └───────────────────────┘
```

### 目录结构
```
wechat-sop-biotech/
├── client/                          # 前端应用
│   ├── src/
│   │   ├── components/              # React 组件
│   │   │   ├── Login.tsx            # 登录组件
│   │   │   ├── CompanyInput.tsx     # 公司名称输入 (Step 1)
│   │   │   ├── FileDownload.tsx     # 框架文件下载 (Step 2)
│   │   │   ├── PdfUpload.tsx        # PDF上传 (Step 3)
│   │   │   ├── ArticlePreview.tsx   # 文章预览与生成 (Step 4)
│   │   │   ├── ArticleSplit.tsx     # 文章分割处理 (Step 5)
│   │   │   ├── ImageGeneration.tsx  # 配图生成 (Step 6)
│   │   │   ├── PublishPanel.tsx     # 发布面板 (Step 7)
│   │   │   └── ArticleSidebar.tsx   # 文章项目侧边栏
│   │   ├── stores/
│   │   │   └── useStore.ts          # Zustand 状态管理
│   │   ├── services/
│   │   │   └── api.ts               # API 服务层
│   │   └── App.tsx                  # 主应用组件
│   ├── vite.config.ts               # Vite 配置
│   └── package.json
│
├── server/                          # 后端服务
│   ├── src/
│   │   ├── index.ts                 # Express 服务器入口
│   │   ├── env.ts                   # 环境变量加载
│   │   ├── routes/
│   │   │   └── api.ts               # API 路由 (20+ 端点)
│   │   └── services/
│   │       ├── gemini.ts            # AI 模型调用服务（含所有 Prompts）
│   │       ├── storage.ts           # GCS 存储服务
│   │       ├── wenyan.ts            # 微信发布服务
│   │       └── pdf.ts               # PDF 解析服务
│   └── package.json
│
├── .env                             # 环境变量配置
└── Prompt_Research_frame.txt        # 研究框架提示词模板
```

---

## 核心工作流 (7步骤)

### Step 1: 输入公司名称
- 用户输入目标研究公司名称
- 系统调用 AI 生成 11 点研究框架
- 框架分割为上半段(1-10)和下半段(11-竞争分析)

### Step 2: 下载框架文件
- 提供 TXT 格式框架文件下载
- 用户手动在 Gemini DeepResearch 执行深度研究
- 合并研究结果为 PDF

### Step 3: 上传研究 PDF
- 上传合并后的研究 PDF
- 系统提取 PDF 文本内容
- 支持预览提取结果

### Step 4: 生成文章
- 生成 180 字 Storyline（叙事主线）
- 根据 Storyline 和研究资料生成完整文章
- 支持参考文风文章上传
- 支持 DeepSeek/Gemini 模型切换
- 支持文章润色功能

### Step 5: 文章分割与配图 Prompt
- 生成生图文本（标记适合 PPT 展示的段落）
- 生成文章骨架（用占位符替换图片段落）
- 生成生图 Prompt（麦肯锡风格标题 + 完整数据）

### Step 6: 生成配图
- 批量生成配图（gemini-3-pro-image-preview）
- 配图插入骨架生成最终文章

### Step 7: 发布/下载
- AI 生成封面图片
- 选择排版主题和代码高亮主题
- 发布到微信草稿箱
- 下载最终 Markdown 文件

---

## 系统提示词完整收录

### 1. 研究框架生成提示词 (Prompt_Research_frame.txt)

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
2. **Mechanism of Action (Core)**
3. **Asset / Platform Architecture**
4. **Preclinical Evidence**
5. **Clinical Development Status**
6. **Clinical Efficacy Signals**
7. **Safety & Tolerability**
8. **Differentiation vs Competitors**
9. **Regulatory Pathway**
10. **Commercialization Logic**
11. **Key Risks & Failure Modes**

# Final Requirement
- Use Chinese.
- Be explicit where data is missing or ambiguous.
- Avoid promotional language.
- Output ONLY the Research Directive inside a code block.
```

---

### 2. Storyline 生成提示词

```
我正在为一家生物科技公司的研究报告撰写一份研究综述。
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

请严格遵循要求输出storyline：
```

---

### 3. 写作风格要求 (WRITING_STYLE_REQUIREMENTS)

```
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
```

---

### 4. 文章生成提示词

```
Please think in English and output in Chinese.
You are writing for professional biotech investors and industry experts. Give yourself more time to think before you start writing.

请严格遵循每条写作要求，依据以下【Storyline】写一篇适合传播且具备专业性的微信公众号公关稿。

## Storyline（文章核心叙事线）：
${storyline}

## 参考文章（具体行文格式可参考此文）：
${referenceArticle.substring(0, 10000)}

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

请直接输出Markdown格式的文章：
```

---

### 5. 文章润色提示词

```
Please think in English and output in Chinese. Give yourself more time to think before you start writing.

你是一位资深的投资分析公众号编辑。请对以下初稿文章进行二次润色，严格按照写作要求调整格式和风格。

## 【最重要】字数要求：
- 原文字数约 ${originalWordCount} 字
- 润色后的文章必须保持相近的字数（允许±10%浮动）
- 不要大幅缩减内容，也不要过度扩充

## 参考文章（具体行文格式可参考此文）：
${referenceArticle.substring(0, 10000)}

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

请直接输出润色后的Markdown格式文章：
```

---

### 6. 生图文本生成提示词 (v2.6)

```
Please think in English and output in Chinese. Give yourself more time to think before you start writing.
第一步：请你浏览全文，筛选出其中你认为信息密度过高、文字阅读体验不好、可读性最差、适合用PPT呈现的段落/ 章节们，以及所有表格；你至多可以选择2000字左右的段落/ 章节（表格必选），但需要至少选择出5个段落
满足以下至少一项条件的内容優先：
1. 机制路径、靶点作用逻辑、信号通路描述
2. 临床试验设计（入组标准、终点、分组）
3. 临床结果的数据性总结（有效性 / 安全性）
4. 管线结构、适应症扩展逻辑
5. 多药物 / 多机制的对比信息
第二步：在原文中增加特殊段落标记，把你筛选出的内容用三个中括号括起来，其他内容一个字都不要修改

第三步：在每个被标记段落前，用不超过100字的中文，概括该段落**希望通过图示澄清的科学或临床问题**。
概括必须是完整句子，不得使用营销或宣传语言。

第四步：输出加上概括、打上特殊段落标记的全文，再次注意：除了概括与特殊标记，其他一个字都不要修改，且"【【【""】】】"必须成对出现

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

请开始处理：
```

---

### 7. 生图 Prompt 生成提示词 (v2.8)

```
Please think in English and output in Chinese. Give yourself more time to think before you start writing.

你的任务是为以下段落生成一个用于图片生成的完整指令包。

# 输入段落：
${content}

# 概括：
${summary}

# 输出要求：
请按以下格式输出，确保包含所有原始数据：

【标题】
生成一个麦肯锡风格的PPT标题，直接表明观点或事实（中文）

【可视化类型】
根据内容选择最合适的类型（只选一个）：
- 表格：适合多维度对比数据
- 流程图：适合机制路径、信号通路
- 时间线：适合临床试验阶段
- 柱状图/折线图：适合数值变化趋势
- 结构图：适合管线与适应症关系

【完整数据内容】
将原文中所有具体数据、数值、名称、分类完整列出，不要省略任何信息。
如果是表格，请用 markdown 表格格式呈现。
如果是流程/结构，请用层级列表呈现。

禁止事项：
- 禁止省略原文中的任何数据
- 禁止生成抽象概念图
- 禁止补充原文中不存在的数据

请开始输出：
```

---

### 8. 配图生成提示词 (v2.5 Style Spec)

```
Generate Image: Create a professional scientific infographic or data visualization
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
3. De-duplicate extracted sources while preserving first-appearance order.
4. Use the Chinese semicolon ； to separate items.
5. Always end the source line with 桌面研究；久谦中台 (exactly once).
6. If no explicit sources are found, output exactly: 来源：桌面研究；久谦中台
7. Do NOT add quotation marks anywhere in the source line.

Style Spec:
1. Purpose and tone: professional, authoritative infographic using a flat aesthetic; data-first layouts with consistent rules so all agents produce identical outputs. All visible text must be in Simplified Chinese (titles, labels, legends, footnotes, sources, and annotations).
2. Canvas and layout: 16:9 aspect (default 1920x1080 px). Margins 24 px on all sides. Chart Title headline at top-left with optional subtitle below. Chart Footer line at bottom left for BOTH footnotes and source (place footnote at one line above source). Default legend top-right inside the chart; if space is constrained, place it below the chart.
3. Typography: Microsoft YaHei (微软雅黑). Font sizes at 1920x1080: title 24px, subtitle 10, body and labels 10 px, axis ticks and legend 8px, footnotes 8 px. Title weight 600; other text 150. Use these sizes only and keep a consistent hierarchy. Left-align labels and values. Avoid mixed fonts.
4. Color system overview: Built on a clinical foundation of paper white and structure gray, this palette prioritizes content through high-contrast neutrality. Ink black softens the reading experience, while slate defines secondary hierarchy. Color serves a strict utility: Deep navy anchors the design, and alert red acts as a deliberate disruption for urgency, resulting in a distraction-free aesthetic governed purely by function.
5. Encodings and strokes: Use color to differentiate categories or phases; use size, area, or line thickness to encode magnitude. Default strokes: data lines 2 px (emphasis 3 px), axes 0.5 px, gridlines 0.5 px. Points are 4 px circles, bars have 8 px gaps and 0.5 px corner radius (sharp edges), area fills at 75% opacity. MUST Not Have gradients, glows, or ANY heavy effects.
6. Numbers, dates, and units (Chinese conventions): Use Arabic numerals; prefer scaled units 万 or 亿 to shorten large values (e.g., 2.35亿). If not scaled, use comma thousands separator (12,345). Decimals: 1 place for KPIs, 2 for financials. Percent format: 12.3%. Dates: YYYY年M月 (e.g., 2025年1月) or YYYY年Qx季度 for quarters. Currency: prefix with ¥ (e.g., ¥2.3亿). Use Chinese labels for axes, legends, and notes; employ the Chinese colon "：" in label pairs. Always state measurement units in axis titles or subtitles; place assumptions in footnotes.
```

---

### 9. 封面图片生成提示词 (v2.8)

```
A stunning, photorealistic hero image for a premium business magazine cover.

Scene: ${themeKeywords}

Style specifications:
- Minimalist, restrained, research-oriented
- Soft, neutral color palette
- Flat or lightly dimensional scientific illustration style
- Professional photography quality, 8K resolution
- Aspect ratio 16:9 landscape format
- Modern corporate aesthetic, Fortune 500 magazine quality

Theme:
${themeKeywords}

Allowed elements:
- Molecular structures (schematic, not photorealistic)
- Cells, antibodies, proteins (simplified, educational)
- Abstract biological patterns with clear scientific reference

Strict prohibitions:
- No futuristic cityscapes
- No holograms, data streams, or glowing effects
- No people, faces, or body parts
- No text, numbers, logos

The image should convey scientific seriousness and analytical intent, not innovation hype.
```

---

### 10. 主题关键词映射 (用于封面图片生成)

```javascript
const conceptMap: Record<string, string> = {
  // 疾病与治疗领域
  '肿瘤': 'schematic representation of tumor cells and immune interaction',
  '肿瘤免疫': 'immune cells interacting with cancer cells, educational scientific style',
  '自身免疫': 'immune dysregulation illustrated through immune cell signaling pathways',
  '神经疾病': 'simplified neuronal networks and synaptic structures',
  '罕见病': 'genetic pathways and cellular dysfunction illustrated in a medical textbook style',
  '炎症': 'inflammatory signaling pathways at cellular level',
  '代谢疾病': 'metabolic pathways illustrated with organs and molecular interactions',

  // 药物类型 / 技术路线
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

// 默认主题
'minimalist scientific illustration inspired by biology and medicine, neutral academic research tone'
```

---

## AI 模型配置

### 双 LLM 系统
系统采用主备双模型架构，确保服务稳定性：

#### 主模型：DeepSeek (deepseek-reasoner)
- 用于复杂推理任务
- Storyline 生成
- 文章撰写
- 文章润色

#### 备用模型：Google Gemini
- **gemini-2.0-flash**: 快速结构化任务（框架生成、生图文本、生图Prompt）
- **gemini-3-pro-image-preview**: 配图生成 (v2.8 更新)

### 调用策略
```
1. 复杂推理任务：DeepSeek 优先，2次重试后回退 Gemini
2. 快速任务：Gemini Flash 优先，3次重试后回退 DeepSeek
3. 图片生成：gemini-3-pro-image-preview
```

---

## API 端点参考

### 框架生成
```
POST /api/generate-framework
Body: { companyName: string, articleId?: string }
Response: { sessionId, upperPart, lowerPart, upperPartFile, lowerPartFile }
```

### PDF 上传与处理
```
POST /api/upload-research
Form: file (PDF), companyName, sessionId, articleId
Response: { researchId, extractedText, textLength }

POST /api/upload-reference
Form: file (PDF)
Response: { referenceId, extractedText, fullText }
```

### Storyline 生成
```
POST /api/generate-storyline
Body: { researchId, companyName, articleId }
Response: { storyline, companyName }
```

### 文章生成
```
POST /api/generate-article
Body: { companyName, researchId, storyline, referenceArticle?, model, articleProjectId }
Response: { articleId, articleMarkdown, companyName }

POST /api/polish-article
Body: { articleMarkdown, referenceArticle?, model }
Response: { polishedMarkdown }
```

### 文章分割
```
POST /api/split-article
Body: { articleMarkdown, articleProjectId }
Response: { imageText, articleSkeleton, imagePrompts }

POST /api/generate-image-text
Body: { articleMarkdown, articleProjectId }
Response: { imageText }

POST /api/generate-article-skeleton
Body: { articleMarkdown, imageText, articleProjectId }
Response: { articleSkeleton }

POST /api/generate-image-prompts
Body: { imageText, articleProjectId }
Response: { imagePrompts, paragraphCount }
```

### 图片生成
```
POST /api/generate-cover
Body: { title, summary }
Response: { imageUrl, mimeType }

POST /api/generate-images
Body: { imagePrompts, articleId }
Response: { totalBlocks, generatedImages[] }

POST /api/finalize-article
Body: { articleSkeleton, imagePaths[], articleId }
Response: { finalArticle }
```

### 发布
```
POST /api/publish-draft
Body: { articleMarkdown, title, coverImagePath, theme, codeTheme }
Response: { success, message }
```

### 文章管理
```
GET /api/articles                    # 获取所有文章项目
POST /api/articles                   # 创建新文章项目
GET /api/articles/:id                # 获取单个文章
PUT /api/articles/:id                # 更新文章
```

### 认证
```
POST /api/auth/login
Body: { username, password }
Response: { user: { username, role } }

POST /api/auth/check-permission
Body: { role, feature }
Response: { allowed: boolean }
```

---

## 环境变量配置

### 必需变量
```env
# AI 模型 API Keys
GEMINI_API_KEY=your_gemini_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key

# 微信公众号配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret

# Google Cloud Storage
GCS_BUCKET_NAME=your_bucket_name
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcs-credentials.json
```

### 可选变量
```env
PORT=3001                            # 服务端口
NODE_ENV=development                 # 环境模式
UPLOAD_DIR=./uploads                 # 上传目录
DOWNLOAD_DIR=./downloads             # 下载目录
HTTP_PROXY=http://proxy:port         # 代理设置 (中国大陆用户)
HTTPS_PROXY=http://proxy:port        # HTTPS代理
```

---

## 本地开发

### 快速启动
```bash
# 安装依赖
npm install
npm run install:all

# 启动开发服务器
npm run dev
```

### 开发服务器
- 前端：http://localhost:5174 (Vite HMR)
- 后端：http://localhost:3001 (Express)
- API 代理：前端自动代理 /api 到后端

---

## 数据持久化

### Google Cloud Storage 存储结构
```
wechat-sop-data/
├── data/
│   ├── articles.json          # 文章项目列表
│   └── users.json             # 用户账户数据
└── files/
    ├── cover_*.png            # 封面图片
    └── block_*.png            # 配图
```

### 缓存策略
- 内存缓存 TTL：5秒
- 减少 GCS API 调用
- 写入时同步更新缓存

---

## 用户权限系统

### 角色定义
| 角色 | 权限 |
|------|------|
| admin | 全部功能 |
| advanced | 全部功能 |
| user | 除图片生成外的功能 |

### 默认账户
```
admin / admin123
advanced / advanced123
user / user123
```

---

## 关键服务实现

### AI 调用服务 (gemini.ts)
- `generateResearchFramework()` - 生成研究框架
- `generateStoryline()` - 生成叙事主线
- `generateArticle()` - 生成完整文章
- `polishArticle()` - 文章润色
- `generateImageText()` - 生成生图文本 (v2.6)
- `generateArticleSkeleton()` - 生成文章骨架（规则方法）
- `extractImageParagraphs()` - 提取生图段落（规则方法）
- `generateImagePrompts()` - 生成配图提示词
- `generateSingleImagePrompt()` - 单个配图 Prompt (v2.8)
- `generateBlockImage()` - 单张配图生成 (v2.5 Style Spec)
- `generateCoverImage()` - 封面图生成 (v2.8)
- `callDeepSeek()` - DeepSeek API 调用
- `callGemini()` - Gemini API 调用
- `callLLMWithFallback()` - DeepSeek 主 + Gemini 备
- `callLLMFast()` - Gemini Flash 主 + DeepSeek 备

### 存储服务 (storage.ts)
- GCS 读写封装
- 文章项目 CRUD
- 用户认证
- 文件上传与公共 URL 生成

### 发布服务 (wenyan.ts)
- Markdown 转 HTML（自定义 renderer）
- WeChat-compatible CSS 样式
- 图片上传到微信服务器
- 草稿箱发布

---

## 常用命令

```bash
# 本地开发
npm run dev                          # 同时启动前后端
npm run dev:client                   # 仅启动前端
npm run dev:server                   # 仅启动后端

# 构建
npm run build                        # 构建生产版本
npm run build:client                 # 构建前端
npm run build:server                 # 构建后端

# 端口被占用时
lsof -ti :3001 | xargs kill -9       # 杀掉 3001 端口进程
```

---

## 故障排查

### 常见问题

1. **PDF 解析失败**
   - 检查 PDF 是否为扫描版（需 OCR）
   - 确认文件大小不超过 50MB

2. **AI 模型调用失败**
   - 检查 API Key 是否有效
   - 确认网络可访问 API 端点
   - 中国大陆用户需配置代理

3. **微信发布失败**
   - 确认 IP 已添加到白名单
   - 检查 APP_ID 和 APP_SECRET 是否正确
   - 确认封面图已生成

4. **图片生成失败**
   - 确认用户有 imageGeneration 权限
   - 检查 Gemini API 配额
   - 网络问题会自动重试

5. **新建文章显示旧内容**
   - v2.8 已修复：createArticle 现在会重置所有状态
   - 刷新页面后重试

6. **公司名称回到上一个文章**
   - v2.8 已修复：generateFramework 现在会保留 companyName

---

*本文档为 Vibe Coding 提示词 v2.8，帮助开发者快速理解项目架构并进行二次开发。*
*更新日期：2026-01-17*
