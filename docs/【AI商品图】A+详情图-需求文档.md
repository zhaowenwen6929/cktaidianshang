# 【AI商品图】A+详情图-需求文档

## 使用流程
1. 上传商品图（`upload-main`）
2. 填写商品信息与卖点信息（`set-pack-selling-points`）
3. 配置平台、市场、视觉风格等策略信息（`set-pack-strategy`）
4. 选择创作模式（`creation-mode`）
5. 选择包含模块（`set-pack-type-selector`）
6. 生成模块规划
7. 编辑模块顺序与模块文案
8. 生成 A+详情图

## 端到端使用流程
1. 用户上传同一商品多视角商品图，当前 `upload-main` 最多支持 3 张。
2. 用户填写商品名称、核心卖点、适用场景等结构化商品信息。
3. 用户补充平台、目标市场、文案语种、视觉风格等策略字段。
4. 用户选择创作模式参数（`modeId / ratio / resolution / count / unitCreditCost`）。
5. 用户在模块选择区勾选本次需要生成的 A+ 模块。
6. 系统执行第 1 步规划：基于商品信息、策略信息和已选模块生成 `summary + modules`。
7. 用户进入第 2 步编辑：可删除模块、拖拽模块顺序、修改模块内容。
8. 系统校验当前编辑内容与第 1 步输入签名是否一致；若不一致，要求重新生成规划。
9. 系统将已确认的模块规划转成最终 `setPackSelectedTypes`，并按模块逐个拼装生成提示词。
10. 结果返回为一组可直接用于 A+详情页编排的模块图。

## 1.1 计费与模式联动
```json
{
  "modeBillingRules": {
    "set-pack": {
      "description": "A+详情图复用电商套图的创作模式配置",
      "countRule": "第1步规划不计费，第2步正式生成按最终模块数计费",
      "finalCountRule": "最终 count = 规划确认后的 modules.length",
      "finalCostRule": "最终 generateCost = unitCreditCost * modules.length",
      "ratioRule": "页面展示默认 ratioLabel=1:1，但单模块默认比例以 module.defaultRatio 为准",
      "resolutionRule": "页面 creation-mode 的 resolution 作为最终生成分辨率；未显式覆盖时模块默认值为 1K"
    }
  }
}
```

## 1.2 平台、品类与默认值约定
+ 当前真实工具 key：`set-aplus`
+ 当前面板标题：`A+详情图`
+ 当前基础配置来源：`creationModeConfigKey = set-pack`
+ 当前默认结果数量展示：`resultCount = 6`
+ 当前工具面板默认比例标签：`ratioLabel = 1:1`
+ 当前真实 section 顺序：
  1. `upload-main`
  2. `set-pack-selling-points`
  3. `set-pack-strategy`
  4. `creation-mode`
  5. `set-pack-type-selector`

说明：
+ `ratioLabel=1:1` 是工具卡片展示口径，不代表所有模块最终固定输出 1:1。
+ 模块规划和最终生成依赖的真实核心字段来自 `advancedSelections`。
+ 当前 A+ 功能是“两步链路”：
  1. 先生成模块规划
  2. 再基于规划生成模块图

## 2. 平台提示词配置
说明：

+ A+详情图不适用主图白底规则，重点是详情内容位表达。
+ 平台差异不在“能不能有人物/场景”，而在于：
  - 模块排序偏好
  - 信息密度偏好
  - 卖点表达强度
  - 参数/规格模块权重
  - 品牌叙事是否适合前置
+ 当前 A+ 平台规则更适合写成“模块优先级 + 平台约束”结构，而不是单句 prompt。

真实规则源：
+ [aplus_platform_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/A+详情图/aplus_platform_rules.json)

开发使用规则：
+ 先按 `platform` 过滤 `module_key` 是否允许使用。
+ 再按 `priority` 参与模块排序推荐。
+ 再把 `platform_notes + platform_constraints` 拼成平台级 prompt。
+ 若用户手动强选模块，只要 `is_allowed=true` 则允许进入最终规划。
+ 需求文档展示口径需与通用模板保持一致，平台规则按 `16` 个电商平台整理，便于与其他 AI 商品图功能统一理解和复用。

