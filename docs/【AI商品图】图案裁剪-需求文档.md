## 使用流程
1. 上传商品图（`upload-main`）
2. 选择模式（`pod-crop-mode`）
3. 生成

## 端到端使用流程
1. 用户上传商品图。
2. 用户选择裁剪模式：`通用 / 铁皮画 / 装饰画`。
3. 系统按模式规则、模式值扩展、通用硬约束组装提示词并提交。
4. 输出主体完整、边缘干净、可直接用于 POD 后续链路的裁剪结果。

## 真实功能与字段（Source of Truth）
代码来源：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

```json
{
  "toolKey": "pod-crop",
  "creationModeConfigKey": "default",
  "sectionOrder": ["upload-main", "pod-crop-mode"],
  "uploads": {
    "main": {
      "maxCount": 24
    }
  },
  "currentFields": {
    "podCropMode": ["通用", "铁皮画", "装饰画"]
  },
  "creationModeSelection": {
    "modeId": "pod-crop",
    "ratio": "1:1",
    "count": 1
  }
}
```

补充业务事实：

+ `通用`：`unitCreditCost=5`
+ `铁皮画`：`unitCreditCost=10`
+ `装饰画`：`unitCreditCost=15`
+ 当前页面无 `advanced-settings`
+ 当前页面无 `supplement`
+ 当前页面无显式 `AI assist`

实现要求：

+ 当前真实主字段只有 `podCropMode`，最终提示词最小可用版本必须围绕该字段组装。
+ `ratio=1:1`、`count=1` 由当前 `creationModeSelection` 固定注入，可在文档中作为输出规格说明，但不需要再做复杂扩展。
+ 当前功能没有平台字段，不应强行套平台规则结构。

## 1.1 计费与模式联动
```json
{
  "modeBillingRules": {
    "通用": { "unitCreditCost": 5, "ratio": "1:1", "count": 1 },
    "铁皮画": { "unitCreditCost": 10, "ratio": "1:1", "count": 1 },
    "装饰画": { "unitCreditCost": 15, "ratio": "1:1", "count": 1 }
  }
}
```

补充说明：

+ 当前计费只与 `podCropMode` 联动。

## 2. 模式提示词配置
说明：

+ 图案裁剪当前没有平台规则，核心约束来自 `podCropMode`。
+ 模式规则不是简单命名差异，而是对应不同品类语义下的裁剪重点。
+ `ruleLevel` 当前三种模式统一按 `A` 处理，因为它们都是直接决定最终裁剪方向的主规则。

```json
{
  "modeRulesByTool": {
    "通用": {
      "ruleLevel": "A",
      "prompt": "用于常规图案裁剪场景，优先保证主体完整、边缘干净、构图平衡与后续复用友好。",
      "required": [
        "裁剪后主体图案完整可识别",
        "关键轮廓与结构不被截断",
        "边缘干净且无明显毛边/白边",
        "适合后续POD链路继续使用"
      ],
      "forbidden": [
        "过度裁切导致主体语义缺失",
        "出现明显拉伸、压扁或透视失真",
        "裁出商品底材无关噪点作为主体",
        "输出低清晰度或明显压缩痕迹"
      ]
    },
    "铁皮画": {
      "ruleLevel": "A",
      "prompt": "适配铁皮画类图案裁剪，强调主体图形力量感、边缘张力和复古质感语义保真。",
      "required": [
        "保留铁皮画核心图形与主文案关系",
        "保持磨损感/颗粒感等风格细节可辨",
        "构图重心稳定，避免关键元素贴边被切",
        "输出适合后续排版与印制"
      ],
      "forbidden": [
        "误删关键符号、主标题或视觉锚点",
        "复古纹理被过度降噪抹平",
        "新增与原主题不一致的装饰元素",
        "裁剪后边缘出现破损感伪影"
      ]
    },
    "装饰画": {
      "ruleLevel": "A",
      "prompt": "适配装饰画类图案裁剪，强调视觉叙事完整、层次关系稳定与观感平衡。",
      "required": [
        "保留装饰画主叙事主体与视觉中心",
        "维持前中后景层次与色彩关系",
        "边缘过渡自然，无突兀截断",
        "输出具备展示与二次延展可用性"
      ],
      "forbidden": [
        "裁掉关键人物/主体导致叙事断裂",
        "色阶断层或明显拼接痕迹",
        "出现不合理透视变形",
        "输出模糊或边缘锯齿明显"
      ]
    }
  }
}
```

