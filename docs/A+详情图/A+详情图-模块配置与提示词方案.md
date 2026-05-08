# A+详情图-模块配置与提示词方案

> 用途：直接给研发 / 算法 / 配置同学使用，作为 A+详情图模块配置与 Prompt 设计的落地文档。  
> 范围：A+ 模块定义、模块 Prompt、平台规则、品类规则、市场风格规则、模块规划 Prompt。  
> 更新时间：2026-05-06

---

## 1. 设计目标

这份文档直接解决两个问题：

1. A+ 详情图有哪些模块，模块如何定义
2. 每个模块的 Prompt 应该如何写，平台 / 品类 / 风格怎么做补丁

这份文档不是概念说明，而是偏“配置草案”。

---

## 2. A+ 模块总览

按当前界面真实模块，全量应为以下 16 类：

### 核心与展示模块

1. `aplus-hero` 首屏主视觉
2. `aplus-core-selling` 核心卖点图
3. `aplus-scene-usage` 使用场景图
4. `aplus-multi-angle` 多角度图
5. `aplus-atmosphere` 场景氛围图
6. `aplus-detail` 商品细节图
7. `aplus-brand-story` 品牌故事图
8. `aplus-size` 尺寸/容量/尺码图

### 说明与补充模块

9. `aplus-compare` 效果对比图
10. `aplus-spec` 详细规格/参数表
11. `aplus-craft` 工艺制作图
12. `aplus-accessories` 配件/赠品图
13. `aplus-series` 系列展示图
14. `aplus-ingredient` 商品成分图
15. `aplus-after-sale` 售后保障图
16. `aplus-usage-advice` 使用建议图

---

## 3. A+ 模块配置结构

建议落库表：`aplus_module_definitions`

字段：

```json
{
  "module_key": "",
  "module_name": "",
  "module_category": "",
  "module_description": "",
  "base_prompt_template": "",
  "base_negative_prompt": "",
  "default_layout_guidance": "",
  "default_text_guidance": "",
  "payload_schema": {},
  "default_payload": {},
  "payload_prompt_template": "",
  "default_ratio": "",
  "default_resolution": "",
  "keywords": []
}
```

字段说明：

- `module_key`
  - 模块唯一标识

- `module_name`
  - 用户可见的模块名

- `module_category`
  - 模块类别
  - 推荐值：`首屏模块`、`卖点模块`、`场景模块`、`细节模块`、`参数模块`、`品牌模块`

- `module_description`
  - 模块用途描述

- `base_prompt_template`
  - 模块基础正向 Prompt

- `base_negative_prompt`
  - 模块基础负向 Prompt

- `default_layout_guidance`
  - 默认版式建议

- `default_text_guidance`
  - 默认文案结构建议

- `payload_schema`
  - 当前模块专属字段结构定义
  - 仅描述该模块独有的结构化字段，不放公共字段
  - 用于前端动态渲染模块专属编辑区，也用于服务端校验 `module_payload`

- `default_payload`
  - 当前模块专属字段默认值
  - 用于 AI 初稿、用户切换模块类型时的初始化回填

- `payload_prompt_template`
  - 当前模块专属字段的 Prompt 模板
  - 与 `base_prompt_template` 并列存在
  - `base_prompt_template` 负责模块共性要求
  - `payload_prompt_template` 负责模块差异化要求

- `payload_field_meta`
  - 当前模块专属字段的展示元信息
  - 用于把 `label_style` 这类内部字段名映射成“标签样式”这样的用户可见名称
  - 前端渲染模块卡片、编辑表单、字段说明时，应该读取这里的 `label` 和 `description`
  - 不建议直接把原始字段 key 展示给用户

- `default_ratio`
  - 默认比例，建议 A+ 模块以 `3:4` 为主

- `default_resolution`
  - 默认分辨率

- `keywords`
  - 推荐关键词，用于搜索、推荐解释、联想

### 3.1 模块专属字段应该落到哪里

不同模块类型会有不同的提示词组成，因此模块专属字段不应落在：

- `aplus_platform_rules.json`
- `aplus_category_rules.json`
- `aplus_market_visual_rules.json`

原因：

- 平台规则负责平台约束和优先级
- 品类规则负责模块推荐、禁用和品类补丁
- 市场视觉规则负责市场/风格组合增强

而“多角度图有角度标签”“使用场景图有标题位置和语言要求”属于模块自身能力定义，应该统一落在：

- 配置文档：`A+详情图-模块配置与提示词方案.md`
- 配置文件：`aplus_module_definitions.json`

也就是说：

- 公共模块基础 Prompt：放在 `base_prompt_template`
- 模块专属字段 schema：放在 `payload_schema`
- 模块专属字段默认值：放在 `default_payload`
- 模块专属 Prompt 组装模板：放在 `payload_prompt_template`
- 模块专属字段展示名和说明：放在 `payload_field_meta`

