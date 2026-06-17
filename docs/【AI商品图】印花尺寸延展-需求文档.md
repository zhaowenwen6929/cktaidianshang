# 【AI商品图】印花尺寸延展-需求文档

## 功能目的
印花尺寸延展用于在不破坏原图主体、风格和图案语义的前提下，把原始图案自然扩展到多个目标比例。它的核心目标是解决不同 POD 版型、不同电商展示比例和不同裁切结构下的适配问题，让一张图案可以稳定复用到多种尺寸场景。

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

## 功能字段

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

## 图片识别提示词
用于在用户上传素材后，自动识别更适合的 `productCategory`，并回填默认比例和默认出图数量。

### 识别目标
1. 识别最适合的 `productCategory`。
2. 为尺寸延展的默认比例推荐提供依据。
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
你是一名 POD 印花尺寸延展品类识别助手。请根据用户上传的素材图，判断该图更适合落入哪一种延展品类，用于回填 productCategory。

任务要求：
1. 只能从以下枚举中选择 1 个 productCategory：
服装/纺织、手机壳、挂钟、装饰画、铁艺图形、铁皮画、通用
2. 结合主体结构、边界关系、图案分布、裁切风险和常见载体判断最适合的品类。
3. 若图像明显需要中心稳定、圆心关系、四周平衡，可优先判断为“挂钟”。
4. 若图像明显适合大面积服饰或家纺铺版，可优先判断为“服装/纺织”。
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

+ 当前页面无 `advanced-settings`
+ 当前页面无 `supplement`
+ 当前页面无显式 `AI assist`
+ 比例支持多选，允许一次任务生成多种目标比例
+ 若未选择任何比例，不允许生成
+ 总结果数=`上传数 * 选中比例数 * 出图数量`
+ 总积分=`总结果数 * 5`

## 积分规则
1. 印花尺寸延展按最终出图张数计费，不按“尺寸延展”功能本身额外乘倍率。
2. 最终张数由三部分共同决定：上传数、选中比例数、每比例出图数量。
3. 单张结果图单价为 5 积分。
4. 总结果数计算公式为：`上传数 * 选中比例数 * videoPrintExtendOutputCount`。
5. 总积分计算公式为：`上传数 * 选中比例数 * videoPrintExtendOutputCount * 5`。
6. 因为比例是多选，所以这里天然存在“比例倍率”，但本质上仍是按最终结果张数计费，不是额外收一次功能倍率。

## 任务拆分规则
1. 一个提交请求对应一个任务组。
2. 任务组内按“上传素材 * 目标比例”拆分子任务。
3. 每个“素材-比例”组合再按 `videoPrintExtendOutputCount` 产出对应数量的结果图。
4. 推荐做法是：
   - 任务组维度：一次提交
   - 子任务维度：每个 `上传素材 x 比例`
   - 子任务结果数：`videoPrintExtendOutputCount`
5. 例如：
   - 上传 2 张图
   - 选择 3 个比例
   - 每比例出 2 张
   - 则任务组内共 6 个子任务，最终返回 12 张结果
6. 前台应把这次提交视为一个任务组展示；后端可按子任务维度并行执行，但不能改变总张数和计费口径。

## 模式规则与选项提示词
开发实现时必须按 `prompt + required + forbidden` 完整消费，不能只取模式主描述：

```json
{
  "modeRulesByTool": {
    "印花尺寸延展": {
      "prompt": "在保持原图主体、图案语义、主色关系和可印刷性的前提下，将原始印花自然延展到目标比例，避免把延展做成拉伸、硬裁切或机械平铺补边。",
      "required": [
        "主体结构与图案核心识别信息保持稳定",
        "新增延展区域与原图颜色、纹理、笔触和密度自然衔接",
        "边缘、角部和留白关系符合目标比例的视觉秩序",
        "输出可直接用于POD后续上版和多尺寸排版"
      ],
      "forbidden": [
        "直接等比拉伸导致主体变形",
        "硬裁切主体关键元素或文字",
        "延展区出现重复贴补、拼接线、脏边或明显AI补画痕迹",
        "新增与原图主题无关的强干扰元素"
      ]
    }
  }
}
```

