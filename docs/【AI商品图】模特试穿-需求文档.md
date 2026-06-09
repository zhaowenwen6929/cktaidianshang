# 【AI商品图】模特试穿-需求文档

## 1. 文档说明

- 文档对象：`模特试穿`
- 能力定位：基于上传服装图与模特图，生成电商可用的试穿效果图
- 文档用途：用于产品、研发、测试和提示词链路对齐
- 编写原则：仅保留可直接开发的产品字段、配置、提示词和拼装规则，不包含当前项目代码实现说明

## 2. 功能目标

`模特试穿`用于把上传服装商品稳定地穿到指定模特身上，输出具备真实上身效果、可用于电商展示的成片。

核心目标：

1. 保持服装真实结构、颜色、版型和关键设计元素不变。
2. 保持模特人物身份、体态、脸部、发型和整体气质稳定。
3. 保证服装与人体接触关系、受力褶皱、遮挡关系和光影方向真实。
4. 输出结果兼顾商品展示清晰度、人物自然度和商业成片质感。

## 3. 端到端流程

1. 用户上传服装图。
2. 用户上传模特图。
3. 用户选择试穿类型。
4. 用户补充基础参数，包括比例、分辨率、出图数量和补充说明。
5. 用户按需填写高级设置。
6. 系统识别服装和模特的关键信息。
7. 系统根据试穿类型、品类、识别结果、高级设置和用户输入拼装最终生成提示词。
8. 模型生成试穿结果图。
9. 结果进入结果区与任务记录。

## 4. 字段定义

### 4.1 基础输入字段

```json
{
  "uploadGarment": {
    "label": "上传服装图",
    "type": "image",
    "required": true,
    "maxCount": 5,
    "description": "上传同一件服装的正面、背面、侧面或局部细节图，用于稳定还原服装结构。"
  },
  "uploadModel": {
    "label": "上传模特图",
    "type": "image",
    "required": true,
    "maxCount": 3,
    "description": "上传用于试穿的模特图，建议人物清晰、结构完整、服装无遮挡过重。"
  },
  "tryOnGarmentType": {
    "label": "试穿类型",
    "type": "select",
    "required": true
  },
  "ratio": {
    "label": "比例",
    "type": "select",
    "required": true
  },
  "resolution": {
    "label": "分辨率",
    "type": "select",
    "required": true
  },
  "outputCount": {
    "label": "出图数量",
    "type": "select",
    "required": true
  },
  "supplementText": {
    "label": "补充说明",
    "type": "textarea",
    "required": false,
    "description": "用户补充希望突出的人物气质、服装卖点、场景氛围或展示重点。"
  }
}
```

### 4.2 试穿类型

```json
{
  "tryOnGarmentTypes": {
    "单产品试穿": {
      "prompt": "本次任务为单品试穿，重点保持单件商品的真实上身效果，避免凭空补出不存在的搭配单品，不得把单品误生成上下成套穿搭。",
      "required": [
        "单件商品主体必须清晰完整",
        "服装结构与款式必须和上传商品一致",
        "人物其余穿搭仅作为弱辅助，不得抢占单品主体"
      ],
      "forbidden": [
        "把单品误生成为完整套装",
        "新增用户未上传的核心搭配单品",
        "上下装关系表达混乱导致主体不清"
      ]
    },
    "多产品搭配": {
      "prompt": "本次任务为多产品搭配，重点保证多件商品在同一人物身上的完整统一展示，保持各单品之间的角色分工、穿着部位、款式、颜色、面料、比例和搭配关系稳定。",
      "required": [
        "多件商品的穿着部位和角色必须清晰",
        "每件商品的颜色、材质、版型和细节必须分别保真",
        "整体搭配关系必须成立，不得只还原其中一件而丢失整套关系"
      ],
      "forbidden": [
        "漏掉关键搭配单品",
        "将上装、下装、鞋包或配饰错误穿插、串位或合并",
        "只用一个泛化品类覆盖全部商品，导致单品细节丢失"
      ]
    }
  }
}
```

### 4.3 高级设置字段

```json
{
  "advancedFields": {
    "productType": {
      "label": "产品类型",
      "type": "input-select",
      "required": false,
      "placeholder": "请选择或直接输入"
    },
    "outfitItems": {
      "label": "搭配商品明细",
      "type": "dynamic-object-list",
      "required": false,
      "description": "仅在“多产品搭配”下启用。每一项对应一件上传商品，需分别记录 role、productType、subCategory 和 preservePoints。若存在多件不同细分品类商品，最终提示词必须优先使用该字段，不得仅保留单一总品类。 ",
      "itemSchema": {
        "id": "string",
        "role": "上装 | 下装 | 外套 | 连衣裙 | 鞋 | 包 | 配饰 | 其他",
        "productType": "string",
        "subCategory": "string",
        "preservePoints": ["string"]
      }
    },
    "displayLayout": {
      "label": "展示排版",
      "type": "input-select",
      "required": false,
      "placeholder": "请选择或直接输入"
    },
    "sceneType": {
      "label": "场景类型",
      "type": "input-select",
      "required": false,
      "placeholder": "请选择或直接输入"
    },
    "displayFocus": {
      "label": "展示重点",
      "type": "input-select",
      "required": false,
      "placeholder": "请选择或直接输入"
    },
    "atmosphere": {
      "label": "氛围营造",
      "type": "input-select",
      "required": false,
      "placeholder": "请选择或直接输入"
    },
    "copyLanguage": {
      "label": "文案语种",
      "type": "input-select",
      "required": false,
      "placeholder": "请选择或直接输入"
    },
    "targetMarket": {
      "label": "目标市场",
      "type": "input-select",
      "required": false,
      "placeholder": "请选择或直接输入"
    }
  }
}
```

### 4.4 比例、分辨率、出图数量

```json
{
  "ratioOptions": ["1:1", "3:4", "4:5", "9:16"],
  "resolutionOptions": ["1K", "2K", "4K"],
  "outputCountOptions": [1, 2, 3, 4]
}
```

## 5. 图片识别获取信息

### 5.1 识别目标

系统建议先识别以下信息，再参与最终试穿提示词拼装：

```json
{
  "modelSourceType": "模特来源类型",
  "garmentCategory": "服装品类",
  "garmentItems": "多商品明细",
  "garmentStructure": "服装结构特征",
  "garmentLength": "长度特征",
  "fitType": "版型特征",
  "fabricFeel": "面料与垂感特征",
  "displayRisks": "展示风险点",
  "modelBodyPose": "模特站姿与肢体状态",
  "modelOcclusionRisks": "模特遮挡风险",
  "framingRange": "模特构图范围"
}
```

补充说明：

- `garmentCategory` 仍保留，作为整次任务的一级服饰规则锚点，例如 `上装 / 套装 / 其他服饰`。
- `garmentItems` 来自服装品类识别链路本身，不是用户手填字段；当识别链路判断当前任务涉及多件商品时，必须在同一次识别结果中一并产出。
- 当 `tryOnGarmentType=多产品搭配` 时，系统必须额外输出 `garmentItems[]`，逐件描述每个商品的角色和细分品类。
- `多产品搭配` 场景下不得只依赖一个 `productType` 或一个 `garmentCategory` 参与最终提示词，否则容易把不同商品的约束平均化，导致错穿、串位或细节丢失。

### 5.2 服装品类识别提示词

```text
你是一位服饰电商图片识别助手。请基于上传服装图识别该商品的服装品类、结构特征、长度特征、版型特征、面料感受和展示风险点，用于后续模特试穿提示词拼装。

输出要求：
1. 仅输出 JSON。
2. `garmentCategory` 只允许从以下枚举中选择 1 个：
- 上装
- 外套
- 连衣裙
- 半身裙
- 裤装
- 套装
- 童装
- 运动服
- 其他服饰

3. `garmentStructure` 只允许从以下候选中选择 1 到 4 个最相关项：
- 领口明显
- 肩线明显
- 袖型明显
- 腰线明显
- 下摆明显
- 开襟结构
- 拉链结构
- 纽扣结构
- 图案印花明显
- 拼接结构明显

4. `garmentLength` 只允许从以下候选中选择 1 个：
- 短款
- 常规款
- 中长款
- 长款

5. `fitType` 只允许从以下候选中选择 1 到 2 个最相关项：
- 修身
- 标准
- 宽松
- 廓形
- 直筒
- A字

6. `fabricFeel` 只允许从以下候选中选择 1 到 3 个最相关项：
- 挺括
- 柔软
- 轻薄
- 厚实
- 有垂感
- 有弹性
- 粗纹理明显
- 光泽感明显

7. `displayRisks` 只允许从以下候选中选择 0 到 4 个最相关项：
- 高反光材质
- 透明或半透明
- 高频纹理易糊
- 大面积印花需完整
- 领口结构不可错
- 肩线不可错
- 袖型不可错
- 长度不可错
- 拼接结构不可错

8. `confidence` 输出 0 到 1 的小数。
9. `reason` 用一句中文简述判断依据。
```