### 3.2 统一结构与模块专属结构的关系

建议最终模块编辑结果统一为：

```json
{
  "id": "",
  "category": "",
  "description": "",
  "headline": "",
  "focus_line": "",
  "visual_line": "",
  "module_payload": {}
}
```

说明：

- `description / headline / focus_line / visual_line`：公共字段
- `module_payload`：当前模块的专属字段值

服务端拼 Prompt 时：

```text
最终 Prompt =
[base_prompt_template]
+ [default_layout_guidance]
+ [default_text_guidance]
+ [平台 / 品类 / 市场 Patch]
+ [公共字段 Prompt]
+ [payload_prompt_template]
```

其中：

- 公共字段 Prompt 从 `headline / focus_line / visual_line` 读取
- `payload_prompt_template` 只读取 `module_payload`

### 3.3 模块专属字段示例

#### A. `aplus-multi-angle`

```json
{
  "module_key": "aplus-multi-angle",
  "payload_field_meta": {
    "angle_labels": {
      "label": "角度标签",
      "description": "每一个角度画面对应的文字标签"
    },
    "label_style": {
      "label": "标签样式",
      "description": "标签文字采用什么视觉风格"
    },
    "label_position": {
      "label": "标签位置",
      "description": "标签放在每格下方、上方或图内角标"
    },
    "grid_count": {
      "label": "宫格数量",
      "description": "当前模块要展示几个角度画面"
    }
  },
  "payload_schema": {
    "type": "object",
    "additionalProperties": false,
    "required": ["angle_labels", "label_style", "label_position", "grid_count"],
    "properties": {
      "angle_labels": {
        "type": "array",
        "minItems": 2,
        "maxItems": 6,
        "items": { "type": "string" }
      },
      "label_style": {
        "type": "string",
        "enum": ["纯文字小标签", "描边标签", "底色标签"]
      },
      "label_position": {
        "type": "string",
        "enum": ["每格下方", "每格上方", "图内角标"]
      },
      "grid_count": {
        "type": "integer",
        "minimum": 2,
        "maximum": 6
      }
    }
  },
  "default_payload": {
    "angle_labels": ["Front View", "Side View", "Back View", "Detail View"],
    "label_style": "纯文字小标签",
    "label_position": "每格下方",
    "grid_count": 4
  },
  "payload_prompt_template": "展示 {grid_count} 个角度画面，标签依次为：{angle_labels_joined}。标签样式为 {label_style}，标签位置为 {label_position}。"
}
```

#### B. `aplus-scene-usage`

```json
{
  "module_key": "aplus-scene-usage",
  "payload_field_meta": {
    "title_text": {
      "label": "主标题文案",
      "description": "场景图中要展示的主标题内容"
    },
    "title_position": {
      "label": "标题位置",
      "description": "标题在画面中的摆放位置"
    },
    "title_font_style": {
      "label": "标题字体",
      "description": "标题采用的字体风格"
    },
    "title_size": {
      "label": "标题字号",
      "description": "标题字号大小"
    },
    "target_language": {
      "label": "目标语言",
      "description": "主标题输出语言"
    }
  },
  "payload_schema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "title_text",
      "title_position",
      "title_font_style",
      "title_size",
      "target_language"
    ],
    "properties": {
      "title_text": {
        "type": "string",
        "minLength": 1,
        "maxLength": 60
      },
      "title_position": {
        "type": "string",
        "enum": ["left-top", "right-top", "left-bottom", "center-top"]
      },
      "title_font_style": {
        "type": "string",
        "enum": ["medium-rounded-sans", "clean-sans", "elegant-serif"]
      },
      "title_size": {
        "type": "string",
        "enum": ["small", "medium", "large"]
      },
      "target_language": {
        "type": "string",
        "enum": ["zh-CN", "zh-TW", "en", "ja", "ko", "de", "fr"]
      }
    }
  },
  "default_payload": {
    "title_text": "",
    "title_position": "left-top",
    "title_font_style": "clean-sans",
    "title_size": "medium",
    "target_language": "en"
  },
  "payload_prompt_template": "主标题文案为“{title_text}”，标题位置为 {title_position}，字体风格为 {title_font_style}，字号为 {title_size}，输出语言为 {target_language}。"
}
```

### 3.4 前端渲染规则示例

前端展示 AI 规划结果时，不建议直接渲染原始 JSON key，而应按下面规则做映射：

1. 先根据模块 `id` 读取 `aplus_module_definitions.json` 中对应模块定义
2. 读取该模块的 `payload_field_meta`
3. 遍历当前模块的 `module_payload`
4. 每个字段展示时：
   - 展示名：`payload_field_meta[fieldKey].label`
   - 展示说明：`payload_field_meta[fieldKey].description`
   - 展示值：`module_payload[fieldKey]`

#### A. 模块卡片主视图区

建议固定展示公共字段：