推荐平台规则结构：
```json
{
  "platformRulesByTool": {
    "全平台通用（16平台）": {
      "label": "全平台通用（16平台）",
      "ruleLevel": "A",
      "prompt": "适配跨平台复用的 A+ 详情内容安全基线，强调商品主体真实、卖点可验证、结构可读、参数可信、模块逻辑清楚，不做强促销海报感，不把 A+ 模块误做成主图或活动 Banner。",
      "focusModules": ["aplus-hero", "aplus-core-selling", "aplus-detail", "aplus-spec", "aplus-function"],
      "secondaryModules": ["aplus-scene-usage", "aplus-size", "aplus-comparison", "aplus-accessories", "aplus-usage-advice"],
      "avoidModules": ["aplus-atmosphere"],
      "priorityHint": "默认优先商品价值、卖点、细节、参数和功能说明等通用转化模块。",
      "platformPromptPatch": "整体遵循跨平台最稳妥的详情表达：模块清晰、商品真实、信息可信、文案克制、便于后续多平台复用。",
      "required": ["商品真实", "信息可信", "模块清晰", "可读可编排"],
      "forbidden": ["强促销海报感", "虚构参数", "虚构卖点", "无关品牌KV化"]
    },
    "淘宝": {
      "label": "淘宝",
      "ruleLevel": "C",
      "prompt": "适配淘宝详情页语境，强调卖点直接、模块丰富、商品与场景关系清楚，既可读也要有一定转化氛围。",
      "focusModules": ["aplus-core-selling", "aplus-hero", "aplus-scene-usage", "aplus-detail", "aplus-spec"],
      "secondaryModules": ["aplus-size", "aplus-comparison", "aplus-accessories", "aplus-series", "aplus-usage-advice"],
      "avoidModules": ["aplus-brand-story"],
      "priorityHint": "优先卖点、细节、场景和参数模块，允许更丰富的模块节奏，但避免空泛品牌化叙事。",
      "platformPromptPatch": "适合偏转化、偏模块堆栈式的详情阅读路径，文案可更直给，但不能失真或过于杂乱。",
      "required": ["卖点直观", "模块丰富", "主体清楚"],
      "forbidden": ["无效长篇品牌故事", "复杂海报拼贴", "主体被弱化"]
    },
    "天猫": {
      "label": "天猫",
      "ruleLevel": "C",
      "prompt": "适配天猫品牌化详情表达，强调秩序感、质感、品牌统一性和模块精致度，卖点表达要清楚但不过度叫卖。",
      "focusModules": ["aplus-hero", "aplus-core-selling", "aplus-detail", "aplus-spec", "aplus-brand-story"],
      "secondaryModules": ["aplus-scene-usage", "aplus-size", "aplus-series", "aplus-craft", "aplus-ingredient"],
      "avoidModules": ["aplus-atmosphere"],
      "priorityHint": "优先品牌感主视觉、核心卖点、细节和参数说明，模块风格统一、有品牌秩序。",
      "platformPromptPatch": "适合更精致、更整洁、更品牌统一的详情风格，避免廉价促销感和低质排版。",
      "required": ["品牌统一", "秩序清晰", "商品可信"],
      "forbidden": ["廉价促销风", "脏乱排版", "品牌调性割裂"]
    },
    "京东": {
      "label": "京东",
      "ruleLevel": "C",
      "prompt": "适配京东理性导购语境，强调商品结构、功能逻辑、参数说明和可验证细节，不宜过度情绪化表达。",
      "focusModules": ["aplus-core-selling", "aplus-spec", "aplus-function", "aplus-detail", "aplus-comparison"],
      "secondaryModules": ["aplus-hero", "aplus-size", "aplus-accessories", "aplus-craft", "aplus-usage-advice"],
      "avoidModules": ["aplus-atmosphere", "aplus-brand-story"],
      "priorityHint": "优先功能、参数、细节和对比型模块，服务理性购买判断。",
      "platformPromptPatch": "应更偏工程化和信息化表达，减少纯氛围图和弱信息模块。",
      "required": ["结构清晰", "参数明确", "逻辑可读"],
      "forbidden": ["情绪化过强", "参数弱化", "卖点空泛"]
    },
    "拼多多": {
      "label": "拼多多",
      "ruleLevel": "C",
      "prompt": "适配拼多多高效率浏览语境，强调卖点直接、信息抓取快、主体明显、对比清楚，详情图要服务快速转化。",
      "focusModules": ["aplus-core-selling", "aplus-spec", "aplus-compare", "aplus-detail", "aplus-hero"],
      "secondaryModules": ["aplus-function", "aplus-size", "aplus-comparison", "aplus-accessories", "aplus-scene-usage"],
      "avoidModules": ["aplus-brand-story"],
      "priorityHint": "优先高识别度、高信息效率的卖点与参数模块，减少冗长叙事。",
      "platformPromptPatch": "适合短平快阅读路径，模块文案尽量直给，避免大面积留白和绕弯子表达。",
      "required": ["识别快", "卖点直给", "信息高效"],
      "forbidden": ["长篇叙事", "复杂版式", "无效氛围图"]
    },
    "1688": {
      "label": "1688",
      "ruleLevel": "C",
      "prompt": "适配 1688 采购型详情语境，强调规格、结构、工艺、材质和配件清单，帮助用户完成理性采购判断。",
      "focusModules": ["aplus-spec", "aplus-function", "aplus-craft", "aplus-detail", "aplus-accessories"],
      "secondaryModules": ["aplus-comparison", "aplus-size", "aplus-scene-usage", "aplus-audience", "aplus-usage-advice"],
      "avoidModules": ["aplus-atmosphere", "aplus-brand-story"],
      "priorityHint": "优先规格、功能、工艺和清单类模块，整体偏商采信息结构。",
      "platformPromptPatch": "适合突出结构感、货感和交付信息，弱化纯消费型生活方式表达。",
      "required": ["规格可信", "结构明确", "工艺真实"],
      "forbidden": ["空泛氛围", "过度品牌叙事", "无依据背书"]
    },
    "抖音电商": {
      "label": "抖音电商",
      "ruleLevel": "C",
      "prompt": "适配抖音电商内容消费与转化并存的详情语境，强调首屏吸引、卖点快读、场景代入和商品主体清晰。",
      "focusModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-detail", "aplus-comparison"],
      "secondaryModules": ["aplus-spec", "aplus-fit", "aplus-atmosphere", "aplus-size", "aplus-series"],
      "avoidModules": ["aplus-brand-story"],
      "priorityHint": "优先抓眼主视觉、场景与卖点，参数模块可有但不宜压过浏览节奏。",
      "platformPromptPatch": "适合更强内容感和停留感，但必须保证商品仍是视觉中心。",
      "required": ["首屏吸引", "商品清楚", "卖点快读"],
      "forbidden": ["过重参数堆叠", "背景抢商品", "花哨失真"]
    },
    "快手电商": {
      "label": "快手电商",
      "ruleLevel": "C",
      "prompt": "适配快手电商直接转化语境，强调真实、直接、主体明确和生活化使用表达，避免过度精致化包装。",
      "focusModules": ["aplus-core-selling", "aplus-scene-usage", "aplus-detail", "aplus-hero", "aplus-function"],
      "secondaryModules": ["aplus-spec", "aplus-size", "aplus-accessories", "aplus-usage-advice", "aplus-comparison"],
      "avoidModules": ["aplus-brand-story", "aplus-atmosphere"],
      "priorityHint": "优先真实场景、直接卖点和清晰主体，整体更自然、更直给。",
      "platformPromptPatch": "避免过重品牌包装和精装杂志风，适合真实可信的内容式详情表达。",
      "required": ["真实自然", "主体明确", "场景可信"],
      "forbidden": ["娱乐化喧宾夺主", "过度精装", "表达虚浮"]
    },
    "小红书电商": {
      "label": "小红书电商",
      "ruleLevel": "B",
      "prompt": "适配小红书种草型详情表达，强调审美统一、生活方式氛围、真实体验感和商品质感，不做硬广式详情堆砌。",
      "focusModules": ["aplus-hero", "aplus-scene-usage", "aplus-atmosphere", "aplus-detail", "aplus-fit"],
      "secondaryModules": ["aplus-core-selling", "aplus-series", "aplus-ingredient", "aplus-size", "aplus-audience"],
      "avoidModules": ["aplus-spec"],
      "priorityHint": "优先视觉种草、真实体验和细节质感，参数模块后置且需克制。",
      "platformPromptPatch": "适合偏审美型、偏生活方式的 A+ 排版，但商品真实感必须强于海报感。",
      "required": ["审美统一", "体验真实", "质感清晰"],
      "forbidden": ["硬广感", "重参数堆砌", "过度叫卖"]
    },
    "amazon": {
      "label": "亚马逊",
      "ruleLevel": "A",
      "prompt": "适配 Amazon A+ 内容语境，强调信息结构清晰、品牌表达克制、卖点与参数真实可信，不做强促销海报感。",
      "focusModules": ["aplus-hero", "aplus-core-selling", "aplus-spec", "aplus-detail", "aplus-scene-usage", "aplus-function"],
      "secondaryModules": ["aplus-craft", "aplus-comparison", "aplus-size", "aplus-compare", "aplus-fit"],
      "avoidModules": ["aplus-atmosphere", "aplus-brand-story"],
      "priorityHint": "优先首屏价值、核心卖点、规格参数、商品细节和功能说明，品牌叙事与氛围模块后置。",
      "platformPromptPatch": "模块规划上优先信息结构清晰、参数可信、细节可验证的理性表达，适合中高客单商品的转化阅读节奏。",
      "required": ["卖点真实可信", "参数规格真实", "商品主体清晰", "品牌表达克制"],
      "forbidden": ["强促销海报感", "虚构参数", "虚构成分", "虚构服务承诺"]
    },
    "temu": {
      "label": "Temu",
      "ruleLevel": "A",
      "prompt": "适配 Temu 商品详情阅读习惯，强调价值点直给、对比清楚、信息读取效率高，同时保持商品主体清晰可信。",
      "focusModules": ["aplus-core-selling", "aplus-spec", "aplus-detail", "aplus-function", "aplus-comparison", "aplus-hero", "aplus-compare"],
      "secondaryModules": ["aplus-scene-usage", "aplus-craft", "aplus-size", "aplus-multi-angle", "aplus-accessories"],
      "avoidModules": ["aplus-brand-story"],
      "priorityHint": "优先价值点直给、规格说明、对比理解和功能拆解，弱化空泛品牌包装。",
      "platformPromptPatch": "详情图应强调高信息效率与强转化表达，卖点标题短平快，尽量减少无效留白和纯情绪氛围。",
      "required": ["重点直给", "信息高效", "对比真实", "商品主体清晰"],
      "forbidden": ["过度品牌叙事", "无效留白", "复杂海报化背景"]
    },
    "tiktok-shop": {
      "label": "TikTok Shop",
      "ruleLevel": "A",
      "prompt": "适配 TikTok Shop 详情内容，强调首屏吸引力、生活方式表达与快速理解，画面要更抓眼但不失商品识别度。",
      "focusModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-detail", "aplus-spec", "aplus-fit", "aplus-comparison"],
      "secondaryModules": ["aplus-size", "aplus-audience", "aplus-atmosphere", "aplus-compare", "aplus-accessories"],
      "avoidModules": ["aplus-brand-story"],
      "priorityHint": "优先首屏抓眼、场景代入、卖点快读和细节展示，参数模块可保留但不应过度堆叠。",
      "platformPromptPatch": "整体更偏内容消费和视觉停留逻辑，既要有生活方式表达，也要让用户在短时间内抓住商品价值。",
      "required": ["首屏抓眼", "商品清晰", "生活方式表达真实", "卖点快速理解"],
      "forbidden": ["参数堆叠过重", "过于理工化", "商品识别度下降"]
    },
    "aliexpress": {
      "label": "速卖通",
      "ruleLevel": "A",
      "prompt": "适配跨境详情页表达，突出商品优势、规格信息和全球消费者易理解的版式，不堆砌复杂本地化符号。",
      "focusModules": ["aplus-core-selling", "aplus-spec", "aplus-detail", "aplus-hero", "aplus-scene-usage", "aplus-function"],
      "secondaryModules": ["aplus-craft", "aplus-comparison", "aplus-size", "aplus-accessories", "aplus-compare"],
      "avoidModules": ["aplus-brand-story"],
      "priorityHint": "优先卖点、规格、细节、功能和配件清单，版式要兼顾跨语境用户的理解效率。",
      "platformPromptPatch": "模块文案应尽量直白、国际化、少文化语境依赖，适合多国家用户快速浏览和判断。",
      "required": ["跨语境易读", "规格清晰", "商品优势明确"],
      "forbidden": ["复杂本地化符号", "隐晦文化表达", "无依据参数"]
    },
    "shopee": {
      "label": "Shopee",
      "ruleLevel": "A",
      "prompt": "适配 Shopee 电商详情页，强调转化导向、信息密度适中、卖点模块清楚，场景与商品关系直接明了。",
      "focusModules": ["aplus-core-selling", "aplus-spec", "aplus-detail", "aplus-hero", "aplus-scene-usage", "aplus-size", "aplus-function"],
      "secondaryModules": ["aplus-comparison", "aplus-craft", "aplus-compare", "aplus-fit", "aplus-multi-angle"],
      "avoidModules": ["aplus-brand-story"],
      "priorityHint": "优先核心卖点、参数、细节和直接场景表达，页面信息密度适中，不做过重品牌讲述。",
      "platformPromptPatch": "详情页应服务快速转化和直接理解，商品与场景关系要明白，避免复杂排版和弱商品主体的氛围化设计。",
      "required": ["转化导向", "卖点清楚", "商品与场景关系直接"],
      "forbidden": ["无效品牌故事前置", "复杂版式", "商品弱存在感"]
    },
    "ozon": {
      "label": "OZON",
      "ruleLevel": "A",
      "prompt": "适配 OZON 平台详情语境，整体偏理性、规范、清晰，参数说明和使用价值要明确，避免夸张营销话术。",
      "focusModules": ["aplus-spec", "aplus-core-selling", "aplus-detail", "aplus-craft", "aplus-function", "aplus-hero", "aplus-size"],
      "secondaryModules": ["aplus-scene-usage", "aplus-comparison", "aplus-compare", "aplus-multi-angle", "aplus-accessories"],
      "avoidModules": ["aplus-atmosphere", "aplus-brand-story"],
      "priorityHint": "优先参数、卖点、工艺、功能和细节等理性信息模块，氛围和品牌叙事弱化。",
      "platformPromptPatch": "整体适合规范感强、可读性高、参数型内容占比更高的详情表达，避免夸张宣传和装饰性过重的图面。",
      "required": ["参数清晰", "价值明确", "版式规范"],
      "forbidden": ["夸张营销", "氛围喧宾夺主", "参数失真"]
    },
    "alibaba-international": {
      "label": "阿里国际站",
      "ruleLevel": "A",
      "prompt": "适配 B2B/B2C 混合型国际站详情表达，强调结构化信息、材质工艺、规格参数和专业可信度。",
      "focusModules": ["aplus-spec", "aplus-core-selling", "aplus-function", "aplus-craft", "aplus-detail", "aplus-scene-usage", "aplus-accessories"],
      "secondaryModules": ["aplus-comparison", "aplus-size", "aplus-hero", "aplus-compare", "aplus-multi-angle"],
      "avoidModules": ["aplus-atmosphere", "aplus-brand-story"],
      "priorityHint": "优先规格参数、功能逻辑、工艺说明、配件清单和专业应用场景，整体偏专业采购表达。",
      "platformPromptPatch": "页面应强调采购判断信息、材质结构可信度和功能逻辑说明，适合国际站专业型详情阅读习惯。",
      "required": ["专业可信", "结构化信息", "材质工艺真实", "规格参数明确"],
      "forbidden": ["空泛品牌叙事", "过重情绪氛围", "无依据认证背书"]
    },
    "shein": {
      "label": "SHEIN",
      "ruleLevel": "A",
      "prompt": "适配 SHEIN 详情内容风格，强调年轻化视觉、穿搭或生活方式氛围、颜色与版式吸引力，但商品仍需清楚可辨。",
      "focusModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-fit", "aplus-detail", "aplus-size", "aplus-spec", "aplus-series"],
      "secondaryModules": ["aplus-compare", "aplus-craft", "aplus-audience", "aplus-multi-angle", "aplus-atmosphere"],
      "avoidModules": ["aplus-brand-story"],
      "priorityHint": "优先年轻化主视觉、穿搭场景、版型说明、细节与系列展示，参数可保留但应兼顾浏览感。",
      "platformPromptPatch": "适合更强的时尚感、颜色吸引力和版式节奏，但不能牺牲商品可辨识度和真实穿着逻辑。",
      "required": ["年轻化", "穿搭/生活方式表达", "颜色吸引力", "商品清晰"],
      "forbidden": ["重参数堆叠", "过度理性说明", "破坏浏览感"]
    }
  }
}
```

