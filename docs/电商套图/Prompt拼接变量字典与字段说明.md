# Prompt拼接变量字典与字段说明

> 用途：给后端 / 算法 / 模板配置同学统一 Prompt 变量来源与含义。  
> 目标：保证“类型模板 + 品类 patch + 平台 patch + 市场风格 patch + 用户补充要求”的拼接过程稳定、可追踪、可调试。  
> 更新时间：2026-05-06

---

## 1. Prompt 拼接总公式

```text
最终 Prompt =
[基础类型 Prompt]
+ [品类 Patch]
+ [平台 Patch]
+ [市场 / 语言 / 视觉风格 Patch]
+ [用户补充要求]
```

```text
最终 Negative Prompt =
[基础类型 Negative Prompt]
+ [品类风险 Negative]
+ [平台禁用项]
+ [自定义风险项]
```

---

## 2. 变量来源总览

Prompt 中变量来源共 6 类：

1. 商品基础信息
2. 卖点信息
3. 人群和场景信息
4. 视觉生成标签
5. 参数与限制项
6. 业务上下文

---

## 3. 变量字典

### 3.1 商品基础信息

#### `product_name`

- 来源：`final_structured_data.商品基础信息.product_name`
- 含义：适合电商命名的商品名称
- 示例：`杂色粗针圆领宽松毛衣`

#### `product_category_level1`

- 来源：`final_structured_data.商品基础信息.product_category_level1`
- 含义：一级品类
- 示例：`服饰鞋包`

#### `product_category_level2`

- 来源：`final_structured_data.商品基础信息.product_category_level2`
- 含义：二级品类
- 示例：`女装针织`

#### `product_color`

- 来源：`final_structured_data.商品基础信息.product_color`
- 含义：商品颜色数组
- 示例：`["米色", "浅棕杂色", "燕麦色系"]`

#### `product_style`

- 来源：`final_structured_data.商品基础信息.product_style`
- 含义：商品风格标签
- 示例：`["温柔", "慵懒", "秋冬氛围"]`

#### `product_structure`

- 来源：`final_structured_data.商品基础信息.product_structure`
- 含义：结构特征
- 示例：`["圆领", "长袖", "宽松版型", "落肩感"]`

#### `product_material_guess`

- 来源：`final_structured_data.商品基础信息.product_material_guess`
- 含义：基于视觉推断的材质
- 示例：`视觉判断为粗针织面料，疑似混纺`

#### `product_details`

- 来源：`final_structured_data.商品基础信息.product_details`
- 含义：局部可见细节
- 示例：`["粗针织纹理", "罗纹袖口", "罗纹下摆"]`

---

### 3.2 核心卖点

#### `selling_points`

- 来源：`final_structured_data.核心卖点.selling_points`
- 含义：卖点数组
- 示例：`["粗针织纹理明显，厚实温暖", "宽松落肩版型舒适松弛"]`

#### `primary_selling_point`

- 规则：默认取 `selling_points[0]`
- 用途：一图一卖点场景

#### `selling_points_text`

- 规则：将数组拼成短文本
- 示例：`粗针织纹理明显，厚实温暖；宽松落肩版型舒适松弛`

---

### 3.3 目标人群

#### `target_audience`

- 来源：`final_structured_data.目标人群.target_audience`
- 含义：适用人群

#### `audience_style_preference`

- 来源：`final_structured_data.目标人群.audience_style_preference`
- 含义：偏好风格人群

#### `audience_need`

- 来源：`final_structured_data.目标人群.audience_need`
- 含义：核心需求

#### `target_audience_text`

- 规则：将 3 组人群相关字段合并成短文本

---

### 3.4 使用场景

#### `usage_scenarios`

- 来源：`final_structured_data.使用场景.usage_scenarios`
- 含义：使用或展示场景

#### `season`

- 来源：`final_structured_data.使用场景.season`
- 含义：季节

#### `lifestyle_context`

- 来源：`final_structured_data.使用场景.lifestyle_context`
- 含义：生活方式氛围

#### `usage_scenarios_text`

- 规则：拼接使用场景

---

### 3.5 视觉生成标签

#### `visual_keywords`

- 来源：`final_structured_data.视觉生成标签.visual_keywords`
- 含义：视觉关键词

#### `background_direction`

- 来源：`final_structured_data.视觉生成标签.background_direction`
- 含义：推荐背景方向

#### `color_palette`

