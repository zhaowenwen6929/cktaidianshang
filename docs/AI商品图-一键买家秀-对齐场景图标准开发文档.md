# AI商品图-一键买家秀-对齐场景图标准开发文档

> 适用功能：`goods-buyer`（一键买家秀）  
> 目标：与 `goods-scene`（一键场景图）保持同一套“品类归一 + 规则组装”标准，方便开发直接复用。  
> 状态：已在 `src/App.tsx` 落地可运行版本。
> 独立品类配置：[`AI商品图-一键买家秀-category_rules.json`](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI商品图-一键买家秀-category_rules.json)

## 1. 本次改造目标

1. 品类配置按场景图标准完善，子品类不再走单独映射关系。
2. 子品类词直接通过 `aliases` 命中品类规则。
3. 买家秀拼装规则对齐场景图标准，使用统一结构输出最终 prompt。

---

## 2. 已落地能力（代码侧）

代码位置：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

- 新增类型：
  - `PromptRuleLevel`
  - `PromptPlatformRule`
  - `PromptCategoryRule`
  - `PromptOptionExpansionMap`
- 新增配置：
  - `goodsBuyerCategoryRules`
  - `goodsBuyerPlatformRules`
  - `goodsBuyerOptionValueExpansions`
- 新增函数：
  - `normalizeGoodsBuyerCategoryByAliases(productType?)`
  - `buildGoodsBuyerPromptAssembly(selectionMap, supplementValue)`
- 接入链路：
  - AI帮写 `goods-buyer` 分支写入 `productCategory`
  - 生成时 `goods-buyer` 的 `supplementValue` 改为“完整拼装 prompt”
  - 任务快照写入 `goodsBuyerPrompt` 和归一后的 `productCategory`

---

## 3. 品类归一标准（替代子品类单独映射）

### 3.1 规则说明

- 入口字段：`productType`
- 命中方式：`productType` 文本直接匹配 `goodsBuyerCategoryRules[*].aliases`
- 输出字段：`productCategory`
- 兜底：未命中时统一返回 `通用品类`

### 3.2 核心函数逻辑

```ts
function normalizeGoodsBuyerCategoryByAliases(productType?: string) {
  const normalized = (productType ?? "").trim().toLowerCase();
  if (!normalized) return "通用品类";
  const matched = goodsBuyerCategoryRules.find((rule) =>
    rule.aliases.some((alias) => normalized.includes(alias.toLowerCase()))
  );
  return matched?.label ?? "通用品类";
}
```

> 这一步即“子品类直连品类规则”，不再维护独立 `productTypeToCategoryMap` 作为单独链路。

### 3.3 aliases 覆盖要求（关键）

- `aliases` 必须覆盖 `productTypeInputOptions` 的全部值，确保技术侧可以直接归类。
- 当前需要覆盖的 `productType` 值：

```json
[
  "智能识别",
  "服装",
  "T恤",
  "背包",
  "鞋子",
  "小家电",
  "电视",
  "沙发",
  "吊灯",
  "化妆品",
  "香水",
  "水果",
  "饮料",
  "汽车",
  "集装箱",
  "蓝牙耳机",
  "手机",
  "行李箱",
  "文具",
  "机械设备",
  "项链",
  "玩具",
  "瑜伽服",
  "健身器材",
  "笔记本电脑",
  "手办"
]
```

- 覆盖校验建议（开发侧）：

```ts
const uncoveredTypes = productTypeInputOptions.filter((type) => {
  const value = type.trim().toLowerCase();
  return !goodsBuyerCategoryRules.some((rule) =>
    rule.aliases.some((alias) => alias.trim().toLowerCase() === value)
  );
});

// 期望 uncoveredTypes.length === 0
```

---

## 4. 拼装规则标准（对齐场景图）

### 4.1 组装顺序

1. 任务目标（买家秀生成目标）
2. 品类规则（`productCategory` 命中结果）
3. 平台规则正文（当前默认 `全平台通用（16平台）`）
4. 高级字段参数段（`field=value`）
5. 字段值扩展段（`valuePrompt`）
6. `required` 段
7. `forbidden` 段
8. 通用负向提示词段（固定）
9. 通用质量说明段（固定）
10. 用户补充说明（可选）

