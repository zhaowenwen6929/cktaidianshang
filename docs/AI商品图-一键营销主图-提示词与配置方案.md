# AI商品图-一键营销主图-提示词与配置方案（功能级样板）

> 目标：基于“功能+平台+品类+高级选项值”生成合规且可转化的营销主图。  
> 适用：开发直接落地（配置驱动提示词组装）。  
> 更新时间：2026-05-01

## 1. 页面真实流程与字段（Source of Truth）

## 1.1 使用流程（真实）

1. 上传商品图（`upload-main`）
2. 选择创作模式（`creation-mode`：普通/高级，比例、分辨率、数量）
3. 配置高级设置（`advanced-settings`）
4. 填写补充说明（`supplement`，可选）
5. 上传参考图（`upload-reference`，可选）
6. 生成

对应代码配置（`src/App.tsx`）：

- `toolKey`: `goods-marketing`
- `creationModeConfigKey`: `marketing`
- `sectionOrder`: `["upload-main","creation-mode","advanced-settings","supplement","upload-reference"]`
- `uploads.main.maxCount`: `24`
- `uploads.reference.maxCount`: `1`
- `advancedAiAssistPromptConfigs["goods-marketing"]`：AI回填高级字段
- `supplementAiPolishConfigs["goods-marketing"]`：补充说明润色

## 1.2 高级设置字段与可选值（真实）

```json
{
  "advancedFields": {
    "productType": ["智能识别", "服装", "T恤", "背包", "鞋子", "小家电", "电视", "沙发", "吊灯", "化妆品", "香水", "水果", "饮料", "汽车", "集装箱", "蓝牙耳机", "手机", "行李箱", "文具", "机械设备", "项链", "玩具", "瑜伽服", "健身器材", "笔记本电脑", "手办"],
    "sceneBackground": ["智能生成", "无背景", "简单背景", "产品场景", "纯色背景", "纯色渐变", "图片边框"],
    "platformInfo": ["无平台信息", "全平台通用（16平台）", "淘宝", "天猫", "京东", "拼多多", "1688", "抖音电商", "快手电商", "小红书电商", "亚马逊", "Temu", "TikTok Shop", "阿里国际站", "速卖通", "Shopee", "OZON", "SHEIN"],
    "productInfo": ["无信息", "智能生成", "名称+卖点", "价格与促销", "名称+卖点+价格+促销"],
    "visualStyle": ["自动匹配", "极简简约", "轻奢高端", "时尚潮流", "年轻元气", "专业信任", "强营销", "吸睛爆点"],
    "marketingElements": ["无", "折扣标识", "买一送一", "满减活动", "顺丰速达", "京东自营", "本地仓", "双十一促销"],
    "copyLanguage": ["无文案", "简体中文", "繁体中文", "英文", "中英文混排", "俄语", "日语", "韩语", "印地语", "德语", "法语", "西班牙语", "葡萄牙语", "阿拉伯语", "泰语", "荷兰语", "土耳其语"]
  }
}
```

## 1.3 平台与品类输入字段（本功能）

```json
{
  "platformField": "platformLabel",
  "platformOptions": ["全平台通用（16平台）", "淘宝", "天猫", "京东", "拼多多", "1688", "抖音电商", "快手电商", "小红书电商", "亚马逊", "Temu", "TikTok Shop", "阿里国际站", "速卖通", "Shopee", "OZON", "SHEIN"],
  "categoryField": "productCategory",
  "categoryOptions": ["服饰类", "鞋靴类", "箱包类", "珠宝饰品类", "美妆个护类", "食品饮料类", "家居百货类", "家电数码类", "家具大件类", "母婴玩具类", "宠物用品类", "汽配五金类"]
}
```

## 2. 平台提示词配置（营销主图专属 JSON）

说明：

- 平台规则证据来源统一参照：
  - [商品白底图-16平台最新规范与品类补充.md](/Users/zhaowenwen/CODEX/CKTAI电商/docs/商品白底图-16平台最新规范与品类补充.md)
- 营销主图不是白底图，但仍受平台“真实性、可识别、不误导”约束。
- `ruleLevel`：`A` 官方明确 / `B` 官方间接或开放文档 / `C` 待后台复核。

