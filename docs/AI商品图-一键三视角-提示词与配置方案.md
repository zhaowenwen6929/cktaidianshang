# AI商品图-一键三视角-提示词与配置方案（按真实代码补全版）

> 目标：基于“当前代码真实流程 + 平台规则基线 + 品类特征 + 选项值扩展”组装可直接落地的一键三视图提示词。  
> 适用：开发、产品、运营统一对照。  
> 更新时间：2026-05-01

## 1. 当前代码真实流程与字段（Source of Truth）

## 1.1 页面真实流程

当前代码中的真实顺序来自 `src/App.tsx`：

1. 上传商品图（`upload-main`）
2. 选择拍摄视角（`camera-angle`）
3. 选择创作模式（`creation-mode`）
4. 配置高级设置（`advanced-settings`）
5. 生成

对应代码：

- `toolKey`: `goods-view`
- `creationModeConfigKey`: `three-view`
- `sectionOrder`: `["upload-main", "camera-angle", "creation-mode", "advanced-settings"]`
- `uploads.main.maxCount`: `24`
- `advancedSettings.showAiAssist`: `false`
- `creationMode.showSupplement`: `false`

结论：

- 当前页面没有独立的“补充说明”输入区。
- 当前页面没有打开 AI 帮写入口。
- 当前页面真实高级设置里，只有一个主字段：`platformInfo`。

## 1.2 当前真实字段与参数

```ts
type GoodsViewRuntimeParams = {
  toolKey: "goods-view";
  cameraAngle: string; // 必填，来自 RichSelectField
  platformInfo?: string; // 高级设置唯一主字段
  platformRuleDetail?: string; // 条件出现的“细节补充”
  modeId: "normal" | "advanced";
  ratio: "自适应尺寸" | "1:1" | "4:3" | "3:2";
  resolution?: "1K" | "2K" | "4K"; // 仅 advanced
  count: "1" | "2";
  mainUploads: UploadItem[]; // 最多 24 张
};
```

说明：

- `productCategory` 不是当前页面真实字段。
- `productType` 不是当前页面真实字段。
- 若要做“按品类补 prompt”，必须接入图片识别结果或外部商品结构化信息，不是当前页面直接输入。

## 1.3 当前真实可选值

### 1.3.1 `cameraAngle`

当前代码中的 `cameraAngle` 既有“单视角”，也有“品类推荐视角”：

```json
{
  "singleAngles": [
    "正面",
    "左侧面",
    "右侧面",
    "背面",
    "底部",
    "顶部俯拍",
    "45°俯拍"
  ],
  "categoryPresets": [
    "服饰类（上衣/连衣裙/外套）",
    "裤装类（牛仔裤/短裤/运动裤）",
    "鞋靴类",
    "包类/箱包",
    "美妆护肤类",
    "饮料/食品包装",
    "小家电（吹风机/榨汁机/音箱）",
    "数码产品（手机/显示器/平板）",
    "家具（沙发/桌椅/柜体）",
    "家清日化（洗衣液/清洁剂）",
    "玩具/模型",
    "珠宝饰品",
    "工具五金",
    "旅行箱/拉杆箱",
    "家纺寝具（床垫/被子/枕头）",
    "家装建材（灯具/水龙头/五金件）",
    "厨房用品（锅具/餐具/收纳）",
    "电商通用（不规则或结构复杂类）"
  ]
}
```

### 1.3.2 `platformInfo`

```json
[
  "无平台信息",
  "全平台通用（16平台）",
  "淘宝",
  "天猫",
  "京东",
  "拼多多",
  "1688",
  "抖音电商",
  "快手电商",
  "小红书电商",
  "亚马逊",
  "Temu",
  "TikTok Shop",
  "阿里国际站",
  "速卖通",
  "Shopee",
  "OZON",
  "SHEIN"
]
```

### 1.3.3 `creation-mode`

```json
{
  "normal": {
    "ratioOptions": ["自适应尺寸", "1:1", "4:3", "3:2"],
    "countOptions": ["1", "2"]
  },
  "advanced": {
    "ratioOptions": ["自适应尺寸", "1:1", "4:3", "3:2"],
    "countOptions": ["1", "2"],
    "resolutionOptions": ["1K", "2K", "4K"]
  }
}
```

## 1.4 当前代码里的真实交互细节

1. `cameraAngle` 是必填项。
2. `platformInfo` 是 `input-select`，既能选预置值，也能手输自定义平台/规则名。
3. `platformRuleDetail` 不是默认显示。
4. 当前实现里，只有当 `platformInfo` 输入了“不在预置 options 中的自定义值”时，才会显示 `platformRuleDetail`。
5. 与 `goods-white` 不同，`goods-view` 没有为“全平台通用（16平台）”自动带出平台规则预设。
6. 全局存在 `advancedAiAssistPromptConfigs["goods-view"]`，但当前功能 `showAiAssist=false`，所以页面实际上没有开启 AI 回填入口。

## 1.5 当前代码已有但未完全接上的提示词配置