- 来源：`final_structured_data.视觉生成标签.color_palette`
- 含义：配色建议

#### `display_focus`

- 来源：`final_structured_data.视觉生成标签.display_focus`
- 含义：应重点展示的部位或特征

#### `design_style`

- 来源：`final_structured_data.视觉生成标签.design_style`
- 含义：适合的设计风格

#### `copy_tone`

- 来源：`final_structured_data.视觉生成标签.copy_tone`
- 含义：文案语气

---

### 3.6 参数与限制项

#### `specifications`

- 来源：`final_structured_data.参数与限制项.specifications`
- 含义：可确认参数对象

#### `pending_confirmation`

- 来源：`final_structured_data.参数与限制项.pending_confirmation`
- 含义：待确认信息

#### `forbidden_assumptions`

- 来源：`final_structured_data.参数与限制项.forbidden_assumptions`
- 含义：禁止模型臆造的信息

#### `generation_constraints`

- 来源：`final_structured_data.参数与限制项.generation_constraints`
- 含义：生成过程必须遵守的限制

#### `specifications_text`

- 规则：将参数对象展开为可读短文本

---

### 3.7 业务上下文

#### `platform`

- 来源：用户选择平台
- 示例：`amazon`

#### `market`

- 来源：用户选择目标市场
- 示例：`us`

#### `language`

- 来源：用户选择目标语言
- 示例：`en`

#### `visual_style`

- 来源：用户选择视觉风格
- 示例：`minimal_premium`

#### `category_key`

- 来源：最终确认品类
- 示例：`fashion_apparel`

#### `user_free_text_instruction`

- 来源：重解析未结构化部分或用户自由补充
- 示例：`希望整体更偏杂志封面感，画面简洁，不要太促销`

---

## 4. 推荐使用的变量加工规则

### 4.1 数组转文本规则

如果字段是数组：

- 长度 0：输出空字符串
- 长度 1：直接输出
- 长度 > 1：用 `、` 或 `；` 拼接

示例：

```text
["米色", "浅棕杂色", "燕麦色系"]
-> "米色、浅棕杂色、燕麦色系"
```

### 4.2 对象转文本规则

参数对象建议转成：

```text
领型：圆领；袖型：长袖；版型：宽松；纹理：粗针织
```

### 4.3 缺失值处理

如果变量不存在：

- 基础类型 Prompt 中直接删去该片段
- 不输出 `null`
- 不输出“未知”“暂无”

例如：

`display_focus` 为空时，不拼接“重点展示 {display_focus}”

---

## 5. 类型模板变量建议

### 5.1 `detail_closeup`

强依赖：

- `product_name`
- `display_focus`
- `product_material_guess`
- `product_details`

### 5.2 `core_selling_point`

强依赖：

- `product_name`
- `selling_points`

### 5.3 `scene_image`

强依赖：

- `product_name`
- `usage_scenarios`
- `lifestyle_context`
- `visual_keywords`

### 5.4 `audience_match`

强依赖：

- `product_name`
- `target_audience`
- `audience_need`

### 5.5 `specification_chart`

强依赖：

- `product_name`
- `specifications`

若 `specifications` 为空：

- 只生成“预留参数展示位”的说明型 Prompt
- 同时附加风险：`insufficient_information`

---

## 6. 品类 Patch 变量建议

品类 Patch 不建议直接读所有字段，建议只吃：

- `category_key`
- `display_focus`
- `product_structure`
- `product_material_guess`
- `usage_scenarios`

原因：

- 品类 Patch 主要负责“强调什么”和“禁止什么”
- 不宜承担复杂文案逻辑

---

## 7. 平台 Patch 变量建议

平台 Patch 建议只用：

- `platform`
- `language`
- `copy_tone`
- `generation_constraints`

例如：

- Amazon：强制清掉场景、人像、活动元素
- 小红书：加强氛围感与标题区建议
- 1688：加强规格与结构信息

---

## 8. 平台 / 市场 / 语言 / 卖点 / 风格 Patch 变量建议

这一层建议只用：

- `platform`
- `market`
- `language`
- `selling_point`
- `visual_style`
- `color_palette`
- `background_direction`

作用：

- 对齐平台内容语境
- 调整配色
- 调整排版
- 调整卖点组织方式
- 调整标题长度
- 调整视觉密度

---

## 9. 用户补充要求拼接规则

如果 `user_free_text_instruction` 非空，建议始终放在 Prompt 末尾：