```json
{
  "platformRulesByTool": {
    "全平台通用（16平台）": {
      "ruleLevel": "A",
      "prompt": "营销主图可承载卖点信息，但必须保证商品主体可识别、信息层级清晰、无误导性承诺与违规元素。",
      "forbidden": ["虚假功效", "夸张前后对比", "违规水印与联系方式", "遮挡主体关键结构"],
      "required": ["主体清晰", "卖点可读", "真实可信"]
    },
    "淘宝": { "ruleLevel": "C", "prompt": "适配淘宝高密度信息浏览，允许营销表达但避免牛皮癣式堆叠，主体优先。", "forbidden": ["密集遮挡文案"], "required": ["信息清晰", "主体完整"] },
    "天猫": { "ruleLevel": "C", "prompt": "适配天猫品牌感展示，在营销表达中保持精致感和秩序感。", "forbidden": ["低质贴图感"], "required": ["质感统一", "层级清楚"] },
    "京东": { "ruleLevel": "C", "prompt": "适配京东效率型浏览，强调结构清晰、利益点直达、信息可信。", "forbidden": ["夸张不实活动信息"], "required": ["结构可辨", "卖点直观"] },
    "拼多多": { "ruleLevel": "C", "prompt": "适配拼多多快速决策场景，突出核心利益点但避免画面过载。", "forbidden": ["过多无关视觉噪声"], "required": ["核心卖点聚焦"] },
    "1688": { "ruleLevel": "C", "prompt": "适配1688商采语境，营销信息应服务规格/材质/供货价值表达。", "forbidden": ["纯情绪化营销覆盖商品信息"], "required": ["参数可信", "主体清晰"] },
    "抖音电商": { "ruleLevel": "C", "prompt": "适配抖音电商内容化浏览，强调首眼吸引与主体识别平衡。", "forbidden": ["过重滤镜导致主体失真"], "required": ["吸睛但真实"] },
    "快手电商": { "ruleLevel": "C", "prompt": "适配快手电商真实交易氛围，营销表达直接、可信、不过度包装。", "forbidden": ["娱乐化抢主体"], "required": ["可信表达", "主体居中"] },
    "小红书电商": { "ruleLevel": "B", "prompt": "适配小红书审美型种草场景，营销表达需审美化但不脱离真实。", "forbidden": ["硬广贴片过重"], "required": ["审美统一", "体验可信"] },
    "亚马逊": { "ruleLevel": "A", "prompt": "适配亚马逊规范语境，营销主图应避免误导性宣传，主体与信息必须准确。", "forbidden": ["误导性文案", "不实属性"], "required": ["准确表达", "可识别"] },
    "Temu": { "ruleLevel": "C", "prompt": "适配Temu快节奏展示，卖点突出但画面保持清晰简洁。", "forbidden": ["噪声化拼贴"], "required": ["一眼识别", "利益点清楚"] },
    "TikTok Shop": { "ruleLevel": "A", "prompt": "适配TikTok Shop电商规范，营销表达需真实且不误导，主体展示完整。", "forbidden": ["虚构效果演示"], "required": ["真实可核验", "主体清楚"] },
    "阿里国际站": { "ruleLevel": "B", "prompt": "适配B2B国际买家判断路径，营销内容应增强专业可信而非纯感性冲击。", "forbidden": ["弱化商品规格信息"], "required": ["专业可信", "价值清晰"] },
    "速卖通": { "ruleLevel": "C", "prompt": "适配速卖通跨境零售语境，卖点表达清晰，不做不实承诺。", "forbidden": ["夸张承诺"], "required": ["真实卖点", "信息简洁"] },
    "Shopee": { "ruleLevel": "C", "prompt": "适配Shopee移动端浏览，营销元素要克制，保证主商品优先识别。", "forbidden": ["主体被边框和贴纸吞没"], "required": ["主体优先", "卖点可读"] },
    "OZON": { "ruleLevel": "B", "prompt": "适配OZON展示语境，强调清晰、真实、可读，不使用过度后期。", "forbidden": ["重后期失真"], "required": ["真实细节", "层级清楚"] },
    "SHEIN": { "ruleLevel": "C", "prompt": "适配SHEIN时尚零售语境，营销主图需兼顾版型审美和信息直达。", "forbidden": ["版型失真"], "required": ["时尚表达", "主体完整"] }
  }
}
```

## 2.1 `ruleLevel` 多规则使用逻辑（同一平台存在多条规则时）

- 合并 `required`、`forbidden`（去重后全保留）。
- `prompt` 按 `A -> B -> C` 拼接。
- token 超限先裁 `C` 再裁 `B`；`A/required/forbidden` 不裁。
- 冲突覆盖：`A > B > C`。

## 3. 品类提示词配置（营销主图专属 JSON）

