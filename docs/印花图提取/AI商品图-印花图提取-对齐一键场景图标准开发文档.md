# AI商品图-印花图提取-对齐一键场景图标准开发文档

> 适用功能：`pod-extract`（印花图提取）  
> 目标：基于真实参数与业务，按“一键场景图”同标准完善提示词、规则配置、拼接顺序与模板。  
> 更新时间：2026-05-09  
> 配套规则文件：
> - [AI商品图-印花图提取-mode_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/印花图提取/AI商品图-印花图提取-mode_rules.json)
> - [AI商品图-印花图提取-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/印花图提取/AI商品图-印花图提取-option_value_expansions.json)
> - [AI商品图-印花图提取-scene_recognition_and_ratio_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/印花图提取/AI商品图-印花图提取-scene_recognition_and_ratio_rules.json)

## 1. 真实功能与字段（Source of Truth）

代码来源：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

1. `toolKey`: `pod-extract`
2. `creationModeConfigKey`: `default`
3. `sectionOrder`: `["upload-main", "pod-extract-setup"]`
4. 上传限制：`upload-main.maxCount = 24`
5. 当前页面无 `supplement` 区块、无 `advanced-settings` 区块、无 `showAiAssist`

真实可用字段：

- `podExtractMode`：`专项提取 | 全能提取`
- `podExtractScene`：随模式切换
- `podExtractRatio`：随模式切换

真实选项：

```json
{
  "podExtractMode": ["专项提取", "全能提取"],
  "podExtractSceneByMode": {
    "专项提取": ["通用", "手机壳", "家纺", "桌布"],
    "全能提取": ["全能", "全幅印", "桌布", "手机壳", "凤玲", "挂钟"]
  },
  "podExtractRatioByMode": {
    "专项提取": ["自动检测比例", "1:1", "1:2", "2:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "18:23"],
    "全能提取": ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9"]
  }
}
```

## 2. 对齐场景图标准后的规则输入

### 2.1 模式规则（替代平台规则）

`pod-extract` 没有平台字段，按业务应将“模式”作为一级规则入口：

- 来源：`mode_rules.json -> modeRulesByTool[podExtractMode]`
- 字段：`ruleLevel / prompt / required / forbidden`
- 职责：
- `prompt`：模式正文约束
- `required`：必须满足（硬约束）
- `forbidden`：禁止项（最高优先级）

### 2.2 字段值扩展（valuePrompt）

- 来源：`option_value_expansions.json`
- 覆盖字段：
- `podExtractScene`
- `podExtractRatio`

### 2.3 通用固定段

- `universalNegativePrompt`（通用负向）
- `universalQualityPrompt`（质量要求）

两者属于硬约束，不能裁剪。

## 3. 最终提示词拼装顺序（严格）

按“一键场景图标准”改造后的 `pod-extract` 固定顺序：

1. 任务目标段
2. 模式规则正文段（`modeRule.prompt`）
3. 参数段（`mode/scene/ratio`）
4. 字段值扩展段（`scene.valuePrompt + ratio.valuePrompt`）
5. 模式 `required` 段
6. 模式 `forbidden` 段
7. 通用负向约束段
8. 通用质量要求段
9. 用户补充说明段（当前页面无该字段，预留）

## 4. 内部选项与提示词映射

### 4.1 模式提示词

- `专项提取`：遮挡少场景，强调精准提取和干净边缘
- `全能提取`：高遮挡高形变场景，强调恢复连续性和可编辑性

### 4.2 场景值扩展

- `通用/手机壳/家纺/桌布/全能/全幅印/凤玲/挂钟` 均映射到具体 `valuePrompt`
- 核心作用：把“短选项值”扩展成可执行约束，避免模型只看到标签

### 4.3 比例值扩展

- `自动检测比例` 必须进入 prompt
- 固定比例（如 `1:1`、`3:4`）转为“构图与边界约束”描述

## 5. 拼接模板（开发可直接用）