```text
请同时参考用户补充要求：{user_free_text_instruction}
```

但要加一条实现原则：

- 用户补充要求不能覆盖平台硬约束
- 用户补充要求不能覆盖商品事实
- 用户补充要求不能覆盖品类合规限制

---

## 10. Negative Prompt 拼接规则

### 10.1 基本顺序

```text
negative_prompt =
base_negative_prompt
+ category_risk_negative
+ platform_constraints_negative
+ custom_risk_negative
```

### 10.2 各来源解释

#### `base_negative_prompt`

来自 `image_type_definitions`

#### `category_risk_negative`

来自 `category_strategy_rules.risk_rules`

#### `platform_constraints_negative`

来自 `platform_type_rules.platform_constraints`

#### `custom_risk_negative`

来自自定义类型归一化结果中的 `risk_flags`

---

## 11. 推荐的模板渲染伪代码

```text
function renderPrompt(typeDef, data, platformRule, categoryRule, marketContext, userFreeText):
    prompt = typeDef.base_prompt_template

    prompt = replaceVar(prompt, "product_name", data.product_name)
    prompt = replaceVar(prompt, "display_focus", join(data.display_focus))
    prompt = replaceVar(prompt, "selling_points", join(data.selling_points))
    prompt = replaceVar(prompt, "usage_scenarios", join(data.usage_scenarios))
    prompt = replaceVar(prompt, "lifestyle_context", join(data.lifestyle_context))
    prompt = replaceVar(prompt, "target_audience", join(data.target_audience))
    prompt = replaceVar(prompt, "audience_need", join(data.audience_need))
    prompt = replaceVar(prompt, "visual_keywords", join(data.visual_keywords))
    prompt = replaceVar(prompt, "platform", context.platform)
    prompt = replaceVar(prompt, "market", context.market)
    prompt = replaceVar(prompt, "language", context.language)
    prompt = replaceVar(prompt, "selling_point", context.selling_point)
    prompt = replaceVar(prompt, "visual_style", context.visual_style)

    prompt += "\n" + join(categoryRule.prompt_patch_rules)
    prompt += "\n" + buildPlatformPatch(platformRule)
    prompt += "\n" + buildMarketPatch(marketContext.value_prompts)
    prompt += "\n" + join(marketContext.combination_prompts)

    if userFreeText not empty:
        prompt += "\n请同时参考用户补充要求：" + userFreeText

    negativePrompt = typeDef.base_negative_prompt
    negativePrompt += "；" + join(categoryRule.risk_rules)
    negativePrompt += "；" + join(platformRule.platform_constraints)

    return {
        prompt,
        negativePrompt
    }
```

---

## 12. 调试建议

为了方便排查问题，建议后端在日志中保留：

- 原始模板
- 变量替换前后
- 命中的品类 patch
- 命中的平台 patch
- 命中的市场风格 patch
- 最终 Prompt
- 最终 Negative Prompt

---

## 13. 一句话实现原则

Prompt 拼接必须是“变量驱动 + 规则驱动”，不能依赖人工字符串随意拼接，更不能让模型完全自由决定最终 Prompt 结构。

---

## 14. 真实样例：米色针织毛衣

本节使用用户上传的真实商品图作为样例，演示：

1. 图片识别后结构化数据长什么样
2. 变量如何从结构化数据中取值
3. 最终 Prompt 是如何拼接出来的

样例图片：

- 文件路径：`/Users/zhaowenwen/Desktop/无限画布/电商测试/千库网_米色针织毛衣平铺展示_摄影图编号22419020.png`
- 商品判断：针织毛衣
- 品类判断：`fashion_apparel`

### 14.1 样例商品识别结果