```json
{
  "categoryRulesByTool": {
    "服饰类": { "prompt": "突出版型、面料与穿搭卖点，文案区域不要遮挡关键轮廓。"},
    "鞋靴类": { "prompt": "突出鞋型结构、材质纹理与功能卖点，保持成对关系与比例准确。"},
    "箱包类": { "prompt": "突出容量、分层、五金与便携卖点，保持包体立体结构。"},
    "珠宝饰品类": { "prompt": "突出光泽、工艺与佩戴卖点，保证金属/宝石细节可辨。"},
    "美妆个护类": { "prompt": "突出成分/功效卖点时避免绝对化承诺，瓶身标签与材质需清晰。"},
    "食品饮料类": { "prompt": "突出口感/成分/场景卖点，避免夸张食效和误导性表达。"},
    "家居百货类": { "prompt": "突出使用便利性与场景适配卖点，保持结构和配件完整。"},
    "家电数码类": { "prompt": "突出参数、功能与质感卖点，接口按键与结构必须真实。"},
    "家具大件类": { "prompt": "突出空间搭配和材质卖点，透视与尺度关系必须可信。"},
    "母婴玩具类": { "prompt": "突出安全、材质与使用场景卖点，避免危险姿态与夸大承诺。"},
    "宠物用品类": { "prompt": "突出耐用、舒适与适配卖点，保持真实宠物使用语义。"},
    "汽配五金类": { "prompt": "突出规格、兼容与结构卖点，孔位棱边和金属细节准确。"}
  }
}
```

## 3.1 `productType` 与 `productCategory` 拉齐映射（强制）

```json
{
  "productTypeToCategoryMap": {
    "智能识别": "通用品类",
    "服装": "服饰类",
    "T恤": "服饰类",
    "瑜伽服": "服饰类",
    "鞋子": "鞋靴类",
    "背包": "箱包类",
    "行李箱": "箱包类",
    "项链": "珠宝饰品类",
    "化妆品": "美妆个护类",
    "香水": "美妆个护类",
    "水果": "食品饮料类",
    "饮料": "食品饮料类",
    "文具": "家居百货类",
    "小家电": "家电数码类",
    "电视": "家电数码类",
    "蓝牙耳机": "家电数码类",
    "手机": "家电数码类",
    "笔记本电脑": "家电数码类",
    "沙发": "家具大件类",
    "吊灯": "家具大件类",
    "玩具": "母婴玩具类",
    "手办": "母婴玩具类",
    "健身器材": "家居百货类",
    "汽车": "汽配五金类",
    "机械设备": "汽配五金类",
    "集装箱": "汽配五金类"
  }
}
```

## 4. 高级选项值扩展提示词配置（营销主图专属 JSON）

说明：

- 每个选项值都明确所属 `fieldKey`；
- 每个字段补充 `name`，用于前端展示与校准；
- 组装时优先拼接 `valuePrompt`，不能只拼 `field=value`。

