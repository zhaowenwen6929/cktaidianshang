# AI商品图-goods-retouch（产品精修）提示词与配置方案

> 目标：基于“功能 + 平台 + 品类 + 高级选项值 + 真实代码链路”生成合规、正确、可上架的产品精修图。  
> 适用：开发直接落地（配置驱动提示词组装）。  
> 更新时间：2026-05-01

## 1. 页面真实流程与字段（Source of Truth）

### 1.1 当前代码里的真实流程

1. 上传商品图（`upload-main`，最多 24 张）。
2. 选择创作模式（`creation-mode`：普通/高级，影响比例、分辨率、数量）。
3. 选择模式（`mode-choice`：原图精修 / 提取主体精修）。
4. 填写补充说明（`supplement`，可选）。
5. 点击生成。

对应代码配置（`src/App.tsx`）：

- `toolKey = "goods-retouch"`
- `creationModeConfigKey = "retouch"`
- `sectionOrder = ["upload-main", "mode-choice", "creation-mode", "supplement"]`
- `advancedSettings.fields = ["platform", "region"]`
- `advancedSettings.platformIds = ["taobao", "tmall", "jd", "pdd", "amazon", "temu", "tiktok-shop", "shopee", "other"]`
- `uploads.main.maxCount = 24`
- `advancedAiAssistPromptConfigs["goods-retouch"]`
- `supplementAiPolishConfigs["goods-retouch"]`

### 1.2 代码里当前真正进入生成载荷的字段

```ts
type GeneratePayload = {
  generateCost: number;
  outputCount: number;
  sourceUploads: UploadItem[];
  referenceUploads?: UploadItem[];
  videoUploads?: UploadItem[];
  advancedSelections: AdvancedSelectionMap;
  supplementValue: string;
  creationModeSelection: CreationModeSelection | null;
};
```

`goods-retouch` 实际会进入任务快照的字段：

- `mainUploads`
- `referenceUploads`
- `videoUploads`
- `advancedSelections`
- `supplementValue`
- `creationModeSelection`

### 1.3 当前代码的关键断点

- `goods-retouch` 声明了 `platform/region`，但当前 `sectionOrder` 没有渲染 `advanced-settings`。
- `RetouchModeSection` 只在本地 `useState` 保存 `retouchMode/extractMode/customSubject`，没有写回 `advancedSelections`。
- 因此当前页面里这些值不会进入最终生成载荷，属于“界面有意图，数据未接通”状态。

### 1.4 建议补齐的隐形识别链路

```json
{
  "visionInput": {
    "productCategory": "string",
    "productMaterial": "string",
    "productSurface": "string",
    "edgeQuality": "string",
    "reflectionType": "string",
    "backgroundState": "string",
    "mainSubjectType": "string",
    "skuIntegrity": "string"
  },
  "assistOutput": {
    "platform": "string",
    "region": "string",
    "retouchMode": "original | extract",
    "extractMode": "smart | custom",
    "customSubject": "string",
    "productCategory": "string"
  }
}
```

## 2. 产品精修的统一提示词骨架

```text
任务目标：对上传商品图进行商业级精修，提升质感与可上架性。
商品信息：保持商品真实结构，不改变SKU关键特征。
平台配置：电商平台={platform}；地区={region}。
品类配置：当前商品品类为「{productCategory}」。
精修要求：优化边缘净度、光影层次、材质表现与整体清晰度，避免过度修图痕迹。
输出规格：比例={ratio}；分辨率={resolution}；数量={count}。
补充要求：{supplement}
```

## 3. 平台提示词配置（16 平台）

说明：

- `ruleLevel` 参考 `docs/商品白底图-16平台最新规范与品类补充.md`
- 产品精修默认按“主图级安全标准”执行
- 公开规则不完整的平台，统一回退到“真实、干净、不过修、无误导”的安全基线