```json
{
  "商品基础信息": {
    "product_name": "杂色粗针圆领宽松毛衣",
    "product_category_level1": "服饰鞋包",
    "product_category_level2": "女装针织",
    "product_category_candidates": ["服饰鞋包/女装针织", "服饰鞋包/女装毛衣"],
    "product_color": ["米色", "浅棕杂色", "燕麦色系"],
    "product_style": ["温柔", "慵懒", "秋冬氛围", "简约"],
    "product_structure": ["圆领", "长袖", "宽松版型", "落肩感"],
    "product_material_guess": "视觉判断为粗针织面料，疑似混纺，具体成分待确认",
    "product_details": ["粗针织纹理明显", "罗纹领口", "罗纹袖口", "罗纹下摆"]
  },
  "核心卖点": {
    "selling_points": [
      "粗针织纹理明显，厚实温暖，秋冬氛围感强",
      "杂色纱线更有层次，视觉质感自然耐看",
      "圆领设计简洁百搭，日常穿搭不易出错",
      "宽松落肩版型舒适松弛，不挑身材"
    ]
  },
  "目标人群": {
    "target_audience": ["女性日常穿搭人群", "学生", "通勤上班族"],
    "audience_style_preference": ["休闲风爱好者", "慵懒风爱好者", "简约温柔风人群"],
    "audience_need": ["秋冬保暖需求", "舒适穿着需求", "百搭穿搭需求"]
  },
  "使用场景": {
    "usage_scenarios": ["秋冬通勤", "日常出街", "居家休闲", "周末约会"],
    "season": ["秋季", "冬季"],
    "lifestyle_context": ["咖啡馆", "室内家居", "轻松生活方式场景"]
  },
  "视觉生成标签": {
    "visual_keywords": ["温暖", "柔和", "质感", "简约", "高级", "松弛感", "秋冬氛围"],
    "background_direction": ["奶油色背景", "浅米色背景", "木质家居", "布艺软装", "暖调室内场景"],
    "color_palette": ["米色", "燕麦色", "浅棕色", "奶咖色", "暖灰色"],
    "display_focus": ["领口织法", "整体粗针织纹理", "宽松袖型", "下摆收口"],
    "design_style": ["电商极简风", "生活方式感", "秋冬上新风格"],
    "copy_tone": ["温柔", "简洁", "有质感", "不夸张"]
  },
  "参数与限制项": {
    "specifications": {
      "category": "针织毛衣",
      "neckline": "圆领",
      "sleeve": "长袖",
      "fit": "宽松",
      "texture": "粗针织",
      "thickness": "视觉偏厚"
    },
    "pending_confirmation": ["具体材质成分", "尺码", "克重", "洗护方式", "品牌"],
    "forbidden_assumptions": ["羊绒", "100%纯棉", "抗起球", "显瘦", "高弹力科技面料"],
    "generation_constraints": [
      "不得偏离商品原始米棕色系",
      "不得改成修身版型",
      "不得虚构品牌标识",
      "不得生成与针织结构明显不符的面料质感"
    ]
  }
}
```

### 14.2 样例业务上下文

假设当前用户选择：

```json
{
  "platform": "xiaohongshu",
  "market": "cn",
  "language": "zh-CN",
  "visual_style": "warm_lifestyle",
  "category_key": "fashion_apparel",
  "user_free_text_instruction": "希望整体更偏生活方式感，画面干净，不要过强促销感。"
}
```

### 14.3 关键变量展开结果

#### 基础变量

```json
{
  "product_name": "杂色粗针圆领宽松毛衣",
  "product_category_level1": "服饰鞋包",
  "product_category_level2": "女装针织",
  "product_color": "米色、浅棕杂色、燕麦色系",
  "product_style": "温柔、慵懒、秋冬氛围、简约",
  "product_structure": "圆领、长袖、宽松版型、落肩感",
  "product_material_guess": "视觉判断为粗针织面料，疑似混纺，具体成分待确认",
  "product_details": "粗针织纹理明显、罗纹领口、罗纹袖口、罗纹下摆"
}
```

#### 卖点变量

```json
{
  "selling_points": "粗针织纹理明显，厚实温暖，秋冬氛围感强；杂色纱线更有层次，视觉质感自然耐看；圆领设计简洁百搭，日常穿搭不易出错；宽松落肩版型舒适松弛，不挑身材",
  "primary_selling_point": "粗针织纹理明显，厚实温暖，秋冬氛围感强"
}
```

#### 场景和人群变量

```json
{
  "target_audience": "女性日常穿搭人群、学生、通勤上班族",
  "audience_need": "秋冬保暖需求、舒适穿着需求、百搭穿搭需求",
  "usage_scenarios": "秋冬通勤、日常出街、居家休闲、周末约会",
  "lifestyle_context": "咖啡馆、室内家居、轻松生活方式场景"
}
```

#### 视觉变量

```json
{
  "visual_keywords": "温暖、柔和、质感、简约、高级、松弛感、秋冬氛围",
  "background_direction": "奶油色背景、浅米色背景、木质家居、布艺软装、暖调室内场景",
  "color_palette": "米色、燕麦色、浅棕色、奶咖色、暖灰色",
  "display_focus": "领口织法、整体粗针织纹理、宽松袖型、下摆收口"
}
```