建议直接调用的完整提示词：

```text
你是一位服饰电商图片识别助手。请基于用户上传的服装图，对该商品做结构化识别，供“模特试穿”功能后续拼装提示词使用。

识别目标：
1. 判断这件服装属于哪一个服装品类。
2. 提炼最关键的服装结构特征。
3. 判断服装长度特征。
4. 判断服装版型特征。
5. 判断服装面料观感和垂感特征。
6. 判断在模特试穿时最需要重点保护的展示风险点。

识别原则：
1. 优先根据服装主体本身判断，不要被背景、模特、配饰或拍摄场景干扰。
2. 若上传多张图，请综合多张图信息后输出一个统一结果。
3. 只输出与后续试穿稳定性强相关的信息，不输出无关的营销描述。
4. 若某个字段无法稳定判断，可输出空数组，但不要臆造。
5. `garmentCategory` 必须给出一个最接近的枚举值，不允许为空。

输出要求：
1. 仅输出 JSON。
2. 不要输出 markdown，不要输出解释，不要输出多余文字。
3. JSON 字段必须完整，字段名必须严格一致。

字段枚举要求：

`garmentCategory` 只允许从以下枚举中选择 1 个：
- 上装
- 外套
- 连衣裙
- 半身裙
- 裤装
- 套装
- 童装
- 运动服
- 其他服饰

`garmentStructure` 只允许从以下候选中选择 1 到 4 个最相关项：
- 领口明显
- 肩线明显
- 袖型明显
- 腰线明显
- 下摆明显
- 开襟结构
- 拉链结构
- 纽扣结构
- 图案印花明显
- 拼接结构明显

`garmentLength` 只允许从以下候选中选择 1 个：
- 短款
- 常规款
- 中长款
- 长款

`fitType` 只允许从以下候选中选择 1 到 2 个最相关项：
- 修身
- 标准
- 宽松
- 廓形
- 直筒
- A字

`fabricFeel` 只允许从以下候选中选择 1 到 3 个最相关项：
- 挺括
- 柔软
- 轻薄
- 厚实
- 有垂感
- 有弹性
- 粗纹理明显
- 光泽感明显

`displayRisks` 只允许从以下候选中选择 0 到 4 个最相关项：
- 高反光材质
- 透明或半透明
- 高频纹理易糊
- 大面积印花需完整
- 领口结构不可错
- 肩线不可错
- 袖型不可错
- 长度不可错
- 拼接结构不可错

`confidence` 输出 0 到 1 的小数。

`reason` 用一句中文简述主要判断依据。

请严格按以下 JSON 结构输出：
{
  "garmentCategory": "",
  "garmentStructure": [],
  "garmentLength": "",
  "fitType": [],
  "fabricFeel": [],
  "displayRisks": [],
  "confidence": 0,
  "reason": ""
}
```

标准输出结构：

```json
{
  "garmentCategory": "上装",
  "garmentStructure": ["领口明显", "肩线明显", "袖型明显"],
  "garmentLength": "常规款",
  "fitType": ["标准"],
  "fabricFeel": ["挺括", "有垂感"],
  "displayRisks": ["领口结构不可错", "肩线不可错"],
  "confidence": 0.92,
  "reason": "商品主体为常规长度上装，领口、肩线和袖型清晰，面料整体较挺括并具有一定垂感。"
}
```

字段释义：

```json
{
  "garmentCategory": "服装主品类，用于命中后续品类规则。",
  "garmentStructure": "服装最关键的结构特征，用于约束领口、肩线、袖型、开襟等核心区域。",
  "garmentLength": "服装长度判断，用于约束上身后的整体比例和长度表现。",
  "fitType": "服装版型判断，用于控制修身、宽松、廓形等上身轮廓。",
  "fabricFeel": "面料观感和垂感判断，用于控制挺括、柔软、轻薄等质感表达。",
  "displayRisks": "后续试穿最容易出错的区域或风险点，用于进入负向约束和重点保护提示词。",
  "confidence": "本次识别结果的总体置信度。",
  "reason": "用于回看识别依据的一句话说明。"
}
```

输出示例 1：

```json
{
  "garmentCategory": "外套",
  "garmentStructure": ["肩线明显", "开襟结构", "纽扣结构"],
  "garmentLength": "中长款",
  "fitType": ["标准", "廓形"],
  "fabricFeel": ["挺括", "厚实"],
  "displayRisks": ["肩线不可错", "长度不可错", "拼接结构不可错"],
  "confidence": 0.9,
  "reason": "商品为中长款外套，肩线和门襟结构清晰，整体廓形明显，版型和长度在试穿中需要重点保持稳定。"
}
```

输出示例 2：

```json
{
  "garmentCategory": "连衣裙",
  "garmentStructure": ["领口明显", "腰线明显", "下摆明显"],
  "garmentLength": "长款",
  "fitType": ["A字"],
  "fabricFeel": ["柔软", "有垂感", "轻薄"],
  "displayRisks": ["长度不可错", "领口结构不可错"],
  "confidence": 0.95,
  "reason": "商品为长款连衣裙，腰线和裙摆结构明确，面料偏轻薄柔软，长度和领口在试穿时需重点保护。"
}
```

### 5.2.1 统一识别规则

`模特试穿` 的服装品类识别建议统一使用一套提示词，不拆分为“单产品试穿识别提示词”和“多产品搭配识别提示词”两套。

统一规则如下：

1. 先判断当前上传素材更接近 `单产品试穿` 还是 `多产品搭配`。
2. 无论哪种模式，都必须输出总锚点 `garmentCategory`。
3. 无论哪种模式，都允许输出 `garmentItems[]`。
4. 若判断为 `单产品试穿`，`garmentItems[]` 通常只输出 1 项。
5. 若判断为 `多产品搭配`，`garmentItems[]` 必须逐件输出，不得省略。

也就是说，识别链路的提示词可以统一，但输出结果需要按单件/多件分支。

### 5.2.2 多产品搭配补充识别规则

当 `tryOnGarmentType=多产品搭配`，或识别链路判断上传服装图中实际存在多件将共同参与试穿的商品时，服装品类识别必须返回 `garmentItems[]`。

`garmentItems[]` 的作用：

1. 逐件标识每件商品在穿搭中的角色，如 `上装 / 下装 / 外套 / 连衣裙 / 鞋 / 包 / 配饰 / 其他`。
2. 逐件给出细分品类，避免只保留一个总品类导致约束丢失。
3. 逐件沉淀后续试穿时最需要保护的结构点，供最终 Prompt 的“多商品明细规则”直接消费。

建议输出结构：

```json
{
  "garmentCategory": "套装",
  "garmentItems": [
    {
      "itemIndex": 1,
      "role": "上装",
      "garmentCategory": "上装",
      "subCategory": "衬衫",
      "garmentStructure": ["领口明显", "肩线明显", "袖型明显", "纽扣结构"],
      "garmentLength": "常规款",
      "fitType": ["宽松"],
      "fabricFeel": ["挺括", "有垂感"],
      "displayRisks": ["领口结构不可错", "肩线不可错"],
      "preservePoints": ["领口", "肩线", "袖长", "门襟纽扣"]
    }
  ]
}
```

字段说明：

- `itemIndex`：多件商品在同次识别结果中的顺序号。
- `role`：该商品在整套搭配里的穿着角色。
- `garmentCategory`：该件商品自己的一级服饰分类。
- `subCategory`：该件商品的细分品类，用于最终 Prompt 更准确约束，例如 `衬衫 / A字半裙 / 短靴`。
- `preservePoints`：面向生成链路的逐件保真重点，优先用于最终 Prompt。

### 5.2.3 统一服装品类识别提示词

以下提示词可同时覆盖 `单产品试穿` 与 `多产品搭配`：