### 4.3 通用负向提示词（建议固定追加）

```text
通用负向约束：
1. 严禁虚假功效、夸张疗效、误导性前后对比和与实际售卖内容不一致的展示。
2. 严禁生成违规水印、二维码、联系方式、站外导流信息、侵权Logo或明显品牌仿冒元素。
3. 严禁过度修图导致商品结构、颜色、材质、比例失真，禁止把主体改造成其他SKU。
4. 严禁背景喧宾夺主、主体被遮挡、关键细节不可辨、文字贴片堆砌。
5. 严禁低质AI伪影（肢体错位、镜像错误、结构漂移、边缘融化、异常反射、脏污噪点）。
```

### 4.4 通用质量说明（建议固定追加）

```text
通用质量要求：
1. 商品主体必须清晰可辨，结构、颜色、材质与上传商品一致，关键卖点可读。
2. 场景、人物、道具仅作辅助，主次关系明确，画面重心始终在商品本体。
3. 光影、透视、遮挡、接触关系自然可信，避免不符合真实物理关系的表现。
4. 保持买家秀语义：真实生活感、轻抓拍感、可转化，不做重广告海报化表达。
5. 输出图在平台常见缩略图与详情页下均保持识别稳定，不出现关键信息丢失。
```

### 4.2 组装函数（已落地）

```ts
function buildGoodsBuyerPromptAssembly(selectionMap: AdvancedSelectionMap = {}, supplementValue = "") {
  const productType = selectionMap.productType ?? "智能识别";
  const category = normalizeGoodsBuyerCategoryByAliases(productType);
  const categoryPrompt = goodsBuyerCategoryRules.find((rule) => rule.label === category)?.prompt ?? "...";
  const platformRule = goodsBuyerPlatformRules["全平台通用（16平台）"];
  const paramLine = `产品类型=${productType}；产品状态=${selectionMap.productState ?? ""}；...`;
  const expansionLines = Object.values(goodsBuyerOptionValueExpansions)
    .map((field) => field.values[selectionMap[field.fieldKey] ?? ""]?.valuePrompt ?? "")
    .filter(Boolean)
    .join(" ");

  const prompt = [
    "生成真实自然、生活化的买家秀风格商品图。",
    `当前商品品类为「${category}」，${categoryPrompt}`,
    platformRule.prompt,
    paramLine,
    expansionLines,
    platformRule.required?.length ? `必须满足：${platformRule.required.join("、")}。` : "",
    platformRule.forbidden?.length ? `禁止：${platformRule.forbidden.join("、")}。` : "",
    "通用负向约束：严禁虚假功效、违规导流、侵权元素、主体失真与低质伪影。",
    "通用质量要求：主体清晰、结构真实、光影透视可信、买家秀语义明确、平台缩略图可识别。",
    supplementValue.trim() ? `补充要求：${supplementValue.trim()}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");

  return { category, prompt };
}
```

---

## 5. AI帮写与生成接入点

### 5.1 AI帮写

在 `buildAdvancedAiAssistResult` 的 `goods-buyer` 分支中：

- 先回填 `productType/productState/...`
- 再执行：

```ts
fieldValues.productCategory = normalizeGoodsBuyerCategoryByAliases(fieldValues.productType);
```

### 5.2 生成提交

在提交 payload 前：

- `goods-buyer` 的 `resolvedSupplementValue` 使用：

```ts
buildGoodsBuyerPromptAssembly(advancedSettingSelections, supplementValue).prompt
```

- 同步写入 `resolvedAdvancedSelections`：

```ts
{
  ...advancedSettingSelections,
  productCategory: normalizeGoodsBuyerCategoryByAliases(advancedSettingSelections.productType),
  goodsBuyerPrompt: buildGoodsBuyerPromptAssembly(advancedSettingSelections, supplementValue).prompt
}
```

---

## 6. 开发复用建议

1. 买家秀当前高级字段（`productState/presentationStyle/sceneAtmosphere/productReality/environmentReality/shotReality/targetMarket`）已全部补齐 `valuePrompt` 扩展；后续新增字段时也必须同时补齐。
2. 若要扩展平台差异，优先在 `goodsBuyerPlatformRules` 增平台键，保持 `required/forbidden` 可结构化合并。
3. 若新增子品类，只补对应 `aliases`，不要再引入独立映射表，保持链路单一。

---

## 7. 验收清单

1. 上传图后 AI帮写能自动回填 `productCategory`。
2. `productType` 改变时，`productCategory` 可随 `aliases` 规则变化。
3. 最终提交给生成的文本是“完整拼装 prompt”，不是原始补充说明。
4. prompt 中必须包含：品类规则、字段参数、valuePrompt 扩展、required、forbidden。

---

## 8. 拼接 Demo（输入 -> 输出）

### 8.1 Demo 输入

```json
{
  "toolKey": "goods-buyer",
  "advancedSelections": {
    "productType": "服装",
    "productState": "穿戴状态",
    "presentationStyle": "对镜子自拍",
    "sceneAtmosphere": "居家场景",
    "productReality": "包装与产品褶皱",
    "environmentReality": "人物日常穿搭",
    "shotReality": "手持自拍",
    "targetMarket": "大陆"
  },
  "supplementValue": "强调针织纹理和自然褶皱，保持真实生活感，不要过度磨皮。"
}
```

### 8.2 归一命中结果

```json
{
  "productType": "服装",
  "productCategory": "服饰类",
  "hitBy": "aliases"
}
```

### 8.3 valuePrompt 命中明细（示例）

```json
[
  {
    "fieldKey": "productState",
    "value": "穿戴状态",
    "valuePrompt": "体现真实穿戴效果与轮廓关系，避免夸张体型修饰。"
  },
  {
    "fieldKey": "presentationStyle",
    "value": "对镜子自拍",
    "valuePrompt": "保留自拍视角真实感，但镜面反射不应遮挡主体。"
  },
  {
    "fieldKey": "sceneAtmosphere",
    "value": "居家场景",
    "valuePrompt": "生活化居家环境，光线自然，避免棚拍感过重。"
  }
]
```

### 8.4 最终拼接输出（示例）

```text
生成真实自然、生活化的买家秀风格商品图。

