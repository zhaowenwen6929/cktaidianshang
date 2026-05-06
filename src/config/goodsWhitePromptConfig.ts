export type GoodsWhiteRuleSourceLevel = "official_explicit" | "official_indirect" | "public_secondary";

export type GoodsWhitePlatformRule = {
  label: string;
  sourceLevel: GoodsWhiteRuleSourceLevel;
  prompt: string;
  outputIntent: "main-image";
  allowShadow: boolean;
  shadowLevel: "none" | "weak";
  preferredRatios: string[];
  forbidElements: string[];
  notes?: string;
};

export type GoodsWhiteCategoryRule = {
  label: string;
  aliases: string[];
  prompt: string;
  focusPoints: string[];
};

export type GoodsWhitePromptParams = {
  // AI 识别后的标准品类名称，如：小家电、鞋靴类、箱包类
  productCategory: string;
  // 用户在前端选择的平台名称，如：亚马逊、TikTok Shop、全平台通用（16平台）
  platformLabel: string;
  // 用户在“细节补充”里的额外要求，非必填
  extraDetails?: string;
  // 强制覆写平台规则文案，通常用于运营临时活动或平台专项规则
  customPlatformRulePrompt?: string;
};

export type GoodsWhitePromptBuildResult = {
  finalPrompt: string;
  segments: {
    taskPrompt: string;
    productPrompt: string;
    platformPrompt: string;
    platformRulePrompt: string;
    globalRulePrompt: string;
    categoryRulePrompt: string;
    extraDetailsPrompt: string;
  };
  matched: {
    platformRuleLabel: string;
    categoryRuleLabel: string;
    platformRuleSourceLevel: GoodsWhiteRuleSourceLevel;
  };
};

export type GoodsWhitePromptBuildStrictParams = GoodsWhitePromptParams & {
  strict: true;
};

export const goodsWhiteUniversalPlatformLabel = "全平台通用（16平台）";

export const goodsWhitePlatformLabels = [
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
] as const;

export const goodsWhitePlatformOptions = [goodsWhiteUniversalPlatformLabel, ...goodsWhitePlatformLabels] as const;

export const goodsWhiteGlobalRulePrompt =
  "输出纯白背景（RGB 255,255,255），仅保留实际售卖商品主体，不添加人物、手模、道具、文字、水印、Logo、边框、贴纸、价格标签、营销角标或任何其他促销元素；商品主体完整居中，边缘清晰锐利，不截断、不缺角、不拉伸、不变形；默认仅允许非常轻微且自然的接触阴影，禁止明显投影；保留商品真实颜色、材质、纹理、透明件、金属件与高反光细节，不过曝，不过暗，不过度磨皮，不过度锐化，不得使用与实物不符的渲染替代图；最终输出为真实、专业、干净、可直接上架的标准商品白底图。";

export const goodsWhiteUniversalPresetConfig = {
  label: goodsWhiteUniversalPlatformLabel,
  platforms: goodsWhitePlatformLabels,
  prompt: [
    "任务目标：生成适用于多平台上架的全品类商品标准白底主图。",
    `适用平台：${goodsWhitePlatformLabels.join("、")}。`,
    "背景要求：纯白背景（RGB 255,255,255），画面干净通透，不出现色偏、杂色、背景纹理或场景元素。",
    "主体要求：仅保留商品主体，主体完整居中，边缘清晰锐利，不截断、不缺角、不拉伸、不变形，主体占画面合理比例，适合主图陈列。",
    "合规要求：不添加人物、手模、道具、文字、水印、Logo、边框、贴纸、价格标签、促销角标或任何营销信息。",
    "光影要求：允许非常轻微且自然的接触阴影或弱倒影，用于体现悬浮感与立体感，但不能影响白底纯净度和平台合规性。",
    "质感要求：保留商品真实颜色、材质、纹理、透明件、金属件、高反光细节与结构层次，不过曝，不过暗，不过度磨皮，不过度锐化。",
    "输出要求：整体呈现为真实、专业、可直接上架的电商商品白底图，避免风格化背景、夸张特效和非商品信息干扰。"
  ].join(" "),
  tags: ["白底主图", "全平台通用", "全品类", "电商合规", "可直接上架"]
} as const;

const basePlatformRulePrompt =
  "请优先满足该平台对商品主图/白底图的通用审核要求，确保首图适合搜索卡、商品卡和详情首图直接上架使用。";