```text
你是一位服饰电商图片识别助手。请基于用户上传的服装图，对“模特试穿”任务做结构化识别，供后续提示词拼装使用。

任务目标：
1. 判断这次上传中是单件商品试穿，还是多件商品共同搭配试穿。
2. 输出整次任务的一级服饰锚点 `garmentCategory`。
3. 输出 `garmentItems[]`，明确每件商品的角色、一级品类、细分品类和保真重点；如果是单件商品，通常只输出 1 项；如果是多件商品，必须逐件输出。
4. 同时补充整体层面的结构、长度、版型、面料和展示风险，用于全局规则。

识别原则：
1. 优先根据上传商品本身判断，不要被背景、模特、配饰或拍摄场景干扰。
2. 若上传多张图，请综合多张图信息，判断哪些图属于同一件商品，哪些图属于不同商品。
3. 若识别到多件共同搭配商品，不允许只输出一个泛化品类，必须返回 `garmentItems[]`。
4. 若识别为单件商品，也建议返回 1 项 `garmentItems[]`，便于后续链路统一消费。
5. 若某件商品无法稳定判断细分品类，可保留一级品类并将 `subCategory` 设为最接近的通用名称，但不要臆造。
6. 输出内容只服务后续试穿稳定性，不输出营销描述。

输出要求：
1. 仅输出 JSON。
2. 不要输出 markdown，不要输出解释，不要输出多余文字。
3. JSON 字段必须完整，字段名必须严格一致。

字段枚举要求：

`garmentCategory` 只允许从以下枚举中选择 1 个：
- 上装
- 外套
- 连衣裙
- 半身裙
- 裤装
- 套装
- 童装
- 运动服
- 其他服饰

`garmentItems[].role` 只允许从以下枚举中选择 1 个：
- 上装
- 下装
- 外套
- 连衣裙
- 鞋
- 包
- 配饰
- 其他

`garmentItems[].garmentCategory` 只允许从以下枚举中选择 1 个：
- 上装
- 外套
- 连衣裙
- 半身裙
- 裤装
- 套装
- 童装
- 运动服
- 其他服饰

`garmentItems[].garmentStructure` 只允许从以下候选中选择 1 到 4 个最相关项：
- 领口明显
- 肩线明显
- 袖型明显
- 腰线明显
- 下摆明显
- 开襟结构
- 拉链结构
- 纽扣结构
- 图案印花明显
- 拼接结构明显

`garmentItems[].garmentLength` 只允许从以下候选中选择 1 个：
- 短款
- 常规款
- 中长款
- 长款

`garmentItems[].fitType` 只允许从以下候选中选择 1 到 2 个最相关项：
- 修身
- 标准
- 宽松
- 廓形
- 直筒
- A字

`garmentItems[].fabricFeel` 只允许从以下候选中选择 1 到 3 个最相关项：
- 挺括
- 柔软
- 轻薄
- 厚实
- 有垂感
- 有弹性
- 粗纹理明显
- 光泽感明显

`garmentItems[].displayRisks` 只允许从以下候选中选择 0 到 4 个最相关项：
- 高反光材质
- 透明或半透明
- 高频纹理易糊
- 大面积印花需完整
- 领口结构不可错
- 肩线不可错
- 袖型不可错
- 长度不可错
- 拼接结构不可错

请严格按以下 JSON 结构输出：
{
  "garmentCategory": "",
  "garmentItems": [
    {
      "itemIndex": 1,
      "role": "",
      "garmentCategory": "",
      "subCategory": "",
      "garmentStructure": [],
      "garmentLength": "",
      "fitType": [],
      "fabricFeel": [],
      "displayRisks": [],
      "preservePoints": []
    }
  ],
  "garmentStructure": [],
  "garmentLength": "",
  "fitType": [],
  "fabricFeel": [],
  "displayRisks": [],
  "confidence": 0,
  "reason": ""
}
```

多产品搭配输出示例：

```json
{
  "garmentCategory": "套装",
  "garmentItems": [
    {
      "itemIndex": 1,
      "role": "上装",
      "garmentCategory": "上装",
      "subCategory": "衬衫",
      "garmentStructure": ["领口明显", "肩线明显", "袖型明显", "纽扣结构"],
      "garmentLength": "常规款",
      "fitType": ["宽松"],
      "fabricFeel": ["挺括", "有垂感"],
      "displayRisks": ["领口结构不可错", "肩线不可错"],
      "preservePoints": ["领口", "肩线", "袖长", "门襟纽扣"]
    },
    {
      "itemIndex": 2,
      "role": "下装",
      "garmentCategory": "半身裙",
      "subCategory": "A字半裙",
      "garmentStructure": ["腰线明显", "下摆明显"],
      "garmentLength": "中长款",
      "fitType": ["A字"],
      "fabricFeel": ["有垂感", "轻薄"],
      "displayRisks": ["长度不可错"],
      "preservePoints": ["腰头位置", "裙摆长度", "A字轮廓", "褶皱方向"]
    },
    {
      "itemIndex": 3,
      "role": "鞋",
      "garmentCategory": "其他服饰",
      "subCategory": "短靴",
      "garmentStructure": [],
      "garmentLength": "常规款",
      "fitType": [],
      "fabricFeel": ["挺括"],
      "displayRisks": [],
      "preservePoints": ["鞋型轮廓", "靴口高度", "鞋跟比例"]
    }
  ],
  "garmentStructure": ["领口明显", "肩线明显", "腰线明显", "下摆明显"],
  "garmentLength": "常规款",
  "fitType": ["宽松", "A字"],
  "fabricFeel": ["挺括", "有垂感"],
  "displayRisks": ["领口结构不可错", "长度不可错"],
  "confidence": 0.91,
  "reason": "上传商品包含上装、下装和鞋三件搭配单品，其中上装和半裙为主要试穿主体，鞋为辅助完整搭配。"
}
```

单产品试穿输出示例：

```json
{
  "garmentCategory": "上装",
  "garmentItems": [
    {
      "itemIndex": 1,
      "role": "上装",
      "garmentCategory": "上装",
      "subCategory": "衬衫",
      "garmentStructure": ["领口明显", "肩线明显", "袖型明显"],
      "garmentLength": "常规款",
      "fitType": ["标准"],
      "fabricFeel": ["挺括", "有垂感"],
      "displayRisks": ["领口结构不可错", "肩线不可错"],
      "preservePoints": ["领口", "肩线", "袖型", "上身轮廓"]
    }
  ],
  "garmentStructure": ["领口明显", "肩线明显", "袖型明显"],
  "garmentLength": "常规款",
  "fitType": ["标准"],
  "fabricFeel": ["挺括", "有垂感"],
  "displayRisks": ["领口结构不可错", "肩线不可错"],
  "confidence": 0.93,
  "reason": "上传素材主要围绕同一件上装展开，未见需要共同试穿的第二件核心商品。"
}
```

### 5.2.4 `garmentItems` 到最终 Prompt 的映射规则

当识别结果返回 `garmentItems[]` 后，系统应将其转换为最终提示词中的 `outfitItemsPrompt`。推荐映射规则如下：

```json
{
  "outfitItemsPromptBuilder": {
    "input": "garmentItems[]",
    "output": "outfitItemsPrompt",
    "rule": "按 itemIndex 升序逐件拼接；每件商品至少输出 role、subCategory 或 garmentCategory、preservePoints；若 preservePoints 为空，则回退使用 garmentStructure 和 displayRisks 生成保真重点。",
    "template": "第{itemIndex}件商品为{role}，细分品类={subCategoryOrCategory}，重点保留{preservePointsJoined}",
    "joiner": "；",
    "tailRule": "结尾追加：不得将不同商品串位、合并、漏穿或用单一泛化品类覆盖全部单品。"
  }
}
```

细化规则：

1. `subCategoryOrCategory`
   - 优先取 `subCategory`
   - 若 `subCategory` 为空，则回退 `garmentCategory`

2. `preservePointsJoined`
   - 优先取 `preservePoints`
   - 若 `preservePoints` 为空，则用 `garmentStructure + displayRisks` 去重后取前 4 项
   - 若仍为空，则输出“该单品真实结构与穿着关系”

3. 示例转换

输入：

```json
[
  {
    "itemIndex": 1,
    "role": "上装",
    "garmentCategory": "上装",
    "subCategory": "衬衫",
    "preservePoints": ["领口", "肩线", "袖长", "门襟纽扣"]
  },
  {
    "itemIndex": 2,
    "role": "下装",
    "garmentCategory": "半身裙",
    "subCategory": "A字半裙",
    "preservePoints": ["腰头位置", "裙摆长度", "A字轮廓", "褶皱方向"]
  }
]
```

输出：

```text
第1件商品为上装，细分品类=衬衫，重点保留领口、肩线、袖长和门襟纽扣；第2件商品为下装，细分品类=A字半裙，重点保留腰头位置、裙摆长度、A字轮廓和褶皱方向。不得将不同商品串位、合并、漏穿或用单一泛化品类覆盖全部单品。
```

### 5.2.5 多产品搭配的冲突处理规则

当 `garmentItems[]`、用户输入的 `outfitItems`、高级设置 `productType` 或补充说明之间存在冲突时，按以下优先级处理：