## 2.2 全量平台模块优先级清单
说明：

+ 下表为 `aplus_platform_rules.json` 的真实整理结果，按 `priority` 从高到低排列。
+ 当前 8 个平台下，21 个模块均为 `is_allowed=true`，差异主要体现在优先级、说明和约束，不体现在禁用。

```json
{
  "platformPrioritySummary": {
    "amazon": [
      "aplus-hero(98)",
      "aplus-core-selling(96)",
      "aplus-spec(94)",
      "aplus-detail(92)",
      "aplus-scene-usage(88)",
      "aplus-function(88)",
      "aplus-craft(84)",
      "aplus-comparison(84)",
      "aplus-size(82)",
      "aplus-compare(80)",
      "aplus-fit(80)",
      "aplus-multi-angle(78)",
      "aplus-accessories(78)",
      "aplus-ingredient(76)",
      "aplus-space-fit(76)",
      "aplus-series(74)",
      "aplus-usage-advice(72)",
      "aplus-audience(72)",
      "aplus-atmosphere(68)",
      "aplus-brand-story(68)",
      "aplus-after-sale(60)"
    ],
    "temu": [
      "aplus-core-selling(100)",
      "aplus-spec(96)",
      "aplus-detail(90)",
      "aplus-function(90)",
      "aplus-comparison(90)",
      "aplus-hero(88)",
      "aplus-compare(88)",
      "aplus-scene-usage(86)",
      "aplus-craft(84)",
      "aplus-size(82)",
      "aplus-multi-angle(78)",
      "aplus-accessories(78)",
      "aplus-fit(78)",
      "aplus-ingredient(76)",
      "aplus-series(74)",
      "aplus-space-fit(74)",
      "aplus-audience(74)",
      "aplus-usage-advice(72)",
      "aplus-after-sale(66)",
      "aplus-atmosphere(62)",
      "aplus-brand-story(50)"
    ],
    "tiktok-shop": [
      "aplus-hero(96)",
      "aplus-core-selling(96)",
      "aplus-scene-usage(94)",
      "aplus-detail(90)",
      "aplus-spec(86)",
      "aplus-craft(84)",
      "aplus-fit(84)",
      "aplus-comparison(84)",
      "aplus-size(82)",
      "aplus-audience(82)",
      "aplus-atmosphere(80)",
      "aplus-compare(80)",
      "aplus-accessories(78)",
      "aplus-series(78)",
      "aplus-ingredient(76)",
      "aplus-function(76)",
      "aplus-space-fit(76)",
      "aplus-multi-angle(74)",
      "aplus-usage-advice(72)",
      "aplus-brand-story(62)",
      "aplus-after-sale(62)"
    ],
    "aliexpress": [
      "aplus-core-selling(98)",
      "aplus-spec(98)",
      "aplus-detail(90)",
      "aplus-hero(88)",
      "aplus-scene-usage(86)",
      "aplus-function(86)",
      "aplus-craft(84)",
      "aplus-comparison(84)",
      "aplus-size(82)",
      "aplus-accessories(82)",
      "aplus-compare(80)",
      "aplus-multi-angle(78)",
      "aplus-ingredient(78)",
      "aplus-fit(76)",
      "aplus-series(74)",
      "aplus-space-fit(74)",
      "aplus-usage-advice(72)",
      "aplus-audience(72)",
      "aplus-atmosphere(68)",
      "aplus-after-sale(62)",
      "aplus-brand-story(54)"
    ],
    "shopee": [
      "aplus-core-selling(99)",
      "aplus-spec(94)",
      "aplus-detail(90)",
      "aplus-hero(88)",
      "aplus-scene-usage(88)",
      "aplus-size(86)",
      "aplus-function(86)",
      "aplus-comparison(86)",
      "aplus-craft(84)",
      "aplus-compare(80)",
      "aplus-fit(80)",
      "aplus-multi-angle(78)",
      "aplus-accessories(78)",
      "aplus-ingredient(76)",
      "aplus-series(74)",
      "aplus-space-fit(74)",
      "aplus-audience(74)",
      "aplus-usage-advice(72)",
      "aplus-atmosphere(66)",
      "aplus-after-sale(66)",
      "aplus-brand-story(52)"
    ],
    "ozon": [
      "aplus-spec(100)",
      "aplus-core-selling(96)",
      "aplus-detail(90)",
      "aplus-craft(90)",
      "aplus-function(90)",
      "aplus-hero(88)",
      "aplus-size(86)",
      "aplus-scene-usage(84)",
      "aplus-comparison(84)",
      "aplus-compare(82)",
      "aplus-multi-angle(78)",
      "aplus-accessories(78)",
      "aplus-ingredient(76)",
      "aplus-series(74)",
      "aplus-usage-advice(72)",
      "aplus-space-fit(72)",
      "aplus-fit(70)",
      "aplus-audience(68)",
      "aplus-after-sale(62)",
      "aplus-atmosphere(60)",
      "aplus-brand-story(48)"
    ],
    "alibaba-international": [
      "aplus-spec(100)",
      "aplus-core-selling(94)",
      "aplus-function(94)",
      "aplus-craft(92)",
      "aplus-detail(90)",
      "aplus-scene-usage(88)",
      "aplus-accessories(84)",
      "aplus-comparison(84)",
      "aplus-size(82)",
      "aplus-hero(80)",
      "aplus-compare(80)",
      "aplus-multi-angle(78)",
      "aplus-space-fit(78)",
      "aplus-ingredient(76)",
      "aplus-audience(76)",
      "aplus-usage-advice(72)",
      "aplus-series(70)",
      "aplus-after-sale(66)",
      "aplus-fit(56)",
      "aplus-atmosphere(54)",
      "aplus-brand-story(42)"
    ],
    "shein": [
      "aplus-hero(96)",
      "aplus-core-selling(94)",
      "aplus-scene-usage(92)",
      "aplus-fit(92)",
      "aplus-detail(90)",
      "aplus-size(86)",
      "aplus-spec(86)",
      "aplus-series(84)",
      "aplus-compare(80)",
      "aplus-craft(80)",
      "aplus-audience(80)",
      "aplus-multi-angle(78)",
      "aplus-atmosphere(78)",
      "aplus-comparison(78)",
      "aplus-ingredient(76)",
      "aplus-accessories(74)",
      "aplus-usage-advice(72)",
      "aplus-space-fit(72)",
      "aplus-function(70)",
      "aplus-brand-story(64)",
      "aplus-after-sale(62)"
    ]
  }
}
```

## 2.1 `ruleLevel` 多规则使用逻辑
### 2.1.1 规则定位
+ `ruleLevel=A`：平台硬倾向，决定模块推荐优先级和主要表达方向。
+ `ruleLevel=B`：平台补充倾向，用于补充布局和信息密度要求。
+ `ruleLevel=C`：低优先级补充描述，超长时可裁剪。

### 2.1.2 组装顺序
1. 先命中平台级 `prompt`
2. 再合并 `required`
3. 再合并 `forbidden`
4. 再对模块级 prompt 追加平台约束

### 2.1.3 冲突处理
+ 若平台倾向和品类推荐冲突，先保留平台 `is_allowed=false` 禁用逻辑。
+ 若平台推荐优先级与用户手动排序冲突，以用户手动排序为准。
+ 若平台要求“理性规格优先”而用户选了大量氛围模块，不拦截，但在规划阶段降低氛围模块排序。

## 3. 品类提示词配置
说明：

+ A+详情图的品类配置不只决定 prompt 内容，还决定：
  - 模块适用范围
  - 推荐模块集合
  - 禁止模块集合
  - 风险提示
+ 当前真实规则源：
  - [aplus_category_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/A+详情图/aplus_category_rules.json)
+ 需求文档展示口径需与通用模板保持一致，品类规则按 `12` 个标准电商品类整理。

