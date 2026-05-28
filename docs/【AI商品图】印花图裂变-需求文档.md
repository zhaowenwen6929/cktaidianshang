## 使用流程
1. 上传参考图（`upload-main`）
2. 选择品类（`podVariationCategory`）
3. 根据品类进入对应参数面板
4. 选择出图比例（部分品类）
5. 选择出图数量（`podVariationOutputCount`）
6. 生成

## 端到端使用流程
1. 用户上传参考图。
2. 系统基于上传文件名关键词自动推断默认 `podVariationCategory`，用户也可手动改写。
3. 系统根据品类切换到对应配置：
   - `默认 / 服装/纺织 / 手机壳 / 装饰画`：使用通用裂变面板
   - `铁艺图形`：使用图形风格专用面板
   - `挂钟`：使用表盘专用面板
   - `铁皮画`：使用铁皮画效果专用面板
4. 系统再根据当前品类和模式动态展示对应参数。
5. 用户选择 `出图比例`（若该品类显示该字段）和 `出图数量`。
6. 系统按 `模式规则 + 品类规则 + 设置值扩展 + 通用硬约束` 组装最终提示词并提交。
7. 输出可直接用于 POD 裂变、连续图、上版等后续链路的印花变体结果。

## 真实功能与字段（Source of Truth）
代码来源：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

```json
{
  "toolKey": "pod-variation",
  "creationModeConfigKey": "default",
  "sectionOrder": ["upload-main", "pod-variation-setup"],
  "uploads": {
    "main": {
      "label": "上传参考图",
      "maxCount": 24
    }
  },
  "currentFields": {
    "podVariationCategory": ["默认", "服装/纺织", "手机壳", "铁艺图形", "挂钟", "装饰画", "铁皮画"],
    "podVariationMode": ["艺术设计", "文字强化", "爆款二创", "通用"],
    "podVariationReferenceStyleLevel": ["低", "中", "高"],
    "podVariationReferenceStrength": "0.10 ~ 1.00，步长 0.05",
    "podVariationDivergenceLevel": ["低", "中", "高"],
    "podVariationBackgroundColor": ["随机", "黑色", "白色"],
    "podVariationBurstContent": ["改主体", "改姿势", "改背景", "✨爆改✨"],
    "podVariationContent": ["裂变整个商品", "仅裂变素材图案部分"],
    "podVariationGraphicStyle": ["曼陀罗填充", "低多边形", "极简线条", "负空间", "炫彩珐琅"],
    "podVariationVariationDimension": ["参考主体", "裂变主体"],
    "podVariationClockMode": ["3D立体增强V2", "通用"],
    "podVariationClockDialStyle": "支持多选，保存时以英文逗号拼接",
    "podVariationClockGenerateMethod": ["随机组合生成", "全部生成"],
    "podVariationRatio": ["1:1", "2:3", "3:4", "4:5", "9:16", "16:9"],
    "podVariationTinEffectSource": ["锈斑"],
    "podVariationTinEffectPreset": ["锈斑样式1", "锈斑样式2", "锈斑样式3", "锈斑样式4", "锈斑样式5", "锈斑样式6", "锈斑样式7"],
    "podVariationShape": ["默认", "圆形"],
    "podVariationOutputCount": ["1", "2", "3", "4", "5", "6", "7", "8"]
  }
}
```

补充业务事实：

+ 当前页面无 `supplement`
+ 当前页面无显式 `AI assist`
+ 当前页面未单独调用 `onCreationModeChange`，`podVariationOutputCount` 是 setup 内部字段，不是独立创作模式面板字段
+ 当前前端展示的 `裂变内容` 会根据模式映射到不同真实字段：非 `爆款二创` 使用 `podVariationContent`，`爆款二创` 使用 `podVariationBurstContent`
+ `podVariationContentEnabled` 仍存在于内部 selection map 中，但已不是当前页面对用户暴露的功能参数，不应作为文档主链路字段对外描述
+ `podVariationCategory` 默认通过上传文件名关键词推断，不是大模型图片识别结果
+ `podVariationContent` 已兼容旧值映射：`裂变商品 -> 裂变整个商品`，`仅裂变素材中的图案部分 -> 仅裂变素材图案部分`
+ `podVariationClockDialStyle` 当前为多选字段，前端保存为逗号拼接字符串
+ `podVariationRatio` 当前显示文案为 `出图比例`，展示位置在 `出图数量` 上方
+ `铁皮画` 当前 `效果` 模块已去掉上方单选切换，直接显示效果图列表