```json
{
  "multiItemConflictResolution": {
    "priorityOrder": [
      "用户明确指定的 outfitItems",
      "识别结果 garmentItems",
      "用户补充说明中的明确角色描述",
      "高级设置 productType",
      "默认 garmentCategory"
    ],
    "rules": {
      "userOutfitItems_vs_detectedGarmentItems": "若用户已明确逐件填写 outfitItems，则以用户填写为主；识别结果仅补缺失字段，不覆盖已确认角色和细分品类。",
      "detectedRoles_vs_supplementText": "若补充说明明确写出“鞋子只做辅助”“只突出上装和下装”等角色要求，则允许覆盖识别链路中的弱角色判断。",
      "singleProductType_vs_multiItems": "当存在多个 garmentItems 时，productType 只能作为整套风格弱约束，不得覆盖逐商品细分品类。",
      "missingUserOutfitItems": "若用户未填写 outfitItems，则直接使用 garmentItems 构造 outfitItemsPrompt。",
      "partialUserOutfitItems": "若用户只填写了部分商品，则未填写部分由 garmentItems 自动补齐。",
      "detectedMoreItemsThanUserWants": "若识别出 3 件商品，但用户明确只想突出其中 2 件，则未被强调的商品仅允许作为弱辅助，不能抢主体。",
      "lowConfidenceGarmentItems": "若 garmentItems 置信度低于阈值，后端应保留总品类规则，同时降低逐商品强约束力度，必要时提示用户确认。"
    }
  }
}
```

### 5.3 模特图识别提示词

```text
你是一位服饰电商图片识别助手。请基于上传模特图识别该模特的站姿状态、构图范围和遮挡风险，用于后续模特试穿提示词拼装。

输出要求：
1. 仅输出 JSON。
2. `modelBodyPose` 只允许从以下候选中选择 1 个：
- 正面站姿
- 三分之二侧站姿
- 侧面站姿
- 背面站姿
- 半身近景
- 坐姿
- 动态姿势

3. `modelOcclusionRisks` 只允许从以下候选中选择 0 到 4 个最相关项：
- 手部遮挡胸前
- 手部遮挡腰部
- 手部遮挡下摆
- 头发遮挡领口
- 手臂遮挡袖型
- 身体转向较大
- 下半身不完整
- 上半身不完整
- 透视角度较强

4. `backgroundComplexity` 只允许从以下候选中选择 1 个：
- 干净简单
- 中等复杂
- 复杂抢眼

5. `confidence` 输出 0 到 1 的小数。
6. `reason` 用一句中文简述判断依据。
```

建议直接调用的完整提示词：

```text
你是一位服饰电商图片识别助手。请基于用户上传的模特图，对该模特做结构化识别，供“模特试穿”功能后续拼装提示词使用。

识别目标：
1. 判断模特当前的主体姿态和主要拍摄角度。
2. 判断画面中人物的构图范围和可用于试穿的展示范围。
3. 判断哪些区域存在明显遮挡或强透视风险。
4. 判断背景复杂度是否会影响试穿主体的稳定展示。
5. 判断当前模特图更接近全身、半身还是上半身近景等构图范围。

识别原则：
1. 优先围绕人物主体、姿态、遮挡和构图可用性判断，不要输出与试穿无关的信息。
2. 如果上传多张模特图，请综合多张图判断一个统一结果，优先选取最适合作为试穿基准的姿态结论。
3. 如果某个风险不明显，不要强行命中。
4. `modelBodyPose` 必须输出 1 个最接近的枚举值，不允许为空。
5. 本次识别的目标是服务后续试穿稳定性，不是做人像审美点评。

输出要求：
1. 仅输出 JSON。
2. 不要输出 markdown，不要输出解释，不要输出多余文字。
3. JSON 字段必须完整，字段名必须严格一致。

字段枚举要求：

`modelBodyPose` 只允许从以下候选中选择 1 个：
- 正面站姿
- 三分之二侧站姿
- 侧面站姿
- 背面站姿
- 半身近景
- 坐姿
- 动态姿势

`modelOcclusionRisks` 只允许从以下候选中选择 0 到 4 个最相关项：
- 手部遮挡胸前
- 手部遮挡腰部
- 手部遮挡下摆
- 头发遮挡领口
- 手臂遮挡袖型
- 身体转向较大
- 下半身不完整
- 上半身不完整
- 透视角度较强

`backgroundComplexity` 只允许从以下候选中选择 1 个：
- 干净简单
- 中等复杂
- 复杂抢眼

`framingRange` 只允许从以下候选中选择 1 个：
- 全身完整
- 半身为主
- 上半身近景
- 局部人物裁切

`confidence` 输出 0 到 1 的小数。

`reason` 用一句中文简述主要判断依据。

请严格按以下 JSON 结构输出：
{
  "modelBodyPose": "",
  "modelOcclusionRisks": [],
  "backgroundComplexity": "",
  "framingRange": "",
  "confidence": 0,
  "reason": ""
}
```

标准输出结构：

```json
{
  "modelBodyPose": "三分之二侧站姿",
  "modelOcclusionRisks": ["头发遮挡领口"],
  "backgroundComplexity": "干净简单",
  "framingRange": "半身为主",
  "confidence": 0.91,
  "reason": "人物为三分之二侧站姿，主体清晰，画面以半身构图为主，头发对领口区域存在轻度遮挡。"
}
```

字段释义：

```json
{
  "modelBodyPose": "模特当前最主要的姿态和拍摄角度，用于判断后续试穿画面的基础上身逻辑。",
  "modelOcclusionRisks": "后续试穿时最容易遮挡服装关键区域的风险点，用于进入结构保护和负向约束。",
  "backgroundComplexity": "背景复杂程度，用于判断画面是否容易抢主体或增加后续融合难度。",
  "framingRange": "人物构图范围，用于判断适合生成全身、半身还是局部试穿图。",
  "confidence": "本次识别结果的总体置信度。",
  "reason": "用于回看识别依据的一句话说明。"
}
```

输出示例 1：

```json
{
  "modelBodyPose": "正面站姿",
  "modelOcclusionRisks": [],
  "backgroundComplexity": "干净简单",
  "framingRange": "全身完整",
  "confidence": 0.96,
  "reason": "人物为标准正面站姿，全身完整清晰，无遮挡关键服装区域，适合做标准试穿基准图。"
}
```

输出示例 2：

```json
{
  "modelBodyPose": "半身近景",
  "modelOcclusionRisks": ["头发遮挡领口", "手臂遮挡袖型"],
  "backgroundComplexity": "中等复杂",
  "framingRange": "上半身近景",
  "confidence": 0.88,
  "reason": "画面以上半身近景为主，头发对领口区域有遮挡，手臂对袖型存在部分遮挡，更适合局部或半身试穿表达。"
}
```

## 6. 品类配置

```json
{
  "modelTryCategoryRules": {
    "上装": {
      "prompt": "重点保证领口、肩线、胸背版型、袖型和上装长度真实，不得出现上身轮廓失真。",
      "required": [
        "领口与肩线结构清晰",
        "袖型和袖长准确",
        "胸背轮廓与版型真实"
      ],
      "forbidden": [
        "领口变形",
        "肩线错误",
        "袖型错误"
      ]
    },
    "外套": {
      "prompt": "重点保证外套开合结构、肩线、衣长、门襟、纽扣或拉链关系准确，体现外套层次和廓形。",
      "required": [
        "门襟或开合关系正确",
        "外套廓形清晰",
        "衣长和袖长真实"
      ],
      "forbidden": [
        "门襟错位",
        "拉链或纽扣结构错误",
        "外套被过度收紧"
      ]
    },
    "连衣裙": {
      "prompt": "重点保证领口、肩线、腰线、裙摆长度和整体垂感真实，体现完整裙装上身效果。",
      "required": [
        "腰线和裙摆自然",
        "长度和垂感真实",
        "整体结构连贯"
      ],
      "forbidden": [
        "腰线漂移",
        "裙摆长度错误",
        "下摆边缘融化"
      ]
    },
    "半身裙": {
      "prompt": "重点保证腰头、裙摆长度、A字或直筒轮廓和下身贴合关系真实。",
      "required": [
        "腰头位置稳定",
        "裙摆轮廓清晰",
        "下身比例自然"
      ],
      "forbidden": [
        "腰头位置错误",
        "裙摆比例异常",
        "下装透视错误"
      ]
    },
    "裤装": {
      "prompt": "重点保证腰部、臀腿线条、裤长、裤脚和褶皱受力关系真实，避免下装结构变形。",
      "required": [
        "裤腰和裤长准确",
        "臀腿线条自然",
        "裤脚轮廓清晰"
      ],
      "forbidden": [
        "裤长错误",
        "腿部结构扭曲",
        "裤脚变形"
      ]
    },
    "套装": {
      "prompt": "重点保证上下装款式、颜色、面料和整体穿搭关系统一，上下装之间保持真实套装逻辑。",
      "required": [
        "上下装一致性稳定",
        "套装关系明确",
        "整套比例自然"
      ],
      "forbidden": [
        "上下装风格不一致",
        "颜色或材质不统一",
        "整套结构割裂"
      ]
    },
    "童装": {
      "prompt": "重点保证童装尺码感、版型和人物比例真实，避免成人化表达。",
      "required": [
        "童装尺码感准确",
        "比例和气质自然",
        "服装结构稳定"
      ],
      "forbidden": [
        "成人化过强",
        "服装比例异常",
        "童装细节失真"
      ]
    },
    "运动服": {
      "prompt": "重点保证运动服松量、弹性、功能剪裁和动态上身关系真实，兼顾动作自然度。",
      "required": [
        "动态穿着关系自然",
        "运动版型稳定",
        "面料弹性表达可信"
      ],
      "forbidden": [
        "动作与服装受力矛盾",
        "运动版型变形",
        "局部贴合关系失真"
      ]
    },
    "其他服饰": {
      "prompt": "在保持商品真实结构和试穿关系稳定的前提下，按最接近的服饰逻辑生成上身效果。",
      "required": [
        "商品结构不改动",
        "穿着关系自然",
        "主体清晰可辨"
      ],
      "forbidden": [
        "凭空新增结构",
        "错误理解商品类型",
        "试穿结果与商品不一致"
      ]
    }
  }
}
```

