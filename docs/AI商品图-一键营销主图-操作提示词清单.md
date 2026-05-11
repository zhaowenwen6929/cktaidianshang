# AI商品图-一键营销主图-操作提示词清单

> 用途：`goods-marketing` 功能开发直接使用  
> 更新时间：2026-05-08  
> 来源：从 11 功能总需求文档中拆分出的独立版，便于前后端和提示词服务单独维护

## 1. 适用范围

- 工具：`一键营销主图 (goods-marketing)`
- 操作区块：`advanced-settings`
- 字段：`productType, sceneBackground, platformInfo, productInfo, visualStyle, marketingElements, copyLanguage`

## 2. 拼接规则（开发建议）

- 主提示词中保留任务目标、质量要求、输出规格等基础段落。
- 命中高级设置字段后，按字段值读取对应 `valuePrompt` 并逐条追加。
- 不要只传“字段=值”，否则生成结果会缺少可执行约束。

## 3. 字段与选项提示词（可直接用）

```json
{
  "goodsMarketingOptionPrompts": {
    "productType": {
      "智能识别": "先识别商品主类目与核心售卖对象，再按最匹配品类输出营销主图，避免错类错卖点。",
      "服装": "突出版型、面料与上身气质，保持褶皱和轮廓真实可辨。",
      "T恤": "强调领口、肩线、版型和面料纹理，画面清爽利于快速识别。",
      "背包": "突出容量、分仓与背负属性，保持包体结构和五金细节准确。",
      "鞋子": "突出鞋型、鞋面材质与鞋底结构，避免比例失真和双鞋错位。",
      "小家电": "突出核心功能区与操作区，保留真实材质、接口与结构细节。",
      "电视": "突出屏占比、边框与底座结构，避免屏幕内容喧宾夺主。",
      "沙发": "突出体块、面料和坐感语义，保持透视比例和空间关系可信。",
      "吊灯": "突出灯体结构、材质与光感层次，避免安装逻辑错误。",
      "化妆品": "突出包装质感、标签可读性与成分功效表达，避免夸大承诺。",
      "香水": "突出瓶身造型、折射与高级感，保证瓶标和液体质感真实。",
      "水果": "突出新鲜度、色泽与自然纹理，避免过度磨皮和不真实抛光。",
      "饮料": "突出瓶罐主体、品牌信息位与清爽感，保持液体与容器细节真实。",
      "汽车": "突出整车轮廓、材质反射与核心卖点区，保持结构比例真实。",
      "集装箱": "突出箱体结构、材质与工业属性，保持尺寸关系与细节准确。",
      "蓝牙耳机": "突出耳机本体、充电仓与细节质感，保证小体积商品清晰识别。",
      "手机": "突出机身比例、镜头模组与屏幕观感，避免参数感与外观冲突。",
      "行李箱": "突出箱体轮廓、轮组与拉杆结构，保持比例和材质真实。",
      "文具": "突出功能结构和使用场景相关性，保持细节清晰易理解。",
      "机械设备": "突出关键结构、接口与工业质感，避免不合逻辑改造。",
      "项链": "突出链条与吊坠工艺细节，保证金属光泽与比例自然。",
      "玩具": "突出造型识别和材质安全感，色彩鲜明但不过度失真。",
      "瑜伽服": "突出版型包裹与面料弹性语义，保持人体穿着逻辑自然。",
      "健身器材": "突出功能结构、稳固感与使用语义，避免结构错位。",
      "笔记本电脑": "突出机身线条、接口与屏幕关系，保持商务科技质感。",
      "手办": "突出角色造型、涂装和收藏属性，避免比例和细节崩坏。"
    },
    "sceneBackground": {
      "智能生成": "根据商品属性自动匹配最有利于转化的背景表达，优先保证主体突出。",
      "无背景": "保持背景简洁干净，重点聚焦商品主体和卖点信息。",
      "简单背景": "使用低干扰背景衬托主体，避免复杂视觉噪声。",
      "产品场景": "构建与商品使用语义一致的场景，避免违和和伪造使用状态。",
      "纯色背景": "使用稳定纯色底增强信息可读性，避免色彩冲突。",
      "纯色渐变": "使用克制渐变提升质感，不得影响主体边缘识别。",
      "图片边框": "边框仅作辅助分层，不可喧宾夺主或遮挡商品关键部位。"
    },
    "platformInfo": {
      "无平台信息": "按通用电商营销主图规则输出，保证真实、清晰、可识别与不误导。",
      "全平台通用（16平台）": "按跨平台通用约束输出，兼顾主流平台审核偏好，避免高风险营销表达。",
      "淘宝": "适配淘宝高密度信息浏览，允许营销表达但避免牛皮癣式堆叠，主体优先。",
      "天猫": "适配天猫品牌感展示，在营销表达中保持精致感和秩序感。",
      "京东": "适配京东效率型浏览，强调结构清晰、利益点直达、信息可信。",
      "拼多多": "适配拼多多快速决策场景，突出核心利益点但避免画面过载。",
      "1688": "适配1688商采语境，营销信息应服务规格、材质与供货价值表达。",
      "抖音电商": "适配抖音电商内容化浏览，强调首眼吸引与主体识别平衡。",
      "快手电商": "适配快手电商真实交易氛围，营销表达直接可信不过度包装。",
      "小红书电商": "适配小红书审美型种草场景，营销表达需审美化但不脱离真实。",
      "亚马逊": "适配亚马逊规范语境，营销主图应避免误导性宣传，主体与信息必须准确。",
      "Temu": "适配Temu快节奏展示，卖点突出但画面保持清晰简洁。",
      "TikTok Shop": "适配TikTok Shop电商规范，营销表达需真实且不误导，主体展示完整。",
      "阿里国际站": "适配B2B国际买家判断路径，营销内容应增强专业可信而非纯感性冲击。",
      "速卖通": "适配速卖通跨境零售语境，卖点表达清晰，不做不实承诺。",
      "Shopee": "适配Shopee移动端浏览，营销元素要克制，保证主商品优先识别。",
      "OZON": "适配OZON展示语境，强调清晰、真实、可读，不使用过度后期。",
      "SHEIN": "适配SHEIN时尚零售语境，营销主图需兼顾版型审美和信息直达。"
    },
    "productInfo": {
      "无信息": "不强制叠加文案信息，强调纯视觉营销表达。",
      "智能生成": "自动生成最小必要信息层级，优先保证商品识别和卖点聚焦。",
      "名称+卖点": "保留名称与核心卖点两层信息，文字简洁可读。",
      "价格与促销": "突出价格与促销信息时保持真实合规，避免夸张承诺。",
      "名称+卖点+价格+促销": "完整信息层级表达，注意主次分明，避免版面拥挤。"
    },
    "visualStyle": {
      "自动匹配": "根据品类与平台自动匹配稳妥风格，优先转化效率。",
      "极简简约": "降低装饰，提升主体与信息阅读效率。",
      "轻奢高端": "强调材质质感和高级氛围，控制视觉克制度。",
      "时尚潮流": "强化潮流表达与色彩张力，保持商品真实轮廓。",
      "年轻元气": "强调明快活力和轻快构图，信息区保持可读。",
      "专业信任": "强调理性与可信表达，结构与参数语义清晰。",
      "强营销": "强化利益点冲击，但避免噪声化堆叠和违规承诺。",
      "吸睛爆点": "提升首眼注意力，确保主体和关键信息不失真。"
    },
    "marketingElements": {
      "无": "不添加额外营销角标或促销元素，保持画面干净。",
      "折扣标识": "折扣标识位置克制，避免遮挡商品主体。",
      "买一送一": "买赠信息表达清晰，禁止误导性细则省略。",
      "满减活动": "满减规则简明可读，避免过密小字堆叠。",
      "顺丰速达": "物流卖点作为辅助信息呈现，不抢占主体视觉中心。",
      "京东自营": "平台属性标识仅在语义匹配场景使用，避免错配。",
      "本地仓": "本地仓卖点用于提升履约感知，信息需真实可信。",
      "双十一促销": "大促元素可突出，但需控制噪声并保持商品可识别。"
    },
    "copyLanguage": {
      "无文案": "不强制叠加文案，聚焦画面视觉卖点。",
      "简体中文": "中文文案简洁直达，层级清晰。",
      "繁体中文": "繁中文案保持可读和区域语境自然。",
      "英文": "英文文案表达直接，避免复杂长句。",
      "中英文混排": "中英信息层级明确，避免视觉混乱。",
      "俄语": "俄语文案注意字重与字距，确保可读。",
      "日语": "日语文案风格克制，信息分层明确。",
      "韩语": "韩语文案保持紧凑清爽，避免拥挤。",
      "印地语": "印地语文案需保证字形清晰可辨。",
      "德语": "德语长词注意换行策略，避免遮挡主体。",
      "法语": "法语文案保持优雅简洁，避免冗长。",
      "西班牙语": "西语文案强调直观与节奏，保证可读。",
      "葡萄牙语": "葡语文案表达清晰，信息层级稳定。",
      "阿拉伯语": "阿拉伯语注意右向阅读习惯和版式平衡。",
      "泰语": "泰语文案注意字形密度与留白。",
      "荷兰语": "荷兰语文案保持精炼，避免过长行。",
      "土耳其语": "土耳其语文案保持语义直达与可读。"
    }
  }
}
```