## 3. 模式值扩展提示词配置
说明：

+ 当前真实可用扩展只有 `podCropMode`。
+ 该扩展不是重复模式名称，而是将模式转换成更具体的裁剪执行语义。
+ 当接入载体识别后，`subjectType` 与 `structureRisks` 也建议走同类“值到提示词”的扩展配置，不直接把裸枚举值写入最终 prompt。

```json
{
  "optionValueExpansions": {
    "podCropMode": {
      "fieldKey": "podCropMode",
      "values": {
        "通用": {
          "valuePrompt": "按通用电商图案裁剪执行，优先平衡主体完整度、边缘净度和后续复用效率。"
        },
        "铁皮画": {
          "valuePrompt": "按铁皮画语义裁剪，保留复古颗粒、磨损细节与硬朗图形关系，避免关键文案和徽标被切断。"
        },
        "装饰画": {
          "valuePrompt": "按装饰画语义裁剪，保持视觉中心、层次关系和叙事完整，避免破坏画面平衡。"
        }
      }
    },
    "subjectType": {
      "fieldKey": "subjectType",
      "values": {
        "纯图形": {
          "valuePrompt": "以图形主体完整为先，保持轮廓闭合、重心稳定和视觉中心清晰。"
        },
        "文字主体": {
          "valuePrompt": "以文字完整可读为先，保持主标题、主文案和阅读顺序不被破坏。"
        },
        "图文混排": {
          "valuePrompt": "同时保留图形主体与文字信息，避免只保图不保字或只保字不保主体。"
        },
        "场景叙事": {
          "valuePrompt": "优先保留主叙事对象、层次关系和画面核心语义，避免叙事断裂。"
        }
      }
    },
    "structureRisks": {
      "fieldKey": "structureRisks",
      "values": {
        "开孔干扰": {
          "valuePrompt": "避开开孔区域，不能让开孔破坏主体完整性。"
        },
        "边框干扰": {
          "valuePrompt": "避开边框和无关外壳结构，不能把边框当成主体内容。"
        },
        "圆形边界": {
          "valuePrompt": "注意圆形边界完整，避免圆周被硬切。"
        },
        "外轮廓闭合要求": {
          "valuePrompt": "保持外轮廓闭合，便于后续切边和印花使用。"
        },
        "主标题必须完整": {
          "valuePrompt": "确保主标题完整保留，不得截断。"
        },
        "主文案必须完整": {
          "valuePrompt": "确保主文案完整可读，阅读顺序清楚。"
        },
        "主体贴边": {
          "valuePrompt": "避免主体贴边区域被误裁，保证主体留有安全边距。"
        },
        "纹样连续性": {
          "valuePrompt": "保持纹样和花型连续，避免拼接断裂。"
        },
        "层次叙事不可截断": {
          "valuePrompt": "保持前中后景和叙事主体完整，避免画面关系断裂。"
        },
        "复古符号不可缺失": {
          "valuePrompt": "保留复古徽记、主符号和做旧语义，不得误删关键元素。"
        }
      }
    }
  }
}
```

开发要求：

+ 最终拼装必须消费 `podCropMode.valuePrompt`，不能只把模式值字符串写进 prompt。
+ 接入载体识别后，`subjectType` 与 `structureRisks` 也应优先消费对应 `valuePrompt`，而不是直接拼接裸枚举。
+ `valuePrompt` 属于执行层语义补充，优先级低于 `forbidden / required`，高于模式正文 `prompt`。

## 4. 模式识别提示词（扩展预留）
说明：

+ 当前页面只有 `podCropMode` 一个真实主字段，但实际业务需要支持“用户上传第 1 张图后，自动识别建议模式”。
+ 识别结果只用于建议回填，不直接替代用户最终选择。
+ 识别目标必须落在现有模式枚举内：`通用 / 铁皮画 / 装饰画`。

```json
{
  "aiAssistPrompt": {
    "systemPrompt": "你是POD图案裁剪模式识别助手。请基于用户上传的第1张图片，判断最适合的图案裁剪模式，并输出建议模式、置信度和判断依据。",
    "outputSchema": {
      "suggestedPodCropMode": "通用|铁皮画|装饰画",
      "confidence": 0.0,
      "needsUserConfirm": false,
      "evidence": [
        "识别依据1",
        "识别依据2"
      ]
    }
  }
}
```

