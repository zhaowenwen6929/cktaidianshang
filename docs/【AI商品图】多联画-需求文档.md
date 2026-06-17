# 【AI商品图】多联画-需求文档

## 功能目的
多联画用于围绕同一主题或同一商品表达，批量生成一组成组使用的视觉结果。它的核心目标不是简单出多张图，而是在保证主题、风格和主表达一致的前提下，让不同结果之间形成明确可感知的变化，便于用于系列印花、主副图搭配、情侣配对图案等 POD 场景。

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

## 功能字段

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

## 图片识别提示词
用于在用户上传素材后，自动识别更适合的 `productCategory`，并为页面回填默认 `mode / variation / ratio`。

### 识别目标
1. 识别最适合的 `productCategory`。
2. 输出可用于默认值推荐的识别结果。
3. 识别失败时回退到 `通用`，不强行输出高置信度结果。

### 输出字段
```json
{
  "productCategory": "服装/纺织|手机壳|装饰画|情侣/成对载体|通用",
  "confidence": 0.0,
  "needsUserConfirm": false,
  "reason": "简要判断原因",
  "evidence": ["证据1", "证据2"]
}
```

### 识别提示词
```text
你是一名 POD 商品图品类识别助手。请根据用户上传的素材图，判断该图更适合落入哪一种多联画品类，用于回填 productCategory。

任务要求：
1. 只能从以下枚举中选择 1 个 productCategory：
服装/纺织、手机壳、装饰画、情侣/成对载体、通用
2. 结合主体结构、版式、用途、尺寸特征和常见载体判断最适合的品类。
3. 若图像明显适合成对表达、情侣表达、双主体互动表达，可优先判断为“情侣/成对载体”。
4. 若无法稳定判断，必须返回“通用”，且 confidence 不高于 0.55。
5. 仅输出 JSON，不输出解释性文本，不输出 Markdown。

输出 JSON Schema：
{
  "productCategory": "服装/纺织|手机壳|装饰画|情侣/成对载体|通用",
  "confidence": 0.0,
  "needsUserConfirm": true,
  "reason": "string",
  "evidence": ["string", "string"]
}
```

补充业务事实：

+ 当前页面无 `advanced-settings`
+ 当前页面无 `supplement`
+ 当前页面无显式 `AI assist`
+ `videoSceneGridDetailDimensions` 为派生字段，不是独立静态选项，也不是自由输入字段
+ `videoSceneGridDetailDimensions` 的来源是 `videoSceneGridMode + videoSceneGridVariation` 联动结果
+ 后端如不信任前端传值，应按 `videoSceneGridMode + videoSceneGridVariation` 重新计算
+ 总积分=`上传数 * 生图数量 * 5`

## 积分规则
1. 多联画按最终出图张数计费，不按“联数倍率”额外乘算。
2. 当前页面的 `videoSceneGridOutputCount` 表示每张上传素材最终要输出多少张结果图。
3. 单张结果图单价为 5 积分。
4. 总积分计算公式为：`上传数 * videoSceneGridOutputCount * 5`。
5. 若后续产品定义“单次结果内天然包含固定联数成组图”，也仍应以页面实际返回的最终结果张数为计费基准，不单独再乘模式倍率。

## 任务拆分规则
1. 一个提交请求对应一个任务组。
2. 任务组内按上传素材逐张拆分子任务。
3. 每张上传素材默认只生成一个模式结果流，不按“系列图案 / 主副图案 / 情侣图案”的联数再拆成多个独立任务。
4. `videoSceneGridOutputCount` 表示单个子任务需要返回的结果数量，不表示要拆成多个任务组。
5. 推荐做法是：
   - 任务组维度：一次提交
   - 子任务维度：每张上传素材
   - 子任务结果数：`videoSceneGridOutputCount`
6. 若后端生成链路必须并发执行多张结果，可在任务组内部继续拆 execution unit，但对前台仍视为同一个任务组，不改变计费口径。

## 模式规则与选项提示词
开发实现时必须按 `prompt + required + forbidden` 完整消费，不能只取模式主描述：

```json
{
  "modeRulesByTool": {
    "系列图案": {
      "prompt": "围绕同一主题生成系列化图案，强调套系一致性、风格连贯性与可扩展性，允许在主体、主题、图文关系上做可控变化。",
      "required": ["组内视觉风格统一", "变化点可被明确识别", "保留主题核心识别特征", "适合批量成组展示"],
      "forbidden": ["组图风格随机漂移", "图案主题互相冲突", "变化无规律导致系列不可用", "过度复杂导致信息不可读"]
    },
    "主副图案": {
      "prompt": "围绕主图与副图关系构建成组画面，主图负责核心表达，副图承担补充信息，确保主次清晰且具备电商信息承载能力。",
      "required": ["主副层级清晰", "主图主体识别稳定", "副图补充信息有效", "组内构图逻辑一致"],
      "forbidden": ["主副角色混乱", "副图喧宾夺主", "核心信息分散无法读取", "版式跳变导致组图失序"]
    },
    "情侣图案": {
      "prompt": "围绕双主体关系生成情侣向成组图案，重点保证双人互动语义、元素呼应与姿态关系统一，输出应具备配对展示价值。",
      "required": ["双主体关系一致", "互动语义明确", "元素呼应自然", "组图风格统一"],
      "forbidden": ["双主体风格断裂", "关系表达模糊", "姿态或结构失真", "配对逻辑不成立"]
    }
  }
}
```

