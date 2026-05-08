# AI商品图-一键买家秀-提示词与配置方案（功能级样板）

> 目标：基于“功能+平台+品类+高级选项值”生成合规且正确的买家秀图片。  
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

- `toolKey`: `goods-buyer`
- `creationModeConfigKey`: `spoke`
- `sectionOrder`: `["upload-main","creation-mode","advanced-settings","supplement","upload-reference"]`
- `uploads.main.maxCount`: `24`
- `uploads.reference.maxCount`: `1`
- `advancedAiAssistPromptConfigs["goods-buyer"]`：AI回填高级字段
- `supplementAiPolishConfigs["goods-buyer"]`：补充说明润色

## 1.1.1 端到端使用流程（建议落地）

1. 用户上传商品图（`upload-main`，最多24张）。
2. 系统执行图片理解与商品信息提取（见 1.4），输出品类与商品线索。
3. 用户选择或确认平台（`platformLabel`）。
4. 系统触发 AI Assist 回填买家秀高级字段（可人工覆盖）。
5. 用户可上传 1 张参考图（`upload-reference`，可选）。
6. 用户选择创作模式参数（`modeId` / `ratio` / `resolution` / `count`）。
7. 用户填写补充说明（可选，可走 AI 润色）。
8. 系统按 strict 规则组装最终提示词并提交生成。
9. 返回结果后，用户可继续调参二次生成。

## 1.2 高级设置字段与可选值（真实）

```json
{
  "advancedFields": {
    "productType": ["智能识别", "服装", "T恤", "背包", "鞋子", "小家电", "电视", "沙发", "吊灯", "化妆品", "香水", "水果", "饮料", "汽车", "集装箱", "蓝牙耳机", "手机", "行李箱", "文具", "机械设备", "项链", "玩具", "瑜伽服", "健身器材", "笔记本电脑", "手办"],
    "productState": ["完整快递箱", "产品与配件自然陈列", "新品未拆封", "产品自然摆放场景", "安装场景", "使用状态", "穿戴状态", "长期使用状态"],
    "presentationStyle": ["主体展示", "细节局部拍摄", "自然摆放", "手持拍摄", "穿戴拍摄", "对镜子自拍", "使用中拍摄", "日常物品大小对比"],
    "sceneAtmosphere": ["无场景", "居家场景", "局部或模糊场景", "车内场景", "移动运动场景", "日常外出场景", "节日场景"],
    "productReality": ["包装与产品褶皱", "长期使用磨损", "使用中的真实"],
    "environmentReality": ["杂乱环境", "宠物偶然入镜", "人物局部入镜", "临时摆放随意感", "人物素颜", "人物日常穿搭"],
    "shotReality": ["随手拍摄无美感", "较低像素", "手抖模糊", "反光逆光", "对镜自拍", "手持自拍"],
    "targetMarket": ["大陆", "北美", "韩国", "日本", "俄罗斯", "中东阿拉伯", "港澳", "中国台湾", "土耳其", "南美", "澳洲", "东南亚", "印度", "非洲", "英国", "德国", "法国", "欧洲", "东欧"]
  }
}
```

## 1.4 上传图片识别与商品信息提取（关键环节）

## 1.4.1 目标

- 从上传图中提取“买家秀生成所需的商品信息”；
- 为高级字段回填与提示词组装提供结构化输入；
- 减少用户手动配置成本，提升首轮可用率。

## 1.4.2 识别输入

```json
{
  "imageUrl": "上传图片地址",
  "title": "商品标题（可选）",
  "toolKey": "goods-buyer"
}
```

## 1.4.3 识别输出（建议结构）

```json
{
  "category": {
    "categoryId": "fashion-knitwear",
    "categoryLabel": "服饰类",
    "confidence": 0.96,
    "keywords": ["针织纹理", "上衣版型", "罗纹领口", "袖口结构"]
  },
  "productSignals": {
    "detectedProductType": "服装",
    "detectedStateHints": ["穿戴状态", "产品自然摆放场景"],
    "detectedSceneHints": ["居家场景"],
    "detectedRealityHints": ["包装与产品褶皱", "使用中的真实"],
    "detectedShotHints": ["手持自拍"],
    "detectedMarketHints": ["大陆"]
  }
}
```

## 1.4.4 识别到字段回填映射

