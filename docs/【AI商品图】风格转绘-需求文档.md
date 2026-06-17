# 【AI商品图】风格转绘-需求文档

## 功能目的
风格转绘用于在保持原始素材主体结构、识别特征和核心语义稳定的前提下，把图像转换成指定视觉风格。它的核心目标不是简单套滤镜，而是让结果既命中目标风格，又保留商品、图案或主体本身的可识别性，适合用于风格稿、工艺预览、印花风格化和商品视觉升级等场景。

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

## 功能字段

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

## 图片识别提示词
用于在用户上传素材后，自动识别更适合的 `productCategory`，并回填默认风格分类和默认比例。

### 识别目标
1. 识别最适合的 `productCategory`。
2. 为风格分类推荐和结构风控提供依据。
3. 识别失败时回退到 `通用`。

### 输出字段
```json
{
  "productCategory": "服装/纺织|手机壳|家电数码类|装饰画|挂钟|人像/宠物|铁艺图形/五金|通用",
  "confidence": 0.0,
  "needsUserConfirm": false,
  "reason": "简要判断原因",
  "evidence": ["证据1", "证据2"]
}
```

### 识别提示词
```text
你是一名 POD 风格转绘品类识别助手。请根据用户上传的素材图，判断该图更适合落入哪一种风格转绘品类，用于回填 productCategory。

任务要求：
1. 只能从以下枚举中选择 1 个 productCategory：
服装/纺织、手机壳、家电数码类、装饰画、挂钟、人像/宠物、铁艺图形/五金、通用
2. 结合主体类型、结构复杂度、材质语义、人物/宠物特征和常见商品属性判断最适合的品类。
3. 若主体是明确的人像、宠物、脸部或高识别生物主体，可优先判断为“人像/宠物”。
4. 若主体是明显结构型、接口型、金属型商品，可优先判断为“家电数码类”或“铁艺图形/五金”。
5. 若无法稳定判断，必须返回“通用”，且 confidence 不高于 0.55。
6. 仅输出 JSON，不输出解释性文本，不输出 Markdown。

输出 JSON Schema：
{
  "productCategory": "服装/纺织|手机壳|家电数码类|装饰画|挂钟|人像/宠物|铁艺图形/五金|通用",
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
+ `video2d3dStyle` 必须受 `video2d3dStyleCategory` 约束，不能提交分类之外的风格值
+ 总积分=`上传数 * 出图数量 * 5`

## 积分规则
1. 风格转绘按最终出图张数计费，不按风格分类或具体风格额外乘倍率。
2. `video2d3dOutputCount` 表示每张上传素材最终要输出的结果数量。
3. 单张结果图单价为 5 积分。
4. 总积分计算公式为：`上传数 * video2d3dOutputCount * 5`。
5. `styleCategory` 和 `style` 只影响生成内容，不影响单张计费单价。

## 任务拆分规则
1. 一个提交请求对应一个任务组。
2. 任务组内按上传素材逐张拆分子任务。
3. 每张上传素材只命中一个 `styleCategory + style + ratio` 组合，不按风格样式额外拆多个任务组。
4. `video2d3dOutputCount` 表示单个子任务需要返回的结果数量，不表示要拆多个业务任务组。
5. 推荐做法是：
   - 任务组维度：一次提交
   - 子任务维度：每张上传素材
   - 子任务结果数：`video2d3dOutputCount`
6. 若后续产品支持一次勾选多个具体风格，则应改为按“上传素材 * 风格”拆分子任务；当前真实功能下不需要这样拆。

## 模式规则与选项提示词
开发实现时必须按 `prompt + required + forbidden` 完整消费；其中分类级主规则决定风格语义边界：

```json
{
  "modeRulesByCategory": {
    "全部": {
      "prompt": "基于上传素材执行风格转绘，优先保持原图主体语义、构图骨架和关键识别元素，再稳定转成指定视觉风格。",
      "required": ["主体结构和识别信息保持稳定", "目标风格特征明确可辨", "材质、线条、笔触或工艺效果符合所选风格语义", "输出具备商业可用性与POD预览可读性"],
      "forbidden": ["主体漂移成无关内容", "风格不明显或混入冲突画风", "边缘融化、细节塌陷、文字图形不可辨认", "为追求风格效果破坏商品结构"]
    },
    "原始3D风格": { "prompt": "将原图转绘为具备体积感、材质层次和工艺深度的3D/浮雕类表现，重点强化厚度、起伏和立体工艺语义。" },
    "线描手稿": { "prompt": "将原图转绘为线描、速写、素描等手稿表达，重点保留结构骨架、轮廓节奏和线性层次。" },
    "插画卡通": { "prompt": "将原图转绘为插画和卡通表达，重点明确造型概括、配色体系和视觉亲和力。" },
    "水彩油画": { "prompt": "将原图转绘为水彩、油画和手绘颜料类表达，重点强化笔触、层次和颜色氛围。" },
    "工艺材质": { "prompt": "将原图转绘为刺绣、植绒、皮质、玻璃、编织等工艺材质表现，重点保留材质触感和工艺细节。" },
    "设计风格": { "prompt": "将原图转绘为具有明确设计语言的风格化表达，重点控制形式感、装饰节奏和整体完成度。" },
    "人像宠物": { "prompt": "将原图转绘为适合人像或宠物题材的风格化肖像表达，重点保证身份识别、轮廓特征和气质一致性。" }
  }
}
```

```json
{
  "universalNegativePrompt": "通用负向约束：1. 严禁改变主体核心结构、SKU含义和关键识别信息。2. 严禁风格混乱、边缘融化、低清噪点、涂抹感和局部塌陷。3. 严禁文字、Logo、图形在转绘后变成不可辨认乱码。4. 严禁生成侵权角色、品牌标识或与原图无关主体。",
  "universalQualityPrompt": "通用质量要求：1. 保真性：原图主体、构图重心和识别特征稳定。2. 风格性：目标风格清晰明确，不是弱滤镜。3. 清晰度：边缘、纹理、笔触和材质层次可辨。4. 可用性：结果可直接用于POD风格稿、视觉预览或后续设计链路。5. 一致性：同批次风格完成度稳定。"
}
```

1. 当前功能必须保留完整通用负向约束与通用质量约束，用于统一约束主体保真、风格稳定和清晰度。
2. 分类级 `required / forbidden` 是最直接影响风格转绘稳定性的正向/负向约束，不能省略。
3. 品类规则只补充“按品类的适配性与风险”，不替代全局负向和质量约束。

## 品类差异配置方案
风格转绘需要补品类差异，但重点不是“限制所有风格”，而是补 `风格适配推荐 + 结构风险约束 + 高风险组合提醒`。

这部分的作用分为 4 层：
1. 给不同品类推荐默认风格分类。
2. 标记某些品类下不建议优先使用的风格分类。
3. 把品类约束写进最终 prompt，包括品类说明、品类必须满足项、品类禁止项。
4. 对明显不合理的品类和风格分类组合给出提醒。

### 品类字段来源与回填规则
```json
{
  "productCategory": {
    "source": "上游业务传入、图片识别结果或用户手动指定",
    "allowedValues": ["服装/纺织", "手机壳", "家电数码类", "装饰画", "挂钟", "人像/宠物", "铁艺图形/五金", "通用"],
    "fallback": "通用",
    "manualOverrideRule": "用户手动指定优先于自动识别结果"
  }
}
```

### 推荐默认值
默认推荐值从“当前功能的品类规则”中获取。系统先确定 `productCategory`，再按该品类命中的规则回填默认风格分类和默认比例；如果没有命中明确品类，则回退使用 `通用` 的默认值。推荐默认值只用于首屏回填和辅助推荐，不覆盖用户手动修改。

```json
{
  "recommendedDefaultsByCategory": {
    "服装/纺织": { "styleCategory": "工艺材质", "ratio": "3:4" },
    "手机壳": { "styleCategory": "设计风格", "ratio": "3:4" },
    "家电数码类": { "styleCategory": "原始3D风格", "ratio": "1:1" },
    "装饰画": { "styleCategory": "水彩油画", "ratio": "3:4" },
    "挂钟": { "styleCategory": "设计风格", "ratio": "1:1" },
    "人像/宠物": { "styleCategory": "人像宠物", "ratio": "1:1" },
    "铁艺图形/五金": { "styleCategory": "原始3D风格", "ratio": "1:1" },
    "通用": { "styleCategory": "设计风格", "ratio": "1:1" }
  }
}
```

### 完整品类规则
```json
{
  "categoryRulesByTool": {
    "服装/纺织": {
      "prompt": "适配服装与纺织图案转绘，强调面料纹理、布面褶皱和印花结构稳定，避免风格化后把织物转成塑料、金属或失真厚涂材质。",
      "required": ["面料语义保留", "印花结构稳定", "风格化后仍适合布面呈现"],
      "forbidden": ["塑料感", "金属感误植", "厚重3D材质破坏布面逻辑"],
      "recommendedStyleCategories": ["工艺材质", "插画卡通", "水彩油画", "线描手稿"],
      "recommendedRatios": ["3:4", "1:1", "2:3"],
      "avoidStyleCategories": ["原始3D风格"]
    },
    "手机壳": {
      "prompt": "适配手机壳图案和壳面预览转绘，强调中心主体聚焦、缩略图识别和边缘干净，避免过密风格效果淹没小尺寸可读性。",
      "required": ["中心主体稳定", "缩略图识别清楚", "边缘干净"],
      "forbidden": ["过密纹理发脏", "小尺寸不可读", "边缘糊化"],
      "recommendedStyleCategories": ["设计风格", "插画卡通", "线描手稿"],
      "recommendedRatios": ["3:4", "1:2", "1:1"],
      "avoidStyleCategories": []
    },
    "家电数码类": {
      "prompt": "适配数码和结构型商品转绘，强调接口、边缘、按键、模组和体积结构保持准确，避免风格化后变形或失去工业感。",
      "required": ["结构准确", "接口按键可辨识", "工业感不丢失"],
      "forbidden": ["接口变形", "边缘塌陷", "幼态化卡通削弱结构"],
      "recommendedStyleCategories": ["原始3D风格", "线描手稿", "设计风格"],
      "recommendedRatios": ["1:1", "4:3", "3:4"],
      "avoidStyleCategories": ["人像宠物"]
    },
    "装饰画": {
      "prompt": "适配装饰画和画面型主体转绘，强调主题叙事、层次和观赏完成度，允许更强氛围化风格但不能破坏主视觉识别。",
      "required": ["主题叙事完整", "氛围强化但主视觉稳定", "观赏完成度高"],
      "forbidden": ["主体辨识度下降", "色层发脏", "风格化后画面塌陷"],
      "recommendedStyleCategories": ["水彩油画", "设计风格", "插画卡通", "原始3D风格"],
      "recommendedRatios": ["3:4", "4:3", "16:9"],
      "avoidStyleCategories": []
    },
    "挂钟": {
      "prompt": "适配挂钟盘面与中心对齐语义的风格转绘，强调中心区域稳定、径向平衡和圆形边界秩序，不让风格特效破坏钟面主阅读逻辑。",
      "required": ["中心区域稳定", "圆形边界秩序清楚", "径向关系平衡"],
      "forbidden": ["中心失衡", "边界秩序被特效冲散", "无中心方向的混乱泼墨"],
      "recommendedStyleCategories": ["原始3D风格", "设计风格", "工艺材质"],
      "recommendedRatios": ["1:1", "4:5", "5:4"],
      "avoidStyleCategories": []
    },
    "人像/宠物": {
      "prompt": "适配人像或宠物主题转绘，强调身份特征、轮廓、毛发/五官/表情和气质的一致性，避免风格化后身份漂移。",
      "required": ["身份特征稳定", "五官或毛发识别清楚", "神态气质一致"],
      "forbidden": ["身份漂移", "五官错位", "表情结构崩坏"],
      "recommendedStyleCategories": ["人像宠物", "线描手稿", "插画卡通", "水彩油画"],
      "recommendedRatios": ["1:1", "3:4", "4:5"],
      "avoidStyleCategories": ["原始3D风格"]
    },
    "铁艺图形/五金": {
      "prompt": "适配铁艺图形和五金结构型主体转绘，强调几何秩序、金属边缘和结构稳定，不应使用过软或过糯的材质风格掩盖结构。",
      "required": ["几何秩序稳定", "金属边缘清楚", "结构硬度保留"],
      "forbidden": ["过软材质感", "水彩晕染弱化结构", "金属边缘融化"],
      "recommendedStyleCategories": ["原始3D风格", "线描手稿", "设计风格"],
      "recommendedRatios": ["1:1", "4:3", "16:9"],
      "avoidStyleCategories": ["水彩油画"]
    },
    "通用": {
      "prompt": "按通用风格转绘标准执行，优先保证主体保真、风格明确和可用性稳定。",
      "required": ["主体保真", "风格命中明确", "输出可直接使用"],
      "forbidden": ["主体漂移", "风格混乱", "输出不稳定"],
      "recommendedStyleCategories": ["设计风格", "插画卡通", "线描手稿"],
      "recommendedRatios": ["1:1", "3:4", "4:3"],
      "avoidStyleCategories": []
    }
  }
}
```

### 字段联动与提示词消费规则
1. `video2d3dStyle` 必须严格受 `video2d3dStyleCategory` 约束，分类切换后当前风格不合法时必须自动回退到新分类首个合法值。
2. `video2d3dStyleCategory`、`video2d3dStyle`、`video2d3dRatio`、`video2d3dOutputCount` 都必须逐值消费 `valuePrompt`。
3. `productCategory` 参与：
   - 默认风格分类和比例推荐
   - prompt 注入：注入 `categoryPrompt / categoryRequired / categoryForbidden`
   - warning 提示：对高风险品类和风格分类组合提示
5. 默认值获取顺序为：用户手动指定品类 > 业务链路传入品类 > 图片识别品类 > `通用` 回退。
4. 品类规则只负责“按品类的适配性与结构风险”，不替代风格分类本身的 mode rule 和全局负向/质量约束。

### Warning 规则
1. `家电数码类 x 人像宠物`：给 warning，除非素材本身就是人像/宠物主体。
2. `铁艺图形/五金 x 水彩油画`：给 warning，提示可能弱化结构硬度。
3. `服装/纺织 x 原始3D风格`：给 warning，提示可能破坏面料语义。

开发要求：
1. `categoryPrompt` 插入在 `task` 后、`category` 前。
2. 推荐风格分类只用于默认值回填和提示，不应覆盖用户手动选择。
3. 对 `家电数码类 x 人像宠物`、`铁艺图形/五金 x 水彩油画` 等组合给 warning。
4. `productCategory + categoryPrompt` 必须进入最终 prompt，未命中时回退到 `通用`。

```json
{
  "optionValueExpansions": {
    "video2d3dStyleCategory": {
      "fieldKey": "video2d3dStyleCategory",
      "name": "风格分类",
      "rule": "每个分类均有独立 valuePrompt"
    },
    "video2d3dStyle": {
      "fieldKey": "video2d3dStyle",
      "name": "具体风格",
      "rule": "所有具体风格均有独立 valuePrompt"
    },
    "video2d3dRatio": {
      "fieldKey": "video2d3dRatio",
      "name": "出图比例",
      "rule": "每个比例均有独立 valuePrompt"
    },
    "video2d3dOutputCount": {
      "fieldKey": "video2d3dOutputCount",
      "name": "出图数量",
      "rule": "每个数量档位均有独立 valuePrompt"
    }
  }
}
```

### 最终拼装顺序
1. `task`
2. `productCategory`
3. `category`
4. `params`
5. `categoryValue`
6. `styleValue`
7. `ratioValue`
8. `countValue`
9. `required`
10. `categoryRequired`
11. `categoryForbidden`
12. `forbidden`
13. `universalNegativePrompt`
14. `universalQualityPrompt`
15. `supplement`

## 完整 Prompt 模板
下面是最终提交给模型的生成提示词模板。花括号中的字段都是实际参与替换的字段，不是示意写法。

本模板实际使用的字段包括：`productCategory`、`categoryPrompt`、`styleCategoryPrompt`、`video2d3dStyleCategory`、`video2d3dStyle`、`video2d3dRatio`、`video2d3dOutputCount`、`styleCategoryValuePrompt`、`styleValuePrompt`、`ratioValuePrompt`、`outputCountValuePrompt`、`requiredJoined`、`categoryRequiredJoined`、`categoryForbiddenJoined`、`forbiddenJoined`、`universalNegativePrompt`、`universalQualityPrompt`、`supplement`。

```text
任务目标：基于上传素材执行风格转绘，在保持原图主体结构和识别特征稳定的前提下，输出命中指定风格的高质量结果。