## 4. 关联文档

- 总需求文档： [AI商品图-11功能开发测试落地需求文档.md](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI商品图-11功能开发测试落地需求文档.md)
- 营销主图专项： [AI商品图-一键营销主图-提示词与配置方案.md](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI商品图-一键营销主图-提示词与配置方案.md)
- 平台规则 JSON： [AI商品图-一键营销主图-platform_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI商品图-一键营销主图-platform_rules.json)
- 品类规则 JSON： [AI商品图-一键营销主图-category_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI商品图-一键营销主图-category_rules.json)

### 4.1 规则加载与拼装优先级

1. 先用 `categoryAliasMap` 将识别到的品类词归一到标准品类。  
2. 读取 `platform_rules.json` 中对应平台规则，拼接 `prompt + required + forbidden`。  
3. 读取 `category_rules.json` 中对应品类规则，拼接 `prompt + required + forbidden`。  
4. 再拼接本文件 `3. 字段与选项提示词` 的 `valuePrompt`。  
5. 最终顺序建议：任务目标 -> 平台规则 -> 品类规则 -> 参数段 -> 选项扩展 -> 质量要求 -> 输出规格 -> 补充要求。  

## 5. 最终生成提示词模板（可直接拼装）

```json
{
  "goodsMarketingFinalPromptTemplate": {
    "task": "生成可用于电商主图与活动投放的营销主图。",
    "platformRule": "平台约束：{platformInfoPrompt}",
    "advancedParams": "高级设置：产品类型={productType}；场景背景={sceneBackground}；平台信息={platformInfo}；商品信息={productInfo}；视觉风格={visualStyle}；营销元素={marketingElements}；文案语种={copyLanguage}。",
    "optionPrompts": "选项扩展约束：{productTypePrompt} {sceneBackgroundPrompt} {platformInfoPrompt} {productInfoPrompt} {visualStylePrompt} {marketingElementsPrompt} {copyLanguagePrompt}",
    "quality": "质量要求：主体清晰完整，卖点聚焦，信息层级明确，文案可读，不夸张失真，不含违规承诺与误导性表达。",
    "outputSpec": "输出规格：比例={ratio}；分辨率={resolution}；数量={count}。",
    "supplement": "补充要求：{supplement}",
    "finalOrder": [
      "task",
      "platformRule",
      "advancedParams",
      "optionPrompts",
      "quality",
      "outputSpec",
      "supplement"
    ]
  }
}
```

