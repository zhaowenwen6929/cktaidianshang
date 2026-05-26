## 使用流程
1. 上传素材（`upload-main`）
2. 选择品类（`podPartialEditCategory`）
3. 选择改图要求（`podPartialEditRequirement`）
4. 填写结构化字段或自定义提示词
5. 选择出图数量（`podPartialEditOutputCount`）
6. 生成

## 端到端使用流程
1. 用户上传素材。
2. 系统基于上传文件名关键词自动推断默认 `podPartialEditCategory`，用户也可手动切换。
3. 用户选择改图要求：`替换“文字”和元素 / 去除商品印花 / 商品换色 / 服饰做纹理 / 自定义提示词`。
4. 系统根据当前改图要求渲染对应结构化表单：
   - 非 `自定义提示词`：展示结构化字段面板，并自动生成 `podPartialEditInstructionText`
   - `自定义提示词`：直接输入自由提示词，并将原文写入 `podPartialEditInstructionText`
5. 用户选择出图数量。
6. 系统按 `模式规则 + 品类规则 + 结构化字段扩展 + 通用硬约束` 组装最终提示词并提交。
7. 输出仅修改指定局部区域、可直接用于 POD 后续链路的局部改图结果。

## 真实功能与字段（Source of Truth）
代码来源：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

```json
{
  "toolKey": "pod-partial-edit",
  "creationModeConfigKey": "default",
  "sectionOrder": ["upload-main", "pod-partial-edit-setup"],
  "uploads": {
    "main": {
      "label": "上传素材",
      "maxCount": 24
    }
  },
  "currentFields": {
    "podPartialEditCategory": ["默认", "服装/纺织", "手机壳", "铁艺图形", "挂钟", "装饰画", "铁皮画"],
    "podPartialEditRequirement": ["替换“文字”和元素", "去除商品印花", "商品换色", "服饰做纹理", "自定义提示词"],
    "podPartialEditFieldValues": "结构化字段 JSON 字符串",
    "podPartialEditInstructionText": "最终改图指令文本",
    "podPartialEditOutputCount": ["1", "2", "3", "4"]
  },
  "creationModeSelection": {
    "modeId": "pod-partial-edit",
    "modeLabel": "跟随 podPartialEditRequirement",
    "ratio": "1:1",
    "count": "跟随 podPartialEditOutputCount",
    "unitCreditCost": 5
  }
}
```

补充业务事实：

+ 当前页面无独立 `supplement`
+ 当前页面无显式 `AI assist`
+ 当前页面会调用 `onCreationModeChange`，并固定注入：`modeId=pod-partial-edit`、`ratio=1:1`、`unitCreditCost=5`
+ `podPartialEditInstructionText` 是当前功能的核心执行字段，不是普通备注字段
+ 非 `自定义提示词` 时，`podPartialEditInstructionText` 由结构化模板自动拼成 JSON 文本
+ `自定义提示词` 时，`podPartialEditInstructionText` 直接等于用户输入原文

## 1.1 计费与出图数量
```json
{
  "creditRule": {
    "unitCreditCost": 5,
    "formula": "上传素材张数 × podPartialEditOutputCount × 5"
  },
  "outputCountRule": {
    "field": "podPartialEditOutputCount",
    "options": ["1", "2", "3", "4"]
  }
}
```

补充说明：

+ 当前积分口径参考 [AI功能积分计算规则（按白底图口径补齐）.md](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI功能积分计算规则（按白底图口径补齐）.md)
+ `podPartialEditOutputCount` 同时影响前端展示的 `count` 和实际结果数量
+ `ratio=1:1` 当前固定来自 `onCreationModeChange`，不是用户可选项

## 2. 模式提示词配置
说明：

+ `pod-partial-edit` 没有平台规则，一级主规则来自 `podPartialEditRequirement`
+ 不同改图要求不是简单文案切换，而是对应不同的局部编辑边界和质量约束
+ `ruleLevel` 当前统一按 `A` 处理，因为模式规则直接决定“能改什么、不能改什么”

