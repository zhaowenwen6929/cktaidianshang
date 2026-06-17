# 【AI商品图】四方连续图-需求文档

## 功能目的
四方连续图用于把输入图案或提示词生成可平铺、可连续、可扩幅的商用纹样结果。它的核心目标是让图案在重复铺版、边界拼接、扩展画幅和后续生产上保持稳定可用，适合服饰印花、家纺面料、装饰画扩幅和图案连续化等 POD 场景。

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

## 功能字段

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

## 图片识别提示词
用于在用户上传素材后，自动识别更适合的 `productCategory`，并回填默认连续类型、密度和比例。

### 识别目标
1. 识别最适合的 `productCategory`。
2. 为连续图默认策略提供依据。
3. 识别失败时回退到 `通用`。

### 输出字段
```json
{
  "productCategory": "服装/纺织|手机壳|挂钟|装饰画|铁艺图形|铁皮画|通用",
  "confidence": 0.0,
  "needsUserConfirm": false,
  "reason": "简要判断原因",
  "evidence": ["证据1", "证据2"]
}
```

### 识别提示词
```text
你是一名 POD 连续图品类识别助手。请根据用户上传的素材图，判断该图更适合落入哪一种连续图品类，用于回填 productCategory。

任务要求：
1. 只能从以下枚举中选择 1 个 productCategory：
服装/纺织、手机壳、挂钟、装饰画、铁艺图形、铁皮画、通用
2. 结合图案结构、边界特征、载体形态、构图重心和后续铺版用途判断最适合的品类。
3. 若图形呈现明显几何线条、镂空结构、金属轮廓感，可优先判断为“铁艺图形”。
4. 若图像明显围绕圆心、钟面、放射平衡展开，可优先判断为“挂钟”。
5. 若无法稳定判断，必须返回“通用”，且 confidence 不高于 0.55。
6. 仅输出 JSON，不输出解释性文本，不输出 Markdown。

输出 JSON Schema：
{
  "productCategory": "服装/纺织|手机壳|挂钟|装饰画|铁艺图形|铁皮画|通用",
  "confidence": 0.0,
  "needsUserConfirm": true,
  "reason": "string",
  "evidence": ["string", "string"]
}
```

补充业务事实：

+ 当前真实 UI 已支持 `扩大画幅`，不能按旧口径漏掉该分支
+ `四方连续` 固定按 `1:1` 处理
+ `二方连续 / 扩大画幅 / 四方连续+图生图` 必须上传素材
+ `四方连续 + 文生图` 至少一条有效提示词
+ `扩大画幅` 额外使用 `patternRepeatDensityLevel`

## 积分规则
1. 四方连续图按最终出图张数计费，不按连续类型额外乘倍率。
2. `patternRepeatOutputCount` 表示本次请求最终需要返回的结果张数。
3. 单张结果图单价为 5 积分。
4. 总积分计算公式为：`patternRepeatOutputCount * 5`。
5. `四方连续 / 二方连续 / 扩大画幅` 只影响 prompt 和生成方式，不额外改变单张计费单价。
6. 若后续支持多素材批量上传，则总积分应扩展为：`上传数 * patternRepeatOutputCount * 5`。

## 任务拆分规则
1. 一个提交请求对应一个任务组。
2. 当前页面是单次选择一个连续类型、一个生成模式、一个比例和一个数量，因此默认不按类型或密度拆多个任务组。
3. `patternRepeatOutputCount` 表示同一任务组内需要返回的结果数量，不表示拆多个独立业务任务。
4. 推荐做法是：
   - 任务组维度：一次提交
   - 生成单元维度：单次请求的单个配置组合
   - 结果数量：`patternRepeatOutputCount`
5. 若底层模型为提高成功率需要并发生成多张结果，可在任务组内部拆 execution unit，但前台仍视为同一个任务组。
6. `四方连续 + 文生图` 下的多条提示词如果是“同一次配置中的参考输入”，应视为同一个任务组输入，不应按提示词条数拆多个任务组，除非产品后续定义每条 promptItem 独立出图。

## 模式规则与选项提示词
开发实现时必须按 `prompt + required + forbidden` 完整消费，不能只取模式主描述：

