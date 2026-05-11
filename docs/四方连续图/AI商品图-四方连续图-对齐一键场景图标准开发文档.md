# AI商品图-四方连续图-对齐一键场景图标准开发文档

> 适用功能：`video-pattern-repeat`（四方连续图）  
> 目标：基于真实参数与业务，按“一键场景图”标准完善提示词规则、拼装顺序、字段说明、通用负向与质量要求。  
> 更新时间：2026-05-09  
> 配套规则文件：
> - [AI商品图-四方连续图-mode_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/四方连续图/AI商品图-四方连续图-mode_rules.json)
> - [AI商品图-四方连续图-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/四方连续图/AI商品图-四方连续图-option_value_expansions.json)
> - [AI商品图-四方连续图-category_dimension_direction_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/四方连续图/AI商品图-四方连续图-category_dimension_direction_rules.json)

## 1. 真实功能与字段（Source of Truth）

代码来源：[src/App.tsx](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

1. `toolKey`: `video-pattern-repeat`
2. `sectionOrder`: `["video-pattern-repeat-setup"]`
3. 积分单价：`5`
4. 主上传位：`video-pattern-repeat:main`，最多24张（JPG/PNG/WebP）

真实字段：

- `patternRepeatType`：`四方连续 | 二方连续`
- `patternRepeatCreateMode`：`图生图 | 文生图`（仅四方连续）
- `patternRepeatGenerateMode`：`相似 | 原图连续`（仅四方连续+图生图）
- `patternRepeatRatio`：比例选项（仅二方连续）
- `patternRepeatPrompts`：文生图提示词数组（每条可含 `text` 与 `reverseImage`）

真实校验逻辑：

1. `二方连续` 或 `图生图`：必须上传主图。
2. `四方连续 + 文生图`：至少一条有效提示词（文本或反推图）。
3. `四方连续 + 文生图` 的 `sourceUploads` 取 `reverseImage` 列表。

## 2. 规则分层（按一键场景图标准）

四方连续图无平台字段，按业务等价拆成三层规则：

1. 一级：`patternRepeatType` + `patternRepeatCreateMode` + `patternRepeatGenerateMode`（模式规则）
2. 二级：`category/dimension/direction`（品类、维度、方向增强规则）
3. 三级：字段值扩展 `valuePrompt`（选项值扩写）

固定段：

- `universalNegativePrompt`（通用负向）
- `universalQualityPrompt`（通用质量要求）

## 3. 最终提示词拼装顺序（严格）

1. 任务目标段
2. 一级模式正文段（type/createMode/generateMode）
3. 参数段（type/createMode/generateMode/ratio）
4. 二级增强段（category + dimension + direction）
5. 字段值扩展段（`valuePrompt`）
6. 一级 `required` 汇总段
7. 一级 `forbidden` 汇总段
8. 通用负向段
9. 通用质量段
10. 文生图输入段（逐条提示词）
11. 用户补充段（当前页面未暴露，预留）

## 4. 字段说明与拼装口径

- `patternRepeatType`
- 决定是“四边无缝”还是“方向连续”。
- `patternRepeatCreateMode`
- 决定输入来源：素材保真（图生图）或文本创作（文生图）。
- `patternRepeatGenerateMode`
- 图生图内部强度开关：`相似` 偏稳健，`原图连续` 偏保真。
- `patternRepeatRatio`
- 仅二方连续生效；可联动方向规则。
- `patternRepeatPrompts`
- 文生图主输入。每条可用 `text`、`reverseImage` 或两者组合。

## 5. 通用负向与质量要求

来自：`mode_rules.json`

- 负向：禁止拼接线、断边、跳色、版权风险元素、低清噪点等。
- 质量：连续性、保真性、清晰度、可用性、一致性五项硬指标。

裁剪策略：

1. 不可裁剪：`required`、`forbidden`、`universalNegativePrompt`、`universalQualityPrompt`。
2. 可裁剪：模式正文、二级增强、valuePrompt。
3. 裁剪顺序：valuePrompt -> 二级增强 -> 模式正文。

## 6. 拼接模板（开发可直接用）

```text
任务目标：生成可商用的连续印花单元，优先保证平铺连续性、主题稳定性与后续生产可用性。

模式规则：{typePrompt} {createModePrompt} {generateModePrompt}

生成参数：连续类型={patternRepeatType}；创作方式={patternRepeatCreateMode}；生成模式={patternRepeatGenerateMode}；比例={patternRepeatRatioOrDefault}

增强规则：{categoryPrompt} {dimensionPrompt} {directionPrompt}

选项扩展：{typeValuePrompt} {createModeValuePrompt} {generateModeValuePrompt} {ratioValuePrompt}

必须满足：{requiredJoined}

禁止：{forbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

文生图输入：{promptItemsJoined}

补充说明：{supplementText}
```

## 7. 组装伪代码

```ts
function buildPatternRepeatPrompt(input: {
  patternRepeatType?: "四方连续" | "二方连续";
  patternRepeatCreateMode?: "图生图" | "文生图";
  patternRepeatGenerateMode?: "相似" | "原图连续";
  patternRepeatRatio?: string;
  patternRepeatPrompts?: Array<{ text?: string; reverseImage?: string }>;
  category?: string;
  dimension?: string;
  direction?: "横向连续" | "纵向连续" | "双向连续";
  supplementText?: string;
}) {
  const type = input.patternRepeatType ?? "四方连续";
  const createMode = input.patternRepeatCreateMode ?? "图生图";
  const generateMode = input.patternRepeatGenerateMode ?? "相似";

  const typeRule = modeRulesByType[type];
  const createModeRule = typeRule.createModes?.[createMode];
  const generateModeRule = createModeRule?.generateModes?.[generateMode];

  const ratio =
    type === "二方连续"
      ? input.patternRepeatRatio ?? "1:1"
      : "1:1";

  const autoDirection = ratioDirectionRecommend[ratio] ?? "双向连续";
  const direction = input.direction ?? autoDirection;

  const categoryPrompt = categoryRules[input.category ?? "通用"]?.prompt ?? "";
  const dimensionPrompt = dimensionRules[input.dimension ?? "中密度"]?.prompt ?? "";
  const directionPrompt = directionRules[direction]?.prompt ?? "";

  const required = [
    ...(typeRule.required ?? []),
    ...(createModeRule?.required ?? [])
  ];
  const forbidden = [
    ...(typeRule.forbidden ?? []),
    ...(createModeRule?.forbidden ?? [])
  ];

  const promptItems = (input.patternRepeatPrompts ?? []).filter((x) => (x.text ?? "").trim() || x.reverseImage);
  const promptItemsJoined = promptItems
    .map((item, idx) => `第${idx + 1}条：${item.text?.trim() || ""}${item.reverseImage ? `（反推图：${item.reverseImage}）` : ""}`)
    .join("；");

  return [
    "任务目标：生成可商用的连续印花单元，优先保证平铺连续性、主题稳定性与后续生产可用性。",
    `模式规则：${typeRule.prompt} ${createModeRule?.prompt ?? ""} ${generateModeRule?.prompt ?? ""}`.trim(),
    `生成参数：连续类型=${type}；创作方式=${createMode}；生成模式=${type === "四方连续" ? generateMode : "不适用"}；比例=${ratio}`,
    `增强规则：${categoryPrompt} ${dimensionPrompt} ${directionPrompt}`.trim(),
    `选项扩展：${resolveValuePrompts(type, createMode, generateMode, ratio).join(" ")}`,
    required.length ? `必须满足：${Array.from(new Set(required)).join("、")}。` : "",
    forbidden.length ? `禁止：${Array.from(new Set(forbidden)).join("、")}。` : "",
    universalNegativePrompt,
    universalQualityPrompt,
    promptItemsJoined ? `文生图输入：${promptItemsJoined}` : "",
    input.supplementText?.trim() ? `补充说明：${input.supplementText.trim()}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}