```json
{
  "modeRulesByTool": {
    "替换“文字”和元素": {
      "ruleLevel": "A",
      "prompt": "仅替换局部文案和装饰元素，主体商品、构图、材质、光影和印刷逻辑必须保持不变。",
      "required": [
        "替换范围仅限用户指定局部区域",
        "替换后文字可读且与主题一致",
        "装饰元素与主体风格统一",
        "输出可直接用于POD后续上版"
      ],
      "forbidden": [
        "修改商品主体结构",
        "出现乱码或错拼或不可读文案",
        "新增侵权Logo或品牌标识",
        "整图重绘导致原图语义丢失"
      ]
    },
    "去除商品印花": {
      "ruleLevel": "A",
      "prompt": "清除商品局部印花或图案，保留底材纹理、材质质感与原始光影关系，保证去除后可继续二次设计。",
      "required": [
        "待去除图案区域清理干净",
        "底材纹理和明暗过渡自然连续",
        "不破坏主体形体与边缘",
        "结果可作为后续印花承载底图"
      ],
      "forbidden": [
        "残留明显印花痕迹",
        "出现涂抹感或马赛克或补丁感",
        "破坏商品轮廓和缝线细节",
        "改变商品材质属性"
      ]
    },
    "商品换色": {
      "ruleLevel": "A",
      "prompt": "在保持结构与材质逻辑不变的前提下执行局部或主体换色，确保颜色映射自然且商业可售。",
      "required": [
        "仅改目标部位颜色",
        "保留高光阴影与体积关系",
        "颜色边界干净无溢出",
        "多材质区域色彩过渡自然"
      ],
      "forbidden": [
        "改坏原有结构和轮廓",
        "颜色污染非目标区域",
        "出现脏色、断层或条带",
        "改变材质真实观感"
      ]
    },
    "服饰做纹理": {
      "ruleLevel": "A",
      "prompt": "在服饰或纺织品局部增加或替换纹理，保持版型、褶皱、垂感与缝线结构，保证纹理可印刷与可复用。",
      "required": [
        "纹理方向与衣片结构一致",
        "纹理尺度与服饰比例匹配",
        "保留服饰褶皱和缝线逻辑",
        "输出纹理细节清晰可印刷"
      ],
      "forbidden": [
        "纹理拉伸变形严重",
        "覆盖领口或袖口等结构导致失真",
        "出现拼接缝和重复贴图痕迹",
        "把服饰改成不合理新材质"
      ]
    },
    "自定义提示词": {
      "ruleLevel": "A",
      "prompt": "严格执行用户自定义局部改图指令，同时保持商品主体结构、材质与可售属性稳定。",
      "required": [
        "遵循用户自定义修改范围",
        "仅进行必要局部编辑",
        "输出结果与原图SKU一致",
        "保留商业可用性与可印刷性"
      ],
      "forbidden": [
        "超范围改图",
        "主体验证点丢失",
        "引入侵权和违规元素",
        "低质量修补痕迹"
      ]
    }
  }
}
```

## 3. 品类提示词配置
说明：

+ `podPartialEditCategory` 是当前页面真实字段
+ 品类规则的作用是限制局部修改不能破坏不同载体的结构、孔位、纹理方向和印刷可用性
+ 默认品类按通用品类执行，不等于无规则

