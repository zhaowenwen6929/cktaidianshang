## 使用流程
1. 上传商品图（`upload-main`）
2. 选择目标语种（`target-language`）
3. 选择创作模式（`creation-mode`）
4. 配置高级设置（`advanced-settings`）
5. 生成

## 端到端使用流程
1. 用户上传商品图。
2. 用户选择目标语种。
3. 系统识别商品品类和平台语境。
4. 用户配置平台信息；若为自定义平台或特殊规则，可填写细节补充。
5. 系统按固定模板生成翻译替换提示词并提交。

## 高级设置字段与可选值
```json
{
  "advancedFields": {
    "targetLanguage": ["简体中文", "英语", "繁体中文", "日语", "韩语", "西班牙语", "俄语", "法语", "泰语", "印尼语", "阿拉伯语"],
    "platformInfo": ["无平台信息", "全平台通用（16平台）", "淘宝", "天猫", "京东", "拼多多", "1688", "抖音电商", "快手电商", "小红书电商", "亚马逊", "Temu", "TikTok Shop", "阿里国际站", "速卖通", "Shopee", "OZON", "SHEIN"],
    "platformRuleDetail": "细节补充"
  }
}
```

说明：

+ 以上是当前图片翻译功能真实存在的业务输入字段。
+ `textDirection` 不属于前端高级设置字段，应作为内部识别/拼装中间字段使用。
+ `languageTone` 当前也不是页面真实字段；若后续要增强不同平台下的译文风格控制，可作为可选增强项接入。

## 2. 平台提示词配置
图片翻译功能不改商品，只改图中文字。平台规则核心是语言风格、标签数量、价格/活动信息展示和可读性。

```json
{
  "platformRulesByTool": {
    "无平台信息": {
      "ruleLevel": "A",
      "prompt": "按跨平台保守规则执行翻译替换：优先保证翻译准确、版式层级稳定和重点信息可读，不额外新增营销噪声。",
      "required": ["保持原图主视觉结构", "保留标题/卖点/价格等信息层级", "译文自然且术语一致", "小图预览仍可读"],
      "forbidden": ["修改商品主体", "新增未提供的价格或促销承诺", "删除原有关键信息块", "生成乱码或不可读文字"]
    },
    "全平台通用（16平台）": {
      "ruleLevel": "A",
      "prompt": "面向多平台复用的翻译图，强调信息准确、结构清晰、视觉秩序稳定，不绑定单一平台强规则。",
      "required": ["跨语种信息语义一致", "排版层级稳定", "重点信息不丢失"],
      "forbidden": ["强行套用单平台专有规范", "为凑版面扩写无依据文案"]
    },
    "淘宝": {
      "ruleLevel": "C",
      "prompt": "适配淘宝高密度浏览场景，翻译后信息应直给、层级清晰、避免文案堆叠。",
      "required": ["首屏可扫读", "核心利益点可见"],
      "forbidden": ["牛皮癣式堆字", "低对比度细小文字"]
    },
    "天猫": {
      "ruleLevel": "C",
      "prompt": "适配天猫品牌化语境，保持整洁、秩序和品牌一致表达。",
      "required": ["品牌语气统一", "结构整洁"],
      "forbidden": ["杂乱拼贴", "低质字效"]
    },
    "京东": {
      "ruleLevel": "C",
      "prompt": "适配京东理性导购语境，参数和功能点翻译优先准确。",
      "required": ["参数术语准确", "信息逻辑清楚"],
      "forbidden": ["参数错译", "夸张口语化误导"]
    },
    "拼多多": {
      "ruleLevel": "C",
      "prompt": "适配拼多多快节奏浏览，翻译后应短句化、重点前置。",
      "required": ["一眼可读", "重点前置"],
      "forbidden": ["长段低效文案", "主次混乱"]
    },
    "1688": {
      "ruleLevel": "C",
      "prompt": "适配1688商采语境，规格、材质、起订量等信息翻译要稳。",
      "required": ["商采术语清晰", "规格表达完整"],
      "forbidden": ["零售化夸张措辞", "规格缺失"]
    },
    "抖音电商": {
      "ruleLevel": "C",
      "prompt": "适配抖音电商内容流语境，视觉停留感可保留但阅读效率优先。",
      "required": ["关键卖点清晰", "阅读节奏快"],
      "forbidden": ["花字过度", "重点被装饰掩盖"]
    },
    "快手电商": {
      "ruleLevel": "C",
      "prompt": "适配快手电商真实直给语境，翻译文案应简洁可信。",
      "required": ["表达直观", "信息可信"],
      "forbidden": ["过度包装", "不实承诺"]
    },
    "小红书电商": {
      "ruleLevel": "B",
      "prompt": "适配小红书种草语境，翻译后兼顾审美与清晰度，避免硬广感。",
      "required": ["审美一致", "标题可读"],
      "forbidden": ["强叫卖字效", "过密排版"]
    },
    "亚马逊": {
      "ruleLevel": "A",
      "prompt": "适配亚马逊附图/信息图语境，翻译需中性客观、术语准确，不夸大。",
      "required": ["术语一致", "信息客观"],
      "forbidden": ["绝对化承诺", "违规导流"]
    },
    "Temu": {
      "ruleLevel": "B",
      "prompt": "适配Temu高节奏浏览，翻译后短句化并保证核心信息对比清晰。",
      "required": ["短句高效", "价格与利益点可读"],
      "forbidden": ["句子冗长", "低对比文字"]
    },
    "TikTok Shop": {
      "ruleLevel": "A",
      "prompt": "适配TikTok Shop内容电商语境，翻译文本应便于快速扫读并符合合规表达。",
      "required": ["快速扫读", "避免误导承诺"],
      "forbidden": ["夸大性口号", "遮挡商品主体"]
    },
    "阿里国际站": {
      "ruleLevel": "A",
      "prompt": "适配阿里国际站B2B语境，翻译优先规格、材料、工艺和交付信息准确。",
      "required": ["B2B术语准确", "信息结构理性"],
      "forbidden": ["消费化夸张营销语"]
    },
    "速卖通": {
      "ruleLevel": "B",
      "prompt": "适配速卖通跨境零售语境，翻译应简洁并利于多语阅读。",
      "required": ["表达简洁", "多语可读"],
      "forbidden": ["机器直译生硬", "冗长句"]
    },
    "Shopee": {
      "ruleLevel": "B",
      "prompt": "适配Shopee东南亚语境，翻译应清楚直观，重点信息靠前。",
      "required": ["重点前置", "层级清晰"],
      "forbidden": ["密集小字", "层级混乱"]
    },
    "OZON": {
      "ruleLevel": "B",
      "prompt": "适配OZON语境，翻译应保持商品信息真实完整，版式干净。",
      "required": ["信息完整", "排版干净"],
      "forbidden": ["无依据扩写", "杂乱装饰"]
    },
    "SHEIN": {
      "ruleLevel": "B",
      "prompt": "适配SHEIN时尚零售语境，翻译保持风格感同时确保尺码/面料等信息可读。",
      "required": ["时尚语气一致", "尺码信息清楚"],
      "forbidden": ["压坏版型展示的文字布局"]
    }
  }
}
```