#### 参数变量

```json
{
  "specifications_text": "品类：针织毛衣；领型：圆领；袖型：长袖；版型：宽松；纹理：粗针织；厚薄：视觉偏厚",
  "generation_constraints_text": "不得偏离商品原始米棕色系；不得改成修身版型；不得虚构品牌标识；不得生成与针织结构明显不符的面料质感"
}
```

### 14.4 示例一：`detail_closeup` 如何拼接

#### Step 1：基础类型模板

来自 `image_type_definitions.detail_closeup.base_prompt_template`

```text
请为商品“{product_name}”生成一张细节特写图，聚焦最能体现品质感的局部细节，重点展示 {display_focus}，如纹理、缝线、接口、材质表面、按键、边缘处理、工艺细节等。要求局部清晰、放大合理、质感突出，并与商品整体真实一致。
```

#### Step 2：变量替换后

```text
请为商品“杂色粗针圆领宽松毛衣”生成一张细节特写图，聚焦最能体现品质感的局部细节，重点展示 领口织法、整体粗针织纹理、宽松袖型、下摆收口，如纹理、缝线、接口、材质表面、按键、边缘处理、工艺细节等。要求局部清晰、放大合理、质感突出，并与商品整体真实一致。
```

#### Step 3：叠加品类 Patch

服饰鞋包 patch：

```text
重点突出版型、轮廓、面料纹理、穿搭效果与上身氛围。若涉及人物展示，应确保穿着逻辑自然，版型真实，不得擅自改成更修身、更显瘦或更挺括的效果。若无明确尺码信息，不要虚构具体尺码建议。
```

#### Step 4：叠加平台 Patch

小红书平台倾向：

```text
适配小红书种草语境，画面应保留生活方式感和审美统一性，避免过强货架促销感，细节表达要真实、干净、有质感。
```

#### Step 5：叠加市场 / 风格 Patch

`cn + zh-CN + warm_lifestyle`

```text
整体视觉偏温暖、柔和、自然，适合轻生活方式表达；版式留白适中，文字密度中等，标题语气偏情绪化和温柔表达。
```

#### Step 6：叠加用户补充要求

```text
请同时参考用户补充要求：希望整体更偏生活方式感，画面干净，不要过强促销感。
```

#### 最终 Prompt

```text
请为商品“杂色粗针圆领宽松毛衣”生成一张细节特写图，聚焦最能体现品质感的局部细节，重点展示 领口织法、整体粗针织纹理、宽松袖型、下摆收口，如纹理、缝线、接口、材质表面、按键、边缘处理、工艺细节等。要求局部清晰、放大合理、质感突出，并与商品整体真实一致。重点突出版型、轮廓、面料纹理、穿搭效果与上身氛围。若涉及人物展示，应确保穿着逻辑自然，版型真实，不得擅自改成更修身、更显瘦或更挺括的效果。若无明确尺码信息，不要虚构具体尺码建议。适配小红书种草语境，画面应保留生活方式感和审美统一性，避免过强货架促销感，细节表达要真实、干净、有质感。整体视觉偏温暖、柔和、自然，适合轻生活方式表达；版式留白适中，文字密度中等，标题语气偏情绪化和温柔表达。请同时参考用户补充要求：希望整体更偏生活方式感，画面干净，不要过强促销感。
```

#### 最终 Negative Prompt

```text
不要虚构不存在的细节，不要把普通材质生成成高端材质，不要过度锐化，不要模糊；不要虚构显瘦、增高、塑形等绝对效果，不要改变衣长袖长比例，不要把普通面料生成成羊绒、真丝、真皮等未确认材质；避免过强促销感，不要让文案压过商品细节，不得偏离商品原始米棕色系，不得改成修身版型，不得虚构品牌标识，不得生成与针织结构明显不符的面料质感。
```

### 14.5 示例二：`styling_scene` 如何拼接

#### 基础类型模板

```text
请为商品“{product_name}”生成一张穿搭场景图，将商品置于符合目标人群与风格偏好的穿搭环境中，重点体现搭配关系、整体气质和场景代入感。
```

#### 最终 Prompt