```json
{
  "category.categoryLabel": "productCategory",
  "productSignals.detectedProductType[0]": "productType",
  "productSignals.detectedStateHints[0]": "productState",
  "productSignals.detectedSceneHints[0]": "sceneAtmosphere",
  "productSignals.detectedRealityHints[0]": "productReality",
  "productSignals.detectedShotHints[0]": "shotReality",
  "productSignals.detectedMarketHints[0]": "targetMarket"
}
```

## 1.4.5 回填策略（strict 推荐）

- 命中字段值必须在该字段 `options` 内；
- 若识别值不在 options 内或识别不足：该字段回填空字符串 `""`，并加入 `needsUserConfirm`；
- `productCategory` 未命中统一12类时：回填 `通用品类` 并强制人工确认；
- 所有自动回填字段都允许用户手动覆盖。

## 1.4.6 失败兜底

- 识别失败时不阻塞流程；
- 最小可用集：
  - `productCategory=通用品类`
  - `productType=智能识别`
  - 其余字段保持用户可选未填状态
- 进入“人工确认优先”路径再生成。

## 1.3 平台与品类输入字段（本功能）

```json
{
  "platformField": "platformLabel",
  "platformOptions": ["全平台通用（16平台）", "淘宝", "天猫", "京东", "拼多多", "1688", "抖音电商", "快手电商", "小红书电商", "亚马逊", "Temu", "TikTok Shop", "阿里国际站", "速卖通", "Shopee", "OZON", "SHEIN"],
  "categoryField": "productCategory",
  "categoryOptions": ["服饰类", "鞋靴类", "箱包类", "珠宝饰品类", "美妆个护类", "食品饮料类", "家居百货类", "家电数码类", "家具大件类", "母婴玩具类", "宠物用品类", "汽配五金类"]
}
```

## 2. 平台提示词配置（买家秀专属 JSON）

说明：

- 本配置是“买家秀功能专属”平台规则，不复用白底图主图规则。
- `ruleLevel` 含义：
  - `A`: 官方明确或高一致性约束
  - `B`: 官方间接+行业稳定约束
  - `C`: 需后台复核，先按安全策略执行