```json
{
  "optionValueExpansionsByTool": {
    "sceneBackground": {
      "fieldKey": "sceneBackground",
      "name": "场景背景",
      "values": {
        "智能生成": { "valuePrompt": "根据商品属性自动匹配最有利于转化的背景表达，优先保证主体突出。" },
        "无背景": { "valuePrompt": "保持背景简洁干净，重点聚焦商品主体和卖点信息。" },
        "简单背景": { "valuePrompt": "使用低干扰背景衬托主体，避免复杂视觉噪声。" },
        "产品场景": { "valuePrompt": "构建与商品使用语义一致的场景，避免违和和伪造使用状态。" },
        "纯色背景": { "valuePrompt": "使用稳定纯色底增强信息可读性，避免色彩冲突。" },
        "纯色渐变": { "valuePrompt": "使用克制渐变提升质感，不得影响主体边缘识别。" },
        "图片边框": { "valuePrompt": "边框仅作辅助分层，不可喧宾夺主或遮挡商品关键部位。" }
      }
    },
    "productInfo": {
      "fieldKey": "productInfo",
      "name": "商品信息",
      "values": {
        "无信息": { "valuePrompt": "不强制叠加文案信息，强调纯视觉营销表达。" },
        "智能生成": { "valuePrompt": "自动生成最小必要信息层级，优先保证商品识别和卖点聚焦。" },
        "名称+卖点": { "valuePrompt": "保留名称与核心卖点两层信息，文字简洁可读。" },
        "价格与促销": { "valuePrompt": "突出价格与促销信息时保持真实合规，避免夸张承诺。" },
        "名称+卖点+价格+促销": { "valuePrompt": "完整信息层级表达，注意主次分明，避免版面拥挤。" }
      }
    },
    "visualStyle": {
      "fieldKey": "visualStyle",
      "name": "视觉风格",
      "values": {
        "自动匹配": { "valuePrompt": "根据品类与平台自动匹配稳妥风格，优先转化效率。" },
        "极简简约": { "valuePrompt": "降低装饰，提升主体与信息阅读效率。" },
        "轻奢高端": { "valuePrompt": "强调材质质感和高级氛围，控制视觉克制度。" },
        "时尚潮流": { "valuePrompt": "强化潮流表达与色彩张力，保持商品真实轮廓。" },
        "年轻元气": { "valuePrompt": "强调明快活力和轻快构图，信息区保持可读。" },
        "专业信任": { "valuePrompt": "强调理性与可信表达，结构与参数语义清晰。" },
        "强营销": { "valuePrompt": "强化利益点冲击，但避免噪声化堆叠和违规承诺。" },
        "吸睛爆点": { "valuePrompt": "提升首眼注意力，确保主体和关键信息不失真。" }
      }
    },
    "marketingElements": {
      "fieldKey": "marketingElements",
      "name": "营销元素",
      "values": {
        "无": { "valuePrompt": "不添加额外营销角标或促销元素，保持画面干净。"},
        "折扣标识": { "valuePrompt": "折扣标识位置克制，避免遮挡商品主体。"},
        "买一送一": { "valuePrompt": "买赠信息表达清晰，禁止误导性细则省略。"},
        "满减活动": { "valuePrompt": "满减规则简明可读，避免过密小字堆叠。"},
        "顺丰速达": { "valuePrompt": "物流卖点作为辅助信息呈现，不抢占主体视觉中心。"},
        "京东自营": { "valuePrompt": "平台属性标识仅在语义匹配场景使用，避免错配。"},
        "本地仓": { "valuePrompt": "本地仓卖点用于提升履约感知，信息需真实可信。"},
        "双十一促销": { "valuePrompt": "大促元素可突出，但需控制噪声并保持商品可识别。"}
      }
    },
    "copyLanguage": {
      "fieldKey": "copyLanguage",
      "name": "文案语种",
      "values": {
        "无文案": { "valuePrompt": "不强制叠加文案，聚焦画面视觉卖点。"},
        "简体中文": { "valuePrompt": "中文文案简洁直达，层级清晰。"},
        "繁体中文": { "valuePrompt": "繁中文案保持可读和区域语境自然。"},
        "英文": { "valuePrompt": "英文文案表达直接，避免复杂长句。"},
        "中英文混排": { "valuePrompt": "中英信息层级明确，避免视觉混乱。"},
        "俄语": { "valuePrompt": "俄语文案注意字重与字距，确保可读。"},
        "日语": { "valuePrompt": "日语文案风格克制，信息分层明确。"},
        "韩语": { "valuePrompt": "韩语文案保持紧凑清爽，避免拥挤。"},
        "印地语": { "valuePrompt": "印地语文案需保证字形清晰可辨。"},
        "德语": { "valuePrompt": "德语长词注意换行策略，避免遮挡主体。"},
        "法语": { "valuePrompt": "法语文案保持优雅简洁，避免冗长。"},
        "西班牙语": { "valuePrompt": "西语文案强调直观与节奏，保证可读。"},
        "葡萄牙语": { "valuePrompt": "葡语文案表达清晰，信息层级稳定。"},
        "阿拉伯语": { "valuePrompt": "阿拉伯语注意右向阅读习惯和版式平衡。"},
        "泰语": { "valuePrompt": "泰语文案注意字形密度与留白。"},
        "荷兰语": { "valuePrompt": "荷兰语文案保持精炼，避免过长行。"},
        "土耳其语": { "valuePrompt": "土耳其语文案保持语义直达与可读。"}
      }
    }
  }
}
```

## 5. 最终组装模板与规则（JSON）

```json
{
  "builderByTool": {
    "goods-marketing": {
      "requiredFields": ["toolKey", "platformLabel", "productCategory", "productType", "sceneBackground", "platformInfo", "productInfo", "visualStyle", "marketingElements", "copyLanguage"],
      "promptTemplates": {
        "task": "生成可用于电商主图与活动投放的营销主图。",
        "category": "当前商品品类为「{productCategory}」，请保持该品类应有的真实结构、材质、颜色与比例，不改变SKU核心特征。",
        "platform": "{platformPrompt}",
        "params": "产品类型={productType}；场景背景={sceneBackground}；平台信息={platformInfo}；商品信息={productInfo}；视觉风格={visualStyle}；营销元素={marketingElements}；文案语种={copyLanguage}。",
        "quality": "主体清晰，卖点突出，信息层级明确，避免夸张失真与违规承诺。",
        "outputSpec": "输出比例={ratio}；输出分辨率={resolution}；输出数量={count}。",
        "supplement": "补充要求：{supplement}"
      },
      "appendOptionExpansions": true,
      "optionExpansionMode": "detailed_prompt_first",
      "strictMode": {
        "enabled": true,
        "onMissingPlatformRule": "error",
        "onMissingCategoryRule": "error",
        "onUnknownParamValue": "error"
      }
    }
  }
}
```