品类：当前主体品类为「{productCategory}」

品类说明：{categoryPrompt}

品类正向约束：{categoryRequiredJoined}

品类负向约束：{categoryForbiddenJoined}

风格分类：{video2d3dStyleCategory}

分类说明：{styleCategoryPrompt}

分类正向约束：{requiredJoined}

分类负向约束：{forbiddenJoined}

转绘参数：风格分类={video2d3dStyleCategory}；具体风格={video2d3dStyle}；出图比例={video2d3dRatio}；出图数量={video2d3dOutputCount}。

分类扩展：{styleCategoryValuePrompt}

风格扩展：{styleValuePrompt}

比例扩展：{ratioValuePrompt}

数量扩展：{outputCountValuePrompt}

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
    "styleCategoryPrompt",
    "video2d3dStyleCategory",
    "video2d3dStyle",
    "video2d3dRatio",
    "video2d3dOutputCount",
    "styleCategoryValuePrompt",
    "styleValuePrompt",
    "ratioValuePrompt",
    "outputCountValuePrompt",
    "requiredJoined",
    "categoryRequiredJoined",
    "categoryForbiddenJoined",
    "forbiddenJoined",
    "universalNegativePrompt",
    "universalQualityPrompt",
    "supplement"
  ],
  "fieldMap": {
    "productCategory": "当前品类字段，优先级=用户手动指定 > 上游链路传入 > 图片识别结果 > 通用",
    "categoryPrompt": "categoryRulesByTool[productCategory].prompt，未命中时回退 categoryRulesByTool['通用'].prompt",
    "categoryRequiredJoined": "categoryRulesByTool[productCategory].required 按 '；' 连接，未命中时回退通用品类规则",
    "categoryForbiddenJoined": "categoryRulesByTool[productCategory].forbidden 按 '；' 连接，未命中时回退通用品类规则",
    "video2d3dStyleCategory": "当前选择的风格分类原值",
    "styleCategoryPrompt": "modeRulesByCategory[video2d3dStyleCategory].prompt，未命中时回退 modeRulesByCategory['全部'].prompt",
    "requiredJoined": "modeRulesByCategory['全部'].required 按 '；' 连接",
    "forbiddenJoined": "modeRulesByCategory['全部'].forbidden 按 '；' 连接",
    "styleCategoryValuePrompt": "optionValueExpansions.video2d3dStyleCategory.values[video2d3dStyleCategory].valuePrompt",
    "styleValuePrompt": "optionValueExpansions.video2d3dStyle.values[video2d3dStyle].valuePrompt",
    "ratioValuePrompt": "optionValueExpansions.video2d3dRatio.values[video2d3dRatio].valuePrompt",
    "outputCountValuePrompt": "optionValueExpansions.video2d3dOutputCount.values[video2d3dOutputCount].valuePrompt",
    "universalNegativePrompt": "通用负向约束固定文案",
    "universalQualityPrompt": "通用质量要求固定文案",
    "supplement": "用户补充描述；为空时传空字符串，不删模板段位"
  }
}
```

## 开发要求
1. `video2d3dStyleCategory` 切换后，若当前 `video2d3dStyle` 不在新分类中，必须自动回退。
2. 后端校验时需校验 `style` 是否属于 `styleCategory` 的合法子集。
3. 风格库建议独立维护成配置，避免散落在代码中做硬编码判断。
4. 任务快照建议持久化：`productCategory / video2d3dStyleCategory / video2d3dStyle / video2d3dRatio / video2d3dOutputCount / finalPrompt`。
5. `categoryPrompt / categoryRequired / categoryForbidden / styleCategoryPrompt / required / forbidden / universalNegativePrompt / universalQualityPrompt` 为不可裁剪段。

## 附录A：完整模式规则
```json
{
  "modeRulesByCategory": {
    "全部": {
      "ruleLevel": "A",
      "prompt": "基于上传素材执行风格转绘，优先保持原图主体语义、构图骨架和关键识别元素，再稳定转成指定视觉风格。",
      "required": [
        "主体结构和识别信息保持稳定",
        "目标风格特征明确可辨",
        "材质、线条、笔触或工艺效果符合所选风格语义",
        "输出具备商业可用性与POD预览可读性"
      ],
      "forbidden": [
        "主体漂移成无关内容",
        "风格不明显或混入冲突画风",
        "边缘融化、细节塌陷、文字图形不可辨认",
        "为追求风格效果破坏商品结构"
      ]
    },
    "原始3D风格": { "ruleLevel": "A", "prompt": "将原图转绘为具备体积感、材质层次和工艺深度的3D/浮雕类表现，重点强化厚度、起伏和立体工艺语义。" },
    "线描手稿": { "ruleLevel": "A", "prompt": "将原图转绘为线描、速写、素描等手稿表达，重点保留结构骨架、轮廓节奏和线性层次。" },
    "插画卡通": { "ruleLevel": "A", "prompt": "将原图转绘为插画和卡通表达，重点明确造型概括、配色体系和视觉亲和力。" },
    "水彩油画": { "ruleLevel": "A", "prompt": "将原图转绘为水彩、油画和手绘颜料类表达，重点强化笔触、层次和颜色氛围。" },
    "工艺材质": { "ruleLevel": "A", "prompt": "将原图转绘为刺绣、植绒、皮质、玻璃、编织等工艺材质表现，重点保留材质触感和工艺细节。" },
    "设计风格": { "ruleLevel": "A", "prompt": "将原图转绘为具有明确设计语言的风格化表达，重点控制形式感、装饰节奏和整体完成度。" },
    "人像宠物": { "ruleLevel": "A", "prompt": "将原图转绘为适合人像或宠物题材的风格化肖像表达，重点保证身份识别、轮廓特征和气质一致性。" }
  },
  "universalNegativePrompt": "通用负向约束：1. 严禁改变主体核心结构、SKU含义和关键识别信息。2. 严禁风格混乱、边缘融化、低清噪点、涂抹感和局部塌陷。3. 严禁文字、Logo、图形在转绘后变成不可辨认乱码。4. 严禁生成侵权角色、品牌标识或与原图无关主体。",
  "universalQualityPrompt": "通用质量要求：1. 保真性：原图主体、构图重心和识别特征稳定。2. 风格性：目标风格清晰明确，不是弱滤镜。3. 清晰度：边缘、纹理、笔触和材质层次可辨。4. 可用性：结果可直接用于POD风格稿、视觉预览或后续设计链路。5. 一致性：同批次风格完成度稳定。"
}
```

## 附录B：完整选项提示词
### `video2d3dStyleCategory`
1. `全部`：在全量风格库中执行所选具体风格，优先保证风格命中明确且主体保真。
2. `原始3D风格`：突出体积感、工艺深度、浮雕起伏和3D材质层次，不做扁平化处理。
3. `线描手稿`：突出线条组织、轮廓骨架和手绘手稿感，避免厚重材质特效盖过线性表达。
4. `插画卡通`：突出造型概括、配色统一和卡通插画亲和力，保持主体识别稳定。
5. `水彩油画`：突出笔触、颜料层次和色彩氛围，避免边缘过度糊化或脏色堆积。
6. `工艺材质`：突出材质触感和工艺细节，如绣线、织物、玻璃、皮质、植绒和浮雕层次。
7. `设计风格`：突出明确设计语言和装饰节奏，保证形式感强但不破坏主体可读性。
8. `人像宠物`：突出肖像气质、面部或宠物特征识别，避免身份漂移和表情结构错乱。

### `video2d3dStyle`
1. `裂纹彩绘`：转绘为具有裂纹彩绘质感的装饰画风，保留色块分层和裂纹装饰节奏。
2. `罗纹编织纹理`：转绘为罗纹编织纹理效果，强调织纹方向、纱线层次和柔性材质感。
3. `提花编织纹理`：转绘为提花编织效果，强调重复纹样、织造层次和面料起伏感。
4. `立体软胶`：转绘为立体软胶质感，强调圆润厚度、边缘包覆感和软性反光。
5. `写实素描`：转绘为写实素描效果，强调结构明暗、排线层次和真实体积关系。
6. `漆红刻画`：转绘为漆红刻画风格，强调高对比红黑层次和雕刻式轮廓表现。
7. `现代速写`：转绘为现代速写效果，强调概括线条、快速笔触和结构抓形能力。
8. `闪粉剪影`：转绘为闪粉剪影效果，强调剪影轮廓、颗粒闪烁感和装饰性高光。
9. `UV 浮雕`：转绘为UV浮雕工艺效果，强调表面凸起、局部高光和硬质立体层次。
10. `夸张手绘`：转绘为夸张手绘风格，强化造型变形张力和鲜明手绘情绪。
11. `撞色线稿`：转绘为撞色线稿效果，强调高识别线条和对比色块分区。
12. `炭粉水彩`：转绘为炭粉与水彩混合效果，强调颗粒边缘和柔化色晕。
13. `麻胶版画`：转绘为麻胶版画风格，强调粗粝纹理、压印感和手工刻版痕迹。
14. `连笔肖像`：转绘为连笔肖像效果，强调单线条连续组织和人物轮廓节奏。
15. `矢量水彩`：转绘为矢量水彩效果，兼顾水彩色块和边缘清爽度。
16. `蜡笔线线`：转绘为蜡笔线条效果，强调童趣线感、颗粒摩擦感和手绘涂写感。
17. `哥特肖像`：转绘为哥特肖像风格，强调冷暗氛围、装饰细节和肖像气质。
18. `童趣水彩`：转绘为童趣水彩效果，强调轻快色彩、柔和轮廓和可爱亲和感。
19. `极简粗铅`：转绘为极简粗铅笔风格，强调简化轮廓和粗颗粒铅笔触感。
20. `糙彩肖像`：转绘为糙彩肖像风格，强调粗粝上色痕迹和强烈人物气质。
21. `瓷蓝速写`：转绘为瓷蓝速写效果，强调蓝白层次、线描感和陶瓷装饰气质。
22. `平面插画`：转绘为平面插画风格，强调简洁块面、清晰轮廓和统一配色。
23. `立体果冻`：转绘为立体果冻效果，强调透明软质体积、亮面反光和Q弹质感。
24. `平涂插画`：转绘为平涂插画效果，强调干净色面、清楚轮廓和轻装饰表达。
25. `玻璃画`：转绘为玻璃画效果，强调透光感、彩色玻璃分区和边缘描线。
26. `3D凹印`：转绘为3D凹印效果，强调压印深浅、阴影槽感和硬质立体感。
27. `3D皮质`：转绘为3D皮质效果，强调皮纹、压痕、包边和柔韧体积感。
28. `羊羔绒`：转绘为羊羔绒材质效果，强调蓬松纤维、软糯触感和绒面层次。
29. `宠物牛仔贴布`：转绘为宠物牛仔贴布效果，强调牛仔纹理、布贴边缘和趣味拼接。
30. `立体植绒`：转绘为立体植绒效果，强调绒毛起伏、软质颗粒和体积厚度。
31. `贴布绣`：转绘为贴布绣效果，强调布贴轮廓、压线边缘和手工缝制感。
32. `粗线全幅绣`：转绘为粗线全幅刺绣效果，强调大面积粗针脚覆盖和立体织线层次。
33. `粗线局部绣`：转绘为粗线局部刺绣效果，强调关键局部粗针脚和材质重点。
34. `细线全幅绣`：转绘为细线全幅刺绣效果，强调细密针脚和完整绣面秩序。
35. `细线局部绣`：转绘为细线局部刺绣效果，强调重点区域精细针法和局部工艺。
36. `细线图形绣`：转绘为细线图形绣效果，强调图形边缘、精细走线和轻量立体感。
37. `粗线图形绣`：转绘为粗线图形绣效果，强调图形轮廓厚度和高识别刺绣边界。
38. `立体发泡`：转绘为立体发泡效果，强调膨胀厚度、软性边缘和表面起伏。
39. `木质浮雕`：转绘为木质浮雕效果，强调木纹方向、雕刻深浅和硬质层次。
40. `铜面浮雕`：转绘为铜面浮雕效果，强调金属暖色反光、浮雕起伏和工艺厚重感。
41. `银面浮雕`：转绘为银面浮雕效果，强调冷色金属反光、清晰高光和立体雕刻感。
42. `金面浮雕`：转绘为金面浮雕效果，强调金属光泽、雕刻层次和华丽工艺感。
43. `雕塑绘画`：转绘为雕塑绘画风格，强调雕塑体积、表面肌理和绘画笔触结合。
44. `立体纸雕`：转绘为立体纸雕效果，强调分层裁切、纸面折叠和层层叠高关系。
45. `刺绣`：转绘为通用刺绣效果，强调针法纹理、绣线方向和工艺可读性。
46. `宠物矢量头像`：转绘为宠物矢量头像风格，强调轮廓简化、特征抓取和高识别头像感。
47. `宠物肖像`：转绘为宠物肖像风格，强调毛发层次、神态特征和宠物身份识别。
48. `宠物青花`：转绘为宠物青花效果，强调蓝白装饰纹样和宠物造型融合。
49. `炭笔素描`：转绘为炭笔素描效果，强调黑白层次、擦抹痕迹和结构体积。
50. `水彩`：转绘为水彩效果，强调色彩晕染、纸张留白和柔和笔触。
51. `折纸`：转绘为折纸效果，强调几何折面、纸张边缘和块面转折。
52. `儿童绘本`：转绘为儿童绘本风格，强调温和配色、清晰造型和故事感。
53. `经典皮克斯`：转绘为经典皮克斯感风格，强调亲和立体角色感和高完成度CG气质。
54. `水彩泼墨`：转绘为水彩泼墨效果，强调流动边缘、泼洒层次和东方笔意。
55. `美式夸张漫画`：转绘为美式夸张漫画风格，强调夸张表情、动态轮廓和强烈色块。
56. `美式漫画`：转绘为美式漫画风格，强调分明勾线、块面阴影和高对比叙事感。
57. `粘土`：转绘为粘土效果，强调圆润体积、手工塑形痕迹和可爱立体感。
58. `街头涂鸦`：转绘为街头涂鸦风格，强调喷绘笔触、手写感和城市装饰张力。
59. `新海诚`：转绘为清透动画氛围风格，强调通透光色、细腻场景感和青春情绪。
60. `辛普森`：转绘为美式黄肤卡通风格，强调高识别轮廓、平面色块和幽默感。
61. `荧光`：转绘为荧光风格，强调高亮色边缘、发光层次和夜感视觉冲击。
62. `厚涂油画`：转绘为厚涂油画效果，强调堆叠笔触、颜料厚度和油彩层次。
63. `2D迪士尼`：转绘为2D童话动画风格，强调清晰造型、柔和色彩和亲和叙事感。
64. `色块油画`：转绘为色块油画效果，强调大色面组织和油画层次的简化表达。
65. `简易线稿`：转绘为简易线稿风格，强调极简轮廓和清晰结构，不做复杂渲染。
66. `印象油画`：转绘为印象油画风格，强调氛围色彩、松动笔触和整体观感。
67. `立体刺绣`：转绘为立体刺绣效果，强调绣线厚度、表面起伏和工艺体积感。
68. `黑白简笔`：转绘为黑白简笔风格，强调最少线条下的清楚结构与识别。
69. `卡通手绘`：转绘为卡通手绘效果，强调轻松轮廓、明快色彩和手绘温度。
70. `夸张肖像`：转绘为夸张肖像风格，强调人物或主体特征放大和鲜明神态。
71. `无脸矢量肖像`：转绘为无脸矢量肖像效果，强调轮廓、发型、穿着和简洁块面表达。
72. `马克笔`：转绘为马克笔效果，强调色块叠压、边缘扫笔和设计草图感。
73. `速写`：转绘为速写效果，强调快速抓形、动态线条和轻量明暗。
74. `厚涂水彩`：转绘为厚涂水彩效果，强调高饱和笔触和厚重晕染层次。
75. `数字卡通`：转绘为数字卡通风格，强调清晰边缘、干净上色和现代卡通完成度。
76. `吉卜力`：转绘为温暖手绘动画氛围风格，强调自然色彩、故事感和柔和细节。
77. `针织`：转绘为针织材质效果，强调编织纹路、线圈结构和柔软触感。
78. `速写线稿`：转绘为速写线稿效果，强调轻快线条和快速结构概括。
79. `复古海报`：转绘为复古海报风格，强调年代配色、排版装饰感和印刷颗粒气质。
80. `线稿色块`：转绘为线稿色块风格，强调线面结合和高识别配色分区。
81. `彩铅`：转绘为彩铅效果，强调细密笔触、纸面颗粒和柔和色彩层次。
82. `木刻版画`：转绘为木刻版画效果，强调刀痕纹理、黑白对比和印刷粗粝感。
83. `铅笔素描`：转绘为铅笔素描效果，强调轻重排线、结构塑造和真实灰阶层次。

### `video2d3dRatio`
1. `自动检测比例`：自动匹配最适合当前主体和风格展示的比例，优先保证主体完整与风格表达稳定。
2. `1:1`：采用方图比例，强调中心构图和通用POD预览兼容性。
3. `1:2`：采用长竖比例，强调纵向延展和上下节奏控制。
4. `2:1`：采用长横比例，强调横向展开和左右留白平衡。
5. `2:3`：采用经典竖版比例，兼顾主体展示与信息层级。
6. `3:2`：采用经典横版比例，兼顾主体完整和横向铺展。
7. `3:4`：采用电商常用竖图比例，突出主体重心和竖向浏览适配。
8. `4:3`：采用横向稳定比例，适合多元素和场景型展示。
9. `9:16`：采用竖屏长画幅，保证移动端首屏识别和风格冲击力。
10. `16:9`：采用横屏长画幅，适合横向叙事和场景感呈现。
11. `18:23`：采用偏长竖向比例，强调纵深层次和完整主体展示。

### `video2d3dOutputCount`
1. `1`：输出1张高完成度结果，优先保证单张风格命中稳定。
2. `2`：输出2张同源风格结果，允许在细节和构图上做小幅变化。
3. `3`：输出3张同源风格结果，提供更多可选版本但保持风格一致。
4. `4`：输出4张同源风格结果，在风格稳定前提下提供更完整选择空间。

## 附录C：完整品类规则
### `服装/纺织`
- `prompt`：适配服装与纺织图案转绘，强调面料纹理、布面褶皱和印花结构稳定，避免风格化后把织物转成塑料、金属或失真厚涂材质。
- `required`：面料语义保留；印花结构稳定；风格化后仍适合布面呈现。
- `forbidden`：塑料感；金属感误植；厚重3D材质破坏布面逻辑。
- `recommendedStyleCategories`：`工艺材质 / 插画卡通 / 水彩油画 / 线描手稿`

### `手机壳`
- `prompt`：适配手机壳图案和壳面预览转绘，强调中心主体聚焦、缩略图识别和边缘干净，避免过密风格效果淹没小尺寸可读性。
- `required`：中心主体稳定；缩略图识别清楚；边缘干净。
- `forbidden`：过密纹理发脏；小尺寸不可读；边缘糊化。
- `recommendedStyleCategories`：`设计风格 / 插画卡通 / 线描手稿`

### `家电数码类`
- `prompt`：适配数码和结构型商品转绘，强调接口、边缘、按键、模组和体积结构保持准确，避免风格化后变形或失去工业感。
- `required`：结构准确；接口按键可辨识；工业感不丢失。
- `forbidden`：接口变形；边缘塌陷；幼态化卡通削弱结构。
- `recommendedStyleCategories`：`原始3D风格 / 线描手稿 / 设计风格`

### `装饰画`
- `prompt`：适配装饰画和画面型主体转绘，强调主题叙事、层次和观赏完成度，允许更强氛围化风格但不能破坏主视觉识别。
- `required`：主题叙事完整；氛围强化但主视觉稳定；观赏完成度高。
- `forbidden`：主体辨识度下降；色层发脏；风格化后画面塌陷。
- `recommendedStyleCategories`：`水彩油画 / 设计风格 / 插画卡通 / 原始3D风格`

### `挂钟`
- `prompt`：适配挂钟盘面与中心对齐语义的风格转绘，强调中心区域稳定、径向平衡和圆形边界秩序，不让风格特效破坏钟面主阅读逻辑。
- `required`：中心区域稳定；圆形边界秩序清楚；径向关系平衡。
- `forbidden`：中心失衡；边界秩序被特效冲散；无中心方向的混乱泼墨。
- `recommendedStyleCategories`：`原始3D风格 / 设计风格 / 工艺材质`

### `人像/宠物`
- `prompt`：适配人像或宠物主题转绘，强调身份特征、轮廓、毛发/五官/表情和气质的一致性，避免风格化后身份漂移。
- `required`：身份特征稳定；五官或毛发识别清楚；神态气质一致。
- `forbidden`：身份漂移；五官错位；表情结构崩坏。
- `recommendedStyleCategories`：`人像宠物 / 线描手稿 / 插画卡通 / 水彩油画`

### `铁艺图形/五金`
- `prompt`：适配铁艺图形和五金结构型主体转绘，强调几何秩序、金属边缘和结构稳定，不应使用过软或过糯的材质风格掩盖结构。
- `required`：几何秩序稳定；金属边缘清楚；结构硬度保留。
- `forbidden`：过软材质感；水彩晕染弱化结构；金属边缘融化。
- `recommendedStyleCategories`：`原始3D风格 / 线描手稿 / 设计风格`

### `通用`
- `prompt`：按通用风格转绘标准执行，优先保证主体保真、风格明确和可用性稳定。
- `required`：主体保真；风格命中明确；输出可直接使用。
- `forbidden`：主体漂移；风格混乱；输出不稳定。
- `recommendedStyleCategories`：`设计风格 / 插画卡通 / 线描手稿`

## 附录D：Prompt 组装要求
```json
{
  "requiredFields": [
    "toolKey",
    "productCategory",
    "video2d3dStyleCategory",
    "video2d3dStyle",
    "video2d3dRatio",
    "video2d3dOutputCount"
  ],
  "strictMode": {
    "onMissingProductCategoryRule": "warn_and_fallback_to_general",
    "onMissingCategoryRule": "error",
    "onMissingRequiredField": "error",
    "onUnknownStyleCategory": "error",
    "onUnknownStyle": "error",
    "onUnknownRatio": "error",
    "onUnknownOutputCount": "error"
  }
}
```