```json
{
  "categoryRulesByTool": {
    "默认": {
      "label": "默认",
      "ruleLevel": "A",
      "prompt": "按通用商品局部改图策略执行：保留结构与材质，局部修改可控，避免整图语义漂移。",
      "required": ["商品主体完整可辨", "局部边界自然干净", "不影响后续POD生产可用性"],
      "forbidden": ["主体形变", "边缘脏污", "结构逻辑错误"]
    },
    "服装/纺织": {
      "label": "服装/纺织",
      "ruleLevel": "A",
      "prompt": "服装或纺织类改图需保持版型、褶皱、缝线、垂感和纹理方向真实，不得破坏衣片结构。",
      "required": ["保留领口袖口下摆等关键结构", "纹理走向与衣片一致", "面料质感和阴影关系自然"],
      "forbidden": ["衣片比例异常", "缝线断裂或错位", "材质失真发塑料感"]
    },
    "手机壳": {
      "label": "手机壳",
      "ruleLevel": "A",
      "prompt": "手机壳类需保持壳体开孔、边框厚度、弧面透视和边缘包裹关系准确，不得改坏结构。",
      "required": ["保留摄像头孔位与按键开孔逻辑", "保留壳体边缘厚度与弧度", "保留壳体材质反光关系"],
      "forbidden": ["孔位错位", "边框扭曲", "壳体变形", "结构比例异常"]
    },
    "铁艺图形": {
      "label": "铁艺图形",
      "ruleLevel": "A",
      "prompt": "铁艺图形类需强调边缘硬朗度、金属反光与线条闭合，避免局部修补导致锯齿和断边。",
      "required": ["边缘闭合清晰", "金属高光逻辑合理", "图形比例稳定"],
      "forbidden": ["断线断边", "高光脏污", "几何结构畸变"]
    },
    "挂钟": {
      "label": "挂钟",
      "ruleLevel": "A",
      "prompt": "挂钟类需保持圆盘几何、刻度关系、指针层级与中心轴结构正确，避免透视错乱。",
      "required": ["刻度分布合理", "指针结构清晰", "圆盘透视稳定"],
      "forbidden": ["刻度错位", "指针穿帮", "盘面拉伸变形"]
    },
    "装饰画": {
      "label": "装饰画",
      "ruleLevel": "A",
      "prompt": "装饰画类需保持画芯、边框与留白关系，注意画面质感与印刷清晰度，避免压缩伪影。",
      "required": ["画面主体清晰", "边框或留白比例合理", "细节可印刷"],
      "forbidden": ["边框变形", "画芯糊化", "明显压缩噪点"]
    },
    "铁皮画": {
      "label": "铁皮画",
      "ruleLevel": "A",
      "prompt": "铁皮画类需保留金属底材颗粒、做旧痕迹和边缘压铆或卷边感，局部修改不能破坏复古质感。",
      "required": ["金属底材纹理连续", "做旧风格统一", "边缘结构稳定"],
      "forbidden": ["金属质感丢失", "做旧风格断层", "边缘开裂伪影"]
    }
  }
}
```

## 4. 高级选项值扩展提示词配置
说明：

+ `pod-partial-edit` 没有独立的高级设置面板，但当前 setup 中存在大量结构化字段，这些字段都需要进入最终 prompt
+ 当前真正的“执行提示词”有两层：
  - 第一层：`podPartialEditRequirement` 命中的模式值扩展
  - 第二层：`podPartialEditFieldValues` 中各结构化字段命中的字段级扩展
+ `podPartialEditInstructionText` 是这些结构化字段最终拼出来的指令载体

### 4.1 改图要求值扩展
```json
{
  "optionValueExpansions": {
    "podPartialEditRequirement": {
      "fieldKey": "podPartialEditRequirement",
      "name": "改图要求",
      "values": {
        "替换“文字”和元素": { "valuePrompt": "重点控制文字替换准确性、元素风格一致性和局部排版秩序。" },
        "去除商品印花": { "valuePrompt": "重点控制去除区域干净度、底材连续性和无补丁痕迹。" },
        "商品换色": { "valuePrompt": "重点控制颜色映射自然性、边界精度和材质保真。" },
        "服饰做纹理": { "valuePrompt": "重点控制纹理方向、纹理尺度和服饰结构适配。" },
        "自定义提示词": { "valuePrompt": "严格按用户自定义局部改图要求执行，禁止超范围修改。" }
      }
    }
  }
}
```

