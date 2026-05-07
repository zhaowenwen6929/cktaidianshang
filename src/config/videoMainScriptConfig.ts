export type VideoMainScriptFieldKey =
  | "videoMainSellingPoint"
  | "videoMainType"
  | "videoMainMarketingNeed"
  | "videoMainRhythm"
  | "videoMainMusicMood"
  | "videoMainVisualStyle"
  | "videoMainAudience"
  | "videoMainCharacterFit";

export type VideoMainScriptFieldConfig = {
  key: VideoMainScriptFieldKey;
  label: string;
  options: string[];
  prompt: string;
  aiKeywords: string[];
};

export const videoMainScriptFieldConfigs: VideoMainScriptFieldConfig[] = [
  {
    key: "videoMainSellingPoint",
    label: "卖点名称",
    options: ["智能识别"],
    prompt: "提炼产品最核心卖点名称，简短直接，适合视频脚本标题化表达。",
    aiKeywords: ["卖点", "主图", "细节", "对比", "展示"]
  },
  {
    key: "videoMainType",
    label: "视频类型",
    options: [
      "智能匹配",
      "电商主图视频",
      "口播/评测讲解",
      "场景种草",
      "品牌形象大片",
      "主体/细节展示",
      "穿搭/佩戴展示",
      "使用教程",
      "品牌匠心",
      "活动促销",
      "痛点解决",
      "沉浸式开箱",
      "达人Vlog种草"
    ],
    prompt: "按商品属性与营销目标匹配最合适的视频内容类型。",
    aiKeywords: ["开箱", "测评", "展示", "场景", "教程", "直播"]
  },
  {
    key: "videoMainMarketingNeed",
    label: "营销诉求",
    options: [
      "智能匹配",
      "产品展示/核心卖点",
      "制造焦虑/放大痛点",
      "彰显品味/品牌溢价",
      "极致性价比/促单",
      "科普评测/建立信任",
      "猎奇吸睛/强力促停",
      "颜值暴击/纯享种草"
    ],
    prompt: "明确本条视频最核心的营销诉求方向，保证内容聚焦。",
    aiKeywords: ["转化", "种草", "曝光", "促销", "上新"]
  },
  {
    key: "videoMainRhythm",
    label: "内容节奏",
    options: ["智能匹配", "简单分镜", "一镜到底", "多分镜叙述", "黄金三秒痛点法", "娓娓道来", "暴力测评", "流行卡点"],
    prompt: "确定视频镜头推进节奏与叙事组织方式。",
    aiKeywords: ["快", "慢", "节奏", "舒缓", "紧凑"]
  },
  {
    key: "videoMainMusicMood",
    label: "音乐氛围",
    options: [
      "智能匹配",
      "治愈解压/松弛感",
      "燃向/高燃动感",
      "温馨日常/烟火气",
      "幽默搞笑/趣味",
      "催泪走心/共情",
      "高冷克制/距离感",
      "猎奇悬疑/强吸睛",
      "自信独立/大女主风",
      "清新纯净/元气感",
      "潮酷叛逆/街头感",
      "高燃动感/荷尔蒙",
      "软萌可爱/童趣感"
    ],
    prompt: "选择与脚本情绪一致的配乐氛围关键词。",
    aiKeywords: ["轻快", "高级", "治愈", "科技", "氛围"]
  },
  {
    key: "videoMainVisualStyle",
    label: "视觉风格",
    options: [
      "极简白底",
      "高级棚拍",
      "生活方式",
      "轻奢大片",
      "科技简约",
      "温馨家居",
      "时尚大片",
      "活泼趣味",
      "品牌极简",
      "工业硬朗",
      "黑白光影",
      "赛博朋克",
      "运动潮流",
      "多巴胺/高饱和"
    ],
    prompt: "定义画面美术风格与摄影基调，保持成片统一。",
    aiKeywords: ["简约", "高级", "清新", "科技", "复古"]
  },
  {
    key: "videoMainAudience",
    label: "受众群体",
    options: ["职场精英/白领", "精致Z世代/潮人", "宝妈/家庭主妇", "学生党/年轻群体", "银发族/中老年", "户外/运动硬核玩家", "泛大众/下沉市场"],
    prompt: "指定主要受众群体，便于输出更贴合的表达方式。",
    aiKeywords: ["女性", "男性", "通用", "年轻", "家庭"]
  },
  {
    key: "videoMainCharacterFit",
    label: "人物适配",
    options: ["无人物", "局部出境", "亚洲时尚女性", "欧美成熟男性", "宠物展示", "动漫角色", "虚拟偶像", "国风端庄女性", "专业人士"],
    prompt: "确定人物是否出镜及人物调性，提升镜头代入感。",
    aiKeywords: ["人物", "模特", "真人", "特写"]
  }
];

export const videoMainVoiceLanguageOptions = [
  "中文普通话",
  "中文粤语",
  "英语",
  "日语",
  "韩语",
  "法语",
  "德语",
  "西班牙语",
  "葡萄牙语",
  "意大利语",
  "泰语",
  "越南语"
];

export const videoMainVoiceToneOptions = [
  "清爽女声",
  "温柔女声",
  "甜美女声",
  "知性女声",
  "浑厚男音",
  "磁性男声",
  "年轻男声",
  "专业广告旁白",
  "自然种草口吻",
  "自定义上传"
];