当前代码已有全局润色提示词：

```text
优化三视图补充说明，强调视角统一、细节完整、背景干净和展示一致性。
```

但当前功能没有 `supplement` 区域，因此这段配置目前属于“可复用但未在 goods-view 页面真正启用”的状态。

## 1.6 推荐补全后的扩展字段

为了满足“按平台 + 按品类 + 按选项值”生成更正确的三视图，建议在服务端提示词组装层补上：

```ts
type GoodsViewPromptBuildParams = GoodsViewRuntimeParams & {
  productCategory?: string; // 由图片识别或商品结构化服务提供
  productCategoryConfidence?: number;
  categorySource?: "vision" | "catalog" | "manual";
  strict?: boolean;
};
```

注意：这里的 `productCategory` 是推荐补全，不是当前页面已有字段。

## 2. 一键三视图的真实业务理解

一键三视图不是“随便输出三张不同角度图”，而是要满足下面这 4 个目标：

1. 同一 SKU 在不同视角下结构、颜色、材质、比例一致。
2. 视角之间承担不同信息职责，不重复，不漂移。
3. 当平台存在主图/附图差异时，首视图必须优先满足主图规范。
4. 当品类结构复杂时，侧面、背面、俯视、底部等视角应服务于“补足信息”而不是随机换角度。

因此三视图提示词不能只拼：

```text
平台=淘宝；视角=鞋靴类
```

必须扩成可执行约束，例如：

```text
首视图使用正面或接近正面的标准商品展示视角；第二视图补足鞋侧轮廓与鞋面结构；第三视图补足后跟或鞋底结构。三张图中的鞋型、鞋带、鞋底花纹、颜色和材质必须一致，背景与布光风格保持统一。
```

## 3. 平台规则查询结论与三视图配置

## 3.1 查询口径说明

查询时间：2026-05-01  
查询口径：

- 优先使用官方公开商品图 / 主图 / 列表图 / 开放平台文档。
- 如果平台没有公开“三视图”专门规则，则以该平台公开的“主图 / 商品图 / 附图规则”推导三视图约束。
- 若公开网页拿不到足够明确的官方规则，则标记为 `C`，并使用保守合规策略。

`ruleLevel` 含义：

- `A`：官方公开规则中可直接落到三视图约束
- `B`：官方公开规则存在，但需从商品图/开放平台规则推导
- `C`：公开检索未拿到足够明确的官方原文，需后台再核验

## 3.2 平台规则总表（可直接转提示词）