- 模块类型：`category`
- 模块标题：`headline`
- 模块说明：`description`
- 模块重点：`focus_line`
- 视觉建议：`visual_line`

#### B. 模块卡片专属配置区

建议把 `module_payload` 渲染成“字段名 + 字段值”的结构化列表，而不是直接展示 JSON。

例如：

```json
{
  "id": "aplus-multi-angle",
  "category": "多角度图",
  "description": "通过四个角度清晰展示毛衣外观与局部细节。",
  "headline": "See Every Angle At A Glance",
  "focus_line": "重点展示正面、侧面、背面和袖口细节，让用户快速理解版型、轮廓和织纹特征。",
  "visual_line": "采用四宫格布局，主次清楚，角度统一，标签简洁，不要复杂背景干扰主体。",
  "module_payload": {
    "angle_labels": [
      "Front View",
      "Side View",
      "Back View",
      "Cuff Detail"
    ],
    "label_style": "纯文字小标签",
    "label_position": "每格下方",
    "grid_count": 4
  }
}
```

结合：

```json
{
  "payload_field_meta": {
    "angle_labels": {
      "label": "角度标签",
      "description": "每一个角度画面对应的文字标签"
    },
    "label_style": {
      "label": "标签样式",
      "description": "标签文字采用什么视觉风格"
    },
    "label_position": {
      "label": "标签位置",
      "description": "标签放在每格下方、上方或图内角标"
    },
    "grid_count": {
      "label": "宫格数量",
      "description": "当前模块要展示几个角度画面"
    }
  }
}
```

前端可以渲染为：

- 角度标签：Front View / Side View / Back View / Cuff Detail
- 标签样式：纯文字小标签
- 标签位置：每格下方
- 宫格数量：4

#### C. 推荐的字段值展示规则

不同类型值建议统一做下面处理：

- `string`
  - 直接显示
- `number`
  - 直接显示
- `array[string]`
  - 使用 `/` 或换行展示
- `array[object]`
  - 按行展开为 `label: value`
- `object`
  - 不直接展示原始 JSON，按字段继续递归映射

例如：

```json
{
  "size_items": [
    { "label": "Neckline", "value": "Crew neck" },
    { "label": "Sleeve", "value": "Long sleeve" },
    { "label": "Fit", "value": "Relaxed fit" }
  ]
}
```

建议渲染为：

- 尺寸项：
  - Neckline: Crew neck
  - Sleeve: Long sleeve
  - Fit: Relaxed fit

#### D. 推荐的前端数据组装结构

前端可以先把模块数据组装成统一的展示结构：

```json
{
  "card_title": "多角度图",
  "card_subtitle": "See Every Angle At A Glance",
  "basic_sections": [
    { "label": "模块说明", "value": "通过四个角度清晰展示毛衣外观与局部细节。" },
    { "label": "模块重点", "value": "重点展示正面、侧面、背面和袖口细节，让用户快速理解版型、轮廓和织纹特征。" },
    { "label": "视觉建议", "value": "采用四宫格布局，主次清楚，角度统一，标签简洁，不要复杂背景干扰主体。" }
  ],
  "payload_sections": [
    { "label": "角度标签", "value": "Front View / Side View / Back View / Cuff Detail" },
    { "label": "标签样式", "value": "纯文字小标签" },
    { "label": "标签位置", "value": "每格下方" },
    { "label": "宫格数量", "value": 4 }
  ]
}
```

这样渲染层就不需要理解业务字段语义，只需要消费标准展示结构。

#### E. 编辑表单的读取规则

编辑态也应使用同一套映射：

- 表单标题：使用 `payload_field_meta[fieldKey].label`
- 帮助文案：使用 `payload_field_meta[fieldKey].description`
- 表单控件类型：根据 `payload_schema` 判断

例如：

- `enum` -> 下拉选择
- `string` -> 输入框
- `array[string]` -> 标签输入组件
- `array[object]` -> 可增删表格/列表组件
- `integer` -> 数字输入框

核心原则：

- `payload_schema` 决定“怎么填”
- `payload_field_meta` 决定“怎么显示”
- `default_payload` 决定“默认填什么”
- `payload_prompt_template` 决定“最后怎么拼 Prompt”

---

## 4. A+ 模块完整 Prompt 配置

## 4.1 `aplus_hero`

### 配置建议

```json
{
  "module_key": "aplus_hero",
  "module_name": "首屏主视觉",
  "module_category": "首屏模块",
  "module_description": "传递商品核心价值与详情页第一印象",
  "base_prompt_template": "请为商品“{product_name}”生成一张适合 A+详情页首屏的主视觉模块图，突出商品核心价值、品牌质感和视觉冲击力。围绕卖点“{primary_selling_point}”构建主标题氛围，并预留标题、副标题与品牌表达区域。整体视觉应符合 {platform} 平台详情内容语境、{market} 市场审美和 {visual_style} 风格。",
  "base_negative_prompt": "不要做成纯促销海报，不要让文字遮挡商品主体，不要信息过满，不要空镜化到看不出商品价值。",
  "default_layout_guidance": "大视觉主图，保留标题、副标题、品牌表达区",
  "default_text_guidance": "适合主标题+副标题+品牌短句",
  "default_ratio": "3:4",
  "default_resolution": "1K",
  "keywords": ["首屏", "主视觉", "品牌感", "价值感"]
}
```