```json
{
  "universalNegativePrompt": "通用负向约束：1. 严禁改变原图主体结构、主要图案语义、颜色体系和SKU含义。2. 严禁把尺寸延展实现为简单拉伸、硬裁切或纯留白占位。3. 严禁延展区出现重复纹样痕迹、断层、错位、脏边、涂抹感和低清噪点。4. 严禁新增侵权图形、Logo、水印、二维码、联系方式或与主题无关文字。",
  "universalQualityPrompt": "通用质量要求：1. 保真性：主体、图案主题、主色和核心构图稳定。2. 延展性：新增区域与原图自然融合，不出现割裂感。3. 清晰度：纹理、边缘和层次清楚可辨。4. 可用性：不同目标比例均可直接用于POD印花链路。5. 一致性：同批次不同尺寸结果完成度稳定。"
}
```

1. 当前功能必须保留完整通用负向约束与通用质量约束。
2. 模式级 `required / forbidden` 是这个功能最关键的正向/负向约束，因为它直接决定是否会出现拉伸感、补画感和割裂感。
3. 品类规则只补差异化风险和推荐，不替代全局约束。

## 品类差异配置方案
印花尺寸延展是最应该补品类差异的功能之一，因为它直接影响后续版型、裁切安全区和生产可用性。

这部分的作用分为 4 层：
1. 给不同品类推荐默认延展比例。
2. 给不同品类推荐默认每比例出图数。
3. 把品类约束写进最终 prompt，包括品类说明、品类必须满足项、品类禁止项。
4. 对明显不合理的比例组合给出提醒。

### 品类字段来源与回填规则
```json
{
  "productCategory": {
    "source": "上游链路回填、图片识别结果或用户手动指定",
    "allowedValues": ["服装/纺织", "手机壳", "挂钟", "装饰画", "铁艺图形", "铁皮画", "通用"],
    "fallback": "通用",
    "manualOverrideRule": "用户手动指定优先于自动识别结果"
  }
}
```

### 推荐默认值
默认推荐值从“当前功能的品类规则”中获取。系统先确定 `productCategory`，再按该品类命中的规则回填默认比例和默认每比例出图数；如果没有命中明确品类，则回退使用 `通用` 的默认值。推荐默认值只用于首屏回填和辅助推荐，不覆盖用户手动多选结果。

```json
{
  "recommendedDefaultsByCategory": {
    "服装/纺织": { "ratios": ["1:1", "3:4"], "outputCount": "2" },
    "手机壳": { "ratios": ["1:2", "3:4"], "outputCount": "1" },
    "挂钟": { "ratios": ["1:1"], "outputCount": "1" },
    "装饰画": { "ratios": ["3:4", "4:3"], "outputCount": "2" },
    "铁艺图形": { "ratios": ["1:1", "4:3"], "outputCount": "1" },
    "铁皮画": { "ratios": ["4:3", "16:9"], "outputCount": "1" },
    "通用": { "ratios": ["1:1", "3:4"], "outputCount": "1" }
  }
}
```