```json
{
  "platformRulesByTool": {
    "全平台通用（16平台）": {
      "ruleLevel": "A",
      "prompt": "输出标准电商三视图。首视图优先满足主图可上架要求，使用干净背景、主体完整、正向可识别视角；第二、第三视图用于补足侧面、背面、俯视或底部结构。所有视图中的商品颜色、材质、结构、尺寸比例、配件状态和光线风格必须一致。",
      "required": ["主体完整", "视角分工清晰", "跨视图一致", "背景干净", "首视图可直接上架"],
      "forbidden": ["不同视图不是同一SKU", "视角重复", "结构漂移", "颜色漂移", "额外营销文案", "夸张道具"],
      "preferredRatios": ["1:1", "4:3", "3:2"]
    },
    "淘宝": {
      "ruleLevel": "C",
      "prompt": "按淘宝商品图的保守合规策略处理：首视图像标准主图一样干净直观，优先正面或近正面，避免牛皮癣文案和强干扰元素；其余视图补结构信息，不做夸张营销拼贴。",
      "required": ["首视图干净", "主体直观", "三视图信息互补"],
      "forbidden": ["牛皮癣文案", "价格贴片", "重复角度"],
      "preferredRatios": ["1:1", "3:4"]
    },
    "天猫": {
      "ruleLevel": "C",
      "prompt": "按天猫偏品牌整洁的商品图策略处理：首视图保持整洁质感与主体识别，其余视图延续统一光线和陈列方式，整体更克制、更标准化。",
      "required": ["整洁感", "主体清楚", "统一布光"],
      "forbidden": ["杂乱背景", "过强滤镜", "视角风格不统一"],
      "preferredRatios": ["1:1", "3:4"]
    },
    "京东": {
      "ruleLevel": "C",
      "prompt": "按京东商品图保守策略处理：首视图突出商品结构和材质，附加视图补足接口、背部、侧厚、配件关系等信息，保证电商识别效率。",
      "required": ["结构清晰", "材质真实", "信息效率高"],
      "forbidden": ["主体被遮挡", "夸张效果图", "重复视角"],
      "preferredRatios": ["1:1", "4:3"]
    },
    "拼多多": {
      "ruleLevel": "C",
      "prompt": "按拼多多高效率浏览场景处理：首视图必须一眼看清商品本体；其余视图只补必要结构信息，避免复杂场景和视觉噪声降低识别率。",
      "required": ["识别效率", "主体突出", "补充视图简洁"],
      "forbidden": ["复杂背景", "过多装饰", "重复角度"],
      "preferredRatios": ["1:1"]
    },
    "1688": {
      "ruleLevel": "C",
      "prompt": "按 1688 商采场景处理：首视图像标准货品图，第二、第三视图重点补足规格感、背部结构、接口、包装或安装方向，不走情绪化摆拍。",
      "required": ["规格感", "结构说明性", "真实货品感"],
      "forbidden": ["纯情绪化摆拍", "视角无信息增量"],
      "preferredRatios": ["1:1", "4:3"]
    },
    "抖音电商": {
      "ruleLevel": "C",
      "prompt": "按抖音电商商城图保守策略处理：首视图干净且可快速识别；三视图允许轻内容感，但不能牺牲商品可辨识度与结构一致性。",
      "required": ["主体清晰", "轻内容感", "一致性强"],
      "forbidden": ["滤镜过重", "抓拍导致主体失真", "角度重复"],
      "preferredRatios": ["1:1", "3:4"]
    },
    "快手电商": {
      "ruleLevel": "C",
      "prompt": "按快手电商真实直观的商品图策略处理：首视图重清晰与可信，后续视图补足使用面、背面或结构面，不做娱乐化视觉噱头。",
      "required": ["真实直观", "主体完整", "信息互补"],
      "forbidden": ["娱乐化抢主体", "过重后期痕迹"],
      "preferredRatios": ["1:1", "3:4"]
    },
    "小红书电商": {
      "ruleLevel": "B",
      "prompt": "适配小红书商品图尺寸与比例能力，三视图可使用 1:1 或 3:4。首视图保持商品可识别与画面整洁，后续视图在统一风格下补足侧面、背面、俯视等信息，适合种草语境但不做硬广拼贴。",
      "required": ["1:1或3:4兼容", "种草审美", "主体清晰", "多视图统一"],
      "forbidden": ["硬广文案堆叠", "不同视图风格跳变"],
      "preferredRatios": ["1:1", "3:4"]
    },
    "亚马逊": {
      "ruleLevel": "A",
      "prompt": "适配亚马逊商品图规则：首视图必须按主图标准处理，使用纯白背景，仅展示实际售卖商品主体，优先正面或最能代表商品的标准视角；其余视图用于补足侧面、背面、底部、接口或细节，但仍需保持同一商品、同一材质、同一颜色、同一配件状态。",
      "required": ["首视图纯白", "仅商品主体", "标准代表视角", "其余视图补信息"],
      "forbidden": ["文字", "Logo", "水印", "边框", "非卖品道具", "不同视图不是同一SKU"],
      "preferredRatios": ["1:1"]
    },
    "Temu": {
      "ruleLevel": "C",
      "prompt": "按 Temu 快节奏货架图的保守策略处理：首视图尽量白底或极干净中性底，主体完整突出；后续视图只补足结构和背面信息，避免复杂装饰降低识别效率。",
      "required": ["清晰主体", "高识别率", "补充结构信息"],
      "forbidden": ["复杂背景", "过多装饰道具", "重复角度"],
      "preferredRatios": ["1:1"]
    },
    "TikTok Shop": {
      "ruleLevel": "A",
      "prompt": "适配 TikTok Shop 商品图规则：首视图必须是纯白背景的商品正面实体视图；后续视图可展示背面、侧面或其他细节，不得重复同一角度，且所有视图都必须真实准确反映售卖商品。",
      "required": ["首视图正面实体视图", "纯白背景", "其余视图不重复角度", "真实反映商品"],
      "forbidden": ["文字", "Logo", "边框", "水印", "重复同角度", "数字占位渲染图"],
      "preferredRatios": ["1:1"]
    },
    "阿里国际站": {
      "ruleLevel": "B",
      "prompt": "适配 Alibaba.com 高质量商品图语境：首视图优先标准商品展示，后续视图补足结构、安装方向、接口或工艺细节，整体强调专业、清晰和买家判断效率。",
      "required": ["高质量商品图", "结构说明性", "专业感"],
      "forbidden": ["模糊低质", "信息不足的重复视角"],
      "preferredRatios": ["1:1", "4:3"]
    },
    "速卖通": {
      "ruleLevel": "C",
      "prompt": "按跨境零售商品图保守策略处理：首视图标准化，后续视图补足结构和背面信息，画面尽量简洁，避免夸张营销或与实物不符的渲染表达。",
      "required": ["标准首视图", "结构补充", "真实可信"],
      "forbidden": ["夸张营销元素", "与实物不符的效果"],
      "preferredRatios": ["1:1"]
    },
    "Shopee": {
      "ruleLevel": "C",
      "prompt": "按 Shopee 商品图保守策略处理：首视图背景干净、主体占比高、只展示售卖商品；其余视图补足角度与细节，但整体仍应简洁直观。",
      "required": ["背景干净", "主体占比高", "只展示商品"],
      "forbidden": ["复杂拼贴", "主体过小", "重复角度"],
      "preferredRatios": ["1:1"]
    },
    "OZON": {
      "ruleLevel": "B",
      "prompt": "适配 OZON 商品图公开建议：首视图使用白色或浅色中性背景并居中展示，后续视图可补足侧面、背面、包装或细节。三视图整体要保持同一商品、同一结构和同一颜色表现。",
      "required": ["白或浅色中性背景", "居中展示", "多角度信息互补"],
      "forbidden": ["背景过深过杂", "角度重复", "结构漂移"],
      "preferredRatios": ["1:1", "4:3"]
    },
    "SHEIN": {
      "ruleLevel": "C",
      "prompt": "按 SHEIN 公开接入侧可见的图片比例能力处理：服饰和穿戴类三视图优先兼容 3:4，也可输出 1:1；首视图先保证商品识别与版型完整，其余视图补足背面、侧面、上身轮廓或局部结构。",
      "required": ["服饰类优先3:4", "版型完整", "穿戴结构清楚"],
      "forbidden": ["体型失真", "面料纹理漂移", "重复视角"],
      "preferredRatios": ["3:4", "1:1", "4:5"]
    }
  }
}
```