```json
{
  "platformRulesByTool": {
    "全平台通用（16平台）": {
      "ruleLevel": "A",
      "prompt": "买家秀图应以真实生活感为核心，商品主体清晰可辨，不做夸张商业特效，不制造误导性使用场景。",
      "forbidden": ["虚假功效演绎", "不实对比", "过度修图导致商品失真", "违规水印/联系方式"],
      "required": ["真实感", "商品可识别", "场景与用途一致"]
    },
    "淘宝": {
      "ruleLevel": "B",
      "prompt": "适配淘宝买家秀浏览习惯，强调真实用户视角和生活化场景，商品识别优先，避免牛皮癣式文案堆叠。",
      "forbidden": ["主主体被遮挡", "过密营销贴片", "明显虚假摆拍"],
      "required": ["真实生活感", "商品完整展示", "信息干净"]
    },
    "天猫": {
      "ruleLevel": "B",
      "prompt": "适配天猫品牌感买家秀呈现，在真实生活感基础上保持质感与整洁度，避免低质噪点和过强滤镜。",
      "forbidden": ["过度滤镜", "主体失真", "脏乱背景抢主体"],
      "required": ["质感真实", "主体清楚", "风格克制"]
    },
    "京东": {
      "ruleLevel": "B",
      "prompt": "适配京东商品展示逻辑，买家秀应真实可信，重点突出商品结构、材质和使用状态，不夸大效果。",
      "forbidden": ["夸张效果对比", "商品结构被遮挡"],
      "required": ["可识别", "结构清晰", "真实使用感"]
    },
    "拼多多": {
      "ruleLevel": "B",
      "prompt": "适配拼多多高效率浏览场景，买家秀需真实、直接、主体突出，避免复杂背景导致识别降低。",
      "forbidden": ["复杂背景抢主体", "虚假低价暗示图层"],
      "required": ["识别效率", "真实场景", "主体优先"]
    },
    "1688": {
      "ruleLevel": "B",
      "prompt": "适配1688商采场景，买家秀应更强调真实使用状态和产品耐用感，不做夸张生活方式包装。",
      "forbidden": ["过度时尚化弱化商品", "虚假规格暗示"],
      "required": ["使用可信", "结构明确", "材质真实"]
    },
    "抖音电商": {
      "ruleLevel": "B",
      "prompt": "适配抖音电商内容浏览习惯，买家秀应有真实抓拍感但保持主体可识别，避免过重后期痕迹。",
      "forbidden": ["滤镜过重", "主体模糊不可辨"],
      "required": ["停留感", "真实性", "识别清晰"]
    },
    "快手电商": {
      "ruleLevel": "B",
      "prompt": "适配快手电商内容氛围，强调真实用户感和可信体验，商品主体始终是视觉中心。",
      "forbidden": ["娱乐化抢主体", "低清导致识别失败"],
      "required": ["真实表达", "主体清楚", "场景自然"]
    },
    "小红书电商": {
      "ruleLevel": "B",
      "prompt": "适配小红书种草语境，买家秀要有生活审美与真实体验并存，避免硬广感和失真磨皮。",
      "forbidden": ["硬广堆砌", "过度磨皮", "不真实肤质/材质"],
      "required": ["种草感", "真实体验", "审美统一"]
    },
    "亚马逊": {
      "ruleLevel": "B",
      "prompt": "适配跨境买家内容消费习惯，买家秀须真实、清晰、用途明确，不制造误导性功效场景。",
      "forbidden": ["误导性功效展示", "侵权水印元素"],
      "required": ["用途明确", "主体可辨", "真实可信"]
    },
    "Temu": {
      "ruleLevel": "B",
      "prompt": "适配Temu快节奏流量场景，买家秀强调真实反馈感与商品识别效率，避免无关复杂背景。",
      "forbidden": ["无关道具遮挡", "过度视觉噪声"],
      "required": ["识别效率", "真实反馈", "简洁场景"]
    },
    "TikTok Shop": {
      "ruleLevel": "B",
      "prompt": "适配TikTok Shop内容化电商语境，买家秀应具自然拍摄感与真实使用状态，避免过度商业修饰。",
      "forbidden": ["过强广告感", "虚假使用演绎"],
      "required": ["真实互动", "主体突出", "场景可信"]
    },
    "阿里国际站": {
      "ruleLevel": "B",
      "prompt": "适配B2B国际买家判断路径，买家秀强调真实应用和品质感，避免只做情绪化摆拍。",
      "forbidden": ["只重氛围不见商品", "规格感缺失"],
      "required": ["应用真实性", "品质可信", "主体清晰"]
    },
    "速卖通": {
      "ruleLevel": "B",
      "prompt": "适配速卖通跨境零售场景，买家秀突出真实使用反馈与商品可识别，不夸张演绎。",
      "forbidden": ["夸张前后对比", "主体不完整"],
      "required": ["反馈真实", "商品完整", "画面清晰"]
    },
    "Shopee": {
      "ruleLevel": "B",
      "prompt": "适配Shopee东南亚用户浏览习惯，买家秀重真实与直观，避免复杂构图影响识别。",
      "forbidden": ["复杂拼贴", "主体被背景吞没"],
      "required": ["直观可辨", "真实生活化", "信息简洁"]
    },
    "OZON": {
      "ruleLevel": "B",
      "prompt": "适配OZON商品展示语境，买家秀强调真实使用与商品细节，不使用夸张修图。",
      "forbidden": ["过度锐化", "失真重绘"],
      "required": ["真实细节", "主体清晰", "场景一致"]
    },
    "SHEIN": {
      "ruleLevel": "B",
      "prompt": "适配SHEIN时尚零售语境，买家秀兼顾穿搭审美与真实上身效果，避免虚假体型修饰。",
      "forbidden": ["极端身形修改", "面料纹理丢失"],
      "required": ["上身真实", "版型可信", "风格统一"]
    }
  }
}
```

## 2.1 `ruleLevel` 多规则使用逻辑（同一平台存在多条规则时）

适用场景：一个平台可能同时命中多条规则（基础规则、活动规则、渠道规则、风控规则）。

### 2.1.1 规则定位

- `ruleLevel=A`：高优先级硬约束（官方明确或高一致性约束），不可被低级规则覆盖。
- `ruleLevel=B`：常规约束（官方间接+行业稳定约束），可被 A 覆盖。
- `ruleLevel=C`：补充约束（待复核或策略性补充），可被 A/B 覆盖，且可在 token 紧张时优先裁剪。

### 2.1.2 组装顺序（强制）

1. 合并所有命中规则的 `required`（去重后全部保留）。
2. 合并所有命中规则的 `forbidden`（去重后全部保留）。
3. `prompt` 按优先级拼接：`A -> B -> C`。
4. 若提示词长度超限，仅从低优先级描述裁剪：先裁 `C.prompt`，再裁 `B.prompt`；`A.prompt`、`required`、`forbidden` 不裁。

### 2.1.3 冲突处理（强制）

