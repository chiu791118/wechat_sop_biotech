# Vibe Coding 提示词 - 公众号自动化SOP系统

## 项目概述

这是一个基于 AI 的微信公众号投研文章自动化生成与发布系统。系统通过多步骤工作流，从公司研究框架生成到最终发布到微信公众号草稿箱，实现全流程自动化。

### 核心功能
- 研究框架自动生成（11点框架体系）
- PDF研究报告解析与提取
- AI驱动的 Storyline 生成
- 专业投研文章自动撰写（7000字+）
- 智能配图生成与插入
- 一键发布到微信公众号草稿箱

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
                    │     (数据持久化)        │
                    └───────────────────────┘
```

### 目录结构
```
wechat-sop/
├── client/                          # 前端应用
│   ├── src/
│   │   ├── components/              # React 组件
│   │   │   ├── Login.tsx            # 登录组件
│   │   │   ├── CompanyInput.tsx     # 公司名称输入
│   │   │   ├── FileDownload.tsx     # 框架文件下载
│   │   │   ├── PdfUpload.tsx        # PDF上传
│   │   │   ├── ArticlePreview.tsx   # 文章预览与生成
│   │   │   ├── ArticleSplit.tsx     # 文章分割处理
│   │   │   ├── ImageGeneration.tsx  # 配图生成
│   │   │   ├── PublishPanel.tsx     # 发布面板
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
│   │   ├── routes/
│   │   │   └── api.ts               # API 路由 (20+ 端点)
│   │   └── services/
│   │       ├── gemini.ts            # AI 模型调用服务（含 DeepSeek）
│   │       ├── storage.ts           # GCS 存储服务
│   │       ├── wenyan.ts            # 微信发布服务
│   │       ├── deepresearch.ts      # Gemini DeepResearch 服务（两阶段研究）
│   │       ├── framework.ts         # 框架分割服务
│   │       └── pdf.ts               # PDF 解析服务
│   └── package.json
│
├── Dockerfile                       # Docker 多阶段构建
├── cloudbuild.yaml                  # Google Cloud Build 配置
├── deploy.bat                       # Windows 部署脚本
├── start-local.bat                  # 本地开发启动脚本
└── Prompt_Research_frame.txt        # 研究框架提示词模板
```

---

## 核心工作流 (7步骤)

### Step 0: 用户登录
- 用户认证（用户名/密码）
- 角色权限管理（admin/advanced/user）
- 图片生成功能仅对 admin 和 advanced 用户开放

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

### Step 5: 文章分割与配图
- 生成生图文本（标记适合 PPT 展示的段落）
- 生成文章骨架（用占位符替换图片段落）
- 生成生图 Prompt（麦肯锡风格 PPT 标题）
- 批量生成配图
- 配图插入骨架生成最终文章

### Step 6: 发布/下载
- 上传封面图片
- 选择排版主题和代码高亮主题
- 使用 wenyan-cli 发布到微信草稿箱
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

### 2. Storyline 生成提示词

我正在为一家生物科技公司的研究报告撰写一份研究综述。
请基于以下研究资料，输出一个能够统领全文的biotech研究storyline（180字内）。

## 研究资料：
${researchText}

## 强制要求：
1. storyline必须包含一个结论性主题句，以及最多4个关键研究议题：
   主题句：
   议题1：
   议题2：
   议题3：
   议题4：

2. 主题句必须明确回答：
   “这家公司是否在科学与临床上具备成立基础”

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
8)避免使用"唯一"/ "只能"/"最"等绝对性的表述,必须客观公正,如"唯一方案"="少数高效解决方案";"只能"="当前情况下需要遵从/依赖...";"最强"="最强之一"
9)避免使用"深远""较大"等表意不明的冗余形容词
10)不使用顿号,只使用"/ "做并列概念分隔
11)所有能被数据支撑的观点表述需要使用括号提示数据支撑,如"于22年首发人形产品CyberOne,主打语义识别与情绪感知,但因造价高昂(60万+)未实现量产"
12)禁止使用"体现了"/"彰显了"等表述,改用更客观的表述方法,如"体现了差异化的产品路线"="相较竞品而言,在产品路线上形成差异化竞争"
13)在信息复杂,涉及到对比、演进路线时,需要使用文字+表格的形式,表格提炼关键信息,文字详细阐述
14)禁止使用诸如"三大标准"/ "两大主流方向"/ "两大维度"之类表达,保证表达的信息密度
、语言与表达（强制禁止）
1) 禁止使用任何投资或推广性语言，如：
   “颠覆性”“革命性”“重塑格局”“巨大潜力”
2) 禁止使用未经限定的因果表达，如：
   “因此将”“必然导致”“有望成为标准疗法”
3) 禁止以公司表述替代事实表述
   （如“公司认为”“管理层表示”）
15) 所有临床结果必须明确：
   - Phase
   - 样本量
   - 对照方式
16) 对于尚未验证的推论，必须明确标注为：
   “尚未被临床验证”
17) 不允许省略负面或中性结果
18)对比与演进分析
1) 涉及MOA或疗效对比时，必须明确对照对象
2) 若缺乏head-to-head数据，必须明确说明
3) 不得暗示 superiority，除非有直接证据
19)绝对化与模糊表述（严格禁止）
- 禁止使用：
  “唯一”“最优”“最佳”“唯一可行方案”
- 禁止模糊形容词：
  “显著”“较大”“深远”“强劲”

违反以上任一条，视为不合格输出。
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
${referenceArticle}

## 研究资料（必须全部涵盖，不得遗漏重要信息）：
${researchText}

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
- （重要）文章标题、章节标题禁止使用目录式的名词列举（如:"竞争围城：在成本与可靠性的双重压力下构建护城河"），必须用短句抛出观点/ 问题（如：竞争关键聚焦成本与可靠性）
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
${referenceArticle}

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

### 6. 生图文本生成提示词

```
Please think in English and output in Chinese. Give yourself more time to think before you start writing.
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
- 禁止为了“好看”而选择内容

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

