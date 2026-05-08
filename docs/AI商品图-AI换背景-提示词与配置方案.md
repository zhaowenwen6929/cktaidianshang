# AI商品图-AI换背景-提示词与配置方案（功能级样板）

> 目标：基于“真实代码流程 + 平台规则 + 品类规则 + 高级选项值扩展”生成合规且正确的 AI 换背景图片。  
> 适用：开发直接落地（配置驱动提示词组装）。  
> 更新时间：2026-05-01

## 1. 页面真实流程与字段（Source of Truth）

## 1.1 使用流程（真实）

1. 上传商品图（`upload-main`）
2. 选择创作模式（`creation-mode`：普通/高级/文本增强，比例、分辨率、数量）
3. 配置高级设置（`advanced-settings`）
4. 填写补充说明（`supplement`，可选）
5. 生成

对应代码配置（`src/App.tsx`）：

- `toolKey`: `goods-bg`
- `creationModeConfigKey`: `background`
- `sectionOrder`: `["upload-main","creation-mode","advanced-settings","supplement"]`
- `uploads.main.maxCount`: `24`
- `advancedAiAssistPromptConfigs["goods-bg"]`：AI 回填高级字段
- `supplementAiPolishConfigs["goods-bg"]`：补充说明润色

## 1.1.1 端到端使用流程（建议落地）

1. 用户上传商品图（`upload-main`，最多 24 张）。
2. 系统执行图片理解与商品信息提取，识别 `productCategory`、主体材质、原图光向、适配背景方向。
3. 用户选择或外层注入平台（`platformLabel`）。
4. 用户选择创作模式（`modeId` / `ratio` / `resolution` / `count`）。
5. 用户进入高级设置，手动选择或点击 AI Assist 回填 `backgroundType`、`lightingStyle`。
6. 用户填写补充说明（可选，可先走 AI 润色）。
7. 系统按 strict 规则组装最终提示词并提交生成。
8. 返回结果后，用户可继续修改背景类型、光影风格或补充说明二次生成。

## 1.2 高级设置字段与可选值（真实）

```json
{
  "advancedFields": {
    "backgroundType": ["电商白底", "实景室内", "室外场景", "商业广告风"],
    "lightingStyle": ["写实自然光", "柔光棚拍风", "日系清新光", "高级杂志风", "人造光氛围"]
  }
}
```

补充说明：

- 这是当前 `goods-bg` 页面真实暴露的全部高级字段；
- 当前页面没有单独暴露 `platformInfo`、`platformLabel`、`productCategory`、`productType` 控件；
- 但从业务目标看，平台规则和品类规则仍然必须作为最终提示词组装输入。

## 1.2.1 创作模式真实状态

根据 `src/App.tsx` 现有配置，`goods-bg` 的 `creationModeConfigKey = "background"` 已支持：

- `normal`：普通模式
- `advanced`：高级模式
- `text-enhanced`：文本增强

说明：

- `AG-BG-002` 测试用例中明确要求“文本增强模式生成，模式字段为 `text-enhanced`”；
- 因此文档和后端入参不应只保留 `normal | advanced` 两种模式。

建议参数定义：

```ts
type GoodsBgParams = {
  toolKey: "goods-bg";
  platformLabel: string;
  productCategory: string;
  backgroundType: "电商白底" | "实景室内" | "室外场景" | "商业广告风";
  lightingStyle: "写实自然光" | "柔光棚拍风" | "日系清新光" | "高级杂志风" | "人造光氛围";
  ratio: string;
  resolution?: string;
  count: string;
  modeId: "normal" | "advanced" | "text-enhanced";
  supplement?: string;
  strict?: boolean;
};
```

## 1.3 平台与品类输入字段（本功能真实状态）

结论：

- `goods-bg` 当前真实代码里没有单独暴露 `platformLabel` / `platformInfo` 字段；
- 当前页面也没有单独暴露 `productCategory` 控件；
- 当前页面只配置了 `backgroundType` 和 `lightingStyle` 两个高级设置；
- 但为了“最终生成合规和正确的 A 图图片”，平台规则和品类规则不能缺席，必须由页面外层流程或后端任务上下文注入。

建议落地方式：

```json
{
  "platformField": "platformLabel",
  "platformFieldStatusInCurrentPage": "not_exposed",
  "platformRecommendedInjection": "由上游商品发布场景、全局平台选择器、任务上下文或服务端入参注入",
  "platformOptions": ["全平台通用（16平台）", "淘宝", "天猫", "京东", "拼多多", "1688", "抖音电商", "快手电商", "小红书电商", "亚马逊", "Temu", "TikTok Shop", "阿里国际站", "速卖通", "Shopee", "OZON", "SHEIN"],
  "categoryField": "productCategory",
  "categoryFieldStatusInCurrentPage": "not_exposed",
  "categoryRecommendedInjection": "由图片识别、商品类目识别服务、商品库或上游商品信息注入",
  "categoryOptions": ["服饰类", "鞋靴类", "箱包类", "珠宝饰品类", "美妆个护类", "食品饮料类", "家居百货类", "家电数码类", "家具大件类", "母婴玩具类", "宠物用品类", "汽配五金类", "通用品类"]
}
```