## 2.1 `ruleLevel` 多规则使用逻辑（同一平台存在多条规则时）
适用场景：一个平台可能同时命中“平台基础规则 + 图位规则 + 品类规则 + 风控规则”。

### 2.1.1 规则定位
+ `ruleLevel=A`：高优先级硬约束，不可被低级规则覆盖。
+ `ruleLevel=B`：常规约束，可被 A 覆盖。
+ `ruleLevel=C`：补充约束，可被 A/B 覆盖，且可在 token 紧张时优先裁剪。

### 2.1.2 组装顺序（强制）
1. 合并所有命中规则的 `required`（去重后全部保留）。
2. 合并所有命中规则的 `forbidden`（去重后全部保留）。
3. `prompt` 按优先级拼接：`A -> B -> C`。
4. 若提示词长度超限，仅从低优先级描述裁剪：先裁 `C.prompt`，再裁 `B.prompt`；`A.prompt`、`required`、`forbidden` 不裁。

### 2.1.3 冲突处理（强制）
+ 若高低级规则存在冲突，按优先级覆盖：`A > B > C`。
+ 对图片翻译功能，若平台风格偏好与术语准确性冲突，优先保留术语准确和版式稳定。

## 3. 品类提示词配置
品类用于约束术语和重点信息，例如数码看参数，食品看配料和口味，美妆看成分和使用方式。