## 7. 试穿类型与品类的映射关系

### 7.1 使用原则

`试穿类型` 和 `服装品类` 不是一回事：

- `试穿类型`
  - 定义本次任务是围绕 `单件商品` 还是 `完整套装关系` 生成
- `服装品类`
  - 定义商品本身属于上装、外套、裙装、裤装、套装等哪一类

### 7.2 映射规则

```json
{
  "tryOnGarmentTypeRules": {
    "单产品试穿": {
      "recommendedCategories": ["上装", "外套", "连衣裙", "半身裙", "裤装", "童装", "运动服", "其他服饰"],
      "prompt": "按单件商品试穿逻辑执行，重点保证单品主体、版型和上身效果稳定，不凭空补出未上传的核心搭配单品。"
    },
    "多产品搭配": {
      "recommendedCategories": ["套装", "上装", "外套", "半身裙", "裤装", "其他服饰"],
      "prompt": "按多件商品共同试穿逻辑执行，除整体搭配关系外，还必须逐件约束每件商品的穿着部位、细分品类和保真重点。"
    }
  }
}
```

### 7.3 不匹配时的处理规则

```json
{
  "tryOnMismatchRules": {
    "category=套装_and_tryOnGarmentType=单产品试穿": "默认以用户选择为准，仅围绕用户希望展示的核心单品执行，但必须在补充说明中明确是上装优先还是下装优先；若未明确，则优先提示用户补充。",
    "detectedMultiItems_and_tryOnGarmentType=单产品试穿": "按单产品试穿执行，但必须明确仅哪一件为目标商品，其余商品仅允许作为弱辅助，不得被错误改动。",
    "detectedSingleItem_and_tryOnGarmentType=多产品搭配": "以后端校验为准，提示素材不足以支撑多产品搭配。",
    "detectedMultiItems_and_missingOutfitItems": "若识别到多件细分品类商品但未补齐 `outfitItems`，后端应自动生成逐商品明细，或提示用户补全后再生成。"
  }
}
```

## 8. 高级设置对应提示词配置

