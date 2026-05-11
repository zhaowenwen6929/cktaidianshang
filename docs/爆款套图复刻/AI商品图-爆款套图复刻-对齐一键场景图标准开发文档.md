# AI商品图-爆款套图复刻-对齐一键场景图标准开发文档

> 适用功能：`set-replica`（爆款套图复刻）  
> 目标：按“一键场景图标准”沉淀可直接开发的参数、规则配置、提示词拼装模板、流程与积分口径。  
> 代码基线：`src/App.tsx`（当前仓库实现）

## 1. 功能范围与真实页面结构

- toolKey：`set-replica`
- `creationModeConfigKey`：`spoke`
- `sectionOrder`：`["upload-reference", "upload-main", "generation-rule-notice", "creation-mode", "supplement"]`
- 上传区：
  - 商品图（`main`）：最多 24 张，必填
  - 参考图（`reference`）：最多 24 张，必填（生成前强校验）
- 该功能当前无高级字段表单（无 `advanced-settings`）

## 2. 创作模式与参数（真实）

复用 `spoke` 模式配置：

- 模式：`normal` / `advanced` / `cn-enhanced`
- 比例：`defaultRatioOptions`
  - `自适应尺寸, 1:1, 3:4, 4:5, 9:16, 2:3, 16:9, 4:3, 5:4, 3:2, 21:9`
- 数量：`defaultCountOptions`
  - `1, 2`
- 分辨率：仅 `advanced` 有
  - `1K, 2K, 4K`
- 分辨率积分单价（advanced）：`1K=10, 2K=15, 4K=20`
- 基础单价：
  - normal: `5`
  - cn-enhanced: `10`

## 3. 业务流程与交互

1. 上传参考图（风格源）。
2. 上传商品图（被复刻主体）。
3. 阅读“生成规则说明”（多对多计算）。
4. 选择模式、比例、数量（高级模式可选分辨率）。
5. 填写补充说明（可选，支持 AI 润色）。
6. 点击生成，系统校验：
  - 商品图不能为空
  - 参考图不能为空（`set-replica` 特有）
7. 系统按规则拼装最终 Prompt，提交生成。

## 4. 结果数量与积分消耗口径

### 4.1 结果数量

`set-replica` 使用多对多：

- `total_output_count = 商品图数量 × 参考图数量 × 每批次出图数量`

### 4.2 生成积分

- `generateCost = total_output_count × unitCreditCost`
- 其中 `unitCreditCost` 由当前模式（含分辨率）解析。

### 4.3 排队取消退积分口径（当前实现）

- `set-replica` 使用 `getQueuedResultRefundCredits` 特例：
  - 取消单个排队结果退回 `unitCreditCost`。

## 5. AI 润色与最终 Prompt 现状

### 5.1 AI 润色

`supplementAiPolishConfigs` 当前无 `set-replica` 专属配置，会走默认：

- modelLabel：`创客贴AI补充说明润色`
- prompt：`优化补充说明，使描述更具体、清晰、可执行。`

### 5.2 最终 Prompt 现状

`set-replica` 当前 `resolvedSupplementValue = supplementValue`，即：

- 未做系统化拼装
- 未自动追加通用负向约束
- 未自动追加质量要求

本文件下方给出“对齐一键场景图标准”的完整拼装模板与配置文件。

## 6. 对齐一键场景图标准：推荐配置结构

本目录新增 4 份配置：

1. `AI商品图-爆款套图复刻-mode_rules.json`
2. `AI商品图-爆款套图复刻-category_dimension_direction_rules.json`
3. `AI商品图-爆款套图复刻-option_value_expansions.json`
4. `AI商品图-爆款套图复刻-prompt_builder_template.json`

## 7. 标准拼装顺序（强约束）

按以下顺序拼接，不可打乱：

1. 任务目标段（功能定位）
2. 品类规则段（category 命中）
3. 维度/方向规则段（dimension + direction）
4. 参数显式段（字段=值）
5. 字段值扩展段（`valuePrompt`）
6. 平台/使用位限制段（本功能可固定“套图附图位”语义）
7. `required` 段
8. `forbidden` 段
9. 通用负向段（固定）
10. 通用质量要求段（固定）
11. 用户补充段（可选）

## 8. 字段定义（用于拼装）

推荐最终拼装入参字段：