### 完整品类规则
```json
{
  "categoryRulesByTool": {
    "服装/纺织": {
      "prompt": "适配服装与纺织大面积铺版延展，强调新增区域与原图纹样、密度、主次节奏和面料语义自然融合，避免成衣上身后出现明显补画带或空洞区。",
      "required": ["新增区域与原图节奏一致", "面料语义自然", "大面积铺版后不空洞"],
      "forbidden": ["明显补画带", "拉伸感", "长横比例堆叠导致版片失真"],
      "recommendedRatios": ["1:1", "3:4", "2:3", "18:23"],
      "recommendedOutputCount": ["2", "4"],
      "avoidRatios": ["16:9", "2:1"]
    },
    "手机壳": {
      "prompt": "适配手机壳图案延展，强调中心主体聚焦、边缘兼容性和壳体弧面下的视觉稳定，避免新增区域把主元素推向开孔和圆角高风险区。",
      "required": ["中心主体稳定", "边缘兼容壳体裁切", "新增区域不挤压主元素"],
      "forbidden": ["主元素贴边", "新增区域压入开孔区", "横向摊平主体"],
      "recommendedRatios": ["1:2", "3:4", "1:1"],
      "recommendedOutputCount": ["1", "2"],
      "avoidRatios": ["2:1", "16:9"]
    },
    "挂钟": {
      "prompt": "适配挂钟圆盘和中心对齐语义，强调延展后圆心关系稳定、四周平衡和外围装饰连续，不破坏钟面主阅读区。",
      "required": ["圆心关系稳定", "外围装饰连续", "四周平衡"],
      "forbidden": ["中心视觉被稀释", "强横向或强竖向拉伸", "外围断裂"],
      "recommendedRatios": ["1:1", "4:5", "5:4"],
      "recommendedOutputCount": ["1", "2"],
      "avoidRatios": ["16:9", "2:1"]
    },
    "装饰画": {
      "prompt": "适配装饰画和展示画面比例延展，强调新增区域与原图叙事、色调和层次一致，保证远观冲击与近观细节都成立。",
      "required": ["新增区域承接原图叙事", "色调层次一致", "放大后细节成立"],
      "forbidden": ["镜像补边感明显", "新增空间只补空白", "远观冲击下降"],
      "recommendedRatios": ["3:4", "4:3", "16:9", "2:3"],
      "recommendedOutputCount": ["2", "3"],
      "avoidRatios": []
    },
    "铁艺图形": {
      "prompt": "适配铁艺图形和几何线条类延展，强调线宽一致、几何关系稳定和新增区域的结构秩序，避免补画后线条弯折或节奏失真。",
      "required": ["线宽一致", "边缘连接自然", "几何关系稳定"],
      "forbidden": ["线条弯折", "新增区域结构失真", "大量长竖比例导致结构松散"],
      "recommendedRatios": ["1:1", "2:1", "16:9", "4:3"],
      "recommendedOutputCount": ["1", "2"],
      "avoidRatios": ["9:16"]
    },
    "铁皮画": {
      "prompt": "适配铁皮画复古画面延展，强调旧化纹理、标题主视觉和边框关系自然延续，不让新增区域变成无意义脏底。",
      "required": ["旧化节奏一致", "边框关系自然延续", "标题主视觉稳定"],
      "forbidden": ["旧化噪点无限复制", "新增区域成为脏底", "边框与主标题重心失衡"],
      "recommendedRatios": ["3:4", "4:3", "16:9"],
      "recommendedOutputCount": ["1", "2"],
      "avoidRatios": []
    },
    "通用": {
      "prompt": "按通用印花尺寸延展执行，优先保持主体、风格、边缘和新增区域的自然融合。",
      "required": ["主体稳定", "边缘自然融合", "新增区域不突兀"],
      "forbidden": ["硬裁切", "机械补边", "新增区域割裂"],
      "recommendedRatios": ["1:1", "3:4", "4:3"],
      "recommendedOutputCount": ["1", "2"],
      "avoidRatios": []
    }
  }
}
```

### 字段联动与提示词消费规则
1. `videoPrintExtendSelectedRatios` 为多选数组字段，必须逐值读取 `valuePrompt`，并按选中顺序或既定排序拼成 `ratioValuePromptsJoined`。
2. `videoPrintExtendOutputCount` 只有一个值，但会影响每个比例的生成份数，计费和结果数都必须按 `uploadCount * ratioCount * outputCount` 计算。
3. `productCategory` 参与：
   - 默认比例和默认数量推荐
   - prompt 注入：注入 `categoryPrompt / categoryRequired / categoryForbidden`
   - warning 提示：对高风险比例组合给提示
5. 默认值获取顺序为：用户手动指定品类 > 业务链路传入品类 > 图片识别品类 > `通用` 回退。
4. 品类规则只补差异化风险和推荐，不替代全局 `universalNegativePrompt / universalQualityPrompt`。

### Warning 规则
1. `挂钟 x 16:9`：给 warning，提示可能削弱中心构图。
2. `手机壳 x 2:1`：给 warning，提示容易造成主体横向摊平。
3. `服装/纺织 x 多个长横比例同时选择`：给 warning，提示可能偏离常见服装版片结构。

开发要求：
1. `categoryPrompt` 插入在 `task` 后、`mode` 前。
2. 品类推荐用于默认值回填，不覆盖用户手动多选的比例。
3. 对 `挂钟 x 16:9`、`手机壳 x 2:1` 等组合建议给 warning。
4. `productCategory + categoryPrompt` 必须进入最终 prompt，未命中时回退到 `通用`。