```json
{
  "platformRetouchRules": {
    "全平台通用（16平台）": {
      "ruleLevel": "A",
      "prompt": "产品精修应保留真实商品结构、材质和颜色，不新增误导性元素，不使用夸张商业特效，成图必须可直接用于电商上架。",
      "forbidden": ["改变SKU核心结构", "虚假重绘", "过度磨皮", "水印/Logo/边框/贴纸"],
      "required": ["主体完整", "边缘干净", "材质真实", "适合上架"]
    },
    "淘宝": {
      "ruleLevel": "C",
      "prompt": "适配淘宝商品展示习惯，精修要让商品主体更清晰、边缘更干净、质感更好，但不要做过强氛围化处理。",
      "forbidden": ["失真锐化", "过多装饰", "商品被风格化掩盖"],
      "required": ["主体可识别", "视觉干净", "真实材质"]
    },
    "天猫": {
      "ruleLevel": "C",
      "prompt": "适配天猫品牌化展示，精修强调高级感、整洁度和材质层次，画面要克制、精致、可信。",
      "forbidden": ["低质噪点", "脏背景感", "过度滤镜"],
      "required": ["品牌感", "整洁", "质感统一"]
    },
    "京东": {
      "ruleLevel": "C",
      "prompt": "适配京东标准商品展示，重点突出结构、材质和可验证细节，修图不能夸大商品效果。",
      "forbidden": ["夸张效果", "结构失真", "过修导致不可信"],
      "required": ["结构清晰", "材质真实", "可验证"]
    },
    "拼多多": {
      "ruleLevel": "C",
      "prompt": "适配拼多多高效率浏览，精修目标是快速识别、主体突出、画面直接，不要做复杂视觉包装。",
      "forbidden": ["复杂背景", "过度艺术化", "主体不突出"],
      "required": ["识别效率", "主体优先", "直接可用"]
    },
    "1688": {
      "ruleLevel": "C",
      "prompt": "适配1688商采场景，精修更强调规格感、材质感和生产/应用可信度，避免消费级过度美化。",
      "forbidden": ["过度时尚化", "忽略规格信息", "虚假质感"],
      "required": ["规格可信", "材质真实", "商采适配"]
    },
    "抖音电商": {
      "ruleLevel": "C",
      "prompt": "适配抖音电商内容浏览，精修可保留一定抓拍感，但必须保证商品主体清晰可辨、不过度后期。",
      "forbidden": ["滤镜过重", "主体模糊", "虚假使用感"],
      "required": ["停留感", "清晰度", "真实感"]
    },
    "快手电商": {
      "ruleLevel": "C",
      "prompt": "适配快手电商内容氛围，精修要真实自然、主体明确、细节可信，不要过度精致化。",
      "forbidden": ["娱乐化抢主体", "过度磨皮", "视觉失真"],
      "required": ["真实表达", "主体清楚", "自然修饰"]
    },
    "小红书电商": {
      "ruleLevel": "B",
      "prompt": "适配小红书种草语境，精修要在审美与真实之间平衡，保留材质和生活感，避免硬广和失真。",
      "forbidden": ["硬广感", "过度磨皮", "材质被抹平"],
      "required": ["审美统一", "真实体验", "精致但可信"]
    },
    "亚马逊": {
      "ruleLevel": "A",
      "prompt": "适配亚马逊商品主图/附图要求，精修要严格保持商品真实外观、完整结构和纯净画面，禁止任何误导性改动。",
      "forbidden": ["文字/Logo/边框", "夸张投影", "结构篡改"],
      "required": ["真实外观", "完整结构", "纯净画面"]
    },
    "Temu": {
      "ruleLevel": "C",
      "prompt": "适配Temu快节奏浏览，精修要让商品尽快被识别，画面简洁、真实、干净。",
      "forbidden": ["视觉噪声", "复杂装饰", "过修"],
      "required": ["识别优先", "简洁", "真实"]
    },
    "TikTok Shop": {
      "ruleLevel": "A",
      "prompt": "适配TikTok Shop主图逻辑，精修必须保证商品真实、清晰、主体突出，严格避免误导性修图。",
      "forbidden": ["虚假渲染", "Logo/文字/边框", "失真主体"],
      "required": ["真实准确", "主体正面", "清晰可识别"]
    },
    "阿里国际站": {
      "ruleLevel": "B",
      "prompt": "适配B2B国际买家判断路径，精修强调品质感、规格感与真实应用，不做情绪化包装。",
      "forbidden": ["情绪化摆拍", "失真美化", "规格感缺失"],
      "required": ["品质可信", "规格明确", "应用真实"]
    },
    "速卖通": {
      "ruleLevel": "C",
      "prompt": "适配速卖通跨境零售场景，精修突出商品真实感、可识别度和清晰细节，不夸张演绎。",
      "forbidden": ["夸张对比", "主体残缺", "虚假修饰"],
      "required": ["真实反馈", "商品完整", "画面清晰"]
    },
    "Shopee": {
      "ruleLevel": "C",
      "prompt": "适配Shopee东南亚浏览习惯，精修保持简洁、清楚、真实，避免复杂构图影响识别。",
      "forbidden": ["复杂拼贴", "主体被吞没", "过强装饰"],
      "required": ["直观可辨", "真实", "简洁"]
    },
    "OZON": {
      "ruleLevel": "B",
      "prompt": "适配OZON商品展示语境，精修强调真实使用感、细节和干净背景，避免夸张锐化。",
      "forbidden": ["过度锐化", "失真重绘", "复杂干扰元素"],
      "required": ["真实细节", "主体清晰", "背景干净"]
    },
    "SHEIN": {
      "ruleLevel": "C",
      "prompt": "适配SHEIN时尚零售语境，精修要兼顾穿搭审美与真实面料表现，避免过度修身或虚假质感。",
      "forbidden": ["面料纹理丢失", "虚假体型修饰", "过度商业化"],
      "required": ["真实面料", "版型可信", "风格统一"]
    }
  }
}
```

