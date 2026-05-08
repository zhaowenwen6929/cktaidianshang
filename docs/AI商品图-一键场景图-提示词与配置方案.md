# AI商品图-一键场景图-提示词与配置方案（功能级样板）

> 目标：基于“真实代码流程 + 平台规则 + 品类规则 + 高级选项值扩展”生成合规且正确的一键场景图。  
> 适用：开发直接落地（配置驱动提示词组装）。  
> 更新时间：2026-05-01

## 1. 页面真实流程与字段（Source of Truth）

## 1.1 使用流程（真实）

1. 上传商品图（`upload-main`）
2. 选择创作模式（`creation-mode`：普通/高级，比例、分辨率、数量）
3. 配置高级设置（`advanced-settings`）
4. 填写补充说明（`supplement`，可选）
5. 生成

对应代码配置（`src/App.tsx`）：

- `toolKey`: `goods-scene`
- `creationModeConfigKey`: `scene`
- `sectionOrder`: `["upload-main","creation-mode","advanced-settings","supplement"]`
- `advancedAiAssistPromptConfigs["goods-scene"]`：AI 回填高级字段
- `supplementAiPolishConfigs["goods-scene"]`：补充说明润色

## 1.1.1 端到端使用流程（建议落地）

1. 用户上传商品图（`upload-main`，当前模板支持多图）。
2. 系统执行图片理解与商品信息提取（见 1.4），输出品类、商品结构和场景线索。
3. 用户选择创作模式参数（`modeId` / `ratio` / `resolution` / `count`）。
4. 用户进入高级设置，手动选择或点击 AI Assist 自动回填场景字段。
5. 用户填写补充说明（可选，可先走 AI 润色）。
6. 系统按 strict 规则组装最终提示词并提交生成。
7. 返回结果后，用户可继续调整场景参数二次生成。

## 1.2 高级设置字段与可选值（真实）

```json
{
  "advancedFields": {
    "productType": ["智能识别", "服装", "T恤", "背包", "鞋子", "小家电", "电视", "沙发", "吊灯", "化妆品", "香水", "水果", "饮料", "汽车", "集装箱", "蓝牙耳机", "手机", "行李箱", "文具", "机械设备", "项链", "玩具", "瑜伽服", "健身器材", "笔记本电脑", "手办"],
    "sceneType": ["智能生成", "无背景", "简单背景", "产品场景", "纯色背景", "纯色渐变", "图片边框"],
    "productDisplay": ["单品特写", "多角度展示", "套装组合", "模特手持", "使用中展示", "局部细节", "悬浮陈列"],
    "layoutStyle": ["居中构图", "左右分栏", "满版铺陈", "留白极简", "杂志感排版", "电商主图风"],
    "moodStyle": ["清新明亮", "温暖治愈", "高级冷淡", "轻奢质感", "梦幻浪漫", "节日热卖", "科技未来"],
    "valueFocus": ["突出卖点", "突出品质", "突出价格优势", "突出礼赠属性", "突出实用性", "突出品牌感"],
    "targetMarket": ["国内电商", "欧美市场", "日韩市场", "东南亚市场", "中东市场", "全球通用"],
    "copyLanguage": ["无需文案", "简体中文", "繁体中文", "英语", "日语", "韩语", "西班牙语", "法语", "德语"]
  }
}
```

## 1.3 平台与品类输入字段（本功能真实状态）

结论：

- `goods-scene` 当前真实代码里没有单独暴露 `platformLabel` / `platformInfo` 字段；
- 当前页面只配置了场景类高级字段，没有“平台信息”下拉；
- 但业务上如果要生成“可跨平台复用的场景图”，平台规则仍然应该作为提示词组装层输入存在。

建议落地方式：

```json
{
  "platformField": "platformLabel",
  "platformFieldStatusInCurrentPage": "not_exposed",
  "recommendedInjection": "由上游商品发布场景、全局平台选择器或后端任务入参注入",
  "platformOptions": ["全平台通用（16平台）", "淘宝", "天猫", "京东", "拼多多", "1688", "抖音电商", "快手电商", "小红书电商", "亚马逊", "Temu", "TikTok Shop", "阿里国际站", "速卖通", "Shopee", "OZON", "SHEIN"],
  "categoryField": "productCategory",
  "categoryOptions": ["服饰类", "鞋靴类", "箱包类", "珠宝饰品类", "美妆个护类", "食品饮料类", "家居百货类", "家电数码类", "家具大件类", "母婴玩具类", "宠物用品类", "汽配五金类", "通用品类"]
}
```

关键说明：

- 场景图不应默认替代平台要求为白底的首图。
- 对强白底平台，场景图默认定位为“附图 / 场景辅图 / 内容图位”。
- 若平台或类目要求首图白底，则应由白底图功能承担首图生成，场景图承担后续转化图位。

## 1.4 上传图片识别与商品信息提取（关键环节）

## 1.4.1 目标

- 从上传图中提取“场景图生成所需的商品信息”；
- 为高级字段回填与提示词组装提供结构化输入；
- 减少用户手动配置成本，提升首轮场景图可用率。

## 1.4.2 当前代码已存在的字段推断链路

当前 `goods-scene` 的 AI Assist / 规则推断真实会命中以下逻辑：

```ts
fieldValues.productType = inferProductType(sourceText);
fieldValues.sceneType = inferBackgroundType(sourceText, "智能生成");
fieldValues.productDisplay = inferSceneProductDisplay(sourceText);
fieldValues.layoutStyle = inferSceneLayoutStyle(sourceText);
fieldValues.moodStyle = inferSceneMoodStyle(sourceText);
fieldValues.valueFocus = inferSceneValueFocus(sourceText);
fieldValues.targetMarket = inferTargetMarket(sourceText);
fieldValues.copyLanguage = inferCopyLanguage(sourceText, true);
```