- 若高低级规则存在冲突，按优先级覆盖：`A > B > C`。
- 冲突判定建议以“语义键”维度进行（例如 `真实性`、`主体完整`、`背景复杂度`），同语义仅保留最高等级版本。

### 2.1.4 落地伪代码

```ts
type RuleLevel = "A" | "B" | "C";
type PlatformRule = {
  ruleLevel: RuleLevel;
  prompt?: string;
  required?: string[];
  forbidden?: string[];
};

const levelWeight: Record<RuleLevel, number> = { A: 3, B: 2, C: 1 };

function mergePlatformRules(rules: PlatformRule[]) {
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

  return { required, forbidden, promptsByLevel };
}
```

### 2.1.5 最终拼接建议

```text
平台硬性要求（A层）：{A层prompt合并}
平台常规要求（B层）：{B层prompt合并}
平台补充要求（C层）：{C层prompt合并，可裁剪}
平台必须满足：{required合并}
平台禁止事项：{forbidden合并}
```

## 3. 品类提示词配置（买家秀专属 JSON）

```json
{
  "categoryRulesByTool": {
    "服饰类": {
      "prompt": "重点体现上身/平铺真实状态，保持版型、垂感、面料纹理与褶皱逻辑，避免过度磨皮和轮廓重塑。"
    },
    "鞋靴类": {
      "prompt": "体现真实穿着或摆放状态，保持鞋型、鞋底结构和成对关系，避免镜像错误和鞋口塌陷。"
    },
    "箱包类": {
      "prompt": "体现真实通勤/出行使用感，保持包体立体结构、五金细节和肩带受力状态。"
    },
    "珠宝饰品类": {
      "prompt": "体现日常佩戴真实感，保留高光与细节，避免磨皮导致金属/宝石质感损失。"
    },
    "美妆个护类": {
      "prompt": "体现真实使用或摆放状态，包装文案可辨，瓶身结构和材质反光自然。"
    },
    "食品饮料类": {
      "prompt": "体现真实消费场景但不伪造效果，包装信息保持可读，避免夸张食欲特效。"
    },
    "家居百货类": {
      "prompt": "体现真实家居使用状态，保持结构比例和配件完整，避免摆拍感过强。"
    },
    "家电数码类": {
      "prompt": "体现真实使用痕迹与场景，接口按键结构清晰，避免过度发光特效。"
    },
    "家具大件类": {
      "prompt": "体现真实空间比例和使用关系，保持透视正确，避免家具尺度失真。"
    },
    "母婴玩具类": {
      "prompt": "体现安全、真实、日常使用感，组件完整，不使用夸张危险姿态。"
    },
    "宠物用品类": {
      "prompt": "体现真实宠物使用或摆放状态，材质和耐用感可信，避免过度拟人化。"
    },
    "汽配五金类": {
      "prompt": "体现真实安装/使用语义，保持孔位与结构准确，避免虚构功能效果。"
    }
  }
}
```

## 3.1 `productType` 与 `productCategory` 拉齐映射（强制）

目标：

- 保证 AI 帮写回填时 `productType` 不会脱离 `productCategory`；
- 保证细分类一定能映射命中对应品类提示词（`categoryRulesByTool`）。

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

### 3.1.1 校验与兜底规则

- 若用户/AI 传入 `productType` 未命中映射表：将 `productCategory` 置为 `通用品类`，并加入 `needsUserConfirm=["productType","productCategory"]`。
- 若 `productType` 映射出的 `category` 与当前 `productCategory` 不一致：以 `productType` 映射结果为准覆盖 `productCategory`，并加入 `needsUserConfirm=["productCategory"]`。
- 若 `productType="智能识别"`：不强行覆盖用户已选品类；当用户未选品类时回填 `通用品类`。

### 3.1.2 提示词组装顺序（与映射联动）

1. 平台规则（platform）  
2. 一级品类规则（`productCategory -> categoryRulesByTool`）  
3. 二级细分类增强（`productType` 自身语义）  
4. 高级选项值扩展（`valuePrompt`）  
5. 补充说明（supplement）

说明：`productType` 是增强层，不可替代 `productCategory` 的规则锚点。

## 4. 高级选项值扩展提示词配置（买家秀专属 JSON）

说明：

- 每个选项值都明确所属 `fieldKey`。
- 每个字段补充 `name`（清晰中文字段名）用于页面展示与人工校准。
- 已按代码中该功能可选值补全（不缺项）。
- 组装时应优先使用 `valuePrompt`（详细提示词），不是只拼接值文本。