```json
{
  "categoryRulesByTool": {
    "服饰类": {
      "label": "服饰类",
      "aliases": ["服装", "T恤", "瑜伽服", "外套", "裤子", "裙子"],
      "prompt": "翻译时优先保证版型卖点、面料词和尺码信息准确，避免词义偏差影响购买判断。",
      "focusPoints": ["版型卖点", "面料词", "尺码信息", "购买判断"]
    },
    "鞋靴类": {
      "label": "鞋靴类",
      "aliases": ["鞋子", "运动鞋", "靴子", "凉鞋", "拖鞋"],
      "prompt": "翻译时优先保证鞋型、材质、功能点与尺码表达清晰，避免参数错译。",
      "focusPoints": ["鞋型", "材质", "功能点", "尺码表达"]
    },
    "箱包类": {
      "label": "箱包类",
      "aliases": ["背包", "行李箱", "手提包", "斜挎包"],
      "prompt": "翻译时优先保证容量、尺寸、分层收纳等信息准确，保持通勤/出行语义自然。",
      "focusPoints": ["容量", "尺寸", "分层收纳", "通勤出行语义"]
    },
    "珠宝饰品类": {
      "label": "珠宝饰品类",
      "aliases": ["项链", "耳环", "戒指", "手链"],
      "prompt": "翻译时优先保持材质与工艺词准确，文案克制，避免夸张承诺。",
      "focusPoints": ["材质词", "工艺词", "文案克制", "避免夸张承诺"]
    },
    "美妆个护类": {
      "label": "美妆个护类",
      "aliases": ["化妆品", "香水", "护肤", "洗护"],
      "prompt": "翻译时优先保证成分、肤感、使用方式词汇准确，避免疗效化表述。",
      "focusPoints": ["成分", "肤感", "使用方式", "避免疗效化"]
    },
    "食品饮料类": {
      "label": "食品饮料类",
      "aliases": ["水果", "饮料", "零食", "咖啡", "茶"],
      "prompt": "翻译时优先保证口味、配料、净含量和食用场景词准确，不夸大功效。",
      "focusPoints": ["口味", "配料", "净含量", "食用场景"]
    },
    "家居百货类": {
      "label": "家居百货类",
      "aliases": ["文具", "收纳", "日用", "厨房用品", "健身器材"],
      "prompt": "翻译时优先保证用途、材质、尺寸和适用场景表达清楚。",
      "focusPoints": ["用途", "材质", "尺寸", "适用场景"]
    },
    "家电数码类": {
      "label": "家电数码类",
      "aliases": ["小家电", "电视", "蓝牙耳机", "手机", "笔记本电脑"],
      "prompt": "翻译时优先保证参数、接口、功率、兼容性等术语准确一致。",
      "focusPoints": ["参数", "接口", "功率", "兼容性"]
    },
    "家具大件类": {
      "label": "家具大件类",
      "aliases": ["沙发", "吊灯", "家具"],
      "prompt": "翻译时优先保证尺寸、材质、安装和空间适配词准确，避免尺度误导。",
      "focusPoints": ["尺寸", "材质", "安装", "空间适配"]
    },
    "母婴玩具类": {
      "label": "母婴玩具类",
      "aliases": ["玩具", "手办", "母婴"],
      "prompt": "翻译时优先保证安全相关描述和适龄信息准确，不使用风险表达。",
      "focusPoints": ["安全描述", "适龄信息", "准确表达", "避免风险表达"]
    },
    "宠物用品类": {
      "label": "宠物用品类",
      "aliases": ["宠物", "猫", "狗"],
      "prompt": "翻译时优先保证适配对象、材质和清洁维护信息清晰。",
      "focusPoints": ["适配对象", "材质", "清洁维护", "信息清晰"]
    },
    "汽配五金类": {
      "label": "汽配五金类",
      "aliases": ["汽车", "机械设备", "集装箱", "五金"],
      "prompt": "翻译时优先保证型号、孔位、规格、安装逻辑和工况词准确。",
      "focusPoints": ["型号", "孔位", "规格", "安装逻辑和工况"]
    },
    "通用品类": {
      "label": "通用品类",
      "aliases": ["智能识别"],
      "prompt": "按通用商品翻译策略执行：准确、简洁、层级清晰、不做无依据扩写。",
      "focusPoints": ["准确", "简洁", "层级清晰", "不无依据扩写"]
    }
  }
}
```

## 4. 高级选项值扩展提示词配置
+ `targetLanguage`（目标语种）决定语言风格、句长、术语口径、阅读习惯
+ `platformInfo`（平台信息）决定平台语境补充，不替代平台硬规则
+ `textDirection`（文字方向）建议作为内部识别字段参与拼装，用于控制 RTL/LTR 排版方向
+ `languageTone`（语言风格）建议作为后续增强项，在需要时由系统推导或额外开放

建议配置结构：

```json
{
  "goodsTranslateOptionValueExpansions": {
    "targetLanguage": {
      "fieldKey": "targetLanguage",
      "values": {
        "简体中文": { "valuePrompt": "输出自然简体中文电商表达，短句清晰，避免机翻腔。" },
        "英语": { "valuePrompt": "输出自然英文电商表达，短句优先，避免中式直译和冗长从句。" },
        "繁体中文": { "valuePrompt": "输出自然繁体中文表达，词汇符合繁中阅读习惯。" },
        "日语": { "valuePrompt": "输出自然日语表达，礼貌且简洁，避免生硬直译。" },
        "韩语": { "valuePrompt": "输出自然韩语表达，语气统一，适配电商浏览节奏。" },
        "西班牙语": { "valuePrompt": "输出自然西语电商表达，重点前置，减少冗长修饰。" },
        "俄语": { "valuePrompt": "输出自然俄语表达，术语准确，保证参数与单位一致。" },
        "法语": { "valuePrompt": "输出自然法语表达，语义准确并保持版面可读。" },
        "泰语": { "valuePrompt": "输出自然泰语表达，词义准确，避免缩写歧义。" },
        "印尼语": { "valuePrompt": "输出自然印尼语表达，句式简洁，适配快读场景。" },
        "阿拉伯语": { "valuePrompt": "输出自然阿拉伯语表达，注意RTL阅读习惯与排版层级。" }
      }
    },
    "platformInfo": {
      "fieldKey": "platformInfo",
      "fieldRole": "business-input",
      "values": {
        "无平台信息": { "valuePrompt": "按跨平台保守翻译方式处理，不额外追加平台专属营销语气。" },
        "全平台通用（16平台）": { "valuePrompt": "采用跨平台保守表达，不绑定单平台术语和夸张营销口吻。" },
        "淘宝": { "valuePrompt": "信息直给、层级清楚，避免堆字和过长句，适配高密度浏览。" },
        "天猫": { "valuePrompt": "语气整洁克制，兼顾品牌感与信息秩序，避免低质促销感。" },
        "京东": { "valuePrompt": "优先参数和功能术语准确，语义理性清楚，避免口语化误导。" },
        "拼多多": { "valuePrompt": "采用短句和重点前置表达，确保核心利益点一眼可读。" },
        "1688": { "valuePrompt": "强化规格、材质、起订量等商采信息表达，语义直接稳妥。" },
        "抖音电商": { "valuePrompt": "保证阅读节奏快、重点集中，避免视觉花字干扰正文识别。" },
        "快手电商": { "valuePrompt": "文案保持真实直给，少修饰，优先让重点信息快速看懂。" },
        "小红书电商": { "valuePrompt": "兼顾审美与清晰度，避免硬广腔，标题和卖点保持自然种草感。" },
        "亚马逊": { "valuePrompt": "强调客观中性描述，避免绝对化、保证性承诺。" },
        "Temu": { "valuePrompt": "采用短句高效表达，重点信息对比清晰，避免冗长句。" },
        "TikTok Shop": { "valuePrompt": "保持短句和高扫读效率，避免信息堆叠。" },
        "阿里国际站": { "valuePrompt": "强化B2B规格与交付信息表达，减少情绪化修饰。" },
        "速卖通": { "valuePrompt": "表达简洁、便于跨语理解，避免生硬机翻和复杂句结构。" },
        "Shopee": { "valuePrompt": "重点前置、层级清楚，适配东南亚快读浏览习惯。" },
        "OZON": { "valuePrompt": "保持信息完整和版式干净，不做无依据扩写或杂乱装饰。" },
        "SHEIN": { "valuePrompt": "兼顾时尚语气与尺码面料等关键信息可读性，避免压坏版型展示。" }
      }
    },
    "languageTone": {
      "fieldKey": "languageTone",
      "fieldRole": "internal-inferred",
      "source": "infer from platformInfo + productCategory + targetLanguage + page expression style",
      "usage": "append to inferredFieldPrompts only when useLanguageToneInPrompt=true",
      "values": {
        "简洁促转化": { "valuePrompt": "采用简洁促转化表达，短句优先，重点前置，适配快读和转化场景。" },
        "品牌克制": { "valuePrompt": "采用品牌克制表达，语气整洁有序，避免强刺激促销词和低质叫卖感。" },
        "理性参数化": { "valuePrompt": "采用理性参数化表达，优先参数、规格、结构信息，减少情绪化修饰。" }
      }
    },
    "textDirection": {
      "fieldKey": "textDirection",
      "fieldRole": "internal-inferred",
      "source": "infer from multimodal layout understanding + script direction + page text arrangement",
      "usage": "append to inferredFieldPrompts only when useTextDirectionInPrompt=true",
      "values": {
        "LTR": { "valuePrompt": "按从左到右阅读顺序组织文本块，保持原层级和对齐关系稳定。" },
        "RTL": { "valuePrompt": "按从右到左阅读顺序组织文本块，修正标点、断词和对齐方向，避免阅读断裂。" }
      }
    }
  }
}
```