```json
{
  "universalNegativePrompt": "通用负向约束：1. 严禁生成与原主题无关的新主体或新SKU。2. 严禁出现低质量AI伪影（结构错位、边缘融化、脏噪点、重影）。3. 严禁组图之间风格断裂、色调失控、光影不连续。4. 严禁误导性图文表达、侵权标识、水印、二维码、联系方式。5. 严禁为了变化而破坏可读性与商业可用性。",
  "universalQualityPrompt": "通用质量要求：1. 组内一致性：色彩、质感、光线、镜头语言统一。2. 变化可感知：每张图的差异清晰且可解释。3. 主体可信：结构、比例、材质与主题一致。4. 商业可用：缩略图和详情页下都能稳定识别。5. 可复用：结果可直接进入电商/POD后续排版链路。"
}
```

1. 多联画必须保留完整通用负向约束与通用质量约束，用于统一约束组图一致性、变化可解释性和商业可用性。
2. 模式级 `required / forbidden` 是直接影响生图效果的正向/负向约束，不能省略。
3. 品类差异属于增强层，不替代全局质量和负向约束。

## 详细维度来源规则
1. `详细维度` 对应字段为 `videoSceneGridDetailDimensions`。
2. 该字段不是独立配置来源，不单独面向用户提供一套固定一级选项。
3. 该字段必须根据 `变化维度 + 变化方向` 联动生成。
4. 联动关系如下：
   - `系列图案 + 智能参考`：生成 `智能识别系列关系 / 保留原始风格线索 / 自动补齐系列一致性`
   - `系列图案 + 裂变主体`：生成 `主体数量变化 / 主体组合方式 / 主次节奏控制`
   - `系列图案 + 裂变主体/文本`：生成 `文本位置编排 / 图文占比控制 / 标题与主体呼应`
   - `系列图案 + 裂变主题`：生成 `主题方向延展 / 统一配色氛围 / 强化视觉母题`
   - `系列图案 + 系列衍生`：生成 `延展子款内容 / 保持套系感 / 控制衍生差异度`
   - `主副图案 + 智能参考`：生成 `自动识别主副关系 / 保留核心构图逻辑 / 平衡主次视觉权重`
   - `主副图案 + 简洁`：生成 `主图更突出 / 副图弱化点缀 / 增加留白感`
   - `主副图案 + 丰富`：生成 `增强层次密度 / 补充装饰元素 / 提升信息丰富度`
   - `主副图案 + 反转`：生成 `切换主副位置 / 重构视觉重心 / 生成反差版式`
   - `主副图案 + 叙事性`：生成 `加入故事场景 / 强化角色关系 / 形成视觉引导线`
   - `情侣图案 + 智能参考`：生成 `双人关系识别 / 服装元素呼应 / 互动姿态统一`
5. 前端可以传递联动结果用于展示和提交，但后端不应把该字段视为用户自由输入。
6. 后端应以 `videoSceneGridMode + videoSceneGridVariation` 作为真实计算依据，必要时重新生成 `videoSceneGridDetailDimensions`。

## 品类差异配置方案
多联画不是最强依赖品类的功能，但仍建议补 `categoryPrompt + 推荐模式 + 组合校验提醒` 三层能力，且格式需与其他成熟功能一致，统一按 `categoryRulesByTool` 结构消费。

这部分的作用分为 3 层：
1. 用于给用户推荐默认值，包括默认 `模式 / 变化方向 / 比例`。
2. 用于把品类要求写进最终 prompt，包括品类说明、品类必须满足项、品类禁止项。
3. 用于对明显不合理的组合给出提醒，例如某个品类不适合某种变化方向。

### 品类字段来源与回填规则
```json
{
  "productCategory": {
    "source": "上传图片识别结果或外层业务链路传入",
    "allowedValues": ["服装/纺织", "手机壳", "装饰画", "情侣/成对载体", "通用"],
    "fallback": "通用",
    "manualOverrideRule": "用户手动指定优先于自动识别结果"
  }
}
```

