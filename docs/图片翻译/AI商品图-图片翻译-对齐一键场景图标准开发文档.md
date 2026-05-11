# AI商品图-图片翻译-对齐一键场景图标准开发文档

> 适用功能：`goods-translate`（图片翻译）  
> 标准来源：对齐 `goods-scene`（一键场景图）提示词与配置驱动标准  
> 更新时间：2026-05-09

## 1. 目标与交付范围

本方案用于指导“图片翻译”功能按“一键场景图”同标准落地：

1. 规则配置化：平台、品类、维度、方向全部走 JSON 配置。
2. 提示词工程化：内部选项提示词、最终提示词、负向约束、质量约束统一拼装。
3. 流程可开发：把业务流程、交互流程、积分消耗和失败兜底写清楚。

配套文件：

- [AI商品图-图片翻译-platform_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/图片翻译/AI商品图-图片翻译-platform_rules.json)
- [AI商品图-图片翻译-category_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/图片翻译/AI商品图-图片翻译-category_rules.json)
- [AI商品图-图片翻译-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/图片翻译/AI商品图-图片翻译-option_value_expansions.json)
- [AI商品图-图片翻译-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/图片翻译/AI商品图-图片翻译-prompt_builder_template.json)
- [AI商品图-图片翻译-prompt_builder_demo.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/图片翻译/AI商品图-图片翻译-prompt_builder_demo.json)

## 2. Source of Truth（真实字段与参数）

来源：`src/App.tsx`（页面配置）+ `src/data/tools.ts`（工具定义）+ 既有规则文件。

`goods-translate` 真实核心字段：

1. `toolKey`: `goods-translate`
2. `creationModeConfigKey`: `translate`
3. `sectionOrder`: `upload-main -> target-language -> creation-mode -> advanced-settings`
4. 高级字段：
- `targetLanguage`
- `platformInfo`
- `platformRuleDetail`

当前页面可选值：

- `targetLanguage`: 简体中文/英语/繁体中文/日语/韩语/西班牙语/俄语/法语/泰语/印尼语/阿拉伯语
- `platformInfo`: 无平台信息/全平台通用（16平台）/淘宝/天猫/京东/拼多多/1688/抖音电商/快手电商/小红书电商/亚马逊/Temu/TikTok Shop/阿里国际站/速卖通/Shopee/OZON/SHEIN

补充输入（建议作为上游识别字段注入）：

- `productCategory`：品类识别结果（映射到 category rules）
- `textDirection`：LTR / RTL（阿拉伯语建议回填 RTL）
- `languageTone`：简洁促转化 / 品牌克制 / 理性参数化

## 3. 业务使用流程（开发流程）

## 3.1 用户端流程

1. 上传主图（含可翻译文案区域）。
2. 选择目标语种。
3. 选择平台信息。
4. （可选）填写平台细节补充（如标题长度、术语偏好）。
5. 点击生成，查看翻译结果。
6. 如需二次生成，调整语种/平台/细节补充。

## 3.2 服务端编排流程

1. OCR/版面解析：识别可翻译文本块与层级关系。
2. 品类识别：产出 `productCategory`（失败则 `通用品类`）。
3. 规则读取：加载平台规则 + 品类规则 + 字段值扩展。
4. Prompt 拼接：按第 5 节固定顺序生成 `finalPrompt` + `finalNegativePrompt`。
5. 翻译绘制：生成替换后的多语图。
6. 结果校验：检查可读性、文本溢出、关键信息缺失。

## 3.3 交互与错误兜底

1. OCR失败：不中断，提示“可继续按通用规则生成”。
2. 品类识别失败：`productCategory=通用品类` 并标记 `needsUserConfirm=true`。
3. 平台规则缺失：降级到 `无平台信息`。
4. 目标语种缺失：默认 `英语`。

## 4. 积分与消耗（图片翻译）

参考现有积分规则文档，图片翻译建议按以下口径执行：

1. 高级模式：`1K=10` / `2K=15` / `4K=20`（积分/张）
2. 智能模式：`1K=20`（积分/张）
3. 中文增强：`+10`（有该能力时叠加）

计费公式（图片类通用）：

`总积分 = sourceCount * unitCreditCost * count`

补充：每次提交生成额外扣存储容量 `24MB`。

## 5. 最终提示词拼装规范（严格顺序）

与一键场景图对齐，必须按顺序拼接：

1. 任务目标段
2. 品类规则段（`productCategory -> categoryPrompt`）
3. 平台规则段（`platformPrompt`）
4. 参数段（字段值显式列出）
5. 选项值扩展段（`valuePrompt`）
6. `required` 约束段
7. `forbidden` 约束段
8. 通用负向段
9. 通用质量段
10. 平台细节补充段（可选）
11. 用户补充段（如后续开放）

硬约束：

- `required`/`forbidden`/通用负向/通用质量不得裁剪。
- 超长只裁剪：平台正文描述、valuePrompt 的低优先级描述。

## 6. 通用负向与质量要求（固定块）

## 6.1 通用负向

1. 严禁改动商品主体外观、结构、颜色和 SKU 含义。
2. 严禁新增原图不存在的价格、赠品、认证、功效承诺。
3. 严禁术语错译、单位错译、尺寸错配、货币错配。
4. 严禁破坏主次层级，不得遮挡主体与关键信息块。
5. 严禁违规导流、联系方式、二维码、侵权Logo。

## 6.2 通用质量要求

1. 语义准确：不漏译、不误译、术语统一。
2. 版式稳定：标题/卖点/价格/按钮层级保持一致。
3. 可读性优先：缩略图与详情图均清晰可读。
4. 商业可用：符合目标语种电商表达习惯。
5. 多处一致：重复词、单位、规格表达一致。

## 7. 规则配置说明（品类/维度/方向）

1. 品类规则：`category_rules.json`
- 按 `productCategory` 命中品类提示词。
- 未命中统一回退 `通用品类`。

2. 平台规则：`platform_rules.json`
- 按 `platformInfo` 命中平台规则。
- 含 `ruleLevel/prompt/required/forbidden`。

3. 维度与方向规则：`option_value_expansions.json`
- 维度：`targetLanguage/platformInfo/languageTone`。
- 方向：`textDirection`（LTR/RTL），用于版面方向和文字断行策略。

## 8. 开发拼接模板

模板见：

- [AI商品图-图片翻译-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/图片翻译/AI商品图-图片翻译-prompt_builder_template.json)

建议输出字段：

1. `finalPrompt`
2. `finalNegativePrompt`
3. `appliedRules`（平台/品类/维度命中详情）
4. `debugTrace`（每段拼装来源）

## 9. Demo（可直接联调）

Demo 文件：

- [AI商品图-图片翻译-prompt_builder_demo.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/图片翻译/AI商品图-图片翻译-prompt_builder_demo.json)

包含：

1. 输入参数（平台、品类、目标语种、方向、语气）
2. 命中规则
3. 最终 `finalPrompt`
4. 最终 `finalNegativePrompt`

## 10. 开发落地清单

1. 前端：补齐 `languageTone` 和（可选）`textDirection` UI 字段。
2. 后端：接入 `productCategory` 识别与回退逻辑。
3. 配置中心：将 4 个 JSON 作为可热更新配置源。
4. 日志：记录 `appliedRules + finalPromptHash + creditCost`。
5. 测试：覆盖 16 平台 x 11 语种 x 12 品类的采样回归。