```json
{
  "optionValueExpansionsByTool": {
    "productState": {
      "fieldKey": "productState",
      "name": "产品状态",
      "values": {
        "完整快递箱": { "valuePrompt": "表现开箱前真实状态，包装完整且物流信息不过度突出。" },
        "产品与配件自然陈列": { "valuePrompt": "产品与配件摆放自然，不做夸张整齐商业摆拍。" },
        "新品未拆封": { "valuePrompt": "保持新品完整感，封签与包装状态真实。" },
        "产品自然摆放场景": { "valuePrompt": "自然陈列，重在真实生活使用语义，不做硬广构图。" },
        "安装场景": { "valuePrompt": "展示安装中或安装后的真实状态，结构关系合理。" },
        "使用状态": { "valuePrompt": "体现真实使用过程，允许轻微动态痕迹但主体清晰。" },
        "穿戴状态": { "valuePrompt": "体现真实穿戴效果与轮廓关系，避免夸张体型修饰。" },
        "长期使用状态": { "valuePrompt": "允许轻微使用痕迹，但主体必须清晰可辨。" }
      }
    },
    "presentationStyle": {
      "fieldKey": "presentationStyle",
      "name": "呈现方式",
      "values": {
        "主体展示": { "valuePrompt": "主体居于视觉中心，画面简洁直观。" },
        "细节局部拍摄": { "valuePrompt": "局部特写要有明确焦点，不出现无意义模糊。" },
        "自然摆放": { "valuePrompt": "以自然放置方式表达真实使用感，避免刻意摆拍。" },
        "手持拍摄": { "valuePrompt": "体现手持抓拍感，主体仍需处于视觉中心。" },
        "穿戴拍摄": { "valuePrompt": "体现真实穿戴状态，保持比例与版型可信。" },
        "对镜子自拍": { "valuePrompt": "保留自拍视角真实感，但镜面反射不应遮挡主体。" },
        "使用中拍摄": { "valuePrompt": "强调使用动作的真实瞬间，商品关键部位可识别。" },
        "日常物品大小对比": { "valuePrompt": "通过自然参照物体现尺寸感，避免误导性比例。"}
      }
    },
    "sceneAtmosphere": {
      "fieldKey": "sceneAtmosphere",
      "name": "场景氛围",
      "values": {
        "无场景": { "valuePrompt": "保持简洁背景，避免杂乱元素干扰主体。" },
        "居家场景": { "valuePrompt": "生活化居家环境，光线自然，避免棚拍感过重。" },
        "局部或模糊场景": { "valuePrompt": "背景弱化处理但主体清晰，模糊程度可控。" },
        "车内场景": { "valuePrompt": "车内元素仅作语义补充，不遮挡商品主体。" },
        "移动运动场景": { "valuePrompt": "允许轻微动感，但主体识别优先，避免整体模糊。" },
        "日常外出场景": { "valuePrompt": "体现日常通勤/出行语境，画面真实自然。" },
        "节日场景": { "valuePrompt": "节日元素克制点缀，避免喧宾夺主。" }
      }
    },
    "productReality": {
      "fieldKey": "productReality",
      "name": "产品真实感",
      "values": {
        "包装与产品褶皱": { "valuePrompt": "保留轻微自然褶皱和真实接触痕迹，不要抹平。" },
        "长期使用磨损": { "valuePrompt": "磨损表现需合理克制，不得影响商品识别。" },
        "使用中的真实": { "valuePrompt": "体现动态使用痕迹但不破坏主体完整性。" }
      }
    },
    "environmentReality": {
      "fieldKey": "environmentReality",
      "name": "环境真实感",
      "values": {
        "杂乱环境": { "valuePrompt": "杂乱应受控，主体边界清晰，不产生脏乱观感。" },
        "宠物偶然入镜": { "valuePrompt": "宠物仅作陪衬，不遮挡商品主体。" },
        "人物局部入镜": { "valuePrompt": "局部人体应自然且不抢商品视觉中心。" },
        "临时摆放随意感": { "valuePrompt": "保留临时摆放感，但主体仍需构图稳定可辨。" },
        "人物素颜": { "valuePrompt": "保持自然肤质与生活状态，不做过度美颜修饰。" },
        "人物日常穿搭": { "valuePrompt": "穿搭应生活化并服务商品表达，不抢主体。"}
      }
    },
    "shotReality": {
      "fieldKey": "shotReality",
      "name": "拍摄真实感",
      "values": {
        "随手拍摄无美感": { "valuePrompt": "保留随手拍真实感，但主体信息完整可读。" },
        "较低像素": { "valuePrompt": "允许轻微颗粒感，但主体轮廓与关键细节仍需可识别。" },
        "手抖模糊": { "valuePrompt": "仅允许轻微动态模糊，禁止整体糊片。" },
        "反光逆光": { "valuePrompt": "逆光可保留氛围，但商品关键区域不能过曝或死黑。" },
        "对镜自拍": { "valuePrompt": "保留镜像自拍语义，主体不要被反光遮挡。" },
        "手持自拍": { "valuePrompt": "强化真实自拍视角，主体保持在可识别范围。"}
      }
    },
    "targetMarket": {
      "fieldKey": "targetMarket",
      "name": "目标市场",
      "values": {
        "大陆": { "valuePrompt": "表达偏生活化直观，强调真实体验和转化效率。" },
        "北美": { "valuePrompt": "表达偏简洁直接，强调功能与体验可信。" },
        "韩国": { "valuePrompt": "表达偏清爽审美与细节质感，画面克制干净。" },
        "日本": { "valuePrompt": "表达偏克制干净，强调细节与秩序感。" },
        "俄罗斯": { "valuePrompt": "表达强调主体完整与质感可信，避免过度修饰。" },
        "中东阿拉伯": { "valuePrompt": "表达注重质感与完整度，避免不合语境元素。" },
        "港澳": { "valuePrompt": "表达偏精致简洁，强调商品本身质感。" },
        "中国台湾": { "valuePrompt": "表达偏生活感与清新审美并重。" },
        "土耳其": { "valuePrompt": "表达偏真实与色彩平衡，避免过度滤镜。" },
        "南美": { "valuePrompt": "表达可适度活力，但主体识别优先。" },
        "澳洲": { "valuePrompt": "表达偏自然光和真实生活场景。" },
        "东南亚": { "valuePrompt": "表达偏明快直观，主体清晰可辨。" },
        "印度": { "valuePrompt": "表达强调真实使用语义和信息可读性。" },
        "非洲": { "valuePrompt": "表达注重真实材质和主体完整展示。" },
        "英国": { "valuePrompt": "表达偏克制与实用，强调真实可信。" },
        "德国": { "valuePrompt": "表达偏理性清晰，强调结构和品质感。" },
        "法国": { "valuePrompt": "表达兼顾审美与真实，避免过度商业化。" },
        "欧洲": { "valuePrompt": "表达偏简洁质感，主体清晰和体验可信。" },
        "东欧": { "valuePrompt": "表达注重真实可读和商品完整展示。"}
      }
    }
  }
}
```

