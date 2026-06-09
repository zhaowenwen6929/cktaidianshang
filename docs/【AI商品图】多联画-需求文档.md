# 【AI商品图】多联画-需求文档

## 使用流程
1. 上传素材图（`upload-main`）
2. 选择变化维度（`videoSceneGridMode`）
3. 选择变化方向（`videoSceneGridVariation`）
4. 确认详细维度（`videoSceneGridDetailDimensions`，由前端联动生成）
5. 选择出图比例（`videoSceneGridRatio`）
6. 选择生图数量（`videoSceneGridOutputCount`）
7. 生成

## 端到端使用流程
1. 用户上传素材图。
2. 系统展示 `系列图案 / 主副图案 / 情侣图案` 三类变化维度。
3. 系统根据当前维度切换可选变化方向，并自动生成 `详细维度`。
4. 用户选择比例和生图数量。
5. 系统按 `模式规则 + 变化方向扩展 + 比例扩展 + 详细维度扩展 + 通用负向 + 通用质量` 组装 prompt。
6. 输出可成组使用、组内一致但差异清晰的多联画结果。

## 配套配置文件
+ [docs/多联画/AI商品图-多联画-mode_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/多联画/AI商品图-多联画-mode_rules.json)
+ [docs/多联画/AI商品图-多联画-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/多联画/AI商品图-多联画-option_value_expansions.json)
+ [docs/多联画/AI商品图-多联画-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/多联画/AI商品图-多联画-prompt_builder_template.json)
+ [docs/多联画/AI商品图-多联画-category_mode_recommend_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/多联画/AI商品图-多联画-category_mode_recommend_rules.json)
+ [docs/多联画/AI商品图-多联画-对齐一键场景图标准开发文档.md](/Users/zhaowenwen/CODEX/CKTAI电商/docs/多联画/AI商品图-多联画-对齐一键场景图标准开发文档.md)

## 真实功能与字段（Source of Truth）
代码来源：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

```json
{
  "toolKey": "video-scene-grid",
  "creationModeConfigKey": "default",
  "sectionOrder": ["upload-main", "video-scene-grid-setup"],
  "uploads": {
    "main": { "label": "上传素材", "maxCount": 24 }
  },
  "currentFields": {
    "videoSceneGridMode": ["系列图案", "主副图案", "情侣图案"],
    "videoSceneGridVariationByMode": {
      "系列图案": ["智能参考", "裂变主体", "裂变主体/文本", "裂变主题", "系列衍生"],
      "主副图案": ["智能参考", "简洁", "丰富", "反转", "叙事性"],
      "情侣图案": ["智能参考"]
    },
    "videoSceneGridDetailDimensions": "由 mode + variation 自动生成",
    "videoSceneGridRatio": ["自动检测比例", "1:1", "1:2", "2:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "18:23"],
    "videoSceneGridOutputCountRange": { "min": 2, "max": 10, "default": 2 },
    "videoSceneGridUnitCreditCost": 5
  }
}
```

补充业务事实：

+ 当前页面无 `advanced-settings`
+ 当前页面无 `supplement`
+ 当前页面无显式 `AI assist`
+ `videoSceneGridDetailDimensions` 为派生字段，后端如不信任前端传值，应按 `mode + variation` 重新计算
+ 总积分=`上传数 * 生图数量 * 5`

## 模式规则与选项提示词
完整内容以配套 JSON 为准，以下为开发实现时必须消费的结构：

```json
{
  "modeRulesByTool": {
    "系列图案": {
      "prompt": "围绕同一主题生成系列化图案，强调套系一致性、风格连贯性与可扩展性，允许在主体、主题、图文关系上做可控变化。"
    },
    "主副图案": {
      "prompt": "围绕主图与副图关系构建成组画面，主图负责核心表达，副图承担补充信息，确保主次清晰且具备电商信息承载能力。"
    },
    "情侣图案": {
      "prompt": "围绕双主体关系生成情侣向成组图案，重点保证双人互动语义、元素呼应与姿态关系统一，输出应具备配对展示价值。"
    }
  }
}
```

## 品类差异配置方案
多联画不是最强依赖品类的功能，但仍建议补 `categoryPrompt + 推荐模式 + 组合校验提醒` 三层能力。

```json
{
  "categoryModeRecommendRules": {
    "categoryRules": "见 AI商品图-多联画-category_mode_recommend_rules.json",
    "usage": [
      "用于 AI 推荐默认 mode / variation / ratio",
      "用于在最终 prompt 前追加 categoryPrompt",
      "用于对明显不合理的 mode-variation-category 组合给出 warning"
    ]
  }
}
```

开发要求：
1. 品类差异优先用于推荐和提醒，不建议一开始就强拦截生成。
2. `categoryPrompt` 插入位置放在 `task` 与 `mode` 之间。
3. 若未识别到明确品类，回退到 `通用` 规则。

```json
{
  "optionValueExpansions": {
    "videoSceneGridVariation": "每个变化方向均有独立 valuePrompt",
    "videoSceneGridRatio": "每个比例均有独立 valuePrompt",
    "videoSceneGridDetailDimensions": "每个详细维度均有独立 valuePrompt"
  }
}
```

## Prompt 拼装顺序
1. `task`
2. `mode`
3. `params`
4. `variation`
5. `ratio`
6. `detailDimensions`
7. `required`
8. `forbidden`
9. `universalNegativePrompt`
10. `universalQualityPrompt`
11. `supplement`

## 完整 Prompt 模板
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

补充说明：{supplement}
```

## 开发要求
1. 切换 `videoSceneGridMode` 后，`videoSceneGridVariation` 必须回退到该模式下的首个合法值。
2. `videoSceneGridDetailDimensions` 不允许作为自由输入字段。
3. `required / forbidden / 通用负向 / 通用质量` 为不可裁剪段。
4. 任务快照建议持久化：`videoSceneGridMode / videoSceneGridVariation / videoSceneGridDetailDimensions / videoSceneGridRatio / videoSceneGridOutputCount / finalPrompt`。
