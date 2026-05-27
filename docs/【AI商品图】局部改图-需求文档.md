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
        "服饰贴纹理": { "valuePrompt": "重点控制纹理贴合自然、服饰结构稳定和纹理可印刷性。" },
        "自定义提示词": { "valuePrompt": "严格按用户自定义局部改图要求执行，禁止超范围修改。" }
      }
    }
  }
}
```

### 4.1.1 仅保留“改图类型 + 提示词”的简化配置
说明：

+ 该配置仅保留模式描述与最终 prompt 相关字段。
+ 展示说明类字段不再放在这层，避免前端展示语义与模型执行语义混用。

```json
{
  "podPartialEditRequirementPrompts": {
    "替换“文字”和元素": {
      "description": "仅替换局部文案和装饰元素，不改动商品主体、结构、材质和整体构图。",
      "modePrompt": "仅替换局部文案和装饰元素，主体商品、构图、材质、光影和印刷逻辑必须保持不变。",
      "valuePrompt": "重点控制文字替换准确性、元素风格一致性和局部排版秩序。",
      "negativePrompt": "禁止重画主体商品，禁止改变整体构图，禁止出现乱码、错拼或与原风格冲突的元素。"
    },
    "去除商品印花": {
      "description": "移除商品表面的原有印花或图案，同时保留底材纹理、材质质感和结构完整性。",
      "modePrompt": "清除商品局部印花或图案，保留底材纹理、材质质感与原始光影关系，保证去除后可继续二次设计。",
      "valuePrompt": "重点控制去除区域干净度、底材连续性和无补丁痕迹。",
      "negativePrompt": "禁止误伤商品主体结构，禁止留下残影、脏边、补丁感或明显修补痕迹。"
    },
    "商品换色": {
      "description": "改变商品整体或局部部位颜色，同时保持结构、材质、高光和阴影逻辑不变。",
      "modePrompt": "在保持结构与材质逻辑不变的前提下执行局部或主体换色，确保颜色映射自然且商业可售。",
      "valuePrompt": "重点控制颜色映射自然性、边界精度和材质保真。",
      "negativePrompt": "禁止改变商品结构和材质逻辑，禁止颜色溢出、脏色、死板平涂或高光阴影失真。"
    },
    "服饰贴纹理": {
      "description": "将上传的纹理图贴到画面中的服饰区域，保持版型、褶皱、缝线和材质逻辑稳定。",
      "modePrompt": "将上传的纹理图自然贴合到画面中的服饰区域，保持服饰版型、褶皱、垂感、缝线结构与原始光影逻辑稳定。",
      "valuePrompt": "重点控制纹理贴合自然、服饰结构稳定和纹理可印刷性。",
      "negativePrompt": "禁止纹理像贴纸一样悬浮表面，禁止破坏服饰版型、垂感、缝线逻辑或出现错位、拉伸、断裂。"
    },
    "自定义提示词": {
      "description": "直接输入自由局部改图指令，不走结构化模板，系统按用户原文执行。",
      "modePrompt": "严格执行用户自定义局部改图指令，同时保持商品主体结构、材质与可售属性稳定。",
      "valuePrompt": "严格按用户自定义局部改图要求执行，禁止超范围修改。",
      "negativePrompt": "禁止偏离用户原始指令，禁止修改任务无关区域，禁止破坏商品主体结构、材质和可售性。"
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
        "sourceContent": {
          "valuePrompt": "待替换内容需指向清晰，能够准确定位到画面中的原文字、原元素或原局部内容。",
          "negative": "禁止替换对象描述模糊，禁止范围不明导致误改非目标内容。"
        },
        "replacementContents": {
          "valuePrompt": "每条替换后的内容都需清晰可执行，并与对应原内容建立一一替换关系，保持语义准确与画面风格一致。",
          "negative": "禁止替换后内容缺失、顺序混乱、语义不完整，禁止新增与原画面无关的信息。"
        }
      },
      "去除商品印花": {
        "sourceContent": {
          "valuePrompt": "待去除内容需明确指向画面中的原印花、原图案或原局部视觉元素，避免误伤商品主体结构。",
          "negative": "禁止去除对象描述模糊，禁止误删主体结构、边缘轮廓或非目标区域。"
        },
        "removeHint": {
          "valuePrompt": "将指定内容去除后，应恢复为干净自然、可继续设计的白底承载面。",
          "negative": "禁止留下残影、脏边、补丁感或明显修补痕迹。"
        }
      },
      "商品换色": {
        "sourceContent": {
          "valuePrompt": "待换色内容需明确指向画面中的原部位、原色块或原局部区域，避免颜色修改范围失控。",
          "negative": "禁止换色对象描述模糊，禁止颜色溢出到非目标区域。"
        },
        "replacementColors": {
          "valuePrompt": "每个目标颜色都需服务真实售卖观感，兼顾材质、高光、阴影和多色关系过渡。",
          "negative": "禁止死板平涂、颜色脏污、材质失真或多色关系混乱。"
        }
      },
      "服饰贴纹理": {
        "textureUpload": {
          "valuePrompt": "上传的纹理图需自然贴合到画面中的服饰区域，并顺应衣片结构、褶皱走向与受力逻辑。",
          "negative": "禁止纹理直接生硬平铺，禁止逆向拉伸、错位、断裂或破坏服饰结构。"
        },
        "textureHint": {
          "valuePrompt": "将上传的纹理贴到画面中的服饰后，需保证整体仍具备商业可售性与可印刷性。",
          "negative": "禁止纹理覆盖后导致服饰主体失真、结构错乱或无法用于后续上版。"
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
    "替换“文字”和元素": ["note", "sourceContent", "replacementContents"],
    "去除商品印花": ["sourceContent", "removeHint"],
    "商品换色": ["sourceContent", "replacementColors"],
    "服饰贴纹理": ["textureUpload", "textureHint"],
    "自定义提示词": ["customPrompt"]
  }
}
```

### 5.3 改图要求与下方选项总表（可直接开发）
说明：

+ `podPartialEditRequirementSchemas`：用于前端渲染局部改图各模式下方的结构化表单，并作为字段级提示词拼装来源。
+ 该 JSON 用于前端根据 `podPartialEditRequirement` 渲染下方结构化表单。
+ 每个改图要求都包含：要求描述、字段列表、字段说明、字段类型、是否必填、字段值对应的提示词约束。
+ 非 `自定义提示词` 时，前端应根据这里的字段生成 `podPartialEditFieldValues`，再拼装为 `podPartialEditInstructionText`。
+ `note` 属于辅助说明字段，当前故意不配置执行型 `valuePrompt / negative`，避免弱约束噪声覆盖主指令。

```json
{
  "podPartialEditRequirementSchemas": {
    "替换“文字”和元素": {
      "label": "替换“文字”和元素",
      "description": "用于只替换局部文案和装饰元素，不改动商品主体、结构、材质和整体构图。",
      "instructionType": "structured",
      "fields": [
        {
          "key": "note",
          "label": "备注说明",
          "type": "textarea",
          "required": false,
          "description": "补充说明改图范围、风格偏好或局部限制，仅用于快照和辅助理解。",
          "valuePrompt": "",
          "negative": ""
        },
        {
          "key": "sourceContent",
          "label": "需要替换的内容",
          "type": "textarea",
          "required": true,
          "defaultValue": "输入画面中需要替换的内容",
          "description": "填写画面中当前需要被替换的文字、元素名称或局部内容描述，要求指向明确。",
          "valuePrompt": "待替换内容需指向清晰，能够准确定位到画面中的原文字、原元素或原局部内容。",
          "negative": "禁止替换对象描述模糊，禁止范围不明导致误改非目标内容。"
        },
        {
          "key": "replacementContents",
          "label": "替换后的内容",
          "type": "dynamic_list",
          "required": true,
          "minItems": 1,
          "maxItems": 10,
          "addable": true,
          "addButtonLabel": "+",
          "autoIndexLabel": true,
          "itemLabelTemplate": "替换后的内容{{index}}",
          "itemDefaultValue": "输入替换后的内容",
          "description": "填写替换后的目标内容，支持点击小加号连续新增多条，系统自动编号，最多 10 条。",
          "valuePrompt": "每条替换后的内容都需清晰可执行，并与对应原内容建立一一替换关系，保持语义准确与画面风格一致。",
          "negative": "禁止替换后内容缺失、顺序混乱、语义不完整，禁止新增与原画面无关的信息。"
        }
      ]
    },
    "去除商品印花": {
      "label": "去除商品印花",
      "description": "用于移除商品表面的原有印花、图案或局部视觉元素，同时保留底材纹理和材质质感。",
      "instructionType": "structured",
      "fields": [
        {
          "key": "sourceContent",
          "label": "需要替换的内容",
          "type": "textarea",
          "required": true,
          "defaultValue": "输入画面中需要替换的内容",
          "description": "填写画面中需要去除的原印花、原图案或原局部视觉元素，要求定位明确。",
          "valuePrompt": "待去除内容需明确指向画面中的原印花、原图案或原局部视觉元素，避免误伤商品主体结构。",
          "negative": "禁止去除对象描述模糊，禁止误删主体结构、边缘轮廓或非目标区域。"
        },
        {
          "key": "removeHint",
          "label": "提示文案",
          "type": "text",
          "required": true,
          "defaultValue": "将要替换的内容改为白底图",
          "description": "固定提示文案，不由用户输入，用于约束去除后的承载面目标状态。",
          "valuePrompt": "将指定内容去除后，应恢复为干净自然、可继续设计的白底承载面。",
          "negative": "禁止留下残影、脏边、补丁感或明显修补痕迹。"
        }
      ]
    },
    "商品换色": {
      "label": "商品换色",
      "description": "用于改变商品整体或局部部位颜色，同时保持结构、材质、高光和阴影逻辑不变。",
      "instructionType": "structured",
      "fields": [
        {
          "key": "sourceContent",
          "label": "需要替换的内容",
          "type": "textarea",
          "required": true,
          "defaultValue": "输入画面中需要替换的内容",
          "description": "填写画面中当前需要换色的部位、原色块或原局部区域，要求指向明确。",
          "valuePrompt": "待换色内容需明确指向画面中的原部位、原色块或原局部区域，避免颜色修改范围失控。",
          "negative": "禁止换色对象描述模糊，禁止颜色溢出到非目标区域。"
        },
        {
          "key": "replacementColors",
          "label": "替换后的颜色",
          "type": "dynamic_color_list",
          "required": true,
          "minItems": 1,
          "maxItems": 10,
          "addable": true,
          "addButtonLabel": "+",
          "autoIndexLabel": true,
          "itemLabelTemplate": "替换后的颜色{{index}}",
          "itemDefaultValue": "#111111",
          "description": "填写一个或多个目标颜色，前端显示色块和色值，支持点击小加号继续新增，最多 10 条。",
          "valuePrompt": "每个目标颜色都需服务真实售卖观感，兼顾材质、高光、阴影和多色关系过渡。",
          "negative": "禁止死板平涂、颜色脏污、材质失真或多色关系混乱。"
        }
      ]
    },
    "服饰贴纹理": {
      "label": "服饰贴纹理",
      "description": "用于将上传的纹理图贴到画面中的服饰区域，保持服饰结构、褶皱、缝线和材质逻辑稳定。",
      "instructionType": "structured",
      "fields": [
        {
          "key": "textureUpload",
          "label": "上传纹理图",
          "type": "reference_upload",
          "required": true,
          "description": "上传 1 张纹理图，使用上传参考图组件承载，用于贴到画面中的服饰区域。",
          "valuePrompt": "上传的纹理图需自然贴合到画面中的服饰区域，并顺应衣片结构、褶皱走向与受力逻辑。",
          "negative": "禁止纹理直接生硬平铺，禁止逆向拉伸、错位、断裂或破坏服饰结构。"
        },
        {
          "key": "textureHint",
          "label": "提示文案",
          "type": "text",
          "required": true,
          "defaultValue": "将上传的纹理贴到画面中的服饰",
          "description": "固定提示文案，不由用户输入，用于约束纹理贴附目标区域和执行意图。",
          "valuePrompt": "将上传的纹理贴到画面中的服饰后，需保证整体仍具备商业可售性与可印刷性。",
          "negative": "禁止纹理覆盖后导致服饰主体失真、结构错乱或无法用于后续上版。"
        }
      ]
    },
    "自定义提示词": {
      "label": "自定义提示词",
      "description": "用于直接输入自由局部改图指令，不走结构化模板，系统按用户原文执行。",
      "instructionType": "free_prompt",
      "fields": [
        {
          "key": "customPrompt",
          "label": "自定义提示词",
          "type": "textarea",
          "required": true,
          "description": "直接填写完整的局部改图要求，包括改哪里、改成什么、保留什么、禁止什么。",
          "valuePrompt": "严格执行用户自定义局部改图指令。",
          "negative": "禁止超范围修改与任务无关内容。"
        }
      ]
    }
  }
}
```

### 5.4 覆盖检查结果
当前需求文档中，“改图要求类型”与“下方每个选项对应提示词”已经覆盖完整：

+ 改图要求类型共 5 个，均已配置要求级 `valuePrompt`：
+ `替换“文字”和元素`
+ `去除商品印花`
+ `商品换色`
+ `服饰贴纹理`
+ `自定义提示词`

+ 结构化字段共 8 个，均已配置字段级提示词或明确标注为辅助字段：
+ `sourceContent`
+ `replacementContents`
+ `removeHint`
+ `replacementColors`
+ `textureUpload`
+ `textureHint`
+ `customPrompt`

开发约定补充：

+ 若字段在 `podPartialEditRequirementSchemas` 中存在 `valuePrompt`，则应进入最终 prompt。
+ 若字段在 `podPartialEditRequirementSchemas` 中存在 `negative`，则应进入最终负向约束段。
+ 若字段的 `valuePrompt=""` 且 `negative=""`，表示该字段仅作辅助说明，不进入核心执行约束。

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
5. `modeValuePrompt`（改图要求重点）
6. `modeNegativePrompt`（改图要求负向约束）
7. `structuredFieldPrompts`（结构化字段正向约束段）
8. `structuredFieldNegatives`（结构化字段负向约束段）
9. `requiredRule`（模式和品类必须满足）
10. `forbiddenRule`（模式和品类禁止事项）
11. `universalNegative`（通用负向约束）
12. `universalQuality`（通用质量要求）
13. `instructionText`（局部改图指令快照）

组装要求：

+ `requiredRule / forbiddenRule / universalNegative / universalQuality` 属于不可裁剪段
+ token 超限时，仅允许按 `instructionText -> structuredFieldPrompts -> modeValuePrompt -> categoryRulePrompt -> modeRulePrompt` 顺序裁剪
+ `instructionText` 当前不是普通 supplement，而是核心任务快照，应保留在末段便于回放和排查
+ 自定义模式下，`structuredFieldPrompts` 只保留 `customPrompt` 命中段
+ 非自定义模式下，`modeRulePrompt / modeValuePrompt / modeNegativePrompt` 来自 `podPartialEditRequirementPrompts`
+ 非自定义模式下，`structuredFieldPrompts / structuredFieldNegatives` 来自 `podPartialEditRequirementSchemas` 中当前有值的字段
+ 固定文案型字段（如 `removeHint / textureHint`）也进入结构化字段拼装，因为它们本身就是执行约束的一部分

### 字段取值与拼装明细
1. `taskGoal`
   固定文案：在保持商品主体结构、材质逻辑与商业可售性的前提下执行局部改图，仅修改用户指定区域，不做整图重绘。
2. `modeRulePrompt`
   取 `podPartialEditRequirementPrompts[podPartialEditRequirement].modePrompt`
3. `categoryRulePrompt`
   取 `categoryInfo[podPartialEditCategory].prompt`
4. `parameterLine`
   固定模板：`品类={podPartialEditCategory}；改图要求={podPartialEditRequirement}；出图数量={podPartialEditOutputCount}`
5. `modeValuePrompt`
   取 `podPartialEditRequirementPrompts[podPartialEditRequirement].valuePrompt`
6. `modeNegativePrompt`
   取 `podPartialEditRequirementPrompts[podPartialEditRequirement].negativePrompt`
7. `structuredFieldPrompts`
   依当前模式字段顺序遍历 `podPartialEditRequirementSchemas[podPartialEditRequirement].fields`
   若字段存在用户值或固定默认值，且字段配置存在 `valuePrompt`，则按顺序拼入
8. `structuredFieldNegatives`
   依当前模式字段顺序遍历 `podPartialEditRequirementSchemas[podPartialEditRequirement].fields`
   若字段存在用户值或固定默认值，且字段配置存在 `negative`，则按顺序拼入
9. `requiredRule`
   取当前模式规则与当前品类规则的 `required` 合并结果
10. `forbiddenRule`
    取当前模式规则与当前品类规则的 `forbidden` 合并结果
11. `universalNegative`
    固定通用负向约束段
12. `universalQuality`
    固定通用质量要求段
13. `instructionText`
    取 `podPartialEditInstructionText`
    非自定义模式下为结构化 JSON 字符串；自定义模式下为用户自然语言指令

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
改图要求规则：{modeRulePrompt}
品类规则：当前品类为「{podPartialEditCategory}」，{categoryPrompt}
改图参数：品类={podPartialEditCategory}；改图要求={podPartialEditRequirement}；出图数量={podPartialEditOutputCount}。
改图要求重点：{modeValuePrompt}
改图要求禁止：{modeNegativePrompt}
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
    "sourceContent": "将画面中的 SUMMER VIBES 和右下角太阳图标替换掉",
    "replacementContents": [
      "SUNSET CLUB",
      "右下角替换为简洁波浪线徽章元素"
    ]
  },
  "podPartialEditInstructionText": "{...结构化JSON字符串...}",
  "podPartialEditOutputCount": "2"
}
```

### 8.2 Demo 输出
```json
任务目标：在保持商品主体结构、材质逻辑与商业可售性的前提下执行局部改图，仅修改用户指定区域，不做整图重绘。

改图要求规则：仅替换局部文案和装饰元素，主体商品、构图、材质、光影和印刷逻辑必须保持不变。

改图要求重点：重点控制文字替换准确性、元素风格一致性和局部排版秩序。

改图要求禁止：禁止重画主体商品，禁止改变整体构图，禁止出现乱码、错拼或与原风格冲突的元素。

品类规则：当前品类为「手机壳」，手机壳类需保持壳体开孔、边框厚度、弧面透视和边缘包裹关系准确，不得改坏结构。

改图参数：品类=手机壳；改图要求=替换“文字”和元素；出图数量=2。

结构化字段约束：待替换内容需指向清晰，能够准确定位到画面中的原文字、原元素或原局部内容。每条替换后的内容都需清晰可执行，并与对应原内容建立一一替换关系，保持语义准确与画面风格一致。

结构化字段禁止：禁止替换对象描述模糊，禁止范围不明导致误改非目标内容。禁止替换后内容缺失、顺序混乱、语义不完整，禁止新增与原画面无关的信息。

必须满足：替换范围仅限用户指定局部区域、替换后文字可读且与主题一致、装饰元素与主体风格统一、输出可直接用于POD后续上版、保留摄像头孔位与按键开孔逻辑、保留壳体边缘厚度与弧度、保留壳体材质反光关系。

禁止：修改商品主体结构、出现乱码或错拼或不可读文案、新增侵权Logo或品牌标识、整图重绘导致原图语义丢失、孔位错位、边框扭曲、壳体变形、结构比例异常。

通用负向约束：1. 严禁改变商品主体结构与核心售卖属性。2. 严禁输出脏边、锯齿、重影、文字糊化、低清晰度。3. 严禁新增水印、Logo、二维码、联系方式、侵权元素。4. 严禁虚构商品功能、附赠物和误导性表达。5. 严禁整图风格漂移导致与原SKU不一致。

通用质量要求：1. 局部边界干净、过渡自然、无明显修补痕迹。2. 主体材质、光影、透视与原图一致。3. 文案和元素层级清晰、可读、可印刷。4. 结果可直接进入POD后续链路（裂变/连续图/尺寸延展/上版）。5. 同批次结果风格与清晰度一致。

改图指令快照：{
  "type": "replace-text-elements",
  "title": "替换“文字”和元素",
  "fields": [
    { "key": "sourceContent", "label": "需要替换的内容", "type": "input", "value": "将画面中的 SUMMER VIBES 和右下角太阳图标替换掉" },
    { "key": "replacementContents", "label": "替换后的内容", "type": "list", "value": ["SUNSET CLUB", "右下角替换为简洁波浪线徽章元素"] }
  ]
}
```

### 8.3 Demo 输入：商品换色
```json
{
  "toolKey": "pod-partial-edit",
  "podPartialEditCategory": "默认",
  "podPartialEditRequirement": "商品换色",
  "podPartialEditFieldValues": {
    "sourceContent": "将画面中杯盖外圈和提手区域的原黑色改掉",
    "replacementColors": [
      "#D7263D",
      "#F4B400"
    ]
  },
  "podPartialEditInstructionText": "{...结构化JSON字符串...}",
  "podPartialEditOutputCount": "2"
}
```

### 8.4 Demo 输出：商品换色
```json
任务目标：在保持商品主体结构、材质逻辑与商业可售性的前提下执行局部改图，仅修改用户指定区域，不做整图重绘。

改图要求规则：在保持结构与材质逻辑不变的前提下执行局部或主体换色，确保颜色映射自然且商业可售。

改图要求重点：重点控制颜色映射自然性、边界精度和材质保真。

改图要求禁止：禁止改变商品结构和材质逻辑，禁止颜色溢出、脏色、死板平涂或高光阴影失真。

品类规则：当前品类为「默认」，按通用商品局部改图策略执行：保留结构与材质，局部修改可控，避免整图语义漂移。

改图参数：品类=默认；改图要求=商品换色；出图数量=2。

结构化字段约束：待换色内容需明确指向画面中的原部位、原色块或原局部区域，避免颜色修改范围失控。每个目标颜色都需服务真实售卖观感，兼顾材质、高光、阴影和多色关系过渡。

结构化字段禁止：禁止换色对象描述模糊，禁止颜色溢出到非目标区域。禁止死板平涂、颜色脏污、材质失真或多色关系混乱。

必须满足：仅修改用户指定换色区域、结构和材质逻辑保持不变、颜色过渡自然且可售、输出可直接用于POD后续链路。

禁止：不得改坏主体结构、不得污染非目标区域、不得产生脏色和材质失真、不得整图风格漂移。

通用负向约束：1. 严禁改变商品主体结构与核心售卖属性。2. 严禁输出脏边、锯齿、重影、文字糊化、低清晰度。3. 严禁新增水印、Logo、二维码、联系方式、侵权元素。4. 严禁虚构商品功能、附赠物和误导性表达。5. 严禁整图风格漂移导致与原SKU不一致。

通用质量要求：1. 局部边界干净、过渡自然、无明显修补痕迹。2. 主体材质、光影、透视与原图一致。3. 文案和元素层级清晰、可读、可印刷。4. 结果可直接进入POD后续链路（裂变/连续图/尺寸延展/上版）。5. 同批次结果风格与清晰度一致。

改图指令快照：{
  "type": "recolor-product",
  "title": "商品换色",
  "fields": [
    { "key": "sourceContent", "label": "需要替换的内容", "type": "input", "value": "将画面中杯盖外圈和提手区域的原黑色改掉" },
    { "key": "replacementColors", "label": "替换后的颜色", "type": "list", "value": ["#D7263D", "#F4B400"] }
  ]
}
```

### 8.5 Demo 输入：服饰贴纹理
```json
{
  "toolKey": "pod-partial-edit",
  "podPartialEditCategory": "服装/纺织",
  "podPartialEditRequirement": "服饰贴纹理",
  "podPartialEditFieldValues": {
    "textureUpload": "denim-texture.jpg",
    "textureHint": "将上传的纹理贴到画面中的服饰"
  },
  "podPartialEditInstructionText": "{...结构化JSON字符串...}",
  "podPartialEditOutputCount": "1"
}
```

### 8.6 Demo 输出：服饰贴纹理
```json
任务目标：在保持商品主体结构、材质逻辑与商业可售性的前提下执行局部改图，仅修改用户指定区域，不做整图重绘。

改图要求规则：将上传的纹理图自然贴合到画面中的服饰区域，保持服饰版型、褶皱、垂感、缝线结构与原始光影逻辑稳定。

改图要求重点：重点控制纹理贴合自然、服饰结构稳定和纹理可印刷性。

改图要求禁止：禁止纹理像贴纸一样悬浮表面，禁止破坏服饰版型、垂感、缝线逻辑或出现错位、拉伸、断裂。

品类规则：当前品类为「服装/纺织」，服装/纺织类需保持衣片结构、缝线逻辑、褶皱走向与材质质感稳定，不得破坏可穿戴商品逻辑。

改图参数：品类=服装/纺织；改图要求=服饰贴纹理；出图数量=1。

结构化字段约束：上传的纹理图需自然贴合到画面中的服饰区域，并顺应衣片结构、褶皱走向与受力逻辑。将上传的纹理贴到画面中的服饰后，需保证整体仍具备商业可售性与可印刷性。

结构化字段禁止：禁止纹理直接生硬平铺，禁止逆向拉伸、错位、断裂或破坏服饰结构。禁止纹理覆盖后导致服饰主体失真、结构错乱或无法用于后续上版。

必须满足：纹理仅贴附在服饰目标区域、服饰结构与缝线逻辑保持稳定、纹理方向顺应衣片和褶皱、输出可直接用于POD后续链路。

禁止：不得把纹理贴到非服饰区域、不得破坏衣片结构和轮廓、不得出现纹理悬浮、错位、拉伸、断裂。

通用负向约束：1. 严禁改变商品主体结构与核心售卖属性。2. 严禁输出脏边、锯齿、重影、文字糊化、低清晰度。3. 严禁新增水印、Logo、二维码、联系方式、侵权元素。4. 严禁虚构商品功能、附赠物和误导性表达。5. 严禁整图风格漂移导致与原SKU不一致。

通用质量要求：1. 局部边界干净、过渡自然、无明显修补痕迹。2. 主体材质、光影、透视与原图一致。3. 文案和元素层级清晰、可读、可印刷。4. 结果可直接进入POD后续链路（裂变/连续图/尺寸延展/上版）。5. 同批次结果风格与清晰度一致。

改图指令快照：{
  "type": "garment-texture",
  "title": "服饰贴纹理",
  "fields": [
    { "key": "textureUpload", "label": "上传纹理图", "type": "image", "value": "denim-texture.jpg" },
    { "key": "textureHint", "label": "提示文案", "type": "text", "value": "将上传的纹理贴到画面中的服饰" }
  ]
}
```

## 三个关键能力的提示词配置
### 图片识别获取信息
当前线上主流程仍是“文件名关键词推断默认品类”，不是大模型识别。

但如果后续需要把 `podPartialEditCategory` 升级为“图片识别默认品类”，下面这套提示词可以直接使用。

识别目标：

+ 输入用户上传的第 1 张图
+ 输出最适合局部改图链路使用的 `podPartialEditCategory`
+ 仅用于默认值推荐，不应覆盖用户手动改写结果

#### 识别提示词模板
```text
你是一个 POD 商品图局部改图助手。请根据用户上传的第 1 张图片，判断该图片中的主要商品载体/品类，并输出最适合局部改图链路使用的品类结果。

你的任务不是描述整张图，而是判断“这张图最应该归到哪个局部改图品类”。

只允许从以下枚举中选择 1 个 `category`：
- 默认
- 服装/纺织
- 手机壳
- 铁艺图形
- 挂钟
- 装饰画
- 铁皮画

判定要求：
1. 只识别主商品载体，不识别背景道具，不识别陪衬物，不识别画面中的装饰环境。
2. 若画面中同时出现多个对象，优先选择最主要、面积最大、最接近售卖主体的商品载体。
3. 若图中是服装、T恤、卫衣、衬衫、裤子、裙子、布袋、抱枕、布艺、床品、织物类商品，归为 `服装/纺织`。
4. 若图中是手机壳、保护壳、带开孔壳体、带镜头孔或按键孔的壳类商品，归为 `手机壳`。
5. 若图中是圆形钟面、挂钟盘面、时钟类商品，归为 `挂钟`。
6. 若图中是装饰画、挂画、 framed wall art、画框画芯类商品，归为 `装饰画`。
7. 若图中是铁皮海报、金属薄板画、复古金属牌、tin sign 类商品，归为 `铁皮画`。
8. 若图中是铁艺轮廓、金属线条图形、铁艺装饰牌、黑色金属外轮廓图形，归为 `铁艺图形`。
9. 若无法稳定判断，或主体不属于以上明确品类，则输出 `默认`。

输出要求：
1. 只输出 1 段 JSON。
2. 不要输出解释性前后文。
3. `category` 必须是上述枚举之一。
4. `confidence` 输出 `high / medium / low` 三选一。
5. `reason` 用一句中文简要说明判断依据，长度不超过 30 个字。

输出格式：
{
  "category": "默认",
  "confidence": "medium",
  "reason": "未识别到明确的目标商品载体"
}
```

#### 推荐输出结构
```json
{
  "podPartialEditCategoryRecognition": {
    "category": "服装/纺织",
    "confidence": "high",
    "reason": "主体为可穿戴服饰，面料与衣片特征明确"
  }
}
```

#### 前端 / 后端使用规则
+ 若识别成功，使用返回的 `category` 作为 `podPartialEditCategory` 默认值。
+ 若识别结果为 `默认`，则继续沿用通用品类规则。
+ 若用户手动切换过品类，则后续不再被识别结果覆盖。
+ `confidence=low` 时，建议仅作静默默认值，不做强提示。

#### 品类判定优先级
1. `手机壳`
   关键特征：镜头孔、按键孔、壳体边缘包裹、壳面平面印花区域。
2. `挂钟`
   关键特征：圆形盘面、中心轴心区域、钟盘构图。
3. `装饰画`
   关键特征：画框、挂画、画芯、墙面陈列画。
4. `铁皮画`
   关键特征：金属薄板、复古海报牌、做旧金属边缘、圆角打孔牌。
5. `铁艺图形`
   关键特征：金属线条、黑色铁艺轮廓、镂空外轮廓结构。
6. `服装/纺织`
   关键特征：衣片、缝线、布纹、织物、可穿戴或布艺承载面。
7. `默认`
   关键特征：以上都不稳定命中，或主体不明确。

#### Demo
输入图像场景：
+ 一件平铺白色 T 恤，胸前有印花文案

输出：
```json
{
  "category": "服装/纺织",
  "confidence": "high",
  "reason": "主体为T恤服饰，衣片和面料特征明确"
}
```

输入图像场景：
+ 一个带镜头孔的透明手机壳，壳背中央有印花图案

输出：
```json
{
  "category": "手机壳",
  "confidence": "high",
  "reason": "主体有镜头孔和壳体包边结构"
}
```

输入图像场景：
+ 背景中有沙发和墙面，主体是一张带木框的装饰画

输出：
```json
{
  "category": "装饰画",
  "confidence": "high",
  "reason": "主体为挂画画框结构，不是背景家居"
}
```

输入图像场景：
+ 画面内容复杂，主体不明确，无法稳定判断载体

输出：
```json
{
  "category": "默认",
  "confidence": "low",
  "reason": "主体载体不明确，无法稳定归类"
}
```

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