## 3.3 当前公开来源能直接支持到什么程度

### A 类：可直接支持较强三视图约束

- Amazon：主图纯白、仅商品主体、不可加字等规则公开明确。
- TikTok Shop：主图纯白、首图正面实体视图、其余图不重复角度，规则公开明确。

### B 类：能支持“商品图能力/比例/背景倾向”类约束

- 小红书电商：公开支持商品图尺寸/比例。
- Alibaba.com：公开强调高质量商品图片，但不是三视图专规。
- OZON：公开建议白色或浅色中性背景。

### C 类：当前公开检索无法拿到足够硬的官方原文

- 淘宝、天猫、京东、拼多多、1688、抖音电商、快手电商、Temu、速卖通、Shopee、SHEIN。

处理策略：

- 系统落地时仍给出平台专属提示词；
- 但 `ruleLevel` 标记为 `C`；
- 后续若运营从商家后台补充官方截图，可直接替换对应平台 prompt。

## 4. 品类提示词配置（三视图专属）

说明：

- 这部分是推荐补全。
- `productCategory` 需来自图片识别或商品库，不是当前页面真实输入字段。
- 品类规则的作用是：当平台规则只告诉你“图要合规”，品类规则告诉你“三个视角具体该看什么”。

```json
{
  "categoryRulesByTool": {
    "服饰类": {
      "prompt": "优先展示版型、肩线、袖型、领口、下摆与背部轮廓；三视图之间面料纹理、褶皱逻辑、颜色和长度比例必须一致，避免袖长、领型或腰线在不同视图中漂移。"
    },
    "鞋靴类": {
      "prompt": "优先展示鞋面、侧轮廓、后跟、鞋底和鞋口结构；左右脚关系、鞋带系法、鞋底纹路和鞋型弧度必须一致，避免镜像错误和鞋底变形。"
    },
    "箱包类": {
      "prompt": "优先展示包体正面造型、侧厚、背面结构、开口或底部；包体容量感、五金、拉链、肩带、提手和车线细节应在不同视图中一致。"
    },
    "珠宝饰品类": {
      "prompt": "优先展示主体造型、厚薄、背扣/链尾和镶嵌结构；高光、反射、链条走向和微小结构必须稳定，避免不同视图中宝石切面和金属结构漂移。"
    },
    "美妆个护类": {
      "prompt": "优先展示正面标签、侧厚、背标、泵头喷嘴或刷头结构；瓶身轮廓、透明件边缘、反光和包装文案位置要保持一致。"
    },
    "食品饮料类": {
      "prompt": "优先展示包装正面识别、背面配料/说明区、瓶盖或封口结构；不同视图中的包装形状、净含量规格区和品牌标识必须一致，不伪造开封或食材效果。"
    },
    "家居百货类": {
      "prompt": "优先展示整体形态、侧厚、背面结构、收纳腔体、配件关系或底部结构；不同视图需保证结构比例准确，配件完整，不出现无中生有的组合件。"
    },
    "家电数码类": {
      "prompt": "优先展示正面主界面、侧厚、背面、接口、按键、开孔与线材关系；不同视图中的接口布局、屏幕比例、金属塑料分界和装配缝必须一致。"
    },
    "家具大件类": {
      "prompt": "优先展示正面体量、侧面深度、背部或底部结构；三视图应保持透视、比例、腿脚位置、扶手结构和连接关系一致，避免尺寸失真。"
    },
    "母婴玩具类": {
      "prompt": "优先展示整体外形、侧厚、背面、开合结构和全部组件；不同视图中零件数量、拼接方式、软硬材质和安全结构必须一致。"
    },
    "宠物用品类": {
      "prompt": "优先展示主体形态、侧厚、开口、内部结构、底部或固定方式；面料、填充、塑料件和五金件在不同视图中保持一致，不凭空增加宠物或配件。"
    },
    "汽配五金类": {
      "prompt": "优先展示正面结构、侧厚、背部安装面、孔位、卡扣、棱边和接口位置；不同视图中的尺寸逻辑、孔位数量和金属反光必须准确一致。"
    },
    "通用品类": {
      "prompt": "首视图承担商品识别，第二视图补足侧面或厚度，第三视图补足背面、底部、顶部或关键结构面；所有视图必须是同一商品、同一结构、同一颜色和同一材质。"
    }
  }
}
```