```json
{
  "modeRulesByType": {
    "四方连续": {
      "prompt": "目标是生成可无缝平铺的四方连续印花单元，保证左右与上下拼接处在形状、线条、颜色、明暗和纹理上自然衔接。",
      "required": ["四边可无缝拼接，无明显断缝、错位和突变", "主图案与次图案关系清晰，整体节奏均衡", "输出具备后续铺版、二次裂变和尺寸延展可用性"],
      "forbidden": ["四边出现硬切边、重复痕迹或拼接线", "局部过密或过空导致平铺后视觉噪声明显", "出现版权风险元素、品牌Logo或受保护IP"]
    },
    "二方连续": {
      "prompt": "目标是生成方向性二方连续图案，保证沿指定方向平铺连续，并保持另一方向的构图完整与视觉稳定。",
      "required": ["主连续方向边界自然衔接", "比例与方向适配当前应用尺寸", "图案节奏可用于批量排版"],
      "forbidden": ["连续方向出现明显接缝", "方向性错误导致重复后错位", "为追求花哨效果牺牲结构可用性"]
    },
    "扩大画幅": {
      "prompt": "目标是在保持原图主题、边界关系和画面节奏稳定的前提下自然扩展画幅，保证新增区域与原图叙事、结构和纹样逻辑连续。",
      "required": ["新增区域与原图自然融合", "扩幅后主视觉与重心关系稳定", "结果可直接用于后续展示或上版链路"],
      "forbidden": ["新增区域割裂", "明显补画痕迹", "为了补足画幅而引入无关主体或噪点"]
    }
  }
}
```

```json
{
  "universalNegativePrompt": "通用负向约束：1. 不要出现拼接线、断边、跳色、锯齿、重影、压缩噪点。2. 不要生成与主题无关的文字、水印、Logo、二维码。3. 不要引入版权高风险角色、品牌图形或可识别受保护标识。4. 不要出现低清、糊边、涂抹感或过度锐化。",
  "universalQualityPrompt": "通用质量要求：1. 连续性：平铺后边界自然无缝。2. 保真性：主题、主色与风格稳定。3. 清晰度：纹理、线条和层次可辨。4. 可用性：可直接用于POD印花链路。5. 一致性：同批次输出完成度稳定。"
}
```

1. 当前功能必须保留完整通用负向约束与通用质量约束，因为连续图最容易出现拼接线、断边、低清和版权风险，这些属于全局硬约束。
2. 模式级 `required / forbidden` 是直接影响连续图成片稳定性的正向/负向约束，不能省略。
3. 品类主约束与结构增强约束分层存在，不替代全局质量和负向约束。

## 品类差异配置方案
四方连续图是最需要补品类差异的功能之一。建议同时保留两层配置，且品类主规则统一按成熟功能使用的 `categoryRulesByTool` 结构编排：
1. 结构增强层：偏结构增强和方向推荐
2. 品类主约束层：偏品类推荐类型、密度、比例和风险提醒

这部分的作用分为 4 层：
1. 给不同品类推荐默认连续类型。
2. 给不同品类推荐默认元素密度和比例。
3. 把品类约束写进最终 prompt，包括品类说明、品类必须满足项、品类禁止项。
4. 对明显不合理的类型组合给出提醒。

### 品类字段来源与回填规则
```json
{
  "productCategory": {
    "source": "上传图识别结果、上游链路回填或用户手动指定",
    "allowedValues": ["服装/纺织", "手机壳", "挂钟", "装饰画", "铁艺图形", "铁皮画", "通用"],
    "fallback": "通用",
    "manualOverrideRule": "用户手动指定优先于自动识别结果"
  }
}
```

### 推荐默认值
默认推荐值从“当前功能的品类主约束规则”中获取。系统先确定 `productCategory`，再按该品类命中的规则回填默认 `type / density / ratio`；如果没有命中明确品类，则回退使用 `通用` 的默认值。推荐默认值只用于首屏回填和辅助推荐，不覆盖用户手动修改。