建议判定规则：

+ `通用`：主体类型不明显、适合标准裁剪、强调通用复用效率时使用。
+ `铁皮画`：画面带明显复古海报/金属牌/怀旧符号语义，或主文案、徽记、复古图形是核心识别点时使用。
+ `装饰画`：画面具有完整叙事、装饰性构图、层次丰富的视觉中心时使用。

## 4.1 商品信息识别是否需要进入最终提示词
结论：

+ 需要，但只应识别并注入“与裁剪决策强相关的载体信息”，不应把商品卖点、营销语气、平台语境等泛商品信息写入最终 prompt。
+ 这部分信息的作用是帮助模型判断“哪些区域必须保留、哪些干扰必须避开、裁剪锚点应该落在哪里”，从而提升主体完整性和边缘可用性。

原因：

+ 不同载体的安全裁剪逻辑不同，例如 `手机壳` 需要避开开孔和边框，`挂钟` 需要照顾圆形外轮廓，`徽章/贴纸` 需要保证闭合边界。
+ 不同主体类型的保留重点不同，例如 `文字标语类` 要保证主文案完整，`装饰画` 要保证叙事主体与层次关系，`铁皮画` 要保证复古符号和主标题不丢失。
+ 如果完全不识别载体语义，模型容易把底材、边框、孔位、阴影、场景噪声一起当成主体裁进去，影响后续 POD 使用。

控制边界：

+ 不识别也不注入平台信息、营销卖点、适用人群、商品用途、促销文案等弱相关信息。
+ 只识别会直接改变裁剪结果的结构化信息，例如：`载体品类`、`主体类型`、`结构风险点`。
+ 这部分识别结果属于辅助约束，优先级必须低于 `modeRequired / modeForbidden / universalNegative / universalQuality`。

推荐识别字段：

+ `podCropCategory`：载体/品类，例如 `手机壳 / 挂钟 / 徽章/贴纸 / 文字标语类 / 装饰画 / 铁皮画`
+ `subjectType`：主体类型，例如 `纯图形 / 文字主体 / 图文混排 / 场景叙事`
+ `structureRisks`：结构风险点，例如 `开孔干扰 / 边框干扰 / 圆形边界 / 主标题必须完整 / 主体贴边`
+ `recommendedMode`：识别后建议优先采用的模式，仅允许 `通用 / 铁皮画 / 装饰画`

模式适配要求：

+ 新增品类不能只停留在识别层，必须补齐“该品类在不同模式下如何裁”的适配配置。
+ 该部分不应继续混在品类识别总配置中，建议拆成独立配置：`AI商品图-图案裁剪-category_mode_adaptations.json`。
+ 每个 `podCropCategory` 都应至少包含：
+ `recommendedMode`：该品类默认建议模式。
+ `modeAdaptations.通用.valuePrompt`
+ `modeAdaptations.铁皮画.valuePrompt`
+ `modeAdaptations.装饰画.valuePrompt`
+ 目的不是新增更多模式，而是在现有三种模式下，把不同载体/品类的裁剪重点补完整。

推荐对应关系：

+ `默认` -> 建议模式：`通用`
+ `服装/纺织` -> 建议模式：`通用`
+ `手机壳` -> 建议模式：`通用`
+ `文字标语类` -> 建议模式：`通用`
+ `徽章/贴纸` -> 建议模式：`通用`
+ `挂钟` -> 建议模式：`装饰画`
+ `装饰画` -> 建议模式：`装饰画`
+ `铁皮画` -> 建议模式：`铁皮画`

推荐注入方式：

+ 不直接拼成长段商品描述。
+ 先做结构化识别，再映射成 1 段简短“载体识别约束”插入最终 prompt。
+ 插入位置建议放在 `parameterLine` 之后、`optionValuePrompts` 之前，作为中等优先级辅助约束。

示例：

```json
载体识别约束：当前图案主要用于手机壳印花，裁剪时避开开孔、边框和无关底材，优先保留中央主图案完整性。
```

## 4.2 载体和品类识别完整提示词
用途：

+ 用于基于用户上传的第 1 张图片，识别图案裁剪所需的载体/品类信息。
+ 输出结果用于回填 `podCropCategory`、`subjectType`、`structureRisks`，并进一步生成 `carrierRecognitionPrompt`。
+ 该识别任务服务于“裁剪决策”，不是商品卖点理解，也不是营销文案生成。

