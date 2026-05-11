# AI商品图-其他功能提示词与配置方案

## 1. 目标

本文档按照 [商品白底图-提示词与配置方案](/Users/zhaowenwen/CODEX/CKTAI电商/docs/商品白底图-提示词与配置方案.md) 的标准，整理 `AI商品图` 下除 `goods-white` 之外的其他功能提示词与配置方案，方便技术直接对照实现。

覆盖功能：

- `goods-marketing` 一键营销主图
- `goods-buyer` 一键买家秀
- `goods-scene` 一键场景图
- `goods-detail` 一键细节图
- `goods-sell` 一键卖点图
- `goods-spoke` 一键代言图
- `goods-view` 一键三视角
- `goods-retouch` 产品精修
- `goods-bg` AI换背景
- `goods-translate` 图片翻译

补充说明：

- `模特调整` 已单独整理为专项文档，见 [AI商品图-模特调整-提示词与配置方案](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI商品图-模特调整-提示词与配置方案.md)。
- `模特生成` 已单独整理为专项文档，见 [AI商品图-模特生成-提示词与配置方案](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI商品图-模特生成-提示词与配置方案.md)。
- `图片扩图` 属于图片处理工具，但本次也已单独整理可直接开发接入的提示词文档，见 [图片扩图-提示词与配置方案](/Users/zhaowenwen/CODEX/CKTAI电商/docs/图片扩图-提示词与配置方案.md)。

## 2. 统一组装规范

### 2.1 提示词段落结构（统一）

建议统一输出以下段落：

1. 任务目标段（按功能定义）
2. 商品识别段（上传图识别结果）
3. 功能高级字段段（advanced settings）
4. 平台/地区规则段（如存在）
5. 全局质量段（真实、清晰、可执行）
6. 补充说明段（用户输入，可选）

### 2.2 统一参数结构

```ts
type AIGoodsPromptBuildParams = {
  toolKey: string; // 功能key，例如 goods-marketing
  uploads: Array<{ name?: string; src?: string }>; // 上传素材
  advancedSelections: Record<string, string>; // 高级设置回填值
  ratio?: string; // 比例
  resolution?: string; // 分辨率
  supplement?: string; // 补充说明
};
```

### 2.3 比例和分辨率处理

- 比例 `ratio`：建议写入提示词，用于约束构图。
- 分辨率 `resolution`：建议作为模型参数优先传递，可同时在提示词中冗余一行“输出分辨率目标”。

## 3. 功能配置总览（来自代码）

### 3.1 创作模式映射

```ts
const creationModeConfigByToolKey = {
  "goods-marketing": "marketing",
  "goods-retouch": "retouch",
  "goods-scene": "scene",
  "goods-bg": "background",
  "goods-view": "three-view",
  "goods-translate": "translate",
  "goods-buyer": "default",
  "goods-detail": "default",
  "goods-sell": "default",
  "goods-spoke": "spoke"
};
```

### 3.2 AI 辅助提示词（advancedAiAssistPromptConfigs）

```ts
const advancedAiAssistPromptConfigs = {
  "goods-marketing": "你是一位电商营销主图策划师。请根据商品图片与商品线索，分别判断并回填：产品类型、场景背景、平台信息、商品信息、视觉风格、营销元素、文案语种。必须只从当前字段可选项中选择最匹配的值；无法确认时优先回填“智能识别 / 智能生成 / 自动匹配 / 无 / 无文案”等空语义选项。",
  "goods-retouch": "你是一位商品精修顾问。请根据商品图片判断更适合的电商平台与地区站点，仅回填当前高级设置中的平台、地区字段；不要补充无关内容。若判断不出则留空。",
  "goods-scene": "你是一位电商场景图策划师。请根据商品图片线索，回填：产品类型、场景类型、产品展示、排版呈现、氛围营造、价值导向、目标市场、文案语种。所有字段必须贴合当前商品，不确定时选择最通用或最弱承诺的选项，不要生成字段外内容。",
  "goods-bg": "你是一位电商换背景策划师。请根据商品图片与主体特征，回填背景类型、风格与光影两个字段。若主体更适合白底、电商展台、居家、户外、广告风等，请选择最贴近的选项；不要填无关字段。",
  "goods-view": "你是一位商品多视角展示顾问。请根据商品图片判断其平台信息对应的展示规范，仅回填“平台信息”字段；若无法识别则回填“无平台信息”。",
  "goods-translate": "你是一位跨境电商图片翻译顾问。请根据商品图片与已有视觉线索，回填平台信息，并在需要时为非预置的平台规范触发细节补充；不要默认带出语种或其他无关字段。",
  "goods-buyer": "你是一位买家秀策划师。请根据商品图片，回填产品类型、产品状态、呈现方式、场景氛围、产品真实感、环境真实感、拍摄真实感、目标市场。仅从当前字段选项中挑选最符合真实买家秀气质的值。",
  "goods-detail": "你是一位商品细节图策划师。请根据商品图片，回填产品类型与展示形式，帮助细节图更明确地表达材质、结构或局部功能。",
  "goods-sell": "你是一位商品卖点图策划师。请根据商品图片，回填产品类型、场景类型、文案语种、核心卖点、表现形式、卖点重心、主副标题、副标题、字体风格、元素辅助、目标市场。必须让每个字段服务于“卖点表达”而不是泛化描述。",
  "goods-spoke": "你是一位电商代言图策划师。请根据商品图片，回填产品类型、互动方式、人物特点、场景背景、排版方式、人种肤色、性别风格、年龄特点、展示重点、目标市场。所有字段要服务于“人物代言商品”的广告表达。"
};
```