### 适用说明

- 用于 A+ 第一屏
- 适合表达品牌感和商品价值感
- 适合 Amazon A+、品牌详情页、小红书商品详情首屏

---

## 4.2 `aplus_core_selling`

```json
{
  "module_key": "aplus_core_selling",
  "module_name": "核心卖点图",
  "module_category": "卖点模块",
  "module_description": "围绕1到2个卖点做图文强化",
  "base_prompt_template": "请为商品“{product_name}”生成一张适合 A+详情页的核心卖点模块图，围绕卖点“{primary_selling_point}”与“{secondary_selling_point}”进行图文强化，突出商品差异化优势与用户收益。画面需兼顾商品主体和卖点说明结构。",
  "base_negative_prompt": "不要堆叠过多卖点，不要卖点与商品无关，不要夸大不存在的功能或绝对效果。",
  "default_layout_guidance": "商品主体加卖点分区，适合一主两辅信息结构",
  "default_text_guidance": "适合主标题+1到2条卖点短句",
  "default_ratio": "3:4",
  "default_resolution": "1K",
  "keywords": ["卖点", "优势", "转化", "核心表达"]
}
```

---

## 4.3 `aplus_scene_usage`

```json
{
  "module_key": "aplus_scene_usage",
  "module_name": "使用场景图",
  "module_category": "场景模块",
  "module_description": "呈现真实使用场景与生活方式价值",
  "base_prompt_template": "请为商品“{product_name}”生成一张适合 A+详情页的使用场景模块图，将商品自然融入 {scenario} 对应的真实环境中，体现商品在具体使用情境下的价值表达。画面需兼顾场景氛围和主体辨识度。",
  "base_negative_prompt": "不要场景喧宾夺主，不要商品不可辨识，不要过度摆拍或脱离真实使用逻辑。",
  "default_layout_guidance": "场景图为主，商品清晰可见，适合中景或广角生活化构图",
  "default_text_guidance": "适合主标题+场景收益说明",
  "default_ratio": "3:4",
  "default_resolution": "1K",
  "keywords": ["场景", "使用", "代入感", "生活方式"]
}
```

---

## 4.4 `aplus_detail_craft`

```json
{
  "module_key": "aplus_detail_craft",
  "module_name": "细节工艺图",
  "module_category": "细节模块",
  "module_description": "放大关键细节、工艺和材质感",
  "base_prompt_template": "请为商品“{product_name}”生成一张适合 A+详情页的细节工艺模块图，重点放大展示关键细节、材质纹理、结构处理或工艺完成度，帮助用户理解商品品质感和做工差异。",
  "base_negative_prompt": "不要虚构不存在的细节，不要夸大材质等级，不要过度锐化，不要脱离实物。",
  "default_layout_guidance": "整体图+局部放大或纯特写结构",
  "default_text_guidance": "适合局部特征短标题+工艺说明",
  "default_ratio": "3:4",
  "default_resolution": "1K",
  "keywords": ["细节", "工艺", "材质", "质感"]
}
```

---

## 4.5 `aplus_specification`

```json
{
  "module_key": "aplus_specification",
  "module_name": "规格参数图",
  "module_category": "参数模块",
  "module_description": "清晰展示尺寸、结构和关键参数",
  "base_prompt_template": "请为商品“{product_name}”生成一张适合 A+详情页的规格参数模块图，清晰展示尺寸、结构、材质、容量或关键参数信息。若无明确参数值，请预留规范参数展示区域，不得虚构数值。",
  "base_negative_prompt": "不要虚构尺寸、参数、材质成分，不要排版杂乱，不要为了美观牺牲可读性。",
  "default_layout_guidance": "商品示意图+参数表或标注结构",
  "default_text_guidance": "适合参数标题+分项参数列表",
  "default_ratio": "3:4",
  "default_resolution": "1K",
  "keywords": ["参数", "尺寸", "规格", "结构"]
}
```

---

## 4.6 `aplus_brand_story`

```json
{
  "module_key": "aplus_brand_story",
  "module_name": "品牌故事图",
  "module_category": "品牌模块",
  "module_description": "表达品牌理念、气质和价值感",
  "base_prompt_template": "请为商品“{product_name}”生成一张适合 A+详情页的品牌故事模块图，通过商品细节、品牌气质和视觉氛围传达品牌理念与价值感。画面应偏品牌表达，而非强促销转化。",
  "base_negative_prompt": "不要变成活动海报，不要文案堆叠，不要用与品牌气质不符的强叫卖表达。",
  "default_layout_guidance": "大图叙事+品牌短句区域",
  "default_text_guidance": "适合品牌标题+理念短句",
  "default_ratio": "3:4",
  "default_resolution": "1K",
  "keywords": ["品牌", "理念", "故事", "气质"]
}
```