```json
{
  "recommendedDefaultsByCategory": {
    "服装/纺织": { "type": "四方连续", "density": "均衡", "ratio": "1:1" },
    "手机壳": { "type": "二方连续", "density": "均衡", "ratio": "3:4" },
    "挂钟": { "type": "四方连续", "density": "均衡", "ratio": "1:1" },
    "装饰画": { "type": "扩大画幅", "density": "均衡", "ratio": "3:4" },
    "铁艺图形": { "type": "二方连续", "density": "稀疏", "ratio": "1:1" },
    "铁皮画": { "type": "扩大画幅", "density": "均衡", "ratio": "4:3" },
    "通用": { "type": "四方连续", "density": "均衡", "ratio": "1:1" }
  }
}
```

### 完整品类规则
```json
{
  "categoryRulesByTool": {
    "服装/纺织": {
      "prompt": "适配服装与纺织面料的大面积铺版场景，强调重复节奏、面料纹理兼容性和远近视角下的图案层次，避免高频噪点和过于碎裂的小元素。",
      "required": ["重复节奏稳定", "平铺后不空洞", "面料语义自然"],
      "forbidden": ["高频噪点", "碎裂小元素", "大面积平铺后脏乱"],
      "recommendedType": "四方连续",
      "recommendedDensity": ["均衡", "密集"],
      "recommendedRatios": ["1:1", "3:4", "2:3", "18:23"],
      "avoidTypes": [],
      "avoidDensity": []
    },
    "手机壳": {
      "prompt": "适配手机壳弧面、小尺寸和开孔裁切场景，强调中心主体聚焦、边缘兼容性和高缩略识别度，避免关键图形落在易裁切区域。",
      "required": ["中心主体明确", "边缘兼容裁切", "小尺寸下仍清晰"],
      "forbidden": ["主元素压到开孔区", "四角裁切破坏主体", "满版过密导致不可读"],
      "recommendedType": "二方连续",
      "recommendedDensity": ["均衡", "稀疏"],
      "recommendedRatios": ["1:2", "2:1", "3:4", "4:3"],
      "avoidTypes": ["扩大画幅"],
      "avoidDensity": ["密集"]
    },
    "挂钟": {
      "prompt": "适配挂钟圆盘中心构图场景，强调圆心稳定、放射平衡和外圈闭合完整，避免平铺逻辑破坏钟面阅读秩序。",
      "required": ["中心对齐稳定", "外圈闭合完整", "径向关系清晰"],
      "forbidden": ["偏心构图", "放射关系混乱", "中心区域过密影响读表"],
      "recommendedType": "四方连续",
      "recommendedDensity": ["均衡"],
      "recommendedRatios": ["1:1", "4:5", "5:4"],
      "avoidTypes": ["二方连续"],
      "avoidDensity": ["密集"]
    },
    "装饰画": {
      "prompt": "适配装饰画远观冲击和近观细节并重的连续图输出，强调画面完整度、主题稳定和放大后的层次可读性。",
      "required": ["放大后层次可读", "新增区域叙事一致", "整体构图完整"],
      "forbidden": ["低清细碎纹理", "扩幅后叙事断裂", "只补空白不补内容"],
      "recommendedType": "扩大画幅",
      "recommendedDensity": ["均衡", "稀疏"],
      "recommendedRatios": ["3:4", "4:3", "16:9"],
      "avoidTypes": [],
      "avoidDensity": []
    },
    "铁艺图形": {
      "prompt": "适配铁艺图形和几何镂空类图案，强调线条干净、几何稳定和重复后轮廓不跳变。",
      "required": ["线条顺直", "几何关系稳定", "重复后轮廓不跳变"],
      "forbidden": ["线宽突变", "轮廓抖动", "高密度复杂纹样破坏秩序"],
      "recommendedType": "二方连续",
      "recommendedDensity": ["稀疏", "均衡"],
      "recommendedRatios": ["1:1", "2:1", "16:9"],
      "avoidTypes": [],
      "avoidDensity": ["密集"]
    },
    "铁皮画": {
      "prompt": "适配铁皮画复古装饰语境，强调做旧氛围下的主题可读性和大轮廓稳定，不让旧化纹理覆盖核心图案。",
      "required": ["主题强识别", "做旧节奏一致", "核心轮廓稳定"],
      "forbidden": ["旧化噪点喧宾夺主", "主体被做旧纹理覆盖", "扩大画幅后边框关系断裂"],
      "recommendedType": "扩大画幅",
      "recommendedDensity": ["均衡"],
      "recommendedRatios": ["3:4", "4:3", "16:9"],
      "avoidTypes": [],
      "avoidDensity": ["密集"]
    },
    "通用": {
      "prompt": "按商用连续图通用标准执行，优先连续性、清晰度、平铺稳定性和可复用性。",
      "required": ["边界连续", "清晰度稳定", "后续上版可复用"],
      "forbidden": ["拼接线", "断边", "清晰度失控"],
      "recommendedType": "四方连续",
      "recommendedDensity": ["均衡"],
      "recommendedRatios": ["1:1", "3:4", "4:3"],
      "avoidTypes": [],
      "avoidDensity": []
    }
  }
}
```