```text
请为商品“杂色粗针圆领宽松毛衣”生成一张穿搭场景图，将商品置于符合目标人群与风格偏好的穿搭环境中，重点体现搭配关系、整体气质和场景代入感。重点突出版型、轮廓、面料纹理、穿搭效果与上身氛围。若涉及人物展示，应确保穿着逻辑自然，版型真实，不得擅自改成更修身、更显瘦或更挺括的效果。若无明确尺码信息，不要虚构具体尺码建议。适配小红书种草语境，画面应强调自然、真实、可模仿的穿搭表达，适合温柔慵懒风格的生活方式展示。整体视觉偏温暖、柔和、自然，推荐使用奶油色、米色、木质与暖调室内场景，保留适度留白和轻情绪化标题表达。请同时参考用户补充要求：希望整体更偏生活方式感，画面干净，不要过强促销感。
```

#### 这个例子体现了什么

这个例子说明：

1. 同一张商品图，在不同套图类型下，基础 Prompt 完全不同
2. 品类 Patch 不变，但作用方向不同
3. 平台 / 市场 / 风格会改变画面气质，而不是替代商品事实
4. 用户补充要求永远放在最后一层，只做微调

### 14.6 研发落地建议

如果后端要做可调试版本，建议在返回结果中额外输出：

```json
{
  "debug_prompt_parts": {
    "base_prompt": "",
    "category_patch": "",
    "platform_patch": "",
    "market_style_patch": "",
    "user_free_text_patch": "",
    "final_prompt": "",
    "final_negative_prompt": ""
  }
}
```

这样在联调和问题排查时，能直接看到是哪一层拼错了。

---

## 15. 同一商品，不同平台的 Prompt 对照样例

本节继续使用同一张毛衣图，演示在不同平台下，即使商品相同，最终推荐的套图类型和 Prompt 也会明显不同。

统一商品前提：

- 商品：`杂色粗针圆领宽松毛衣`
- 品类：`fashion_apparel`
- 商品卖点：
  - `粗针织纹理明显，厚实温暖，秋冬氛围感强`
  - `杂色纱线更有层次，视觉质感自然耐看`
  - `圆领设计简洁百搭，日常穿搭不易出错`
  - `宽松落肩版型舒适松弛，不挑身材`

---

### 15.1 小红书：`styling_scene`

#### 输入上下文

```json
{
  "platform": "xiaohongshu",
  "market": "cn",
  "language": "zh-CN",
  "visual_style": "warm_lifestyle",
  "category_key": "fashion_apparel",
  "selected_type": "styling_scene",
  "user_free_text_instruction": "希望整体更偏生活方式感，画面干净，不要过强促销感。"
}
```

#### 平台为什么会推荐这类图

- 小红书偏种草表达
- 服饰类强调穿搭氛围和可模仿感
- 温暖生活方式风格适合场景化表达

#### 最终 Prompt

```text
请为商品“杂色粗针圆领宽松毛衣”生成一张穿搭场景图，将商品置于符合目标人群与风格偏好的穿搭环境中，重点体现搭配关系、整体气质和场景代入感。重点突出版型、轮廓、面料纹理、穿搭效果与上身氛围。若涉及人物展示，应确保穿着逻辑自然，版型真实，不得擅自改成更修身、更显瘦或更挺括的效果。若无明确尺码信息，不要虚构具体尺码建议。适配小红书种草语境，画面应强调自然、真实、可模仿的穿搭表达，适合温柔慵懒风格的生活方式展示。整体视觉偏温暖、柔和、自然，推荐使用奶油色、米色、木质与暖调室内场景，保留适度留白和轻情绪化标题表达。请同时参考用户补充要求：希望整体更偏生活方式感，画面干净，不要过强促销感。
```

#### 最终 Negative Prompt

```text
不要人物喧宾夺主，不要改变商品版型，不要搭配风格偏离商品，不要过于复杂掩盖商品；不要虚构显瘦、增高、塑形等绝对效果；避免过强促销感，不要让标题压过商品主体，不得偏离商品原始米棕色系。
```

#### 结果特点

- 强场景
- 强氛围
- 可带人物
- 文字更克制
- 更像种草图，而不是货架详情图

---

### 15.2 淘宝：`core_selling_point`

#### 输入上下文

```json
{
  "platform": "taobao",
  "market": "cn",
  "language": "zh-CN",
  "visual_style": "conversion_direct",
  "category_key": "fashion_apparel",
  "selected_type": "core_selling_point",
  "user_free_text_instruction": "希望一眼能看出保暖和百搭，不需要太文艺。"
}
```