```json
{
  "optionValueExpansions": {
    "videoPrintExtendSelectedRatios": {
      "fieldKey": "videoPrintExtendSelectedRatios",
      "name": "延展比例",
      "values": {
        "1:1": { "valuePrompt": "输出标准正方形延展结果，重点保持主体居中稳定、四边留量均衡，适合通用印花和方形展示载体。" },
        "1:2": { "valuePrompt": "输出纵向窄长比例延展结果，重点控制主体纵向延展节奏和上下边缘连续性，避免主体被拉长或边缘留白失衡。" },
        "2:1": { "valuePrompt": "输出横向长幅延展结果，重点处理横向空间补全和左右视觉重心平衡，避免主体横向摊平或新增区域空洞。" },
        "2:3": { "valuePrompt": "输出偏纵向展示比例延展结果，重点保持主体完整、上下结构自然，并兼顾商品详情页和竖版展示适配。" },
        "3:2": { "valuePrompt": "输出偏横向展示比例延展结果，重点控制左右展开后的层次节奏，保证主体不被稀释且新增区域自然承接。" },
        "3:4": { "valuePrompt": "输出常用竖版比例延展结果，重点保证竖向视觉重心稳定、边缘延展自然，适配多数POD展示和商品主图场景。" },
        "4:3": { "valuePrompt": "输出常用横版比例延展结果，重点保证横向展开后的构图完整度和远观可读性，适配横版展示与装饰画场景。" },
        "9:16": { "valuePrompt": "输出长竖屏比例延展结果，重点强化纵深感和上下连续性，避免主体被压缩到中部或顶部底部失衡。" },
        "16:9": { "valuePrompt": "输出宽屏横版比例延展结果，重点强化横向叙事空间和远观完整度，避免左右新增区域成为无意义补边。" }
      }
    },
    "videoPrintExtendOutputCount": {
      "fieldKey": "videoPrintExtendOutputCount",
      "name": "每比例出图数量",
      "values": {
        "1": { "valuePrompt": "每个目标比例生成1张结果，优先保证单张完成度和稳定性。" },
        "2": { "valuePrompt": "每个目标比例生成2张结果，保持主体稳定的前提下提供适度差异版本。" },
        "3": { "valuePrompt": "每个目标比例生成3张结果，在主体和风格稳定前提下提供更丰富的延展方案。" },
        "4": { "valuePrompt": "每个目标比例生成4张结果，保证多方案输出，但不允许为了凑数量牺牲结构完整性和可用性。" }
      }
    }
  }
}
```

### 最终拼装顺序
1. `task`
2. `category`
3. `mode`
4. `params`
5. `ratioPrompts`
6. `countPrompt`
7. `required`
8. `categoryRequired`
9. `categoryForbidden`
10. `forbidden`
11. `universalNegativePrompt`
12. `universalQualityPrompt`
13. `supplement`

## 完整 Prompt 模板
下面是最终提交给模型的生成提示词模板。花括号中的字段都是实际参与替换的字段，不是示意写法。

本模板实际使用的字段包括：`productCategory`、`categoryPrompt`、`modePrompt`、`selectedRatiosJoined`、`videoPrintExtendOutputCount`、`videoPrintExtendRatioCount`、`videoPrintExtendTotalResultCount`、`ratioValuePromptsJoined`、`outputCountValuePrompt`、`modeRequiredJoined`、`categoryRequiredJoined`、`categoryForbiddenJoined`、`modeForbiddenJoined`、`universalNegativePrompt`、`universalQualityPrompt`、`supplement`。

```text
任务目标：基于上传印花图执行尺寸延展，在不破坏主体和图案可用性的前提下，生成适配多个版型比例的高质量结果。

品类：当前载体品类为「{productCategory}」

品类说明：{categoryPrompt}

品类正向约束：{categoryRequiredJoined}

品类负向约束：{categoryForbiddenJoined}

模式：印花尺寸延展

模式说明：{modePrompt}

模式正向约束：{modeRequiredJoined}

模式负向约束：{modeForbiddenJoined}

延展参数：延展比例={selectedRatiosJoined}；每比例出图数量={videoPrintExtendOutputCount}；比例数={videoPrintExtendRatioCount}；总结果数={videoPrintExtendTotalResultCount}。

比例扩展：{ratioValuePromptsJoined}

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
    "modePrompt",
    "selectedRatiosJoined",
    "videoPrintExtendOutputCount",
    "videoPrintExtendRatioCount",
    "videoPrintExtendTotalResultCount",
    "ratioValuePromptsJoined",
    "outputCountValuePrompt",
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
    "modePrompt": "modeRulesByTool['印花尺寸延展'].prompt",
    "modeRequiredJoined": "modeRulesByTool['印花尺寸延展'].required 按 '；' 连接",
    "modeForbiddenJoined": "modeRulesByTool['印花尺寸延展'].forbidden 按 '；' 连接",
    "selectedRatiosJoined": "videoPrintExtendSelectedRatios 数组按提交顺序用 ' / ' 连接",
    "ratioValuePromptsJoined": "videoPrintExtendSelectedRatios 逐项映射 optionValueExpansions.videoPrintExtendSelectedRatios.values[ratio].valuePrompt 后按 '；' 连接",
    "outputCountValuePrompt": "optionValueExpansions.videoPrintExtendOutputCount.values[videoPrintExtendOutputCount].valuePrompt",
    "videoPrintExtendRatioCount": "videoPrintExtendSelectedRatios.length",
    "videoPrintExtendTotalResultCount": "videoPrintExtendSelectedRatios.length * videoPrintExtendOutputCount",
    "universalNegativePrompt": "通用负向约束固定文案",
    "universalQualityPrompt": "通用质量要求固定文案",
    "supplement": "用户补充描述；为空时传空字符串，不删模板段位"
  }
}
```