关键说明：

- `goods-bg` 功能的“平台”不是界面字段，而是最终提示词组装层的业务上下文；
- `goods-bg` 功能的“品类”不是当前页面字段，而是隐藏的先识别再处理逻辑核心锚点；
- 不能因为界面没有露出平台/品类字段，就省略平台合规和品类保护段。

## 1.4 当前代码已存在的 AI 回填与隐形推断逻辑

## 1.4.1 AI Assist 原始提示词（真实）

`src/App.tsx:3151`

```text
你是一位电商换背景策划师。请根据商品图片与主体特征，回填背景类型、风格与光影两个字段。若主体更适合白底、电商展台、居家、户外、广告风等，请选择最贴近的选项；不要填无关字段。
```

## 1.4.2 AI Assist 实际回填逻辑（真实）

`src/App.tsx:4402-4404`

```ts
case "goods-bg":
  fieldValues.backgroundType = inferBackgroundSceneType(sourceText);
  fieldValues.lightingStyle = inferBackgroundLightingStyle(sourceText);
  return { fieldValues: finalizeFieldValues(fieldValues), supplementValue: extraDetails };
```

## 1.4.3 真实推断函数（当前代码行为）

```ts
inferBackgroundSceneType(sourceText)
```

映射规则：

- 命中 `白底|纯白|抠图|无背景|isolated|cutout` -> `电商白底`
- 命中 `室内|家居|客厅|卧室|桌面|室内场景|indoor|interior` -> `实景室内`
- 命中 `室外|户外|自然|街景|草地|花园|outdoor|nature` -> `室外场景`
- 命中 `广告|海报|kv|banner|大片|商业|campaign|hero` -> `商业广告风`
- 默认值 -> `电商白底`

```ts
inferBackgroundLightingStyle(sourceText)
```

映射规则：

- 命中 `自然光|日光|窗光|realistic|daylight|natural light` -> `写实自然光`
- 命中 `棚拍|柔光|影棚|softbox|studio` -> `柔光棚拍风`
- 命中 `日系|清新|明亮|airy|fresh` -> `日系清新光`
- 命中 `杂志|高级|轻奢|editorial|premium|luxury` -> `高级杂志风`
- 命中 `霓虹|氛围光|人造光|彩光|cinematic|ambient` -> `人造光氛围`
- 默认值 -> `写实自然光`

## 1.4.4 这条链路的真实边界

当前代码只能自动回填：

- `backgroundType`
- `lightingStyle`

当前代码不会自动回填：

- `platformLabel`
- `productCategory`
- `productType`
- `platformRuleDetail`

所以业务上需要新增的隐形逻辑是：

1. 先识别一级品类 `productCategory`
2. 再注入平台上下文 `platformLabel`
3. 再由 `backgroundType + lightingStyle + platformRule + categoryRule + supplement` 共同组装最终提示词

## 1.4.5 上传图片识别与商品信息提取（建议新增结构）

目标：

- 从上传图中提取“换背景生成所需的商品信息”；
- 为隐藏品类注入、选项回填、提示词组装提供结构化输入；
- 减少用户手动配置成本，提升首轮合规率和真实感。

识别输入：

```json
{
  "imageUrl": "上传图片地址",
  "title": "商品标题（可选）",
  "toolKey": "goods-bg"
}
```

识别输出（建议结构）：

```json
{
  "category": {
    "categoryId": "fashion-knitwear",
    "categoryLabel": "服饰类",
    "confidence": 0.95,
    "keywords": ["针织纹理", "上衣版型", "领口结构", "褶皱垂感"]
  },
  "backgroundSignals": {
    "detectedBackgroundType": "实景室内",
    "detectedLightingStyle": "写实自然光",
    "detectedLightDirection": "左前侧柔和自然光",
    "detectedMaterialHints": ["针织", "轻微绒感", "非高反光"],
    "detectedReflectionRisk": "low",
    "detectedShadowNeed": "soft_contact_shadow"
  },
  "needsUserConfirm": ["fieldKey1"]
}
```

识别到字段回填映射：

```json
{
  "category.categoryLabel": "productCategory",
  "backgroundSignals.detectedBackgroundType": "backgroundType",
  "backgroundSignals.detectedLightingStyle": "lightingStyle"
}
```

回填策略（strict 推荐）：

- 命中字段值必须在该字段 `options` 内；
- `productCategory` 未命中统一品类时：回填 `通用品类` 并强制人工确认；
- `backgroundType`、`lightingStyle` 若识别不足：回填空字符串 `""`，并加入 `needsUserConfirm`；
- `platformLabel` 不允许让模型仅凭商品图瞎猜，应由业务上游传入；若上游未传入，则回填 `全平台通用（16平台）` 或空值待确认。

失败兜底：

- 识别失败时不阻塞流程；
- 最小可用集：
  - `productCategory=通用品类`
  - `backgroundType=电商白底`
  - `lightingStyle=写实自然光`
- 进入“人工确认优先”路径再生成。

## 2. 平台提示词配置（换背景专属 JSON）

说明：