推荐品类规则结构：
```json
{
  "categoryRulesByTool": {
    "apparel": {
      "label": "服饰类",
      "aliases": ["服装", "服饰", "上衣", "裤子", "裙子", "内衣"],
      "prompt": "重点突出版型、轮廓、面料纹理、穿搭效果与上身氛围，适合使用场景图、系列展示图、版型说明图。",
      "applicableModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-multi-angle", "aplus-atmosphere", "aplus-detail", "aplus-brand-story", "aplus-size", "aplus-series", "aplus-usage-advice", "aplus-fit", "aplus-audience", "aplus-comparison"],
      "focusPoints": ["版型廓形", "面料纹理", "领口肩线袖型", "穿搭氛围"],
      "promptPatchRules": ["重点突出版型、轮廓、面料纹理、穿搭效果与上身氛围", "若涉及人物展示，应确保穿着逻辑自然，版型真实"],
      "recommendedModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-detail", "aplus-size", "aplus-series", "aplus-fit"],
      "forbiddenModules": ["aplus-craft", "aplus-accessories"],
      "riskRules": ["不要虚构显瘦显高塑形绝对效果", "不要把普通面料生成成高价值材质"]
    },
    "shoes": {
      "label": "鞋靴类",
      "aliases": ["鞋子", "鞋靴", "运动鞋", "凉鞋", "靴子", "皮鞋"],
      "prompt": "重点突出鞋型轮廓、鞋面材质、鞋底结构、穿着风格和多角度外观理解，避免结构变形。",
      "applicableModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-multi-angle", "aplus-detail", "aplus-size", "aplus-series", "aplus-fit", "aplus-audience", "aplus-comparison"],
      "focusPoints": ["鞋型轮廓", "鞋面材质", "鞋底结构", "穿搭风格"],
      "promptPatchRules": ["重点突出鞋型、鞋底、鞋面纹理和穿搭适配感", "多角度展示时要保证左右脚和结构关系真实一致"],
      "recommendedModules": ["aplus-hero", "aplus-detail", "aplus-multi-angle", "aplus-size", "aplus-fit"],
      "forbiddenModules": ["aplus-craft", "aplus-accessories"],
      "riskRules": ["不要虚构增高、矫形等绝对效果", "不要让鞋楦、鞋底结构失真"]
    },
    "bags": {
      "label": "箱包类",
      "aliases": ["箱包", "背包", "手提包", "斜挎包", "拉杆箱", "包袋"],
      "prompt": "重点突出包型、容量感、五金细节、肩带手柄结构和搭配语义，避免包体塌陷或比例失真。",
      "applicableModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-multi-angle", "aplus-detail", "aplus-size", "aplus-series", "aplus-audience", "aplus-comparison", "aplus-brand-story"],
      "focusPoints": ["包型轮廓", "容量感", "五金细节", "搭配语义"],
      "promptPatchRules": ["重点突出包体立体结构、五金、缝线和真实搭配关系", "不得把包体生成成软塌或夸张高奢材质"],
      "recommendedModules": ["aplus-hero", "aplus-detail", "aplus-multi-angle", "aplus-size", "aplus-series"],
      "forbiddenModules": ["aplus-craft", "aplus-accessories"],
      "riskRules": ["不要虚构材质等级或容量规格", "不要让包体受力关系失真"]
    },
    "jewelry_accessories": {
      "label": "珠宝饰品类",
      "aliases": ["珠宝", "饰品", "项链", "耳饰", "戒指", "手链"],
      "prompt": "重点突出金属光泽、镶嵌细节、通透感、佩戴精致度和礼赠属性，整体风格可高级但不能失真。",
      "applicableModules": ["aplus-hero", "aplus-core-selling", "aplus-detail", "aplus-scene-usage", "aplus-atmosphere", "aplus-series", "aplus-size", "aplus-brand-story", "aplus-audience"],
      "focusPoints": ["金属光泽", "镶嵌结构", "通透感", "佩戴精致度"],
      "promptPatchRules": ["重点突出金属、宝石、镶嵌和细节质感", "避免将真实饰品夸张为超高价值珠宝或不真实贵金属材质"],
      "recommendedModules": ["aplus-hero", "aplus-detail", "aplus-series", "aplus-size", "aplus-scene-usage"],
      "forbiddenModules": ["aplus-craft", "aplus-accessories"],
      "riskRules": ["不要虚构材质等级、宝石等级或克重", "不要夸大光泽到失真塑料感"]
    },
    "beauty_personal_care": {
      "label": "美妆个护类",
      "aliases": ["护肤", "彩妆", "香水", "个护"],
      "prompt": "重点突出包装识别度、质地表现、使用步骤和成分卖点，整体风格需干净、可信、专业。",
      "applicableModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-atmosphere", "aplus-detail", "aplus-brand-story", "aplus-ingredient", "aplus-after-sale", "aplus-usage-advice", "aplus-audience", "aplus-comparison"],
      "focusPoints": ["包装识别度", "质地表现", "使用方式", "成分卖点"],
      "promptPatchRules": ["重点突出包装识别度、质地表现、使用步骤和成分卖点，整体风格需干净、可信、专业"],
      "recommendedModules": ["aplus-hero", "aplus-core-selling", "aplus-detail", "aplus-scene-usage", "aplus-ingredient"],
      "forbiddenModules": ["aplus-size", "aplus-series"],
      "riskRules": ["不要使用治疗修复逆龄等高风险表述", "不要虚构医生背书或实验数据"]
    },
    "food_beverage": {
      "label": "食品饮料类",
      "aliases": ["食品", "饮料", "零食", "冲饮", "粮油"],
      "prompt": "重点突出包装识别度、口味/规格信息、食用场景和真实新鲜感，避免把食品饮料表达成夸张广告概念图。",
      "applicableModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-detail", "aplus-spec", "aplus-ingredient", "aplus-series", "aplus-usage-advice", "aplus-audience"],
      "focusPoints": ["包装识别度", "规格口味", "食用场景", "新鲜感"],
      "promptPatchRules": ["重点突出包装识别度、规格/口味信息与真实食用语义", "不得虚构夸张食材、液体飞溅或未经确认的营养功效表达"],
      "recommendedModules": ["aplus-hero", "aplus-core-selling", "aplus-detail", "aplus-spec", "aplus-ingredient"],
      "forbiddenModules": ["aplus-craft", "aplus-brand-story"],
      "riskRules": ["不要虚构配料、营养成分或功效", "不要把普通包装食品生成成夸张料理大片"]
    },
    "home_living": {
      "label": "家居百货类",
      "aliases": ["家居", "百货", "收纳", "生活用品", "日用品", "厨卫用品"],
      "prompt": "重点突出空间适配关系、材质感、使用便利性和日常场景逻辑，适合做居家应用型 A+ 详情表达。",
      "applicableModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-atmosphere", "aplus-detail", "aplus-size", "aplus-spec", "aplus-series", "aplus-usage-advice", "aplus-space-fit", "aplus-audience", "aplus-comparison"],
      "focusPoints": ["空间搭配", "材质纹理", "尺寸适配", "日常使用感"],
      "promptPatchRules": ["重点突出空间适配关系、居家氛围、材质感和使用便利性", "不得把普通百货类商品过度装饰成纯概念家居陈设"],
      "recommendedModules": ["aplus-hero", "aplus-scene-usage", "aplus-detail", "aplus-size", "aplus-space-fit"],
      "forbiddenModules": ["aplus-brand-story"],
      "riskRules": []
    },
    "consumer_electronics": {
      "label": "家电数码类",
      "aliases": ["数码", "耳机", "手机", "电脑", "电子产品", "家电数码", "家电", "电器", "小家电", "厨房电器", "清洁电器"],
      "prompt": "重点突出结构、接口、功能点、使用场景和参数逻辑，整体风格应偏理性、科技、清晰。",
      "applicableModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-multi-angle", "aplus-detail", "aplus-size", "aplus-compare", "aplus-spec", "aplus-craft", "aplus-accessories", "aplus-after-sale", "aplus-usage-advice", "aplus-function", "aplus-comparison"],
      "focusPoints": ["接口", "按键", "结构部件", "连接方式", "参数点"],
      "promptPatchRules": ["重点突出结构、接口、功能点、使用场景和参数逻辑，整体风格应偏理性、科技、清晰", "若为家电类商品，可同步强化操作方式、配件构成与生活便利性表达"],
      "recommendedModules": ["aplus-hero", "aplus-core-selling", "aplus-spec", "aplus-compare", "aplus-accessories", "aplus-function"],
      "forbiddenModules": ["aplus-atmosphere", "aplus-brand-story"],
      "riskRules": ["不得虚构芯片、续航、分辨率、快充功率等参数", "不得写功率、杀菌率、静音值等未确认参数"]
    },
    "furniture_large_items": {
      "label": "家具大件类",
      "aliases": ["家具", "沙发", "桌椅", "床", "柜子", "大件"],
      "prompt": "重点突出体量、空间适配关系、材质纹理、结构比例和居家使用场景，避免比例和透视失真。",
      "applicableModules": ["aplus-hero", "aplus-scene-usage", "aplus-space-fit", "aplus-detail", "aplus-size", "aplus-spec", "aplus-atmosphere", "aplus-audience", "aplus-usage-advice"],
      "focusPoints": ["体量比例", "空间适配", "材质纹理", "居家场景"],
      "promptPatchRules": ["重点突出空间比例和摆放逻辑", "背景空间与商品尺寸关系必须真实，不得压缩或拉伸商品体量"],
      "recommendedModules": ["aplus-scene-usage", "aplus-space-fit", "aplus-size", "aplus-detail", "aplus-hero"],
      "forbiddenModules": ["aplus-craft", "aplus-compare"],
      "riskRules": ["不要虚构尺寸关系", "不要制造不真实透视或空间占比"]
    },
    "mother_baby_toys": {
      "label": "母婴玩具类",
      "aliases": ["母婴", "婴童", "玩具", "宝宝用品", "儿童用品"],
      "prompt": "重点突出安全感、材质柔和度、使用方式、组件完整性和适龄语义，整体表达要温和可信。",
      "applicableModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-detail", "aplus-spec", "aplus-accessories", "aplus-usage-advice", "aplus-audience", "aplus-series"],
      "focusPoints": ["安全感", "材质柔和", "组件完整", "使用方式"],
      "promptPatchRules": ["重点突出安全感和使用引导", "不得引入危险姿态、夸张功能或不合规儿童使用场景"],
      "recommendedModules": ["aplus-hero", "aplus-core-selling", "aplus-detail", "aplus-accessories", "aplus-usage-advice"],
      "forbiddenModules": ["aplus-atmosphere", "aplus-brand-story"],
      "riskRules": ["不要虚构安全认证或材质承诺", "不要生成危险使用场景"]
    },
    "pet_supplies": {
      "label": "宠物用品类",
      "aliases": ["宠物", "猫狗用品", "宠物周边", "猫用品", "狗用品"],
      "prompt": "重点突出耐用感、清洁便利性、结构细节、适用对象和真实使用语义，默认不过度依赖宠物模特。",
      "applicableModules": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-detail", "aplus-spec", "aplus-accessories", "aplus-usage-advice", "aplus-audience", "aplus-comparison"],
      "focusPoints": ["耐用感", "清洁便利", "结构细节", "适用对象"],
      "promptPatchRules": ["重点突出商品本体和使用价值", "除非已确认，否则不要默认加入宠物模特作为主叙事主体"],
      "recommendedModules": ["aplus-core-selling", "aplus-detail", "aplus-spec", "aplus-usage-advice", "aplus-audience"],
      "forbiddenModules": ["aplus-brand-story", "aplus-atmosphere"],
      "riskRules": ["不要虚构材质安全性或适宠功效", "不要让宠物表演压过商品本体"]
    },
    "hardware_auto_parts": {
      "label": "汽配五金类",
      "aliases": ["汽配", "五金", "工具", "机械", "配件耗材", "零部件"],
      "prompt": "重点突出规格、结构、工艺、应用场景和采购判断信息，整体风格应专业、工程化、可信。",
      "applicableModules": ["aplus-scene-usage", "aplus-detail", "aplus-size", "aplus-compare", "aplus-spec", "aplus-craft", "aplus-accessories", "aplus-after-sale", "aplus-usage-advice", "aplus-function", "aplus-comparison", "aplus-audience"],
      "focusPoints": ["规格", "结构", "工艺", "应用场景", "接口尺寸逻辑"],
      "promptPatchRules": ["重点突出规格、结构、工艺、应用场景和采购判断信息，整体风格应专业、工程化、可信"],
      "recommendedModules": ["aplus-spec", "aplus-craft", "aplus-accessories", "aplus-detail", "aplus-function"],
      "forbiddenModules": ["aplus-atmosphere", "aplus-brand-story", "aplus-series"],
      "riskRules": ["不要虚构行业标准、认证、材质等级"]
    }
  }
}
```

