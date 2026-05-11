# AI商品图-多联画-对齐一键场景图标准开发文档

> 适用功能：`video-scene-grid`（多联画）  
> 目标：基于真实参数与业务，按“一键场景图”标准完善提示词、规则配置、拼接顺序、模板与 demo。  
> 更新时间：2026-05-09  
> 配套规则文件：
> - [AI商品图-多联画-mode_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/多联画/AI商品图-多联画-mode_rules.json)
> - [AI商品图-多联画-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/多联画/AI商品图-多联画-option_value_expansions.json)
> - [AI商品图-多联画-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/多联画/AI商品图-多联画-prompt_builder_template.json)

## 1. 真实功能与字段（Source of Truth）

代码来源：[src/App.tsx](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

1. `toolKey`: `video-scene-grid`
2. `creationModeConfigKey`: `default`
3. `sectionOrder`: `["upload-main", "video-scene-grid-setup"]`
4. 上传限制：`upload-main.maxCount = 24`
5. 当前页面无 `advanced-settings`、无 `supplement`、无 `AI assist`

真实字段（写入 `advancedSelections`）：

- `videoSceneGridMode`：变化维度
- `videoSceneGridVariation`：变化方向
- `videoSceneGridDetailDimensions`：详细维度（由 mode+variation 自动生成）
- `videoSceneGridRatio`：出图比例
- `videoSceneGridOutputCount`：生图数量（2~10）
- `videoSceneGridUnitCreditCost`：单价（固定 `5`）
- `videoSceneGridTotalCreditCost`：总消耗（`uploadCount * outputCount * 5`）

真实选项：

```json
{
  "videoSceneGridMode": ["系列图案", "主副图案", "情侣图案"],
  "videoSceneGridVariationByMode": {
    "系列图案": ["智能参考", "裂变主体", "裂变主体/文本", "裂变主题", "系列衍生"],
    "主副图案": ["智能参考", "简洁", "丰富", "反转", "叙事性"],
    "情侣图案": ["智能参考"]
  },
  "videoSceneGridRatio": ["自动检测比例", "1:1", "1:2", "2:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "18:23"],
  "videoSceneGridOutputCountRange": { "min": 2, "max": 10, "default": 2 }
}
```

## 2. 对齐场景图标准后的规则输入

多联画没有平台字段，按“模式规则 + 维度扩展 + 通用负向与质量”组装。

1. 模式规则（一级）：`mode_rules.json -> modeRulesByTool[videoSceneGridMode]`
2. 变化方向扩展（二级）：`option_value_expansions.json -> videoSceneGridVariation`
3. 比例扩展（三级）：`option_value_expansions.json -> videoSceneGridRatio`
4. 详细维度扩展（四级）：`option_value_expansions.json -> videoSceneGridDetailDimensions`
5. 通用固定段（硬约束）：
- `universalNegativePrompt`
- `universalQualityPrompt`

## 3. 最终提示词拼接顺序（严格）

1. 任务目标段
2. 模式规则正文段（`modeRule.prompt`）
3. 参数段（`mode/variation/detailDimensions/ratio/outputCount`）
4. 变化方向值扩展段（`variation.valuePrompt`）
5. 比例值扩展段（`ratio.valuePrompt`）
6. 详细维度扩展段（detail dimensions 合并）
7. 模式 `required` 段
8. 模式 `forbidden` 段
9. 通用负向约束段
10. 通用质量要求段
11. 用户补充段（当前页面无该字段，模板预留）

## 4. 拼接模板（开发可直接用）

```text
任务目标：基于同一主题生成可成组使用的多联画，保证组内风格一致、变化清晰、可直接用于电商/POD场景投放。

模式规则：{modePrompt}

多联画参数：变化维度={videoSceneGridMode}；变化方向={videoSceneGridVariation}；详细维度={videoSceneGridDetailDimensions}；出图比例={videoSceneGridRatio}；生图数量={videoSceneGridOutputCount}。

变化方向扩展：{variationValuePrompt}

比例扩展：{ratioValuePrompt}

详细维度扩展：{detailDimensionPromptsJoined}

必须满足：{modeRequiredJoined}

禁止：{modeForbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

补充说明：{supplementText}
```

## 5. 组装伪代码

```ts
function buildVideoSceneGridPrompt(input: {
  videoSceneGridMode?: string;
  videoSceneGridVariation?: string;
  videoSceneGridDetailDimensions?: string;
  videoSceneGridRatio?: string;
  videoSceneGridOutputCount?: string;
  supplementText?: string;
}) {
  const mode = input.videoSceneGridMode || "系列图案";
  const variation = input.videoSceneGridVariation || "智能参考";
  const ratio = input.videoSceneGridRatio || "自动检测比例";
  const outputCount = input.videoSceneGridOutputCount || "2";
  const details = (input.videoSceneGridDetailDimensions || "")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);

  const modeRule = modeRulesByTool[mode] ?? modeRulesByTool["系列图案"];
  const variationValuePrompt = optionValueExpansions.videoSceneGridVariation?.values?.[variation]?.valuePrompt || "";
  const ratioValuePrompt = optionValueExpansions.videoSceneGridRatio?.values?.[ratio]?.valuePrompt || "";
  const detailPrompts = details
    .map((name) => optionValueExpansions.videoSceneGridDetailDimensions?.values?.[name]?.valuePrompt || "")
    .filter(Boolean);

  return [
    "任务目标：基于同一主题生成可成组使用的多联画，保证组内风格一致、变化清晰、可直接用于电商/POD场景投放。",
    `模式规则：${modeRule.prompt}`,
    `多联画参数：变化维度=${mode}；变化方向=${variation}；详细维度=${details.join(" / ")}；出图比例=${ratio}；生图数量=${outputCount}。`,
    variationValuePrompt ? `变化方向扩展：${variationValuePrompt}` : "",
    ratioValuePrompt ? `比例扩展：${ratioValuePrompt}` : "",
    detailPrompts.length ? `详细维度扩展：${detailPrompts.join(" ")}` : "",
    modeRule.required?.length ? `必须满足：${modeRule.required.join("、")}。` : "",
    modeRule.forbidden?.length ? `禁止：${modeRule.forbidden.join("、")}。` : "",
    UNIVERSAL_NEGATIVE_PROMPT,
    UNIVERSAL_QUALITY_PROMPT,
    input.supplementText?.trim() ? `补充说明：${input.supplementText.trim()}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}