这意味着：

- `sceneType` 当前实际复用了 `inferBackgroundType(...)`，不是单独的场景识别器；
- `targetMarket` 与 `copyLanguage` 已有统一推断能力；
- `platformLabel` 尚未接入这一链路，需要作为新增入参补齐。

## 1.4.3 识别输入

```json
{
  "imageUrl": "上传图片地址",
  "title": "商品标题（可选）",
  "toolKey": "goods-scene"
}
```

## 1.4.4 识别输出（建议结构）

```json
{
  "category": {
    "categoryId": "home-storage",
    "categoryLabel": "家居百货类",
    "confidence": 0.95,
    "keywords": ["塑料收纳盒", "透明盒盖", "桌面收纳", "家居整理"]
  },
  "sceneSignals": {
    "detectedProductType": "家居",
    "detectedSceneType": "产品场景",
    "detectedDisplayHints": ["单品特写", "局部细节"],
    "detectedLayoutHints": ["留白极简"],
    "detectedMoodHints": ["清新明亮"],
    "detectedValueHints": ["突出实用性"],
    "detectedMarketHints": ["国内电商"],
    "detectedLanguageHints": ["无需文案"]
  }
}
```

## 1.4.5 识别到字段回填映射

```json
{
  "category.categoryLabel": "productCategory",
  "sceneSignals.detectedProductType": "productType",
  "sceneSignals.detectedSceneType": "sceneType",
  "sceneSignals.detectedDisplayHints[0]": "productDisplay",
  "sceneSignals.detectedLayoutHints[0]": "layoutStyle",
  "sceneSignals.detectedMoodHints[0]": "moodStyle",
  "sceneSignals.detectedValueHints[0]": "valueFocus",
  "sceneSignals.detectedMarketHints[0]": "targetMarket",
  "sceneSignals.detectedLanguageHints[0]": "copyLanguage"
}
```

## 1.4.6 回填策略（strict 推荐）

- 命中字段值必须在该字段 `options` 内；
- 若识别值不在 options 内或识别不足：该字段回填空字符串 `""`，并加入 `needsUserConfirm`；
- `productCategory` 未命中统一品类时：回填 `通用品类` 并强制人工确认；
- `platformLabel` 若未由业务上游传入，不得让模型猜平台，应回填 `全平台通用（16平台）` 或空值待确认。

## 1.4.7 失败兜底

- 识别失败时不阻塞流程；
- 最小可用集：
  - `productCategory=通用品类`
  - `productType=智能识别`
  - `sceneType=智能生成`
  - 其余字段保持用户可选未填状态
- 进入“人工确认优先”路径再生成。

## 2. 平台提示词配置（场景图专属 JSON）

说明：

- 这是“场景图功能专属”平台规则，不等同于白底图首图规则。
- 本配置的核心不是告诉模型“所有平台都可以直接上场景首图”，而是明确：
  - 哪些平台的场景图只能优先作为附图 / 场景辅图；
  - 哪些平台公开规则允许使用场景化附图；
  - 哪些平台公开规则不足，只能按跨平台保守基线执行。
- `ruleLevel` 含义：
  - `A`: 官方公开规则对主图/附图边界较清晰，可直接落提示词
  - `B`: 官方公开规则部分明确，可落半结构化约束
  - `C`: 公开规则不充分，需后台核验，先按保守策略执行