#### 平台为什么会推荐这类图

- 淘宝主图和详情更看重卖点直达
- 服饰商品需要快速告诉用户：好看、好搭、保暖、舒适
- `conversion_direct` 风格偏转化，不强调杂志感

#### 最终 Prompt

```text
请基于商品“杂色粗针圆领宽松毛衣”的核心卖点 粗针织纹理明显，厚实温暖，秋冬氛围感强；杂色纱线更有层次，视觉质感自然耐看；圆领设计简洁百搭，日常穿搭不易出错；宽松落肩版型舒适松弛，不挑身材 生成一张卖点图。画面围绕最重要的1个卖点展开，突出商品优势，并通过构图、光线、局部细节或场景强化该卖点对应的视觉感受。重点突出版型、轮廓、面料纹理、穿搭效果与上身氛围。若涉及人物展示，应确保穿着逻辑自然，版型真实，不得擅自改成更修身、更显瘦或更挺括的效果。若无明确尺码信息，不要虚构具体尺码建议。适配淘宝商品图语境，卖点表达应直观、易读、具有转化导向，可适度强化标题信息，但必须保持商品主体清晰完整。整体视觉偏高对比、重点明确、信息直给，标题表达以利益点优先。请同时参考用户补充要求：希望一眼能看出保暖和百搭，不需要太文艺。
```

#### 最终 Negative Prompt

```text
不要堆叠多个无关卖点，不要弱化商品主体，不要做过强生活方式空镜；不要虚构显瘦、增高、塑形等绝对效果；不要过于文艺化导致转化重点不清；不得偏离商品原始米棕色系，不得改成修身版型。
```

#### 结果特点

- 卖点标题更强
- 信息密度更高
- 允许更明显的转化表达
- 画面目标是“快速说服购买”

---

### 15.3 亚马逊：`amazon_main`

#### 输入上下文

```json
{
  "platform": "amazon",
  "market": "us",
  "language": "en",
  "visual_style": "minimal_premium",
  "category_key": "fashion_apparel",
  "selected_type": "amazon_main",
  "user_free_text_instruction": ""
}
```

#### 平台为什么会推荐这类图

- 亚马逊主图合规要求最强
- 不允许场景、人物、促销文案
- 同款服饰首先要保证商品主体识别清楚

#### 最终 Prompt

```text
请为商品“杂色粗针圆领宽松毛衣”生成一张符合亚马逊主图风格的商品图片。要求纯白背景，商品主体占画面主要区域，完整、清晰、边缘干净，不添加文字、人物、场景和无关道具。必须保持商品原始颜色、结构和材质观感。重点突出版型、轮廓、面料纹理和商品主体识别度，不得擅自改成更修身、更显瘦或更挺括的效果。适配 Amazon 货架主图规范，优先保证商品主体清楚、比例自然、边界完整。整体视觉偏简洁、干净、克制，不强调氛围感和文案表达。
```

#### 最终 Negative Prompt

```text
不要复杂背景，不要人物，不要场景，不要文案，不要角标，不要活动元素，不要改变商品颜色，不要改变商品结构比例，不要虚构品牌标识，不要增加不存在的装饰细节，不得偏离商品原始米棕色系。
```

#### 结果特点

- 纯合规导向
- 没有场景，没有人物，没有文案
- 重点是“商品真实、完整、清晰”
- 同一件毛衣在亚马逊主图里不会像小红书那样做种草表达

---

### 15.4 三个平台的核心差异总结

| 平台 | 推荐类型 | 重点目标 | 画面风格 | 文案密度 | 是否允许人物/场景 |
| --- | --- | --- | --- | --- | --- |
| 小红书 | `styling_scene` | 种草、代入感、审美 | 温暖、生活方式、自然 | 中低 | 允许 |
| 淘宝 | `core_selling_point` | 转化、快速说服 | 重点明确、信息直给 | 中高 | 可选 |
| 亚马逊 | `amazon_main` | 合规、清晰、完整 | 简洁、克制、标准化 | 无 | 不允许 |

### 15.5 这个对照样例说明了什么

这个对照样例说明：

1. 同一商品图，基础商品事实不变
2. 平台规则会显著改变推荐的套图类型
3. 即使使用同一张图，最终 Prompt 的画面目标也完全不同
4. 平台不是只影响尺寸和比例，而是直接影响“该出什么图”和“图该长什么样”
