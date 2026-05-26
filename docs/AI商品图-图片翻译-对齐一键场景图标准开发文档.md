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
- `textDirection`：内部推断字段，用于控制 RTL/LTR 阅读方向
- `languageTone`：内部推断字段，用于控制“简洁促转化 / 品牌克制 / 理性参数化”风格

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

### 2.4 内部推断字段（非页面显式输入）

- `textDirection`
  - 来源：多模态大模型根据图片中的文字内容、文字方向、按钮/价格区位置和语种线索综合判断
  - 用法：仅在 `useTextDirectionInPrompt=true` 时拼入最终 prompt
- `languageTone`
  - 来源：多模态大模型根据 `platformInfo + productCategory + targetLanguage + 图片文案组织方式` 综合判断
  - 用法：仅在 `useLanguageToneInPrompt=true` 时拼入最终 prompt

## 3. 最终提示词拼装顺序（严格）

与一键场景图同标准，固定顺序：

1. 任务目标段
2. 品类规则段（由 `productCategory` 命中）
3. 平台规则正文段（`platformRule.prompt`）
4. 参数段（`field=value`）
5. 高级选项扩展段（`targetLanguageValuePrompt + platformInfoValuePrompt`）
6. 内部推断扩展段（`languageTonePromptBlock + textDirectionPromptBlock`，可选）
7. 平台 `required` 段
8. 平台 `forbidden` 段
9. 通用负向约束段（固定）
10. 通用质量要求段（固定）
11. 平台细节补充段（`platformRuleDetail`，可选）
12. 用户补充说明段（如有，翻译功能默认可不开放 supplement）

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

高级选项扩展约束：
[目标语种] {targetLanguageValuePrompt}
[平台信息] {platformInfoValuePrompt}

内部推断扩展约束：
{languageTonePromptBlock}
{textDirectionPromptBlock}

必须满足：{platformRequiredJoined}