```json
{
  "platformRulesByTool": {
    "全平台通用（16平台）": {
      "ruleLevel": "A",
      "sceneSlotAdvice": "默认作为附图/场景辅图使用，不替代白底首图",
      "prompt": "场景图应服务商品转化，但默认定位为平台附图或内容图位；若目标平台或类目存在白底首图要求，首图仍应保持白底合规，当前场景图只负责使用场景、氛围和卖点承接。",
      "required": ["商品主体清晰可辨", "场景与商品用途强相关", "商品结构与SKU真实一致", "场景不能压过商品主体"],
      "forbidden": ["把场景图当作所有平台的通用首图", "虚假功效场景", "与实际售卖商品不一致的配件/赠品", "违规水印/Logo/二维码/联系方式", "夸张营销贴片"]
    },
    "淘宝": {
      "ruleLevel": "C",
      "sceneSlotAdvice": "优先作为详情场景图或附图",
      "prompt": "适配淘宝高频浏览语境，场景图应直观表达商品用途和生活化场景，但不得因背景装饰削弱商品识别；默认按跨平台保守规则生成。",
      "required": ["主体清晰", "场景直观", "转化信息聚焦商品本身"],
      "forbidden": ["过重牛皮癣文案", "大面积促销贴片", "复杂背景导致主体模糊"]
    },
    "天猫": {
      "ruleLevel": "C",
      "sceneSlotAdvice": "优先作为品牌感附图或详情场景图",
      "prompt": "适配天猫品牌化展示语境，场景图可更整洁、更有质感，但必须保持商品真实颜色、材质和结构，不做过度氛围化包装。",
      "required": ["质感统一", "商品真实", "场景克制有秩序"],
      "forbidden": ["滤镜过重", "商品失真", "背景抢主体"]
    },
    "京东": {
      "ruleLevel": "C",
      "sceneSlotAdvice": "优先作为附图使用",
      "prompt": "适配京东偏理性导购的展示习惯，场景图应更强调商品结构、功能位置和使用方式，不宜做过强情绪化背景。",
      "required": ["结构清晰", "使用关系明确", "主体完整"],
      "forbidden": ["纯情绪化摆拍", "遮挡结构", "夸大功效对比"]
    },
    "拼多多": {
      "ruleLevel": "C",
      "sceneSlotAdvice": "优先作为效率型场景附图",
      "prompt": "适配拼多多快节奏浏览场景，场景图应突出主体和用途，不做复杂空间叙事，确保一眼能看出卖什么、怎么用。",
      "required": ["识别效率高", "用途直观", "背景简化"],
      "forbidden": ["信息过杂", "主次不清", "复杂道具淹没主体"]
    },
    "1688": {
      "ruleLevel": "C",
      "sceneSlotAdvice": "优先作为应用场景图、非首图",
      "prompt": "适配 1688 商采语境，场景图重点展示商品在真实业务或真实使用环境中的应用关系，不走强生活方式大片风。",
      "required": ["应用真实性", "规格结构可信", "主体明确"],
      "forbidden": ["情绪化过度摆拍", "规格感缺失", "虚构工业/商用场景"]
    },
    "抖音电商": {
      "ruleLevel": "C",
      "sceneSlotAdvice": "可作为内容化附图，但不默认替代首图",
      "prompt": "适配抖音电商内容浏览语境，场景图应有停留感和氛围感，但商品主体必须保持强识别，避免只剩氛围没有商品。",
      "required": ["内容停留感", "商品识别强", "场景真实自然"],
      "forbidden": ["重特效", "商品弱化", "夸张对比或虚假承诺场景"]
    },
    "快手电商": {
      "ruleLevel": "C",
      "sceneSlotAdvice": "优先作为真实使用场景附图",
      "prompt": "适配快手电商真实感更强的内容氛围，场景图宜偏生活抓拍和真实使用语义，但画面质量仍需稳定，避免低清脏乱。",
      "required": ["真实生活感", "主体清楚", "使用语义明确"],
      "forbidden": ["娱乐化抢主体", "过脏过乱", "低清不可辨"]
    },
    "小红书电商": {
      "ruleLevel": "B",
      "sceneSlotAdvice": "可作为 1:1 或 3:4 的种草场景图",
      "prompt": "适配小红书种草语境，场景图可兼顾审美与生活方式表达，但必须保持商品真实可买感，不做与实物不符的美化重绘；建议兼容 1:1 与 3:4 比例。",
      "required": ["种草感", "生活方式审美", "商品真实可辨"],
      "forbidden": ["过度磨皮/柔焦", "硬广感过强", "与实物严重不符的布景"]
    },
    "亚马逊": {
      "ruleLevel": "A",
      "sceneSlotAdvice": "仅建议作为 additional images / lifestyle images，不替代主图",
      "prompt": "适配亚马逊附图逻辑：场景图只能作为 additional images 中的 lifestyle / in-use 图片使用，主图仍必须是纯白背景；场景图应展示商品在真实使用环境中的状态、不同角度或细节，不得误导买家，不得展示不包含在售卖范围内的主体道具为核心卖点。",
      "required": ["仅作附图", "真实 in-use 场景", "商品与实际售卖内容一致", "商品主体和关键结构清晰"],
      "forbidden": ["把场景图当主图", "虚构套装/赠品", "误导性尺寸/功能演示", "过度文字/品牌角标覆盖"]
    },
    "Temu": {
      "ruleLevel": "C",
      "sceneSlotAdvice": "优先作为附图使用",
      "prompt": "适配 Temu 的高效率货架语境，场景图应简单、直接、突出主体和用途，不建议做高复杂度故事化场景；默认按跨平台保守规则执行。",
      "required": ["主体清楚", "用途清晰", "场景简洁"],
      "forbidden": ["复杂拼贴", "背景喧宾夺主", "虚假功效演示"]
    },
    "TikTok Shop": {
      "ruleLevel": "A",
      "sceneSlotAdvice": "可作为 styled scenes / usage scenarios additional images，不替代主图",
      "prompt": "适配 TikTok Shop 官方附图规则：主图必须纯白背景并展示商品正面实体视图；当前场景图只用于 additional images，可展示使用场景、styled scenes、close ups 和 size/scale comparisons，但所有图片都必须真实准确表达售卖商品，且不能带 Logo、文字、边框、水印或覆盖图形。",
      "required": ["仅作附图", "真实 usage scenarios", "不能加字加框加水印", "商品与实际售卖内容一致", "尺寸至少满足平台最低要求"],
      "forbidden": ["把场景图当主图", "数字渲染占位图", "图片覆盖文字Logo", "展示客户收不到的额外物品"]
    },
    "阿里国际站": {
      "ruleLevel": "B",
      "sceneSlotAdvice": "可作为专业应用场景图和补充图",
      "prompt": "适配阿里国际站 B2B 采购语境，场景图应更强调专业应用、工况或使用环境可信度，用高质量图片帮助买家快速理解商品能力，不建议做纯情绪化氛围片。",
      "required": ["高质量图片", "应用场景可信", "专业感和可理解性强"],
      "forbidden": ["只重氛围不见商品", "工业或商用场景虚构", "画质粗糙降低信任"]
    },
    "速卖通": {
      "ruleLevel": "C",
      "sceneSlotAdvice": "优先作为跨境附图使用",
      "prompt": "适配速卖通跨境零售语境，场景图应突出商品用途、体验和多角度理解，不宜让背景道具成为主角；默认按跨平台保守规则生成。",
      "required": ["主体完整", "用途明确", "跨境用户可理解"],
      "forbidden": ["复杂本地化装饰压过商品", "虚假效果图", "与售卖内容不一致"]
    },
    "Shopee": {
      "ruleLevel": "C",
      "sceneSlotAdvice": "优先作为东南亚市场附图",
      "prompt": "适配 Shopee 偏直观和高识别的商品浏览习惯，场景图应明快、干净、用途直接，不宜做深色重氛围或高复杂度构图。",
      "required": ["直观可辨", "色彩明快", "主体突出"],
      "forbidden": ["复杂深景", "主体被背景吞没", "局部特写导致看不清商品全貌"]
    },
    "OZON": {
      "ruleLevel": "B",
      "sceneSlotAdvice": "封面仍宜浅底，场景图适合作为内页或附图",
      "prompt": "适配 OZON 公开内容建议：封面更宜白色或浅色中性背景；场景图更适合作为卡片内部的使用图、细节图或室内场景图，整体仍需保持商品完整可见和构图居中稳定。",
      "required": ["商品完整可见", "居中或稳定构图", "浅底/中性表达优先"],
      "forbidden": ["深重背景吞没主体", "过度风格化导致信息不清", "场景喧宾夺主"]
    },
    "SHEIN": {
      "ruleLevel": "C",
      "sceneSlotAdvice": "服饰类可作 3:4 场景辅图，非服饰仍建议附图化使用",
      "prompt": "适配 SHEIN 快时尚零售语境，场景图应兼顾穿搭氛围与商品真实上身/真实材质；服饰类可优先考虑 3:4 竖图表达，但仍需保持商品结构、版型和面料真实。",
      "required": ["时尚氛围", "上身或陈列真实", "材质与版型可信"],
      "forbidden": ["极端体型修饰", "面料纹理消失", "强滤镜改色"]
    }
  }
}
```

