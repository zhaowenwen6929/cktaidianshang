# AI商品图-一键卖点图-对齐一键场景图标准开发文档

> 适用功能：`goods-sell`（一键卖点图）
> 目标：按“一键场景图标准”沉淀可直接开发的参数、规则配置、提示词拼装模板、流程与积分口径。
> 代码基线：`src/App.tsx`（当前仓库实现）

## 1. 功能范围与真实页面结构

- `toolKey`：`goods-sell`
- `creationModeConfigKey`：`spoke`
- `sectionOrder`：`["upload-main", "creation-mode", "advanced-settings", "supplement", "upload-reference"]`
- 上传区：
  - 商品图（`main`）：最多24张，必填
  - 参考图（`reference`）：最多1张，可选
- 高级字段：11项（见第2章）

## 2. 高级字段（真实实现）

来自 `toolModuleConfigs["goods-sell"].advancedSettings.extraSelects`：

- `productType` 产品类型
- `sceneType` 场景类型
- `copyLanguage` 文案语种
- `coreSellingPoint` 核心卖点
- `presentationForm` 表现形式
- `sellingPointFocus` 卖点重心
- `mainTitle` 主副标题
- `subtitle` 副标题
- `fontStyle` 字体风格
- `assistElement` 元素辅助
- `targetMarket` 目标市场

说明：`platformLabel` 不是该页高级字段，但在最终 prompt 拼装中仍建议作为必需业务入参。

## 3. 创作模式与积分（真实口径）

`goods-sell` 复用 `spoke`：

- 模式：`normal` / `advanced` / `cn-enhanced`
- 比例：`自适应尺寸, 1:1, 3:4, 4:5, 9:16, 2:3, 16:9, 4:3, 5:4, 3:2, 21:9`
- 数量：`1, 2`
- 分辨率（仅 advanced）：`1K, 2K, 4K`

积分单价：

- `normal`: 5分/张
- `cn-enhanced`: 10分/张
- `advanced`: `1K=10, 2K=15, 4K=20` 分/张

总积分：

- `generateCost = 上传主图数量 × 出图数量 × unitCreditCost`

说明：卖点图参考图不参与倍乘（仅作为可选风格参考）。

## 4. 业务流程与交互

1. 上传商品图（必填，最多24张）。
2. 选择创作模式（普通/高级/中文增强）及比例、分辨率、数量。
3. 配置高级设置（11字段，可手动或 AI Assist 回填）。
4. 补充说明（可选，可先 AI 润色）。
5. 上传参考图（可选，最多1张）。
6. 点击生成，校验主图必填。
7. 系统组装最终 prompt 并提交任务。
8. 扣除积分并进入任务中心。
9. 若排队中取消，按任务结果口径退回对应积分（现有任务取消逻辑）。

## 5. AI 辅助提示词（真实）

### 5.1 高级字段 AI Assist

```text
你是一位商品卖点图策划师。请根据商品图片，回填产品类型、场景类型、文案语种、核心卖点、表现形式、卖点重心、主副标题、副标题、字体风格、元素辅助、目标市场。必须让每个字段服务于“卖点表达”而不是泛化描述。
```

### 5.2 补充说明 AI 润色

```text
优化卖点图补充说明，强调核心卖点、信息层级、对比关系和画面说服力。
```

## 6. 对齐场景图标准后的配置文件

本目录提供4份可直接接入的配置：

1. `AI商品图-一键卖点图-mode_rules.json`
2. `AI商品图-一键卖点图-category_dimension_direction_rules.json`
3. `AI商品图-一键卖点图-option_value_expansions.json`
4. `AI商品图-一键卖点图-prompt_builder_template.json`

## 7. 统一拼装顺序（强约束）

1. `task_goal`
2. `category_rule`
3. `platform_rule_prompt`
4. `scene_slot_advice`
5. `dimension_rule`
6. `direction_rule`
7. `parameter_line`
8. `option_expansion_lines`
9. `required_rule`
10. `forbidden_rule`
11. `universal_negative`
12. `universal_quality`
13. `user_supplement`

说明：`required/forbidden/通用负向/通用质量/用途限制` 不可裁剪。

## 8. 字段与规则来源建议

- 页面字段：来自 `advanced-settings`。
- 品类：来自图片识别或外层商品中心（`productCategory`）。
- 平台：来自外层流程（`platformLabel`），页面未显式配置。
- 平台规则：建议沿用“场景图标准平台规则结构”中的 `prompt/required/forbidden/sceneSlotAdvice`。

## 9. 拼装模板（伪代码）