## 5. 最终组装模板与规则（JSON）

```json
{
  "builderByTool": {
    "goods-buyer": {
      "requiredFields": ["toolKey", "platformLabel", "productCategory", "productType", "productState", "presentationStyle", "sceneAtmosphere", "productReality", "environmentReality", "shotReality", "targetMarket"],
      "promptTemplates": {
        "task": "生成真实自然、生活化的买家秀风格商品图。",
        "category": "当前商品品类为「{productCategory}」，请保持该品类应有的真实结构、材质、颜色与比例，不改变SKU核心特征。",
        "platform": "{platformPrompt}",
        "params": "产品类型={productType}；产品状态={productState}；呈现方式={presentationStyle}；场景氛围={sceneAtmosphere}；产品真实感={productReality}；环境真实感={environmentReality}；拍摄真实感={shotReality}；目标市场={targetMarket}。",
        "quality": "保持真实生活感，避免过度广告化与过度滤镜，商品主体识别优先。",
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
  "toolKey": "goods-buyer",
  "platformLabel": "淘宝",
  "productCategory": "服饰类",
  "params": {
    "productType": "服装",
    "productState": "穿戴状态",
    "presentationStyle": "对镜子自拍",
    "sceneAtmosphere": "居家场景",
    "productReality": "包装与产品褶皱",
    "environmentReality": "人物日常穿搭",
    "shotReality": "手持自拍",
    "targetMarket": "大陆",
    "ratio": "3:4",
    "resolution": "1K",
    "count": "1",
    "supplement": "强调米色针织纹理和自然褶皱，避免磨皮。"
  },
  "strict": true
}
```

输出（示例）：