可直接使用的提示词：

```text
你是 POD 图案裁剪的载体与品类识别助手。你的任务不是生成商品描述，也不是判断营销卖点，而是基于用户上传的第 1 张图片，识别这张图案更适合应用在哪种载体/品类上，以及哪些结构风险会直接影响裁剪结果。

请只围绕“裁剪是否能保留主体完整、避开干扰、保证后续印花可用”来判断，不要输出与裁剪无关的信息。

识别目标：
1. 判断最合适的 `podCropCategory`。
2. 判断主体类型 `subjectType`。
3. 提取会直接影响裁剪的 `structureRisks`。
4. 生成 1 段简短、可直接拼入最终 prompt 的 `carrierRecognitionPrompt`。

`podCropCategory` 只允许从以下枚举中选择 1 个：
- 默认
- 服装/纺织
- 手机壳
- 文字标语类
- 徽章/贴纸
- 挂钟
- 装饰画
- 铁皮画

`subjectType` 只允许从以下枚举中选择 1 个：
- 纯图形
- 文字主体
- 图文混排
- 场景叙事

`structureRisks` 只允许从以下候选中选择 0 到 3 个最相关项：
- 开孔干扰
- 边框干扰
- 圆形边界
- 外轮廓闭合要求
- 主标题必须完整
- 主文案必须完整
- 主体贴边
- 纹样连续性
- 层次叙事不可截断
- 复古符号不可缺失

判定原则：
1. 如果图像明显是为某种 POD 载体结构服务，优先判断为具体载体，而不是“默认”。
2. 如果画面核心是文字内容，优先判断 `文字标语类`，并关注主标题、主文案是否完整。
3. 如果画面带明显复古金属牌、旧海报、徽记、怀旧文案、磨损颗粒等语义，优先考虑 `铁皮画`。
4. 如果画面强调完整叙事、装饰性构图、层次空间和展示感，优先考虑 `装饰画`。
5. 如果图像存在手机壳开孔、边框、壳体轮廓等特征，优先判断 `手机壳`。
6. 如果图像呈现圆形中心构图、适配表盘/挂钟语义，优先判断 `挂钟`。
7. 如果图像强调外轮廓闭合、切边友好、小尺寸独立贴附感，优先判断 `徽章/贴纸`。
8. 如果图像是连续纹样、布料花型、织物印花，优先判断 `服装/纺织`，并重点关注纹样连续性。
9. 如果没有足够强的载体特征，再回退为 `默认`。

输出要求：
1. 只输出一个 JSON 对象，不要输出任何额外解释。
2. 所有字段必须存在。
3. `confidence` 取 0 到 1 之间的小数。
4. `needsUserConfirm` 在识别不够确定、或多个品类都可能成立时设为 true。
5. `evidence` 提供 2 到 4 条简短依据，只描述可见特征，不要写空话。
6. `carrierRecognitionPrompt` 必须是一句可以直接拼入最终裁剪 prompt 的中文约束语，长度控制在 30 到 60 字，聚焦“保留什么、避开什么”。

请严格按以下 JSON 结构输出：
{
  "podCropCategory": "默认|服装/纺织|手机壳|文字标语类|徽章/贴纸|挂钟|装饰画|铁皮画",
  "subjectType": "纯图形|文字主体|图文混排|场景叙事",
  "structureRisks": ["风险1", "风险2"],
  "carrierRecognitionPrompt": "一句可直接拼入最终提示词的裁剪约束",
  "confidence": 0.0,
  "needsUserConfirm": false,
  "evidence": ["依据1", "依据2"]
}
```

推荐输出示例：

```json
{
  "podCropCategory": "手机壳",
  "subjectType": "图文混排",
  "structureRisks": ["开孔干扰", "边框干扰", "主体贴边"],
  "carrierRecognitionPrompt": "当前图案主要用于手机壳印花，裁剪时避开开孔、边框和无关底材，优先保留中央主图案完整性。",
  "confidence": 0.93,
  "needsUserConfirm": false,
  "evidence": [
    "画面存在明显手机壳轮廓和边框区域",
    "上方开孔区域会干扰主体完整裁剪",
    "主图案集中在壳体中央可印刷区域"
  ]
}
```