开发要求：

+ 最终拼装优先使用 `docs/图片翻译/AI商品图-图片翻译-option_value_expansions.json` 中的 `valuePrompt`，不要只把字段值原样拼进 prompt。
+ `targetLanguage`（目标语种）的扩展语义必须落在“语气、句长、术语口径、阅读习惯”上。
+ `platformInfo`（平台信息）的扩展语义必须落在“平台语境补充”上，不能替代平台硬规则。
+ `languageTone`（语言风格）虽然不是页面显式字段，但只要内部推断启用，就应命中对应 `valuePrompt` 进入 `inferredFieldPrompts`。
+ `textDirection`（文字方向）的扩展语义必须落在“阅读方向、对齐方式、标点/断词处理”上，不能单独替代目标语种判断。
+ 若某字段存在值但没有命中 `valuePrompt`，可保留在参数行中，但不应凭空生成新的扩展文案。

## 4.1 内部效果增强字段（非当前业务显式输入）
这部分不是当前页面真实字段，但从最终翻译效果角度建议在服务端/识别链路中保留。

### 4.1.1 `textDirection`（文字方向，建议保留）
+ 字段定位：内部识别与拼装中间字段，不给业务侧直接选择。
+ 字段来源：多模态大模型基于图片中的文字形态、文字排布方向、按钮/价格区相对位置、目标语种线索综合判断。
+ 可选值：`LTR`、`RTL`。
+ 作用：控制文本块顺序、对齐方向、标点位置和 RTL 语言下的版式稳定性。
+ 默认策略：无明显 RTL 线索时默认 `LTR`。

### 4.1.2 `languageTone`（语言风格，后续增强项）
+ 字段定位：质量增强字段，不是当前必需字段。
+ 适用场景：需要区分“促转化短句”“品牌克制”“理性参数化”等译文风格时再接入。
+ 当前建议：先由 `targetLanguage + platformInfo + productCategory` 隐式推导，不必作为页面显式字段。

## 4.2 内部推断规则（建议直接开发实现）
这部分用于说明 `textDirection / languageTone` 不是业务手填，而是系统根据已有字段推断得到。

### 4.2.1 `textDirection`（文字方向）推断规则
+ 推断目标：决定翻译替换时文本块应按 `LTR` 还是 `RTL` 组织。
+ 参与信息：多模态大模型对原图文字内容、文字排列方向、标题/价格/按钮位置关系、目标语种与字符形态的综合识别结果。
+ 默认值：`LTR`。

推断优先级：

1. 若大模型识别到明显 RTL 文本特征，直接判定 `RTL`。
2. 若 `targetLanguage` 为阿拉伯语，且没有证据表明本次只替换局部英文标签，优先判定 `RTL`。
3. 若原图存在明显从右到左的标题、价格、按钮、参数块布局，判定 `RTL`。
4. 其余情况统一判定 `LTR`。