## 4. 品类提示词配置（12 类）

> 这里的品类不是“视觉风格分类”，而是产品精修时要额外保护的真实属性。

```json
{
  "categoryRetouchRules": {
    "服饰类": {
      "prompt": "重点保留版型、垂感、走线、面料纹理和真实褶皱，避免把衣料修成塑料感。",
      "forbidden": ["过度收腰", "虚假拉伸", "面料纹理丢失"]
    },
    "鞋靴类": {
      "prompt": "重点保留鞋型、鞋面材质、鞋底结构和缝线细节，避免鞋型变形。",
      "forbidden": ["鞋楦变形", "鞋底结构错误", "材质被抹平"]
    },
    "箱包类": {
      "prompt": "重点保留包型、五金、拉链、缝线和立体结构，避免包身被修成软塌失真。",
      "forbidden": ["包型塌陷", "五金消失", "结构失真"]
    },
    "珠宝饰品类": {
      "prompt": "重点保留金属光泽、宝石通透感、镶嵌结构和尺寸比例，避免把饰品修成廉价塑料感。",
      "forbidden": ["金属发灰", "宝石失真", "细节丢失"]
    },
    "美妆个护类": {
      "prompt": "重点保留瓶器材质、包装字形、液体通透感和高光质感，避免标签文字被修糊。",
      "forbidden": ["包装变形", "文字模糊", "材质不真实"]
    },
    "食品饮料类": {
      "prompt": "重点保留真实颜色、食材质地、液体状态和新鲜感，避免把食品修成过饱和假图。",
      "forbidden": ["颜色失真", "过度美化", "食材质感丢失"]
    },
    "家居百货类": {
      "prompt": "重点保留轮廓、表面纹理、接缝和实用性细节，避免把日用品修成装饰品。",
      "forbidden": ["功能细节缺失", "表面过度光滑", "比例错误"]
    },
    "家电数码类": {
      "prompt": "重点保留边缘锐度、材质分区、按键/接口和屏幕反光，避免高科技部件被糊掉。",
      "forbidden": ["接口错误", "屏幕失真", "结构模糊"]
    },
    "家具大件类": {
      "prompt": "重点保留体量、结构比例、材质纹理与拼接关系，避免家具变轻飘或比例失真。",
      "forbidden": ["比例失真", "结构错位", "材质丢失"]
    },
    "母婴玩具类": {
      "prompt": "重点保留安全感、材质柔和度、边角圆润度和真实尺寸，避免过度锐化和恐怖感。",
      "forbidden": ["边角过锐", "尺度失真", "材质生硬"]
    },
    "宠物用品类": {
      "prompt": "重点保留耐用感、易清洁感、结构细节和材质真实度，避免把产品修得太脆弱。",
      "forbidden": ["结构失真", "材质虚化", "功能感缺失"]
    },
    "汽配五金类": {
      "prompt": "重点保留结构精度、孔位、边缘、金属反光和装配逻辑，避免零件关系被修错。",
      "forbidden": ["孔位错误", "结构变形", "金属质感丢失"]
    }
  }
}
```