## 2.1 平台规则转提示词的关键结论

1. 对 `亚马逊`、`TikTok Shop` 这类公开明确“主图白底”的平台，场景图必须默认定位为附图。
2. 对 `小红书电商`、`OZON`、`阿里国际站` 这类公开信息部分明确的平台，可以把“比例、审美、应用场景”转为补充约束。
3. 对 `淘宝 / 天猫 / 京东 / 拼多多 / 1688 / 抖音电商 / 快手电商 / Temu / 速卖通 / Shopee / SHEIN` 这类公开规则不充分的平台，先转为“保守场景图规则”，后续再补后台截图核验。

## 2.2 `ruleLevel` 多规则使用逻辑

适用场景：

- 一个平台可能同时命中多条规则（基础规则、附图规则、类目规则、风控规则）。
- 场景图还可能叠加“首图不可用”之类的策略约束。

### 2.2.1 规则定位

- `ruleLevel=A`：高优先级硬约束，不可被低级规则覆盖。
- `ruleLevel=B`：常规约束，可被 `A` 覆盖。
- `ruleLevel=C`：补充约束，可被 `A/B` 覆盖，且可在 token 紧张时优先裁剪。

### 2.2.2 组装顺序（强制）

1. 合并所有命中规则的 `required`。
2. 合并所有命中规则的 `forbidden`。
3. `prompt` 按优先级拼接：`A -> B -> C`。
4. 若提示词长度超限，仅从低优先级描述裁剪：先裁 `C.prompt`，再裁 `B.prompt`；`A.prompt`、`required`、`forbidden` 不裁。

### 2.2.3 关键场景位控制（强制）

- 若命中平台规则中存在 `sceneSlotAdvice=仅建议作为附图/不替代主图`：
  - 系统生成时应自动追加：
    `用途限制：本次输出定位为附图/场景图位，不作为白底首图替代。`
- 若业务层明确当前出图目标是“首图”：
  - 命中上述平台时应直接报错或切换到 `goods-white`。

### 2.2.4 落地伪代码

```ts
type RuleLevel = "A" | "B" | "C";
type ScenePlatformRule = {
  ruleLevel: RuleLevel;
  sceneSlotAdvice?: string;
  prompt?: string;
  required?: string[];
  forbidden?: string[];
};

const levelWeight: Record<RuleLevel, number> = { A: 3, B: 2, C: 1 };

function mergeScenePlatformRules(rules: ScenePlatformRule[]) {
  const sorted = [...rules].sort(
    (a, b) => levelWeight[b.ruleLevel] - levelWeight[a.ruleLevel]
  );

  const required = Array.from(new Set(sorted.flatMap((r) => r.required ?? [])));
  const forbidden = Array.from(new Set(sorted.flatMap((r) => r.forbidden ?? [])));
  const promptsByLevel = {
    A: sorted.filter((r) => r.ruleLevel === "A").map((r) => r.prompt).filter(Boolean) as string[],
    B: sorted.filter((r) => r.ruleLevel === "B").map((r) => r.prompt).filter(Boolean) as string[],
    C: sorted.filter((r) => r.ruleLevel === "C").map((r) => r.prompt).filter(Boolean) as string[]
  };
  const sceneSlotAdvice = Array.from(new Set(sorted.map((r) => r.sceneSlotAdvice).filter(Boolean)));

  return { required, forbidden, promptsByLevel, sceneSlotAdvice };
}
```

## 3. 品类提示词配置（场景图专属 JSON）

