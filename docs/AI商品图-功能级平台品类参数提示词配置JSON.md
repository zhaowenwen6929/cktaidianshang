# AI商品图-功能级平台品类参数提示词配置JSON

> 目的：提供可直接落地的 JSON 配置，按「功能 + 平台 + 品类 + 参数」生成最终提示词。  
> 适用范围：AI商品图（除白底图外）功能。  
> 版本时间：2026-05-01

## 1. 使用方式

生成提示词时按以下顺序拼接：

1. `global.taskByTool[toolKey]`
2. `global.categoryTemplate`（填充 `{productCategory}`）
3. `platformRules[platformLabel].promptByTool[toolKey]`（若无则回退 `platformRules[platformLabel].defaultPrompt`）
4. `toolConfigs[toolKey].paramPrompts`（根据用户参数逐项填充）
5. `global.qualityByTool[toolKey]`
6. `supplement`（用户可选）

strict 建议：

- `toolKey`、`platformLabel`、`productCategory` 任一未命中配置即报错；
- 参数值不在 `options` 中即报错；
- 不做静默兜底改写。

## 2. 全局配置（JSON）

```json
{
  "version": "2026-05-01",
  "global": {
    "taskByTool": {
      "goods-marketing": "生成可用于电商主图与活动投放的营销主图。",
      "goods-buyer": "生成真实自然、生活化的买家秀风格商品图。",
      "goods-scene": "生成具有使用代入感的商品场景图。",
      "goods-detail": "生成用于展示工艺、材质与结构局部的细节图。",
      "goods-sell": "生成强调卖点信息层级与转化表达的卖点图。",
      "goods-spoke": "生成人物代言风格商品图，强化信任与品牌表达。",
      "goods-view": "生成正侧背等多视角一致展示图。",
      "goods-retouch": "对商品图进行商业级精修，提升质感与可上架性。",
      "goods-bg": "在保持主体不变前提下进行背景替换与真实融合。",
      "goods-translate": "翻译图片文案并尽量保持原版式层级与可读性。"
    },
    "categoryTemplate": "当前商品品类为「{productCategory}」，请保持该品类应有的真实结构、材质、颜色与比例，不改变SKU核心特征。",
    "qualityByTool": {
      "goods-marketing": "信息层级清晰，卖点可读，商品主体识别优先，避免过度特效。",
      "goods-buyer": "保持真实生活感，避免过度广告化与过度滤镜。",
      "goods-scene": "场景服务商品，不喧宾夺主，光影自然。",
      "goods-detail": "局部特写准确，边缘干净，纹理清晰。",
      "goods-sell": "文案与视觉重点明确，排版稳定不拥挤。",
      "goods-spoke": "人物与商品关系自然，商品细节不被遮挡。",
      "goods-view": "多视角结构一致、光线一致、比例一致。",
      "goods-retouch": "优化边缘、光影、材质层次，避免过修。",
      "goods-bg": "背景融合自然，透视与反射关系真实。",
      "goods-translate": "翻译后排版层级稳定，重点信息清晰可读。"
    },
    "platformOptions": ["全平台通用（16平台）", "淘宝", "天猫", "京东", "拼多多", "1688", "抖音电商", "快手电商", "小红书电商", "亚马逊", "Temu", "TikTok Shop", "阿里国际站", "速卖通", "Shopee", "OZON", "SHEIN"],
    "categoryOptions": ["服饰类", "鞋靴类", "箱包类", "珠宝饰品类", "美妆个护类", "食品饮料类", "家居百货类", "家电数码类", "家具大件类", "母婴玩具类", "宠物用品类", "汽配五金类"]
  }
}
```

## 3. 平台规则配置（JSON）

