# AI商品图-图案裁剪-对齐一键场景图标准开发文档

> 适用功能：`pod-crop`（图案裁剪）  
> 目标：根据图案裁剪真实参数与业务，按“一键场景图”标准输出可直接开发落地的提示词与配置方案。  
> 更新时间：2026-05-09  
> 配套规则文件：
> - [AI商品图-图案裁剪-mode_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/图案裁剪/AI商品图-图案裁剪-mode_rules.json)
> - [AI商品图-图案裁剪-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/图案裁剪/AI商品图-图案裁剪-option_value_expansions.json)
> - [AI商品图-图案裁剪-category_dimension_direction_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/图案裁剪/AI商品图-图案裁剪-category_dimension_direction_rules.json)

## 1. 真实功能与字段（Source of Truth）

代码来源：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

1. `toolKey`: `pod-crop`
2. `creationModeConfigKey`: `default`
3. `sectionOrder`: `["upload-main", "pod-crop-mode"]`
4. 上传限制：`upload-main.maxCount = 24`
5. 当前页面无 `advanced-settings`、无 `supplement`、无 `AI assist` 显式入口

真实可用字段：

- `podCropMode`: `通用 | 铁皮画 | 装饰画`

补充业务事实（来自计费与模式联动）：

- `通用`: `unitCreditCost=5`
- `铁皮画`: `unitCreditCost=10`
- `装饰画`: `unitCreditCost=15`

## 2. 对齐一键场景图标准后的规则分层

`pod-crop` 无平台字段，按“模式规则 + 选项扩展 + 通用硬约束”实现。

1. 一级规则：`modeRulesByTool[podCropMode]`
2. 二级扩展：`optionValueExpansions.podCropMode.values[podCropMode].valuePrompt`
3. 通用硬约束：
- `universalNegativePrompt`
- `universalQualityPrompt`

扩展预留（便于后续统一到多维规则）：

- 品类规则（category）
- 维度规则（dimension/ratio）
- 方向规则（direction）

以上预留已写入：
[AI商品图-图案裁剪-category_dimension_direction_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/图案裁剪/AI商品图-图案裁剪-category_dimension_direction_rules.json)

## 3. 最终提示词拼装顺序（严格）

按“一键场景图标准”执行固定顺序：

1. 任务目标段
2. 模式规则正文段（`modeRule.prompt`）
3. 参数段（当前至少包含 `podCropMode`）
4. 模式值扩展段（`podCropMode.valuePrompt`）
5. 模式 `required` 段
6. 模式 `forbidden` 段
7. 通用负向约束段
8. 通用质量要求段
9. 用户补充说明段（当前页面无该字段，预留）

如果后续接入品类/维度/方向，插入顺序建议：

- 在步骤 3 之后追加参数段：`category / dimension / direction`
- 在步骤 4 中并入三类 `valuePrompt`
- 在步骤 5/6 中并入 `category.required/forbidden`

## 4. 统一拼接模板（开发可直接用）

```text
任务目标：基于上传商品图执行图案裁剪，输出主体完整、边缘干净、可直接用于POD后续链路的高质量图案结果。

模式规则：{modePrompt}

裁剪参数：模式={podCropMode}。

模式扩展：{podCropModeValuePrompt}

必须满足：{modeRequiredJoined}

禁止：{modeForbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

补充说明：{supplementText}
```

## 5. 含品类/维度/方向的扩展模板（预留标准版）

```text
任务目标：基于上传商品图执行图案裁剪，输出主体完整、边缘干净、可直接用于POD后续链路的高质量图案结果。

模式规则：{modePrompt}

品类规则：{categoryPrompt}

裁剪参数：模式={podCropMode}；品类={podCropCategory}；维度={cropDimension}；方向={cropDirection}。

字段扩展：{podCropModeValuePrompt} {dimensionValuePrompt} {directionValuePrompt}

模式必须满足：{modeRequiredJoined}

模式禁止：{modeForbiddenJoined}

品类必须满足：{categoryRequiredJoined}

品类禁止：{categoryForbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

补充说明：{supplementText}
```

## 6. 组装伪代码（严格顺序版）