### 7. 生图 Prompt 生成提示词

```
Please think in English and output in Chinese. Give yourself more time to think before you start writing.

你的任务是：从以下【【【】】】标记的段落中，提取**适合用科学示意图或数据图表表达的信息结构**。

提取时，必须优先考虑以下类型（按优先级）：
1. 生物学机制结构（靶点 / 通路 / 作用关系）
2. 临床试验结构（分组、终点、时间线）
3. 临床数据结构（数值、比例、变化趋势）
4. 管线与适应症对应关系

输出规则：
- 如果是数据 → 输出为 Markdown 表格
- 如果是结构 / 机制 → 用清晰的层级结构文字描述
- 如果段落不包含任何可被科学图示的信息 → 明确输出「无可图示的科学结构」

禁止事项：
- 禁止生成抽象概念图
- 禁止生成“愿景型”“总结型”图示
- 禁止补充原文中不存在的数据或结构
```
Generate a professional scientific illustration or data visualization.

Content focus:
${block.content}

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
- No cityscapes, light effects, or “technology aesthetics”
- No decorative icons
- No exaggeration or dramatization

The image must be interpretable as a **scientific explanatory figure**, not a marketing graphic.

---

### 8. 封面图片生成提示词

```
Generate a professional scientific illustration or data visualization.

Content focus:
${block.content}

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
- No cityscapes, light effects, or “technology aesthetics”
- No decorative icons
- No exaggeration or dramatization

The image must be interpretable as a **scientific explanatory figure**, not a marketing graphic.
```

---

### 9. 配图生成提示词

```
A clean, professional cover image suitable for a biotech research report.

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

The image should convey **scientific seriousness and analytical intent**, not innovation hype.
```

【Biotech Visualization Constitution】

1. 所有图像的唯一目的，是帮助理解：
   - 生物学机制
   - 临床试验结构
   - 数据关系

2. 图像不得承担“增强情绪”“制造震撼”的功能

3. 若一段内容无法通过图像提高科学理解：
   - 宁可不画