### 真实联动规则
+ `默认 / 服装/纺织 / 手机壳 / 装饰画`：
  - `艺术设计`：`podVariationReferenceStyleLevel / podVariationContent / podVariationShape / podVariationRatio / podVariationOutputCount`
  - `文字强化`：`podVariationReferenceStrength / podVariationDivergenceLevel / podVariationBackgroundColor / podVariationContent / podVariationShape / podVariationRatio / podVariationOutputCount`
  - `通用`：`podVariationReferenceStrength / podVariationContent / podVariationShape / podVariationRatio / podVariationOutputCount`
  - `爆款二创`：仅在 `默认` 可见，显示 `podVariationBurstContent / podVariationRatio / podVariationOutputCount`
+ `服装/纺织 / 手机壳 / 装饰画`：隐藏 `爆款二创`
+ `铁皮画`：
  - 仅保留 `艺术设计 / 文字强化`
  - 显示：`podVariationContent / podVariationTinEffectPreset / podVariationRatio / podVariationOutputCount`
+ `铁艺图形`：
  - 使用专用面板，不显示通用模式参数
  - 显示：`podVariationGraphicStyle / podVariationVariationDimension / podVariationOutputCount`
+ `挂钟`：
  - 使用专用面板，不显示通用模式参数
  - 显示：`podVariationClockMode / podVariationClockDialStyle / podVariationClockGenerateMethod / podVariationOutputCount`
+ 非 `爆款二创` 模式下：
  - `podVariationContent` 由用户直接选择：`裂变整个商品 / 仅裂变素材图案部分`
+ `爆款二创` 模式下：
  - 页面展示文案仍叫 `裂变内容`，但真实字段为 `podVariationBurstContent`
  - 提示词拼装时应注入 `podVariationBurstContentValuePrompt`

### 真实映射关系（建议开发直接使用）
说明：

+ `categoryModeMap`：定义每个品类可见的模式，或是否进入品类专用面板
+ `modeFieldMap`：定义通用模式面板下每个模式的字段组成
+ `categorySpecialFieldMap`：定义品类专用面板的字段组成

```json
{
  "categoryModeMap": {
    "默认": {
      "panelType": "general",
      "visibleModes": ["艺术设计", "文字强化", "爆款二创", "通用"]
    },
    "服装/纺织": {
      "panelType": "general",
      "visibleModes": ["艺术设计", "文字强化", "通用"]
    },
    "手机壳": {
      "panelType": "general",
      "visibleModes": ["艺术设计", "文字强化", "通用"]
    },
    "装饰画": {
      "panelType": "general",
      "visibleModes": ["艺术设计", "文字强化", "通用"]
    },
    "铁皮画": {
      "panelType": "general-with-special-effect",
      "visibleModes": ["艺术设计", "文字强化"]
    },
    "铁艺图形": {
      "panelType": "metal-graphic-special",
      "visibleModes": []
    },
    "挂钟": {
      "panelType": "clock-special",
      "visibleModes": []
    }
  },
  "modeFieldMap": {
    "艺术设计": [
      "podVariationReferenceStyleLevel",
      "podVariationContent",
      "podVariationShape",
      "podVariationRatio",
      "podVariationOutputCount"
    ],
    "文字强化": [
      "podVariationReferenceStrength",
      "podVariationDivergenceLevel",
      "podVariationBackgroundColor",
      "podVariationContent",
      "podVariationShape",
      "podVariationRatio",
      "podVariationOutputCount"
    ],
    "爆款二创": [
      "podVariationBurstContent",
      "podVariationRatio",
      "podVariationOutputCount"
    ],
    "通用": [
      "podVariationReferenceStrength",
      "podVariationContent",
      "podVariationShape",
      "podVariationRatio",
      "podVariationOutputCount"
    ]
  },
  "categorySpecialFieldMap": {
    "铁艺图形": [
      "podVariationGraphicStyle",
      "podVariationVariationDimension",
      "podVariationOutputCount"
    ],
    "挂钟": [
      "podVariationClockMode",
      "podVariationClockDialStyle",
      "podVariationClockGenerateMethod",
      "podVariationOutputCount"
    ],
    "铁皮画": {
      "baseModeFields": {
        "艺术设计": [
          "podVariationReferenceStyleLevel",
          "podVariationContent",
          "podVariationTinEffectPreset",
          "podVariationRatio",
          "podVariationOutputCount"
        ],
        "文字强化": [
          "podVariationReferenceStrength",
          "podVariationDivergenceLevel",
          "podVariationBackgroundColor",
          "podVariationContent",
          "podVariationTinEffectPreset",
          "podVariationRatio",
          "podVariationOutputCount"
        ]
      }
    }
  }
}
```

开发建议：

+ 前端渲染优先按 `panelType` 判断是否进入专用面板
+ 若 `panelType=general`，先根据 `visibleModes` 渲染模式切换，再根据 `modeFieldMap[当前模式]` 渲染字段
+ 若 `panelType=general-with-special-effect`，先根据 `visibleModes` 渲染模式切换，再根据 `baseModeFields[当前模式]` 渲染字段
+ 若 `panelType=metal-graphic-special / clock-special`，直接按 `categorySpecialFieldMap` 渲染，不再显示通用模式切换