```json
{
  "categoryRulesByTool": {
    "服饰类": {
      "prompt": "场景重点体现上身、穿搭或面料状态，保持版型、垂感、纹理和颜色真实，不得通过夸张体型修饰制造虚假显瘦显高效果。"
    },
    "鞋靴类": {
      "prompt": "场景重点体现穿着、落地、行走或陈列状态，保持鞋型、鞋底结构、成对关系和材质真实，避免镜像错误与鞋口塌陷。"
    },
    "箱包类": {
      "prompt": "场景重点体现通勤、出行、手提或肩背状态，保持包体立体结构、肩带受力、五金和开合细节可信。"
    },
    "珠宝饰品类": {
      "prompt": "场景重点体现佩戴氛围与细节高光，保留金属、宝石、珍珠等材质反光和细节，不得因柔焦导致质感丢失。"
    },
    "美妆个护类": {
      "prompt": "场景重点体现梳妆台、洗漱区、护肤步骤或使用语境，包装结构、瓶身反光、膏体/液体状态应真实自然。"
    },
    "食品饮料类": {
      "prompt": "场景重点体现可食用、可饮用和食用时刻的真实语境，但不得伪造功效，不夸大食欲特效，不让非售卖配料主导画面。"
    },
    "家居百货类": {
      "prompt": "场景重点体现居家使用关系和收纳/清洁/整理价值，保持空间比例、结构功能和配件完整，避免纯装饰化摆拍。"
    },
    "家电数码类": {
      "prompt": "场景重点体现真实使用界面、按键、接口、佩戴或摆放状态，避免过度科技特效遮挡产品结构。"
    },
    "家具大件类": {
      "prompt": "场景重点体现真实空间尺度和家居搭配关系，透视必须正确，家具比例不得失真，避免为营造氛围牺牲尺寸可信度。"
    },
    "母婴玩具类": {
      "prompt": "场景重点体现安全、亲和、真实日常的互动或陈列，组件完整，不使用危险姿态，不渲染夸张风险场景。"
    },
    "宠物用品类": {
      "prompt": "场景重点体现宠物真实使用、陪伴或居家摆放状态，材质和耐用感可信，避免过度拟人化或让宠物遮挡主体。"
    },
    "汽配五金类": {
      "prompt": "场景重点体现安装、维修、使用工况或工具关系，孔位、结构和连接逻辑必须正确，不虚构不存在的功能效果。"
    },
    "通用品类": {
      "prompt": "优先保持商品主体真实、结构准确和用途明确，场景仅作辅助，不以强风格化背景替代商品信息。"
    }
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
    "健身器材": "家居百货类",
    "小家电": "家电数码类",
    "电视": "家电数码类",
    "蓝牙耳机": "家电数码类",
    "手机": "家电数码类",
    "笔记本电脑": "家电数码类",
    "沙发": "家具大件类",
    "吊灯": "家具大件类",
    "玩具": "母婴玩具类",
    "手办": "母婴玩具类",
    "汽车": "汽配五金类",
    "机械设备": "汽配五金类",
    "集装箱": "汽配五金类"
  }
}
```

### 3.1.1 校验与兜底规则

- 若 `productType` 未命中映射表：将 `productCategory` 置为 `通用品类`，并加入 `needsUserConfirm=["productType","productCategory"]`。
- 若 `productType` 映射出的 `category` 与当前 `productCategory` 不一致：以映射结果覆盖 `productCategory`，并加入 `needsUserConfirm=["productCategory"]`。
- 若 `productType="智能识别"`：不强行覆盖用户已选品类；当用户未选品类时回填 `通用品类`。

### 3.1.2 提示词组装顺序（与映射联动）

1. 平台规则（platform）  
2. 一级品类规则（`productCategory -> categoryRulesByTool`）  
3. 二级细分类增强（`productType` 自身语义）  
4. 高级选项值扩展（`valuePrompt`）  
5. 补充说明（supplement）

## 4. 高级选项值扩展提示词配置（场景图专属 JSON）

结论：

- 需要扩展。
- 且不是“部分字段扩展”，而是除 `productType` 外的所有场景字段都建议做 `valuePrompt` 扩展。
- 原因是场景图对“语义细度”高度敏感，只拼 `字段=值` 会过于抽象，模型容易画对词面、画错执行方式。

说明：

- 每个选项值都明确所属 `fieldKey`。
- 每个字段补充 `name` 用于页面展示与人工校准。
- `productType` 主要通过 `productTypeToCategoryMap` + 品类规则处理，不单独逐值补全。
- 组装时优先使用 `valuePrompt`，不要只拼值文本。