### 3.3 补充说明润色提示词（supplementAiPolishConfigs）

```ts
const supplementAiPolishConfigs = {
  "image-expand": { modelLabel: "创客贴AI图片扩图润色", prompt: "优化图片扩图需求描述，强调延展方向、边界衔接、空间连续性、光影一致性和主体结构稳定性，使扩图结果更自然、完整、可执行。" },
  "goods-marketing": { modelLabel: "创客贴AI营销主图润色", prompt: "优化营销主图细节补充，强调产品卖点、营销氛围、构图和商业质感。" },
  "goods-scene": { modelLabel: "创客贴AI场景图润色", prompt: "优化场景图细节补充，强调场景搭建、氛围、光线、主体展示和代入感。" },
  "goods-bg": { modelLabel: "创客贴AI换背景润色", prompt: "优化换背景补充描述，强调背景融合、真实光影、空间关系与主体协调。" },
  "goods-retouch": { modelLabel: "创客贴AI精修润色", prompt: "优化产品精修补充说明，强调材质、边缘、光感、质感和商业修图效果。" },
  "goods-translate": { modelLabel: "创客贴AI翻译润色", prompt: "优化图片翻译排版说明，强调版式保留、语言层级、信息清晰度和阅读体验。" },
  "goods-view": { modelLabel: "创客贴AI三视图润色", prompt: "优化三视图补充说明，强调视角统一、细节完整、背景干净和展示一致性。" },
  "goods-buyer": { modelLabel: "创客贴AI买家秀润色", prompt: "优化买家秀补充说明，强调真实生活感、主体使用场景、自然氛围和转化感。" },
  "goods-detail": { modelLabel: "创客贴AI卖点图润色", prompt: "优化卖点图补充说明，强调核心卖点、信息层级、对比关系和画面说服力。" },
  "goods-sell": { modelLabel: "创客贴AI卖点图润色", prompt: "优化卖点图补充说明，强调核心卖点、信息层级、对比关系和画面说服力。" },
  "goods-spoke": { modelLabel: "创客贴AI代言图润色", prompt: "优化代言图补充说明，强调人物与产品关系、品牌感、镜头语言和视觉气质。" }
};
```

## 4. 分功能配置与提示词方案

以下每个功能都按同一模板给出：

- 功能定位
- 核心字段
- 配置映射（sectionOrder / creationMode / uploads）
- 建议最终提示词模板

### 4.1 goods-marketing（一键营销主图）

功能定位：

- 生成有营销信息承载能力的电商主图。

核心字段：

- `productType`
- `sceneBackground`
- `platformInfo`
- `productInfo`
- `visualStyle`
- `marketingElements`
- `copyLanguage`

配置映射：

- `creationModeConfigKey = marketing`
- `sectionOrder = [upload-main, creation-mode, advanced-settings, supplement, upload-reference]`
- `upload.main.maxCount = 24`
- `upload.reference.maxCount = 1`

建议提示词模板：

```text
任务目标：生成可用于电商投放与详情首屏的营销主图。
商品信息：基于上传商品图，识别主体并保持真实材质与结构。
营销配置：产品类型={productType}；场景背景={sceneBackground}；平台信息={platformInfo}；商品信息={productInfo}；视觉风格={visualStyle}；营销元素={marketingElements}；文案语种={copyLanguage}。
画面要求：突出核心卖点与信息层级，文案可读，构图清晰，避免过度特效导致识别困难。
输出规格：比例={ratio}；分辨率={resolution}。
补充要求：{supplement}
```

### 4.2 goods-buyer（一键买家秀）

功能定位：

- 生成真实生活感、接近 UGC 买家秀风格的商品图。

核心字段：

- `productType`
- `productState`
- `presentationStyle`
- `sceneAtmosphere`
- `productReality`
- `environmentReality`
- `shotReality`
- `targetMarket`