## 5. 选项值是否需要扩展成详细提示词

结论：需要，但不是所有字段都需要同等强度。

### 5.1 必须扩展

- `cameraAngle`
  - 必须扩展。
  - 只写“鞋靴类”或“45°俯拍”不够，模型不知道三张图分别该承担什么信息。
- `platformInfo`
  - 必须扩展。
  - 平台值本身只是标签，真正起作用的是该平台下的主图/附图约束。
- `platformRuleDetail`
  - 必须直接拼入提示词。
  - 这是人工补规则，不应丢弃。

### 5.2 建议扩展

- `ratio`
  - 建议写入提示词一行，帮助模型理解画面编排。
- `resolution`
  - 建议优先作为模型参数，也可冗余写入提示词。

### 5.3 不建议作为主要提示词扩展

- `modeId`
  - 更适合作为模型路由参数。
- `count`
  - 更适合作为生成参数，不需要扩成自然语言长约束。

### 5.4 选项值扩展提示词配置（三视图专属 JSON）

#### 5.4.1 `cameraAngle` 扩展

```json
{
  "optionValueExpansionsByTool": {
    "cameraAngle": {
      "fieldKey": "cameraAngle",
      "name": "拍摄视角",
      "values": {
        "正面": { "valuePrompt": "仅输出以正面为主的标准商品展示视角，主体摆正，结构完整，适合承担首视图职责。" },
        "左侧面": { "valuePrompt": "重点展示左侧轮廓、厚度、侧边结构和局部层次，避免与正面信息重复。" },
        "右侧面": { "valuePrompt": "重点展示右侧轮廓、厚度、侧边结构和局部层次，避免与正面信息重复。" },
        "背面": { "valuePrompt": "重点展示商品背部结构、后跟、背标、背板、后置接口或背面工艺，不与正面视图重复。" },
        "底部": { "valuePrompt": "重点展示底部结构、防滑纹、脚钉、支撑脚、底座或安装底面，保持底部信息清晰。" },
        "顶部俯拍": { "valuePrompt": "使用垂直俯视展示顶部开口、内腔、封口、按键布局或平面结构，避免透视过强。" },
        "45°俯拍": { "valuePrompt": "使用上方 45 度视角，兼顾正面识别与立体结构信息，适合作为综合补充视角。" },
        "服饰类（上衣/连衣裙/外套）": { "valuePrompt": "按服饰三视图处理：首视图展示正面版型，第二视图补侧轮廓或 45 度立体感，第三视图展示背面轮廓与剪裁。保持肩线、袖长、领型、版型和面料纹理一致。" },
        "裤装类（牛仔裤/短裤/运动裤）": { "valuePrompt": "按裤装三视图处理：首视图展示正面裤型与腰线，第二视图补侧缝与厚薄关系，第三视图展示背面臀线和口袋结构。保持裤长、裤脚、腰头和版型一致。" },
        "鞋靴类": { "valuePrompt": "按鞋靴三视图处理：首视图优先正面或 45 度展示鞋面识别，第二视图补足侧轮廓和鞋底厚度，第三视图展示后跟或鞋底纹路。保持鞋型、鞋带、鞋底花纹和材质一致。" },
        "包类/箱包": { "valuePrompt": "按箱包三视图处理：首视图展示正面造型，第二视图补侧厚和容量感，第三视图展示背面、开口或底部结构。保持五金、拉链、肩带和包体硬挺度一致。" },
        "美妆护肤类": { "valuePrompt": "按美妆三视图处理：首视图展示正面标签，第二视图补 45 度瓶身立体感，第三视图展示背标或泵头刷头结构。保持瓶身形态、标签位置和反光一致。" },
        "饮料/食品包装": { "valuePrompt": "按食品包装三视图处理：首视图展示包装正面识别，第二视图补 45 度体积感，第三视图展示背面说明区或顶部封口。保持包装形状、规格信息和颜色一致。" },
        "小家电（吹风机/榨汁机/音箱）": { "valuePrompt": "按小家电三视图处理：首视图展示主要外观，第二视图补侧面结构和厚度，第三视图展示背部、接口、按键或出风口。保持接口布局和装配结构一致。" },
        "数码产品（手机/显示器/平板）": { "valuePrompt": "按数码三视图处理：首视图展示正面主识别面，第二视图补侧厚和边框结构，第三视图展示背板、镜头模组或接口。保持屏幕比例、边框厚度和开孔位置一致。" },
        "家具（沙发/桌椅/柜体）": { "valuePrompt": "按家具三视图处理：首视图展示正面体量，第二视图补侧深和结构关系，第三视图补 45 度整体立体感或背部结构。保持透视、尺寸和连接关系一致。" },
        "家清日化（洗衣液/清洁剂）": { "valuePrompt": "按家清包装三视图处理：首视图展示正面标签，第二视图补 45 度瓶体结构，第三视图展示背标或瓶口结构。保持瓶身比例、标签位置和盖体结构一致。" },
        "玩具/模型": { "valuePrompt": "按玩具模型三视图处理：首视图展示整体正面形象，第二视图补侧轮廓和厚度，第三视图展示背部结构或关节细节。保持零件数量、姿态逻辑和涂装一致。" },
        "珠宝饰品": { "valuePrompt": "按珠宝三视图处理：首视图展示主造型，第二视图补厚度与立体切面，第三视图展示背扣、链尾或底托结构。保持金属高光、镶嵌位置和微小结构一致。" },
        "工具五金": { "valuePrompt": "按工具五金三视图处理：首视图展示主体识别面，第二视图补侧厚、手柄或棱边结构，第三视图展示背面、孔位或接口。保持尺寸逻辑、孔位与金属反光一致。" },
        "旅行箱/拉杆箱": { "valuePrompt": "按箱体三视图处理：首视图展示正面箱壳，第二视图补侧厚与轮组结构，第三视图展示背面、拉杆或底部轮脚。保持轮子数量、拉杆位置和壳体纹理一致。" },
        "家纺寝具（床垫/被子/枕头）": { "valuePrompt": "按家纺三视图处理：首视图展示正面主形态，第二视图补俯视平面或 45 度蓬松度，第三视图展示侧厚或结构层次。保持面料纹理、厚度和边线一致。" },
        "家装建材（灯具/水龙头/五金件）": { "valuePrompt": "按建材五金三视图处理：首视图展示主外观，第二视图补 45 度立体结构，第三视图展示侧面、底座或安装接口。保持安装方向、孔位和金属结构一致。" },
        "厨房用品（锅具/餐具/收纳）": { "valuePrompt": "按厨房用品三视图处理：首视图展示正面或主识别面，第二视图补侧厚和容量感，第三视图展示俯视开口或底部结构。保持把手、边沿和容器比例一致。" },
        "电商通用（不规则或结构复杂类）": { "valuePrompt": "按通用复杂商品三视图处理：首视图负责商品识别，第二视图补侧面或厚度，第三视图补背面、底部、顶部或关键结构面。严禁三张图角度重复或信息无增量。" }
      }
    }
  }
}
```