说明：
+ `label` 用于标准品类名输出
+ `aliases` 用于商品名称、商品识别结果和人工选择的归一
+ `prompt` 用于品类级内容约束
+ `applicableModules` 用于限定该品类天然适用的模块范围
+ `focusPoints` 用于 prompt 增强和人工校验
+ `promptPatchRules` 用于补充品类的展示重点和额外提示词 patch
+ `recommendedModules / forbiddenModules` 用于规划阶段推荐排序和禁用过滤

## 4. 高级选项值扩展提示词配置
说明：

+ A+详情图当前真实关键字段不是“人物/场景选项”，而是详情内容策略字段。
+ 当前真实规划更依赖：
  - `setPackPlatform`
  - `setPackMarket`
  - `copyLanguage`
  - `setPackVisualStyle`
  - `setPackScenario`
+ 这些字段如果只传原始值，不足以指导模块规划和最终 prompt。

真实配置参考：
+ [aplus_market_field_value_prompts.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/A+详情图/aplus_market_field_value_prompts.json)

推荐扩展结构：
```json
{
  "optionValueExpansionsByTool": {
    "setPackPlatform": {
      "fieldKey": "setPackPlatform",
      "name": "目标平台",
      "values": {
        "1688": { "valuePrompt": "适配 1688 采购型详情页，强调规格、结构、材质、配件和应用信息，服务于理性采购决策。" },
        "亚马逊": { "valuePrompt": "适配 Amazon A+ 内容语境，强调信息结构清晰、品牌表达克制、卖点与参数真实可信。" },
        "Temu": { "valuePrompt": "强调价值点直给、对比清楚、信息读取效率高，同时保持商品主体清晰可信。" },
        "TikTok Shop": { "valuePrompt": "强调首屏吸引力、生活方式表达与快速理解，画面更抓眼但商品识别度不能下降。" },
        "速卖通": { "valuePrompt": "适配跨境详情页表达，突出商品优势、规格信息和全球消费者易理解的版式，不堆砌复杂本地化符号。" },
        "Shopee": { "valuePrompt": "强调卖点模块清楚、信息密度适中、场景与商品关系直接明了。" },
        "阿里国际站": { "valuePrompt": "强调结构化信息、材质工艺、规格参数和专业可信度。" },
        "OZON": { "valuePrompt": "整体偏理性、规范、清晰，参数说明和使用价值要明确，避免夸张营销话术。" },
        "SHEIN": { "valuePrompt": "强调年轻化视觉、穿搭/生活方式氛围、颜色吸引力和浏览节奏。" },
        "淘宝": { "valuePrompt": "适配淘宝详情页语境，强调卖点直给、信息读取高效和模块节奏紧凑，兼顾转化表达与商品主体清晰度。" },
        "天猫": { "valuePrompt": "适配天猫详情内容，强调品牌感、品质感和更精致的版式层级，避免廉价促销海报感。" },
        "京东": { "valuePrompt": "适配京东详情页阅读习惯，强调参数清晰、卖点理性、结构规整和功能说明可信。" },
        "拼多多": { "valuePrompt": "适配拼多多详情语境，强调价值点直观、利益点明确和信息快速读取，避免过度留白。" },
        "抖音电商": { "valuePrompt": "适配抖音电商详情内容，强调首屏吸引力、场景代入感和快速理解，但仍要保持商品识别清楚。" },
        "快手电商": { "valuePrompt": "适配快手电商详情语境，强调真实感、卖点直给和信任建立，减少过度包装和空泛品牌表达。" },
        "小红书电商": { "valuePrompt": "适配小红书电商详情内容，强调生活方式、审美氛围和真实种草感，避免强货架式促销表达。" }
      }
    },
    "setPackMarket": {
      "fieldKey": "setPackMarket",
      "name": "目标市场",
      "values": {
        "大陆": { "valuePrompt": "信息传达直接高效，卖点标题醒目，画面节奏紧凑但不杂乱。" },
        "北美": { "valuePrompt": "强调简洁层级、留白、真实质感和理性价值表达，避免信息过载。" },
        "韩国": { "valuePrompt": "画面干净精致、配色克制柔和，强调细节质感、精修感和生活方式氛围。" },
        "日本": { "valuePrompt": "构图规整、说明清楚、信息精炼，突出细节可信度与温和克制的品质感。" },
        "俄罗斯": { "valuePrompt": "强调商品功能清晰、价值表达直接、色彩对比明确，提升阅读和转化效率。" },
        "中东阿拉伯": { "valuePrompt": "视觉可更饱满精致，强调品质感、礼赠感与尊贵气质，同时保证信息清楚。" },
        "港澳": { "valuePrompt": "整体表达利落现代，注重品牌感、都会感与信息阅读效率。" },
        "中国台湾": { "valuePrompt": "风格清爽细腻，版面有秩序，卖点表达自然不过度叫卖。" },
        "土耳其": { "valuePrompt": "画面兼顾时尚感与实用价值，色彩和氛围可适度增强但不失清晰度。" },
        "南美": { "valuePrompt": "整体更有活力和感染力，色彩可适当更明亮，突出场景带入感和情绪表达。" },
        "澳洲": { "valuePrompt": "强调自然光感、真实生活方式与轻松高级感，避免过重促销氛围。" },
        "东南亚": { "valuePrompt": "强调高效转化、亮眼配色、重点直给和真实场景，避免版面过空。" },
        "印度": { "valuePrompt": "强调价值感、功能收益和信息完整度，色彩可更鲜明但结构必须清楚。" },
        "非洲": { "valuePrompt": "强调实用价值、耐用感和可理解的信息结构，画面明快直接、主体突出。" },
        "英国": { "valuePrompt": "强调克制、整洁和专业感，突出真实品质与条理化信息表达。" },
        "德国": { "valuePrompt": "强调理性说明、参数清楚、功能逻辑明确，避免花哨装饰和模糊表达。" },
        "法国": { "valuePrompt": "强调审美质感、版式呼吸感和品牌气质，卖点表达精炼而有设计感。" },
        "欧洲": { "valuePrompt": "整体简洁规范、强调品质与结构逻辑，兼顾品牌感和真实可信度。" },
        "东欧": { "valuePrompt": "强调功能直观、画面清晰和信息强可读性，避免过度抽象的品牌表达。" }
      }
    },
    "copyLanguage": {
      "fieldKey": "copyLanguage",
      "name": "文案语种",
      "values": {
        "无文案": { "valuePrompt": "以纯视觉和留白模块为主，只保留必要信息区，不主动生成大段标题说明。" },
        "简体中文": { "valuePrompt": "标题与说明使用简体中文，表达直接、自然易懂，适合电商详情页快速阅读。" },
        "繁体中文": { "valuePrompt": "使用繁体中文排版，语气自然专业，兼顾阅读顺畅与品牌质感。" },
        "英文": { "valuePrompt": "使用简洁自然的英文标题与说明，避免中式英文，控制句长，强调清晰和专业。" },
        "中英文混排": { "valuePrompt": "中英文需有明确主次层级，避免两种语言重复堆叠，适合跨境展示和品牌表达。" },
        "俄语": { "valuePrompt": "使用规范俄语排版，标题精炼清楚，避免过长句式，确保信息易识别。" },
        "日语": { "valuePrompt": "使用自然简洁的日语表达，强调礼貌克制、信息清楚和结构有序。" },
        "韩语": { "valuePrompt": "使用自然韩语表达，版式精致清爽，标题短句化，符合韩系详情页阅读习惯。" },
        "印地语": { "valuePrompt": "使用规范印地语排版，确保信息清楚、重点前置，避免复杂混排。" },
        "德语": { "valuePrompt": "使用准确简洁的德语表达，强调理性说明、参数逻辑和信息完整度。" },
        "法语": { "valuePrompt": "使用自然精炼的法语表达，兼顾审美感与专业度，避免生硬直译。" },
        "西班牙语": { "valuePrompt": "使用清晰自然的西班牙语表达，突出卖点与收益，保持阅读流畅。" },
        "葡萄牙语": { "valuePrompt": "使用自然规范的葡萄牙语表达，重点明确、句长适中，适合电商详情阅读。" },
        "阿拉伯语": { "valuePrompt": "使用规范阿拉伯语排版，注意文字阅读方向和版面平衡，重点信息需清楚聚焦。" },
        "泰语": { "valuePrompt": "使用自然泰语表达，标题精炼，说明易读，避免过密排版。" },
        "荷兰语": { "valuePrompt": "使用准确简洁的荷兰语表达，强调信息结构清楚和专业可信。" },
        "土耳其语": { "valuePrompt": "使用自然土耳其语表达，卖点前置、语句清楚，兼顾转化与阅读体验。" }
      }
    },
    "setPackVisualStyle": {
      "fieldKey": "setPackVisualStyle",
      "name": "视觉风格",
      "values": {
        "简约清新风": { "valuePrompt": "整体干净通透、留白充足、色彩轻盈柔和，突出自然、舒适、清爽、有呼吸感的详情页视觉。" },
        "高级质感风": { "valuePrompt": "强调材质细节、光影层次和品牌感，色彩克制，版式精致，突出高客单感和品质感。" },
        "活泼吸睛风": { "valuePrompt": "色彩对比适度增强，构图更有节奏感，突出年轻感、识别度和停留吸引力。" },
        "复古怀旧风": { "valuePrompt": "加入复古配色、年代纹理或怀旧氛围，但保持商品主体清晰，强调故事感和温度感。" },
        "场景写实风": { "valuePrompt": "强调真实环境、自然光感和可信使用状态，避免过度 CG 化，突出商品在实际场景中的价值表达。" },
        "科技未来风": { "valuePrompt": "强调理性秩序、科技感光效、结构线条和未来气质，适合功能型与数码型商品。" },
        "国风古韵风": { "valuePrompt": "融入东方审美元素、雅致留白和文化气质，避免符号堆砌，强调高级、含蓄、有韵味的国风表达。" }
      }
    },
    "setPackScenario": {
      "fieldKey": "setPackScenario",
      "name": "详情场景方向",
      "type": "free-text",
      "valuePromptRule": "当前代码中 `setPackScenario` 不是固定 options 字段，而是商品信息区的自由输入/AI帮写字段。开发侧不应为它维护枚举池，而应将原始语义归纳为一段场景方向约束，再直接拼入规划阶段和单模块生成阶段。",
      "examples": {
        "真实使用场景": { "valuePrompt": "模块规划应优先包含场景使用、卖点强化和使用收益表达。" },
        "参数说明导向": { "valuePrompt": "模块规划应优先包含规格参数、功能拆解、配件清单和理性对比模块。" },
        "品牌质感导向": { "valuePrompt": "模块规划应优先包含首屏主视觉、品牌故事、氛围场景和细节工艺模块。" },
        "多SKU展示导向": { "valuePrompt": "模块规划应优先包含系列展示、尺寸/规格、对比说明和适用对象模块。" }
      }
    }
  }
}
```