```json
{
  "platformRules": {
    "全平台通用（16平台）": {
      "level": "strict_generic",
      "defaultPrompt": "请按跨平台电商内容规范生成，保证主体清晰、信息可读、无违规营销元素。",
      "promptByTool": {
        "goods-marketing": "营销信息可展示，但不得遮挡主体关键结构；适配主图和活动位展示。",
        "goods-buyer": "强调真实感与生活化，不得伪造强品牌背书场景。",
        "goods-scene": "场景真实且与商品用途强相关，不制造违和背景。",
        "goods-detail": "细节展示清晰，不加入无关装饰物干扰。",
        "goods-sell": "卖点文案层级明确，不使用违规夸张承诺。",
        "goods-spoke": "人物表现自然，商品识别优先，避免误导性代言表达。",
        "goods-view": "各视角统一，避免角度错位和结构漂移。",
        "goods-retouch": "精修增强质感但不得改变商品真实属性。",
        "goods-bg": "背景替换后保持真实光影关系，避免拼贴痕迹。",
        "goods-translate": "翻译内容准确，版式尽量贴近原图层级。"
      }
    },
    "淘宝": {
      "level": "cn_market",
      "defaultPrompt": "适配淘宝商品展示习惯，主体清晰、信息直观、风格不过度夸张。",
      "promptByTool": {
        "goods-marketing": "可承载促销表达，但保持商品主体显著，避免牛皮癣式堆叠。",
        "goods-buyer": "保持真实买家视角，强化生活化与可信度。",
        "goods-scene": "场景表达服务商品，不喧宾夺主。",
        "goods-detail": "细节图强调材质、工艺和局部功能。",
        "goods-sell": "卖点图强化转化信息，主副标题清晰可读。",
        "goods-spoke": "代言图人物可用，但商品识别优先。",
        "goods-view": "视角规范统一，适配主图/详情页切图逻辑。",
        "goods-retouch": "精修提升质感，避免失真。",
        "goods-bg": "换背景后保持真实融合。",
        "goods-translate": "翻译排版保留电商阅读逻辑。"
      }
    },
    "天猫": {
      "level": "cn_brand",
      "defaultPrompt": "适配天猫品牌化展示，画面精致、主体完整、信息层级清晰。",
      "promptByTool": {}
    },
    "京东": {
      "level": "cn_standard",
      "defaultPrompt": "适配京东标准电商展示，主信息清晰，避免过重装饰。",
      "promptByTool": {}
    },
    "拼多多": {
      "level": "cn_conversion",
      "defaultPrompt": "适配拼多多高效率浏览场景，商品识别优先，信息表达直接。",
      "promptByTool": {}
    },
    "1688": {
      "level": "b2b",
      "defaultPrompt": "适配1688商采展示，强调规格、结构和材质可信度。",
      "promptByTool": {}
    },
    "抖音电商": {
      "level": "content_commerce",
      "defaultPrompt": "适配抖音电商内容场景，强调停留与识别平衡。",
      "promptByTool": {}
    },
    "快手电商": {
      "level": "content_commerce",
      "defaultPrompt": "适配快手电商浏览路径，主体清楚、表达直接。",
      "promptByTool": {}
    },
    "小红书电商": {
      "level": "lifestyle_commerce",
      "defaultPrompt": "适配小红书种草场景，强调审美与真实体验。",
      "promptByTool": {}
    },
    "亚马逊": {
      "level": "global_marketplace",
      "defaultPrompt": "适配亚马逊跨境展示，信息准确，主体识别优先。",
      "promptByTool": {}
    },
    "Temu": {
      "level": "global_marketplace",
      "defaultPrompt": "适配Temu快节奏浏览场景，卖点清晰、主体突出。",
      "promptByTool": {}
    },
    "TikTok Shop": {
      "level": "video_commerce",
      "defaultPrompt": "适配TikTok Shop电商场景，突出识别与传播表达。",
      "promptByTool": {}
    },
    "阿里国际站": {
      "level": "b2b_global",
      "defaultPrompt": "适配B2B国际买家浏览，强调参数、结构和可信度。",
      "promptByTool": {}
    },
    "速卖通": {
      "level": "global_marketplace",
      "defaultPrompt": "适配速卖通跨境零售展示，主体清楚，信息简洁。",
      "promptByTool": {}
    },
    "Shopee": {
      "level": "sea_marketplace",
      "defaultPrompt": "适配Shopee东南亚市场浏览习惯，强调可读与可识别。",
      "promptByTool": {}
    },
    "OZON": {
      "level": "ru_marketplace",
      "defaultPrompt": "适配OZON展示场景，保持主体清晰与信息直观。",
      "promptByTool": {}
    },
    "SHEIN": {
      "level": "fashion_marketplace",
      "defaultPrompt": "适配SHEIN时尚类展示逻辑，强调版型与穿搭表达。",
      "promptByTool": {}
    }
  }
}
```