## 开发要求
1. `videoPrintExtendSelectedRatios` 提交时按数组语义处理，不要退化成单值字段。
2. 每个比例都应生成独立结果，且计费、结果数统计必须一致。
3. 提交快照应保留：`productCategory / selectedRatios / ratioCount / outputCount / totalResultCount / unitCreditCost / totalCreditCost / finalPrompt`。
4. 生成按钮校验以 `effectiveReferenceCount=ratioCount` 为准，不能只看素材上传数。
5. `categoryPrompt / categoryRequired / categoryForbidden / modePrompt / modeRequired / modeForbidden / universalNegativePrompt / universalQualityPrompt` 为不可裁剪段。

## 附录A：完整模式规则
```json
{
  "modeRulesByTool": {
    "印花尺寸延展": {
      "ruleLevel": "A",
      "prompt": "在保持原图主体、图案语义、主色关系和可印刷性的前提下，将原始印花自然延展到目标比例，避免把延展做成拉伸、硬裁切或机械平铺补边。",
      "required": [
        "主体结构与图案核心识别信息保持稳定",
        "新增延展区域与原图颜色、纹理、笔触和密度自然衔接",
        "边缘、角部和留白关系符合目标比例的视觉秩序",
        "输出可直接用于POD后续上版和多尺寸排版"
      ],
      "forbidden": [
        "直接等比拉伸导致主体变形",
        "硬裁切主体关键元素或文字",
        "延展区出现重复贴补、拼接线、脏边或明显AI补画痕迹",
        "新增与原图主题无关的强干扰元素"
      ]
    }
  },
  "universalNegativePrompt": "通用负向约束：1. 严禁改变原图主体结构、主要图案语义、颜色体系和SKU含义。2. 严禁把尺寸延展实现为简单拉伸、硬裁切或纯留白占位。3. 严禁延展区出现重复纹样痕迹、断层、错位、脏边、涂抹感和低清噪点。4. 严禁新增侵权图形、Logo、水印、二维码、联系方式或与主题无关文字。",
  "universalQualityPrompt": "通用质量要求：1. 保真性：主体、图案主题、主色和核心构图稳定。2. 延展性：新增区域与原图自然融合，不出现割裂感。3. 清晰度：纹理、边缘和层次清楚可辨。4. 可用性：不同目标比例均可直接用于POD印花链路。5. 一致性：同批次不同尺寸结果完成度稳定。"
}
```

## 附录B：完整选项提示词
### `videoPrintExtendSelectedRatios`
1. `1:1`：延展为标准方图，强调主体居中稳定、四边关系均衡，适合通用POD方形版型。
2. `1:2`：延展为长竖比例，重点补足上下空间并保持纵向节奏自然，避免主体被拉长。
3. `2:1`：延展为长横比例，重点补足左右空间并保持横向节奏自然，避免主体被摊平。
4. `2:3`：延展为经典竖版比例，兼顾主体展示与边缘留白层次。
5. `3:2`：延展为经典横版比例，兼顾主体完整度和横向排版适配性。
6. `3:4`：延展为电商常用竖图比例，保证主体重心稳定和上下信息承载自然。
7. `4:3`：延展为横向稳定比例，适合横向版型和并列信息展示。
8. `9:16`：延展为竖屏长画幅，重点控制上下连续性、细节闭合和首屏识别。
9. `16:9`：延展为横屏长画幅，重点控制左右连续性、节奏和视觉平衡。

### `videoPrintExtendOutputCount`
1. `1`：每个目标比例输出1张稳定结果，优先保证单张完成度。
2. `2`：每个目标比例输出2张方案，允许在延展边界和留白关系上做小幅变化。
3. `3`：每个目标比例输出3张方案，保持同源风格下的多版本可选空间。
4. `4`：每个目标比例输出4张方案，保证风格一致前提下提供更充分的版式变化。