---

## 4.7 `aplus_fit_explanation`

```json
{
  "module_key": "aplus_fit_explanation",
  "module_name": "版型说明图",
  "module_category": "细节模块",
  "module_description": "解释版型、轮廓、贴合与结构特点",
  "base_prompt_template": "请为商品“{product_name}”生成一张适合 A+详情页的版型说明模块图，重点展示商品廓形、结构线、肩线、袖型、腰线、长度感或贴合感，帮助用户理解商品的版型特点。",
  "base_negative_prompt": "不要改变商品原始版型，不要虚构修身显瘦效果，不要将平面款式改造成不真实轮廓。",
  "default_layout_guidance": "整体轮廓图加标签说明",
  "default_text_guidance": "适合版型标签+简要说明",
  "default_ratio": "3:4",
  "default_resolution": "1K",
  "keywords": ["版型", "轮廓", "结构", "上身感"]
}
```

---

## 4.8 `aplus_function_breakdown`

```json
{
  "module_key": "aplus_function_breakdown",
  "module_name": "功能拆解图",
  "module_category": "说明模块",
  "module_description": "结构化展示功能与结构作用",
  "base_prompt_template": "请为商品“{product_name}”生成一张适合 A+详情页的功能拆解模块图，围绕核心功能点、部件结构和使用逻辑做系统化说明，帮助用户快速理解商品的关键作用和优势。",
  "base_negative_prompt": "不要虚构功能，不要把普通特征写成功能创新，不要图解过度复杂。",
  "default_layout_guidance": "主体结构图加功能分区说明",
  "default_text_guidance": "适合功能标题+1到3条功能说明",
  "default_ratio": "3:4",
  "default_resolution": "1K",
  "keywords": ["功能", "拆解", "说明", "结构"]
}
```

---

## 4.9 `aplus_space_fit`

```json
{
  "module_key": "aplus_space_fit",
  "module_name": "空间适配图",
  "module_category": "场景模块",
  "module_description": "展示商品在空间中的适配关系",
  "base_prompt_template": "请为商品“{product_name}”生成一张适合 A+详情页的空间适配模块图，展示商品与目标空间之间的比例关系、摆放关系和风格适配感，帮助用户直观理解实际使用中的空间表现。",
  "base_negative_prompt": "不要空间比例失真，不要摆放逻辑错误，不要虚构超大或超小适配感。",
  "default_layout_guidance": "商品融入空间，中景构图，保留空间参照物",
  "default_text_guidance": "适合空间标签+尺寸/适配说明",
  "default_ratio": "3:4",
  "default_resolution": "1K",
  "keywords": ["空间", "适配", "摆放", "比例"]
}
```

---

## 4.10 `aplus_audience_match`

```json
{
  "module_key": "aplus_audience_match",
  "module_name": "适用人群图",
  "module_category": "说明模块",
  "module_description": "说明商品适合的人群和需求",
  "base_prompt_template": "请为商品“{product_name}”生成一张适合 A+详情页的适用人群模块图，围绕目标人群、生活方式偏好和核心需求表达商品适合谁、为什么适合。",
  "base_negative_prompt": "不要做歧视性表达，不要过度标签化，不要虚构人人适用的结论。",
  "default_layout_guidance": "商品主体加人群标签说明结构",
  "default_text_guidance": "适合主标题+适用人群短句",
  "default_ratio": "3:4",
  "default_resolution": "1K",
  "keywords": ["人群", "适用", "需求", "匹配"]
}
```

---

## 5. 平台规则建议

建议落库表：`aplus_platform_rules`

字段：

```json
{
  "platform": "",
  "module_key": "",
  "is_allowed": true,
  "priority": 0,
  "platform_notes": "",
  "platform_constraints": []
}
```

### 5.1 Amazon A+

重点模块：

- `aplus_hero`
- `aplus_core_selling`
- `aplus_detail_craft`
- `aplus_specification`
- `aplus_scene_usage`

平台补丁：

```text
适配 Amazon A+ 内容语境，图文需结构清晰、品牌感克制、参数与卖点真实可信，不得用活动促销式画面替代 A+ 模块表达。
```

### 5.2 小红书电商

重点模块：

- `aplus_hero`
- `aplus_scene_usage`
- `aplus_detail_craft`
- `aplus_core_selling`

平台补丁：

```text
适配小红书详情内容语境，模块画面需兼具种草审美和商品表达，整体风格自然、统一、真实，避免强平台主图式表达。
```

### 5.3 淘宝 / 天猫

重点模块：

- `aplus_core_selling`
- `aplus_detail_craft`
- `aplus_specification`
- `aplus_scene_usage`

