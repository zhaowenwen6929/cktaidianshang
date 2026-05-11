# AI商品图-图片翻译-对齐一键场景图标准开发文档

> 适用功能：`goods-translate`（图片翻译）  
> 目标：按 `goods-scene`（一键场景图）同标准完善提示词与规则配置，开发可直接落地。  
> 更新时间：2026-05-09  
> 配套规则文件：  
> - [AI商品图-图片翻译-platform_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI商品图-图片翻译-platform_rules.json)  
> - [AI商品图-图片翻译-category_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI商品图-图片翻译-category_rules.json)

## 1. 真实功能与字段（Source of Truth）

代码来源：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

1. `toolKey`: `goods-translate`
2. `creationModeConfigKey`: `translate`
3. `sectionOrder`: `["upload-main","target-language","creation-mode","advanced-settings"]`
4. 高级字段：
- `targetLanguage`（目标语种，target-language 区块）
- `platformInfo`（平台信息）
- `platformRuleDetail`（细节补充，`platformInfo` 有值时显示）
5. 当前 `goods-translate` 的 `advancedSettings.showAiAssist = false`（默认无 AI 回填按钮）

真实选项：

```json
{
  "targetLanguageOptions": ["简体中文", "英语", "繁体中文", "日语", "韩语", "西班牙语", "俄语", "法语", "泰语", "印尼语", "阿拉伯语"],
  "platformInfoOptions": ["无平台信息", "全平台通用（16平台）", "淘宝", "天猫", "京东", "拼多多", "1688", "抖音电商", "快手电商", "小红书电商", "亚马逊", "Temu", "TikTok Shop", "阿里国际站", "速卖通", "Shopee", "OZON", "SHEIN"]
}
```

## 2. 对齐场景图标准的规则输入

### 2.1 平台规则

- 来源：`platform_rules.json -> platformRulesByTool[platformInfo]`
- 字段：`ruleLevel/prompt/required/forbidden`
- 用法：平台硬约束 + 语境约束，不是普通可选描述

### 2.2 品类规则

- 来源：`category_rules.json -> categoryRulesByTool[productCategory]`
- 说明：图片翻译页面当前无显式 `productCategory` 字段，建议从上传图识别得到。
- 兜底：识别不到则 `productCategory="通用品类"`。

### 2.3 字段值扩展（valuePrompt）

建议维护 `goodsTranslateOptionValueExpansions`（与场景图一致）：

- `targetLanguage`：语种风格、术语口径、长度控制
- `platformInfo`：平台语境补充（非替代平台硬规则）

示例：

```json
{
  "targetLanguage": {
    "fieldKey": "targetLanguage",
    "values": {
      "英语": { "valuePrompt": "输出自然英文电商表达，短句优先，避免中式直译和冗长从句。" },
      "日语": { "valuePrompt": "输出自然日语表达，保持礼貌且简洁，版面密度适中。" },
      "阿拉伯语": { "valuePrompt": "输出自然阿拉伯语表达，注意排版可读性和层级稳定。" }
    }
  }
}
```

## 3. 最终提示词拼装顺序（严格）

与一键场景图同标准，固定顺序：

1. 任务目标段
2. 品类规则段（由 `productCategory` 命中）
3. 平台规则正文段（`platformRule.prompt`）
4. 参数段（`field=value`）
5. 字段值扩展段（`valuePrompt`）
6. 平台 `required` 段
7. 平台 `forbidden` 段
8. 通用负向约束段（固定）
9. 通用质量要求段（固定）
10. 平台细节补充段（`platformRuleDetail`，可选）
11. 用户补充说明段（如有，翻译功能默认可不开放 supplement）

## 4. 通用负向与质量（固定模板）

### 4.1 通用负向约束

```text
通用负向约束：
1. 严禁改动商品主体外观、结构、颜色和SKU含义，翻译任务仅处理文案层。
2. 严禁新增原图不存在的价格、促销、赠品、认证或功效承诺信息。
3. 严禁出现乱码、错别字、术语错译、单位错译、尺寸数值错配。
4. 严禁破坏原版式主次关系：不得遮挡主体、不得丢失关键信息块、不得造成阅读断层。
5. 严禁生成违规导流信息、联系方式、二维码、侵权Logo或平台禁用标识。
```