- 本配置是“换背景功能专属”平台规则，不直接复用白底图首图规则全文；
- 但平台基线必须参考 [商品白底图-16平台最新规范与品类补充.md](/Users/zhaowenwen/CODEX/CKTAI电商/docs/商品白底图-16平台最新规范与品类补充.md)；
- 换背景功能的核心是：按平台要求，决定“背景能替换到什么程度”和“应该生成哪类背景才合规”；
- 对强白底平台，`backgroundType=电商白底` 时应走最严格白底 A 图规则；`backgroundType!=电商白底` 时默认定位为附图、场景辅图或内容图位，而不是通用首图。

`ruleLevel` 含义：

- `A`: 官方明确或高一致性强约束，可直接落提示词
- `B`: 官方公开但为间接说明 / 行业稳定约束
- `C`: 公开网页证据不足，先按安全策略执行，后台需二次核验

```json
{
  "platformRulesByTool": {
    "全平台通用（16平台）": {
      "ruleLevel": "A",
      "backgroundSlotAdvice": "默认按可跨平台复用的最严格交集执行；若做首图优先使用电商白底，其他背景默认视为附图/辅图",
      "prompt": "换背景结果必须首先满足跨平台通用的商品图安全基线：商品主体真实、完整、清晰、可识别；背景替换后不得出现虚假场景、错误配件、过重文字、水印、Logo、边框、营销贴片和误导性功效表达。若背景类型为电商白底，则按标准白底主图质量执行；若背景类型为实景或广告风，则默认将结果定位为附图或场景内容图，不替代所有平台通用首图。",
      "required": ["主体真实不变", "背景与商品用途相关", "光影透视一致", "边缘干净无穿帮", "不得新增非售卖主体关键信息"],
      "forbidden": ["背景吞边", "错误倒影", "漂浮阴影方向错误", "虚假赠品/配件", "违规水印/二维码/联系方式", "夸张功效场景"]
    },
    "淘宝": {
      "ruleLevel": "C",
      "backgroundSlotAdvice": "电商白底可作为主图候选，其他背景优先作为附图",
      "prompt": "适配淘宝商品浏览语境，换背景图应保持商品主体识别优先。若使用实景或广告风背景，应避免复杂装饰和牛皮癣式覆盖信息，保证商品仍然是画面中心。",
      "required": ["主体突出", "背景简洁", "商品信息直观"],
      "forbidden": ["背景过杂", "文案贴片过重", "主体被场景压缩过小"]
    },
    "天猫": {
      "ruleLevel": "C",
      "backgroundSlotAdvice": "白底主图优先，品牌感背景更适合作为附图",
      "prompt": "适配天猫品牌电商语境，换背景后应兼顾高级感、秩序感和商品保真度，避免低质海报感和过强营销拼贴。",
      "required": ["品牌感", "秩序感", "商品保真"],
      "forbidden": ["低质贴图", "过度促销感", "背景喧宾夺主"]
    },
    "京东": {
      "ruleLevel": "C",
      "backgroundSlotAdvice": "主图优先白底，功能/结构型场景图适合作为附图",
      "prompt": "适配京东偏理性导购语境，换背景图应更强调结构、材质、功能关系和商品可信度，不宜做过度氛围化背景。",
      "required": ["结构清晰", "材质可信", "功能关系明确"],
      "forbidden": ["纯情绪化背景", "过重特效", "主体细节被压掉"]
    },
    "拼多多": {
      "ruleLevel": "C",
      "backgroundSlotAdvice": "优先保证快速识别，复杂背景仅适合辅图位",
      "prompt": "适配拼多多高频快节奏浏览场景，换背景图应强调主体识别效率和商品直接可读性，避免复杂场景导致首屏判断失败。",
      "required": ["高识别", "高对比", "主体集中"],
      "forbidden": ["背景复杂导致识别下降", "主体占比过小", "画面信息噪声过多"]
    },
    "1688": {
      "ruleLevel": "C",
      "backgroundSlotAdvice": "优先白底或极简结构背景，强调规格与质感",
      "prompt": "适配 1688 商采和批发语境，换背景图应偏向结构、材质、工艺和货品陈列可信度表达，减少纯情绪化生活方式包装。",
      "required": ["结构感", "材质感", "陈列可信"],
      "forbidden": ["过度生活方式化", "背景虚化过度", "商品规格感缺失"]
    },
    "抖音电商": {
      "ruleLevel": "C",
      "backgroundSlotAdvice": "白底适合商城图位，场景/广告风更适合作为内容图位",
      "prompt": "适配抖音电商内容浏览习惯，换背景图需要有停留感，但主体必须清晰完整，不得用夸张背景替代商品展示本身。",
      "required": ["停留感", "主体清晰", "商品真实"],
      "forbidden": ["背景抢主体", "虚假高能特效", "封面党式夸张场景"]
    },
    "快手电商": {
      "ruleLevel": "C",
      "backgroundSlotAdvice": "优先真实直观图位，强氛围背景慎用",
      "prompt": "适配快手电商直接转化语境，换背景图应真实、直接、主体清楚，不做过度娱乐化拼贴和复杂概念背景。",
      "required": ["直观可信", "主体优先", "场景自然"],
      "forbidden": ["娱乐化抢主体", "背景拼贴过重", "信息主次不分"]
    },
    "小红书电商": {
      "ruleLevel": "B",
      "backgroundSlotAdvice": "兼容 1:1 / 3:4，允许更审美化背景，但仍需真实种草",
      "prompt": "适配小红书商品图语境，换背景图可以更讲审美和生活方式氛围，但必须保证商品主体完整、色彩真实、材质可信，不做硬广式重营销背景。",
      "required": ["种草感", "审美统一", "材质真实", "兼容 1:1 或 3:4"],
      "forbidden": ["硬广感过强", "背景脏乱", "色彩失真", "主体被滤镜吞没"]
    },
    "亚马逊": {
      "ruleLevel": "A",
      "backgroundSlotAdvice": "若目标是主图，必须输出电商白底；其他背景只能理解为附图风格，不可伪装主图",
      "prompt": "请严格遵守 Amazon 主图规则：若当前结果作为主图，则必须使用纯白背景（RGB 255,255,255），仅展示实际售卖商品本体，不添加文字、Logo、水印、边框、额外图形或非售卖配件；若选择实景室内、室外场景或商业广告风，则该结果只能作为附图或内容图风格理解，不能伪装成主图。",
      "required": ["主图纯白", "仅售卖主体", "主体占画面主要区域", "真实反映商品"],
      "forbidden": ["非白底主图", "文字水印", "额外道具冒充售卖内容", "与实物不符的渲染图"]
    },
    "Temu": {
      "ruleLevel": "C",
      "backgroundSlotAdvice": "优先白底或干净中性背景，复杂背景慎作主图",
      "prompt": "适配 Temu 高节奏流量场景，换背景图应优先保证商品主体高识别和信息纯净度，复杂背景通常更适合作为附图使用。",
      "required": ["主体高识别", "背景干净", "商品清晰完整"],
      "forbidden": ["复杂背景抢主体", "花哨广告风主导画面", "不真实场景道具"]
    },
    "TikTok Shop": {
      "ruleLevel": "A",
      "backgroundSlotAdvice": "若目标是首图，必须输出电商白底；其他背景仅限内容图位理解",
      "prompt": "请严格遵守 TikTok Shop 首图规则：若当前结果作为首图，必须使用纯白背景，展示商品正面实体视图，不得添加 Logo、文字、边框、水印和图形覆盖，图片必须真实准确反映售卖商品。若当前选择的背景类型不是电商白底，则只能将结果定位为附图/内容图，不得冒充首图白底图。",
      "required": ["首图纯白", "正面实体视图", "商品真实准确"],
      "forbidden": ["非白底首图", "图形覆盖", "误导性场景", "失真重绘"]
    },
    "阿里国际站": {
      "ruleLevel": "B",
      "backgroundSlotAdvice": "优先高质量白底或工业感轻场景，强调结构与品质",
      "prompt": "适配阿里国际站 B2B 买家判断路径，换背景图要突出商品结构、材质和品质可信度，不宜过度情绪化包装。",
      "required": ["品质可信", "结构清晰", "商品完整"],
      "forbidden": ["情绪化场景过强", "遮挡关键结构", "虚假工业环境"]
    },
    "速卖通": {
      "ruleLevel": "C",
      "backgroundSlotAdvice": "优先标准商品图，场景背景多用于附图",
      "prompt": "适配速卖通跨境零售语境，换背景图应突出真实可售商品本体和使用语义，不夸大体验，不混淆首图与场景附图角色。",
      "required": ["主体完整", "真实可售", "语义清晰"],
      "forbidden": ["前后对比夸大", "背景复杂致识别失败", "主体不完整"]
    },
    "Shopee": {
      "ruleLevel": "C",
      "backgroundSlotAdvice": "默认纯白或极浅中性底更稳，场景图建议后置",
      "prompt": "适配 Shopee 东南亚用户浏览习惯，换背景图应重视直观识别和商品完整度，复杂背景不应削弱主体。",
      "required": ["直观可辨", "主体完整", "背景克制"],
      "forbidden": ["复杂拼贴", "主体被吞没", "背景信息过重"]
    },
    "OZON": {
      "ruleLevel": "B",
      "backgroundSlotAdvice": "官方公开建议白色或浅色中性背景；统一系统仍优先纯白",
      "prompt": "参考 Ozon 公开卖家建议，主图优先使用白色或浅色中性背景；为统一跨平台复用，系统默认仍以纯白为更安全方案。若使用轻场景背景，应保持浅色、中性、商品完整可见。",
      "required": ["白色或浅色中性背景优先", "商品完整可见", "主体居中清晰"],
      "forbidden": ["深色杂乱背景", "过重广告背景", "主体不完整"]
    },
    "SHEIN": {
      "ruleLevel": "C",
      "backgroundSlotAdvice": "服饰类可兼容 3:4，但背景仍需服务版型与上身感",
      "prompt": "适配 SHEIN 时尚零售语境，换背景图应兼顾时尚感和商品版型保真，尤其服饰、鞋靴、箱包类不能因背景风格化而损伤结构和材质真实度。",
      "required": ["时尚感", "版型保真", "主体清晰完整"],
      "forbidden": ["极端滤镜", "版型失真", "背景压过商品主体"]
    }
  }
}
```

