# AI商品图-一键细节图-提示词与配置方案（功能级样板）

> 目标：基于“功能 + 平台 + 品类 + 高级选项值”生成合规且正确的细节图图片。  
> 适用：开发直接落地（配置驱动提示词组装）。  
> 更新时间：2026-05-01

## 1. 页面真实流程与字段（Source of Truth）

## 1.1 使用流程（真实）

1. 上传商品图（`upload-main`）
2. 选择创作模式（`creation-mode`：普通/高级/中文增强，比例、分辨率、数量）
3. 配置高级设置（`advanced-settings`）
4. 填写补充说明（`supplement`，可选）
5. 上传参考图（`upload-reference`，可选）
6. 生成

对应代码配置（`src/App.tsx`）：

- `toolKey`: `goods-detail`
- `creationModeConfigKey`: `spoke`
- `sectionOrder`: `["upload-main","creation-mode","advanced-settings","supplement","upload-reference"]`
- `uploads.main.maxCount`: `24`
- `uploads.reference.maxCount`: `1`
- `supplementPlaceholderOverrides["goods-detail"]`: `请输入您对图片的细节补充描述，例如：色调、构图、氛围等。`
- `advancedAiAssistPromptConfigs["goods-detail"]`：存在配置
- `supplementAiPolishConfigs["goods-detail"]`：存在配置

## 1.1.1 真实业务链路（按当前代码）

1. 用户上传商品图，主图最多 24 张，参考图最多 1 张。
2. 页面收集创作模式参数：`modeId / ratio / resolution / count`。
3. 页面收集高级设置字段：`productType / displayType`。
4. 页面收集补充说明：`supplementValue`。
5. 提交生成时，页面将以下结构写入任务快照（`TaskRecord.snapshot`）：
   - `mainUploads`
   - `referenceUploads`
   - `advancedSelections`
   - `supplementValue`
   - `creationModeSelection`
6. 结果任务状态按 `queued -> generating -> completed` 流转。
7. 右侧创作记录点击后，会按快照恢复上述输入。

## 1.1.2 一个必须写清楚的现状差异

- `goods-detail` 配置了 `advancedAiAssistPromptConfigs["goods-detail"]`，但当前页面 `advancedSettings.showAiAssist = false`。
- 这意味着：
  - 代码里已经定义了“AI 回填高级字段”的提示词；
  - 但当前前端页面默认不展示 `AI帮写` 入口；
  - 因此“真实页面流程”里目前是手动选择高级字段，不是用户可见的自动回填流程。

## 1.1.3 端到端建议落地流程（推荐）

1. 用户上传商品图（`upload-main`，最多 24 张）。
2. 系统执行图片理解与商品信息提取，输出 `productCategory`、`productType` 和可能的 `displayType` 候选。
3. 用户选择或确认平台（`platformLabel`）。
4. 若后续打开 `AI帮写`，则回填 `productType / displayType`，否则保持手动选择。
5. 用户可上传 1 张参考图（`upload-reference`，可选）。
6. 用户选择创作模式参数（`modeId / ratio / resolution / count`）。
7. 用户填写补充说明（可选，可走 AI 润色）。
8. 系统按 strict 规则组装最终提示词并提交生成。
9. 返回结果后，用户可继续调参二次生成。

## 1.2 高级设置字段与可选值（真实）

```json
{
  "advancedFields": {
    "productType": ["智能识别", "服装", "T恤", "背包", "鞋子", "小家电", "电视", "沙发", "吊灯", "化妆品", "香水", "水果", "饮料", "汽车", "集装箱", "蓝牙耳机", "手机", "行李箱", "文具", "机械设备", "项链", "玩具", "瑜伽服", "健身器材", "笔记本电脑", "手办"],
    "displayType": ["单细节展示", "多细节拼接展示", "细节 + 功能关联", "细节 + 材质对比", "细节 + 使用痕迹"]
  }
}
```

说明：

- 当前 `goods-detail` 高级面板只有两个字段：`productType`、`displayType`。
- `platformLabel` 和 `productCategory` 不是这个页面高级设置面板里的字段，但它们是最终提示词组装时必须补入的上下文字段。
- 也就是说，细节图最终提示词不能只依赖页面现有两个字段，必须叠加平台规则和品类规则。

## 1.3 平台与品类输入字段（本功能）