当前商品品类为「服饰类」，重点体现上身/平铺真实状态，保持版型、垂感、面料纹理与褶皱逻辑，避免过度磨皮和轮廓重塑。

买家秀图应以真实生活感为核心，商品主体清晰可辨，不做夸张商业特效，不制造误导性使用场景。

产品类型=服装；产品状态=穿戴状态；呈现方式=对镜子自拍；场景氛围=居家场景；产品真实感=包装与产品褶皱；环境真实感=人物日常穿搭；拍摄真实感=手持自拍；目标市场=大陆。

体现真实穿戴效果与轮廓关系，避免夸张体型修饰。保留自拍视角真实感，但镜面反射不应遮挡主体。生活化居家环境，光线自然，避免棚拍感过重。

必须满足：真实感、商品可识别、场景与用途一致。

禁止：虚假功效演绎、不实对比、过度修图导致商品失真、违规水印/联系方式。

补充要求：强调针织纹理和自然褶皱，保持真实生活感，不要过度磨皮。
```

---

## 9. 最小联调示例代码

```ts
const advancedSelections = {
  productType: "服装",
  productState: "穿戴状态",
  presentationStyle: "对镜子自拍",
  sceneAtmosphere: "居家场景",
  productReality: "包装与产品褶皱",
  environmentReality: "人物日常穿搭",
  shotReality: "手持自拍",
  targetMarket: "大陆"
};

const supplementValue = "强调针织纹理和自然褶皱，保持真实生活感，不要过度磨皮。";
const { category, prompt } = buildGoodsBuyerPromptAssembly(advancedSelections, supplementValue);

console.log(category); // 服饰类
console.log(prompt);   // 可直接提交给生成模型
```