## 1.1 计费与出图数量
```json
{
  "creditRule": {
    "currentImplementation": "按默认档计费",
    "normal": 1,
    "advanced": {
      "1K": 2,
      "2K": 3,
      "4K": 5
    }
  },
  "outputCountRule": {
    "field": "podVariationOutputCount",
    "range": [1, 8]
  }
}
```

补充说明：

+ 当前积分口径参考 [AI功能积分计算规则（按白底图口径补齐）.md](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI功能积分计算规则（按白底图口径补齐）.md)
+ `podVariationOutputCount` 会直接影响结果数量，文档实现时必须保留该字段
+ 当前需求文档重点描述 setup 逻辑，不额外扩展不存在的模式计费面板

## 2. 模式提示词配置
说明：

+ `pod-variation` 没有平台规则，一级主规则来自 `podVariationMode`
+ 不同模式不只是风格名不同，而是对应不同的裂变目标、控制强度和输出职责
+ `ruleLevel` 当前统一按 `A` 处理，因为模式是最上层主约束

```json
{
  "modeRulesByTool": {
    "艺术设计": {
      "ruleLevel": "A",
      "prompt": "在保留参考图核心识别元素的前提下做风格化升级，强调设计感、画面完成度与商业可用性，避免偏离原图主题。",
      "required": [
        "主体语义和关键识别符号保持一致",
        "线条、色块和层次更精致，具备设计稿质感",
        "可直接用于POD印花落地，不依赖二次大修",
        "同批次结果保持风格一致"
      ],
      "forbidden": [
        "偏题生成无关主体",
        "风格跳变导致系列不统一",
        "细节涂抹、重影、边缘脏污",
        "新增版权风险元素或品牌标识"
      ]
    },
    "文字强化": {
      "ruleLevel": "A",
      "prompt": "围绕原图进行可控创意增强，重点优化文字可读性、版式秩序和视觉冲击，同时保持图案主体与商用可印刷性。",
      "required": [
        "文字信息清晰可读且与主题一致",
        "图文层级明确，不互相遮挡",
        "可在指定背景色下保持对比度",
        "输出具备电商传播与印花生产可用性"
      ],
      "forbidden": [
        "乱码、错拼、不可读文字",
        "文字过小或被装饰吞没",
        "背景喧宾夺主导致主体失焦",
        "低清晰度或压缩伪影明显"
      ]
    },
    "爆款二创": {
      "ruleLevel": "A",
      "prompt": "基于参考图进行高转化导向的二次创作，在主体、姿势或背景维度做强差异裂变，保持核心卖点不丢失。",
      "required": [
        "二创方向与所选裂变内容严格一致",
        "保留原图核心卖点和识别资产",
        "构图完整，适配批量裂变出图",
        "结果具备明显新鲜感且不失真"
      ],
      "forbidden": [
        "改动维度与用户选择不一致",
        "过度重绘导致与原图脱钩",
        "主体结构崩坏、比例异常",
        "虚假功能表达或误导性元素"
      ]
    },
    "通用": {
      "ruleLevel": "A",
      "prompt": "执行稳健型印花裂变，兼顾保真和轻创意变化，优先保证主题一致、质量稳定和批量可用性。",
      "required": [
        "主体主题与风格基因保持一致",
        "变化幅度可控，避免失控漂移",
        "边缘干净、细节清楚、可直接复用",
        "多结果之间质量稳定"
      ],
      "forbidden": [
        "随机生成无关元素",
        "色彩失真或结构错乱",
        "明显AI伪影、马赛克、锯齿",
        "不适配印花生产的低质输出"
      ]
    }
  }
}
```

## 3. 品类提示词配置
说明：

+ `podVariationCategory` 是当前页面真实字段
+ 品类规则优先描述不同 POD 落地载体对裂变结果的可读性、构图和生产可用性要求
+ 默认值不是“没有品类”，而是“按通用品类执行”