## 附录C：完整品类规则
### `服装/纺织`
- `prompt`：适配服装与纺织大面积铺版延展，强调新增区域与原图纹样、密度、主次节奏和面料语义自然融合，避免成衣上身后出现明显补画带或空洞区。
- `required`：新增区域与原图节奏一致；面料语义自然；大面积铺版后不空洞。
- `forbidden`：明显补画带；拉伸感；长横比例堆叠导致版片失真。
- `recommendedRatios`：`1:1 / 3:4 / 2:3 / 18:23`
- `recommendedOutputCount`：`2 / 4`

### `手机壳`
- `prompt`：适配手机壳图案延展，强调中心主体聚焦、边缘兼容性和壳体弧面下的视觉稳定，避免新增区域把主元素推向开孔和圆角高风险区。
- `required`：中心主体稳定；边缘兼容壳体裁切；新增区域不挤压主元素。
- `forbidden`：主元素贴边；新增区域压入开孔区；横向摊平主体。
- `recommendedRatios`：`1:2 / 3:4 / 1:1`
- `recommendedOutputCount`：`1 / 2`

### `挂钟`
- `prompt`：适配挂钟圆盘和中心对齐语义，强调延展后圆心关系稳定、四周平衡和外围装饰连续，不破坏钟面主阅读区。
- `required`：圆心关系稳定；外围装饰连续；四周平衡。
- `forbidden`：中心视觉被稀释；强横向或强竖向拉伸；外围断裂。
- `recommendedRatios`：`1:1 / 4:5 / 5:4`
- `recommendedOutputCount`：`1 / 2`

### `装饰画`
- `prompt`：适配装饰画和展示画面比例延展，强调新增区域与原图叙事、色调和层次一致，保证远观冲击与近观细节都成立。
- `required`：新增区域承接原图叙事；色调层次一致；放大后细节成立。
- `forbidden`：镜像补边感明显；新增空间只补空白；远观冲击下降。
- `recommendedRatios`：`3:4 / 4:3 / 16:9 / 2:3`
- `recommendedOutputCount`：`2 / 3`

### `铁艺图形`
- `prompt`：适配铁艺图形和几何线条类延展，强调线宽一致、几何关系稳定和新增区域的结构秩序，避免补画后线条弯折或节奏失真。
- `required`：线宽一致；边缘连接自然；几何关系稳定。
- `forbidden`：线条弯折；新增区域结构失真；大量长竖比例导致结构松散。
- `recommendedRatios`：`1:1 / 2:1 / 16:9 / 4:3`
- `recommendedOutputCount`：`1 / 2`

### `铁皮画`
- `prompt`：适配铁皮画复古画面延展，强调旧化纹理、标题主视觉和边框关系自然延续，不让新增区域变成无意义脏底。
- `required`：旧化节奏一致；边框关系自然延续；标题主视觉稳定。
- `forbidden`：旧化噪点无限复制；新增区域成为脏底；边框与主标题重心失衡。
- `recommendedRatios`：`3:4 / 4:3 / 16:9`
- `recommendedOutputCount`：`1 / 2`

### `通用`
- `prompt`：按通用印花尺寸延展执行，优先保持主体、风格、边缘和新增区域的自然融合。
- `required`：主体稳定；边缘自然融合；新增区域不突兀。
- `forbidden`：硬裁切；机械补边；新增区域割裂。
- `recommendedRatios`：`1:1 / 3:4 / 4:3`
- `recommendedOutputCount`：`1 / 2`

## 附录D：Prompt 组装要求
```json
{
  "requiredFields": [
    "toolKey",
    "productCategory",
    "videoPrintExtendSelectedRatios",
    "videoPrintExtendOutputCount"
  ],
  "optionalFields": [
    "videoPrintExtendRatioCount",
    "videoPrintExtendTotalResultCount",
    "videoPrintExtendUnitCreditCost",
    "videoPrintExtendTotalCreditCost",
    "supplement"
  ],
  "segmentOrder": [
    "task",
    "category",
    "mode",
    "params",
    "ratioPrompts",
    "countPrompt",
    "required",
    "forbidden",
    "universalNegativePrompt",
    "universalQualityPrompt",
    "supplement"
  ],
  "strictMode": {
    "onMissingCategoryRule": "warn_and_fallback_to_general",
    "onMissingModeRule": "error",
    "onMissingRequiredField": "error",
    "onUnknownRatio": "error",
    "onUnknownOutputCount": "error"
  }
}
```