```

## 6. Demo

### 6.1 输入

```json
{
  "toolKey": "video-scene-grid",
  "videoSceneGridMode": "主副图案",
  "videoSceneGridVariation": "反转",
  "videoSceneGridDetailDimensions": "切换主副位置 / 重构视觉重心 / 生成反差版式",
  "videoSceneGridRatio": "3:4",
  "videoSceneGridOutputCount": "4"
}
```

### 6.2 输出（示例）

```text
任务目标：基于同一主题生成可成组使用的多联画，保证组内风格一致、变化清晰、可直接用于电商/POD场景投放。

模式规则：围绕“主图-副图”关系生成成组画面，突出核心主体并通过副图提供补充信息，保持组内统一与主次清晰。

多联画参数：变化维度=主副图案；变化方向=反转；详细维度=切换主副位置 / 重构视觉重心 / 生成反差版式；出图比例=3:4；生图数量=4。

变化方向扩展：通过主副角色互换生成结构反转版本，保证识别逻辑仍然清楚，反转后不可丢失核心卖点可读性。

比例扩展：输出竖向信息承载比例，适合商品卡和详情流浏览，主体应占据有效视觉中心并保留上下阅读节奏。

详细维度扩展：在同一组图中明确主副位置切换规则，保持视觉语法连续。重构视觉重心时只改变关注路径，不改变主题本体识别。反差版式用于拉开系列差异，但风格、材质、色调需保持同源。

必须满足：组内风格一致、主副关系可读、变化方向明确、可直接用于成组投放。

禁止：组图彼此无关、主体漂移成不同SKU、过度特效遮挡关键信息、文字乱码或拼写错误。

通用负向约束：1. 严禁生成与原主题无关的新主体或新SKU。2. 严禁出现低质量AI伪影（结构错位、边缘融化、脏噪点、重影）。3. 严禁组图之间风格断裂、色调失控、光影不连续。4. 严禁误导性图文表达、侵权标识、水印、二维码、联系方式。5. 严禁为了变化而破坏可读性与商业可用性。

通用质量要求：1. 组内一致性：色彩、质感、光线、镜头语言统一。2. 变化可感知：每张图的差异清晰且可解释。3. 主体可信：结构、比例、材质与主题一致。4. 商业可用：缩略图和详情页下都能稳定识别。5. 可复用：结果可直接进入电商/POD后续排版链路。
```

## 7. 落地注意事项

1. 真实页面目前没有独立补充说明字段，模板中的 `supplementText` 仅预留给后续版本。
2. 若 prompt 超长，只允许裁剪：`modeRule.prompt`、`variation/ratio/detail valuePrompt`；不可裁剪：`required/forbidden/通用负向/通用质量`。
3. `videoSceneGridDetailDimensions` 是派生字段，后端如不信任前端传值，应由 `mode + variation` 重新计算。
4. 建议任务快照持久化：
- `videoSceneGridMode`
- `videoSceneGridVariation`
- `videoSceneGridDetailDimensions`
- `videoSceneGridRatio`
- `videoSceneGridOutputCount`
- `videoSceneGridUnitCreditCost`
- `videoSceneGridTotalCreditCost`
- `finalPrompt`