## 4. 品类规则配置（JSON）

```json
{
  "categoryRules": {
    "服饰类": {
      "prompt": "保持版型、垂感、面料纹理和边缘结构真实，不可改动领型、袖长和衣身比例。"
    },
    "鞋靴类": {
      "prompt": "保持鞋型、鞋底结构和成对逻辑一致，避免镜像错误与鞋口塌陷。"
    },
    "箱包类": {
      "prompt": "保持包体立体结构和五金细节，避免塌陷、压扁和拉链结构错位。"
    },
    "珠宝饰品类": {
      "prompt": "强化高光与边缘净度，保护细链条和微小结构，不可丢失反光细节。"
    },
    "美妆个护类": {
      "prompt": "保持包装文案、瓶身结构和喷头细节真实，避免透明件边缘丢失。"
    },
    "食品饮料类": {
      "prompt": "保持包装信息可辨，不伪造食材飞溅或摆拍元素，避免误导性效果。"
    },
    "家居百货类": {
      "prompt": "保持结构比例与配件完整，混合材质边界清晰，避免组件遗漏。"
    },
    "家电数码类": {
      "prompt": "保持接口、按键、线材和装配缝真实，避免虚构发光和结构变形。"
    },
    "家具大件类": {
      "prompt": "保持体积感和透视关系，边角直线准确，避免比例失真。"
    },
    "母婴玩具类": {
      "prompt": "保持材质安全感和组件完整性，避免不真实夸张效果。"
    },
    "宠物用品类": {
      "prompt": "保持软垫、织物、塑料件真实质感，避免结构漂移。"
    },
    "汽配五金类": {
      "prompt": "保持孔位、棱边和尺寸结构准确，金属反光自然，不可虚构部件。"
    }
  }
}
```

## 5. 功能参数提示词配置（JSON）