### 字段联动与提示词消费规则
1. `patternRepeatCreateMode` 只在 `patternRepeatType=四方连续` 时生效，其他类型提交时应忽略。
2. `patternRepeatGenerateMode` 只在 `patternRepeatType=四方连续 && patternRepeatCreateMode=图生图` 时生效。
3. `patternRepeatPrompts` 只在 `patternRepeatType=四方连续 && patternRepeatCreateMode=文生图` 时生效。
4. `patternRepeatRatio` 仅 `二方连续 / 扩大画幅` 生效；`四方连续` 固定按 `1:1` 逻辑处理。
5. `patternRepeatDensityLevel` 当前仅 `扩大画幅` 必填，且必须有独立 `valuePrompt`，不能复用二方连续规则代替。
6. `productCategory` 参与：
   - 默认值推荐：回填 `type / density / ratio`
   - prompt 注入：注入 `categoryStrategyPrompt / categoryRequired / categoryForbidden`
   - warning 提示：对高风险组合提示，不覆盖手动选择
8. 默认值获取顺序为：用户手动指定品类 > 业务链路传入品类 > 图片识别品类 > `通用` 回退。
7. 结构增强提示词与品类主约束必须拆开消费，不能混用成同一个变量。

### Warning 规则
1. `挂钟 x 二方连续`：给 warning，除非明确是边带纹样或外圈装饰带。
2. `手机壳 x 扩大画幅`：给 warning，提示新增区域可能落入开孔和裁切高风险区。
3. `铁艺图形 x 高密度`：给 warning，提示可能破坏金属线条秩序。

开发要求：
1. `categoryPrompt` 插入在 `taskGoal` 后、`modeRule` 前。
2. 品类推荐只用于默认值回填和提示，不应覆盖用户手动选择。
3. 对 `挂钟 x 二方连续`、`手机壳 x 扩大画幅` 等高风险组合建议给 warning。

```json
{
  "optionValueExpansions": {
    "patternRepeatType": { "fieldKey": "patternRepeatType", "rule": "每个类型均有 valuePrompt" },
    "patternRepeatCreateMode": { "fieldKey": "patternRepeatCreateMode", "name": "创作方式", "rule": "四方连续创作方式有独立 valuePrompt" },
    "patternRepeatGenerateMode": { "fieldKey": "patternRepeatGenerateMode", "name": "生成模式", "rule": "图生图生成模式有独立 valuePrompt" },
    "patternRepeatRatio": { "fieldKey": "patternRepeatRatio", "name": "出图比例", "rule": "每个比例均有 valuePrompt" },
    "patternRepeatDensityLevel": { "fieldKey": "patternRepeatDensityLevel", "name": "元素密度", "rule": "扩大画幅密度有独立 valuePrompt" }
  }
}
```

### 最终拼装顺序
1. `taskGoal`
2. `productCategory`
3. `modeRule`
4. `parameterBlock`
5. `enhancementRule`
6. `valuePromptBlock`
7. `required`
8. `categoryRequired`
9. `categoryForbidden`
10. `forbidden`
11. `universalNegativePrompt`
12. `universalQualityPrompt`
13. `promptItems`
14. `supplement`

## 完整 Prompt 模板
下面是最终提交给模型的生成提示词模板。花括号中的字段都是实际参与替换的字段，不是示意写法。