```json
{
  "modelTryAdvancedFieldPrompts": {
    "productType": {
      "prompt": "若用户指定产品类型，请按该产品类型补充更准确的试穿表达，但不得改变上传商品本身的真实品类和结构。",
      "options": {
        "女装": { "valuePrompt": "整体按女装试穿表达，强调版型、线条、穿搭感和女性向展示逻辑。" },
        "男装": { "valuePrompt": "整体按男装试穿表达，强调结构、肩线、轮廓和男性向展示逻辑。" },
        "童装": { "valuePrompt": "整体按童装试穿表达，强调尺码感、比例自然和非成人化展示。" },
        "运动服": { "valuePrompt": "整体按运动服试穿表达，强调动态关系、舒适感和功能穿着逻辑。" },
        "内搭": { "valuePrompt": "整体按内搭类商品表达，重点保证贴合关系、层次和打底属性清晰。" },
        "外搭": { "valuePrompt": "整体按外搭类商品表达，重点保证外层轮廓、开合关系和叠穿逻辑稳定。" },
        "上衣": { "valuePrompt": "整体按上衣试穿表达，重点突出上半身结构、版型和穿着轮廓。" },
        "裤子": { "valuePrompt": "整体按裤装试穿表达，重点突出腰部、臀腿线条、裤长和裤脚轮廓。" },
        "裙子": { "valuePrompt": "整体按裙装试穿表达，重点突出腰线、裙摆轮廓、长度和垂感。" },
        "套装": { "valuePrompt": "整体按套装试穿表达，重点保证上下装关系统一、完整且风格一致。" },
        "泳装": { "valuePrompt": "整体按泳装试穿表达，重点保证贴合关系、人体比例和材质观感真实。" },
        "睡衣家居服": { "valuePrompt": "整体按睡衣家居服试穿表达，重点突出舒适感、柔软度和居家穿着语义。" }
      }
    },
    "displayLayout": {
      "prompt": "若用户指定展示排版，请按该排版控制人物和商品在画面中的主次关系。",
      "options": {
        "全身展示": { "valuePrompt": "以全身展示为主，人物比例完整，服装整体轮廓清晰。" },
        "半身展示": { "valuePrompt": "以半身展示为主，突出上半身穿着效果和关键结构。" },
        "上半身近景": { "valuePrompt": "以上半身近景为主，聚焦领口、肩线、胸背轮廓和材质细节。" },
        "局部细节图": { "valuePrompt": "以局部细节展示为主，重点保证关键结构和材质纹理清晰。" },
        "主图构图": { "valuePrompt": "按电商主图逻辑构图，主体集中、清晰、便于缩略图识别。" },
        "内容种草构图": { "valuePrompt": "按内容种草图逻辑构图，兼顾人物氛围和商品可读性。" },
        "左右留白构图": { "valuePrompt": "保留左右留白，便于后续排版和信息叠加，同时不削弱试穿主体。" },
        "居中构图": { "valuePrompt": "以主体居中构图为主，保证商品识别清晰、画面稳定。" },
        "偏上构图": { "valuePrompt": "主体位置略偏上，兼顾人物与下方留白，适合电商视觉排布。" },
        "偏下构图": { "valuePrompt": "主体位置略偏下，兼顾头部留白和上方排版空间。" },
        "模特偏左构图": { "valuePrompt": "模特主体略偏左，便于右侧留出文案或辅助信息空间。" },
        "模特偏右构图": { "valuePrompt": "模特主体略偏右，便于左侧留出文案或辅助信息空间。" }
      }
    },
    "sceneType": {
      "prompt": "若用户指定场景类型，请在不影响试穿真实性的前提下补充相应的场景语义。",
      "options": {
        "纯色背景": { "valuePrompt": "使用干净纯色背景，突出试穿主体和商品结构。" },
        "摄影棚": { "valuePrompt": "使用商业摄影棚语义，强调光线稳定、主体清晰和成片质感。" },
        "通勤街拍": { "valuePrompt": "使用通勤街拍语义，强调日常穿搭代入和都市感。" },
        "室内生活方式": { "valuePrompt": "使用室内生活方式语义，强调真实、轻松和生活化穿搭场景。" },
        "度假场景": { "valuePrompt": "使用度假场景语义，强调轻松氛围和服装风格表达。" },
        "运动场景": { "valuePrompt": "使用运动场景语义，强调动作自然、功能感和穿着逻辑。" },
        "极简空间": { "valuePrompt": "使用极简空间语义，背景克制、层次简洁，突出服装主体。" },
        "商场店内": { "valuePrompt": "使用商场店内语义，强调真实消费场景和试穿代入感。" },
        "咖啡馆": { "valuePrompt": "使用咖啡馆语义，强调轻生活方式、松弛感和日常穿搭氛围。" },
        "办公空间": { "valuePrompt": "使用办公空间语义，强调通勤属性、利落感和职业场景适配。" },
        "户外草地": { "valuePrompt": "使用户外草地语义，强调自然光感、轻松状态和休闲穿搭表达。" },
        "海边度假": { "valuePrompt": "使用海边度假语义，强调轻盈、放松和季节氛围。" },
        "酒店走廊": { "valuePrompt": "使用酒店走廊语义，强调空间层次、人物气质和商业感。" },
        "楼梯台阶": { "valuePrompt": "使用楼梯台阶语义，强调姿态变化、层次和画面节奏。" }
      }
    },
    "displayFocus": {
      "prompt": "若用户指定展示重点，请把重点内容作为本次试穿图的优先表达目标。",
      "options": {
        "版型": { "valuePrompt": "重点突出服装版型、廓形和上身轮廓关系。" },
        "面料": { "valuePrompt": "重点突出面料纹理、垂感、厚薄和材质观感。" },
        "上身效果": { "valuePrompt": "重点突出真实穿着后的整体上身效果和人物穿搭状态。" },
        "细节结构": { "valuePrompt": "重点突出领口、肩线、袖型、腰线、下摆等结构细节。" },
        "颜色图案": { "valuePrompt": "重点突出服装颜色、印花或图案的真实呈现和完整性。" },
        "套装关系": { "valuePrompt": "重点突出上下装或整套单品之间的统一关系和完整搭配效果。" },
        "领口": { "valuePrompt": "重点突出领口结构、开口形态和领口与肩颈关系。" },
        "肩线": { "valuePrompt": "重点突出肩线位置、肩部轮廓和上身支撑关系。" },
        "袖型": { "valuePrompt": "重点突出袖型轮廓、袖长和袖身结构。" },
        "腰线": { "valuePrompt": "重点突出腰线位置、收放关系和整体比例。" },
        "下摆": { "valuePrompt": "重点突出下摆长度、边缘轮廓和垂坠关系。" },
        "裤脚": { "valuePrompt": "重点突出裤脚轮廓、长度和落点关系。" },
        "材质纹理": { "valuePrompt": "重点突出材质纹理、织物肌理和细节层次。" },
        "垂感": { "valuePrompt": "重点突出面料垂感、受力褶皱和穿着状态。" }
      }
    },
    "atmosphere": {
      "prompt": "若用户指定氛围营造，请将其作为弱约束补充到成片观感中，不得压过商品真实一致性。",
      "options": {
        "高级感": { "valuePrompt": "整体氛围偏高级克制，强调精致、稳定和商业成片质感。" },
        "通勤感": { "valuePrompt": "整体氛围偏通勤日常，强调实穿、利落和都市生活气息。" },
        "休闲感": { "valuePrompt": "整体氛围偏轻松休闲，强调自然、舒展和亲和感。" },
        "氛围感": { "valuePrompt": "整体氛围偏审美表达，强调画面层次、人物气质和穿搭感。" },
        "运动感": { "valuePrompt": "整体氛围偏活力运动，强调动作自然、轻盈和功能表达。" },
        "节日感": { "valuePrompt": "整体氛围偏节日场景，强调应景但不过度装饰，商品主体仍需清晰。" },
        "高级极简": { "valuePrompt": "整体氛围偏高级极简，强调克制、留白和精致商业观感。" },
        "清新自然": { "valuePrompt": "整体氛围偏清新自然，强调轻盈、柔和和真实生活感。" },
        "都市时尚": { "valuePrompt": "整体氛围偏都市时尚，强调利落、风格感和人物气场。" },
        "温柔知性": { "valuePrompt": "整体氛围偏温柔知性，强调自然、得体和柔和表达。" },
        "年轻活力": { "valuePrompt": "整体氛围偏年轻活力，强调轻快、明亮和感染力。" },
        "松弛感": { "valuePrompt": "整体氛围偏松弛自然，强调不刻意、舒展和日常状态。" }
      }
    },
    "copyLanguage": {
      "prompt": "若用户指定文案语种，仅用于控制画面中若存在文字时的语言倾向；若本次任务不需要文字，可不显式生成文案。",
      "options": {
        "中文": { "valuePrompt": "若画面需要文字元素，优先使用中文语境。" },
        "英文": { "valuePrompt": "若画面需要文字元素，优先使用英文语境。" },
        "中英双语": { "valuePrompt": "若画面需要文字元素，可使用中英双语语境，但以清晰克制为主。" },
        "本地化语种": { "valuePrompt": "若画面需要文字元素，请按目标市场对应语种本地化表达。" },
        "日文": { "valuePrompt": "若画面需要文字元素，优先使用日文语境。" },
        "韩文": { "valuePrompt": "若画面需要文字元素，优先使用韩文语境。" },
        "阿拉伯语": { "valuePrompt": "若画面需要文字元素，优先使用阿拉伯语语境。" },
        "西班牙语": { "valuePrompt": "若画面需要文字元素，优先使用西班牙语语境。" },
        "葡萄牙语": { "valuePrompt": "若画面需要文字元素，优先使用葡萄牙语语境。" }
      }
    },
    "targetMarket": {
      "prompt": "若用户指定目标市场，请把该市场审美和消费语境作为弱约束补充到成片中。",
      "options": {
        "中国": { "valuePrompt": "偏中国电商审美语境，强调真实、种草感和主体清晰。" },
        "欧美": { "valuePrompt": "偏欧美服饰展示语境，强调立体轮廓、自然姿态和风格表达。" },
        "东南亚": { "valuePrompt": "偏东南亚市场审美语境，强调明快、亲和和真实日常表达。" },
        "日本韩国": { "valuePrompt": "偏日韩审美语境，强调干净、克制、精致和轻生活方式感。" },
        "中东": { "valuePrompt": "偏中东市场展示语境，强调得体、质感和人物气质统一。" },
        "拉美": { "valuePrompt": "偏拉美市场展示语境，强调活力、色彩和真实穿搭感染力。" },
        "日本": { "valuePrompt": "偏日本市场审美语境，强调细腻、克制、干净和日常感。" },
        "韩国": { "valuePrompt": "偏韩国市场审美语境，强调精致、时尚、轻氛围感和人物状态统一。" },
        "英国": { "valuePrompt": "偏英国市场展示语境，强调得体、结构感和审美克制。" },
        "法国": { "valuePrompt": "偏法国市场展示语境，强调自然时装感、松弛和高级气质。" },
        "德国": { "valuePrompt": "偏德国市场展示语境，强调理性、清晰和真实功能表达。" },
        "澳洲": { "valuePrompt": "偏澳洲市场展示语境，强调自然光感、轻松穿搭和生活方式表达。" },
        "加拿大": { "valuePrompt": "偏加拿大市场展示语境，强调自然、实穿和舒适层次。" }
      }
    }
  }
}
```

## 9. 参数值扩展提示词配置

```json
{
  "modelTryValueExpansions": {
    "tryOnGarmentType": {
      "单产品试穿": { "valuePrompt": "按单产品试穿执行，主体只围绕目标服装展开，其他穿搭元素仅做弱辅助。" },
      "多产品搭配": { "valuePrompt": "按多产品搭配执行，必须同时保证整体搭配关系成立，以及每件商品各自的角色、细分品类和保真重点稳定。" }
    },
    "ratio": {
      "1:1": { "valuePrompt": "适合方图电商展示，主体集中，商品清晰。" },
      "3:4": { "valuePrompt": "适合服饰人物竖图展示，兼顾人物比例与服装完整度。" },
      "4:5": { "valuePrompt": "适合电商主图与内容图，人物主体更突出。" },
      "9:16": { "valuePrompt": "适合视频封面和竖版内容图，强调人物与穿搭氛围。" }
    },
    "resolution": {
      "1K": { "valuePrompt": "按 1K 清晰度输出，保证基础电商可用质量。" },
      "2K": { "valuePrompt": "按 2K 清晰度输出，增强服装细节与纹理表达。" },
      "4K": { "valuePrompt": "按 4K 清晰度输出，强化局部结构、纹理和商业成片质感。" }
    }
  }
}
```

## 10. 高级设置参与最终 Prompt 的规则

### 10.1 使用原则

高级设置全部属于可选弱约束：

1. 不得覆盖上传商品本身的真实品类和结构。
2. 不得压过 `试穿类型`、`品类规则` 和识别结果中的强约束。
3. 更适合用于补充构图方式、场景语义、表达重点、氛围倾向和目标市场语境。

### 10.2 占位说明

