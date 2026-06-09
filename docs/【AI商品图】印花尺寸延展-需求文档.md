# 【AI商品图】印花尺寸延展-需求文档

## 使用流程
1. 上传素材图（`upload-main`）
2. 选择一个或多个延展比例（`videoPrintExtendSelectedRatios`）
3. 选择每个比例的出图数量（`videoPrintExtendOutputCount`）
4. 生成

## 端到端使用流程
1. 用户上传素材图。
2. 用户多选需要延展的目标比例。
3. 系统实时计算 `比例数 / 结果数量 / 总积分`。
4. 系统按 `模式规则 + 比例 valuePrompt + 数量 valuePrompt + 通用负向/质量` 组装 prompt。
5. 对每张上传图，按每个已选比例分别生成对应数量的延展结果。
6. 输出可直接用于不同 POD 版型和电商展示比例的延展图。

## 配套配置文件
+ [docs/印花尺寸延展/AI商品图-印花尺寸延展-mode_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/印花尺寸延展/AI商品图-印花尺寸延展-mode_rules.json)
+ [docs/印花尺寸延展/AI商品图-印花尺寸延展-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/印花尺寸延展/AI商品图-印花尺寸延展-option_value_expansions.json)
+ [docs/印花尺寸延展/AI商品图-印花尺寸延展-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/印花尺寸延展/AI商品图-印花尺寸延展-prompt_builder_template.json)
+ [docs/印花尺寸延展/AI商品图-印花尺寸延展-category_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/印花尺寸延展/AI商品图-印花尺寸延展-category_rules.json)

## 真实功能与字段（Source of Truth）
代码来源：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

```json
{
  "toolKey": "video-print-extend",
  "creationModeConfigKey": "default",
  "sectionOrder": ["upload-main", "video-print-extend-setup"],
  "currentFields": {
    "videoPrintExtendSelectedRatios": ["1:1", "1:2", "2:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9"],
    "videoPrintExtendOutputCount": ["1", "2", "3", "4"],
    "videoPrintExtendRatioCount": "自动计算",
    "videoPrintExtendTotalResultCount": "uploadCount * ratioCount * outputCount",
    "videoPrintExtendUnitCreditCost": 5,
    "videoPrintExtendTotalCreditCost": "totalResultCount * 5"
  }
}
```

补充业务事实：

+ 当前页面无 `advanced-settings`
+ 当前页面无 `supplement`
+ 当前页面无显式 `AI assist`
+ 比例支持多选，允许一次任务生成多种目标比例
+ 若未选择任何比例，不允许生成
+ 总结果数=`上传数 * 选中比例数 * 出图数量`
+ 总积分=`总结果数 * 5`

## 模式规则与选项提示词
完整内容以配套 JSON 为准：

```json
{
  "modeRulesByTool": {
    "印花尺寸延展": {
      "prompt": "在保持原图主体、图案语义、主色关系和可印刷性的前提下，将原始印花自然延展到目标比例，避免把延展做成拉伸、硬裁切或机械平铺补边。"
    }
  }
}
```

## 品类差异配置方案
印花尺寸延展是最应该补品类差异的功能之一，因为它直接影响后续版型、裁切安全区和生产可用性。

```json
{
  "categoryRules": {
    "recommendedRatios": "按品类推荐默认延展比例",
    "recommendedOutputCount": "按品类推荐默认每比例出图数",
    "prompt": "进入最终 prompt 的品类约束",
    "warnings": "高风险比例组合提醒"
  }
}
```

开发要求：
1. `categoryPrompt` 插入在 `task` 后、`mode` 前。
2. 品类推荐用于默认值回填，不覆盖用户手动多选的比例。
3. 对 `挂钟 x 16:9`、`手机壳 x 2:1` 等组合建议给 warning。

```json
{
  "optionValueExpansions": {
    "videoPrintExtendSelectedRatios": "每个目标比例均有独立 valuePrompt",
    "videoPrintExtendOutputCount": "每个数量档位均有独立 valuePrompt"
  }
}
```

## Prompt 拼装顺序
1. `task`
2. `category`
3. `mode`
4. `params`
5. `ratioPrompts`
6. `countPrompt`
7. `required`
8. `forbidden`
9. `universalNegativePrompt`
10. `universalQualityPrompt`
11. `supplement`

## 完整 Prompt 模板
```text
任务目标：基于上传印花图执行尺寸延展，在不破坏主体和图案可用性的前提下，生成适配多个版型比例的高质量结果。

品类规则：当前载体品类为「{productCategory}」，{categoryPrompt}

模式规则：{modePrompt}

延展参数：延展比例={selectedRatiosJoined}；每比例出图数量={videoPrintExtendOutputCount}；比例数={videoPrintExtendRatioCount}；总结果数={videoPrintExtendTotalResultCount}。

比例扩展：{ratioValuePromptsJoined}

数量扩展：{outputCountValuePrompt}

必须满足：{modeRequiredJoined}

禁止：{modeForbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

补充说明：{supplement}
```

## 开发要求
1. `videoPrintExtendSelectedRatios` 提交时按数组语义处理，不要退化成单值字段。
2. 每个比例都应生成独立结果，且计费、结果数统计必须一致。
3. 提交快照应保留：`selectedRatios / ratioCount / outputCount / totalResultCount / unitCreditCost / totalCreditCost / finalPrompt`。
4. 生成按钮校验以 `effectiveReferenceCount=ratioCount` 为准，不能只看素材上传数。