#### 5.4.2 `platformInfo` 扩展

说明：这是当前页面真实高级字段，建议不要只拼平台名，而是直接拼平台值对应的详细规则 prompt。

```json
{
  "optionValueExpansionsByTool": {
    "platformInfo": {
      "fieldKey": "platformInfo",
      "name": "平台信息",
      "values": {
        "无平台信息": { "valuePrompt": "按通用电商三视图基线处理：首视图承担主图职责，其余视图补结构信息，保持背景干净和多视图一致。" },
        "全平台通用（16平台）": { "valuePrompt": "按全平台最严格交集处理：首视图可直接上架，后续视图只补结构信息，不引入营销元素和风格化背景。" },
        "淘宝": { "valuePrompt": "首视图按淘宝保守主图策略处理，干净直观；后续视图补结构，不做牛皮癣拼贴。" },
        "天猫": { "valuePrompt": "首视图整洁标准化，后续视图保持统一质感和布光。" },
        "京东": { "valuePrompt": "强调结构、材质和信息效率，后续视图补足接口、背面和侧厚。" },
        "拼多多": { "valuePrompt": "优先一眼识别商品本体，后续视图简洁补信息。" },
        "1688": { "valuePrompt": "优先货品感和规格说明性，后续视图补足结构面和安装面。" },
        "抖音电商": { "valuePrompt": "保持货架识别效率，可有轻内容感，但不牺牲主体可辨识度。" },
        "快手电商": { "valuePrompt": "强调真实直观和可信体验，后续视图自然补信息。" },
        "小红书电商": { "valuePrompt": "兼顾种草审美与商品识别，优先兼容 1:1 或 3:4。" },
        "亚马逊": { "valuePrompt": "首视图必须纯白且仅展示商品主体，其余视图补足侧面、背面、底部或细节。" },
        "Temu": { "valuePrompt": "首视图尽量白底或极干净中性底，后续视图只补必要结构信息。" },
        "TikTok Shop": { "valuePrompt": "首视图必须纯白背景的正面实体视图，其余视图不重复角度。" },
        "阿里国际站": { "valuePrompt": "强调高质量商品图和买家判断效率，后续视图补工艺、接口和结构信息。" },
        "速卖通": { "valuePrompt": "首视图标准化，后续视图补足结构与背面信息，整体简洁真实。" },
        "Shopee": { "valuePrompt": "背景干净、主体占比高，只展示售卖商品，后续视图补角度。" },
        "OZON": { "valuePrompt": "首视图优先白色或浅色中性背景，后续视图补足侧面、背面、包装或细节。" },
        "SHEIN": { "valuePrompt": "服饰穿戴类优先兼容 3:4，首视图先保证版型完整和主体识别，后续视图补背面与侧轮廓。" }
      }
    }
  }
}
```

