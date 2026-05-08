import type { ToolDefinition } from "../types";

const defaultCreationModes = {
  label: "创作方式",
  options: [
    { id: "normal", label: "普通模式" },
    { id: "advanced", label: "高级模式" },
    { id: "cn-enhanced", label: "中文增强" }
  ]
} satisfies ToolDefinition["creationModes"];

export const tools: ToolDefinition[] = [
  {
    slug: "product-retouch",
    name: "产品精修",
    shortName: "产品精修",
    category: "AI商品图",
    description: "上传商品图后进行原图精修或主体提取精修，统一产出到任务中心。",
    keywords: "产品精修,AI商品图,商品图优化,电商图片精修",
    heroTitle: "产品精修",
    heroDescription: "一键提升商品主体质感，适合详情页、主图和活动页素材生产。",
    tags: ["保留主体", "电商高频", "任务归档"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        helperText: "批量模式最多上传 24 张",
        maxCount: 24
      }
    },
    modeChoice: {
      label: "选择模式",
      options: [
        { label: "原图精修", description: "产品图不变，提示产品主体材质与高级感。" },
        { label: "提取主体精修", description: "提取图片主体产品，进行精修，正面展示。" }
      ]
    },
    creationModes: {
      label: "创作模式",
      options: [
        { id: "general", label: "通用模式" },
        { id: "pro", label: "Pro 模式" }
      ]
    },
    ratioOptions: ["自动", "1:1", "4:5", "3:4"],
    resolutionOptions: ["1K", "2K", "4K"],
    batchCountOptions: ["1", "2"],
    supplement: {
      label: "补充说明",
      helperText: "选填",
      placeholder: "请输入对所有图片都适用的额外补充说明，例如：质感更高级，保持黑色光影，背景更干净。"
    }
  },
  {
    slug: "model-tryon",
    name: "模特换装",
    shortName: "模特换装",
    category: "AI商品图",
    description: "服饰类商品快速替换模特穿搭场景，输出统一归档。",
    keywords: "模特换装,服饰电商,AI试衣,商品图",
    heroTitle: "模特换装",
    heroDescription: "快速生产模特场景商品图，适配服饰、鞋帽和配饰类目。",
    tags: ["服饰类", "模特场景", "批量生产"]
  },
  {
    slug: "model-change",
    name: "模特调整",
    shortName: "模特调整",
    category: "AI商品图",
    description: "围绕模特图执行换模特、换表情、多角度、多姿势、发型调整和微调，单图生成结果。",
    keywords: "模特调整,AI换模特,模特换表情,模特多角度,模特多姿势,模特发型,模特微调",
    heroTitle: "模特调整",
    heroDescription: "上传模特图后选择调整方式，针对人物外观和姿态进行定向生成。",
    tags: ["人物调整", "单图生成", "服饰电商"],
    uploads: {
      main: {
        label: "上传模特图",
        required: true,
        maxCount: 1
      },
      reference: {
        label: "上传参考图",
        maxCount: 1
      }
    },
    editModes: {
      label: "调整方式",
      options: [
        {
          id: "replace-model",
          prompt:
            "在保留原图服装、商品、构图、光线和主体展示逻辑的前提下，替换为新的真人模特。新模特需与服饰穿着关系自然，肢体结构合理，保持电商成片质感，避免多余人物、畸形手脚、服装变形和面部失真。",
          label: "AI换模特",
          fields: [
            {
              type: "textarea",
              key: "model-request",
              field: {
                label: "需求描述",
                placeholder: "补充对生图模特的要求等"
              }
            }
          ]
        },
        {
          id: "change-expression",
          prompt:
            "仅调整模特面部表情，保持人物身份、发型、服装、姿势、镜头角度和背景基本不变。要求五官结构自然，嘴部与眼神协调，避免夸张变形、面部崩坏和年龄气质漂移。",
          label: "模特换表情",
          fields: [
            {
              type: "input-select",
              key: "expression",
              field: {
                label: "模特表情",
                required: true,
                placeholder: "请选择，或直接输入",
                options: ["严肃", "微笑", "开心", "大笑"],
                optionPrompts: {
                  严肃: "表情克制冷静，嘴角自然收住，眼神稳定有力量，适合高级感、专业感或冷淡风展示。",
                  微笑: "呈现轻微自然微笑，嘴角轻扬，亲和但不过分夸张，适合日常通勤与电商友好展示。",
                  开心: "展现明显愉悦和放松状态，神情明亮自然，感染力更强，适合生活化和轻松氛围场景。",
                  大笑: "表现开朗外放的大笑状态，笑容幅度更大，牙齿与面部肌肉关系自然，适合强情绪感染和活力场景。"
                }
              }
            },
            {
              type: "textarea",
              key: "expression-desc",
              field: {
                label: "表情描述",
                placeholder: "补充对模特表情的要求等"
              }
            }
          ]
        },
        {
          id: "multi-angle",
          prompt:
            "调整模特拍摄视角，保持人物身份、服装款式、面料、颜色和场景氛围一致。新角度应符合真实摄影透视，身体结构完整，避免服装版型变化、四肢错位和视角跳变。",
          label: "模特多角度",
          fields: [
            {
              type: "input-select",
              key: "angle",
              field: {
                label: "模特角度",
                required: true,
                placeholder: "请选择，或直接输入",
                options: ["正面", "侧面", "背面"],
                optionPrompts: {
                  正面: "以正面视角完整展示模特和穿搭，突出服装主视觉、正面版型和整体气质，适合作为标准主展示角度。",
                  侧面: "切换为侧面视角，突出人物轮廓、服装侧线、厚薄关系和垂坠感，避免与正面信息重复。",
                  背面: "切换为背面视角，重点展示背部剪裁、后背轮廓、发型后部和服装背面细节，保持身体转向自然。"
                }
              }
            },
            {
              type: "textarea",
              key: "angle-desc",
              field: {
                label: "角度描述",
                placeholder: "补充对模特角度的要求等"
              }
            }
          ]
        },
        {
          id: "multi-pose",
          prompt:
            "调整模特姿势，保持同一人物、服装、场景和镜头风格一致。动作需符合人体结构与重心逻辑，兼顾服装展示效果，避免关节扭曲、肢体穿插、服装拉坏和姿态僵硬。",
          label: "模特多姿势",
          fields: [
            {
              type: "input-select",
              key: "pose",
              field: {
                label: "模特姿势",
                required: true,
                placeholder: "请选择，或直接输入",
                options: ["站姿", "坐着", "侧卧", "平躺"],
                optionPrompts: {
                  站姿: "采用自然站姿，重心稳定，四肢舒展，优先完整展示服装版型、长度比例和整体穿搭效果。",
                  坐着: "采用自然坐姿，动作放松但不塌陷，兼顾人物状态与服装褶皱表现，适合生活方式和场景化展示。",
                  侧卧: "采用自然侧卧姿势，身体延展流畅，头颈与四肢关系合理，重点体现服装线条和画面氛围感。",
                  平躺: "采用平躺姿势，身体摆放自然，服装铺展关系清楚，适合俯拍或平面化构图，避免僵硬和四肢错位。"
                }
              }
            },
            {
              type: "textarea",
              key: "pose-desc",
              field: {
                label: "姿势描述",
                placeholder: "补充对模特角度的要求等"
              }
            }
          ]
        },
        {
          id: "hairstyle",
          prompt:
            "调整模特发型，保持人物身份、脸型、妆面、服装和画面风格一致。发型变化应真实自然，发际线、发量、走向和光泽合理，避免头部比例异常、发丝穿帮和风格突兀。",
          label: "模特发型",
          fields: [
            {
              type: "input-select",
              key: "hair",
              field: {
                label: "模特发型",
                required: true,
                placeholder: "请选择，或直接输入",
                options: ["光头", "短寸", "短发", "中长发", "长发"],
                optionPrompts: {
                  光头: "调整为干净利落的光头造型，头型圆润自然，保留真实皮肤质感和头部光影，不出现突兀发根残留。",
                  短寸: "调整为清爽短寸发型，轮廓利落，发茬细节自然，整体更精神干练，适合中性或男性化气质表达。",
                  短发: "调整为自然短发造型，长度利落贴合脸部轮廓，兼顾清爽感和时尚感，适合多数电商人像场景。",
                  中长发: "调整为中长发造型，发量与层次自然，能修饰脸型并增强柔和感，保持发尾和肩颈关系真实。",
                  长发: "调整为长发造型，发丝顺滑自然，长度和走向合理，重点体现柔美感、垂坠感和整体氛围感。"
                }
              }
            },
            {
              type: "textarea",
              key: "hair-desc",
              field: {
                label: "发型描述",
                placeholder: "补充对模特发型的要求等"
              }
            }
          ]
        },
        {
          id: "fine-tune",
          prompt:
            "在不改变模特主体身份和服装核心展示效果的前提下进行局部微调。修改范围应精确可控，保持皮肤、五官、配饰和整体气质自然统一，避免过度修饰、风格漂移和局部违和。",
          label: "模特微调",
          fields: [
            {
              type: "input-select",
              key: "fine-tune",
              field: {
                label: "模特微调",
                required: true,
                placeholder: "请选择，或直接输入",
                options: ["肤色自然一些", "戴上眼镜", "去掉眼镜"],
                optionPrompts: {
                  "肤色自然一些": "将肤色调整得更真实自然，避免过白、过黄、过灰或磨皮过度，保留健康气色和真实皮肤层次。",
                  戴上眼镜: "为模特自然添加适合脸型和气质的眼镜，镜框结构清晰，透视和遮挡关系真实，不影响五官识别。",
                  去掉眼镜: "自然移除模特眼镜，补全被遮挡的眼部细节与鼻梁区域，保持面部结构完整，不留下穿帮痕迹。"
                }
              }
            },
            {
              type: "textarea",
              key: "fine-tune-desc",
              field: {
                label: "微调描述",
                placeholder: "补充对模特微调的要求等"
              }
            }
          ]
        }
      ]
    },
    creationModes: {
      ...defaultCreationModes,
      helperText: "结果固定输出 1 张"
    },
    ratioOptions: ["自适应尺寸", "1:1", "4:5", "3:4", "9:16"],
    resolutionOptions: ["1K", "2K", "4K"]
  },
  {
    slug: "copy-writing",
    name: "卖点文案",
    shortName: "卖点文案",
    category: "AI快营销",
    description: "围绕商品卖点生成标题、短描述和促销表达。",
    keywords: "卖点文案,电商标题,AI营销文案",
    heroTitle: "卖点文案",
    heroDescription: "围绕商品特征生成高转化卖点话术，适配详情页和投放素材。",
    tags: ["标题优化", "详情页", "活动文案"]
  },
  {
    slug: "image-translate",
    name: "图片翻译",
    shortName: "图片翻译",
    category: "AI快营销",
    description: "将商品图或海报中的文字快速翻译为目标语种。",
    keywords: "图片翻译,跨境电商,AI翻译",
    heroTitle: "图片翻译",
    heroDescription: "帮助跨境商家快速适配多语种电商场景，统一查看翻译任务。",
    tags: ["跨境", "多语种", "图文一体"]
  }
];

export const groupedTools = tools.reduce<Record<string, ToolDefinition[]>>((acc, tool) => {
  if (!acc[tool.category]) {
    acc[tool.category] = [];
  }

  acc[tool.category].push(tool);
  return acc;
}, {});

export const defaultTool = tools[0];