## 6. 拼装规则（后端/中台）

1. 先确定平台与品类：  
- 平台来源：`platformInfo`（来自高级设置）。  
- 品类来源：优先使用识别结果或上游传入 `productCategory`；若只有自由词（如“耳机”），先走 `categoryAliasMap` 归一成标准品类。  
2. 读取平台规则：`platform_rules.json -> platformRules[platformInfo]`，拼接 `prompt + required + forbidden`。  
3. 读取品类规则：`category_rules.json -> categoryRules[normalizedCategory]`，拼接 `prompt + required + forbidden`。  
4. 字段值命中后，再拼 `advancedParams` 与 `optionPrompts`（即第 3 章 `valuePrompt`），用于细化表现方式。  
5. 约束优先级：`platform/category forbidden` > `platform/category required` > `optionPrompts`。若冲突，低优先级内容必须被裁掉。  
6. `platformInfoPrompt` 在模板中出现两次（`platformRule` + `optionPrompts`）是有意设计：前者是硬约束，后者是字段语义说明。  
7. `resolution` 仅在高级模式传入；普通模式没有分辨率时，`outputSpec` 自动降级为 `输出规格：比例={ratio}；数量={count}。`  
8. `supplement` 为空时整段删除，不保留“补充要求：”。  
9. 多字段为空时不要补默认长文，直接使用对应空语义选项并输出最小约束。  
10. 安全兜底：最终串必须包含“真实/不误导/主体清晰”语义，且不得出现任何 `forbidden` 内容。  