### 推荐默认值
默认推荐值从“当前功能的品类规则”中获取。系统先确定 `productCategory`，再按该品类命中的规则回填默认 `mode / variation / ratio`；如果没有命中明确品类，则回退使用 `通用` 的默认值。推荐默认值只用于首屏回填和辅助推荐，不覆盖用户手动修改。

```json
{
  "recommendedDefaultsByCategory": {
    "服装/纺织": { "mode": "系列图案", "variation": "裂变主题", "ratio": "1:1" },
    "手机壳": { "mode": "主副图案", "variation": "简洁", "ratio": "3:4" },
    "装饰画": { "mode": "系列图案", "variation": "系列衍生", "ratio": "3:4" },
    "情侣/成对载体": { "mode": "情侣图案", "variation": "智能参考", "ratio": "1:1" },
    "通用": { "mode": "系列图案", "variation": "智能参考", "ratio": "1:1" }
  }
}
```

### 完整品类规则
```json
{
  "categoryRulesByTool": {
    "服装/纺织": {
      "prompt": "适配服装与纺织印花套系展示，强调系列花型的统一节奏、远观识别度和大面积排版后的耐看性，避免元素过碎导致成衣上身后失焦。",
      "required": ["套系关系清楚", "远看识别强", "大面积排版后不空不乱"],
      "forbidden": ["元素过碎", "组图风格断裂", "成衣视角下主图失焦"],
      "recommendedMode": "系列图案",
      "recommendedVariations": ["裂变主题", "系列衍生", "智能参考"],
      "recommendedRatios": ["1:1", "3:4", "2:3"],
      "avoidModes": [],
      "avoidVariations": ["丰富"]
    },
    "手机壳": {
      "prompt": "适配手机壳小尺寸印花与缩略图浏览，强调中心主体聚焦、边缘完整和视觉高对比，避免核心元素落入开孔、边框或圆角高风险区域。",
      "required": ["中心主体明确", "缩略图下仍清晰", "边缘兼容壳体裁切"],
      "forbidden": ["主体贴近开孔区", "四角核心元素被切断", "细节过密导致发脏"],
      "recommendedMode": "主副图案",
      "recommendedVariations": ["简洁", "反转", "智能参考"],
      "recommendedRatios": ["1:2", "3:4", "1:1"],
      "avoidModes": [],
      "avoidVariations": ["丰富", "叙事性"]
    },
    "装饰画": {
      "prompt": "适配装饰画远观冲击和近观细节并重的展示目标，强调构图完整、主题清晰和成组叙事关系，允许更强的氛围与层次表达。",
      "required": ["构图完整", "主次清晰", "成组展示有明确变化感"],
      "forbidden": ["变化过弱", "远观无冲击", "高层次叙事但主视觉丢失"],
      "recommendedMode": "系列图案",
      "recommendedVariations": ["裂变主题", "系列衍生", "叙事性"],
      "recommendedRatios": ["3:4", "4:3", "16:9"],
      "avoidModes": [],
      "avoidVariations": []
    },
    "情侣/成对载体": {
      "prompt": "适配情侣衫、情侣杯、成对挂画等成对载体，强调双主体的关系呼应、互动一致性和配对逻辑，避免两张图像只是随机并列。",
      "required": ["双主体关系成立", "互动语义自然", "配对逻辑清楚"],
      "forbidden": ["两张图随机并列", "双边风格不统一", "单边视觉过强导致失衡"],
      "recommendedMode": "情侣图案",
      "recommendedVariations": ["智能参考"],
      "recommendedRatios": ["1:1", "3:4", "2:3"],
      "avoidModes": ["主副图案"],
      "avoidVariations": []
    },
    "通用": {
      "prompt": "按通用成组视觉标准执行，优先保证组内统一、变化清晰和后续排版可复用性。",
      "required": ["组内风格统一", "变化方向可解释", "后续排版可复用"],
      "forbidden": ["随机拼接感", "变化无主线", "商业可用性下降"],
      "recommendedMode": "系列图案",
      "recommendedVariations": ["智能参考", "裂变主题"],
      "recommendedRatios": ["1:1", "3:4", "4:3"],
      "avoidModes": [],
      "avoidVariations": []
    }
  }
}
```

### 字段联动与提示词消费规则
1. `videoSceneGridVariation` 必须严格受 `videoSceneGridMode` 约束，只允许提交该模式下的合法值。
2. `videoSceneGridDetailDimensions` 不是自由输入字段，必须由 `mode + variation` 联动生成，再逐项映射到对应 `valuePrompt`。
3. `productCategory` 参与三类联动：
   - 默认值回填：给出推荐 `mode / variation / ratio`
   - prompt 注入：注入 `categoryPrompt / categoryRequired / categoryForbidden`
   - warning 提示：对高风险组合给提示，不覆盖用户手选
