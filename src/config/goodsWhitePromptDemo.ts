import {
  buildGoodsWhitePromptWithMeta,
  goodsWhiteCategoryRecognitionPrompt,
  type GoodsWhitePromptParams
} from "./goodsWhitePromptConfig";

/**
 * 品类识别模型输入参数示例（字段含义）
 */
type CategoryRecognitionInput = {
  // 用户上传的商品图 URL 或文件标识
  imageUrl: string;
  // 可选：用户填写的商品标题，作为弱参考，不可覆盖图片事实
  title?: string;
};

/**
 * 品类识别模型输出参数示例（字段含义）
 */
type CategoryRecognitionOutput = {
  // 英文短 ID（kebab-case），便于程序判断
  categoryId: string;
  // 中文品类名，用于提示词拼装
  categoryLabel: string;
  // 识别置信度（0~1）
  confidence: number;
  // 视觉依据关键词
  keywords: string[];
};

/**
 * Demo: 从“品类识别结果 + 用户选平台 + 用户补充”构造最终白底图提示词
 */
export function demoBuildGoodsWhitePrompt() {
  const categoryRecognitionInput: CategoryRecognitionInput = {
    imageUrl: "https://example.com/uploads/product-001.jpg",
    title: "便携式胶囊咖啡机"
  };

  const categoryRecognitionOutput: CategoryRecognitionOutput = {
    categoryId: "home-appliance",
    categoryLabel: "小家电",
    confidence: 0.93,
    keywords: ["电器", "按键", "塑料外壳", "出液结构"]
  };

  const promptParams: GoodsWhitePromptParams = {
    // AI 识别出的品类中文名
    productCategory: categoryRecognitionOutput.categoryLabel,
    // 用户前端选择的平台
    platformLabel: "亚马逊",
    // 用户可选的补充要求
    extraDetails: "请让机身边缘更干净，黑色区域保留层次，不要过曝。"
  };

  const built = buildGoodsWhitePromptWithMeta(promptParams);

  return {
    categoryRecognitionInput,
    categoryRecognitionPrompt: goodsWhiteCategoryRecognitionPrompt,
    categoryRecognitionOutput,
    promptParams,
    built
  };
}
