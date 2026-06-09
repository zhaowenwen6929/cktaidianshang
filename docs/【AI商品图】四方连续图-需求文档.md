# 【AI商品图】四方连续图-需求文档

## 使用流程
1. 选择连续类型（`patternRepeatType`）
2. 若为 `四方连续`，选择创作方式（`patternRepeatCreateMode`）
3. 按类型与创作方式上传素材或填写提示词
4. 若为 `四方连续 + 图生图`，选择生成模式（`patternRepeatGenerateMode`）
5. 选择出图比例（`patternRepeatRatio`，仅 `二方连续 / 扩大画幅` 生效）
6. 选择出图数量（`patternRepeatOutputCount`）
7. 生成

## 端到端使用流程
1. 用户先选择 `四方连续 / 二方连续 / 扩大画幅`。
2. 系统按类型切换输入方式与可见字段。
3. 系统校验素材、提示词、比例、密度和数量。
4. 系统按 `一级模式规则 + 二级增强规则 + 选项 valuePrompt + 通用负向/质量` 组装 prompt。
5. 输出可商用的连续印花结果，用于后续排版、延展和生产链路。

## 配套配置文件
+ [docs/四方连续图/AI商品图-四方连续图-mode_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/四方连续图/AI商品图-四方连续图-mode_rules.json)
+ [docs/四方连续图/AI商品图-四方连续图-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/四方连续图/AI商品图-四方连续图-option_value_expansions.json)
+ [docs/四方连续图/AI商品图-四方连续图-category_dimension_direction_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/四方连续图/AI商品图-四方连续图-category_dimension_direction_rules.json)
+ [docs/四方连续图/AI商品图-四方连续图-category_strategy_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/四方连续图/AI商品图-四方连续图-category_strategy_rules.json)
+ [docs/四方连续图/AI商品图-四方连续图-对齐一键场景图标准开发文档.md](/Users/zhaowenwen/CODEX/CKTAI电商/docs/四方连续图/AI商品图-四方连续图-对齐一键场景图标准开发文档.md)

## 真实功能与字段（Source of Truth）
代码来源：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

```json
{
  "toolKey": "video-pattern-repeat",
  "sectionOrder": ["video-pattern-repeat-setup"],
  "currentFields": {
    "patternRepeatType": ["四方连续", "二方连续", "扩大画幅"],
    "patternRepeatCreateMode": ["图生图", "文生图"],
    "patternRepeatGenerateMode": ["相似", "原图连续"],
    "patternRepeatRatio": ["自动检测比例", "1:1", "1:2", "2:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "18:23"],
    "patternRepeatDensityLevel": ["稀疏", "均衡", "密集"],
    "patternRepeatOutputCount": ["1", "2", "3", "4"],
    "patternRepeatPrompts": "仅四方连续+文生图使用"
  },
  "unitCreditCost": 5
}
```

补充业务事实：

+ 当前真实 UI 已支持 `扩大画幅`，不能按旧口径漏掉该分支
+ `四方连续` 固定按 `1:1` 处理
+ `二方连续 / 扩大画幅 / 四方连续+图生图` 必须上传素材
+ `四方连续 + 文生图` 至少一条有效提示词
+ `扩大画幅` 额外使用 `patternRepeatDensityLevel`

## 模式规则与选项提示词
完整内容以配套 JSON 为准，核心结构如下：

```json
{
  "modeRulesByType": {
    "四方连续": "含 createModes(图生图/文生图) 与 generateModes(相似/原图连续)",
    "二方连续": "含二方向连续规则",
    "扩大画幅": "本次需求要求按扩大画幅链路补齐 modeRule、density valuePrompt 与对应 builder 分支，不能沿用二方连续规则代替"
  }
}
```

## 品类差异配置方案
四方连续图是最需要补品类差异的功能之一。建议同时保留两层配置：
1. `category_dimension_direction_rules.json`：偏结构增强和方向推荐
2. `category_strategy_rules.json`：偏品类推荐类型、密度、比例和风险提醒

```json
{
  "categoryStrategyRules": {
    "recommendedTypes": "推荐连续类型",
    "recommendedDensity": "推荐元素密度",
    "recommendedRatios": "推荐比例",
    "warnings": "不合理组合提醒"
  }
}
```

开发要求：
1. `categoryPrompt` 插入在 `taskGoal` 后、`modeRule` 前。
2. 品类推荐只用于默认值回填和提示，不应覆盖用户手动选择。
3. 对 `挂钟 x 二方连续`、`手机壳 x 扩大画幅` 等高风险组合建议给 warning。

```json
{
  "optionValueExpansions": {
    "patternRepeatType": "每个类型均有 valuePrompt",
    "patternRepeatCreateMode": "四方连续创作方式 valuePrompt",
    "patternRepeatGenerateMode": "图生图生成模式 valuePrompt",
    "patternRepeatRatio": "每个比例均有 valuePrompt",
    "patternRepeatDensityLevel": "扩大画幅密度 valuePrompt"
  }
}
```

## Prompt 拼装顺序
1. `taskGoal`
2. `modeRule`
3. `parameterBlock`
4. `enhancementRule`
5. `valuePromptBlock`
6. `required`
7. `forbidden`
8. `universalNegativePrompt`
9. `universalQualityPrompt`
10. `promptItems`
11. `supplement`

## 完整 Prompt 模板
```text
任务目标：生成可商用的连续印花或扩幅图案，优先保证边界连续性、主题稳定性与后续生产可用性。

模式规则：{typePrompt} {createModePrompt} {generateModePrompt} {expandModePrompt}

生成参数：连续类型={patternRepeatType}；创作方式={patternRepeatCreateMode}；生成模式={patternRepeatGenerateMode}；比例={patternRepeatRatio}；元素密度={patternRepeatDensityLevel}；数量={patternRepeatOutputCount}。

增强规则：{categoryPrompt} {dimensionPrompt} {directionPrompt}

选项扩展：{typeValuePrompt} {createModeValuePrompt} {generateModeValuePrompt} {ratioValuePrompt} {densityValuePrompt}

必须满足：{requiredJoined}

禁止：{forbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

文生图输入：{promptItemsJoined}

补充说明：{supplement}
```

## 开发要求
1. `patternRepeatCreateMode` 仅在 `四方连续` 下生效。
2. `patternRepeatGenerateMode` 仅在 `四方连续 + 图生图` 下生效。
3. `patternRepeatPrompts` 只用于 `四方连续 + 文生图`，其 `reverseImage` 需要进入 `sourceUploads`。
4. `patternRepeatDensityLevel` 为 `扩大画幅` 必填字段。
5. 任务快照建议持久化：`patternRepeatType / patternRepeatCreateMode / patternRepeatGenerateMode / patternRepeatRatio / patternRepeatDensityLevel / patternRepeatOutputCount / patternRepeatPrompts / finalPrompt`。