5. 默认值获取顺序为：用户手动指定品类 > 业务链路传入品类 > 图片识别品类 > `通用` 回退。
4. `videoSceneGridRatio`、`videoSceneGridVariation`、`videoSceneGridDetailDimensions` 都必须逐值消费独立 `valuePrompt`，不能只拼字段名不拼值语义。

### Warning 规则
1. `手机壳 x 系列图案 x 系列衍生`：给 warning，提示主体可能分散，建议优先改为 `裂变主体 / 裂变主体/文本`。
2. `服装/纺织 x 主副图案 x 叙事性`：给 warning，提示可能弱化印花重复价值。
3. `情侣/成对载体` 若未选 `情侣图案`：给 warning，提示成对关系表达可能不稳定。

开发要求：
1. 品类差异优先用于推荐和提醒，不建议一开始就强拦截生成。
2. `categoryPrompt` 插入位置放在 `task` 与 `mode` 之间。
3. 若未识别到明确品类，回退到 `通用` 规则。

```json
{
  "optionValueExpansions": {
    "videoSceneGridVariation": {
      "fieldKey": "videoSceneGridVariation",
      "name": "变化方向",
      "values": {
        "智能参考": { "valuePrompt": "根据当前主题自动选择最合理的变化策略，优先保证组内统一和可读性。" },
        "裂变主体": { "valuePrompt": "围绕主体数量、组合和主次关系做变化，确保主体识别稳定。" },
        "裂变主体/文本": { "valuePrompt": "同步处理图形主体与文本层级，保持图文关系清晰、可读、可复用。" },
        "裂变主题": { "valuePrompt": "在保留主题母体的前提下延展不同子主题，保证同源感与差异感平衡。" },
        "系列衍生": { "valuePrompt": "产出可连续上新的系列衍生版本，风格一致且每张有明确变化点。" },
        "简洁": { "valuePrompt": "减少装饰密度和干扰元素，突出主体轮廓与主副关系，提升浏览效率。" },
        "丰富": { "valuePrompt": "增强层次与信息密度，但要保持主次清晰，避免复杂堆砌。" },
        "反转": { "valuePrompt": "通过主副互换或重心迁移形成反差版式，反转后仍需保证信息可读。" },
        "叙事性": { "valuePrompt": "加入故事线索与视觉引导路径，让组图呈现连续阅读体验。" }
      }
    },
    "videoSceneGridRatio": {
      "fieldKey": "videoSceneGridRatio",
      "name": "出图比例",
      "values": {
        "自动检测比例": { "valuePrompt": "根据主题自动匹配最合适比例，优先保证主体完整与组图一致性。" },
        "1:1": { "valuePrompt": "使用方图比例，强调中心构图与平台通用兼容性。" },
        "1:2": { "valuePrompt": "使用纵向窄幅比例，注意主体纵向延展与上下节奏。" },
        "2:1": { "valuePrompt": "使用横向宽幅比例，强调左右叙事与横向连续感。" },
        "2:3": { "valuePrompt": "使用经典竖向比例，兼顾主体完整和信息层级展示。" },
        "3:2": { "valuePrompt": "使用经典横向比例，兼顾主体展示和场景拓展。" },
        "3:4": { "valuePrompt": "使用竖向信息承载比例，适合商品卡与详情流展示。" },
        "4:3": { "valuePrompt": "使用横向信息承载比例，适合多元素组合与并列对比。" },
        "9:16": { "valuePrompt": "使用短视频竖屏比例，保证首屏冲击与主体高识别。" },
        "16:9": { "valuePrompt": "使用视频横屏比例，适合横向叙事和场景铺展。" },
        "18:23": { "valuePrompt": "使用偏长竖向比例，突出主体纵深与分层信息展示。" }
      }
    },
    "videoSceneGridDetailDimensions": {
      "fieldKey": "videoSceneGridDetailDimensions",
      "name": "详细维度",
      "values": {
        "智能识别系列关系": { "valuePrompt": "自动识别同系列内部关系，建立稳定母版语法。" },
        "保留原始风格线索": { "valuePrompt": "保留原始色调、笔触、结构等关键风格线索，避免风格漂移。" },
        "自动补齐系列一致性": { "valuePrompt": "自动补齐组图一致性规则，确保批量输出可连用。" },
        "主体数量变化": { "valuePrompt": "控制主体数量增减的节奏，变化明显但不失去主题辨识。" },
        "主体组合方式": { "valuePrompt": "优化主体组合方式，保证视觉关系清晰且构图稳定。" },
        "主次节奏控制": { "valuePrompt": "在多主体构图中明确主次节奏，防止注意力分散。" },
        "文本位置编排": { "valuePrompt": "文本位置与视觉重心协调，确保图文不打架。" },
        "图文占比控制": { "valuePrompt": "控制图文占比，优先商品/主题可读性。" },
        "标题与主体呼应": { "valuePrompt": "标题语义需与主体视觉一致，不出现语义错位。" },
        "主题方向延展": { "valuePrompt": "围绕主题方向做有边界的延展，确保系列同源。" },
        "统一配色氛围": { "valuePrompt": "维持统一配色与氛围基调，防止颜色体系失控。" },
        "强化视觉母题": { "valuePrompt": "强化母题元素反复出现，增强系列记忆点。" },
        "延展子款内容": { "valuePrompt": "在同主题下扩展子款内容，保持主线不偏离。" },
        "保持套系感": { "valuePrompt": "每张图既有差异又有套系感，适配成组投放。" },
        "控制衍生差异度": { "valuePrompt": "控制衍生差异范围，避免从同系列漂移到不同产品线。" },
        "自动识别主副关系": { "valuePrompt": "自动识别主副图的职责边界，保证信息层级清晰。" },
        "保留核心构图逻辑": { "valuePrompt": "保留核心构图骨架，变化不破坏结构稳定。" },
        "平衡主次视觉权重": { "valuePrompt": "平衡主副视觉权重，确保主图始终承担主表达。" },
        "主图更突出": { "valuePrompt": "强化主图冲击力与主体识别，副图仅作补充。" },
        "副图弱化点缀": { "valuePrompt": "副图作为点缀信息存在，不抢占主图注意力。" },
        "增加留白感": { "valuePrompt": "增加留白与呼吸感，提升整体整洁与高级感。" },
        "增强层次密度": { "valuePrompt": "增强信息层次但保持阅读秩序，避免拥挤混乱。" },
        "补充装饰元素": { "valuePrompt": "装饰元素只用于增强氛围，不可盖住核心主体。" },
        "提升信息丰富度": { "valuePrompt": "提高信息丰富度时仍需保证主表达路径清楚。" },
        "切换主副位置": { "valuePrompt": "切换主副位置后应保持语义连续，不造成理解断裂。" },
        "重构视觉重心": { "valuePrompt": "重构视觉重心但不改变主题主体识别。" },
        "生成反差版式": { "valuePrompt": "生成对比明显的版式差异版本，同时维持系列一致。" },
        "加入故事场景": { "valuePrompt": "加入可解释的故事场景线索，增强叙事连贯性。" },
        "强化角色关系": { "valuePrompt": "强化角色或元素关系，形成清晰互动语义。" },
        "形成视觉引导线": { "valuePrompt": "构建稳定的视觉引导线，让阅读路径自然流动。" },
        "双人关系识别": { "valuePrompt": "准确识别并表达双人配对关系，保持互动自然。" },
        "服装元素呼应": { "valuePrompt": "服装和图案元素需互相呼应，体现情侣配对逻辑。" },
        "互动姿态统一": { "valuePrompt": "互动姿态与肢体关系统一，避免结构错位与违和。" }
      }
    }
  }
}
```