### 4.2 通用质量要求

```text
通用质量要求：
1. 翻译准确：语义与原文一致，术语统一，关键信息不漏译不误译。
2. 版式稳定：尽量保持原图字号层级、对齐关系、留白节奏和视觉重心。
3. 可读性优先：标题、价格、卖点、按钮等关键文本在缩略图和详情图中都清晰可读。
4. 商业可用：语言自然、符合目标语种电商表达习惯，不生硬机器翻译。
5. 一致性：同图多处重复词保持统一译法，单位、货币、规格表达一致。
```

## 5. 拼接模板（开发可直接用）

```text
任务目标：对图片内文案进行翻译替换，保持原图版式层级与阅读路径稳定。

当前商品品类为「{productCategory}」，{categoryPrompt}

平台规则：{platformPrompt}

翻译参数：目标语种={targetLanguage}；平台信息={platformInfo}。

字段扩展：{targetLanguageValuePrompt} {platformInfoValuePrompt}

必须满足：{platformRequiredJoined}

禁止：{platformForbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

平台细节补充：{platformRuleDetail}
```

## 6. 组装伪代码（与场景图同风格）

```ts
function buildGoodsTranslatePromptAssembly(input: {
  targetLanguage?: string;
  platformInfo?: string;
  platformRuleDetail?: string;
  productCategory?: string;
}) {
  const productCategory = input.productCategory || "通用品类";
  const platformInfo = input.platformInfo || "无平台信息";
  const targetLanguage = input.targetLanguage || "英语";

  const categoryRule = categoryRulesByTool[productCategory] ?? categoryRulesByTool["通用品类"];
  const platformRule = platformRulesByTool[platformInfo] ?? platformRulesByTool["无平台信息"];

  const parts = [
    "任务目标：对图片内文案进行翻译替换，保持原图版式层级与阅读路径稳定。",
    `当前商品品类为「${productCategory}」，${categoryRule.prompt}`,
    `平台规则：${platformRule.prompt}`,
    `翻译参数：目标语种=${targetLanguage}；平台信息=${platformInfo}。`,
    buildValuePrompts(targetLanguage, platformInfo),
    platformRule.required?.length ? `必须满足：${platformRule.required.join("、")}。` : "",
    platformRule.forbidden?.length ? `禁止：${platformRule.forbidden.join("、")}。` : "",
    UNIVERSAL_NEGATIVE_PROMPT,
    UNIVERSAL_QUALITY_PROMPT,
    input.platformRuleDetail?.trim() ? `平台细节补充：${input.platformRuleDetail.trim()}` : ""
  ].filter(Boolean);

  return parts.join("\n\n");
}
```

## 7. Demo

### 7.1 输入

```json
{
  "toolKey": "goods-translate",
  "targetLanguage": "英语",
  "platformInfo": "TikTok Shop",
  "platformRuleDetail": "标题控制在8词以内；价格信息保持与原图一致；活动标签最多1个。",
  "productCategory": "家电数码类"
}
```

### 7.2 输出（节选）

```text
任务目标：对图片内文案进行翻译替换，保持原图版式层级与阅读路径稳定。

当前商品品类为「家电数码类」，翻译时优先保证参数、接口、功率、兼容性等术语准确一致。

平台规则：适配TikTok Shop内容电商语境，翻译文本应便于快速扫读并符合合规表达。

翻译参数：目标语种=英语；平台信息=TikTok Shop。

必须满足：快速扫读、避免误导承诺。

禁止：夸大性口号、遮挡商品主体。

通用负向约束：严禁改动商品主体外观...（省略）

通用质量要求：翻译准确、版式稳定、可读性优先...（省略）

平台细节补充：标题控制在8词以内；价格信息保持与原图一致；活动标签最多1个。
```

## 8. 落地注意事项

1. `required/forbidden`、通用负向、通用质量属于硬约束，不参与长度裁剪。
2. 文本超长时，仅裁剪 `platformRule.prompt` 和字段扩展描述，不裁剪硬约束段。
3. 若后续开启 `goods-translate` AI Assist，建议回填：`platformInfo + productCategory`，不回填 `targetLanguage`。
4. 建议在任务快照中额外落库：`productCategory`、`goodsTranslatePrompt`，便于排查与复现。