```json
{
  "categoryRulesByTool": {
    "默认": {
      "label": "默认",
      "prompt": "按通用印花品类执行裂变，优先保证主题一致、边缘干净、色彩稳定和量产可用。",
      "required": ["主体清晰", "结构完整", "风格可延展"],
      "forbidden": ["偏题生成", "低清伪影", "细节缺失"]
    },
    "服装/纺织": {
      "label": "服装/纺织",
      "prompt": "适配服装与纺织印花，强调大面积铺陈后的连续性、层次和耐看度，避免细碎噪点。",
      "required": ["远看识别强", "近看纹理清晰", "重复拼接自然"],
      "forbidden": ["大面积脏污", "拼缝突兀", "过度锐化"]
    },
    "手机壳": {
      "label": "手机壳",
      "prompt": "适配手机壳小尺寸展示，强调主体聚焦、边缘完整、开孔区域可兼容。",
      "required": ["中心视觉明确", "高对比可读", "缩略图下仍清晰"],
      "forbidden": ["边缘断裂", "细节过密不可读", "主体被孔位破坏"]
    },
    "铁艺图形": {
      "label": "铁艺图形",
      "prompt": "适配铁艺图形类输出，强调线条力量感、几何秩序和结构稳定性。",
      "required": ["轮廓清楚", "线条顺直", "图形重心稳定"],
      "forbidden": ["线条抖动", "结构歪斜", "噪点污染"]
    },
    "挂钟": {
      "label": "挂钟",
      "prompt": "适配挂钟圆形构图，强调中心对齐、径向平衡和外围闭合完整。",
      "required": ["中心明确", "圆周完整", "刻度或主视觉关系和谐"],
      "forbidden": ["偏心构图", "边缘裁切", "放射关系混乱"]
    },
    "装饰画": {
      "label": "装饰画",
      "prompt": "适配装饰画场景，强调画面叙事与审美完成度，保证远观冲击和近观细节。",
      "required": ["构图完整", "主次清晰", "细节层次丰富"],
      "forbidden": ["空洞平淡", "纹理糊化", "色阶断层"]
    },
    "铁皮画": {
      "label": "铁皮画",
      "prompt": "适配铁皮画风格，强调复古材质语义下的图案清晰度和商业可读性。",
      "required": ["风格统一", "主题强识别", "印刷后可读"],
      "forbidden": ["过脏导致不可读", "做旧过度", "核心元素模糊"]
    }
  }
}
```

## 4. 高级选项值扩展提示词配置
说明：

+ `pod-variation` 没有单独的“高级设置”模块名称，但 setup 区里的大部分字段都属于直接影响 prompt 的高级选项
+ 不是所有字段都在所有模式下生效，文档里必须明确“字段显示条件”和“字段参与拼装条件”