```json
{
  "optionValueExpansionsByTool": {
    "sceneType": {
      "fieldKey": "sceneType",
      "name": "场景类型",
      "values": {
        "智能生成": { "valuePrompt": "根据商品用途自动匹配最合理的场景表达，优先保证主体清晰和用途一致。" },
        "无背景": { "valuePrompt": "保持背景极简甚至近似抠净效果，但允许轻微环境关系，不做复杂空间搭建。" },
        "简单背景": { "valuePrompt": "以简洁、低干扰的背景服务主体，只保留少量必要环境线索。" },
        "产品场景": { "valuePrompt": "搭建与商品用途强相关的真实使用场景，让商品看起来正在正确地被使用或陈列。" },
        "纯色背景": { "valuePrompt": "使用纯色背景承托主体，强调商品轮廓和颜色，不叠加多余场景元素。" },
        "纯色渐变": { "valuePrompt": "使用克制的渐变背景增加质感，但不能影响商品颜色判断和主体识别。" },
        "图片边框": { "valuePrompt": "允许边框式排版或海报感构图，但主体信息必须清楚，边框不应喧宾夺主。" }
      }
    },
    "productDisplay": {
      "fieldKey": "productDisplay",
      "name": "产品展示",
      "values": {
        "单品特写": { "valuePrompt": "主体作为唯一核心视觉焦点，特写要清晰展现材质、结构和卖点区域。" },
        "多角度展示": { "valuePrompt": "同一画面中体现多个视角或多个角度线索，但每个角度都必须清楚、不混乱。" },
        "套装组合": { "valuePrompt": "展示套装或组合关系时，必须严格与实际售卖内容一致，不能虚构未包含的配件。" },
        "模特手持": { "valuePrompt": "以手持关系体现尺寸和使用语义，人物只作辅助，商品主体仍是视觉中心。" },
        "使用中展示": { "valuePrompt": "体现商品正在被真实使用的状态，让功能和场景关系一眼可懂。" },
        "局部细节": { "valuePrompt": "保留局部特写和细节放大，但仍要让用户能识别商品整体是什么。" },
        "悬浮陈列": { "valuePrompt": "允许悬浮、漂浮或舞台式陈列感，但透视和受力关系要自然，不做超现实失真。"}
      }
    },
    "layoutStyle": {
      "fieldKey": "layoutStyle",
      "name": "排版呈现",
      "values": {
        "居中构图": { "valuePrompt": "主体居中，构图稳定，适合电商高识别展示。" },
        "左右分栏": { "valuePrompt": "左右分栏时要明确主次，一侧展示商品，一侧承接场景或信息，不可平均分散注意力。" },
        "满版铺陈": { "valuePrompt": "画面铺满但不拥挤，商品和环境共同构成整体氛围，仍需保留主体辨识度。" },
        "留白极简": { "valuePrompt": "通过留白制造高级感，减少无关元素，让商品边界和材质更突出。" },
        "杂志感排版": { "valuePrompt": "可借鉴 editorial 风格，但仍以商品可卖、可辨、可信为先，不做纯大片化表达。" },
        "电商主图风": { "valuePrompt": "画面应具备强商品导向和高点击效率，即使有场景也要保留主图式的识别清晰度。"}
      }
    },
    "moodStyle": {
      "fieldKey": "moodStyle",
      "name": "氛围营造",
      "values": {
        "清新明亮": { "valuePrompt": "整体光线明亮、空气感强、色彩干净，适合表现轻盈、整洁和舒适感。" },
        "温暖治愈": { "valuePrompt": "使用柔和暖色调与真实生活场景，营造舒缓、亲和、有人情味的体验。" },
        "高级冷淡": { "valuePrompt": "使用克制、清冷、干净的色彩和材质关系，强调秩序、距离感和高端气质。" },
        "轻奢质感": { "valuePrompt": "用克制的高质感材质、光影和色调体现精致度，但避免过度奢华道具抢走主体。" },
        "梦幻浪漫": { "valuePrompt": "允许柔和浪漫氛围和轻度梦幻效果，但仍需确保商品结构和细节清楚。" },
        "节日热卖": { "valuePrompt": "增加节日元素和热卖气氛时要克制点缀，让商品仍是第一视觉中心。" },
        "科技未来": { "valuePrompt": "可加入科技感、未来感或空间感，但不应使用过度发光特效遮挡商品真实结构。"}
      }
    },
    "valueFocus": {
      "fieldKey": "valueFocus",
      "name": "价值导向",
      "values": {
        "突出卖点": { "valuePrompt": "所有场景服务于商品核心卖点表达，让用户一眼理解商品最值得买的点。" },
        "突出品质": { "valuePrompt": "强调材质、工艺、做工、结构细节和精致感，弱化低价促销感。" },
        "突出价格优势": { "valuePrompt": "可以表达高性价比和实用价值，但不要生成低俗、廉价、夸张的价格营销画面。" },
        "突出礼赠属性": { "valuePrompt": "场景应体现送礼、包装、仪式感或适合作为礼物的语义，但不得虚构赠品。" },
        "突出实用性": { "valuePrompt": "让商品在真实生活或工作中被正确使用，突出解决问题和提升效率的价值。" },
        "突出品牌感": { "valuePrompt": "强调统一视觉质感、审美和品牌气质，但不得用大面积 Logo 或广告化图层压过商品。"}
      }
    },
    "targetMarket": {
      "fieldKey": "targetMarket",
      "name": "目标市场",
      "values": {
        "国内电商": { "valuePrompt": "表达应兼顾浏览效率、商品识别和转化导向，场景直观、清楚、可快速理解。" },
        "欧美市场": { "valuePrompt": "表达偏自然、克制、空间感清晰，重视功能、品质和真实使用语境。" },
        "日韩市场": { "valuePrompt": "表达偏干净、细致、秩序感强，注重审美统一与商品细节质感。" },
        "东南亚市场": { "valuePrompt": "表达偏明快、直观、亮度较高，场景不宜过暗过重，主体识别优先。" },
        "中东市场": { "valuePrompt": "表达可更重视完整度、精致感和质感，但必须避开不合语境的人物/服饰/空间元素。" },
        "全球通用": { "valuePrompt": "采用跨市场都易于接受的安全表达，保持场景自然、主体清晰、审美中性和用途直观。"}
      }
    },
    "copyLanguage": {
      "fieldKey": "copyLanguage",
      "name": "文案语种",
      "values": {
        "无需文案": { "valuePrompt": "尽量不用叠字、标题或信息贴片，完全依靠商品与场景关系完成表达。" },
        "简体中文": { "valuePrompt": "若确需文字，应使用简体中文，文案简洁直接，并避免夸张承诺和过密排版。" },
        "繁体中文": { "valuePrompt": "若确需文字，应使用繁体中文，保证字形正确、排版克制、信息清晰。" },
        "英语": { "valuePrompt": "若确需文字，应使用自然英文表达，避免中式直译、过长句和促销口号堆砌。" },
        "日语": { "valuePrompt": "若确需文字，应使用自然、简洁、克制的日语表达，保持视觉秩序。" },
        "韩语": { "valuePrompt": "若确需文字，应使用自然韩语表达，避免广告腔过强和排版拥挤。" },
        "西班牙语": { "valuePrompt": "若确需文字，应使用准确、简洁的西班牙语表达，避免冗长和误译。" },
        "法语": { "valuePrompt": "若确需文字，应使用准确、克制的法语表达，兼顾信息清晰和视觉优雅。" },
        "德语": { "valuePrompt": "若确需文字，应使用准确、理性、结构清晰的德语表达，避免堆砌过多口号。"}
      }
    }
  }
}
```