## 2.1 `ruleLevel` 多规则使用逻辑（同一平台存在多条规则时）

适用场景：

- 同一平台可能同时命中基础规则、主图规则、附图规则、类目规则、活动规则；
- 换背景功能还会同时命中“背景类型差异规则”，例如 `电商白底` 与 `商业广告风` 的约束不同。

### 2.1.1 规则定位

- `ruleLevel=A`：高优先级硬约束，不可被低级规则覆盖。
- `ruleLevel=B`：常规约束，可被 A 覆盖。
- `ruleLevel=C`：补充约束，可被 A/B 覆盖，且可在 token 紧张时优先裁剪。

### 2.1.2 组装顺序（强制）

1. 合并所有命中规则的 `required`。
2. 合并所有命中规则的 `forbidden`。
3. `prompt` 按优先级拼接：`A -> B -> C`。
4. 若提示词长度超限，仅从低优先级描述裁剪：先裁 `C.prompt`，再裁 `B.prompt`；`A.prompt`、`required`、`forbidden` 不裁。

### 2.1.3 冲突处理（强制）

- 若高低级规则存在冲突，按优先级覆盖：`A > B > C`。
- 若平台主图规则与背景类型冲突：
  - `backgroundType=电商白底` 时，优先使用主图规则；
  - `backgroundType!=电商白底` 时，自动切换为“附图/辅图解释语义”。