### 5.5 最终提示词组装模板（推荐）

```json
{
  "builderByTool": {
    "goods-view": {
      "requiredFields": ["toolKey", "cameraAngle", "platformInfo", "ratio", "count"],
      "optionalFields": ["productCategory", "platformRuleDetail", "resolution"],
      "promptTemplates": {
        "task": "生成电商商品三视图展示图。",
        "category": "当前商品品类为「{productCategory}」，请保持该品类应有的真实结构、材质、颜色、比例和配件关系，不改变SKU核心特征。",
        "platform": "{platformPrompt}",
        "angle": "当前视角方案为「{cameraAngle}」。{cameraAnglePrompt}",
        "quality": "三视图之间必须保持同一商品、同一颜色、同一材质、同一结构、同一尺寸比例和同一布光逻辑；禁止结构漂移、材质漂移、颜色漂移、配件增减和角度重复。",
        "outputSpec": "输出比例={ratio}；输出数量={count}；输出分辨率={resolution}。",
        "detail": "平台细则：{platformRuleDetail}"
      },
      "appendOptionExpansions": true,
      "strictMode": {
        "enabled": true,
        "onMissingPlatformRule": "error",
        "onMissingCameraAngleExpansion": "error",
        "onUnknownParamValue": "error",
        "onCustomPlatformWithoutDetail": "error"
      }
    }
  }
}
```

## 6. 拼装规则（后端/中台）

1. 先确定平台、视角方案与品类：
- 平台来源优先级：`platformInfo`（高级设置） > `无平台信息`。
- 视角来源：`cameraAngle`（必填）直接命中预置单视角或品类预设视角。
- 品类来源优先级：`productCategory`（识别/上游注入） > 无品类时仅使用 `cameraAngle` 预设语义。
2. 读取平台规则：`platformRulesByTool[platformInfo]`，拼接首视图/补充视图角色、背景要求以及 `required + forbidden`。
3. 读取品类规则：若有 `productCategory`，命中品类规则后拼接结构、材质、比例和配件一致性约束。
4. 读取字段值扩展：
- `cameraAngle` 必须命中 `valuePrompt`，决定三张图各自承担的视角职责。
- `platformInfo` 需命中 `valuePrompt`，把“平台名”变成“这个平台下三视图应该怎么用”的规则。
5. 三视图字段分层必须固定：
- `platformInfo` 决定首视图是不是主图标准、背景能否纯白、后两张图能否补结构信息。
- `cameraAngle` 决定三张图的角度分工，避免重复视角。
- `productCategory` 负责补足行业结构常识，例如鞋靴看鞋底、箱包看侧厚、数码看接口。
- `platformRuleDetail` 只能细化平台例外规则，不能覆盖硬约束。
6. 约束优先级必须固定：`platform forbidden` > `platform required` > `cameraAnglePrompt` > `category prompt` > `platformInfoValuePrompt` > `platformRuleDetail`。
7. 若平台主图要求纯白或高识别，首视图必须明确承担主图职责；第二、第三视图才允许补充侧面、背面、底部、俯视等信息。
8. 若 `cameraAngle` 选的是品类预设（如“鞋靴类”“数码产品”），最终提示词必须显式写出“三张图各自看什么”，不能只保留标签值。
9. `platformRuleDetail` 仅在自定义平台或业务补充规则时拼接，适合放“禁用元素、首图角度、包装是否可出镜”等细则。
10. 安全兜底：最终串必须包含“同一SKU、同一颜色、同一材质、同一结构、同一比例、同一布光逻辑，禁止视角重复和结构漂移”的语义。

### 6.1 字段与规则源映射（必须按此读取）

| 拼装变量 | 来源字段 | 规则文件/章节 | 说明 |
| --- | --- | --- | --- |
| `platformInfo` | `advanced-settings.platformInfo` | 本文第 3 章 `platformRulesByTool` | 当前页面唯一主高级字段 |
| `cameraAnglePrompt` | `cameraAngle` 命中值 | 本文第 5.4.1 节 | 必须转成三张图的分工描述 |
| `platformInfoValuePrompt` | `platformInfo` 命中值 | 本文第 5.4.2 节 | 平台补充语义，不替代硬规则 |
| `productCategory` | 图片识别或上游注入 | 本文第 1.6 节说明 | 当前页面无显式字段 |
| `platformRuleDetail` | 条件显示的“细节补充”字段 | 无 | 自定义平台/业务补充规则 |
| `ratio/resolution/count` | 创作模式参数 | 无 | 输出规格段 |

## 7. 拼装 Demo（输入 + 输出）

### 7.1 Demo 输入