### 最终拼装顺序
1. `task`
2. `productCategory`
3. `mode`
4. `params`
5. `variation`
6. `ratio`
7. `detailDimensions`
8. `required`
9. `categoryRequired`
10. `categoryForbidden`
11. `forbidden`
12. `universalNegativePrompt`
13. `universalQualityPrompt`
14. `supplement`

## 完整 Prompt 模板
下面是最终提交给模型的生成提示词模板。花括号中的字段都是实际参与替换的字段，不是示意写法。

本模板实际使用的字段包括：`productCategory`、`categoryPrompt`、`modePrompt`、`videoSceneGridMode`、`videoSceneGridVariation`、`videoSceneGridDetailDimensions`、`videoSceneGridRatio`、`videoSceneGridOutputCount`、`variationValuePrompt`、`ratioValuePrompt`、`detailDimensionPromptsJoined`、`modeRequiredJoined`、`categoryRequiredJoined`、`categoryForbiddenJoined`、`modeForbiddenJoined`、`universalNegativePrompt`、`universalQualityPrompt`、`supplement`。

```text
任务目标：基于同一主题生成可成组使用的多联画，保证组内风格一致、变化清晰、可直接用于电商/POD场景投放。

品类：当前品类为「{productCategory}」

品类说明：{categoryPrompt}

品类正向约束：{categoryRequiredJoined}

品类负向约束：{categoryForbiddenJoined}

模式：{videoSceneGridMode}

模式说明：{modePrompt}

模式正向约束：{modeRequiredJoined}

模式负向约束：{modeForbiddenJoined}

多联画参数：变化维度={videoSceneGridMode}；变化方向={videoSceneGridVariation}；详细维度={videoSceneGridDetailDimensions}；出图比例={videoSceneGridRatio}；生图数量={videoSceneGridOutputCount}。

变化方向扩展：{variationValuePrompt}

比例扩展：{ratioValuePrompt}

详细维度扩展：{detailDimensionPromptsJoined}

{universalNegativePrompt}

{universalQualityPrompt}

补充说明：{supplement}
```