```json
{
  "productTypeValuePrompt": "命中 `productType` 后取对应的 valuePrompt",
  "displayLayoutValuePrompt": "命中 `displayLayout` 后取对应的 valuePrompt",
  "sceneTypeValuePrompt": "命中 `sceneType` 后取对应的 valuePrompt",
  "displayFocusValuePrompt": "命中 `displayFocus` 后取对应的 valuePrompt",
  "atmosphereValuePrompt": "命中 `atmosphere` 后取对应的 valuePrompt",
  "copyLanguageValuePrompt": "命中 `copyLanguage` 后取对应的 valuePrompt",
  "targetMarketValuePrompt": "命中 `targetMarket` 后取对应的 valuePrompt"
}
```

### 10.3 拼装建议

若高级设置存在值，建议统一拼为：

```text
高级设置补充：{advancedSettingValuePromptJoined}
```

按命中顺序过滤空值后，用 `；` 拼接。

## 11. 最终提示词拼装顺序

建议按以下顺序拼装：

1. 任务目标
2. 试穿类型规则
3. 品类规则
4. 多商品明细规则（仅 `多产品搭配`）
5. 服装识别补充
6. 模特识别补充
7. 用户参数
8. 参数值扩展提示词
9. 高级设置补充
10. 用户补充说明
11. 通用负向约束
12. 通用质量要求

补充说明：

- 单产品试穿与多产品搭配共用同一套最终提示词模板。
- 但以下部分必须按试穿类型做分支区分：
  1. `试穿类型规则`
  2. `多商品明细规则`
  3. `必须满足`
  4. `禁止`
- 其中：
  - 单产品试穿重点约束目标单品真实上身，不得误生成完整套装或新增核心搭配单品。
  - 多产品搭配重点约束多件商品的角色、穿着部位、细分品类和搭配关系，不得漏穿、串位、合并或被单一泛化品类覆盖。

## 12. 最终执行 Prompt 模板

```text
任务目标：请基于上传服装图与模特图生成电商可用的模特试穿图，确保服装真实上身、人物结构自然、商品展示清晰。

试穿类型规则：{tryOnGarmentTypePrompt}

品类规则：{categoryPrompt}

多商品明细规则：{outfitItemsPrompt}

服装识别补充：识别为 {garmentCategory}；结构特征为 {garmentStructureJoined}；长度特征为 {garmentLength}；版型特征为 {fitTypeJoined}；面料感受为 {fabricFeelJoined}。

模特识别补充：模特姿态为 {modelBodyPose}；遮挡风险为 {modelOcclusionRisksJoined}；背景复杂度为 {backgroundComplexity}；构图范围为 {framingRange}。后续试穿展示角度默认以模特识别结果为准，不额外单独指定前台视角参数。

模特约束：必须直接使用用户选择的模特图片作为人物参考输入，保持同一人物身份、脸部特征、发型、体态、姿态和构图范围稳定，不得替换为其他人物，不得擅自改变人物年龄感、气质和基础外观。

参数：试穿类型={tryOnGarmentType}；比例={ratio}；分辨率={resolution}；出图数量={outputCount}。

字段扩展：{valueExpansionJoined}

高级设置补充：{advancedSettingValuePromptJoined}

补充说明：{supplementText}

必须满足：{requiredJoined}

禁止：{forbiddenJoined}

通用负向约束：{universalNegativePrompt}

通用质量要求：{universalQualityPrompt}
```

模板使用说明：

1. 本节模板支持直接输出最终完整提示词，不需要再拆分为“单产品试穿模板”和“多产品搭配模板”两套。
2. `品类规则：{categoryPrompt}` 始终保留，作为整次任务的一级品类锚点。
3. 当 `tryOnGarmentType=多产品搭配` 时，`多商品明细规则：{outfitItemsPrompt}` 为强约束，不能省略，也不能被 `categoryPrompt` 替代。
4. 当 `tryOnGarmentType=单产品试穿` 时，`多商品明细规则` 可为空，或仅保留 1 件商品的简要描述。
5. 若最终输出完整提示词，建议在提示词正文下方附加“区分说明”，明确当前任务属于单产品试穿还是多产品搭配，以及本次主约束来源于哪些段。

区分说明示例：

```text
区分说明：
- 当前任务类型：单产品试穿 / 多产品搭配
- 当前一级品类锚点：{garmentCategory}
- 当前主约束段：
  - 单产品试穿：试穿类型规则 + 品类规则 + 服装识别补充
  - 多产品搭配：试穿类型规则 + 品类规则 + 多商品明细规则 + 服装识别补充
```

## 13. 通用质量要求与负向约束

### 13.1 通用质量要求

```json
{
  "universalQualityPrompt": "保持服装与人体接触关系真实自然，服装版型、颜色、面料和关键设计元素与上传商品一致；人物五官、肢体、站姿和重心稳定；服装褶皱、贴合、遮挡、透视和光影方向符合真实物理；画面干净清晰，主体突出，满足电商可用的商业成片质量。"
}
```

### 13.2 通用负向约束

```json
{
  "universalNegativePrompt": "禁止改变服装真实款式、版型、长度、颜色、图案和关键结构；禁止误生多余人物、第二张脸、多余手脚或肢体错位；禁止出现领口、肩线、袖型、腰线、下摆、裤脚等核心结构错误；禁止出现边缘融化、纹理糊化、明显 AI 伪影、低清晰度、透视错位和不真实受力；禁止背景过强抢占主体，禁止商品被头发、手部或姿态过度遮挡。"
}
```

## 14. AI 润色提示词

### 14.1 润色目标

用户补充说明可能包含人物气质、穿搭感、卖点、氛围或局部展示要求。AI 润色仅用于把用户自由输入整理成更清晰、可执行的描述，不得改写服装真实结构和试穿目标。

### 14.2 润色提示词

```text
请优化“模特试穿”补充说明，使表达更具体、清晰、可执行。润色时必须保留用户原始意图，不得改变商品品类、版型、颜色、结构、试穿目标和人物主体设定。可以补全展示重点、氛围表达和细节描述，但不要擅自新增未要求的场景主体、额外人物或与试穿无关的创意内容。当用户输入已经足够明确时，应以轻润色为主。
```

## 15. 字段参与最终 Prompt 的规则

### 15.1 强约束字段

以下字段建议直接进入最终 Prompt 主链路：

- `modelSourceType`
- `tryOnGarmentType`
- `garmentCategory`
- `garmentStructure`
- `garmentLength`
- `fitType`
- `fabricFeel`
- `displayRisks`
- `modelBodyPose`
- `modelOcclusionRisks`

### 15.2 弱约束字段

以下字段建议作为弱约束参与 `高级设置补充`：

- `productType`
- `outfitItems`
- `displayLayout`
- `sceneType`
- `displayFocus`
- `atmosphere`
- `copyLanguage`
- `targetMarket`

### 15.3 使用规则

1. `tryOnGarmentType` 参与 `试穿类型规则` 和 `参数`。
2. `modelSourceType` 参与 `模特约束`，用于明确当前人物来自“用户选择的已生成模特”或“用户上传模特”，但最终都按同一人物参考执行。
3. `garmentCategory` 参与 `品类规则`。
4. 当 `tryOnGarmentType=多产品搭配` 时，`outfitItems / garmentItems` 必须优先参与 `多商品明细规则`，逐件描述角色、细分品类和保真重点，不能只保留一个总品类。
5. `garmentStructure / garmentLength / fitType / fabricFeel` 参与 `服装识别补充`。
6. `displayRisks` 参与 `禁止` 和 `通用负向约束` 的增强说明。
7. `modelBodyPose / modelOcclusionRisks / backgroundComplexity / framingRange` 参与 `模特识别补充`。
8. `productType / outfitItems / displayLayout / sceneType / displayFocus / atmosphere / copyLanguage / targetMarket` 参与 `高级设置补充`。
9. 模特图片本身作为生成输入素材直接传入任务，不需要在最终 Prompt 中重复描述整张图片内容，只需要在 Prompt 中保留“模特约束”和“模特识别补充”。
10. 当前无前台 `视角` 字段，试穿画面的展示角度默认由 `modelBodyPose` 和 `framingRange` 决定。
11. 当某个识别字段为空时，该字段对应句子可省略，不强行输出空值。

## 16. Demo

### 16.1 输入示例

```json
{
  "modelSourceType": "用户上传模特",
  "tryOnGarmentType": "单产品试穿",
  "productType": "女装",
  "displayLayout": "半身展示",
  "sceneType": "通勤街拍",
  "displayFocus": "版型",
  "atmosphere": "通勤感",
  "copyLanguage": "中文",
  "targetMarket": "中国",
  "garmentCategory": "上装",
  "garmentStructure": ["领口明显", "肩线明显", "袖型明显"],
  "garmentLength": "常规款",
  "fitType": ["标准"],
  "fabricFeel": ["挺括", "有垂感"],
  "displayRisks": ["领口结构不可错", "肩线不可错"],
  "modelBodyPose": "三分之二侧站姿",
  "modelOcclusionRisks": ["头发遮挡领口"],
  "backgroundComplexity": "干净简单",
  "framingRange": "半身为主",
  "ratio": "3:4",
  "resolution": "2K",
  "outputCount": 2,
  "supplementText": "偏通勤轻商务风，突出衬衫挺括和肩线，不要过度修图。"
}
```