推荐实现规则：

+ `useTextDirectionInPrompt=false` 的条件：
  - 推断结果为 `LTR`
  - 且当前版式没有混排风险、按钮/价格区不需要方向修正
+ `useTextDirectionInPrompt=true` 的条件：
  - 推断结果为 `RTL`
  - 或存在明显 `rtlLayout / mixedLanguage / denseText` 风险，需要明确约束文本块顺序

### 4.2.2 `languageTone`（语言风格）推断规则
+ 推断目标：决定译文更偏“简洁促转化 / 品牌克制 / 理性参数化”哪种风格。
+ 参与信息：`platformInfo + productCategory + targetLanguage`。
+ 默认值：`品牌克制`。

推断优先级：

1. 先按 `platformInfo` 给出平台基线倾向。
2. 再按 `productCategory` 做品类修正。
3. 最后按 `targetLanguage` 做语言习惯修正。
4. 若三者冲突，优先级为：`platformInfo > productCategory > targetLanguage`。

平台基线建议：

+ `TikTok Shop / 拼多多 / Temu / Shopee / 抖音电商 / 快手电商` -> `简洁促转化`
+ `天猫 / 小红书电商 / SHEIN / 淘宝 / OZON / 全平台通用（16平台） / 无平台信息` -> `品牌克制`
+ `京东 / 1688 / 阿里国际站 / 亚马逊 / 速卖通` -> `理性参数化`

品类修正规则：

+ `家电数码类 / 汽配五金类 / 家具大件类`：若平台基线不是 `理性参数化`，可上调为 `理性参数化`
+ `珠宝饰品类 / 美妆个护类 / 服饰类 / 鞋靴类`：若平台基线不是强理性 B2B 语境，可修正为 `品牌克制`
+ `食品饮料类 / 家居百货类 / 母婴玩具类 / 宠物用品类 / 箱包类`：通常保持平台基线不变

语种修正规则：

+ `日语 / 法语 / 繁体中文`：若平台基线为 `简洁促转化`，可向 `品牌克制` 轻微修正
+ `英语 / 西班牙语 / 印尼语 / 泰语`：保持平台基线不变
+ `阿拉伯语`：优先确保可读性和版式稳定，不建议额外强化强促销语气；若平台基线为 `简洁促转化`，可回退为 `品牌克制`

最终使用建议：

+ 当前阶段不要求前端暴露 `languageTone`。
+ 若服务端实现了该推断结果，可在最终 prompt 的字段扩展段中按需拼入。
+ 若未实现推断，不影响主流程，可直接省略 `languageTonePromptBlock`。

## 拼装规则
### 拼装顺序
1. `taskGoal`（任务目标）
2. `categoryRule`（品类规则）
3. `platformRule`（平台规则）
4. `parameterLine`（参数行）
5. `optionValuePrompts`（高级选项扩展约束）
6. `inferredFieldPrompts`（内部推断字段扩展约束，可选）
7. `requiredRule`（必须满足）
8. `forbiddenRule`（禁止事项）
9. `universalNegative`（通用负向约束）
10. `universalQuality`（通用质量要求）
11. `platformRuleDetail`（平台细节补充，可选）
12. `supplement`（用户补充说明，可选，当前页面默认无）

组装要求：

+ `requiredRule / forbiddenRule / universalNegative / universalQuality` 属于不可裁剪段。
+ token 超限时，优先裁剪 `supplement -> platformRuleDetail -> inferredFieldPrompts -> optionValuePrompts -> platformRule`，不要先裁硬约束。
+ `parameterLine` 固定保留，至少要包含 `targetLanguage / platformInfo`。
+ `targetLanguage / platformInfo` 命中的 `valuePrompt` 必须进入 `optionValuePrompts`，不能只保留参数值字符串。
+ `textDirection / languageTone` 都不是业务参数行字段，应作为内部推断结果进入 `inferredFieldPrompts`。
+ 当前页面默认无 `supplement`，后续若接入，排在 `platformRuleDetail` 之后且优先级最低。

### 通用负向约束
```json
通用负向约束：
1. 严禁改动商品主体外观、结构、颜色和SKU含义，翻译任务仅处理文案层。
2. 严禁新增原图不存在的价格、促销、赠品、认证或功效承诺信息。
3. 严禁出现乱码、错别字、术语错译、单位错译、尺寸数值错配。
4. 严禁破坏原版式主次关系，不得遮挡主体、丢失关键信息块或造成阅读断层。
5. 严禁生成违规导流信息、联系方式、二维码、侵权Logo或平台禁用标识。
```

### 通用质量说明
```json
通用质量要求：
1. 翻译准确：语义与原文一致，术语统一，关键信息不漏译不误译。
2. 版式稳定：尽量保持原图字号层级、对齐关系、留白节奏和视觉重心。
3. 可读性优先：标题、价格、卖点、按钮等关键文本都清晰可读。
4. 商业可用：语言自然、符合目标语种电商表达习惯，不生硬机器翻译。
5. 一致性：同图多处重复词保持统一译法，单位、货币、规格表达一致。
```