```ts
function buildPodCropPrompt(input: {
  podCropMode?: string;
  supplementText?: string;
}) {
  const mode = input.podCropMode || "通用";

  const modeRule = modeRulesByTool[mode] ?? modeRulesByTool["通用"];
  const modeValuePrompt =
    optionValueExpansions?.podCropMode?.values?.[mode]?.valuePrompt || "";

  const parts = [
    "任务目标：基于上传商品图执行图案裁剪，输出主体完整、边缘干净、可直接用于POD后续链路的高质量图案结果。",
    `模式规则：${modeRule.prompt}`,
    `裁剪参数：模式=${mode}。`,
    modeValuePrompt ? `模式扩展：${modeValuePrompt}` : "",
    modeRule.required?.length
      ? `必须满足：${modeRule.required.join("、")}。`
      : "",
    modeRule.forbidden?.length
      ? `禁止：${modeRule.forbidden.join("、")}。`
      : "",
    UNIVERSAL_NEGATIVE_PROMPT,
    UNIVERSAL_QUALITY_PROMPT,
    input.supplementText?.trim()
      ? `补充说明：${input.supplementText.trim()}`
      : ""
  ].filter(Boolean);

  return parts.join("\n\n");
}
```

## 7. Demo

### 7.1 输入（当前真实字段）

```json
{
  "toolKey": "pod-crop",
  "podCropMode": "铁皮画"
}
```

### 7.2 输出（示例）

```text
任务目标：基于上传商品图执行图案裁剪，输出主体完整、边缘干净、可直接用于POD后续链路的高质量图案结果。

模式规则：适配铁皮画类图案裁剪，强调主体图形力量感、边缘张力和复古质感语义保真。

裁剪参数：模式=铁皮画。

模式扩展：按铁皮画语义裁剪，保留复古颗粒、磨损细节与硬朗图形关系，避免关键文案和徽标被切断。

必须满足：保留铁皮画核心图形与主文案关系、保持磨损感/颗粒感等风格细节可辨、构图重心稳定，避免关键元素贴边被切、输出适合后续排版与印制。

禁止：误删关键符号、主标题或视觉锚点、复古纹理被过度降噪抹平、新增与原主题不一致的装饰元素、裁剪后边缘出现破损感伪影。

通用负向约束：1. 严禁改变图案核心主题、品牌可识别元素和主视觉语义。2. 严禁出现锯齿、毛边、白边、重影、脏边、涂抹感。3. 严禁拉伸变形、透视错乱或比例失真。4. 严禁引入文字水印、Logo、二维码、联系方式等风险元素。5. 严禁输出低分辨率、过度锐化或过度降噪导致的质量劣化。

通用质量要求：1. 裁剪准确：主体完整、关键元素不丢失。2. 边缘质量：边界干净闭合，便于后续贴图与印制。3. 细节保真：纹理、线条、色块层次清晰。4. 构图可用：重心稳定、留白合理、比例适配业务场景。5. 批次一致：同批次结果风格与清晰度一致。
```

## 8. 长度裁剪与优先级规则

1. 不可裁剪（硬约束）：
- `required`
- `forbidden`
- `universalNegativePrompt`
- `universalQualityPrompt`

2. 可裁剪（软描述）：
- `modeRule.prompt`
- `modeValuePrompt`
- 后续扩展中的 `categoryPrompt / dimensionValuePrompt / directionValuePrompt`

3. 冲突优先级：
- `forbidden > required > modeValuePrompt > modePrompt`

## 9. 开发落地建议

1. 当前前端仅传 `podCropMode`，服务端按本文件最小模板组装即可。
2. 后续如新增 UI 字段（品类/维度/方向），直接复用已提供的 `category_dimension_direction_rules.json`。
3. 任务快照建议持久化：
- `podCropMode`
- `finalPrompt`
- `modeRuleVersion`
- （扩展后）`podCropCategory/cropDimension/cropDirection`

## 10. 场景识别与回填（扩展预留）

当接入上传后自动识别时，可使用配套 JSON 中 `recognitionPrompt`，统一输出：

```json
{
  "podCropCategory": "默认|服装/纺织|手机壳|挂钟|装饰画|铁皮画",
  "cropDimension": "自动|1:1|3:4|4:3|9:16|16:9",
  "cropDirection": "自动|横向|竖向|中心",
  "confidence": 0.0,
  "needsUserConfirm": false,
  "evidence": ["证据1", "证据2"]
}
```

回填策略建议：

1. `confidence < 0.70` 时仅回填 `默认 + 自动 + 自动`，并要求用户确认。
2. 高置信度时自动回填品类与维度方向，并保留用户手动覆盖能力。