```text
生成真实自然、生活化的买家秀风格商品图。

当前商品品类为「服饰类」，请保持该品类应有的真实结构、材质、颜色与比例，不改变SKU核心特征。

适配淘宝买家秀浏览习惯，强调真实用户视角和生活化场景，商品识别优先，避免牛皮癣式文案堆叠。

产品类型=服装；产品状态=穿戴状态；呈现方式=对镜子自拍；场景氛围=居家场景；产品真实感=包装与产品褶皱；环境真实感=人物日常穿搭；拍摄真实感=手持自拍；目标市场=大陆。

体现手持抓拍感，主体仍需处于视觉中心。保留轻微自然褶皱和真实接触痕迹，不要抹平。生活化居家环境，光线自然，避免棚拍感过重。

保持真实生活感，避免过度广告化与过度滤镜，商品主体识别优先。

输出比例=3:4；输出分辨率=1K；输出数量=1。

补充要求：强调米色针织纹理和自然褶皱，避免磨皮。
```

本示例命中的“选项值扩展提示词”（用于 `appendOptionExpansions=true`）：

```json
[
  {
    "fieldKey": "productState",
    "name": "产品状态",
    "value": "穿戴状态",
    "valuePrompt": "体现真实穿戴效果与轮廓关系，避免夸张体型修饰。"
  },
  {
    "fieldKey": "presentationStyle",
    "name": "呈现方式",
    "value": "对镜子自拍",
    "valuePrompt": "保留自拍视角真实感，但镜面反射不应遮挡主体。"
  },
  {
    "fieldKey": "sceneAtmosphere",
    "name": "场景氛围",
    "value": "居家场景",
    "valuePrompt": "生活化居家环境，光线自然，避免棚拍感过重。"
  },
  {
    "fieldKey": "productReality",
    "name": "产品真实感",
    "value": "包装与产品褶皱",
    "valuePrompt": "保留轻微自然褶皱和真实接触痕迹，不要抹平。"
  },
  {
    "fieldKey": "environmentReality",
    "name": "环境真实感",
    "value": "人物日常穿搭",
    "valuePrompt": "穿搭应生活化并服务商品表达，不抢主体。"
  },
  {
    "fieldKey": "shotReality",
    "name": "拍摄真实感",
    "value": "手持自拍",
    "valuePrompt": "强化真实自拍视角，主体保持在可识别范围。"
  },
  {
    "fieldKey": "targetMarket",
    "name": "目标市场",
    "value": "大陆",
    "valuePrompt": "表达偏生活化直观，强调真实体验和转化效率。"
  }
]
```

扩展段拼接结果（示例）：

```text
体现真实穿戴效果与轮廓关系，避免夸张体型修饰。保留自拍视角真实感，但镜面反射不应遮挡主体。生活化居家环境，光线自然，避免棚拍感过重。保留轻微自然褶皱和真实接触痕迹，不要抹平。穿搭应生活化并服务商品表达，不抢主体。强化真实自拍视角，主体保持在可识别范围。表达偏生活化直观，强调真实体验和转化效率。
```

## 7. 组装实现要点（避免“只拼值文本”）

结论：

- 不能只拼 `field=value`。
- 应该在拼完参数值后，再拼对应 `valuePrompt` 扩展段。
- 若 `optionExpansionMode = detailed_prompt_first`，则扩展段优先作为约束文本参与生成。

建议伪代码：

```ts
const paramLine = `产品状态=${productState}；呈现方式=${presentationStyle}；...`;

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
  paramLine,
  expansionLines.join(" "),
  qualityPrompt,
  outputSpecPrompt,
  supplementPrompt
].filter(Boolean).join("\n\n");
```

## 8. 三个关键能力的提示词配置（完整可用）

以下 3 组提示词可直接用于后端/服务编排。

### 8.1 图片识别获取信息（Image Understanding / Extraction）

用途：

- 识别品类与买家秀相关字段线索；
- 输出结构化 JSON，供字段回填和后续提示词组装使用。

推荐提示词：

```text
你是一位电商商品图理解专家。请根据输入商品图，提取“买家秀生成”所需信息，并严格输出 JSON。

任务要求：
1) 识别商品所属品类（用于 productCategory）。
2) 基于图像线索，预测买家秀字段推荐值：
   productType, productState, presentationStyle, sceneAtmosphere, productReality, environmentReality, shotReality, targetMarket。
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
    "productState": "string",
    "presentationStyle": "string",
    "sceneAtmosphere": "string",
    "productReality": "string",
    "environmentReality": "string",
    "shotReality": "string",
    "targetMarket": "string"
  },
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}

判定规则：
- 若识别置信度 < 0.70，categoryLabel 输出“通用品类”，并将 "productType" 设为“智能识别”。
- 若某字段无可靠依据，将该字段加入 needsUserConfirm。
```