本模板实际使用的字段包括：`productCategory`、`categoryPrompt`、`typePrompt`、`createModePrompt`、`generateModePrompt`、`expandModePrompt`、`patternRepeatType`、`patternRepeatCreateMode`、`patternRepeatGenerateMode`、`patternRepeatRatio`、`patternRepeatDensityLevel`、`patternRepeatOutputCount`、`typeValuePrompt`、`createModeValuePrompt`、`generateModeValuePrompt`、`ratioValuePrompt`、`densityValuePrompt`、`dimensionPrompt`、`directionPrompt`、`requiredJoined`、`categoryRequiredJoined`、`categoryForbiddenJoined`、`forbiddenJoined`、`universalNegativePrompt`、`universalQualityPrompt`、`promptItemsJoined`、`supplement`。

```text
任务目标：生成可商用的连续印花或扩幅图案，优先保证边界连续性、主题稳定性与后续生产可用性。

品类：当前品类为「{productCategory}」

品类说明：{categoryPrompt}

品类正向约束：{categoryRequiredJoined}

品类负向约束：{categoryForbiddenJoined}

模式：{patternRepeatType}

模式说明：{typePrompt} {createModePrompt} {generateModePrompt} {expandModePrompt}

模式正向约束：{requiredJoined}

模式负向约束：{forbiddenJoined}

生成参数：连续类型={patternRepeatType}；创作方式={patternRepeatCreateMode}；生成模式={patternRepeatGenerateMode}；比例={patternRepeatRatio}；元素密度={patternRepeatDensityLevel}；数量={patternRepeatOutputCount}。

增强规则：{categoryPrompt} {dimensionPrompt} {directionPrompt}

选项扩展：{typeValuePrompt} {createModeValuePrompt} {generateModeValuePrompt} {ratioValuePrompt} {densityValuePrompt}

{universalNegativePrompt}

{universalQualityPrompt}

文生图输入：{promptItemsJoined}

补充说明：{supplement}
```

完整 Prompt 模板占位字段说明：
```json
{
  "templateFields": [
    "productCategory",
    "categoryPrompt",
    "typePrompt",
    "createModePrompt",
    "generateModePrompt",
    "expandModePrompt",
    "patternRepeatType",
    "patternRepeatCreateMode",
    "patternRepeatGenerateMode",
    "patternRepeatRatio",
    "patternRepeatDensityLevel",
    "patternRepeatOutputCount",
    "typeValuePrompt",
    "createModeValuePrompt",
    "generateModeValuePrompt",
    "ratioValuePrompt",
    "densityValuePrompt",
    "dimensionPrompt",
    "directionPrompt",
    "requiredJoined",
    "categoryRequiredJoined",
    "categoryForbiddenJoined",
    "forbiddenJoined",
    "universalNegativePrompt",
    "universalQualityPrompt",
    "promptItemsJoined",
    "supplement"
  ],
  "fieldMap": {
    "productCategory": "当前品类字段，优先级=用户手动指定 > 上游链路传入 > 图片识别结果 > 通用",
    "categoryPrompt": "categoryRulesByTool[productCategory].prompt，未命中时回退 categoryRulesByTool['通用'].prompt",
    "categoryRequiredJoined": "categoryRulesByTool[productCategory].required 按 '；' 连接，未命中时回退通用品类规则",
    "categoryForbiddenJoined": "categoryRulesByTool[productCategory].forbidden 按 '；' 连接，未命中时回退通用品类规则",
    "patternRepeatType": "当前选择的连续类型原值",
    "typePrompt": "modeRulesByType[patternRepeatType].prompt",
    "requiredJoined": "modeRulesByType[patternRepeatType].required 按 '；' 连接",
    "forbiddenJoined": "modeRulesByType[patternRepeatType].forbidden 按 '；' 连接",
    "createModePrompt": "optionValueExpansions.patternRepeatCreateMode.values[patternRepeatCreateMode].valuePrompt，仅四方连续生效",
    "generateModePrompt": "optionValueExpansions.patternRepeatGenerateMode.values[patternRepeatGenerateMode].valuePrompt，仅四方连续 + 图生图生效",
    "expandModePrompt": "扩大画幅独立模式文案，仅扩大画幅生效，其他场景传空字符串",
    "typeValuePrompt": "optionValueExpansions.patternRepeatType.values[patternRepeatType].valuePrompt",
    "createModeValuePrompt": "optionValueExpansions.patternRepeatCreateMode.values[patternRepeatCreateMode].valuePrompt，未生效时传空字符串",
    "generateModeValuePrompt": "optionValueExpansions.patternRepeatGenerateMode.values[patternRepeatGenerateMode].valuePrompt，未生效时传空字符串",
    "ratioValuePrompt": "optionValueExpansions.patternRepeatRatio.values[patternRepeatRatio].valuePrompt",
    "densityValuePrompt": "optionValueExpansions.patternRepeatDensityLevel.values[patternRepeatDensityLevel].valuePrompt，未生效时传空字符串",
    "dimensionPrompt": "结构增强维度规则文案；未命中时传空字符串",
    "directionPrompt": "结构增强方向规则文案；未命中时传空字符串",
    "promptItemsJoined": "patternRepeatPrompts 数组按 '；' 连接，仅四方连续 + 文生图生效",
    "universalNegativePrompt": "通用负向约束固定文案",
    "universalQualityPrompt": "通用质量要求固定文案",
    "supplement": "用户补充描述；为空时传空字符串，不删模板段位"
  }
}
```