完整 Prompt 模板占位字段说明：
```json
{
  "templateFields": [
    "productCategory",
    "categoryPrompt",
    "modePrompt",
    "videoSceneGridMode",
    "videoSceneGridVariation",
    "videoSceneGridDetailDimensions",
    "videoSceneGridRatio",
    "videoSceneGridOutputCount",
    "variationValuePrompt",
    "ratioValuePrompt",
    "detailDimensionPromptsJoined",
    "modeRequiredJoined",
    "categoryRequiredJoined",
    "categoryForbiddenJoined",
    "modeForbiddenJoined",
    "universalNegativePrompt",
    "universalQualityPrompt",
    "supplement"
  ],
  "fieldMap": {
    "productCategory": "当前品类字段，优先级=用户手动指定 > 上游链路传入 > 图片识别结果 > 通用",
    "categoryPrompt": "categoryRulesByTool[productCategory].prompt，未命中时回退 categoryRulesByTool['通用'].prompt",
    "categoryRequiredJoined": "categoryRulesByTool[productCategory].required 按 '；' 连接，未命中时回退通用品类规则",
    "categoryForbiddenJoined": "categoryRulesByTool[productCategory].forbidden 按 '；' 连接，未命中时回退通用品类规则",
    "videoSceneGridMode": "当前选择的变化维度原值",
    "modePrompt": "modeRulesByTool[videoSceneGridMode].prompt",
    "modeRequiredJoined": "modeRulesByTool[videoSceneGridMode].required 按 '；' 连接",
    "modeForbiddenJoined": "modeRulesByTool[videoSceneGridMode].forbidden 按 '；' 连接",
    "variationValuePrompt": "optionValueExpansions.videoSceneGridVariation.values[videoSceneGridVariation].valuePrompt",
    "ratioValuePrompt": "optionValueExpansions.videoSceneGridRatio.values[videoSceneGridRatio].valuePrompt",
    "videoSceneGridDetailDimensions": "内部派生字段；来源=videoSceneGridMode + videoSceneGridVariation 联动结果",
    "detailDimensionPromptsJoined": "按当前详细维度列表逐项映射 optionValueExpansions.videoSceneGridDetailDimensions.values[detailDimension].valuePrompt 后按 '；' 连接",
    "universalNegativePrompt": "通用负向约束固定文案",
    "universalQualityPrompt": "通用质量要求固定文案",
    "supplement": "用户补充描述；为空时传空字符串，不删模板段位"
  }
}
```

## 开发要求
1. 切换 `videoSceneGridMode` 后，`videoSceneGridVariation` 必须回退到该模式下的首个合法值。
2. `videoSceneGridDetailDimensions` 不允许作为自由输入字段。
3. `categoryPrompt / categoryRequired / categoryForbidden / modePrompt / modeRequired / modeForbidden / 通用负向 / 通用质量` 为不可裁剪段。
4. `productCategory + categoryPrompt` 必须进入最终 prompt，未命中时回退到 `通用`。
5. 任务快照建议持久化：`productCategory / videoSceneGridMode / videoSceneGridVariation / videoSceneGridDetailDimensions / videoSceneGridRatio / videoSceneGridOutputCount / finalPrompt`。

## 附录A：完整模式规则
```json
{
  "modeRulesByTool": {
    "系列图案": {
      "ruleLevel": "A",
      "prompt": "围绕同一主题生成系列化图案，强调套系一致性、风格连贯性与可扩展性，允许在主体、主题、图文关系上做可控变化。",
      "required": ["组内视觉风格统一", "变化点可被明确识别", "保留主题核心识别特征", "适合批量成组展示"],
      "forbidden": ["组图风格随机漂移", "图案主题互相冲突", "变化无规律导致系列不可用", "过度复杂导致信息不可读"]
    },
    "主副图案": {
      "ruleLevel": "A",
      "prompt": "围绕主图与副图关系构建成组画面，主图负责核心表达，副图承担补充信息，确保主次清晰且具备电商信息承载能力。",
      "required": ["主副层级清晰", "主图主体识别稳定", "副图补充信息有效", "组内构图逻辑一致"],
      "forbidden": ["主副角色混乱", "副图喧宾夺主", "核心信息分散无法读取", "版式跳变导致组图失序"]
    },
    "情侣图案": {
      "ruleLevel": "A",
      "prompt": "围绕双主体关系生成情侣向成组图案，重点保证双人互动语义、元素呼应与姿态关系统一，输出应具备配对展示价值。",
      "required": ["双主体关系一致", "互动语义明确", "元素呼应自然", "组图风格统一"],
      "forbidden": ["双主体风格断裂", "关系表达模糊", "姿态或结构失真", "配对逻辑不成立"]
    }
  },
  "universalNegativePrompt": "通用负向约束：1. 严禁生成与原主题无关的新主体或新SKU。2. 严禁出现低质量AI伪影（结构错位、边缘融化、脏噪点、重影）。3. 严禁组图之间风格断裂、色调失控、光影不连续。4. 严禁误导性图文表达、侵权标识、水印、二维码、联系方式。5. 严禁为了变化而破坏可读性与商业可用性。",
  "universalQualityPrompt": "通用质量要求：1. 组内一致性：色彩、质感、光线、镜头语言统一。2. 变化可感知：每张图的差异清晰且可解释。3. 主体可信：结构、比例、材质与主题一致。4. 商业可用：缩略图和详情页下都能稳定识别。5. 可复用：结果可直接进入电商/POD后续排版链路。"
}
```