禁止：{platformForbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

平台细节补充：{platformRuleDetail}
```

## 6. 拼装规则（后端/中台）

1. 先确定平台、品类与目标语种：
- 平台来源优先级：`platformInfo`（高级设置） > `无平台信息`。
- 品类来源优先级：`productCategory`（图片识别/上游注入） > `通用品类`。
- 语种来源：`targetLanguage`（目标语种区块） > 默认 `英语`。
2. 读取平台规则：`platformRulesByTool[platformInfo]`，拼接 `prompt + required + forbidden`。
3. 读取品类规则：`categoryRulesByTool[productCategory]`，约束术语准确性、信息重点和版式保护边界。
4. 读取高级选项扩展：按 `targetLanguage / platformInfo` 命中值追加 `valuePrompt`，用于约束语言风格、句长和电商表达习惯。
5. 读取内部推断扩展：由多模态大模型直接输出 `languageTone / textDirection`，按需追加到最终 prompt。
5. 图片翻译字段分层必须固定：
- `productCategory` 决定专业术语和信息块优先级。
- `platformInfo` 决定翻译后的语境是否合法、标签是否克制、阅读路径是否适配平台。
- `targetLanguage` 决定译文风格、句式长度和本地化程度。
- `languageTone` 决定译文偏“促转化 / 克制 / 参数化”哪种表达语气。
- `textDirection` 决定文本块按 `LTR / RTL` 哪种方向组织。
- `platformRuleDetail` 是人工补充的低层约束，只能细化，不能覆盖平台硬规则。
6. 约束优先级必须固定：`platform forbidden` > `platform required` > `category prompt` > `targetLanguagePrompt` > `platformInfoValuePrompt` > `languageTonePromptBlock` > `textDirectionPromptBlock` > `platformRuleDetail`。
7. 翻译任务严禁改动商品主体外观、价格事实、规格数值和促销含义；允许变的是图中文字，不允许借翻译之名改图意。
8. `platformRuleDetail` 仅在 `platformInfo` 存在时拼接；若为自定义平台补充，只能补充标题长度、活动标签数量、货币展示等细节，不得引入与平台硬规则冲突的要求。
9. 当前页面无 `supplement` 区块，默认不拼用户补充说明；若未来接入 supplement，应排在 `platformRuleDetail` 之后且优先级最低。
10. 安全兜底：最终串必须包含“翻译准确、版式稳定、可读性优先、不得误译漏译、不得遮挡主体”的语义。

### 6.1 字段与规则源映射（必须按此读取）

| 拼装变量 | 来源字段 | 规则文件/章节 | 说明 |
| --- | --- | --- | --- |
| `platformInfo` | `advanced-settings.platformInfo` | `AI商品图-图片翻译-platform_rules.json` | 平台硬约束来源 |
| `productCategory` | 图片识别或上游注入 | `AI商品图-图片翻译-category_rules.json` | 当前页面无显式输入控件 |
| `targetLanguagePrompt` / `platformInfoValuePrompt` | 目标语种、平台信息命中值 | 本文第 2.3 章 `goodsTranslateOptionValueExpansions` | 用于风格化和本地化补充 |
| `languageTonePromptBlock` / `textDirectionPromptBlock` | 多模态大模型内部推断结果 | 本文第 2.4 章 | 仅在 `use*InPrompt=true` 时拼接 |
| `platformRuleDetail` | 条件展示的“细节补充”字段 | 无 | 人工补充平台细则 |

## 7. 拼装 Demo（输入 + 输出）

### 7.1 Demo 输入

```json
{
  "toolKey": "goods-translate",
  "targetLanguage": "英语",
  "platformInfo": "TikTok Shop",
  "platformRuleDetail": "标题控制在8词以内；价格信息保持与原图一致；活动标签最多1个。",
  "productCategory": "家电数码类",
  "internalHints": {
    "languageTone": "简洁促转化",
    "textDirection": "LTR",
    "useLanguageToneInPrompt": true,
    "useTextDirectionInPrompt": false
  }
}
```

### 7.2 Demo 输出（最终提示词）

```text
任务目标：对图片内文案进行翻译替换，保持原图版式层级与阅读路径稳定。

品类约束：当前商品品类为「家电数码类」，翻译时优先保证参数、接口、功率、兼容性等术语准确一致。

平台规则：适配TikTok Shop内容电商语境，翻译文本应便于快速扫读并符合合规表达。 必须满足：快速扫读、避免误导承诺。 禁止：夸大性口号、遮挡商品主体。

翻译参数：目标语种=英语；平台信息=TikTok Shop。

高级选项扩展约束：
[目标语种] 输出自然英文电商表达，短句优先，避免中式直译和冗长从句。
[平台信息] 平台语境偏内容电商，译文要利于停留和快读，但不能为了吸睛牺牲真实性。

内部推断扩展约束：
[语言风格] 采用简洁促转化表达，短句优先，重点前置，适配内容电商快读场景。

通用负向约束：
1. 严禁改动商品主体外观、结构、颜色和SKU含义，翻译任务仅处理文案层。
2. 严禁新增原图不存在的价格、促销、赠品、认证或功效承诺信息。
3. 严禁出现乱码、错别字、术语错译、单位错译、尺寸数值错配。
4. 严禁破坏原版式主次关系：不得遮挡主体、不得丢失关键信息块、不得造成阅读断层。
5. 严禁生成违规导流信息、联系方式、二维码、侵权Logo或平台禁用标识。

通用质量要求：
1. 翻译准确：语义与原文一致，术语统一，关键信息不漏译不误译。
2. 版式稳定：尽量保持原图字号层级、对齐关系、留白节奏和视觉重心。
3. 可读性优先：标题、价格、卖点、按钮等关键文本在缩略图和详情图中都清晰可读。
4. 商业可用：语言自然、符合目标语种电商表达习惯，不生硬机器翻译。
5. 一致性：同图多处重复词保持统一译法，单位、货币、规格表达一致。

平台细节补充：标题控制在8词以内；价格信息保持与原图一致；活动标签最多1个。
```

### 7.3 Demo 说明（规则如何生效）

1. `platformInfo=TikTok Shop` 先命中平台规则，控制文案节奏、标签数量和内容电商语境。
2. `productCategory=家电数码类` 锁定参数类术语不能乱译，例如功率、兼容性、接口名词必须统一。
3. `targetLanguage=英语` 负责把译文从“逐字翻译”提升到“可直接上架的英文电商表达”。
4. 多模态大模型额外推断 `languageTone=简洁促转化`，用于把译文语气收敛到更适合内容电商快读的表达。
5. `platformRuleDetail` 只补充标题长度、价格保持、活动标签数量等细则，不能反向要求新增促销或修改商品信息。

## 8. 落地注意事项

1. `required/forbidden`、通用负向、通用质量属于硬约束，不参与长度裁剪。
2. 文本超长时，仅裁剪 `platformRule.prompt`、高级选项扩展描述、内部推断扩展描述，不裁剪硬约束段。
3. 若后续开启 `goods-translate` AI Assist，建议回填：`platformInfo + productCategory`，不回填 `targetLanguage`。
4. 建议在任务快照中额外落库：`productCategory`、`internalHints`、`goodsTranslatePrompt`，便于排查与复现。

## 9. 图片识别获取信息（统一走多模态大模型）

建议由同一个多模态大模型统一输出以下结果：

- `productCategory`
- `platformInfo`
- `internalHints.textDirection`
- `internalHints.languageTone`
- `layoutHints`

识别要求：

1. 直接基于图片中的文字内容、字形、版式结构、价格区/按钮区位置、参数密度和营销氛围综合判断。
2. `textDirection` 不能只看目标语种硬猜，应优先依据图片中的实际文字排布。
3. `languageTone` 不能只看单个卖点词，必须结合平台语境、品类表达方式和信息组织方式判断。
4. 若判断依据不足，允许输出最保守值，并通过 `useLanguageToneInPrompt/useTextDirectionInPrompt=false` 降低该字段权重。