## 5. 高级选项值扩展提示词配置

### 5.1 需要扩展的值

| 字段 | 是否建议扩展 | 说明 |
| --- | --- | --- |
| `platform` | 是 | 不同平台对“主图纯净度、可识别度、真实感”权重不同。 |
| `region` | 是 | 跨境地区会影响光感、展示习惯和合规程度。 |
| `modeId` | 否 | 只影响生成强度，不改变语义。 |
| `ratio` | 否 | 只影响画幅，不建议写成长提示词。 |
| `resolution` | 否 | 只影响清晰度，做参数传递即可。 |
| `count` | 否 | 只影响出图数量，不建议写进主提示词。 |
| `retouchMode` | 是 | 原图精修和提取主体精修的目标不同。 |
| `extractMode` | 是 | 智能提取和自定义主体的执行方式不同。 |
| `customSubject` | 是 | 复杂构图时必须显式写入约束。 |

### 5.2 平台值扩展文案

```json
{
  "platformValuePrompt": {
    "淘宝": "适合淘宝商品浏览，保持主体清晰、真实、不过度修饰。",
    "天猫": "适合天猫品牌化展示，精致但克制，强调质感与整洁。",
    "京东": "适合京东标准商品展示，结构和材质要真实可信。",
    "拼多多": "适合拼多多高效率浏览，主体突出、信息直接。",
    "1688": "适合1688商采场景，规格感与材质可信度优先。",
    "抖音电商": "适合抖音电商内容流，真实感和停留感要兼顾。",
    "快手电商": "适合快手电商内容氛围，真实自然，不要过修。",
    "小红书电商": "适合小红书种草语境，审美在线但必须真实。",
    "亚马逊": "适合亚马逊主图标准，必须真实、干净、不可误导。",
    "Temu": "适合Temu快节奏流量场景，简洁、清楚、快速识别。",
    "TikTok Shop": "适合TikTok Shop主图要求，真实准确、主体正面、无误导。",
    "阿里国际站": "适合B2B国际买家判断，品质和规格可信优先。",
    "速卖通": "适合跨境零售展示，清晰、真实、不过度演绎。",
    "Shopee": "适合Shopee东南亚浏览习惯，简洁、直观、真实。",
    "OZON": "适合OZON商品展示，真实细节和干净背景优先。",
    "SHEIN": "适合SHEIN时尚零售语境，真实面料和版型可信优先。"
  }
}
```

### 5.3 地区值扩展文案

```json
{
  "regionValuePrompt": {
    "美国": "强调英语市场的清晰识别和真实展示。",
    "欧洲": "强调中性、克制、通用的商品表达。",
    "日本": "强调精致、干净、规整的画面控制。",
    "东南亚": "强调明快、直接、易识别的商品呈现。",
    "中国大陆": "强调主流电商审美下的清晰与可信。",
    "中国台湾": "强调繁体语境下的自然和易读。",
    "英国": "强调克制、真实、标准化展示。"
  }
}
```

### 5.4 模式值扩展文案

```json
{
  "retouchModeValuePrompt": {
    "original": "原图精修：保留原构图和主体，重点优化边缘、光影、材质和清晰度。",
    "extract": "提取主体精修：先锁定主商品主体，再进行商业级精修，输出更干净的主体图。"
  },
  "extractModeValuePrompt": {
    "smart": "智能提取主体：自动识别主商品，适合标准商品图。",
    "custom": "自定义主体：按用户说明保留指定主体范围，适合复杂构图。"
  }
}
```

## 6. 不同精修方式的完整提示词

### 6.1 原图精修