```json
{
  "toolConfigs": {
    "goods-marketing": {
      "displayName": "一键营销主图",
      "paramPrompts": {
        "productType": "产品类型={productType}",
        "sceneBackground": "场景背景={sceneBackground}",
        "platformInfo": "平台信息={platformInfo}",
        "productInfo": "商品信息={productInfo}",
        "visualStyle": "视觉风格={visualStyle}",
        "marketingElements": "营销元素={marketingElements}",
        "copyLanguage": "文案语种={copyLanguage}"
      }
    },
    "goods-buyer": {
      "displayName": "一键买家秀",
      "paramPrompts": {
        "productType": "产品类型={productType}",
        "productState": "产品状态={productState}",
        "presentationStyle": "呈现方式={presentationStyle}",
        "sceneAtmosphere": "场景氛围={sceneAtmosphere}",
        "productReality": "产品真实感={productReality}",
        "environmentReality": "环境真实感={environmentReality}",
        "shotReality": "拍摄真实感={shotReality}",
        "targetMarket": "目标市场={targetMarket}"
      }
    },
    "goods-scene": {
      "displayName": "一键场景图",
      "paramPrompts": {
        "productType": "产品类型={productType}",
        "sceneType": "场景类型={sceneType}",
        "productDisplay": "产品展示={productDisplay}",
        "layoutStyle": "排版呈现={layoutStyle}",
        "moodStyle": "氛围营造={moodStyle}",
        "valueFocus": "价值导向={valueFocus}",
        "targetMarket": "目标市场={targetMarket}",
        "copyLanguage": "文案语种={copyLanguage}"
      }
    },
    "goods-detail": {
      "displayName": "一键细节图",
      "paramPrompts": {
        "productType": "产品类型={productType}",
        "displayType": "展示形式={displayType}"
      }
    },
    "goods-sell": {
      "displayName": "一键卖点图",
      "paramPrompts": {
        "productType": "产品类型={productType}",
        "sceneType": "场景类型={sceneType}",
        "copyLanguage": "文案语种={copyLanguage}",
        "coreSellingPoint": "核心卖点={coreSellingPoint}",
        "presentationForm": "表现形式={presentationForm}",
        "sellingPointFocus": "卖点重心={sellingPointFocus}",
        "mainTitle": "主副标题={mainTitle}",
        "subtitle": "副标题={subtitle}",
        "fontStyle": "字体风格={fontStyle}",
        "assistElement": "元素辅助={assistElement}",
        "targetMarket": "目标市场={targetMarket}"
      }
    },
    "goods-spoke": {
      "displayName": "一键代言图",
      "paramPrompts": {
        "productType": "产品类型={productType}",
        "interactionType": "互动方式={interactionType}",
        "characterTrait": "人物特点={characterTrait}",
        "sceneBackground": "场景背景={sceneBackground}",
        "layoutStyle": "排版方式={layoutStyle}",
        "skinTone": "人种肤色={skinTone}",
        "genderStyle": "性别风格={genderStyle}",
        "ageTrait": "年龄特点={ageTrait}",
        "displayFocus": "展示重点={displayFocus}",
        "targetMarket": "目标市场={targetMarket}"
      }
    },
    "goods-view": {
      "displayName": "一键三视角",
      "paramPrompts": {
        "cameraAngle": "视角方案={cameraAngle}",
        "platformInfo": "平台信息={platformInfo}",
        "platformRuleDetail": "平台细则={platformRuleDetail}"
      }
    },
    "goods-retouch": {
      "displayName": "产品精修",
      "paramPrompts": {
        "platform": "电商平台={platform}",
        "region": "地区={region}"
      }
    },
    "goods-bg": {
      "displayName": "AI换背景",
      "paramPrompts": {
        "backgroundType": "背景类型={backgroundType}",
        "lightingStyle": "风格与光影={lightingStyle}"
      }
    },
    "goods-translate": {
      "displayName": "图片翻译",
      "paramPrompts": {
        "targetLanguage": "目标语种={targetLanguage}",
        "platformInfo": "平台信息={platformInfo}",
        "platformRuleDetail": "平台细则={platformRuleDetail}"
      }
    }
  }
}
```

## 6. 输出规格与补充段配置（JSON）

```json
{
  "outputPromptConfig": {
    "ratioTemplate": "输出比例={ratio}",
    "resolutionTemplate": "输出分辨率={resolution}",
    "countTemplate": "输出数量={count}",
    "supplementTemplate": "补充要求：{supplement}",
    "appendOrder": ["ratio", "resolution", "count", "supplement"]
  }
}
```

## 7. 最终拼装示例（JSON输入 + 文本输出）

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
    "supplement": "强调针织纹理和卖点层级。"
  },
  "strict": true
}
```

输出（示例）：

```text
生成可用于电商主图与活动投放的营销主图。

当前商品品类为「服饰类」，请保持该品类应有的真实结构、材质、颜色与比例，不改变SKU核心特征。

适配淘宝商品展示习惯，主体清晰、信息直观、风格不过度夸张。

可承载促销表达，但保持商品主体显著，避免牛皮癣式堆叠。

产品类型=服装；场景背景=产品场景；平台信息=淘宝；商品信息=名称+卖点+价格+促销；视觉风格=时尚潮流；营销元素=折扣标识；文案语种=简体中文。

信息层级清晰，卖点可读，商品主体识别优先，避免过度特效。

输出比例=1:1；输出分辨率=1K；输出数量=1。

补充要求：强调针织纹理和卖点层级。
```

