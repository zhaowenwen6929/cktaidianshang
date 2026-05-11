# AI商品图-服饰套图-对齐一键场景图标准开发文档

> 适用功能：`set-fashion`（服饰套图）  
> 目标：按“一键场景图（goods-scene）标准”输出可直接开发落地的参数规则、提示词拼接模板、demo 与业务流程说明。  
> 更新时间：2026-05-09

配套规则文件：
- [AI商品图-服饰套图-mode_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-mode_rules.json)
- [AI商品图-服饰套图-category_dimension_direction_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-category_dimension_direction_rules.json)
- [AI商品图-服饰套图-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-option_value_expansions.json)
- [AI商品图-服饰套图-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-prompt_builder_template.json)

## 1. 真实功能与参数（Source of Truth）

代码来源：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

1. `toolKey`: `set-fashion`
2. `creationModeConfigKey`: `default`（工具配置）
3. `sectionOrder`: `["upload-main", "baseline-model-setup"]`
4. 上传限制：`upload-main.maxCount = 5`
5. 上传提示：`最多5张，请上传同一件衣服不同视角图`
6. 生成流程：先“生成推荐场景”（step1），再“生成套图结果”（step2）

基准模特设置（baseline-model-setup）真实字段：
- `baselineModelSource`: `ai | mine`
- `selectedModelId` / `selectedModelName`（mine 时）
- `modelGenerateTypeKey`: 默认 `real-model`
- `modelGenerateType`: 默认 `真人模特图`
- `gender`: `男 | 女`
- `appearance`: `欧美白人 | 中国人 | 亚洲人 | 东南亚人 | 非裔 | 中东人 | 拉丁裔`
- `age`: `青少年 | 青年 | 中年 | 老年`
- `persona`: `上班族 | 测评博主 | 学生 | 健身人群 | 家庭主妇 | 其他`
- `bodyType`: `纤细 | 标准 | 微胖 | 大码`
- `baselineModelSupplement`: 细节补充（可选）

## 2. 业务流程与交互（开发口径）

### 2.1 用户流程

1. 上传服装图（1~5 张，同一件衣服多视角）
2. 配置基准模特
3. 点击“生成推荐场景”（step1）
4. 系统生成 `fashionSceneSummary + fashionSceneModules`（6个默认场景）
5. 用户可删除/拖拽/编辑场景模块
6. 点击“生成结果”（step2）
7. 系统将场景模块转换为 `setPackSelectedTypes` 后提交生成

### 2.2 阻断与校验

- 未上传服装图：阻断，提示“请先上传服装图片”
- `baselineModelSource=mine` 且无 `selectedModelId`：阻断
- `baselineModelSource=ai` 且缺失 `gender/appearance/age/persona/bodyType` 任一：阻断
- step1 后若左侧参数变更导致签名变化：step2 阻断并提示“第1步信息已变更，请重新生成推荐场景”

### 2.3 结果数量与积分

- 结果数量：`outputCount = sceneTypes.length`（默认 6）
- 单价来自 `set-pack` 模式：
1. 普通：5 积分/张
2. 高级：1K=10，2K=15，4K=20
3. 中文增强：15 积分/张
- 总积分：`generateCost = outputCount * unitCreditCost`
- 固定容量扣减：每次提交生成扣 `24MB`

## 3. 对齐一键场景图标准的规则分层

服饰套图按以下层级组装提示词：

1. 模式规则：`modeRules[baselineModelSource]`
2. 品类规则：`categoryRules[productCategory]`
3. 维度/方向规则：`dimensionRules[ratio] + directionRules[direction]`
4. 字段值扩展：`optionValueExpansions[field].values[value].valuePrompt`
5. 硬约束：`required / forbidden`
6. 通用段：`universalNegativePrompt + universalQualityPrompt`

说明：`set-fashion` 当前前端未暴露“品类/方向”显式控件，建议服务端由识别链路补齐后参与组装；缺失时走 `通用品类 + 正面`。

## 4. 最终提示词拼装顺序（严格）

按场景图标准固定顺序：

1. 任务目标
2. 模式规则正文
3. 品类规则正文
4. 参数段
5. 维度与方向段
6. 字段值扩展段
7. `required` 段
8. `forbidden` 段
9. 通用负向段
10. 通用质量段
11. 补充说明段

## 5. 使用字段与来源

| 字段 | 来源 | 必填 | 用途 |
|---|---|---|---|
| `baselineModelSource` | baseline-model-setup | 是 | 模式规则命中 |
| `modelGenerateType` | baseline-model-setup | 是（ai） | valuePrompt扩展 |
| `gender/appearance/age/persona/bodyType` | baseline-model-setup | 是（ai） | 参数段 + valuePrompt |
| `selectedModelId` | 我的模特 | 是（mine） | 模式校验 |
| `baselineModelSupplement` | 细节补充 | 否 | 补充说明段 |
| `ratio/resolution/count` | creation-mode(set-pack) | 是（step2） | 参数段 + 维度规则 |
| `productCategory` | 识别链路 | 建议 | 品类规则命中 |
| `direction` | 识别/回填 | 否 | 方向规则命中 |

## 6. 拼装模板（可直接开发）

模板来源：[AI商品图-服饰套图-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-prompt_builder_template.json)

```text
任务目标：基于上传服装图生成服饰套图，突出版型、面料、上身效果与真实场景转化表达。

模式规则：{modePrompt}

品类规则：{categoryPrompt}

参数：模特来源={baselineModelSourceLabel}；模特类型={modelGenerateType}；性别={gender}；年龄={age}；外貌={appearance}；人设={persona}；体型={bodyType}；比例={ratio}；分辨率={resolution}；套图数量={count}。

维度与方向：{dimensionPrompt} {directionPrompt}

字段扩展：{valueExpansionJoined}

必须满足：{requiredJoined}

禁止：{forbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

补充说明：{supplementText}
```

## 7. 通用负向与质量要求（统一固定段）

- 通用负向：禁止结构变形、人体异常、侵权/水印、喧宾夺主、低质伪影
- 通用质量：主体清晰、物理可信、多图一致、图位可用、SKU一致

已写入模板 JSON，建议作为不可裁剪段。

## 8. 优先级与裁剪规则

1. 不可裁剪：`required`、`forbidden`、`universalNegativePrompt`、`universalQualityPrompt`
2. 可裁剪：`valueExpansionPrompt`、`categoryPrompt`、`modePrompt`
3. 冲突优先级：`forbidden > required > valueExpansion > category > mode`

## 9. Demo（输入 -> 输出）

详见：
- [AI商品图-服饰套图-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-prompt_builder_template.json) 中 `demo.input`
- 同文件 `demo.outputPrompt`

## 10. 开发落地建议

1. `step1` 产物 `fashionSceneSummary/fashionSceneModules` 建议原样持久化任务快照。
2. `step2` 提交前统一走本文拼装器，输出 `finalPrompt` 并写入快照，便于追溯。
3. 若后续新增“市场/语种/平台”控件，可直接在“参数段”和“valueExpansion段”扩展，不改主顺序。
4. 若新增服饰细分品类，仅需补 `categoryRules.aliases`，不要再维护单独映射表。