配置映射：

- `creationModeConfigKey = spoke`
- `sectionOrder = [upload-main, creation-mode, advanced-settings, supplement, upload-reference]`
- `upload.main.maxCount = 24`
- `upload.reference.maxCount = 1`

建议提示词模板：

```text
任务目标：生成真实自然的买家秀风格商品图。
商品信息：保留商品本体与使用语义，不偏离真实售卖形态。
买家秀配置：产品类型={productType}；产品状态={productState}；呈现方式={presentationStyle}；场景氛围={sceneAtmosphere}；产品真实感={productReality}；环境真实感={environmentReality}；拍摄真实感={shotReality}；目标市场={targetMarket}。
画面要求：避免过度广告化，强调生活代入感与可信度。
输出规格：比例={ratio}；分辨率={resolution}。
补充要求：{supplement}
```

### 4.3 goods-scene（一键场景图）

功能定位：

- 生成商品使用场景图，强化代入与情绪氛围。

核心字段：

- `productType`
- `sceneType`
- `productDisplay`
- `layoutStyle`
- `moodStyle`
- `valueFocus`
- `targetMarket`
- `copyLanguage`

配置映射：

- `creationModeConfigKey = scene`
- `sectionOrder = [upload-main, creation-mode, advanced-settings, supplement]`
- `upload.main.maxCount = 24`

建议提示词模板：

```text
任务目标：生成具有场景代入感的商品展示图。
商品信息：保留商品结构、材质与真实颜色。
场景配置：产品类型={productType}；场景类型={sceneType}；产品展示={productDisplay}；排版呈现={layoutStyle}；氛围营造={moodStyle}；价值导向={valueFocus}；目标市场={targetMarket}；文案语种={copyLanguage}。
画面要求：主体明确，环境服务商品，不喧宾夺主。
输出规格：比例={ratio}；分辨率={resolution}。
补充要求：{supplement}
```

### 4.4 goods-detail（一键细节图）

功能定位：

- 生成强调材质、工艺、局部结构的细节图。

核心字段：

- `productType`
- `displayType`

配置映射：

- `creationModeConfigKey = spoke`
- `sectionOrder = [upload-main, creation-mode, advanced-settings, supplement, upload-reference]`
- `upload.main.maxCount = 24`
- `upload.reference.maxCount = 1`

建议提示词模板：

```text
任务目标：生成用于展示材质与工艺细节的商品细节图。
商品信息：保留真实纹理、边缘和工艺结构，不虚构细节。
细节配置：产品类型={productType}；展示形式={displayType}。
画面要求：特写清晰，重点聚焦，层次明确。
输出规格：比例={ratio}；分辨率={resolution}。
补充要求：{supplement}
```

### 4.5 goods-sell（一键卖点图）

功能定位：

- 生成“信息表达型”卖点图，强调文案和视觉说服力。

核心字段：

- `productType`
- `sceneType`
- `copyLanguage`
- `coreSellingPoint`
- `presentationForm`
- `sellingPointFocus`
- `mainTitle`
- `subtitle`
- `fontStyle`
- `assistElement`
- `targetMarket`

配置映射：

- `creationModeConfigKey = spoke`
- `sectionOrder = [upload-main, creation-mode, advanced-settings, supplement, upload-reference]`
- `upload.main.maxCount = 24`
- `upload.reference.maxCount = 1`

建议提示词模板：

```text
任务目标：生成可直接承载卖点信息的电商卖点图。
商品信息：保持商品真实结构与材质，卖点表达准确可读。
卖点配置：产品类型={productType}；场景类型={sceneType}；文案语种={copyLanguage}；核心卖点={coreSellingPoint}；表现形式={presentationForm}；卖点重心={sellingPointFocus}；主副标题={mainTitle}；副标题={subtitle}；字体风格={fontStyle}；元素辅助={assistElement}；目标市场={targetMarket}。
画面要求：信息层级清晰，视觉重点明确，避免文案拥挤。
输出规格：比例={ratio}；分辨率={resolution}。
补充要求：{supplement}
```

### 4.6 goods-spoke（一键代言图）

功能定位：

- 生成人物代言型商品图，强调人物与商品关系。

核心字段：

- `productType`
- `interactionType`
- `characterTrait`
- `sceneBackground`
- `layoutStyle`
- `skinTone`
- `genderStyle`
- `ageTrait`
- `displayFocus`
- `targetMarket`

配置映射：

- `creationModeConfigKey = spoke`
- `sectionOrder = [upload-main, creation-mode, advanced-settings, supplement, upload-reference]`
- `upload.main.maxCount = 24`
- `upload.reference.maxCount = 1`

建议提示词模板：

