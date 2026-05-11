# AI商品图-一键场景图-真实功能与参数提示词清单

> 用途：`goods-scene` 开发直接使用  
> 来源：基于 `src/App.tsx` 真实实现 + `AI商品图-11功能开发测试落地需求文档.md` + `AI商品图-一键场景图-提示词与配置方案.md` 整理  
> 重点：只保留开发落地需要的真实字段、参数、提示词和组装规则

## 1. 真实功能范围

- 工具：`goods-scene`
- 页面创作模式：`scene`
- 页面区块：`upload-main -> creation-mode -> advanced-settings -> supplement`
- 当前真实页面没有单独暴露 `platformInfo` 字段
- 生成目标：商品使用场景图，强调真实代入感、场景氛围和转化表达

## 2. 真实页面配置

对应代码位置：[`src/App.tsx`](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

```ts
{
  creationModeConfigKey: "scene",
  sectionOrder: ["upload-main", "creation-mode", "advanced-settings", "supplement"],
  advancedSettings: {
    extraSelects: [
      productType,
      sceneType,
      productDisplay,
      layoutStyle,
      moodStyle,
      valueFocus,
      targetMarket,
      copyLanguage
    ]
  }
}
```

## 3. 真实高级字段

### 3.1 字段定义

- `productType` 产品类型
- `sceneType` 场景类型
- `productDisplay` 产品展示
- `layoutStyle` 排版呈现
- `moodStyle` 氛围营造
- `valueFocus` 价值导向
- `targetMarket` 目标市场
- `copyLanguage` 文案语种

### 3.2 选项值

```json
{
  "productType": ["智能识别", "服装", "T恤", "背包", "鞋子", "小家电", "电视", "沙发", "吊灯", "化妆品", "香水", "水果", "饮料", "汽车", "集装箱", "蓝牙耳机", "手机", "行李箱", "文具", "机械设备", "项链", "玩具", "瑜伽服", "健身器材", "笔记本电脑", "手办"],
  "sceneType": ["智能生成", "无背景", "简单背景", "产品场景", "纯色背景", "纯色渐变", "图片边框"],
  "productDisplay": ["单品特写", "多角度展示", "套装组合", "模特手持", "使用中展示", "局部细节", "悬浮陈列"],
  "layoutStyle": ["居中构图", "左右分栏", "满版铺陈", "留白极简", "杂志感排版", "电商主图风"],
  "moodStyle": ["清新明亮", "温暖治愈", "高级冷淡", "轻奢质感", "梦幻浪漫", "节日热卖", "科技未来"],
  "valueFocus": ["突出卖点", "突出品质", "突出价格优势", "突出礼赠属性", "突出实用性", "突出品牌感"],
  "targetMarket": ["国内电商", "欧美市场", "日韩市场", "东南亚市场", "中东市场", "全球通用"],
  "copyLanguage": ["无需文案", "简体中文", "繁体中文", "英语", "日语", "韩语", "西班牙语", "法语", "德语"]
}
```

## 4. AI 辅助与润色

### 4.0 上传图片后的品类识别提示词

用途：

- 用户上传商品图后，先识别 `productCategory`
- 识别结果用于后续品类规则命中、`productType` 校准和最终 prompt 组装
- 该步骤应先于高级字段 AI 回填执行

推荐提示词：

```text
你是一位电商商品图品类识别助手。请根据用户上传的商品图片，识别商品所属标准品类，并严格输出 JSON。

任务要求：
1. 识别图片中的核心售卖商品，只关注当前真正售卖的主体，不要把背景道具、搭配物、模特服饰、装饰品当成主商品。
2. 从以下标准品类中选择一个最匹配的结果：
服饰类、鞋靴类、箱包类、珠宝饰品类、美妆个护类、食品饮料类、家居百货类、家电数码类、家具大件类、母婴玩具类、宠物用品类、汽配五金类、通用品类。
3. 如果图片信息不足、主体不明确、或存在多个商品且无法判断主售卖对象，返回“通用品类”。
4. 同时输出可辅助后续字段回填的商品类型建议 `productType`；但该值必须尽量贴近系统已有选项。
5. 不要输出解释文字，不要输出 Markdown，只输出 JSON。

输出格式：
{
  "productCategory": "服饰类|鞋靴类|箱包类|珠宝饰品类|美妆个护类|食品饮料类|家居百货类|家电数码类|家具大件类|母婴玩具类|宠物用品类|汽配五金类|通用品类",
  "productType": "智能识别|服装|T恤|背包|鞋子|小家电|电视|沙发|吊灯|化妆品|香水|水果|饮料|汽车|集装箱|蓝牙耳机|手机|行李箱|文具|机械设备|项链|玩具|瑜伽服|健身器材|笔记本电脑|手办",
  "confidence": 0.0,
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "needsUserConfirm": false
}

判定规则：
1. 若识别置信度低于 0.70，`productCategory` 返回“通用品类”，`productType` 返回“智能识别”，并将 `needsUserConfirm` 设为 true。
2. 若商品更像蓝牙耳机、手机、笔记本电脑、电视等电子产品，优先归到“家电数码类”。
3. 若商品更像沙发、吊灯等大件居住空间商品，优先归到“家具大件类”。
4. 若商品更像文具、健身器材、整理收纳、厨房日用等泛家用商品，优先归到“家居百货类”。
5. 若主商品与可选品类不完全匹配，但能判断大类，优先返回最接近的大类；只有完全无法判断时才返回“通用品类”。
```

### 4.1 AI 回填提示词

对应代码：`advancedAiAssistPromptConfigs["goods-scene"]`

```text
你是一位电商场景图策划师。请根据商品图片线索，回填：产品类型、场景类型、产品展示、排版呈现、氛围营造、价值导向、目标市场、文案语种。所有字段必须贴合当前商品，不确定时选择最通用或最弱承诺的选项，不要生成字段外内容。
```

### 4.2 补充说明润色提示词

对应代码：`supplementAiPolishConfigs["goods-scene"]`

```text
优化场景图细节补充，强调场景搭建、氛围、光线、主体展示和代入感。
```

## 5. 平台字段现状

- 当前页面没有 `platformInfo` 输入项
- 但真实生成链路建议保留平台入参
- 若上游没有平台信息，默认用 `全平台通用（16平台）` 或空值兜底
- 场景图默认是附图/转化图位，不替代白底首图

## 6. 平台规则建议

```json
{
  "全平台通用（16平台）": {
    "ruleLevel": "A",
    "sceneSlotAdvice": "默认作为附图/场景辅图使用，不替代白底首图",
    "prompt": "场景图应服务商品转化，但默认定位为平台附图或内容图位；若目标平台或类目存在白底首图要求，首图仍应保持白底合规，当前场景图只负责使用场景、氛围和卖点承接。",
    "required": ["商品主体清晰可辨", "场景与商品用途强相关", "商品结构与SKU真实一致", "场景不能压过商品主体"],
    "forbidden": ["把场景图当作所有平台的通用首图", "虚假功效场景", "与实际售卖商品不一致的配件/赠品", "违规水印/Logo/二维码/联系方式", "夸张营销贴片"]
  }
}
```

### 6.1 平台规则字段在 prompt 拼装中的使用方式

平台规则中的四个字段不是等价拼接，职责如下：

- `sceneSlotAdvice`
  用于表达“图位限制”或“用途限制”，不是普通画面描述。
  典型含义是：当前输出只能作为附图、场景图位、辅图位，不能替代白底首图。
  命中后建议转成单独段落：
  `用途限制：本次输出定位为附图/场景图位，不作为白底首图替代。`

- `prompt`
  用于表达平台语境下的正向约束，是平台规则正文。
  例如：该平台更强调真实使用、不能过度氛围化、应优先保持主体识别。
  这部分应进入主 prompt 正文，通常放在“任务目标/品类规则”之后、“参数段”之前。

- `required`
  用于表达必须满足的硬约束。
  建议在最终 prompt 中转成：
  `必须满足：主体清晰，场景与商品用途强相关，商品结构与SKU真实一致。`
  这部分不应在长度裁剪时删除。

- `forbidden`
  用于表达禁止项，是负向硬约束。
  建议在最终 prompt 中转成：
  `禁止：把场景图当作通用首图，虚假功效场景，违规水印，夸张营销贴片。`
  这部分优先级最高，不应在长度裁剪时删除。

### 6.2 推荐拼装顺序

1. 任务目标
2. 品类规则
3. 平台 `prompt`
4. 由 `sceneSlotAdvice` 转成的用途限制段
5. 高级字段参数段
6. 字段 `valuePrompt` 扩展段
7. `required` 汇总段
8. `forbidden` 汇总段
9. 质量要求
10. 输出规格
11. 补充说明

### 6.3 推荐拼装示例

```text
生成具有真实使用代入感、可用于电商转化图位的商品场景图。

适配 TikTok Shop 官方附图规则：主图必须纯白背景并展示商品正面实体视图；当前场景图只用于 additional images，可展示使用场景、styled scenes、close ups 和 size/scale comparisons。

用途限制：本次输出定位为附图/场景图位，不作为白底首图替代。

产品类型=蓝牙耳机；场景类型=产品场景；产品展示=使用中展示；排版呈现=留白极简；氛围营造=科技未来；价值导向=突出品质；目标市场=欧美市场；文案语种=英语。

必须满足：仅作附图，真实 usage scenarios，商品与实际售卖内容一致，商品主体和关键结构清晰。

禁止：把场景图当主图，图片覆盖文字Logo，展示客户收不到的额外物品。
```

### 6.4 优先级与裁剪规则

- `forbidden` 与 `required` 为硬约束，不能裁剪
- `sceneSlotAdvice` 属于业务限制，不能裁剪
- `prompt` 为平台正文，可在超长时按规则等级裁剪
- 多条平台规则同时命中时：
  - `prompt` 按 `A -> B -> C` 顺序拼接
  - `required` 合并去重后全部保留
  - `forbidden` 合并去重后全部保留
  - `sceneSlotAdvice` 去重后保留最严格表达

## 7. 品类规则建议

```json
{
  "服饰类": {
    "label": "服饰类",
    "aliases": ["服装", "T恤", "瑜伽服", "卫衣", "裙子", "外套", "裤子"],
    "prompt": "场景重点体现上身、穿搭或面料状态，保持版型、垂感、纹理和颜色真实。",
    "focusPoints": ["版型", "垂感", "面料纹理", "真实颜色"]
  },
  "鞋靴类": {
    "label": "鞋靴类",
    "aliases": ["鞋子", "运动鞋", "靴子", "皮鞋", "凉鞋", "拖鞋"],
    "prompt": "场景重点体现穿着、落地、行走或陈列状态，保持鞋型、鞋底结构、成对关系和材质真实。",
    "focusPoints": ["鞋型", "鞋底结构", "成对关系", "材质真实"]
  },
  "箱包类": {
    "label": "箱包类",
    "aliases": ["背包", "书包", "行李箱", "手提包", "斜挎包", "旅行箱"],
    "prompt": "场景重点体现通勤、出行、手提或肩背状态，保持包体立体结构、肩带受力、五金和开合细节可信。",
    "focusPoints": ["包体结构", "肩带受力", "五金细节", "开合逻辑"]
  },
  "珠宝饰品类": {
    "label": "珠宝饰品类",
    "aliases": ["项链", "耳环", "戒指", "手链", "手镯", "吊坠"],
    "prompt": "场景重点体现佩戴氛围与细节高光，保留金属、宝石、珍珠等材质反光和细节。",
    "focusPoints": ["金属反光", "宝石细节", "佩戴氛围", "精致感"]
  },
  "美妆个护类": {
    "label": "美妆个护类",
    "aliases": ["化妆品", "香水", "护肤品", "洗护", "面霜", "精华"],
    "prompt": "场景重点体现梳妆台、洗漱区、护肤步骤或使用语境，包装结构、瓶身反光、膏体/液体状态应真实自然。",
    "focusPoints": ["包装结构", "瓶身反光", "使用语境", "质感真实"]
  },
  "食品饮料类": {
    "label": "食品饮料类",
    "aliases": ["水果", "饮料", "零食", "咖啡", "茶饮", "酒水"],
    "prompt": "场景重点体现可食用、可饮用和食用时刻的真实语境，但不得伪造功效。",
    "focusPoints": ["食用语境", "饮用语境", "真实食材", "不伪造功效"]
  },
  "家居百货类": {
    "label": "家居百货类",
    "aliases": ["文具", "收纳", "日用", "清洁用品", "厨房用品", "生活用品", "健身器材"],
    "prompt": "场景重点体现居家使用关系和收纳/清洁/整理价值，保持空间比例、结构功能和配件完整。",
    "focusPoints": ["使用关系", "空间比例", "结构功能", "配件完整"]
  },
  "家电数码类": {
    "label": "家电数码类",
    "aliases": ["小家电", "电视", "蓝牙耳机", "手机", "笔记本电脑", "数码", "电子产品"],
    "prompt": "场景重点体现真实使用界面、按键、接口、佩戴或摆放状态，避免过度科技特效遮挡产品结构。",
    "focusPoints": ["使用界面", "按键接口", "结构清晰", "科技感克制"]
  },
  "家具大件类": {
    "label": "家具大件类",
    "aliases": ["沙发", "吊灯", "桌子", "椅子", "床", "柜子", "家装"],
    "prompt": "场景重点体现真实空间尺度和家居搭配关系，透视必须正确，家具比例不得失真。",
    "focusPoints": ["空间尺度", "透视正确", "比例真实", "家居搭配"]
  },
  "母婴玩具类": {
    "label": "母婴玩具类",
    "aliases": ["玩具", "手办", "婴童", "母婴用品", "积木", "毛绒玩具"],
    "prompt": "场景重点体现安全、亲和、真实日常的互动或陈列，组件完整，不使用危险姿态。",
    "focusPoints": ["安全性", "亲和感", "组件完整", "日常互动"]
  },
  "宠物用品类": {
    "label": "宠物用品类",
    "aliases": ["宠物", "猫用品", "狗用品", "宠物窝", "宠物食具", "宠物玩具"],
    "prompt": "场景重点体现宠物真实使用、陪伴或居家摆放状态，材质和耐用感可信。",
    "focusPoints": ["宠物使用", "材质耐用", "陪伴感", "居家适配"]
  },
  "汽配五金类": {
    "label": "汽配五金类",
    "aliases": ["汽车", "机械设备", "集装箱", "汽配", "五金", "工具", "配件耗材", "车载支架"],
    "prompt": "场景重点体现安装、维修、使用工况或工具关系，孔位、结构和连接逻辑必须正确。",
    "focusPoints": ["孔位结构", "连接逻辑", "安装关系", "金属真实感"]
  }
}
```

说明：

- `label` 用于标准品类名输出
- `aliases` 用于上传图识别后的品类归一，也用于承接 `productType`、子品类词、近义词
- `prompt` 用于场景图品类约束拼接
- `focusPoints` 用于提示词增强或人工校验

### 7.1 品类归一方式

这里不再单独维护 `productType -> productCategory` 映射表，统一改为：

- 上传图识别出的品类词，先匹配各品类配置中的 `aliases`
- 高级字段里的 `productType`，也直接匹配各品类配置中的 `aliases`
- 命中后直接归一到对应 `label`
- 后续统一读取该品类下的 `prompt` 和 `focusPoints`

也就是说，开发侧只需要维护一条归一链路：

`原始识别词 / productType / 子品类词 -> aliases -> label -> 品类规则`

### 7.2 推荐归一规则

```ts
type CategoryRule = {
  label: string;
  aliases: string[];
  prompt: string;
  focusPoints: string[];
};

function normalizeCategory(keyword: string, categoryRules: CategoryRule[]) {
  const hit = categoryRules.find((rule) =>
    [rule.label, ...rule.aliases].some((alias) => alias === keyword)
  );

  return hit?.label ?? "通用品类";
}
```

### 7.3 使用建议

- `productType=蓝牙耳机` 时，直接通过 `家电数码类.aliases` 命中 `家电数码类`
- `productType=背包` 时，直接通过 `箱包类.aliases` 命中 `箱包类`
- 若上传识别结果是“护肤品”“面霜”“精华”，也直接通过 `美妆个护类.aliases` 命中
- 若未命中任何 `aliases`，统一回退到 `通用品类`

## 8. 最终组装规则

推荐顺序：

1. 任务目标
2. 目标平台标识
3. 品类标识
4. 品类基础约束
5. 品类规则正文 `categoryRulePrompt`
6. 平台规则正文 `prompt`
7. 平台图位限制 `sceneSlotAdvice`
8. 平台硬约束 `required`
9. 平台禁止项 `forbidden`
10. 高级字段参数行
11. 参数行后的 `valuePrompt` 扩展段
12. 通用负向约束
13. 质量要求
14. 输出规格
15. 补充说明

具体说明：

- `任务目标`
  固定说明本次要生成的是“商品场景图”，明确是转化图位，不是泛化海报。

- `目标平台标识`
  必须明确当前规则是针对哪个平台使用。
  若有平台入参，建议写成：
  `目标平台：TikTok Shop。`
  若没有平台入参，建议写成：
  `目标平台：全平台通用（16平台）。`

- `品类标识`
  必须明确当前商品归一后的标准品类。
  建议写成：
  `目标品类：家电数码类。`

- `品类基础约束`
  用于先给出所有品类通用的真实性约束。
  建议写成：
  `品类基础约束：请保持该品类应有的真实结构、材质、颜色与比例，不改变 SKU 核心特征。`

- `品类规则`
  必须单独输出当前命中的品类规则 `prompt`，不能只保留“当前商品品类为...”这句说明。
  建议写成：
  `品类规则：场景重点体现真实使用界面、按键、接口、佩戴或摆放状态，避免过度科技特效遮挡产品结构。`

- `平台规则正文 prompt`
  用于交代该平台下场景图的正向语境和适用边界。

- `sceneSlotAdvice`
  用于说明图位性质，例如“仅作附图，不替代白底首图”。

- `required`
  转成“必须满足：...”句式。

- `forbidden`
  转成“禁止：...”句式。

- `高级字段参数行`
  把用户真实选择的字段值完整输出，作为结构化输入摘要。

- `valuePrompt 扩展段`
  必须紧跟在参数行之后，把每个字段值对应的执行型描述展开。

- `通用负向约束`
  用于补足平台规则未覆盖的通用生成风险。

- `质量要求`
  作为全局质量收束句，强调主体清晰、透视真实、场景不喧宾夺主。

- `输出规格`
  包含 `ratio / resolution / count`。

- `补充说明`
  放在最后，只承接用户个性化补充，不覆盖前面的硬规则。

### 8.1 组装模板

```text
生成具有真实使用代入感、可用于电商转化图位的商品场景图。

目标平台：{platformLabel}。

目标品类：{productCategory}。

品类基础约束：请保持该品类应有的真实结构、材质、颜色与比例，不改变 SKU 核心特征。

品类规则：{categoryRulePrompt}

平台约束拼装方式如下：
1. 先拼平台规则中的 `prompt`
2. 若命中 `sceneSlotAdvice`，单独追加“用途限制”句
3. 再拼平台规则中的 `required`，转成“必须满足”句
4. 再拼平台规则中的 `forbidden`，转成“禁止”句

平台规则正文：{platformRulePrompt}

用途限制：{sceneSlotAdvicePrompt}

必须满足：{platformRequiredPrompt}

禁止：{platformForbiddenPrompt}

产品类型={productType}；场景类型={sceneType}；产品展示={productDisplay}；排版呈现={layoutStyle}；氛围营造={moodStyle}；价值导向={valueFocus}；目标市场={targetMarket}；文案语种={copyLanguage}。

valuePrompt 扩展段拼装顺序如下：
1. `sceneType.valuePrompt`
2. `productDisplay.valuePrompt`
3. `layoutStyle.valuePrompt`
4. `moodStyle.valuePrompt`
5. `valueFocus.valuePrompt`
6. `targetMarket.valuePrompt`
7. `copyLanguage.valuePrompt`

按以上顺序拼接后的 valuePrompt 文本：
[场景类型] {sceneTypeValuePrompt}
[产品展示] {productDisplayValuePrompt}
[排版呈现] {layoutStyleValuePrompt}
[氛围营造] {moodStyleValuePrompt}
[价值导向] {valueFocusValuePrompt}
[目标市场] {targetMarketValuePrompt}
[文案语种] {copyLanguageValuePrompt}

质量要求：场景服务商品，不喧宾夺主；商品主体清晰可辨；透视、光影和材质必须真实；不得生成误导性功效场景或与售卖内容不一致的元素。

输出比例={ratio}；输出分辨率={resolution}；输出数量={count}。

补充要求：{supplement}
```

### 8.2 选项扩展建议

- `sceneType`、`productDisplay`、`layoutStyle`、`moodStyle`、`valueFocus`、`targetMarket`、`copyLanguage` 都建议做 `valuePrompt`
- `productType` 主要走品类映射，不建议只拼字段值
- 不要只传 `field=value`，必须补执行型约束
- `8.1 组装模板` 中的 `valuePrompt 扩展段：{valuePromptLines}`，就是参数行后的实际插入位置

### 8.3 通用负向约束

有必要补充通用负向约束。

原因：

- 平台规则里的 `forbidden` 主要覆盖平台禁区
- 平台没有覆盖到的生成风险，仍然可能出现
- 场景图常见问题如主体结构被改坏、额外配件误生、功效夸大、过重特效导致主体不可辨，需要统一兜底

建议固定补一段通用负向约束：

```text
通用负向约束：禁止改变商品真实结构、颜色和材质；禁止新增实际售卖范围外的主体配件、赠品或功能部件；禁止虚构功效、夸大效果或制造误导性使用场景；禁止使用大面积水印、Logo、二维码、联系方式、边框或覆盖性贴片；禁止因过强滤镜、发光特效、景深或柔焦导致商品主体模糊、失真或难以识别。
```

推荐插入位置：

1. 平台 `forbidden`
2. 通用负向约束
3. 质量要求

### 8.4 实际拼装 Demo

输入示例：

```json
{
  "toolKey": "goods-scene",
  "platformLabel": "TikTok Shop",
  "productCategory": "家电数码类",
  "params": {
    "productType": "蓝牙耳机",
    "sceneType": "产品场景",
    "productDisplay": "使用中展示",
    "layoutStyle": "留白极简",
    "moodStyle": "科技未来",
    "valueFocus": "突出品质",
    "targetMarket": "欧美市场",
    "copyLanguage": "英语",
    "ratio": "1:1",
    "resolution": "1K",
    "count": "1",
    "supplement": "用于附图，不要叠字，不要水印，突出佩戴状态和耳机金属细节。"
  }
}
```

按 `8.1 组装模板` 实际拼装后的示例：

```text
生成具有真实使用代入感、可用于电商转化图位的商品场景图。

目标平台：TikTok Shop。

目标品类：家电数码类。

品类基础约束：请保持该品类应有的真实结构、材质、颜色与比例，不改变 SKU 核心特征。

品类规则：场景重点体现真实使用界面、按键、接口、佩戴或摆放状态，避免过度科技特效遮挡产品结构。

平台规则正文：适配 TikTok Shop 官方附图规则：主图必须纯白背景并展示商品正面实体视图；当前场景图只用于 additional images，可展示使用场景、styled scenes、close ups 和 size/scale comparisons，但所有图片都必须真实准确表达售卖商品，且不能带 Logo、文字、边框、水印或覆盖图形。

用途限制：本次输出定位为附图/场景图位，不作为白底首图替代。

必须满足：仅作附图，真实 usage scenarios，商品与实际售卖内容一致，商品主体和关键结构清晰。

禁止：把场景图当主图，图片覆盖文字Logo，展示客户收不到的额外物品。

产品类型=蓝牙耳机；场景类型=产品场景；产品展示=使用中展示；排版呈现=留白极简；氛围营造=科技未来；价值导向=突出品质；目标市场=欧美市场；文案语种=英语。

[场景类型] 搭建与商品用途强相关的真实使用场景，让商品看起来正在正确地被使用或陈列。
[产品展示] 体现商品正在被真实使用的状态，让功能和场景关系一眼可懂。
[排版呈现] 通过留白制造高级感，减少无关元素，让商品边界和材质更突出。
[氛围营造] 可加入科技感、未来感或空间感，但不应使用过度发光特效遮挡商品真实结构。
[价值导向] 强调材质、工艺、做工、结构细节和精致感，弱化低价促销感。
[目标市场] 表达偏自然、克制、空间感清晰，重视功能、品质和真实使用语境。
[文案语种] 若确需文字，应使用自然英文表达，避免中式直译、过长句和促销口号堆砌。

通用负向约束：禁止改变商品真实结构、颜色和材质；禁止新增实际售卖范围外的主体配件、赠品或功能部件；禁止虚构功效、夸大效果或制造误导性使用场景；禁止使用大面积水印、Logo、二维码、联系方式、边框或覆盖性贴片；禁止因过强滤镜、发光特效、景深或柔焦导致商品主体模糊、失真或难以识别。

质量要求：场景服务商品，不喧宾夺主；商品主体清晰可辨；透视、光影和材质必须真实；不得生成误导性功效场景或与售卖内容不一致的元素。

输出比例=1:1；输出分辨率=1K；输出数量=1。

补充要求：用于附图，不要叠字，不要水印，突出佩戴状态和耳机金属细节。
```

### 8.5 `valuePrompt` 的实际插入位置

`valuePrompt` 不是独立替代参数行，而是必须插在“参数行之后、质量要求之前”。

也就是：

1. 先输出参数行，明确用户本次选择了哪些字段值
2. 再根据这些字段值逐个展开对应的 `valuePrompt`
3. 然后再输出 `required / forbidden / 通用质量要求`

推荐结构如下：

```text
任务目标

品类规则

平台规则

参数行

valuePrompt 扩展段

required

forbidden

质量要求

输出规格

补充说明
```

### 8.6 `valuePrompt` 插入示例

```text
产品类型=蓝牙耳机；场景类型=产品场景；产品展示=使用中展示；排版呈现=留白极简；氛围营造=科技未来；价值导向=突出品质；目标市场=欧美市场；文案语种=英语。

[场景类型] 搭建与商品用途强相关的真实使用场景，让商品看起来正在正确地被使用或陈列。
[产品展示] 体现商品正在被真实使用的状态，让功能和场景关系一眼可懂。
[排版呈现] 通过留白制造高级感，减少无关元素，让商品边界和材质更突出。
[氛围营造] 可加入科技感、未来感或空间感，但不应使用过度发光特效遮挡商品真实结构。
[价值导向] 强调材质、工艺、做工、结构细节和精致感，弱化低价促销感。
[目标市场] 表达偏自然、克制、空间感清晰，重视功能、品质和真实使用语境。
[文案语种] 若确需文字，应使用自然英文表达，避免中式直译、过长句和促销口号堆砌。
```

### 8.7 开发侧伪代码

```ts
const paramLine = `产品类型=${productType}；场景类型=${sceneType}；产品展示=${productDisplay}；排版呈现=${layoutStyle}；氛围营造=${moodStyle}；价值导向=${valueFocus}；目标市场=${targetMarket}；文案语种=${copyLanguage}。`;

const valuePromptLines = [
  sceneTypeValuePrompt,
  productDisplayValuePrompt,
  layoutStyleValuePrompt,
  moodStyleValuePrompt,
  valueFocusValuePrompt,
  targetMarketValuePrompt,
  copyLanguageValuePrompt
].filter(Boolean).join(" ");

const genericNegativePrompt = `通用负向约束：禁止改变商品真实结构、颜色和材质；禁止新增实际售卖范围外的主体配件、赠品或功能部件；禁止虚构功效、夸大效果或制造误导性使用场景；禁止使用大面积水印、Logo、二维码、联系方式、边框或覆盖性贴片；禁止因过强滤镜、发光特效、景深或柔焦导致商品主体模糊、失真或难以识别。`;

finalPrompt = [
  taskPrompt,
  platformLabelPrompt,
  categoryLabelPrompt,
  categoryBasePrompt,
  categoryRulePrompt,
  platformRulePrompt,
  sceneSlotAdvicePrompt,
  platformRequiredPrompt,
  platformForbiddenPrompt,
  paramLine,
  valuePromptLines,
  genericNegativePrompt,
  qualityPrompt,
  outputSpecPrompt,
  supplementPrompt
].filter(Boolean).join("\n\n");
```

## 9. 联调入参示例

```json
{
  "toolKey": "goods-scene",
  "productCategory": "家电数码类",
  "params": {
    "productType": "蓝牙耳机",
    "sceneType": "产品场景",
    "productDisplay": "使用中展示",
    "layoutStyle": "留白极简",
    "moodStyle": "科技未来",
    "valueFocus": "突出品质",
    "targetMarket": "欧美市场",
    "copyLanguage": "英语",
    "ratio": "1:1",
    "resolution": "1K",
    "count": "1",
    "supplement": "用于附图，不要叠字，不要水印，突出佩戴状态和耳机金属细节。"
  }
}
```

## 10. 结论

- `goods-scene` 的真实核心是“场景化转化图”，不是泛化海报
- 页面当前只暴露场景字段，没有平台字段
- 平台规则和品类规则都应该进入最终提示词
- 高级字段必须做 `valuePrompt` 扩展，否则容易只画对词、画错执行