```json
{
  "optionValueExpansions": {
    "podVariationMode": {
      "fieldKey": "podVariationMode",
      "name": "裂变模式",
      "values": {
        "艺术设计": { "valuePrompt": "走设计感升级路线，强调画面高级感与视觉统一性。" },
        "文字强化": { "valuePrompt": "提升文字可读性与版式秩序，保证图文协同表达。" },
        "爆款二创": { "valuePrompt": "执行强差异裂变，保持核心卖点同时强化新鲜感。" },
        "通用": { "valuePrompt": "执行稳健型裂变，平衡保真与可控变化。" }
      }
    },
    "podVariationReferenceStyleLevel": {
      "fieldKey": "podVariationReferenceStyleLevel",
      "name": "参考样式",
      "values": {
        "低": { "valuePrompt": "参考样式约束较弱，允许更大风格探索，但不得偏离主体语义。" },
        "中": { "valuePrompt": "参考样式约束适中，在保留风格基因上做可控变化。" },
        "高": { "valuePrompt": "参考样式约束较强，优先保持原图风格语言与设计节奏。" }
      }
    },
    "podVariationReferenceStrength": {
      "fieldKey": "podVariationReferenceStrength",
      "name": "原图参考强度",
      "rangePrompts": [
        { "min": 0, "max": 0.34, "valuePrompt": "原图参考强度较低，允许更高创意改写，但核心识别资产不可丢失。" },
        { "min": 0.35, "max": 0.69, "valuePrompt": "原图参考强度中等，在保真和创新之间保持平衡。" },
        { "min": 0.7, "max": 1, "valuePrompt": "原图参考强度较高，优先保持原图构图基因、主色关系与主体轮廓。" }
      ]
    },
    "podVariationDivergenceLevel": {
      "fieldKey": "podVariationDivergenceLevel",
      "name": "创意发散强度",
      "values": {
        "低": { "valuePrompt": "创意变化保守，重点优化质量与可用性。" },
        "中": { "valuePrompt": "创意变化适中，在稳定性和新鲜感间平衡。" },
        "高": { "valuePrompt": "创意变化积极，但必须维持核心卖点与可识别度。" }
      }
    },
    "podVariationBackgroundColor": {
      "fieldKey": "podVariationBackgroundColor",
      "name": "指定背景色",
      "values": {
        "随机": { "valuePrompt": "背景色可智能匹配，但需保证主体对比度与可读性。" },
        "黑色": { "valuePrompt": "使用黑色背景策略，强化高亮主体和色彩对比。" },
        "白色": { "valuePrompt": "使用白色背景策略，保证主体边缘干净与商业展示清晰。" }
      }
    },
    "podVariationBurstContent": {
      "fieldKey": "podVariationBurstContent",
      "name": "裂变内容",
      "values": {
        "改主体": { "valuePrompt": "裂变重点放在主体造型与视觉主体关系的重构。" },
        "改姿势": { "valuePrompt": "裂变重点放在动作姿态变化，保持主体身份连续。" },
        "改背景": { "valuePrompt": "裂变重点放在场景背景变化，主体本体尽量稳定。" },
        "✨爆改✨": { "valuePrompt": "执行高强度创意重构，但核心识别资产必须保留。" }
      }
    },
    "podVariationContent": {
      "fieldKey": "podVariationContent",
      "name": "裂变内容",
      "values": {
        "裂变整个商品": { "valuePrompt": "围绕整件商品效果做裂变，允许商品整体风格、构图和表现方式参与变化。" },
        "仅裂变素材图案部分": { "valuePrompt": "仅对素材中的图案主体进行裂变，不改动无关商品结构与信息层。" }
      }
    },
    "podVariationGraphicStyle": {
      "fieldKey": "podVariationGraphicStyle",
      "name": "图形风格",
      "values": {
        "曼陀罗填充": { "valuePrompt": "按曼陀罗填充方向执行图形裂变，强调放射秩序、纹样密度和装饰完整度。" },
        "低多边形": { "valuePrompt": "按低多边形风格执行裂变，强调几何切面、结构分块和图形硬朗感。" },
        "极简线条": { "valuePrompt": "按极简线条方向执行裂变，强调轮廓克制、线性表达和留白关系。" },
        "负空间": { "valuePrompt": "按负空间图形方向执行裂变，强调正负形识别与轮廓反转关系。" },
        "炫彩珐琅": { "valuePrompt": "按炫彩珐琅方向执行裂变，强调彩色镶嵌感、边框轮廓和装饰完成度。" }
      }
    },
    "podVariationVariationDimension": {
      "fieldKey": "podVariationVariationDimension",
      "name": "变化维度",
      "values": {
        "参考主体": { "valuePrompt": "以参考主体为核心执行变化，优先保持主体识别关系和结构稳定。" },
        "裂变主体": { "valuePrompt": "以裂变主体为主要变化对象执行生成，强化主体变化幅度和图形差异感。" }
      }
    },
    "podVariationClockMode": {
      "fieldKey": "podVariationClockMode",
      "name": "挂钟模式",
      "values": {
        "3D立体增强V2": { "valuePrompt": "按3D立体增强V2执行挂钟裂变，重点强化盘面立体层次和视觉体积感。" },
        "通用": { "valuePrompt": "按通用挂钟模式执行裂变，允许表盘种类和盘面组合更丰富。" }
      }
    },
    "podVariationClockDialStyle": {
      "fieldKey": "podVariationClockDialStyle",
      "name": "表盘刻度样式",
      "multiple": true,
      "valuePromptRule": "将多选结果按“、”拼接后作为表盘刻度样式约束注入 prompt，强调只在所选样式范围内生成。"
    },
    "podVariationClockGenerateMethod": {
      "fieldKey": "podVariationClockGenerateMethod",
      "name": "生成方式",
      "values": {
        "随机组合生成": { "valuePrompt": "将上传的背景素材和选择的表盘进行随机组合生成。" },
        "全部生成": { "valuePrompt": "将上传的背景素材和选择的表盘进行逐一生成，保证组合关系完整覆盖。" }
      }
    },
    "podVariationRatio": {
      "fieldKey": "podVariationRatio",
      "name": "出图比例",
      "values": {
        "1:1": { "valuePrompt": "按1:1正方形构图执行生成。" },
        "2:3": { "valuePrompt": "按2:3竖版构图执行生成。" },
        "3:4": { "valuePrompt": "按3:4竖版构图执行生成。" },
        "4:5": { "valuePrompt": "按4:5竖版构图执行生成。" },
        "9:16": { "valuePrompt": "按9:16长竖版构图执行生成。" },
        "16:9": { "valuePrompt": "按16:9横版构图执行生成。" }
      }
    },
    "podVariationTinEffectPreset": {
      "fieldKey": "podVariationTinEffectPreset",
      "name": "铁皮画效果",
      "values": {
        "锈斑样式1": { "valuePrompt": "使用铁皮画锈斑样式1，强调边缘轻锈蚀和旧化包边效果。" },
        "锈斑样式2": { "valuePrompt": "使用铁皮画锈斑样式2，强调角部锈蚀与局部褪色过渡。" },
        "锈斑样式3": { "valuePrompt": "使用铁皮画锈斑样式3，强调离散斑驳点状旧化纹理。" },
        "锈斑样式4": { "valuePrompt": "使用铁皮画锈斑样式4，强调边框锈迹和不规则磨损关系。" },
        "锈斑样式5": { "valuePrompt": "使用铁皮画锈斑样式5，强调大面积旧化晕染和中部视觉聚焦。" },
        "锈斑样式6": { "valuePrompt": "使用铁皮画锈斑样式6，强调满版颗粒旧化和复古脏感控制。" },
        "锈斑样式7": { "valuePrompt": "使用铁皮画锈斑样式7，强调四角包边锈蚀和老旧边框感。" }
      }
    },
    "podVariationShape": {
      "fieldKey": "podVariationShape",
      "name": "形状",
      "values": {
        "默认": { "valuePrompt": "保持默认形状逻辑，不强制几何裁切。" },
        "圆形": { "valuePrompt": "按圆形适配构图，确保中心聚焦与边缘闭合完整。" }
      }
    }
  }
}
```