开发说明：
+ `setPackPlatform / setPackMarket / copyLanguage / setPackVisualStyle` 使用全量固定值映射。
+ `setPackScenario` 当前不是固定选项，不要伪造全量值池；应按自由文本字段处理。
+ 若后续页面把 `setPackScenario` 改成下拉项，再补成真正的 `values` 全量映射。

## 5. 模块提示词配置
说明：

+ A+ 的核心不是“整套只拼一条 prompt”，而是“先规划模块，再按模块逐个拼 prompt”。
+ 当前真实模块定义源：
  - [aplus_module_definitions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/A+详情图/aplus_module_definitions.json)
+ 每个模块应至少包含：
  - `base_prompt_template`
  - `base_negative_prompt`
  - `default_layout_guidance`
  - `default_text_guidance`
  - `payload_schema`
  - `payload_prompt_template`

开发使用规则：
+ 第 1 步规划输出 `modules[]`
+ 第 2 步生成时，针对每个 module：
  1. 读取模块定义
  2. 注入平台/品类/市场/语种/风格 patch
  3. 注入当前模块编辑内容
  4. 生成单模块最终 prompt

推荐模块规则结构：
```json
{
  "moduleDefinitionsByTool": {
    "aplus-hero": {
      "moduleName": "首屏主视觉",
      "moduleCategory": "首屏模块",
      "moduleDescription": "传递核心价值",
      "basePrompt": "生成适合 A+详情页首屏的主视觉模块图，突出商品核心价值、品牌质感和视觉冲击力。",
      "baseNegative": "不要做成纯促销海报，不要让文字遮挡商品主体，不要信息过满。",
      "layoutGuidance": "大视觉主图，预留标题、副标题和品牌表达区域",
      "textGuidance": "适合主标题+副标题+品牌短句"
    },
    "aplus-core-selling": {
      "moduleName": "核心卖点图",
      "moduleCategory": "卖点模块",
      "moduleDescription": "突出差异优势",
      "basePrompt": "围绕 1 到 2 个核心卖点进行图文强化，突出商品差异化优势与用户收益。",
      "baseNegative": "不要堆叠过多卖点，不要卖点与商品无关，不要夸大不存在的功能。",
      "layoutGuidance": "商品主体加卖点分区，适合一主两辅结构",
      "textGuidance": "适合主标题+1到2条卖点短句"
    },
    "aplus-scene-usage": {
      "moduleName": "使用场景图",
      "moduleCategory": "场景模块",
      "moduleDescription": "呈现真实使用场景",
      "basePrompt": "将商品自然融入真实场景中，体现具体使用情境下的价值表达。",
      "baseNegative": "不要场景喧宾夺主，不要商品不可辨识，不要脱离真实使用逻辑。",
      "layoutGuidance": "场景图为主，商品清晰可见",
      "textGuidance": "适合主标题+场景收益说明"
    },
    "aplus-multi-angle": {
      "moduleName": "多角度图",
      "moduleCategory": "展示模块",
      "moduleDescription": "多角度呈现外观",
      "basePrompt": "通过多个视角清晰展示商品外观结构、正侧背面或关键角度，帮助用户快速理解商品全貌与结构。",
      "baseNegative": "不要不同角度颜色不一致，不要比例错误，不要出现互相矛盾的结构。",
      "layoutGuidance": "宫格或一主多辅结构，主视角更突出",
      "textGuidance": "适合角度标签和结构说明短句"
    },
    "aplus-atmosphere": {
      "moduleName": "场景氛围图",
      "moduleCategory": "场景模块",
      "moduleDescription": "展示使用场景",
      "basePrompt": "围绕商品调性营造更强的生活方式或氛围感表达，强化审美吸引力与情绪价值。",
      "baseNegative": "不要让氛围压过商品本体，不要脱离商品真实使用语境，不要空泛摆拍。",
      "layoutGuidance": "氛围大图为主，商品仍需明确可辨",
      "textGuidance": "适合短标题+情绪化价值短句"
    },
    "aplus-detail": {
      "moduleName": "商品细节图",
      "moduleCategory": "细节模块",
      "moduleDescription": "放大材质与工艺",
      "basePrompt": "用局部特写放大商品材质、纹理、做工和结构细节，增强信任感和品质感。",
      "baseNegative": "不要虚构不存在的细节，不要夸大材质等级，不要过度锐化。",
      "layoutGuidance": "特写或整体图加局部放大结构",
      "textGuidance": "适合局部特征短标题+工艺说明"
    },
    "aplus-fit": {
      "moduleName": "版型说明图",
      "moduleCategory": "版型模块",
      "moduleDescription": "说明版型与穿着效果",
      "basePrompt": "围绕版型、廓形、剪裁、上身效果或适配关系做图文说明，帮助用户理解穿着效果与适用特征。",
      "baseNegative": "不要虚构显瘦显高塑形等绝对效果，不要制造不真实的人体比例或穿着状态。",
      "layoutGuidance": "人物或商品轮廓配合版型标注区域",
      "textGuidance": "适合版型标签+剪裁说明短句"
    },
    "aplus-function": {
      "moduleName": "功能拆解图",
      "moduleCategory": "功能模块",
      "moduleDescription": "拆解结构与功能逻辑",
      "basePrompt": "将商品核心功能、结构组件、工作方式或使用逻辑做拆解展示，帮助用户快速理解功能价值。",
      "baseNegative": "不要虚构不存在的结构、配件、技术方案或功能效果。",
      "layoutGuidance": "主体加结构标注，支持拆解箭头或信息卡",
      "textGuidance": "适合功能标题+分点说明"
    },
    "aplus-space-fit": {
      "moduleName": "空间适配图",
      "moduleCategory": "空间模块",
      "moduleDescription": "展示空间尺寸与适配效果",
      "basePrompt": "结合真实空间或尺寸参照，展示商品在不同空间中的摆放、占比、适配关系与使用效果。",
      "baseNegative": "不要虚构空间尺度，不要夸大商品尺寸，不要制造与真实使用不符的摆放关系。",
      "layoutGuidance": "空间场景图加尺寸或参照物说明",
      "textGuidance": "适合空间标签+适配说明"
    },
    "aplus-audience": {
      "moduleName": "适用人群图",
      "moduleCategory": "人群模块",
      "moduleDescription": "说明适合的人群与使用对象",
      "basePrompt": "围绕适合的人群、使用对象、细分需求或典型使用者特征做图文说明，帮助用户快速判断是否适合自己。",
      "baseNegative": "不要虚构不具备依据的人群结论，不要使用歧视性、夸大性或不真实的人群标签。",
      "layoutGuidance": "人群分组或人物场景配合商品展示",
      "textGuidance": "适合人群标签+适配理由短句"
    },
    "aplus-comparison": {
      "moduleName": "对比说明图",
      "moduleCategory": "对比模块",
      "moduleDescription": "对比方案差异与选择理由",
      "basePrompt": "通过不同方案、型号、配置、状态或使用方式的对比说明，帮助用户理解差异点、优势和选择理由。",
      "baseNegative": "不要虚构对比对象，不要夸张优劣差异，不要制造缺乏依据的性能结论。",
      "layoutGuidance": "左右或上下对比结构，差异点清晰",
      "textGuidance": "适合对比标题+差异项说明"
    },
    "aplus-spec": {
      "moduleName": "详细规格/参数表",
      "moduleCategory": "参数模块",
      "moduleDescription": "展示详细商品数据",
      "basePrompt": "用表格或信息卡形式展示详细规格参数、材质信息和产品数据。",
      "baseNegative": "不要虚构参数或材质成分，不要排版混乱。",
      "layoutGuidance": "参数表或卡片式信息模块，规整清晰",
      "textGuidance": "适合参数标题+列表/表格内容"
    },
    "aplus-brand-story": {
      "moduleName": "品牌故事图",
      "moduleCategory": "品牌模块",
      "moduleDescription": "传达品牌理念",
      "basePrompt": "结合品牌调性、产品理念和视觉叙事，输出更具品牌表达的详情模块。",
      "baseNegative": "不要变成活动海报，不要文案堆叠，不要用与品牌气质不符的强叫卖表达。",
      "layoutGuidance": "大图叙事加品牌短句区域",
      "textGuidance": "适合品牌标题+理念短句"
    },
    "aplus-size": {
      "moduleName": "尺寸/容量/尺码图",
      "moduleCategory": "参数模块",
      "moduleDescription": "展示规格信息",
      "basePrompt": "清晰呈现尺寸、容量、尺码或规格信息，帮助用户快速理解大小和适配关系。",
      "baseNegative": "不要虚构尺寸和容量数据，不要比例夸张，不要让版式影响可读性。",
      "layoutGuidance": "商品主图配尺寸线、表格或尺码说明区",
      "textGuidance": "适合尺寸标题+关键数值说明"
    },
    "aplus-compare": {
      "moduleName": "效果对比图",
      "moduleCategory": "对比模块",
      "moduleDescription": "使用前后效果对比",
      "basePrompt": "通过使用前后、不同方案或有无对照结构，直观呈现商品带来的体验差异或优势提升。",
      "baseNegative": "不要夸张前后差异，不要制造违背常识的结果，不要虚构医学化或绝对化效果。",
      "layoutGuidance": "前后对照或双栏对比结构",
      "textGuidance": "适合 before/after 或方案对照短句"
    },
    "aplus-craft": {
      "moduleName": "工艺制作图",
      "moduleCategory": "工艺模块",
      "moduleDescription": "展示工艺制作过程",
      "basePrompt": "拆解制作工艺、生产流程或结构工法，强化品质背书和工艺可信度。",
      "baseNegative": "不要虚构工艺流程，不要制造不存在的生产场景，不要泛泛而谈缺乏对应关系。",
      "layoutGuidance": "流程式或工艺节点式结构",
      "textGuidance": "适合工艺标题+步骤或节点说明"
    },
    "aplus-accessories": {
      "moduleName": "配件/赠品图",
      "moduleCategory": "配件模块",
      "moduleDescription": "明确收货的所有物品",
      "basePrompt": "清晰列出随箱配件、赠品或包装内容，避免信息遗漏，并帮助用户理解收货清单。",
      "baseNegative": "不要虚构赠品或配件，不要数量错乱，不要主件和配件关系不清。",
      "layoutGuidance": "主件加配件平铺或清单式结构",
      "textGuidance": "适合清单标题+逐项列举"
    },
    "aplus-series": {
      "moduleName": "系列展示图",
      "moduleCategory": "系列模块",
      "moduleDescription": "多色或多SKU展示",
      "basePrompt": "展示系列款式、多色、多规格或 SKU 组合，便于用户横向比较和选择。",
      "baseNegative": "不要展示不存在的颜色或SKU，不要让系列关系混乱，不要虚构组合差异。",
      "layoutGuidance": "矩阵式或并列式多SKU展示",
      "textGuidance": "适合系列标题+SKU标签"
    },
    "aplus-ingredient": {
      "moduleName": "商品成分图",
      "moduleCategory": "成分模块",
      "moduleDescription": "展示配方/材质/成分",
      "basePrompt": "图文展示原料、配方、面料或核心成分及其对应价值，仅能使用已确认信息。",
      "baseNegative": "不要虚构原料或成分含量，不要医学化、疗效化，不要使用未经确认的高价值原料。",
      "layoutGuidance": "成分主视觉配信息卡或成分节点说明",
      "textGuidance": "适合成分标题+价值短句"
    },
    "aplus-after-sale": {
      "moduleName": "售后保障图",
      "moduleCategory": "保障模块",
      "moduleDescription": "说明质保退换政策",
      "basePrompt": "明确售后保障、质保时效、退换政策和服务承诺，降低用户决策顾虑。",
      "baseNegative": "不要虚构售后政策，不要承诺无法兑现的服务，不要用强促销海报式表达代替保障说明。",
      "layoutGuidance": "保障卡片或图标分栏结构",
      "textGuidance": "适合保障标题+条目说明"
    },
    "aplus-usage-advice": {
      "moduleName": "使用建议图",
      "moduleCategory": "说明模块",
      "moduleDescription": "商品使用的注意事项",
      "basePrompt": "补充使用方法、注意事项、保养建议或适用提醒，帮助用户获得更好的使用体验。",
      "baseNegative": "不要虚构使用方法，不要给出错误保养建议，不要产生安全误导。",
      "layoutGuidance": "说明卡片或步骤提醒结构",
      "textGuidance": "适合建议标题+注意事项列表"
    }
  }
}
```