## 3. 品类提示词配置（换背景专属 JSON）

说明：

- 换背景功能的品类规则重点不是“主体换成什么”，而是“背景怎么换都不能把主体换坏”；
- 所有品类规则都以“保留主体真实结构、颜色、材质、比例、SKU 特征”为前提；
- 高风险点主要集中在：边缘、透明件、金属高光、毛绒、反光材质、软硬材质混合、配件完整性、透视关系。

```json
{
  "categoryRulesByTool": {
    "服饰类": {
      "prompt": "该商品属于服饰类，请保持服装真实版型、领型、袖长、面料纹理、褶皱逻辑与垂感；换背景时不得把服饰边缘抠坏、压扁、变形或错误延长，不得虚构额外穿搭部件。"
    },
    "鞋靴类": {
      "prompt": "该商品属于鞋靴类，请保留鞋面材质、鞋底结构、鞋带、鞋口与鞋型轮廓，保证左右脚或成对展示逻辑正确；换背景时避免镜像错误、鞋底变形、鞋口塌陷和不真实反射。"
    },
    "箱包类": {
      "prompt": "该商品属于箱包类，请保持包体立体结构、容量感和受力关系，保留五金、拉链、肩带、手柄和缝线细节；换背景时不得让包体被压扁、塌陷或失去真实轮廓。"
    },
    "珠宝饰品类": {
      "prompt": "该商品属于珠宝饰品类，请强化边缘净度并准确保留金属、钻石、珍珠、宝石等高反光细节；换背景时重点防止细链条、透明件、微小结构丢失，并保证倒影和高光逻辑真实。"
    },
    "美妆个护类": {
      "prompt": "该商品属于美妆个护类，请确保包装文案、品牌标识、瓶身形态、泵头、喷嘴和盖体结构保真；换背景时避免透明瓶边缘丢失、瓶身变形、高光过曝和玻璃反射失真。"
    },
    "食品饮料类": {
      "prompt": "该商品属于食品饮料类，请仅展示合法可售商品包装，不伪造食材外露、液体飞溅、蒸汽或配菜摆盘效果；换背景时保证口味、规格、净含量等包装信息清晰可辨。"
    },
    "家居百货类": {
      "prompt": "该商品属于家居百货类，请保持结构比例准确，套装商品保证配件完整，并对玻璃、塑料、金属、木质、布艺等混合材质分别保真；换背景时避免结构错位和配件遗漏。"
    },
    "家电数码类": {
      "prompt": "该商品属于家电数码类，请保留接口、按键、屏幕、线材、开孔和装配缝等关键结构；换背景时不得虚构发光效果，黑色或深色产品边缘必须清晰可辨，反射需真实可控。"
    },
    "家具大件类": {
      "prompt": "该商品属于家具大件类，请保持体积感、边角直线、透视关系和空间尺度准确；换背景时背景空间必须与家具尺寸关系合理，不得压缩透视导致比例失真。"
    },
    "母婴玩具类": {
      "prompt": "该商品属于母婴玩具类，请保留绒面、软材质、塑胶件和多配件组合的真实质感，保证所有组件齐全完整；换背景时不得引入危险姿态或不合规儿童使用场景。"
    },
    "宠物用品类": {
      "prompt": "该商品属于宠物用品类，请默认不加入宠物模特，除非补充说明明确要求；换背景时只展示售卖商品本体或合理使用语义，并对软垫、绳结、塑料件等不同材质分别保真。"
    },
    "汽配五金类": {
      "prompt": "该商品属于汽配五金类，请强调结构、尺寸、孔位、棱边和安装位准确，金属件保持真实反光；换背景时禁止虚构安装环境和额外部件，不得改变零件尺度和结构关系。"
    },
    "通用品类": {
      "prompt": "请保留该商品所属品类应有的结构特征、材质细节和真实轮廓，避免因抠图、修边、错误透视或过度润色导致主体失真。"
    }
  }
}
```