4. 任何无法被医学或生物专业人士接受的视觉风格：
   - 视为失败输出
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

  // 研发与临床
  '机制': 'biological pathway diagram with clear cause-effect relationships',
  'MOA': 'mechanism of action illustrated as step-by-step biological process',
  '临床一期': 'clinical trial phase I structure with dose escalation schematic',
  '临床二期': 'clinical trial phase II design focusing on efficacy signals',
  '临床三期': 'large-scale randomized clinical trial schematic',
  '安全性': 'adverse event categories illustrated in neutral medical diagrams',
  '有效性': 'clinical endpoint outcome comparison in restrained data visualization',

  // 公司与管线
  '研发管线': 'pipeline overview mapping assets to indications and development stages',
  '平台型公司': 'platform technology branching into multiple therapeutic assets',
  '单一资产公司': 'single core asset progressing across clinical stages',

  // 默认主题（兜底）
  'default': 'minimalist scientific illustration inspired by biology and medicine, neutral and academic tone'
};
};

// 默认主题（Biotech）
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
- gemini-3-pro-preview：快速结构化任务（框架生成、生图文本、生图Prompt）
- gemini-2.0-flash-exp：通用任务、DeepResearch（带 Google Search Grounding）
- gemini-1.5-flash：轻量级任务
- imagen-3.0-generate-002：封面图片生成
- gemini-3-pro-image-preview：配图生成

### 调用策略
```
1. 复杂推理任务：DeepSeek 优先，2次重试后回退 Gemini
2. 快速任务：Gemini 3 Pro 优先，3次重试后回退 DeepSeek
3. 图片生成：Imagen 3 优先，回退 Gemini Flash
```

### DeepResearch 服务
使用 Gemini API 配合 Google Search Grounding 进行实时网络搜索：
- `performDeepResearch()` - 单阶段研究
- `performTwoStageResearch()` - 两阶段研究（上半段1-10 + 下半段11-竞争分析）

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

### 九千提示词
```
GET /api/jiuqian-prompt              # 获取九千提示词
POST /api/jiuqian-prompt             # 保存九千提示词
Body: { prompt: string }
```

### 会话管理
```
GET /api/session/:id                 # 获取会话数据
Response: { success, data }
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
```

### 可选变量
```env
PORT=3001                            # 服务端口 (本地默认3001，云端8080)
NODE_ENV=development                 # 环境模式
UPLOAD_DIR=./uploads                 # 上传目录
DOWNLOAD_DIR=./downloads             # 下载目录
HTTP_PROXY=http://proxy:port         # 代理设置 (中国大陆用户)
HTTPS_PROXY=http://proxy:port        # HTTPS代理
```

---

## 云部署配置

### Google Cloud Run 部署

#### 前置要求
- 安装 Google Cloud CLI
- 配置好 GCP 项目
- 微信公众号 IP 白名单配置

#### 部署步骤
```bash
# 1. 设置项目
gcloud config set project YOUR_PROJECT_ID

# 2. 启用必要 API
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 3. 构建并提交
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/wechat-sop

# 4. 部署到 Cloud Run
gcloud run deploy wechat-sop \
  --image gcr.io/YOUR_PROJECT_ID/wechat-sop \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --timeout 300 \
  --set-env-vars "GEMINI_API_KEY=xxx,DEEPSEEK_API_KEY=xxx,WECHAT_APP_ID=xxx,WECHAT_APP_SECRET=xxx,GCS_BUCKET_NAME=xxx"
```

### Docker 构建流程
```dockerfile
# 阶段1: 构建前端
FROM node:20-alpine AS client-builder
# 安装依赖并构建 React 应用

# 阶段2: 构建后端
FROM node:20-alpine AS server-builder
# 跳过 Puppeteer Chromium 下载（使用 Gemini API）
# 编译 TypeScript

# 阶段3: 生产镜像
FROM node:20-alpine AS production
# 安装 wenyan-cli
# 复制构建产物
# 创建 uploads/ downloads/ data/ 目录
# 暴露 8080 端口
```

### Cloud Build 配置 (cloudbuild.yaml)
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/wechat-sop:latest', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/wechat-sop:latest']
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
      - 'NODE_ENV=production,...'