### 4.2 结构化字段扩展
```json
{
  "optionValueExpansionsByTool": {
    "podPartialEditRequirement": {
      "替换“文字”和元素": {
        "targetText": {
          "valuePrompt": "目标文案需清晰可读且与原排版层级匹配。",
          "negative": "禁止乱码、错拼、不可读文字。"
        },
        "elementDescription": {
          "valuePrompt": "新增元素需与原风格一致并保持可印刷细节。",
          "negative": "禁止引入与主题无关的装饰或侵权元素。"
        },
        "referenceImage": {
          "valuePrompt": "若提供参考图，仅提取风格特征，不直接搬运版权内容。",
          "negative": "禁止直接照搬受版权保护的图案。"
        }
      },
      "去除商品印花": {
        "removeArea": {
          "valuePrompt": "去除区域应明确到商品的具体位置，避免误删主体结构。",
          "negative": "禁止去除范围不明导致主体误伤。"
        },
        "retainTexture": {
          "valuePrompt": "优先保留原底材纹理与微光泽，确保去除后自然。",
          "negative": "禁止底材被抹平或失去材质感。"
        }
      },
      "商品换色": {
        "targetPart": {
          "valuePrompt": "目标部位需明确到主体、边框、背景或局部细节。",
          "negative": "禁止颜色溢出到非目标区域。"
        },
        "targetColor": {
          "valuePrompt": "目标颜色需服务真实售卖观感，兼顾高光与阴影过渡。",
          "negative": "禁止死板平涂导致材质失真。"
        }
      },
      "服饰做纹理": {
        "textureType": {
          "valuePrompt": "纹理类型要和服饰材质、风格及商品定位一致。",
          "negative": "禁止使用与面料逻辑冲突的纹理。"
        },
        "textureReference": {
          "valuePrompt": "纹理参考图仅用于风格约束，不直接复制具体图案版权资产。",
          "negative": "禁止直接搬运参考图原样内容。"
        },
        "textureDirection": {
          "valuePrompt": "纹理方向需与衣片结构、褶皱走向和受力逻辑一致。",
          "negative": "禁止纹理逆向拉伸或断裂。"
        }
      },
      "自定义提示词": {
        "customPrompt": {
          "valuePrompt": "严格执行用户自定义局部改图指令。",
          "negative": "禁止超范围修改与任务无关内容。"
        }
      }
    }
  }
}
```

## 5. 结构化模板与指令文本规则
说明：

+ `podPartialEditInstructionText` 是最终给生成链路消费的局部改图指令
+ 非 `自定义提示词` 时，它不是自然语言自由文本，而是结构化 JSON 字符串
+ 自定义模式下，它才是用户原始自然语言输入

### 5.1 非自定义模式的模板结构
```json
{
  "type": "template.key",
  "title": "template.label",
  "fields": [
    {
      "key": "field.key",
      "label": "field.label",
      "type": "field.type",
      "value": "当前字段值"
    }
  ]
}
```

### 5.2 当前模板来源
```json
{
  "templates": {
    "替换“文字”和元素": ["note", "targetText", "elementDescription", "referenceImage"],
    "去除商品印花": ["note", "removeArea", "retainTexture"],
    "商品换色": ["note", "targetPart", "targetColor"],
    "服饰做纹理": ["note", "textureType", "textureReference", "textureDirection"],
    "自定义提示词": ["customPrompt"]
  }
}
```

开发要求：

+ 非 `自定义提示词` 时，后端应优先解析 `podPartialEditFieldValues`，并将 `podPartialEditInstructionText` 视为结构化快照文本
+ `note` 是说明字段，只用于前端辅助展示和快照保留，不建议直接转换成强执行约束
+ `image` 类型字段当前前端承载的是文本输入框，本质上传的是“参考图链接或说明”

## 6. 品类自动推断规则
说明：

+ 当前功能存在自动默认品类逻辑，但不是大模型识别
+ 该逻辑来自上传文件名关键词推断，用于预填 `podPartialEditCategory`

```json
{
  "inferPodPartialEditCategory": {
    "source": "上传文件名关键词",
    "rules": [
      "匹配 fabric|textile|cloth|服装|纺织|布料|面料|服饰 -> 服装/纺织",
      "匹配 phone|case|手机壳|壳 -> 手机壳",
      "匹配 iron|metal|铁艺|图形 -> 铁艺图形",
      "匹配 clock|挂钟 -> 挂钟",
      "匹配 decor|frame|装饰画 -> 装饰画",
      "匹配 tin|plate|铁皮画 -> 铁皮画",
      "都不命中 -> 默认"
    ]
  }
}
```

