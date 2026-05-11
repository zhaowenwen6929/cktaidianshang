# AI商品图-局部改图-对齐一键场景图标准开发文档

> 适用功能：`pod-partial-edit`（局部改图）  
> 目标：基于真实参数与业务，按“一键场景图”标准完善提示词、规则配置、拼接顺序、模板与 demo。  
> 更新时间：2026-05-09  
> 配套规则文件：
> - [AI商品图-局部改图-mode_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/局部改图/AI商品图-局部改图-mode_rules.json)
> - [AI商品图-局部改图-category_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/局部改图/AI商品图-局部改图-category_rules.json)
> - [AI商品图-局部改图-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/局部改图/AI商品图-局部改图-option_value_expansions.json)

## 1. 真实功能与字段（Source of Truth）

代码来源：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

1. `toolKey`: `pod-partial-edit`
2. `creationModeConfigKey`: `default`
3. `sectionOrder`: `["upload-main","pod-partial-edit-setup"]`
4. 上传限制：`upload-main.maxCount = 24`
5. 页面无 `supplement` 区块，改图指令由 `podPartialEditInstructionText` 承载

真实可用字段：

- `podPartialEditCategory`: `默认 | 服装/纺织 | 手机壳 | 铁艺图形 | 挂钟 | 装饰画 | 铁皮画`
- `podPartialEditRequirement`: `替换“文字”和元素 | 去除商品印花 | 商品换色 | 服饰做纹理 | 自定义提示词`
- `podPartialEditFieldValues`: 结构化字段值（JSON 字符串）
- `podPartialEditInstructionText`: 最终改图指令（模板拼装或自定义）
- `podPartialEditOutputCount`: `1 | 2 | 3 | 4`

## 2. 页面真实业务规则

### 2.1 分类推断

页面通过文件名关键词推断 `podPartialEditCategory`：

- 服装/纺织：`fabric|textile|cloth|服装|纺织|布料|面料|服饰`
- 手机壳：`phone|case|手机壳|壳`
- 铁艺图形：`iron|metal|铁艺|图形`
- 挂钟：`clock|挂钟`
- 装饰画：`decor|frame|装饰画`
- 铁皮画：`tin|plate|铁皮画`
- 未命中：`默认`

### 2.2 模板拼装行为（真实）

- 非“自定义提示词”时，`podPartialEditInstructionText` 实际被拼成 JSON 文本：
  - `type`（模板 key）
  - `title`（模板 label）
  - `fields[]`（每个字段的 `key/label/type/value`）
- “自定义提示词”时，`podPartialEditInstructionText = customPrompt`

## 3. 对齐场景图标准后的规则输入

`pod-partial-edit` 无平台字段，按“模式规则 + 品类规则 + 选项值扩展 + 通用负向/质量”组装：

1. 模式规则（一级）：`mode_rules.json -> modeRulesByTool[podPartialEditRequirement]`
2. 品类规则（二级）：`category_rules.json -> categoryRulesByTool[podPartialEditCategory]`
3. 字段值扩展（三级）：`option_value_expansions.json`（按 `field + value` 命中 `valuePrompt`）
4. 通用段（硬约束）：
   - `universalNegativePrompt`
   - `universalQualityPrompt`

## 4. 最终提示词拼接顺序（严格）

1. 任务目标段
2. 模式规则正文段（`modeRule.prompt`）
3. 品类规则正文段（`categoryRule.prompt`）
4. 参数段（`category/requirement/outputCount`）
5. 结构化字段展开段（来自 `podPartialEditFieldValues`）
6. 字段值扩展段（`valuePrompt` 合并）
7. `mode.required`
8. `mode.forbidden`
9. `category.required`
10. `category.forbidden`
11. 通用负向约束
12. 通用质量要求
13. 用户补充段（当前无独立 supplement，默认取 `podPartialEditInstructionText` 中人工补充内容）

## 5. 开发拼接模板（可直接用）

```text
任务目标：在保持商品主体结构、材质逻辑与商业可售性的前提下执行局部改图，仅修改用户指定区域，不做整图重绘。

模式规则：{modePrompt}

品类规则：{categoryPrompt}

改图参数：品类={podPartialEditCategory}；改图要求={podPartialEditRequirement}；出图数量={podPartialEditOutputCount}。

局部编辑结构化指令：{instructionStructuredText}

字段扩展：{valuePromptJoined}

模式必须满足：{modeRequiredJoined}

模式禁止：{modeForbiddenJoined}

品类必须满足：{categoryRequiredJoined}

品类禁止：{categoryForbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

补充说明：{supplementText}
```

## 6. 组装伪代码