```json
{
  "platformField": "platformLabel",
  "platformOptions": ["全平台通用（16平台）", "淘宝", "天猫", "京东", "拼多多", "1688", "抖音电商", "快手电商", "小红书电商", "亚马逊", "Temu", "TikTok Shop", "阿里国际站", "速卖通", "Shopee", "OZON", "SHEIN"],
  "categoryField": "productCategory",
  "categoryOptions": ["服饰类", "鞋靴类", "箱包类", "珠宝饰品类", "美妆个护类", "食品饮料类", "家居百货类", "家电数码类", "家具大件类", "母婴玩具类", "宠物用品类", "汽配五金类"]
}
```

说明：

- `platformLabel` 建议由页面外层平台选择器、统一商品图平台上下文或服务端入参提供。
- `productCategory` 建议由图片识别或商品类目识别服务写回，作为细节图一级品类规则锚点。
- `productType` 是更细颗粒度的商品类型，用于补足“看哪里、放大什么、避免什么错误”。

## 1.4 上传图片识别与商品信息提取（关键环节）

## 1.4.1 目标

- 从上传图中提取“细节图生成所需的商品信息”；
- 为高级字段回填与提示词组装提供结构化输入；
- 减少用户手动配置成本，提升首轮可用率。

## 1.4.2 识别输入

```json
{
  "imageUrl": "上传图片地址",
  "title": "商品标题（可选）",
  "toolKey": "goods-detail"
}
```

## 1.4.3 识别输出（建议结构）

```json
{
  "category": {
    "categoryId": "digital-audio",
    "categoryLabel": "家电数码类",
    "confidence": 0.96,
    "keywords": ["充电触点", "耳帽结构", "金属边框", "开合转轴"]
  },
  "productSignals": {
    "detectedProductType": "蓝牙耳机",
    "detectedDisplayHints": ["单细节展示", "细节 + 功能关联"],
    "detectedFocusAreas": ["耳机腔体", "充电仓铰链", "触控区域"],
    "detectedTextureHints": ["金属高光", "磨砂塑料", "细缝结构"]
  }
}
```

## 1.4.4 识别到字段回填映射

```json
{
  "category.categoryLabel": "productCategory",
  "productSignals.detectedProductType": "productType",
  "productSignals.detectedDisplayHints[0]": "displayType"
}
```

## 1.4.5 回填策略（strict 推荐）

- 命中字段值必须在该字段 `options` 内。
- 若识别值不在 options 内或识别不足：该字段回填空字符串 `""`，并加入 `needsUserConfirm`。
- `productCategory` 未命中统一 12 类时：回填 `通用品类` 并强制人工确认。
- `productType` 命中但 `displayType` 无把握时：可只回填 `productType`，`displayType` 留空。
- 所有自动回填字段都允许用户手动覆盖。

## 1.4.6 失败兜底

- 识别失败时不阻塞流程。
- 最小可用集：
  - `productCategory=通用品类`
  - `productType=智能识别`
  - `displayType=单细节展示`
- 进入“人工确认优先”路径再生成。

## 2. 平台提示词配置（细节图专属 JSON）

说明：

- 本配置是“细节图功能专属”平台规则，不复用白底图主图规则，也不直接套卖点图的文案承载逻辑。
- 细节图的核心不是“卖文案”，而是“放大真实细节、材质、结构、工艺、局部功能”。
- `ruleLevel` 含义：
  - `A`: 官方明确或高一致性约束
  - `B`: 官方间接 + 行业稳定约束
  - `C`: 公开网页可见但仍需后台复核，先按安全策略执行
- 2026-05-01 公开检索结果里，能够直接支撑“细节图/详情图”规则的官方公开来源主要集中在 Amazon、TikTok Shop、小红书电商、OZON、阿里国际站；其余平台未检索到足够清晰的公开官方细节图专页，因此采用保守配置。

