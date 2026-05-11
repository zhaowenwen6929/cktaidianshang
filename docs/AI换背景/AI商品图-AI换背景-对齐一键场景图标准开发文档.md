# AI商品图-AI换背景-对齐一键场景图标准开发文档

> 适用功能：`goods-bg`（AI换背景）  
> 目标：基于真实参数与业务流程，按“一键场景图”标准输出可直接开发落地的提示词与规则配置。  
> 更新时间：2026-05-09  
> 配套规则文件：  
> - [AI商品图-AI换背景-platform_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI换背景/AI商品图-AI换背景-platform_rules.json)  
> - [AI商品图-AI换背景-category_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI换背景/AI商品图-AI换背景-category_rules.json)  
> - [AI商品图-AI换背景-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI换背景/AI商品图-AI换背景-option_value_expansions.json)  
> - [AI商品图-AI换背景-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI换背景/AI商品图-AI换背景-prompt_builder_template.json)

## 1. 真实功能与字段（Source of Truth）

代码来源：[src/App.tsx](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

1. `toolKey`: `goods-bg`
2. `creationModeConfigKey`: `background`
3. `sectionOrder`: `["upload-main", "creation-mode", "advanced-settings", "supplement"]`
4. `uploads.main.maxCount`: `24`
5. 高级设置字段（页面真实暴露）：
- `backgroundType`：`电商白底 / 实景室内 / 室外场景 / 商业广告风`
- `lightingStyle`：`写实自然光 / 柔光棚拍风 / 日系清新光 / 高级杂志风 / 人造光氛围`
6. AI Assist（真实）：仅回填 `backgroundType` + `lightingStyle`
7. 补充说明 AI 润色（真实）：`goods-bg` 已配置

## 2. 业务使用流程与交互

1. 上传商品图（最多 24 张）。
2. 选择创作模式（普通/高级/文本增强）+ 比例 + 分辨率（高级模式）+ 生成数量。
3. 配置高级设置（背景类型、风格与光影），可用 AI Assist 快速回填。
4. 填写补充说明（可选），可用 AI 润色增强可执行性。
5. 系统拼装最终提示词并提交生成。
6. 返回结果后支持改配置重生。

## 3. 积分消耗规则（开发口径）

来源：`creationModeConfigs.background`

1. 普通模式：`baseUnitCreditCost=5`
2. 高级模式：按分辨率计费
- `1K=10`
- `2K=15`
- `4K=20`
3. 文本增强：`baseUnitCreditCost=10`
4. 计算规则：`总积分 = 有效上传张数 × 单张积分 × 生图数量`

## 4. 对齐一键场景图的规则输入

虽然页面未显式暴露 `platformLabel`、`productCategory`，但换背景最终可用性依赖这两个上下文，建议由上游/服务端注入：

1. 平台规则：`platform_rules.json -> platformRulesByTool[platformLabel]`
2. 品类规则：`category_rules.json -> categoryRulesByTool[productCategory]`
3. 字段值扩展：`option_value_expansions.json -> backgroundType / lightingStyle`
4. 固定硬约束：通用负向 + 通用质量

## 5. 最终提示词拼装顺序（严格）

1. 任务目标段
2. 品类规则段（`categoryRule.prompt`）
3. 平台规则正文段（`platformRule.prompt`）
4. 参数段（`backgroundType`、`lightingStyle`）
5. 字段值扩展段（`valuePrompt`）
6. 平台 `required` 段
7. 平台 `forbidden` 段
8. 通用负向约束段（固定）
9. 通用质量要求段（固定）
10. 平台细节补充段（可选）
11. 用户补充说明段（可选）

## 6. 通用负向与质量（固定）

### 6.1 通用负向约束

```text
通用负向约束：
1. 严禁改变商品主体结构、颜色、材质、文字信息和SKU语义。
2. 严禁新增不存在的商品、配件、Logo、水印、边框、价格贴和营销字。
3. 严禁出现抠图毛边、吞边、漂浮、错位、断层、穿帮、镜像错误。
4. 严禁背景抢占主体，严禁不真实夸张特效主导画面。
5. 严禁输出违规、误导、侵权元素。
```

### 6.2 通用质量要求

```text
通用质量要求：
1. 主体保真：轮廓、比例、材质、纹理与原商品一致。
2. 融合真实：背景与主体在光向、色温、阴影、反射、透视上保持一致。
3. 画面可用：主体完整清晰，缩略图与详情图场景下都可稳定识别。
4. 商业完成度：构图干净，背景语义服务商品展示，不喧宾夺主。
5. 电商可投放：结果可直接用于主图/附图链路（按平台规则区分）。
```

## 7. 拼接模板（开发可直接用）

```text
任务目标：基于上传商品图在保持商品主体真实不变前提下，生成可用于电商展示的换背景图片。

当前商品品类为「{productCategory}」，{categoryPrompt}

平台规则：{platformPrompt}

换背景参数：背景类型={backgroundType}；风格与光影={lightingStyle}。

字段扩展：{backgroundTypeValuePrompt} {lightingStyleValuePrompt}

必须满足：{platformRequiredJoined}

禁止：{platformForbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

平台细节补充：{platformRuleDetail}

补充说明：{supplementText}
```

## 8. 组装伪代码

```ts
function buildGoodsBgPrompt(input: {
  platformLabel?: string;
  productCategory?: string;
  backgroundType?: string;
  lightingStyle?: string;
  platformRuleDetail?: string;
  supplementText?: string;
}) {
  const platformLabel = input.platformLabel || "全平台通用（16平台）";
  const productCategory = input.productCategory || "通用品类";
  const backgroundType = input.backgroundType || "电商白底";
  const lightingStyle = input.lightingStyle || "写实自然光";

  const platformRule = platformRulesByTool[platformLabel] ?? platformRulesByTool["全平台通用（16平台）"];
  const categoryRule = categoryRulesByTool[productCategory] ?? categoryRulesByTool["通用品类"];

  const bgPrompt = optionValueExpansions.backgroundType.values[backgroundType]?.valuePrompt ?? "";
  const lightPrompt = optionValueExpansions.lightingStyle.values[lightingStyle]?.valuePrompt ?? "";

  return [
    "任务目标：基于上传商品图在保持商品主体真实不变前提下，生成可用于电商展示的换背景图片。",
    `当前商品品类为「${productCategory}」，${categoryRule.prompt}`,
    `平台规则：${platformRule.prompt}`,
    `换背景参数：背景类型=${backgroundType}；风格与光影=${lightingStyle}。`,
    `字段扩展：${bgPrompt} ${lightPrompt}`.trim(),
    platformRule.required?.length ? `必须满足：${platformRule.required.join("、")}。` : "",
    platformRule.forbidden?.length ? `禁止：${platformRule.forbidden.join("、")}。` : "",
    UNIVERSAL_NEGATIVE_PROMPT,
    UNIVERSAL_QUALITY_PROMPT,
    input.platformRuleDetail?.trim() ? `平台细节补充：${input.platformRuleDetail.trim()}` : "",
    input.supplementText?.trim() ? `补充说明：${input.supplementText.trim()}` : ""
  ].filter(Boolean).join("\n\n");
}
```

## 9. Demo

### 9.1 输入

```json
{
  "toolKey": "goods-bg",
  "platformLabel": "亚马逊",
  "productCategory": "家电数码类",
  "backgroundType": "电商白底",
  "lightingStyle": "柔光棚拍风",
  "platformRuleDetail": "主图禁止任何促销贴片与附加图形。",
  "supplementText": "黑色机身边缘要清晰，轻微接触阴影即可。"
}
```

### 9.2 输出（节选）

```text
任务目标：基于上传商品图在保持商品主体真实不变前提下，生成可用于电商展示的换背景图片。

当前商品品类为「家电数码类」，请保留接口、按键、屏幕、线材、开孔和装配缝等关键结构，黑色或深色产品边缘必须清晰可辨。

平台规则：若作为 Amazon 主图，必须纯白背景（RGB 255,255,255），仅展示实际售卖商品，不添加文字、Logo、水印、边框与非售卖配件。

换背景参数：背景类型=电商白底；风格与光影=柔光棚拍风。

字段扩展：输出纯白或极干净中性白背景... 采用均匀柔和的棚拍光线...

必须满足：主图白底合规、主体完整、商品真实可售。

禁止：文字覆盖、夸张特效、非售卖元素。

通用负向约束：...

通用质量要求：...

平台细节补充：主图禁止任何促销贴片与附加图形。

补充说明：黑色机身边缘要清晰，轻微接触阴影即可。
```

## 10. 落地注意事项

1. `required/forbidden/通用负向/通用质量` 为硬约束，不参与裁剪。
2. 超长时仅裁剪：`platformRule.prompt` 与 `valuePrompt`，不裁剪硬约束段。
3. `platformLabel`、`productCategory` 当前非 `goods-bg` 页面显式字段，需由上游或服务端注入。
4. 建议任务快照持久化：`platformLabel/productCategory/backgroundType/lightingStyle/finalPrompt/modeId/ratio/resolution/count/generateCost`。