## 4. 高级选项值扩展提示词配置（换背景专属 JSON）

结论：

- `goods-bg` 的高级选项值不能只拼成“背景类型=xxx；风格与光影=xxx”；
- 不同选项值下，确实需要扩展提示词描述；
- 这些扩展文本直接决定背景语义、空间结构、反光、阴影、色温和商业完成度。

```json
{
  "optionValueExpansionsByTool": {
    "backgroundType": {
      "fieldKey": "backgroundType",
      "name": "背景类型",
      "values": {
        "电商白底": {
          "valuePrompt": "输出纯白或极干净中性白背景，主体完整居中，边缘清晰锐利，只允许极轻接触阴影或弱倒影；不加入场景元素、道具、营销贴片、文字、水印、Logo、边框和无关反光。"
        },
        "实景室内": {
          "valuePrompt": "将商品置于真实室内生活场景中，背景元素应克制简洁，与商品用途强相关；空间透视、落影方向、台面接触关系和色温必须自然统一，避免像贴在背景上的悬浮感。"
        },
        "室外场景": {
          "valuePrompt": "将商品置于真实户外或自然语义场景中，注意环境光方向、天空光补光、接地阴影和远近层次的真实关系；避免过度旅游风、风景抢主体和与商品无关的巨大场景叙事。"
        },
        "商业广告风": {
          "valuePrompt": "背景可更具广告视觉张力和商业完成度，但商品主体必须仍然真实、可售、可识别；光影、材质、色彩和反射应服务商品高级感，不得用夸张 CG 效果取代真实商品图。"
        }
      }
    },
    "lightingStyle": {
      "fieldKey": "lightingStyle",
      "name": "风格与光影",
      "values": {
        "写实自然光": {
          "valuePrompt": "采用真实自然光逻辑，明暗过渡柔和，避免过重轮廓光和影棚感；高光不过曝，暗部不死黑，整体接近日常真实拍摄光感。"
        },
        "柔光棚拍风": {
          "valuePrompt": "采用均匀柔和的棚拍光线，阴影边缘柔化，主体轮廓清晰，适合突出材质、形体和商业整洁度；避免硬光打出不真实重影。"
        },
        "日系清新光": {
          "valuePrompt": "整体明亮、通透、轻盈，色温偏自然微暖或中性，保持空气感与清洁度；避免过度漂白、低对比失去商品结构。"
        },
        "高级杂志风": {
          "valuePrompt": "整体强调层次感、质感和镜头语言，允许更高级的明暗关系与局部重点光，但商品颜色、材质和结构仍需真实，不做夸张时尚化变形。"
        },
        "人造光氛围": {
          "valuePrompt": "允许使用氛围灯、彩色灯、霓虹或商业人造光，但要保证主光方向明确、补光关系合理，商品关键结构和真实颜色仍可辨认，避免氛围压过商品本身。"
        }
      }
    }
  }
}
```

## 4.1 不同选项组合下的联动规则（强制）

### 4.1.1 `backgroundType=电商白底`

- 若 `platformLabel` 命中 `亚马逊` 或 `TikTok Shop`：自动切换为主图强白底语义；
- 若 `lightingStyle=人造光氛围`：仍需保留白底合规优先，不应输出彩色氛围背景；
- 若 `lightingStyle=高级杂志风`：只能体现在光线质感和商品层次上，不能变成场景广告大片。

### 4.1.2 `backgroundType=实景室内`

- 若平台强白底：默认解释为附图/场景辅图；
- 家居、家具、美妆、箱包、服饰类通常更适合室内背景；
- 汽配五金、食品饮料、珠宝饰品若走室内背景，必须严格克制背景道具密度。

### 4.1.3 `backgroundType=室外场景`

- 更适合鞋靴、箱包、宠物用品、部分运动服饰和户外器材；
- 食品饮料、珠宝饰品、家电数码类慎用室外场景，除非补充说明明确要求；
- 对强白底平台默认作为附图使用，不应伪装首图。

### 4.1.4 `backgroundType=商业广告风`

- 适合品牌 KV、投放图、内容流封面图、活动场景图；
- 不适合伪装成 Amazon / TikTok Shop 主图；
- 对深色背景、镜面背景、粒子光效、霓虹光效需要更强的边缘与反光控制。

## 5. 不同品类下的背景类型优先级建议（用于 AI Assist 与隐形兜底）

```json
{
  "categoryToPreferredBackgroundTypes": {
    "服饰类": ["实景室内", "商业广告风", "电商白底"],
    "鞋靴类": ["实景室内", "室外场景", "电商白底"],
    "箱包类": ["实景室内", "室外场景", "商业广告风"],
    "珠宝饰品类": ["电商白底", "商业广告风", "实景室内"],
    "美妆个护类": ["电商白底", "实景室内", "商业广告风"],
    "食品饮料类": ["电商白底", "实景室内", "商业广告风"],
    "家居百货类": ["实景室内", "电商白底", "商业广告风"],
    "家电数码类": ["电商白底", "商业广告风", "实景室内"],
    "家具大件类": ["实景室内", "商业广告风", "电商白底"],
    "母婴玩具类": ["实景室内", "电商白底", "商业广告风"],
    "宠物用品类": ["实景室内", "室外场景", "电商白底"],
    "汽配五金类": ["电商白底", "商业广告风", "实景室内"],
    "通用品类": ["电商白底", "实景室内"]
  }
}
```