```text
任务目标：生成人物代言商品图，提升信任感与传播感。
商品信息：商品主体清晰，人物互动自然，关系明确。
代言配置：产品类型={productType}；互动方式={interactionType}；人物特点={characterTrait}；场景背景={sceneBackground}；排版方式={layoutStyle}；人种肤色={skinTone}；性别风格={genderStyle}；年龄特点={ageTrait}；展示重点={displayFocus}；目标市场={targetMarket}。
画面要求：人物不过度抢主体，商品识别始终优先。
输出规格：比例={ratio}；分辨率={resolution}。
补充要求：{supplement}
```

### 4.7 goods-view（一键三视角）

功能定位：

- 生成商品多视角（正/侧/背或约定视角）展示图。

核心字段：

- `cameraAngle`（来自 `camera-angle` 区块）
- `platformInfo`
- `platformRuleDetail`（细节补充）

配置映射：

- `creationModeConfigKey = three-view`
- `sectionOrder = [upload-main, camera-angle, creation-mode, advanced-settings]`
- `upload.main.maxCount = 24`

建议提示词模板：

```text
任务目标：生成商品三视角展示图（正、侧、背或指定视角）。
商品信息：保持同一商品在不同视角下结构一致、材质一致、颜色一致。
视角配置：视角方案={cameraAngle}；平台信息={platformInfo}。
平台补充：{platformRuleDetail}
画面要求：三视图风格统一，光线统一，比例统一，避免视角错位和结构漂移。
输出规格：比例={ratio}；分辨率={resolution}。
```

### 4.8 goods-retouch（产品精修）

功能定位：

- 对商品图进行质感、边缘、光影与商业可用性精修。

核心字段：

- `platform`
- `region`

配置映射：

- `creationModeConfigKey = retouch`
- `sectionOrder = [upload-main, mode-choice, creation-mode, supplement]`
- `advancedSettings.fields = [platform, region]`
- `upload.main.maxCount = 24`

建议提示词模板：

```text
任务目标：对上传商品图进行商业级精修，提升质感与可上架性。
商品信息：保持商品真实结构，不改变SKU关键特征。
平台配置：电商平台={platform}；地区={region}。
精修要求：优化边缘净度、光影层次、材质表现与整体清晰度，避免过度修图痕迹。
输出规格：比例={ratio}；分辨率={resolution}。
补充要求：{supplement}
```

### 4.9 goods-bg（AI换背景）

功能定位：

- 在保留商品主体前提下替换背景并完成光影融合。

核心字段：

- `backgroundType`
- `lightingStyle`

配置映射：

- `creationModeConfigKey = background`
- `sectionOrder = [upload-main, creation-mode, advanced-settings, supplement]`
- `upload.main.maxCount = 24`

建议提示词模板：

```text
任务目标：保持商品主体不变，替换并融合目标背景。
商品信息：商品边缘干净，主体比例与透视关系稳定。
背景配置：背景类型={backgroundType}；风格与光影={lightingStyle}。
融合要求：光向、阴影、反射、色温与空间关系自然一致，避免“贴图感”。
输出规格：比例={ratio}；分辨率={resolution}。
补充要求：{supplement}
```

### 4.10 goods-translate（图片翻译）

功能定位：

- 识别图片原有文案并翻译替换，尽量保留版式与视觉层级。

核心字段：

- `targetLanguage`（来自 `target-language` 区块）
- `platformInfo`
- `platformRuleDetail`（细节补充）

配置映射：

- `creationModeConfigKey = translate`
- `sectionOrder = [upload-main, target-language, creation-mode, advanced-settings]`
- `upload.main.maxCount = 24`

建议提示词模板：

```text
任务目标：对图片文案进行翻译替换，保持版式与视觉层级稳定。
翻译配置：目标语种={targetLanguage}；平台信息={platformInfo}。
平台补充：{platformRuleDetail}
版式要求：优先保留原字号层级、对齐关系、重点信息可读性与对比度。
输出规格：比例={ratio}；分辨率={resolution}。
```

## 5. 工程落地建议

### 5.1 严格模式建议

参考白底图 strict 机制，其他功能也建议实现 strict：

- 功能字段必须命中当前功能的字段配置
- 非配置字段不拼入最终提示词
- 未命中字段时报错而不是静默兜底

### 5.2 统一输出结构建议

```ts
type PromptBuildResult = {
  finalPrompt: string;
  segments: Record<string, string>;
  matchedFields: Record<string, string>;
};
```

### 5.3 来源约束

- `platformInfo/platform/region` 来源：用户选择或 AI assist 回填
- `productType/sceneType/...` 来源：高级设置或 AI assist 回填
- `supplement` 来源：用户显式输入
- `ratio/resolution` 来源：创作模式选择