### 拼装模板
```json
任务目标：对图片内文案进行翻译替换，保持原图版式层级与阅读路径稳定。
当前商品品类为「{productCategory}」，{categoryPrompt}
平台规则：{platformPrompt}
翻译参数：目标语种={targetLanguage}；平台信息={platformInfo}。
高级选项扩展约束：
[目标语种] {targetLanguageValuePrompt}
[平台信息] {platformInfoValuePrompt}
内部推断扩展约束：
{languageTonePromptBlock}
{textDirectionPromptBlock}
必须满足：{platformRequiredJoined}
禁止：{platformForbiddenJoined}
{universalNegativePrompt}
{universalQualityPrompt}
平台细节补充：{platformRuleDetail}
用户补充说明：{supplement}
```

补充说明：

+ `targetLanguageValuePrompt / platformInfoValuePrompt` 属于高级选项扩展提示词，是当前模板必须消费的配置项。
+ 推荐写法：
  - `[目标语种] 输出自然英文电商表达，短句优先，避免中式直译和冗长从句。`
  - `[平台信息] 保持短句和高扫读效率，避免信息堆叠。`
+ `languageTonePromptBlock` 仅在服务端完成 `languageTone` 推断时拼接。
+ 推荐写法：`[语言风格] 采用理性参数化表达，优先参数、规格和结构信息，减少情绪化修饰。`
+ `textDirectionPromptBlock` 仅在识别链路返回 `RTL` 或明确需要控制阅读方向时拼接。
+ 推荐写法：`[文字方向] 按从右到左阅读顺序组织文本块，修正对齐、断词和标点方向。`
+ `languageTone / textDirection` 都不建议放入业务参数行。

### 7. 拼装 Demo（输入 + 输出）
### 7.1 Demo 输入
```json
{
  "toolKey": "goods-translate",
  "productCategory": "家电数码类",
  "targetLanguage": "英语",
  "platformInfo": "TikTok Shop",
  "internalHints": {
    "languageTone": "简洁促转化",
    "textDirection": "LTR",
    "useLanguageToneInPrompt": true,
    "useTextDirectionInPrompt": false
  },
  "platformRuleDetail": "标题控制在8词以内；价格信息保持与原图一致；活动标签最多1个。",
  "supplement": "接口规格术语使用消费电子常用英文写法。"
}
```

### 7.2 Demo 输出
```json
任务目标：对图片内文案进行翻译替换，保持原图版式层级与阅读路径稳定。

当前商品品类为「家电数码类」，翻译时优先保证参数、接口、功率、兼容性等术语准确一致。

平台规则：适配TikTok Shop内容电商语境，翻译文本应便于快速扫读并符合合规表达。

翻译参数：目标语种=英语；平台信息=TikTok Shop。

高级选项扩展约束：
[目标语种] 输出自然英文电商表达，短句优先，避免中式直译和冗长从句。
[平台信息] 保持短句和高扫读效率，避免信息堆叠。

内部推断扩展约束：
[语言风格] 采用简洁促转化表达，短句优先，重点前置，适配内容电商快读场景。

必须满足：快速扫读、避免误导承诺。

禁止：夸大性口号、遮挡商品主体。

通用负向约束：
1. 严禁改动商品主体外观、结构、颜色和SKU含义，翻译任务仅处理文案层。
2. 严禁新增原图不存在的价格、促销、赠品、认证或功效承诺信息。
3. 严禁出现乱码、错别字、术语错译、单位错译、尺寸数值错配。
4. 严禁破坏原版式主次关系，不得遮挡主体、丢失关键信息块或造成阅读断层。
5. 严禁生成违规导流信息、联系方式、二维码、侵权Logo或平台禁用标识。

通用质量要求：
1. 翻译准确：语义与原文一致，术语统一，关键信息不漏译不误译。
2. 版式稳定：尽量保持原图字号层级、对齐关系、留白节奏和视觉重心。
3. 可读性优先：标题、价格、卖点、按钮等关键文本都清晰可读。
4. 商业可用：语言自然、符合目标语种电商表达习惯，不生硬机器翻译。
5. 一致性：同图多处重复词保持统一译法，单位、货币、规格表达一致。

平台细节补充：标题控制在8词以内；价格信息保持与原图一致；活动标签最多1个。

用户补充说明：接口规格术语使用消费电子常用英文写法。
```

## 三个关键能力的提示词配置
### 图片识别获取信息
用途：

+ 由多模态大模型统一识别图片翻译生成所需的商品品类、平台语境、文字方向和语言风格；
+ 输出结构化 JSON，供字段回填和后续提示词组装使用；
+ 让 `textDirection / languageTone` 也走同一条大模型识别链路，而不是依赖单独 OCR 模块。

提示词：