开发要求：

+ 文件名推断只用于默认值，不应覆盖用户手动改写结果
+ 当前实现没有像印花图裂变那样的“手动锁定 ref”，如果上传内容变化导致重新推断，前端会更新品类

## 拼装规则
### 拼装顺序
1. `taskGoal`（任务目标）
2. `modeRulePrompt`（改图要求规则正文）
3. `categoryRulePrompt`（品类规则正文）
4. `parameterLine`（参数行）
5. `requirementValuePrompt`（改图要求值扩展）
6. `structuredFieldPrompts`（结构化字段展开段）
7. `structuredFieldNegatives`（结构化字段禁止项段）
8. `requiredRule`（模式和品类必须满足）
9. `forbiddenRule`（模式和品类禁止事项）
10. `universalNegative`（通用负向约束）
11. `universalQuality`（通用质量要求）
12. `instructionText`（局部改图指令快照）

组装要求：

+ `requiredRule / forbiddenRule / universalNegative / universalQuality` 属于不可裁剪段
+ token 超限时，仅允许按 `instructionText -> structuredFieldPrompts -> requirementValuePrompt -> categoryRulePrompt -> modeRulePrompt` 顺序裁剪
+ `instructionText` 当前不是普通 supplement，而是核心任务快照，应保留在末段便于回放和排查
+ 自定义模式下，`structuredFieldPrompts` 只保留 `customPrompt` 命中段

### 通用负向约束
```json
通用负向约束：1. 严禁改变商品主体结构与核心售卖属性。2. 严禁输出脏边、锯齿、重影、文字糊化、低清晰度。3. 严禁新增水印、Logo、二维码、联系方式、侵权元素。4. 严禁虚构商品功能、附赠物和误导性表达。5. 严禁整图风格漂移导致与原SKU不一致。
```

### 通用质量说明
```json
通用质量要求：1. 局部边界干净、过渡自然、无明显修补痕迹。2. 主体材质、光影、透视与原图一致. 3. 文案和元素层级清晰、可读、可印刷。4. 结果可直接进入POD后续链路（裂变/连续图/尺寸延展/上版）。5. 同批次结果风格与清晰度一致。
```

### 拼装模板
```json
任务目标：在保持商品主体结构、材质逻辑与商业可售性的前提下执行局部改图，仅修改用户指定区域，不做整图重绘。
改图要求规则：{requirementPrompt}
品类规则：当前品类为「{podPartialEditCategory}」，{categoryPrompt}
改图参数：品类={podPartialEditCategory}；改图要求={podPartialEditRequirement}；出图数量={podPartialEditOutputCount}。
改图要求扩展：{podPartialEditRequirementValuePrompt}
结构化字段约束：{structuredFieldValuePromptsJoined}
结构化字段禁止：{structuredFieldNegativePromptsJoined}
必须满足：{requiredJoined}
禁止：{forbiddenJoined}
{universalNegativePrompt}
{universalQualityPrompt}
改图指令快照：{podPartialEditInstructionText}
```

## 8. 拼装 Demo（输入 + 输出）
### 8.1 Demo 输入
```json
{
  "toolKey": "pod-partial-edit",
  "podPartialEditCategory": "手机壳",
  "podPartialEditRequirement": "替换“文字”和元素",
  "podPartialEditFieldValues": {
    "note": "适用于海报、挂画、包装等需要替换局部文案和装饰元素的素材。",
    "targetText": "SUMMER VIBES",
    "elementDescription": "右下角替换为简洁太阳图标和波浪线元素",
    "referenceImage": "参考海报风格，不直接照搬原图案"
  },
  "podPartialEditInstructionText": "{...结构化JSON字符串...}",
  "podPartialEditOutputCount": "2"
}
```