字段参与拼装条件：

+ `podVariationReferenceStyleLevel`：仅 `艺术设计` 生效
+ `podVariationReferenceStrength`：仅 `文字强化 / 通用` 生效
+ `podVariationDivergenceLevel`：仅 `文字强化` 生效
+ `podVariationBackgroundColor`：仅 `文字强化` 生效
+ `podVariationBurstContent`：仅 `爆款二创` 生效
+ `podVariationContent`：仅非 `爆款二创` 生效
+ `podVariationShape`：仅 `默认 / 服装/纺织 / 手机壳 / 装饰画` 下的 `艺术设计 / 文字强化 / 通用` 生效
+ `podVariationGraphicStyle / podVariationVariationDimension`：仅 `铁艺图形` 生效
+ `podVariationClockMode / podVariationClockDialStyle / podVariationClockGenerateMethod`：仅 `挂钟` 生效
+ `podVariationTinEffectPreset`：仅 `铁皮画` 生效
+ `podVariationRatio`：除 `铁艺图形 / 挂钟` 外生效

## 5. 品类自动推断规则
说明：

+ 当前功能存在自动默认品类逻辑，但不是大模型识别
+ 该逻辑来自上传文件名关键词推断，用于预填 `podVariationCategory`

```json
{
  "inferPodVariationCategory": {
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
+ 一旦用户手动选择品类，应锁定为人工输入优先

## 拼装规则
### 拼装顺序
1. `taskGoal`（任务目标）
2. `modeRulePrompt`（模式规则正文）
3. `categoryRulePrompt`（品类规则正文）
4. `parameterLine`（参数行）
5. `optionValuePrompts`（选项值扩展约束）
6. `requiredRule`（模式和品类必须满足）
7. `forbiddenRule`（模式和品类禁止事项）
8. `universalNegative`（通用负向约束）
9. `universalQuality`（通用质量要求）
10. `supplement`（补充说明，可选，当前页面无该字段）

组装要求：

+ `requiredRule / forbiddenRule / universalNegative / universalQuality` 属于不可裁剪段
+ token 超限时，仅允许按 `supplement -> optionValuePrompts -> categoryRulePrompt -> modeRulePrompt` 顺序裁剪
+ 拼装时只注入当前模式真实生效的字段，不要把所有字段都拼进去
+ `裂变内容` 相关字段必须按当前模式二选一注入：`爆款二创` 注入 `podVariationBurstContentValuePrompt`，其余模式注入 `podVariationContentValuePrompt`
+ `挂钟` 专用字段、`铁艺图形` 专用字段、`铁皮画` 专用字段必须按品类条件注入，不得进入其他品类 prompt
+ `podVariationOutputCount` 不直接转为提示词语义约束，但需作为任务参数保留给执行层

### 通用负向约束
```json
通用负向约束：1. 严禁改变图案核心主题、符号语义与品牌可识别元素。2. 严禁输出低清晰度、重影、锯齿、白边、脏边、断边、马赛克、涂抹感。3. 严禁新增文字水印、Logo、二维码、联系方式或侵权风险元素。4. 严禁出现主体结构错误、比例畸形、关键细节缺失。5. 严禁因过强特效导致商品化可用性下降。
```

### 通用质量说明
```json
通用质量要求：1. 保真：核心图案、主色关系、关键元素稳定。2. 清晰：线条和纹理可辨，边缘闭合干净。3. 可用：可直接用于印花裂变、连续图和后续上版。4. 一致：同批次风格、清晰度、完成度统一。5. 合规：不含侵权、误导或违规传播元素。
```

### 拼装模板
```json
任务目标：基于上传参考图执行印花图裂变，输出可直接用于POD后续链路的多张高质量裂变结果。
模式规则：{modePrompt}
品类规则：当前品类为「{podVariationCategory}」，{categoryPrompt}
裂变参数：模式={podVariationMode}；品类={podVariationCategory}；出图比例={podVariationRatio}；出图数量={podVariationOutputCount}。
选项扩展约束：
[模式] {podVariationModeValuePrompt}
[参考样式] {podVariationReferenceStyleLevelValuePrompt}
[原图参考强度] {podVariationReferenceStrengthValuePrompt}
[创意发散强度] {podVariationDivergenceLevelValuePrompt}
[指定背景色] {podVariationBackgroundColorValuePrompt}
[裂变内容] {activeVariationContentValuePrompt}
[图形风格] {podVariationGraphicStyleValuePrompt}
[变化维度] {podVariationVariationDimensionValuePrompt}
[挂钟模式] {podVariationClockModeValuePrompt}
[表盘刻度样式] {podVariationClockDialStyleValuePrompt}
[生成方式] {podVariationClockGenerateMethodValuePrompt}
[铁皮画效果] {podVariationTinEffectPresetValuePrompt}
[出图比例] {podVariationRatioValuePrompt}
[形状] {podVariationShapeValuePrompt}
必须满足：{requiredJoined}
禁止：{forbiddenJoined}
{universalNegativePrompt}
{universalQualityPrompt}
补充说明：{supplementText}
```

其中：

+ `activeVariationContentValuePrompt` 的取值规则为：
  - `podVariationMode=爆款二创` -> `podVariationBurstContentValuePrompt`
  - 其他模式 -> `podVariationContentValuePrompt`
+ 未生效字段整段不拼接。例如 `文字强化` 不应拼接 `参考样式`，`爆款二创` 不应拼接 `形状`
+ `podVariationClockDialStyleValuePrompt` 在挂钟下应将多选结果按 `、` 拼接后注入

## 7. 拼装 Demo（输入 + 输出）
### 7.1 Demo 输入
```json
{
  "toolKey": "pod-variation",
  "podVariationCategory": "手机壳",
  "podVariationMode": "文字强化",
  "podVariationReferenceStrength": "0.65",
  "podVariationDivergenceLevel": "中",
  "podVariationBackgroundColor": "黑色",
  "podVariationContent": "仅裂变素材图案部分",
  "podVariationRatio": "4:5",
  "podVariationShape": "圆形",
  "podVariationOutputCount": "4"
}
```

### 7.2 Demo 输出
```json
任务目标：基于上传参考图执行印花图裂变，输出可直接用于POD后续链路的多张高质量裂变结果。