### 6.1 字段与规则源映射（必须按此读取）

| 拼装变量 | 来源字段 | 规则文件路径 | 说明 |
| --- | --- | --- | --- |
| `platformInfo` | `advanced-settings.platformInfo` | `docs/AI商品图-一键营销主图-platform_rules.json` | 用于命中平台规则 |
| `normalizedCategory` | `productCategory` 或识别词归一 | `docs/AI商品图-一键营销主图-category_rules.json` | 通过 `categoryAliasMap` 归一 |
| `productTypePrompt` 等选项提示词 | 各高级设置字段值 | 本文第 3 章 | 作为细化约束，优先级低于平台/品类硬规则 |
| `ratio/resolution/count` | 创作模式参数 | 无 | 输出规格段 |
| `supplement` | 细节补充（可为空） | 无 | 最后拼接 |

## 7. 拼装 Demo（输入 + 输出）

### 7.1 Demo 输入

```json
{
  "toolKey": "goods-marketing",
  "productCategoryRaw": "耳机",
  "params": {
    "productType": "蓝牙耳机",
    "sceneBackground": "纯色渐变",
    "platformInfo": "TikTok Shop",
    "productInfo": "名称+卖点+价格+促销",
    "visualStyle": "吸睛爆点",
    "marketingElements": "折扣标识",
    "copyLanguage": "英文",
    "ratio": "1:1",
    "resolution": "2K",
    "count": "2",
    "supplement": "突出降噪与长续航，价格信息放右下角，避免遮挡耳机本体。"
  }
}
```

### 7.2 Demo 输出（最终提示词）

```text
生成可用于电商主图与活动投放的营销主图。

平台约束：适配TikTok Shop商品图规范：主图应为纯白/纯色合规背景并客观展示商品，不得含覆盖性文案与水印。营销强化内容建议用于非首图。 必须满足：主图客观展示商品，图片清晰且不失真，商品与实际售卖一致，主体不被遮挡。 禁止：主图覆盖文字/Logo/水印/边框，误导性演示，与实物不一致内容，明显夸张功效承诺。

品类约束（由 productCategoryRaw=耳机 归一为 家电数码类）：突出参数感、功能区和材质质感，接口、按键、屏幕或模组必须真实。 必须满足：关键结构真实，接口/按键可辨，质感清晰。 禁止：虚构参数外观，接口错位，过度反光导致不可读。

高级设置：产品类型=蓝牙耳机；场景背景=纯色渐变；平台信息=TikTok Shop；商品信息=名称+卖点+价格+促销；视觉风格=吸睛爆点；营销元素=折扣标识；文案语种=英文。

选项扩展约束：突出耳机本体、充电仓与细节质感，保证小体积商品清晰识别。 使用克制渐变提升质感，不得影响主体边缘识别。 适配TikTok Shop电商规范，营销表达需真实且不误导，主体展示完整。 完整信息层级表达，注意主次分明，避免版面拥挤。 提升首眼注意力，确保主体和关键信息不失真。 折扣标识位置克制，避免遮挡商品主体。 英文文案表达直接，避免复杂长句。

质量要求：主体清晰完整，卖点聚焦，信息层级明确，文案可读，不夸张失真，不含违规承诺与误导性表达。

输出规格：比例=1:1；分辨率=2K；数量=2。

补充要求：突出降噪与长续航，价格信息放右下角，避免遮挡耳机本体。
```

### 7.3 Demo 说明（规则如何生效）

1. `platformInfo=TikTok Shop` 命中 `platform_rules.json` 的 TikTok Shop 规则，先注入平台硬约束。  
2. `productCategoryRaw=耳机` 经 `categoryAliasMap` 归一为 `家电数码类`，再注入品类硬约束。  
3. `marketingElements=折扣标识` 只作为软约束表达；若和平台主图禁令冲突，应在执行层压制展示（如首图禁止覆盖文案时禁用角标）。  

## 8. AI帮写提示词（完整）

### 8.1 用途

- 对应能力：`advancedAiAssistPromptConfigs["goods-marketing"]`
- 使用时机：用户点击“AI帮写”，系统基于商品图识别结果自动回填高级设置字段