使用原则：

- 这是 AI Assist 和服务端兜底排序，不是硬限制；
- 若用户明确选择某个背景类型，以用户选择优先；
- 若用户未选且识别不充分，按 `category -> preferredBackgroundTypes[0]` 兜底更稳。

## 6. 最终组装模板与规则（JSON）

```json
{
  "builderByTool": {
    "goods-bg": {
      "requiredFields": ["toolKey", "platformLabel", "productCategory", "backgroundType", "lightingStyle"],
      "promptTemplates": {
        "task": "请基于上传的商品原图，在保持商品主体真实不变的前提下，生成合规、真实、可用于电商商品展示的换背景图片。",
        "category": "当前商品品类为「{productCategory}」，请保持该品类应有的真实结构、材质、颜色、纹理、比例关系与细节特征，禁止错误改造商品形态，禁止替换商品主体。",
        "platform": "{platformPrompt}",
        "params": "背景类型={backgroundType}；风格与光影={lightingStyle}。",
        "quality": "背景与主体必须自然融合，阴影、反射、色温、透视关系与空间层次真实一致；边缘干净无毛边、无吞边、无漂浮感、无穿帮，不出现拼贴断层和不真实倒影。",
        "outputSpec": "输出比例={ratio}；输出分辨率={resolution}；输出数量={count}。",
        "supplement": "补充要求：{supplement}"
      },
      "appendOptionExpansions": true,
      "optionExpansionMode": "detailed_prompt_first",
      "strictMode": {
        "enabled": true,
        "onMissingPlatformRule": "error",
        "onMissingCategoryRule": "error",
        "onUnknownParamValue": "error"
      }
    }
  }
}
```

## 7. 可直接联调示例

输入：

```json
{
  "toolKey": "goods-bg",
  "platformLabel": "亚马逊",
  "productCategory": "家电数码类",
  "params": {
    "backgroundType": "电商白底",
    "lightingStyle": "柔光棚拍风",
    "ratio": "1:1",
    "resolution": "1K",
    "count": "1",
    "supplement": "保留黑色耳机外壳高光和金属边缘，白底纯净，不要强倒影。"
  },
  "strict": true
}
```

输出（示例）：

```text
请基于上传的商品原图，在保持商品主体真实不变的前提下，生成合规、真实、可用于电商商品展示的换背景图片。

当前商品品类为「家电数码类」，请保持该品类应有的真实结构、材质、颜色、纹理、比例关系与细节特征，禁止错误改造商品形态，禁止替换商品主体。

请严格遵守 Amazon 主图规则：若当前结果作为主图，则必须使用纯白背景（RGB 255,255,255），仅展示实际售卖商品本体，不添加文字、Logo、水印、边框、额外图形或非售卖配件；若选择实景室内、室外场景或商业广告风，则该结果只能作为附图或内容图风格理解，不能伪装成主图。

背景类型=电商白底；风格与光影=柔光棚拍风。

输出纯白或极干净中性白背景，主体完整居中，边缘清晰锐利，只允许极轻接触阴影或弱倒影；不加入场景元素、道具、营销贴片、文字、水印、Logo、边框和无关反光。采用均匀柔和的棚拍光线，阴影边缘柔化，主体轮廓清晰，适合突出材质、形体和商业整洁度；避免硬光打出不真实重影。

背景与主体必须自然融合，阴影、反射、色温、透视关系与空间层次真实一致；边缘干净无毛边、无吞边、无漂浮感、无穿帮，不出现拼贴断层和不真实倒影。

输出比例=1:1；输出分辨率=1K；输出数量=1。

补充要求：保留黑色耳机外壳高光和金属边缘，白底纯净，不要强倒影。
```

## 8. 三个关键能力的提示词配置（完整可用）

以下 3 组提示词可直接用于后端/服务编排。

### 8.1 图片识别获取信息（Image Understanding / Extraction）

用途：

- 识别换背景所需的品类、背景方向、光影方向与材质风险；
- 输出结构化 JSON，供字段回填和后续提示词组装使用。

推荐提示词：