平台补丁：

```text
适配国内货架电商详情页逻辑，强调卖点清晰、图文结构明确、信息读取高效，允许适度转化导向，但避免画面过脏过杂。
```

### 5.4 1688 / 阿里国际站

重点模块：

- `aplus_specification`
- `aplus_function_breakdown`
- `aplus_detail_craft`
- `aplus_scene_usage`

平台补丁：

```text
适配 B2B 详情阅读逻辑，强调规格、结构、工艺、应用场景和可信度，不要做成偏情绪化的消费品海报。
```

---

## 6. 品类 Patch 建议

建议落库表：`aplus_category_rules`

### 6.1 服饰鞋包

重点模块：

- `aplus_hero`
- `aplus_core_selling`
- `aplus_scene_usage`
- `aplus_detail_craft`
- `aplus_fit_explanation`

品类 patch：

```text
重点突出版型、轮廓、面料纹理、穿搭效果与上身氛围。若涉及人物展示，应确保穿着逻辑自然，版型真实，不得擅自改成更修身、更显瘦或更挺括的效果。
```

### 6.2 美妆个护

重点模块：

- `aplus_hero`
- `aplus_core_selling`
- `aplus_scene_usage`
- `aplus_detail_craft`
- `aplus_audience_match`

品类 patch：

```text
重点突出包装识别度、质地表现、使用步骤和成分卖点，整体风格需干净、可信、专业。不得暗示医疗治疗或保证性功效。
```

### 6.3 3C数码 / 家电

重点模块：

- `aplus_hero`
- `aplus_core_selling`
- `aplus_function_breakdown`
- `aplus_specification`
- `aplus_scene_usage`

品类 patch：

```text
重点突出结构、接口、功能点、使用逻辑和参数信息，整体风格应偏理性、科技、清晰，不得虚构技术规格和参数。
```

### 6.4 家居 / 家具

重点模块：

- `aplus_hero`
- `aplus_scene_usage`
- `aplus_space_fit`
- `aplus_detail_craft`
- `aplus_specification`

品类 patch：

```text
重点突出空间适配关系、材质感、摆放逻辑和使用氛围，必须保证空间透视合理、比例真实。
```

### 6.5 工业品 / 商用设备

重点模块：

- `aplus_specification`
- `aplus_function_breakdown`
- `aplus_detail_craft`
- `aplus_scene_usage`

品类 patch：

```text
重点突出规格、结构、工艺、应用场景和采购判断信息，整体风格应专业、工程化、可信，不适合情绪化品牌表达。
```

---

## 7. 市场 / 语言 / 风格规则

建议落库表：`aplus_market_visual_rules`

字段：

```json
{
  "market": "",
  "language": "",
  "visual_style": "",
  "layout_preference": "",
  "copy_density": "",
  "headline_style": "",
  "module_bias": []
}
```

### 7.1 规则示例

#### `cn + zh-CN + conversion_direct`

```text
整体信息密度中高，卖点和模块标题偏直接，适合快速理解和转化，不宜过度留白。
```

#### `cn + zh-CN + warm_lifestyle`

```text
整体画面偏温暖、柔和、生活方式感，文案密度中等，适合情绪化但不夸张的详情表达。
```

#### `us + en + minimal_premium`

```text
整体结构清晰、留白较多、标题更短，强调简洁和高质量感，不宜信息堆叠。
```

---

## 8. A+ 模块规划 Prompt

```text
请基于以下商品信息，为 A+详情页生成一份模块规划方案。

输入包括：
1. 商品名称
2. 核心卖点
3. 目标平台
4. 平台值级 Prompt
5. 目标市场
6. 市场值级 Prompt
7. 输出语言
8. 语言值级 Prompt
9. 视觉风格
10. 风格值级 Prompt
11. 使用场景
12. 品类

要求：
1. 输出适合 A+详情页的模块 summary
2. 输出 4-6 个模块
3. 模块类型从标准 A+ 模块库中选择
4. 每个模块包含：
- id
- category
- description
- headline
- focus_line
- visual_line
- module_payload
5. 若模块在 `aplus_module_definitions.json` 中存在 `payload_schema`，则必须按 schema 输出对应的 `module_payload`
6. 模块规划时必须吸收平台值级、市场值级、语言值级、风格值级 Prompt 中的约束
7. 模块顺序应符合详情页阅读逻辑：首屏价值 -> 核心卖点 -> 场景 / 细节 -> 参数 / 说明 -> 品牌或补充
8. 不要虚构商品事实和参数

输出结构：
{
  "status": "ready",
  "summary": [],
  "modules": [
    {
      "id": "",
      "category": "",
      "description": "",
      "headline": "",
      "focus_line": "",
      "visual_line": "",
      "module_payload": {}
    }
  ]
}
```

---

## 9. A+ 模块级 Prompt 拼接公式