## 6. 可直接联调示例

输入：

```json
{
  "toolKey": "goods-marketing",
  "platformLabel": "淘宝",
  "productCategory": "服饰类",
  "params": {
    "productType": "服装",
    "sceneBackground": "产品场景",
    "platformInfo": "淘宝",
    "productInfo": "名称+卖点+价格+促销",
    "visualStyle": "时尚潮流",
    "marketingElements": "折扣标识",
    "copyLanguage": "简体中文",
    "ratio": "1:1",
    "resolution": "1K",
    "count": "1",
    "supplement": "保留针织纹理细节，主标题对比更强。"
  },
  "strict": true
}
```

输出（示例）：

```text
生成可用于电商主图与活动投放的营销主图。

当前商品品类为「服饰类」，请保持该品类应有的真实结构、材质、颜色与比例，不改变SKU核心特征。

适配淘宝高密度信息浏览，允许营销表达但避免牛皮癣式堆叠，主体优先。

产品类型=服装；场景背景=产品场景；平台信息=淘宝；商品信息=名称+卖点+价格+促销；视觉风格=时尚潮流；营销元素=折扣标识；文案语种=简体中文。

构建与商品使用语义一致的场景，避免违和和伪造使用状态。完整信息层级表达，注意主次分明，避免版面拥挤。强化潮流表达与色彩张力，保持商品真实轮廓。折扣标识位置克制，避免遮挡商品主体。中文文案简洁直达，层级清晰。

主体清晰，卖点突出，信息层级明确，避免夸张失真与违规承诺。

输出比例=1:1；输出分辨率=1K；输出数量=1。

补充要求：保留针织纹理细节，主标题对比更强。
```

## 7. 组装实现要点（避免“只拼值文本”）

- 不能只拼 `field=value`。
- 必须在参数段后拼接命中的 `valuePrompt`。
- `optionExpansionMode = detailed_prompt_first` 时，扩展段优先作为约束参与生成。

## 8. 三个关键能力的提示词配置（完整可用）

### 8.1 图片识别获取信息（Image Understanding / Extraction）

```text
你是一位电商营销主图理解专家。请根据输入商品图，提取“营销主图生成”所需信息，并严格输出 JSON。

任务要求：
1) 识别商品所属品类（用于 productCategory）。
2) 预测以下字段推荐值：productType, sceneBackground, platformInfo, productInfo, visualStyle, marketingElements, copyLanguage。
3) 所有推荐值必须从给定 options 中选择；无法判断时留空字符串并加入 needsUserConfirm。
4) 只输出 JSON，不要解释。
```

### 8.2 AI帮写（Advanced Fields Auto-fill）

```text
你是一位电商营销主图策划师。请根据商品图识别结果与平台信息，回填 goods-marketing 高级设置字段。

必须遵守：
1) 仅返回字段：productCategory, productType, sceneBackground, platformInfo, productInfo, visualStyle, marketingElements, copyLanguage。
2) 能确认的字段必须从 options 里选取。
3) 无法确认的字段不要猜测，留空字符串 ""，并加入 needsUserConfirm。
4) productType 回填后，必须通过 productTypeToCategoryMap 推导并拉齐 productCategory。
5) 只输出 JSON，不要解释。
```

输出格式：

```json
{
  "fieldValues": {
    "productCategory": "string",
    "productType": "string",
    "sceneBackground": "string",
    "platformInfo": "string",
    "productInfo": "string",
    "visualStyle": "string",
    "marketingElements": "string",
    "copyLanguage": "string"
  },
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}
```

### 8.3 文本润色（Supplement Polish）

```text
你是一位电商营销主图文案润色专家。请将用户补充说明优化为可执行图像生成约束，并保持原意。

目标：
1) 强化卖点层级、主体可识别性与信息可读性。
2) 把空泛描述改成可执行约束（构图、文字层级、风格、光线、禁用项）。
3) 不新增与用户意图冲突的内容。

输出要求：
- 仅输出润色后文本，不要解释；
- 不得包含违规承诺、绝对化功效和误导性表达。
```