### 8.2 Demo 输出
```json
任务目标：在保持商品主体结构、材质逻辑与商业可售性的前提下执行局部改图，仅修改用户指定区域，不做整图重绘。

改图要求规则：仅替换局部文案和装饰元素，主体商品、构图、材质、光影和印刷逻辑必须保持不变。

品类规则：当前品类为「手机壳」，手机壳类需保持壳体开孔、边框厚度、弧面透视和边缘包裹关系准确，不得改坏结构。

改图参数：品类=手机壳；改图要求=替换“文字”和元素；出图数量=2。

改图要求扩展：重点控制文字替换准确性、元素风格一致性和局部排版秩序。

结构化字段约束：目标文案需清晰可读且与原排版层级匹配。新增元素需与原风格一致并保持可印刷细节。若提供参考图，仅提取风格特征，不直接搬运版权内容。

结构化字段禁止：禁止乱码、错拼、不可读文字。禁止引入与主题无关的装饰或侵权元素。禁止直接照搬受版权保护的图案。

必须满足：替换范围仅限用户指定局部区域、替换后文字可读且与主题一致、装饰元素与主体风格统一、输出可直接用于POD后续上版、保留摄像头孔位与按键开孔逻辑、保留壳体边缘厚度与弧度、保留壳体材质反光关系。

禁止：修改商品主体结构、出现乱码或错拼或不可读文案、新增侵权Logo或品牌标识、整图重绘导致原图语义丢失、孔位错位、边框扭曲、壳体变形、结构比例异常。

通用负向约束：1. 严禁改变商品主体结构与核心售卖属性。2. 严禁输出脏边、锯齿、重影、文字糊化、低清晰度。3. 严禁新增水印、Logo、二维码、联系方式、侵权元素。4. 严禁虚构商品功能、附赠物和误导性表达。5. 严禁整图风格漂移导致与原SKU不一致。

通用质量要求：1. 局部边界干净、过渡自然、无明显修补痕迹。2. 主体材质、光影、透视与原图一致。3. 文案和元素层级清晰、可读、可印刷。4. 结果可直接进入POD后续链路（裂变/连续图/尺寸延展/上版）。5. 同批次结果风格与清晰度一致。

改图指令快照：{
  "type": "replace-text-elements",
  "title": "替换“文字”和元素",
  "fields": [
    { "key": "note", "label": "说明", "type": "text", "value": "适用于海报、挂画、包装等需要替换局部文案和装饰元素的素材。" },
    { "key": "targetText", "label": "目标文案", "type": "input", "value": "SUMMER VIBES" },
    { "key": "elementDescription", "label": "元素描述", "type": "input", "value": "右下角替换为简洁太阳图标和波浪线元素" },
    { "key": "referenceImage", "label": "参考图片", "type": "image", "value": "参考海报风格，不直接照搬原图案" }
  ]
}
```

## 三个关键能力的提示词配置
### 图片识别获取信息
当前功能没有显式大模型识别入口。

当前已有的自动能力是：

+ `podPartialEditCategory` 通过上传文件名关键词自动推断默认值

因此当前不建议把这一段写成“大模型图片识别主链路”，否则会和现状不一致。

若后续要接识别链路，更适合识别的是：

+ 待改区域位置倾向
+ 当前素材更适合哪种改图要求
+ 文字区域、印花区域、主体区域的视觉分布

但这些都属于后续增强项，不属于当前主流程必做项。

### AI帮写
当前功能没有显式 `AI assist` 入口，可不接该模块。

### 文本润色
当前功能没有单独的润色入口。

但 `自定义提示词` 模式下，若后续需要补能力，最适合接的是“局部改图指令润色”，而不是商品图卖点文案润色。

## 结论
POD 印花 > 局部改图当前是一个“结构化模板驱动 + 指令文本承载”的功能：

1. 主链路字段不只是 `podPartialEditRequirement`，还包括 `podPartialEditCategory / podPartialEditFieldValues / podPartialEditInstructionText / podPartialEditOutputCount`。
2. `podPartialEditInstructionText` 是核心执行字段，非自定义模式下由结构化模板自动生成，不应等同于普通补充说明。
3. 当前唯一自动推断能力是基于文件名关键词的品类默认值，不是大模型识别。
4. 当前没有平台规则、没有独立 supplement、没有显式 AI 帮写，因此文档应围绕“模式规则 + 品类规则 + 结构化字段扩展 + 固定拼装顺序”实现。