```text
任务目标：对上传商品图进行商业级原图精修，提升质感与可上架性。
商品信息：保留原始构图与主体位置，不改变SKU核心结构。
平台配置：电商平台={platform}；地区={region}。
品类配置：当前商品品类为「{productCategory}」。
精修要求：优化边缘净度、光影层次、材质表现与整体清晰度，避免过度修图痕迹。
原图策略：不重新构图，不新增主体，不替换商品视角。
输出规格：比例={ratio}；分辨率={resolution}；数量={count}。
补充要求：{supplement}
```

### 6.2 提取主体精修 - 智能提取主体

```text
任务目标：先自动提取主商品主体，再进行商业级精修，输出更干净、更适合上架的主体图。
商品信息：保持商品真实结构，不改变SKU关键特征。
平台配置：电商平台={platform}；地区={region}。
品类配置：当前商品品类为「{productCategory}」。
主体策略：自动识别主商品主体，剔除干扰背景与无关元素。
精修要求：优化边缘净度、光影层次、材质表现与整体清晰度，避免过度修图痕迹。
输出规格：比例={ratio}；分辨率={resolution}；数量={count}。
补充要求：{supplement}
```

### 6.3 提取主体精修 - 自定义主体

```text
任务目标：按指定主体范围提取商品主体，再进行商业级精修，确保保留用户要求的核心区域。
商品信息：保持商品真实结构，不改变SKU关键特征。
平台配置：电商平台={platform}；地区={region}。
品类配置：当前商品品类为「{productCategory}」。
主体策略：仅保留指定主体范围「{customSubject}」，其余无关区域可移除。
精修要求：优化边缘净度、光影层次、材质表现与整体清晰度，避免过度修图痕迹。
输出规格：比例={ratio}；分辨率={resolution}；数量={count}。
补充要求：{supplement}
```

## 7. AI 辅助识别与补充说明润色

### 7.1 当前代码里的 AI 辅助提示词

```text
你是一位商品精修顾问。请根据商品图片判断更适合的电商平台与地区站点，仅回填当前高级设置中的平台、地区字段；不要补充无关内容。若判断不出则留空。
```

### 7.2 建议升级版 AI 辅助提示词

```text
你是一位商品精修顾问。请根据商品图片先识别商品品类、主体类型、材质、边缘质量、背景状态和平台适配倾向，再回填当前高级设置中的平台、地区字段；若功能已接通模式字段，也请同步判断原图精修或提取主体精修更合适。所有字段仅从当前可选项中挑选，无法确认则留空，不要补充无关内容。
```

### 7.3 当前代码里的补充说明润色

```text
优化产品精修补充说明，强调材质、边缘、光感、质感和商业修图效果。
```

### 7.4 建议升级版补充说明润色

```text
优化产品精修补充说明，使其更可执行，并优先覆盖边缘净度、材质层次、真实光影、清晰度、背景净化和是否允许轻微重构构图。
```

## 8. 最终配置样板

```json
{
  "toolKey": "goods-retouch",
  "creationModeConfigKey": "retouch",
  "sectionOrder": ["upload-main", "mode-choice", "creation-mode", "supplement"],
  "advancedSettings": {
    "title": "高级设置",
    "fields": ["platform", "region"],
    "platformIds": ["taobao", "tmall", "jd", "pdd", "amazon", "temu", "tiktok-shop", "shopee", "other"]
  },
  "recognition": {
    "infer": ["productCategory", "productMaterial", "platform", "region", "retouchMode", "extractMode"],
    "fallback": ["productCategory=通用品类", "platform=全平台通用（16平台）"]
  },
  "promptOrder": [
    "task",
    "category",
    "platform",
    "mode",
    "quality",
    "supplement"
  ]
}
```

## 9. 结论

- `goods-retouch` 的正确目标不是“把图修得更好看”，而是“把图修成可上架、可审核、可跨平台复用”。
- 当前代码的核心缺口是：`platform/region` 和 `mode-choice` 没有真正进入生成载荷。
- 如果要真正对齐买家秀级别的配置能力，建议先把“隐形识别 -> 字段回填 -> prompt 拼接”链路接通，再补品类和平台扩展。