```

### 微信 IP 白名单配置
如需固定出口 IP：
1. 创建 VPC 连接器
2. 配置 Cloud NAT
3. 将 NAT IP 添加到微信公众号后台白名单

---

## 本地开发

### 快速启动
```bash
# Windows 一键启动
start-local.bat

# 或手动启动
npm install
npm run install:all
npm run dev
```

### 开发服务器
- 前端：http://localhost:5173 (Vite HMR)
- 后端：http://localhost:3001 (Express)
- API 代理：前端自动代理 /api 到后端

---

## 数据持久化

### Google Cloud Storage 存储结构
```
wechat-sop-data/
├── data/
│   ├── articles.json          # 文章项目列表
│   ├── jiuqian_prompt.txt     # 九千生图提示词
│   └── users.json             # 用户账户数据
└── files/
    ├── cover_*.png            # 封面图片
    └── article_img_*.png      # 配图
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

### 权限检查
```typescript
function hasPermission(role: string, feature: string): boolean {
  if (role === 'admin' || role === 'advanced') return true;
  if (role === 'user' && feature === 'imageGeneration') return false;
  return true;
}
```

---

## 关键服务实现

### AI 调用服务 (gemini.ts)
- `generateResearchFramework()` - 生成研究框架
- `generateStoryline()` - 生成叙事主线
- `generateArticle()` - 生成完整文章
- `polishArticle()` - 文章润色
- `generateImageText()` - 生成生图文本
- `generateArticleSkeleton()` - 生成文章骨架（规则方法）
- `extractImageParagraphs()` - 提取生图段落（规则方法）
- `generateImagePrompts()` - 生成配图提示词
- `generateBlockImage()` - 单张配图生成
- `generateCoverImage()` - 封面图生成
- `callDeepSeek()` - DeepSeek API 调用（流式）
- `callGemini()` - Gemini API 调用
- `callLLMWithFallback()` - DeepSeek 主 + Gemini 备
- `callLLMFast()` - Gemini 3 Pro 主 + DeepSeek 备

### DeepResearch 服务 (deepresearch.ts)
- `performDeepResearch()` - 单阶段深度研究（Gemini + Google Search）
- `performTwoStageResearch()` - 两阶段深度研究
- `closeBrowser()` - 兼容性占位（不再使用浏览器）

### 存储服务 (storage.ts)
- GCS 读写封装
- 文章项目 CRUD
- 用户认证
- 文件上传与公共 URL 生成
- 九千提示词存储

### 发布服务 (wenyan.ts)
- wenyan-cli 封装
- Markdown 格式化
- 主题配置
- 跨平台命令执行

---

## 性能配置

### 超时设置
- API 请求：10分钟（支持长时间 AI 操作）
- wenyan-cli：2分钟
- Cloud Run：300秒

### 资源配置
- Cloud Run 内存：1GB
- 文件上传限制：50MB

---

## 扩展与维护建议

### 推荐改进
1. 使用 Redis 替代内存会话存储
2. 添加任务队列处理长时间操作
3. 实现 WebSocket 实时进度更新
4. 添加结构化日志
5. 使用 GCP Secret Manager 管理密钥
6. 实现 JWT 会话管理
7. 添加 API 限流
8. 完善单元测试和集成测试

### 安全建议
1. 不要在代码中硬编码 API Keys
2. 使用环境变量管理敏感配置
3. 对用户密码进行哈希处理
4. 实现请求签名验证
5. 配置 CORS 白名单

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

# 部署
./deploy.bat                         # Windows 一键部署
gcloud builds submit                 # 提交构建

# Docker
docker build -t wechat-sop .         # 本地构建镜像
docker run -p 8080:8080 wechat-sop   # 运行容器
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
   - 确认 wenyan-cli 已正确安装

4. **图片生成失败**
   - 确认用户有 imageGeneration 权限
   - 检查 Gemini API 配额
   - 确认九千 Prompt 已配置

---

## 联系与支持

如遇问题，请检查：
1. 环境变量配置是否完整
2. 网络连接是否正常
3. API 配额是否充足
4. 日志输出中的错误信息

---

*本文档为 Vibe Coding 提示词，帮助开发者快速理解项目架构并进行二次开发。*