### 8.1.1 图片品类识别提示词（新增，建议先执行）

- 目标：先从上传图片识别 `productCategoryRaw`，再归一到标准 `productCategory`，供后续平台/品类规则拼装使用。
- 依赖规则：`docs/AI商品图-一键营销主图-category_rules.json` 的 `categoryAliasMap`

```text
你是一位电商商品图品类识别助手。请根据用户上传的商品图片，识别商品所属品类，并输出标准化结果。

识别任务：
1) 先给出原始识别词 productCategoryRaw（例如：耳机、女装、双肩包）。
2) 再将原始识别词映射到标准品类 productCategory（必须从以下集合中选择）：
["通用品类","服饰类","鞋靴类","箱包类","珠宝饰品类","美妆个护类","食品饮料类","家居百货类","家电数码类","家具大件类","母婴玩具类","宠物用品类","汽配五金类"]
3) 若识别词命中别名映射（categoryAliasMap），按映射结果回填 productCategory。
4) 若无法明确判断，productCategoryRaw 返回 "未知品类"，productCategory 返回 "通用品类"，并把字段加入 needsUserConfirm。

输出要求：
- 只输出 JSON，不要解释，不要 Markdown。
- confidence 范围 0~1。
- 当 confidence < 0.6 时，必须把 "productCategory" 加入 needsUserConfirm。

输出格式：
{
  "fieldValues": {
    "productCategoryRaw": "string",
    "productCategory": "string"
  },
  "confidence": {
    "productCategory": 0
  },
  "needsUserConfirm": []
}
```

品类识别输出示例：

```json
{
  "fieldValues": {
    "productCategoryRaw": "耳机",
    "productCategory": "家电数码类"
  },
  "confidence": {
    "productCategory": 0.91
  },
  "needsUserConfirm": []
}
```

### 8.2 提示词正文（推荐生产版）

```text
你是一位电商营销主图策划师。请根据输入的商品图片线索与上下文信息，回填 goods-marketing 的高级设置字段。

任务目标：
为营销主图生成提供可执行的参数回填，优先保证“主体识别准确、场景语义合理、平台表达合规、营销信息克制可读”。

必须遵守：
1) 只允许返回以下字段：productCategory, productType, sceneBackground, platformInfo, productInfo, visualStyle, marketingElements, copyLanguage。
2) 每个字段的值必须严格从对应 options 中选择，禁止自造值。
3) 无法确定时，不要猜测，优先使用该字段的空语义选项：
- productCategory -> 通用品类
- productType -> 智能识别
- sceneBackground -> 智能生成
- platformInfo -> 无平台信息
- productInfo -> 智能生成
- visualStyle -> 自动匹配
- marketingElements -> 无
- copyLanguage -> 无文案
4) 若平台线索明显（例如页面文案、水印、语言、渠道信息），优先回填对应 platformInfo；若不明确则回填“无平台信息”。
5) 输出仅允许 JSON，不要输出解释、注释、Markdown。

输出格式：
{
  "fieldValues": {
    "productCategory": "string",
    "productType": "string",
    "sceneBackground": "string",
    "platformInfo": "string",
    "productInfo": "string",
    "visualStyle": "string",
    "marketingElements": "string",
    "copyLanguage": "string"
  },
  "confidence": {
    "productCategory": 0,
    "productType": 0,
    "sceneBackground": 0,
    "platformInfo": 0,
    "productInfo": 0,
    "visualStyle": 0,
    "marketingElements": 0,
    "copyLanguage": 0
  },
  "needsUserConfirm": []
}

置信度规则：
- 取值范围 0~1；
- >=0.8：高确定性；
- 0.5~0.79：中等；
- <0.5：低确定性，需加入 needsUserConfirm。
```

### 8.3 AI帮写入参（建议）

