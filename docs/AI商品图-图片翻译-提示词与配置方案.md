# AI商品图-goods-translate（图片翻译）提示词与配置方案

## 1. 功能目标

- 功能Key：`goods-translate`
- 功能名：图片翻译
- 目标：将图片文案翻译到目标语种并尽量保持原版式层级与可读性。

## 2. 平台与品类覆盖

- 平台：16平台统一覆盖
- 品类：12类统一覆盖

## 3. 配置映射

- `creationModeConfigKey = "translate"`
- `sectionOrder = ["upload-main", "target-language", "creation-mode", "advanced-settings"]`
- `advancedSettings.extraSelects = [platformInfo]`
- `conditionalDetailField = platformRuleDetail`
- `uploads.main.maxCount = 24`
- AI assist：`advancedAiAssistPromptConfigs["goods-translate"]`
- 润色：`supplementAiPolishConfigs["goods-translate"]`

## 4. 参数定义

```ts
type GoodsTranslateParams = {
  productCategory: string;
  platformLabel: string;
  targetLanguage: string;
  platformInfo: string;
  platformRuleDetail?: string;
  ratio: string;
  resolution?: string;
  count: string;
  modeId: "advanced" | "smart" | "cn-growth";
  supplement?: string;
  strict?: boolean;
};
```

### 4.1 平台与品类真实取值（代码配置）

`platformInfo` 可选值（`platformInfoInputOptions`）：

```ts
["无平台信息", "全平台通用（16平台）", "淘宝", "天猫", "京东", "拼多多", "1688", "抖音电商", "快手电商", "小红书电商", "亚马逊", "Temu", "TikTok Shop", "阿里国际站", "速卖通", "Shopee", "OZON", "SHEIN"]
```

`targetLanguage` 可选值（`targetLanguageInputOptions`）：

```ts
["简体中文", "英语", "繁体中文", "日语", "韩语", "西班牙语", "俄语", "法语", "泰语", "印尼语", "阿拉伯语"]
```

`productCategory`：12类统一覆盖（建议接品类识别结果用于提示词）。

## 5. 提示词模板

```text
任务目标：将图片中的原文案翻译为目标语种并保持版式可用。

商品信息：当前商品品类为「{productCategory}」，商品图主体信息保持不变。

平台要求：目标平台为「{platformLabel}」，平台信息={platformInfo}。

翻译配置：目标语种={targetLanguage}；平台细则={platformRuleDetail}。

版式要求：保留原图信息层级、重点内容、对齐关系和阅读节奏；避免翻译后溢出、遮挡或对比不足。

输出规格：比例={ratio}；分辨率={resolution}；数量={count}；模式={modeId}。

补充要求：{supplement}
```

## 6. AI辅助与润色提示词（原配置）

AI辅助：

```text
你是一位跨境电商图片翻译顾问。请根据商品图片与已有视觉线索，回填平台信息，并在需要时为非预置的平台规范触发细节补充；不要默认带出语种或其他无关字段。
```

润色：

```text
优化图片翻译排版说明，强调版式保留、语言层级、信息清晰度和阅读体验。
```

## 7. 示例

```ts
const demo = {
  productCategory: "美妆个护类",
  platformLabel: "亚马逊",
  targetLanguage: "英语",
  platformInfo: "亚马逊",
  platformRuleDetail: "标题英文优先，参数信息不丢失。",
  ratio: "1:1",
  resolution: "1K",
  count: "1",
  modeId: "advanced",
  supplement: "保持主标题字号层级，卖点短句优先可读。"
};
```

## 平台与品类提示词配置规则（必配）

### 平台提示词配置

- 平台来源字段：`platformLabel`（或功能内 `platformInfo` / `platform`）。
- 平台可选值：按 `platformInfoInputOptions` 或功能专属 `platformIds`。
- 平台提示词段落：
  `平台要求：目标平台为「{platformLabel}」，请遵守该平台展示规范。`
- 若功能含平台细则字段（如 `platformRuleDetail`），必须追加：
  `平台细则：{platformRuleDetail}`。

### 品类提示词配置

- 品类来源字段：`productCategory`（建议由品类识别写回）。
- 品类提示词段落：
  `商品信息：当前商品品类为「{productCategory}」，保持商品真实结构、材质与颜色。`
- 功能内 `productType` 与 `productCategory` 同时存在时：
  - `productCategory` 用于统一品类约束段；
  - `productType` 用于功能参数段。

### 拼接顺序要求

1. 任务目标段
2. 商品品类段（productCategory）
3. 平台段（platformLabel/platformInfo）
4. 功能参数段（advanced settings）
5. 全局质量段
6. 补充说明段（可选）

### Strict 校验要求

- `strict=true` 时：
  - 平台字段必须命中该功能对应可选值；
  - 品类字段必须命中统一品类集合；
  - 未命中任一字段应报错，不得静默兜底改写。

## 8. 对齐买家秀标准的补充（真实平台基线 + AI回填）

### 8.1 平台真实信息基线与 ruleLevel

- 平台依据统一引用：
  - [商品白底图-16平台最新规范与品类补充.md](/Users/zhaowenwen/CODEX/CKTAI电商/docs/商品白底图-16平台最新规范与品类补充.md)
- `ruleLevel`：高等级规则优先；涉及禁词、违规承诺、误导性文案时默认高优先级。

### 8.2 翻译功能专属约束

```json
{
  "translateHardRules": [
    "译文不得改变原意和卖点事实",
    "优先保持原版式层级与可读性",
    "平台敏感词与违规承诺必须规避"
  ]
}
```

### 8.3 三段提示词配置

- 图片识别：抽取源文案层级、主副标题、按钮文案、免责声明。  
- AI帮写：回填 `targetLanguage/platformInfo/platformRuleDetail`；不确定项留空并标记。  
- 文本润色：在不改事实前提下提升译文可读性和平台合规度。

AI帮写输出：

```json
{
  "fieldValues": {
    "productCategory": "string",
    "targetLanguage": "string",
    "platformInfo": "string",
    "platformRuleDetail": "string"
  },
  "needsUserConfirm": ["fieldKey1"]
}
```