模式规则：围绕原图进行可控创意增强，重点优化文字可读性、版式秩序和视觉冲击，同时保持图案主体与商用可印刷性。

品类规则：当前品类为「手机壳」，适配手机壳小尺寸展示，强调主体聚焦、边缘完整、开孔区域可兼容。

裂变参数：模式=文字强化；品类=手机壳；出图比例=4:5；出图数量=4。

选项扩展约束：
[模式] 提升文字可读性与版式秩序，保证图文协同表达。
[原图参考强度] 原图参考强度中等，在保真和创新之间保持平衡。
[创意发散强度] 创意变化适中，在稳定性和新鲜感间平衡。
[指定背景色] 使用黑色背景策略，强化高亮主体和色彩对比。
[裂变内容] 仅对素材中的图案主体进行裂变，不改动无关商品结构与信息层。
[出图比例] 按4:5竖版构图执行生成。
[形状] 按圆形适配构图，确保中心聚焦与边缘闭合完整。

必须满足：文字信息清晰可读且与主题一致、图文层级明确，不互相遮挡、可在指定背景色下保持对比度、输出具备电商传播与印花生产可用性、中心视觉明确、高对比可读、缩略图下仍清晰。

禁止：乱码、错拼、不可读文字、文字过小或被装饰吞没、背景喧宾夺主导致主体失焦、低清晰度或压缩伪影明显、边缘断裂、细节过密不可读、主体被孔位破坏。

通用负向约束：1. 严禁改变图案核心主题、符号语义与品牌可识别元素。2. 严禁输出低清晰度、重影、锯齿、白边、脏边、断边、马赛克、涂抹感。3. 严禁新增文字水印、Logo、二维码、联系方式或侵权风险元素。4. 严禁出现主体结构错误、比例畸形、关键细节缺失。5. 严禁因过强特效导致商品化可用性下降。

通用质量要求：1. 保真：核心图案、主色关系、关键元素稳定。2. 清晰：线条和纹理可辨，边缘闭合干净。3. 可用：可直接用于印花裂变、连续图和后续上版。4. 一致：同批次风格、清晰度、完成度统一。5. 合规：不含侵权、误导或违规传播元素。
```

### 7.3 Demo 输入（爆款二创）
```json
{
  "toolKey": "pod-variation",
  "podVariationCategory": "服装/纺织",
  "podVariationMode": "爆款二创",
  "podVariationBurstContent": "改背景",
  "podVariationRatio": "3:4",
  "podVariationOutputCount": "3"
}
```

### 7.4 Demo 输出（爆款二创）
```json
任务目标：基于上传参考图执行印花图裂变，输出可直接用于POD后续链路的多张高质量裂变结果。