## 拼装规则
### 拼装顺序
1. `taskGoal`（任务目标）
2. `modeRulePrompt`（模式规则正文）
3. `parameterLine`（参数行）
4. `carrierRecognitionPrompt`（载体识别约束，可选）
5. `optionValuePrompts`（模式值扩展约束）
6. `requiredRule`（必须满足）
7. `forbiddenRule`（禁止事项）
8. `universalNegative`（通用负向约束）
9. `universalQuality`（通用质量要求）
10. `supplement`（补充说明，可选，当前页面无该字段）

组装要求：

+ `requiredRule / forbiddenRule / universalNegative / universalQuality` 属于不可裁剪段。
+ `carrierRecognitionPrompt` 属于可裁剪但建议保留段，优先级高于 `optionValuePrompts`，低于 `required / forbidden`。
+ token 超限时，仅允许按 `supplement -> optionValuePrompts -> carrierRecognitionPrompt -> modeRulePrompt` 顺序裁剪。
+ 当前无 `supplement` 时整段删除，不保留占位。

### 通用负向约束
```json
通用负向约束：
1. 严禁改变图案核心主题、品牌可识别元素和主视觉语义。
2. 严禁出现锯齿、毛边、白边、重影、脏边、涂抹感。
3. 严禁拉伸变形、透视错乱或比例失真。
4. 严禁引入文字水印、Logo、二维码、联系方式等风险元素。
5. 严禁输出低分辨率、过度锐化或过度降噪导致的质量劣化。
```

### 通用质量说明
```json
通用质量要求：
1. 裁剪准确：主体完整、关键元素不丢失。
2. 边缘质量：边界干净闭合，便于后续贴图与印制。
3. 细节保真：纹理、线条、色块层次清晰。
4. 构图可用：重心稳定、留白合理、比例适配业务场景。
5. 批次一致：同批次结果风格与清晰度一致。
```

### 拼装模板
```json
任务目标：基于上传商品图执行图案裁剪，输出主体完整、边缘干净、可直接用于POD后续链路的高质量图案结果。
模式规则：{modeRulesByTool[podCropMode].prompt}
裁剪参数：模式={podCropMode}；品类={podCropCategory}；主体类型={subjectType}；结构风险={structureRisks.join("、")}；建议模式={categoryModeAdaptations[podCropCategory].recommendedMode}。
载体识别约束：{carrierRecognitionPrompt}
品类规则：{categoryRules[podCropCategory].prompt}
品类-模式适配：{categoryModeAdaptations[podCropCategory].modeAdaptations[podCropMode].valuePrompt}
模式扩展约束：
[模式] {optionValueExpansions.podCropMode.values[podCropMode].valuePrompt}
[主体类型] {optionValueExpansions.subjectType.values[subjectType].valuePrompt}
[结构风险] {structureRisks.map(risk => optionValueExpansions.structureRisks.values[risk].valuePrompt).join(" ")}
必须满足（品类）：{categoryRules[podCropCategory].required.join("、")}
禁止（品类）：{categoryRules[podCropCategory].forbidden.join("、")}
必须满足：{modeRulesByTool[podCropMode].required.join("、")}
禁止：{modeRulesByTool[podCropMode].forbidden.join("、")}
{modeRulesByTool.universalNegativePrompt}
{modeRulesByTool.universalQualityPrompt}
补充说明：{supplementText}
```

载体识别接入后的具体拼装参数：

+ `podCropMode`：用户当前选择的模式，始终优先于识别推荐模式。
+ `podCropCategory`：载体/品类识别结果，例如 `手机壳 / 挂钟 / 文字标语类`。
+ `subjectType`：主体类型识别结果，例如 `纯图形 / 图文混排 / 场景叙事`。
+ `structureRisks`：结构风险数组，例如 `["开孔干扰", "边框干扰", "主体贴边"]`。
+ `carrierRecognitionPrompt`：识别模型直接产出的载体约束语句。
+ `categoryRules[podCropCategory].prompt`：品类规则正文。
+ `categoryRules[podCropCategory].required`：品类必须满足项。
+ `categoryRules[podCropCategory].forbidden`：品类禁止项。
+ `categoryModeAdaptations[podCropCategory].recommendedMode`：品类建议模式。
+ `categoryModeAdaptations[podCropCategory].modeAdaptations[podCropMode].valuePrompt`：当前品类在当前模式下的适配提示词。
+ `optionValueExpansions.podCropMode.values[podCropMode].valuePrompt`：模式值扩展提示词。
+ `optionValueExpansions.subjectType.values[subjectType].valuePrompt`：主体类型扩展提示词。
+ `optionValueExpansions.structureRisks.values[risk].valuePrompt`：单个结构风险扩展提示词，多个风险按数组顺序拼接。