```text
最终 Prompt =
[模块基础 Prompt]
+ [品类 Patch]
+ [平台 Patch]
+ [市场 / 语言 / 风格 Patch]
+ [模块 headline / focus_line / visual_line]
+ [模块 payload_prompt_template]
+ [用户补充要求]
```

```text
最终 Negative Prompt =
[模块基础 Negative Prompt]
+ [品类风险规则]
+ [平台约束]
```

### 9.1 市场配置字段值与提示词（完整映射）

以下映射对应 A+ 详情页 `市场配置` 字段，建议落库为 `aplus_market_field_value_prompts`，并在 `[市场 / 语言 / 风格 Patch]` 阶段拼接 `value_prompt`。

#### A. `visual_style`（视觉风格）

| 值 | 对应提示词（value_prompt） |
|---|---|
| 简约清新风 | 整体画面干净通透、留白充足、色彩轻盈柔和，减少厚重装饰和强对比元素，突出自然、舒适、清爽、有呼吸感的详情页视觉。 |
| 高级质感风 | 整体画面强调材质细节、光影层次和品牌感，色彩克制，版式精致，突出高客单感、品质感和专业审美。 |
| 活泼吸睛风 | 整体画面更明亮有活力，色彩对比适度增强，构图更有节奏感，突出年轻感、识别度和停留吸引力。 |
| 复古怀旧风 | 整体画面加入复古配色、年代纹理或怀旧氛围，但保持商品主体清晰，强调故事感、温度感和风格记忆点。 |
| 场景写实风 | 整体画面强调真实环境、自然光感和可信使用状态，避免过度 CG 化，突出商品在实际场景中的价值表达。 |
| 科技未来风 | 整体画面强调理性秩序、科技感光效、结构线条和未来气质，适合功能型、数码型或创新型商品的专业表达。 |
| 国风古韵风 | 整体画面融入东方审美元素、雅致留白和文化气质，避免符号堆砌，强调高级、含蓄、有韵味的国风表达。 |

#### B. `market`（目标市场）

| 值 | 对应提示词（value_prompt） |
|---|---|
| 大陆 | 符合大陆电商审美，信息传达直接高效，卖点标题醒目，画面节奏紧凑但不杂乱。 |
| 北美 | 符合北美市场偏好，强调简洁层级、留白、真实质感和理性价值表达，避免信息过载。 |
| 韩国 | 符合韩国市场审美，画面干净精致、配色克制柔和，强调细节质感、精修感和生活方式氛围。 |
| 日本 | 符合日本市场审美，构图规整、说明清楚、信息精炼，突出细节可信度与温和克制的品质感。 |
| 俄罗斯 | 符合俄罗斯市场偏好，强调商品功能清晰、价值表达直接、色彩对比明确，提升阅读和转化效率。 |
| 中东阿拉伯 | 符合中东市场偏好，视觉可更饱满精致，强调品质感、礼赠感与尊贵气质，同时保证信息清楚。 |
| 港澳 | 符合港澳市场阅读习惯，整体表达利落现代，注重品牌感、都会感与信息阅读效率。 |
| 中国台湾 | 符合中国台湾市场审美，风格清爽细腻，版面有秩序，卖点表达自然不过度叫卖。 |
| 土耳其 | 符合土耳其市场偏好，画面兼顾时尚感与实用价值，色彩和氛围可适度增强但不失清晰度。 |
| 南美 | 符合南美市场偏好，整体更有活力和感染力，色彩可适当更明亮，突出场景带入感和情绪表达。 |
| 澳洲 | 符合澳洲市场偏好，强调自然光感、真实生活方式与轻松高级感，避免过重促销氛围。 |
| 东南亚 | 符合东南亚市场偏好，强调高效转化、亮眼配色、重点直给和真实场景，避免版面过空。 |
| 印度 | 符合印度市场偏好，强调价值感、功能收益和信息完整度，色彩可更鲜明但结构必须清楚。 |
| 非洲 | 符合非洲市场偏好，强调实用价值、耐用感和可理解的信息结构，画面明快直接、主体突出。 |
| 英国 | 符合英国市场偏好，强调克制、整洁和专业感，突出真实品质与条理化信息表达。 |
| 德国 | 符合德国市场偏好，强调理性说明、参数清楚、功能逻辑明确，避免花哨装饰和模糊表达。 |
| 法国 | 符合法国市场偏好，强调审美质感、版式呼吸感和品牌气质，卖点表达精炼而有设计感。 |
| 欧洲 | 符合欧洲市场通用审美，整体简洁规范、强调品质与结构逻辑，兼顾品牌感和真实可信度。 |
| 东欧 | 符合东欧市场偏好，强调功能直观、画面清晰和信息强可读性，避免过度抽象的品牌表达。 |

#### C. `copy_language`（文案语种）