模式规则：基于参考图进行高转化导向的二次创作，在主体、姿势或背景维度做强差异裂变，保持核心卖点不丢失。

品类规则：当前品类为「服装/纺织」，适配服装与纺织印花，强调大面积铺陈后的连续性、层次和耐看度，避免细碎噪点。

裂变参数：模式=爆款二创；品类=服装/纺织；出图比例=3:4；出图数量=3。

选项扩展约束：
[模式] 执行强差异裂变，保持核心卖点同时强化新鲜感。
[裂变内容] 裂变重点放在场景背景变化，主体本体尽量稳定。
[出图比例] 按3:4竖版构图执行生成。

必须满足：二创方向与所选裂变内容严格一致、保留原图核心卖点和识别资产、构图完整，适配批量裂变出图、结果具备明显新鲜感且不失真、远看识别强、近看纹理清晰、重复拼接自然。

禁止：改动维度与用户选择不一致、过度重绘导致与原图脱钩、主体结构崩坏、比例异常、虚假功能表达或误导性元素、大面积脏污、拼缝突兀、过度锐化。

通用负向约束：1. 严禁改变图案核心主题、符号语义与品牌可识别元素。2. 严禁输出低清晰度、重影、锯齿、白边、脏边、断边、马赛克、涂抹感。3. 严禁新增文字水印、Logo、二维码、联系方式或侵权风险元素。4. 严禁出现主体结构错误、比例畸形、关键细节缺失。5. 严禁因过强特效导致商品化可用性下降。

通用质量要求：1. 保真：核心图案、主色关系、关键元素稳定。2. 清晰：线条和纹理可辨，边缘闭合干净。3. 可用：可直接用于印花裂变、连续图和后续上版。4. 一致：同批次风格、清晰度、完成度统一。5. 合规：不含侵权、误导或违规传播元素。
```

### 7.5 Demo 输入（铁艺图形）
```json
{
  "toolKey": "pod-variation",
  "podVariationCategory": "铁艺图形",
  "podVariationGraphicStyle": "负空间",
  "podVariationVariationDimension": "裂变主体",
  "podVariationOutputCount": "4"
}
```

### 7.6 Demo 输入（挂钟）
```json
{
  "toolKey": "pod-variation",
  "podVariationCategory": "挂钟",
  "podVariationClockMode": "通用",
  "podVariationClockDialStyle": "经典阿拉伯数字,罗马数字,细边圆盘",
  "podVariationClockGenerateMethod": "随机组合生成",
  "podVariationOutputCount": "3"
}
```

### 7.7 Demo 输入（铁皮画）
```json
{
  "toolKey": "pod-variation",
  "podVariationCategory": "铁皮画",
  "podVariationMode": "艺术设计",
  "podVariationContent": "裂变整个商品",
  "podVariationTinEffectPreset": "锈斑样式4",
  "podVariationRatio": "3:4",
  "podVariationOutputCount": "4"
}
```

## 三个关键能力的提示词配置
### 图片识别获取信息
当前功能没有显式大模型识别入口。

当前已有的自动能力是：

+ `podVariationCategory` 通过上传文件名关键词自动推断默认值

因此当前不建议把这一段写成“大模型图片识别回填主链路”，否则会和现状不一致。

若后续要接识别链路，最值得识别的是：

+ 参考图所属品类倾向
+ 更适合的裂变模式倾向
+ 文字占比和主体占比

但这些都属于后续增强，不属于当前主流程必做项。

### AI帮写
当前功能没有显式 `AI assist` 入口，可不接该模块。

### 文本润色
当前功能没有显式 `supplement` 输入框，可不接该模块。

## 结论
POD 印花 > 印花图裂变当前是一个“多字段、强模式分支”的功能：

1. 主链路字段不只是 `mode`，还包括 `category / referenceStrength / divergence / backgroundColor / burstContent / content / graphicStyle / variationDimension / clockMode / clockDialStyle / clockGenerateMethod / tinEffectPreset / ratio / outputCount`。
2. 不同品类已经拆成不同面板分支，开发不能再按“单一通用裂变面板”理解。
3. 当前唯一自动推断能力是基于文件名关键词的品类默认值，不是大模型识别。
4. 当前没有平台规则、没有补充说明、没有显式 AI 帮写，因此文档应围绕“模式规则 + 品类规则 + 品类专用字段 + 条件化字段扩展 + 固定拼装顺序”实现。 