```json
{
  "platformRulesByTool": {
    "全平台通用（16平台）": {
      "ruleLevel": "A",
      "prompt": "细节图应以真实展示商品局部材质、结构、工艺和功能细节为核心，不改变 SKU，不虚构内部结构，不伪造额外零件，不制造误导性功效对比。允许适度构图设计，但主体局部必须清晰、可辨、可信。",
      "forbidden": ["虚构内部剖面", "错误结构重绘", "与实物不符的额外接口/纹理", "过度磨皮导致材质失真", "违规水印/联系方式", "大面积无关文字贴片"],
      "required": ["局部放大准确", "材质纹理清晰", "边缘干净", "局部与整体商品一致", "细节表达真实可信"]
    },
    "淘宝": {
      "ruleLevel": "C",
      "prompt": "适配淘宝商品详情浏览语境，细节图应强调看点直接、局部放大清楚、信息不过载，避免花哨拼贴抢走商品细节本身。",
      "forbidden": ["复杂拼贴导致细节难辨", "局部放大区域不明确", "夸张功效暗示"],
      "required": ["局部焦点清楚", "主体一致", "阅读效率高"]
    },
    "天猫": {
      "ruleLevel": "C",
      "prompt": "适配天猫品牌详情展示语境，细节图在突出局部工艺时需兼顾质感、秩序和品牌感，避免廉价放大镜式表达。",
      "forbidden": ["低质感放大框", "混乱标签堆叠", "细节区域脏乱"],
      "required": ["局部精致", "品牌感", "结构清爽"]
    },
    "京东": {
      "ruleLevel": "C",
      "prompt": "适配京东偏理性决策路径，细节图应更强调结构、材质、接口、按键、工艺和可验证的局部优势，不做空泛氛围渲染。",
      "forbidden": ["参数感缺失", "局部结构被遮挡", "夸张不可证性能演绎"],
      "required": ["结构清晰", "材质可信", "细节有证据感"]
    },
    "拼多多": {
      "ruleLevel": "C",
      "prompt": "适配拼多多快节奏浏览场景，细节图要确保用户一眼看懂放大的是什么，避免多块小图堆满导致信息拥堵。",
      "forbidden": ["多图过碎", "主体缩得过小", "放大位置无明确对应关系"],
      "required": ["看点直给", "局部明确", "识别效率高"]
    },
    "1688": {
      "ruleLevel": "C",
      "prompt": "适配 1688 商采语境，细节图应偏向材质、工艺、做工、耐用性和规格结构表达，减少情绪化包装。",
      "forbidden": ["只讲氛围不讲细节", "工艺位置不明确", "夸大工业强度"],
      "required": ["工艺清楚", "材质可信", "商采判断友好"]
    },
    "抖音电商": {
      "ruleLevel": "C",
      "prompt": "适配抖音电商内容流语境，细节图可以有更强视觉焦点，但局部特写仍需真实准确，避免特效抢走细节真实性。",
      "forbidden": ["过强特效覆盖局部", "局部被滤镜糊掉", "封面党式夸张细节"],
      "required": ["停留感", "局部清楚", "真实可信"]
    },
    "快手电商": {
      "ruleLevel": "C",
      "prompt": "适配快手电商直接转化语境，细节图应真实直观、重点明确，不做过度修饰和无关娱乐化拼贴。",
      "forbidden": ["无关贴纸", "细节区花哨遮挡", "低清放大"],
      "required": ["真实直给", "重点单一", "细节可辨"]
    },
    "小红书电商": {
      "ruleLevel": "B",
      "prompt": "适配小红书商品图尺寸与比例习惯，细节图在保持审美统一的同时，应保证局部焦点明确、材质高级感真实、图面干净，并优先兼容 1:1 与 3:4 比例，详情图宽度建议落在 750px 至 1242px 对应的布局语境内。",
      "forbidden": ["局部脏乱", "质感失真", "比例不友好导致重点裁切"],
      "required": ["审美统一", "比例兼容", "细节清晰"]
    },
    "亚马逊": {
      "ruleLevel": "A",
      "prompt": "适配亚马逊商品图库语境，细节图应作为补充图片而非主图使用，重点展示特征细节、材质、接口、尺寸或使用关联细节；必须真实准确，不伪造效果，不添加误导性图形、Logo 或水印，不让局部细节与实际售卖商品不一致。",
      "forbidden": ["把细节图伪装成主图规则外延", "误导性功能暗示", "水印/Logo/边框", "虚构局部结构"],
      "required": ["真实功能细节", "与实物一致", "补充理解商品而非替代主图"]
    },
    "Temu": {
      "ruleLevel": "C",
      "prompt": "适配 Temu 快节奏流量场景，细节图应以高识别度展示局部卖点，但不使用夸张假细节或过度后期质感。",
      "forbidden": ["假材质质感", "复杂无关背景", "夸张局部渲染"],
      "required": ["识别效率", "局部真实", "重点单一"]
    },
    "TikTok Shop": {
      "ruleLevel": "A",
      "prompt": "适配 TikTok Shop 商品图片规范，细节图可作为附图展示商品关键特征、近景特写或尺寸关联，但必须真实准确反映售卖商品，不添加 Logo、文字、水印、边框或其他无关图形，不用数字渲染占位图代替真实商品细节。",
      "forbidden": ["Logo/文字/水印/边框", "数字渲染占位图", "误导性近景夸张"],
      "required": ["真实反映商品", "关键细节清楚", "附图语义明确"]
    },
    "阿里国际站": {
      "ruleLevel": "B",
      "prompt": "适配阿里国际站国际买家判断路径，细节图应强调做工、材质、接口、部件和工业/商用品质感，帮助买家判断质量与规格可信度。",
      "forbidden": ["只做情绪化摆拍", "细节缺少产品对应关系", "工艺表达空泛"],
      "required": ["质量感", "工艺感", "B2B 判断友好"]
    },
    "速卖通": {
      "ruleLevel": "C",
      "prompt": "适配速卖通跨境零售语境，细节图应突出材质、结构与局部功能，保持清楚、直接、真实，不做夸张演绎。",
      "forbidden": ["夸张前后对比", "局部位置错误", "细节与实物不一致"],
      "required": ["直观清楚", "结构可信", "跨境理解友好"]
    },
    "Shopee": {
      "ruleLevel": "C",
      "prompt": "适配 Shopee 东南亚用户浏览语境，细节图应重直观和清楚，局部特写要明确、简洁，不让复杂构图影响识别。",
      "forbidden": ["复杂拼图", "局部过小", "背景抢主体"],
      "required": ["直观可辨", "信息简洁", "局部明确"]
    },
    "OZON": {
      "ruleLevel": "B",
      "prompt": "适配 OZON 商品展示语境，细节图应延续商品主体清晰、完整、居中的原则，局部放大区域真实可辨，背景建议白色或浅色中性语境，避免夸张修图。",
      "forbidden": ["夸张修图", "局部过度锐化", "背景复杂抢细节"],
      "required": ["主体清晰", "局部真实", "背景克制"]
    },
    "SHEIN": {
      "ruleLevel": "C",
      "prompt": "适配 SHEIN 时尚零售语境，细节图需兼顾穿搭审美和面料/工艺真实感，尤其要保留服饰、鞋包、配饰的真实纹理、走线和结构。",
      "forbidden": ["面料纹理磨没", "走线失真", "极端体型或结构修饰"],
      "required": ["纹理真实", "版型可信", "时尚但不失真"]
    }
  }
}
```

