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
          label: "模特换表情",
          fields: [
            {
              type: "input-select",
              key: "expression",
              field: {
                label: "模特表情",
                required: true,
                placeholder: "请选择，或直接输入",
                options: ["严肃", "微笑", "开心", "大笑"]
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
          label: "模特多角度",
          fields: [
            {
              type: "input-select",
              key: "angle",
              field: {
                label: "模特角度",
                required: true,
                placeholder: "请选择，或直接输入",
                options: ["正面", "侧面", "背面"]
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
          label: "模特多姿势",
          fields: [
            {
              type: "input-select",
              key: "pose",
              field: {
                label: "模特姿势",
                required: true,
                placeholder: "请选择，或直接输入",
                options: ["站姿", "坐着", "侧卧", "平躺"]
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
          label: "模特发型",
          fields: [
            {
              type: "input-select",
              key: "hair",
              field: {
                label: "模特发型",
                required: true,
                placeholder: "请选择，或直接输入",
                options: ["光头", "短寸", "短发", "中长发", "长发"]
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
          label: "模特微调",
          fields: [
            {
              type: "input-select",
              key: "fine-tune",
              field: {
                label: "模特微调",
                required: true,
                placeholder: "请选择，或直接输入",
                options: ["肤色自然一些", "戴上眼镜", "去掉眼镜"]
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