建议输入参数：

```json
{
  "toolKey": "goods-buyer",
  "imageUrl": "string",
  "title": "string(optional)",
  "options": {
    "productType": ["智能识别", "服装", "T恤", "背包", "鞋子", "小家电", "电视", "沙发", "吊灯", "化妆品", "香水", "水果", "饮料", "汽车", "集装箱", "蓝牙耳机", "手机", "行李箱", "文具", "机械设备", "项链", "玩具", "瑜伽服", "健身器材", "笔记本电脑", "手办"],
    "productState": ["完整快递箱", "产品与配件自然陈列", "新品未拆封", "产品自然摆放场景", "安装场景", "使用状态", "穿戴状态", "长期使用状态"],
    "presentationStyle": ["主体展示", "细节局部拍摄", "自然摆放", "手持拍摄", "穿戴拍摄", "对镜子自拍", "使用中拍摄", "日常物品大小对比"],
    "sceneAtmosphere": ["无场景", "居家场景", "局部或模糊场景", "车内场景", "移动运动场景", "日常外出场景", "节日场景"],
    "productReality": ["包装与产品褶皱", "长期使用磨损", "使用中的真实"],
    "environmentReality": ["杂乱环境", "宠物偶然入镜", "人物局部入镜", "临时摆放随意感", "人物素颜", "人物日常穿搭"],
    "shotReality": ["随手拍摄无美感", "较低像素", "手抖模糊", "反光逆光", "对镜自拍", "手持自拍"],
    "targetMarket": ["大陆", "北美", "韩国", "日本", "俄罗斯", "中东阿拉伯", "港澳", "中国台湾", "土耳其", "南美", "澳洲", "东南亚", "印度", "非洲", "英国", "德国", "法国", "欧洲", "东欧"]
  }
}
```

### 8.2 AI帮写（Advanced Fields Auto-fill）

用途：

- 在用户点击“AI帮写”时，回填高级设置字段；
- 仅输出字段键值，不输出额外解释。

推荐提示词：

```text
你是一位买家秀策划师。请根据商品图识别结果与平台信息，回填 goods-buyer 的高级设置字段。

必须遵守：
1) 仅返回以下字段：productType, productState, presentationStyle, sceneAtmosphere, productReality, environmentReality, shotReality, targetMarket。
2) 能确认的字段必须从提供的 options 中选取一个值。
3) 无法确认的字段不要编造，不要猜测，直接留空字符串 ""，并把字段名加入 needsUserConfirm。
4) productType 回填后，必须基于 productTypeToCategoryMap 推导并回填 productCategory；若冲突按映射结果覆盖并标记 needsUserConfirm。
5) 只输出 JSON，不要输出解释。

输出格式：
{
  "fieldValues": {
    "productCategory": "string",
    "productType": "string",
    "productState": "string",
    "presentationStyle": "string",
    "sceneAtmosphere": "string",
    "productReality": "string",
    "environmentReality": "string",
    "shotReality": "string",
    "targetMarket": "string"
  },
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}
```

回填策略（强制）：

- 先回填 `productType`，再通过 `productTypeToCategoryMap` 推导 `productCategory`，保证两者拉齐。
- 对于识别充分的字段：写入明确值。
- 对于识别不足的字段：写 `""`，并加入 `needsUserConfirm`。
- 后端接收后仅自动回填“非空值”；空值字段保持待用户输入状态。

### 8.3 文本润色（Supplement Polish）

用途：

- 对用户补充说明进行语义增强；
- 生成可执行、约束清晰、适合买家秀模型的补充文本。

推荐提示词（对应 `goods-buyer`）：

```text
你是一位电商买家秀文案润色专家。请将用户的补充说明优化为“可执行的图像生成约束”，并保持原意。

润色目标：
1) 强化真实生活感、自然场景和主体可识别性。
2) 避免空泛词，改成可执行描述（构图、光线、细节、约束）。
3) 不新增与用户意图冲突的内容。
4) 输出一段最终可直接拼进提示词的文本。

输出要求：
- 仅输出润色后的文本，不要解释。
- 80~220字为宜。
- 不得包含违规词、夸张功效或误导性承诺。
```

默认润色指令（可与上面组合）：

```text
优化买家秀补充说明，强调真实生活感、主体使用场景、自然氛围和转化感。
```