```text
你是一位电商商品图理解专家。请根据输入商品图，提取“AI换背景生成”所需信息，并严格输出 JSON。

任务要求：
1) 识别商品所属一级品类（用于 productCategory）。
2) 识别最适合的背景类型候选：backgroundType。
3) 识别最适合的光影风格候选：lightingStyle。
4) 识别原图的主体边缘风险、透明件/金属件/高反光风险、推荐阴影强度和光源方向。
5) 所有推荐值必须从给定 options 中选择；若无法判断，返回空字符串或最保守值。
6) 不输出解释文字，不输出 Markdown，仅输出 JSON。

输出 JSON Schema：
{
  "category": {
    "categoryId": "string",
    "categoryLabel": "服饰类|鞋靴类|箱包类|珠宝饰品类|美妆个护类|食品饮料类|家居百货类|家电数码类|家具大件类|母婴玩具类|宠物用品类|汽配五金类|通用品类",
    "confidence": "number(0-1)",
    "keywords": ["string"]
  },
  "recommendedFields": {
    "backgroundType": "电商白底|实景室内|室外场景|商业广告风|",
    "lightingStyle": "写实自然光|柔光棚拍风|日系清新光|高级杂志风|人造光氛围|"
  },
  "technicalHints": {
    "lightDirection": "string",
    "edgeRisk": "low|medium|high",
    "reflectionRisk": "low|medium|high",
    "recommendedShadow": "none|soft_contact_shadow|soft_ground_shadow",
    "materialHints": ["string"]
  },
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}

判定规则：
- 若识别置信度 < 0.70，categoryLabel 输出“通用品类”。
- 若无法可靠判断 backgroundType，则优先返回“电商白底”。
- 若无法可靠判断 lightingStyle，则优先返回“写实自然光”。
```

### 8.2 AI帮写（Advanced Fields Auto-fill）

用途：

- 在用户点击“AI帮写”时，回填 `goods-bg` 的高级设置字段；
- 同时支持后端隐形链路补齐 `productCategory`；
- 仅输出字段键值，不输出额外解释。

推荐提示词：

```text
你是一位电商换背景策划师。请根据商品图识别结果与平台信息，回填 goods-bg 的高级设置字段。

必须遵守：
1) 仅返回以下字段：productCategory, backgroundType, lightingStyle。
2) 能确认的字段必须从提供的 options 中选取一个值。
3) 无法确认的字段不要编造，不要猜测，直接留空字符串 ""，并把字段名加入 needsUserConfirm。
4) productCategory 必须是统一 12 类之一；若识别不足，回填“通用品类”。
5) 只输出 JSON，不要输出解释。

输出格式：
{
  "fieldValues": {
    "productCategory": "string",
    "backgroundType": "string",
    "lightingStyle": "string"
  },
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}
```

推荐改造说明：

- 当前前端真实页面只会自动应用 `backgroundType`、`lightingStyle`；
- 若要实现“先识别品类再处理”的业务目标，后端或上层编排需接住 `productCategory` 并注入最终 builder。

### 8.3 文本润色（Supplement Polish）

用途：

- 对用户补充说明进行语义增强；
- 生成可执行、约束清晰、适合换背景模型的补充文本。

推荐提示词（对应 `goods-bg`）：

```text
你是一位电商商品换背景文案润色专家。请将用户的补充说明优化为“可执行的图像生成约束”，并保持原意。

润色目标：
1) 强化背景语义、空间关系、光影融合和主体保真。
2) 避免空泛词，改成可执行描述（背景、光线、阴影、边缘、反射、质感）。
3) 不新增与用户意图冲突的内容。
4) 输出一段最终可直接拼进提示词的文本。

输出要求：
- 仅输出润色后的文本，不要解释。
- 80~220 字为宜。
- 不得包含违规词、夸张功效或误导性承诺。
```

默认润色指令（当前代码真实配置）：

```text
优化换背景补充描述，强调背景融合、真实光影、空间关系与主体协调。
```

## 9. 组装实现要点（避免“只拼值文本”）

结论：

- 不能只拼 `背景类型=xxx；风格与光影=xxx`；
- 必须在拼完参数值后，再拼对应 `valuePrompt` 扩展段；
- 必须再叠加平台规则、品类规则和全局融合质量段。

建议伪代码：

```ts
const paramLine = `背景类型=${backgroundType}；风格与光影=${lightingStyle}。`;

const expansionLines = selectedFields.flatMap(({ fieldKey, value }) => {
  const fieldConfig = optionValueExpansionsByTool[fieldKey];
  if (!fieldConfig) return [];
  const hit = fieldConfig.values[value];
  if (!hit) throw new Error(`unknown value: ${fieldKey}=${value}`);
  return [hit.valuePrompt];
});

finalPrompt = [
  taskPrompt,
  categoryPrompt,
  platformPrompt,
  paramLine,
  expansionLines.join(" "),
  qualityPrompt,
  outputSpecPrompt,
  supplementPrompt
].filter(Boolean).join("\n\n");
```

## 10. 当前文档与代码的关键对齐结论

1. `goods-bg` 当前页面真实字段只有 `backgroundType`、`lightingStyle`。
2. `platformLabel`、`productCategory` 当前都不是页面显式输入，但它们是最终合规提示词的必需上下文。
3. 代码真实存在 AI Assist 和润色链路，但只覆盖了两项高级字段和补充说明润色。
4. 如果目标是“最终生成合规和正确的 A 图图片”，必须在代码层补一条隐藏链路：
   - 先识别 `productCategory`
   - 再拿到 `platformLabel`
   - 再走 `platformRule + categoryRule + optionExpansion + supplement` 的完整 builder
5. 对 `亚马逊`、`TikTok Shop` 这类强白底平台，`backgroundType=电商白底` 时应直接进入主图白底强约束；其他背景类型默认视为附图 / 场景辅图，不应伪装成主图。