### 16.2 输出示例

```text
任务目标：请基于上传服装图与模特图生成电商可用的模特试穿图，确保服装真实上身、人物结构自然、商品展示清晰。

试穿类型规则：本次任务为单产品试穿，重点保持单件商品的真实上身效果，避免凭空补出不存在的搭配单品，不得把单品误生成上下成套穿搭。

品类规则：重点保证领口、肩线、胸背版型、袖型和上装长度真实，不得出现上身轮廓失真。

服装识别补充：识别为 上装；结构特征为 领口明显、肩线明显、袖型明显；长度特征为 常规款；版型特征为 标准；面料感受为 挺括、有垂感。

模特识别补充：模特姿态为 三分之二侧站姿；遮挡风险为 头发遮挡领口；背景复杂度为 干净简单；构图范围为 半身为主。后续试穿展示角度默认以模特识别结果为准，不额外单独指定前台视角参数。

模特约束：必须直接使用用户选择的模特图片作为人物参考输入，保持同一人物身份、脸部特征、发型、体态、姿态和构图范围稳定，不得替换为其他人物，不得擅自改变人物年龄感、气质和基础外观。

参数：试穿类型=单产品试穿；比例=3:4；分辨率=2K；出图数量=2。

字段扩展：按单产品试穿执行，主体只围绕目标服装展开，其他穿搭元素仅做弱辅助。适合服饰人物竖图展示，兼顾人物比例与服装完整度。按 2K 清晰度输出，增强服装细节与纹理表达。

高级设置补充：整体按女装试穿表达，强调版型、线条、穿搭感和女性向展示逻辑；以半身展示为主，突出上半身穿着效果和关键结构；使用通勤街拍语义，强调日常穿搭代入和都市感；重点突出服装版型、廓形和上身轮廓关系；整体氛围偏通勤日常，强调实穿、利落和都市生活气息；若画面需要文字元素，优先使用中文语境；偏中国电商审美语境，强调真实、种草感和主体清晰。

补充说明：偏通勤轻商务风，突出衬衫挺括和肩线，不要过度修图。

必须满足：单件商品主体必须清晰完整；服装结构与款式必须和上传商品一致；人物其余穿搭仅作为弱辅助，不得抢占单品主体；领口与肩线结构清晰；袖型和袖长准确；胸背轮廓与版型真实。

禁止：把单品误生成为完整套装；新增用户未上传的核心搭配单品；上下装关系表达混乱导致主体不清；领口变形；肩线错误；袖型错误。

通用负向约束：禁止改变服装真实款式、版型、长度、颜色、图案和关键结构；禁止误生多余人物、第二张脸、多余手脚或肢体错位；禁止出现领口、肩线、袖型、腰线、下摆、裤脚等核心结构错误；禁止出现边缘融化、纹理糊化、明显 AI 伪影、低清晰度、透视错位和不真实受力；禁止背景过强抢占主体，禁止商品被头发、手部或姿态过度遮挡。

通用质量要求：保持服装与人体接触关系真实自然，服装版型、颜色、面料和关键设计元素与上传商品一致；人物五官、肢体、站姿和重心稳定；服装褶皱、贴合、遮挡、透视和光影方向符合真实物理；画面干净清晰，主体突出，满足电商可用的商业成片质量。
```

### 16.3 多产品搭配输入示例

```json
{
  "modelSourceType": "用户上传模特",
  "tryOnGarmentType": "多产品搭配",
  "productType": "女装",
  "outfitItems": [
    {
      "id": "item-1",
      "role": "上装",
      "productType": "衬衫",
      "subCategory": "宽松长袖衬衫",
      "preservePoints": ["领口", "肩线", "袖长", "门襟纽扣"]
    },
    {
      "id": "item-2",
      "role": "下装",
      "productType": "半身裙",
      "subCategory": "高腰A字半裙",
      "preservePoints": ["腰头位置", "裙摆长度", "A字轮廓", "褶皱方向"]
    },
    {
      "id": "item-3",
      "role": "鞋",
      "productType": "短靴",
      "subCategory": "尖头短靴",
      "preservePoints": ["鞋型轮廓", "靴口高度", "鞋跟比例"]
    }
  ],
  "displayLayout": "全身展示",
  "sceneType": "通勤街拍",
  "displayFocus": "套装关系",
  "atmosphere": "都市时尚",
  "copyLanguage": "中文",
  "targetMarket": "中国",
  "garmentCategory": "套装",
  "garmentItems": [
    { "role": "上装", "garmentCategory": "上装", "subCategory": "衬衫" },
    { "role": "下装", "garmentCategory": "半身裙", "subCategory": "A字半裙" },
    { "role": "鞋", "garmentCategory": "其他服饰", "subCategory": "短靴" }
  ],
  "modelBodyPose": "正面站姿",
  "modelOcclusionRisks": [],
  "backgroundComplexity": "干净简单",
  "framingRange": "全身完整",
  "ratio": "3:4",
  "resolution": "2K",
  "outputCount": 2,
  "supplementText": "突出上装和裙装的通勤搭配关系，鞋子只做完整搭配辅助，不要改成高跟鞋。"
}
```

### 16.4 多产品搭配输出示例

```text
任务目标：请基于上传服装图与模特图生成电商可用的模特试穿图，确保服装真实上身、人物结构自然、商品展示清晰。

试穿类型规则：本次任务为多产品搭配，重点保证多件商品在同一人物身上的完整统一展示，保持各单品之间的角色分工、穿着部位、款式、颜色、面料、比例和搭配关系稳定。

品类规则：重点保证上下装款式、颜色、面料和整体穿搭关系统一，上下装之间保持真实套装逻辑。

多商品明细规则：第1件商品为上装，细分品类=宽松长袖衬衫，重点保留领口、肩线、袖长和门襟纽扣；第2件商品为下装，细分品类=高腰A字半裙，重点保留腰头位置、裙摆长度、A字轮廓和褶皱方向；第3件商品为鞋，细分品类=尖头短靴，重点保留鞋型轮廓、靴口高度和鞋跟比例。不得将不同商品串位、合并、漏穿或用单一泛化品类覆盖全部单品。

模特识别补充：模特姿态为正面站姿；遮挡风险为无；背景复杂度为干净简单；构图范围为全身完整。后续试穿展示角度默认以模特识别结果为准，不额外单独指定前台视角参数。

参数：试穿类型=多产品搭配；比例=3:4；分辨率=2K；出图数量=2。

字段扩展：按多产品搭配执行，必须同时保证整体搭配关系成立，以及每件商品各自的角色、细分品类和保真重点稳定。适合服饰人物竖图展示，兼顾人物比例与服装完整度。按 2K 清晰度输出，增强服装细节与纹理表达。

高级设置补充：整体按女装试穿表达，强调版型、线条、穿搭感和女性向展示逻辑；以全身展示为主，人物比例完整，服装整体轮廓清晰；使用通勤街拍语义，强调日常穿搭代入和都市感；重点突出上下装或整套单品之间的统一关系和完整搭配效果；整体氛围偏都市时尚，强调利落、风格感和人物气场；若画面需要文字元素，优先使用中文语境；偏中国电商审美语境，强调真实、种草感和主体清晰。

补充说明：突出上装和裙装的通勤搭配关系，鞋子只做完整搭配辅助，不要改成高跟鞋。
```

## 17. 开发落地要求

1. 服装图和模特图均为必传。
2. 服装图建议支持多张，用于提高结构还原稳定性。
3. `tryOnGarmentType` 为必选字段。
4. `ratio`、`resolution`、`outputCount` 为必选字段。
5. 高级设置全部为可选字段，不填时不影响主链路生成。
6. 图片识别建议在生成前自动执行，识别结果进入任务快照。
7. 最终提示词按本文档模板统一组装，避免不同链路自由拼接导致口径不一致。
8. 识别结果低置信度时，可回退到最保守的试穿逻辑，不强行写入高风险结论。
9. 若用户选择 `多产品搭配`，但上传素材不足以支撑多件商品关系，应阻断生成或提示补充素材。
10. `多产品搭配` 命中多个细分品类时，最终提示词必须包含逐商品明细段，不能只保留一个 `productType` 或一个总品类。
11. 结果图的核心验收标准是：商品一致、人物自然、试穿真实、商业可用。