## 开发要求
1. `patternRepeatCreateMode` 仅在 `四方连续` 下生效。
2. `patternRepeatGenerateMode` 仅在 `四方连续 + 图生图` 下生效。
3. `patternRepeatPrompts` 只用于 `四方连续 + 文生图`，其 `reverseImage` 需要进入 `sourceUploads`。
4. `patternRepeatDensityLevel` 为 `扩大画幅` 必填字段。
5. `品类说明 / 品类正向约束 / 品类负向约束` 只注入品类主约束；`增强规则` 段只注入结构增强规则，不能重复注入同一段文本。
6. 若 `productCategory` 缺失，品类主约束回退到 `通用`。
7. 任务快照建议持久化：`productCategory / patternRepeatType / patternRepeatCreateMode / patternRepeatGenerateMode / patternRepeatRatio / patternRepeatDensityLevel / patternRepeatOutputCount / patternRepeatPrompts / finalPrompt`。

## 附录A：完整模式规则
```json
{
  "modeRulesByType": {
    "四方连续": {
      "ruleLevel": "A",
      "prompt": "目标是生成可无缝平铺的四方连续印花单元，保证左右与上下拼接处在形状、线条、颜色、明暗和纹理上自然衔接。",
      "required": [
        "四边可无缝拼接，无明显断缝、错位和突变",
        "主图案与次图案关系清晰，整体节奏均衡",
        "输出具备后续铺版、二次裂变和尺寸延展可用性"
      ],
      "forbidden": [
        "四边出现硬切边、重复痕迹或拼接线",
        "局部过密或过空导致平铺后视觉噪声明显",
        "出现版权风险元素、品牌Logo或受保护IP"
      ],
      "createModes": {
        "图生图": {
          "prompt": "基于上传图进行连续化重构，优先保留原图主题、主色关系和视觉气质。",
          "required": ["保留核心主题识别性", "控制风格漂移，避免偏离原图语义"],
          "forbidden": ["把主体改造成无关新主题", "过度风格化导致商品可用性下降"],
          "generateModes": {
            "相似": {
              "prompt": "以相似策略生成，保持原图风格与构图语言，做连续化与边界优化。"
            },
            "原图连续": {
              "prompt": "以原图连续策略生成，最大化保留原图元素并修复拼接边界。"
            }
          }
        },
        "文生图": {
          "prompt": "根据文本描述从零生成四方连续图案，优先保证平铺连续性、主题清晰度与商用可读性。",
          "required": ["提示词主题明确，主次元素关系可执行", "若有反推图仅作风格参考，不逐像素复刻"],
          "forbidden": ["输出与提示词主题无关内容", "照搬参考图导致高度同质"]
        }
      }
    },
    "二方连续": {
      "ruleLevel": "A",
      "prompt": "目标是生成方向性二方连续图案，保证沿指定方向平铺连续，并保持另一方向的构图完整与视觉稳定。",
      "required": ["主连续方向边界自然衔接", "比例与方向适配当前应用尺寸", "图案节奏可用于批量排版"],
      "forbidden": ["连续方向出现明显接缝", "方向性错误导致重复后错位", "为追求花哨效果牺牲结构可用性"]
    }
  },
  "universalNegativePrompt": "通用负向约束：1. 不要出现拼接线、断边、跳色、锯齿、重影、压缩噪点。2. 不要生成与主题无关的文字、水印、Logo、二维码。3. 不要引入版权高风险角色、品牌图形或可识别受保护标识。4. 不要出现低清、糊边、涂抹感或过度锐化。",
  "universalQualityPrompt": "通用质量要求：1. 连续性：平铺后边界自然无缝。2. 保真性：主题、主色与风格稳定。3. 清晰度：纹理、线条和层次可辨。4. 可用性：可直接用于POD印花链路。5. 一致性：同批次输出完成度稳定。"
}
```