## 5. 最终组装模板与规则（JSON）

```json
{
  "builderByTool": {
    "goods-scene": {
      "requiredFields": ["toolKey", "productCategory", "productType", "sceneType", "productDisplay", "layoutStyle", "moodStyle", "valueFocus", "targetMarket", "copyLanguage"],
      "optionalFields": ["platformLabel", "platformRuleDetail", "supplement", "ratio", "resolution", "count"],
      "promptTemplates": {
        "task": "生成具有真实使用代入感、可用于电商转化图位的商品场景图。",
        "category": "当前商品品类为「{productCategory}」，请保持该品类应有的真实结构、材质、颜色与比例，不改变 SKU 核心特征。",
        "platform": "{platformPrompt}",
        "params": "产品类型={productType}；场景类型={sceneType}；产品展示={productDisplay}；排版呈现={layoutStyle}；氛围营造={moodStyle}；价值导向={valueFocus}；目标市场={targetMarket}；文案语种={copyLanguage}。",
        "quality": "场景服务商品，不喧宾夺主；商品主体清晰可辨；透视、光影和材质必须真实；不得生成误导性功效场景或与售卖内容不一致的元素。",
        "outputSpec": "输出比例={ratio}；输出分辨率={resolution}；输出数量={count}。",
        "supplement": "补充要求：{supplement}"
      },
      "appendOptionExpansions": true,
      "optionExpansionMode": "detailed_prompt_first",
      "strictMode": {
        "enabled": true,
        "onMissingPlatformRule": "warn_and_fallback_to_universal_scene_rule",
        "onMissingCategoryRule": "error",
        "onUnknownParamValue": "error",
        "onPlatformSlotConflict": "error"
      }
    }
  }
}
```

## 5.1 平台规则缺失时的统一兜底

```json
{
  "universalSceneFallbackRule": {
    "prompt": "当前平台公开场景图规则不足，按跨平台保守场景图规则生成：场景图定位为附图/转化图位，商品主体清晰、结构真实、用途直观、背景服务商品，不使用夸张营销贴片、违规水印、虚假功效场景和与售卖内容不一致的道具。",
    "required": ["主体清晰", "结构真实", "用途直观", "背景克制"],
    "forbidden": ["替代白底首图", "虚假效果", "违规叠字水印", "过度道具干扰"]
  }
}
```

## 6. 可直接联调示例

输入：

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
  },
  "strict": true
}
```

输出（示例）：

```text
生成具有真实使用代入感、可用于电商转化图位的商品场景图。

当前商品品类为「家电数码类」，请保持该品类应有的真实结构、材质、颜色与比例，不改变 SKU 核心特征。

适配 TikTok Shop 官方附图规则：主图必须纯白背景并展示商品正面实体视图；当前场景图只用于 additional images，可展示使用场景、styled scenes、close ups 和 size/scale comparisons，但所有图片都必须真实准确表达售卖商品，且不能带 Logo、文字、边框、水印或覆盖图形。

用途限制：本次输出定位为附图/场景图位，不作为白底首图替代。

产品类型=蓝牙耳机；场景类型=产品场景；产品展示=使用中展示；排版呈现=留白极简；氛围营造=科技未来；价值导向=突出品质；目标市场=欧美市场；文案语种=英语。

搭建与商品用途强相关的真实使用场景，让商品看起来正在正确地被使用或陈列。体现商品正在被真实使用的状态，让功能和场景关系一眼可懂。通过留白制造高级感，减少无关元素，让商品边界和材质更突出。可加入科技感、未来感或空间感，但不应使用过度发光特效遮挡商品真实结构。强调材质、工艺、做工、结构细节和精致感，弱化低价促销感。表达偏自然、克制、空间感清晰，重视功能、品质和真实使用语境。若确需文字，应使用自然英文表达，避免中式直译、过长句和促销口号堆砌。

场景服务商品，不喧宾夺主；商品主体清晰可辨；透视、光影和材质必须真实；不得生成误导性功效场景或与售卖内容不一致的元素。

输出比例=1:1；输出分辨率=1K；输出数量=1。

补充要求：用于附图，不要叠字，不要水印，突出佩戴状态和耳机金属细节。
```

## 7. 组装实现要点（避免“只拼值文本”）

结论：

- 不能只拼 `field=value`。
- 场景图比买家秀更依赖“执行型描述”，因为同一个值可能对应完全不同的视觉落地。
- 必须在参数行后再拼 `valuePrompt` 扩展段。

建议伪代码：

```ts
const paramLine = `场景类型=${sceneType}；产品展示=${productDisplay}；排版呈现=${layoutStyle}；...`;

const expansionLines = selectedFields.flatMap(({ fieldKey, value }) => {
  const fieldConfig = optionValueExpansionsByTool[fieldKey];
  if (!fieldConfig) return [];
  const hit = fieldConfig.values[value];
  if (!hit) throw new Error(`unknown value: ${fieldKey}=${value}`);
  return [hit.valuePrompt];
});

finalPrompt = [
  taskPrompt,
  categoryPrompt,
  platformPrompt,
  slotAdvicePrompt,
  paramLine,
  expansionLines.join(" "),
  qualityPrompt,
  outputSpecPrompt,
  supplementPrompt
].filter(Boolean).join("\n\n");
```

## 8. 三个关键能力的提示词配置（完整可用）

### 8.1 图片识别获取信息（Image Understanding / Extraction）

用途：

- 识别品类与场景图相关字段线索；
- 输出结构化 JSON，供字段回填和后续提示词组装使用。

推荐提示词：

```text
你是一位电商商品图理解专家。请根据输入商品图，提取“一键场景图生成”所需信息，并严格输出 JSON。