export const goodsWhitePlatformRuleConfigs: GoodsWhitePlatformRule[] = [
  {
    label: goodsWhiteUniversalPlatformLabel,
    sourceLevel: "official_explicit",
    prompt: goodsWhiteUniversalPresetConfig.prompt,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1", "3:4", "4:5"],
    forbidElements: ["人物", "手模", "道具", "文字", "水印", "Logo", "边框", "贴纸", "价格标签", "营销角标"]
  },
  {
    label: "淘宝",
    sourceLevel: "public_secondary",
    prompt: `${basePlatformRulePrompt} 以干净白底主图为主，不添加牛皮癣式营销信息，主体清晰完整，适配平台首图展示。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1", "3:4", "4:5"],
    forbidElements: ["人物", "手模", "营销文案", "价格标签", "促销角标", "边框", "水印"]
  },
  {
    label: "天猫",
    sourceLevel: "public_secondary",
    prompt: `${basePlatformRulePrompt} 保持高品质标准白底商品图，不添加无关营销覆盖元素，突出品牌电商陈列感。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1", "3:4", "4:5"],
    forbidElements: ["人物", "手模", "营销文案", "价格标签", "边框", "水印"]
  },
  {
    label: "京东",
    sourceLevel: "public_secondary",
    prompt: `${basePlatformRulePrompt} 商品主图需干净、规整、信息纯净，避免平台审核敏感的价签、促销字样和过重阴影。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1"],
    forbidElements: ["营销文案", "价格标签", "促销角标", "水印", "边框", "人物"]
  },
  {
    label: "拼多多",
    sourceLevel: "public_secondary",
    prompt: `${basePlatformRulePrompt} 优先输出纯白底、主体突出、识别效率高的首图，不叠加营销信息和无关背景元素。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1"],
    forbidElements: ["营销文案", "价格标签", "贴纸", "水印", "边框", "人物"]
  },
  {
    label: "1688",
    sourceLevel: "public_secondary",
    prompt: `${basePlatformRulePrompt} 适合 B 端商品陈列的标准白底图，强调商品结构、材质和规格感，不叠加促销元素。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1"],
    forbidElements: ["营销文案", "价格标签", "贴纸", "人物", "边框", "水印"]
  },
  {
    label: "抖音电商",
    sourceLevel: "public_secondary",
    prompt: `${basePlatformRulePrompt} 适配商品卡和商城搜索场景，保持纯白底、主体完整、识别直接，不叠加文案和图形元素。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1", "3:4"],
    forbidElements: ["文案", "价格标签", "贴纸", "人物", "边框", "水印"]
  },
  {
    label: "快手电商",
    sourceLevel: "public_secondary",
    prompt: `${basePlatformRulePrompt} 适配商品卡首图陈列，画面需干净、清晰、主体集中，不加入促销覆盖物。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1", "3:4"],
    forbidElements: ["文案", "价格标签", "贴纸", "人物", "边框", "水印"]
  },
  {
    label: "小红书电商",
    sourceLevel: "official_indirect",
    prompt: `${basePlatformRulePrompt} 兼容平台公开的商品图比例要求，优先适配 1:1 或 3:4，保持白底、主体清晰、适合种草商品卡展示。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1", "3:4"],
    forbidElements: ["文案", "价格标签", "贴纸", "人物", "边框", "水印"]
  },
  {
    label: "亚马逊",
    sourceLevel: "official_explicit",
    prompt:
      "请严格遵守 Amazon 主图规则：主图使用纯白背景（RGB 255,255,255），仅展示实际售卖商品本体，不添加文字、Logo、水印、边框、额外图形或非售卖配件；商品应尽可能占据画面主要区域，适合直接用作主图上架。",
    outputIntent: "main-image",
    allowShadow: false,
    shadowLevel: "none",
    preferredRatios: ["1:1"],
    forbidElements: ["文字", "Logo", "水印", "边框", "贴纸", "价格标签", "人物", "道具", "非售卖配件"]
  },
  {
    label: "Temu",
    sourceLevel: "public_secondary",
    prompt: `${basePlatformRulePrompt} 优先生成纯白或极干净中性背景的标准主图，商品本体完整且高识别，不叠加营销信息。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1"],
    forbidElements: ["文案", "价格标签", "贴纸", "人物", "边框", "水印"]
  },
  {
    label: "TikTok Shop",
    sourceLevel: "official_explicit",
    prompt:
      "请严格遵守 TikTok Shop 首图规则：主图必须使用纯白背景，展示商品正面实体视图，不得添加 Logo、文字、边框、水印和图形覆盖，图片必须真实准确反映售卖商品。",
    outputIntent: "main-image",
    allowShadow: false,
    shadowLevel: "none",
    preferredRatios: ["1:1"],
    forbidElements: ["文字", "Logo", "水印", "边框", "贴纸", "人物", "图形覆盖"]
  },
  {
    label: "阿里国际站",
    sourceLevel: "official_indirect",
    prompt: `${basePlatformRulePrompt} 适合跨境 B2B 买家快速识别的高质量标准白底商品图，强调商品结构、材质和真实外观。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1"],
    forbidElements: ["营销文案", "贴纸", "人物", "边框", "水印"]
  },
  {
    label: "速卖通",
    sourceLevel: "public_secondary",
    prompt: `${basePlatformRulePrompt} 输出适合跨境零售上架的标准白底主图，主体清晰完整，无营销覆盖和复杂背景干扰。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1"],
    forbidElements: ["营销文案", "价格标签", "贴纸", "人物", "边框", "水印"]
  },
  {
    label: "Shopee",
    sourceLevel: "public_secondary",
    prompt: `${basePlatformRulePrompt} 优先输出干净高识别的标准白底首图，主体占比高，不添加文案、边框和促销覆盖元素。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1"],
    forbidElements: ["文案", "价格标签", "贴纸", "人物", "边框", "水印"]
  },
  {
    label: "OZON",
    sourceLevel: "official_indirect",
    prompt: `${basePlatformRulePrompt} 参考 Ozon 官方卖家公开建议，主图优先使用白色或浅色中性背景；为统一跨平台复用，请按纯白背景执行。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1"],
    forbidElements: ["文案", "价格标签", "贴纸", "人物", "边框", "水印"]
  },
  {
    label: "SHEIN",
    sourceLevel: "public_secondary",
    prompt: `${basePlatformRulePrompt} 输出适合跨境时尚零售上架的标准白底商品图，主体清晰完整，适配方图和竖图商品卡展示。`,
    outputIntent: "main-image",
    allowShadow: true,
    shadowLevel: "weak",
    preferredRatios: ["1:1", "3:4", "4:5"],
    forbidElements: ["文案", "价格标签", "贴纸", "人物", "边框", "水印"]
  }
];

export const goodsWhiteCategoryRuleConfigs: GoodsWhiteCategoryRule[] = [
  {
    label: "服饰类",
    aliases: ["女装", "男装", "童装", "内衣", "袜子", "服饰", "上衣", "裤子", "裙子"],
    prompt: "该商品属于服饰类，请保持服装真实版型、面料纹理、垂感与轮廓结构，不添加真人模特、衣架、夹子与摆拍道具，避免把服饰边缘抠坏、压扁或改掉袖长、领型与版型比例。",
    focusPoints: ["版型", "面料纹理", "轮廓边缘", "白色衣物边缘保护"]
  },
  {
    label: "鞋靴类",
    aliases: ["运动鞋", "皮鞋", "凉鞋", "靴子", "鞋", "鞋靴"],
    prompt: "该商品属于鞋靴类，请保留鞋面材质、鞋底结构、鞋带与鞋型轮廓，保证左右脚或成对展示逻辑正确，不出现镜像错误、鞋底变形、鞋口塌陷或细节缺失。",
    focusPoints: ["成对逻辑", "鞋型", "鞋底结构", "鞋面材质"]
  },
  {
    label: "箱包类",
    aliases: ["双肩包", "女包", "箱包", "行李箱", "钱包", "背包"],
    prompt: "该商品属于箱包类，请保持包体立体结构与容量感，保留五金、拉链、肩带、手柄和缝线细节，避免包体被压扁、塌陷或失去真实轮廓。",
    focusPoints: ["立体结构", "五金", "拉链", "肩带手柄"]
  },
  {
    label: "珠宝饰品类",
    aliases: ["项链", "戒指", "耳饰", "手链", "首饰", "珠宝", "饰品"],
    prompt: "该商品属于珠宝饰品类，请强化边缘净度并准确保留金属、钻石、珍珠、宝石等高反光细节，默认只允许极弱接触阴影，防止细链条、透明件和微小结构丢失。",
    focusPoints: ["高反光", "细链条", "边缘净度", "透明件保护"]
  },
  {
    label: "美妆个护类",
    aliases: ["护肤品", "彩妆", "洗护", "香水", "美妆", "个护"],
    prompt: "该商品属于美妆个护类，请确保包装文案、品牌标识、瓶身形态、泵头、喷嘴和盖体结构保真，避免透明瓶边缘丢失、瓶身变形或高光过曝。",
    focusPoints: ["包装文案保真", "瓶身结构", "泵头喷嘴", "透明瓶边缘"]
  },
  {
    label: "食品饮料类",
    aliases: ["零食", "茶饮", "粮油", "保健食品", "食品", "饮料"],
    prompt: "该商品属于食品饮料类，请仅展示合法可售商品包装，不伪造食材外露、液体飞溅、蒸汽或配菜摆盘效果，并保证口味、规格、净含量等包装信息清晰可辨。",
    focusPoints: ["包装完整", "信息可辨", "不伪造食材效果", "不加摆盘"]
  },
  {
    label: "家居百货类",
    aliases: ["收纳用品", "厨具", "清洁用品", "家纺", "家居", "百货"],
    prompt: "该商品属于家居百货类，请保持结构比例准确，套装商品保证配件完整，并对玻璃、塑料、金属等混合材质分别保真，避免结构错位或配件遗漏。",
    focusPoints: ["结构比例", "配件完整", "混合材质保真", "边角准确"]
  },
  {
    label: "家电数码类",
    aliases: ["小家电", "耳机", "手机配件", "鼠标", "键盘", "数码", "家电"],
    prompt: "该商品属于家电数码类，请保留接口、按键、屏幕、线材、开孔和装配缝等关键结构，不得虚构发光效果，并确保黑色或深色产品边缘清晰可辨。",
    focusPoints: ["接口按键", "线材结构", "黑色边缘保护", "金属塑料边界"]
  },
  {
    label: "家具大件类",
    aliases: ["桌椅", "柜体", "沙发", "家具"],
    prompt: "该商品属于家具大件类，请保持体积感、边角直线和透视关系准确，允许适度留白但主体必须完整，不得压缩透视导致比例失真。",
    focusPoints: ["体积感", "边角直线", "透视准确", "主体完整"]
  },
  {
    label: "母婴玩具类",
    aliases: ["婴童用品", "益智玩具", "毛绒玩具", "母婴", "玩具"],
    prompt: "该商品属于母婴玩具类，请禁止加入儿童模特，保留绒面、软材质、塑胶件和多配件组合的真实质感，保证所有组件齐全完整。",
    focusPoints: ["无儿童模特", "绒面保真", "软材质", "组件齐全"]
  },
  {
    label: "宠物用品类",
    aliases: ["宠物窝", "宠物玩具", "喂食器", "宠物用品"],
    prompt: "该商品属于宠物用品类，请默认不加入宠物模特，只展示售卖商品本体，并对软垫、绳结、塑料件等不同材质分别保真。",
    focusPoints: ["无宠物模特", "软垫结构", "绳结保真", "塑料件细节"]
  },
  {
    label: "汽配五金类",
    aliases: ["车载支架", "工具", "配件耗材", "汽配", "五金"],
    prompt: "该商品属于汽配五金类，请强调结构、尺寸、孔位、棱边和安装位准确，金属件保持真实反光，禁止虚构安装环境和额外部件。",
    focusPoints: ["孔位尺寸", "棱边结构", "金属反光", "不虚构安装环境"]
  }
];

export const goodsWhitePromptComposerConfig = {
  taskPrompt: "请基于上传的商品原图，生成适用于电商平台上架的合规商品白底主图。",
  productPromptTemplate:
    "当前商品品类为「{productCategory}」。请确保保留该品类商品应有的真实结构、材质、颜色、纹理、比例关系与细节特征，禁止错误改造商品形态，禁止替换商品主体。",
  platformPromptTemplate:
    "目标平台为「{platformLabel}」。请优先满足该平台对商品主图/白底图的通用规范，确保画面适合平台首图展示与直接上架使用。",
  globalRulePrompt: goodsWhiteGlobalRulePrompt
} as const;

export const goodsWhiteCategoryRecognitionPrompt = [
  "你是一位电商商品图理解与品类识别专家。",
  "你的任务是：根据上传商品图识别最可能的商品品类，并输出结构化 JSON 结果，供白底图提示词拼装使用。",
  "请只基于图片可见信息判断，不要猜测品牌或不存在的功能。",
  "如果图片信息不足，请输出通用品类并降低置信度。",
  "",
  "输出字段要求：",
  "1) categoryId: 英文短 ID，使用 kebab-case，例如 home-appliance、fashion-top、shoes-sneakers。",
  "2) categoryLabel: 中文品类名，必须可读，例如 小家电、服饰类、鞋靴类、箱包类。",
  "3) confidence: 0 到 1 的小数，保留两位。",
  "4) keywords: 3~8 个关键词，描述你判断该品类的视觉依据，例如 材质、结构、部件。",
  "",
  "输出格式要求：",
  "1) 只输出 JSON，不要输出解释文字。",
  "2) 必须包含 categoryId、categoryLabel、confidence、keywords 四个字段。",
  "3) keywords 必须是字符串数组。",
  "",
  "当无法确定具体品类时：",
  "categoryId 使用 general-merchandise，categoryLabel 使用 通用品类，confidence 不高于 0.55。"
].join("\n");

function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

export function getGoodsWhitePlatformRule(platformLabel: string) {
  return goodsWhitePlatformRuleConfigs.find((item) => item.label === platformLabel) ?? null;
}

export function getGoodsWhiteCategoryRule(categoryLabel: string) {
  const normalizedCategory = normalizeLabel(categoryLabel);
  return (
    goodsWhiteCategoryRuleConfigs.find(
      (item) => normalizeLabel(item.label) === normalizedCategory || item.aliases.some((alias) => normalizeLabel(alias) === normalizedCategory)
    ) ?? null
  );
}

export function buildGoodsWhitePrompt(params: GoodsWhitePromptParams) {
  return buildGoodsWhitePromptWithMeta({
    ...params,
    strict: false
  }).finalPrompt;
}

export function buildGoodsWhitePromptStrict(params: GoodsWhitePromptBuildStrictParams) {
  return buildGoodsWhitePromptWithMeta(params);
}

export function buildGoodsWhitePromptWithMeta(params: GoodsWhitePromptParams & { strict?: boolean }): GoodsWhitePromptBuildResult {
  const platformRule = getGoodsWhitePlatformRule(params.platformLabel);
  const categoryRule = getGoodsWhiteCategoryRule(params.productCategory);
  const strict = Boolean(params.strict);

  if (strict && !platformRule) {
    throw new Error(`Strict mode: 未命中平台规则配置，platformLabel=${params.platformLabel}`);
  }
  if (strict && !categoryRule) {
    throw new Error(`Strict mode: 未命中品类规则配置，productCategory=${params.productCategory}`);
  }

  const taskPrompt = goodsWhitePromptComposerConfig.taskPrompt;
  const productPrompt = goodsWhitePromptComposerConfig.productPromptTemplate.replace("{productCategory}", params.productCategory || "通用品类");
  const platformPrompt = goodsWhitePromptComposerConfig.platformPromptTemplate.replace("{platformLabel}", params.platformLabel || goodsWhiteUniversalPlatformLabel);
  const platformRulePrompt = params.customPlatformRulePrompt || platformRule?.prompt || (strict ? "" : goodsWhiteUniversalPresetConfig.prompt);
  const categoryPrompt = categoryRule?.prompt || (strict ? "" : "请保留该商品所属品类应有的结构特征、材质细节和真实轮廓，避免因抠图、修边或过度润色导致主体失真。");

  const extraDetailsPrompt = params.extraDetails?.trim() ? `补充要求：${params.extraDetails.trim()}` : "";
  const segments = [taskPrompt, productPrompt, platformPrompt, platformRulePrompt, goodsWhitePromptComposerConfig.globalRulePrompt, categoryPrompt, extraDetailsPrompt].filter(
    Boolean
  ) as string[];
  const finalPrompt = segments.join("\n\n");
  const categoryRulePrompt = categoryPrompt;
  const globalRulePrompt = goodsWhitePromptComposerConfig.globalRulePrompt;

  return {
    finalPrompt,
    segments: {
      taskPrompt,
      productPrompt,
      platformPrompt,
      platformRulePrompt,
      globalRulePrompt,
      categoryRulePrompt,
      extraDetailsPrompt
    },
    matched: {
      platformRuleLabel: platformRule?.label ?? goodsWhiteUniversalPlatformLabel,
      categoryRuleLabel: categoryRule?.label ?? "通用品类兜底规则",
      platformRuleSourceLevel: platformRule?.sourceLevel ?? "official_explicit"
    }
  };
}