```json
{
  "toolKey": "goods-marketing",
  "detectedCategory": {
    "productCategoryRaw": "耳机",
    "productCategory": "家电数码类"
  },
  "imageContext": {
    "mainImageCount": 1,
    "hasReferenceImage": false
  },
  "options": {
    "productType": ["智能识别", "服装", "T恤", "背包", "鞋子", "小家电", "电视", "沙发", "吊灯", "化妆品", "香水", "水果", "饮料", "汽车", "集装箱", "蓝牙耳机", "手机", "行李箱", "文具", "机械设备", "项链", "玩具", "瑜伽服", "健身器材", "笔记本电脑", "手办"],
    "sceneBackground": ["智能生成", "无背景", "简单背景", "产品场景", "纯色背景", "纯色渐变", "图片边框"],
    "platformInfo": ["无平台信息", "全平台通用（16平台）", "淘宝", "天猫", "京东", "拼多多", "1688", "抖音电商", "快手电商", "小红书电商", "亚马逊", "Temu", "TikTok Shop", "阿里国际站", "速卖通", "Shopee", "OZON", "SHEIN"],
    "productInfo": ["无信息", "智能生成", "名称+卖点", "价格与促销", "名称+卖点+价格+促销"],
    "visualStyle": ["自动匹配", "极简简约", "轻奢高端", "时尚潮流", "年轻元气", "专业信任", "强营销", "吸睛爆点"],
    "marketingElements": ["无", "折扣标识", "买一送一", "满减活动", "顺丰速达", "京东自营", "本地仓", "双十一促销"],
    "copyLanguage": ["无文案", "简体中文", "繁体中文", "英文", "中英文混排", "俄语", "日语", "韩语", "印地语", "德语", "法语", "西班牙语", "葡萄牙语", "阿拉伯语", "泰语", "荷兰语", "土耳其语"]
  }
}
```

### 8.4 AI帮写输出示例

```json
{
  "fieldValues": {
    "productCategory": "家电数码类",
    "productType": "蓝牙耳机",
    "sceneBackground": "纯色渐变",
    "platformInfo": "TikTok Shop",
    "productInfo": "名称+卖点+价格+促销",
    "visualStyle": "吸睛爆点",
    "marketingElements": "折扣标识",
    "copyLanguage": "英文"
  },
  "confidence": {
    "productCategory": 0.91,
    "productType": 0.93,
    "sceneBackground": 0.74,
    "platformInfo": 0.81,
    "productInfo": 0.69,
    "visualStyle": 0.72,
    "marketingElements": 0.58,
    "copyLanguage": 0.86
  },
  "needsUserConfirm": ["marketingElements"]
}
```

## 9. AI润色提示词（完整）

### 9.1 用途

- 对应能力：`supplementAiPolishConfigs["goods-marketing"]`
- 使用时机：用户输入“细节补充”后，点击 AI 润色/优化

### 9.2 提示词正文（推荐生产版）

```text
你是一位电商营销主图文案润色专家。请将用户提供的补充说明，改写为可执行的图像生成约束文本，并保持原意。

优化目标：
1) 强化主体可识别性：确保商品主体不被文案、角标、特效遮挡。
2) 强化卖点层级：主卖点优先，辅卖点克制，信息不堆叠。
3) 强化构图和视觉约束：明确位置、留白、色调、对比、字体可读性。
4) 强化合规边界：避免绝对化承诺、虚假功效、违规引流和误导表达。

改写规则：
1) 不改变用户核心意图，不擅自新增商品参数、价格、平台政策。
2) 将模糊描述改成可执行描述（例如“更高级”->“提升材质质感与明暗层次，避免过曝”）。
3) 若用户输入极短或信息不足，允许做最小必要补全，但仅限构图、层级、清晰度与合规措辞。
4) 输出语言默认跟随用户输入语言；若用户指定文案语种，以指定语种为准。
5) 仅输出润色后文本，不要解释，不要 JSON，不要 Markdown。

禁用内容：
- 最强/第一/永久有效/100%见效 等绝对化表述
- 未被用户提出的医疗、功效、认证、价格承诺
- 联系方式、二维码、站外导流
```

### 9.3 AI润色输入示例

```json
{
  "toolKey": "goods-marketing",
  "rawSupplement": "要更有促销感觉，突出降噪和续航，价格便宜点，画面酷一些。",
  "context": {
    "productType": "蓝牙耳机",
    "platformInfo": "TikTok Shop",
    "copyLanguage": "英文"
  }
}
```

### 9.4 AI润色输出示例

```text
突出耳机本体与充电仓，主卖点聚焦“降噪”和“长续航”；促销信息集中在右下角小面积展示，避免遮挡主体。整体风格偏科技与高对比，保留清晰边缘与金属质感，避免过强滤镜导致失真。价格表达使用克制促销语气，不使用绝对化或误导性承诺，确保信息可读且层级分明。
```