## 附录B：完整选项提示词
### `videoSceneGridVariation`
1. `智能参考`：根据当前主题自动选择最合理的变化策略，优先保证组内统一和可读性。
2. `裂变主体`：围绕主体数量、组合和主次关系做变化，确保主体识别稳定。
3. `裂变主体/文本`：同步处理图形主体与文本层级，保持图文关系清晰、可读、可复用。
4. `裂变主题`：在保留主题母体的前提下延展不同子主题，保证同源感与差异感平衡。
5. `系列衍生`：产出可连续上新的系列衍生版本，风格一致且每张有明确变化点。
6. `简洁`：减少装饰密度和干扰元素，突出主体轮廓与主副关系，提升浏览效率。
7. `丰富`：增强层次与信息密度，但要保持主次清晰，避免复杂堆砌。
8. `反转`：通过主副互换或重心迁移形成反差版式，反转后仍需保证信息可读。
9. `叙事性`：加入故事线索与视觉引导路径，让组图呈现连续阅读体验。

### `videoSceneGridRatio`
1. `自动检测比例`：根据主题自动匹配最合适比例，优先保证主体完整与组图一致性。
2. `1:1`：使用方图比例，强调中心构图与平台通用兼容性。
3. `1:2`：使用纵向窄幅比例，注意主体纵向延展与上下节奏。
4. `2:1`：使用横向宽幅比例，强调左右叙事与横向连续感。
5. `2:3`：使用经典竖向比例，兼顾主体完整和信息层级展示。
6. `3:2`：使用经典横向比例，兼顾主体展示和场景拓展。
7. `3:4`：使用竖向信息承载比例，适合商品卡与详情流展示。
8. `4:3`：使用横向信息承载比例，适合多元素组合与并列对比。
9. `9:16`：使用短视频竖屏比例，保证首屏冲击与主体高识别。
10. `16:9`：使用视频横屏比例，适合横向叙事和场景铺展。
11. `18:23`：使用偏长竖向比例，突出主体纵深与分层信息展示。

### `videoSceneGridDetailDimensions`
1. `智能识别系列关系`：自动识别同系列内部关系，建立稳定母版语法。
2. `保留原始风格线索`：保留原始色调、笔触、结构等关键风格线索，避免风格漂移。
3. `自动补齐系列一致性`：自动补齐组图一致性规则，确保批量输出可连用。
4. `主体数量变化`：控制主体数量增减的节奏，变化明显但不失去主题辨识。
5. `主体组合方式`：优化主体组合方式，保证视觉关系清晰且构图稳定。
6. `主次节奏控制`：在多主体构图中明确主次节奏，防止注意力分散。
7. `文本位置编排`：文本位置与视觉重心协调，确保图文不打架。
8. `图文占比控制`：控制图文占比，优先商品/主题可读性。
9. `标题与主体呼应`：标题语义需与主体视觉一致，不出现语义错位。
10. `主题方向延展`：围绕主题方向做有边界的延展，确保系列同源。
11. `统一配色氛围`：维持统一配色与氛围基调，防止颜色体系失控。
12. `强化视觉母题`：强化母题元素反复出现，增强系列记忆点。
13. `延展子款内容`：在同主题下扩展子款内容，保持主线不偏离。
14. `保持套系感`：每张图既有差异又有套系感，适配成组投放。
15. `控制衍生差异度`：控制衍生差异范围，避免从同系列漂移到不同产品线。
16. `自动识别主副关系`：自动识别主副图的职责边界，保证信息层级清晰。
17. `保留核心构图逻辑`：保留核心构图骨架，变化不破坏结构稳定。
18. `平衡主次视觉权重`：平衡主副视觉权重，确保主图始终承担主表达。
19. `主图更突出`：强化主图冲击力与主体识别，副图仅作补充。
20. `副图弱化点缀`：副图作为点缀信息存在，不抢占主图注意力。
21. `增加留白感`：增加留白与呼吸感，提升整体整洁与高级感。
22. `增强层次密度`：增强信息层次但保持阅读秩序，避免拥挤混乱。
23. `补充装饰元素`：装饰元素只用于增强氛围，不可盖住核心主体。
24. `提升信息丰富度`：提高信息丰富度时仍需保证主表达路径清楚。
25. `切换主副位置`：切换主副位置后应保持语义连续，不造成理解断裂。
26. `重构视觉重心`：重构视觉重心但不改变主题主体识别。
27. `生成反差版式`：生成对比明显的版式差异版本，同时维持系列一致。
28. `加入故事场景`：加入可解释的故事场景线索，增强叙事连贯性。
29. `强化角色关系`：强化角色或元素关系，形成清晰互动语义。
30. `形成视觉引导线`：构建稳定的视觉引导线，让阅读路径自然流动。
31. `双人关系识别`：准确识别并表达双人配对关系，保持互动自然。
32. `服装元素呼应`：服装和图案元素需互相呼应，体现情侣配对逻辑。
33. `互动姿态统一`：互动姿态与肢体关系统一，避免结构错位与违和。

