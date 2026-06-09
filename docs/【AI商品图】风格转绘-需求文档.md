# 【AI商品图】风格转绘-需求文档

## 使用流程
1. 上传素材图（`upload-main`）
2. 选择风格分类（`video2d3dStyleCategory`）
3. 选择具体风格（`video2d3dStyle`）
4. 选择出图比例（`video2d3dRatio`）
5. 选择出图数量（`video2d3dOutputCount`）
6. 生成

## 端到端使用流程
1. 用户上传素材图。
2. 用户先选择风格分类，系统只展示该分类下可用的具体风格。
3. 若切换分类导致当前风格不合法，前端自动回退到该分类首个风格。
4. 用户选择比例和数量。
5. 系统按 `分类规则 + 分类 valuePrompt + 具体风格 valuePrompt + 比例/数量 valuePrompt + 通用负向/质量` 组装 prompt。
6. 输出保持原素材主体语义、但完成风格化重绘的结果。

## 配套配置文件
+ [docs/风格转绘/AI商品图-风格转绘-mode_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/风格转绘/AI商品图-风格转绘-mode_rules.json)
+ [docs/风格转绘/AI商品图-风格转绘-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/风格转绘/AI商品图-风格转绘-option_value_expansions.json)
+ [docs/风格转绘/AI商品图-风格转绘-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/风格转绘/AI商品图-风格转绘-prompt_builder_template.json)
+ [docs/风格转绘/AI商品图-风格转绘-category_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/风格转绘/AI商品图-风格转绘-category_rules.json)

## 真实功能与字段（Source of Truth）
代码来源：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

```json
{
  "toolKey": "video-2d3d",
  "creationModeConfigKey": "default",
  "sectionOrder": ["upload-main", "video-2d3d-setup"],
  "currentFields": {
    "video2d3dStyleCategory": ["全部", "原始3D风格", "线描手稿", "插画卡通", "水彩油画", "工艺材质", "设计风格", "人像宠物"],
    "video2d3dStyle": "按分类映射展示，前端内置 80+ 风格",
    "video2d3dRatio": ["自动检测比例", "1:1", "1:2", "2:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "18:23"],
    "video2d3dOutputCount": ["1", "2", "3", "4"]
  },
  "unitCreditCost": 5
}
```

补充业务事实：

+ 当前页面无 `advanced-settings`
+ 当前页面无 `supplement`
+ 当前页面无显式 `AI assist`
+ `video2d3dStyle` 必须受 `video2d3dStyleCategory` 约束，不能提交分类之外的风格值
+ 总积分=`上传数 * 出图数量 * 5`

## 模式规则与选项提示词
完整内容以配套 JSON 为准：

```json
{
  "modeRulesByCategory": {
    "全部": "通用风格转绘主规则",
    "原始3D风格": "3D/浮雕/工艺深度主规则",
    "线描手稿": "线描/速写/素描主规则",
    "插画卡通": "插画/卡通主规则",
    "水彩油画": "水彩/油画主规则",
    "工艺材质": "材质/刺绣/编织主规则",
    "设计风格": "设计语言主规则",
    "人像宠物": "肖像/宠物识别主规则"
  }
}
```

## 品类差异配置方案
风格转绘需要补品类差异，但重点不是“限制所有风格”，而是补 `风格适配推荐 + 结构风险约束 + 高风险组合提醒`。

```json
{
  "categoryRules": {
    "recommendedStyleCategories": "按品类推荐默认风格分类",
    "avoidStyleCategories": "高风险分类提醒",
    "prompt": "进入最终 prompt 的品类风险约束",
    "warnings": "不合理分类组合提醒"
  }
}
```

开发要求：
1. `categoryPrompt` 插入在 `task` 后、`category` 前。
2. 推荐风格分类只用于默认值回填和提示，不应覆盖用户手动选择。
3. 对 `家电数码类 x 人像宠物`、`铁艺图形/五金 x 水彩油画` 等组合给 warning。

```json
{
  "optionValueExpansions": {
    "video2d3dStyleCategory": "每个分类均有独立 valuePrompt",
    "video2d3dStyle": "所有具体风格均有独立 valuePrompt",
    "video2d3dRatio": "每个比例均有独立 valuePrompt",
    "video2d3dOutputCount": "每个数量档位均有独立 valuePrompt"
  }
}
```

## Prompt 拼装顺序
1. `task`
2. `productCategory`
3. `category`
4. `params`
5. `categoryValue`
6. `styleValue`
7. `ratioValue`
8. `countValue`
9. `required`
10. `forbidden`
11. `universalNegativePrompt`
12. `universalQualityPrompt`
13. `supplement`

## 完整 Prompt 模板
```text
任务目标：基于上传素材执行风格转绘，在保持原图主体结构和识别特征稳定的前提下，输出命中指定风格的高质量结果。

品类规则：当前主体品类为「{productCategory}」，{categoryPrompt}

分类规则：{styleCategoryPrompt}

转绘参数：风格分类={video2d3dStyleCategory}；具体风格={video2d3dStyle}；出图比例={video2d3dRatio}；出图数量={video2d3dOutputCount}。

分类扩展：{styleCategoryValuePrompt}

风格扩展：{styleValuePrompt}

比例扩展：{ratioValuePrompt}

数量扩展：{outputCountValuePrompt}

必须满足：{requiredJoined}

禁止：{forbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

补充说明：{supplement}
```

## 开发要求
1. `video2d3dStyleCategory` 切换后，若当前 `video2d3dStyle` 不在新分类中，必须自动回退。
2. 后端校验时需校验 `style` 是否属于 `styleCategory` 的合法子集。
3. 风格库建议独立维护成配置，避免散落在代码中做硬编码判断。
4. 任务快照建议持久化：`video2d3dStyleCategory / video2d3dStyle / video2d3dRatio / video2d3dOutputCount / finalPrompt`。