```ts
function buildPodPartialEditPrompt(input: {
  podPartialEditCategory?: string;
  podPartialEditRequirement?: string;
  podPartialEditFieldValues?: Record<string, string>;
  podPartialEditInstructionText?: string;
  podPartialEditOutputCount?: string;
}) {
  const category = input.podPartialEditCategory || "默认";
  const requirement = input.podPartialEditRequirement || "替换“文字”和元素";
  const outputCount = input.podPartialEditOutputCount || "1";
  const fieldValues = input.podPartialEditFieldValues || {};
  const instructionText = input.podPartialEditInstructionText || "";

  const modeRule = modeRulesByTool[requirement] ?? modeRulesByTool["替换“文字”和元素"];
  const categoryRule = categoryRulesByTool[category] ?? categoryRulesByTool["默认"];
  const valuePrompts = resolveValuePrompts(requirement, fieldValues);

  const parts = [
    "任务目标：在保持商品主体结构、材质逻辑与商业可售性的前提下执行局部改图，仅修改用户指定区域，不做整图重绘。",
    `模式规则：${modeRule.prompt}`,
    `品类规则：${categoryRule.prompt}`,
    `改图参数：品类=${category}；改图要求=${requirement}；出图数量=${outputCount}。`,
    `局部编辑结构化指令：${instructionText}`,
    valuePrompts.length ? `字段扩展：${valuePrompts.join(" ")}` : "",
    modeRule.required?.length ? `模式必须满足：${modeRule.required.join("、")}。` : "",
    modeRule.forbidden?.length ? `模式禁止：${modeRule.forbidden.join("、")}。` : "",
    categoryRule.required?.length ? `品类必须满足：${categoryRule.required.join("、")}。` : "",
    categoryRule.forbidden?.length ? `品类禁止：${categoryRule.forbidden.join("、")}。` : "",
    UNIVERSAL_NEGATIVE_PROMPT,
    UNIVERSAL_QUALITY_PROMPT
  ].filter(Boolean);

  return parts.join("\n\n");
}
```

## 7. Demo

### 7.1 输入

```json
{
  "toolKey": "pod-partial-edit",
  "podPartialEditCategory": "手机壳",
  "podPartialEditRequirement": "替换“文字”和元素",
  "podPartialEditOutputCount": "2",
  "podPartialEditFieldValues": {
    "targetText": "LIMITED DROP",
    "elementDescription": "替换为极简闪电图标+细线边框",
    "referenceImage": "metal lightning icon style"
  }
}
```

### 7.2 输出（示例）

```text
任务目标：在保持商品主体结构、材质逻辑与商业可售性的前提下执行局部改图，仅修改用户指定区域，不做整图重绘。

模式规则：仅替换局部文案和装饰元素，主体商品、构图、材质、光影和印刷逻辑必须保持不变。

品类规则：手机壳类需保持壳体开孔、边框厚度、弧面透视和边缘包裹关系准确，不得改坏结构。

改图参数：品类=手机壳；改图要求=替换“文字”和元素；出图数量=2。

局部编辑结构化指令：{...}

字段扩展：目标文案需清晰可读且与原排版层级匹配。新增元素需与原风格一致并保持可印刷细节。若提供参考图，仅提取风格特征，不直接搬运版权内容。

模式必须满足：替换范围仅限用户指定局部区域、替换后文字可读且与主题一致、装饰元素与主体风格统一、输出可直接用于POD后续上版。

模式禁止：修改商品主体结构、出现乱码/错拼/不可读文案、新增侵权Logo/品牌标识、整图重绘导致原图语义丢失。

品类必须满足：保留摄像头孔位与按键开孔逻辑、保留壳体边缘厚度与弧度、保留壳体材质反光关系。

品类禁止：孔位错位、边框扭曲、壳体变形、结构比例异常。

通用负向约束：1. 严禁改变商品主体结构与核心售卖属性。2. 严禁输出脏边、锯齿、重影、文字糊化、低清晰度。3. 严禁新增水印、Logo、二维码、联系方式、侵权元素。4. 严禁虚构商品功能、附赠物和误导性表达。5. 严禁整图风格漂移导致与原SKU不一致。

通用质量要求：1. 局部边界干净、过渡自然、无明显修补痕迹。2. 主体材质、光影、透视与原图一致。3. 文案和元素层级清晰、可读、可印刷。4. 结果可直接进入POD后续链路（裂变/连续图/尺寸延展/上版）。5. 同批次结果风格与清晰度一致。
```

## 8. 裁剪与优先级规则

1. 不可裁剪：`required / forbidden / universalNegativePrompt / universalQualityPrompt`。
2. 可裁剪：`mode.prompt / category.prompt / valuePrompt`（按低优先级先裁）。
3. 多规则冲突时，优先级：`mode.forbidden > category.forbidden > mode.required > category.required > valuePrompt`。

## 9. 落地注意事项

1. 当前页面没有独立 supplement 字段，不要重复拼接同一段 `instructionText`。
2. 非自定义模式下，`instructionText` 是 JSON 字符串，建议服务端先 parse 再拼 prompt，避免把空字段原样输出。
3. 建议任务快照持久化：
   - `podPartialEditCategory`
   - `podPartialEditRequirement`
   - `podPartialEditFieldValues`
   - `podPartialEditInstructionText`
   - `podPartialEditOutputCount`
   - `finalPrompt`