```text
任务目标：从上传商品图中提取可复用的印花图案，输出可直接用于POD后续链路（裂变/连续图/尺寸延展）的高质量图案。

模式规则：{modePrompt}

提取参数：模式={podExtractMode}；产品场景={podExtractScene}；出图比例={podExtractRatio}。

字段扩展：{podExtractSceneValuePrompt} {podExtractRatioValuePrompt}

必须满足：{modeRequiredJoined}

禁止：{modeForbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

补充说明：{supplementText}
```

## 6. 组装伪代码

```ts
function buildPodExtractPrompt(input: {
  podExtractMode?: string;
  podExtractScene?: string;
  podExtractRatio?: string;
  supplementText?: string;
}) {
  const mode = input.podExtractMode || "专项提取";
  const scene = input.podExtractScene || "通用";
  const ratio = input.podExtractRatio || "自动检测比例";

  const modeRule = modeRulesByTool[mode] ?? modeRulesByTool["专项提取"];
  const sceneValuePrompt = optionValueExpansions.podExtractScene?.values?.[scene]?.valuePrompt || "";
  const ratioValuePrompt = optionValueExpansions.podExtractRatio?.values?.[ratio]?.valuePrompt || "";

  const parts = [
    "任务目标：从上传商品图中提取可复用的印花图案，输出可直接用于POD后续链路（裂变/连续图/尺寸延展）的高质量图案。",
    `模式规则：${modeRule.prompt}`,
    `提取参数：模式=${mode}；产品场景=${scene}；出图比例=${ratio}。`,
    [sceneValuePrompt, ratioValuePrompt].filter(Boolean).join(" "),
    modeRule.required?.length ? `必须满足：${modeRule.required.join("、")}。` : "",
    modeRule.forbidden?.length ? `禁止：${modeRule.forbidden.join("、")}。` : "",
    UNIVERSAL_NEGATIVE_PROMPT,
    UNIVERSAL_QUALITY_PROMPT,
    input.supplementText?.trim() ? `补充说明：${input.supplementText.trim()}` : ""
  ].filter(Boolean);

  return parts.join("\n\n");
}
```

## 7. Demo

### 7.1 输入

```json
{
  "toolKey": "pod-extract",
  "podExtractMode": "全能提取",
  "podExtractScene": "家纺",
  "podExtractRatio": "3:4"
}
```

### 7.2 输出（示例）

```text
任务目标：从上传商品图中提取可复用的印花图案，输出可直接用于POD后续链路（裂变/连续图/尺寸延展）的高质量图案。

模式规则：用于大幅褶皱、遮挡严重、透视变形明显的印花提取。需先消除基底干扰与形变影响，再重建可平铺、可复用的完整印花表达。

提取参数：模式=全能提取；产品场景=家纺；出图比例=3:4。

字段扩展：重点处理布料褶皱、纤维噪点与织物阴影，恢复可平面复用的图案纹理。 输出竖向电商常用比例，避免主体裁切。

必须满足：优先恢复被褶皱/遮挡影响的图案连续性、修正明显透视拉伸和局部扭曲、保留风格主色与关键识别元素、输出图案具备后续排版与延展可用性。

禁止：重建后风格漂移成另一种画风、出现大面积重复贴图痕迹、局部细节断裂拼接线明显、引入与原始图案无关的新主体。

通用负向约束：1. 严禁改变图案核心主题、符号语义与品牌可识别元素。2. 严禁输出任何商品底材残留（布纹、杯壁、壳体高光、背景反光）。3. 严禁出现锯齿边、白边、脏边、断边、重影、马赛克、涂抹感。4. 严禁出现低分辨率、过度锐化、过度降噪导致的细节损失。5. 严禁额外添加文字水印、Logo、二维码、联系方式或版权风险元素。

通用质量要求：1. 提取准确：图案主体完整，关键形状、色块、线条关系正确。2. 边缘质量：边缘闭合且干净，便于后续抠图、贴图、平铺。3. 细节保真：纹理、颗粒、笔触、渐变层次可辨，不糊不糙。4. 结构可用：输出图可直接进入裂变、连续图、尺寸延展等后链路。5. 一致性：同一批次多图提取风格与清晰度一致。
```