## 附录B：完整选项提示词
### `patternRepeatType`
1. `四方连续`：按四向可拼接标准执行，重点修复四边边界与角点连续关系。
2. `二方连续`：按二方向连续标准执行，优先确保主连续方向无缝，另一方向保持构图稳定。
3. `扩大画幅`：按扩幅补画逻辑执行，重点补足目标方向画幅空间，同时保证新增区域与原图主题、节奏和边界自然融合。

### `patternRepeatCreateMode`
1. `图生图`：以上传素材为主，保留主题与主色关系，在连续化处理中控制风格偏移。
2. `文生图`：以提示词为主导生成，确保主题具体、元素可执行、平铺后视觉稳定。

### `patternRepeatGenerateMode`
1. `相似`：保持与输入素材风格相似，允许适度重构以提升连续性和可用性。
2. `原图连续`：最大程度保留输入素材视觉特征，仅对拼接边界与断裂处进行连续化修复。

### `patternRepeatRatio`
1. `自动检测比例`：自动匹配最适合连续图案的长宽比例，优先保证平铺后节奏稳定。
2. `1:1`：按 `1:1` 方形单元生成，适合通用四方连续与社媒方图预览。
3. `1:2`：按 `1:2` 竖向比例生成，强化纵向节奏表达。
4. `2:1`：按 `2:1` 横向比例生成，强化横向延展表达。
5. `2:3`：按 `2:3` 竖向比例生成，兼顾细节与留白层次。
6. `3:2`：按 `3:2` 横向比例生成，适合中等密度图案排布。
7. `3:4`：按 `3:4` 竖向比例生成，适合电商竖图链路展示。
8. `4:3`：按 `4:3` 横向比例生成，适合横向信息展示场景。
9. `4:5`：按 `4:5` 竖向比例生成，兼顾移动端展示密度。
10. `5:4`：按 `5:4` 横向比例生成，保证主体稳定与边界完整。
11. `9:16`：按 `9:16` 竖屏比例生成，适配短视频封面与移动端内容流。
12. `16:9`：按 `16:9` 横屏比例生成，适配横版视觉与展示位。
13. `18:23`：按 `18:23` 竖向比例生成，兼顾服饰与纺织类长画幅展示。

### `patternRepeatDensityLevel`
1. `稀疏`：降低元素密度，增强留白和主体呼吸感，适合结构型或小尺寸载体。
2. `均衡`：平衡元素密度与留白，优先保证商用稳定性和通用适配性。
3. `密集`：提高纹样覆盖度和装饰层次，但必须避免平铺后噪点堆积和结构失控。

## 附录C：完整品类规则
### `服装/纺织`
- `prompt`：适配服装与纺织面料的大面积铺版场景，强调重复节奏、面料纹理兼容性和远近视角下的图案层次，避免高频噪点和过于碎裂的小元素。
- `required`：重复节奏稳定；平铺后不空洞；面料语义自然。
- `forbidden`：高频噪点；碎裂小元素；大面积平铺后脏乱。
- `recommendedType`：`四方连续`
- `recommendedDensity`：`均衡 / 密集`
- `recommendedRatios`：`1:1 / 3:4 / 2:3 / 18:23`