## 2.1 `ruleLevel` 多规则使用逻辑

1. 平台基础规则
2. 平台图片位规则（如主图 / 附图 / 详情图 / A+ 图）
3. 类目或品类特殊规则
4. 风控或内容审核规则

优先级：

- `A > B > C`
- 图片位规则优先于平台基础规则
- 品类特殊规则优先于平台通用规则

## 2.2 平台公开来源与当前可核验结论

| 平台 | 2026-05-01 可公开核验结论 | 来源级别 |
| --- | --- | --- |
| 亚马逊 | 主图白底是公开硬规则；附图可承担细节展示，但仍要求真实准确、不得误导 | A |
| TikTok Shop | 商品图片真实准确；附图可展示关键特征、近景特写、尺寸关联；不得加 Logo/文字/水印/边框 | A |
| 小红书电商 | 商品图支持 `1:1 / 3:4`；详情图宽度 `750px~1242px`；适合细节图按内容图语境适配 | B |
| OZON | 官方卖家内容明确建议白色或浅色中性背景、商品完整清楚 | B |
| 阿里国际站 | 官方卖家学院强调高质量商品图片对成交判断的重要性，可作为细节图品质约束依据 | B |
| 淘宝 / 天猫 / 京东 / 拼多多 / 1688 / 抖音电商 / 快手电商 / Temu / 速卖通 / Shopee / SHEIN | 未检索到足够清晰的公开官方“细节图专页规则”，按保守策略落为 C 级 | C |