## 8. 落地注意事项

1. 当前 `pod-extract` 页面未暴露补充说明输入；如果后续新增，直接接入模板第 9 段即可。
2. 若 prompt 超长，仅允许裁剪：`modeRule.prompt` 和 `valuePrompt`；不得裁剪 `required / forbidden / 通用负向 / 通用质量`。
3. 模式切换后要重新校验 `scene/ratio` 合法值（当前前端已做联动校验）。
4. 建议在任务快照持久化：`podExtractMode/podExtractScene/podExtractRatio/finalPrompt`，便于复现与排查。

## 9. 上传后自动识别产品场景（新增）

### 9.1 场景识别提示词（可直接接入）

```text
你是POD印花图提取场景识别助手。请根据上传图片识别最合适的产品场景，并给出可用于规则回填的结构化结果。

仅允许从以下场景中选择：通用、手机壳、家纺、桌布、全能、全幅印、凤玲、挂钟。

要求：
1. 只关注真实售卖商品上的图案区域，不要把背景道具当作主体。
2. 若商品弧面明显且有开孔，优先手机壳。
3. 若布料褶皱、织纹干扰明显，优先家纺或桌布。
4. 若图案为大面积铺满，优先全幅印。
5. 若圆形盘面/钟面结构明显，优先挂钟。
6. 遮挡重、形变大、难以单一归类时，优先全能。
7. 不确定时返回通用。

只输出JSON：
{
  "podExtractScene": "通用|手机壳|家纺|桌布|全能|全幅印|凤玲|挂钟",
  "confidence": 0.0,
  "evidence": ["证据1", "证据2"],
  "needsUserConfirm": false
}
```

### 9.2 识别回填规则

1. `confidence < 0.70`：回填 `podExtractScene=通用`，`needsUserConfirm=true`。
2. 多场景同时命中时优先级：`手机壳 > 挂钟 > 全幅印 > 家纺 > 桌布 > 凤玲 > 全能 > 通用`。
3. 遮挡重/形变重时允许直接回填 `全能`。

## 10. 场景与比例关联规则（新增）

### 10.1 场景推荐比例

- `通用`：`自动检测比例 > 1:1 > 3:4 > 4:3`
- `手机壳`：`1:2 > 2:1 > 3:4 > 4:3`
- `家纺`：`3:4 > 4:3 > 2:3 > 3:2`
- `桌布`：`4:3 > 3:2 > 16:9 > 1:1`
- `全能`：`1:1 > 3:4 > 4:3 > 2:3`
- `全幅印`：`4:3 > 3:2 > 16:9 > 1:1`
- `凤玲`：`1:1 > 3:4 > 4:5 > 5:4`
- `挂钟`：`1:1 > 4:5 > 5:4 > 3:4`

### 10.2 模式约束与降级

- `专项提取` 支持：`自动检测比例/1:1/1:2/2:1/2:3/3:2/3:4/4:3/9:16/16:9/18:23`
- `全能提取` 支持：`1:1/2:3/3:2/3:4/4:3/4:5/5:4/9:16/16:9`

降级策略：

1. 先取场景推荐第 1 比例。
2. 若该比例不在当前模式可选中，按推荐顺序取第一个可用比例。
3. 若仍没有可用项，回退默认：`专项提取=自动检测比例`，`全能提取=1:1`。

### 10.3 伪代码

```ts
function resolveSceneAndRatio(mode: "专项提取" | "全能提取", sceneFromAI: string) {
  const scene = isValidScene(sceneFromAI) ? sceneFromAI : "通用";
  const preferred = sceneRecommendedRatios[scene] || ["1:1"];
  const allowed = modeAllowedRatios[mode] || [];

  const ratio = preferred.find((r) => allowed.includes(r)) || (mode === "专项提取" ? "自动检测比例" : "1:1");
  return { scene, ratio };
}
```