- `toolKey`: `set-replica`
- `productCategory`: 品类归一结果
- `sceneDimension`: 复刻维度（构图/光影/材质/场景等）
- `creativeDirection`: 风格方向（写实/清新/高级等）
- `replicaStrength`: 复刻强度（低/中/高）
- `subjectConsistency`: 主体一致性策略
- `backgroundComplexity`: 背景复杂度
- `ratio`
- `resolution`
- `outputCount`
- `userSupplement`

## 9. 拼装模板（伪代码）

```ts
function buildSetReplicaPrompt(input) {
  const modeRule = modeRules[input.modeId];
  const categoryRule = categoryRules[input.productCategory] ?? categoryRules["通用品类"];
  const dimensionRule = dimensionRules[input.sceneDimension] ?? "";
  const directionRule = directionRules[input.creativeDirection] ?? "";

  const paramLine = [
    `复刻强度=${input.replicaStrength}`,
    `主体一致性=${input.subjectConsistency}`,
    `背景复杂度=${input.backgroundComplexity}`,
    `出图比例=${input.ratio}`,
    input.resolution ? `分辨率=${input.resolution}` : "",
    `数量=${input.outputCount}`
  ].filter(Boolean).join("；");

  const expansionLines = buildValuePromptExpansions(input, optionValueExpansions);

  return [
    modeRule.taskGoal,
    `当前商品品类：${input.productCategory}。${categoryRule.prompt}`,
    dimensionRule,
    directionRule,
    `参数：${paramLine}`,
    expansionLines,
    `必须满足：${modeRule.required.join("；")}`,
    `禁止：${modeRule.forbidden.join("；")}`,
    modeRule.universalNegativePrompt,
    modeRule.universalQualityPrompt,
    input.userSupplement?.trim() ? `补充要求：${input.userSupplement.trim()}` : ""
  ].filter(Boolean).join("\n\n");
}
```

## 10. Demo

### 10.1 Demo 输入

```json
{
  "toolKey": "set-replica",
  "modeId": "advanced",
  "productCategory": "家电数码类",
  "sceneDimension": "产品场景",
  "creativeDirection": "科技未来",
  "replicaStrength": "高保真复刻",
  "subjectConsistency": "严格一致",
  "backgroundComplexity": "中等复杂",
  "ratio": "4:5",
  "resolution": "2K",
  "outputCount": 2,
  "userSupplement": "突出耳机金属细节和佩戴状态，背景不要过暗。"
}
```

### 10.2 Demo 输出（节选）

```text
生成高可用电商爆款套图复刻结果：以参考图风格语言为依据，在不改变商品真实结构与卖点的前提下完成多图复刻。

当前商品品类：家电数码类。突出电子产品结构、材质、接口/按键逻辑与使用语义，避免过度特效遮挡主体。

场景维度：强调“真实可用的产品场景”，确保主体与环境关系自然、用途清晰。

方向风格：科技未来。允许适度科技氛围，但不得破坏商品结构识别与商业可读性。

参数：复刻强度=高保真复刻；主体一致性=严格一致；背景复杂度=中等复杂；出图比例=4:5；分辨率=2K；数量=2

必须满足：主体结构一致；卖点表达一致；多图风格一致；平台缩略图可识别。

禁止：虚假功效；侵权元素；违规导流；低质伪影；主体结构漂移。

通用负向约束：严禁虚假功效、误导对比、侵权logo/文字、水印二维码、结构错位、边缘融化与低清晰度伪影。

通用质量要求：主体清晰可辨、光影透视可信、材质纹理稳定、跨图一致性高、可直接用于电商投放。

补充要求：突出耳机金属细节和佩戴状态，背景不要过暗。
```

## 11. 开发接入建议（落地）

1. 在 `resolvedSupplementValue` 分支中为 `set-replica` 增加 `buildSetReplicaPrompt(...)`。
2. 在 `advanced-settings` 增加上述关键字段（或由 AI 回填）。
3. `resolvedAdvancedSelections` 回写：
   - `setReplicaPrompt`
   - `setReplicaPromptSummary`
   - `productCategory`（归一结果）
4. 保留现有数量与积分公式，不改计费逻辑。

## 12. 验收清单

1. 参考图为空时无法生成（现有逻辑保留）。
2. 最终提交使用“完整拼装 Prompt”，不再是原始补充文案。
3. Prompt 必须包含：品类段、维度/方向段、required、forbidden、通用负向、通用质量。
4. 数量与积分计算与当前代码一致。