| 值 | 对应提示词（value_prompt） |
|---|---|
| 无文案 | 以纯视觉和版式留白为主，只保留必要信息区，不主动生成大段标题和说明文案。 |
| 简体中文 | 使用简体中文标题和说明，表达直接、自然易懂，适合电商详情页快速阅读。 |
| 繁体中文 | 使用繁体中文排版，语气自然专业，兼顾阅读顺畅与品牌质感。 |
| 英文 | 使用简洁自然的英文标题与说明，避免中式英文，控制句长，强调清晰和专业。 |
| 中英文混排 | 中英文混排需有明确主次层级，避免两种语言重复堆叠，适合跨境展示和品牌表达。 |
| 俄语 | 使用规范俄语排版，标题精炼清楚，避免过长句式，确保信息易识别。 |
| 日语 | 使用自然简洁的日语表达，强调礼貌克制、信息清楚和结构有序。 |
| 韩语 | 使用自然韩语表达，版式精致清爽，标题短句化，符合韩系详情页阅读习惯。 |
| 印地语 | 使用规范印地语排版，确保信息清楚、重点前置，避免复杂混排。 |
| 德语 | 使用准确简洁的德语表达，强调理性说明、参数逻辑和信息完整度。 |
| 法语 | 使用自然精炼的法语表达，兼顾审美感与专业度，避免生硬直译。 |
| 西班牙语 | 使用清晰自然的西班牙语表达，突出卖点与收益，保持阅读流畅。 |
| 葡萄牙语 | 使用自然规范的葡萄牙语表达，重点明确、句长适中，适合电商详情阅读。 |
| 阿拉伯语 | 使用规范阿拉伯语排版，注意文字阅读方向和版面平衡，重点信息需清楚聚焦。 |
| 泰语 | 使用自然泰语表达，标题精炼，说明易读，避免过密排版。 |
| 荷兰语 | 使用准确简洁的荷兰语表达，强调信息结构清楚和专业可信。 |
| 土耳其语 | 使用自然土耳其语表达，卖点前置、语句清楚，兼顾转化与阅读体验。 |

#### D. `platform`（目标平台）

| 值 | 对应提示词（value_prompt） |
|---|---|
| 亚马逊 | 适配 Amazon A+ 内容语境，强调信息结构清晰、品牌表达克制、卖点与参数真实可信，不做强促销海报感。 |
| Temu | 适配 Temu 商品详情阅读习惯，强调价值点直给、对比清楚、信息读取效率高，同时保持商品主体清晰可信。 |
| TikTok Shop | 适配 TikTok Shop 详情内容，强调首屏吸引力、生活方式表达与快速理解，画面要更抓眼但不失商品识别度。 |
| 速卖通 | 适配跨境详情页表达，突出商品优势、规格信息和全球消费者易理解的版式，不堆砌复杂本地化符号。 |
| Shopee | 适配 Shopee 电商详情页，强调转化导向、信息密度适中、卖点模块清楚，场景与商品关系直接明了。 |
| OZON | 适配 OZON 平台详情语境，整体偏理性、规范、清晰，参数说明和使用价值要明确，避免夸张营销话术。 |
| 阿里国际站 | 适配 B2B/B2C 混合型国际站详情表达，强调结构化信息、材质工艺、规格参数和专业可信度。 |
| SHEIN | 适配 SHEIN 详情内容风格，强调年轻化视觉、穿搭或生活方式氛围、颜色与版式吸引力，但商品仍需清楚可辨。 |

---

## 10. 模块级 Prompt 生成建议

每个模块在生成时，建议附带：

- `module_key`
- `module_name`
- `description`
- `headline`
- `focus_line`
- `visual_line`
- `module_payload`
- `prompt`
- `negative_prompt`
- `layout_guidance`
- `text_guidance`

输出结构建议：

```json
{
  "module_key": "",
  "module_name": "",
  "description": "",
  "headline": "",
  "focus_line": "",
  "visual_line": "",
  "module_payload": {},
  "prompt": "",
  "negative_prompt": "",
  "layout_guidance": "",
  "text_guidance": ""
}
```

---

## 11. 异常与边界

### 11.1 卖点不足

如果用户没有明确卖点：

- `aplus_core_selling` 不应直接强生成完整卖点图
- 应提示补充或降级为通用优势表达

### 11.2 参数不足

如果参数不足：

- `aplus_specification` 仍可保留
- 但必须做“参数占位结构图”
- 不得虚构具体尺寸和材质数值

### 11.3 工业品类目

不应强推：

- `aplus_brand_story`
- 情绪化 `aplus_hero`

应优先：

- `aplus_specification`
- `aplus_function_breakdown`
- `aplus_detail_craft`

---

## 12. 建议下一步配置文件

如果要继续落库，建议下一步直接生成：

1. `aplus_module_definitions.json`
2. `aplus_platform_rules.json`
3. `aplus_category_rules.json`
4. `aplus_market_visual_rules.json`
5. `A+模块规划返回样例.json`

这些文件可以直接对齐电商套图的配置化思路。