```json
你是一位电商图片翻译理解专家。请根据输入商品图，提取“图片翻译生成”所需信息，并严格输出 JSON。

任务要求：
1) 识别商品所属品类（用于 productCategory）。
2) 基于图像线索，预测平台语境推荐值：platformInfo。
3) 识别文本阅读方向：textDirection（LTR 或 RTL），作为内部排版控制字段。
4) 推断语言风格：languageTone（简洁促转化 / 品牌克制 / 理性参数化），作为内部风格控制字段。
5) 识别参数区、价格区、卖点区、按钮区等文本块类型，供后续翻译替换使用。
6) 不默认猜测 targetLanguage，目标语种应由用户显式指定。
7) 不输出解释文字，不输出 Markdown，仅输出 JSON。

识别原则：
1) 必须直接基于图片中的文字内容、字形、版式结构、按钮与价格区位置、营销氛围、参数密度进行综合判断。
2) 不要把 textDirection 仅当作“看 targetLanguage 猜方向”；若图片本身已有明显排版线索，优先依据图片判断。
3) 不要把 languageTone 仅当作“看单个卖点词猜风格”；必须综合平台气质、品类表达方式、信息密度和文案组织方式判断。
4) 若图中存在多语混排，以主标题区、价格区、核心卖点区的整体阅读方向和语气为准。
5) 若判断依据不足，允许输出最保守值并通过 use*InPrompt=false 降低该字段在最终 prompt 中的权重。

字段判定细则：
1) `textDirection` 判定顺序必须是：
   a. 先看图片中主标题区、价格区、按钮区、核心卖点区的整体阅读方向；
   b. 再看是否存在阿拉伯语、希伯来语等明显 RTL 字形特征；
   c. 最后才参考目标语种常见阅读方向。
2) 当图片大部分关键信息块为从右到左组织时，输出 `textDirection="RTL"`；否则输出 `LTR`。
3) 当 `textDirection="RTL"`，或图中存在明显 RTL 风险、混排风险、重排风险时，输出 `useTextDirectionInPrompt=true`；否则输出 `false`。
4) `languageTone` 判定顺序必须是：
   a. 先看平台气质与页面整体表达方式；
   b. 再看商品品类更偏参数导向、品牌导向还是促转化导向；
   c. 最后再用目标语种习惯做轻微修正。
5) 平台基线映射建议直接吸收为识别规则：
   a. `TikTok Shop / 拼多多 / Temu / Shopee / 抖音电商 / 快手电商` 默认优先考虑 `简洁促转化`；
   b. `天猫 / 小红书电商 / SHEIN / 淘宝 / OZON / 全平台通用（16平台） / 无平台信息` 默认优先考虑 `品牌克制`；
   c. `京东 / 1688 / 阿里国际站 / 亚马逊 / 速卖通` 默认优先考虑 `理性参数化`。
6) 品类修正建议直接吸收为识别规则：
   a. `家电数码类 / 汽配五金类 / 家具大件类` 可把结果向 `理性参数化` 修正；
   b. `珠宝饰品类 / 美妆个护类 / 服饰类 / 鞋靴类` 可把结果向 `品牌克制` 修正；
   c. `食品饮料类 / 家居百货类 / 母婴玩具类 / 宠物用品类 / 箱包类` 通常保持平台基线不变。
7) 语种修正规则：
   a. `日语 / 法语 / 繁体中文` 若平台基线为强促转化，可适度向 `品牌克制` 修正；
   b. `英语 / 西班牙语 / 印尼语 / 泰语` 通常保持平台基线不变；
   c. `阿拉伯语` 优先确保可读性和版式稳定，若平台基线过强促销，可回退为 `品牌克制`。
8) 当页面明显偏内容电商快读、短句强卖点、利益点前置时，优先输出 `简洁促转化`。
9) 当页面明显偏品牌感、审美感、标题克制、信息留白时，优先输出 `品牌克制`。
10) 当页面参数区占比高、规格接口信息密集、商品偏数码/五金/B2B 理性说明时，优先输出 `理性参数化`。
11) 当判断依据不足时，`languageTone` 输出最保守值 `品牌克制`，并将 `useLanguageToneInPrompt=false`。

输出要求：
1) `platformInfo` 必须从 `options.platformInfo` 中选择；无法判断时输出 `无平台信息` 或空字符串，并加入 `needsUserConfirm`。
2) `textDirection` 只能输出 `LTR` 或 `RTL`。
3) `languageTone` 只能输出 `简洁促转化`、`品牌克制`、`理性参数化` 三者之一。
4) `layoutHints.textBlocks` 必须只返回图中主要文本块类型，不要虚构不存在的模块。
5) 仅输出 JSON，不要输出任何解释、前后缀、代码围栏或备注。

输出 JSON Schema：
{
  "category": {
    "categoryId": "string",
    "categoryLabel": "服饰类|鞋靴类|箱包类|珠宝饰品类|美妆个护类|食品饮料类|家居百货类|家电数码类|家具大件类|母婴玩具类|宠物用品类|汽配五金类|通用品类",
    "confidence": "number(0-1)",
    "keywords": ["string"]
  },
  "recommendedFields": {
    "platformInfo": "string"
  },
  "internalHints": {
    "textDirection": "LTR|RTL",
    "useTextDirectionInPrompt": "boolean",
    "languageTone": "简洁促转化|品牌克制|理性参数化",
    "useLanguageToneInPrompt": "boolean"
  },
  "layoutHints": {
    "textBlocks": ["title", "sellingPoint", "price", "spec", "button"],
    "densityLevel": "low|medium|high",
    "translationRisk": ["denseText", "mixedLanguage", "smallFont", "rtlLayout", "specHeavy"]
  },
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}
```

判定规则：

+ 若图片存在明显阿拉伯语、希伯来语等右向排版线索，`internalHints.textDirection` 推荐为 `RTL`；其余默认推荐 `LTR`。
+ 仅当存在明显 RTL 线索或后续排版引擎需要时，`useTextDirectionInPrompt=true`。
+ `languageTone` 需按 `platformInfo + productCategory + targetLanguage` 联合推断，不得仅凭单个卖点词做强推断。
+ 当平台语境明显偏内容电商快读时，优先考虑 `简洁促转化`；当参数区占比高、品类偏数码/五金时，优先考虑 `理性参数化`。
+ 若平台语境无法确认，`platformInfo` 回填 `无平台信息` 或留空，并加入 `needsUserConfirm`。