模式与识别结果不一致时的处理：

+ 若 `recommendedMode != podCropMode`，最终仍按用户选择的 `podCropMode` 组装。
+ 此时 `recommendedMode` 只作为参数透出和前端提示，不直接覆盖用户模式。
+ 真正进入 prompt 的仍是当前模式对应的 `modePrompt + podCropModeValuePrompt + categoryModeAdaptationPrompt`。

## 5. 拼装 Demo（输入 + 输出）
### 5.1 Demo 输入
```json
{
  "toolKey": "pod-crop",
  "podCropMode": "铁皮画",
  "podCropCategory": "手机壳",
  "subjectType": "图文混排",
  "structureRisks": ["开孔干扰", "边框干扰", "主体贴边"],
  "recommendedMode": "通用",
  "carrierRecognitionPrompt": "当前图案主要用于手机壳印花，裁剪时避开开孔、边框和无关底材，优先保留中央主图案完整性。"
}
```

### 5.2 Demo 输出
```json
任务目标：基于上传商品图执行图案裁剪，输出主体完整、边缘干净、可直接用于POD后续链路的高质量图案结果。

模式规则：适配铁皮画类图案裁剪，强调主体图形力量感、边缘张力和复古质感语义保真。

裁剪参数：模式=铁皮画；品类=手机壳；主体类型=图文混排；结构风险=开孔干扰、边框干扰、主体贴边；建议模式=通用。

载体识别约束：当前图案主要用于手机壳印花，裁剪时避开开孔、边框和无关底材，优先保留中央主图案完整性。

品类规则：优先围绕壳体印花主区域裁剪，避免把开孔和边框干扰当成主体。

品类-模式适配：若用户选择铁皮画模式，优先保留复古主图案和主文案，同时继续避开开孔与边框干扰。

模式扩展约束：
[模式] 按铁皮画语义裁剪，保留复古颗粒、磨损细节与硬朗图形关系，避免关键文案和徽标被切断。

必须满足（品类）：主体图案完整、开孔干扰被正确规避。

禁止（品类）：开孔遮挡核心图案。

必须满足：保留铁皮画核心图形与主文案关系、保持磨损感/颗粒感等风格细节可辨、构图重心稳定，避免关键元素贴边被切、输出适合后续排版与印制。

禁止：误删关键符号、主标题或视觉锚点、复古纹理被过度降噪抹平、新增与原主题不一致的装饰元素、裁剪后边缘出现破损感伪影。

通用负向约束：
1. 严禁改变图案核心主题、品牌可识别元素和主视觉语义。
2. 严禁出现锯齿、毛边、白边、重影、脏边、涂抹感。
3. 严禁拉伸变形、透视错乱或比例失真。
4. 严禁引入文字水印、Logo、二维码、联系方式等风险元素。
5. 严禁输出低分辨率、过度锐化或过度降噪导致的质量劣化。

通用质量要求：
1. 裁剪准确：主体完整、关键元素不丢失。
2. 边缘质量：边界干净闭合，便于后续贴图与印制。
3. 细节保真：纹理、线条、色块层次清晰。
4. 构图可用：重心稳定、留白合理、比例适配业务场景。
5. 批次一致：同批次结果风格与清晰度一致。
```

## 三个关键能力的提示词配置
### 图片识别获取信息
当前功能没有显式图片识别链路，可不接该模块。

若后续接入识别，当前最应该识别的是 `podCropMode`，而不是额外扩展字段。

### AI帮写
当前功能没有显式 `AI assist` 入口，可不接该模块。

### 文本润色
当前功能没有显式 `supplement` 输入框，可不接该模块。

## 结论
POD 印花 > 图案裁剪当前是一个“轻字段、强规则”的功能：

1. 当前真实业务字段只有 `podCropMode`。
2. 当前最核心的开发落点是把模式规则、模式值扩展、通用硬约束组装成稳定 prompt。
3. 当前没有平台字段、没有高级设置、没有补充说明，也没有显式 AI 识别入口。
4. 当前最适合围绕“模式规则 + 模式值扩展 + 固定拼装顺序”实现，不要把非必要扩展提前混入当前主链路。 