```

## 8. Demo

### 8.1 Demo A（四方连续 + 文生图）

输入：

```json
{
  "patternRepeatType": "四方连续",
  "patternRepeatCreateMode": "文生图",
  "patternRepeatGenerateMode": "相似",
  "patternRepeatPrompts": [
    { "text": "复古小碎花，奶油底色，低饱和蓝绿点缀，密而不乱" },
    { "text": "适合连衣裙印花，边界必须无缝", "reverseImage": "https://example.com/ref-01.png" }
  ],
  "category": "服装/纺织",
  "dimension": "中密度"
}
```

输出片段（示例）：

```text
任务目标：生成可商用的连续印花单元，优先保证平铺连续性、主题稳定性与后续生产可用性。

模式规则：目标是生成可无缝平铺的四方连续印花单元... 根据文本描述从零生成四方连续图案...。

生成参数：连续类型=四方连续；创作方式=文生图；生成模式=相似；比例=1:1

增强规则：强化面料纹理与重复节奏的柔和过渡... 维持主次元素平衡... 双向平铺均需无缝...

必须满足：四边可无缝拼接... 提示词主题明确...

禁止：四边出现硬切边... 输出与提示词主题无关内容...
```

### 8.2 Demo B（二方连续 + 图生图）

输入：

```json
{
  "patternRepeatType": "二方连续",
  "patternRepeatCreateMode": "图生图",
  "patternRepeatRatio": "16:9",
  "category": "装饰画",
  "dimension": "高密度"
}
```

输出片段（示例）：

```text
生成参数：连续类型=二方连续；创作方式=图生图；生成模式=不适用；比例=16:9

增强规则：控制大色块与细节层次... 图案元素密度偏高时... 横向平铺优先，左右边界与节奏必须无缝衔接。
```

## 9. 落地注意事项

1. 当前 UI 文案叫“四方连续图”，但真实字段允许 `二方连续`，开发需按字段值分支处理。
2. `二方连续` 时 `patternRepeatRatio` 才生效；`四方连续` 固定按 `1:1` 处理。
3. 文生图场景建议保存 `finalPrompt` + `promptItems` 快照，便于复现。
4. 若后续新增补充说明输入，可直接接入模板末段，不影响前序规则。