建议输入参数：

```json
{
  "toolKey": "goods-translate",
  "imageUrl": "string",
  "title": "string(optional)",
  "options": {
    "platformInfo": ["无平台信息", "全平台通用（16平台）", "淘宝", "天猫", "京东", "拼多多", "1688", "抖音电商", "快手电商", "小红书电商", "亚马逊", "Temu", "TikTok Shop", "阿里国际站", "速卖通", "Shopee", "OZON", "SHEIN"]
  }
}
```

### 8.1.1 开发调用示例（system prompt / user payload / expected output）
`system prompt`

```text
你是一位电商图片翻译理解专家。请直接基于输入图片的文字内容、版式结构、平台气质和商品信息线索，提取 goods-translate 所需字段。你需要同时识别平台信息、文字方向和语言风格。平台信息必须从 options 中选择；文字方向只能输出 LTR/RTL；语言风格只能输出 简洁促转化/品牌克制/理性参数化。请优先根据图片真实排版判断 textDirection，优先根据页面整体表达方式判断 languageTone；若依据不足，使用最保守值并把对应 use*InPrompt 设为 false。只输出 JSON。
```

`user payload`

```json
{
  "toolKey": "goods-translate",
  "imageUrl": "https://example.com/demo.jpg",
  "title": "蓝牙耳机详情页英文翻译",
  "options": {
    "platformInfo": ["无平台信息", "全平台通用（16平台）", "TikTok Shop", "亚马逊"]
  }
}
```

`expected output`

```json
{
  "category": {
    "categoryId": "electronics-audio",
    "categoryLabel": "家电数码类",
    "confidence": 0.92,
    "keywords": ["蓝牙耳机", "降噪", "续航"]
  },
  "recommendedFields": {
    "platformInfo": "TikTok Shop"
  },
  "internalHints": {
    "textDirection": "LTR",
    "useTextDirectionInPrompt": false,
    "languageTone": "简洁促转化",
    "useLanguageToneInPrompt": true
  },
  "layoutHints": {
    "textBlocks": ["title", "sellingPoint", "spec", "button"],
    "densityLevel": "medium",
    "translationRisk": ["specHeavy"]
  },
  "needsUserConfirm": []
}
```

### AI帮写
用途：

+ 在用户点击“AI帮写”时，回填图片翻译关键字段；
+ 仅输出字段键值，不输出额外解释；
+ 优先给出“有助于术语准确和版式稳定”的安全值，而不是凭空猜测语种。

提示词：

```json
你是一位商品图片翻译策划师。请根据商品图片，回填 goods-translate 的关键字段。

必须遵守：
1) 仅返回以下字段：platformInfo, productCategory。
2) 能确认的字段必须从提供的 options 中选取一个值。
3) 无法确认的字段不要编造，不要猜测，直接留空字符串 ""，并把字段名加入 needsUserConfirm。
4) 不回填 targetLanguage，目标语种必须由用户显式选择。
5) 只输出 JSON，不要输出解释。

输出格式：
{
  "fieldValues": {
    "platformInfo": "string",
    "productCategory": "string"
  },
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}
```

回填策略：

+ `productCategory` 可识别、`platformInfo` 无把握时，只回填 `productCategory`，`platformInfo` 留空或回填 `无平台信息`。
+ 当前前端默认未开启 AI 帮写，但服务端或后续版本接入时，可直接复用本段协议。

### 文本润色
用途：

+ 对后续若启用的补充说明进行语义增强；
+ 生成可执行、约束清晰、适合图片翻译模型的补充文本；
+ 自动过滤“翻译得自然一点”“更地道一点”这类弱约束表达，转成明确的术语、版式和语气要求。

提示词：

```json
你是一位电商图片翻译文案润色专家。请将下方用户的补充说明优化为“可执行的图像生成约束”，并保持原意。

补充说明：
xxxxxxxxxxxx

润色目标：
1) 强化术语统一、版式稳定、重点信息可读和语言自然度。
2) 明确是否需要短句化、品牌克制、参数优先、RTL/LTR适配等要求。
3) 避免空泛词，改成可执行描述（标题长度、术语口径、是否保留价格结构、是否允许活动标签、按钮和价格区是否保留原位置）。
4) 若用户写了可能违规、误导或不真实的要求，自动转为合规表述，不要原样保留。
5) 输出一段最终可直接拼进提示词的文本。

输出要求：
- 仅输出润色后的文本，不要解释。
- 80~180字为宜。
- 不得包含新增价格、虚假促销、错误规格、违规导流或与平台规则冲突的表达。
```

默认润色方向：

+ 对 `goods-translate` 来说，重点不应该是“换背景”或“视角统一”，而应该是“术语统一、版式稳定、语言自然、信息不误译不漏译”。
+ 若用户未明确要求，润色时优先补成“保留原图主次层级、价格与规格信息一致、标题与卖点短句清晰”这类保守表达。

## 结论
图片翻译不是“把字翻一遍”，而是“在不破坏商品图版式和商业语义的前提下完成多语替换”。