## 3. 品类提示词配置（细节图专属 JSON）

```json
{
  "categoryRulesByTool": {
    "服饰类": {
      "prompt": "重点体现面料纹理、走线、领口袖口、版型边缘和褶皱逻辑，避免过度磨皮、布料糊掉或结构改写。"
    },
    "鞋靴类": {
      "prompt": "重点体现鞋面材质、鞋底纹路、鞋口、缝线、五金与鞋型轮廓，避免镜像错误和局部塌陷。"
    },
    "箱包类": {
      "prompt": "重点体现包体立体结构、皮纹、五金、拉链、包边和提手肩带连接关系，避免压扁或塌陷。"
    },
    "珠宝饰品类": {
      "prompt": "重点体现切工、镶嵌、链节、金属反光和边缘净度，避免高光炸掉或细链条丢失。"
    },
    "美妆个护类": {
      "prompt": "重点体现瓶身、盖体、泵头、喷嘴、标签、膏体或刷头等局部结构，包装文案与材质反光需真实。"
    },
    "食品饮料类": {
      "prompt": "重点体现包装材质、封口、瓶盖、纹理、净含量信息区和口味标识，不伪造开封流体效果。"
    },
    "家居百货类": {
      "prompt": "重点体现接缝、边角、容量结构、表面材质和组合件连接关系，避免比例失真和配件缺失。"
    },
    "家电数码类": {
      "prompt": "重点体现接口、按键、屏幕、腔体、网孔、转轴、线材和材质边界，避免虚构发光或端口。"
    },
    "家具大件类": {
      "prompt": "重点体现包边、木纹、皮纹、五金连接、脚座、扶手、抽屉轨道等工艺细节，透视必须稳定。"
    },
    "母婴玩具类": {
      "prompt": "重点体现软材质、绒面、关节、拼接、配件和安全相关细节，避免危险演绎和组件遗漏。"
    },
    "宠物用品类": {
      "prompt": "重点体现耐抓耐咬材质、缝合、绳结、扣具、窝垫结构和清洁细节，避免过度拟人化。"
    },
    "汽配五金类": {
      "prompt": "重点体现孔位、螺纹、棱边、焊点、涂层、开模线和安装结构，避免虚构接口和功能件。"
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

校验与兜底规则：

- 若 `productType` 未命中映射表：将 `productCategory` 置为 `通用品类`，并加入 `needsUserConfirm=["productType","productCategory"]`。
- 若 `productType` 映射出的 `category` 与当前 `productCategory` 不一致：以映射结果覆盖 `productCategory`，并加入 `needsUserConfirm=["productCategory"]`。
- 若 `productType="智能识别"`：不强行覆盖用户已选品类；用户未选时回填 `通用品类`。

## 4. 高级选项值扩展提示词配置（细节图专属 JSON）

结论：

- 需要扩展。
- 而且必须扩展，不建议只把 `productType=xxx`、`displayType=xxx` 原样拼进提示词。
- 原因：
  - `productType` 决定“该看哪些细节、哪些错误最危险”；
  - `displayType` 决定“画面结构怎么组织、局部与整体关系怎么表达”；
  - 如果不扩展，模型只知道“值名称”，不知道实际的局部约束。

```json
{
  "optionValueExpansionsByTool": {
    "productType": {
      "fieldKey": "productType",
      "name": "产品类型",
      "values": {
        "智能识别": { "valuePrompt": "先基于商品原图判断最值得放大的材质、结构或局部功能区域，若无法明确则优先做单一清晰特写。" },
        "服装": { "valuePrompt": "重点放大面料纹理、走线、领口袖口、纽扣拉链和褶皱逻辑，保持版型与布料垂感真实。" },
        "T恤": { "valuePrompt": "重点放大领口罗纹、袖口、下摆、印花边缘和面料织纹，避免棉感被磨没。" },
        "背包": { "valuePrompt": "重点放大皮纹/布纹、车线、拉链、扣具、提手和肩带连接位，保持包体立体感。" },
        "鞋子": { "valuePrompt": "重点放大鞋面材质、缝线、鞋底纹路、鞋口和后跟结构，避免左右脚结构错乱。" },
        "小家电": { "valuePrompt": "重点放大按键、接口、出风口/出水口、刻度、接缝和材质边界，避免虚构功能件。" },
        "电视": { "valuePrompt": "重点放大边框、底座、接口、遥控器相关细节和屏幕边缘结构，避免屏幕比例失真。" },
        "沙发": { "valuePrompt": "重点放大车线、皮纹/布纹、包边、扶手转角和脚座连接位，体现做工和体积感。" },
        "吊灯": { "valuePrompt": "重点放大灯罩材质、金属件、连接件、吊线和表面工艺，避免结构悬挂关系错误。" },
        "化妆品": { "valuePrompt": "重点放大瓶盖、泵头、标签、膏体/刷头和瓶身材质反光，包装信息保持真实。" },
        "香水": { "valuePrompt": "重点放大玻璃通透感、喷头、瓶盖、刻字和液体边界，避免高光炸白或玻璃糊边。" },
        "水果": { "valuePrompt": "重点放大果皮纹理、果蒂、切面纤维和新鲜质感，但不得伪造与实物不符的成熟状态。" },
        "饮料": { "valuePrompt": "重点放大瓶盖、拉环、标签、液体色泽和包装材质，避免伪造飞溅或夸张冰感。" },
        "汽车": { "valuePrompt": "重点放大车灯、轮毂、缝隙、漆面反光、内饰按键或局部结构，保持工业精度。" },
        "集装箱": { "valuePrompt": "重点放大焊点、铰链、锁扣、板材纹理和工业涂层，保持比例与结构真实。" },
        "蓝牙耳机": { "valuePrompt": "重点放大耳机腔体、耳帽、充电触点、转轴、网孔和材质边界，避免增加不存在的接口。" },
        "手机": { "valuePrompt": "重点放大摄像头模组、边框、按键、接口和玻璃/金属过渡，避免镜头结构改写。" },
        "行李箱": { "valuePrompt": "重点放大拉链、轮子、拉杆、包角和箱体纹理，体现耐用与做工，避免箱体塌陷。" },
        "文具": { "valuePrompt": "重点放大笔尖、翻页、装订、夹具、表面纹理和局部功能位，保持尺寸逻辑真实。" },
        "机械设备": { "valuePrompt": "重点放大齿轮、接头、孔位、焊接、面板和金属表面工艺，避免虚构零部件。" },
        "项链": { "valuePrompt": "重点放大链节、扣头、镶嵌、吊坠边缘和金属反光，防止细链丢失或扭曲。" },
        "玩具": { "valuePrompt": "重点放大关节、拼接、表面涂装和材质细节，保持造型完整，避免配件缺失。" },
        "瑜伽服": { "valuePrompt": "重点放大弹力面料、拼接线、罩杯/腰线结构和亲肤纹理，避免修成塑料质感。" },
        "健身器材": { "valuePrompt": "重点放大握把、防滑纹、关节、刻度、连接件和金属涂层，体现结构可靠性。" },
        "笔记本电脑": { "valuePrompt": "重点放大转轴、键盘、接口、边框和机身厚薄过渡，避免键位和端口错误。" },
        "手办": { "valuePrompt": "重点放大涂装、接缝、发丝/衣褶、底座和细小配件，避免面部与原型失真。" }
      }
    },
    "displayType": {
      "fieldKey": "displayType",
      "name": "展示形式",
      "values": {
        "单细节展示": { "valuePrompt": "聚焦一个最关键的细节区域做清晰大特写，避免多个看点同时竞争注意力。" },
        "多细节拼接展示": { "valuePrompt": "将 2 至 4 个关键局部做清晰分区展示，每个局部要有明确主题，不做碎片化堆叠。" },
        "细节 + 功能关联": { "valuePrompt": "在细节特写的基础上，明确表现该局部与功能/使用价值的关系，但不夸大功效。" },
        "细节 + 材质对比": { "valuePrompt": "突出同一商品不同材质、不同层次或不同处理工艺的对比关系，对比必须真实可见。" },
        "细节 + 使用痕迹": { "valuePrompt": "允许表现轻微真实使用痕迹来证明材质和使用状态，但不得做旧过度，不得显脏乱。"}
      }
    }
  }
}
```

## 5. 最终组装模板与规则（JSON）

```json
{
  "builderByTool": {
    "goods-detail": {
      "requiredFields": ["toolKey", "platformLabel", "productCategory", "productType", "displayType"],
      "promptTemplates": {
        "task": "生成用于展示商品材质、结构、工艺和局部功能的细节图。",
        "category": "当前商品品类为「{productCategory}」，请保持该品类应有的真实结构、材质、颜色与比例，不改变 SKU 核心特征。",
        "platform": "{platformPrompt}",
        "params": "产品类型={productType}；展示形式={displayType}。",
        "quality": "局部特写必须清晰准确，材质纹理真实，边缘干净，不虚构内部结构，不做过度锐化和过度磨皮。",
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

## 5.1 提示词拼接顺序（必须）

1. 任务目标段
2. 平台规则段
3. 品类规则段
4. 参数值段（`productType / displayType`）
5. 选项扩展段（`valuePrompt`）
6. 质量约束段
7. 输出规格段
8. 补充说明段

说明：

- 平台规则放在前面，是为了先约束“在哪个平台用”。
- 品类规则放在前面，是为了先约束“这个东西本来长什么样”。
- 选项扩展段必须在参数值之后追加，不能省。

## 6. 可直接联调示例

输入：

```json
{
  "toolKey": "goods-detail",
  "platformLabel": "亚马逊",
  "productCategory": "家电数码类",
  "params": {
    "productType": "蓝牙耳机",
    "displayType": "细节 + 功能关联",
    "ratio": "1:1",
    "resolution": "2K",
    "count": "1",
    "supplement": "重点突出耳帽贴合、充电仓转轴与触控区域质感，保持黑色材质层次。"
  },
  "strict": true
}
```

输出（示例）：

```text
生成用于展示商品材质、结构、工艺和局部功能的细节图。

适配亚马逊商品图库语境，细节图应作为补充图片而非主图使用，重点展示特征细节、材质、接口、尺寸或使用关联细节；必须真实准确，不伪造效果，不添加误导性图形、Logo 或水印，不让局部细节与实际售卖商品不一致。

当前商品品类为「家电数码类」，请保持该品类应有的真实结构、材质、颜色与比例，不改变 SKU 核心特征。

产品类型=蓝牙耳机；展示形式=细节 + 功能关联。

重点放大耳机腔体、耳帽、充电触点、转轴、网孔和材质边界，避免增加不存在的接口。 在细节特写的基础上，明确表现该局部与功能/使用价值的关系，但不夸大功效。

局部特写必须清晰准确，材质纹理真实，边缘干净，不虚构内部结构，不做过度锐化和过度磨皮。

输出比例=1:1；输出分辨率=2K；输出数量=1。

补充要求：重点突出耳帽贴合、充电仓转轴与触控区域质感，保持黑色材质层次。
```

## 7. 三个关键能力的提示词配置（完整可用）

## 7.1 图片识别获取信息（Image Understanding / Extraction）

用途：

- 识别品类与细节图相关字段线索；
- 输出结构化 JSON，供字段回填和后续提示词组装使用。

推荐提示词：

```text
你是一位电商商品图理解专家。请根据输入商品图，提取“细节图生成”所需信息，并严格输出 JSON。

任务要求：
1) 识别商品所属品类（用于 productCategory）。
2) 基于图像线索，预测细节图字段推荐值：productType, displayType。
3) 给出 2~5 个最适合放大的局部焦点（如接口、走线、拉链、泵头、链节、纹理、缝线、按钮、轮子等）。
4) 所有推荐值必须从给定 options 中选择；若无法判断，返回空语义值或最保守值。
5) 不输出解释文字，不输出 Markdown，仅输出 JSON。

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
    "displayType": "string"
  },
  "focusAreas": ["string"],
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}

判定规则：
- 若识别置信度 < 0.70，categoryLabel 输出“通用品类”，并将 productType 设为“智能识别”。
- 若 displayType 无可靠依据，优先留空并加入 needsUserConfirm。
```

## 7.2 AI Assist 回填高级字段（当前代码已配提示词，但前端默认关闭入口）

当前代码原始提示词：

```text
你是一位商品细节图策划师。请根据商品图片，回填产品类型与展示形式，帮助细节图更明确地表达材质、结构或局部功能。
```

建议升级版提示词：

```text
你是一位商品细节图策划师。请根据商品图识别结果与平台信息，回填 goods-detail 的高级设置字段。

任务要求：
1) 只回填这两个字段：productType, displayType。
2) 所有值必须从给定 options 中选择，不允许自造新值。
3) productType 必须尽量贴合商品真实类型。
4) displayType 必须服务于“更好表达材质、结构、工艺或局部功能”，不要泛化为卖点图或场景图。
5) 如果某字段无法确认，返回空字符串，并加入 needsUserConfirm。
6) 不输出解释，不输出 Markdown，只输出 JSON。

输出格式：
{
  "fieldValues": {
    "productType": "string",
    "displayType": "string"
  },
  "needsUserConfirm": ["fieldKey1"]
}
```

## 7.3 补充说明润色（当前代码现状 + 推荐修正）

当前代码现状：

```json
{
  "modelLabel": "创客贴AI卖点图润色",
  "prompt": "优化卖点图补充说明，强调核心卖点、信息层级、对比关系和画面说服力。"
}
```

问题：

- 这段配置沿用了 `goods-sell` 的卖点图话术；
- 对 `goods-detail` 来说，重点不应该是“信息层级、商业说服力”，而应该是“局部焦点、工艺区域、材质纹理、边缘净度、结构真实性”。

建议修正为：

```json
{
  "modelLabel": "创客贴AI细节图润色",
  "prompt": "优化细节图补充说明，强调局部焦点、材质纹理、工艺区域、结构真实性、边缘净度和特写清晰度。"
}
```

推荐润色提示词：

```text
你是一位电商商品细节图文案润色专家。请将用户的补充说明优化为“可执行的图像生成约束”，并保持原意。

要求：
1) 优先补强：局部焦点、材质纹理、工艺区域、结构关系、边缘净度、黑白/金属/玻璃等材质层次。
2) 不要把细节图改写成卖点图、场景图或主图话术。
3) 不要增加用户未表达的强营销诉求。
4) 输出 1 段简洁中文，不要解释。
```

## 8. 组装实现要点（避免“只拼值文本”）

结论：

- 不能只拼 `productType=xxx；displayType=xxx`。
- 必须在参数值后追加对应的 `valuePrompt`。

建议伪代码：

```ts
const paramLine = `产品类型=${productType}；展示形式=${displayType}。`;

const expansionLines = selectedFields.flatMap(({ fieldKey, value }) => {
  const fieldConfig = optionValueExpansionsByTool[fieldKey];
  if (!fieldConfig) return [];
  const hit = fieldConfig.values[value];
  if (!hit) throw new Error(`unknown value: ${fieldKey}=${value}`);
  return [hit.valuePrompt];
});

finalPrompt = [
  taskPrompt,
  platformPrompt,
  categoryPrompt,
  paramLine,
  expansionLines.join(" "),
  qualityPrompt,
  outputSpecPrompt,
  supplementPrompt
].filter(Boolean).join("\n\n");
```

## 9. 公开来源（2026-05-01 复核）

以下来源用于支撑本文件里的平台约束判断；其中明确标注为 `C` 的平台，结论仍建议业务再进商家后台二次核验。

- Amazon Seller Forums / Product image requirements  
  https://sellercentral.amazon.com/seller-forums/discussions/t/5eef969a1508af21fb64e9db01ba5a7e?mons_sel_locale=zh_CN
- Amazon Seller Forums / Product detail page image requirements  
  https://sellercentral.amazon.com/seller-forums/discussions/t/ab884127-f9b4-4053-8096-4991e1d60d1f
- TikTok Shop Product Listing Policy  
  https://seller-us.tiktok.com/university/essay?default_language=en&identity=1&knowledge_id=3196690250417921
- 小红书开放平台 Create SPL ITEM  
  https://school.xiaohongshu.com/en/open/product/create-spl-item.html
- 小红书开放平台 Create SPL  
  https://school.xiaohongshu.com/en/open/product/create-spl.html
- Ozon Seller Media  
  https://seller.ozon.ru/media/interviews/kak-samomu-sdelat-foto-dlya-marketplejsov/
- Alibaba Seller Central Learning Center  
  https://seller.alibaba.com/learningcenter/content/detail/PXJTD6WM.htm
- 仓库内基线汇总： [商品白底图-16平台最新规范与品类补充.md](/Users/zhaowenwen/CODEX/CKTAI电商/docs/商品白底图-16平台最新规范与品类补充.md)