```json
{
  "toolKey": "goods-view",
  "productCategory": "鞋靴类",
  "cameraAngle": "鞋靴类",
  "platformInfo": "亚马逊",
  "modeId": "advanced",
  "ratio": "1:1",
  "resolution": "1K",
  "count": "1",
  "strict": true
}
```

### 7.2 Demo 输出（最终提示词）

```text
生成电商商品三视图展示图。

当前商品品类为「鞋靴类」，请保持该品类应有的真实结构、材质、颜色、比例和配件关系，不改变SKU核心特征。

适配亚马逊商品图规则：首视图必须按主图标准处理，使用纯白背景，仅展示实际售卖商品主体，优先正面或最能代表商品的标准视角；其余视图用于补足侧面、背面、底部、接口或细节，但仍需保持同一商品、同一材质、同一颜色、同一配件状态。

当前视角方案为「鞋靴类」。按鞋靴三视图处理：首视图优先正面或 45 度展示鞋面识别，第二视图补足侧轮廓和鞋底厚度，第三视图展示后跟或鞋底纹路。保持鞋型、鞋带、鞋底花纹和材质一致。

三视图之间必须保持同一商品、同一颜色、同一材质、同一结构、同一尺寸比例和同一布光逻辑；禁止结构漂移、材质漂移、颜色漂移、配件增减和角度重复。

输出比例=1:1；输出数量=1；输出分辨率=1K。
```

### 7.3 Demo 说明（规则如何生效）

1. `platformInfo=亚马逊` 先命中平台硬规则，锁定“首视图纯白、主体完整、适合上架”的职责。
2. `cameraAngle=鞋靴类` 命中品类预设视角扩展，不是简单写“鞋靴类”，而是拆成“首视图看鞋面、第二视图看侧轮廓、第三视图看后跟/鞋底”。
3. `productCategory=鞋靴类` 进一步补强鞋型、鞋带、鞋底花纹、材质一致性，防止跨视图漂移。
4. 若存在 `platformRuleDetail`，它只能细化例如“包装是否可出镜”“是否允许鞋盒同框”等业务细则，不能推翻亚马逊白底主图规范。

## 8. 端到端建议

若要让该功能真正达到“像买家秀那样完整可配置”的状态，最小补齐项如下：

1. 接入 `productCategory` 识别结果。
2. 将 `platformInfo` 从“只存标签”升级为“命中 platform rule prompt”。
3. 将 `cameraAngle` 从“只存值”升级为“命中 valuePrompt 扩展”。
4. 若要启用人工补充说明，需同时改两处代码：
   - `three-view.showSupplement = true`
   - `goods-view.sectionOrder` 增加 `supplement`
5. 若要启用 AI 帮写，需将 `goods-view.advancedSettings.showAiAssist` 改为 `true`，并把 AI assist 输出从“只回填 platformInfo”扩成“回填 platformInfo + 推荐 productCategory + 推荐 cameraAngle”。

## 9. 当前可引用来源（2026-05-01 检索）

- Amazon Seller Forums / Product image requirements  
  <https://sellercentral.amazon.com/seller-forums/discussions/t/5eef969a1508af21fb64e9db01ba5a7e?mons_sel_locale=zh_CN>
- Amazon Seller Forums / Image requirements discussion  
  <https://sellercentral.amazon.com/seller-forums/discussions/t/ab884127-f9b4-4053-8096-4991e1d60d1f>
- TikTok Shop Product Listing Policy / product images  
  <https://seller-us.tiktok.com/university/essay?default_language=en&identity=1&knowledge_id=3196690250417921>
- 小红书开放平台 / Create SPL Item  
  <https://school.xiaohongshu.com/en/open/product/create-spl-item.html>
- 小红书开放平台 / Create SPL  
  <https://school.xiaohongshu.com/en/open/product/create-spl.html>
- OZON Seller / photo for marketplaces  
  <https://seller.ozon.ru/media/interviews/kak-samomu-sdelat-foto-dlya-marketplejsov/>
- Alibaba Seller Learning Center  
  <https://seller.alibaba.com/learningcenter/content/detail/PXJTD6WM.htm>
- Shopee marketplace guide（公开接入侧资料，非 Shopee 官方原始卖家中心规则）  
  <https://support.channelengine.com/hc/en-us/articles/4409503364509-Shopee-marketplace-guide>
- SHEIN marketplace guide（公开接入侧资料，非 SHEIN 官方原始卖家中心规则）  
  <https://support.channelengine.com/hc/en-us/articles/21552893542941-SHEIN-marketplace-guide>

## 10. 与当前代码对应的关键位置

- `src/App.tsx:5052` `three-view` 创作模式
- `src/App.tsx:5740` `goods-view` 模块配置
- `src/App.tsx:15824` `camera-angle` 在 goods-view 中的真实字段写入
- `src/App.tsx:3152` `advancedAiAssistPromptConfigs["goods-view"]`
- `src/App.tsx:3099` `supplementAiPolishConfigs["goods-view"]`
- `src/config/goodsWhitePromptConfig.ts:57` `goodsWhitePlatformLabels`