## 附录C：完整品类规则
### `服装/纺织`
- `prompt`：适配服装与纺织印花套系展示，强调系列花型的统一节奏、远观识别度和大面积排版后的耐看性，避免元素过碎导致成衣上身后失焦。
- `required`：套系关系清楚；远看识别强；大面积排版后不空不乱。
- `forbidden`：元素过碎；组图风格断裂；成衣视角下主图失焦。
- `recommendedMode`：`系列图案`
- `recommendedVariations`：`裂变主题 / 系列衍生 / 智能参考`
- `recommendedRatios`：`1:1 / 3:4 / 2:3`

### `手机壳`
- `prompt`：适配手机壳小尺寸印花与缩略图浏览，强调中心主体聚焦、边缘完整和视觉高对比，避免核心元素落入开孔、边框或圆角高风险区域。
- `required`：中心主体明确；缩略图下仍清晰；边缘兼容壳体裁切。
- `forbidden`：主体贴近开孔区；四角核心元素被切断；细节过密导致发脏。
- `recommendedMode`：`主副图案`
- `recommendedVariations`：`简洁 / 反转 / 智能参考`
- `recommendedRatios`：`1:2 / 3:4 / 1:1`

### `装饰画`
- `prompt`：适配装饰画远观冲击和近观细节并重的展示目标，强调构图完整、主题清晰和成组叙事关系，允许更强的氛围与层次表达。
- `required`：构图完整；主次清晰；成组展示有明确变化感。
- `forbidden`：变化过弱；远观无冲击；高层次叙事但主视觉丢失。
- `recommendedMode`：`系列图案`
- `recommendedVariations`：`裂变主题 / 系列衍生 / 叙事性`
- `recommendedRatios`：`3:4 / 4:3 / 16:9`

### `情侣/成对载体`
- `prompt`：适配情侣衫、情侣杯、成对挂画等成对载体，强调双主体的关系呼应、互动一致性和配对逻辑，避免两张图像只是随机并列。
- `required`：双主体关系成立；互动语义自然；配对逻辑清楚。
- `forbidden`：两张图随机并列；双边风格不统一；单边视觉过强导致失衡。
- `recommendedMode`：`情侣图案`
- `recommendedVariations`：`智能参考`
- `recommendedRatios`：`1:1 / 3:4 / 2:3`

### `通用`
- `prompt`：按通用成组视觉标准执行，优先保证组内统一、变化清晰和后续排版可复用性。
- `required`：组内风格统一；变化方向可解释；后续排版可复用。
- `forbidden`：随机拼接感；变化无主线；商业可用性下降。
- `recommendedMode`：`系列图案`
- `recommendedVariations`：`智能参考 / 裂变主题`
- `recommendedRatios`：`1:1 / 3:4 / 4:3`

## 附录D：Prompt 组装要求
```json
{
  "requiredFields": [
    "toolKey",
    "productCategory",
    "videoSceneGridMode",
    "videoSceneGridVariation",
    "videoSceneGridDetailDimensions",
    "videoSceneGridRatio",
    "videoSceneGridOutputCount"
  ],
  "optionalFields": [
    "videoSceneGridUnitCreditCost",
    "videoSceneGridTotalCreditCost",
    "supplement"
  ],
  "segmentOrder": [
    "task",
    "productCategory",
    "mode",
    "params",
    "variation",
    "ratio",
    "detailDimensions",
    "required",
    "forbidden",
    "universalNegativePrompt",
    "universalQualityPrompt",
    "supplement"
  ],
  "strictMode": {
    "onMissingProductCategoryRule": "warn_and_fallback_to_general",
    "onMissingModeRule": "error",
    "onMissingRequiredField": "error",
    "onUnknownVariation": "error",
    "onUnknownRatio": "error",
    "onUnknownDetailDimension": "warn_and_skip"
  }
}
```