任务要求：
1) 识别商品所属品类（用于 productCategory）。
2) 基于图像线索，预测场景图字段推荐值：
   productType, sceneType, productDisplay, layoutStyle, moodStyle, valueFocus, targetMarket, copyLanguage。
3) 所有推荐值必须从给定 options 中选择；若无法判断，返回空语义值或最保守值。
4) 不输出解释文字，不输出 Markdown，仅输出 JSON。

输出 JSON Schema：
{
  "category": {
    "categoryId": "string",
    "categoryLabel": "服饰类|鞋靴类|箱包类|珠宝饰品类|美妆个护类|食品饮料类|家居百货类|家电数码类|家具大件类|母婴玩具类|宠物用品类|汽配五金类|通用品类",
    "confidence": "number(0-1)",
    "keywords": ["string"]
  },
  "recommendedFields": {
    "productType": "string",
    "sceneType": "string",
    "productDisplay": "string",
    "layoutStyle": "string",
    "moodStyle": "string",
    "valueFocus": "string",
    "targetMarket": "string",
    "copyLanguage": "string"
  },
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}

判定规则：
- 若识别置信度 < 0.70，categoryLabel 输出“通用品类”，并将 "productType" 设为“智能识别”。
- 若某字段无可靠依据，将该字段加入 needsUserConfirm。
```

### 8.2 AI 帮写（Advanced Fields Auto-fill）

用途：

- 在用户点击“AI帮写”时，回填高级设置字段；
- 仅输出字段键值，不输出额外解释。

推荐提示词：

```text
你是一位电商场景图策划师。请根据商品图识别结果与平台信息，回填 goods-scene 的高级设置字段。

必须遵守：
1) 仅返回以下字段：productType, sceneType, productDisplay, layoutStyle, moodStyle, valueFocus, targetMarket, copyLanguage。
2) 能确认的字段必须从提供的 options 中选取一个值。
3) 无法确认的字段不要编造，不要猜测，直接留空字符串 ""，并把字段名加入 needsUserConfirm。
4) productType 回填后，必须基于 productTypeToCategoryMap 推导并回填 productCategory；若冲突按映射结果覆盖并标记 needsUserConfirm。
5) 若 platformLabel 未提供，不得自行猜平台；只输出场景字段。
6) 只输出 JSON，不要输出解释。

输出格式：
{
  "fieldValues": {
    "productCategory": "string",
    "productType": "string",
    "sceneType": "string",
    "productDisplay": "string",
    "layoutStyle": "string",
    "moodStyle": "string",
    "valueFocus": "string",
    "targetMarket": "string",
    "copyLanguage": "string"
  },
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}
```

### 8.3 文本润色（Supplement Polish）

用途：

- 对用户补充说明进行语义增强；
- 生成可执行、约束清晰、适合场景图模型的补充文本。

推荐提示词（对应 `goods-scene`）：

```text
你是一位电商场景图文案润色专家。请将用户的补充说明优化为“可执行的图像生成约束”，并保持原意。

润色目标：
1) 强化场景服务商品、主体可识别、光影真实和用途一致。
2) 避免空泛词，改成可执行描述（构图、氛围、光线、道具限制、主次关系）。
3) 不新增与用户意图冲突的内容。
4) 若用户未明确说明首图/附图用途，不要主动改写；若已明确“用于附图”，需保留该用途限制。
5) 输出一段最终可直接拼进提示词的文本。

输出要求：
- 仅输出润色后的文本，不要解释。
- 80~220 字为宜。
- 不得包含违规词、夸张功效或误导性承诺。
```

默认润色指令（可与上面组合）：

```text
优化场景图细节补充，强调场景搭建、氛围、光线、主体展示和代入感。
```

## 9. 本次平台规则的公开来源与证据等级

检索时间：`2026-05-01`

- `A 类`
  - Amazon Seller Forums / image requirements 与 additional images 讨论
  - TikTok Shop Academy / Product Listing Policy
- `B 类`
  - 小红书开放平台 / Create SPL ITEM
  - Alibaba Seller Central / Uploading effective product pictures and videos
  - Ozon Seller Media / Как самому сделать фото для маркетплейсов
- `C 类`
  - 淘宝、天猫、京东、拼多多、1688、抖音电商、快手电商、Temu、速卖通、Shopee、SHEIN 当前公开统一规则页不足，先使用保守规则，后续建议补商家后台截图核验

来源链接：

- Amazon: https://sellercentral.amazon.com/seller-forums/discussions/t/d7c65ebc-1224-484d-814e-f2588f761a3d
- Amazon: https://sellercentral.amazon.com/seller-forums/discussions/t/ad3ce8a7a9607e1611a9120e64dbde2c
- TikTok Shop: https://seller-us.tiktok.com/university/essay?default_language=en&identity=1&knowledge_id=3196690250417921
- 小红书开放平台: https://school.xiaohongshu.com/en/open/product/create-spl-item.html
- Alibaba Seller Central: https://seller.alibaba.com/learningcenter/content/detail/PXJTD6WM.htm
- Ozon Seller Media: https://seller.ozon.ru/media/interviews/kak-samomu-sdelat-foto-dlya-marketplejsov/

## 10. 最终结论

1. `goods-scene` 当前真实代码已具备场景字段回填链路，但还没有平台字段输入，这个需要补。
2. 平台规则必须存在，但要明确“场景图默认是附图/转化图位，不是统一首图”。
3. 场景图的高级选项值需要做 `valuePrompt` 扩展；否则只拼字段值，模型很容易偏题。
4. 品类规则必须单独配置，因为同样的“产品场景”对家电数码、服饰、食品和家具的执行完全不同。