补充说明：
+ 当前真实功能内全量模块共 `21` 个，上述清单需与 `aplus_module_definitions.json` 保持一致，不能只保留示例模块。
+ 若后续模块定义新增或删减，需求文档这一节应同步更新，避免研发、算法、测试按过期模块集实现。

## 6. 拼装规则
### 6.1 规划阶段拼装顺序
1. `planTask`（规划任务目标）
2. `platformRule`（平台规划约束）
3. `categoryRule`（品类规划约束）
4. `strategyParams`（策略参数行）
5. `optionValuePrompts`（字段值扩展约束）
6. `moduleSelection`（已选模块集合）
7. `modulePriorityHints`（模块优先级提示）
8. `planNegative`（规划阶段负向约束）
9. `planOutputSchema`（规划输出结构要求）

### 6.2 单模块生成阶段拼装顺序
1. `moduleTask`（模块生成任务目标）
2. `platformRule`（平台约束）
3. `categoryRule`（品类约束）
4. `moduleDefinition`（模块基础提示词）
5. `modulePayloadPrompt`（模块载荷提示）
6. `strategyParams`（平台/市场/语种/风格/场景）
7. `requiredRules`（必须满足）
8. `forbiddenRules`（禁止事项）
9. `universalNegative`（通用负向约束）
10. `universalQuality`（通用质量要求）

### 6.3 通用负向约束
```json
1. 严禁虚构商品不存在的结构、成分、参数、功能、配件、赠品、认证、服务承诺和适用效果。
2. 严禁把 A+详情图做成强促销海报、主图白底图、活动 banner 或无关品牌KV。
3. 严禁让文字信息遮挡商品主体或关键结构，模块图应服务详情页阅读而非牺牲商品识别度。
4. 严禁不同模块之间商品颜色、材质、结构、包装和SKU语义前后不一致。
5. 严禁使用高风险功效表达、绝对化承诺、未经确认的医学化/疗效化/性能化说法。
6. 严禁生成侵权 logo、水印、二维码、虚构徽章、虚构实验室或权威背书元素。
7. 严禁氛围、场景、品牌叙事压过商品本体与真实转化信息。
8. 严禁把虚拟服务类模块错误生成成实体商品材质、包装、做工或工业细节。
```

### 6.4 通用质量要求
```json
1. 每个模块都必须清楚回答一个详情页问题：卖点是什么、怎么用、参数是什么、差异在哪里、适合谁。
2. 模块间视觉语言要统一，商品主体、材质、颜色、拍摄逻辑和文案口径应保持一致。
3. 标题、短句、参数区和标签区的布局必须清晰可读，符合详情页信息消费习惯。
4. 场景类模块要真实可信，参数类模块要理性规范，品牌类模块要克制不虚浮。
5. 若涉及对比、参数、成分、保障、服务，必须以已确认信息为准，宁缺毋滥。
6. 最终结果要形成“可读、可信、可排序、可编排”的详情页模块集合，而不是彼此无关的单张营销图。
```

## 6.5 规划阶段拼装模板
```json
你是一位电商 A+详情页模块策划师。请为当前商品规划一组适合详情页编排的内容模块。

平台约束：{platformPrompt}
品类约束：{categoryPrompt}
策略参数：平台={setPackPlatform}；市场={setPackMarket}；文案语种={copyLanguage}；视觉风格={setPackVisualStyle}；详情场景方向={setPackScenario}。
字段扩展约束：
[目标平台] {setPackPlatformValuePrompt}
[目标市场] {setPackMarketValuePrompt}
[文案语种] {copyLanguageValuePrompt}
[视觉风格] {setPackVisualStyleValuePrompt}
[详情场景方向] {setPackScenarioValuePrompt}
商品信息：商品名称={setPackProductName}；核心卖点={setPackSellingPoints}；适用对象={setPackAudience}；参数补充={setPackParameters}。
已选模块：{selectedModuleNames}
模块优先级提示：{modulePriorityHints}
通用负向约束：{planNegative}

输出要求：
1. 输出 summary 数组，总结商品价值、卖点重点、详情页叙事方向。
2. 输出 modules 数组，仅包含已选模块。
3. 每个 module 至少包含 id、category、headline、lines。
4. 模块顺序应符合平台偏好、品类逻辑和阅读节奏。
```

## 6.6 单模块生成阶段拼装模板
```json
请生成一张适合 A+详情页的模块图。

平台约束：{platformPrompt}
品类约束：{categoryPrompt}
模块类型：{moduleCategory} / {moduleName}
模块基础要求：{moduleBasePrompt}
模块布局说明：{moduleLayoutGuidance}
模块文案说明：{moduleTextGuidance}
模块编辑内容：headline={moduleHeadline}；lines={moduleLinesJoined}
模块载荷约束：{modulePayloadPrompt}
策略参数：平台={setPackPlatform}；市场={setPackMarket}；文案语种={copyLanguage}；视觉风格={setPackVisualStyle}；详情场景方向={setPackScenario}。
字段扩展约束：
[目标平台] {setPackPlatformValuePrompt}
[目标市场] {setPackMarketValuePrompt}
[文案语种] {copyLanguageValuePrompt}
[视觉风格] {setPackVisualStyleValuePrompt}
[详情场景方向] {setPackScenarioValuePrompt}
必须满足：{requiredRulesJoined}
禁止事项：{forbiddenRulesJoined}
通用负向约束：{universalNegative}
通用质量要求：{universalQuality}
```