```ts
function buildGoodsSellPrompt(input) {
  const modeRule = modeRules[input.modeId];
  const categoryRule = categoryRules[input.productCategory] ?? categoryRules["通用品类"];
  const dimensionPrompt = dimensions[`sceneType::${input.sceneType}`] ?? "";
  const directionPrompt = directions[`sellingPointFocus::${input.sellingPointFocus}`] ?? "";

  const optionExpansionPrompts = buildValuePromptExpansions(input, optionValueExpansions);

  return [
    modeRule.taskGoal,
    `当前商品品类：${input.productCategory}。${categoryRule.prompt}`,
    `平台规则：${input.platformPrompt}`,
    `用途限制：${input.sceneSlotAdvice}`,
    dimensionPrompt,
    directionPrompt,
    `参数：产品类型=${input.productType}；场景类型=${input.sceneType}；文案语种=${input.copyLanguage}；核心卖点=${input.coreSellingPoint}；表现形式=${input.presentationForm}；卖点重心=${input.sellingPointFocus}；主副标题=${input.mainTitle}；副标题=${input.subtitle}；字体风格=${input.fontStyle}；元素辅助=${input.assistElement}；目标市场=${input.targetMarket}；出图比例=${input.ratio}；分辨率=${input.resolution ?? ""}；数量=${input.outputCount}`,
    optionExpansionPrompts,
    `必须满足：${modeRule.required.join("；")}`,
    `禁止：${modeRule.forbidden.join("；")}`,
    modeRule.universalNegativePrompt,
    modeRule.universalQualityPrompt,
    input.userSupplement?.trim() ? `补充要求：${input.userSupplement.trim()}` : ""
  ].filter(Boolean).join("\n\n");
}
```

## 10. Demo

### 10.1 输入

```json
{
  "toolKey": "goods-sell",
  "modeId": "advanced",
  "platformLabel": "TikTok Shop",
  "platformPrompt": "适配TikTok Shop内容电商语境，卖点图可承载卖点文案，但应与商品真实用途严格一致。",
  "sceneSlotAdvice": "本次输出定位为附图/卖点图位，不替代白底主图。",
  "productCategory": "家电数码类",
  "productType": "蓝牙耳机",
  "sceneType": "电商展台",
  "copyLanguage": "英文",
  "coreSellingPoint": "生成主卖点搭配2~3个辅卖点",
  "presentationForm": "产品居中展示卖点两侧分布",
  "sellingPointFocus": "性能表现",
  "mainTitle": "自动生成主标题",
  "subtitle": "自动生成副标题",
  "fontStyle": "科技风",
  "assistElement": "数据辅助",
  "targetMarket": "北美",
  "ratio": "4:5",
  "resolution": "2K",
  "outputCount": 2,
  "userSupplement": "强调降噪与续航，不要夸张粒子特效。"
}
```

### 10.2 输出（节选）

```text
生成高质量卖点图：在普通模式基础上强化版式秩序、材质细节、跨语言可读性与商业质感。

当前商品品类：家电数码类。强调功能逻辑、结构细节、接口按键与性能表达，避免纯情绪化空卖点。

平台规则：适配TikTok Shop内容电商语境，卖点图可承载卖点文案，但应与商品真实用途严格一致。

用途限制：本次输出定位为附图/卖点图位，不替代白底主图。

维度要求：展示商业陈列感，主体、卖点和导视关系清晰。

方向要求：突出性能指标趋势或体验提升，避免编造具体参数。

参数：产品类型=蓝牙耳机；场景类型=电商展台；文案语种=英文；核心卖点=生成主卖点搭配2~3个辅卖点；表现形式=产品居中展示卖点两侧分布；卖点重心=性能表现；主副标题=自动生成主标题；副标题=自动生成副标题；字体风格=科技风；元素辅助=数据辅助；目标市场=北美；出图比例=4:5；分辨率=2K；数量=2

必须满足：主标题与辅信息层级明确且可扫读；主体质感与卖点信息表达一致；图文关系稳定，不出现信息跳读；适配详情页与投放图位的商业可用性。

禁止：信息堆砌导致阅读路径混乱；数据/参数虚构；侵权logo、认证、专利暗示；明显AI伪影、边缘融化、字体失真。

通用负向约束：禁止虚假宣传、误导性效果对比、医疗化暗示、侵权元素、违规导流信息、主体结构变形、低清晰度与明显AI伪影。

通用质量要求：主体清晰；卖点真实；图文层级明确；构图稳定；字体可读；材质与结构可信；适配电商缩略图与详情页阅读场景。

补充要求：强调降噪与续航，不要夸张粒子特效。
```

## 11. 开发接入建议

1. 在 `goods-sell` 生成分支增加 `buildGoodsSellPrompt(...)`，不要直接仅传补充说明。
2. 将4份JSON作为可配置资源加载，按模板顺序组装。
3. `resolvedAdvancedSelections` 回写：
   - `goodsSellPrompt`
   - `goodsSellPromptSummary`
   - `productCategory`
   - `platformLabel`
4. 保持现有积分和交互逻辑不变。

## 12. 验收清单

1. 生成请求中包含完整拼装 prompt，而不是纯 `supplementValue`。
2. prompt 必含 `required/forbidden/通用负向/通用质量`。
3. 字段值扩展来自 `option_value_expansions` 的 `valuePrompt`。
4. 计费与当前前端口径一致（按主图数量×数量×单价）。
5. 页面交互顺序与现状一致（含可选参考图）。