### `手机壳`
- `prompt`：适配手机壳弧面、小尺寸和开孔裁切场景，强调中心主体聚焦、边缘兼容性和高缩略识别度，避免关键图形落在易裁切区域。
- `required`：中心主体明确；边缘兼容裁切；小尺寸下仍清晰。
- `forbidden`：主元素压到开孔区；四角裁切破坏主体；满版过密导致不可读。
- `recommendedType`：`二方连续`
- `recommendedDensity`：`均衡 / 稀疏`
- `recommendedRatios`：`1:2 / 2:1 / 3:4 / 4:3`

### `挂钟`
- `prompt`：适配挂钟圆盘中心构图场景，强调圆心稳定、放射平衡和外圈闭合完整，避免平铺逻辑破坏钟面阅读秩序。
- `required`：中心对齐稳定；外圈闭合完整；径向关系清晰。
- `forbidden`：偏心构图；放射关系混乱；中心区域过密影响读表。
- `recommendedType`：`四方连续`
- `recommendedDensity`：`均衡`
- `recommendedRatios`：`1:1 / 4:5 / 5:4`

### `装饰画`
- `prompt`：适配装饰画远观冲击和近观细节并重的连续图输出，强调画面完整度、主题稳定和放大后的层次可读性。
- `required`：放大后层次可读；新增区域叙事一致；整体构图完整。
- `forbidden`：低清细碎纹理；扩幅后叙事断裂；只补空白不补内容。
- `recommendedType`：`扩大画幅`
- `recommendedDensity`：`均衡 / 稀疏`
- `recommendedRatios`：`3:4 / 4:3 / 16:9`

### `铁艺图形`
- `prompt`：适配铁艺图形和几何镂空类图案，强调线条干净、几何稳定和重复后轮廓不跳变。
- `required`：线条顺直；几何关系稳定；重复后轮廓不跳变。
- `forbidden`：线宽突变；轮廓抖动；高密度复杂纹样破坏秩序。
- `recommendedType`：`二方连续`
- `recommendedDensity`：`稀疏 / 均衡`
- `recommendedRatios`：`1:1 / 2:1 / 16:9`

### `铁皮画`
- `prompt`：适配铁皮画复古装饰语境，强调做旧氛围下的主题可读性和大轮廓稳定，不让旧化纹理覆盖核心图案。
- `required`：主题强识别；做旧节奏一致；核心轮廓稳定。
- `forbidden`：旧化噪点喧宾夺主；主体被做旧纹理覆盖；扩大画幅后边框关系断裂。
- `recommendedType`：`扩大画幅`
- `recommendedDensity`：`均衡`
- `recommendedRatios`：`3:4 / 4:3 / 16:9`

### `通用`
- `prompt`：按商用连续图通用标准执行，优先连续性、清晰度、平铺稳定性和可复用性。
- `required`：边界连续；清晰度稳定；后续上版可复用。
- `forbidden`：拼接线；断边；清晰度失控。
- `recommendedType`：`四方连续`
- `recommendedDensity`：`均衡`
- `recommendedRatios`：`1:1 / 3:4 / 4:3`

## 附录D：Prompt 组装要求
```json
{
  "requiredFields": [
    "toolKey",
    "productCategory",
    "patternRepeatType",
    "patternRepeatOutputCount"
  ],
  "conditionalRequiredFields": {
    "四方连续": ["patternRepeatCreateMode"],
    "四方连续+图生图": ["patternRepeatGenerateMode", "sourceUploads.main"],
    "四方连续+文生图": ["patternRepeatPrompts"],
    "二方连续": ["sourceUploads.main", "patternRepeatRatio"],
    "扩大画幅": ["sourceUploads.main", "patternRepeatRatio", "patternRepeatDensityLevel"]
  },
  "strictMode": {
    "onMissingCategoryRule": "warn_and_fallback_to_general",
    "onMissingModeRule": "error",
    "onMissingRequiredField": "error",
    "onUnknownType": "error",
    "onUnknownCreateMode": "error",
    "onUnknownGenerateMode": "error",
    "onUnknownRatio": "error",
    "onUnknownDensity": "error"
  }
}
```