## 7. 拼装 Demo（输入 + 输出）
### 7.1 Demo 输入
```json
{
  "toolKey": "set-aplus",
  "uploadCount": 3,
  "creationMode": {
    "modeId": "set-pack-standard",
    "ratio": "1:1",
    "resolution": "1K",
    "count": 6,
    "unitCreditCost": 5
  },
  "advancedSelections": {
    "setPackProductName": "降噪蓝牙耳机",
    "setPackSellingPoints": "主动降噪\n长续航\n舒适佩戴",
    "setPackPlatform": "亚马逊",
    "setPackMarket": "北美",
    "copyLanguage": "英文",
    "setPackVisualStyle": "高级质感风",
    "setPackScenario": "真实使用场景",
    "setPackAudience": "通勤、办公、差旅人群",
    "setPackParameters": "蓝牙5.3 / 40小时续航 / Type-C充电",
    "setPackSelectedTypes": "[\"aplus-hero\",\"aplus-core-selling\",\"aplus-scene-usage\",\"aplus-detail\",\"aplus-spec\",\"aplus-accessories\"]"
  }
}
```

### 7.2 Demo 输出（规划阶段）
```json
{
  "summary": [
    "当前商品为偏品质型的数码耳机，详情页应突出降噪、续航和舒适佩戴三类核心价值。",
    "平台为亚马逊、市场为北美，整体风格应理性清晰、品牌表达克制，不做强促销海报感。",
    "模块节奏建议从首屏价值切入，再进入卖点强化、真实场景、细节质感、规格参数和配件清单。"
  ],
  "modules": [
    {
      "id": "aplus-hero",
      "category": "首屏主视觉",
      "headline": "Immersive Sound, Everyday Comfort",
      "lines": [
        "Premium noise cancelling wireless headphones",
        "Built for commuting, work and travel"
      ]
    },
    {
      "id": "aplus-core-selling",
      "category": "核心卖点图",
      "headline": "3 Key Reasons to Choose It",
      "lines": [
        "Active noise cancelling for focused listening",
        "Up to 40 hours battery life",
        "Soft-fit design for long wear comfort"
      ]
    },
    {
      "id": "aplus-scene-usage",
      "category": "使用场景图",
      "headline": "From Commute to Desk",
      "lines": [
        "Fits naturally into everyday listening scenarios",
        "Clear product presence with realistic usage context"
      ]
    },
    {
      "id": "aplus-detail",
      "category": "商品细节图",
      "headline": "See the Finish Up Close",
      "lines": [
        "Highlight ear cushion texture and headband finish",
        "Emphasize build quality and comfort detail"
      ]
    },
    {
      "id": "aplus-spec",
      "category": "详细规格/参数表",
      "headline": "Specifications at a Glance",
      "lines": [
        "Bluetooth 5.3",
        "40-hour battery life",
        "USB-C charging"
      ]
    },
    {
      "id": "aplus-accessories",
      "category": "配件/赠品图",
      "headline": "What’s in the Box",
      "lines": [
        "Headphones",
        "Charging cable",
        "User guide"
      ]
    }
  ]
}
```

### 7.3 Demo 输出（单模块最终 prompt 示例：`aplus-spec`）
```json
请生成一张适合 A+详情页的模块图。

平台约束：适配 Amazon A+ 内容语境，强调信息结构清晰、品牌表达克制、卖点与参数真实可信，不做强促销海报感。
品类约束：重点突出结构、接口、功能点、使用场景和参数逻辑，整体风格应偏理性、科技、清晰。
模块类型：参数模块 / 详细规格/参数表
模块基础要求：用表格或信息卡形式展示详细规格参数、材质信息和产品数据。
模块布局说明：参数表或卡片式信息模块，规整清晰
模块文案说明：适合参数标题+列表/表格内容
模块编辑内容：headline=Specifications at a Glance；lines=Bluetooth 5.3 / 40-hour battery life / USB-C charging
模块载荷约束：参数项应结构化展示，信息真实，不虚构额外规格。
策略参数：平台=亚马逊；市场=北美；文案语种=英文；视觉风格=高级质感风；详情场景方向=真实使用场景。
字段扩展约束：
[目标平台] 适配 Amazon A+ 内容语境，强调信息结构清晰、品牌表达克制、卖点与参数真实可信。
[目标市场] 强调简洁层级、留白、真实质感和理性价值表达，避免信息过载。
[文案语种] 使用简洁自然的英文标题与说明，避免中式英文，控制句长，强调清晰和专业。
[视觉风格] 强调材质细节、光影层次和品牌感，色彩克制，版式精致，突出高客单感和品质感。
[详情场景方向] 模块规划应优先包含场景使用、卖点强化和使用收益表达。
必须满足：参数规格真实，商品主体清晰，版式规整，信息易读。
禁止事项：虚构参数，排版混乱，促销海报化，商品结构与参数矛盾。
通用负向约束：严禁虚构商品不存在的结构、成分、参数、功能、配件、赠品、认证、服务承诺和适用效果。
通用质量要求：每个模块都必须清楚回答一个详情页问题，模块间视觉语言统一，参数区清晰可读。
```

## 8. 三个关键能力的提示词配置
### 8.1 图片识别获取信息
用途：
+ 识别商品名称、商品品类、核心卖点线索和适合的 A+ 模块方向；
+ 输出结构化 JSON，供 A+ 规划阶段回填；
+ 推荐模块、平台风格和风险点，而不是直接生成最终图。

提示词：
```json
你是一位电商 A+详情页策划助手。请根据输入商品图和商品标题信息，提取适合 set-aplus 的结构化规划字段，并严格输出 JSON。

任务要求：
1. 识别商品所属品类，并归一到 categoryRulesByTool 的标准品类。
2. 提取商品名称、核心卖点关键词、适合的详情场景方向、适用对象线索。
3. 推荐适合的 A+ 模块类型，模块必须从给定 module options 中选择。
4. 若无法确认具体参数、成分、服务信息，不要编造，只输出线索型结论。
5. 只输出 JSON，不要输出解释。

输出 JSON Schema：
{
  "category": {
    "categoryKey": "string",
    "categoryLabel": "string",
    "confidence": "number(0-1)",
    "keywords": ["string"]
  },
  "recommendedFields": {
    "setPackProductName": "string",
    "setPackSellingPoints": ["string"],
    "setPackScenario": "string",
    "setPackAudience": "string",
    "recommendedModules": ["moduleKey"]
  },
  "risks": ["string"],
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}
```

建议输入参数：
```json
{
  "toolKey": "set-aplus",
  "imageUrl": "string",
  "title": "string(optional)",
  "moduleOptions": ["aplus-hero", "aplus-core-selling", "aplus-scene-usage", "aplus-detail", "aplus-spec", "aplus-accessories"],
  "categoryOptions": ["fashion_apparel", "beauty_personal_care", "consumer_electronics", "home_appliance", "home_living", "industrial_goods", "virtual_services"]
}
```

### 8.2 AI帮写
用途：
+ 在用户点击 AI 帮写时，回填 A+ 第 1 步规划依赖字段；
+ 生成结构化 `fieldValues`，供规划阶段直接使用；
+ 优先补全商品名称、卖点、场景、受众和推荐模块。

提示词：
```json
你是一位电商 A+详情页规划师。请根据商品图识别结果，回填 set-aplus 规划所需字段。

必须遵守：
1. 仅返回以下字段：setPackProductName, setPackSellingPoints, setPackScenario, setPackAudience, recommendedModules。
2. recommendedModules 必须从给定 modules 中选择。
3. 若某字段无可靠依据，可以留空，但不要编造参数、成分、售后承诺。
4. selling points 使用短句列表，不要输出大段文案。
5. 只输出 JSON，不要解释。

输出格式：
{
  "fieldValues": {
    "setPackProductName": "string",
    "setPackSellingPoints": ["string"],
    "setPackScenario": "string",
    "setPackAudience": "string",
    "recommendedModules": ["moduleKey"]
  },
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}
```

### 8.3 文本润色
用途：
+ 对商品名称、核心卖点、模块标题和模块短句做详情页语义润色；
+ 输出更适合模块规划和模块文案的可执行表达；
+ 保持克制、可信、可读，不转成夸张广告语。

提示词：
```json
你是一位电商 A+详情页文案润色专家。请将用户输入的商品卖点或模块文案优化为适合详情页模块使用的表达。

润色目标：
1. 改成适合详情页阅读的短标题和短句。
2. 保留真实、可信、可验证的信息，不夸大、不绝对化。
3. 避免空泛审美词，改成用户能快速理解的价值表达。
4. 若原文涉及高风险功效、虚假参数或不明确承诺，自动转为合规、保守表达。

输出要求：
- 仅输出润色后的文本，不要解释。
- 标题建议 8~30 字，短句建议 10~40 字。
- 适合直接用于 A+ 模块 headline 或 lines。
```

## 结论
A+详情图不是普通商品图功能的平移版，而是一个明确的“两步链路”：

1. 先根据商品信息、平台、市场、风格和已选模块做模块规划。
2. 再把规划结果转成单模块生成任务，逐模块拼装 prompt。

真正可开发落地的关键点有四个：

1. 真实字段层：`setPackProductName / setPackSellingPoints / setPackPlatform / setPackMarket / copyLanguage / setPackVisualStyle / setPackScenario / setPackSelectedTypes`
2. 规划层：`summary + modules + signature` 的生成、编辑和签名校验
3. 规则层：平台规则、品类规则、字段值扩展、模块定义四层共同参与规划和单模块生成
4. 拼装层：规划阶段和单模块生成阶段使用两套不同的拼装顺序与模板

只有这样，A+详情图才不是“多张图拼在一起”，而是真正可用于详情页编排的模块化内容生成能力。
