import { AnimatePresence, motion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  type TextareaHTMLAttributes
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { ExportArtworkModal } from "./components/ExportArtworkModal";
import { MembershipPaymentModal } from "./components/MembershipPaymentModal";
import { PointsBalancePopover } from "./components/PointsBalancePopover";
import { PointsPurchaseModal } from "./components/PointsPurchaseModal";
import { PointsRecordModal, type PointsRecordItem, type PointsRecordTab } from "./components/PointsRecordModal";
import { UploadCapacityModal } from "./components/UploadCapacityModal";
import {
  goodsWhitePlatformOptions,
  goodsWhiteUniversalPlatformLabel,
  goodsWhiteUniversalPresetConfig
} from "./config/goodsWhitePromptConfig";
import {
  videoMainScriptFieldConfigs,
  videoMainVoiceLanguageOptions,
  videoMainVoiceToneOptions
} from "./config/videoMainScriptConfig";
import { usePageMeta } from "./hooks/usePageMeta";

const figmaIcons = {
  topLogoMark: "/assets/top-logo-mark.svg",
  topLogoWord: "/assets/top-logo-word.svg",
  creditGem: "/assets/credit-gem.svg",
  ecommerceSet: "/assets/ecommerce-set.svg",
  ecommerceSetActive: "/assets/ecommerce-set-active.svg",
  aiGoodsMain: "/assets/ai-goods-main.svg",
  aiGoodsBadge: "/assets/ai-goods-badge.svg",
  aiGoodsMainActive: "/assets/ai-goods-main-active.svg",
  aiGoodsBadgeActive: "/assets/ai-goods-badge-active.svg",
  model: "/assets/model.svg",
  modelActive: "/assets/model-active.svg",
  videoMain: "/assets/video-main.svg",
  videoPlay: "/assets/video-play.svg",
  videoMainActive: "/assets/video-main-active.svg",
  videoPlayActive: "/assets/video-play-active.svg",
  image: "/assets/image.svg",
  imageActive: "/assets/image-active.svg",
  pod: "/assets/pod.svg",
  podDot: "/assets/pod-dot.svg",
  podActive: "/assets/pod-active.svg",
  podDotActive: "/assets/pod-dot-active.svg",
  mineBody: "/assets/mine-body.svg",
  mineHead: "/assets/mine-head.svg",
  mineBodyActive: "/assets/mine-body-active.svg",
  mineHeadActive: "/assets/mine-head-active.svg",
  collapse: "/assets/collapse.svg",
  download: "/assets/download-figma.svg",
  failedResult: "/assets/result-failed-figma.png",
  generateButton: "/assets/generate-button-icon.svg",
  uploadLocal: "/assets/upload-local.svg",
  uploadLibraryBody: "/assets/upload-library-body.svg",
  uploadLibraryArrow: "/assets/upload-library-arrow.svg",
  deleteBg: "/assets/upload-delete-bg.svg",
  deleteLine: "/assets/upload-delete-line.svg"
};

type PrimaryKey = "set" | "goods" | "model" | "video" | "image" | "pod" | "more";
type AppPage = "workspace" | "mine";
type MineTab = "creation" | "models";
type PanelKind = "retouch" | "marketing" | "white" | "translate" | "three-view" | "background" | "basic";
type ModelSourceType = "upload" | "ai";
type ModelFilterTab = "all" | "upload" | "ai";
type UploadItem = {
  id: string;
  name?: string;
  src?: string;
  previewSrc?: string;
  mediaKind?: ResultMediaKind;
  format?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  maskDataUrl?: string;
  maskLabel?: string;
  sizeMb: number;
  status: "loading" | "ready";
};

type ToastState = {
  id: number;
  message: string;
  tone?: "warning";
};

type ExportPreference = {
  preserveVisibleMark: boolean;
  expiresAt: number;
};

type ExportPendingAction =
  | {
      type: "single";
      item: ResultItem;
    }
  | {
      type: "batch";
      tool: ToolConfig;
    };

type ResultActionConfirmState =
  | {
      type: "delete-failed";
      toolKey: string;
      itemId: string;
    }
  | {
      type: "cancel-queued";
      toolKey: string;
      itemId: string;
    };

type ScheduledResultUpdate = {
  timerId: number;
  itemId?: string;
  phase?: "start" | "finish" | "retry";
};

type LimitModalState = {
  title: string;
  description: string;
};

type UserTierId = "free" | "basic-single" | "advanced-team" | "supreme-team" | "flagship";

type UserTierProfile = {
  id: UserTierId;
  name: string;
  label: string;
  teamLabel: string;
  membershipButtonLabel: string;
  avatar: string;
  uploadCountLimit: number;
  defaultMaxConcurrentTasks: number;
  defaultTeamCredits: number;
  defaultCredits: number;
  canBuyPointsWhenInsufficient: boolean;
  defaultRemainingStorageMb: number;
};

type UserTierMetrics = {
  teamCredits: number;
  credits: number;
  remainingStorageMb: number;
  maxConcurrentTasks: number;
};

const defaultPurchaseRecords: PointsRecordItem[] = [
  {
    id: "purchase-member-upgrade",
    userName: "赵文文-微...",
    avatar: "/assets/member-avatar.png",
    title: "会员版本升级...",
    date: "2026-03-30",
    time: "19:56:09",
    amount: "+20"
  }
];

const defaultConsumeRecords: PointsRecordItem[] = [
  {
    id: "consume-1",
    userName: "赵文文-微...",
    avatar: "/assets/member-avatar.png",
    title: "Agent对话",
    date: "2026-03-30",
    time: "20:00:09",
    amount: "-4"
  },
  {
    id: "consume-2",
    userName: "赵文文-微...",
    avatar: "/assets/member-avatar.png",
    title: "Agent对话",
    date: "2026-03-30",
    time: "19:57:40",
    amount: "-4"
  },
  {
    id: "consume-3",
    userName: "赵文文-微...",
    avatar: "/assets/member-avatar.png",
    title: "Agent对话",
    date: "2026-03-30",
    time: "19:57:40",
    amount: "-4"
  },
  {
    id: "consume-4",
    userName: "赵文文-微...",
    avatar: "/assets/member-avatar.png",
    title: "Agent对话",
    date: "2026-03-30",
    time: "19:57:40",
    amount: "-4"
  },
  {
    id: "consume-5",
    userName: "赵文文-微...",
    avatar: "/assets/member-avatar.png",
    title: "Agent对话",
    date: "2026-03-30",
    time: "19:57:40",
    amount: "-4"
  }
];

const DEFAULT_UPLOAD_LIMIT = 5;
const MEMBER_UPLOAD_LIMIT = 24;
const GENERATE_STORAGE_COST_MB = 24;
const UPGRADE_PROMO_COPY = "双旦大促·升级会员最低至5折起";
const EXPORT_PREFERENCE_STORAGE_KEY = "ck-export-preference";

const userTierProfiles: UserTierProfile[] = [
  {
    id: "free",
    name: "赵文文",
    label: "免费用户",
    teamLabel: "个人版",
    membershipButtonLabel: "开通会员",
    avatar: "/assets/member-avatar.png",
    uploadCountLimit: DEFAULT_UPLOAD_LIMIT,
    defaultMaxConcurrentTasks: 1,
    defaultTeamCredits: 0,
    defaultCredits: 2000,
    canBuyPointsWhenInsufficient: false,
    defaultRemainingStorageMb: 128
  },
  {
    id: "basic-single",
    name: "赵文文",
    label: "基础版（单人）",
    teamLabel: "团队版",
    membershipButtonLabel: "升级会员",
    avatar: "/assets/member-avatar.png",
    uploadCountLimit: MEMBER_UPLOAD_LIMIT,
    defaultMaxConcurrentTasks: 2,
    defaultTeamCredits: 0,
    defaultCredits: 8,
    canBuyPointsWhenInsufficient: false,
    defaultRemainingStorageMb: 512
  },
  {
    id: "advanced-team",
    name: "赵文文",
    label: "高级版（团队）",
    teamLabel: "团队版",
    membershipButtonLabel: "升级会员",
    avatar: "/assets/member-avatar.png",
    uploadCountLimit: MEMBER_UPLOAD_LIMIT,
    defaultMaxConcurrentTasks: 5,
    defaultTeamCredits: 36,
    defaultCredits: 6,
    canBuyPointsWhenInsufficient: false,
    defaultRemainingStorageMb: 1024
  },
  {
    id: "supreme-team",
    name: "赵文文",
    label: "至尊版（团队）",
    teamLabel: "团队版",
    membershipButtonLabel: "续费会员",
    avatar: "/assets/member-avatar.png",
    uploadCountLimit: MEMBER_UPLOAD_LIMIT,
    defaultMaxConcurrentTasks: 8,
    defaultTeamCredits: 128,
    defaultCredits: 6,
    canBuyPointsWhenInsufficient: true,
    defaultRemainingStorageMb: 2048
  },
  {
    id: "flagship",
    name: "赵文文",
    label: "旗舰会员",
    teamLabel: "团队版",
    membershipButtonLabel: "续费会员",
    avatar: "/assets/member-avatar.png",
    uploadCountLimit: MEMBER_UPLOAD_LIMIT,
    defaultMaxConcurrentTasks: 20,
    defaultTeamCredits: 188,
    defaultCredits: 18,
    canBuyPointsWhenInsufficient: true,
    defaultRemainingStorageMb: 4096
  }
];

const defaultUserMetrics = userTierProfiles.reduce<Record<UserTierId, UserTierMetrics>>((accumulator, profile) => {
  accumulator[profile.id] = {
    teamCredits: profile.defaultTeamCredits,
    credits: profile.defaultCredits,
    remainingStorageMb: profile.defaultRemainingStorageMb,
    maxConcurrentTasks: profile.defaultMaxConcurrentTasks
  };
  return accumulator;
}, {} as Record<UserTierId, UserTierMetrics>);

function formatStorageSize(sizeMb: number) {
  if (sizeMb >= 1024) {
    return `${(sizeMb / 1024).toFixed(sizeMb % 1024 === 0 ? 0 : 1)}GB`;
  }
  return `${sizeMb.toFixed(sizeMb % 1 === 0 ? 0 : 1)}MB`;
}

function getStorageLimitDescription(remainingStorageMb: number) {
  if (remainingStorageMb <= 0) {
    return "当前剩余存储空间已为0MB，扩展容量后可继续上传或生成内容。";
  }
  return `当前剩余存储空间为${formatStorageSize(remainingStorageMb)}，存储空间不足时需扩展容量后继续使用。`;
}

type LibraryFolder = {
  id: string;
  name: string;
};

type LibraryAsset = {
  id: string;
  name: string;
  src: string;
  previewSrc?: string;
  sizeMb: number;
  format: "PNG" | "PSD" | "AI" | "MP4" | "MOV";
  folderId: string;
  mediaKind?: ResultMediaKind;
  shared?: boolean;
};

type ToolConfig = {
  key: string;
  label: string;
  panelTitle: string;
  resultCount: number;
  panelKind?: PanelKind;
  ratioLabel?: string;
};

type ResultTabKey = "results" | "cases";
type ResultMediaKind = "image" | "video";
type ResultItemStatus = "skeleton" | "queued" | "generating" | "ready" | "failed";

type ResultItem = {
  id: string;
  toolKey: string;
  label: string;
  fileName: string;
  taskId: string;
  mediaKind: ResultMediaKind;
  status: ResultItemStatus;
  src?: string;
  selected: boolean;
  createdAt: number;
  roleLabel?: string;
  overlayText?: string;
};

type CaseTemplate = {
  id: string;
  toolKey: string;
  title: string;
  category: string;
  description: string;
  sourceImage: string;
  coverImage: string;
  resultImages: Array<{
    id: string;
    src: string;
    title: string;
  }>;
};

type CaseCollection = {
  headline: string;
  subheadline: string;
  templates: CaseTemplate[];
};

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

type VideoReplacePromptContext = {
  sourceUploads: UploadItem[];
  videoUploads?: UploadItem[];
  supplementValue: string;
  creationModeSelection: CreationModeSelection | null;
  advancedSelections: AdvancedSelectionMap;
};

type ImageExpandPromptContext = {
  sourceUploads: UploadItem[];
  referenceUploads?: UploadItem[];
  supplementValue: string;
  creationModeSelection: CreationModeSelection | null;
};

type AplusPlanStatus = "idle" | "generating" | "ready";

type AplusPlanModule = {
  id: string;
  category: string;
  headline: string;
  lines: string[];
};

type AplusPlanState = {
  status: AplusPlanStatus;
  signature?: string;
  summary?: string[];
  modules: AplusPlanModule[];
  expanded?: boolean;
  updatedAt?: number;
};

type ResultNamingContext = {
  tool: ToolConfig;
  uploadId: string;
  index: number;
};

type ResultNamingRule = (context: ResultNamingContext) => string;

type ZipEntry = {
  fileName: string;
  bytes: Uint8Array;
};

type TaskRecordStatus = "queued" | "generating" | "completed";

type TaskRecord = {
  id: string;
  toolKey: string;
  taskId: string;
  createdAt: number;
  totalCount: number;
  successCount: number;
  failCount: number;
  status: TaskRecordStatus;
  itemIds: string[];
  coverSrcs: string[];
  snapshot: {
    mainUploads: UploadItem[];
    referenceUploads: UploadItem[];
    videoUploads?: UploadItem[];
    advancedSelections: AdvancedSelectionMap;
    supplementValue: string;
    creationModeSelection: CreationModeSelection | null;
  };
};

type CreationHistoryMode = "tasks" | "results";
type DetailRouteSource = "workspace" | "mine";

type ModelAsset = {
  id: string;
  name: string;
  src: string;
  sizeMb: number;
  createdAt: number;
  sourceType: ModelSourceType;
  format?: string;
  width?: number;
  height?: number;
  detailTitle?: string;
  detailSubtitle?: string;
  detailGroups?: Array<{ label: string; values: string[] }>;
};

type ResultDetailRoute = {
  toolKey: string;
  taskId: string;
  resultId: string;
  source: DetailRouteSource;
};

type CreationModeOption = {
  id: string;
  label: string;
  apiModel: string;
  logicNote: string;
  ratioOptions: string[];
  countOptions: string[];
  resolutionOptions?: string[];
  baseUnitCreditCost?: number;
  resolutionUnitCreditCosts?: Record<string, number>;
  defaultRatio?: string;
  defaultCount?: string;
  defaultResolution?: string;
};

type CreationModeConfig = {
  key: string;
  title?: string;
  modes: CreationModeOption[];
  showSupplement: boolean;
  hideRatioField?: boolean;
  hideResolutionField?: boolean;
  hideCountField?: boolean;
  supplementLabel?: string;
  supplementPlaceholder: string;
  supplementMaxLength: number;
};

type CreationModeSelection = {
  modeId: string;
  modeLabel: string;
  ratio: string;
  resolution?: string;
  count: number;
  unitCreditCost: number;
};

type VideoPricingSelectionMap = {
  mode?: string;
  duration?: string;
  market?: string;
  ratio?: string;
  resolution?: string;
  hasSound?: string;
};

type VideoPricingConfig = {
  selectionKeys?: {
    duration?: string;
    market?: string;
    hasSound?: string;
  };
  defaultSelections?: VideoPricingSelectionMap;
  dimensionCosts: {
    mode?: Record<string, number>;
    duration?: Record<string, number>;
    market?: Record<string, number>;
    ratio?: Record<string, number>;
    resolution?: Record<string, number>;
    hasSound?: Record<string, number>;
  };
};

type PlatformFieldKey = "platform" | "region" | "language";

type PlatformRegionMock = {
  id: string;
  label: string;
  languages: string[];
};

type PlatformMock = {
  id: string;
  label: string;
  regions: PlatformRegionMock[];
};

type PartialEditFieldType = "text" | "input" | "image" | "select" | "color" | "dynamic-list" | "dynamic-color-list";

type PartialEditFieldConfig = {
  key: string;
  label: string;
  type: PartialEditFieldType;
  helperText?: string;
  placeholder?: string;
  defaultValue?: string;
  options?: string[];
  maxItems?: number;
};

type PartialEditTemplateConfig = {
  key: string;
  label: string;
  fields?: PartialEditFieldConfig[];
};

type PodFusionMode = "两两融合" | "一对多融合";

type PodFusionPairGroup = {
  id: string;
  a?: UploadItem;
  b?: UploadItem;
};

type PodFusionOneToManySelection = {
  base?: UploadItem;
  fusionItems: UploadItem[];
};

type PatternRepeatPromptItem = {
  id: string;
  text: string;
  reverseImage?: UploadItem;
};

type ApplicablePlatformOption = {
  id: string;
  label: string;
  markets: string[];
};

type SupplementAiPolishConfig = {
  modelLabel: string;
  prompt: string;
};

type SupplementAiPolishResult = {
  content: string;
  canUse: boolean;
  englishText?: string;
  chineseText?: string;
  applyContent?: string;
  applyEnglishContent?: string;
};

type SupplementAiPolishContext = {
  advancedValues?: string[];
  creationModeValues?: string[];
};

type AdvancedSelectionMap = Record<string, string>;

type ModelGenerateProtectTarget = "apparel" | "hair";

type AdvancedAiAssistResult = {
  fieldValues: AdvancedSelectionMap;
  supplementValue?: string;
};

type PromptRuleLevel = "A" | "B" | "C";

type PromptPlatformRule = {
  ruleLevel: PromptRuleLevel;
  prompt: string;
  required?: string[];
  forbidden?: string[];
  sceneSlotAdvice?: string;
};

type PromptCategoryRule = {
  label: string;
  aliases: string[];
  prompt: string;
  focusPoints: string[];
};

type PromptOptionExpansionMap = Record<
  string,
  {
    fieldKey: string;
    name: string;
    values: Record<string, { valuePrompt: string }>;
  }
>;

type AdvancedSettingsConfig = {
  title: string;
  showAiAssist?: boolean;
  fields: PlatformFieldKey[];
  platformIds: string[];
  extraSelects?: Array<{
    key: string;
    label: string;
    options?: string[];
    richOptions?: RichSelectOption[];
    mode?: "select" | "input-select" | "rich-select" | "multi-select";
    defaultValue?: string;
  }>;
  conditionalDetailField?: {
    triggerFieldKey: string;
    label: string;
    placeholder: string;
    detailVisibleValues?: string[];
    detailPresetByValue?: Record<string, string>;
  };
};

type ModelAdjustActionConfig = {
  key: string;
  label: string;
  valueLabel?: string;
  valueOptions?: string[];
  detailLabel: string;
  detailPlaceholder: string;
};

type ModelGenerateTypeConfig = {
  key: string;
  label: string;
};

type UploadModuleFieldConfig = {
  label: string;
  required?: boolean;
  optional?: boolean;
  meta?: string;
  singleUploadMeta?: string;
  prompt?: string;
  hintTemplate?: string;
  maxCount?: number;
  maxFileSizeMb?: number;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
};

type ToolModuleSectionKey =
  | "more-title-setup"
  | "set-pack-strategy"
  | "set-pack-selling-points"
  | "set-pack-type-selector"
  | "set-pack-style-analysis"
  | "image-upscale-resolution"
  | "image-lineart-style"
  | "mask-draw"
  | "baseline-model-setup"
  | "video-main-script-setup"
  | "upload-main"
  | "upload-video"
  | "video-replica-setup"
  | "target-language"
  | "applicable-platform"
  | "advanced-settings"
  | "generation-rule-notice"
  | "model-change-action"
  | "model-generate-setup"
  | "model-generate-parameters"
  | "model-try-setup"
  | "pod-crop-mode"
  | "pod-extract-setup"
  | "pod-partial-edit-setup"
  | "pod-variation-setup"
  | "pod-fusion-setup"
  | "video-pattern-repeat-setup"
  | "video-scene-grid-setup"
  | "video-print-extend-setup"
  | "video-style-print-setup"
  | "video-2d3d-setup"
  | "creation-mode"
  | "supplement"
  | "mode-choice"
  | "camera-angle"
  | "upload-reference";

type ToolModuleConfig = {
  creationModeConfigKey: string;
  applicablePlatform?: boolean;
  advancedSettings?: AdvancedSettingsConfig;
  modelAdjustActions?: ModelAdjustActionConfig[];
  modelGenerateTypes?: ModelGenerateTypeConfig[];
  sectionOrder?: ToolModuleSectionKey[];
  uploads: {
    main: UploadModuleFieldConfig;
    reference?: UploadModuleFieldConfig;
    video?: UploadModuleFieldConfig;
  };
};

type SetPackSellingPointDraft = {
  productName: string;
  sellingPoints: string;
  audience: string;
  scenario: string;
  parameters: string;
};

type SetPackStyleCard = {
  id: string;
  name: string;
  description: string;
  colors: string[];
  platformTags: string[];
  keywordHints: string[];
};

type SetPackTypeTemplate = {
  id: string;
  category: string;
  description: string;
  tag: string;
  promptHint: string;
  defaultRatio: string;
  defaultResolution: string;
  keywords: string[];
};

type SetPackTypeItem = {
  id: string;
  category: string;
  name: string;
  description: string;
  tag: string;
  prompt: string;
  ratio: string;
  resolution: string;
  count: number;
};

type SetPackTypeSavedTemplate = {
  id: string;
  name: string;
  coverSrc?: string;
  types: SetPackTypeItem[];
};

type MoreTitleDraftRow = {
  id: string;
  productName: string;
  brand: string;
  category: string;
  sellingPoints: string;
  specs: string;
  originalTitle: string;
  imageSrc?: string;
  imageLabel?: string;
};

type MoreTitleCandidate = {
  label: string;
  title: string;
  charCount: number;
  keywords: string[];
  risk: string;
  note: string;
};

type MoreTitleGeneratedRow = {
  id: string;
  productName: string;
  brand: string;
  category: string;
  sellingPoints: string;
  specs: string;
  originalTitle: string;
  candidates: MoreTitleCandidate[];
  selectedCandidateIndex: number;
  finalTitle: string;
};

type MoreTitleImportSheetRow = Record<string, string | number | boolean | null | undefined>;

const navGroups: Array<{
  key: PrimaryKey;
  label: string;
  tools: ToolConfig[];
}> = [
  {
    key: "set",
    label: "电商套图",
    tools: [
      { key: "set-main", label: "电商套图", panelTitle: "电商套图", resultCount: 7, ratioLabel: "1:1" },
      { key: "set-aplus", label: "A+详情图", panelTitle: "A+详情图", resultCount: 6, ratioLabel: "1:1" },
      { key: "set-fashion", label: "服饰套图", panelTitle: "服饰套图", resultCount: 6, ratioLabel: "1:1" },
      { key: "set-replica", label: "爆款套图复刻", panelTitle: "爆款套图复刻", resultCount: 6, ratioLabel: "1:1" }
    ]
  },
  {
    key: "goods",
    label: "AI商品图",
    tools: [
      { key: "goods-marketing", label: "一键营销主图", panelTitle: "一键营销主图", resultCount: 9, ratioLabel: "自适应尺寸", panelKind: "marketing" },
      { key: "goods-white", label: "一键白底图", panelTitle: "一键白底图", resultCount: 8, ratioLabel: "自适应尺寸", panelKind: "white" },
      { key: "goods-buyer", label: "一键买家秀", panelTitle: "一键买家秀", resultCount: 8, ratioLabel: "自适应尺寸", panelKind: "basic" },
      { key: "goods-scene", label: "一键场景图", panelTitle: "一键场景图", resultCount: 12, ratioLabel: "自适应尺寸", panelKind: "basic" },
      { key: "goods-detail", label: "一键细节图", panelTitle: "一键细节图", resultCount: 10, ratioLabel: "自适应尺寸", panelKind: "basic" },
      { key: "goods-sell", label: "一键卖点图", panelTitle: "一键卖点图", resultCount: 8, ratioLabel: "自适应尺寸", panelKind: "basic" },
      { key: "goods-spoke", label: "一键代言图", panelTitle: "一键代言图", resultCount: 6, ratioLabel: "自适应尺寸", panelKind: "basic" },
      { key: "goods-view", label: "一键三视角", panelTitle: "一键三视角", resultCount: 6, ratioLabel: "自适应尺寸", panelKind: "three-view" },
      { key: "goods-retouch", label: "产品精修", panelTitle: "产品精修", resultCount: 9, ratioLabel: "自适应尺寸", panelKind: "retouch" },
      { key: "goods-bg", label: "AI换背景", panelTitle: "AI换背景", resultCount: 7, ratioLabel: "自适应尺寸", panelKind: "background" },
      { key: "goods-translate", label: "图片翻译", panelTitle: "图片翻译", resultCount: 4, ratioLabel: "自适应尺寸", panelKind: "translate" },
      ]
  },
  {
    key: "model",
    label: "模特图",
    tools: [
      { key: "model-try", label: "模特试穿", panelTitle: "模特试穿", resultCount: 6, ratioLabel: "9:16" },
      { key: "model-change", label: "模特调整", panelTitle: "模特调整", resultCount: 6, ratioLabel: "9:16" },
      { key: "model-generate", label: "模特生成", panelTitle: "模特生成", resultCount: 6, ratioLabel: "9:16" }
    ]
  },
  {
    key: "video",
    label: "视频创作",
    tools: [
      { key: "video-main", label: "产品视频", panelTitle: "产品视频", resultCount: 4, ratioLabel: "16:9" },
      { key: "video-replica", label: "爆款复刻", panelTitle: "爆款复刻", resultCount: 4, ratioLabel: "16:9" },
      { key: "video-replace", label: "商品替换", panelTitle: "商品替换", resultCount: 4, ratioLabel: "16:9" },
      { key: "video-remix", label: "智能混剪（待完善）", panelTitle: "智能混剪（待完善）", resultCount: 4, ratioLabel: "16:9" },
      { key: "video-match", label: "智能匹配视频（待完善）", panelTitle: "智能匹配视频（待完善）", resultCount: 4, ratioLabel: "16:9" },
      { key: "video-ad", label: "广告大片视频（待完善）", panelTitle: "广告大片视频（待完善）", resultCount: 4, ratioLabel: "16:9" },
      { key: "video-influencer", label: "达人带货视频（待完善）", panelTitle: "达人带货视频（待完善）", resultCount: 4, ratioLabel: "16:9" },
      { key: "video-customer", label: "素人分享视频（待完善）", panelTitle: "素人分享视频（待完善）", resultCount: 4, ratioLabel: "16:9" }
    ]
  },
  {
    key: "image",
    label: "图片处理",
    tools: [
      { key: "image-cutout", label: "一键抠图", panelTitle: "一键抠图", resultCount: 5, ratioLabel: "自适应尺寸" },
      { key: "image-watermark", label: "去除水印", panelTitle: "去除水印", resultCount: 5, ratioLabel: "自适应尺寸" },
      { key: "image-upscale", label: "超分提质", panelTitle: "超分提质", resultCount: 5, ratioLabel: "自适应尺寸" },
      { key: "image-remove", label: "图片消除", panelTitle: "图片消除", resultCount: 5, ratioLabel: "自适应尺寸" },
      { key: "image-lineart", label: "提取线稿", panelTitle: "提取线稿", resultCount: 5, ratioLabel: "自适应尺寸" },
      { key: "image-expand", label: "图片扩图", panelTitle: "图片扩图", resultCount: 5, ratioLabel: "自适应尺寸" }
    ]
  },
  {
    key: "pod",
    label: "POD印花",
    tools: [
      { key: "pod-crop", label: "图案裁剪", panelTitle: "图案裁剪", resultCount: 5, ratioLabel: "1:1" },
      { key: "pod-extract", label: "印花图提取", panelTitle: "印花图提取", resultCount: 5, ratioLabel: "1:1" },
      { key: "pod-variation", label: "印花图裂变", panelTitle: "印花图裂变", resultCount: 5, ratioLabel: "1:1" },
      { key: "pod-partial-edit", label: "局部改图", panelTitle: "局部改图", resultCount: 5, ratioLabel: "1:1" },
      { key: "pod-fusion", label: "元素融合（待完善）", panelTitle: "元素融合", resultCount: 5, ratioLabel: "1:1" },
      { key: "video-scene-grid", label: "多联画", panelTitle: "多联画", resultCount: 4, ratioLabel: "16:9" },
      { key: "video-pattern-repeat", label: "四方连续图", panelTitle: "四方连续图", resultCount: 4, ratioLabel: "1:1" },
      { key: "video-pod-mockup", label: "POD样机套图（待完善）", panelTitle: "POD样机套图（待完善）", resultCount: 4, ratioLabel: "1:1" },
      { key: "video-print-extend", label: "印花尺寸延展", panelTitle: "印花尺寸延展", resultCount: 4, ratioLabel: "1:1" },
      { key: "video-2d3d", label: "风格转绘", panelTitle: "风格转绘", resultCount: 4, ratioLabel: "1:1" },
      { key: "video-style-print", label: "POD风格参考", panelTitle: "POD风格参考", resultCount: 4, ratioLabel: "1:1" }
    ]
  },
  {
    key: "more",
    label: "更多工具",
    tools: [
      { key: "more-title", label: "批量生成标题", panelTitle: "批量生成标题", resultCount: 3, ratioLabel: "自适应尺寸" },
      { key: "more-rights", label: "侵权检测", panelTitle: "侵权检测", resultCount: 3, ratioLabel: "自适应尺寸" },
      { key: "more-collect", label: "电商图采集", panelTitle: "电商图采集", resultCount: 3, ratioLabel: "自适应尺寸" }
    ]
  }
];

const resultAssetPool = [
  "/assets/result-1.png",
  "/assets/result-2.png",
  "/assets/result-3.png",
  "/assets/result-4.png",
  "/assets/result-1.png",
  "/assets/result-2.png",
  "/assets/result-3.png",
  "/assets/result-4.png",
  "/assets/result-1.png",
  "/assets/result-2.png"
];

const RESULT_DETAIL_ROUTE_PREFIX = "/results/";

const parseResultDetailRoute = (pathname: string, search: string): ResultDetailRoute | null => {
  const matched = pathname.match(/^\/results\/([^/]+)\/([^/]+)\/([^/]+)\/?$/);
  if (!matched) return null;
  const [, toolKey, taskId, resultId] = matched;
  const params = new URLSearchParams(search);
  const source = params.get("from") === "mine" ? "mine" : "workspace";
  return { toolKey, taskId, resultId, source };
};

const buildBasePath = (activePage: AppPage, mineTab: MineTab, activeTool: string) => {
  if (activePage === "mine") {
    return mineTab === "models" ? "/mine/models" : "/mine/creation";
  }
  return `/tools/${activeTool}`;
};

const buildResultDetailPath = (item: ResultItem, source: DetailRouteSource) =>
  `/results/${item.toolKey}/${item.taskId}/${item.id}?from=${source}`;

const defaultToolKeys = [
  "set-main",
  "set-aplus",
  "video-main",
  "video-remix",
  "video-match",
  "video-ad",
  "video-influencer",
  "video-customer",
  "video-scene-grid",
  "video-pattern-repeat",
  "video-pod-mockup",
  "video-print-extend",
  "video-2d3d",
  "video-style-print",
  "image-cutout",
  "image-watermark",
  "image-upscale",
  "image-remove",
  "image-lineart",
  "image-expand",
  "pod-variation",
  "pod-partial-edit",
  "pod-fusion",
  "more-title",
  "more-rights",
  "more-collect"
] as const;

const setPackRatioOptions = ["1:1", "3:4", "4:5", "9:16"];
const setPackVisualStyleOptions = ["简约清新风", "高级质感风", "活泼吸睛风", "复古怀旧风", "场景写实风", "科技未来风", "国风古韵风"];
const setPackResultRoleLabels = ["平台主图", "卖点图", "细节图", "场景图", "功能图", "参数图", "收尾图"];
const SET_PACK_TYPE_LIMIT = 15;
const setPackPlatformIds = ["amazon", "temu", "tiktok-shop", "aliexpress", "shopee", "ozon", "alibaba-international", "shein"];
const moreTitlePlatformIds = [
  "taobao",
  "tmall",
  "jd",
  "pdd",
  "1688",
  "douyin",
  "kuaishou",
  "xiaohongshu",
  "amazon",
  "temu",
  "tiktok-shop",
  "alibaba-international",
  "aliexpress",
  "shopee",
  "ozon",
  "shein",
  "other"
];
const moreTitleStyleOptions = ["平台稳妥版", "搜索覆盖版", "转化卖点版"];
const moreTitleStyleDescriptionMap: Record<string, string> = {
  平台稳妥版: "优先保证标题结构稳定、平台合规和基础属性完整",
  搜索覆盖版: "扩大关键词覆盖，适合搜索流量获取",
  转化卖点版: "突出核心卖点，适合点击转化场景"
};
const moreTitleKeywordStrategyOptions = ["核心词前置", "属性优先", "场景优先"];
const moreTitleLengthOptions = ["平台自动", "尽量写满", "短标题优先"];
const moreTitleCategoryOptions = [
  "服饰类",
  "鞋靴类",
  "箱包类",
  "珠宝饰品类",
  "美妆个护类",
  "食品饮料类",
  "家居百货类",
  "家电数码类",
  "家具大件类",
  "母婴玩具类",
  "汽配五金类",
  "通用品类"
];
const setPackPlatformDefaultRatios: Record<string, string> = {
  "亚马逊": "1:1",
  "Temu": "3:4",
  "TikTok Shop": "9:16",
  "速卖通": "1:1",
  "Shopee": "1:1",
  "OZON": "1:1",
  "阿里国际站": "1:1",
  "SHEIN": "4:5"
};
const setPackStyleLibrary: SetPackStyleCard[] = [
  {
    id: "platform-clean",
    name: "平台净透陈列",
    description: "白底或浅灰电商棚拍，强调主体清晰、规整排版与平台合规感。",
    colors: ["#F8FAFC", "#D9E2EC", "#8FA3BF"],
    platformTags: ["亚马逊", "Temu", "速卖通", "Shopee"],
    keywordHints: ["合规", "白底", "参数", "干净"]
  },
  {
    id: "premium-studio",
    name: "高质感棚拍",
    description: "适合高客单和品牌化商品，强调材质、反光控制和精致视觉层级。",
    colors: ["#F2ECE6", "#B99D80", "#4A4037"],
    platformTags: ["亚马逊", "SHEIN", "阿里国际站"],
    keywordHints: ["高端", "质感", "premium", "luxury"]
  },
  {
    id: "lifestyle-warm",
    name: "生活方式暖调",
    description: "通过日常场景强化使用感和代入感，适合家居、美妆、个护与轻食。",
    colors: ["#FFF1E6", "#F7C59F", "#C97B63"],
    platformTags: ["Temu", "Shopee", "TikTok Shop"],
    keywordHints: ["生活", "温暖", "日常", "居家"]
  },
  {
    id: "tech-contrast",
    name: "科技对比冲击",
    description: "用高对比背景与霓光元素突出科技感、速度感和功能表达。",
    colors: ["#0F172A", "#2563EB", "#22D3EE"],
    platformTags: ["TikTok Shop", "亚马逊", "Temu"],
    keywordHints: ["科技", "性能", "黑色", "速度"]
  },
  {
    id: "trend-social",
    name: "社媒爆款种草",
    description: "更偏短视频平台的年轻视觉，强化标题钩子、场景氛围和冲击构图。",
    colors: ["#FFF4F6", "#FB7185", "#7C3AED"],
    platformTags: ["TikTok Shop", "SHEIN", "Temu"],
    keywordHints: ["种草", "潮流", "年轻", "爆款"]
  },
  {
    id: "detail-macro",
    name: "微距细节解构",
    description: "适合突出结构、面料、纹理和工艺细节，为详情页补充说服力。",
    colors: ["#F8FAFC", "#94A3B8", "#334155"],
    platformTags: ["亚马逊", "阿里国际站", "速卖通"],
    keywordHints: ["细节", "工艺", "材质", "参数"]
  }
];

const setPackTypeLibrary: SetPackTypeTemplate[] = [
  { id: "white-bg", category: "产品白底图", description: "纯白背景，突出商品本体", tag: "商品主图", promptHint: "白底电商首图，清晰展示商品全貌与主体结构", defaultRatio: "1:1", defaultResolution: "1K", keywords: ["白底", "主图", "平台"] },
  { id: "multi-angle", category: "产品多角度", description: "多视角展示外观结构", tag: "商品主图", promptHint: "多角度拼接展示商品结构、侧面与细节轮廓", defaultRatio: "1:1", defaultResolution: "1K", keywords: ["角度", "结构", "外观"] },
  { id: "amazon-main", category: "亚马逊主图", description: "符合平台规范的主图", tag: "商品主图", promptHint: "符合亚马逊规范的主图构图，干净合规、主体突出", defaultRatio: "1:1", defaultResolution: "1K", keywords: ["亚马逊", "平台", "主图"] },
  { id: "detail-closeup", category: "细节特写", description: "放大细节，展示质感工艺", tag: "细节图", promptHint: "近景放大材质、纹理、工艺和装饰细节，强调高级质感", defaultRatio: "1:1", defaultResolution: "1K", keywords: ["细节", "质感", "工艺"] },
  { id: "detail-showcase", category: "细节展示图", description: "局部细节分点说明", tag: "细节图", promptHint: "通过局部特写和说明点位展示商品关键细节", defaultRatio: "4:5", defaultResolution: "1K", keywords: ["细节", "说明", "局部"] },
  { id: "hero-visual", category: "首屏视觉图", description: "首屏吸睛，提升点击转化", tag: "场景图", promptHint: "首屏强视觉构图，突出品牌感和点击吸引力", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["首屏", "吸睛", "转化"] },
  { id: "core-selling", category: "核心卖点图", description: "一句话卖点+图形强化", tag: "卖点图", promptHint: "围绕核心卖点做视觉强化，搭配简洁信息模块和重点文案", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["卖点", "优势", "功能"] },
  { id: "pain-point", category: "客户痛点展示", description: "指出痛点并给出解决点", tag: "卖点图", promptHint: "先展示用户痛点，再引出商品解决方案和使用收益", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["痛点", "对比", "问题"] },
  { id: "scene-lifestyle", category: "场景图（非服饰）", description: "真实使用场景带入感", tag: "场景图", promptHint: "还原真实使用场景，提升代入感和生活方式氛围", defaultRatio: "4:5", defaultResolution: "1K", keywords: ["场景", "生活", "氛围"] },
  { id: "wearing-scene", category: "试穿试戴场景", description: "上身/上手效果展示", tag: "场景图", promptHint: "通过人物上身或上手场景展示商品实际使用效果", defaultRatio: "4:5", defaultResolution: "1K", keywords: ["试穿", "试戴", "人物"] },
  { id: "endorsement", category: "产品代言互动", description: "人物代言+互动引导购买", tag: "场景图", promptHint: "用人物互动场景提升信任感和转化意图", defaultRatio: "4:5", defaultResolution: "1K", keywords: ["人物", "互动", "代言"] },
  { id: "comparison", category: "使用对比图", description: "使用前后/竞品对比更直观", tag: "卖点图", promptHint: "对比使用前后或竞品差异，突出功能效果和优势", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["对比", "前后", "竞品"] },
  { id: "packaging", category: "包装展示图", description: "尺寸参数一图看懂", tag: "包装图", promptHint: "展示包装外观、礼盒组合或配件构成，突出包装质感", defaultRatio: "4:5", defaultResolution: "1K", keywords: ["包装", "礼盒", "配件"] },
  { id: "shipping-install", category: "运输安装", description: "运输包装与安装步骤说明", tag: "说明图", promptHint: "说明运输保护、开箱步骤或安装流程，降低决策顾虑", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["运输", "安装", "步骤"] },
  { id: "parameter", category: "规格参数图", description: "尺寸参数一图看懂", tag: "参数图", promptHint: "用清晰参数版式展示尺寸、材质和关键规格", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["参数", "尺寸", "规格"] },
  { id: "design", category: "产品设计图", description: "结构示意，讲清设计亮点", tag: "说明图", promptHint: "通过结构示意和功能拆解讲清商品设计亮点", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["设计", "结构", "亮点"] },
  { id: "buyer-show", category: "通用买家秀", description: "真实感买家秀氛围图", tag: "场景图", promptHint: "模拟真实买家秀内容，突出商品融入生活后的效果", defaultRatio: "4:5", defaultResolution: "1K", keywords: ["买家秀", "真实", "分享"] },
  { id: "poster", category: "活动海报", description: "促销信息海报，用于投放", tag: "活动图", promptHint: "突出活动主题、利益点和节日氛围，用于促销传播", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["活动", "促销", "海报"] }
];

const aplusModuleLibrary: SetPackTypeTemplate[] = [
  { id: "aplus-hero", category: "首屏主视觉", description: "传递核心价值", tag: "首屏模块", promptHint: "打造适合A+详情页首屏的主视觉模块，突出商品核心价值、品牌质感和视觉冲击力。", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["首屏", "主视觉", "价值"] },
  { id: "aplus-core-selling", category: "核心卖点图", description: "突出差异优势", tag: "卖点模块", promptHint: "围绕一到两个核心卖点做图文强化，突出差异化优势和用户收益。", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["卖点", "优势", "转化"] },
  { id: "aplus-scene-usage", category: "使用场景图", description: "呈现真实使用场景", tag: "场景模块", promptHint: "通过真实使用场景展示商品在生活或工作中的应用方式和体验。", defaultRatio: "4:5", defaultResolution: "1K", keywords: ["场景", "使用", "代入"] },
  { id: "aplus-multi-angle", category: "多角度图", description: "多角度呈现外观", tag: "展示模块", promptHint: "以多视角构图清晰展示商品正面、侧面、背面及关键结构。", defaultRatio: "4:5", defaultResolution: "1K", keywords: ["角度", "外观", "结构"] },
  { id: "aplus-atmosphere", category: "场景氛围图", description: "展示使用场景", tag: "场景模块", promptHint: "营造更有氛围感的环境画面，强化商品气质与生活方式表达。", defaultRatio: "4:5", defaultResolution: "1K", keywords: ["氛围", "场景", "生活方式"] },
  { id: "aplus-detail", category: "商品细节图", description: "放大材质与工艺", tag: "细节模块", promptHint: "用局部特写放大商品材质、纹理、做工和结构细节，增强信任感。", defaultRatio: "4:5", defaultResolution: "1K", keywords: ["细节", "材质", "工艺"] },
  { id: "aplus-brand-story", category: "品牌故事图", description: "传达品牌理念", tag: "品牌模块", promptHint: "结合品牌调性、产品理念和视觉叙事，输出更具品牌表达的详情模块。", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["品牌", "故事", "理念"] },
  { id: "aplus-size", category: "尺寸/容量/尺码图", description: "展示规格信息", tag: "参数模块", promptHint: "清晰呈现尺寸、容量、尺码或规格信息，版式规整易读。", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["尺寸", "容量", "尺码"] },
  { id: "aplus-compare", category: "效果对比图", description: "使用前后效果对比", tag: "对比模块", promptHint: "通过使用前后或方案对比，直观呈现商品带来的效果提升。", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["对比", "前后", "效果"] },
  { id: "aplus-spec", category: "详细规格/参数表", description: "展示详细商品数据", tag: "参数模块", promptHint: "使用表格或信息卡形式展示详细规格参数、材质信息和产品数据。", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["规格", "参数", "表格"] },
  { id: "aplus-craft", category: "工艺制作图", description: "展示工艺制作过程", tag: "工艺模块", promptHint: "拆解制作工艺、生产流程或结构工法，强化品质背书。", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["工艺", "制作", "流程"] },
  { id: "aplus-accessories", category: "配件/赠品图", description: "明确收货的所有物品", tag: "配件模块", promptHint: "清晰列出随箱配件、赠品或包装内容，避免信息遗漏。", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["配件", "赠品", "清单"] },
  { id: "aplus-series", category: "系列展示图", description: "多色或多SKU展示", tag: "系列模块", promptHint: "展示系列款式、多色、多规格或SKU组合，便于用户横向比较。", defaultRatio: "4:5", defaultResolution: "1K", keywords: ["系列", "SKU", "多色"] },
  { id: "aplus-ingredient", category: "商品成分图", description: "展示配方/材质/成分", tag: "成分模块", promptHint: "图文展示原料、配方、面料或核心成分及其对应价值。", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["成分", "配方", "材质"] },
  { id: "aplus-after-sale", category: "售后保障图", description: "说明质保退换政策", tag: "保障模块", promptHint: "明确售后保障、质保时效、退换政策和服务承诺，降低决策顾虑。", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["售后", "保障", "服务"] },
  { id: "aplus-usage-advice", category: "使用建议图", description: "商品使用的注意事项", tag: "说明模块", promptHint: "补充使用方法、注意事项、保养建议或适用提醒，提升使用体验。", defaultRatio: "3:4", defaultResolution: "1K", keywords: ["建议", "注意事项", "使用"] }
];

const setPackCustomTypePresets: Array<Omit<SetPackTypeItem, "count">> = [
  {
    id: "custom-preset-brand-story",
    category: "品牌故事图",
    name: "品牌故事图展示",
    description: "品牌理念与商品气质组合呈现",
    tag: "自定义",
    prompt: "结合品牌故事、商品细节和主视觉构图，输出更偏品牌表达的套图画面。",
    ratio: "3:4",
    resolution: "1K"
  },
  {
    id: "custom-preset-gift-scene",
    category: "礼赠氛围图",
    name: "礼赠氛围展示",
    description: "强化送礼场景和仪式感氛围",
    tag: "自定义",
    prompt: "围绕礼盒、节庆、赠礼对象和氛围布置，突出商品的礼赠价值。",
    ratio: "4:5",
    resolution: "1K"
  },
  {
    id: "custom-preset-detail-compare",
    category: "材质对比图",
    name: "材质对比展示",
    description: "对比材质细节和质感优势",
    tag: "自定义",
    prompt: "用近景细节和对比版式强调材质、纹理、工艺差异和品质优势。",
    ratio: "3:4",
    resolution: "1K"
  }
];

const presetCreationTaskRecords: Record<string, TaskRecord[]> = {
  "goods-marketing": [
    {
      id: "goods-marketing-20260425113000",
      toolKey: "goods-marketing",
      taskId: "202604251130",
      createdAt: new Date("2026-04-25T11:30:00+08:00").getTime(),
      totalCount: 4,
      successCount: 0,
      failCount: 0,
      status: "generating",
      itemIds: ["preset-marketing-live-1", "preset-marketing-live-2", "preset-marketing-live-3", "preset-marketing-live-4"],
      coverSrcs: [],
      snapshot: {
        mainUploads: [{ id: "6281459073", name: "耳机生成中.png", src: "/assets/upload-preview.png", sizeMb: 6, status: "ready" }],
        referenceUploads: [],
        advancedSelections: {
          productType: "蓝牙耳机",
          sceneBackground: "产品场景",
          visualStyle: "时尚潮流",
          copyLanguage: "简体中文"
        },
        supplementValue: "保持年轻电商氛围，突出耳机主体与科技感布光。",
        creationModeSelection: {
          modeId: "general",
          modeLabel: "通用模式",
          ratio: "自适应尺寸",
          count: 4,
          unitCreditCost: 1
        }
      }
    },
    {
      id: "goods-marketing-20260425093000",
      toolKey: "goods-marketing",
      taskId: "202604250930",
      createdAt: new Date("2026-04-25T09:30:00+08:00").getTime(),
      totalCount: 4,
      successCount: 3,
      failCount: 1,
      status: "completed",
      itemIds: ["preset-marketing-1", "preset-marketing-2", "preset-marketing-3", "preset-marketing-4"],
      coverSrcs: [resultAssetPool[0], resultAssetPool[1], resultAssetPool[2]],
      snapshot: {
        mainUploads: [{ id: "3817264510", name: "耳机主图.png", src: "/assets/upload-preview.png", sizeMb: 6, status: "ready" }],
        referenceUploads: [],
        advancedSelections: {
          productType: "蓝牙耳机",
          sceneBackground: "产品场景",
          visualStyle: "轻奢高端",
          copyLanguage: "简体中文"
        },
        supplementValue: "突出耳机主体质感，强调降噪卖点与高级电商氛围。",
        creationModeSelection: {
          modeId: "general",
          modeLabel: "通用模式",
          ratio: "自适应尺寸",
          count: 3,
          unitCreditCost: 1
        }
      }
    }
  ],
  "goods-retouch": [
    {
      id: "goods-retouch-20260424153000",
      toolKey: "goods-retouch",
      taskId: "202604241530",
      createdAt: new Date("2026-04-24T15:30:00+08:00").getTime(),
      totalCount: 3,
      successCount: 2,
      failCount: 1,
      status: "completed",
      itemIds: ["preset-retouch-1", "preset-retouch-2", "preset-retouch-3"],
      coverSrcs: [resultAssetPool[3], resultAssetPool[0]],
      snapshot: {
        mainUploads: [{ id: "9073146285", name: "香水原图.png", src: "/assets/task-thumb-1.png", sizeMb: 4, status: "ready" }],
        referenceUploads: [],
        advancedSelections: {
          platform: "天猫",
          region: "华东"
        },
        supplementValue: "保留瓶身高光与玻璃通透感，提升高级精修质感。",
        creationModeSelection: {
          modeId: "general",
          modeLabel: "通用模式",
          ratio: "自适应尺寸",
          count: 2,
          unitCreditCost: 1
        }
      }
    }
  ],
  "goods-scene": [
    {
      id: "goods-scene-20260423091000",
      toolKey: "goods-scene",
      taskId: "202604230910",
      createdAt: new Date("2026-04-23T09:10:00+08:00").getTime(),
      totalCount: 4,
      successCount: 3,
      failCount: 1,
      status: "completed",
      itemIds: ["preset-scene-1", "preset-scene-2", "preset-scene-3", "preset-scene-4"],
      coverSrcs: [resultAssetPool[1], resultAssetPool[2], resultAssetPool[3]],
      snapshot: {
        mainUploads: [{ id: "4518623097", name: "杯子产品图.png", src: "/assets/task-gallery-5.png", sizeMb: 5, status: "ready" }],
        referenceUploads: [],
        advancedSelections: {
          productType: "饮料",
          sceneType: "产品场景",
          moodStyle: "清新明亮",
          targetMarket: "国内电商"
        },
        supplementValue: "营造清新自然的生活方式场景，突出饮品清爽与夏日感。",
        creationModeSelection: {
          modeId: "general",
          modeLabel: "通用模式",
          ratio: "4:5",
          count: 4,
          unitCreditCost: 1
        }
      }
    }
  ],
  "model-generate": [
    {
      id: "model-generate-20260425160000",
      toolKey: "model-generate",
      taskId: "202604251600",
      createdAt: new Date("2026-04-25T16:00:00+08:00").getTime(),
      totalCount: 3,
      successCount: 3,
      failCount: 0,
      status: "completed",
      itemIds: ["preset-model-generate-1", "preset-model-generate-2", "preset-model-generate-3"],
      coverSrcs: ["/assets/task-gallery-6.png", "/assets/task-gallery-7.png", "/assets/task-gallery-8.png"],
      snapshot: {
        mainUploads: [{ id: "7601452389", name: "模特参考图.png", src: "/assets/task-gallery-4.png", sizeMb: 5, status: "ready" }],
        referenceUploads: [],
        advancedSelections: {
          modelGenerateType: "通用模特",
          gender: "",
          age: "25-30岁",
          bodyType: "高挑",
          scene: "黑白影棚"
        },
        supplementValue: "生成适合女装展示的电商模特，姿态自然，面部清晰。",
        creationModeSelection: {
          modeId: "general",
          modeLabel: "通用模式",
          ratio: "竖9:16",
          count: 3,
          unitCreditCost: 1
        }
      }
    }
  ]
};

const presetCreationResultItems: Record<string, ResultItem[]> = {
  "goods-marketing": [
    {
      id: "preset-marketing-live-1",
      toolKey: "goods-marketing",
      label: "6281459073_1",
      fileName: "6281459073_1",
      taskId: "202604251130",
      mediaKind: "image",
      status: "generating",
      src: resultAssetPool[0],
      selected: false,
      createdAt: new Date("2026-04-25T11:31:00+08:00").getTime()
    },
    {
      id: "preset-marketing-live-2",
      toolKey: "goods-marketing",
      label: "6281459073_2",
      fileName: "6281459073_2",
      taskId: "202604251130",
      mediaKind: "image",
      status: "queued",
      selected: false,
      createdAt: new Date("2026-04-25T11:31:20+08:00").getTime()
    },
    {
      id: "preset-marketing-live-3",
      toolKey: "goods-marketing",
      label: "6281459073_3",
      fileName: "6281459073_3",
      taskId: "202604251130",
      mediaKind: "image",
      status: "queued",
      selected: false,
      createdAt: new Date("2026-04-25T11:31:40+08:00").getTime()
    },
    {
      id: "preset-marketing-live-4",
      toolKey: "goods-marketing",
      label: "6281459073_4",
      fileName: "6281459073_4",
      taskId: "202604251130",
      mediaKind: "image",
      status: "queued",
      selected: false,
      createdAt: new Date("2026-04-25T11:32:00+08:00").getTime()
    },
    {
      id: "preset-marketing-1",
      toolKey: "goods-marketing",
      label: "3817264510_1",
      fileName: "3817264510_1",
      taskId: "202604250930",
      mediaKind: "image",
      status: "ready",
      src: resultAssetPool[0],
      selected: false,
      createdAt: new Date("2026-04-25T09:31:00+08:00").getTime()
    },
    {
      id: "preset-marketing-2",
      toolKey: "goods-marketing",
      label: "3817264510_2",
      fileName: "3817264510_2",
      taskId: "202604250930",
      mediaKind: "image",
      status: "ready",
      src: resultAssetPool[1],
      selected: false,
      createdAt: new Date("2026-04-25T09:31:20+08:00").getTime()
    },
    {
      id: "preset-marketing-3",
      toolKey: "goods-marketing",
      label: "3817264510_3",
      fileName: "3817264510_3",
      taskId: "202604250930",
      mediaKind: "image",
      status: "ready",
      src: resultAssetPool[2],
      selected: false,
      createdAt: new Date("2026-04-25T09:31:40+08:00").getTime()
    },
    {
      id: "preset-marketing-4",
      toolKey: "goods-marketing",
      label: "3817264510_4",
      fileName: "3817264510_4",
      taskId: "202604250930",
      mediaKind: "image",
      status: "failed",
      src: resultAssetPool[3],
      selected: false,
      createdAt: new Date("2026-04-25T09:32:00+08:00").getTime()
    }
  ],
  "goods-retouch": [
    {
      id: "preset-retouch-1",
      toolKey: "goods-retouch",
      label: "9073146285_1",
      fileName: "9073146285_1",
      taskId: "202604241530",
      mediaKind: "image",
      status: "ready",
      src: resultAssetPool[3],
      selected: false,
      createdAt: new Date("2026-04-24T15:31:00+08:00").getTime()
    },
    {
      id: "preset-retouch-2",
      toolKey: "goods-retouch",
      label: "9073146285_2",
      fileName: "9073146285_2",
      taskId: "202604241530",
      mediaKind: "image",
      status: "ready",
      src: resultAssetPool[0],
      selected: false,
      createdAt: new Date("2026-04-24T15:31:20+08:00").getTime()
    },
    {
      id: "preset-retouch-3",
      toolKey: "goods-retouch",
      label: "9073146285_3",
      fileName: "9073146285_3",
      taskId: "202604241530",
      mediaKind: "image",
      status: "failed",
      src: resultAssetPool[1],
      selected: false,
      createdAt: new Date("2026-04-24T15:31:40+08:00").getTime()
    }
  ],
  "goods-scene": [
    {
      id: "preset-scene-1",
      toolKey: "goods-scene",
      label: "4518623097_1",
      fileName: "4518623097_1",
      taskId: "202604230910",
      mediaKind: "image",
      status: "ready",
      src: resultAssetPool[1],
      selected: false,
      createdAt: new Date("2026-04-23T09:11:00+08:00").getTime()
    },
    {
      id: "preset-scene-2",
      toolKey: "goods-scene",
      label: "4518623097_2",
      fileName: "4518623097_2",
      taskId: "202604230910",
      mediaKind: "image",
      status: "ready",
      src: resultAssetPool[2],
      selected: false,
      createdAt: new Date("2026-04-23T09:11:20+08:00").getTime()
    },
    {
      id: "preset-scene-3",
      toolKey: "goods-scene",
      label: "4518623097_3",
      fileName: "4518623097_3",
      taskId: "202604230910",
      mediaKind: "image",
      status: "ready",
      src: resultAssetPool[3],
      selected: false,
      createdAt: new Date("2026-04-23T09:11:40+08:00").getTime()
    },
    {
      id: "preset-scene-4",
      toolKey: "goods-scene",
      label: "4518623097_4",
      fileName: "4518623097_4",
      taskId: "202604230910",
      mediaKind: "image",
      status: "failed",
      src: resultAssetPool[0],
      selected: false,
      createdAt: new Date("2026-04-23T09:12:00+08:00").getTime()
    }
  ],
  "model-generate": [
    {
      id: "preset-model-generate-1",
      toolKey: "model-generate",
      label: "7601452389_1",
      fileName: "7601452389_1",
      taskId: "202604251600",
      mediaKind: "image",
      status: "ready",
      src: "/assets/task-gallery-6.png",
      selected: false,
      createdAt: new Date("2026-04-25T16:01:00+08:00").getTime()
    },
    {
      id: "preset-model-generate-2",
      toolKey: "model-generate",
      label: "7601452389_2",
      fileName: "7601452389_2",
      taskId: "202604251600",
      mediaKind: "image",
      status: "ready",
      src: "/assets/task-gallery-7.png",
      selected: false,
      createdAt: new Date("2026-04-25T16:01:20+08:00").getTime()
    },
    {
      id: "preset-model-generate-3",
      toolKey: "model-generate",
      label: "7601452389_3",
      fileName: "7601452389_3",
      taskId: "202604251600",
      mediaKind: "image",
      status: "ready",
      src: "/assets/task-gallery-8.png",
      selected: false,
      createdAt: new Date("2026-04-25T16:01:40+08:00").getTime()
    }
  ]
};

const defaultUploadedModels: ModelAsset[] = [
  {
    id: "local-model-1",
    name: "通勤女模特-正面.png",
    src: "/assets/task-thumb-1.png",
    sizeMb: 4.8,
    createdAt: new Date("2026-04-25T10:20:00+08:00").getTime(),
    sourceType: "upload",
    format: "PNG",
    width: 1024,
    height: 1365,
    detailTitle: "本地上传模特",
    detailSubtitle: "图片素材",
    detailGroups: [{ label: "基础信息", values: ["本地上传", "PNG", "1024 × 1365"] }]
  },
  {
    id: "local-model-2",
    name: "休闲男模特-半身.png",
    src: "/assets/task-thumb-2.png",
    sizeMb: 5.2,
    createdAt: new Date("2026-04-24T18:40:00+08:00").getTime(),
    sourceType: "upload",
    format: "PNG",
    width: 1024,
    height: 1365,
    detailTitle: "本地上传模特",
    detailSubtitle: "图片素材",
    detailGroups: [{ label: "基础信息", values: ["本地上传", "PNG", "1024 × 1365"] }]
  },
  {
    id: "local-model-3",
    name: "童装模特-棚拍.png",
    src: "/assets/upload-preview.png",
    sizeMb: 3.9,
    createdAt: new Date("2026-04-23T14:10:00+08:00").getTime(),
    sourceType: "upload",
    format: "PNG",
    width: 960,
    height: 1280,
    detailTitle: "本地上传模特",
    detailSubtitle: "图片素材",
    detailGroups: [{ label: "基础信息", values: ["本地上传", "PNG", "960 × 1280"] }]
  }
];

function getResultMediaKind(toolKey: string): ResultMediaKind {
  return toolKey.startsWith("video-") ? "video" : "image";
}

function getResultCardLabel(tool: ToolConfig, index: number) {
  if (tool.key.startsWith("video-")) {
    return `视频 ${index + 1}`;
  }
  return `${tool.label} ${index + 1}`;
}

const defaultResultNamingRule: ResultNamingRule = ({ uploadId, index }) => `${uploadId}_${index + 1}`;

const resultNamingRulesByTool: Record<string, ResultNamingRule> = {};

function formatGeneratedResultName(tool: ToolConfig, uploads: UploadItem[], index: number) {
  const primaryUpload = uploads[0];
  const uploadId = primaryUpload?.id?.trim() || `${tool.key}-source`;
  const rule = resultNamingRulesByTool[tool.key] ?? defaultResultNamingRule;
  return rule({
    tool,
    uploadId,
    index
  });
}

function generateRandomTenDigitId() {
  return String(Math.floor(1000000000 + Math.random() * 9000000000));
}

function formatTaskTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0")
  ];
  return parts.join("");
}

function formatTaskRecordDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function formatTaskRecordDateTime(timestamp: number) {
  const date = new Date(timestamp);
  return `${formatTaskRecordDate(timestamp)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatModelDateTime(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function getModelSourceLabel(sourceType: ModelSourceType) {
  return sourceType === "ai" ? "AI生成" : "本地上传";
}

function buildModelDetailGroups(advancedSelections: AdvancedSelectionMap) {
  const groups: Array<{ label: string; values: string[] }> = [];
  const identityValues = [advancedSelections.gender, advancedSelections.age, advancedSelections.appearance].filter(Boolean);
  if (identityValues.length) {
    groups.push({ label: "基础属性", values: identityValues });
  }

  const personaValues = [advancedSelections.persona, advancedSelections.bodyType, advancedSelections.scene].filter(Boolean);
  if (personaValues.length) {
    groups.push({ label: "生成参数", values: personaValues });
  }

  const typeValues = [advancedSelections.modelGenerateType, advancedSelections.modelGenerateTypeKey].filter(Boolean);
  if (typeValues.length) {
    groups.push({ label: "模特类型", values: typeValues.slice(0, 1) });
  }

  return groups;
}

function getImageFormat(fileName: string, fallback = "PNG") {
  const extension = fileName.split(".").pop()?.toUpperCase();
  return extension || fallback;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

function loadImageBySrc(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片解析失败"));
    image.src = src;
  });
}

async function detectModelFace(image: HTMLImageElement) {
  const detector = typeof window !== "undefined" ? (window as typeof window & { FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => { detect: (source: CanvasImageSource) => Promise<Array<unknown>> } }).FaceDetector : undefined;
  if (!detector) return null;

  try {
    const instance = new detector({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await instance.detect(image);
    return faces.length > 0;
  } catch {
    return null;
  }
}

async function parseModelFile(file: File): Promise<{ item: UploadItem; width: number; height: number }> {
  const src = await readFileAsDataUrl(file);
  const image = await loadImageBySrc(src);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  return {
    item: {
      id: generateRandomTenDigitId(),
      name: file.name,
      src,
      sizeMb: Math.max(0.1, Number((file.size / (1024 * 1024)).toFixed(1))),
      status: "ready",
      format: getImageFormat(file.name),
      width,
      height
    },
    width,
    height
  };
}

async function validateModelImageFile(file: File) {
  const parsed = await parseModelFile(file);
  const image = await loadImageBySrc(parsed.item.src ?? "");
  const width = parsed.width;
  const height = parsed.height;
  const ratio = width / Math.max(height, 1);
  const faceDetected = await detectModelFace(image);
  const heuristicallyValid = width >= 320 && height >= 320 && ratio >= 0.45 && ratio <= 1.8;

  if (faceDetected === false || (faceDetected == null && !heuristicallyValid)) {
    return {
      ok: false,
      reason: `“${file.name}”未检测到清晰正脸，请上传包含单人正脸的模特图。`
    } as const;
  }

  return {
    ok: true,
    item: parsed.item
  } as const;
}

function sanitizeDownloadName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_");
}

function inferExtensionFromResult(item: ResultItem) {
  if (item.src?.startsWith("data:image/png")) return "png";
  if (item.src?.startsWith("data:image/jpeg")) return "jpg";
  if (item.src?.startsWith("data:image/webp")) return "webp";
  if (item.src?.startsWith("data:video/mp4")) return "mp4";
  const path = item.src?.split("?")[0] ?? "";
  const matched = path.match(/\.([a-zA-Z0-9]+)$/);
  if (matched) return matched[1].toLowerCase();
  return item.mediaKind === "video" ? "mp4" : "png";
}

async function getResultBlob(item: ResultItem) {
  if (!item.src) {
    throw new Error("当前结果缺少可下载资源");
  }

  if (item.src.startsWith("data:")) {
    const response = await fetch(item.src);
    return response.blob();
  }

  const response = await fetch(item.src);
  if (!response.ok) {
    throw new Error("下载资源失败");
  }
  return response.blob();
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = sanitizeDownloadName(fileName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadExportPreference() {
  try {
    const raw = window.localStorage.getItem(EXPORT_PREFERENCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExportPreference;
    if (!parsed?.expiresAt || parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(EXPORT_PREFERENCE_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveExportPreference(preference: ExportPreference) {
  window.localStorage.setItem(EXPORT_PREFERENCE_STORAGE_KEY, JSON.stringify(preference));
}

function clearExportPreference() {
  window.localStorage.removeItem(EXPORT_PREFERENCE_STORAGE_KEY);
}

async function addAiVisibleWatermark(blob: Blob, item: ResultItem) {
  if (!blob.type.startsWith("image/")) {
    return blob;
  }

  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("图片水印处理失败"));
      nextImage.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const context = canvas.getContext("2d");
    if (!context) return blob;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const scale = Math.max(canvas.width, canvas.height) / 1200;
    const paddingX = Math.max(16, Math.round(22 * scale));
    const paddingY = Math.max(10, Math.round(14 * scale));
    const radius = Math.max(10, Math.round(14 * scale));
    const fontSize = Math.max(18, Math.round(28 * scale));
    const offset = Math.max(18, Math.round(24 * scale));
    const text = "AI生成";

    context.font = `600 ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    const textWidth = context.measureText(text).width;
    const badgeWidth = Math.ceil(textWidth + paddingX * 2);
    const badgeHeight = Math.ceil(fontSize + paddingY * 2);
    const x = canvas.width - badgeWidth - offset;
    const y = canvas.height - badgeHeight - offset;

    context.fillStyle = "rgba(27, 35, 55, 0.64)";
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + badgeWidth, y, x + badgeWidth, y + badgeHeight, radius);
    context.arcTo(x + badgeWidth, y + badgeHeight, x, y + badgeHeight, radius);
    context.arcTo(x, y + badgeHeight, x, y, radius);
    context.arcTo(x, y, x + badgeWidth, y, radius);
    context.closePath();
    context.fill();

    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, x + badgeWidth / 2, y + badgeHeight / 2 + 1);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (nextBlob) => {
          if (nextBlob) {
            resolve(nextBlob);
            return;
          }
          reject(new Error(`图片水印处理失败: ${item.fileName}`));
        },
        blob.type || "image/png",
        0.96
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const crc32Table = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let current = index;
    for (let bit = 0; bit < 8; bit += 1) {
      current = (current & 1) !== 0 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
    }
    table[index] = current >>> 0;
  }
  return table;
})();

function computeCrc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function createZipBlob(entries: ZipEntry[]) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    const fileNameBytes = encoder.encode(sanitizeDownloadName(entry.fileName));
    const crc32 = computeCrc32(entry.bytes);
    const localHeader = new Uint8Array(30 + fileNameBytes.length);
    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, 0);
    writeUint16(localHeader, 12, 0);
    writeUint32(localHeader, 14, crc32);
    writeUint32(localHeader, 18, entry.bytes.length);
    writeUint32(localHeader, 22, entry.bytes.length);
    writeUint16(localHeader, 26, fileNameBytes.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(fileNameBytes, 30);
    localParts.push(localHeader, entry.bytes);

    const centralHeader = new Uint8Array(46 + fileNameBytes.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, 0);
    writeUint16(centralHeader, 14, 0);
    writeUint32(centralHeader, 16, crc32);
    writeUint32(centralHeader, 20, entry.bytes.length);
    writeUint32(centralHeader, 24, entry.bytes.length);
    writeUint16(centralHeader, 28, fileNameBytes.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(fileNameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + entry.bytes.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = new Uint8Array(22);
  writeUint32(endRecord, 0, 0x06054b50);
  writeUint16(endRecord, 4, 0);
  writeUint16(endRecord, 6, 0);
  writeUint16(endRecord, 8, entries.length);
  writeUint16(endRecord, 10, entries.length);
  writeUint32(endRecord, 12, centralSize);
  writeUint32(endRecord, 16, offset);
  writeUint16(endRecord, 20, 0);

  const blobParts = [...localParts, ...centralParts, endRecord].map(
    (part) => part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer
  );

  return new Blob(blobParts, {
    type: "application/zip"
  });
}

function createCaseItems(tool: ToolConfig): ResultItem[] {
  return resultAssetPool.slice(0, Math.min(6, tool.resultCount)).map((src, index) => {
    const fileName = `${tool.key}_case_${index + 1}`;
    return {
      id: `${tool.key}-case-${index}`,
      toolKey: tool.key,
      label: fileName,
      fileName,
      taskId: "case",
      mediaKind: getResultMediaKind(tool.key),
      status: "ready",
      src,
      selected: false,
      createdAt: index
    };
  });
}

const caseTemplateOverrides: Record<string, CaseCollection> = {
  "set-main": {
    headline: "一键生成适配平台上架的爆款套图，覆盖主图、场景图、细节图与卖点图",
    subheadline: "围绕平台规范、商品卖点和视觉风格，快速拼出一套可直接下载使用的商品图包。",
    templates: [
      {
        id: "set-main-case-beauty",
        toolKey: "set-main",
        title: "美妆护肤套图包",
        category: "跨境电商",
        description: "通过主图、质感特写、卖点说明和生活方式场景，输出完整的上架素材包。",
        sourceImage: "/assets/upload-preview.png",
        coverImage: "/assets/result-1.png",
        resultImages: [
          { id: "set-main-beauty-1", src: "/assets/result-1.png", title: "平台主图" },
          { id: "set-main-beauty-2", src: "/assets/result-2.png", title: "核心卖点" },
          { id: "set-main-beauty-3", src: "/assets/result-3.png", title: "细节特写" },
          { id: "set-main-beauty-4", src: "/assets/result-4.png", title: "场景氛围" }
        ]
      },
      {
        id: "set-main-case-tech",
        toolKey: "set-main",
        title: "3C 数码套图包",
        category: "平台主图",
        description: "以平台首图为核心，补充功能参数、科技感卖点图和使用场景图。",
        sourceImage: "/assets/task-gallery-6.png",
        coverImage: "/assets/task-gallery-7.png",
        resultImages: [
          { id: "set-main-tech-1", src: "/assets/task-gallery-7.png", title: "主图合规版" },
          { id: "set-main-tech-2", src: "/assets/result-2.png", title: "功能卖点图" },
          { id: "set-main-tech-3", src: "/assets/result-3.png", title: "参数说明图" },
          { id: "set-main-tech-4", src: "/assets/result-4.png", title: "场景图" }
        ]
      }
    ]
  },
  "goods-marketing": {
    headline: "一键将产品转为真人试戴试穿套图，高度保持模特与产品一致性",
    subheadline: "专为电商营销打造，支持查看原图与生成案例，并一键套用同款表现。",
    templates: [
      {
        id: "marketing-case-hat",
        toolKey: "goods-marketing",
        title: "黑白格纹空顶遮阳帽",
        category: "服装鞋帽",
        description: "以夏日户外轻度假场景呈现遮阳帽佩戴效果，覆盖多角度与生活化姿态。",
        sourceImage: "/assets/upload-preview.png",
        coverImage: "/assets/result-1.png",
        resultImages: [
          { id: "hat-result-1", src: "/assets/result-1.png", title: "江边露台落日 - 江边落日氛围感侧坐" },
          { id: "hat-result-2", src: "/assets/result-2.png", title: "田园野餐 - 草地野餐扶帽挡光" },
          { id: "hat-result-3", src: "/assets/result-3.png", title: "城市林荫步道 - 梧桐道漫步侧颜抓拍" },
          { id: "hat-result-4", src: "/assets/result-4.png", title: "高端棚拍 - 奶白背景静态佩戴展示" },
          { id: "hat-result-5", src: "/assets/task-gallery-5.png", title: "咖啡馆自然光 - 原木咖啡馆窗边托腮" }
        ]
      },
      {
        id: "marketing-case-tee",
        toolKey: "goods-marketing",
        title: "儿童短袖T恤",
        category: "服装鞋帽",
        description: "将基础款短袖生成多套真人试穿展示图，用于详情页与营销位模板。",
        sourceImage: "/assets/task-gallery-6.png",
        coverImage: "/assets/task-gallery-7.png",
        resultImages: [
          { id: "tee-result-1", src: "/assets/task-gallery-7.png", title: "标准棚拍 - 正面站姿展示" },
          { id: "tee-result-2", src: "/assets/task-gallery-8.png", title: "轻运动场景 - 街头自然站姿" },
          { id: "tee-result-3", src: "/assets/result-2.png", title: "电商主图 - 居中构图突出版型" },
          { id: "tee-result-4", src: "/assets/result-3.png", title: "少年模特 - 侧身展示面料垂感" },
          { id: "tee-result-5", src: "/assets/result-4.png", title: "中景半身 - 强调图案细节" }
        ]
      }
    ]
  },
  "goods-scene": {
    headline: "一键生成贴合商品气质的场景模板，快速拿到可直接投放的套图",
    subheadline: "覆盖真实生活、简洁棚拍、氛围大片等场景风格，支持一键查看与套用。",
    templates: [
      {
        id: "scene-case-cup",
        toolKey: "goods-scene",
        title: "保温杯晨间场景",
        category: "生活家居",
        description: "用清晨通勤与木质桌面环境，强化保温杯的日常陪伴感和品质感。",
        sourceImage: "/assets/task-gallery-5.png",
        coverImage: "/assets/result-2.png",
        resultImages: [
          { id: "cup-result-1", src: "/assets/result-2.png", title: "窗边晨光 - 桌面静物构图" },
          { id: "cup-result-2", src: "/assets/result-3.png", title: "办公室工位 - 通勤陪伴场景" },
          { id: "cup-result-3", src: "/assets/result-4.png", title: "咖啡店桌面 - 氛围感特写" }
        ]
      },
      {
        id: "scene-case-bag",
        toolKey: "goods-scene",
        title: "箱包通勤场景",
        category: "箱包配饰",
        description: "打造偏都市感的出行场景，让箱包产品更容易被用于营销落地页。",
        sourceImage: "/assets/task-gallery-8.png",
        coverImage: "/assets/task-gallery-7.png",
        resultImages: [
          { id: "bag-result-1", src: "/assets/task-gallery-7.png", title: "商圈街拍 - 都市通勤风" },
          { id: "bag-result-2", src: "/assets/result-1.png", title: "机场大厅 - 出行属性强化" },
          { id: "bag-result-3", src: "/assets/result-3.png", title: "咖啡馆落座 - 日常生活感" }
        ]
      }
    ]
  }
};

function createCaseCollection(tool: ToolConfig): CaseCollection {
  const override = caseTemplateOverrides[tool.key];
  if (override) return override;

  return {
    headline: `平台为「${tool.panelTitle}」精选了可直接参考的案例模板`,
    subheadline: "可查看原图、结果图与案例思路，并支持一键做同款来快速验证效果。",
    templates: [
      {
        id: `${tool.key}-case-a`,
        toolKey: tool.key,
        title: `${tool.panelTitle}案例 A`,
        category: tool.label,
        description: `适用于 ${tool.panelTitle} 的高转化模板案例，突出商品主体与画面完整度。`,
        sourceImage: "/assets/task-gallery-4.png",
        coverImage: "/assets/result-1.png",
        resultImages: [
          { id: `${tool.key}-case-a-1`, src: "/assets/result-1.png", title: "结果示例 1" },
          { id: `${tool.key}-case-a-2`, src: "/assets/result-2.png", title: "结果示例 2" },
          { id: `${tool.key}-case-a-3`, src: "/assets/result-3.png", title: "结果示例 3" }
        ]
      },
      {
        id: `${tool.key}-case-b`,
        toolKey: tool.key,
        title: `${tool.panelTitle}案例 B`,
        category: tool.label,
        description: `适用于 ${tool.panelTitle} 的另一套平台模板，用于快速体验当前功能效果。`,
        sourceImage: "/assets/task-gallery-6.png",
        coverImage: "/assets/result-4.png",
        resultImages: [
          { id: `${tool.key}-case-b-1`, src: "/assets/result-4.png", title: "结果示例 1" },
          { id: `${tool.key}-case-b-2`, src: "/assets/task-gallery-7.png", title: "结果示例 2" },
          { id: `${tool.key}-case-b-3`, src: "/assets/task-gallery-8.png", title: "结果示例 3" }
        ]
      }
    ]
  };
}

function createPendingResultItems(
  tool: ToolConfig,
  uploads: UploadItem[],
  outputCount: number,
  runSeed: number,
  taskId: string,
  advancedSelections: AdvancedSelectionMap = {}
): ResultItem[] {
  const mediaKind = getResultMediaKind(tool.key);
  const sellingPointLines = splitMultilineValues(advancedSelections.setPackSellingPoints);
  const setPackTypes = getSetPackSelectedTypes(advancedSelections);
  const isSetPackTool = isSetPackLikeTool(tool.key);
  const resolvedSetPackItems =
    isSetPackTool
      ? (() => {
          const fallbackTypes =
            tool.key === "set-aplus"
              ? aplusModuleLibrary.slice(0, Math.max(outputCount, 6)).map((item) => ({
                  id: item.id,
                  category: item.category,
                  name: item.category,
                  description: item.description,
                  tag: item.tag,
                  prompt: item.promptHint,
                  ratio: item.defaultRatio,
                  resolution: item.defaultResolution
                }))
              : setPackResultRoleLabels.map((label, index) => ({
                  id: `fallback-${index}`,
                  category: label,
                  name: label,
                  description: "",
                  tag: /(主图|卖点)/.test(label) ? "商品主图" : "细节图",
                  prompt: "",
                  ratio: "1:1",
                  resolution: "1K"
                }));
          const sourceTypes = setPackTypes.length ? setPackTypes : fallbackTypes;
          const perTypeCount = Math.max(1, Math.floor(outputCount / Math.max(sourceTypes.length, 1)) || 1);
          return Array.from({ length: Math.max(1, outputCount) }, (_, index) => {
            const type = sourceTypes[Math.floor(index / perTypeCount)] ?? sourceTypes[sourceTypes.length - 1];
            const withinTypeIndex = (index % perTypeCount) + 1;
            return {
              category: type.category,
              prompt: type.prompt,
              name: perTypeCount > 1 ? `${type.category} ${withinTypeIndex}` : type.category
            };
          });
        })()
      : [];
  return Array.from({ length: Math.max(1, outputCount) }, (_, index) => ({
    id: `${tool.key}-${runSeed}-${index}`,
    toolKey: tool.key,
    label: isSetPackTool ? resolvedSetPackItems[index]?.name ?? `${tool.panelTitle}${index + 1}` : formatGeneratedResultName(tool, uploads, index),
    fileName: isSetPackTool ? `${resolvedSetPackItems[index]?.name ?? `${tool.panelTitle}${index + 1}`}.png` : formatGeneratedResultName(tool, uploads, index),
    taskId,
    mediaKind,
    status: isSetPackTool ? "skeleton" : index === 0 ? "skeleton" : "queued",
    selected: false,
    createdAt: runSeed + index,
    roleLabel: isSetPackTool ? resolvedSetPackItems[index]?.category ?? `${tool.panelTitle}${index + 1}` : undefined,
    overlayText:
      tool.key === "set-main"
        ? /(卖点|参数)/.test(resolvedSetPackItems[index]?.category ?? "")
          ? sellingPointLines[Math.min(index - 1, Math.max(sellingPointLines.length - 1, 0))] ?? ""
          : ""
        : undefined
  }));
}

function isVideoGenerationTool(toolKey: string) {
  return toolKey.startsWith("video-");
}

function resolveVideoPricingSelections(
  toolKey: string,
  creationModeSelection: CreationModeSelection | null,
  advancedSelections: AdvancedSelectionMap
): VideoPricingSelectionMap {
  const config = videoPricingConfigs[toolKey];
  if (!config) {
    return {};
  }

  const durationKey = config.selectionKeys?.duration;
  const marketKey = config.selectionKeys?.market;
  const hasSoundKey = config.selectionKeys?.hasSound;

  return {
    mode: creationModeSelection?.modeLabel ?? config.defaultSelections?.mode,
    duration: durationKey ? advancedSelections[durationKey] ?? config.defaultSelections?.duration : config.defaultSelections?.duration,
    market: marketKey ? advancedSelections[marketKey] ?? config.defaultSelections?.market : config.defaultSelections?.market,
    ratio: creationModeSelection?.ratio ?? config.defaultSelections?.ratio,
    resolution: creationModeSelection?.resolution ?? config.defaultSelections?.resolution,
    hasSound: hasSoundKey ? advancedSelections[hasSoundKey] ?? config.defaultSelections?.hasSound : config.defaultSelections?.hasSound
  };
}

function getVideoGenerationBaseCreditCost(
  toolKey: string,
  creationModeSelection: CreationModeSelection | null,
  advancedSelections: AdvancedSelectionMap
) {
  const config = videoPricingConfigs[toolKey];
  if (!config) {
    return creationModeSelection?.unitCreditCost ?? 0;
  }

  const selections = resolveVideoPricingSelections(toolKey, creationModeSelection, advancedSelections);
  const baseCost = (Object.entries(config.dimensionCosts) as Array<[keyof VideoPricingSelectionMap, Record<string, number> | undefined]>).reduce((sum, [dimension, costMap]) => {
    if (!costMap) return sum;
    const selectedValue = selections[dimension];
    if (!selectedValue) return sum;
    return sum + (costMap[selectedValue] ?? 0);
  }, 0);

  return baseCost || creationModeSelection?.unitCreditCost || 0;
}

function getImageGenerationUnitCreditCost(
  toolKey: string,
  creationModeSelection: CreationModeSelection | null,
  advancedSelections: AdvancedSelectionMap
) {
  if (toolKey === "image-cutout") {
    return 10;
  }

  if (toolKey === "image-watermark") {
    return advancedSelections.watermarkModeKey === "manual" ? 5 : 10;
  }

  if (toolKey === "image-upscale") {
    const resolution = advancedSelections.upscaleResolution ?? "2K";
    return (
      {
        "2K": 5,
        "4K": 10,
        "8K": 20
      }[resolution] ?? 5
    );
  }

  if (toolKey === "image-remove") {
    return 5;
  }

  if (toolKey === "image-lineart") {
    const style = advancedSelections.lineartStyle ?? "清稿";
    return (
      {
        "清稿": 5,
        "草图/速写": 10,
        "精细素描": 15
      }[style] ?? 5
    );
  }

  if (toolKey === "image-expand") {
    if (creationModeSelection?.modeId === "advanced") {
      const resolution = creationModeSelection.resolution ?? "1K";
      return (
        {
          "1K": 10,
          "2K": 15,
          "4K": 20
        }[resolution] ?? 10
      );
    }
    return 5;
  }

  if (toolKey === "pod-crop") {
    const mode = advancedSelections.podCropMode ?? creationModeSelection?.modeLabel ?? "通用";
    return (
      {
        "通用": 5,
        "铁皮画": 10,
        "装饰画": 15
      }[mode] ?? 5
    );
  }

  if (toolKey === "pod-partial-edit") {
    return 5;
  }

  if (toolKey === "pod-fusion") {
    return 5;
  }

  if (toolKey === "video-pattern-repeat") {
    return 5;
  }

  return null;
}

function getPatternRepeatPromptItems(selectionMap?: AdvancedSelectionMap) {
  const rawPromptItems = safeParseJson<PatternRepeatPromptItem[] | string[]>(selectionMap?.patternRepeatPrompts, []);
  if (Array.isArray(rawPromptItems) && rawPromptItems.length > 0) {
    const normalizedItems = rawPromptItems
      .map((item) =>
        typeof item === "string"
          ? { id: generateRandomTenDigitId(), text: item }
          : {
              id: item.id || generateRandomTenDigitId(),
              text: item.text ?? "",
              reverseImage: item.reverseImage
            }
      )
      .filter((item) => item.text.trim() || item.reverseImage);
    if (normalizedItems.length) {
      return normalizedItems;
    }
  }

  return [{ id: generateRandomTenDigitId(), text: "" }];
}

function getPatternRepeatMetrics(selectionMap?: AdvancedSelectionMap) {
  const type = selectionMap?.patternRepeatType ?? "四方连续";
  const createMode = selectionMap?.patternRepeatCreateMode ?? "图生图";
  const promptItems = getPatternRepeatPromptItems(selectionMap);
  const promptCount = promptItems.filter((item) => item.text.trim() || item.reverseImage).length;

  return {
    type,
    createMode,
    promptItems,
    promptCount,
    requiresMainUploads: type === "二方连续" || type === "扩大画幅" || createMode === "图生图",
    isTextReady: type === "四方连续" && createMode === "文生图" && promptCount > 0
  };
}

function getVideoStylePrintPromptItems(selectionMap?: AdvancedSelectionMap) {
  const rawPromptItems = safeParseJson<PatternRepeatPromptItem[] | string[]>(selectionMap?.videoStylePrintPrompts, []);
  if (Array.isArray(rawPromptItems) && rawPromptItems.length > 0) {
    const normalizedItems = rawPromptItems
      .map((item) =>
        typeof item === "string"
          ? { id: generateRandomTenDigitId(), text: item }
          : {
              id: item.id || generateRandomTenDigitId(),
              text: item.text ?? "",
              reverseImage: item.reverseImage
            }
      )
      .filter((item) => item.text.trim() || item.reverseImage);
    if (normalizedItems.length) {
      return normalizedItems;
    }
  }

  return [{ id: generateRandomTenDigitId(), text: "" }];
}

function getVideoStylePrintMetrics(selectionMap?: AdvancedSelectionMap) {
  const createMode = selectionMap?.videoStylePrintCreateMode ?? "图生图";
  const promptItems = getVideoStylePrintPromptItems(selectionMap);
  const promptCount = promptItems.filter((item) => item.text.trim() || item.reverseImage).length;

  return {
    createMode,
    promptItems,
    promptCount,
    requiresMainUploads: createMode === "图生图",
    isTextReady: createMode === "文生图" && promptCount > 0
  };
}

function getVideo2d3dMetrics(selectionMap?: AdvancedSelectionMap) {
  const style = selectionMap?.video2d3dStyle ?? video2d3dStyleOptions[0];
  return {
    style,
    isReady: Boolean(style)
  };
}

function getResolvedToolUnitCreditCost(
  toolKey: string,
  creationModeSelection: CreationModeSelection | null,
  advancedSelections: AdvancedSelectionMap
) {
  if (toolKey === "more-title") {
    return Math.max(1, parseMultiSelectValue(advancedSelections.moreTitleOutputStyles).filter((style) => moreTitleStyleOptions.includes(style)).length);
  }

  if (isVideoGenerationTool(toolKey)) {
    return getVideoGenerationBaseCreditCost(toolKey, creationModeSelection, advancedSelections);
  }

  const imageToolUnitCreditCost = getImageGenerationUnitCreditCost(toolKey, creationModeSelection, advancedSelections);
  if (imageToolUnitCreditCost !== null) {
    return imageToolUnitCreditCost;
  }

  return creationModeSelection?.unitCreditCost ?? 0;
}

function getSpecialToolOutputCount(toolKey: string, sourceCount: number, referenceCount: number, batchCount: number) {
  if (isSetPackLikeTool(toolKey)) {
    return batchCount;
  }

  if (toolKey === "set-replica") {
    return sourceCount * referenceCount * batchCount;
  }

  if (toolKey === "video-print-extend") {
    return sourceCount * referenceCount * batchCount;
  }

  return batchCount;
}

function getSpecialToolGenerateCost(toolKey: string, sourceCount: number, referenceCount: number, batchCount: number, unitCreditCost: number) {
  if (isSetPackLikeTool(toolKey)) {
    return getSpecialToolOutputCount(toolKey, sourceCount, referenceCount, batchCount) * unitCreditCost;
  }

  if (toolKey === "set-replica" || isVideoGenerationTool(toolKey)) {
    return getSpecialToolOutputCount(toolKey, sourceCount, referenceCount, batchCount) * unitCreditCost;
  }

  return sourceCount * unitCreditCost * batchCount;
}

function getQueuedResultRefundCredits(toolKey: string, sourceCount: number, unitCreditCost: number) {
  if (isSetPackLikeTool(toolKey) || toolKey === "set-replica" || isVideoGenerationTool(toolKey)) {
    return unitCreditCost;
  }

  return sourceCount * unitCreditCost;
}

const defaultRatioOptions = ["自适应尺寸", "1:1", "3:4", "4:5", "9:16", "2:3", "16:9", "4:3", "5:4", "3:2", "21:9"];
const defaultCountOptions = ["1", "2"];
const videoPrintExtendBaseRatioOptions = ["1:1", "1:2", "2:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9"] as const;
const videoPrintExtendOutputCountOptions = ["1", "2", "3", "4"] as const;
const VIDEO_PRINT_EXTEND_UNIT_CREDIT_COST = 5;
const defaultResolutionOptions = ["1K", "2K", "4K"];
const podCropModeOptions = [
  { key: "通用", label: "通用" },
  { key: "铁皮画", label: "铁皮画" },
  { key: "装饰画", label: "装饰画" }
];
const podVariationCategoryOptions = ["默认", "服装/纺织", "手机壳", "铁艺图形", "挂钟", "装饰画", "铁皮画"] as const;
const podVariationModeOptions = ["艺术设计", "文字强化", "爆款二创", "通用"] as const;
const podVariationBurstOptions = ["改主体", "改姿势", "改背景", "✨爆改✨"] as const;
const podVariationContentOptions = ["裂变整个商品", "仅裂变素材图案部分"] as const;
const podVariationShapeOptions = ["默认", "圆形"] as const;
const podVariationReferenceStyleLevels = ["低", "中", "高"] as const;
const podVariationDivergenceLevels = ["低", "中", "高"] as const;
type PodVariationModeKey = (typeof podVariationModeOptions)[number];
const podVariationGraphicStyleOptions = [
  { key: "曼陀罗填充", label: "曼陀罗填充" },
  { key: "低多边形", label: "低多边形" },
  { key: "极简线条", label: "极简线条" },
  { key: "负空间", label: "负空间" },
  { key: "炫彩珐琅", label: "炫彩珐琅" }
] as const;
const podVariationDimensionOptions = ["参考主体", "裂变主体"] as const;
const podVariationClockModeOptions = [
  { key: "3D立体增强V2", label: "3D立体增强V2", description: "生成效果更立体" },
  { key: "通用", label: "通用", description: "表盘种类更丰富" }
] as const;
const podVariationClockDialStyleOptions = [
  "经典阿拉伯数字",
  "斜切线刻度",
  "现代数字分布",
  "粗体方正数字",
  "罗马数字",
  "轻量短线刻度",
  "细边圆盘",
  "复古粗刻度"
] as const;
const podVariationClockGenerateMethodOptions = ["随机组合生成", "全部生成"] as const;
const podVariationRatioOptions = ["1:1", "2:3", "3:4", "4:5", "9:16", "16:9"] as const;
const podVariationTinEffectSourceOptions = ["锈斑", "自定义上传"] as const;
const podVariationTinEffectPresetOptions = [
  "锈斑样式1",
  "锈斑样式2",
  "锈斑样式3",
  "锈斑样式4",
  "锈斑样式5",
  "锈斑样式6",
  "锈斑样式7"
] as const;
function parsePodVariationClockDialStyles(value?: string) {
  if (!value) return [podVariationClockDialStyleOptions[0]];
  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is (typeof podVariationClockDialStyleOptions)[number] =>
      podVariationClockDialStyleOptions.includes(item as (typeof podVariationClockDialStyleOptions)[number])
    );
  return values.length ? values : [podVariationClockDialStyleOptions[0]];
}
function normalizePodVariationContentValue(value?: string) {
  if (value === "裂变商品") return "裂变整个商品";
  if (value === "仅裂变素材中的图案部分") return "仅裂变素材图案部分";
  if (value && podVariationContentOptions.includes(value as (typeof podVariationContentOptions)[number])) {
    return value as (typeof podVariationContentOptions)[number];
  }
  return podVariationContentOptions[0];
}
const podVariationCategoryHiddenModes: Partial<Record<(typeof podVariationCategoryOptions)[number], PodVariationModeKey[]>> = {
  "服装/纺织": ["爆款二创"],
  "手机壳": ["爆款二创"],
  "装饰画": ["爆款二创"],
  "铁皮画": ["爆款二创", "通用"]
};
const podPartialEditRequirementOptions = [
  "替换“文字”和元素",
  "去除商品印花",
  "商品换色",
  "服饰贴纹理",
  "自定义提示词"
] as const;
const podPartialEditCategoryOptions = ["默认", "服装/纺织", "手机壳", "铁艺图形", "挂钟", "装饰画", "铁皮画"] as const;
const podPartialEditOutputCountOptions = ["1", "2", "3", "4"] as const;
const podPartialEditTemplates: Record<string, PartialEditTemplateConfig> = {
  "替换“文字”和元素": {
    key: "replace-text-elements",
    label: "替换“文字”和元素",
    fields: [
      { key: "note", label: "说明", type: "text", defaultValue: "适用于海报、挂画、包装等需要替换局部文案和装饰元素的素材。" },
      { key: "sourceContent", label: "需替换的内容", type: "input", placeholder: "输入画面中需要替换的内容", defaultValue: "" },
      { key: "replacementContents", label: "替换后的内容", type: "dynamic-list", placeholder: "输入替换后的内容", defaultValue: JSON.stringify([""]), maxItems: 10 }
    ]
  },
  "去除商品印花": {
    key: "remove-print",
    label: "去除商品印花",
    fields: [
      { key: "sourceContent", label: "需替换的内容", type: "input", placeholder: "输入画面中需要替换的内容", defaultValue: "" },
      { key: "removeHint", label: "提示", type: "text", defaultValue: "将要替换的内容改为白底图" }
    ]
  },
  "商品换色": {
    key: "recolor-product",
    label: "商品换色",
    fields: [
      { key: "sourceContent", label: "需替换的内容", type: "input", placeholder: "输入画面中需要替换的内容", defaultValue: "" },
      { key: "replacementColors", label: "替换后的颜色", type: "dynamic-color-list", defaultValue: JSON.stringify(["#111111"]), maxItems: 10 }
    ]
  },
  "服饰贴纹理": {
    key: "garment-texture",
    label: "服饰贴纹理",
    fields: [
      { key: "textureUpload", label: "上传纹理图", type: "image", defaultValue: "" },
      { key: "textureHint", label: "提示", type: "text", defaultValue: "将上传的纹理贴到画面中的服饰" }
    ]
  },
  "自定义提示词": {
    key: "custom-prompt",
    label: "自定义提示词"
  }
};
const podExtractModeCards = [
  { key: "专项提取", label: "专项提取", description: "遮挡少的印花类商品" },
  { key: "全能提取", label: "全能提取", description: "大幅褶皱，遮挡严重" }
] as const;
type PodExtractModeKey = (typeof podExtractModeCards)[number]["key"];

const podExtractSceneOptions: Record<PodExtractModeKey, string[]> = {
  "专项提取": ["通用", "手机壳", "家纺", "桌布"],
  "全能提取": ["全能", "全幅印", "桌布", "手机壳", "凤玲", "挂钟"]
};
const podExtractRatioOptions: Record<PodExtractModeKey, string[]> = {
  "专项提取": ["自动检测比例", "1:1", "1:2", "2:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "18:23"],
  "全能提取": ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9"]
};
const videoSceneGridModeCards: Array<{ key: "系列图案" | "主副图案" | "情侣图案"; label: string; description: string; badge?: string }> = [
  { key: "系列图案", label: "系列图案", description: "适用装饰画、抱枕、帆布画、穿戴甲等连幅图案场景" },
  { key: "主副图案", label: "主副图案", description: "适用服饰、杯子、保温瓶等双面图案场景" },
  { key: "情侣图案", label: "情侣/亲子图案", description: "适用服饰、项链吊坠、纹身贴、杯子等情侣图案场景", badge: "NEW" }
];
type VideoSceneGridModeKey = (typeof videoSceneGridModeCards)[number]["key"];
const videoSceneGridVariationOptions: Record<VideoSceneGridModeKey, string[]> = {
  "系列图案": ["智能参考", "裂变主体", "裂变主体/文本", "裂变主题", "系列衍生"],
  "主副图案": ["智能参考", "简洁", "丰富", "反转", "叙事性"],
  "情侣图案": ["智能参考"]
};
const videoSceneGridDetailDimensionMap: Record<VideoSceneGridModeKey, Record<string, string[]>> = {
  "系列图案": {
    "智能参考": ["智能识别系列关系", "保留原始风格线索", "自动补齐系列一致性"],
    "裂变主体": ["主体数量变化", "主体组合方式", "主次节奏控制"],
    "裂变主体/文本": ["文本位置编排", "图文占比控制", "标题与主体呼应"],
    "裂变主题": ["主题方向延展", "统一配色氛围", "强化视觉母题"],
    "系列衍生": ["延展子款内容", "保持套系感", "控制衍生差异度"]
  },
  "主副图案": {
    "智能参考": ["自动识别主副关系", "保留核心构图逻辑", "平衡主次视觉权重"],
    "简洁": ["主图更突出", "副图弱化点缀", "增加留白感"],
    "丰富": ["增强层次密度", "补充装饰元素", "提升信息丰富度"],
    "反转": ["切换主副位置", "重构视觉重心", "生成反差版式"],
    "叙事性": ["加入故事场景", "强化角色关系", "形成视觉引导线"]
  },
  "情侣图案": {
    "智能参考": ["双人关系识别", "服装元素呼应", "互动姿态统一"]
  }
};
const videoSceneGridSeriesVariationTips: Record<string, { title: string; description: string }> = {
  "智能参考": {
    title: "智能参考",
    description: "智能识别系列关系，保留原始风格线索，自动补齐系列一致性。"
  },
  "裂变主体": {
    title: "裂变主体",
    description: "仅裂变主体内容，排版不变。"
  },
  "裂变主体/文本": {
    title: "裂变主体/文本",
    description: "裂变主体和文本，排版不变。"
  },
  "裂变主题": {
    title: "裂变主题",
    description: "裂变主题，主体不变。"
  },
  "系列衍生": {
    title: "系列衍生",
    description: "强风格一致性，裂变主体元素，生成创意具备连续性。"
  }
};
const videoSceneGridPrimarySecondaryVariationTips: Record<string, { title: string; description: string }> = {
  "智能参考": {
    title: "智能参考",
    description: "智能分析原素材，选取最佳创意进行裂变。"
  },
  "简洁": {
    title: "简洁",
    description: "简化元素和构图，仍然保持一致性表达。"
  },
  "丰富": {
    title: "丰富",
    description: "丰富元素和构图，仍然保持一致性表达。"
  },
  "反转": {
    title: "反转",
    description: "与原素材内容的相对立反转。"
  },
  "叙事性": {
    title: "叙事性",
    description: "与原素材在主题上强关联，且带有趣味性。"
  }
};
const videoSceneGridCoupleVariationTips: Record<string, { title: string; description: string }> = {
  "智能参考": {
    title: "智能参考",
    description: "智能分析原素材，选取最佳创意进行裂变。"
  }
};
const videoSceneGridRatioOptions = [...podExtractRatioOptions["专项提取"]] as const;
const podFusionModeOptions = ["两两融合", "一对多融合"] as const;
const podFusionStyleOptions = ["默认", "3D", "皮克斯", "水彩", "像素", "矢量", "复古", "科幻", "赛博朋克"] as const;
const podFusionBackgroundOptions = ["默认", "简洁", "丰富"] as const;
const podFusionRatioOptions = [...podExtractRatioOptions["专项提取"]] as const;
const podFusionOutputCountOptions = ["1", "2", "3", "4"] as const;
const patternRepeatTypeOptions = ["四方连续", "二方连续", "扩大画幅"] as const;
const patternRepeatCreateModeOptions = ["图生图", "文生图"] as const;
const patternRepeatGenerateModeOptions = ["相似", "原图连续"] as const;
const patternRepeatRatioOptions = [...podExtractRatioOptions["专项提取"]] as const;
const patternRepeatOutputCountOptions = ["1", "2", "3", "4"] as const;
const patternRepeatDensityLevels = ["稀疏", "均衡", "密集"] as const;
const videoStylePrintCreateModeOptions = ["图生图", "文生图"] as const;
const videoStylePrintRatioOptions = [...podExtractRatioOptions["专项提取"]] as const;
const videoStylePrintOutputCountOptions = ["1", "2", "3", "4"] as const;
const video2d3dStyleCategoryMap = {
  全部: [
    "裂纹彩绘",
    "罗纹编织纹理",
    "提花编织纹理",
    "立体软胶",
    "写实素描",
    "漆红刻画",
    "现代速写",
    "闪粉剪影",
    "UV 浮雕",
    "夸张手绘",
    "撞色线稿",
    "炭粉水彩",
    "麻胶版画",
    "连笔肖像",
    "矢量水彩",
    "蜡笔线线",
    "哥特肖像",
    "童趣水彩",
    "极简粗铅",
    "糙彩肖像",
    "瓷蓝速写",
    "平面插画",
    "立体果冻",
    "平涂插画",
    "玻璃画",
    "3D凹印",
    "3D皮质",
    "羊羔绒",
    "宠物牛仔贴布",
    "立体植绒",
    "贴布绣",
    "粗线全幅绣",
    "粗线局部绣",
    "细线全幅绣",
    "细线局部绣",
    "细线图形绣",
    "粗线图形绣",
    "立体发泡",
    "木质浮雕",
    "铜面浮雕",
    "银面浮雕",
    "金面浮雕",
    "雕塑绘画",
    "立体纸雕",
    "刺绣",
    "宠物矢量头像",
    "宠物肖像",
    "宠物青花",
    "炭笔素描",
    "水彩",
    "折纸",
    "儿童绘本",
    "经典皮克斯",
    "水彩泼墨",
    "美式夸张漫画",
    "美式漫画",
    "粘土",
    "街头涂鸦",
    "新海诚",
    "辛普森",
    "荧光",
    "厚涂油画",
    "2D迪士尼",
    "色块油画",
    "简易线稿",
    "印象油画",
    "立体刺绣",
    "黑白简笔",
    "卡通手绘",
    "夸张肖像",
    "无脸矢量肖像",
    "马克笔",
    "速写",
    "厚涂水彩",
    "数字卡通",
    "吉卜力",
    "针织",
    "速写线稿",
    "复古海报",
    "线稿色块",
    "彩铅",
    "木刻版画",
    "铅笔素描"
  ],
  原始3D风格: [
    "罗纹编织纹理",
    "提花编织纹理",
    "UV 浮雕",
    "粗线全幅绣",
    "粗线局部绣",
    "细线全幅绣",
    "细线局部绣",
    "细线图形绣",
    "粗线图形绣",
    "立体发泡",
    "木质浮雕",
    "铜面浮雕",
    "银面浮雕",
    "金面浮雕",
    "雕塑绘画",
    "立体纸雕"
  ],
  线描手稿: ["写实素描", "现代速写", "撞色线稿", "麻胶版画", "连笔肖像", "蜡笔线线", "极简粗铅", "瓷蓝速写", "炭笔素描", "简易线稿", "黑白简笔", "速写", "速写线稿", "铅笔素描"],
  插画卡通: ["裂纹彩绘", "漆红刻画", "夸张手绘", "平面插画", "平涂插画", "童趣水彩", "儿童绘本", "经典皮克斯", "美式夸张漫画", "美式漫画", "2D迪士尼", "卡通手绘", "夸张肖像", "数字卡通", "吉卜力"],
  水彩油画: ["炭粉水彩", "矢量水彩", "糙彩肖像", "水彩", "水彩泼墨", "厚涂油画", "色块油画", "印象油画", "厚涂水彩", "彩铅", "马克笔"],
  工艺材质: ["罗纹编织纹理", "提花编织纹理", "UV 浮雕", "玻璃画", "3D凹印", "3D皮质", "羊羔绒", "宠物牛仔贴布", "立体植绒", "贴布绣", "粗线全幅绣", "粗线局部绣", "细线全幅绣", "细线局部绣", "细线图形绣", "粗线图形绣", "立体发泡", "木质浮雕", "铜面浮雕", "银面浮雕", "金面浮雕", "雕塑绘画", "立体纸雕", "刺绣", "立体刺绣", "针织"],
  设计风格: ["闪粉剪影", "哥特肖像", "立体软胶", "立体果冻", "折纸", "街头涂鸦", "新海诚", "辛普森", "荧光", "复古海报", "线稿色块", "木刻版画"],
  人像宠物: ["宠物矢量头像", "宠物肖像", "宠物青花", "无脸矢量肖像"]
} as const;
const video2d3dStyleCategories = Object.keys(video2d3dStyleCategoryMap) as Array<keyof typeof video2d3dStyleCategoryMap>;
const video2d3dStyleOptions = video2d3dStyleCategoryMap.全部;
const video2d3dRatioOptions = [...podExtractRatioOptions["专项提取"]] as const;
const video2d3dOutputCountOptions = ["1", "2", "3", "4"] as const;
const videoReplicaModeOptions = ["普通模式", "高级模式"] as const;
type VideoReplicaModeKey = (typeof videoReplicaModeOptions)[number];
const videoReplicaDurationOptions = ["4s", "5s", "6s", "7s", "8s", "9s", "10s", "11s", "12s", "13s", "14s", "15s"];
const videoReplicaRatioOptions = ["自适应尺寸", "横16:9", "横4:3", "正1:1", "竖3:4", "竖9:16", "横21:9"];
const videoReplicaResolutionOptions = ["480p", "720p"];
const videoReplicaSoundOptions = ["无声", "参考原视频声音", "智能匹配声音"] as const;
const videoReplaceSoundOptions = ["无声", "使用原视频声音", "智能匹配声音"] as const;
type VideoReplicaSoundOption = (typeof videoReplicaSoundOptions)[number];
type VideoReplaceSoundOption = (typeof videoReplaceSoundOptions)[number];

function normalizeVideoReplicaSoundOption(value?: string): VideoReplicaSoundOption {
  switch (value) {
    case "无声音":
      return "无声";
    case "参考原视频":
    case "保留原视频音频":
    case "使用原视频声音":
      return "参考原视频声音";
    case "智能匹配声音":
    case "无声":
    case "参考原视频声音":
      return value;
    default:
      return "无声";
  }
}

function normalizeVideoReplaceSoundOption(value?: string): VideoReplaceSoundOption {
  switch (value) {
    case "无声音":
      return "无声";
    case "参考原视频":
    case "保留原视频音频":
    case "参考原视频声音":
      return "使用原视频声音";
    case "智能匹配声音":
    case "无声":
    case "使用原视频声音":
      return value;
    default:
      return "无声";
  }
}

const videoPricingConfigs: Partial<Record<string, VideoPricingConfig>> = {
  "video-replica": {
    selectionKeys: {
      duration: "videoReplicaDuration",
      hasSound: "videoReplicaHasSound"
    },
    defaultSelections: {
      duration: "10s",
      ratio: "竖9:16",
      resolution: "480p",
      hasSound: "无声"
    },
    dimensionCosts: {
      mode: {
        "普通模式": 30,
        "高级模式": 50
      },
      duration: {
        "4s": 0,
        "5s": 4,
        "6s": 8,
        "7s": 12,
        "8s": 16,
        "9s": 20,
        "10s": 24,
        "11s": 28,
        "12s": 32,
        "13s": 36,
        "14s": 40,
        "15s": 44
      },
      ratio: {
        "自适应尺寸": 0,
        "横16:9": 6,
        "横4:3": 6,
        "正1:1": 8,
        "竖3:4": 10,
        "竖9:16": 12,
        "横21:9": 14
      },
      resolution: {
        "480p": 0,
        "720p": 18
      },
      hasSound: {
        "无声": 0,
        "参考原视频声音": 15,
        "智能匹配声音": 15
      }
    }
  }
};
const productTypeInputOptions = [
  "智能识别",
  "服装",
  "T恤",
  "背包",
  "鞋子",
  "小家电",
  "电视",
  "沙发",
  "吊灯",
  "化妆品",
  "香水",
  "水果",
  "饮料",
  "汽车",
  "集装箱",
  "蓝牙耳机",
  "手机",
  "行李箱",
  "文具",
  "机械设备",
  "项链",
  "玩具",
  "瑜伽服",
  "健身器材",
  "笔记本电脑",
  "手办"
];
const sceneTypeInputOptions = ["智能生成", "无背景", "简单背景", "产品场景", "纯色背景", "纯色渐变", "图片边框"];
const backgroundTypeInputOptions = ["电商白底", "实景室内", "室外场景", "商业广告风"];
const goodsWhiteUniversalRulePreset = goodsWhiteUniversalPresetConfig.prompt;
const platformInfoInputOptions = ["无平台信息", ...goodsWhitePlatformOptions];
const productInfoInputOptions = ["无信息", "智能生成", "名称+卖点", "价格与促销", "名称+卖点+价格+促销"];
const visualStyleInputOptions = ["自动匹配", "极简简约", "轻奢高端", "时尚潮流", "年轻元气", "专业信任", "强营销", "吸睛爆点"];
const marketingElementInputOptions = ["无", "折扣标识", "买一送一", "满减活动", "顺丰速达", "京东自营", "本地仓", "双十一促销"];
const backgroundLightingInputOptions = ["写实自然光", "柔光棚拍风", "日系清新光", "高级杂志风", "人造光氛围"];
const targetLanguageInputOptions = ["简体中文", "英语", "繁体中文", "日语", "韩语", "西班牙语", "俄语", "法语", "泰语", "印尼语", "阿拉伯语"];
const videoMainScriptModeOptions = [
  { key: "ai-script", label: "AI生成脚本" },
  { key: "custom-script", label: "自定义脚本" }
];
const spokespersonInteractionOptions = ["穿戴展示", "手持展示", "使用状态展示", "推荐代言", "产品静置人物出现", "身体局部展示"];
const spokespersonCharacterOptions = [
  "明星气质",
  "网络达人",
  "真实素人",
  "产品专业人士",
  "生产工作人员",
  "卡通人物",
  "运动风",
  "商务",
  "休闲",
  "青春",
  "童趣",
  "慈祥",
  "搞怪"
];
const spokespersonSceneBackgroundOptions = [
  "无背景",
  "纯色背景",
  "简单背景",
  "真实场景",
  "居家场景",
  "摄影棚",
  "舞台T台",
  "户外场景",
  "城市街道",
  "商业空间"
];
const spokespersonLayoutOptions = [
  "人物全貌展示",
  "突出产品主体",
  "多场景拼接",
  "产品居中，周边搭配使用场景",
  "同一人物不同场景",
  "不同人物同一场景"
];
const spokespersonSkinToneOptions = ["亚洲", "北美", "欧洲", "南美", "非洲", "东南亚", "中东"];
const spokespersonGenderStyleOptions = ["男", "女", "中性风", "妩媚", "性冷淡"];
const spokespersonAgeOptions = ["婴幼儿", "儿童", "少年", "青年", "中年", "老年"];
const spokespersonFocusOptions = ["产品突出", "人物突出", "全貌展示", "局部特写"];
const spokespersonTargetMarketOptions = [
  "大陆",
  "北美",
  "韩国",
  "日本",
  "俄罗斯",
  "中东阿拉伯",
  "港澳",
  "中国台湾",
  "土耳其",
  "南美",
  "澳洲",
  "东南亚",
  "印度",
  "非洲",
  "英国",
  "德国",
  "法国",
  "欧洲",
  "东欧"
];
const setPackTargetMarketOptions = spokespersonTargetMarketOptions;
const sceneTargetMarketOptions = ["国内电商", "欧美市场", "日韩市场", "东南亚市场", "中东市场", "全球通用"];
const sceneCopyLanguageOptions = ["无需文案", "简体中文", "繁体中文", "英语", "日语", "韩语", "西班牙语", "法语", "德语"];
const modelTryAtmosphereOptions = [
  "生活化真实感",
  "杂志感精致呈现",
  "松弛感日常氛围",
  "活力运动氛围",
  "精致仪式感",
  "复古怀旧氛围",
  "潮流个性氛围",
  "极简高级氛围",
  "校园青春感",
  "成熟稳重感",
  "舒适从容感",
  "童趣感",
  "婴幼儿呵护",
  "可爱宠物"
];
const modelTryDisplayFocusOptions = [
  "版型剪裁呈现",
  "显瘦修饰效果",
  "显高拉长效果",
  "面料质感凸显",
  "搭配包容性",
  "舒适度暗示",
  "风格辨识度",
  "肤色契合度",
  "年龄适配度",
  "性别适配度"
];
const modelTrySceneTypeOptions = [
  "纯白背景",
  "简单背景",
  "纯色背景",
  "日常通勤场景",
  "休闲逛街场景",
  "户外出行场景",
  "正式办公场景",
  "社交聚会场景",
  "运动健身场景",
  "居家放松场景",
  "节日氛围场景",
  "校园场景",
  "商务应酬场景",
  "康养休闲场景",
  "宠物居家",
  "宠物户外"
];
const modelTryDisplayLayoutOptions = [
  "全身穿搭全景",
  "半身重点展示",
  "局部细节特写",
  "多角度拼接排版",
  "搭配组合排版",
  "多场景拼接展示",
  "单场景切图拼接",
  "单场景展示",
  "多场景组合",
  "人物手持代言",
  "人物互动展示"
];
const modelTryBodyTypeOptions = ["标准身形模特", "微胖友好模特", "娇小身形模特", "高挑身形模特", "健硕身形模特"];
const modelTryAgeRangeOptions = [
  "婴幼儿（2岁以内）",
  "儿童（5~12岁）",
  "青少年（12~18岁）",
  "青年（19~35岁）",
  "中年（36~55岁）",
  "中老年（56岁+）"
];
const modelTryGenderSpeciesOptions = ["男性", "女性", "中性风", "宠物类"];
const modelTryEthnicityOptions = ["亚洲人种", "欧洲人种", "非洲人种", "混血人种", "宠物", "动漫卡通人物", "卡通形象"];
const modelGenerateTypes: ModelGenerateTypeConfig[] = [
  { key: "real-model", label: "真人模特图" },
  { key: "mannequin-model", label: "人台模特图" },
  { key: "wig-model", label: "假发模特图" }
];
const modelGenerateProtectTargetByType: Record<string, ModelGenerateProtectTarget> = {
  "real-model": "apparel",
  "mannequin-model": "apparel",
  "wig-model": "hair"
};
const modelGenerateAppearanceOptions = ["欧美白人", "中国人", "亚洲人", "东南亚人", "非裔", "中东人", "拉丁裔"];
const modelGenerateAgeOptions = ["青少年", "青年", "中年", "老年"];
const modelGeneratePersonaOptions = ["上班族", "测评博主", "学生", "健身人群", "家庭主妇", "其他"];
const modelGenerateBodyOptions = ["纤细", "标准", "微胖", "大码"];
const sellingPointSceneTypeOptions = [
  "智能匹配",
  "电商主图",
  "简单场景",
  "纯色背景",
  "无背景纯白色",
  "彩色渐变",
  "电商展台",
  "室内居家",
  "都市街道",
  "运动场所",
  "户外公园",
  "自然风格",
  "背景虚化"
];
const sellingPointDisplayOptions = ["单细节展示", "多细节拼接展示", "细节 + 功能关联", "细节 + 材质对比", "细节 + 使用痕迹"];
const sellingPointCoreCopyOptions = [
  "自动生成单一核心卖点文案展示",
  "生成两个核心卖点文案对称展示",
  "生成主卖点搭配2~3个辅卖点",
  "生成多个核心卖点文案展示"
];
const sellingPointPresentationOptions = [
  "产品居中展示卖点两侧分布",
  "智能匹配",
  "产品场景化展示",
  "卖点分散排版",
  "产品展示在上卖点相关在下",
  "产品展示在下卖点相关在上",
  "左侧展示产品右侧展示卖点",
  "左侧展示卖点右侧展示产品",
  "产品微缩展示卖点环绕展示"
];
const sellingPointFocusOptions = ["材质优势", "工艺精度", "功能特性", "性能表现", "设计亮点"];
const sellingPointTitleOptions = ["无标题", "自动生成主标题"];
const sellingPointSubtitleOptions = ["无副标题", "自动生成副标题"];
const sellingPointFontStyleOptions = ["粗体", "黑体", "手写体", "标题黑体内容宋体", "卡通风", "科技风", "3d立体", "艺术字体"];
const sellingPointAssistElementOptions = ["箭头辅助", "图标辅助", "强调框辅助", "数据辅助", "线条辅助", "色块辅助"];
const buyerShowProductStateOptions = [
  "完整快递箱",
  "产品与配件自然陈列",
  "新品未拆封",
  "产品自然摆放场景",
  "安装场景",
  "使用状态",
  "穿戴状态",
  "长期使用状态"
];
const buyerShowPresentationOptions = [
  "主体展示",
  "细节局部拍摄",
  "自然摆放",
  "手持拍摄",
  "穿戴拍摄",
  "对镜子自拍",
  "使用中拍摄",
  "日常物品大小对比"
];
const buyerShowAtmosphereOptions = ["无场景", "居家场景", "局部或模糊场景", "车内场景", "移动运动场景", "日常外出场景", "节日场景"];
const buyerShowProductRealityOptions = ["包装与产品褶皱", "长期使用磨损", "使用中的真实"];
const buyerShowEnvironmentRealityOptions = ["杂乱环境", "宠物偶然入镜", "人物局部入镜", "临时摆放随意感", "人物素颜", "人物日常穿搭"];
const buyerShowShotRealityOptions = ["随手拍摄无美感", "较低像素", "手抖模糊", "反光逆光", "对镜自拍", "手持自拍"];
type RichSelectOption = {
  value: string;
  displayLabel: string;
  title: string;
  recommendation: string;
  description: string;
  thumbnailSrc?: string;
};

const cameraAngleOptions: RichSelectOption[] = [
  {
    value: "正面",
    displayLabel: "正面",
    title: "单面：正面",
    recommendation: "建议视角：正面",
    description: "仅生成正面视角，适用于主图或信息展示以正面为主的商品。"
  },
  {
    value: "左侧面",
    displayLabel: "左侧面",
    title: "单面：左侧面",
    recommendation: "建议视角：左侧面",
    description: "仅生成左侧视角，适合展示产品厚度或局部结构。"
  },
  {
    value: "右侧面",
    displayLabel: "右侧面",
    title: "单面：右侧面",
    recommendation: "建议视角：右侧面",
    description: "仅生成右侧视角，与左侧面类似，用于补充侧向信息。"
  },
  {
    value: "背面",
    displayLabel: "背面",
    title: "单面：背面",
    recommendation: "建议视角：背面",
    description: "仅生成背面视角，适合展示标签、背部结构或背面细节。"
  },
  {
    value: "底部",
    displayLabel: "底部",
    title: "单面：底部",
    recommendation: "建议视角：底部",
    description: "仅生成底部视角，用于展示底部结构、防滑纹或脚钉等。"
  },
  {
    value: "顶部俯拍",
    displayLabel: "顶部俯拍",
    title: "单面：顶部俯拍",
    recommendation: "建议视角：顶部俯拍",
    description: "仅从顶部垂直俯拍视角展示，适合杯子、餐具、寝具等俯视效果。"
  },
  {
    value: "45°俯拍",
    displayLabel: "45°俯拍",
    title: "单面：45°俯拍",
    recommendation: "建议视角：45°俯拍",
    description: "从上方45°俯视视角展示，兼具俯视与正面信息，通用性强。"
  },
  {
    value: "服饰类（上衣/连衣裙/外套）",
    displayLabel: "👕 服饰类（上衣/连衣裙/外套）",
    title: "👕 服饰类（上衣/连衣裙/外套）",
    recommendation: "建议视角：正面、45°、侧面、背面",
    description: "展示整体版型、肩线与剪裁；常规三视图可，如需展示领口/袖口可补俯视或细节。"
  },
  {
    value: "裤装类（牛仔裤/短裤/运动裤）",
    displayLabel: "👖 裤装类（牛仔裤/短裤/运动裤）",
    title: "👖 裤装类（牛仔裤/短裤/运动裤）",
    recommendation: "建议视角：正面、45°、侧面、背面",
    description: "突出裤型、长度比例与腰线；加入45°更自然，可加入坐姿或细节图增强真实感。"
  },
  {
    value: "鞋靴类",
    displayLabel: "👟 鞋靴类",
    title: "👟 鞋靴类",
    recommendation: "建议视角：正面、45°、侧面、背面",
    description: "展示鞋面、后跟与鞋底纹路；五视图可呈现鞋底、防滑纹以及厚度结构。"
  },
  {
    value: "包类/箱包",
    displayLabel: "👜 包类 / 箱包",
    title: "👜 包类 / 箱包",
    recommendation: "建议视角：正面、侧面、背面、俯视",
    description: "突出外形与背带结构；俯视展示容量和开口，底视展示脚钉与做工。"
  },
  {
    value: "美妆护肤类",
    displayLabel: "💄 美妆护肤类",
    title: "💄 美妆护肤类",
    recommendation: "建议视角：正面、45°、背面、顶视",
    description: "展示瓶身造型、标签与喷头/刷头细节；背面成分信息非常重要。"
  },
  {
    value: "饮料/食品包装",
    displayLabel: "🥤 饮料 / 食品包装",
    title: "🥤 饮料 / 食品包装",
    recommendation: "建议视角：正面、45°、背面、俯视",
    description: "正面展示识别，背面展示配料表，俯视展示封口和瓶盖结构。"
  },
  {
    value: "小家电（吹风机/榨汁机/音箱）",
    displayLabel: "🔌 小家电（吹风机/榨汁机/音箱）",
    title: "🔌 小家电（吹风机/榨汁机/音箱）",
    recommendation: "建议视角：正面、45°、侧面、背面",
    description: "强调按钮、出风口与插口布局；45°与俯视可增强立体呈现。"
  },
  {
    value: "数码产品（手机/显示器/平板）",
    displayLabel: "🖥️ 数码产品（手机/显示器/平板）",
    title: "🖥️ 数码产品（手机/显示器/平板）",
    recommendation: "建议视角：正面、侧面、背面、45°",
    description: "展示屏幕、厚度与接口布局；45°更真实，俯视可补充机身结构。"
  },
  {
    value: "家具（沙发/桌椅/柜体）",
    displayLabel: "🛋️ 家具（沙发/桌椅/柜体）",
    title: "🛋️ 家具（沙发/桌椅/柜体）",
    recommendation: "建议视角：正面、侧面、45°",
    description: "强调体积感与结构比例；俯视用于辅助空间感与布局判断。"
  },
  {
    value: "家清日化（洗衣液/清洁剂）",
    displayLabel: "🧴 家清日化（洗衣液/清洁剂）",
    title: "🧴 家清日化（洗衣液/清洁剂）",
    recommendation: "建议视角：正面、45°、背面",
    description: "包装形态和标签信息为主；背面展示配料表，顶视补充瓶口结构。"
  },
  {
    value: "玩具/模型",
    displayLabel: "🧸 玩具 / 模型",
    title: "🧸 玩具 / 模型",
    recommendation: "建议视角：正面、45°、侧面、背面",
    description: "适合展示整体轮廓、关节结构与局部细节，45°视角通常更有立体感。"
  },
  {
    value: "珠宝饰品",
    displayLabel: "💍 珠宝饰品",
    title: "💍 珠宝饰品",
    recommendation: "建议视角：正面、45°、俯视",
    description: "突出切工、反射与材质；微距特写对珠宝尤为重要。"
  },
  {
    value: "工具五金",
    displayLabel: "🛠️ 工具五金",
    title: "🛠️ 工具五金",
    recommendation: "建议视角：正面、45°、侧面、背面",
    description: "强调形状、接口和比例；对结构复杂类建议五视图。"
  },
  {
    value: "旅行箱/拉杆箱",
    displayLabel: "💼 旅行箱 / 拉杆箱",
    title: "💼 旅行箱 / 拉杆箱",
    recommendation: "建议视角：正面、侧面、背面",
    description: "展示轮子、拉杆与拉链；底视可体现轮子与支撑结构。"
  },
  {
    value: "家纺寝具（床垫/被子/枕头）",
    displayLabel: "🛏️ 家纺寝具（床垫/被子/枕头）",
    title: "🛏️ 家纺寝具（床垫/被子/枕头）",
    recommendation: "建议视角：正面、俯视、45°",
    description: "展示尺寸与蓬松度；侧视可呈现厚度和结构。"
  },
  {
    value: "家装建材（灯具/水龙头/五金件）",
    displayLabel: "🏠 家装建材（灯具/水龙头/五金件）",
    title: "🏠 家装建材（灯具/水龙头/五金件）",
    recommendation: "建议视角：正面、45°、侧面",
    description: "强调外观与安装方向；五视图可补充俯视或底部结构。"
  },
  {
    value: "厨房用品（锅具/餐具/收纳）",
    displayLabel: "🧂 厨房用品（锅具/餐具/收纳）",
    title: "🧂 厨房用品（锅具/餐具/收纳）",
    recommendation: "建议视角：正面、侧面、俯视",
    description: "展示容量、形态与结构；45°增强立体感。"
  },
  {
    value: "电商通用（不规则或结构复杂类）",
    displayLabel: "📦 电商通用（不规则或结构复杂类）",
    title: "📦 电商通用（不规则或结构复杂类）",
    recommendation: "建议视角：正面、侧面、背面",
    description: "结构复杂、多接口产品建议五视图以提供完整信息。"
  }
];
const modelGenerateSceneOptions: RichSelectOption[] = [
  { value: "默认场景", displayLabel: "默认场景", title: "默认场景", recommendation: "系统默认推荐", description: "适合大多数模特图生成任务。", thumbnailSrc: "/assets/task-gallery-4.png" },
  { value: "意式风情街", displayLabel: "意式风情街", title: "意式风情街", recommendation: "街拍氛围", description: "建筑街道与生活感并存。", thumbnailSrc: "/assets/task-gallery-5.png" },
  { value: "黑白影棚", displayLabel: "黑白影棚", title: "黑白影棚", recommendation: "经典棚拍", description: "简洁背景突出人物主体。", thumbnailSrc: "/assets/task-gallery-6.png" },
  { value: "度假-热带植物", displayLabel: "度假-热带植物", title: "度假-热带植物", recommendation: "假日感", description: "适合轻松度假与夏日风格。", thumbnailSrc: "/assets/task-gallery-7.png" },
  { value: "度假-石阶", displayLabel: "度假-石阶", title: "度假-石阶", recommendation: "旅行大片", description: "石阶层次感适合度假穿搭。", thumbnailSrc: "/assets/task-gallery-8.png" },
  { value: "都市夜景", displayLabel: "都市夜景", title: "都市夜景", recommendation: "夜色都市", description: "适合潮流、通勤和城市时尚。", thumbnailSrc: "/assets/task-thumb-1.png" },
  { value: "路灯街拍", displayLabel: "路灯街拍", title: "路灯街拍", recommendation: "街头感", description: "自然路灯适合真实街拍氛围。", thumbnailSrc: "/assets/task-thumb-2.png" },
  { value: "公园草坪", displayLabel: "公园草坪", title: "公园草坪", recommendation: "自然户外", description: "轻松日常与休闲服饰适配。", thumbnailSrc: "/assets/task-gallery-4.png" },
  { value: "建筑前廊", displayLabel: "建筑前廊", title: "建筑前廊", recommendation: "结构背景", description: "适合气质型人物展示。", thumbnailSrc: "/assets/task-gallery-5.png" },
  { value: "梨花树下", displayLabel: "梨花树下", title: "梨花树下", recommendation: "清新氛围", description: "适合春日与浅色系造型。", thumbnailSrc: "/assets/task-gallery-6.png" },
  { value: "樱花街道", displayLabel: "樱花街道", title: "樱花街道", recommendation: "春日街景", description: "适合少女感与轻盈画面。", thumbnailSrc: "/assets/task-gallery-7.png" },
  { value: "肌理墙面", displayLabel: "肌理墙面", title: "肌理墙面", recommendation: "极简背景", description: "墙面纹理增强层次但不抢主体。", thumbnailSrc: "/assets/task-gallery-8.png" },
  { value: "马路街拍", displayLabel: "马路街拍", title: "马路街拍", recommendation: "都市抓拍", description: "适合通勤和潮流服饰。", thumbnailSrc: "/assets/task-thumb-1.png" },
  { value: "店外探店16", displayLabel: "店外探店16", title: "店外探店16", recommendation: "探店氛围", description: "适合生活方式与博主感表达。", thumbnailSrc: "/assets/task-thumb-2.png" },
  { value: "店内探店", displayLabel: "店内探店", title: "店内探店", recommendation: "室内探店", description: "适合体验感与消费场景。", thumbnailSrc: "/assets/task-gallery-4.png" },
  { value: "儿童房", displayLabel: "儿童房", title: "儿童房", recommendation: "家居亲子", description: "适合童装和家庭氛围。", thumbnailSrc: "/assets/task-gallery-5.png" },
  { value: "摄影棚-灰色", displayLabel: "摄影棚-灰色", title: "摄影棚-灰色", recommendation: "干净中性", description: "适合标准商拍与人物主视觉。", thumbnailSrc: "/assets/task-gallery-6.png" },
  { value: "深灰色摄影棚", displayLabel: "深灰色摄影棚", title: "深灰色摄影棚", recommendation: "高级质感", description: "更偏质感和时装风棚拍。", thumbnailSrc: "/assets/task-gallery-7.png" },
  { value: "室内角落", displayLabel: "室内角落", title: "室内角落", recommendation: "居家静物感", description: "适合柔和日常和安静情绪。", thumbnailSrc: "/assets/task-gallery-8.png" },
  { value: "棕色摄影棚", displayLabel: "棕色摄影棚", title: "棕色摄影棚", recommendation: "暖调棚拍", description: "适合复古暖调和秋冬服饰。", thumbnailSrc: "/assets/task-thumb-1.png" }
];
const copyLanguageInputOptions = [
  "无文案",
  "简体中文",
  "繁体中文",
  "英文",
  "中英文混排",
  "俄语",
  "日语",
  "韩语",
  "印地语",
  "德语",
  "法语",
  "西班牙语",
  "葡萄牙语",
  "阿拉伯语",
  "泰语",
  "荷兰语",
  "土耳其语"
];

const supplementAiPolishConfigs: Partial<Record<string, SupplementAiPolishConfig>> = {
  "goods-white": {
    modelLabel: "创客贴AI白底图润色",
    prompt: "优化商品白底图补充描述，强调纯白背景、主体完整、边缘干净、轻阴影、材质真实与多平台统一上架规范。"
  },
  "goods-marketing": {
    modelLabel: "创客贴AI营销主图润色",
    prompt: "优化营销主图细节补充，强调产品卖点、营销氛围、构图和商业质感。"
  },
  "goods-scene": {
    modelLabel: "创客贴AI场景图润色",
    prompt: "优化场景图细节补充，强调场景搭建、氛围、光线、主体展示和代入感。"
  },
  "goods-bg": {
    modelLabel: "创客贴AI换背景润色",
    prompt: "优化换背景补充描述，强调背景融合、真实光影、空间关系与主体协调。"
  },
  "goods-retouch": {
    modelLabel: "创客贴AI精修润色",
    prompt: "优化产品精修补充说明，强调材质、边缘、光感、质感和商业修图效果。"
  },
  "goods-translate": {
    modelLabel: "创客贴AI翻译润色",
    prompt: "优化图片翻译排版说明，强调版式保留、语言层级、信息清晰度和阅读体验。"
  },
  "goods-view": {
    modelLabel: "创客贴AI三视图润色",
    prompt: "优化三视图补充说明，强调视角统一、细节完整、背景干净和展示一致性。"
  },
  "goods-buyer": {
    modelLabel: "创客贴AI买家秀润色",
    prompt: "优化买家秀补充说明，强调真实生活感、主体使用场景、自然氛围和转化感。"
  },
  "goods-detail": {
    modelLabel: "创客贴AI卖点图润色",
    prompt: "优化卖点图补充说明，强调核心卖点、信息层级、对比关系和画面说服力。"
  },
  "goods-sell": {
    modelLabel: "创客贴AI卖点图润色",
    prompt: "优化卖点图补充说明，强调核心卖点、信息层级、对比关系和画面说服力。"
  },
  "goods-spoke": {
    modelLabel: "创客贴AI代言图润色",
    prompt: "优化代言图补充说明，强调人物与产品关系、品牌感、镜头语言和视觉气质。"
  },
  "goods-point": {
    modelLabel: "创客贴AI卖点图润色",
    prompt: "优化卖点图补充说明，强化视觉重点、文案承载和商业表达。"
  },
  "image-expand": {
    modelLabel: "创客贴AI图片扩图润色",
    prompt: "优化图片扩图需求描述，强调延展方向、边界衔接、空间连续性、光影一致性和主体结构稳定性，使扩图结果更自然、完整、可执行。"
  },
  "video-replica": {
    modelLabel: "创客贴AI爆款复刻视频润色",
    prompt: "优化爆款复刻视频描述，强调先提炼参考视频中的爆款镜头逻辑，再结合上传商品多视角图片完成迁移复刻，同时让卖点节奏、商品一致性、镜头真实性和商业成片感更具体、清晰、可执行。"
  },
  "video-replace": {
    modelLabel: "创客贴AI商品替换视频润色",
    prompt: "优化商品替换视频描述，强调保留原视频动作和运镜不变，同时让新商品在多视角一致性、真实结构、光影透视和商业成片稳定性上更具体、清晰、可执行。"
  },
  "model-try": {
    modelLabel: "创客贴AI补充说明润色",
    prompt: "优化试衣补充说明，使描述更具体、清晰、可执行。"
  },
  "model-change": {
    modelLabel: "创客贴AI补充说明润色",
    prompt: "优化换模特补充说明，使描述更具体、清晰、可执行。"
  },
  "model-generate": {
    modelLabel: "创客贴AI补充说明润色",
    prompt: "优化模特生成补充说明，使描述更具体、清晰、可执行。"
  },
  ...Object.fromEntries(
    defaultToolKeys.map((key) => [
      key,
      {
        modelLabel: "创客贴AI补充说明润色",
        prompt: "优化补充说明，使描述更具体、清晰、可执行。"
      }
    ])
  )
};

const advancedAiAssistPromptConfigs: Partial<Record<string, string>> = {
  "goods-white": `你是一位电商商品白底图顾问。目标是为全品类商品提供统一适配的白底主图能力，优先覆盖 ${goodsWhiteUniversalPresetConfig.platforms.join("、")}。请先判断商品是否已经出现明确的平台线索：若能明确识别，则仅回填对应“平台信息”字段；若无法从商品图判断具体平台，请优先回填“${goodsWhiteUniversalPlatformLabel}”，表示采用跨平台统一白底图规范。回填时不要编造其他字段，不要输出额外解释。`,
  "goods-marketing": `你是一位电商营销主图策划师。请根据商品图片与商品线索，分别判断并回填：产品类型、场景背景、平台信息、商品信息、视觉风格、营销元素、文案语种。必须只从当前字段可选项中选择最匹配的值；无法确认时优先回填“智能识别 / 智能生成 / 自动匹配 / 无 / 无文案”等空语义选项。`,
  "goods-retouch": `你是一位商品精修顾问。请根据商品图片判断更适合的平台信息与目标市场，仅回填当前高级设置中的平台信息、目标市场字段；不要补充无关内容。若判断不出则留空。`,
  "goods-scene": `你是一位电商场景图策划师。请根据商品图片线索，回填：产品类型、场景类型、产品展示、排版呈现、氛围营造、价值导向、目标市场、文案语种。所有字段必须贴合当前商品，不确定时选择最通用或最弱承诺的选项，不要生成字段外内容。`,
  "goods-bg": `你是一位电商换背景策划师。请根据商品图片与主体特征，回填背景类型、风格与光影两个字段。若主体更适合白底、电商展台、居家、户外、广告风等，请选择最贴近的选项；不要填无关字段。`,
  "goods-view": `你是一位商品多视角展示顾问。请根据商品图片判断其平台信息对应的展示规范，仅回填“平台信息”字段；若无法识别则回填“无平台信息”。`,
  "goods-translate": `你是一位跨境电商图片翻译顾问。请根据商品图片与已有视觉线索，回填平台信息，并在需要时为非预置的平台规范触发细节补充；不要默认带出语种或其他无关字段。`,
  "goods-buyer": `你是一位买家秀策划师。请根据商品图片，回填产品类型、产品状态、呈现方式、场景氛围、产品真实感、环境真实感、拍摄真实感、目标市场。仅从当前字段选项中挑选最符合真实买家秀气质的值；回填 productType 后，需基于 productTypeToCategoryMap 推导 productCategory，并优先匹配对应品类规则与字段扩展，不要输出字段外内容。`,
  "goods-detail": `你是一位商品细节图策划师。请根据商品图片，回填产品类型与展示形式，帮助细节图更明确地表达材质、结构或局部功能。`,
  "goods-sell": `你是一位商品卖点图策划师。请根据商品图片，回填产品类型、场景类型、文案语种、核心卖点、表现形式、卖点重心、主副标题、副标题、字体风格、元素辅助、目标市场。必须让每个字段服务于“卖点表达”而不是泛化描述。`,
  "goods-spoke": `你是一位电商代言图策划师。请根据商品图片，回填产品类型、互动方式、人物特点、场景背景、排版方式、人种肤色、性别风格、年龄特点、展示重点、目标市场。所有字段要服务于“人物代言商品”的广告表达。`,
  "goods-point": `你是一位商品卖点视觉顾问。请根据商品图片识别适用平台并提炼主要卖点方向，只回填当前支持的高级设置字段。`
};

const supplementPlaceholderOverrides: Partial<Record<string, string>> = {
  "goods-detail": "请输入您对图片的细节补充描述，例如：色调、构图、氛围等。",
  "model-try": "请输入模特试穿细节补充，例如：希望突出上身效果、面料垂感、搭配氛围或人物状态。",
  "video-replace": "请输入视频描述，例如：保留原视频全部动作和镜头节奏，将原商品替换为上传商品，重点突出瓶身高光、标签清晰和开箱拿取时的真实手部接触。"
};

function normalizeUploadClueText(items: UploadItem[]) {
  return items
    .map((item) => `${item.name ?? ""} ${item.src ?? ""}`)
    .join(" ")
    .toLowerCase();
}

function inferOptionByKeywords(
  sourceText: string,
  rules: Array<{ option: string; keywords: RegExp[] }>,
  fallback: string
) {
  const matchedRule = rules.find((rule) => rule.keywords.some((keyword) => keyword.test(sourceText)));
  return matchedRule?.option ?? fallback;
}

function inferProductType(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "蓝牙耳机", keywords: [/耳机|earbud|headphone|earphone/] },
      { option: "手机", keywords: [/手机|phone|iphone|android/] },
      { option: "行李箱", keywords: [/行李箱|拉杆箱|suitcase|luggage/] },
      { option: "背包", keywords: [/背包|双肩包|backpack|bag/] },
      { option: "鞋子", keywords: [/鞋|sneaker|boot|heel/] },
      { option: "T恤", keywords: [/t恤|tee\b|t-shirt/] },
      { option: "服装", keywords: [/服装|穿搭|上衣|裤|裙|外套|dress|fashion|apparel/] },
      { option: "瑜伽服", keywords: [/瑜伽|legging|sports bra/] },
      { option: "健身器材", keywords: [/健身|哑铃|跑步机|fitness/] },
      { option: "化妆品", keywords: [/护肤|面霜|精华|口红|cosmetic|skincare|beauty/] },
      { option: "香水", keywords: [/香水|perfume|fragrance/] },
      { option: "饮料", keywords: [/饮料|咖啡|奶茶|苏打|juice|drink|beverage/] },
      { option: "水果", keywords: [/水果|苹果|橙|柠檬|fruit/] },
      { option: "笔记本电脑", keywords: [/笔记本|电脑|laptop|notebook/] },
      { option: "电视", keywords: [/电视|tv|monitor/] },
      { option: "沙发", keywords: [/沙发|sofa/] },
      { option: "吊灯", keywords: [/吊灯|灯具|lamp|light/] },
      { option: "汽车", keywords: [/汽车|car|auto/] },
      { option: "机械设备", keywords: [/机械|设备|machine|industrial/] },
      { option: "项链", keywords: [/项链|necklace|jewelry/] },
      { option: "玩具", keywords: [/玩具|toy/] },
      { option: "手办", keywords: [/手办|figure|collectible/] },
      { option: "文具", keywords: [/文具|笔|notebook|stationery/] },
      { option: "小家电", keywords: [/小家电|电器|吹风机|剃须刀|appliance/] }
    ],
    "智能识别"
  );
}

function inferBackgroundType(sourceText: string, fallback = "智能生成") {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "无背景", keywords: [/白底|抠图|纯白|无背景|isolated|cutout/] },
      { option: "简单背景", keywords: [/简单背景|浅色背景|投影|shadow/] },
      { option: "产品场景", keywords: [/场景|客厅|卧室|桌面|户外|室内|海报|kv|banner|scene|lifestyle/] },
      { option: "纯色背景", keywords: [/纯色背景|solid background/] },
      { option: "纯色渐变", keywords: [/渐变|gradient/] },
      { option: "图片边框", keywords: [/边框|frame|border/] }
    ],
    fallback
  );
}

function inferBackgroundSceneType(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "电商白底", keywords: [/白底|纯白|抠图|无背景|isolated|cutout/] },
      { option: "实景室内", keywords: [/室内|家居|客厅|卧室|桌面|室内场景|indoor|interior/] },
      { option: "室外场景", keywords: [/室外|户外|自然|街景|草地|花园|outdoor|nature/] },
      { option: "商业广告风", keywords: [/广告|海报|kv|banner|大片|商业|campaign|hero/] }
    ],
    "电商白底"
  );
}

function inferBackgroundLightingStyle(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "写实自然光", keywords: [/自然光|日光|窗光|realistic|daylight|natural light/] },
      { option: "柔光棚拍风", keywords: [/棚拍|柔光|影棚|softbox|studio/] },
      { option: "日系清新光", keywords: [/日系|清新|明亮|airy|fresh/] },
      { option: "高级杂志风", keywords: [/杂志|高级|轻奢|editorial|premium|luxury/] },
      { option: "人造光氛围", keywords: [/霓虹|氛围光|人造光|彩光|cinematic|ambient/] }
    ],
    "写实自然光"
  );
}

function inferPlatformInfo(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "淘宝", keywords: [/淘宝|taobao/] },
      { option: "天猫", keywords: [/天猫|tmall/] },
      { option: "京东", keywords: [/京东|jd/] },
      { option: "拼多多", keywords: [/拼多多|pdd/] },
      { option: "1688", keywords: [/1688/] },
      { option: "抖音电商", keywords: [/抖音|douyin|tiktok china/] },
      { option: "快手电商", keywords: [/快手|kuaishou/] },
      { option: "小红书电商", keywords: [/小红书|xiaohongshu|rednote/] },
      { option: "亚马逊", keywords: [/亚马逊|amazon/] },
      { option: "Temu", keywords: [/temu/] },
      { option: "TikTok Shop", keywords: [/tiktok shop/] },
      { option: "阿里国际站", keywords: [/阿里国际站|alibaba international/] },
      { option: "速卖通", keywords: [/速卖通|aliexpress/] },
      { option: "Shopee", keywords: [/shopee/] },
      { option: "OZON", keywords: [/ozon/] },
      { option: "SHEIN", keywords: [/shein/] }
    ],
    "无平台信息"
  );
}

function inferProductInfo(sourceText: string) {
  if (/(¥|\$|折扣|促销|优惠|满减|立减|sale|off)/.test(sourceText) && /(卖点|亮点|详情|特写|feature|benefit)/.test(sourceText)) {
    return "名称+卖点+价格+促销";
  }
  if (/(¥|\$|折扣|促销|优惠|满减|立减|sale|off)/.test(sourceText)) {
    return "价格与促销";
  }
  if (/(卖点|亮点|详情|特写|feature|benefit|主图)/.test(sourceText)) {
    return "名称+卖点";
  }
  return "智能生成";
}

function inferVisualStyle(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "轻奢高端", keywords: [/香水|珠宝|高端|奢华|premium|luxury/] },
      { option: "时尚潮流", keywords: [/潮流|时尚|fashion|street/] },
      { option: "年轻元气", keywords: [/年轻|元气|玩具|零食|活力|youth/] },
      { option: "专业信任", keywords: [/专业|医疗|设备|办公|business|industrial/] },
      { option: "强营销", keywords: [/促销|活动|sale|promo|直播|大促/] },
      { option: "吸睛爆点", keywords: [/爆款|吸睛|冲击|banner|kv/] },
      { option: "极简简约", keywords: [/极简|简约|minimal|clean/] }
    ],
    "自动匹配"
  );
}

function inferMarketingElement(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "买一送一", keywords: [/买一送一|buy 1 get 1|bogo/] },
      { option: "满减活动", keywords: [/满减|立减|满\d|减\d|discount/] },
      { option: "顺丰速达", keywords: [/顺丰/] },
      { option: "京东自营", keywords: [/京东自营/] },
      { option: "本地仓", keywords: [/本地仓|local warehouse/] },
      { option: "双十一促销", keywords: [/双十一|11\.11|double 11/] },
      { option: "折扣标识", keywords: [/折扣|促销|sale|coupon|off/] }
    ],
    "无"
  );
}

function inferCopyLanguage(sourceText: string, sceneMode = false) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: sceneMode ? "英语" : "英文", keywords: [/\benglish\b|英文|amazon|temu|tiktok shop|shopee/] },
      { option: "简体中文", keywords: [/中文|简体|淘宝|天猫|京东|抖音|快手|小红书/] },
      { option: "繁体中文", keywords: [/繁体|台湾|hong kong/] },
      { option: sceneMode ? "英语" : "中英文混排", keywords: [/双语|中英|bilingual/] },
      { option: "日语", keywords: [/日语|japanese|jp\b/] },
      { option: "韩语", keywords: [/韩语|korean|kr\b/] },
      { option: "俄语", keywords: [/俄语|russian|ru\b/] },
      { option: "法语", keywords: [/法语|french|fr\b/] },
      { option: "德语", keywords: [/德语|german|de\b/] },
      { option: "西班牙语", keywords: [/西班牙语|spanish|es\b/] },
      { option: "葡萄牙语", keywords: [/葡萄牙语|portuguese|pt\b/] },
      { option: "阿拉伯语", keywords: [/阿拉伯语|arabic|ar\b/] },
      { option: "泰语", keywords: [/泰语|thai|th\b/] },
      { option: "荷兰语", keywords: [/荷兰语|dutch|nl\b/] },
      { option: "土耳其语", keywords: [/土耳其语|turkish|tr\b/] },
      { option: "印地语", keywords: [/印地语|hindi|hi\b/] }
    ],
    sceneMode ? "无需文案" : "无文案"
  );
}

function safeParseJson<T>(value?: string, fallback?: T): T | undefined {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getSetPackDefaultRatio(platformLabel?: string) {
  return setPackPlatformDefaultRatios[platformLabel ?? ""] ?? "1:1";
}

function isSetPackLikeTool(toolKey: string) {
  return toolKey === "set-main" || toolKey === "set-aplus" || toolKey === "set-fashion";
}

function getSetPackSelectedTypes(selectionMap: AdvancedSelectionMap = {}) {
  return safeParseJson<SetPackTypeItem[]>(selectionMap.setPackSelectedTypes, []) ?? [];
}

function getSetPackSelectedStyleCards(selectionMap: AdvancedSelectionMap = {}) {
  const styleCards = safeParseJson<SetPackStyleCard[]>(selectionMap.setPackStyleCards, []) ?? [];
  const selectedIds = (selectionMap.setPackSelectedStyleIds ?? "").split(",").filter(Boolean);
  if (!selectedIds.length) return [];
  return styleCards.filter((item) => selectedIds.includes(item.id));
}

function parseVideoPrintExtendRatioList(value?: string) {
  const parsed = safeParseJson<string[]>(value, []);
  if (Array.isArray(parsed)) {
    return parsed.filter((item) => typeof item === "string" && item.includes(":")).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function gcd(a: number, b: number): number {
  let left = Math.abs(Math.round(a));
  let right = Math.abs(Math.round(b));
  while (right) {
    const temp = left % right;
    left = right;
    right = temp;
  }
  return left || 1;
}

function normalizeVideoPrintExtendRatio(width: string, height: string) {
  const parsedWidth = Number(width);
  const parsedHeight = Number(height);
  if (!Number.isFinite(parsedWidth) || !Number.isFinite(parsedHeight) || parsedWidth <= 0 || parsedHeight <= 0) {
    return "";
  }
  const normalizedWidth = Math.round(parsedWidth);
  const normalizedHeight = Math.round(parsedHeight);
  const divisor = gcd(normalizedWidth, normalizedHeight);
  return `${normalizedWidth / divisor}:${normalizedHeight / divisor}`;
}

function getVideoPrintExtendSelectedRatios(selectionMap: AdvancedSelectionMap = {}) {
  return parseVideoPrintExtendRatioList(selectionMap.videoPrintExtendSelectedRatios);
}

function createSetPackTypeItem(template: SetPackTypeTemplate, selectionMap: AdvancedSelectionMap = {}, overrides?: Partial<SetPackTypeItem>): SetPackTypeItem {
  const productName = selectionMap.setPackProductName || "商品";
  const sellingPoints = splitMultilineValues(selectionMap.setPackSellingPoints).slice(0, 3).join("、") || "核心卖点";
  const visualStyle = selectionMap.setPackVisualStyle || "高级质感风";
  const scenario = selectionMap.setPackScenario || "目标平台场景";
  const selectedStyleCards = getSetPackSelectedStyleCards(selectionMap);
  const styleNames = selectedStyleCards.map((item) => item.name).join("、") || visualStyle;
  const styleKeywords = selectedStyleCards.flatMap((item) => item.keywordHints).slice(0, 4).join("、");

  return {
    id: overrides?.id ?? `${template.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: overrides?.category ?? template.category,
    name: overrides?.name ?? `${productName}${template.category}展示`,
    description: overrides?.description ?? template.description,
    tag: overrides?.tag ?? template.tag,
    prompt:
      overrides?.prompt ??
      `${template.promptHint}；商品为${productName}，重点突出${sellingPoints}；整体视觉风格参考${styleNames}，适配${scenario}表达，避免杂乱背景和低质文案排版${styleKeywords ? `，可强化${styleKeywords}相关视觉线索` : ""}。`,
    ratio: overrides?.ratio ?? template.defaultRatio,
    resolution: overrides?.resolution ?? template.defaultResolution,
    count: overrides?.count ?? 1
  };
}

function buildSetPackTypeRecommendations(selectionMap: AdvancedSelectionMap = {}, notes = "", perTypeCount = 1) {
  const keywordText = [selectionMap.setPackSellingPoints, selectionMap.setPackScenario, selectionMap.setPackAudience, notes].filter(Boolean).join(" ").toLowerCase();
  const selectedStyleCards = getSetPackSelectedStyleCards(selectionMap);
  const styleKeywordText = selectedStyleCards
    .flatMap((item) => [item.name, item.description, ...item.keywordHints])
    .join(" ")
    .toLowerCase();
  const isWearable = /(服饰|穿搭|上身|鞋|包|饰品|珠宝|香水|口红|美妆)/.test(keywordText);
  const prefersTech = /(科技|tech|性能|速度|霓光|对比)/.test(styleKeywordText);
  const prefersLifestyle = /(生活|温暖|日常|居家|氛围)/.test(styleKeywordText);
  const prefersClean = /(合规|白底|干净|净透)/.test(styleKeywordText);
  const baseIds = prefersTech ? ["hero-visual", "multi-angle", "core-selling", "detail-closeup"] : ["white-bg", "multi-angle", "core-selling", "detail-closeup"];
  const sceneId = isWearable ? "wearing-scene" : "scene-lifestyle";
  const extraIds = /(礼盒|送礼|包装)/.test(keywordText)
    ? ["packaging"]
    : /(参数|尺寸|规格)/.test(keywordText) || prefersClean
      ? ["parameter"]
      : /(活动|促销|折扣)/.test(keywordText)
        ? ["poster"]
        : prefersTech
          ? ["comparison"]
          : prefersLifestyle
            ? ["buyer-show"]
            : ["comparison"];
  const orderedIds = [...baseIds, sceneId, ...extraIds];
  const uniqueTemplates = orderedIds
    .map((id) => setPackTypeLibrary.find((item) => item.id === id))
    .filter((item): item is SetPackTypeTemplate => Boolean(item));
  return uniqueTemplates.map((item) => createSetPackTypeItem(item, selectionMap, { count: perTypeCount }));
}

function buildPresetSetPackTemplateLibrary(selectionMap: AdvancedSelectionMap = {}, perTypeCount = 1): SetPackTypeSavedTemplate[] {
  const buildTypes = (templateIds: string[]) =>
    templateIds
      .map((id) => setPackTypeLibrary.find((item) => item.id === id))
      .filter((item): item is SetPackTypeTemplate => Boolean(item))
      .map((item) => createSetPackTypeItem(item, selectionMap, { count: perTypeCount }));

  return [
    {
      id: "preset-template-basic-launch",
      name: "基础上架模板",
      types: buildTypes(["white-bg", "multi-angle", "core-selling", "detail-closeup"])
    },
    {
      id: "preset-template-scene-convert",
      name: "场景转化模板",
      types: buildTypes(["amazon-main", "scene-lifestyle", "hero-visual", "comparison"])
    },
    {
      id: "preset-template-brand-detail",
      name: "品牌质感模板",
      types: buildTypes(["white-bg", "detail-closeup", "design", "packaging"])
    }
  ];
}

function syncSetPackTypeItemWithGlobalSettings(item: SetPackTypeItem, ratio: string, count: number): SetPackTypeItem {
  const nextRatio = ratio || item.ratio;
  const nextCount = Math.max(1, count || item.count || 1);
  if (item.ratio === nextRatio && (item.count ?? nextCount) === nextCount) {
    return item;
  }
  return {
    ...item,
    ratio: nextRatio,
    count: nextCount
  };
}

function buildAplusPlanSignature(payload: GeneratePayload) {
  return JSON.stringify({
    uploads: payload.sourceUploads.map((item) => item.id || item.src || item.name || "").filter(Boolean),
    advancedSelections: payload.advancedSelections,
    supplementValue: payload.supplementValue,
    modeId: payload.creationModeSelection?.modeId ?? "",
    ratio: payload.creationModeSelection?.ratio ?? "",
    resolution: payload.creationModeSelection?.resolution ?? ""
  });
}

function buildFashionSceneSignature(payload: GeneratePayload) {
  return JSON.stringify({
    uploads: payload.sourceUploads.map((item) => item.id || item.src || item.name || "").filter(Boolean),
    baselineModelSource: payload.advancedSelections.baselineModelSource ?? "",
    selectedModelId: payload.advancedSelections.selectedModelId ?? "",
    modelGenerateType: payload.advancedSelections.modelGenerateType ?? "",
    gender: payload.advancedSelections.gender ?? "",
    appearance: payload.advancedSelections.appearance ?? "",
    age: payload.advancedSelections.age ?? "",
    persona: payload.advancedSelections.persona ?? "",
    bodyType: payload.advancedSelections.bodyType ?? "",
    supplementValue: payload.supplementValue
  });
}

function buildAplusPlanSummary(selectionMap: AdvancedSelectionMap = {}) {
  const productName = selectionMap.setPackProductName || "当前商品";
  const sellingPoints = splitMultilineValues(selectionMap.setPackSellingPoints).join(" / ") || "待补充商品卖点";
  const concerns = selectionMap.setPackParameters || "用户最关心材质、功能、规格与使用体验";
  const visualFocus = selectionMap.setPackScenario || "围绕核心卖点搭建有节奏的详情模块";
  return [
    `产品：${productName}`,
    `卖点：${sellingPoints}`,
    `顾虑：${concerns}`,
    `视觉重心：${visualFocus}`
  ];
}

function buildAplusPlanModules(selectionMap: AdvancedSelectionMap = {}) {
  const selectedTypes = getSetPackSelectedTypes(selectionMap);
  const productName = selectionMap.setPackProductName || "商品";
  const sellingPointLines = splitMultilineValues(selectionMap.setPackSellingPoints);
  const primarySellingPoint = sellingPointLines[0] || "核心卖点";
  const secondarySellingPoint = sellingPointLines[1] || "补充优势";
  const market = selectionMap.targetMarket || selectionMap.region || "目标市场";
  const language = selectionMap.copyLanguage || selectionMap.language || "英文";
  const visualStyle = selectionMap.setPackVisualStyle || "高级质感风";
  const scenario = selectionMap.setPackScenario || "真实使用场景";

  return selectedTypes.map((item, index) => {
    const template = aplusModuleLibrary.find((module) => module.category === item.category);
    const emphasis =
      index === 0
        ? `突出${productName}整体气质与${primarySellingPoint}`
        : index === 1
          ? `清晰传达${primarySellingPoint}与${secondarySellingPoint}`
          : `延展${productName}在${scenario}下的价值表达`;
    return {
      id: item.id,
      category: item.category,
      headline: `${item.category}：${template?.description ?? emphasis}`,
      lines: [
        `主标题：围绕“${primarySellingPoint}”设置简洁标题，语种使用${language}，顶部或左上排版。`,
        `模块重点：${emphasis}，并兼顾${market}用户对${productName}的阅读习惯。`,
        `视觉建议：沿用${visualStyle}，保持留白、分区清晰和图文节奏统一。`
      ]
    } satisfies AplusPlanModule;
  });
}

function buildFashionSceneSummary(selectionMap: AdvancedSelectionMap = {}, uploadCount = 0) {
  const modelSource = selectionMap.baselineModelSource === "mine" ? "我的模特" : "AI生成";
  const modelDescriptor =
    modelSource === "我的模特"
      ? selectionMap.selectedModelName || "未选择模特"
      : [selectionMap.gender, selectionMap.age, selectionMap.appearance, selectionMap.persona, selectionMap.bodyType].filter(Boolean).join(" / ") || "未完善模特参数";
  const outfitFocus = inferProductType(selectionMap.setPackProductName || "");

  return [
    `服装图：已上传${uploadCount}张服装图片`,
    `基准模特：${modelSource}`,
    `模特信息：${modelDescriptor}`,
    `推荐重点：围绕${outfitFocus === "智能识别" ? "服饰版型、上身效果与场景氛围" : `${outfitFocus}上身效果与穿搭氛围`}生成推荐场景`
  ];
}

function buildFashionSceneModules(selectionMap: AdvancedSelectionMap = {}) {
  const persona = selectionMap.persona || "时尚通勤人群";
  const appearance = selectionMap.appearance || "亚洲人";
  const age = selectionMap.age || "青年";
  const bodyType = selectionMap.bodyType || "标准";
  const gender = selectionMap.gender || "女";
  const modelSource = selectionMap.baselineModelSource === "mine" ? "已选模特" : "AI基准模特";
  const modelName = selectionMap.selectedModelName || `${appearance}${gender}模特`;
  const sceneBase = [
    {
      id: "fashion-scene-hero",
      category: "首图上身展示",
      headline: "首图上身展示：突出服装版型与整体气质",
      lines: [
        `画面主体：以${modelSource}${selectionMap.baselineModelSource === "mine" ? `“${modelName}”` : ""}进行正面全身展示，突出服装廓形与上身比例。`,
        `模特设定：${appearance} / ${age} / ${persona} / ${bodyType}，保持${gender === "男" ? "利落挺拔" : "自然舒展"}体态。`,
        "场景建议：背景干净、光线明亮，适合作为服饰套图首图或平台封面。"
      ]
    },
    {
      id: "fashion-scene-commute",
      category: "通勤街拍场景",
      headline: "通勤街拍场景：强化真实穿搭代入感",
      lines: [
        `画面主体：模特自然行走或驻足，展示服装在真实${persona}场景中的穿搭状态。`,
        "构图建议：中景到全身构图，保留环境层次但不过度抢主体。",
        "视觉建议：以都市街区、写字楼外立面或商业街为背景，形成高转化穿搭氛围。"
      ]
    },
    {
      id: "fashion-scene-detail",
      category: "面料细节特写",
      headline: "面料细节特写：放大材质与做工亮点",
      lines: [
        "画面主体：聚焦领口、袖口、面料纹理、走线或特殊设计点。",
        "构图建议：半身或局部近景，模特姿态辅助展示垂坠感与材质表现。",
        "视觉建议：通过柔和侧光增强面料层次，适合作为细节说明场景。"
      ]
    },
    {
      id: "fashion-scene-motion",
      category: "动态动作场景",
      headline: "动态动作场景：突出服装动态与廓形变化",
      lines: [
        "画面主体：通过转身、抬手、迈步等动作展示服装动态效果。",
        "构图建议：保留身体动作延展，重点观察裙摆、裤型、外套下摆等运动状态。",
        "视觉建议：背景简洁，快门感清晰，体现服饰灵动性与真实穿着效果。"
      ]
    },
    {
      id: "fashion-scene-half",
      category: "半身近景场景",
      headline: "半身近景场景：兼顾表情与上半身搭配",
      lines: [
        "画面主体：突出肩颈线条、上装轮廓、配饰搭配与人物神态。",
        "构图建议：半身或胸像视角，适合展示上衣、外套、针织等重点品类。",
        "视觉建议：通过人物表情和局部动作增强种草感，适合详情页或社媒封面。"
      ]
    },
    {
      id: "fashion-scene-lifestyle",
      category: "生活方式氛围图",
      headline: "生活方式氛围图：构建完整穿搭故事感",
      lines: [
        `画面主体：围绕${persona}日常活动设计有故事性的生活方式场景。`,
        "构图建议：把服装与空间道具、姿态互动结合，形成情绪化氛围表达。",
        "视觉建议：适合咖啡馆、居家、展厅或户外休闲等场景，用于补强品牌调性。"
      ]
    }
  ];

  return sceneBase;
}

function buildFashionSceneTypes(modules: AplusPlanModule[]) {
  return modules.map((module, index) => ({
    id: module.id,
    category: module.category,
    name: module.category,
    description: module.headline,
    tag: "服饰场景",
    prompt: module.lines.join(" "),
    ratio: "3:4",
    resolution: "1K",
    count: 1,
    sortOrder: index + 1
  })) satisfies SetPackTypeItem[];
}

function buildVideoReplicaPrompt(context: VideoReplacePromptContext) {
  const buildAudioStrategyForPrompt = (selectedSound: VideoReplicaSoundOption) => {
    switch (selectedSound) {
      case "参考原视频声音":
        return "最终声音策略：参考原视频声音。优先保留原视频的环境声组织、BGM 情绪方向、口播或字幕节奏，以及声音与镜头动作的配合关系；仅迁移声音表达方法，不复制原视频具体品牌词、字幕原文或侵权音频内容。";
      case "智能匹配声音":
        return "最终声音策略：智能匹配声音。可参考原视频的节奏组织，但不复用原视频具体声音方案；需根据商品品类、镜头结构、节奏强弱和卖点推进，自动匹配更合适的 BGM、环境声和字幕或口播节奏。";
      case "无声":
      default:
        return "最终声音策略：无声。仅参考原视频的视觉节奏组织，不生成口播、人声、环境声、拟音或背景音乐内容。";
    }
  };

  const sourceCount = context.sourceUploads.length;
  const videoName = context.videoUploads?.[0]?.name || "参考视频";
  const modeLabel = context.creationModeSelection?.modeLabel ?? "普通模式";
  const ratio = context.creationModeSelection?.ratio ?? "竖9:16";
  const resolution = context.creationModeSelection?.resolution ?? "480p";
  const duration = context.advancedSelections.videoReplicaDuration ?? "10s";
  const sound = normalizeVideoReplicaSoundOption(context.advancedSelections.videoReplicaHasSound);
  const audioStrategyForPrompt = buildAudioStrategyForPrompt(sound);
  const userDescription = context.supplementValue.trim();

  const promptLines = [
    "你是一位电商爆款视频复刻导演、镜头拆解策划师与商品一致性审核专家。",
    `请基于用户上传的 1 条参考视频《${videoName}》和 ${sourceCount} 张同一商品的多视角参考图，执行“爆款复刻”任务。`,
    "任务目标：先提取参考视频中的爆款表达逻辑，再将该逻辑迁移到用户商品上，生成一条新的商品视频。",
    "执行顺序要求：",
    "1. 先理解参考视频：拆解镜头顺序、景别变化、机位关系、运镜节奏、主体动作、转场方式、卖点推进路径、氛围风格和成交感来源。",
    "2. 再理解商品图片：以用户上传的 1~5 张同一商品多视角图为唯一商品依据，识别商品的颜色、材质、结构、比例、纹理、功能点、品牌元素和适合重点展示的局部细节。",
    "3. 最后完成复刻：保留参考视频中值得复用的爆款逻辑、镜头语言和节奏组织，但将画面主体、卖点表达和特写内容替换为用户商品。",
    "参考视频提词要求：",
    "1. 从参考视频中提炼可迁移的提示词维度，包括：开场方式、主体亮相方式、核心卖点镜头、细节特写、对比/演示动作、人物互动、场景氛围、节奏强弱、结尾收束方式。",
    "2. 提取的是“视频表达方法”而不是照抄参考商品本身，不要继承参考商品的品牌、文字、包装信息、品类专属结构或不可迁移元素。",
    "3. 若参考视频存在夸张特效、虚假功效暗示、不可复用文案或与用户商品冲突的镜头元素，应只保留其节奏与表现方法，不直接照搬。",
    "商品一致性要求：",
    "1. 新视频中的商品必须严格依据用户上传图片，保持同一商品在所有镜头中的颜色、材质、结构、比例、纹理、配件和细节一致。",
    "2. 必须根据不同镜头调用匹配的商品视角，避免正侧背关系错乱、局部特写与整体结构不一致、细节凭空生成或缺失。",
    "3. 商品与人物、手部、道具、桌面、包装或环境接触时，需保证透视、受力、遮挡、阴影、高光和反射自然可信。",
    "4. 不得将用户商品改造成其他品类，不得凭空增加原图不存在的卖点结构、按钮、接口、材质效果或品牌信息。",
    "复刻边界要求：",
    "1. 可以复刻参考视频的爆款逻辑、节奏、镜头编排、情绪风格和卖点推进方式。",
    "2. 不可以直接复制参考视频中与原商品强绑定的品牌内容、包装信息、字幕文案、Logo、特定人物身份或侵权元素。",
    "3. 若用户补充描述与参考视频冲突，以“保留爆款逻辑但服务于用户商品真实表达”为最高原则进行重写。",
    "成片质量要求：",
    "1. 输出应保持真实商业广告片观感，避免闪烁、结构漂移、局部变形、边缘融化、贴图跳动、帧间不一致和明显 AI 感。",
    "2. 商品主体必须清晰可辨，卖点镜头需要服务转化，不要只做空泛炫技镜头或脱离商品本身的无效视觉包装。",
    "3. 若参考视频有字幕、贴纸、屏幕字或包装字样，复刻时仅保留其信息组织方式，不直接沿用原文字内容。",
    "4. 在复刻参考视频爆款感的前提下，进一步强化商业成片质感、镜头衔接稳定性和平台可投放感。",
    "5. 更严格约束商品在跨镜头中的颜色、结构、材质、品牌元素和局部细节一致性，避免忽大忽小、忽清忽糊或结构漂移。",
    "6. 更严格控制人物动作、手部接触、遮挡恢复、反光高光、阴影透视和环境反射，让商品与场景关系更可信。",
    "7. 更强调对参考视频节奏、转场逻辑、情绪氛围、景别变化和卖点推进顺序的高保真复刻。",
    "8. 输出结果需兼顾爆款氛围、真实商品表达和后续广告投放可用性。",
    audioStrategyForPrompt,
    `生成模式：${modeLabel}；视频时长：${duration}；目标比例：${ratio}；目标分辨率：${resolution}；音频要求：${sound}。`,
    userDescription
      ? `用户补充创作要求：${userDescription}。请将其吸收到最终复刻方案中，但不得破坏“参考视频逻辑可迁移、用户商品真实一致、成片稳定可用”这三条硬约束。`
      : "用户未补充额外视频描述。默认按“先提炼参考视频爆款逻辑，再迁移到用户商品，确保真实一致和商业稳定”执行。",
    "最终只输出一条完成爆款逻辑迁移的新商品视频。"
  ];

  return promptLines.join("\n");
}

function buildVideoReplicaPromptSummary(context: VideoReplacePromptContext) {
  const parts = [
    "参考视频 1 条",
    `商品图 ${context.sourceUploads.length} 张`,
    context.creationModeSelection?.modeLabel ?? "普通模式",
    context.creationModeSelection?.ratio ?? "竖9:16",
    context.creationModeSelection?.resolution ?? "480p"
  ];
  if (context.advancedSelections.videoReplicaDuration) {
    parts.push(context.advancedSelections.videoReplicaDuration);
  }
  return parts.join(" / ");
}

function buildVideoReplacePrompt(context: VideoReplacePromptContext) {
  const buildAudioStrategyForPrompt = (selectedSound: VideoReplaceSoundOption) => {
    switch (selectedSound) {
      case "使用原视频声音":
        return "最终声音策略：使用原视频声音。优先保留原视频的环境声组织、BGM 情绪方向、口播或字幕节奏，以及声音与镜头动作的配合关系；仅保留声音表达方法，不复制原视频具体品牌词、字幕原文或侵权音频内容。";
      case "智能匹配声音":
        return "最终声音策略：智能匹配声音。可不复用原视频具体声音方案，而是根据替换后商品的品类、镜头结构、动作节奏和卖点推进，自动匹配更合适的 BGM、环境声和字幕或口播节奏。";
      case "无声":
      default:
        return "最终声音策略：无声。不输出口播、人声、环境声、拟音或背景音乐，仅保留原视频在视觉层面的动作节奏和镜头推进关系。";
    }
  };

  const sourceCount = context.sourceUploads.length;
  const videoName = context.videoUploads?.[0]?.name || "参考视频";
  const modeLabel = context.creationModeSelection?.modeLabel ?? "普通模式";
  const ratio = context.creationModeSelection?.ratio ?? "竖9:16";
  const resolution = context.creationModeSelection?.resolution ?? "480p";
  const duration = context.advancedSelections.videoReplicaDuration ?? "10s";
  const sound = normalizeVideoReplaceSoundOption(context.advancedSelections.videoReplicaHasSound);
  const audioStrategyForPrompt = buildAudioStrategyForPrompt(sound);
  const userDescription = context.supplementValue.trim();

  const promptLines = [
    "你是一位商品替换视频生成导演与电商商品一致性审核专家。",
    `请基于用户上传的 1 条参考视频《${videoName}》和 ${sourceCount} 张同一商品的多视角参考图，执行“商品替换”任务。`,
    "目标：将原视频中的原商品替换为用户上传的新商品，并生成一条新的电商视频。",
    "镜头与动作要求：严格保留参考视频中的镜头顺序、机位关系、运镜节奏、主体动作、交互逻辑、场景空间关系与叙事结构，不得擅自改写脚本。",
    "商品一致性要求：",
    "1. 新商品必须以用户上传的多视角图片为唯一商品依据，保持同一商品在颜色、材质、结构、纹理、比例、品牌元素与细节上的一致性。",
    "2. 如果参考图包含正面、侧面、背面、俯视、局部特写等信息，需在不同镜头中正确调用对应视角，避免视角跳变、结构错乱、细节丢失。",
    "3. 替换后商品尺寸、透视、受力、遮挡、高光、反射、阴影和接触关系必须与原场景真实匹配。",
    "4. 不得替换为其他品类，不得凭空增删商品组件，不得改变商品核心卖点和真实外观。",
    "视频质量要求：",
    "1. 输出应保持商业级真实感，避免闪烁、抖动、漂移、穿帮、边缘融化、贴图错位、结构重影和帧间不一致。",
    "2. 人手持握、人物穿戴、桌面摆放、液体接触、开合按压等交互场景，需要保证商品与人物/环境接触自然。",
    "3. 若参考视频存在文字、Logo、包装、标签或屏幕内容，替换时需尽量与新商品信息协调，避免明显冲突。",
    "4. 更严格约束跨镜头商品一致性，尤其是近景、特写、转场和遮挡恢复后的细节连续性。",
    "5. 更严格控制商品边缘融合、透明材质、金属反光、高光过渡、阴影衔接和环境反射的真实性。",
    "6. 更严格控制人与商品、商品与道具、商品与台面的接触可信度，避免悬浮感、穿插错误和受力异常。",
    "7. 更严格抑制帧间闪烁、结构漂移、局部变形、贴图跳动和颜色忽明忽暗。",
    "8. 在保证原视频节奏不变的前提下，让最终成片达到更强的商业广告质感与可投放质量。",
    audioStrategyForPrompt,
    `生成模式：${modeLabel}；视频时长：${duration}；目标比例：${ratio}；目标分辨率：${resolution}；音频要求：${sound}。`,
    userDescription
      ? `用户补充创作要求：${userDescription}。在不破坏“动作和运镜不变、商品真实一致”的前提下，优先满足这些补充要求。`
      : "用户未补充额外视频描述。默认按“动作和运镜不变、商品真实一致、商业观感稳定”执行。",
    "最终只输出一条完成商品替换的新视频。"
  ];

  return promptLines.join("\n");
}

function buildVideoReplacePromptSummary(context: VideoReplacePromptContext) {
  const parts = [
    "参考视频 1 条",
    `商品图 ${context.sourceUploads.length} 张`,
    context.creationModeSelection?.modeLabel ?? "普通模式",
    context.creationModeSelection?.ratio ?? "竖9:16",
    context.creationModeSelection?.resolution ?? "480p"
  ];
  if (context.advancedSelections.videoReplicaDuration) {
    parts.push(context.advancedSelections.videoReplicaDuration);
  }
  return parts.join(" / ");
}

const imageExpandSystemPrompt = `你是一位电商图片扩图专家。你的任务是基于用户上传的原图，在保持主体结构、材质、颜色、透视和商业质感稳定的前提下，对画面边界进行自然延展。

请严格遵守以下要求：
1. 原图主体不得被改坏、拉伸、重绘走样或替换。
2. 扩展区域必须与原图在光线方向、阴影强弱、透视关系、景深和色温上保持连续。
3. 若用户明确描述扩展方向、场景元素或留白用途，优先满足该要求。
4. 若用户未明确描述，默认做“保守扩图”：
   - 优先补全背景与环境
   - 保持主体居中或当前构图重心不变
   - 不新增喧宾夺主的大元素
5. 若原图是商品图，扩展结果必须继续服务商品展示，不要把画面做成无关海报或超现实插画。
6. 若用户上传参考图，仅将其作为扩展方向和氛围参考，不直接照搬主体内容。

输出目标：
- 扩展区域自然完整
- 边缘无明显拼接痕迹
- 主体边界稳定
- 适合电商视觉继续编辑或投放`;

const imageExpandNegativeConstraints = [
  "- 不要改坏原图主体，不要拉伸、截断、重绘走样或替换主体",
  "- 不要出现边缘断裂、拼接痕迹、重复纹理、镜像复制或背景补丁感",
  "- 不要出现透视错误、空间关系矛盾、地平线错位或建筑结构变形",
  "- 不要出现光线方向冲突、阴影错误、高光漂移、色温跳变或明暗断层",
  "- 不要新增与原图无关的大型主体、人物、动物、文字、水印、Logo 或装饰物",
  "- 不要出现明显 AI 伪影、局部模糊、结构漂移、材质错乱、边缘融化或清晰度不一致"
];

function buildImageExpandReferencePrompt(referenceUploads: UploadItem[]) {
  if (!referenceUploads.length) {
    return "若无额外参考，请基于原图已有场景语义做保守延展。";
  }

  return `请参考上传的 ${referenceUploads.length} 张参考图的场景氛围、空间走向、材质风格或装饰元素，但必须保持原商品主体和原图视觉逻辑不变。`;
}

function buildImageExpandModePrompt(context: ImageExpandPromptContext) {
  const modeId = context.creationModeSelection?.modeId ?? "normal";
  const modeLabel = context.creationModeSelection?.modeLabel ?? "普通模式";
  const resolution = context.creationModeSelection?.resolution;
  const modeInstruction =
    modeId === "advanced"
      ? "在保证主体稳定的基础上，增强场景延展完整度、空间层次、光影过渡和细节真实性，适合更复杂的背景补全与商业级扩图。"
      : "以稳定自然扩展为优先，优先补齐背景、留白与环境边缘，不主动增加复杂新元素。";

  const parts = [modeLabel, modeInstruction];
  if (resolution) {
    parts.push(`输出分辨率目标：${resolution}`);
  }
  return parts.join("；");
}

function buildImageExpandUserPrompt(context: ImageExpandPromptContext) {
  const userDescription = context.supplementValue.trim() || "未填写额外扩图需求，请按保守扩图策略执行。";
  const referencePrompt = buildImageExpandReferencePrompt(context.referenceUploads ?? []);
  const modePrompt = buildImageExpandModePrompt(context);

  return [
    "请基于上传原图进行图片扩图。",
    "",
    "用户需求描述：",
    userDescription,
    "",
    "参考图要求：",
    referencePrompt,
    "",
    "创作模式：",
    modePrompt,
    "",
    "通用约束：",
    "- 保持原图主体结构、材质、颜色和比例稳定",
    "- 扩展区域与原图边缘自然衔接",
    "- 保持透视、空间关系、光影和清晰度连续",
    "- 不新增与商品无关的主体",
    "- 不制造明显AI感、拼接感或边缘断裂",
    "",
    "通用负向约束：",
    ...imageExpandNegativeConstraints
  ].join("\n");
}

function buildImageExpandPrompt(context: ImageExpandPromptContext) {
  return [imageExpandSystemPrompt, "", buildImageExpandUserPrompt(context)].join("\n\n");
}

function buildImageExpandPromptSummary(context: ImageExpandPromptContext) {
  const parts = [
    `原图 ${context.sourceUploads.length} 张`,
    context.referenceUploads?.length ? `参考图 ${context.referenceUploads.length} 张` : "无参考图",
    context.creationModeSelection?.modeLabel ?? "普通模式"
  ];
  if (context.creationModeSelection?.resolution) {
    parts.push(context.creationModeSelection.resolution);
  }
  return parts.join(" / ");
}

function getDefaultCreationModeSelection(configKey: string, count: number): CreationModeSelection | null {
  const config = creationModeConfigs[configKey];
  const defaultMode = config?.modes[0];
  if (!defaultMode) return null;
  const defaultRatio = defaultMode.defaultRatio ?? defaultMode.ratioOptions[0] ?? "1:1";
  const defaultResolution = defaultMode.defaultResolution ?? defaultMode.resolutionOptions?.[0];
  const unitCreditCost = defaultResolution
    ? defaultMode.resolutionUnitCreditCosts?.[defaultResolution] ?? defaultMode.baseUnitCreditCost ?? 0
    : defaultMode.baseUnitCreditCost ?? 0;
  return {
    modeId: defaultMode.id,
    modeLabel: defaultMode.label,
    ratio: defaultRatio,
    resolution: defaultResolution,
    count,
    unitCreditCost
  };
}

function buildSetPackTypeThinking(selectionMap: AdvancedSelectionMap = {}, notes = "", uploadCount = 0) {
  const productName = selectionMap.setPackProductName || "未识别商品";
  const sellingPoint = splitMultilineValues(selectionMap.setPackSellingPoints).join("；") || "未填写核心卖点";
  const audience = selectionMap.setPackAudience || "泛人群";
  const scenario = selectionMap.setPackScenario || "待补充场景";
  const visualStyle = selectionMap.setPackVisualStyle || "未指定风格";
  const selectedStyleCards = getSetPackSelectedStyleCards(selectionMap);
  const selectedStyleText = selectedStyleCards.map((item) => item.name).join("、") || "未选择风格卡";
  return [
    `商品图：已上传${uploadCount}张商品图`,
    `核心卖点：1.产品名称：${productName}`,
    `2.核心卖点：${sellingPoint}`,
    `3.适用人群：${audience}`,
    `4.期望场景：${scenario}`,
    `5.视觉风格：${visualStyle}`,
    `6.高级设置风格：${selectedStyleText}${notes ? `；补充需求：${notes}` : ""}`
  ].join("\n");
}

function buildSetPackTypeAnalysisNarrative(
  types: SetPackTypeItem[],
  selectionMap: AdvancedSelectionMap = {},
  notes = "",
  uploadCount = 0
) {
  const productName = selectionMap.setPackProductName || "当前商品";
  const market = selectionMap.targetMarket || selectionMap.region || "目标市场";
  const copyLanguage = selectionMap.copyLanguage || selectionMap.language || "默认语种";
  const visualStyle = selectionMap.setPackVisualStyle || "高级质感风";
  const audience = selectionMap.setPackAudience || "泛人群";
  const scenario = selectionMap.setPackScenario || "核心使用场景";

  const typeSummary = types
    .map((item, index) => `${index + 1}. ${item.category}：${item.name}`)
    .join("\n");

  return [
    `已基于${uploadCount}张商品图、商品卖点与补充需求完成分析。`,
    `商品：${productName}；目标市场：${market}；文案语种：${copyLanguage}；受众：${audience}。`,
    `本次优先围绕${scenario}与${visualStyle}视觉表达生成${types.length}个出图类型，兼顾平台首图、卖点说明、细节特写与场景氛围。`,
    notes ? `补充需求已纳入分析：${notes}` : "未额外补充需求，已按默认商品表达策略生成。",
    "",
    typeSummary
  ].join("\n");
}

function serializeSetPackTypePlan(types: SetPackTypeItem[]) {
  return JSON.stringify(
    types.map((item) => ({
      cateName: item.category,
      name: item.name,
      prompt: item.prompt,
      imgRatio: item.ratio
    })),
    null,
    2
  );
}

function splitMultilineValues(value?: string) {
  return (value ?? "")
    .split(/\n|；|;|、/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSetPackSellingPointDraft(
  uploads: UploadItem[],
  platformLabel: string,
  languageLabel: string
): SetPackSellingPointDraft {
  const sourceText = normalizeUploadClueText(uploads);
  const productType = inferProductType(sourceText);
  const localizedPlatform = platformLabel || "目标平台";
  const localizedLanguage = languageLabel || "目标语种";
  const productName = productType === "通用商品" ? "商品主视觉" : productType;
  const audience =
    inferOptionByKeywords(
      sourceText,
      [
        { option: "都市白领 / 通勤人群", keywords: [/通勤|办公|商务|portable|office/] },
        { option: "年轻潮流消费人群", keywords: [/潮流|时尚|youth|trend|street/] },
        { option: "家庭日常使用人群", keywords: [/家居|家庭|居家|kitchen|daily/] },
        { option: "跨境平台冲动型购买人群", keywords: [/amazon|temu|tiktok shop|aliexpress|shopee/] }
      ],
      "泛电商消费人群"
    );
  const scenario =
    inferOptionByKeywords(
      sourceText,
      [
        { option: "平台主图 + 对比卖点图 + 生活方式场景图", keywords: [/场景|lifestyle|户外|室内|居家/] },
        { option: "主图合规展示 + 细节拆解 + 参数说明图", keywords: [/细节|参数|detail|feature|benefit/] },
        { option: "短视频封面感主图 + 卖点强化图 + 转化说明图", keywords: [/tiktok|douyin|种草|短视频|封面/] }
      ],
      "平台主图 + 卖点图 + 场景图组合"
    );
  const sellingPoints = [
    `${productName}主体识别清晰，适合做${localizedPlatform}首图展示`,
    "核心功能点可拆成 3-5 张卖点图，便于快速传达购买理由",
    "适合加入生活化或使用中场景，增强转化氛围",
    `文案建议统一为${localizedLanguage}，保证平台上架体验一致`
  ].join("\n");
  const parameters = [
    "建议输出 7 张成套图片",
    `优先适配 ${localizedPlatform} 常用比例 ${getSetPackDefaultRatio(platformLabel)}`,
    "保留干净留白，便于补充标题、参数、促销标签"
  ].join("\n");

  return {
    productName,
    sellingPoints,
    audience,
    scenario,
    parameters
  };
}

function formatSetPackDetailText(draft: SetPackSellingPointDraft) {
  return [
    draft.productName ? `1. 产品名称：${draft.productName}` : "",
    draft.sellingPoints ? `2. 核心卖点：${draft.sellingPoints}` : "",
    draft.audience ? `3. 适用人群：${draft.audience}` : "",
    draft.scenario ? `4. 期望场景：${draft.scenario}` : "",
    draft.parameters ? `5. 具体参数：${draft.parameters}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSetPackStyleRecommendations(selectionMap: AdvancedSelectionMap) {
  const platform = selectionMap.platform ?? "";
  const sourceText = normalizeUploadClueText(
    [selectionMap.setPackProductName, selectionMap.setPackSellingPoints, selectionMap.setPackScenario, selectionMap.setPackAudience]
      .filter(Boolean)
      .map((text, index) => ({ id: `set-pack-${index}`, name: text, sizeMb: 0, status: "ready" as const }))
  );

  return [...setPackStyleLibrary]
    .sort((left, right) => {
      const leftScore =
        (left.platformTags.includes(platform) ? 2 : 0) +
        left.keywordHints.filter((keyword) => sourceText.includes(keyword.toLowerCase())).length;
      const rightScore =
        (right.platformTags.includes(platform) ? 2 : 0) +
        right.keywordHints.filter((keyword) => sourceText.includes(keyword.toLowerCase())).length;
      return rightScore - leftScore;
    })
    .slice(0, 5);
}

function buildSetPackTitleRecommendations(selectionMap: AdvancedSelectionMap) {
  const platform = selectionMap.platform ?? "跨境平台";
  const region = selectionMap.region ?? "";
  const language = selectionMap.language ?? "简体中文";
  const productName = selectionMap.setPackProductName || "商品";
  const sellingPoints = splitMultilineValues(selectionMap.setPackSellingPoints);
  const corePoints = sellingPoints.slice(0, 3);

  if (language === "英语" || language === "英文") {
    return [
      `${productName} for ${platform} | ${corePoints.join(" | ") || "Hero Image Set"}`,
      `${productName} ${region ? `for ${region}` : ""} ${corePoints[0] ? `- ${corePoints[0]}` : "- Platform Ready Listing Visuals"}`.trim(),
      `${productName} Listing Image Pack | ${corePoints[1] ?? "Detail Highlights"} | ${corePoints[2] ?? "Lifestyle Scene"}`
    ];
  }

  return [
    `${productName}${region ? ` ${region}` : ""} ${platform}上架套图 | ${corePoints[0] ?? "主图合规"} | ${corePoints[1] ?? "卖点更清晰"}`,
    `${productName} 爆款套图方案 | ${corePoints[0] ?? "平台主图"} + ${corePoints[1] ?? "细节卖点"} + ${corePoints[2] ?? "场景转化"}`,
    `${platform} ${productName} 图包标题建议 | ${corePoints[0] ?? "视觉统一"} | ${corePoints[1] ?? "信息更完整"}`
  ];
}

function getDefaultMoreTitleDraftRows() {
  return [
    {
      id: "row-1",
      productName: "蓝牙耳机",
      brand: "CKT",
      category: "家电数码类",
      sellingPoints: "主动降噪；佩戴舒适；长续航",
      specs: "蓝牙5.4；40小时续航；Type-C快充",
      originalTitle: "蓝牙耳机",
      imageSrc: "/assets/task-thumb-1.png",
      imageLabel: "蓝牙耳机"
    },
    {
      id: "row-2",
      productName: "纯棉短袖T恤",
      brand: "CKT",
      category: "服饰类",
      sellingPoints: "柔软透气；宽松版型；日常百搭",
      specs: "100%棉；夏季；男女同款",
      originalTitle: "纯棉T恤",
      imageSrc: "/assets/task-gallery-6.png",
      imageLabel: "纯棉短袖T恤"
    },
    {
      id: "row-3",
      productName: "收纳整理箱",
      brand: "CKT HOME",
      category: "家居百货类",
      sellingPoints: "大容量；可叠放；开盖便捷取物",
      specs: "带滑轮；PP材质；多尺寸可选",
      originalTitle: "收纳箱",
      imageSrc: "/assets/task-gallery-5.png",
      imageLabel: "收纳整理箱"
    }
  ] satisfies MoreTitleDraftRow[];
}

function parseMoreTitleDraftRows(value?: string) {
  const rows = safeParseJson<MoreTitleDraftRow[]>(value, []);
  if (!rows?.length) {
    return getDefaultMoreTitleDraftRows();
  }
  return rows.map((row, index) => ({
    id: row.id || `row-${index + 1}`,
    productName: row.productName ?? "",
    brand: row.brand ?? "",
    category: row.category ?? "",
    sellingPoints: row.sellingPoints ?? "",
    specs: row.specs ?? "",
    originalTitle: row.originalTitle ?? "",
    imageSrc: row.imageSrc ?? "",
    imageLabel: row.imageLabel ?? row.productName ?? ""
  }));
}

function parseMoreTitleGeneratedRows(value?: string) {
  return safeParseJson<MoreTitleGeneratedRow[]>(value, []) ?? [];
}

function splitTitleKeywords(value?: string) {
  return (value ?? "")
    .split(/\n|；|;|、|\/|\||,|，/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getMoreTitleLengthLimit(platform: string, lengthPreference: string) {
  const baseLimit =
    {
      "淘宝": 60,
      "天猫": 60,
      "京东": 60,
      "拼多多": 60,
      "1688": 60,
      "抖音电商": 55,
      "快手电商": 55,
      "小红书电商": 50,
      "亚马逊": 200,
      "Temu": 120,
      "TikTok Shop": 120,
      "阿里国际站": 128,
      "速卖通": 128,
      "Shopee": 120,
      "OZON": 100,
      "SHEIN": 100
    }[platform] ?? 80;

  if (lengthPreference === "短标题优先") {
    return Math.max(28, Math.floor(baseLimit * 0.72));
  }
  if (lengthPreference === "尽量写满") {
    return baseLimit;
  }
  return Math.min(baseLimit, platform === "亚马逊" ? 160 : baseLimit);
}

function normalizeTitleToken(token: string) {
  return token
    .replace(/[|｜]/g, " ")
    .replace(/[“”"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeTitleTokens(tokens: string[]) {
  const seen = new Set<string>();
  return tokens.filter((token) => {
    const normalized = normalizeTitleToken(token).toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function fitTitleToLimit(tokens: string[], limit: number) {
  const nextTokens = [...tokens];
  let title = dedupeTitleTokens(nextTokens).join(" ").replace(/\s+/g, " ").trim();
  while (title.length > limit && nextTokens.length > 1) {
    nextTokens.pop();
    title = dedupeTitleTokens(nextTokens).join(" ").replace(/\s+/g, " ").trim();
  }
  return title.slice(0, limit).trim();
}

function buildMoreTitleCandidates(selectionMap: AdvancedSelectionMap, row: MoreTitleDraftRow) {
  const platform = selectionMap.platform ?? "目标平台";
  const keywordStrategy = selectionMap.moreTitleKeywordStrategy ?? "核心词前置";
  const lengthPreference = selectionMap.moreTitleLengthPreference ?? "平台自动";
  const mustInclude = splitTitleKeywords(selectionMap.moreTitleMustInclude);
  const bannedTerms = splitTitleKeywords(selectionMap.moreTitleBannedTerms);
  const sellingPoints = splitTitleKeywords(row.sellingPoints);
  const specs = splitTitleKeywords(row.specs);
  const lengthLimit = getMoreTitleLengthLimit(platform, lengthPreference);

  const baseTokens =
    keywordStrategy === "属性优先"
      ? [row.brand, row.productName, ...specs, row.category]
      : keywordStrategy === "场景优先"
        ? [row.brand, row.productName, ...sellingPoints, ...specs, row.category]
        : [row.brand, row.productName, row.category, ...sellingPoints, ...specs];

  const candidateTokens: Array<{ label: string; note: string; tokens: string[] }> = [
    {
      label: "平台稳妥版",
      note: "优先保证标题结构稳定、平台可读和基础属性完整。",
      tokens: [row.brand, row.productName, row.category, specs[0], sellingPoints[0], ...mustInclude]
    },
    {
      label: "搜索覆盖版",
      note: "尽量扩大关键词覆盖，适合搜索流量型平台。",
      tokens: [...baseTokens, ...mustInclude]
    },
    {
      label: "转化卖点版",
      note: "优先把核心利益点放到前半段，适合点击转化。",
      tokens: [row.brand, row.productName, sellingPoints[0], sellingPoints[1], specs[0], specs[1], row.category, ...mustInclude]
    }
  ];

  return candidateTokens.map((candidate) => {
    const title = fitTitleToLimit(
      candidate.tokens.map((token) => normalizeTitleToken(token)).filter(Boolean),
      lengthLimit
    );
    const hitKeywords = dedupeTitleTokens([...sellingPoints, ...specs, ...mustInclude]).filter((keyword) =>
      title.toLowerCase().includes(normalizeTitleToken(keyword).toLowerCase())
    );
    const riskMessages: string[] = [];
    if (!row.productName.trim()) riskMessages.push("缺少商品名");
    if (title.length >= Math.max(1, lengthLimit - 4)) riskMessages.push("标题接近平台长度上限");
    const hitBanned = bannedTerms.filter((term) => title.includes(term));
    if (hitBanned.length) riskMessages.push(`含禁用词：${hitBanned.join("、")}`);
    return {
      label: candidate.label,
      title,
      charCount: title.length,
      keywords: hitKeywords.slice(0, 6),
      risk: riskMessages[0] ?? "低风险",
      note: candidate.note
    } satisfies MoreTitleCandidate;
  });
}

function buildMoreTitleGeneratedRows(selectionMap: AdvancedSelectionMap) {
  const rows = parseMoreTitleDraftRows(selectionMap.moreTitleDraftRows).filter((row) =>
    [row.productName, row.brand, row.category, row.sellingPoints, row.specs, row.originalTitle].some((value) => value.trim())
  );
  const selectedStyles = parseMultiSelectValue(selectionMap.moreTitleOutputStyles).filter((style) => moreTitleStyleOptions.includes(style));
  const activeStyles = selectedStyles.length ? selectedStyles : moreTitleStyleOptions;

  return rows.map((row) => {
    const candidates = buildMoreTitleCandidates(selectionMap, row).filter((candidate) => activeStyles.includes(candidate.label));
    const selectedCandidateIndex = 0;
    return {
      ...row,
      candidates,
      selectedCandidateIndex,
      finalTitle: candidates[selectedCandidateIndex]?.title ?? row.originalTitle.trim()
    } satisfies MoreTitleGeneratedRow;
  });
}

function inferSceneProductDisplay(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "套装组合", keywords: [/组合|礼盒|set|bundle/] },
      { option: "模特手持", keywords: [/模特|手持|person|model/] },
      { option: "使用中展示", keywords: [/使用中|lifestyle|scene|佩戴|wearing/] },
      { option: "局部细节", keywords: [/细节|特写|detail|close-up/] },
      { option: "悬浮陈列", keywords: [/悬浮|floating/] },
      { option: "多角度展示", keywords: [/多角度|多视角|angle/] }
    ],
    "单品特写"
  );
}

function inferSceneLayoutStyle(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "左右分栏", keywords: [/横幅|banner|左右|split/] },
      { option: "满版铺陈", keywords: [/kv|海报|满版|full bleed/] },
      { option: "留白极简", keywords: [/极简|留白|minimal/] },
      { option: "杂志感排版", keywords: [/杂志|editorial/] },
      { option: "电商主图风", keywords: [/主图|电商|e-commerce/] }
    ],
    "居中构图"
  );
}

function inferSceneMoodStyle(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "清新明亮", keywords: [/明亮|清新|bright/] },
      { option: "温暖治愈", keywords: [/温暖|暖色|golden|warm/] },
      { option: "高级冷淡", keywords: [/冷调|高级|cool|minimal luxury/] },
      { option: "轻奢质感", keywords: [/轻奢|luxury|premium/] },
      { option: "梦幻浪漫", keywords: [/梦幻|浪漫|romantic/] },
      { option: "节日热卖", keywords: [/节日|促销|大促|sale/] },
      { option: "科技未来", keywords: [/科技|未来|futuristic/] }
    ],
    "清新明亮"
  );
}

function inferSceneValueFocus(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "突出价格优势", keywords: [/价格|低价|折扣|coupon/] },
      { option: "突出礼赠属性", keywords: [/礼盒|送礼|gift/] },
      { option: "突出实用性", keywords: [/实用|功能|日用|practical/] },
      { option: "突出品牌感", keywords: [/品牌|brand|premium/] },
      { option: "突出品质", keywords: [/品质|材质|texture|quality/] }
    ],
    "突出卖点"
  );
}

function inferTargetMarket(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "欧美市场", keywords: [/amazon|temu|欧美|english|europe|us\b/] },
      { option: "日韩市场", keywords: [/日本|韩国|jp\b|kr\b|japanese|korean/] },
      { option: "东南亚市场", keywords: [/shopee|东南亚|sea\b|thai|malay|vietnam/] },
      { option: "中东市场", keywords: [/中东|arabic/] },
      { option: "全球通用", keywords: [/global|国际站|alibaba international/] }
    ],
    "国内电商"
  );
}

function inferRegionalTargetMarket(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "北美", keywords: [/美国|加拿大|north america|us\b|usa|canada/] },
      { option: "欧洲", keywords: [/欧洲|europe|eu\b/] },
      { option: "英国", keywords: [/英国|uk\b|britain/] },
      { option: "德国", keywords: [/德国|germany|de\b/] },
      { option: "法国", keywords: [/法国|france|fr\b/] },
      { option: "俄罗斯", keywords: [/俄罗斯|russia|ru\b/] },
      { option: "日本", keywords: [/日本|japan|jp\b/] },
      { option: "韩国", keywords: [/韩国|korea|kr\b/] },
      { option: "东南亚", keywords: [/东南亚|sea\b|shopee|lazada|泰国|马来|越南|印尼/] },
      { option: "印度", keywords: [/印度|india|in\b/] },
      { option: "中东阿拉伯", keywords: [/中东|arab|阿拉伯|uae|dubai|saudi/] },
      { option: "南美", keywords: [/南美|latin|brazil|mexico/] },
      { option: "澳洲", keywords: [/澳洲|australia|au\b/] },
      { option: "中国台湾", keywords: [/台湾|taiwan/] },
      { option: "港澳", keywords: [/香港|澳门|hong kong|macao/] }
    ],
    "大陆"
  );
}

const goodsBuyerCategoryRules: PromptCategoryRule[] = [
  {
    label: "服饰类",
    aliases: ["服装", "T恤", "瑜伽服", "卫衣", "裙子", "外套", "裤子"],
    prompt: "场景重点体现上身、穿搭或面料状态，保持版型、垂感、纹理和颜色真实。",
    focusPoints: ["版型", "垂感", "面料纹理", "真实颜色"]
  },
  {
    label: "鞋靴类",
    aliases: ["鞋子", "运动鞋", "靴子", "皮鞋", "凉鞋", "拖鞋"],
    prompt: "场景重点体现穿着、落地、行走或陈列状态，保持鞋型、鞋底结构和材质真实。",
    focusPoints: ["鞋型", "鞋底结构", "成对关系", "材质真实"]
  },
  {
    label: "箱包类",
    aliases: ["背包", "行李箱", "手提包", "斜挎包", "旅行箱"],
    prompt: "场景重点体现通勤、出行、手提或肩背状态，保持包体立体结构、肩带受力和五金细节可信。",
    focusPoints: ["包体结构", "肩带受力", "五金细节", "开合逻辑"]
  },
  {
    label: "珠宝饰品类",
    aliases: ["项链", "耳环", "戒指", "手链", "手镯", "吊坠"],
    prompt: "场景重点体现佩戴氛围与细节高光，保留金属、宝石等材质反光和细节。",
    focusPoints: ["金属反光", "宝石细节", "佩戴氛围", "精致感"]
  },
  {
    label: "美妆个护类",
    aliases: ["化妆品", "香水", "护肤", "口红", "精华"],
    prompt: "场景重点体现梳妆台或护肤使用语境，包装结构、瓶身反光和质地状态应真实自然。",
    focusPoints: ["包装结构", "瓶身反光", "质地状态", "使用语境"]
  },
  {
    label: "食品饮料类",
    aliases: ["水果", "饮料", "食品", "咖啡", "奶茶"],
    prompt: "场景重点体现可食用可饮用的真实语境，不夸大功效，不让非售卖配料主导画面。",
    focusPoints: ["可食用语境", "包装可读", "成分真实", "主体优先"]
  },
  {
    label: "家居百货类",
    aliases: ["文具", "健身器材", "收纳", "日用"],
    prompt: "场景重点体现居家使用关系和实用价值，保持结构功能和配件完整。",
    focusPoints: ["功能关系", "配件完整", "空间比例", "实用价值"]
  },
  {
    label: "家电数码类",
    aliases: ["小家电", "电视", "蓝牙耳机", "手机", "笔记本电脑"],
    prompt: "场景重点体现真实使用界面、按键、接口或佩戴状态，避免过度特效遮挡结构。",
    focusPoints: ["接口结构", "按键细节", "屏幕/指示状态", "佩戴或摆放逻辑"]
  },
  {
    label: "家具大件类",
    aliases: ["沙发", "吊灯", "家具"],
    prompt: "场景重点体现真实空间尺度和搭配关系，透视必须正确，尺寸比例不得失真。",
    focusPoints: ["空间尺度", "透视关系", "结构比例", "摆放逻辑"]
  },
  {
    label: "母婴玩具类",
    aliases: ["玩具", "手办"],
    prompt: "场景重点体现安全、亲和、真实日常的互动或陈列，组件完整，不渲染危险姿态。",
    focusPoints: ["安全感", "组件完整", "互动真实", "亲和氛围"]
  },
  {
    label: "汽配五金类",
    aliases: ["汽车", "机械设备", "集装箱"],
    prompt: "场景重点体现安装、维修或工况关系，孔位、连接和结构逻辑必须正确。",
    focusPoints: ["工况关系", "孔位结构", "连接逻辑", "材质真实"]
  },
  {
    label: "通用品类",
    aliases: ["智能识别"],
    prompt: "优先保持商品主体真实、结构准确和用途明确，场景仅作辅助，不以强风格化背景替代商品信息。",
    focusPoints: ["主体真实", "结构准确", "用途明确", "背景克制"]
  }
];

const goodsBuyerPlatformRules: Record<string, PromptPlatformRule> = {
  "全平台通用（16平台）": {
    ruleLevel: "A",
    prompt: "买家秀图应以真实生活感为核心，商品主体清晰可辨，不做夸张商业特效，不制造误导性使用场景。",
    required: ["真实感", "商品可识别", "场景与用途一致"],
    forbidden: ["虚假功效演绎", "不实对比", "过度修图导致商品失真", "违规水印/联系方式"]
  }
};

const goodsBuyerOptionValueExpansions: PromptOptionExpansionMap = {
  platformInfo: {
    fieldKey: "platformInfo",
    name: "平台信息",
    values: Object.fromEntries(
      platformInfoInputOptions.map((option) => [
        option,
        {
          valuePrompt:
            option === "无平台信息"
              ? "未指定平台时按跨平台保守买家秀规则执行：主体清晰、真实可信、避免过度风格化。"
              : `按${option}平台语境优化买家秀表达，保持真实生活感、主体识别优先和合规展示边界。`
        }
      ])
    )
  },
  productState: {
    fieldKey: "productState",
    name: "产品状态",
    values: {
      完整快递箱: { valuePrompt: "表现开箱前真实状态，包装完整但不强调物流文案噪声。" },
      产品与配件自然陈列: { valuePrompt: "产品与配件陈列应自然可信，不摆拍过度整齐商业感。" },
      新品未拆封: { valuePrompt: "保持新品完整感与封装逻辑，不出现违和拆封痕迹。" },
      产品自然摆放场景: { valuePrompt: "以自然摆放体现真实使用语义，避免强海报化构图。" },
      安装场景: { valuePrompt: "展示安装中或安装后的真实关系，结构连接逻辑正确。" },
      穿戴状态: { valuePrompt: "体现真实穿戴效果与轮廓关系，避免夸张体型修饰。" },
      长期使用状态: { valuePrompt: "允许轻微使用痕迹，但主体和关键卖点仍需清晰可辨。" },
      使用状态: { valuePrompt: "体现真实使用过程，允许轻微动态痕迹但主体清晰。" }
    }
  },
  presentationStyle: {
    fieldKey: "presentationStyle",
    name: "呈现方式",
    values: {
      主体展示: { valuePrompt: "主体作为画面核心焦点，构图清晰直观，背景仅辅助表达。" },
      细节局部拍摄: { valuePrompt: "局部特写需有明确焦点，同时保留对商品整体的可识别关联。" },
      自然摆放: { valuePrompt: "通过自然摆放表现生活感，避免道具和布局喧宾夺主。" },
      穿戴拍摄: { valuePrompt: "强调真实穿戴关系与体感，保持比例、面料与轮廓可信。" },
      "对镜子自拍": { valuePrompt: "保留自拍视角真实感，但镜面反射不应遮挡主体。" },
      使用中拍摄: { valuePrompt: "突出使用瞬间与动作语义，关键结构与卖点区域清晰可读。" },
      日常物品大小对比: { valuePrompt: "使用合理参照物表达尺寸感，避免误导性比例对比。" },
      手持拍摄: { valuePrompt: "体现手持抓拍感，主体仍需处于视觉中心。" }
    }
  },
  sceneAtmosphere: {
    fieldKey: "sceneAtmosphere",
    name: "场景氛围",
    values: {
      无场景: { valuePrompt: "背景保持简洁低干扰，优先突出主体轮廓与商品识别。" },
      居家场景: { valuePrompt: "生活化居家环境，光线自然，避免棚拍感过重。" },
      局部或模糊场景: { valuePrompt: "场景可弱化或虚化，但主体边界和关键细节必须可辨。" },
      车内场景: { valuePrompt: "车内元素仅作语义辅助，不遮挡商品，不制造危险驾驶暗示。" },
      移动运动场景: { valuePrompt: "允许轻微动感表达，但需控制模糊度，主体识别优先。" },
      日常外出场景: { valuePrompt: "体现日常通勤/出行语境，画面真实自然。" }
      ,
      节日场景: { valuePrompt: "节日元素点到为止，强调商品与真实生活关系，不做促销堆叠。" }
    }
  },
  productReality: {
    fieldKey: "productReality",
    name: "产品真实感",
    values: {
      包装与产品褶皱: { valuePrompt: "保留轻微自然褶皱和接触痕迹，不做塑料感抹平。" },
      长期使用磨损: { valuePrompt: "磨损表现需克制且合理，不影响商品关键结构识别。" },
      使用中的真实: { valuePrompt: "保留使用语义和轻微痕迹，保证主体完整度与可信度。" }
    }
  },
  environmentReality: {
    fieldKey: "environmentReality",
    name: "环境真实感",
    values: {
      杂乱环境: { valuePrompt: "允许受控杂乱感，但必须确保主体边界清楚、阅读路径清晰。" },
      宠物偶然入镜: { valuePrompt: "宠物仅作陪衬，不能遮挡主体或误导售卖范围。" },
      人物局部入镜: { valuePrompt: "局部人物入镜应自然，避免人物抢占主体视觉中心。" },
      临时摆放随意感: { valuePrompt: "保留随意摆放生活感，同时维持商品信息完整可读。" },
      人物素颜: { valuePrompt: "人物肤质保持自然真实，避免重磨皮和失真修饰。" },
      人物日常穿搭: { valuePrompt: "穿搭应生活化并服务商品表达，不喧宾夺主。" }
    }
  },
  shotReality: {
    fieldKey: "shotReality",
    name: "拍摄真实感",
    values: {
      随手拍摄无美感: { valuePrompt: "保留随手拍真实感，但不牺牲主体识别和关键信息可读性。" },
      较低像素: { valuePrompt: "允许轻微颗粒感，主体轮廓与卖点细节仍需可辨。" },
      手抖模糊: { valuePrompt: "仅允许轻度动态模糊，禁止整体糊片和结构漂移。" },
      反光逆光: { valuePrompt: "可保留逆光氛围，但禁止主体关键区域过曝或死黑。" },
      对镜自拍: { valuePrompt: "保留镜像自拍语义，镜面高光与遮挡关系要自然。" },
      手持自拍: { valuePrompt: "强调真实手持自拍视角，主体保持稳定可辨识。" }
    }
  },
  targetMarket: {
    fieldKey: "targetMarket",
    name: "目标市场",
    values: {
      大陆: { valuePrompt: "表达偏生活化直观，强调真实体验和转化效率。" },
      北美: { valuePrompt: "表达偏简洁直接，强调功能可信和使用体验。" },
      韩国: { valuePrompt: "表达偏清爽审美与质感统一，画面克制干净。" },
      日本: { valuePrompt: "表达偏克制有秩序，强调细节与生活感平衡。" },
      俄罗斯: { valuePrompt: "表达强调主体完整和质感可信，避免过度修饰。" },
      中东阿拉伯: { valuePrompt: "表达注重完整度与质感，避免不合语境元素。" },
      港澳: { valuePrompt: "表达偏精致简洁，保证主体清晰和信息效率。" },
      中国台湾: { valuePrompt: "表达偏生活感和清新审美并重，避免硬广化。" },
      土耳其: { valuePrompt: "表达偏真实与色彩平衡，避免过度滤镜与高饱和失真。" },
      南美: { valuePrompt: "表达可适度活力，但主体识别与真实度优先。" },
      澳洲: { valuePrompt: "表达偏自然光与生活场景，保持干净可信。" },
      东南亚: { valuePrompt: "表达偏明快直观和高识别，避免复杂背景干扰。" },
      印度: { valuePrompt: "表达强调真实使用语义和信息可读性。" },
      非洲: { valuePrompt: "表达注重主体完整、材质真实和用途清晰。" },
      英国: { valuePrompt: "表达偏克制与实用，强调真实可信和结构清楚。" },
      德国: { valuePrompt: "表达偏理性清晰，强调结构逻辑与品质感。" },
      法国: { valuePrompt: "表达兼顾审美与真实，避免过度商业化堆叠。" },
      欧洲: { valuePrompt: "表达偏简洁质感，主体清晰和体验可信并重。" },
      东欧: { valuePrompt: "表达注重真实可读和商品完整展示。"}
    }
  }
};

function normalizeGoodsBuyerCategoryByAliases(productType?: string) {
  const normalized = (productType ?? "").trim().toLowerCase();
  if (!normalized) return "通用品类";
  const matched = goodsBuyerCategoryRules.find((rule) => rule.aliases.some((alias) => normalized.includes(alias.toLowerCase())));
  return matched?.label ?? "通用品类";
}

function buildGoodsBuyerPromptAssembly(selectionMap: AdvancedSelectionMap = {}, supplementValue = "") {
  const productType = selectionMap.productType ?? "智能识别";
  const category = normalizeGoodsBuyerCategoryByAliases(productType);
  const categoryRule = goodsBuyerCategoryRules.find((rule) => rule.label === category) ?? goodsBuyerCategoryRules[goodsBuyerCategoryRules.length - 1];
  const platformRule = goodsBuyerPlatformRules["全平台通用（16平台）"];
  const paramLine = `产品类型=${productType}；平台信息=${selectionMap.platformInfo ?? ""}；产品状态=${selectionMap.productState ?? ""}；呈现方式=${selectionMap.presentationStyle ?? ""}；场景氛围=${selectionMap.sceneAtmosphere ?? ""}；产品真实感=${selectionMap.productReality ?? ""}；环境真实感=${selectionMap.environmentReality ?? ""}；拍摄真实感=${selectionMap.shotReality ?? ""}；目标市场=${selectionMap.targetMarket ?? ""}。`;
  const expansionLines = Object.values(goodsBuyerOptionValueExpansions)
    .map((field) => {
      const value = selectionMap[field.fieldKey];
      if (!value) return "";
      return field.values[value]?.valuePrompt ?? "";
    })
    .filter(Boolean)
    .join(" ");
  const focusPointsLine = categoryRule.focusPoints.length ? `品类关注点：${categoryRule.focusPoints.join("、")}。` : "";
  const commonNegativeLine =
    "通用负向约束：严禁虚假功效、误导性前后对比、违规导流信息、侵权元素、主体结构失真、过度滤镜与低质AI伪影。";
  const commonQualityLine =
    "通用质量要求：商品主体清晰，结构颜色材质与原商品一致，光影透视遮挡关系自然可信，场景与用途一致，缩略图与详情页均可稳定识别。";
  const prompt = [
    "生成真实自然、生活化的买家秀风格商品图。",
    `当前商品品类为「${category}」，${categoryRule.prompt}`,
    focusPointsLine,
    platformRule.prompt,
    paramLine,
    expansionLines,
    platformRule.required?.length ? `必须满足：${platformRule.required.join("、")}。` : "",
    platformRule.forbidden?.length ? `禁止：${platformRule.forbidden.join("、")}。` : "",
    commonNegativeLine,
    commonQualityLine,
    supplementValue.trim() ? `补充要求：${supplementValue.trim()}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");
  return { category, prompt };
}

function inferPlatformLabelForField(sourceText: string, platformOptions: PlatformMock[]) {
  const inferred = inferPlatformInfo(sourceText);
  return platformOptions.find((item) => item.label === inferred)?.label ?? "";
}

function inferRegionLabelForPlatform(sourceText: string, platform?: PlatformMock) {
  if (!platform) return "";
  const inferred = inferOptionByKeywords(
    sourceText,
    [
      { option: "美国站", keywords: [/美国|us\b|usa/] },
      { option: "美国", keywords: [/美国|us\b|usa/] },
      { option: "欧洲站", keywords: [/欧洲|eu\b|europe/] },
      { option: "欧洲", keywords: [/欧洲|eu\b|europe/] },
      { option: "英国", keywords: [/英国|uk\b/] },
      { option: "日本站", keywords: [/日本|jp\b|japan/] },
      { option: "东南亚", keywords: [/东南亚|sea\b|southeast asia/] },
      { option: "全球", keywords: [/全球|global/] },
      { option: "全球站", keywords: [/全球|global/] }
    ],
    ""
  );
  return platform.regions.find((item) => item.label === inferred)?.label ?? "";
}

function inferLanguageLabelForRegion(sourceText: string, region?: PlatformRegionMock) {
  if (!region) return "";
  const inferred = inferCopyLanguage(sourceText, true);
  return region.languages.find((item) => item === inferred) ?? "";
}

function inferSellingPointSceneType(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "无背景纯白色", keywords: [/白底|纯白|无背景|cutout|isolated/] },
      { option: "纯色背景", keywords: [/纯色|solid background/] },
      { option: "彩色渐变", keywords: [/渐变|gradient/] },
      { option: "简单场景", keywords: [/简单背景|浅色背景|简洁背景/] },
      { option: "电商展台", keywords: [/展台|货架|陈列|display stand/] },
      { option: "室内居家", keywords: [/室内|家居|客厅|卧室|桌面/] },
      { option: "都市街道", keywords: [/街道|通勤|城市|urban|street/] },
      { option: "运动场所", keywords: [/运动|健身|gym|fitness/] },
      { option: "户外公园", keywords: [/公园|草地|户外|garden|outdoor/] },
      { option: "自然风格", keywords: [/自然|树木|森系|nature/] },
      { option: "背景虚化", keywords: [/虚化|bokeh|blur/] }
    ],
    "智能匹配"
  );
}

function inferSellingPointCoreCopy(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "生成多个核心卖点文案展示", keywords: [/多个卖点|多卖点|丰富信息|multi benefit/] },
      { option: "生成主卖点搭配2~3个辅卖点", keywords: [/主卖点|辅卖点|层级|benefit hierarchy/] },
      { option: "生成两个核心卖点文案对称展示", keywords: [/对称|双卖点|两个卖点/] }
    ],
    "自动生成单一核心卖点文案展示"
  );
}

function inferSellingPointPresentation(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "左侧展示产品右侧展示卖点", keywords: [/左图右文|左侧产品|right copy/] },
      { option: "左侧展示卖点右侧展示产品", keywords: [/左文右图|右侧产品|left copy/] },
      { option: "产品展示在上卖点相关在下", keywords: [/上图下文|产品在上/] },
      { option: "产品展示在下卖点相关在上", keywords: [/上文下图|产品在下/] },
      { option: "产品居中展示卖点两侧分布", keywords: [/居中|两侧|环绕/] },
      { option: "产品微缩展示卖点环绕展示", keywords: [/微缩|环绕|surround/] },
      { option: "产品场景化展示", keywords: [/场景|lifestyle|scene/] },
      { option: "卖点分散排版", keywords: [/分散|多点位|散点/] }
    ],
    "智能匹配"
  );
}

function inferBuyerShowProductState(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "开箱中", keywords: [/开箱|拆箱|unbox/] },
      { option: "手持展示", keywords: [/手持|拿着|holding/] },
      { option: "上身/上脚/上脸", keywords: [/上身|上脚|上脸|穿着|佩戴|试用/] },
      { option: "摆拍静物", keywords: [/静物|摆拍|flat lay|平铺/] },
      { option: "使用中", keywords: [/使用中|正在用|in use/] },
      { option: "组合套装", keywords: [/套装|组合|多件|bundle/] }
    ],
    "手持展示"
  );
}

function inferBuyerShowPresentation(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "自拍视角", keywords: [/自拍|selfie/] },
      { option: "男友/闺蜜视角", keywords: [/男友|闺蜜|朋友拍|third-person/] },
      { option: "镜子视角", keywords: [/镜子|镜前|mirror/] },
      { option: "桌面分享", keywords: [/桌面|书桌|桌上|desktop/] },
      { option: "穿搭展示", keywords: [/穿搭|ootd|look/] },
      { option: "生活记录", keywords: [/生活记录|vlog|日常/] }
    ],
    "生活记录"
  );
}

function inferBuyerShowAtmosphere(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "无场景", keywords: [/无场景|无背景|cutout|isolated/] },
      { option: "居家场景", keywords: [/居家|卧室|客厅|家里|home/] },
      { option: "局部或模糊场景", keywords: [/模糊|虚化|局部场景|blur/] },
      { option: "车内场景", keywords: [/车内|汽车|副驾|car/] },
      { option: "移动运动场景", keywords: [/运动|跑步|骑行|移动中/] },
      { option: "日常外出场景", keywords: [/外出|通勤|街头|逛街|outdoor/] },
      { option: "节日场景", keywords: [/节日|圣诞|新年|生日|holiday/] }
    ],
    "日常外出场景"
  );
}

function inferBuyerShowProductReality(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "包装与产品褶皱", keywords: [/褶皱|包装折痕|折痕/] },
      { option: "长期使用磨损", keywords: [/磨损|旧痕|长期使用|wear/] },
      { option: "使用中的真实", keywords: [/真实使用|使用中|生活化|real usage/] }
    ],
    "使用中的真实"
  );
}

function inferBuyerShowEnvironmentReality(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "杂乱环境", keywords: [/杂乱|凌乱|messy/] },
      { option: "宠物偶然入镜", keywords: [/宠物|猫|狗|pet/] },
      { option: "人物局部入镜", keywords: [/局部入镜|手部|腿部|partial body/] },
      { option: "临时摆放随意感", keywords: [/随意摆放|临时摆放|casual placement/] },
      { option: "人物素颜", keywords: [/素颜|bare face/] },
      { option: "人物日常穿搭", keywords: [/日常穿搭|便装|casual outfit/] }
    ],
    "人物日常穿搭"
  );
}

function inferBuyerShowShotReality(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "随手拍摄无美感", keywords: [/随手拍|抓拍|casual shot/] },
      { option: "较低像素", keywords: [/低像素|不高清|low resolution/] },
      { option: "手抖模糊", keywords: [/手抖|模糊|blur/] },
      { option: "反光逆光", keywords: [/反光|逆光|backlight|glare/] },
      { option: "对镜自拍", keywords: [/对镜|镜自拍|mirror selfie/] },
      { option: "手持自拍", keywords: [/手持自拍|selfie/] }
    ],
    "随手拍摄无美感"
  );
}

function inferSellingPointFocus(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "材质优势", keywords: [/材质|面料|纹理|texture|material/] },
      { option: "工艺精度", keywords: [/工艺|做工|精度|细节|craft/] },
      { option: "功能特性", keywords: [/功能|用途|使用|feature/] },
      { option: "性能表现", keywords: [/性能|续航|速度|参数|performance/] }
    ],
    "设计亮点"
  );
}

function inferTitleGeneration(sourceText: string, type: "main" | "subtitle") {
  if (/(无标题|不要标题|no title)/.test(sourceText)) {
    return type === "main" ? "无标题" : "无副标题";
  }
  return type === "main" ? "自动生成主标题" : "自动生成副标题";
}

function inferFontStyle(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "科技风", keywords: [/科技|future|tech/] },
      { option: "卡通风", keywords: [/卡通|童趣|cute/] },
      { option: "手写体", keywords: [/手写|handwritten/] },
      { option: "艺术字体", keywords: [/艺术|artistic/] },
      { option: "3d立体", keywords: [/3d|立体/] },
      { option: "标题黑体内容宋体", keywords: [/黑体.*宋体|标题黑体/] },
      { option: "黑体", keywords: [/黑体|sans/] }
    ],
    "粗体"
  );
}

function inferAssistElement(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "箭头辅助", keywords: [/箭头|arrow/] },
      { option: "图标辅助", keywords: [/图标|icon/] },
      { option: "强调框辅助", keywords: [/框|描边|outline/] },
      { option: "数据辅助", keywords: [/数据|数字|parameter/] },
      { option: "线条辅助", keywords: [/线条|line/] }
    ],
    "色块辅助"
  );
}

function inferSpokespersonInteraction(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "穿戴展示", keywords: [/穿戴|上身|佩戴|wearing/] },
      { option: "手持展示", keywords: [/手持|拿着|holding/] },
      { option: "使用状态展示", keywords: [/使用中|操作|using/] },
      { option: "推荐代言", keywords: [/推荐|种草|代言|endorse/] },
      { option: "身体局部展示", keywords: [/局部|特写|close-up/] }
    ],
    "产品静置人物出现"
  );
}

function inferSpokespersonCharacter(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "明星气质", keywords: [/明星|celebrity/] },
      { option: "网络达人", keywords: [/达人|博主|influencer|kol/] },
      { option: "产品专业人士", keywords: [/专业|expert|technician/] },
      { option: "生产工作人员", keywords: [/工厂|车间|worker/] },
      { option: "运动风", keywords: [/运动|fitness|sport/] },
      { option: "商务", keywords: [/商务|formal|office/] },
      { option: "休闲", keywords: [/休闲|casual|daily/] },
      { option: "青春", keywords: [/年轻|青春|youth/] },
      { option: "童趣", keywords: [/儿童|可爱|playful/] },
      { option: "慈祥", keywords: [/长辈|温和|elder/] },
      { option: "搞怪", keywords: [/搞怪|夸张|funny/] }
    ],
    "真实素人"
  );
}

function inferSpokespersonSceneBackground(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "无背景", keywords: [/无背景|抠图|isolated|cutout/] },
      { option: "纯色背景", keywords: [/纯色|solid background/] },
      { option: "简单背景", keywords: [/简单背景|浅色背景/] },
      { option: "居家场景", keywords: [/居家|客厅|卧室|home/] },
      { option: "摄影棚", keywords: [/摄影棚|影棚|studio/] },
      { option: "舞台T台", keywords: [/舞台|t台|show/] },
      { option: "户外场景", keywords: [/户外|公园|自然|outdoor/] },
      { option: "城市街道", keywords: [/街道|城市|urban|street/] },
      { option: "商业空间", keywords: [/商场|店铺|展厅|commercial space/] }
    ],
    "真实场景"
  );
}

function inferSpokespersonLayout(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "人物全貌展示", keywords: [/全身|全貌|full body/] },
      { option: "突出产品主体", keywords: [/产品突出|聚焦产品|product focus/] },
      { option: "多场景拼接", keywords: [/拼接|多场景|collage/] },
      { option: "产品居中，周边搭配使用场景", keywords: [/居中|环绕|surround/] },
      { option: "同一人物不同场景", keywords: [/同一人物|不同场景/] },
      { option: "不同人物同一场景", keywords: [/不同人物|同一场景/] }
    ],
    "突出产品主体"
  );
}

function inferSkinTone(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "北美", keywords: [/欧美白人|white|caucasian|north america/] },
      { option: "欧洲", keywords: [/欧洲|european/] },
      { option: "南美", keywords: [/南美|latin/] },
      { option: "非洲", keywords: [/非裔|black|africa/] },
      { option: "东南亚", keywords: [/东南亚|sea\b|southeast asia/] },
      { option: "中东", keywords: [/中东|arab/] }
    ],
    "亚洲"
  );
}

function inferGenderStyle(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "男", keywords: [/男|male|man/] },
      { option: "中性风", keywords: [/中性|neutral/] },
      { option: "妩媚", keywords: [/妩媚|性感|sexy/] },
      { option: "性冷淡", keywords: [/冷淡|冷感|minimal cool/] }
    ],
    "女"
  );
}

function inferAgeTrait(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "婴幼儿", keywords: [/婴儿|宝宝|infant/] },
      { option: "儿童", keywords: [/儿童|kid|child/] },
      { option: "少年", keywords: [/少年|teen/] },
      { option: "中年", keywords: [/中年|middle-aged/] },
      { option: "老年", keywords: [/老年|elder|senior/] }
    ],
    "青年"
  );
}

function inferDisplayFocus(sourceText: string) {
  return inferOptionByKeywords(
    sourceText,
    [
      { option: "人物突出", keywords: [/人物突出|person focus|model focus/] },
      { option: "全貌展示", keywords: [/全貌|full view|full body/] },
      { option: "局部特写", keywords: [/局部|特写|close-up/] }
    ],
    "产品突出"
  );
}

function buildExtraDetailsFromClues(sourceText: string, uploads: UploadItem[]) {
  const details: string[] = [];
  if (/白色|white/.test(sourceText)) details.push("建议保留白色主体视觉");
  if (/黑色|black/.test(sourceText)) details.push("建议突出深色材质与轮廓层次");
  if (/金属|metal/.test(sourceText)) details.push("建议强化金属反光与质感表现");
  if (/45度|侧面|three-quarter/.test(sourceText)) details.push("建议采用三分之四视角展示主体");
  if (/细节|detail|close-up/.test(sourceText)) details.push("建议增加局部特写镜头");
  if (uploads[0]?.name) details.push(`延续“${uploads[0].name}”的核心视觉信息`);
  return dedupeStrings(details).join("，");
}

function buildAdvancedAiAssistResult(
  toolKey: string,
  uploads: UploadItem[],
  advancedConfig?: AdvancedSettingsConfig
): AdvancedAiAssistResult {
  const sourceText = normalizeUploadClueText(uploads);
  const platformOptions = platformMockData.filter((item) => advancedConfig?.platformIds.includes(item.id));
  const inferredPlatformLabel = inferPlatformLabelForField(sourceText, platformOptions);
  const inferredPlatform = platformOptions.find((item) => item.label === inferredPlatformLabel) ?? platformOptions[0];
  const inferredRegionLabel = inferRegionLabelForPlatform(sourceText, inferredPlatform);
  const inferredRegion = inferredPlatform?.regions.find((item) => item.label === inferredRegionLabel) ?? inferredPlatform?.regions[0];
  const inferredLanguage = inferLanguageLabelForRegion(sourceText, inferredRegion);
  const extraDetails = buildExtraDetailsFromClues(sourceText, uploads);
  const fieldValues: AdvancedSelectionMap = {};
  const finalizeFieldValues = (nextValues: AdvancedSelectionMap) => {
    const completedValues: AdvancedSelectionMap = {};
    const extraSelectConfigMap = new Map((advancedConfig?.extraSelects ?? []).map((item) => [item.key, item]));

    Object.entries(nextValues).forEach(([key, rawValue]) => {
      const value = typeof rawValue === "string" ? rawValue.trim() : "";
      if (!value) return;

      const fieldConfig = extraSelectConfigMap.get(key);
      if (!fieldConfig) {
        completedValues[key] = value;
        return;
      }

      const optionValues = fieldConfig.options ?? fieldConfig.richOptions?.map((item) => item.value) ?? [];
      if (fieldConfig.mode === "select" || fieldConfig.mode === "rich-select") {
        if (optionValues.includes(value)) {
          completedValues[key] = value;
        }
        return;
      }

      completedValues[key] = value;
    });

    return completedValues;
  };

  if (advancedConfig?.fields.includes("platform")) fieldValues.platform = inferredPlatformLabel;
  if (advancedConfig?.fields.includes("region")) fieldValues.region = inferredRegionLabel;
  if (advancedConfig?.fields.includes("language")) fieldValues.language = inferredLanguage;

  switch (toolKey) {
    case "goods-white":
      {
        const inferredPlatformInfo = inferPlatformInfo(sourceText);
        if (inferredPlatformInfo === "无平台信息") {
          fieldValues.platformInfo = goodsWhiteUniversalPlatformLabel;
          fieldValues.platformRuleDetail = goodsWhiteUniversalRulePreset;
        } else {
          fieldValues.platformInfo = inferredPlatformInfo;
        }
      }
      return { fieldValues: finalizeFieldValues(fieldValues), supplementValue: extraDetails };
    case "goods-marketing":
      fieldValues.productType = inferProductType(sourceText);
      fieldValues.sceneBackground = inferBackgroundType(sourceText, "智能生成");
      fieldValues.platformInfo = inferPlatformInfo(sourceText);
      fieldValues.productInfo = inferProductInfo(sourceText);
      fieldValues.visualStyle = inferVisualStyle(sourceText);
      fieldValues.marketingElements = inferMarketingElement(sourceText);
      fieldValues.copyLanguage = inferCopyLanguage(sourceText);
      return { fieldValues: finalizeFieldValues(fieldValues), supplementValue: extraDetails };
    case "goods-scene":
      fieldValues.productType = inferProductType(sourceText);
      fieldValues.platformInfo = inferPlatformInfo(sourceText);
      fieldValues.sceneType = inferBackgroundType(sourceText, "智能生成");
      fieldValues.productDisplay = inferSceneProductDisplay(sourceText);
      fieldValues.layoutStyle = inferSceneLayoutStyle(sourceText);
      fieldValues.moodStyle = inferSceneMoodStyle(sourceText);
      fieldValues.valueFocus = inferSceneValueFocus(sourceText);
      fieldValues.targetMarket = inferTargetMarket(sourceText);
      fieldValues.copyLanguage = inferCopyLanguage(sourceText, true);
      return { fieldValues: finalizeFieldValues(fieldValues), supplementValue: extraDetails };
    case "goods-bg":
      fieldValues.backgroundType = inferBackgroundSceneType(sourceText);
      fieldValues.lightingStyle = inferBackgroundLightingStyle(sourceText);
      return { fieldValues: finalizeFieldValues(fieldValues), supplementValue: extraDetails };
    case "goods-view":
      fieldValues.platformInfo = inferPlatformInfo(sourceText);
      return { fieldValues: finalizeFieldValues(fieldValues), supplementValue: extraDetails };
    case "goods-translate":
      fieldValues.platformInfo = inferPlatformInfo(sourceText);
      return { fieldValues: finalizeFieldValues(fieldValues), supplementValue: extraDetails };
    case "goods-retouch":
      fieldValues.platformInfo = inferPlatformInfo(sourceText);
      fieldValues.targetMarket = inferRegionalTargetMarket(sourceText);
      return { fieldValues: finalizeFieldValues(fieldValues), supplementValue: extraDetails };
    case "goods-sell":
      fieldValues.productType = inferProductType(sourceText);
      fieldValues.sceneType = inferSellingPointSceneType(sourceText);
      fieldValues.copyLanguage = inferCopyLanguage(sourceText);
      fieldValues.coreSellingPoint = inferSellingPointCoreCopy(sourceText);
      fieldValues.presentationForm = inferSellingPointPresentation(sourceText);
      fieldValues.sellingPointFocus = inferSellingPointFocus(sourceText);
      fieldValues.mainTitle = inferTitleGeneration(sourceText, "main");
      fieldValues.subtitle = inferTitleGeneration(sourceText, "subtitle");
      fieldValues.fontStyle = inferFontStyle(sourceText);
      fieldValues.assistElement = inferAssistElement(sourceText);
      fieldValues.targetMarket = inferRegionalTargetMarket(sourceText);
      return { fieldValues: finalizeFieldValues(fieldValues), supplementValue: extraDetails };
    case "goods-buyer":
      fieldValues.productType = inferProductType(sourceText);
      fieldValues.platformInfo = inferPlatformInfo(sourceText);
      fieldValues.productState = inferBuyerShowProductState(sourceText);
      fieldValues.presentationStyle = inferBuyerShowPresentation(sourceText);
      fieldValues.sceneAtmosphere = inferBuyerShowAtmosphere(sourceText);
      fieldValues.productReality = inferBuyerShowProductReality(sourceText);
      fieldValues.environmentReality = inferBuyerShowEnvironmentReality(sourceText);
      fieldValues.shotReality = inferBuyerShowShotReality(sourceText);
      fieldValues.targetMarket = inferRegionalTargetMarket(sourceText);
      fieldValues.productCategory = normalizeGoodsBuyerCategoryByAliases(fieldValues.productType);
      return { fieldValues: finalizeFieldValues(fieldValues), supplementValue: extraDetails };
    case "goods-spoke":
      fieldValues.productType = inferProductType(sourceText);
      fieldValues.interactionType = inferSpokespersonInteraction(sourceText);
      fieldValues.characterTrait = inferSpokespersonCharacter(sourceText);
      fieldValues.sceneBackground = inferSpokespersonSceneBackground(sourceText);
      fieldValues.layoutStyle = inferSpokespersonLayout(sourceText);
      fieldValues.skinTone = inferSkinTone(sourceText);
      fieldValues.genderStyle = inferGenderStyle(sourceText);
      fieldValues.ageTrait = inferAgeTrait(sourceText);
      fieldValues.displayFocus = inferDisplayFocus(sourceText);
      fieldValues.targetMarket = inferRegionalTargetMarket(sourceText);
      return { fieldValues: finalizeFieldValues(fieldValues), supplementValue: extraDetails };
    default:
      return { fieldValues: finalizeFieldValues(fieldValues), supplementValue: extraDetails };
  }
}

type PolishPhrase = {
  pattern: RegExp;
  chinese: string;
  english: string;
  category: "lighting" | "tone" | "composition" | "texture" | "scene" | "focus" | "style" | "copy" | "angle";
};

type PolishStrategy = {
  chinesePrefix: string;
  englishPrefix: string;
  chineseSuffix: string[];
  englishSuffix: string[];
  minKeywordHint: string;
  preferredCategories: Array<PolishPhrase["category"]>;
};

const polishPhraseLibrary: PolishPhrase[] = [
  { pattern: /(明亮|亮一点|亮一些|通透|清透)/i, chinese: "整体光线明亮通透", english: "bright, airy lighting", category: "lighting" },
  { pattern: /(暗调|低调|神秘|氛围暗)/i, chinese: "采用低调光线与层次阴影", english: "low-key lighting with layered shadows", category: "lighting" },
  { pattern: /(自然光|日光|窗边|阳光)/i, chinese: "以自然光塑造柔和光感", english: "soft natural daylight", category: "lighting" },
  { pattern: /(暖色|温暖|暖调|治愈)/i, chinese: "整体色调偏暖，氛围更有亲和力", english: "warm-toned palette with inviting mood", category: "tone" },
  { pattern: /(冷色|清冷|冷调|高级冷淡)/i, chinese: "整体色调偏冷，更显利落高级", english: "cool-toned palette with refined mood", category: "tone" },
  { pattern: /(高级感|高端|轻奢|奢华)/i, chinese: "强化高级质感与商业精致度", english: "premium commercial texture", category: "texture" },
  { pattern: /(质感|材质|纹理|细节)/i, chinese: "突出材质纹理与细节表现", english: "clear material texture and details", category: "texture" },
  { pattern: /(干净|简洁|简约|纯净)/i, chinese: "画面保持干净简洁，减少无效干扰", english: "clean and minimal visual presentation", category: "style" },
  { pattern: /(科技感|未来感)/i, chinese: "融入科技感与未来感表达", english: "futuristic visual styling", category: "style" },
  { pattern: /(居中|对称|正中)/i, chinese: "采用居中稳定的主体构图", english: "centered and balanced composition", category: "composition" },
  { pattern: /(左右分栏|分栏)/i, chinese: "采用分栏式信息构图，层级更清晰", english: "split composition with clear hierarchy", category: "composition" },
  { pattern: /(满版|铺陈|冲击力|张力|吸睛)/i, chinese: "增强画面张力与视觉冲击力", english: "dynamic composition with strong impact", category: "composition" },
  { pattern: /(留白|极简)/i, chinese: "适当留白，强化主体聚焦", english: "strategic negative space for focus", category: "composition" },
  { pattern: /(主体突出|突出主体|聚焦产品|产品突出)/i, chinese: "突出产品主体，确保视觉焦点集中", english: "product-focused visual emphasis", category: "focus" },
  { pattern: /(卖点|亮点|优势)/i, chinese: "强化核心卖点表达与信息可读性", english: "clear presentation of selling points", category: "copy" },
  { pattern: /(价格|促销|大促|新品|首发)/i, chinese: "强化营销信息识别度与促销氛围", english: "strong promotional callouts", category: "copy" },
  { pattern: /(生活感|日常感|居家感|真实)/i, chinese: "营造真实自然的生活化氛围", english: "authentic lifestyle atmosphere", category: "scene" },
  { pattern: /(室内|家居|客厅|卧室)/i, chinese: "场景偏向室内家居环境", english: "indoor lifestyle setting", category: "scene" },
  { pattern: /(户外|自然|草地|花园|露营)/i, chinese: "场景偏向自然户外环境", english: "outdoor natural setting", category: "scene" },
  { pattern: /(城市|街头|通勤)/i, chinese: "场景带有都市通勤气质", english: "urban lifestyle setting", category: "scene" },
  { pattern: /(45度|侧面|斜侧|三分之四)/i, chinese: "采用三分之四侧视角呈现主体", english: "three-quarter product angle", category: "angle" },
  { pattern: /(正面|正视)/i, chinese: "以正面视角清晰展示主体", english: "front-facing product view", category: "angle" },
  { pattern: /(背面|背部)/i, chinese: "补充背部视角，确保展示完整", english: "clear back view for completeness", category: "angle" },
  { pattern: /(版式|排版|布局)/i, chinese: "优化版式结构与信息层级", english: "refined layout and information hierarchy", category: "copy" },
  { pattern: /(翻译|英文|中文|双语|语种)/i, chinese: "兼顾语义准确与跨语言排版协调", english: "accurate bilingual layout treatment", category: "copy" }
];

const supplementToolStrategies: Record<string, PolishStrategy> = {
  "goods-marketing": {
    chinesePrefix: "建议将营销主图细节补充优化为",
    englishPrefix: "Marketing hero visual with",
    chineseSuffix: ["突出营销主信息", "确保主体醒目且具备转化感", "整体更适合电商主图生成"],
    englishSuffix: ["clear product hierarchy", "commercial hero-shot styling", "conversion-oriented e-commerce presentation"],
    minKeywordHint: "请补充产品卖点、构图、氛围或营销信息相关描述",
    preferredCategories: ["focus", "composition", "tone", "copy", "texture"]
  },
  "goods-scene": {
    chinesePrefix: "建议将场景图补充说明优化为",
    englishPrefix: "Scene-based product visual with",
    chineseSuffix: ["强化场景代入感", "突出产品与环境关系", "适合电商场景图生成"],
    englishSuffix: ["immersive atmosphere", "clear product-environment relationship", "e-commerce scene styling"],
    minKeywordHint: "请补充场景、氛围、光线或产品展示方式",
    preferredCategories: ["scene", "lighting", "tone", "focus", "style"]
  },
  "goods-bg": {
    chinesePrefix: "建议将换背景补充说明优化为",
    englishPrefix: "Background replacement visual with",
    chineseSuffix: ["背景与主体融合自然", "光影关系统一", "整体更真实协调"],
    englishSuffix: ["natural subject-background integration", "consistent lighting logic", "realistic commercial finish"],
    minKeywordHint: "请补充背景类型、环境氛围或光线关系",
    preferredCategories: ["scene", "lighting", "tone", "focus", "style"]
  },
  "goods-retouch": {
    chinesePrefix: "建议将产品精修补充说明优化为",
    englishPrefix: "Retouched product visual with",
    chineseSuffix: ["强化材质高级感", "边缘干净自然", "保留真实商品质感"],
    englishSuffix: ["refined material rendering", "clean edges", "realistic product finish"],
    minKeywordHint: "请补充质感、材质、光线或背景处理要求",
    preferredCategories: ["texture", "lighting", "tone", "focus", "style"]
  },
  "goods-translate": {
    chinesePrefix: "建议将图片翻译补充说明优化为",
    englishPrefix: "Translated visual layout with",
    chineseSuffix: ["保留原有版式逻辑", "保证阅读清晰度", "兼顾视觉统一性"],
    englishSuffix: ["preserved original layout", "clear readability", "consistent multilingual hierarchy"],
    minKeywordHint: "请补充翻译语言、版式保留或信息层级要求",
    preferredCategories: ["copy", "composition", "style"]
  },
  "goods-view": {
    chinesePrefix: "建议将三视图补充说明优化为",
    englishPrefix: "Multi-view product set with",
    chineseSuffix: ["三视图展示完整统一", "光线与角度保持一致", "便于清晰展示产品结构"],
    englishSuffix: ["consistent multi-view presentation", "matched lighting across views", "clear structural display"],
    minKeywordHint: "请补充视角、展示重点或背景要求",
    preferredCategories: ["angle", "lighting", "focus", "style"]
  },
  "goods-buyer": {
    chinesePrefix: "建议将买家秀补充说明优化为",
    englishPrefix: "Lifestyle buyer-show image with",
    chineseSuffix: ["增强真实使用场景感", "人物与产品关系自然", "更有种草氛围"],
    englishSuffix: ["authentic usage scene", "natural human-product interaction", "social-proof visual tone"],
    minKeywordHint: "请补充使用场景、人物状态或氛围要求",
    preferredCategories: ["scene", "lighting", "tone", "focus"]
  },
  "goods-detail": {
    chinesePrefix: "建议将卖点图补充说明优化为",
    englishPrefix: "Selling-point visual with",
    chineseSuffix: ["核心卖点更集中", "信息层级更清晰", "增强商业说服力"],
    englishSuffix: ["clear key-benefit hierarchy", "focused value communication", "strong commercial persuasion"],
    minKeywordHint: "请补充卖点、优势表达或视觉重点",
    preferredCategories: ["copy", "focus", "composition", "texture"]
  },
  "goods-sell": {
    chinesePrefix: "建议将卖点图补充说明优化为",
    englishPrefix: "Selling-point visual with",
    chineseSuffix: ["核心卖点更集中", "信息层级更清晰", "增强商业说服力"],
    englishSuffix: ["clear key-benefit hierarchy", "focused value communication", "strong commercial persuasion"],
    minKeywordHint: "请补充卖点、优势表达或视觉重点",
    preferredCategories: ["copy", "focus", "composition", "texture"]
  },
  "goods-spoke": {
    chinesePrefix: "建议将代言图补充说明优化为",
    englishPrefix: "Endorsement-style visual with",
    chineseSuffix: ["人物与产品关系明确", "品牌气质更统一", "整体更具广告感"],
    englishSuffix: ["clear talent-product relationship", "cohesive brand tone", "editorial advertising style"],
    minKeywordHint: "请补充人物气质、镜头风格或品牌氛围",
    preferredCategories: ["style", "tone", "focus", "composition"]
  },
  "goods-point": {
    chinesePrefix: "建议将卖点图补充说明优化为",
    englishPrefix: "Feature-driven visual with",
    chineseSuffix: ["重点信息表达明确", "主体与卖点关系更清楚", "适合电商卖点呈现"],
    englishSuffix: ["clear value emphasis", "strong feature-product connection", "e-commerce feature layout"],
    minKeywordHint: "请补充卖点、主体重点或风格需求",
    preferredCategories: ["copy", "focus", "composition", "style"]
  },
  "video-replace": {
    chinesePrefix: "建议将商品替换视频描述优化为",
    englishPrefix: "Product replacement video with",
    chineseSuffix: ["严格保持原视频动作与运镜节奏不变", "替换商品在多镜头下结构一致且透视真实", "整体成片稳定自然并适合电商投放"],
    englishSuffix: ["original motion and camera movement preserved", "consistent product structure across shots", "stable commercial video output"],
    minKeywordHint: "请补充想保留的镜头节奏、商品展示重点、场景氛围或成片风格要求",
    preferredCategories: ["focus", "scene", "lighting", "style", "texture", "composition"]
  },
  "image-expand": {
    chinesePrefix: "建议将图片扩图需求优化为",
    englishPrefix: "Outpainting request with",
    chineseSuffix: ["延展区域与原图自然衔接", "空间透视与光影逻辑连续", "主体结构稳定且边缘完整"],
    englishSuffix: ["natural edge continuation", "consistent perspective and lighting", "stable subject structure"],
    minKeywordHint: "请补充扩展方向、场景延展、边缘衔接或光影连续性要求",
    preferredCategories: ["scene", "composition", "lighting", "focus", "style", "texture"]
  },
  default: {
    chinesePrefix: "建议将补充说明优化为",
    englishPrefix: "Refined product visual with",
    chineseSuffix: ["主体清晰突出", "画面风格统一", "更适合电商视觉生成"],
    englishSuffix: ["clear visual focus", "consistent styling", "e-commerce ready presentation"],
    minKeywordHint: "请补充风格、构图、光线、材质或场景相关描述",
    preferredCategories: ["focus", "lighting", "tone", "composition", "texture", "scene", "style", "copy"]
  }
};

const supplementVisualKeywordPattern =
  /(色调|构图|氛围|光影|材质|场景|背景|风格|光线|灯光|镜头|角度|主体|卖点|排版|版式|细节|生活感|高级感|简约|科技感|营销|翻译|语种|自然光|暖|冷|明亮|暗)/i;

function dedupeStrings(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function parseMultiSelectValue(value?: string) {
  return (value ?? "")
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeMultiSelectValue(values: string[]) {
  const seen = new Set<string>();
  return values
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .join("||");
}

function getImportCellString(row: MoreTitleImportSheetRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value === undefined || value === null) continue;
    const nextValue = String(value).trim();
    if (nextValue) return nextValue;
  }
  return "";
}

function parseMoreTitleImportRows(rows: MoreTitleImportSheetRow[]) {
  return rows
    .map((row, index) => ({
      id: `row-${Date.now()}-${index + 1}`,
      productName: getImportCellString(row, ["商品名", "商品名称", "产品名称", "title", "product_name"]),
      brand: getImportCellString(row, ["品牌", "brand"]),
      category: getImportCellString(row, ["商品类目", "类目", "分类", "category"]),
      sellingPoints: getImportCellString(row, ["核心卖点", "卖点", "selling_points", "highlights"]),
      specs: getImportCellString(row, ["规格属性", "规格", "属性", "specs", "attributes"]),
      originalTitle: getImportCellString(row, ["原始标题", "标题", "original_title"]),
      imageSrc: getImportCellString(row, ["商品图", "图片", "图片链接", "image", "image_url"]),
      imageLabel: getImportCellString(row, ["图片说明", "image_label"])
    }))
    .filter((row) => [row.productName, row.brand, row.category, row.sellingPoints, row.specs, row.originalTitle, row.imageSrc].some((value) => value.trim()));
}

function splitInputSegments(input: string): string[] {
  return input
    .split(/[，。,；;、\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function detectSupplementLanguage(input: string) {
  const normalizedInput = input.trim();
  const chineseCharCount = (normalizedInput.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latinWordCount = (normalizedInput.match(/[A-Za-z]+/g) ?? []).length;

  if (chineseCharCount >= 2) return "zh";
  if (latinWordCount >= 2) return "en";
  return "zh";
}

function buildSupplementPolishResult(
  toolKey: string,
  input: string,
  context?: SupplementAiPolishContext
): SupplementAiPolishResult {
  const normalizedInput = input.replace(/\s+/g, " ").trim();
  if (!normalizedInput) {
    return { content: "请先输入补充说明后再润色", canUse: false };
  }

  const strategy = supplementToolStrategies[toolKey] ?? supplementToolStrategies.default;
  const contextValues = dedupeStrings([...(context?.advancedValues ?? []), ...(context?.creationModeValues ?? [])]).filter(
    (item) => item && item !== "自适应尺寸" && item !== "1" && item !== "普通模式"
  );
  const analysisInput = [normalizedInput, ...contextValues].join("，");

  if (!supplementVisualKeywordPattern.test(analysisInput) && normalizedInput.length < 6) {
    return { content: strategy.minKeywordHint, canUse: false };
  }

  const matchedPhrases = polishPhraseLibrary.filter((item) => item.pattern.test(analysisInput));
  const matchedCategories = new Set(matchedPhrases.map((item) => item.category));
  const segmentHints = [...splitInputSegments(normalizedInput), ...contextValues.slice(0, 4)];

  const preferredMatchedPhrases = matchedPhrases
    .filter((item) => strategy.preferredCategories.includes(item.category))
    .slice(0, 5);
  const fallbackMatchedPhrases = matchedPhrases
    .filter((item) => !strategy.preferredCategories.includes(item.category))
    .slice(0, 3);

  const chineseParts = dedupeStrings([
    ...preferredMatchedPhrases.map((item) => item.chinese),
    ...fallbackMatchedPhrases.map((item) => item.chinese),
    ...segmentHints
      .filter((item) => item.length >= 4)
      .slice(0, 2)
      .map((item) => `延续“${item}”的表达重点`)
  ]).slice(0, 6);

  const englishParts = dedupeStrings([
    ...preferredMatchedPhrases.map((item) => item.english),
    ...fallbackMatchedPhrases.map((item) => item.english)
  ]).slice(0, 6);

  if (!matchedCategories.has("focus")) {
    chineseParts.unshift("产品主体明确突出");
    englishParts.unshift("clear product focus");
  }

  if (!matchedCategories.has("composition") && toolKey !== "goods-retouch") {
    chineseParts.push("构图层级清晰且画面更平衡");
    englishParts.push("balanced composition");
  }

  if (!matchedCategories.has("lighting")) {
    chineseParts.push("光线表现自然，画面层次更完整");
    englishParts.push("natural lighting depth");
  }

  if (!matchedCategories.has("texture")) {
    chineseParts.push("保留商品真实质感并增强商业精致度");
    englishParts.push("refined commercial texture");
  }

  const finalChineseParts = dedupeStrings([...chineseParts, ...strategy.chineseSuffix]).slice(0, 7);
  const finalEnglishParts = dedupeStrings([...englishParts, ...strategy.englishSuffix]).slice(0, 7);
  const contextText = contextValues.length ? `，并结合${contextValues.join("、")}等设定` : "";
  const contextEnglishText = contextValues.length ? ", aligned with the selected setup" : "";
  const chineseText = `${strategy.chinesePrefix}：${finalChineseParts.join("，")}${contextText}。`;
  const englishText = `${strategy.englishPrefix} ${finalEnglishParts.join(", ")}${contextEnglishText}.`;
  const applyContent = chineseText.replace(/^建议将(?:.+?)优化为：/, "").trim();
  const applyEnglishContent = `${finalEnglishParts.join(", ")}${contextEnglishText}.`;

  return {
    content: applyContent,
    applyContent,
    applyEnglishContent,
    canUse: true,
    englishText,
    chineseText
  };
}

async function runSupplementAiPolish(
  toolKey: string,
  input: string,
  context?: SupplementAiPolishContext
): Promise<SupplementAiPolishResult> {
  const config = supplementAiPolishConfigs[toolKey];
  if (!config) {
    return {
      content: "当前功能暂未配置AI润色能力",
      canUse: false
    };
  }

  await new Promise((resolve) => window.setTimeout(resolve, 900));
  return buildSupplementPolishResult(toolKey, input, context);
}

const platformMockData: PlatformMock[] = [
  { id: "taobao", label: "淘宝", regions: [{ id: "cn-mainland", label: "中国大陆", languages: ["简体中文"] }] },
  { id: "tmall", label: "天猫", regions: [{ id: "cn-mainland", label: "中国大陆", languages: ["简体中文"] }] },
  { id: "jd", label: "京东", regions: [{ id: "cn-mainland", label: "中国大陆", languages: ["简体中文"] }] },
  { id: "pdd", label: "拼多多", regions: [{ id: "cn-mainland", label: "中国大陆", languages: ["简体中文"] }] },
  { id: "1688", label: "1688", regions: [{ id: "cn-mainland", label: "中国大陆", languages: ["简体中文"] }] },
  { id: "douyin", label: "抖音电商", regions: [{ id: "cn-mainland", label: "中国大陆", languages: ["简体中文"] }] },
  { id: "kuaishou", label: "快手电商", regions: [{ id: "cn-mainland", label: "中国大陆", languages: ["简体中文"] }] },
  { id: "xiaohongshu", label: "小红书电商", regions: [{ id: "cn-mainland", label: "中国大陆", languages: ["简体中文"] }] },
  {
    id: "amazon",
    label: "亚马逊",
    regions: [
      { id: "us", label: "美国", languages: ["英文"] },
      { id: "eu", label: "欧洲", languages: ["英文", "德语", "法语", "意大利语", "西班牙语"] },
      { id: "jp", label: "日本", languages: ["日语", "英文"] }
    ]
  },
  {
    id: "temu",
    label: "Temu",
    regions: [
      { id: "us", label: "美国", languages: ["英语"] },
      { id: "eu", label: "欧洲", languages: ["英语", "德语", "法语", "西班牙语", "意大利语"] },
      { id: "global", label: "全球站", languages: ["英语"] }
    ]
  },
  {
    id: "tiktok-shop",
    label: "TikTok Shop",
    regions: [
      { id: "us", label: "美国", languages: ["英语"] },
      { id: "uk", label: "英国", languages: ["英语"] },
      { id: "sea", label: "东南亚", languages: ["英语", "泰语", "越南语", "马来语"] }
    ]
  },
  {
    id: "alibaba-international",
    label: "阿里国际站",
    regions: [
      { id: "global", label: "全球", languages: ["英语"] },
      { id: "eu", label: "欧洲", languages: ["英语", "法语", "德语", "西班牙语"] }
    ]
  },
  {
    id: "aliexpress",
    label: "速卖通",
    regions: [
      { id: "eu", label: "欧洲", languages: ["英语", "法语", "西班牙语", "俄语"] },
      { id: "americas", label: "美洲", languages: ["英语", "西班牙语", "葡萄牙语"] }
    ]
  },
  {
    id: "shopee",
    label: "Shopee",
    regions: [
      { id: "sea", label: "东南亚", languages: ["英语", "泰语", "越南语", "印尼语", "马来语"] },
      { id: "tw", label: "中国台湾", languages: ["繁体中文"] }
    ]
  },
  {
    id: "ozon",
    label: "OZON",
    regions: [
      { id: "ru", label: "俄罗斯", languages: ["俄语"] },
      { id: "cis", label: "独联体", languages: ["俄语", "英语"] }
    ]
  },
  {
    id: "shein",
    label: "SHEIN",
    regions: [
      { id: "us", label: "美国", languages: ["英语"] },
      { id: "eu", label: "欧洲", languages: ["英语", "法语", "德语", "西班牙语", "意大利语"] },
      { id: "middle-east", label: "中东", languages: ["英语", "阿拉伯语"] }
    ]
  },
  {
    id: "other",
    label: "其他",
    regions: [{ id: "custom", label: "其他地区", languages: ["简体中文", "英语"] }]
  }
];

const applicablePlatformOptions: ApplicablePlatformOption[] = [
  { id: "none", label: "无平台", markets: ["无区域"] },
  { id: "taobao", label: "淘宝", markets: ["中国大陆"] },
  { id: "tmall", label: "天猫", markets: ["中国大陆"] },
  { id: "jd", label: "京东", markets: ["中国大陆"] },
  { id: "pdd", label: "拼多多", markets: ["中国大陆"] },
  { id: "1688", label: "1688", markets: ["中国大陆"] },
  { id: "douyin", label: "抖音电商", markets: ["中国大陆"] },
  { id: "kuaishou", label: "快手电商", markets: ["中国大陆"] },
  { id: "xiaohongshu", label: "小红书电商", markets: ["中国大陆"] },
  {
    id: "amazon",
    label: "亚马逊",
    markets: ["北美", "欧洲", "亚太", "中东和北非"]
  },
  {
    id: "temu",
    label: "Temu",
    markets: ["美国", "欧洲", "澳大利亚/新西兰"]
  },
  {
    id: "tiktok-shop",
    label: "TikTok Shop",
    markets: ["美国", "英国", "德国", "法国", "意大利", "西班牙", "爱尔兰", "墨西哥", "巴西", "东南亚"]
  },
  {
    id: "alibaba-international",
    label: "阿里国际站",
    markets: ["全球"]
  },
  {
    id: "aliexpress",
    label: "速卖通",
    markets: ["欧洲", "拉美", "中东", "俄罗斯及独联体"]
  },
  {
    id: "shopee",
    label: "Shopee",
    markets: ["新加坡", "马来西亚", "泰国", "越南", "菲律宾", "印度尼西亚", "中国台湾", "巴西"]
  },
  {
    id: "ozon",
    label: "OZON",
    markets: ["俄罗斯", "独联体"]
  },
  {
    id: "shein",
    label: "SHEIN",
    markets: ["美国", "欧洲", "中东"]
  }
];

const modelAdjustActionConfigs: ModelAdjustActionConfig[] = [
  {
    key: "replace-model",
    label: "AI换模特",
    detailLabel: "需求描述",
    detailPlaceholder: "请描述您对生成图片的需求，例如：模特的动作、表情、服装等细节要求。"
  },
  {
    key: "change-expression",
    label: "模特换表情",
    valueLabel: "模特表情",
    valueOptions: ["严肃", "微笑", "开心", "大笑"],
    detailLabel: "表情描述",
    detailPlaceholder: "请描述您希望模特展现的表情，例如：微笑、严肃、惊讶等。"
  },
  {
    key: "multi-angle",
    label: "模特多角度",
    valueLabel: "模特角度",
    valueOptions: ["正面", "侧面", "背面"],
    detailLabel: "角度描述",
    detailPlaceholder: "请描述您希望模特展示的视角，例如：侧面、背面、俯视等。"
  },
  {
    key: "multi-pose",
    label: "模特多姿势",
    valueLabel: "模特姿势",
    valueOptions: ["站姿", "坐着", "侧卧", "平躺"],
    detailLabel: "姿势描述",
    detailPlaceholder: "请描述您希望模特摆出的姿势，例如：站立、坐姿、跑步等。"
  },
  {
    key: "hairstyle",
    label: "模特换发型",
    valueLabel: "模特发型",
    valueOptions: ["光头", "短寸", "短发", "中长发", "长发"],
    detailLabel: "发型描述",
    detailPlaceholder: "请描述您希望模特更换的发型，例如：长发、短发、卷发等。"
  },
  {
    key: "fine-tune",
    label: "模特微调",
    valueLabel: "模特微调",
    valueOptions: ["肤色自然一些", "戴上眼镜", "去掉眼镜"],
    detailLabel: "微调描述",
    detailPlaceholder: "请描述您希望对模特进行的微调，例如：调整身材比例、肤色等。"
  }
];

const creationModeConfigs: Record<string, CreationModeConfig> = {
  default: {
    key: "default",
    title: "创作模式",
    showSupplement: true,
    supplementPlaceholder: "请输入补充说明，支持输入风格、构图、光影、材质等细节，最长2000字。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://normal-image-v1",
        logicNote: "使用普通模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        baseUnitCreditCost: 1,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://advanced-image-v2",
        logicNote: "使用高级模型，可设置出图比例、分辨率和出图数量三个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        resolutionOptions: defaultResolutionOptions,
        resolutionUnitCreditCosts: { "1K": 2, "2K": 3, "4K": 5 },
        defaultRatio: "自适应尺寸",
        defaultCount: "1",
        defaultResolution: "1K"
      }
    ]
  },
  "more-title": {
    key: "more-title",
    title: "输出倾向",
    showSupplement: true,
    hideRatioField: true,
    hideResolutionField: true,
    hideCountField: true,
    supplementLabel: "补充要求",
    supplementPlaceholder: "可补充其他运营要求或写作偏好，例如：优先突出大容量版本、品牌词不要前置、标题口吻更偏夏季上新。",
    supplementMaxLength: 1000,
    modes: [
      {
        id: "safe",
        label: "平台稳妥版",
        apiModel: "mock://listing-title-safe",
        logicNote: "优先保证标题结构稳定、平台合规和基础属性完整。",
        ratioOptions: ["文本结果"],
        countOptions: ["1"],
        baseUnitCreditCost: 1,
        defaultRatio: "文本结果",
        defaultCount: "1"
      },
      {
        id: "search",
        label: "搜索覆盖版",
        apiModel: "mock://listing-title-search",
        logicNote: "扩大关键词覆盖，适合搜索型流量获取。",
        ratioOptions: ["文本结果"],
        countOptions: ["1"],
        baseUnitCreditCost: 1,
        defaultRatio: "文本结果",
        defaultCount: "1"
      },
      {
        id: "convert",
        label: "转化卖点版",
        apiModel: "mock://listing-title-convert",
        logicNote: "突出核心卖点，适合点击转化场景。",
        ratioOptions: ["文本结果"],
        countOptions: ["1"],
        baseUnitCreditCost: 1,
        defaultRatio: "文本结果",
        defaultCount: "1"
      }
    ]
  },
  retouch: {
    key: "retouch",
    title: "创作模式",
    showSupplement: true,
    supplementPlaceholder: "请输入对所有图片都适用的额外说明，例如：质感更高级，保持暖色光影，背景更干净。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://retouch-standard",
        logicNote: "使用精修标准模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: ["自适应尺寸", "1:1", "3:4", "4:5"],
        countOptions: ["1", "2"],
        baseUnitCreditCost: 2,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://retouch-pro",
        logicNote: "使用精修高级模型，可设置出图比例、分辨率和出图数量三个维度参数。",
        ratioOptions: ["自适应尺寸", "1:1", "3:4", "4:5"],
        countOptions: ["1", "2"],
        resolutionOptions: defaultResolutionOptions,
        resolutionUnitCreditCosts: { "1K": 3, "2K": 4, "4K": 6 },
        defaultRatio: "自适应尺寸",
        defaultCount: "1",
        defaultResolution: "1K"
      }
    ]
  },
  white: {
    key: "white",
    title: "创作模式",
    showSupplement: false,
    supplementPlaceholder: "请输入对白底图效果的补充说明，例如：阴影自然、边缘更干净、质感更通透。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://white-basic",
        logicNote: "使用白底基础模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: ["自适应尺寸", "1:1", "4:5", "3:4"],
        countOptions: ["1", "2"],
        baseUnitCreditCost: 5,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://white-pro",
        logicNote: "使用白底高级模型，可设置出图比例、分辨率和出图数量三个维度参数。",
        ratioOptions: ["自适应尺寸", "1:1", "4:5", "3:4"],
        countOptions: ["1", "2"],
        resolutionOptions: defaultResolutionOptions,
        resolutionUnitCreditCosts: { "1K": 10, "2K": 15, "4K": 20 },
        defaultRatio: "自适应尺寸",
        defaultCount: "1",
        defaultResolution: "1K"
      }
    ]
  },
  translate: {
    key: "translate",
    title: "创作模式",
    showSupplement: false,
    supplementPlaceholder: "请输入翻译排版的补充说明，例如：保留原版式、优先英文标题、局部增强对比。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://translate-pro",
        logicNote: "使用翻译高级模型，可设置出图比例、分辨率和出图数量三个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        resolutionOptions: defaultResolutionOptions,
        resolutionUnitCreditCosts: { "1K": 10, "2K": 15, "4K": 20 },
        defaultRatio: "自适应尺寸",
        defaultCount: "1",
        defaultResolution: "1K"
      },
      {
        id: "smart",
        label: "智能模式",
        apiModel: "mock://translate-smart",
        logicNote: "使用翻译智能模型，可设置出图比例、固定1K分辨率和2张出图数量。",
        ratioOptions: defaultRatioOptions,
        countOptions: ["1", "2"],
        resolutionOptions: ["1K"],
        resolutionUnitCreditCosts: { "1K": 20 },
        defaultRatio: "自适应尺寸",
        defaultCount: "1",
        defaultResolution: "1K"
      },
      {
        id: "cn-growth",
        label: "中文增强",
        apiModel: "mock://translate-cn-growth",
        logicNote: "使用翻译中文增长模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        baseUnitCreditCost: 10,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      }
    ]
  },
  "three-view": {
    key: "three-view",
    title: "创作模式",
    showSupplement: false,
    supplementPlaceholder: "请输入三视图补充说明，例如：正侧背展示完整、保持一致光线、突出产品细节。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://three-view-basic",
        logicNote: "使用三视角普通模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: ["自适应尺寸", "1:1", "4:3", "3:2"],
        countOptions: ["1", "2"],
        baseUnitCreditCost: 2,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://three-view-pro",
        logicNote: "使用三视角高级模型，可设置出图比例、分辨率和出图数量三个维度参数。",
        ratioOptions: ["自适应尺寸", "1:1", "4:3", "3:2"],
        countOptions: ["1", "2"],
        resolutionOptions: defaultResolutionOptions,
        resolutionUnitCreditCosts: { "1K": 4, "2K": 6, "4K": 8 },
        defaultRatio: "自适应尺寸",
        defaultCount: "1",
        defaultResolution: "1K"
      }
    ]
  },
  background: {
    key: "background",
    title: "创作模式",
    showSupplement: true,
    supplementLabel: "细节补充",
    supplementPlaceholder: "请输入您对背景替换的细节补充，例如：突出空间纵深、保持主体边缘自然融合、加强商业感布光。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://background-basic",
        logicNote: "使用换背景基础模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        baseUnitCreditCost: 5,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://background-pro",
        logicNote: "使用换背景高级模型，可设置出图比例、分辨率和出图数量三个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        resolutionOptions: defaultResolutionOptions,
        resolutionUnitCreditCosts: { "1K": 10, "2K": 15, "4K": 20 },
        defaultRatio: "自适应尺寸",
        defaultCount: "1",
        defaultResolution: "1K"
      },
      {
        id: "text-enhanced",
        label: "文本增强",
        apiModel: "mock://background-text-enhanced",
        logicNote: "使用换背景文本增强模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        baseUnitCreditCost: 10,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      }
    ]
  },
  scene: {
    key: "scene",
    title: "创作模式",
    showSupplement: true,
    supplementLabel: "补充说明",
    supplementPlaceholder: "请输入场景图补充说明，例如：高级家居氛围、暖色晨光、突出产品主体与卖点。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://scene-basic",
        logicNote: "使用场景图普通模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        baseUnitCreditCost: 5,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://scene-pro",
        logicNote: "使用场景图高级模型，可设置出图比例、分辨率和出图数量三个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        resolutionOptions: defaultResolutionOptions,
        resolutionUnitCreditCosts: { "1K": 10, "2K": 15, "4K": 20 },
        defaultRatio: "自适应尺寸",
        defaultCount: "1",
        defaultResolution: "1K"
      },
      {
        id: "cn-enhanced",
        label: "中文增强",
        apiModel: "mock://scene-cn-enhanced",
        logicNote: "使用场景图中文增强模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        baseUnitCreditCost: 10,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      }
    ]
  },
  spoke: {
    key: "spoke",
    title: "创作模式",
    showSupplement: true,
    supplementLabel: "细节补充",
    supplementPlaceholder: "请输入代言图细节补充，例如：人物与产品关系自然、强调使用动作、突出品牌氛围与真实感。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://spoke-basic",
        logicNote: "使用代言图普通模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        baseUnitCreditCost: 5,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://spoke-pro",
        logicNote: "使用代言图高级模型，可设置出图比例、分辨率和出图数量三个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        resolutionOptions: defaultResolutionOptions,
        resolutionUnitCreditCosts: { "1K": 10, "2K": 15, "4K": 20 },
        defaultRatio: "自适应尺寸",
        defaultCount: "1",
        defaultResolution: "1K"
      },
      {
        id: "cn-enhanced",
        label: "中文增强",
        apiModel: "mock://spoke-cn-enhanced",
        logicNote: "使用代言图中文增强模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        baseUnitCreditCost: 10,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      }
    ]
  },
  "model-adjust": {
    key: "model-adjust",
    title: "创作方式",
    showSupplement: false,
    hideCountField: true,
    supplementPlaceholder: "请输入模特调整补充说明。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://model-adjust-basic",
        logicNote: "使用模特调整普通模型，可设置出图比例，结果固定输出1张。",
        ratioOptions: defaultRatioOptions,
        countOptions: ["1"],
        baseUnitCreditCost: 5,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://model-adjust-pro",
        logicNote: "使用模特调整高级模型，可设置出图比例和分辨率，结果固定输出1张。",
        ratioOptions: defaultRatioOptions,
        countOptions: ["1"],
        resolutionOptions: defaultResolutionOptions,
        resolutionUnitCreditCosts: { "1K": 10, "2K": 15, "4K": 20 },
        defaultRatio: "自适应尺寸",
        defaultCount: "1",
        defaultResolution: "1K"
      },
      {
        id: "cn-enhanced",
        label: "中文增强",
        apiModel: "mock://model-adjust-cn-enhanced",
        logicNote: "使用模特调整中文增强模型，可设置出图比例，结果固定输出1张。",
        ratioOptions: defaultRatioOptions,
        countOptions: ["1"],
        baseUnitCreditCost: 10,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      }
    ]
  },
  marketing: {
    key: "marketing",
    title: "创作模式",
    showSupplement: true,
    supplementLabel: "细节补充",
    supplementPlaceholder: "请输入营销主图的细节补充，例如：突出新品首发、大促价格标签、品牌主色和主视觉氛围。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://marketing-basic",
        logicNote: "使用营销主图普通模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        baseUnitCreditCost: 5,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://marketing-pro",
        logicNote: "使用营销主图高级模型，可设置出图比例、分辨率和出图数量三个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        resolutionOptions: defaultResolutionOptions,
        resolutionUnitCreditCosts: { "1K": 10, "2K": 15, "4K": 20 },
        defaultRatio: "自适应尺寸",
        defaultCount: "1",
        defaultResolution: "1K"
      },
      {
        id: "cn-enhanced",
        label: "中文增强",
        apiModel: "mock://marketing-cn-enhanced",
        logicNote: "使用营销主图中文增强模型，可设置出图比例和出图数量两个维度参数。",
        ratioOptions: defaultRatioOptions,
        countOptions: defaultCountOptions,
        baseUnitCreditCost: 10,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      }
    ]
  },
  expand: {
    key: "expand",
    title: "创作模式",
    showSupplement: true,
    hideRatioField: true,
    hideCountField: true,
    supplementLabel: "需求描述",
    supplementPlaceholder: "描述您希望扩展的内容，如：延伸自然风景、添加装饰元素、扩展建筑场景等",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://expand-normal",
        logicNote: "使用普通模型进行图片扩图。",
        ratioOptions: defaultRatioOptions,
        countOptions: ["1"],
        baseUnitCreditCost: 5,
        defaultRatio: "自适应尺寸",
        defaultCount: "1"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://expand-advanced",
        logicNote: "使用高级模型进行图片扩图。",
        ratioOptions: defaultRatioOptions,
        countOptions: ["1"],
        resolutionOptions: defaultResolutionOptions,
        resolutionUnitCreditCosts: { "1K": 10, "2K": 15, "4K": 20 },
        defaultRatio: "自适应尺寸",
        defaultCount: "1",
        defaultResolution: "1K"
      }
    ]
  },
  "set-pack": {
    key: "set-pack",
    title: "创作模式",
    showSupplement: false,
    hideCountField: true,
    supplementLabel: "运营补充",
    supplementPlaceholder: "请输入额外运营诉求，例如：更强调促销感、突出参数对比、补充礼赠场景或控制标题口吻。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://set-pack-normal",
        logicNote: "使用套图普通模型，可设置出图比例。",
        ratioOptions: defaultRatioOptions,
        countOptions: ["7"],
        baseUnitCreditCost: 5,
        defaultRatio: "1:1",
        defaultCount: "7"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://set-pack-advanced",
        logicNote: "使用套图高级模型，可设置出图比例和分辨率。",
        ratioOptions: defaultRatioOptions,
        countOptions: ["7"],
        resolutionOptions: defaultResolutionOptions,
        resolutionUnitCreditCosts: { "1K": 10, "2K": 15, "4K": 20 },
        defaultRatio: "1:1",
        defaultCount: "7",
        defaultResolution: "1K"
      },
      {
        id: "cn-enhanced",
        label: "中文增强",
        apiModel: "mock://set-pack-cn-enhanced",
        logicNote: "使用套图中文增强模型，可设置出图比例。",
        ratioOptions: defaultRatioOptions,
        countOptions: ["7"],
        baseUnitCreditCost: 15,
        defaultRatio: "1:1",
        defaultCount: "7"
      }
    ]
  },
  "video-replica": {
    key: "video-replica",
    title: "创作模式",
    showSupplement: true,
    supplementLabel: "视频描述",
    supplementPlaceholder: "请输入视频描述词，AI会结合参考视频的运镜节奏和产品图主体特征生成新视频",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://video-replica-normal",
        logicNote: "使用视频复刻普通模型。",
        ratioOptions: videoReplicaRatioOptions,
        countOptions: ["1"],
        resolutionOptions: videoReplicaResolutionOptions,
        resolutionUnitCreditCosts: { "480p": 1, "720p": 1 },
        defaultRatio: "竖9:16",
        defaultCount: "1",
        defaultResolution: "480p"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://video-replica-advanced",
        logicNote: "使用视频复刻高级模型。",
        ratioOptions: videoReplicaRatioOptions,
        countOptions: ["1"],
        resolutionOptions: videoReplicaResolutionOptions,
        resolutionUnitCreditCosts: { "480p": 1, "720p": 1 },
        defaultRatio: "竖9:16",
        defaultCount: "1",
        defaultResolution: "480p"
      }
    ]
  },
  "video-main": {
    key: "video-main",
    title: "创作模式",
    showSupplement: false,
    supplementPlaceholder: "请输入产品视频生成补充说明。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://video-main-normal",
        logicNote: "使用产品视频普通模型。",
        ratioOptions: videoReplicaRatioOptions,
        countOptions: ["1"],
        resolutionOptions: videoReplicaResolutionOptions,
        resolutionUnitCreditCosts: { "480p": 1, "720p": 1 },
        defaultRatio: "竖9:16",
        defaultCount: "1",
        defaultResolution: "480p"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://video-main-advanced",
        logicNote: "使用产品视频高级模型。",
        ratioOptions: videoReplicaRatioOptions,
        countOptions: ["1"],
        resolutionOptions: videoReplicaResolutionOptions,
        resolutionUnitCreditCosts: { "480p": 1, "720p": 1 },
        defaultRatio: "竖9:16",
        defaultCount: "1",
        defaultResolution: "480p"
      }
    ]
  },
  "video-replace": {
    key: "video-replace",
    title: "创作模式",
    showSupplement: true,
    supplementLabel: "视频描述",
    supplementPlaceholder: "请描述替换后的商品视频要求，例如：保留原视频动作和运镜不变，使用上传的多视角商品图替换原商品，重点确保结构一致、透视自然、手持接触真实。",
    supplementMaxLength: 2000,
    modes: [
      {
        id: "normal",
        label: "普通模式",
        apiModel: "mock://video-replace-normal",
        logicNote: "使用商品替换普通模型，基于参考视频与 1~5 张商品多视角图完成原商品替换，保留动作和运镜。",
        ratioOptions: videoReplicaRatioOptions,
        countOptions: ["1"],
        resolutionOptions: videoReplicaResolutionOptions,
        resolutionUnitCreditCosts: { "480p": 1, "720p": 1 },
        defaultRatio: "竖9:16",
        defaultCount: "1",
        defaultResolution: "480p"
      },
      {
        id: "advanced",
        label: "高级模式",
        apiModel: "mock://video-replace-advanced",
        logicNote: "使用商品替换高级模型，强化多镜头商品一致性、边缘融合、光影透视与商业成片稳定性。",
        ratioOptions: videoReplicaRatioOptions,
        countOptions: ["1"],
        resolutionOptions: videoReplicaResolutionOptions,
        resolutionUnitCreditCosts: { "480p": 1, "720p": 1 },
        defaultRatio: "竖9:16",
        defaultCount: "1",
        defaultResolution: "480p"
      }
    ]
  }
};

const defaultCreationModeConfigByToolKey = Object.fromEntries(defaultToolKeys.map((key) => [key, "default"])) as Record<string, string>;

const creationModeConfigByToolKey: Record<string, string> = {
  ...defaultCreationModeConfigByToolKey,
  "goods-white": "white",
  "goods-retouch": "retouch",
  "goods-translate": "scene",
  "goods-view": "three-view",
  "goods-bg": "background",
  "goods-marketing": "marketing",
  "goods-buyer": "default",
  "goods-scene": "scene",
  "goods-detail": "default",
  "goods-sell": "default",
  "goods-spoke": "spoke",
  "goods-point": "default",
  "set-replica": "spoke",
  "model-try": "default",
  "model-change": "model-adjust",
  "model-generate": "spoke",
  "video-replace": "video-replace"
};

const defaultToolModuleConfigs = Object.fromEntries(
  defaultToolKeys.map((key) => [
    key,
    {
      creationModeConfigKey: "default",
      uploads: {
        main: {
          label: "上传商品图",
          required: true,
          singleUploadMeta: "（单次最多上传{count}张）",
          hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
        }
      }
    } satisfies ToolModuleConfig
  ])
) as Record<string, ToolModuleConfig>;

const toolModuleConfigs: Record<string, ToolModuleConfig> = {
  ...defaultToolModuleConfigs,
  "set-main": {
    creationModeConfigKey: "set-pack",
    sectionOrder: ["upload-main", "set-pack-selling-points", "set-pack-strategy", "creation-mode", "set-pack-type-selector"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 3,
        singleUploadMeta: "（单次最多上传3张）",
        hintTemplate: "同一商品多视角图，最多3张"
      }
    }
  },
  "set-aplus": {
    creationModeConfigKey: "set-pack",
    sectionOrder: ["upload-main", "set-pack-selling-points", "set-pack-strategy", "creation-mode", "set-pack-type-selector"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 3,
        singleUploadMeta: "（单次最多上传3张）",
        hintTemplate: "同一商品多视角图，最多3张"
      }
    }
  },
  "more-title": {
    creationModeConfigKey: "more-title",
    sectionOrder: ["more-title-setup", "advanced-settings", "supplement"],
    advancedSettings: {
      title: "平台与标题策略",
      showAiAssist: false,
      fields: ["platform", "region", "language"],
      platformIds: moreTitlePlatformIds,
      extraSelects: [
        {
          key: "moreTitleKeywordStrategy",
          label: "关键词策略",
          options: moreTitleKeywordStrategyOptions,
          mode: "select"
        },
        {
          key: "moreTitleLengthPreference",
          label: "长度控制",
          options: moreTitleLengthOptions,
          mode: "select"
        },
        {
          key: "moreTitleOutputStyles",
          label: "输出倾向",
          options: moreTitleStyleOptions,
          mode: "multi-select",
          defaultValue: serializeMultiSelectValue(moreTitleStyleOptions)
        }
      ]
    },
    uploads: {
      main: {
        label: "批量商品数据",
        required: false,
        maxCount: 0
      }
    }
  },
  "goods-white": {
    creationModeConfigKey: "white",
    sectionOrder: ["upload-main", "creation-mode", "advanced-settings"],
    advancedSettings: {
      title: "高级设置",
      showAiAssist: true,
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "platformInfo",
          label: "平台信息",
          mode: "input-select",
          options: platformInfoInputOptions
        }
      ],
      conditionalDetailField: {
        triggerFieldKey: "platformInfo",
        label: "细节补充",
        placeholder: "请输入平台相关规则说明，例如：白底规范、边缘处理要求、阴影限制或主图尺寸要求。",
        detailVisibleValues: [goodsWhiteUniversalPlatformLabel],
        detailPresetByValue: {
          [goodsWhiteUniversalPlatformLabel]: goodsWhiteUniversalRulePreset
        }
      }
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "image-cutout": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "image-watermark": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main", "mode-choice", "mask-draw"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "image-remove": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main", "mask-draw"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传1张）",
        hintTemplate: "最多1张，支持JPG/PNG/WebP"
      }
    }
  },
  "image-upscale": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main", "image-upscale-resolution"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "image-lineart": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main", "image-lineart-style"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "image-expand": {
    creationModeConfigKey: "expand",
    sectionOrder: ["upload-main", "creation-mode", "supplement", "upload-reference"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      },
      reference: {
        label: "上传参考图",
        optional: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "goods-retouch": {
    creationModeConfigKey: "retouch",
    sectionOrder: ["upload-main", "mode-choice", "creation-mode", "advanced-settings", "supplement"],
    advancedSettings: {
      title: "高级设置",
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "platformInfo",
          label: "平台信息",
          mode: "input-select",
          options: platformInfoInputOptions
        },
        {
          key: "targetMarket",
          label: "目标市场",
          mode: "input-select",
          options: spokespersonTargetMarketOptions
        }
      ]
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "goods-translate": {
    creationModeConfigKey: "scene",
    sectionOrder: ["upload-main", "target-language", "creation-mode", "advanced-settings"],
    advancedSettings: {
      title: "高级设置",
      showAiAssist: false,
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "platformInfo",
          label: "平台信息",
          mode: "input-select",
          options: platformInfoInputOptions
        }
      ],
      conditionalDetailField: {
        triggerFieldKey: "platformInfo",
        label: "细节补充",
        placeholder: "请输入平台相关规则说明，例如：标题语言规范、价格展示要求、活动标签限制、版式注意事项。"
      }
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "goods-view": {
    creationModeConfigKey: "three-view",
    sectionOrder: ["upload-main", "camera-angle", "creation-mode", "advanced-settings"],
    advancedSettings: {
      title: "高级设置",
      showAiAssist: false,
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "platformInfo",
          label: "平台信息",
          mode: "input-select",
          options: platformInfoInputOptions
        }
      ],
      conditionalDetailField: {
        triggerFieldKey: "platformInfo",
        label: "细节补充",
        placeholder: "请输入平台相关规则说明，例如：主图视角要求、禁用元素、白底规范、尺寸或展示限制。"
      }
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "goods-bg": {
    creationModeConfigKey: "background",
    sectionOrder: ["upload-main", "creation-mode", "advanced-settings", "supplement"],
    advancedSettings: {
      title: "高级设置",
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "backgroundType",
          label: "背景类型",
          mode: "input-select",
          options: backgroundTypeInputOptions
        },
        {
          key: "lightingStyle",
          label: "风格与光影",
          mode: "input-select",
          options: backgroundLightingInputOptions
        }
      ]
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "goods-marketing": {
    creationModeConfigKey: "marketing",
    sectionOrder: ["upload-main", "creation-mode", "advanced-settings", "supplement", "upload-reference"],
    advancedSettings: {
      title: "高级设置",
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "productType",
          label: "产品类型",
          mode: "input-select",
          options: productTypeInputOptions
        },
        {
          key: "sceneBackground",
          label: "场景背景",
          mode: "input-select",
          options: sceneTypeInputOptions
        },
        {
          key: "platformInfo",
          label: "平台信息",
          mode: "input-select",
          options: platformInfoInputOptions
        },
        {
          key: "productInfo",
          label: "商品信息",
          mode: "input-select",
          options: productInfoInputOptions
        },
        {
          key: "visualStyle",
          label: "视觉风格",
          mode: "input-select",
          options: visualStyleInputOptions
        },
        {
          key: "marketingElements",
          label: "营销元素",
          mode: "input-select",
          options: marketingElementInputOptions
        },
        {
          key: "copyLanguage",
          label: "文案语种",
          mode: "input-select",
          options: copyLanguageInputOptions
        }
      ]
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      },
      reference: {
        label: "参考图",
        optional: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "goods-buyer": {
    creationModeConfigKey: "spoke",
    sectionOrder: ["upload-main", "creation-mode", "advanced-settings", "supplement", "upload-reference"],
    advancedSettings: {
      title: "高级设置",
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "productType",
          label: "产品类型",
          mode: "input-select",
          options: productTypeInputOptions
        },
        {
          key: "platformInfo",
          label: "平台信息",
          mode: "input-select",
          options: platformInfoInputOptions
        },
        {
          key: "productState",
          label: "产品状态",
          mode: "input-select",
          options: buyerShowProductStateOptions
        },
        {
          key: "presentationStyle",
          label: "呈现方式",
          mode: "input-select",
          options: buyerShowPresentationOptions
        },
        {
          key: "sceneAtmosphere",
          label: "场景氛围",
          mode: "input-select",
          options: buyerShowAtmosphereOptions
        },
        {
          key: "productReality",
          label: "产品真实感",
          mode: "input-select",
          options: buyerShowProductRealityOptions
        },
        {
          key: "environmentReality",
          label: "环境真实感",
          mode: "input-select",
          options: buyerShowEnvironmentRealityOptions
        },
        {
          key: "shotReality",
          label: "拍摄真实感",
          mode: "input-select",
          options: buyerShowShotRealityOptions
        },
        {
          key: "targetMarket",
          label: "目标市场",
          mode: "input-select",
          options: spokespersonTargetMarketOptions
        }
      ]
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      },
      reference: {
        label: "上传参考图",
        optional: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "goods-scene": {
    creationModeConfigKey: "scene",
    sectionOrder: ["upload-main", "creation-mode", "advanced-settings", "supplement"],
    advancedSettings: {
      title: "高级设置",
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "productType",
          label: "产品类型",
          mode: "input-select",
          options: productTypeInputOptions
        },
        {
          key: "platformInfo",
          label: "平台信息",
          mode: "input-select",
          options: platformInfoInputOptions
        },
        {
          key: "sceneType",
          label: "场景类型",
          mode: "input-select",
          options: sceneTypeInputOptions
        },
        {
          key: "productDisplay",
          label: "产品展示",
          options: ["单品特写", "多角度展示", "套装组合", "模特手持", "使用中展示", "局部细节", "悬浮陈列"]
        },
        {
          key: "layoutStyle",
          label: "排版呈现",
          options: ["居中构图", "左右分栏", "满版铺陈", "留白极简", "杂志感排版", "电商主图风"]
        },
        {
          key: "moodStyle",
          label: "氛围营造",
          options: ["清新明亮", "温暖治愈", "高级冷淡", "轻奢质感", "梦幻浪漫", "节日热卖", "科技未来"]
        },
        {
          key: "valueFocus",
          label: "价值导向",
          options: ["突出卖点", "突出品质", "突出价格优势", "突出礼赠属性", "突出实用性", "突出品牌感"]
        },
        {
          key: "targetMarket",
          label: "目标市场",
          options: sceneTargetMarketOptions
        },
        {
          key: "copyLanguage",
          label: "文案语种",
          options: sceneCopyLanguageOptions
        }
      ]
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "goods-detail": {
    creationModeConfigKey: "spoke",
    sectionOrder: ["upload-main", "creation-mode", "advanced-settings", "supplement", "upload-reference"],
    advancedSettings: {
      title: "高级设置",
      showAiAssist: false,
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "productType",
          label: "产品类型",
          mode: "input-select",
          options: productTypeInputOptions
        },
        {
          key: "displayType",
          label: "展示形式",
          mode: "input-select",
          options: sellingPointDisplayOptions
        }
      ]
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      },
      reference: {
        label: "上传参考图",
        optional: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "goods-sell": {
    creationModeConfigKey: "spoke",
    sectionOrder: ["upload-main", "creation-mode", "advanced-settings", "supplement", "upload-reference"],
    advancedSettings: {
      title: "高级设置",
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "productType",
          label: "产品类型",
          mode: "input-select",
          options: productTypeInputOptions
        },
        {
          key: "sceneType",
          label: "场景类型",
          mode: "input-select",
          options: sellingPointSceneTypeOptions
        },
        {
          key: "copyLanguage",
          label: "文案语种",
          mode: "input-select",
          options: copyLanguageInputOptions
        },
        {
          key: "coreSellingPoint",
          label: "核心卖点",
          mode: "input-select",
          options: sellingPointCoreCopyOptions
        },
        {
          key: "presentationForm",
          label: "表现形式",
          mode: "input-select",
          options: sellingPointPresentationOptions
        },
        {
          key: "sellingPointFocus",
          label: "卖点重心",
          mode: "input-select",
          options: sellingPointFocusOptions
        },
        {
          key: "mainTitle",
          label: "主副标题",
          mode: "input-select",
          options: sellingPointTitleOptions
        },
        {
          key: "subtitle",
          label: "副标题",
          mode: "input-select",
          options: sellingPointSubtitleOptions
        },
        {
          key: "fontStyle",
          label: "字体风格",
          mode: "input-select",
          options: sellingPointFontStyleOptions
        },
        {
          key: "assistElement",
          label: "元素辅助",
          mode: "input-select",
          options: sellingPointAssistElementOptions
        },
        {
          key: "targetMarket",
          label: "目标市场",
          mode: "input-select",
          options: spokespersonTargetMarketOptions
        }
      ]
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      },
      reference: {
        label: "上传参考图",
        optional: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "goods-spoke": {
    creationModeConfigKey: "spoke",
    sectionOrder: ["upload-main", "creation-mode", "advanced-settings", "supplement", "upload-reference"],
    advancedSettings: {
      title: "高级设置",
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "productType",
          label: "产品类型",
          mode: "input-select",
          options: productTypeInputOptions
        },
        {
          key: "interactionType",
          label: "互动方式",
          mode: "input-select",
          options: spokespersonInteractionOptions
        },
        {
          key: "characterTrait",
          label: "人物特点",
          mode: "input-select",
          options: spokespersonCharacterOptions
        },
        {
          key: "sceneBackground",
          label: "场景背景",
          mode: "input-select",
          options: spokespersonSceneBackgroundOptions
        },
        {
          key: "layoutStyle",
          label: "排版方式",
          mode: "input-select",
          options: spokespersonLayoutOptions
        },
        {
          key: "skinTone",
          label: "人种肤色",
          mode: "input-select",
          options: spokespersonSkinToneOptions
        },
        {
          key: "genderStyle",
          label: "性别风格",
          mode: "input-select",
          options: spokespersonGenderStyleOptions
        },
        {
          key: "ageTrait",
          label: "年龄特点",
          mode: "input-select",
          options: spokespersonAgeOptions
        },
        {
          key: "displayFocus",
          label: "展示重点",
          mode: "input-select",
          options: spokespersonFocusOptions
        },
        {
          key: "targetMarket",
          label: "目标市场",
          mode: "input-select",
          options: spokespersonTargetMarketOptions
        }
      ]
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      },
      reference: {
        label: "参考图",
        optional: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "set-replica": {
    creationModeConfigKey: "spoke",
    sectionOrder: ["upload-reference", "upload-main", "generation-rule-notice", "creation-mode", "advanced-settings", "supplement"],
    advancedSettings: {
      title: "高级设置",
      showAiAssist: false,
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "platformInfo",
          label: "使用平台",
          mode: "input-select",
          options: platformInfoInputOptions
        },
        {
          key: "replicaStrength",
          label: "复刻强度",
          options: ["低保真复刻", "平衡复刻", "高保真复刻"]
        },
        {
          key: "subjectConsistency",
          label: "主体一致性",
          options: ["标准一致", "严格一致"]
        },
        {
          key: "backgroundComplexity",
          label: "背景复杂度",
          options: ["低复杂", "中等复杂", "高复杂"]
        }
      ]
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      },
      reference: {
        label: "上传参考图",
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "set-fashion": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main", "baseline-model-setup", "advanced-settings"],
    modelGenerateTypes,
    advancedSettings: {
      title: "高级设置",
      showAiAssist: false,
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "platformInfo",
          label: "使用平台",
          mode: "input-select",
          options: platformInfoInputOptions
        }
      ]
    },
    uploads: {
      main: {
        label: "上传服装图片",
        required: true,
        maxCount: 5,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多5张，请上传同一件衣服不同视角图"
      }
    }
  },
  "video-replica": {
    creationModeConfigKey: "video-replica",
    sectionOrder: ["upload-video", "upload-main", "video-replica-setup", "supplement"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 5,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多5张，请上传同一产品多视角图片"
      },
      video: {
        label: "上传参考视频",
        required: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传{count}个）",
        hintTemplate: "请上传1个参考视频，时长2~15s，小于50M，支持MP4/MOV",
        maxFileSizeMb: 50,
        minDurationSeconds: 2,
        maxDurationSeconds: 15
      }
    }
  },
  "video-main": {
    creationModeConfigKey: "video-main",
    sectionOrder: ["upload-main", "video-replica-setup", "video-main-script-setup"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 5,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多5张，请上传同一产品多视角图片"
      }
    }
  },
  "video-replace": {
    creationModeConfigKey: "video-replace",
    sectionOrder: ["upload-video", "upload-main", "video-replica-setup", "supplement"],
    uploads: {
      main: {
        label: "上传替换商品图",
        required: true,
        maxCount: 5,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多5张，请上传同一商品的多视角图片，用于替换视频中的原商品"
      },
      video: {
        label: "上传原视频",
        required: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传{count}个）",
        hintTemplate: "请上传1个待替换商品的视频，时长2~15s，小于50M，支持MP4/MOV",
        maxFileSizeMb: 50,
        minDurationSeconds: 2,
        maxDurationSeconds: 15
      }
    }
  },
  "goods-point": {
    creationModeConfigKey: "default",
    advancedSettings: {
      title: "高级设置",
      fields: ["platform"],
      platformIds: ["taobao", "tmall", "jd", "pdd", "amazon", "temu"]
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "pod-crop": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main", "pod-crop-mode"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "pod-extract": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main", "pod-extract-setup"],
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "pod-partial-edit": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main", "pod-partial-edit-setup"],
    uploads: {
      main: {
        label: "上传素材",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      },
      reference: {
        label: "上传纹理图",
        optional: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传1张）",
        hintTemplate: "最多1张，支持JPG/PNG/WebP"
      }
    }
  },
  "pod-variation": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main", "pod-variation-setup"],
    uploads: {
      main: {
        label: "上传参考图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "pod-fusion": {
    creationModeConfigKey: "default",
    sectionOrder: ["pod-fusion-setup"],
    uploads: {
      main: {
        label: "添加素材",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "video-scene-grid": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main", "video-scene-grid-setup"],
    uploads: {
      main: {
        label: "上传素材",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "video-pattern-repeat": {
    creationModeConfigKey: "default",
    sectionOrder: ["video-pattern-repeat-setup"],
    uploads: {
      main: {
        label: "添加素材",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "video-print-extend": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main", "video-print-extend-setup"],
    uploads: {
      main: {
        label: "上传素材",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "video-style-print": {
    creationModeConfigKey: "default",
    sectionOrder: ["video-style-print-setup"],
    uploads: {
      main: {
        label: "添加素材",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      },
      reference: {
        label: "添加风格",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "video-2d3d": {
    creationModeConfigKey: "default",
    sectionOrder: ["upload-main", "video-2d3d-setup"],
    uploads: {
      main: {
        label: "添加素材",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "model-try": {
    creationModeConfigKey: "spoke",
    sectionOrder: ["model-try-setup", "creation-mode", "advanced-settings", "supplement", "upload-reference"],
    advancedSettings: {
      title: "高级设置",
      fields: [],
      platformIds: [],
      extraSelects: [
        {
          key: "productType",
          label: "产品类型",
          mode: "input-select",
          options: productTypeInputOptions
        },
        {
          key: "displayLayout",
          label: "展示排版",
          mode: "input-select",
          options: modelTryDisplayLayoutOptions
        },
        {
          key: "sceneType",
          label: "场景类型",
          mode: "input-select",
          options: modelTrySceneTypeOptions
        },
        {
          key: "displayFocus",
          label: "展示重点",
          mode: "input-select",
          options: modelTryDisplayFocusOptions
        },
        {
          key: "moodStyle",
          label: "氛围营造",
          mode: "input-select",
          options: modelTryAtmosphereOptions
        },
        {
          key: "copyLanguage",
          label: "文案语种",
          mode: "input-select",
          options: sceneCopyLanguageOptions
        },
        {
          key: "targetMarket",
          label: "目标市场",
          mode: "input-select",
          options: sceneTargetMarketOptions
        }
      ]
    },
    uploads: {
      main: {
        label: "上传商品图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      },
      reference: {
        label: "上传参考图",
        optional: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "model-change": {
    creationModeConfigKey: "model-adjust",
    sectionOrder: ["upload-main", "model-change-action", "creation-mode", "upload-reference"],
    modelAdjustActions: modelAdjustActionConfigs,
    uploads: {
      main: {
        label: "上传模特图",
        required: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      },
      reference: {
        label: "上传参考图",
        optional: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  },
  "model-generate": {
    creationModeConfigKey: "spoke",
    sectionOrder: ["model-generate-setup", "upload-main", "model-generate-parameters", "creation-mode", "upload-reference"],
    modelGenerateTypes,
    uploads: {
      main: {
        label: "上传模特图",
        required: true,
        maxCount: 24,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      },
      reference: {
        label: "上传参考图",
        optional: true,
        maxCount: 1,
        singleUploadMeta: "（单次最多上传{count}张）",
        hintTemplate: "最多{count}张，支持JPG/PNG/WebP"
      }
    }
  }
};

const libraryFolders: LibraryFolder[] = [
  { id: "channel", name: "渠道发展部" },
  { id: "brand", name: "品牌对外资料" },
  { id: "hr", name: "人力行政中心" },
  { id: "service", name: "中台支持中心" },
  { id: "creative", name: "创意服务中心" },
  { id: "product", name: "产研中心" },
  { id: "smb", name: "个人与SMB运营部" },
  { id: "market", name: "企业营销部" }
];

const libraryAssets: LibraryAsset[] = [
  { id: "asset-1", name: "女装新品白底主图", src: "/assets/task-gallery-4.png", sizeMb: 12, format: "PSD", folderId: "channel" },
  { id: "asset-2", name: "保温杯场景海报", src: "/assets/task-gallery-5.png", sizeMb: 8, format: "PNG", folderId: "brand" },
  { id: "asset-3", name: "耳机详情页KV", src: "/assets/task-gallery-6.png", sizeMb: 16, format: "AI", folderId: "creative" },
  { id: "asset-4", name: "家清组合促销封面", src: "/assets/task-gallery-7.png", sizeMb: 14, format: "PSD", folderId: "product", shared: true },
  { id: "asset-5", name: "鞋服上新电商横幅", src: "/assets/task-gallery-8.png", sizeMb: 10, format: "PNG", folderId: "service" },
  { id: "asset-6", name: "零食礼盒直播封面", src: "/assets/task-thumb-1.png", sizeMb: 9, format: "PNG", folderId: "market", shared: true },
  { id: "asset-7", name: "护肤品卖点长图", src: "/assets/task-thumb-2.png", sizeMb: 11, format: "PSD", folderId: "creative" },
  { id: "asset-8", name: "箱包通勤场景图", src: "/assets/upload-preview.png", sizeMb: 13, format: "AI", folderId: "hr" },
  {
    id: "asset-video-1",
    name: "耳机爆款复刻素材.mp4",
    src: "",
    previewSrc: "/assets/task-gallery-6.png",
    sizeMb: 24,
    format: "MP4",
    folderId: "creative",
    mediaKind: "video"
  },
  {
    id: "asset-video-2",
    name: "箱包种草短片.mov",
    src: "",
    previewSrc: "/assets/task-gallery-8.png",
    sizeMb: 32,
    format: "MOV",
    folderId: "market",
    mediaKind: "video",
    shared: true
  }
];

const sensitiveUploadPatterns = [
  /porn|sex|nsfw|nude|adult|xxx/i,
  /黄图|色情|成人视频|裸照|裸聊|成人视频|成人视频|成人视频|约炮|援交/,
  /casino|gambl|bet|lottery|poker|blackjack|roulette/i,
  /赌博|博彩|赌场|赌局|棋牌|彩票|下注|百家乐|德州/,
  /drug|cocaine|heroin|meth|weed|marijuana|opium|ecstasy/i,
  /毒品|吸毒|冰毒|海洛因|大麻|鸦片|摇头丸|可卡因/
];

function isSensitiveUpload(file: File) {
  const target = `${file.name} ${file.type}`.toLowerCase();
  return sensitiveUploadPatterns.some((pattern) => pattern.test(target));
}

function getLibraryMediaKindByFieldKey(fieldKey: string) {
  return fieldKey.endsWith(":video") ? "video" : "image";
}

function canRenderVideoPreview(src?: string) {
  if (!src) return false;
  return src.startsWith("blob:") || src.startsWith("data:video") || src.endsWith(".mp4") || src.endsWith(".mov");
}

function buildUploadItemsFromFiles(files: FileList | File[]) {
  return Array.from(files).map<UploadItem>((file) => {
    const objectUrl = URL.createObjectURL(file);
    return {
      id: generateRandomTenDigitId(),
      name: file.name,
      src: objectUrl,
      previewSrc: objectUrl,
      mediaKind: file.type.startsWith("video/") ? "video" : "image",
      format: (file.name.split(".").pop() ?? "PNG").toUpperCase() as UploadItem["format"],
      sizeMb: Number((file.size / (1024 * 1024)).toFixed(1)),
      status: "ready"
    };
  });
}

function cloneUploadItem(item: UploadItem): UploadItem {
  return {
    ...item,
    id: item.id || generateRandomTenDigitId()
  };
}

function TopBar({
  currentUser,
  credits,
  onOpenUserMenu,
  onOpenMembership,
  onOpenPointsBalance
}: {
  currentUser: UserTierProfile;
  credits: number;
  onOpenUserMenu: () => void;
  onOpenMembership: () => void;
  onOpenPointsBalance: () => void;
}) {
  return (
    <header className="ck-topbar">
      <div className="ck-topbar-left">
        <div className="ck-logo-wrap">
          <img alt="创客贴" className="ck-logo-mark-img" src={figmaIcons.topLogoMark} />
          <img alt="创客贴" className="ck-logo-word-img" src={figmaIcons.topLogoWord} />
        </div>
        <div className="ck-divider" />
        <div className="ck-channel">AI电商</div>
      </div>
      <div className="ck-topbar-right">
        <button className="ck-credit" onClick={onOpenPointsBalance} type="button">
          <img alt="" src={figmaIcons.creditGem} />
          {credits}
        </button>
        <button className="ck-vip" onClick={onOpenMembership} type="button">
          {currentUser.membershipButtonLabel}
        </button>
        <button className="ck-user-entry" onClick={onOpenUserMenu} type="button">
          <img alt={currentUser.name} className="ck-user-entry-avatar" src={currentUser.avatar} />
          <span className="ck-user-entry-copy">
            <strong>{currentUser.name}</strong>
            <em>{currentUser.label}</em>
          </span>
          <span className="ck-user-entry-caret">⌄</span>
        </button>
      </div>
    </header>
  );
}

function RailIcon({ type, active }: { type: PrimaryKey | "mine"; active?: boolean }) {
  if (type === "set") {
    return (
      <img
        alt=""
        className="ck-figma-icon set"
        src={active ? figmaIcons.ecommerceSetActive : figmaIcons.ecommerceSet}
      />
    );
  }

  if (type === "goods") {
    return (
      <span className="ck-figma-icon goods">
        <img alt="" className="goods-main" src={active ? figmaIcons.aiGoodsMainActive : figmaIcons.aiGoodsMain} />
        <img
          alt=""
          className="goods-badge"
          src={active ? figmaIcons.aiGoodsBadgeActive : figmaIcons.aiGoodsBadge}
        />
      </span>
    );
  }

  if (type === "model") {
    return <img alt="" className="ck-figma-icon model" src={active ? figmaIcons.modelActive : figmaIcons.model} />;
  }

  if (type === "video") {
    return (
      <span className="ck-figma-icon video">
        <img alt="" className="video-main" src={active ? figmaIcons.videoMainActive : figmaIcons.videoMain} />
        <img alt="" className="video-play" src={active ? figmaIcons.videoPlayActive : figmaIcons.videoPlay} />
      </span>
    );
  }

  if (type === "image") {
    return <img alt="" className="ck-figma-icon image" src={active ? figmaIcons.imageActive : figmaIcons.image} />;
  }

  if (type === "pod") {
    return (
      <span className="ck-figma-icon pod">
        <img alt="" className="pod-main" src={active ? figmaIcons.podActive : figmaIcons.pod} />
        <img alt="" className="pod-dot" src={active ? figmaIcons.podDotActive : figmaIcons.podDot} />
      </span>
    );
  }

  if (type === "mine") {
    return (
      <span className="ck-figma-icon mine">
        <img alt="" className="mine-body" src={active ? figmaIcons.mineBodyActive : figmaIcons.mineBody} />
        <img alt="" className="mine-head" src={active ? figmaIcons.mineHeadActive : figmaIcons.mineHead} />
      </span>
    );
  }

  return (
    <span className={`ck-figma-icon more${active ? " active" : ""}`}>
      <i />
      <i />
      <i />
    </span>
  );
}

function SideRail({
  activePrimary,
  isMineActive,
  onOpenMine,
  onSelectPrimary
}: {
  activePrimary: PrimaryKey;
  isMineActive: boolean;
  onOpenMine: () => void;
  onSelectPrimary: (key: PrimaryKey) => void;
}) {
  return (
    <aside className="ck-rail">
      <div className="ck-rail-list">
        {navGroups.map((item) => {
          const isActive = item.key === activePrimary;

          return (
            <button
              key={item.key}
              className={`ck-rail-item${isActive ? " active" : ""}`}
              onClick={() => onSelectPrimary(item.key)}
              type="button"
            >
              <span className={`ck-rail-icon-box${isActive ? " active" : ""}`}>
                <RailIcon active={isActive} type={item.key} />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <button className={`ck-rail-item bottom${isMineActive ? " active" : ""}`} onClick={onOpenMine} type="button">
        <span className={`ck-rail-icon-box${isMineActive ? " active" : ""}`}>
          <RailIcon active={isMineActive} type="mine" />
        </span>
        <span>我的</span>
      </button>
    </aside>
  );
}

function SecondaryMenu({
  title,
  tools,
  activeTool,
  collapsed,
  onSelectTool,
  onToggle
}: {
  title: string;
  tools: ToolConfig[];
  activeTool: string;
  collapsed: boolean;
  onSelectTool: (key: string) => void;
  onToggle: () => void;
}) {
  if (collapsed) {
    return (
      <aside className="ck-secondary collapsed">
        <button aria-label="展开工具栏" className="ck-collapse-handle expand" onClick={onToggle} type="button">
          <span className="ck-collapse-arrow expand">
            <img alt="" src={figmaIcons.collapse} />
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="ck-secondary">
      <div className="ck-secondary-inner">
        <div className="ck-secondary-title">{title}</div>
        <div className="ck-secondary-list">
          {tools.map((item, index) => (
            <button
              key={item.key}
              className={`ck-secondary-item${item.key === activeTool ? " active" : ""}${index === 8 ? " divider-top" : ""}`}
              onClick={() => onSelectTool(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <button aria-label="收起工具栏" className="ck-collapse-handle collapse" onClick={onToggle} type="button">
          <span className="ck-collapse-arrow collapse">
            <img alt="" src={figmaIcons.collapse} />
          </span>
        </button>
      </div>
    </aside>
  );
}

function MineSecondaryMenu({
  activeTab,
  onSelectTab
}: {
  activeTab: MineTab;
  onSelectTab: (tab: MineTab) => void;
}) {
  return (
    <aside className="ck-secondary mine">
      <div className="ck-secondary-inner">
        <div className="ck-secondary-title">我的</div>
        <div className="ck-secondary-list">
          <button className={`ck-secondary-item${activeTab === "creation" ? " active" : ""}`} onClick={() => onSelectTab("creation")} type="button">
            我的创作
          </button>
          <button className={`ck-secondary-item${activeTab === "models" ? " active" : ""}`} onClick={() => onSelectTab("models")} type="button">
            我的模特
          </button>
        </div>
      </div>
    </aside>
  );
}

function FieldTitle({
  label,
  required,
  optional,
  meta
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  meta?: string;
}) {
  return (
    <div className="ck-field-title">
      {label}
      {required ? <span>*</span> : null}
      {optional ? <em>（选填）</em> : null}
      {meta ? <em>{meta}</em> : null}
    </div>
  );
}

function UploadField({
  fieldKey,
  label,
  values,
  onAdd,
  onRemove,
  onEditItem,
  onRefreshItem,
  onOpenLibrary,
  onRejectedUpload,
  onAtLimit,
  required,
  optional,
  meta,
  prompt = "点击或拖拽上传",
  maxCount = DEFAULT_UPLOAD_LIMIT,
  remainingStorageMb,
  hint = `最多${maxCount}张，支持JPG/PNG/WebP`
}: {
  fieldKey: string;
  label: string;
  values: UploadItem[];
  onAdd: (fieldKey: string, nextValues: UploadItem[]) => void;
  onRemove: (fieldKey: string, index: number) => void;
  onEditItem?: (fieldKey: string, index: number) => void;
  onRefreshItem?: (fieldKey: string, index: number) => void;
  onOpenLibrary: (fieldKey: string) => void;
  onRejectedUpload: (message: string) => void;
  onAtLimit: () => void;
  required?: boolean;
  optional?: boolean;
  meta?: string;
  prompt?: string;
  hint?: string;
  maxCount?: number;
  remainingStorageMb: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const dragDepthRef = useRef(0);
  const canAddMore = values.length < maxCount;
  const totalTiles = values.length + (canAddMore ? 1 : 0);
  const visibleRows = Math.ceil(totalTiles / 2);
  const galleryHeight = Math.min(420, visibleRows * 124 + Math.max(0, visibleRows - 1) * 8);
  const [isDragging, setIsDragging] = useState(false);
  const [showFade, setShowFade] = useState(false);
  const [previewIds, setPreviewIds] = useState<string[]>([]);

  const activatePreview = (itemId: string) => {
    setPreviewIds((current) => (current.includes(itemId) ? current : [...current, itemId]));
  };

  const deactivatePreview = (itemId: string) => {
    setPreviewIds((current) => current.filter((id) => id !== itemId));
  };

  const refreshFade = () => {
    const gallery = galleryRef.current;
    if (!gallery) {
      setShowFade(false);
      return;
    }
    const maxScrollTop = gallery.scrollHeight - gallery.clientHeight;
    setShowFade(maxScrollTop > 1 && gallery.scrollTop < maxScrollTop - 1);
  };

  const openPicker = () => {
    if (!canAddMore) {
      onAtLimit();
      return;
    }
    inputRef.current?.click();
  };

  const appendFiles = (files: File[]) => {
    const candidateFiles = files.filter((file) => file.type.startsWith("image/"));
    const remainingCount = Math.max(0, maxCount - values.length);
    const filteredFiles = candidateFiles.filter((file) => !isSensitiveUpload(file));
    const countLimitedFiles = filteredFiles.slice(0, remainingCount);
    const storageFittedFiles: File[] = [];
    let availableStorageMb = remainingStorageMb;

    countLimitedFiles.forEach((file) => {
      const fileSizeMb = Math.max(0.1, Number((file.size / (1024 * 1024)).toFixed(1)));
      if (fileSizeMb <= availableStorageMb) {
        storageFittedFiles.push(file);
        availableStorageMb = Number(Math.max(0, availableStorageMb - fileSizeMb).toFixed(1));
      }
    });

    const safeFiles = storageFittedFiles;
    const rejectedCount = candidateFiles.length - safeFiles.length;
    if (rejectedCount > 0) {
      onRejectedUpload("图片未通过审核请重新上传");
    }
    if (!safeFiles.length) {
      if (filteredFiles.length > 0) {
        onAtLimit();
      }
      return;
    }
    const baseValues = values;
    const loadingItems = safeFiles.map((file) => ({
      id: generateRandomTenDigitId(),
      sizeMb: Math.max(0.1, Number((file.size / (1024 * 1024)).toFixed(1))),
      status: "loading" as const
    }));
    const nextList = [...loadingItems, ...baseValues];
    onAdd(fieldKey, nextList);
    Promise.all(
      safeFiles.map(
        (file, index) =>
          new Promise<UploadItem>((resolve) => {
            const reader = new FileReader();
            const itemId = loadingItems[index].id;
            reader.onload = () =>
              resolve({
                id: itemId,
                name: file.name,
                src: typeof reader.result === "string" ? reader.result : "",
                sizeMb: loadingItems[index].sizeMb,
                status: "ready"
              });
            reader.readAsDataURL(file);
          })
      )
    ).then((readyItems) => {
      onAdd(
        fieldKey,
        nextList.map((item) => readyItems.find((ready) => ready.id === item.id) ?? item)
      );
      if (filteredFiles.length > remainingCount) {
        onAtLimit();
      } else if (countLimitedFiles.length > storageFittedFiles.length) {
        onAtLimit();
      }
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    appendFiles(files);
    event.target.value = "";
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return;
    event.preventDefault();
    if (!canAddMore) {
      onAtLimit();
      return;
    }
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return;
    event.preventDefault();
    if (!canAddMore) {
      event.dataTransfer.dropEffect = "none";
      return;
    }
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (_event: DragEvent<HTMLDivElement>) => {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (!canAddMore) {
      onAtLimit();
      return;
    }
    appendFiles(Array.from(event.dataTransfer.files ?? []));
  };

  useEffect(() => {
    refreshFade();
  }, [values.length]);

  useEffect(() => {
    setPreviewIds((current) => current.filter((id) => values.some((item) => item.id === id)));
  }, [values]);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    const onScroll = () => refreshFade();
    gallery.addEventListener("scroll", onScroll);
    const resizeObserver = new ResizeObserver(() => refreshFade());
    resizeObserver.observe(gallery);
    refreshFade();

    return () => {
      gallery.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
    };
  }, [values.length]);

  return (
    <div
      className={`ck-form-block ck-upload-dropzone${isDragging ? " dragging" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <FieldTitle label={label} meta={meta} optional={optional} required={required} />
      <input accept="image/*" className="ck-upload-input" multiple onChange={handleFileChange} ref={inputRef} type="file" />
      {values.length === 0 ? (
        <div className={`ck-upload-box full${isDragging ? " dragging" : ""}`}>
          <div className="ck-upload-copy">
            <strong>{prompt}</strong>
            <span>{hint}</span>
          </div>
          <div className="ck-upload-actions">
            <button onClick={openPicker} type="button">
              <img alt="" src={figmaIcons.uploadLocal} />
              本地上传
            </button>
            <button onClick={() => onOpenLibrary(fieldKey)} type="button">
              <span className="ck-upload-library-icon">
                <img alt="" className="library-body" src={figmaIcons.uploadLibraryBody} />
                <img alt="" className="library-arrow" src={figmaIcons.uploadLibraryArrow} />
              </span>
              资源库
            </button>
          </div>
        </div>
      ) : (
        <div className="ck-upload-gallery-shell" style={{ height: `${galleryHeight}px` }}>
          <div className="ck-upload-gallery" ref={galleryRef} style={{ height: `${galleryHeight}px` }}>
            {isDragging && canAddMore ? (
              <div className="ck-upload-drop-overlay">
                <strong>拖拽到此处上传</strong>
                <span>{hint}</span>
              </div>
            ) : null}
            <div className="ck-upload-grid">
              {canAddMore ? (
                <div className={`ck-upload-box full compact${isDragging ? " dragging" : ""}`}>
                  <div className="ck-upload-actions">
                    <button onClick={openPicker} type="button">
                      <img alt="" src={figmaIcons.uploadLocal} />
                      本地上传
                    </button>
                    <button onClick={() => onOpenLibrary(fieldKey)} type="button">
                      <span className="ck-upload-library-icon">
                        <img alt="" className="library-body" src={figmaIcons.uploadLibraryBody} />
                        <img alt="" className="library-arrow" src={figmaIcons.uploadLibraryArrow} />
                      </span>
                      资源库
                    </button>
                  </div>
                </div>
              ) : null}
              {values.map((value, index) => (
                <div className={`ck-upload-filled${previewIds.includes(value.id) ? " previewing" : ""}`} key={`${fieldKey}-${index}`}>
                  {value.status === "ready" && value.src ? (
                    previewIds.includes(value.id) && value.maskDataUrl ? (
                      <div className="ck-upload-preview-stage">
                        <div className="ck-upload-preview-grid" />
                        <img
                          alt={`${label}${index + 1}`}
                          className="ck-upload-preview-image"
                          src={value.src}
                          style={{
                            WebkitMaskImage: `url(${value.maskDataUrl})`,
                            WebkitMaskSize: "100% 100%",
                            WebkitMaskRepeat: "no-repeat",
                            maskImage: `url(${value.maskDataUrl})`,
                            maskSize: "100% 100%",
                            maskRepeat: "no-repeat"
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <img alt={`${label}${index + 1}`} src={value.src} />
                        {value.maskDataUrl ? (
                          <span
                            className="ck-upload-mask-overlay"
                            style={{
                              WebkitMaskImage: `url(${value.maskDataUrl})`,
                              WebkitMaskSize: "100% 100%",
                              WebkitMaskRepeat: "no-repeat",
                              maskImage: `url(${value.maskDataUrl})`,
                              maskSize: "100% 100%",
                              maskRepeat: "no-repeat"
                            }}
                          />
                        ) : null}
                      </>
                    )
                  ) : (
                    <span className="ck-upload-loading" />
                  )}
                  {value.status === "ready" ? (
                    <div className="ck-upload-tools">
                      {onEditItem ? (
                        <button aria-label={value.maskDataUrl ? "优化选区" : "编辑选区"} className="ck-upload-tool-btn" onClick={() => onEditItem(fieldKey, index)} type="button">
                          ◌
                        </button>
                      ) : null}
                      <button aria-label="删除" className="ck-upload-tool-btn" onClick={() => onRemove(fieldKey, index)} type="button">
                        <img alt="" className="ck-upload-delete-bg" src={figmaIcons.deleteBg} />
                        <img alt="" className="ck-upload-delete-line" src={figmaIcons.deleteLine} />
                      </button>
                    </div>
                  ) : null}
                  {value.status === "ready" ? (
                    <button
                      className={`ck-upload-preview-btn${previewIds.includes(value.id) ? " active" : ""}`}
                      onPointerCancel={() => deactivatePreview(value.id)}
                      onPointerDown={() => activatePreview(value.id)}
                      onPointerLeave={() => deactivatePreview(value.id)}
                      onPointerUp={() => deactivatePreview(value.id)}
                      type="button"
                    >
                      预览
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {showFade ? <div className="ck-upload-gallery-fade" /> : null}
          </div>
        </div>
      )}
    </div>
  );
}

function UploadVideoField({
  fieldKey,
  label,
  values,
  onAdd,
  onRemove,
  onOpenLibrary,
  onRejectedUpload,
  onAtLimit,
  required,
  optional,
  meta,
  prompt = "点击或拖拽上传",
  maxCount = DEFAULT_UPLOAD_LIMIT,
  remainingStorageMb,
  hint = `最多${maxCount}个，支持MP4/MOV`,
  maxFileSizeMb,
  minDurationSeconds,
  maxDurationSeconds
}: {
  fieldKey: string;
  label: string;
  values: UploadItem[];
  onAdd: (fieldKey: string, nextValues: UploadItem[]) => void;
  onRemove: (fieldKey: string, index: number) => void;
  onOpenLibrary: (fieldKey: string) => void;
  onRejectedUpload: (message: string) => void;
  onAtLimit: () => void;
  required?: boolean;
  optional?: boolean;
  meta?: string;
  prompt?: string;
  hint?: string;
  maxCount?: number;
  remainingStorageMb: number;
  maxFileSizeMb?: number;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const dragDepthRef = useRef(0);
  const canAddMore = values.length < maxCount;
  const totalTiles = values.length + (canAddMore ? 1 : 0);
  const visibleRows = Math.ceil(totalTiles / 2);
  const galleryHeight = Math.min(420, visibleRows * 124 + Math.max(0, visibleRows - 1) * 8);
  const [isDragging, setIsDragging] = useState(false);
  const [showFade, setShowFade] = useState(false);

  const refreshFade = () => {
    const gallery = galleryRef.current;
    if (!gallery) {
      setShowFade(false);
      return;
    }
    const maxScrollTop = gallery.scrollHeight - gallery.clientHeight;
    setShowFade(maxScrollTop > 1 && gallery.scrollTop < maxScrollTop - 1);
  };

  const openPicker = () => {
    if (!canAddMore) {
      onAtLimit();
      return;
    }
    inputRef.current?.click();
  };

  const appendFiles = async (files: File[]) => {
    const candidateFiles = files.filter((file) => file.type.startsWith("video/") || /\.(mp4|mov)$/i.test(file.name));
    const remainingCount = Math.max(0, maxCount - values.length);
    const filteredFiles = candidateFiles.filter((file) => !isSensitiveUpload(file));
    const sizeLimitedFiles = filteredFiles.filter((file) => !maxFileSizeMb || file.size / (1024 * 1024) <= maxFileSizeMb);
    const countLimitedFiles = sizeLimitedFiles.slice(0, remainingCount);
    const validatedFiles: Array<{ file: File; durationSeconds: number }> = [];
    let availableStorageMb = remainingStorageMb;

    for (const file of countLimitedFiles) {
      const durationSeconds = await new Promise<number | null>((resolve) => {
        const objectUrl = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          const duration = Number.isFinite(video.duration) ? video.duration : null;
          URL.revokeObjectURL(objectUrl);
          resolve(duration);
        };
        video.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        video.src = objectUrl;
      });

      if (durationSeconds == null) {
        continue;
      }
      if ((minDurationSeconds && durationSeconds < minDurationSeconds) || (maxDurationSeconds && durationSeconds > maxDurationSeconds)) {
        continue;
      }

      const fileSizeMb = Math.max(0.1, Number((file.size / (1024 * 1024)).toFixed(1)));
      if (fileSizeMb > availableStorageMb) {
        continue;
      }

      validatedFiles.push({ file, durationSeconds });
      availableStorageMb = Number(Math.max(0, availableStorageMb - fileSizeMb).toFixed(1));
    }

    if (candidateFiles.length !== validatedFiles.length) {
      const durationHint =
        minDurationSeconds || maxDurationSeconds ? `，时长需在${minDurationSeconds ?? 0}~${maxDurationSeconds ?? "不限"}秒` : "";
      const sizeHint = maxFileSizeMb ? `，大小需小于${maxFileSizeMb}M` : "";
      onRejectedUpload(`视频未通过校验，请重新上传${durationHint}${sizeHint}`);
    }
    if (!validatedFiles.length) {
      if (filteredFiles.length > 0) {
        onAtLimit();
      }
      return;
    }

    const loadingItems = validatedFiles.map(({ file, durationSeconds }) => ({
      id: generateRandomTenDigitId(),
      name: file.name,
      sizeMb: Math.max(0.1, Number((file.size / (1024 * 1024)).toFixed(1))),
      status: "loading" as const,
      mediaKind: "video" as const,
      format: file.name.toLowerCase().endsWith(".mov") ? "MOV" : "MP4",
      durationSeconds
    }));
    const nextList = [...loadingItems, ...values];
    onAdd(fieldKey, nextList);

    Promise.all(
      validatedFiles.map(
        ({ file, durationSeconds }, index) =>
          Promise.resolve<UploadItem>({
            id: loadingItems[index].id,
            name: file.name,
            src: URL.createObjectURL(file),
            sizeMb: loadingItems[index].sizeMb,
            status: "ready",
            mediaKind: "video",
            format: loadingItems[index].format,
            durationSeconds
          })
      )
    ).then((readyItems) => {
      onAdd(
        fieldKey,
        nextList.map((item) => readyItems.find((ready) => ready.id === item.id) ?? item)
      );
      if (sizeLimitedFiles.length > remainingCount || countLimitedFiles.length > validatedFiles.length) {
        onAtLimit();
      }
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    void appendFiles(files);
    event.target.value = "";
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return;
    event.preventDefault();
    if (!canAddMore) {
      onAtLimit();
      return;
    }
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return;
    event.preventDefault();
    if (!canAddMore) {
      event.dataTransfer.dropEffect = "none";
      return;
    }
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (!canAddMore) {
      onAtLimit();
      return;
    }
    void appendFiles(Array.from(event.dataTransfer.files ?? []));
  };

  useEffect(() => {
    refreshFade();
  }, [values.length]);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    const onScroll = () => refreshFade();
    gallery.addEventListener("scroll", onScroll);
    const resizeObserver = new ResizeObserver(() => refreshFade());
    resizeObserver.observe(gallery);
    refreshFade();

    return () => {
      gallery.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
    };
  }, [values.length]);

  return (
    <div
      className={`ck-form-block ck-upload-dropzone${isDragging ? " dragging" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <FieldTitle label={label} meta={meta} optional={optional} required={required} />
      <input
        accept="video/mp4,video/quicktime,.mp4,.mov"
        className="ck-upload-input"
        multiple
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />
      {values.length === 0 ? (
        <div className={`ck-upload-box full${isDragging ? " dragging" : ""}`}>
          <div className="ck-upload-copy">
            <strong>{prompt}</strong>
            <span>{hint}</span>
          </div>
          <div className="ck-upload-actions">
            <button onClick={openPicker} type="button">
              <img alt="" src={figmaIcons.uploadLocal} />
              本地上传
            </button>
            <button onClick={() => onOpenLibrary(fieldKey)} type="button">
              <span className="ck-upload-library-icon">
                <img alt="" className="library-body" src={figmaIcons.uploadLibraryBody} />
                <img alt="" className="library-arrow" src={figmaIcons.uploadLibraryArrow} />
              </span>
              资源库
            </button>
          </div>
        </div>
      ) : (
        <div className="ck-upload-gallery-shell" style={{ height: `${galleryHeight}px` }}>
          <div className="ck-upload-gallery" ref={galleryRef} style={{ height: `${galleryHeight}px` }}>
            {isDragging && canAddMore ? (
              <div className="ck-upload-drop-overlay">
                <strong>拖拽到此处上传</strong>
                <span>{hint}</span>
              </div>
            ) : null}
            <div className="ck-upload-grid">
              {canAddMore ? (
                <div className={`ck-upload-box full compact${isDragging ? " dragging" : ""}`}>
                  <div className="ck-upload-actions">
                    <button onClick={openPicker} type="button">
                      <img alt="" src={figmaIcons.uploadLocal} />
                      本地上传
                    </button>
                    <button onClick={() => onOpenLibrary(fieldKey)} type="button">
                      <span className="ck-upload-library-icon">
                        <img alt="" className="library-body" src={figmaIcons.uploadLibraryBody} />
                        <img alt="" className="library-arrow" src={figmaIcons.uploadLibraryArrow} />
                      </span>
                      资源库
                    </button>
                  </div>
                </div>
              ) : null}
              {values.map((value, index) => (
                <div className="ck-upload-filled video" key={`${fieldKey}-${index}`}>
                  {value.status === "ready" ? (
                    canRenderVideoPreview(value.src) ? (
                      <video className="ck-upload-video" muted playsInline preload="metadata" src={value.src} />
                    ) : value.previewSrc ? (
                      <img alt={`${label}${index + 1}`} src={value.previewSrc} />
                    ) : (
                      <div className="ck-upload-video-fallback">{value.format ?? "VIDEO"}</div>
                    )
                  ) : (
                    <span className="ck-upload-loading" />
                  )}
                  {value.status === "ready" ? <span className="ck-upload-video-play" aria-hidden="true" /> : null}
                  {value.format ? <span className="ck-upload-video-format">{value.format}</span> : null}
                  {value.status === "ready" ? (
                    <button className="ck-upload-delete" onClick={() => onRemove(fieldKey, index)} type="button">
                      <img alt="" className="ck-upload-delete-bg" src={figmaIcons.deleteBg} />
                      <img alt="" className="ck-upload-delete-line" src={figmaIcons.deleteLine} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {showFade ? <div className="ck-upload-gallery-fade" /> : null}
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceLibraryModal({
  open,
  mediaKind,
  maxSelectable,
  onClose,
  onConfirm
}: {
  open: boolean;
  mediaKind: ResultMediaKind;
  maxSelectable: number;
  onClose: () => void;
  onConfirm: (items: UploadItem[]) => void;
}) {
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [searchValue, setSearchValue] = useState("");
  const [showChildAssets, setShowChildAssets] = useState(true);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const visibleAssets = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    return libraryAssets.filter((asset) => {
      const assetMediaKind = asset.mediaKind ?? "image";
      const matchesFolder = activeFolder === "all" || asset.folderId === activeFolder || showChildAssets;
      const matchesKeyword = !keyword || asset.name.toLowerCase().includes(keyword);
      return matchesFolder && matchesKeyword && assetMediaKind === mediaKind;
    });
  }, [activeFolder, mediaKind, searchValue, showChildAssets]);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setSearchValue("");
      setActiveFolder("all");
      setShowChildAssets(true);
      setFoldersExpanded(true);
    }
  }, [open]);

  if (!open) return null;

  const toggleAsset = (assetId: string) => {
    setSelectedIds((current) => {
      if (current.includes(assetId)) {
        return current.filter((id) => id !== assetId);
      }
      if (current.length >= maxSelectable) return current;
      return [...current, assetId];
    });
  };

  const handleConfirm = () => {
    const items = libraryAssets
      .filter((asset) => selectedIds.includes(asset.id))
      .slice(0, maxSelectable)
      .map<UploadItem>((asset) => ({
        id: generateRandomTenDigitId(),
        name: asset.name,
        src: asset.src,
        previewSrc: asset.previewSrc,
        mediaKind: asset.mediaKind ?? "image",
        format: asset.format,
        sizeMb: asset.sizeMb,
        status: "ready"
      }));
    onConfirm(items);
    onClose();
  };

  return (
    <div className="ck-library-mask" onClick={onClose}>
      <div className="ck-library-modal" onClick={(event) => event.stopPropagation()}>
        <div className="ck-library-header">
          <div className="ck-library-title">选择资源</div>
          <button aria-label="关闭资源库" className="ck-library-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="ck-library-body">
          <div className="ck-library-topbar">
            <div className="ck-library-topbar-main">
              <div className="ck-library-company">北京艺源酷科技有限公司 三</div>
            </div>

            <div className="ck-library-tools">
              <label className="ck-library-search">
                <input onChange={(event) => setSearchValue(event.target.value)} placeholder="搜索当前库" value={searchValue} />
                <span>⌕</span>
              </label>
              <button className="ck-library-upload" type="button">
                ＋ 上传
              </button>
              <div className="ck-library-progress">29.83%</div>
            </div>
          </div>

          <div className="ck-library-folder-bar">
            <button className="ck-library-breadcrumb" onClick={() => setFoldersExpanded((value) => !value)} type="button">
              {foldersExpanded ? "收起文件夹" : "展开文件夹"}
              <span>{foldersExpanded ? "▲" : "▼"}</span>
            </button>
            <div className="ck-library-folder-toggle">
              <label>
                <input checked={showChildAssets} onChange={() => setShowChildAssets((value) => !value)} type="checkbox" />
                <span>显示子文件夹内的资源</span>
              </label>
            </div>
          </div>

          {foldersExpanded ? (
            <>
              <div className="ck-library-folders">
                {libraryFolders.map((folder) => (
                  <button
                    className={`ck-library-folder${activeFolder === folder.id ? " active" : ""}`}
                    key={folder.id}
                    onClick={() => setActiveFolder(folder.id)}
                    type="button"
                  >
                    <span className="ck-folder-icon">
                      <i className="ck-folder-back" />
                      <i className="ck-folder-front" />
                    </span>
                    <span>{folder.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <div className="ck-library-filterbar">
            <div className="ck-library-filter-left">
              <strong>资源</strong>
              <button type="button">标签</button>
              <button type="button">创建人</button>
              <button type="button">时间</button>
            </div>
            <div className="ck-library-filter-right">
              <button type="button">创建时间</button>
              <span className="ck-library-grid-icon">◫</span>
            </div>
          </div>

          <div className="ck-library-assets">
            {visibleAssets.map((asset) => {
              const selected = selectedIds.includes(asset.id);
              return (
                <article
                  className={`ck-library-card${selected ? " selected" : ""}`}
                  key={asset.id}
                  onClick={() => toggleAsset(asset.id)}
                >
                  <div className="ck-library-thumb">
                    <img alt={asset.name} src={asset.previewSrc ?? asset.src} />
                    {(asset.mediaKind ?? "image") === "video" ? <span className="ck-library-video-play" aria-hidden="true" /> : null}
                    <span className={`ck-library-card-check${selected ? " selected" : ""}`} />
                    {asset.shared ? <span className="ck-library-share">分享中</span> : null}
                    <span className="ck-library-format">{asset.format}</span>
                  </div>
                  <div className="ck-library-card-title">{asset.name}</div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="ck-library-footer">
          <div className="ck-library-selected-tip">
            已选 {selectedIds.length} 项
            {maxSelectable > 0 ? `，最多可添加 ${maxSelectable} 项` : ""}
          </div>
          <div className="ck-library-footer-actions">
            <button className="ck-library-confirm" disabled={!selectedIds.length || maxSelectable === 0} onClick={handleConfirm} type="button">
              确定
            </button>
            <button className="ck-library-cancel" onClick={onClose} type="button">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SegmentedField({
  label,
  options,
  required,
  selected = 0,
  width = "full",
  onChange
}: {
  label: string;
  options: string[];
  required?: boolean;
  selected?: number;
  width?: "full" | "compact";
  onChange?: (index: number) => void;
}) {
  const className = width === "compact" ? "ck-mini-switch" : "ck-switch";

  return (
    <div className="ck-form-block">
      <FieldTitle label={label} required={required} />
      <div className={className} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map((option, index) => (
          <button className={index === selected ? "active" : ""} key={option} onClick={() => onChange?.(index)} type="button">
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  required,
  placeholder,
  fullWidth,
  hideLabel,
  width,
  className,
  options,
  onChange
}: {
  label: string;
  value?: string;
  required?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  hideLabel?: boolean;
  width?: number;
  className?: string;
  options?: string[];
  onChange?: (value: string) => void;
}) {
  const hasValue = Boolean(value);
  const displayValue = hasValue ? value ?? "" : placeholder ?? "";
  const muted = !hasValue;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const widthStyle = width ? { width: `${width}px` } : undefined;
  const [openDirection, setOpenDirection] = useState<"up" | "down">("down");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useEffect(() => {
    setOpen(false);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const updateMenuPlacement = () => {
      const triggerRect = dropdownRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const panelElement = dropdownRef.current?.closest(".ck-panel");
      const footerElement = panelElement?.querySelector(".ck-panel-footer") as HTMLElement | null;
      const footerRect = footerElement?.getBoundingClientRect();
      const lowerBoundary = footerRect ? footerRect.top - 8 : window.innerHeight - 16;
      const upperBoundary = 16;
      const spaceBelow = lowerBoundary - triggerRect.bottom - 6;
      const spaceAbove = triggerRect.top - upperBoundary - 6;
      const availableBelow = Math.max(120, Math.floor(spaceBelow));
      const availableAbove = Math.max(120, Math.floor(spaceAbove));

      const sharedStyle: CSSProperties = {
        left: triggerRect.left,
        width: triggerRect.width,
        position: "fixed",
        zIndex: 100130
      };

      if (spaceBelow < 220 && spaceAbove > spaceBelow) {
        setOpenDirection("up");
        setMenuStyle({
          ...sharedStyle,
          bottom: window.innerHeight - triggerRect.top + 6,
          maxHeight: Math.min(220, availableAbove)
        });
        return;
      }

      setOpenDirection("down");
      setMenuStyle({
        ...sharedStyle,
        top: triggerRect.bottom + 6,
        maxHeight: Math.min(220, availableBelow)
      });
    };

    updateMenuPlacement();

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", updateMenuPlacement);
    window.addEventListener("scroll", updateMenuPlacement, true);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("resize", updateMenuPlacement);
      window.removeEventListener("scroll", updateMenuPlacement, true);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div className={`ck-form-block${fullWidth ? " ck-form-block-full" : ""}${className ? ` ${className}` : ""}`}>
      <div className={fullWidth ? "" : "ck-inline-field"}>
        {hideLabel ? null : <FieldTitle label={label} required={required} />}
        <div className={`ck-select-dropdown${fullWidth ? " full" : ""}`} ref={dropdownRef} style={widthStyle}>
          <button
            className={`ck-select${fullWidth ? " full" : ""}${muted ? " placeholder" : ""}`}
            onClick={() => setOpen((current) => !current)}
            style={widthStyle}
            type="button"
          >
            {displayValue}
            <span>⌄</span>
          </button>
          {open && options?.length ? (
            <div className={`ck-select-dropdown-menu${fullWidth ? " full" : ""}${openDirection === "up" ? " up" : ""}`} style={menuStyle}>
              {options.map((option) => (
                <button
                  className={option === value ? "active" : ""}
                  key={option}
                  onClick={() => {
                    onChange?.(option);
                    setOpen(false);
                  }}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RichSelectField({
  label,
  value,
  required,
  placeholder,
  fullWidth,
  className,
  options,
  onChange
}: {
  label: string;
  value?: string;
  required?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  className?: string;
  options: RichSelectOption[];
  onChange?: (value: string) => void;
}) {
  const activeOption = options.find((option) => option.value === value);
  const displayValue = activeOption?.displayLabel ?? placeholder ?? "";
  const muted = !activeOption;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [openDirection, setOpenDirection] = useState<"up" | "down">("down");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useEffect(() => {
    setOpen(false);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const updateMenuPlacement = () => {
      const triggerRect = dropdownRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const panelElement = dropdownRef.current?.closest(".ck-panel");
      const footerElement = panelElement?.querySelector(".ck-panel-footer") as HTMLElement | null;
      const footerRect = footerElement?.getBoundingClientRect();
      const lowerBoundary = footerRect ? footerRect.top - 8 : window.innerHeight - 16;
      const upperBoundary = 16;
      const spaceBelow = lowerBoundary - triggerRect.bottom - 6;
      const spaceAbove = triggerRect.top - upperBoundary - 6;
      const availableBelow = Math.max(120, Math.floor(spaceBelow));
      const availableAbove = Math.max(120, Math.floor(spaceAbove));
      const sharedStyle: CSSProperties = {
        left: triggerRect.left,
        width: triggerRect.width,
        maxHeight: Math.min(420, openDirection === "up" ? availableAbove : availableBelow),
        position: "fixed",
        zIndex: 40
      };

      if (spaceBelow < 260 && spaceAbove > spaceBelow) {
        setOpenDirection("up");
        setMenuStyle({
          ...sharedStyle,
          bottom: window.innerHeight - triggerRect.top + 6,
          maxHeight: Math.min(420, availableAbove)
        });
        return;
      }

      setOpenDirection("down");
      setMenuStyle({
        ...sharedStyle,
        top: triggerRect.bottom + 6,
        maxHeight: Math.min(420, availableBelow)
      });
    };

    updateMenuPlacement();

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", updateMenuPlacement);
    window.addEventListener("scroll", updateMenuPlacement, true);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("resize", updateMenuPlacement);
      window.removeEventListener("scroll", updateMenuPlacement, true);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div className={`ck-form-block${fullWidth ? " ck-form-block-full" : ""}${className ? ` ${className}` : ""}`}>
      <div className={fullWidth ? "" : "ck-inline-field"}>
        <FieldTitle label={label} required={required} />
        <div className={`ck-select-dropdown${fullWidth ? " full" : ""}`} ref={dropdownRef}>
          <button className={`ck-select${fullWidth ? " full" : ""}${muted ? " placeholder" : ""}`} onClick={() => setOpen((current) => !current)} type="button">
            <span className="ck-rich-select-trigger-label">{displayValue}</span>
            <span>⌄</span>
          </button>
          {open ? (
            <div
              className={`ck-select-dropdown-menu ck-rich-select-menu${fullWidth ? " full" : ""}${openDirection === "up" ? " up" : ""}`}
              style={menuStyle}
            >
              {options.map((option) => (
                <button
                  className={`ck-rich-select-option${option.value === value ? " active" : ""}`}
                  key={option.value}
                  onClick={() => {
                    onChange?.(option.value);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <span className="ck-rich-select-copy">
                    <strong>{option.title}</strong>
                    <span className="ck-rich-select-recommendation">{option.recommendation}</span>
                    <span className="ck-rich-select-description">{option.description}</span>
                  </span>
                  {option.thumbnailSrc ? (
                    <span className="ck-rich-select-thumb">
                      <img alt={option.title} src={option.thumbnailSrc} />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InputSelectInlineField({
  label,
  placeholder,
  value,
  options,
  required,
  dropdownWidth,
  labelNoWrap,
  className,
  onChange
}: {
  label: string;
  placeholder?: string;
  value: string;
  options: string[];
  required?: boolean;
  dropdownWidth?: number;
  labelNoWrap?: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const widthStyle = dropdownWidth ? { width: `${dropdownWidth}px` } : undefined;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className={`ck-inline-field${className ? ` ${className}` : ""}`}>
      <div style={labelNoWrap ? { flex: "0 0 auto", whiteSpace: "nowrap", marginRight: "12px" } : undefined}>
        <FieldTitle label={label} required={required} />
      </div>
      <div className={dropdownWidth ? "ck-select-dropdown" : "ck-select-dropdown full"} ref={containerRef} style={widthStyle}>
        <div
          className={`ck-input-select${value ? " has-value" : ""}${open ? " active" : ""}`}
          onClick={() => {
            if (!open) setOpen(true);
          }}
        >
          <input
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => {
              if (!open) setOpen(true);
            }}
            placeholder={placeholder ?? "请选择，或直接输入"}
            value={value}
          />
          {value ? (
            <button
              className="ck-input-select-clear"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
                setOpen(false);
              }}
              type="button"
            >
              ×
            </button>
          ) : null}
        </div>
        {open ? (
          <div className={dropdownWidth ? "ck-select-dropdown-menu" : "ck-select-dropdown-menu full"} style={widthStyle}>
            {options.map((option) => (
              <button
                className={option === value ? "active" : ""}
                key={option}
                onClick={() => {
                  setOpen(false);
                  onChange(option);
                }}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InputSelectField({
  label,
  value,
  options,
  required,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="ck-form-block">
      <InputSelectInlineField
        className="ck-input-select-field"
        label={label}
        onChange={onChange}
        options={options}
        required={required}
        value={value}
      />
    </div>
  );
}

function TextInputField({
  label,
  value,
  placeholder,
  required,
  onChange
}: {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="ck-form-block">
      <FieldTitle label={label} required={required} />
      <div className="ck-input-select has-value">
        <input onChange={(event) => onChange(event.target.value)} placeholder={placeholder ?? "请输入"} value={value} />
      </div>
    </div>
  );
}

function CountField({
  label,
  options,
  required,
  value,
  onChange
}: {
  label: string;
  options: string[];
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const normalizedOptions = options.slice(0, 4);
  const width = normalizedOptions.length <= 1 ? 58 : normalizedOptions.length === 2 ? 120 : normalizedOptions.length === 3 ? 132 : 176;

  return (
    <div className="ck-inline-field">
      <FieldTitle label={label} required={required} />
      <div className="ck-mini-switch count" style={{ gridTemplateColumns: `repeat(${normalizedOptions.length}, 1fr)`, width }}>
        {normalizedOptions.map((option, index) => (
          <button className={option === value || (!value && index === 0) ? "active" : ""} key={option} onClick={() => onChange?.(option)} type="button">
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberStepperField({
  label,
  required,
  value,
  min = 1,
  max = 20,
  onChange
}: {
  label: string;
  required?: boolean;
  value: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
}) {
  return (
    <div className="ck-inline-field ck-number-stepper-field">
      <FieldTitle label={label} required={required} />
      <div className="ck-number-stepper">
        <button disabled={value <= min} onClick={() => onChange?.(Math.max(min, value - 1))} type="button">
          −
        </button>
        <div className="ck-number-stepper-value">{value}</div>
        <button disabled={value >= max} onClick={() => onChange?.(Math.min(max, value + 1))} type="button">
          +
        </button>
      </div>
    </div>
  );
}

function BasicGenerateSettingsSection({
  config,
  onSelectionChange,
  value
}: {
  config: CreationModeConfig;
  onSelectionChange?: (selection: CreationModeSelection) => void;
  value?: CreationModeSelection | null;
}) {
  const activeMode = config.modes[0];
  const [ratioOpen, setRatioOpen] = useState(false);
  const ratioDropdownRef = useRef<HTMLDivElement | null>(null);
  const [selectedRatio, setSelectedRatio] = useState(activeMode?.defaultRatio ?? activeMode?.ratioOptions[0] ?? "");
  const [selectedCount, setSelectedCount] = useState(activeMode?.defaultCount ?? activeMode?.countOptions[0] ?? "");

  useEffect(() => {
    if (!activeMode) return;
    setSelectedRatio(activeMode.defaultRatio ?? activeMode.ratioOptions[0] ?? "");
    setSelectedCount(activeMode.defaultCount ?? activeMode.countOptions[0] ?? "");
    setRatioOpen(false);
  }, [activeMode]);

  useEffect(() => {
    if (!value) return;
    setSelectedRatio(value.ratio);
    setSelectedCount(String(value.count));
    setRatioOpen(false);
  }, [value]);

  useEffect(() => {
    if (!ratioOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!ratioDropdownRef.current?.contains(event.target as Node)) {
        setRatioOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [ratioOpen]);

  useEffect(() => {
    if (!activeMode) return;
    onSelectionChange?.({
      modeId: activeMode.id,
      modeLabel: activeMode.label,
      ratio: selectedRatio,
      count: Number(selectedCount) || 1,
      unitCreditCost: activeMode.baseUnitCreditCost ?? 0
    });
  }, [activeMode, onSelectionChange, selectedCount, selectedRatio]);

  if (!activeMode) return null;

  return (
    <>
      <div className="ck-inline-field">
        <FieldTitle label="出图比例" required />
        <div className="ck-select-dropdown" ref={ratioDropdownRef}>
          <button className="ck-select" onClick={() => setRatioOpen((current) => !current)} type="button">
            {selectedRatio}
            <span>⌄</span>
          </button>
          {ratioOpen ? (
            <div className="ck-select-dropdown-menu">
              {activeMode.ratioOptions.map((option) => (
                <button
                  className={option === selectedRatio ? "active" : ""}
                  key={option}
                  onClick={() => {
                    setSelectedRatio(option);
                    setRatioOpen(false);
                  }}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <CountField label="出图数量" onChange={setSelectedCount} options={activeMode.countOptions} required value={selectedCount} />
    </>
  );
}

function UnifiedTextareaField({
  value,
  onChange,
  placeholder,
  maxLength,
  label,
  required,
  optional,
  header,
  formBlockClassName = "ck-form-block",
  textareaWrapClassName = "",
  textareaClassName = "",
  footerClassName = "",
  actions,
  hideCount,
  counterText,
  style,
  textareaProps
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
  label?: string;
  required?: boolean;
  optional?: boolean;
  header?: ReactNode;
  formBlockClassName?: string;
  textareaWrapClassName?: string;
  textareaClassName?: string;
  footerClassName?: string;
  actions?: ReactNode;
  hideCount?: boolean;
  counterText?: string;
  style?: CSSProperties;
  textareaProps?: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "maxLength" | "onChange" | "placeholder" | "value">;
}) {
  return (
    <div className={formBlockClassName} style={style}>
      {header ? header : label ? <FieldTitle label={label} optional={optional} required={required} /> : null}
      <div className={`ck-textarea-wrap${textareaWrapClassName ? ` ${textareaWrapClassName}` : ""}`}>
        <textarea
          {...textareaProps}
          className={textareaClassName || undefined}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
        <div className={`ck-textarea-actions${footerClassName ? ` ${footerClassName}` : ""}`}>
          {actions}
          {hideCount ? null : <span>{counterText ?? `${value.length}/${maxLength}`}</span>}
        </div>
      </div>
    </div>
  );
}

function SupplementField({
  label,
  placeholder,
  maxLength,
  value,
  onChange,
  formBlockClassName = "ck-form-block",
  aiPolishConfig,
  onAiPolish,
  onToast
}: {
  label?: string;
  placeholder: string;
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
  formBlockClassName?: string;
  aiPolishConfig?: SupplementAiPolishConfig;
  onAiPolish?: (value: string) => Promise<SupplementAiPolishResult>;
  onToast: (message: string, tone?: "warning") => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [polishResult, setPolishResult] = useState<SupplementAiPolishResult | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const detectedLanguage = detectSupplementLanguage(value);

  useEffect(() => {
    if (!popoverOpen) return;

    const updatePopoverPosition = () => {
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      if (!buttonRect) return;

      const panelElement = buttonRef.current?.closest(".ck-panel");
      const footerElement = panelElement?.querySelector(".ck-panel-footer") as HTMLElement | null;
      const panelRect = panelElement?.getBoundingClientRect();
      const footerRect = footerElement?.getBoundingClientRect();
      const popoverWidth = 280;
      const popoverHeight = 336;
      const gap = 12;
      const viewportPadding = 16;
      const leftBoundary = panelRect ? Math.max(viewportPadding, panelRect.right + gap) : viewportPadding;
      const topBoundary = panelRect ? Math.max(viewportPadding, panelRect.top) : viewportPadding;
      const bottomBoundary = footerRect ? Math.max(topBoundary, footerRect.top - gap) : window.innerHeight - viewportPadding;
      const availableRight = window.innerWidth - buttonRect.right;
      const availableLeft = buttonRect.left;
      const availableBelow = bottomBoundary - buttonRect.bottom;
      const availableAbove = buttonRect.top - topBoundary;
      const prefersRight = availableRight >= popoverWidth + gap;
      const prefersLeft = !prefersRight && availableLeft >= popoverWidth + gap;
      const nextLeft =
        prefersRight
          ? buttonRect.right + gap
          : prefersLeft
            ? buttonRect.left - popoverWidth - gap
            : Math.max(leftBoundary, Math.min(buttonRect.left, window.innerWidth - popoverWidth - viewportPadding));
      const nextTop =
        availableBelow >= popoverHeight + gap
          ? buttonRect.top
          : availableAbove >= popoverHeight + gap
            ? buttonRect.bottom - popoverHeight
            : Math.max(topBoundary, Math.min(buttonRect.top - popoverHeight / 2, bottomBoundary - popoverHeight));

      setPopoverStyle({
        left: `${nextLeft}px`,
        top: `${nextTop}px`
      });
    };

    updatePopoverPosition();
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [isGenerating, polishResult, popoverOpen]);

  useEffect(() => {
    if (!popoverOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [popoverOpen]);

  const handleGeneratePolish = async () => {
    if (!value.trim()) {
      onToast("请先输入细节补充后再润色", "warning");
      return;
    }
    if (!onAiPolish || !aiPolishConfig) return;
    if (!supplementVisualKeywordPattern.test(value.trim()) && value.trim().length < 6) {
      onToast("请补充产品卖点、构图、氛围或营销信息相关描述 后再润色", "warning");
      return;
    }

    setPopoverOpen(true);
    setIsGenerating(true);
    const nextResult = await onAiPolish(value);
    setPolishResult(nextResult);
    setIsGenerating(false);
  };

  return (
    <UnifiedTextareaField
      formBlockClassName={formBlockClassName}
      actions={
        aiPolishConfig ? (
          <div className="ck-ai-polish" ref={containerRef}>
            <button onClick={handleGeneratePolish} ref={buttonRef} type="button">
              AI润色
            </button>
            {popoverOpen ? (
              <div className={`ck-ai-polish-popover${isGenerating ? " is-generating" : ""}`} style={popoverStyle}>
                <div className="ck-ai-polish-popover-head">
                  <div>
                    <strong>AI润色</strong>
                  </div>
                  <button className="ck-ai-polish-close" onClick={() => setPopoverOpen(false)} type="button">
                    ×
                  </button>
                </div>
                <div className="ck-ai-polish-popover-body">
                  {isGenerating ? (
                    <div className="ck-ai-polish-loading">
                      <div className="ck-ai-polish-loading-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                      <strong>AI 深度思考中...</strong>
                    </div>
                  ) : (
                    <div className="ck-ai-polish-result">
                      {detectedLanguage === "en" && (polishResult?.applyEnglishContent || polishResult?.englishText) ? (
                        <div className="ck-ai-polish-result-block">
                          <p>{polishResult.applyEnglishContent ?? polishResult.englishText}</p>
                        </div>
                      ) : null}
                      {detectedLanguage !== "en" && (polishResult?.applyContent || polishResult?.chineseText) ? (
                        <div className="ck-ai-polish-result-block">
                          <p>{polishResult.applyContent ?? polishResult.chineseText}</p>
                        </div>
                      ) : null}
                      {((detectedLanguage === "en" && !polishResult?.englishText) ||
                        (detectedLanguage !== "en" && !polishResult?.chineseText)) ? (
                        <pre>{polishResult?.content ?? "点击重新润色后可再次优化当前文案。"}</pre>
                      ) : null}
                    </div>
                  )}
                </div>
                {isGenerating ? (
                  <div className="ck-ai-polish-popover-actions loading">
                    <button className="loading-indicator" disabled type="button">
                      正在润色
                    </button>
                  </div>
                ) : (
                  <div className="ck-ai-polish-popover-actions">
                    <button
                      className="secondary"
                      disabled={isGenerating}
                      onClick={handleGeneratePolish}
                      type="button"
                    >
                      重新润色
                    </button>
                    <button
                      disabled={isGenerating || !polishResult?.canUse}
                      onClick={() => {
                        if (!polishResult?.canUse) return;
                        onChange(
                          detectedLanguage === "en"
                            ? polishResult.applyEnglishContent ?? polishResult.englishText ?? polishResult.applyContent ?? polishResult.content
                            : polishResult.applyContent ?? polishResult.content
                        );
                        setPopoverOpen(false);
                      }}
                      type="button"
                    >
                      确认
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null
      }
      label={label ?? "补充说明"}
      maxLength={maxLength}
      onChange={onChange}
      optional
      placeholder={placeholder}
      value={value}
    />
  );
}

function AdaptiveChoiceField({
  label,
  options,
  value,
  required,
  columns,
  onChange
}: {
  label: string;
  options: Array<{ key: string; label: string }>;
  value: string;
  required?: boolean;
  columns?: number;
  onChange: (value: string) => void;
}) {
  const resolvedColumns = Math.max(1, Math.min(columns ?? 3, options.length));

  return (
    <div className="ck-form-block">
      {label ? <FieldTitle label={label} required={required} /> : null}
      <div className="ck-adaptive-choice-grid" style={{ gridTemplateColumns: `repeat(${resolvedColumns}, minmax(0, 1fr))` }}>
        {options.map((option) => (
          <button
            className={`ck-adaptive-choice-item${option.key === value ? " active" : ""}`}
            key={option.key}
            onClick={() => onChange(option.key)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PodCropModeSection({
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onCreationModeChange
}: {
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onCreationModeChange?: (selection: CreationModeSelection) => void;
}) {
  const [mode, setMode] = useState(selectedValues?.podCropMode ?? podCropModeOptions[0].key);

  useEffect(() => {
    if (selectedValues?.podCropMode && selectedValues.podCropMode !== mode) {
      setMode(selectedValues.podCropMode);
    }
  }, [selectedValues]);

  useEffect(() => {
    const unitCreditCost =
      {
        "通用": 5,
        "铁皮画": 10,
        "装饰画": 15
      }[mode] ?? 5;
    onSelectionChange?.([mode]);
    onSelectionMapChange?.({ podCropMode: mode });
    onCreationModeChange?.({
      modeId: "pod-crop",
      modeLabel: mode,
      ratio: "1:1",
      count: 1,
      unitCreditCost
    });
  }, [mode, onCreationModeChange, onSelectionChange, onSelectionMapChange]);

  return <AdaptiveChoiceField label="选择模式" onChange={setMode} options={podCropModeOptions} required value={mode} />;
}

function PodExtractSetupSection({
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onCreationModeChange
}: {
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onCreationModeChange?: (selection: CreationModeSelection) => void;
}) {
  const defaultMode: PodExtractModeKey =
    selectedValues?.podExtractMode === "专项提取" || selectedValues?.podExtractMode === "全能提取" ? selectedValues.podExtractMode : "专项提取";
  const [mode, setMode] = useState<PodExtractModeKey>(defaultMode);
  const [scene, setScene] = useState(selectedValues?.podExtractScene ?? podExtractSceneOptions[defaultMode][0]);
  const [ratio, setRatio] = useState(selectedValues?.podExtractRatio ?? podExtractRatioOptions[defaultMode][0]);
  const [transparentBackground, setTransparentBackground] = useState(selectedValues?.podExtractTransparentBackground === "1");

  useEffect(() => {
    const nextScenes = podExtractSceneOptions[mode];
    const nextRatios = podExtractRatioOptions[mode];
    if (!nextScenes.includes(scene)) {
      setScene(nextScenes[0]);
    }
    if (!nextRatios.includes(ratio)) {
      setRatio(nextRatios[0]);
    }
  }, [mode, ratio, scene]);

  useEffect(() => {
    const nextMode = selectedValues?.podExtractMode;
    if ((nextMode === "专项提取" || nextMode === "全能提取") && nextMode !== mode) {
      setMode(nextMode);
    }
  }, [selectedValues]);

  useEffect(() => {
    const nextScene = selectedValues?.podExtractScene;
    const nextScenes = podExtractSceneOptions[mode];
    if (nextScene && nextScenes.includes(nextScene) && nextScene !== scene) {
      setScene(nextScene);
    }
  }, [mode, selectedValues]);

  useEffect(() => {
    const nextRatio = selectedValues?.podExtractRatio;
    const nextRatios = podExtractRatioOptions[mode];
    if (nextRatio && nextRatios.includes(nextRatio) && nextRatio !== ratio) {
      setRatio(nextRatio);
    }
  }, [mode, selectedValues]);

  useEffect(() => {
    onSelectionChange?.([mode, scene, ratio, `透明底图 ${transparentBackground ? "开启" : "关闭"}`]);
    onSelectionMapChange?.({
      podExtractMode: mode,
      podExtractScene: scene,
      podExtractRatio: ratio,
      podExtractTransparentBackground: transparentBackground ? "1" : "0"
    });
    onCreationModeChange?.({
      modeId: `pod-extract-${mode}`,
      modeLabel: mode,
      ratio,
      count: 1,
      unitCreditCost: 5
    });
  }, [mode, onCreationModeChange, onSelectionChange, onSelectionMapChange, ratio, scene, transparentBackground]);

  return (
    <div className="ck-form-block">
      <FieldTitle label="选择模式" required />
      <div className="ck-choice-row ck-choice-row-retouch ck-choice-row-retouch-primary">
        {podExtractModeCards.map((option) => (
          <button
            className={`ck-mode-card ck-mode-card-primary${mode === option.key ? " active" : ""}`}
            key={option.key}
            onClick={() => setMode(option.key)}
            type="button"
          >
            <div className="ck-mode-card-head">
              <strong>{option.label}</strong>
              <span className={`ck-check${mode === option.key ? " active" : ""}`} />
            </div>
            <p>{option.description}</p>
          </button>
        ))}
      </div>

      <AdaptiveChoiceField
        columns={4}
        label="产品场景"
        onChange={setScene}
        options={podExtractSceneOptions[mode].map((option) => ({ key: option, label: option }))}
        required
        value={scene}
      />

      <div className="ck-inline-field ck-aligned-inline-field">
        <FieldTitle label="出图比例" required />
        <SelectField
          className="ck-pod-extract-ratio-select"
          hideLabel
          label="出图比例"
          onChange={setRatio}
          options={podExtractRatioOptions[mode]}
          required
          value={ratio}
        />
      </div>

      <div className="ck-inline-field ck-aligned-inline-field">
        <FieldTitle label="透明底图" />
        <button
          aria-pressed={transparentBackground}
          className={`ck-pod-extract-toggle${transparentBackground ? " active" : ""}`}
          onClick={() => setTransparentBackground((value) => !value)}
          type="button"
        >
          <span />
        </button>
      </div>
    </div>
  );
}

function InlineSliderField({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.1,
  valueFormatter,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  valueFormatter?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const displayValue = valueFormatter ? valueFormatter(value) : String(value);

  return (
    <div className="ck-inline-field ck-slider-inline-field">
      <div className="ck-slider-inline-head">
        <FieldTitle label={label} required />
        <span className="ck-slider-inline-value">{displayValue}</span>
      </div>
      <input
        className="ck-slider-inline-range"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </div>
  );
}

function inferPodVariationCategory(uploads: UploadItem[]) {
  const sourceText = uploads
    .map((item) => `${item.name ?? ""}`.toLowerCase())
    .join(" ");

  if (!sourceText) return "默认";
  if (/(fabric|textile|cloth|服装|纺织|布料|面料|服饰)/.test(sourceText)) return "服装/纺织";
  if (/(phone|case|手机壳|壳)/.test(sourceText)) return "手机壳";
  if (/(iron|metal|铁艺|图形)/.test(sourceText)) return "铁艺图形";
  if (/(clock|挂钟)/.test(sourceText)) return "挂钟";
  if (/(decor|frame|装饰画)/.test(sourceText)) return "装饰画";
  if (/(tin|plate|铁皮画)/.test(sourceText)) return "铁皮画";
  return "默认";
}

function inferPodPartialEditCategory(uploads: UploadItem[]) {
  const sourceText = uploads
    .map((item) => `${item.name ?? ""}`.toLowerCase())
    .join(" ");

  if (!sourceText) return "默认";
  if (/(fabric|textile|cloth|服装|纺织|布料|面料|服饰)/.test(sourceText)) return "服装/纺织";
  if (/(phone|case|手机壳|壳)/.test(sourceText)) return "手机壳";
  if (/(iron|metal|铁艺|图形)/.test(sourceText)) return "铁艺图形";
  if (/(clock|挂钟)/.test(sourceText)) return "挂钟";
  if (/(decor|frame|装饰画)/.test(sourceText)) return "装饰画";
  if (/(tin|plate|铁皮画)/.test(sourceText)) return "铁皮画";
  return "默认";
}

function buildPartialEditTemplatePayload(requirement: string, fieldValues: Record<string, string>) {
  const template = podPartialEditTemplates[requirement];
  if (!template) return "";
  if (requirement === "自定义提示词") {
    return fieldValues.customPrompt ?? "";
  }

  return JSON.stringify(
    {
      type: template.key,
      title: template.label,
      fields: (template.fields ?? []).map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        value:
          field.type === "dynamic-list"
            ? (safeParseJson<string[]>(fieldValues[field.key], [""]) ?? [""]).filter((item) => item.trim())
            : fieldValues[field.key] ?? field.defaultValue ?? ""
      }))
    },
    null,
    2
  );
}

function buildDefaultPartialEditFieldValues(requirement: string) {
  const template = podPartialEditTemplates[requirement];
  if (!template?.fields?.length) return requirement === "自定义提示词" ? { customPrompt: "" } : {};
  return template.fields.reduce<Record<string, string>>((accumulator, field) => {
    accumulator[field.key] = field.defaultValue ?? "";
    return accumulator;
  }, {});
}

function normalizePodPartialEditRequirement(value?: string) {
  if (value === "服饰做纹理") return "服饰贴纹理";
  return value;
}

function normalizePartialEditFieldValues(requirement: string, rawValues?: Record<string, string>) {
  const defaults = buildDefaultPartialEditFieldValues(requirement);
  const nextValues = { ...defaults, ...(rawValues ?? {}) };

  if (requirement === "替换“文字”和元素") {
    const legacySourceContent = nextValues.sourceContent || nextValues.targetText || "";
    const legacyReplacementContents = nextValues.replacementContents
      ? safeParseJson<string[]>(nextValues.replacementContents, [""]) ?? [""]
      : [nextValues.elementDescription || ""].filter(Boolean);
    nextValues.sourceContent = legacySourceContent;
    nextValues.replacementContents = JSON.stringify(legacyReplacementContents.length ? legacyReplacementContents : [""]);
    delete nextValues.targetText;
    delete nextValues.elementDescription;
    delete nextValues.referenceImage;
  }

  if (requirement === "去除商品印花") {
    nextValues.sourceContent = nextValues.sourceContent || nextValues.removeArea || "";
    delete nextValues.removeArea;
    delete nextValues.retainTexture;
  }

  if (requirement === "商品换色") {
    nextValues.sourceContent = nextValues.sourceContent || nextValues.targetPart || "";
    const legacyColors = nextValues.replacementColors
      ? safeParseJson<string[]>(nextValues.replacementColors, ["#111111"]) ?? ["#111111"]
      : [nextValues.targetColor || "#111111"];
    nextValues.replacementColors = JSON.stringify(legacyColors.length ? legacyColors : ["#111111"]);
    delete nextValues.targetPart;
    delete nextValues.targetColor;
  }

  if (requirement === "服饰贴纹理") {
    nextValues.textureUpload = nextValues.textureUpload || nextValues.textureReference || "";
    delete nextValues.textureType;
    delete nextValues.textureReference;
    delete nextValues.textureDirection;
  }

  return nextValues;
}

function getPodFusionPairGroups(selectionMap?: AdvancedSelectionMap) {
  return safeParseJson<PodFusionPairGroup[]>(selectionMap?.podFusionPairGroups, []) ?? [];
}

function getPodFusionOneToManySelection(selectionMap?: AdvancedSelectionMap) {
  return (
    safeParseJson<PodFusionOneToManySelection>(selectionMap?.podFusionOneToManySelection, {
      fusionItems: []
    }) ?? { fusionItems: [] }
  );
}

function getPodFusionMetrics(selectionMap?: AdvancedSelectionMap) {
  const mode = (selectionMap?.podFusionMode as PodFusionMode) || "两两融合";
  const outputCount = Math.max(1, Number(selectionMap?.podFusionOutputCount ?? "1") || 1);

  if (mode === "一对多融合") {
    const oneToMany = getPodFusionOneToManySelection(selectionMap);
    const fusionCount = oneToMany.fusionItems.length;
    return {
      mode,
      outputCount,
      isReady: Boolean(oneToMany.base && fusionCount > 0),
      groupCount: fusionCount,
      sourceCount: fusionCount,
      payloadUploads: [oneToMany.base, ...oneToMany.fusionItems].filter(Boolean) as UploadItem[]
    };
  }

  const groups = getPodFusionPairGroups(selectionMap).filter((group) => group.a && group.b);
  return {
    mode,
    outputCount,
    isReady: groups.length > 0,
    groupCount: groups.length,
    sourceCount: groups.length,
    payloadUploads: groups.flatMap((group) => [group.a, group.b].filter(Boolean) as UploadItem[])
  };
}

function buildPodFusionSelectionSummary(selectionMap: AdvancedSelectionMap) {
  const metrics = getPodFusionMetrics(selectionMap);
  return [
    `选择方式 ${selectionMap.podFusionMode ?? "两两融合"}`,
    selectionMap.podFusionStyle ? `选择风格 ${selectionMap.podFusionStyle}` : "",
    selectionMap.podFusionBackground ? `背景 ${selectionMap.podFusionBackground}` : "",
    selectionMap.podFusionRatio ? `比例 ${selectionMap.podFusionRatio}` : "",
    `素材组数 ${metrics.groupCount}`,
    `出图数量 ${metrics.outputCount}`
  ].filter(Boolean);
}

function PodPartialEditSetupSection({
  uploads,
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onCreationModeChange,
  onOpenLibrary,
  onAddUpload,
  onRemoveUpload,
  remainingStorageMb,
  referenceUploads,
  referenceFieldKey
}: {
  uploads: UploadItem[];
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onCreationModeChange?: (selection: CreationModeSelection) => void;
  onOpenLibrary?: (fieldKey: string) => void;
  onAddUpload?: (fieldKey: string, nextValues: UploadItem[]) => void;
  onRemoveUpload?: (fieldKey: string, index: number) => void;
  remainingStorageMb: number;
  referenceUploads: UploadItem[];
  referenceFieldKey: string;
}) {
  const parseDynamicListFieldValue = (value?: string) => safeParseJson<string[]>(value, [""]) ?? [""];
  const normalizedSelectedRequirement = normalizePodPartialEditRequirement(selectedValues?.podPartialEditRequirement);
  const defaultRequirement =
    normalizedSelectedRequirement &&
    podPartialEditRequirementOptions.includes(normalizedSelectedRequirement as (typeof podPartialEditRequirementOptions)[number])
      ? normalizedSelectedRequirement
      : podPartialEditRequirementOptions[0];
  const defaultFieldValues =
    normalizePartialEditFieldValues(
      defaultRequirement,
      safeParseJson<Record<string, string>>(selectedValues?.podPartialEditFieldValues, buildDefaultPartialEditFieldValues(defaultRequirement)) ??
        buildDefaultPartialEditFieldValues(defaultRequirement)
    );
  const [category, setCategory] = useState<string>(selectedValues?.podPartialEditCategory ?? inferPodPartialEditCategory(uploads));
  const [requirement, setRequirement] = useState<string>(defaultRequirement);
  const [outputCount, setOutputCount] = useState<string>(selectedValues?.podPartialEditOutputCount ?? podPartialEditOutputCountOptions[0]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(defaultFieldValues);
  const [instructionText, setInstructionText] = useState(
    selectedValues?.podPartialEditInstructionText ?? buildPartialEditTemplatePayload(defaultRequirement, defaultFieldValues)
  );

  const template = podPartialEditTemplates[requirement];

  const handleRequirementChange = (nextRequirement: string) => {
    setRequirement(nextRequirement);
    const nextFieldValues = normalizePartialEditFieldValues(nextRequirement, buildDefaultPartialEditFieldValues(nextRequirement));
    setFieldValues(nextFieldValues);
    setInstructionText(buildPartialEditTemplatePayload(nextRequirement, nextFieldValues));
  };

  const handleFieldValueChange = (key: string, value: string) => {
    setFieldValues((current) => {
      const nextValues = { ...current, [key]: value };
      setInstructionText(buildPartialEditTemplatePayload(requirement, nextValues));
      return nextValues;
    });
  };

  const handleDynamicListItemChange = (key: string, index: number, value: string) => {
    const items = parseDynamicListFieldValue(fieldValues[key]);
    items[index] = value;
    handleFieldValueChange(key, JSON.stringify(items));
  };

  const handleDynamicListAdd = (key: string, maxItems = 10) => {
    const items = parseDynamicListFieldValue(fieldValues[key]);
    if (items.length >= maxItems) return;
    handleFieldValueChange(key, JSON.stringify([...items, ""]));
  };

  const handleDynamicListRemove = (key: string, index: number) => {
    const items = parseDynamicListFieldValue(fieldValues[key]);
    if (items.length <= 1 || index <= 0 || index >= items.length) return;
    handleFieldValueChange(
      key,
      JSON.stringify(items.filter((_, itemIndex) => itemIndex !== index))
    );
  };

  const handleDynamicColorListItemChange = (key: string, index: number, value: string) => {
    const items = parseDynamicListFieldValue(fieldValues[key]);
    items[index] = value;
    handleFieldValueChange(key, JSON.stringify(items));
  };

  const handleDynamicColorListAdd = (key: string, maxItems = 10) => {
    const items = parseDynamicListFieldValue(fieldValues[key]);
    if (items.length >= maxItems) return;
    handleFieldValueChange(key, JSON.stringify([...items, "#111111"]));
  };

  const handleDynamicColorListRemove = (key: string, index: number) => {
    const items = parseDynamicListFieldValue(fieldValues[key]);
    if (items.length <= 1 || index <= 0 || index >= items.length) return;
    handleFieldValueChange(
      key,
      JSON.stringify(items.filter((_, itemIndex) => itemIndex !== index))
    );
  };

  const handleInstructionTextChange = (value: string) => {
    setInstructionText(value);
    if (requirement === "自定义提示词") {
      setFieldValues({ customPrompt: value });
    }
  };

  useEffect(() => {
    onSelectionMapChange?.({
      podPartialEditCategory: category,
      podPartialEditRequirement: requirement,
      podPartialEditFieldValues: JSON.stringify(fieldValues),
      podPartialEditInstructionText: instructionText,
      podPartialEditOutputCount: outputCount
    });
    onSelectionChange?.(
      [category, requirement, `出图数量 ${outputCount}`, instructionText ? "已配置改图要求" : ""].filter(Boolean)
    );
    onCreationModeChange?.({
      modeId: "pod-partial-edit",
      modeLabel: requirement,
      ratio: "1:1",
      count: Number(outputCount) || 1,
      unitCreditCost: 5
    });
  }, [category, fieldValues, instructionText, onCreationModeChange, onSelectionChange, onSelectionMapChange, outputCount, requirement]);

  return (
    <div className="ck-form-block">
      <AdaptiveChoiceField
        label="改图要求"
        onChange={handleRequirementChange}
        options={podPartialEditRequirementOptions.map((option) => ({ key: option, label: option }))}
        required
        value={requirement}
      />

      {requirement !== "自定义提示词" && template?.fields?.length ? (
        <div className="ck-partial-edit-structured-panel">
          {template.fields.map((field) => {
            if (field.type === "text") {
              return (
                <div className="ck-partial-edit-helper-text" key={field.key}>
                  {field.defaultValue}
                </div>
              );
            }

            if (field.type === "input" || field.type === "image") {
              if (field.key === "textureUpload") {
                return (
                  <div className="ck-partial-edit-upload-field" key={field.key}>
                    <ReferenceUploadSection
                      config={{ label: field.label, optional: false }}
                      fieldKey={referenceFieldKey}
                      hint="最多1张，支持JPG/PNG/WebP"
                      maxCount={1}
                      onAdd={(fieldKey, nextValues) => {
                        onAddUpload?.(fieldKey, nextValues);
                        handleFieldValueChange(field.key, nextValues[0]?.name ?? "");
                      }}
                      onAtLimit={() => undefined}
                      onOpenLibrary={(fieldKey) => onOpenLibrary?.(fieldKey)}
                      onRejectedUpload={() => undefined}
                      onRemove={(fieldKey, index) => {
                        onRemoveUpload?.(fieldKey, index);
                        handleFieldValueChange(field.key, "");
                      }}
                      remainingStorageMb={remainingStorageMb}
                      values={referenceUploads}
                    />
                  </div>
                );
              }

              return (
                <div className="ck-inline-field" key={field.key}>
                  <FieldTitle label={field.label} required />
                  <input
                    className="ck-structured-inline-input"
                    onChange={(event) => handleFieldValueChange(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    type="text"
                    value={fieldValues[field.key] ?? ""}
                  />
                </div>
              );
            }

            if (field.type === "dynamic-color-list") {
              const items = parseDynamicListFieldValue(fieldValues[field.key]);
              const maxItems = field.maxItems ?? 10;
              const canAddMore = items.length < maxItems;

              return (
                <div className="ck-inline-field ck-partial-edit-dynamic-list-field" key={field.key}>
                  <FieldTitle label={field.label} required />
                  <div className="ck-partial-edit-dynamic-list">
                    {items.map((item, index) => (
                      <div className="ck-partial-edit-dynamic-color-row" key={`${field.key}-${index}`}>
                        <span className="ck-partial-edit-dynamic-list-index">{index + 1}</span>
                        <input
                          className="ck-structured-color-picker"
                          onChange={(event) => handleDynamicColorListItemChange(field.key, index, event.target.value)}
                          type="color"
                          value={item || "#111111"}
                        />
                        <input
                          className="ck-structured-inline-input color-text"
                          onChange={(event) => handleDynamicColorListItemChange(field.key, index, event.target.value)}
                          type="text"
                          value={item}
                        />
                        {items.length > 1 && index > 0 ? (
                          <button
                            aria-label={`删除第${index + 1}个替换颜色`}
                            className="ck-partial-edit-remove-button"
                            onClick={() => handleDynamicColorListRemove(field.key, index)}
                            type="button"
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {canAddMore ? (
                      <button className="ck-partial-edit-add-button" onClick={() => handleDynamicColorListAdd(field.key, maxItems)} type="button">
                        +
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            }

            if (field.type === "dynamic-list") {
              const items = parseDynamicListFieldValue(fieldValues[field.key]);
              const maxItems = field.maxItems ?? 10;
              const canAddMore = items.length < maxItems;

              return (
                <div className="ck-inline-field ck-partial-edit-dynamic-list-field" key={field.key}>
                  <FieldTitle label={field.label} required />
                  <div className="ck-partial-edit-dynamic-list">
                    {items.map((item, index) => (
                      <div className="ck-partial-edit-dynamic-list-row" key={`${field.key}-${index}`}>
                        <span className="ck-partial-edit-dynamic-list-index">{index + 1}</span>
                        <input
                          className="ck-structured-inline-input"
                          onChange={(event) => handleDynamicListItemChange(field.key, index, event.target.value)}
                          placeholder={field.placeholder}
                          type="text"
                          value={item}
                        />
                        {items.length > 1 && index > 0 ? (
                          <button
                            aria-label={`删除第${index + 1}个替换内容`}
                            className="ck-partial-edit-remove-button"
                            onClick={() => handleDynamicListRemove(field.key, index)}
                            type="button"
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {canAddMore ? (
                      <button className="ck-partial-edit-add-button" onClick={() => handleDynamicListAdd(field.key, maxItems)} type="button">
                        +
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            }

            if (field.type === "select") {
              return (
                <div className="ck-inline-field" key={field.key}>
                  <FieldTitle label={field.label} required />
                  <SelectField
                    hideLabel
                    label={field.label}
                    onChange={(value) => handleFieldValueChange(field.key, value)}
                    options={field.options}
                    required
                    value={fieldValues[field.key] ?? field.defaultValue ?? ""}
                  />
                </div>
              );
            }

            if (field.type === "color") {
              return (
                <div className="ck-inline-field" key={field.key}>
                  <FieldTitle label={field.label} required />
                  <div className="ck-structured-color-field">
                    <input
                      className="ck-structured-color-picker"
                      onChange={(event) => handleFieldValueChange(field.key, event.target.value)}
                      type="color"
                      value={fieldValues[field.key] ?? field.defaultValue ?? "#111111"}
                    />
                    <input
                      className="ck-structured-inline-input color-text"
                      onChange={(event) => handleFieldValueChange(field.key, event.target.value)}
                      type="text"
                      value={fieldValues[field.key] ?? field.defaultValue ?? "#111111"}
                    />
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      ) : null}

      {requirement === "自定义提示词" ? (
        <UnifiedTextareaField
          label="提示词输入"
          maxLength={3000}
          onChange={handleInstructionTextChange}
          placeholder="请输入局部改图指令，例如：保留主体结构，只替换包装中心文案与角标元素。"
          required
          value={instructionText}
        />
      ) : null}

      <CountField label="出图数量" onChange={setOutputCount} options={[...podPartialEditOutputCountOptions]} required value={outputCount} />
    </div>
  );
}

function PodFusionPairModal({
  open,
  initialGroups,
  onClose,
  onConfirm
}: {
  open: boolean;
  initialGroups: PodFusionPairGroup[];
  onClose: () => void;
  onConfirm: (groups: PodFusionPairGroup[]) => void;
}) {
  const [pairGroups, setPairGroups] = useState<PodFusionPairGroup[]>(initialGroups);
  const [localAssets, setLocalAssets] = useState<UploadItem[]>([]);
  const localInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setPairGroups(initialGroups.length ? initialGroups.map((group) => ({ ...group })) : [{ id: generateRandomTenDigitId() }]);
      setLocalAssets([]);
    }
  }, [initialGroups, open]);

  if (!open) return null;

  const workingGroups =
    pairGroups.length && pairGroups[pairGroups.length - 1]?.a && pairGroups[pairGroups.length - 1]?.b
      ? [...pairGroups, { id: generateRandomTenDigitId() }]
      : pairGroups.length
        ? pairGroups
        : [{ id: generateRandomTenDigitId() }];

  const handleFillNextSlot = (asset: UploadItem) => {
    const nextAsset = cloneUploadItem(asset);
    setPairGroups((current) => {
      const baseGroups = current.length ? current.map((group) => ({ ...group })) : [{ id: generateRandomTenDigitId() }];
      const targetIndex = baseGroups.findIndex((group) => !group.a || !group.b);
      const index = targetIndex >= 0 ? targetIndex : baseGroups.length;
      if (!baseGroups[index]) {
        baseGroups.push({ id: generateRandomTenDigitId() });
      }
      const targetGroup = { ...baseGroups[index] };
      if (!targetGroup.a) {
        targetGroup.a = nextAsset;
      } else {
        targetGroup.b = nextAsset;
      }
      baseGroups[index] = targetGroup;
      return baseGroups;
    });
  };

  const handleRemoveGroup = (groupId: string) => {
    setPairGroups((current) => current.filter((group) => group.id !== groupId));
  };

  const availableAssets = [
    ...localAssets,
    ...libraryAssets
      .filter((asset) => (asset.mediaKind ?? "image") === "image")
      .map<UploadItem>((asset) => ({
        id: generateRandomTenDigitId(),
        name: asset.name,
        src: asset.src,
        previewSrc: asset.previewSrc ?? asset.src,
        mediaKind: "image",
        format: asset.format,
        sizeMb: asset.sizeMb,
        status: "ready"
      }))
  ];

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    setLocalAssets((current) => [...buildUploadItemsFromFiles(files), ...current]);
    event.target.value = "";
  };

  return (
    <div className="ck-library-mask ck-pod-fusion-modal-mask" onClick={onClose}>
      <div className="ck-pod-fusion-modal" onClick={(event) => event.stopPropagation()}>
        <div className="ck-pod-fusion-modal-header">
          <div className="ck-pod-fusion-modal-tabs">
            <button className="active" type="button">
              按素材选取
            </button>
            <button type="button">从智能检索选取</button>
          </div>
          <button aria-label="关闭元素融合素材弹框" className="ck-library-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="ck-pod-fusion-modal-toolbar">
          <button className="ck-library-upload" onClick={() => localInputRef.current?.click()} type="button">
            上传图片
          </button>
          <button className="ck-library-upload" onClick={() => folderInputRef.current?.click()} type="button">
            上传文件夹
          </button>
          <input accept="image/*" hidden multiple onChange={handleFileInputChange} ref={localInputRef} type="file" />
          <input accept="image/*" hidden multiple onChange={handleFileInputChange} ref={folderInputRef} type="file" />
        </div>

        <div className="ck-pod-fusion-modal-grid">
          {availableAssets.map((asset) => (
            <button className="ck-pod-fusion-asset-card" key={asset.id} onClick={() => handleFillNextSlot(asset)} type="button">
              <img alt={asset.name ?? "素材"} src={asset.previewSrc ?? asset.src} />
            </button>
          ))}
        </div>

        <div className="ck-pod-fusion-modal-preview">
          {workingGroups.map((group, index) => (
            <div className="ck-pod-fusion-pair-preview" key={group.id}>
              <div className="ck-pod-fusion-pair-preview-card">
                {group.a ? <img alt={`${index + 1}-A`} src={group.a.previewSrc ?? group.a.src} /> : <span>{`${index + 1}-A`}</span>}
                <i>{`${index + 1}-A`}</i>
              </div>
              <span className="ck-pod-fusion-pair-link">◎</span>
              <div className="ck-pod-fusion-pair-preview-card">
                {group.b ? <img alt={`${index + 1}-B`} src={group.b.previewSrc ?? group.b.src} /> : <span>{`${index + 1}-B`}</span>}
                <i>{`${index + 1}-B`}</i>
              </div>
              {group.a && group.b ? (
                <button className="ck-pod-fusion-remove-pair" onClick={() => handleRemoveGroup(group.id)} type="button">
                  ×
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="ck-pod-fusion-modal-actions">
          <button className="ck-library-cancel" onClick={onClose} type="button">
            取消
          </button>
          <button
            className="ck-library-confirm"
            onClick={() => onConfirm(pairGroups.filter((group) => group.a && group.b))}
            type="button"
          >
            选取
          </button>
        </div>
      </div>
    </div>
  );
}

function PodFusionOneToManyLibraryModal({
  open,
  maxSelectable,
  onClose,
  onConfirm
}: {
  open: boolean;
  maxSelectable: number;
  onClose: () => void;
  onConfirm: (items: UploadItem[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
    }
  }, [open]);

  if (!open) return null;

  const imageAssets = libraryAssets.filter((asset) => (asset.mediaKind ?? "image") === "image");

  const toggleAsset = (assetId: string) => {
    setSelectedIds((current) => {
      if (current.includes(assetId)) {
        return current.filter((id) => id !== assetId);
      }
      if (current.length >= maxSelectable) {
        return current;
      }
      return [...current, assetId];
    });
  };

  return (
    <div className="ck-library-mask" onClick={onClose}>
      <div className="ck-library-modal ck-pod-fusion-simple-library" onClick={(event) => event.stopPropagation()}>
        <div className="ck-library-header">
          <div className="ck-library-title">从资源库选择</div>
          <button aria-label="关闭资源库" className="ck-library-close" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="ck-pod-fusion-modal-grid compact">
          {imageAssets.map((asset) => {
            const selected = selectedIds.includes(asset.id);
            return (
              <button
                className={`ck-pod-fusion-asset-card${selected ? " selected" : ""}`}
                key={asset.id}
                onClick={() => toggleAsset(asset.id)}
                type="button"
              >
                <img alt={asset.name} src={asset.previewSrc ?? asset.src} />
              </button>
            );
          })}
        </div>
        <div className="ck-pod-fusion-modal-actions">
          <button className="ck-library-cancel" onClick={onClose} type="button">
            取消
          </button>
          <button
            className="ck-library-confirm"
            onClick={() =>
              onConfirm(
                imageAssets.filter((asset) => selectedIds.includes(asset.id)).map((asset) => ({
                  id: generateRandomTenDigitId(),
                  name: asset.name,
                  src: asset.src,
                  previewSrc: asset.previewSrc ?? asset.src,
                  mediaKind: "image",
                  format: asset.format,
                  sizeMb: asset.sizeMb,
                  status: "ready"
                }))
              )
            }
            type="button"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

function PodFusionSetupSection({
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onCreationModeChange
}: {
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onCreationModeChange?: (selection: CreationModeSelection) => void;
}) {
  const [mode, setMode] = useState<PodFusionMode>(
    (podFusionModeOptions.find((item) => item === selectedValues?.podFusionMode) ?? podFusionModeOptions[0]) as PodFusionMode
  );
  const [style, setStyle] = useState(selectedValues?.podFusionStyle ?? podFusionStyleOptions[0]);
  const [background, setBackground] = useState(selectedValues?.podFusionBackground ?? podFusionBackgroundOptions[0]);
  const [ratio, setRatio] = useState(selectedValues?.podFusionRatio ?? podFusionRatioOptions[0]);
  const [outputCount, setOutputCount] = useState(selectedValues?.podFusionOutputCount ?? podFusionOutputCountOptions[0]);
  const [pairGroups, setPairGroups] = useState<PodFusionPairGroup[]>(getPodFusionPairGroups(selectedValues));
  const [oneToMany, setOneToMany] = useState<PodFusionOneToManySelection>(getPodFusionOneToManySelection(selectedValues));
  const [pairModalOpen, setPairModalOpen] = useState(false);
  const [libraryTarget, setLibraryTarget] = useState<"base" | "fusion" | null>(null);
  const baseLocalInputRef = useRef<HTMLInputElement | null>(null);
  const fusionLocalInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const nextMode = selectedValues?.podFusionMode;
    if (nextMode && podFusionModeOptions.includes(nextMode as PodFusionMode) && nextMode !== mode) {
      setMode(nextMode as PodFusionMode);
    }
    if (selectedValues?.podFusionStyle && selectedValues.podFusionStyle !== style) {
      setStyle(selectedValues.podFusionStyle);
    }
    if (selectedValues?.podFusionBackground && selectedValues.podFusionBackground !== background) {
      setBackground(selectedValues.podFusionBackground);
    }
    if (selectedValues?.podFusionRatio && selectedValues.podFusionRatio !== ratio) {
      setRatio(selectedValues.podFusionRatio);
    }
    if (selectedValues?.podFusionOutputCount && selectedValues.podFusionOutputCount !== outputCount) {
      setOutputCount(selectedValues.podFusionOutputCount);
    }
  }, [background, mode, outputCount, ratio, selectedValues, style]);

  useEffect(() => {
    const nextSelectionMap: AdvancedSelectionMap = {
      podFusionMode: mode,
      podFusionStyle: style,
      podFusionBackground: background,
      podFusionRatio: ratio,
      podFusionOutputCount: outputCount,
      podFusionPairGroups: JSON.stringify(pairGroups),
      podFusionOneToManySelection: JSON.stringify(oneToMany)
    };
    onSelectionMapChange?.(nextSelectionMap);
    onSelectionChange?.(buildPodFusionSelectionSummary(nextSelectionMap));
    onCreationModeChange?.({
      modeId: `pod-fusion-${mode}`,
      modeLabel: mode,
      ratio,
      count: Number(outputCount) || 1,
      unitCreditCost: 5
    });
  }, [background, mode, onCreationModeChange, onSelectionChange, onSelectionMapChange, oneToMany, outputCount, pairGroups, ratio, style]);

  const handleBaseLocalUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    setOneToMany((current) => ({ ...current, base: buildUploadItemsFromFiles(files)[0] }));
    event.target.value = "";
  };

  const handleFusionLocalUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    setOneToMany((current) => ({ ...current, fusionItems: [...current.fusionItems, ...buildUploadItemsFromFiles(files)] }));
    event.target.value = "";
  };

  return (
    <div className="ck-form-block ck-pod-fusion-panel">
      <div className="ck-form-block">
        <FieldTitle label="选择方式" required />
        <div className="ck-mini-switch" style={{ gridTemplateColumns: "repeat(2, 1fr)", width: 180 }}>
          {podFusionModeOptions.map((option) => (
            <button className={option === mode ? "active" : ""} key={option} onClick={() => setMode(option)} type="button">
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="ck-form-block">
        <FieldTitle label="添加素材" required />
        {mode === "两两融合" ? (
          <div className="ck-pod-fusion-material-box">
            <div className="ck-pod-fusion-pair-list">
              {(pairGroups.length ? pairGroups : [{ id: "placeholder" }]).map((group, index) => (
                <div className="ck-pod-fusion-pair-chip" key={group.id}>
                  <div className="ck-pod-fusion-chip-card">
                    {group.a ? <img alt={`${index + 1}-A`} src={group.a.previewSrc ?? group.a.src} /> : <span>{`${index + 1}-A`}</span>}
                    <i>{`${index + 1}-A`}</i>
                  </div>
                  <span className="ck-pod-fusion-pair-link">◎</span>
                  <div className="ck-pod-fusion-chip-card">
                    {group.b ? <img alt={`${index + 1}-B`} src={group.b.previewSrc ?? group.b.src} /> : <span>{`${index + 1}-B`}</span>}
                    <i>{`${index + 1}-B`}</i>
                  </div>
                  {group.a && group.b ? (
                    <button className="ck-pod-fusion-remove-pair" onClick={() => setPairGroups((current) => current.filter((item) => item.id !== group.id))} type="button">
                      ×
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button className="ck-pod-fusion-open-picker" onClick={() => setPairModalOpen(true)} type="button">
              从我的空间选取
            </button>
          </div>
        ) : (
          <div className="ck-pod-fusion-one-to-many-grid">
            <div className="ck-pod-fusion-dual-card">
              <div className="ck-pod-fusion-dual-card-title">单一元素</div>
              <div className="ck-pod-fusion-dual-card-subtitle">作为固定的融合对象</div>
              <div className="ck-pod-fusion-dual-preview">
                {oneToMany.base ? <img alt="单一元素" src={oneToMany.base.previewSrc ?? oneToMany.base.src} /> : <span>仅支持1张</span>}
              </div>
              <div className="ck-pod-fusion-dual-actions">
                <button onClick={() => baseLocalInputRef.current?.click()} type="button">
                  本地上传
                </button>
                <button onClick={() => setLibraryTarget("base")} type="button">
                  资源库选择
                </button>
              </div>
              <input accept="image/*" hidden onChange={handleBaseLocalUpload} ref={baseLocalInputRef} type="file" />
            </div>

            <div className="ck-pod-fusion-dual-card">
              <div className="ck-pod-fusion-dual-card-title">融合元素</div>
              <div className="ck-pod-fusion-dual-card-subtitle">可上传多张图片，分别与单一元素融合</div>
              <div className="ck-pod-fusion-multi-preview">
                {oneToMany.fusionItems.length ? (
                  oneToMany.fusionItems.map((item) => <img alt={item.name ?? "融合元素"} key={item.id} src={item.previewSrc ?? item.src} />)
                ) : (
                  <span>可上传多张</span>
                )}
              </div>
              <div className="ck-pod-fusion-dual-actions">
                <button onClick={() => fusionLocalInputRef.current?.click()} type="button">
                  本地上传
                </button>
                <button onClick={() => setLibraryTarget("fusion")} type="button">
                  资源库选择
                </button>
              </div>
              <input accept="image/*" hidden multiple onChange={handleFusionLocalUpload} ref={fusionLocalInputRef} type="file" />
            </div>
          </div>
        )}
      </div>

      <div className="ck-inline-field ck-aligned-inline-field">
        <FieldTitle label="选择风格" required />
        <SelectField hideLabel label="选择风格" onChange={setStyle} options={[...podFusionStyleOptions]} required value={style} />
      </div>

      <div className="ck-inline-field ck-aligned-inline-field">
        <FieldTitle label="背景" required />
        <SelectField hideLabel label="背景" onChange={setBackground} options={[...podFusionBackgroundOptions]} required value={background} />
      </div>

      <div className="ck-inline-field ck-aligned-inline-field">
        <FieldTitle label="比例" required />
        <SelectField hideLabel label="比例" onChange={setRatio} options={[...podFusionRatioOptions]} required value={ratio} />
      </div>

      <CountField label="出图数量" onChange={setOutputCount} options={[...podFusionOutputCountOptions]} required value={outputCount} />

      <PodFusionPairModal
        initialGroups={pairGroups}
        onClose={() => setPairModalOpen(false)}
        onConfirm={(groups) => {
          setPairGroups(groups);
          setPairModalOpen(false);
        }}
        open={pairModalOpen}
      />

      <PodFusionOneToManyLibraryModal
        maxSelectable={libraryTarget === "base" ? 1 : 24}
        onClose={() => setLibraryTarget(null)}
        onConfirm={(items) => {
          if (libraryTarget === "base") {
            setOneToMany((current) => ({ ...current, base: items[0] }));
          } else if (libraryTarget === "fusion") {
            setOneToMany((current) => ({ ...current, fusionItems: [...current.fusionItems, ...items] }));
          }
          setLibraryTarget(null);
        }}
        open={libraryTarget !== null}
      />
    </div>
  );
}

function PodVariationSetupSection({
  uploads,
  selectedValues,
  onSelectionChange,
  onSelectionMapChange
}: {
  uploads: UploadItem[];
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
}) {
  const skipSelectedValuesSyncRef = useRef(false);
  const lastSelectedValuesSignatureRef = useRef("");
  const hasManualCategoryRef = useRef(Boolean(selectedValues?.podVariationCategory));
  const [category, setCategory] = useState<string>(selectedValues?.podVariationCategory ?? inferPodVariationCategory(uploads));
  const [mode, setMode] = useState<PodVariationModeKey>(
    (podVariationModeOptions.find((item) => item === selectedValues?.podVariationMode) ?? podVariationModeOptions[0]) as PodVariationModeKey
  );
  const [referenceStyleLevel, setReferenceStyleLevel] = useState<(typeof podVariationReferenceStyleLevels)[number]>(
    (podVariationReferenceStyleLevels.find((item) => item === selectedValues?.podVariationReferenceStyleLevel) ?? podVariationReferenceStyleLevels[2]) as (typeof podVariationReferenceStyleLevels)[number]
  );
  const defaultReferenceStrength = Number(selectedValues?.podVariationReferenceStrength ?? "0.5");
  const [referenceStrength, setReferenceStrength] = useState(Number.isFinite(defaultReferenceStrength) ? defaultReferenceStrength : 0.5);
  const [divergenceLevel, setDivergenceLevel] = useState<(typeof podVariationDivergenceLevels)[number]>(
    (podVariationDivergenceLevels.find((item) => item === selectedValues?.podVariationDivergenceLevel) ?? podVariationDivergenceLevels[0]) as (typeof podVariationDivergenceLevels)[number]
  );
  const [backgroundColor, setBackgroundColor] = useState(selectedValues?.podVariationBackgroundColor ?? "随机");
  const [burstContent, setBurstContent] = useState(
    selectedValues?.podVariationBurstContent && podVariationBurstOptions.includes(selectedValues.podVariationBurstContent as typeof podVariationBurstOptions[number])
      ? selectedValues.podVariationBurstContent
      : podVariationBurstOptions[0]
  );
  const [content, setContent] = useState(
    normalizePodVariationContentValue(selectedValues?.podVariationContent)
  );
  const [shape, setShape] = useState(selectedValues?.podVariationShape ?? "默认");
  const [outputCount, setOutputCount] = useState(Number(selectedValues?.podVariationOutputCount ?? "1") || 1);
  const [graphicStyle, setGraphicStyle] = useState(selectedValues?.podVariationGraphicStyle ?? podVariationGraphicStyleOptions[0].key);
  const [variationDimension, setVariationDimension] = useState(selectedValues?.podVariationVariationDimension ?? podVariationDimensionOptions[0]);
  const [clockMode, setClockMode] = useState(selectedValues?.podVariationClockMode ?? podVariationClockModeOptions[0].key);
  const [clockDialStyles, setClockDialStyles] = useState<string[]>(parsePodVariationClockDialStyles(selectedValues?.podVariationClockDialStyle));
  const [clockGenerateMethod, setClockGenerateMethod] = useState(
    selectedValues?.podVariationClockGenerateMethod ?? podVariationClockGenerateMethodOptions[0]
  );
  const [ratio, setRatio] = useState(
    selectedValues?.podVariationRatio && podVariationRatioOptions.includes(selectedValues.podVariationRatio as (typeof podVariationRatioOptions)[number])
      ? selectedValues.podVariationRatio
      : podVariationRatioOptions[0]
  );
  const isMetalGraphicCategory = category === "铁艺图形";
  const isClockCategory = category === "挂钟";
  const [tinEffectSource, setTinEffectSource] = useState(selectedValues?.podVariationTinEffectSource ?? podVariationTinEffectSourceOptions[0]);
  const [tinEffectPreset, setTinEffectPreset] = useState(selectedValues?.podVariationTinEffectPreset ?? podVariationTinEffectPresetOptions[0]);
  const isTinPlateCategory = category === "铁皮画";
  const visibleModeOptions = podVariationModeOptions.filter(
    (option) => !(podVariationCategoryHiddenModes[category as (typeof podVariationCategoryOptions)[number]] ?? []).includes(option)
  );

  useEffect(() => {
    if (visibleModeOptions.includes(mode)) {
      return;
    }
    skipSelectedValuesSyncRef.current = true;
    setMode(visibleModeOptions[0] ?? podVariationModeOptions[0]);
  }, [mode, visibleModeOptions]);

  useEffect(() => {
    if (hasManualCategoryRef.current || selectedValues?.podVariationCategory) {
      return;
    }
    const inferred = inferPodVariationCategory(uploads);
    if (inferred !== category) {
      setCategory(inferred);
    }
  }, [category, selectedValues?.podVariationCategory, uploads]);

  useEffect(() => {
    const nextValue = Number(selectedValues?.podVariationReferenceStrength ?? "0.5");
    if (Number.isFinite(nextValue) && nextValue !== referenceStrength) {
      setReferenceStrength(nextValue);
    }
  }, [referenceStrength, selectedValues]);

  useEffect(() => {
    if (!selectedValues) return;
    if (skipSelectedValuesSyncRef.current) {
      skipSelectedValuesSyncRef.current = false;
      return;
    }

    const nextSignature = JSON.stringify({
      category: selectedValues.podVariationCategory ?? inferPodVariationCategory(uploads),
      mode: selectedValues.podVariationMode ?? podVariationModeOptions[0],
      referenceStyleLevel: selectedValues.podVariationReferenceStyleLevel ?? podVariationReferenceStyleLevels[2],
      referenceStrength: selectedValues.podVariationReferenceStrength ?? "0.5",
      divergenceLevel: selectedValues.podVariationDivergenceLevel ?? podVariationDivergenceLevels[0],
      backgroundColor: selectedValues.podVariationBackgroundColor ?? "随机",
      burstContent: selectedValues.podVariationBurstContent ?? podVariationBurstOptions[0],
      content: normalizePodVariationContentValue(selectedValues.podVariationContent),
      shape: selectedValues.podVariationShape ?? "默认",
      outputCount: selectedValues.podVariationOutputCount ?? "1",
      graphicStyle: selectedValues.podVariationGraphicStyle ?? podVariationGraphicStyleOptions[0].key,
      variationDimension: selectedValues.podVariationVariationDimension ?? podVariationDimensionOptions[0],
      clockMode: selectedValues.podVariationClockMode ?? podVariationClockModeOptions[0].key,
      clockDialStyles: parsePodVariationClockDialStyles(selectedValues.podVariationClockDialStyle),
      clockGenerateMethod: selectedValues.podVariationClockGenerateMethod ?? podVariationClockGenerateMethodOptions[0],
      ratio:
        selectedValues.podVariationRatio && podVariationRatioOptions.includes(selectedValues.podVariationRatio as (typeof podVariationRatioOptions)[number])
          ? selectedValues.podVariationRatio
          : podVariationRatioOptions[0],
      tinEffectSource: selectedValues.podVariationTinEffectSource ?? podVariationTinEffectSourceOptions[0],
      tinEffectPreset: selectedValues.podVariationTinEffectPreset ?? podVariationTinEffectPresetOptions[0]
    });

    if (nextSignature === lastSelectedValuesSignatureRef.current) {
      return;
    }
    lastSelectedValuesSignatureRef.current = nextSignature;

    const nextMode = selectedValues?.podVariationMode;
    if (nextMode && podVariationModeOptions.includes(nextMode as PodVariationModeKey) && nextMode !== mode) {
      setMode(nextMode as PodVariationModeKey);
    }
    const nextCategory = selectedValues?.podVariationCategory ?? inferPodVariationCategory(uploads);
    if (nextCategory !== category) {
      setCategory(nextCategory);
    }
    if (selectedValues?.podVariationCategory) {
      hasManualCategoryRef.current = true;
    }
    if (
      selectedValues?.podVariationReferenceStyleLevel &&
      podVariationReferenceStyleLevels.includes(selectedValues.podVariationReferenceStyleLevel as (typeof podVariationReferenceStyleLevels)[number]) &&
      selectedValues.podVariationReferenceStyleLevel !== referenceStyleLevel
    ) {
      setReferenceStyleLevel(selectedValues.podVariationReferenceStyleLevel as (typeof podVariationReferenceStyleLevels)[number]);
    }
    if (
      selectedValues?.podVariationDivergenceLevel &&
      podVariationDivergenceLevels.includes(selectedValues.podVariationDivergenceLevel as (typeof podVariationDivergenceLevels)[number]) &&
      selectedValues.podVariationDivergenceLevel !== divergenceLevel
    ) {
      setDivergenceLevel(selectedValues.podVariationDivergenceLevel as (typeof podVariationDivergenceLevels)[number]);
    }
    if (selectedValues?.podVariationBackgroundColor && selectedValues.podVariationBackgroundColor !== backgroundColor) {
      setBackgroundColor(selectedValues.podVariationBackgroundColor);
    }
    if (selectedValues?.podVariationBurstContent && selectedValues.podVariationBurstContent !== burstContent) {
      setBurstContent(selectedValues.podVariationBurstContent);
    }
    const nextContent = normalizePodVariationContentValue(selectedValues?.podVariationContent);
    if (nextContent !== content) {
      setContent(nextContent);
    }
    if (selectedValues?.podVariationShape && selectedValues.podVariationShape !== shape) {
      setShape(selectedValues.podVariationShape);
    }
    if (selectedValues?.podVariationGraphicStyle && selectedValues.podVariationGraphicStyle !== graphicStyle) {
      setGraphicStyle(selectedValues.podVariationGraphicStyle);
    }
    if (selectedValues?.podVariationVariationDimension && selectedValues.podVariationVariationDimension !== variationDimension) {
      setVariationDimension(selectedValues.podVariationVariationDimension);
    }
    if (selectedValues?.podVariationClockMode && selectedValues.podVariationClockMode !== clockMode) {
      setClockMode(selectedValues.podVariationClockMode);
    }
    const nextClockDialStyles = parsePodVariationClockDialStyles(selectedValues?.podVariationClockDialStyle);
    if (JSON.stringify(nextClockDialStyles) !== JSON.stringify(clockDialStyles)) {
      setClockDialStyles(nextClockDialStyles);
    }
    if (selectedValues?.podVariationClockGenerateMethod && selectedValues.podVariationClockGenerateMethod !== clockGenerateMethod) {
      setClockGenerateMethod(selectedValues.podVariationClockGenerateMethod);
    }
    if (
      selectedValues?.podVariationRatio &&
      podVariationRatioOptions.includes(selectedValues.podVariationRatio as (typeof podVariationRatioOptions)[number]) &&
      selectedValues.podVariationRatio !== ratio
    ) {
      setRatio(selectedValues.podVariationRatio);
    }
    if (selectedValues?.podVariationTinEffectSource && selectedValues.podVariationTinEffectSource !== tinEffectSource) {
      setTinEffectSource(selectedValues.podVariationTinEffectSource);
    }
    if (selectedValues?.podVariationTinEffectPreset && selectedValues.podVariationTinEffectPreset !== tinEffectPreset) {
      setTinEffectPreset(selectedValues.podVariationTinEffectPreset);
    }
    const nextOutputCount = Number(selectedValues?.podVariationOutputCount ?? outputCount);
    if (Number.isFinite(nextOutputCount) && nextOutputCount !== outputCount) {
      setOutputCount(nextOutputCount);
    }
  }, [
    backgroundColor,
    burstContent,
    category,
    content,
    clockDialStyles,
    clockGenerateMethod,
    clockMode,
    divergenceLevel,
    graphicStyle,
    mode,
    outputCount,
    ratio,
    referenceStyleLevel,
    selectedValues,
    shape,
    tinEffectPreset,
    tinEffectSource,
    variationDimension,
    uploads
  ]);

  useEffect(() => {
    const nextSelectionMap = {
      podVariationCategory: category,
      podVariationMode: mode,
      podVariationReferenceStyleLevel: referenceStyleLevel,
      podVariationReferenceStrength: referenceStrength.toFixed(2),
      podVariationDivergenceLevel: divergenceLevel,
      podVariationBackgroundColor: backgroundColor,
      podVariationBurstContent: burstContent,
      podVariationContentEnabled: mode === "爆款二创" ? "false" : "true",
      podVariationContent: mode === "爆款二创" ? burstContent : content,
      podVariationShape: shape,
      podVariationOutputCount: String(outputCount),
      podVariationGraphicStyle: graphicStyle,
      podVariationVariationDimension: variationDimension,
      podVariationClockMode: clockMode,
      podVariationClockDialStyle: clockDialStyles.join(","),
      podVariationClockGenerateMethod: clockGenerateMethod,
      podVariationRatio: ratio,
      podVariationTinEffectSource: tinEffectSource,
      podVariationTinEffectPreset: tinEffectPreset
    };
    skipSelectedValuesSyncRef.current = true;
    lastSelectedValuesSignatureRef.current = JSON.stringify({
      category: nextSelectionMap.podVariationCategory,
      mode: nextSelectionMap.podVariationMode,
      referenceStyleLevel: nextSelectionMap.podVariationReferenceStyleLevel,
      referenceStrength: nextSelectionMap.podVariationReferenceStrength,
      divergenceLevel: nextSelectionMap.podVariationDivergenceLevel,
      backgroundColor: nextSelectionMap.podVariationBackgroundColor,
      burstContent: nextSelectionMap.podVariationBurstContent,
      content: nextSelectionMap.podVariationContent,
      clockDialStyles: nextSelectionMap.podVariationClockDialStyle,
      clockGenerateMethod: nextSelectionMap.podVariationClockGenerateMethod,
      clockMode: nextSelectionMap.podVariationClockMode,
      graphicStyle: nextSelectionMap.podVariationGraphicStyle,
      ratio: nextSelectionMap.podVariationRatio,
      shape: nextSelectionMap.podVariationShape,
      tinEffectPreset: nextSelectionMap.podVariationTinEffectPreset,
      tinEffectSource: nextSelectionMap.podVariationTinEffectSource,
      outputCount: nextSelectionMap.podVariationOutputCount,
      variationDimension: nextSelectionMap.podVariationVariationDimension
    });
    onSelectionMapChange?.(nextSelectionMap);
    onSelectionChange?.(
      (
        isMetalGraphicCategory
          ? [category, `图形风格 ${graphicStyle}`, `变化维度 ${variationDimension}`, `出图数量 ${outputCount}`]
          : isClockCategory
            ? [category, `选择模式 ${clockMode}`, `表盘刻度样式 ${clockDialStyles.join("、")}`, `生成方式 ${clockGenerateMethod}`, `出图数量 ${outputCount}`]
          : isTinPlateCategory
            ? [category, mode, `裂变内容 ${content}`, `效果 ${tinEffectSource}`, `效果预设 ${tinEffectPreset}`, `出图数量 ${outputCount}`, `比例 ${ratio}`]
          : [
              category,
              mode,
              mode === "艺术设计" ? `参考样式 ${referenceStyleLevel}` : "",
              mode === "文字强化" || mode === "通用" ? `原图参考强度 ${referenceStrength.toFixed(2)}` : "",
              mode === "文字强化" ? `创意发散强度 ${divergenceLevel}` : "",
              mode === "文字强化" ? `指定背景色 ${backgroundColor}` : "",
              `裂变内容 ${mode === "爆款二创" ? burstContent : content}`,
              mode === "艺术设计" || mode === "文字强化" || mode === "通用" ? `形状 ${shape}` : "",
              `出图数量 ${outputCount}`,
              `比例 ${ratio}`
            ]
      ).filter(Boolean)
    );
  }, [
    backgroundColor,
    burstContent,
    category,
    content,
    clockDialStyles,
    clockGenerateMethod,
    clockMode,
    divergenceLevel,
    graphicStyle,
    isClockCategory,
    isMetalGraphicCategory,
    isTinPlateCategory,
    mode,
    onSelectionChange,
    onSelectionMapChange,
    outputCount,
    ratio,
    referenceStrength,
    referenceStyleLevel,
    shape,
    tinEffectPreset,
    tinEffectSource,
    variationDimension
  ]);

  return (
    <div className="ck-form-block">
      <AdaptiveChoiceField
        label="品类"
        onChange={(value) => {
          skipSelectedValuesSyncRef.current = true;
          hasManualCategoryRef.current = true;
          setCategory(value);
        }}
        options={podVariationCategoryOptions.map((option) => ({ key: option, label: option }))}
        required
        value={category}
      />

      {isMetalGraphicCategory ? (
        <>
          <div className="ck-form-block">
            <FieldTitle label="图形风格" required />
            <div className="ck-pod-variation-graphic-style-grid">
              {podVariationGraphicStyleOptions.map((option) => (
                <button
                  className={`ck-pod-variation-graphic-style-card${graphicStyle === option.key ? " active" : ""}`}
                  key={option.key}
                  onClick={() => {
                    skipSelectedValuesSyncRef.current = true;
                    setGraphicStyle(option.key);
                  }}
                  type="button"
                >
                  <div className="ck-pod-variation-graphic-style-title">{option.label}</div>
                  <div className="ck-pod-variation-graphic-style-preview">
                    {option.key === "曼陀罗填充" ? (
                      <svg fill="none" viewBox="0 0 120 84" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="60" cy="42" r="18" stroke="currentColor" strokeWidth="2" />
                        <circle cx="60" cy="42" r="29" stroke="currentColor" strokeDasharray="2 4" strokeWidth="2" />
                        <circle cx="60" cy="42" r="39" stroke="currentColor" strokeWidth="2" />
                        <path d="M60 3V81M21 42H99M33 15L87 69M87 15L33 69" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    ) : null}
                    {option.key === "低多边形" ? (
                      <svg fill="none" viewBox="0 0 120 84" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 64L36 18L70 11L97 34L85 69L47 73L21 64Z" stroke="currentColor" strokeWidth="2" />
                        <path d="M36 18L47 73M70 11L85 69M21 64L97 34M47 30L70 48M36 18L70 48M47 73L97 34" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    ) : null}
                    {option.key === "极简线条" ? (
                      <svg fill="none" viewBox="0 0 120 84" xmlns="http://www.w3.org/2000/svg">
                        <path d="M60 12C50 12 43 18 43 27C43 36 48 40 53 44C58 48 60 52 60 60" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                        <path d="M60 12C70 12 77 18 77 27C77 36 72 40 67 44C62 48 60 52 60 60" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                        <path d="M60 60V72M42 72H78" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    ) : null}
                    {option.key === "负空间" ? (
                      <svg fill="currentColor" viewBox="0 0 120 84" xmlns="http://www.w3.org/2000/svg">
                        <path d="M33 60C33 47 44 36 57 36H60C76 36 87 47 87 60C87 68 81 73 73 73H47C39 73 33 68 33 60Z" />
                        <circle cx="51" cy="45" fill="#fff" r="5" />
                        <circle cx="69" cy="45" fill="#fff" r="5" />
                        <path d="M57 52C59 55 61 56 63 56C65 56 67 55 69 52" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    ) : null}
                    {option.key === "炫彩珐琅" ? (
                      <svg fill="none" viewBox="0 0 120 84" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="60" cy="42" fill="#FFCC4D" r="30" stroke="currentColor" strokeWidth="2" />
                        <path d="M60 12V72M30 42H90M39 21L81 63M81 21L39 63" stroke="currentColor" strokeWidth="2" />
                        <path d="M60 18C53 24 48 30 48 37C48 44 53 49 60 49C67 49 72 44 72 37C72 30 67 24 60 18Z" fill="#FF8A5B" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="ck-inline-field ck-pod-variation-inline-field">
            <FieldTitle label="变化维度" required />
            <SelectField
              hideLabel
              label="变化维度"
              onChange={(value) => {
                skipSelectedValuesSyncRef.current = true;
                setVariationDimension(value);
              }}
              options={[...podVariationDimensionOptions]}
              required
              value={variationDimension}
            />
          </div>
          <div className="ck-pod-variation-inline-hint">裂变主体：样式参考裂变内容</div>
        </>
      ) : isClockCategory ? (
        <>
          <div className="ck-form-block">
            <FieldTitle label="选择模式" required />
            <div className="ck-choice-row ck-choice-row-retouch ck-choice-row-retouch-primary ck-pod-variation-mode-row">
              {podVariationClockModeOptions.map((option) => (
                <button
                  className={`ck-mode-card ck-mode-card-primary ck-pod-variation-clock-mode-compact${clockMode === option.key ? " active" : ""}`}
                  key={option.key}
                  onClick={() => {
                    skipSelectedValuesSyncRef.current = true;
                    setClockMode(option.key);
                  }}
                  type="button"
                >
                  <div className="ck-mode-card-head">
                    <strong>{option.label}</strong>
                    <span className={`ck-check${clockMode === option.key ? " active" : ""}`} />
                  </div>
                  <p>{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="ck-form-block">
            <FieldTitle label="选择表盘刻度样式" required />
            <div className="ck-pod-variation-clock-dial-grid">
              {podVariationClockDialStyleOptions.map((option, index) => (
                <button
                  className={`ck-pod-variation-clock-dial-card${clockDialStyles.includes(option) ? " active" : ""}`}
                  key={option}
                  onClick={() => {
                    skipSelectedValuesSyncRef.current = true;
                    setClockDialStyles((current) => {
                      if (current.includes(option)) {
                        return current.length > 1 ? current.filter((item) => item !== option) : current;
                      }
                      return [...current, option];
                    });
                  }}
                  type="button"
                >
                  <div className="ck-pod-variation-clock-dial-preview">
                    <svg fill="none" viewBox="0 0 92 92" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="46" cy="46" fill="#fff" r="42" stroke={index === 6 ? "#1f2024" : "#d5d7de"} strokeWidth={index === 6 ? "2.5" : "1.5"} />
                      {index === 0 ? <path d="M46 11V18M46 74V81M11 46H18M74 46H81M20.5 20.5L25.5 25.5M66.5 66.5L71.5 71.5M20.5 71.5L25.5 66.5M66.5 25.5L71.5 20.5" stroke="#1f2024" strokeLinecap="round" strokeWidth="2" /> : null}
                      {index === 1 ? <path d="M16 24L22 28M70 64L76 68M24 76L28 70M64 22L68 16M46 11V18M46 74V81" stroke="#1f2024" strokeLinecap="round" strokeWidth="2" /> : null}
                      {index === 2 ? <path d="M46 13V22M46 70V79M14 46H23M69 46H78M24 24L30 30M62 62L68 68" stroke="#1f2024" strokeLinecap="round" strokeWidth="2.3" /> : null}
                      {index === 3 ? <path d="M46 10V22M46 70V82M10 46H22M70 46H82M22 22L29 29M63 63L70 70M22 70L29 63M63 29L70 22" stroke="#1f2024" strokeLinecap="round" strokeWidth="3" /> : null}
                      {index === 4 ? <path d="M46 13V20M46 72V79M13 46H20M72 46H79M22 22L27 27M65 65L70 70M22 70L27 65M65 27L70 22" stroke="#1f2024" strokeLinecap="round" strokeWidth="1.7" /> : null}
                      {index === 5 ? <path d="M46 14V18M46 74V78M14 46H18M74 46H78M23 23L26 26M66 66L69 69M23 69L26 66M66 26L69 23" stroke="#1f2024" strokeLinecap="round" strokeWidth="1.6" /> : null}
                      {index === 6 ? <path d="M46 12V17M46 75V80M12 46H17M75 46H80M24 24L28 28M64 64L68 68M24 68L28 64M64 28L68 24" stroke="#1f2024" strokeLinecap="round" strokeWidth="1.6" /> : null}
                      {index === 7 ? <path d="M46 10V20M46 72V82M10 46H20M72 46H82M22 22L30 30M62 62L70 70" stroke="#1f2024" strokeLinecap="round" strokeWidth="2.8" /> : null}
                    </svg>
                  </div>
                  <div className="ck-pod-variation-clock-dial-label">{option}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="ck-inline-field ck-pod-variation-inline-field">
            <FieldTitle label="生成方式" required />
            <SelectField
              hideLabel
              label="生成方式"
              onChange={(value) => {
                skipSelectedValuesSyncRef.current = true;
                setClockGenerateMethod(value);
              }}
              options={[...podVariationClockGenerateMethodOptions]}
              required
              value={clockGenerateMethod}
            />
          </div>
          <div className="ck-pod-variation-inline-hint">
            {clockGenerateMethod === "随机组合生成"
              ? "上传的背景素材和选择的表盘，进行随机组合生成"
              : "上传的背景素材和选择的表盘，进行逐一生成。例，1个背景，选择3个表盘，会生成3个任务。"}
          </div>
        </>
      ) : (
        <div className="ck-form-block">
          <FieldTitle label="选择模式" required />
          <div className="ck-choice-row ck-choice-row-retouch ck-choice-row-retouch-primary ck-pod-variation-mode-row">
            {visibleModeOptions.map((option) => (
              <button
                className={`ck-mode-card ck-mode-card-primary ck-mode-card-title-only${mode === option ? " active" : ""}`}
                key={option}
                onClick={() => {
                  skipSelectedValuesSyncRef.current = true;
                  setMode(option);
                }}
                type="button"
              >
                <div className="ck-mode-card-head">
                  <strong>{option}</strong>
                  <span className={`ck-check${mode === option ? " active" : ""}`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isMetalGraphicCategory && !isClockCategory && mode === "艺术设计" ? (
        <InlineSliderField
          label="参考样式"
          max={2}
          min={0}
          onChange={(next) => {
            skipSelectedValuesSyncRef.current = true;
            setReferenceStyleLevel(podVariationReferenceStyleLevels[Math.round(next)] ?? "高");
          }}
          step={1}
          value={podVariationReferenceStyleLevels.indexOf(referenceStyleLevel)}
          valueFormatter={(current) => podVariationReferenceStyleLevels[Math.round(current)] ?? "高"}
        />
      ) : null}

      {!isMetalGraphicCategory && !isClockCategory && (mode === "文字强化" || mode === "通用") ? (
        <InlineSliderField
          label="原图参考强度"
          max={1}
          min={0.1}
          onChange={(next) => {
            skipSelectedValuesSyncRef.current = true;
            setReferenceStrength(next);
          }}
          step={0.05}
          value={referenceStrength}
          valueFormatter={(current) => current.toFixed(2)}
        />
      ) : null}

      {!isMetalGraphicCategory && !isClockCategory && mode === "文字强化" ? (
        <>
          <InlineSliderField
            label="创意发散强度"
            max={2}
            min={0}
            onChange={(next) => {
              skipSelectedValuesSyncRef.current = true;
              setDivergenceLevel(podVariationDivergenceLevels[Math.round(next)] ?? "低");
            }}
            step={1}
            value={podVariationDivergenceLevels.indexOf(divergenceLevel)}
            valueFormatter={(current) => podVariationDivergenceLevels[Math.round(current)] ?? "低"}
          />
          <div className="ck-inline-field ck-pod-variation-inline-field">
            <FieldTitle label="指定背景色" required />
            <SelectField
              hideLabel
              label="指定背景色"
              onChange={(value) => {
                skipSelectedValuesSyncRef.current = true;
                setBackgroundColor(value);
              }}
              options={["随机", "黑色", "白色"]}
              required
              value={backgroundColor}
            />
          </div>
        </>
      ) : null}

      {!isMetalGraphicCategory && !isClockCategory && !isTinPlateCategory && mode === "爆款二创" ? (
        <div className="ck-inline-field ck-pod-variation-inline-field">
          <FieldTitle label="裂变内容" required />
          <SelectField
            hideLabel
            label="裂变内容"
            onChange={(value) => {
              skipSelectedValuesSyncRef.current = true;
              setBurstContent(value);
            }}
            options={[...podVariationBurstOptions]}
            required
            value={burstContent}
          />
        </div>
      ) : !isMetalGraphicCategory && !isClockCategory ? (
        <div className="ck-inline-field ck-pod-variation-inline-field">
          <FieldTitle label="裂变内容" required />
          <SelectField
            hideLabel
            label="裂变内容"
            onChange={(value) => {
              skipSelectedValuesSyncRef.current = true;
              setContent(normalizePodVariationContentValue(value));
            }}
            options={[...podVariationContentOptions]}
            required
            value={content}
          />
        </div>
      ) : null}

      {isTinPlateCategory ? (
        <div className="ck-form-block">
          <div className="ck-inline-field ck-aligned-inline-field">
            <FieldTitle label="贴合样式" />
            <button
              aria-pressed={tinEffectSource === "锈斑"}
              className={`ck-pod-extract-toggle${tinEffectSource === "锈斑" ? " active" : ""}`}
              onClick={() => {
                skipSelectedValuesSyncRef.current = true;
                setTinEffectSource((value) => (value === "锈斑" ? "自定义上传" : "锈斑"));
              }}
              type="button"
            >
              <span />
            </button>
          </div>
          {tinEffectSource === "锈斑" ? (
            <div className="ck-pod-variation-clock-dial-grid">
              {podVariationTinEffectPresetOptions.map((option, index) => (
                <button
                  className={`ck-pod-variation-clock-dial-card${tinEffectPreset === option ? " active" : ""}`}
                  key={option}
                  onClick={() => {
                    skipSelectedValuesSyncRef.current = true;
                    setTinEffectSource("锈斑");
                    setTinEffectPreset(option);
                  }}
                  type="button"
                >
                  <div className="ck-pod-variation-clock-dial-preview ck-pod-variation-effect-card-preview">
                    <div className={`ck-pod-variation-effect-preview effect-${index + 1}`} />
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {!isMetalGraphicCategory && !isClockCategory && !isTinPlateCategory && (mode === "艺术设计" || mode === "文字强化" || mode === "通用") ? (
        <div className="ck-inline-field ck-pod-variation-inline-field">
          <FieldTitle label="形状" required />
          <SelectField
            hideLabel
            label="形状"
            onChange={(value) => {
              skipSelectedValuesSyncRef.current = true;
              setShape(value);
            }}
            options={[...podVariationShapeOptions]}
            required
            value={shape}
          />
        </div>
      ) : null}

      {!isMetalGraphicCategory && !isClockCategory ? (
        <div className="ck-inline-field ck-pod-variation-inline-field">
          <FieldTitle label="出图比例" required />
          <SelectField
            hideLabel
            label="出图比例"
            onChange={(value) => {
              skipSelectedValuesSyncRef.current = true;
              setRatio(value);
            }}
            options={[...podVariationRatioOptions]}
            required
            value={ratio}
          />
        </div>
      ) : null}

      <NumberStepperField
        label="出图数量"
        max={8}
        min={1}
        onChange={(value) => {
          skipSelectedValuesSyncRef.current = true;
          setOutputCount(value);
        }}
        required
        value={outputCount}
      />
    </div>
  );
}

function PatternRepeatPromptList({
  promptItems,
  onChange
}: {
  promptItems: PatternRepeatPromptItem[];
  onChange: (items: PatternRepeatPromptItem[]) => void;
}) {
  const updatePromptItem = (id: string, updater: (item: PatternRepeatPromptItem) => PatternRepeatPromptItem) => {
    onChange(promptItems.map((item) => (item.id === id ? updater(item) : item)));
  };

  const addPromptItem = () => {
    onChange([...promptItems, { id: generateRandomTenDigitId(), text: "" }]);
  };

  const removePromptItem = (id: string) => {
    if (promptItems.length === 1) {
      onChange([{ id: generateRandomTenDigitId(), text: "" }]);
      return;
    }
    onChange(promptItems.filter((item) => item.id !== id));
  };

  return (
    <div className="ck-form-block ck-partial-edit-dynamic-list-field">
      <div className="ck-partial-edit-dynamic-list">
        {promptItems.map((item, index) => (
          <div className="ck-partial-edit-dynamic-list-row" key={item.id}>
            <div className="ck-pattern-repeat-textarea-shell">
              <span className="ck-partial-edit-dynamic-list-index">{index + 1}</span>
              <UnifiedTextareaField
                formBlockClassName="ck-form-block ck-set-pack-selling-points ck-pattern-repeat-textarea-item"
                maxLength={2000}
                onChange={(value) => updatePromptItem(item.id, (current) => ({ ...current, text: value }))}
                placeholder="描述你想要生成的图片"
                value={item.text}
              />
              {promptItems.length > 1 ? (
                <button
                  aria-label={`删除第${index + 1}个替换内容`}
                  className="ck-partial-edit-remove-button"
                  onClick={() => removePromptItem(item.id)}
                  type="button"
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {promptItems.length < 10 ? (
          <button className="ck-partial-edit-add-button" onClick={addPromptItem} type="button">
            +
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PatternRepeatSetupSection({
  uploads,
  remainingStorageMb,
  onAddUpload,
  onRemoveUpload,
  onOpenLibrary,
  onRejectedUpload,
  onAtLimit,
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onCreationModeChange
}: {
  uploads: Record<string, UploadItem[]>;
  remainingStorageMb: number;
  onAddUpload: (fieldKey: string, nextValues: UploadItem[]) => void;
  onRemoveUpload: (fieldKey: string, index: number) => void;
  onUpdateUploadItems: (fieldKey: string, updater: (items: UploadItem[]) => UploadItem[]) => void;
  onOpenLibrary: (fieldKey: string) => void;
  onRejectedUpload: (message: string) => void;
  onAtLimit: () => void;
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onCreationModeChange?: (selection: CreationModeSelection) => void;
}) {
  const mainUploadKey = "video-pattern-repeat:main";
  const expandUploadKey = "video-pattern-repeat:expand";
  const fixedRatioDropdownRef = useRef<HTMLDivElement | null>(null);
  const skipSelectedValuesSyncRef = useRef(false);
  const [repeatType, setRepeatType] = useState<string>(selectedValues?.patternRepeatType ?? patternRepeatTypeOptions[0]);
  const [createMode, setCreateMode] = useState<string>(selectedValues?.patternRepeatCreateMode ?? patternRepeatCreateModeOptions[0]);
  const [generateMode, setGenerateMode] = useState<string>(selectedValues?.patternRepeatGenerateMode ?? patternRepeatGenerateModeOptions[0]);
  const [ratio, setRatio] = useState<string>(selectedValues?.patternRepeatRatio ?? patternRepeatRatioOptions[0]);
  const [outputCount, setOutputCount] = useState<string>(selectedValues?.patternRepeatOutputCount ?? patternRepeatOutputCountOptions[0]);
  const [densityLevel, setDensityLevel] = useState<(typeof patternRepeatDensityLevels)[number]>(
    (selectedValues?.patternRepeatDensityLevel as (typeof patternRepeatDensityLevels)[number]) ?? patternRepeatDensityLevels[1]
  );
  const [promptItems, setPromptItems] = useState<PatternRepeatPromptItem[]>(() => getPatternRepeatPromptItems(selectedValues));
  const lastSyncedValuesRef = useRef("");

  useEffect(() => {
    if (skipSelectedValuesSyncRef.current) {
      skipSelectedValuesSyncRef.current = false;
      return;
    }
    const nextSyncKey = JSON.stringify({
      patternRepeatType: selectedValues?.patternRepeatType ?? patternRepeatTypeOptions[0],
      patternRepeatCreateMode: selectedValues?.patternRepeatCreateMode ?? patternRepeatCreateModeOptions[0],
      patternRepeatGenerateMode: selectedValues?.patternRepeatGenerateMode ?? patternRepeatGenerateModeOptions[0],
      patternRepeatRatio: selectedValues?.patternRepeatRatio ?? patternRepeatRatioOptions[0],
      patternRepeatOutputCount: selectedValues?.patternRepeatOutputCount ?? patternRepeatOutputCountOptions[0],
      patternRepeatDensityLevel: selectedValues?.patternRepeatDensityLevel ?? patternRepeatDensityLevels[1],
      patternRepeatPrompts: selectedValues?.patternRepeatPrompts ?? ""
    });

    if (nextSyncKey === lastSyncedValuesRef.current) {
      return;
    }

    lastSyncedValuesRef.current = nextSyncKey;
    setRepeatType(selectedValues?.patternRepeatType ?? patternRepeatTypeOptions[0]);
    setCreateMode(selectedValues?.patternRepeatCreateMode ?? patternRepeatCreateModeOptions[0]);
    setGenerateMode(selectedValues?.patternRepeatGenerateMode ?? patternRepeatGenerateModeOptions[0]);
    setRatio(selectedValues?.patternRepeatRatio ?? patternRepeatRatioOptions[0]);
    setOutputCount(selectedValues?.patternRepeatOutputCount ?? patternRepeatOutputCountOptions[0]);
    setDensityLevel((selectedValues?.patternRepeatDensityLevel as (typeof patternRepeatDensityLevels)[number]) ?? patternRepeatDensityLevels[1]);
    setPromptItems(getPatternRepeatPromptItems(selectedValues));
  }, [selectedValues]);

  useEffect(() => {
    const nextSelectionMap: AdvancedSelectionMap = {
      patternRepeatType: repeatType,
      patternRepeatCreateMode: repeatType === "四方连续" ? createMode : "",
      patternRepeatRatio: repeatType === "四方连续" ? "1:1" : ratio,
      patternRepeatOutputCount: outputCount,
      patternRepeatDensityLevel: repeatType === "扩大画幅" ? densityLevel : "",
      patternRepeatPrompts: repeatType === "四方连续" && createMode === "文生图" ? JSON.stringify(promptItems) : ""
    };

    if (repeatType === "四方连续") {
      nextSelectionMap.patternRepeatGenerateMode = generateMode;
    }

    skipSelectedValuesSyncRef.current = true;
    lastSyncedValuesRef.current = JSON.stringify({
      patternRepeatType: nextSelectionMap.patternRepeatType ?? patternRepeatTypeOptions[0],
      patternRepeatCreateMode: nextSelectionMap.patternRepeatCreateMode ?? patternRepeatCreateModeOptions[0],
      patternRepeatGenerateMode: nextSelectionMap.patternRepeatGenerateMode ?? patternRepeatGenerateModeOptions[0],
      patternRepeatRatio: nextSelectionMap.patternRepeatRatio ?? patternRepeatRatioOptions[0],
      patternRepeatOutputCount: nextSelectionMap.patternRepeatOutputCount ?? patternRepeatOutputCountOptions[0],
      patternRepeatDensityLevel: nextSelectionMap.patternRepeatDensityLevel ?? patternRepeatDensityLevels[1],
      patternRepeatPrompts: nextSelectionMap.patternRepeatPrompts ?? ""
    });
    onSelectionMapChange?.(nextSelectionMap);
    onSelectionChange?.(
      [
        repeatType,
        repeatType === "四方连续" ? createMode : "",
        repeatType === "四方连续" && createMode === "图生图" ? `生成模式 ${generateMode}` : "",
        repeatType === "扩大画幅" ? `元素密度 ${densityLevel}` : "",
        `尺寸比例 ${repeatType === "四方连续" ? "1:1" : ratio}`,
        `出图数量 ${outputCount}`,
        repeatType === "四方连续" && createMode === "文生图"
          ? `提示词 ${promptItems.filter((item) => item.text.trim() || item.reverseImage).length} 条`
          : ""
      ].filter(Boolean)
    );
    onCreationModeChange?.({
      modeId: `video-pattern-repeat-${repeatType}-${repeatType === "四方连续" ? createMode : repeatType}`,
      modeLabel: repeatType === "四方连续" ? `${repeatType}·${createMode}` : repeatType,
      ratio: repeatType === "四方连续" ? "1:1" : ratio,
      count: Math.min(4, Math.max(1, Number(outputCount) || 1)),
      unitCreditCost: 5
    });
  }, [createMode, densityLevel, generateMode, onCreationModeChange, onSelectionChange, onSelectionMapChange, outputCount, promptItems, ratio, repeatType]);

  return (
    <div className="ck-form-block">
      <AdaptiveSegmentedField
        fullWidth
        label=""
        onChange={(value) => {
          skipSelectedValuesSyncRef.current = true;
          setRepeatType(value);
        }}
        options={[...patternRepeatTypeOptions]}
        required
        value={repeatType}
      />

      {repeatType === "四方连续" ? (
        <>
          <AdaptiveSegmentedField
            fullWidth
            label=""
            onChange={(value) => {
              skipSelectedValuesSyncRef.current = true;
              setCreateMode(value);
            }}
            options={[...patternRepeatCreateModeOptions]}
            required
            value={createMode}
          />

          {createMode === "图生图" ? (
            <>
              <UploadField
                fieldKey={mainUploadKey}
                hint="最多24张，支持JPG/PNG/WebP"
                label="添加素材"
                maxCount={24}
                meta="（单次最多上传24张）"
                onAdd={onAddUpload}
                onAtLimit={onAtLimit}
                onOpenLibrary={onOpenLibrary}
                onRejectedUpload={onRejectedUpload}
                onRemove={onRemoveUpload}
                remainingStorageMb={remainingStorageMb}
                required
                values={uploads[mainUploadKey] ?? []}
              />

              <div className="ck-inline-field ck-pod-variation-inline-field">
                <FieldTitle label="生成模式" required />
                <SelectField
                  hideLabel
                  label="生成模式"
                  onChange={(value) => {
                    skipSelectedValuesSyncRef.current = true;
                    setGenerateMode(value);
                  }}
                  options={[...patternRepeatGenerateModeOptions]}
                  required
                  value={generateMode}
                />
              </div>
            </>
          ) : (
            <PatternRepeatPromptList
              onChange={(items) => {
                skipSelectedValuesSyncRef.current = true;
                setPromptItems(items);
              }}
              promptItems={promptItems}
            />
          )}

          <div className="ck-inline-field ck-aligned-inline-field">
            <FieldTitle label="出图比例" required />
            <div className="ck-select-dropdown" ref={fixedRatioDropdownRef}>
              <button className="ck-select" type="button">
                1:1
                <span>⌄</span>
              </button>
            </div>
          </div>

          <CountField
            label="出图数量"
            onChange={setOutputCount}
            options={[...patternRepeatOutputCountOptions]}
            required
            value={outputCount}
          />
        </>
      ) : repeatType === "二方连续" ? (
        <>
          <UploadField
            fieldKey={mainUploadKey}
            hint="最多24张，支持JPG/PNG/WebP"
            label="添加素材"
            maxCount={24}
            meta="（单次最多上传24张）"
            onAdd={onAddUpload}
            onAtLimit={onAtLimit}
            onOpenLibrary={onOpenLibrary}
            onRejectedUpload={onRejectedUpload}
            onRemove={onRemoveUpload}
            remainingStorageMb={remainingStorageMb}
            required
            values={uploads[mainUploadKey] ?? []}
          />

          <div className="ck-inline-field ck-aligned-inline-field">
            <FieldTitle label="出图比例" required />
            <SelectField
              className="ck-pattern-repeat-inline-select"
              hideLabel
              label="出图比例"
              onChange={(value) => {
                skipSelectedValuesSyncRef.current = true;
                setRatio(value);
              }}
              options={[...patternRepeatRatioOptions]}
              required
              value={ratio}
            />
          </div>

          <CountField
            label="出图数量"
            onChange={setOutputCount}
            options={[...patternRepeatOutputCountOptions]}
            required
            value={outputCount}
          />
        </>
      ) : (
        <>
          <UploadField
            fieldKey={expandUploadKey}
            hint="最多24张，支持JPG/PNG/WebP"
            label="添加素材"
            maxCount={24}
            meta="（单次最多上传24张）"
            onAdd={onAddUpload}
            onAtLimit={onAtLimit}
            onOpenLibrary={onOpenLibrary}
            onRejectedUpload={onRejectedUpload}
            onRemove={onRemoveUpload}
            remainingStorageMb={remainingStorageMb}
            required
            values={uploads[expandUploadKey] ?? []}
          />

          <InlineSliderField
            label="元素密度"
            max={2}
            min={0}
            onChange={(next) => {
              skipSelectedValuesSyncRef.current = true;
              setDensityLevel(patternRepeatDensityLevels[Math.round(next)] ?? patternRepeatDensityLevels[1]);
            }}
            step={1}
            value={patternRepeatDensityLevels.indexOf(densityLevel)}
            valueFormatter={(current) => patternRepeatDensityLevels[Math.round(current)] ?? patternRepeatDensityLevels[1]}
          />

          <div className="ck-inline-field ck-aligned-inline-field">
            <FieldTitle label="出图比例" required />
            <SelectField
              className="ck-pattern-repeat-inline-select"
              hideLabel
              label="出图比例"
              onChange={(value) => {
                skipSelectedValuesSyncRef.current = true;
                setRatio(value);
              }}
              options={[...patternRepeatRatioOptions]}
              required
              value={ratio}
            />
          </div>

          <CountField
            label="出图数量"
            onChange={setOutputCount}
            options={[...patternRepeatOutputCountOptions]}
            required
            value={outputCount}
          />
        </>
      )}
    </div>
  );
}

function VideoStylePrintSetupSection({
  uploads,
  remainingStorageMb,
  onAddUpload,
  onRemoveUpload,
  onOpenLibrary,
  onRejectedUpload,
  onAtLimit,
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onCreationModeChange
}: {
  uploads: Record<string, UploadItem[]>;
  remainingStorageMb: number;
  onAddUpload: (fieldKey: string, nextValues: UploadItem[]) => void;
  onRemoveUpload: (fieldKey: string, index: number) => void;
  onOpenLibrary: (fieldKey: string) => void;
  onRejectedUpload: (message: string) => void;
  onAtLimit: () => void;
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onCreationModeChange?: (selection: CreationModeSelection) => void;
}) {
  const mainUploadKey = "video-style-print:main";
  const styleUploadKey = "video-style-print:style";
  const skipSelectedValuesSyncRef = useRef(false);
  const [createMode, setCreateMode] = useState<string>(selectedValues?.videoStylePrintCreateMode ?? videoStylePrintCreateModeOptions[0]);
  const [ratio, setRatio] = useState<string>(selectedValues?.videoStylePrintRatio ?? videoStylePrintRatioOptions[0]);
  const [outputCount, setOutputCount] = useState<string>(selectedValues?.videoStylePrintOutputCount ?? videoStylePrintOutputCountOptions[0]);
  const [promptItems, setPromptItems] = useState<PatternRepeatPromptItem[]>(() => getVideoStylePrintPromptItems(selectedValues));
  const lastSyncedValuesRef = useRef("");

  useEffect(() => {
    if (skipSelectedValuesSyncRef.current) {
      skipSelectedValuesSyncRef.current = false;
      return;
    }
    const nextSyncKey = JSON.stringify({
      videoStylePrintCreateMode: selectedValues?.videoStylePrintCreateMode ?? videoStylePrintCreateModeOptions[0],
      videoStylePrintRatio: selectedValues?.videoStylePrintRatio ?? videoStylePrintRatioOptions[0],
      videoStylePrintOutputCount: selectedValues?.videoStylePrintOutputCount ?? videoStylePrintOutputCountOptions[0],
      videoStylePrintPrompts: selectedValues?.videoStylePrintPrompts ?? ""
    });

    if (nextSyncKey === lastSyncedValuesRef.current) return;

    lastSyncedValuesRef.current = nextSyncKey;
    setCreateMode(selectedValues?.videoStylePrintCreateMode ?? videoStylePrintCreateModeOptions[0]);
    setRatio(selectedValues?.videoStylePrintRatio ?? videoStylePrintRatioOptions[0]);
    setOutputCount(selectedValues?.videoStylePrintOutputCount ?? videoStylePrintOutputCountOptions[0]);
    setPromptItems(getVideoStylePrintPromptItems(selectedValues));
  }, [selectedValues]);

  useEffect(() => {
    const nextSelectionMap: AdvancedSelectionMap = {
      videoStylePrintCreateMode: createMode,
      videoStylePrintRatio: ratio,
      videoStylePrintOutputCount: outputCount,
      videoStylePrintPrompts: createMode === "文生图" ? JSON.stringify(promptItems) : ""
    };

    skipSelectedValuesSyncRef.current = true;
    lastSyncedValuesRef.current = JSON.stringify(nextSelectionMap);
    onSelectionMapChange?.(nextSelectionMap);
    onSelectionChange?.(
      [
        `生成方式 ${createMode}`,
        `出图比例 ${ratio}`,
        `出图数量 ${outputCount}`,
        createMode === "文生图" ? `提示词 ${promptItems.filter((item) => item.text.trim() || item.reverseImage).length} 条` : ""
      ].filter(Boolean)
    );
    onCreationModeChange?.({
      modeId: `video-style-print-${createMode}`,
      modeLabel: `POD风格参考·${createMode}`,
      ratio,
      count: Math.min(4, Math.max(1, Number(outputCount) || 1)),
      unitCreditCost: 5
    });
  }, [createMode, onCreationModeChange, onSelectionChange, onSelectionMapChange, outputCount, promptItems, ratio]);

  return (
    <div className="ck-form-block">
      <UploadField
        fieldKey={styleUploadKey}
        hint="最多24张，支持JPG/PNG/WebP"
        label="添加风格"
        maxCount={24}
        meta="（单次最多上传24张）"
        onAdd={onAddUpload}
        onAtLimit={onAtLimit}
        onOpenLibrary={onOpenLibrary}
        onRejectedUpload={onRejectedUpload}
        onRemove={onRemoveUpload}
        remainingStorageMb={remainingStorageMb}
        required
        values={uploads[styleUploadKey] ?? []}
      />

      <AdaptiveSegmentedField
        fullWidth
        label=""
        onChange={(value) => {
          skipSelectedValuesSyncRef.current = true;
          setCreateMode(value);
        }}
        options={[...videoStylePrintCreateModeOptions]}
        required
        value={createMode}
      />

      {createMode === "图生图" ? (
        <UploadField
          fieldKey={mainUploadKey}
          hint="最多24张，支持JPG/PNG/WebP"
          label="添加素材"
          maxCount={24}
          meta="（单次最多上传24张）"
          onAdd={onAddUpload}
          onAtLimit={onAtLimit}
          onOpenLibrary={onOpenLibrary}
          onRejectedUpload={onRejectedUpload}
          onRemove={onRemoveUpload}
          remainingStorageMb={remainingStorageMb}
          required
          values={uploads[mainUploadKey] ?? []}
        />
      ) : (
        <PatternRepeatPromptList
          onChange={(items) => {
            skipSelectedValuesSyncRef.current = true;
            setPromptItems(items);
          }}
          promptItems={promptItems}
        />
      )}

      <div className="ck-inline-field ck-aligned-inline-field">
        <FieldTitle label="出图比例" required />
        <SelectField
          className="ck-video-2d3d-inline-select"
          hideLabel
          label="出图比例"
          onChange={(value) => {
            skipSelectedValuesSyncRef.current = true;
            setRatio(value);
          }}
          options={[...videoStylePrintRatioOptions]}
          required
          value={ratio}
        />
      </div>

      <CountField
        label="出图数量"
        onChange={setOutputCount}
        options={[...videoStylePrintOutputCountOptions]}
        required
        value={outputCount}
      />
    </div>
  );
}

function Video2d3dSetupSection({
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onCreationModeChange
}: {
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onCreationModeChange?: (selection: CreationModeSelection) => void;
}) {
  const skipSelectedValuesSyncRef = useRef(false);
  const [category, setCategory] = useState<string>(selectedValues?.video2d3dStyleCategory ?? video2d3dStyleCategories[0]);
  const [style, setStyle] = useState<string>(selectedValues?.video2d3dStyle ?? video2d3dStyleOptions[0]);
  const [ratio, setRatio] = useState<string>(selectedValues?.video2d3dRatio ?? video2d3dRatioOptions[0]);
  const [outputCount, setOutputCount] = useState<string>(selectedValues?.video2d3dOutputCount ?? video2d3dOutputCountOptions[0]);
  const lastSyncedValuesRef = useRef("");
  const visibleStyleOptions = (video2d3dStyleCategoryMap[category as keyof typeof video2d3dStyleCategoryMap] ?? video2d3dStyleOptions) as readonly string[];

  useEffect(() => {
    if (skipSelectedValuesSyncRef.current) {
      skipSelectedValuesSyncRef.current = false;
      return;
    }
    const nextSyncKey = JSON.stringify({
      video2d3dStyleCategory: selectedValues?.video2d3dStyleCategory ?? video2d3dStyleCategories[0],
      video2d3dStyle: selectedValues?.video2d3dStyle ?? video2d3dStyleOptions[0],
      video2d3dRatio: selectedValues?.video2d3dRatio ?? video2d3dRatioOptions[0],
      video2d3dOutputCount: selectedValues?.video2d3dOutputCount ?? video2d3dOutputCountOptions[0]
    });
    if (nextSyncKey === lastSyncedValuesRef.current) return;
    lastSyncedValuesRef.current = nextSyncKey;
    setCategory(selectedValues?.video2d3dStyleCategory ?? video2d3dStyleCategories[0]);
    setStyle(selectedValues?.video2d3dStyle ?? video2d3dStyleOptions[0]);
    setRatio(selectedValues?.video2d3dRatio ?? video2d3dRatioOptions[0]);
    setOutputCount(selectedValues?.video2d3dOutputCount ?? video2d3dOutputCountOptions[0]);
  }, [selectedValues]);

  useEffect(() => {
    if (visibleStyleOptions.includes(style)) return;
    skipSelectedValuesSyncRef.current = true;
    setStyle(visibleStyleOptions[0] ?? video2d3dStyleOptions[0]);
  }, [category, style, visibleStyleOptions]);

  useEffect(() => {
    const nextSelectionMap: AdvancedSelectionMap = {
      video2d3dStyleCategory: category,
      video2d3dStyle: style,
      video2d3dRatio: ratio,
      video2d3dOutputCount: outputCount
    };
    skipSelectedValuesSyncRef.current = true;
    lastSyncedValuesRef.current = JSON.stringify(nextSelectionMap);
    onSelectionMapChange?.(nextSelectionMap);
    onSelectionChange?.([`风格分类 ${category}`, `选择风格 ${style}`, `出图比例 ${ratio}`, `出图数量 ${outputCount}`]);
    onCreationModeChange?.({
      modeId: `video-2d3d-${style}`,
      modeLabel: `风格转绘·${style}`,
      ratio,
      count: Math.min(4, Math.max(1, Number(outputCount) || 1)),
      unitCreditCost: 5
    });
  }, [category, onCreationModeChange, onSelectionChange, onSelectionMapChange, outputCount, ratio, style]);

  return (
    <div className="ck-form-block">
      <div className="ck-form-block">
        <FieldTitle label="选择风格" required />
        <div className="ck-task-rail-mode-switch ck-baseline-model-tabs">
          {video2d3dStyleCategories.map((option) => (
            <button
              className={category === option ? "active" : ""}
              key={option}
              onClick={() => {
                skipSelectedValuesSyncRef.current = true;
                setCategory(option);
              }}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
        <div className="ck-pod-variation-clock-dial-grid">
          {visibleStyleOptions.map((option, index) => (
            <button
              className={`ck-pod-variation-clock-dial-card${style === option ? " active" : ""}`}
              key={option}
              onClick={() => {
                skipSelectedValuesSyncRef.current = true;
                setStyle(option);
              }}
              type="button"
            >
              <div className="ck-pod-variation-clock-dial-preview ck-pod-variation-effect-card-preview">
                <div className={`ck-video-2d3d-style-preview style-${(index % 8) + 1}`}>
                  <span />
                  <i />
                </div>
              </div>
              <div className="ck-pod-variation-clock-dial-label">{option}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="ck-inline-field ck-aligned-inline-field">
        <FieldTitle label="出图比例" required />
        <SelectField
          hideLabel
          label="出图比例"
          onChange={(value) => {
            skipSelectedValuesSyncRef.current = true;
            setRatio(value);
          }}
          options={[...video2d3dRatioOptions]}
          required
          value={ratio}
        />
      </div>

      <CountField
        label="出图数量"
        onChange={setOutputCount}
        options={[...video2d3dOutputCountOptions]}
        required
        value={outputCount}
      />
    </div>
  );
}

function VideoSceneGridPreview({ mode }: { mode: VideoSceneGridModeKey }) {
  return (
    <div className={`ck-video-scene-grid-preview ${mode === "情侣图案" ? "couple" : mode === "主副图案" ? "primary-secondary" : "series"}`}>
      {mode === "系列图案" ? (
        <>
          <span className="tile orange" />
          <span className="tile beige" />
          <span className="tile green" />
        </>
      ) : null}
      {mode === "主副图案" ? (
        <>
          <span className="shirt left" />
          <span className="shirt right" />
        </>
      ) : null}
      {mode === "情侣图案" ? (
        <>
          <span className="person left" />
          <span className="person right" />
        </>
      ) : null}
    </div>
  );
}

function VideoSceneGridSetupSection({
  uploadCount,
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onCreationModeChange
}: {
  uploadCount: number;
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onCreationModeChange?: (selection: CreationModeSelection) => void;
}) {
  const defaultMode: VideoSceneGridModeKey =
    videoSceneGridModeCards.find((item) => item.key === selectedValues?.videoSceneGridMode)?.key ?? videoSceneGridModeCards[0].key;
  const [mode, setMode] = useState<VideoSceneGridModeKey>(defaultMode);
  const [variation, setVariation] = useState(selectedValues?.videoSceneGridVariation ?? videoSceneGridVariationOptions[defaultMode][0]);
  const [ratio, setRatio] = useState(selectedValues?.videoSceneGridRatio ?? videoSceneGridRatioOptions[0]);
  const [outputCount, setOutputCount] = useState(() => {
    const nextValue = Number(selectedValues?.videoSceneGridOutputCount ?? 2);
    return Math.min(10, Math.max(2, Number.isFinite(nextValue) ? nextValue : 2));
  });
  const lastSyncedValuesRef = useRef("");
  const lastAppliedExternalRef = useRef("");

  useEffect(() => {
    const nextModeRaw = selectedValues?.videoSceneGridMode;
    const nextMode = videoSceneGridModeCards.some((item) => item.key === nextModeRaw) ? (nextModeRaw as VideoSceneGridModeKey) : mode;
    const nextVariationOptions = videoSceneGridVariationOptions[nextMode];
    const nextVariationRaw = selectedValues?.videoSceneGridVariation;
    const nextVariation = nextVariationRaw && nextVariationOptions.includes(nextVariationRaw) ? nextVariationRaw : nextVariationOptions[0];
    const nextRatioRaw = selectedValues?.videoSceneGridRatio;
    const nextRatio = nextRatioRaw && videoSceneGridRatioOptions.includes(nextRatioRaw as (typeof videoSceneGridRatioOptions)[number])
      ? nextRatioRaw
      : ratio;
    const nextOutputCountRaw = Number(selectedValues?.videoSceneGridOutputCount ?? outputCount);
    const nextOutputCount = Math.min(10, Math.max(2, Number.isFinite(nextOutputCountRaw) ? nextOutputCountRaw : 2));
    const externalSignature = JSON.stringify({
      mode: nextMode,
      variation: nextVariation,
      ratio: nextRatio,
      outputCount: nextOutputCount
    });
    if (externalSignature === lastAppliedExternalRef.current || externalSignature === lastSyncedValuesRef.current) return;
    lastAppliedExternalRef.current = externalSignature;
    setMode(nextMode);
    setVariation(nextVariation);
    setRatio(nextRatio);
    setOutputCount(nextOutputCount);
  }, [mode, outputCount, ratio, selectedValues]);

  const detailDimensions = videoSceneGridDetailDimensionMap[mode][variation] ?? [];
  const variationTip =
    mode === "系列图案"
      ? videoSceneGridSeriesVariationTips[variation]
      : mode === "主副图案"
        ? videoSceneGridPrimarySecondaryVariationTips[variation]
        : mode === "情侣图案"
          ? videoSceneGridCoupleVariationTips[variation]
          : null;
  const totalCredits = uploadCount * outputCount * 5;

  useEffect(() => {
    const nextSelectionMap: AdvancedSelectionMap = {
      videoSceneGridMode: mode,
      videoSceneGridVariation: variation,
      videoSceneGridDetailDimensions: detailDimensions.join(" / "),
      videoSceneGridRatio: ratio,
      videoSceneGridOutputCount: String(outputCount),
      videoSceneGridUnitCreditCost: "5",
      videoSceneGridTotalCreditCost: String(totalCredits)
    };
    const nextSelectionValues = [mode, variation, ...detailDimensions, `出图比例 ${ratio}`, `生图数量 ${outputCount}`];
    const nextCreationModeSelection: CreationModeSelection = {
      modeId: `video-scene-grid-${mode}-${variation}`,
      modeLabel: `${mode}·${variation}`,
      ratio,
      count: outputCount,
      unitCreditCost: 5
    };
    const nextSyncSignature = JSON.stringify({
      mode,
      variation,
      ratio,
      outputCount
    });
    if (lastSyncedValuesRef.current === nextSyncSignature) return;
    lastSyncedValuesRef.current = nextSyncSignature;
    onSelectionMapChange?.(nextSelectionMap);
    onSelectionChange?.(nextSelectionValues);
    onCreationModeChange?.(nextCreationModeSelection);
  }, [detailDimensions, mode, onCreationModeChange, onSelectionChange, onSelectionMapChange, outputCount, ratio, totalCredits, variation]);

  return (
    <div className="ck-form-block ck-video-scene-grid-panel">
      <div className="ck-form-block">
        <FieldTitle label="变化维度" required />
        <div className="ck-video-scene-grid-mode-row">
          {videoSceneGridModeCards.map((option) => (
            <button
              className={`ck-video-scene-grid-mode-card${mode === option.key ? " active" : ""}`}
              key={option.key}
              onClick={() => {
                if (mode === option.key) return;
                const nextOptions = videoSceneGridVariationOptions[option.key];
                const nextVariation = nextOptions.includes(variation) ? variation : nextOptions[0];
                setMode(option.key);
                setVariation(nextVariation);
              }}
              type="button"
            >
              <div className="ck-video-scene-grid-mode-card-layout">
                <div className="ck-video-scene-grid-mode-card-copy">
                  <div className="ck-video-scene-grid-mode-card-head">
                    <strong>{option.label}</strong>
                    <span className={`ck-video-scene-grid-check${mode === option.key ? " active" : ""}`} aria-hidden="true">
                      {mode === option.key ? "✓" : ""}
                    </span>
                  </div>
                  <span className="ck-video-scene-grid-mode-card-subtitle">{option.description}</span>
                  {option.badge ? <span className="ck-video-scene-grid-badge">{option.badge}</span> : null}
                </div>
                <VideoSceneGridPreview mode={option.key} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="ck-form-block">
        <FieldTitle label="变化方向" required />
        <div className="ck-video-scene-grid-variation-row">
          {videoSceneGridVariationOptions[mode].map((option) => (
            <button
              className={`ck-video-scene-grid-variation-chip${variation === option ? " active" : ""}`}
              key={option}
              onClick={() => setVariation(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
        {variationTip ? (
          <div className="ck-video-scene-grid-tip-card">
            <div className="ck-video-scene-grid-tip-title">
              <span className="ck-video-scene-grid-tip-icon" aria-hidden="true">
                ?
              </span>
              <strong>{variationTip.title}</strong>
            </div>
            <p>{variationTip.description}</p>
          </div>
        ) : null}
      </div>

      <div className="ck-video-scene-grid-footer-group">
        <div className="ck-inline-field ck-pod-variation-inline-field ck-video-scene-grid-inline-field">
          <FieldTitle label="出图比例" required />
          <SelectField
            className="ck-video-scene-grid-select-field"
            hideLabel
            label="出图比例"
            onChange={setRatio}
            options={[...videoSceneGridRatioOptions]}
            required
            value={ratio}
            width={120}
          />
        </div>

        <div className="ck-video-scene-grid-inline-field ck-video-scene-grid-stepper-field">
          <NumberStepperField label="生图数量" max={10} min={2} onChange={setOutputCount} required value={outputCount} />
        </div>
      </div>
    </div>
  );
}

function VideoPrintExtendSetupSection({
  uploadCount,
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onCreationModeChange
}: {
  uploadCount: number;
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onCreationModeChange?: (selection: CreationModeSelection) => void;
}) {
  const [selectedRatios, setSelectedRatios] = useState<string[]>(() => {
    const restored = getVideoPrintExtendSelectedRatios(selectedValues);
    return restored.length ? restored : ["1:1"];
  });
  const [outputCount, setOutputCount] = useState(() => {
    const nextValue = Number(selectedValues?.videoPrintExtendOutputCount ?? 1);
    return Math.min(4, Math.max(1, Number.isFinite(nextValue) ? nextValue : 1));
  });
  const lastSyncedValuesRef = useRef("");
  const ratioOptions = [...videoPrintExtendBaseRatioOptions] as string[];
  const ratioCount = selectedRatios.length;
  const totalResultCount = uploadCount * ratioCount * outputCount;
  const totalCredits = totalResultCount * VIDEO_PRINT_EXTEND_UNIT_CREDIT_COST;

  useEffect(() => {
    const nextSyncKey = JSON.stringify({
      selectedRatios: getVideoPrintExtendSelectedRatios(selectedValues),
      outputCount: selectedValues?.videoPrintExtendOutputCount ?? "1"
    });

    if (nextSyncKey === lastSyncedValuesRef.current) {
      return;
    }

    lastSyncedValuesRef.current = nextSyncKey;
    const nextSelectedRatios = getVideoPrintExtendSelectedRatios(selectedValues);
    const nextOutputCount = Number(selectedValues?.videoPrintExtendOutputCount ?? 1);

    setSelectedRatios(nextSelectedRatios.length ? nextSelectedRatios : ["1:1"]);
    setOutputCount(Math.min(4, Math.max(1, Number.isFinite(nextOutputCount) ? nextOutputCount : 1)));
  }, [selectedValues]);

  useEffect(() => {
    onSelectionMapChange?.({
      videoPrintExtendSelectedRatios: JSON.stringify(selectedRatios),
      videoPrintExtendOutputCount: String(outputCount),
      videoPrintExtendRatioCount: String(ratioCount),
      videoPrintExtendTotalResultCount: String(totalResultCount),
      videoPrintExtendUnitCreditCost: String(VIDEO_PRINT_EXTEND_UNIT_CREDIT_COST),
      videoPrintExtendTotalCreditCost: String(totalCredits)
    });
    onSelectionChange?.([
      ratioCount ? `比例 ${selectedRatios.join(" / ")}` : "未选择比例",
      `出图数量 ${outputCount}`,
      `结果数量 ${totalResultCount}`
    ]);
    onCreationModeChange?.({
      modeId: "video-print-extend",
      modeLabel: "印花尺寸延展",
      ratio: ratioCount ? selectedRatios.join(" / ") : "未选择比例",
      count: outputCount,
      unitCreditCost: VIDEO_PRINT_EXTEND_UNIT_CREDIT_COST
    });
  }, [onCreationModeChange, onSelectionChange, onSelectionMapChange, outputCount, ratioCount, selectedRatios, totalCredits, totalResultCount]);

  const toggleRatio = (ratio: string) => {
    setSelectedRatios((current) => (current.includes(ratio) ? current.filter((item) => item !== ratio) : [...current, ratio]));
  };

  return (
    <div className="ck-form-block">
      <div className="ck-form-block">
        <div className="ck-video-print-extend-head">
          <FieldTitle label="添加比例" required />
          <span>已选择 {ratioCount} 个比例</span>
        </div>
        <div className="ck-video-print-extend-grid">
          {ratioOptions.map((ratio) => {
            const [widthText, heightText] = ratio.split(":");
            const width = Number(widthText) || 1;
            const height = Number(heightText) || 1;
            const scale = Math.min(18 / width, 22 / height);
            const indicatorStyle = {
              width: `${Math.max(8, width * scale)}px`,
              height: `${Math.max(8, height * scale)}px`
            };
            const isSelected = selectedRatios.includes(ratio);

            return (
              <button className={`ck-video-print-extend-card${isSelected ? " active" : ""}`} key={ratio} onClick={() => toggleRatio(ratio)} type="button">
                <span className={`ck-video-print-extend-check${isSelected ? " active" : ""}`}>✓</span>
                <span className="ck-video-print-extend-ratio-icon" style={indicatorStyle} />
                <strong>{ratio}</strong>
              </button>
            );
          })}
        </div>
      </div>

      <CountField label="出图数量" onChange={(value) => setOutputCount(Math.min(4, Math.max(1, Number(value) || 1)))} options={[...videoPrintExtendOutputCountOptions]} required value={String(outputCount)} />
    </div>
  );
}

function VideoReplicaSetupSection({
  toolKey,
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onCreationModeChange
}: {
  toolKey: string;
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onCreationModeChange?: (selection: CreationModeSelection) => void;
}) {
  const defaultMode: VideoReplicaModeKey =
    selectedValues?.videoReplicaMode === "高级模式" || selectedValues?.videoReplicaMode === "普通模式" ? selectedValues.videoReplicaMode : "普通模式";
  const [mode, setMode] = useState<VideoReplicaModeKey>(defaultMode);
  const [duration, setDuration] = useState(selectedValues?.videoReplicaDuration ?? "10s");
  const [ratio, setRatio] = useState(selectedValues?.videoReplicaRatio ?? "竖9:16");
  const [resolution, setResolution] = useState(selectedValues?.videoReplicaResolution ?? "480p");
  const soundOptions = toolKey === "video-replace" ? [...videoReplaceSoundOptions] : [...videoReplicaSoundOptions];
  const normalizeSoundOption = toolKey === "video-replace" ? normalizeVideoReplaceSoundOption : normalizeVideoReplicaSoundOption;
  const [sound, setSound] = useState<string>(normalizeSoundOption(selectedValues?.videoReplicaHasSound));
  const lastSyncedValuesRef = useRef("");
  const lastEmitRef = useRef("");

  useEffect(() => {
    const nextSyncKey = JSON.stringify({
      mode: selectedValues?.videoReplicaMode ?? "普通模式",
      duration: selectedValues?.videoReplicaDuration ?? "10s",
      ratio: selectedValues?.videoReplicaRatio ?? "竖9:16",
      resolution: selectedValues?.videoReplicaResolution ?? "480p",
      sound: normalizeSoundOption(selectedValues?.videoReplicaHasSound)
    });

    if (nextSyncKey === lastSyncedValuesRef.current) {
      return;
    }

    lastSyncedValuesRef.current = nextSyncKey;
    setMode(defaultMode);
    setDuration(selectedValues?.videoReplicaDuration ?? "10s");
    setRatio(selectedValues?.videoReplicaRatio ?? "竖9:16");
    setResolution(selectedValues?.videoReplicaResolution ?? "480p");
    setSound(normalizeSoundOption(selectedValues?.videoReplicaHasSound));
  }, [defaultMode, normalizeSoundOption, selectedValues]);

  useEffect(() => {
    const nextMap: AdvancedSelectionMap = {
      videoReplicaMode: mode,
      videoReplicaDuration: duration,
      videoReplicaRatio: ratio,
      videoReplicaResolution: resolution,
      videoReplicaHasSound: sound
    };
    const nextSelectionValues = [mode, duration, ratio, resolution, sound];
    const nextCreationModeSelection: CreationModeSelection = {
      modeId: mode === "高级模式" ? "video-replica-advanced" : "video-replica-normal",
      modeLabel: mode,
      ratio,
      resolution,
      count: 1,
      unitCreditCost: 1
    };
    const emitKey = JSON.stringify({ nextMap, nextSelectionValues, nextCreationModeSelection });
    if (emitKey === lastEmitRef.current) return;
    lastEmitRef.current = emitKey;
    onSelectionMapChange?.(nextMap);
    onSelectionChange?.(nextSelectionValues);
    onCreationModeChange?.(nextCreationModeSelection);
  }, [duration, mode, onCreationModeChange, onSelectionChange, onSelectionMapChange, ratio, resolution, sound]);

  return (
    <div className="ck-creation-mode">
      <SegmentedField
        label="创作模式"
        onChange={(index) => setMode(videoReplicaModeOptions[index] ?? "普通模式")}
        options={[...videoReplicaModeOptions]}
        required
        selected={videoReplicaModeOptions.findIndex((option) => option === mode)}
      />

      <SelectField label="视频时长" onChange={setDuration} options={videoReplicaDurationOptions} required value={duration} />

      <SelectField label="视频比例" onChange={setRatio} options={videoReplicaRatioOptions} required value={ratio} />

      <CountField label="视频分辨率" onChange={setResolution} options={videoReplicaResolutionOptions} required value={resolution} />

      <SelectField
        label="视频声音"
        onChange={(value) => setSound(normalizeSoundOption(value))}
        options={soundOptions}
        required
        value={sound}
      />
    </div>
  );
}

function GenerationRuleNoticeSection({
  productCount,
  referenceCount,
  batchCount
}: {
  productCount: number;
  referenceCount: number;
  batchCount: number;
}) {
  const totalCount = productCount * referenceCount * batchCount;

  return (
    <div className="ck-generation-rule-card">
      <div className="ck-generation-rule-head">生成规则说明</div>
      <ol className="ck-generation-rule-list">
        <li>多对多匹配：系统会为您的每一张【商品图】，分别匹配所有【参考图】的风格进行创作。</li>
        <li>计算公式：总生成数量 = 商品图数量 × 参考图数量 × 每批次出图数量。</li>
        <li>
          举例说明：若上传 2 张商品图 and 3 张参考图，每批次出 2 张，则总计会生成 2×3×2=12 张图片。
        </li>
      </ol>
      <div className="ck-generation-rule-summary">
        当前将生成 {productCount} × {referenceCount} × {batchCount} = {totalCount} 张
      </div>
    </div>
  );
}

function ModelAdjustSection({
  actions,
  supplementValue,
  onSupplementChange,
  onSupplementAiPolish,
  onToast,
  onSelectionChange,
  onSelectionMapChange,
  selectedValues,
  toolKey
}: {
  actions: ModelAdjustActionConfig[];
  supplementValue: string;
  onSupplementChange: (value: string) => void;
  onSupplementAiPolish: (value: string) => Promise<SupplementAiPolishResult>;
  onToast: (message: string, tone?: "warning") => void;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  selectedValues?: AdvancedSelectionMap;
  toolKey: string;
}) {
  const defaultActionKey = actions[0]?.key ?? "";
  const [selectedActionKey, setSelectedActionKey] = useState(selectedValues?.modelAdjustActionKey ?? defaultActionKey);
  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string>>(() =>
    actions.reduce<Record<string, string>>((accumulator, action) => {
      accumulator[action.key] = selectedValues?.[`${action.key}:value`] ?? "";
      return accumulator;
    }, {})
  );
  const lastSyncedValuesRef = useRef("");

  const activeAction = actions.find((item) => item.key === selectedActionKey) ?? actions[0];
  const activeOptionValue = activeAction ? selectedOptionValues[activeAction.key] ?? "" : "";

  useEffect(() => {
    const nextState = {
      modelAdjustActionKey: selectedValues?.modelAdjustActionKey ?? defaultActionKey,
      optionValues: actions.reduce<Record<string, string>>((accumulator, action) => {
        accumulator[action.key] = selectedValues?.[`${action.key}:value`] ?? "";
        return accumulator;
      }, {})
    };
    const nextSyncKey = JSON.stringify(nextState);

    if (nextSyncKey === lastSyncedValuesRef.current) {
      return;
    }

    lastSyncedValuesRef.current = nextSyncKey;
    setSelectedActionKey(nextState.modelAdjustActionKey);
    setSelectedOptionValues(nextState.optionValues);
  }, [actions, defaultActionKey, selectedValues]);

  useEffect(() => {
    if (!activeAction) return;
    lastSyncedValuesRef.current = JSON.stringify({
      modelAdjustActionKey: activeAction.key,
      optionValues: selectedOptionValues
    });
    const nextSelectionMap: AdvancedSelectionMap = {
      modelAdjustActionKey: activeAction.key,
      modelAdjustAction: activeAction.label
    };

    if (activeAction.valueLabel && activeOptionValue) {
      nextSelectionMap[`${activeAction.key}:label`] = activeAction.valueLabel;
      nextSelectionMap[`${activeAction.key}:value`] = activeOptionValue;
    }

    onSelectionMapChange?.(nextSelectionMap);
    onSelectionChange?.(
      Object.entries(nextSelectionMap)
        .filter(([key]) => key !== "modelAdjustActionKey" && !key.endsWith(":label"))
        .map(([, value]) => value)
    );
  }, [activeAction, activeOptionValue, onSelectionChange, onSelectionMapChange]);

  if (!activeAction) return null;

  return (
    <>
      <AdaptiveChoiceField
        label="调整方式"
        onChange={setSelectedActionKey}
        options={actions.map((action) => ({ key: action.key, label: action.label }))}
        required
        value={selectedActionKey}
      />

      {activeAction.valueLabel && activeAction.valueOptions?.length ? (
        <InputSelectInlineField
          dropdownWidth={256}
          label={activeAction.valueLabel}
          labelNoWrap
          onChange={(value) => {
            setSelectedOptionValues((current) => ({ ...current, [activeAction.key]: value }));
          }}
          options={activeAction.valueOptions}
          placeholder="请选择，或直接输入"
          required
          value={activeOptionValue}
        />
      ) : null}

      <SupplementField
        aiPolishConfig={supplementAiPolishConfigs[toolKey]}
        label={activeAction.detailLabel}
        maxLength={2000}
        onAiPolish={onSupplementAiPolish}
        onChange={onSupplementChange}
        onToast={onToast}
        placeholder={activeAction.detailPlaceholder}
        value={supplementValue}
      />
    </>
  );
}

function VideoMainScriptSetupSection({
  uploads,
  supplementValue,
  onSupplementChange,
  onSupplementAiPolish,
  onToast,
  onSelectionChange,
  onSelectionMapChange,
  selectedValues,
  toolKey
}: {
  supplementValue: string;
  onSupplementChange: (value: string) => void;
  onSupplementAiPolish: (value: string) => Promise<SupplementAiPolishResult>;
  onToast: (message: string, tone?: "warning") => void;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  selectedValues?: AdvancedSelectionMap;
  uploads: UploadItem[];
  toolKey: string;
}) {
  const legacyAutoDefaultSet = useMemo(() => new Set(["智能识别", "智能匹配"]), []);
  const scriptFieldMap = useMemo(() => Object.fromEntries(videoMainScriptFieldConfigs.map((item) => [item.key, item])) as Record<string, (typeof videoMainScriptFieldConfigs)[number]>, []);
  const defaultScriptFieldValues = useMemo(
    () =>
      Object.fromEntries(
        videoMainScriptFieldConfigs.map((item) => [item.key, ""])
      ) as Record<string, string>,
    []
  );
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [scriptMode, setScriptMode] = useState(selectedValues?.videoMainScriptMode ?? videoMainScriptModeOptions[0].key);
  const [scriptDrawerOpen, setScriptDrawerOpen] = useState(false);
  const [scriptDrawerStyle, setScriptDrawerStyle] = useState<CSSProperties>({});
  const drawerStyleRef = useRef<CSSProperties>({});
  const [generatedScript, setGeneratedScript] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(selectedValues?.videoMainVoiceEnabled === "true");
  const [voiceLanguage, setVoiceLanguage] = useState(selectedValues?.videoMainVoiceLanguage ?? videoMainVoiceLanguageOptions[0]);
  const [voiceTone, setVoiceTone] = useState(selectedValues?.videoMainVoiceTone ?? videoMainVoiceToneOptions[0]);
  const [voiceCopy, setVoiceCopy] = useState(selectedValues?.videoMainVoiceCopy ?? "");
  const [scriptDetailMode, setScriptDetailMode] = useState<"general" | "storyboard">("general");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    ...defaultScriptFieldValues,
    ...Object.fromEntries(videoMainScriptFieldConfigs.map((item) => [item.key, selectedValues?.[item.key] ?? defaultScriptFieldValues[item.key]]))
  });
  const lastSyncedValuesRef = useRef<string>("");
  const lastEmitRef = useRef<string>("");

  useEffect(() => {
    const nextScriptFields = Object.fromEntries(
      videoMainScriptFieldConfigs.map((item) => {
        const rawValue = selectedValues?.[item.key] ?? defaultScriptFieldValues[item.key];
        const normalizedValue = legacyAutoDefaultSet.has(rawValue) ? "" : rawValue;
        return [item.key, normalizedValue];
      })
    ) as Record<(typeof videoMainScriptFieldConfigs)[number]["key"], string>;
    const nextState = {
      videoMainScriptMode: selectedValues?.videoMainScriptMode ?? videoMainScriptModeOptions[0].key,
      scriptFields: nextScriptFields,
      videoMainVoiceEnabled: selectedValues?.videoMainVoiceEnabled === "true",
      videoMainVoiceLanguage: selectedValues?.videoMainVoiceLanguage ?? videoMainVoiceLanguageOptions[0],
      videoMainVoiceTone: selectedValues?.videoMainVoiceTone ?? videoMainVoiceToneOptions[0],
      videoMainVoiceCopy: selectedValues?.videoMainVoiceCopy ?? ""
    };
    const nextSyncKey = JSON.stringify(nextState);

    if (nextSyncKey === lastSyncedValuesRef.current) {
      return;
    }

    lastSyncedValuesRef.current = nextSyncKey;
    setScriptMode(nextState.videoMainScriptMode);
    setFieldValues(nextState.scriptFields);
    setVoiceEnabled(nextState.videoMainVoiceEnabled);
    setVoiceLanguage(nextState.videoMainVoiceLanguage);
    setVoiceTone(nextState.videoMainVoiceTone);
    setVoiceCopy(nextState.videoMainVoiceCopy);
  }, [defaultScriptFieldValues, legacyAutoDefaultSet, selectedValues, videoMainScriptFieldConfigs]);

  useEffect(() => {
    lastSyncedValuesRef.current = JSON.stringify({
      videoMainScriptMode: scriptMode,
      ...fieldValues,
      videoMainVoiceEnabled: voiceEnabled,
      videoMainVoiceLanguage: voiceLanguage,
      videoMainVoiceTone: voiceTone,
      videoMainVoiceCopy: voiceCopy
    });

    const nextMap: AdvancedSelectionMap = {
      videoMainScriptMode: scriptMode,
      videoMainScriptModeLabel: videoMainScriptModeOptions.find((item) => item.key === scriptMode)?.label ?? ""
    };

    if (scriptMode === "ai-script") {
      Object.entries(fieldValues).forEach(([key, value]) => {
        if (value) nextMap[key] = value;
      });
      nextMap.videoMainVoiceEnabled = String(voiceEnabled);
      if (voiceEnabled) {
        nextMap.videoMainVoiceLanguage = voiceLanguage;
        nextMap.videoMainVoiceTone = voiceTone;
        if (voiceCopy.trim()) nextMap.videoMainVoiceCopy = voiceCopy.trim();
      }
    }

    const nextSelectionValues = [
      nextMap.videoMainScriptModeLabel,
      ...(scriptMode === "ai-script" ? Object.values(fieldValues).filter(Boolean) : []),
      voiceEnabled ? voiceLanguage : "",
      voiceEnabled ? voiceTone : "",
      voiceEnabled ? voiceCopy : "",
      supplementValue
    ].filter(Boolean);
    const emitKey = JSON.stringify({ nextMap, nextSelectionValues });
    if (emitKey === lastEmitRef.current) return;
    lastEmitRef.current = emitKey;
    onSelectionMapChange?.(nextMap);
    onSelectionChange?.(nextSelectionValues);
  }, [fieldValues, onSelectionChange, onSelectionMapChange, scriptMode, supplementValue, voiceCopy, voiceEnabled, voiceLanguage, voiceTone]);

  const inputFields = videoMainScriptFieldConfigs;

  const handleGenerateScript = () => {
    const sections = inputFields
      .map((field) => ({ label: field.label, value: fieldValues[field.key]?.trim() ?? "" }))
      .filter((item) => item.value)
      .map((item) => `${item.label}：${item.value}`);
    const detail = supplementValue.trim();
    const nextScript = [
      "【视频脚本草案】",
      ...sections,
      detail ? `细节补充：${detail}` : "",
      "根据以上信息生成分镜：开场展示商品主体，中段突出卖点，结尾输出行动引导。"
    ]
      .filter(Boolean)
      .join("\n");

    setGeneratedScript(nextScript);
  };

  const handleAiFillParameters = () => {
    const uploadText = [
      uploads[0]?.name ?? "",
      uploads.map((item) => item.name).filter(Boolean).join(" ")
    ]
      .filter(Boolean)
      .join(" ");

    const pickOption = (options: readonly string[], keywords: string[]) => {
      const match = options.find((option) => keywords.some((keyword) => uploadText.includes(keyword) && option.includes(keyword))) ?? options[0] ?? "";
      return match;
    };

    const nextValues = Object.fromEntries(
      videoMainScriptFieldConfigs.map((field) => [field.key, pickOption(field.options, field.aiKeywords)])
    ) as Record<string, string>;

    setFieldValues(nextValues);
  };

  const handleAiGenerateVoiceCopy = () => {
    const source = generatedScript || supplementValue;
    const compact = source.replace(/\s+/g, " ").trim();
    if (!compact) {
      onToast("请先生成脚本或填写视频脚本", "warning");
      return;
    }
    const nextCopy = `本视频围绕产品核心卖点展开，重点展示使用场景与细节优势，帮助用户快速理解价值并提升购买意愿。${compact.slice(0, 120)}`.slice(0, 200);
    setVoiceCopy(nextCopy);
  };

  useEffect(() => {
    if (!scriptDrawerOpen) return;

    let frameId = 0;
    const updateDrawerPosition = () => {
      const panelElement = sectionRef.current?.closest(".ck-panel");
      const panelRect = panelElement?.getBoundingClientRect();
      if (!panelRect) return;

      const gap = 16;
      const viewportPadding = 16;
      const topSafe = 72;
      const targetHeight = Math.max(420, window.innerHeight - 324);
      const maxHeight = window.innerHeight - topSafe - viewportPadding;
      const drawerHeight = Math.min(targetHeight, maxHeight);
      const nextTop = Math.max(topSafe, Math.round((window.innerHeight - drawerHeight) / 2));
      const nextLeft = Math.max(viewportPadding, Math.round(panelRect.right + gap));
      const nextWidth = Math.min(980, Math.max(720, window.innerWidth - nextLeft - viewportPadding));

      const nextStyle: CSSProperties = {
        top: `${nextTop}px`,
        left: `${nextLeft}px`,
        right: "auto",
        width: `${nextWidth}px`,
        height: `${drawerHeight}px`,
        maxHeight: `${drawerHeight}px`
      };

      if (
        drawerStyleRef.current.top === nextStyle.top &&
        drawerStyleRef.current.left === nextStyle.left &&
        drawerStyleRef.current.width === nextStyle.width &&
        drawerStyleRef.current.height === nextStyle.height &&
        drawerStyleRef.current.maxHeight === nextStyle.maxHeight
      ) {
        return;
      }

      drawerStyleRef.current = nextStyle;
      setScriptDrawerStyle(nextStyle);
    };

    updateDrawerPosition();
    const requestUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateDrawerPosition);
    };

    window.addEventListener("resize", requestUpdate);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [scriptDrawerOpen]);

  return (
    <div ref={sectionRef}>
      <UnifiedTextareaField
        formBlockClassName="ck-form-block ck-set-pack-selling-points"
        header={
          <div className="ck-advanced-settings-head">
            <FieldTitle label="视频脚本" required />
            <button
              className="ck-advanced-settings-ai"
              onClick={() => {
                setScriptMode("ai-script");
                setScriptDrawerOpen(true);
              }}
              type="button"
            >
              AI生成
            </button>
          </div>
        }
        maxLength={2000}
        onChange={onSupplementChange}
        placeholder="请输入完整视频脚本或镜头描述，AI 将按你的自定义脚本生成产品视频。"
        value={supplementValue}
      />
      <div className="ck-form-block ck-video-voice-block">
        <div className="ck-inline-field">
          <FieldTitle label="旁白设置" />
          <div className="ck-switch" style={{ width: 96, gridTemplateColumns: "repeat(2, 1fr)" }}>
            <button className={!voiceEnabled ? "active" : ""} onClick={() => setVoiceEnabled(false)} type="button">
              关闭
            </button>
            <button className={voiceEnabled ? "active" : ""} onClick={() => setVoiceEnabled(true)} type="button">
              开启
            </button>
          </div>
        </div>
        {voiceEnabled ? (
          <div className="ck-video-voice-fields">
            <SelectField className="ck-video-voice-select-field" label="旁白语言" onChange={setVoiceLanguage} options={videoMainVoiceLanguageOptions} value={voiceLanguage} width={120} />
            <UnifiedTextareaField
              formBlockClassName="ck-form-block ck-set-pack-selling-points ck-video-script-detail"
              header={
                <div className="ck-advanced-settings-head">
                  <FieldTitle label="旁白文案" />
                  <button className="ck-advanced-settings-ai" onClick={handleAiGenerateVoiceCopy} type="button">
                    AI帮写
                  </button>
                </div>
              }
              maxLength={200}
              onChange={setVoiceCopy}
              placeholder="请输入旁白文案，或使用AI根据脚本自动生成（200字以内）"
              value={voiceCopy}
            />
            <SelectField className="ck-video-voice-select-field" label="音色选择" onChange={setVoiceTone} options={videoMainVoiceToneOptions} value={voiceTone} width={120} />
          </div>
        ) : null}
      </div>

      {scriptDrawerOpen ? (
        <div className="ck-set-pack-side-drawer-mask ck-video-script-drawer-mask" onClick={() => setScriptDrawerOpen(false)} role="presentation">
          <div className="ck-set-pack-side-drawer ck-video-script-drawer" onClick={(event) => event.stopPropagation()} style={scriptDrawerStyle}>
            <div className="ck-set-pack-side-drawer-head">
              <strong>AI生成脚本</strong>
              <button onClick={() => setScriptDrawerOpen(false)} type="button">
                ×
              </button>
            </div>
            <div className="ck-set-pack-side-drawer-body">
              <div className="ck-video-script-layout">
                <section className="ck-video-script-column">
                  <div className="ck-video-script-box">
                    <div className="ck-video-script-box-head">
                      <div className="ck-video-script-title">脚本参数</div>
                      <button className="ck-video-script-ai-fill" onClick={handleAiFillParameters} type="button">
                        AI帮写
                      </button>
                    </div>
                    <div className="ck-video-script-fields">
                      {inputFields.map((field) => (
                        <InputSelectInlineField
                          className="ck-video-script-inline-field"
                          dropdownWidth={320}
                          key={field.key}
                          label={field.label}
                          labelNoWrap
                          onChange={(value) => setFieldValues((current) => ({ ...current, [field.key]: value }))}
                          options={[...field.options]}
                          placeholder="请选择，或直接输入"
                          value={fieldValues[field.key] ?? ""}
                        />
                      ))}
                      <UnifiedTextareaField
                        formBlockClassName="ck-form-block ck-set-pack-selling-points ck-video-script-detail"
                        label="细节补充"
                        maxLength={2000}
                        onChange={onSupplementChange}
                        optional
                        placeholder="请输入额外镜头、转场、字幕、情绪或人物动作要求，帮助生成更完整的视频脚本。"
                        value={supplementValue}
                      />
                    </div>
                    <div className="ck-video-script-mode">
                      <FieldTitle label="选择模式" />
                      <div className="ck-switch ck-video-script-mode-switch">
                        <button
                          className={scriptDetailMode === "general" ? "active" : ""}
                          onClick={() => setScriptDetailMode("general")}
                          type="button"
                        >
                          通用模式（全局设定）
                        </button>
                        <button
                          className={scriptDetailMode === "storyboard" ? "active" : ""}
                          onClick={() => setScriptDetailMode("storyboard")}
                          type="button"
                        >
                          分镜模式（逐帧精控）
                        </button>
                      </div>
                    </div>
                    <button className="ck-video-script-generate" onClick={handleGenerateScript} type="button">
                      {generatedScript ? "重新生成" : "生成脚本"}
                    </button>
                  </div>
                </section>
                <section className="ck-video-script-column">
                  <div className="ck-video-script-box ck-video-script-result-box">
                    <div className="ck-video-script-title">脚本内容</div>
                    {generatedScript ? (
                      <>
                        <pre className="ck-video-script-result-content">{generatedScript}</pre>
                        <button
                          className="ck-video-script-apply"
                          onClick={() => {
                            onSupplementChange(generatedScript);
                            setScriptDrawerOpen(false);
                          }}
                          type="button"
                        >
                          立即使用
                        </button>
                      </>
                    ) : (
                      <div className="ck-video-script-result-empty">点击左侧“生成脚本”后在此显示结果。</div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ModelGenerateTypeSection({
  types,
  onSelectionChange,
  onSelectionMapChange,
  selectedValues
}: {
  types: ModelGenerateTypeConfig[];
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  selectedValues?: AdvancedSelectionMap;
}) {
  const defaultTypeKey = types[0]?.key ?? "";
  const [selectedTypeKey, setSelectedTypeKey] = useState(selectedValues?.modelGenerateTypeKey ?? defaultTypeKey);
  const skipSelectedValuesSyncRef = useRef(false);
  const pendingSelectedValuesSignatureRef = useRef("");
  const lastSyncedValuesRef = useRef<string>("");

  useEffect(() => {
    if (skipSelectedValuesSyncRef.current) {
      skipSelectedValuesSyncRef.current = false;
      return;
    }

    const nextSyncKey = JSON.stringify({
      modelGenerateTypeKey: selectedValues?.modelGenerateTypeKey ?? defaultTypeKey
    });

    if (pendingSelectedValuesSignatureRef.current) {
      if (nextSyncKey !== pendingSelectedValuesSignatureRef.current) {
        return;
      }
      pendingSelectedValuesSignatureRef.current = "";
    }

    if (nextSyncKey === lastSyncedValuesRef.current) {
      return;
    }

    lastSyncedValuesRef.current = nextSyncKey;
    setSelectedTypeKey(selectedValues?.modelGenerateTypeKey ?? defaultTypeKey);
  }, [defaultTypeKey, selectedValues]);

  useEffect(() => {
    const activeType = types.find((item) => item.key === selectedTypeKey) ?? types[0];
    if (!activeType) return;
    skipSelectedValuesSyncRef.current = true;
    const nextSyncKey = JSON.stringify({
      modelGenerateTypeKey: activeType.key
    });
    pendingSelectedValuesSignatureRef.current = nextSyncKey;
    lastSyncedValuesRef.current = nextSyncKey;
    onSelectionMapChange?.({
      modelGenerateTypeKey: activeType.key,
      modelGenerateType: activeType.label
    });
    onSelectionChange?.([activeType.label]);
  }, [onSelectionChange, onSelectionMapChange, selectedTypeKey, types]);

  return (
    <AdaptiveChoiceField
      label=""
      onChange={setSelectedTypeKey}
      options={types.map((item) => ({ key: item.key, label: item.label }))}
      required
      value={selectedTypeKey}
    />
  );
}

function ModelGenerateFeatureSection({
  onSelectionChange,
  onSelectionMapChange,
  selectedValues
}: {
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  selectedValues?: AdvancedSelectionMap;
}) {
  const [gender, setGender] = useState(selectedValues?.gender ?? "男");
  const [appearance, setAppearance] = useState(selectedValues?.appearance ?? "");
  const [age, setAge] = useState(selectedValues?.age ?? "");
  const [persona, setPersona] = useState(selectedValues?.persona ?? "");
  const [bodyType, setBodyType] = useState(selectedValues?.bodyType ?? "");
  const [scene, setScene] = useState(selectedValues?.scene ?? "");
  const skipSelectedValuesSyncRef = useRef(false);
  const pendingSelectedValuesSignatureRef = useRef("");
  const lastSyncedValuesRef = useRef<string>("");

  useEffect(() => {
    if (skipSelectedValuesSyncRef.current) {
      skipSelectedValuesSyncRef.current = false;
      return;
    }

    const nextSyncKey = JSON.stringify({
      gender: selectedValues?.gender ?? "男",
      appearance: selectedValues?.appearance ?? "",
      age: selectedValues?.age ?? "",
      persona: selectedValues?.persona ?? "",
      bodyType: selectedValues?.bodyType ?? "",
      scene: selectedValues?.scene ?? ""
    });

    if (pendingSelectedValuesSignatureRef.current) {
      if (nextSyncKey !== pendingSelectedValuesSignatureRef.current) {
        return;
      }
      pendingSelectedValuesSignatureRef.current = "";
    }

    if (nextSyncKey === lastSyncedValuesRef.current) {
      return;
    }

    lastSyncedValuesRef.current = nextSyncKey;
    setGender(selectedValues?.gender ?? "男");
    setAppearance(selectedValues?.appearance ?? "");
    setAge(selectedValues?.age ?? "");
    setPersona(selectedValues?.persona ?? "");
    setBodyType(selectedValues?.bodyType ?? "");
    setScene(selectedValues?.scene ?? "");
  }, [selectedValues]);

  useEffect(() => {
    const nextSelectionMap: AdvancedSelectionMap = {};
    if (gender) nextSelectionMap.gender = gender;
    if (appearance) nextSelectionMap.appearance = appearance;
    if (age) nextSelectionMap.age = age;
    if (persona) nextSelectionMap.persona = persona;
    if (bodyType) nextSelectionMap.bodyType = bodyType;
    if (scene) nextSelectionMap.scene = scene;
    skipSelectedValuesSyncRef.current = true;
    const nextSyncKey = JSON.stringify({
      gender,
      appearance,
      age,
      persona,
      bodyType,
      scene
    });
    pendingSelectedValuesSignatureRef.current = nextSyncKey;
    lastSyncedValuesRef.current = nextSyncKey;
    onSelectionMapChange?.(nextSelectionMap);
    onSelectionChange?.([gender, appearance, age, persona, bodyType, scene].filter(Boolean));
  }, [age, appearance, bodyType, gender, onSelectionChange, onSelectionMapChange, persona, scene]);

  return (
    <>
      <div className="ck-model-generate-section-title">特征设置</div>
      <ModelGenerateParameterFields
        age={age}
        appearance={appearance}
        bodyType={bodyType}
        gender={gender}
        onAgeChange={setAge}
        onAppearanceChange={setAppearance}
        onBodyTypeChange={setBodyType}
        onGenderChange={setGender}
        onPersonaChange={setPersona}
        persona={persona}
      />
      <RichSelectField
        className="ck-model-generate-scene-field"
        fullWidth
        label="选择场景"
        onChange={setScene}
        options={modelGenerateSceneOptions}
        placeholder="请选择场景"
        value={scene}
      />
    </>
  );
}

function createAutoProtectMaskDataUrl(imageSrc: string, target: ModelGenerateProtectTarget) {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  if (!context) return "";

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255, 227, 77, 0.28)";
  context.strokeStyle = "#ffe34d";

  if (target === "hair") {
    context.beginPath();
    context.ellipse(canvas.width / 2, 148, 118, 94, 0, 0, Math.PI * 2);
    context.fill();
    context.lineWidth = 6;
    context.stroke();

    context.beginPath();
    context.ellipse(canvas.width / 2, 190, 136, 72, 0, 0, Math.PI);
    context.fill();
    context.stroke();
  } else {
    context.beginPath();
    context.roundRect(156, 178, 328, 364, 84);
    context.fill();
    context.lineWidth = 6;
    context.stroke();

    context.beginPath();
    context.moveTo(214, 212);
    context.quadraticCurveTo(320, 132, 426, 212);
    context.lineTo(468, 448);
    context.quadraticCurveTo(320, 566, 172, 448);
    context.closePath();
    context.fill();
    context.stroke();
  }

  return canvas.toDataURL("image/png");
}

function ModelGenerateParameterFields({
  gender,
  appearance,
  age,
  persona,
  bodyType,
  onGenderChange,
  onAppearanceChange,
  onAgeChange,
  onPersonaChange,
  onBodyTypeChange
}: {
  gender: string;
  appearance: string;
  age: string;
  persona: string;
  bodyType: string;
  onGenderChange: (value: string) => void;
  onAppearanceChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onPersonaChange: (value: string) => void;
  onBodyTypeChange: (value: string) => void;
}) {
  return (
    <>
      <div className="ck-inline-field ck-model-generate-inline-field">
        <FieldTitle label="性别" required />
        <div className="ck-mini-switch count ck-model-generate-gender-switch" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {["男", "女"].map((option) => (
            <button
              className={gender === option ? "active" : ""}
              key={option}
              onClick={() => onGenderChange(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <InputSelectInlineField
        className="ck-model-generate-inline-field"
        dropdownWidth={280}
        label="外貌特征"
        labelNoWrap
        onChange={onAppearanceChange}
        options={modelGenerateAppearanceOptions}
        placeholder="请选择，或直接输入"
        required
        value={appearance}
      />
      <InputSelectInlineField
        className="ck-model-generate-inline-field"
        dropdownWidth={280}
        label="年龄段"
        labelNoWrap
        onChange={onAgeChange}
        options={modelGenerateAgeOptions}
        placeholder="请选择，或直接输入"
        required
        value={age}
      />
      <InputSelectInlineField
        className="ck-model-generate-inline-field"
        dropdownWidth={280}
        label="人设"
        labelNoWrap
        onChange={onPersonaChange}
        options={modelGeneratePersonaOptions}
        placeholder="请选择，或直接输入"
        required
        value={persona}
      />
      <InputSelectInlineField
        className="ck-model-generate-inline-field"
        dropdownWidth={280}
        label="体型"
        labelNoWrap
        onChange={onBodyTypeChange}
        options={modelGenerateBodyOptions}
        placeholder="请选择，或直接输入"
        required
        value={bodyType}
      />
    </>
  );
}

function BaselineModelSection({
  modelAssets,
  onSelectionChange,
  onSelectionMapChange,
  onGenerateBaselineModel,
  onUploadModels,
  selectedValues
}: {
  modelAssets: ModelAsset[];
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onGenerateBaselineModel: (values: AdvancedSelectionMap) => Promise<string | null>;
  onUploadModels: (files: File[]) => Promise<ModelAsset[]>;
  selectedValues?: AdvancedSelectionMap;
}) {
  const [activeTab, setActiveTab] = useState<"ai" | "mine">((selectedValues?.baselineModelSource as "ai" | "mine") ?? "ai");
  const [selectedModelId, setSelectedModelId] = useState(selectedValues?.selectedModelId ?? "");
  const [gender, setGender] = useState(selectedValues?.gender ?? "");
  const [appearance, setAppearance] = useState(selectedValues?.appearance ?? "");
  const [age, setAge] = useState(selectedValues?.age ?? "");
  const [persona, setPersona] = useState(selectedValues?.persona ?? "");
  const [bodyType, setBodyType] = useState(selectedValues?.bodyType ?? "");
  const [detailSupplement, setDetailSupplement] = useState(selectedValues?.baselineModelSupplement ?? "");
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastSyncedValuesRef = useRef("");
  const orderedModelAssets = useMemo(
    () =>
      [...modelAssets].sort((left, right) => {
        if (left.sourceType !== right.sourceType) {
          return left.sourceType === "upload" ? -1 : 1;
        }
        return right.createdAt - left.createdAt;
      }),
    [modelAssets]
  );

  useEffect(() => {
    const nextSyncKey = JSON.stringify({
      baselineModelSource: (selectedValues?.baselineModelSource as "ai" | "mine") ?? "ai",
      selectedModelId: selectedValues?.selectedModelId ?? "",
      gender: selectedValues?.gender ?? "",
      appearance: selectedValues?.appearance ?? "",
      age: selectedValues?.age ?? "",
      persona: selectedValues?.persona ?? "",
      bodyType: selectedValues?.bodyType ?? "",
      baselineModelSupplement: selectedValues?.baselineModelSupplement ?? ""
    });

    if (nextSyncKey === lastSyncedValuesRef.current) {
      return;
    }

    lastSyncedValuesRef.current = nextSyncKey;
    setActiveTab((selectedValues?.baselineModelSource as "ai" | "mine") ?? "ai");
    setSelectedModelId(selectedValues?.selectedModelId ?? "");
    setGender(selectedValues?.gender ?? "");
    setAppearance(selectedValues?.appearance ?? "");
    setAge(selectedValues?.age ?? "");
    setPersona(selectedValues?.persona ?? "");
    setBodyType(selectedValues?.bodyType ?? "");
    setDetailSupplement(selectedValues?.baselineModelSupplement ?? "");
  }, [selectedValues]);

  useEffect(() => {
    const selectedModel = orderedModelAssets.find((item) => item.id === selectedModelId);
    const nextSelectionMap: AdvancedSelectionMap = {
      baselineModelSource: activeTab
    };

    if (activeTab === "ai") {
      nextSelectionMap.modelGenerateTypeKey = "real-model";
      nextSelectionMap.modelGenerateType = "真人模特图";
      if (gender) nextSelectionMap.gender = gender;
      if (appearance) nextSelectionMap.appearance = appearance;
      if (age) nextSelectionMap.age = age;
      if (persona) nextSelectionMap.persona = persona;
      if (bodyType) nextSelectionMap.bodyType = bodyType;
      if (detailSupplement) nextSelectionMap.baselineModelSupplement = detailSupplement;
      onSelectionChange?.(["AI生成", "真人模特图", gender, appearance, age, persona, bodyType, detailSupplement].filter(Boolean));
    } else {
      if (selectedModelId) nextSelectionMap.selectedModelId = selectedModelId;
      if (selectedModel?.name) nextSelectionMap.selectedModelName = selectedModel.name;
      onSelectionChange?.(["我的模特", selectedModel?.name ?? ""].filter(Boolean));
    }

    onSelectionMapChange?.(nextSelectionMap);
  }, [activeTab, age, appearance, bodyType, detailSupplement, gender, onSelectionChange, onSelectionMapChange, orderedModelAssets, persona, selectedModelId]);

  const appendModelFiles = async (files: File[]) => {
    const nextModels = await onUploadModels(files);
    if (nextModels[0]?.id) {
      setActiveTab("mine");
      setSelectedModelId(nextModels[0].id);
    }
  };

  const handleOpenAiTab = () => {
    setActiveTab("ai");
    setSelectedModelId("");
    onSelectionMapChange?.({
      baselineModelSource: "ai"
    });
  };

  const handleOpenMineTab = () => {
    setActiveTab("mine");
    setSelectedModelId("");
    onSelectionMapChange?.({
      baselineModelSource: "mine"
    });
  };

  const handleGenerateModel = async () => {
    if (!gender || !appearance || !age || !persona || !bodyType) {
      return;
    }
    setIsGeneratingModel(true);
    try {
      const nextModelId = await onGenerateBaselineModel({
        baselineModelSource: "ai",
        modelGenerateTypeKey: "real-model",
        modelGenerateType: "真人模特图",
        gender,
        appearance,
        age,
        persona,
        bodyType,
        baselineModelSupplement: detailSupplement
      });
      if (nextModelId) {
        setActiveTab("mine");
        setSelectedModelId(nextModelId);
      }
    } finally {
      setIsGeneratingModel(false);
    }
  };

  return (
    <div className="ck-form-block">
      <FieldTitle label="基准模特" required />
      <div className="ck-task-rail-mode-switch ck-baseline-model-tabs">
        <button className={activeTab === "ai" ? "active" : ""} onClick={handleOpenAiTab} type="button">
          AI生成
        </button>
        <button className={activeTab === "mine" ? "active" : ""} onClick={handleOpenMineTab} type="button">
          我的模特
        </button>
      </div>

      {activeTab === "ai" ? (
        <div className="ck-baseline-model-panel">
          <div className="ck-baseline-model-ai-row three">
            <SelectField fullWidth hideLabel label="性别" onChange={setGender} options={["男", "女"]} placeholder="性别" value={gender} />
            <SelectField fullWidth hideLabel label="年龄段" onChange={setAge} options={modelGenerateAgeOptions} placeholder="年龄段" value={age} />
            <SelectField fullWidth hideLabel label="体型" onChange={setBodyType} options={modelGenerateBodyOptions} placeholder="体型" value={bodyType} />
          </div>
          <div className="ck-baseline-model-ai-row two">
            <SelectField fullWidth hideLabel label="人设" onChange={setPersona} options={modelGeneratePersonaOptions} placeholder="人设" value={persona} />
            <SelectField fullWidth hideLabel label="外貌特征" onChange={setAppearance} options={modelGenerateAppearanceOptions} placeholder="外貌特征" value={appearance} />
          </div>
          <UnifiedTextareaField
            formBlockClassName="ck-form-block ck-set-pack-selling-points ck-model-input-detail"
            label="细节补充"
            maxLength={600}
            onChange={setDetailSupplement}
            optional
            placeholder="细节补充，例如：冷白皮、长卷发、镜头感强、站姿自然。"
            value={detailSupplement}
          />
          <div className="ck-baseline-model-ai-actions">
            <button className="ck-baseline-model-generate-mini" onClick={() => void handleGenerateModel()} type="button">
              <img alt="" src={figmaIcons.creditGem} />
              <span>5积分</span>
              <em>{isGeneratingModel ? "生成中..." : "生成模特"}</em>
            </button>
          </div>
        </div>
      ) : (
        <div className="ck-baseline-model-panel">
          <input
            accept="image/*"
            className="ck-upload-input"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (!files.length) return;
              void appendModelFiles(files);
              event.target.value = "";
            }}
            ref={inputRef}
            type="file"
          />
          <div className="ck-baseline-model-grid">
            <button className="ck-baseline-model-upload-card" onClick={() => inputRef.current?.click()} type="button">
              <span className="ck-baseline-model-upload-icon">+</span>
            </button>
            {orderedModelAssets.map((item) => (
              <button
                className={`ck-baseline-model-card${selectedModelId === item.id ? " active" : ""}`}
                key={item.id}
                onClick={() => setSelectedModelId(item.id)}
                type="button"
              >
                <div className="ck-baseline-model-card-visual">
                  <img alt={item.name ?? "模特图"} src={item.src} />
                  <span className="ck-baseline-model-card-tag">{getModelSourceLabel(item.sourceType)}</span>
                </div>
              </button>
            ))}
          </div>
          {orderedModelAssets.length === 0 ? <div className="ck-baseline-model-empty">当前还没有模特素材，先上传一张即可使用。</div> : null}
        </div>
      )}
    </div>
  );
}

function AdaptiveSegmentedField({
  label,
  options,
  value,
  required,
  fullWidth,
  onChange
}: {
  label: string;
  options: string[];
  value: string;
  required?: boolean;
  fullWidth?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="ck-form-block">
      {label ? <FieldTitle label={label} required={required} /> : null}
      <div className={`ck-mini-switch ck-adaptive-segmented${fullWidth ? " full" : ""}`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map((option) => (
          <button className={value === option ? "active" : ""} key={option} onClick={() => onChange(option)} type="button">
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ModelTrySetupSection({
  toolKey,
  uploads,
  modelAssets,
  remainingStorageMb,
  onAddUpload,
  onRemoveUpload,
  onOpenLibrary,
  onRejectedUpload,
  onAtLimit,
  onGenerateBaselineModel,
  onUploadModels,
  onSelectionChange,
  onSelectionMapChange,
  selectedValues,
  uploadFieldLabel = "上传商品图",
  uploadFieldMeta,
  uploadFieldHint,
  uploadLimitOverride,
  showTrialMode = true
}: {
  toolKey: string;
  uploads: Record<string, UploadItem[]>;
  modelAssets: ModelAsset[];
  remainingStorageMb: number;
  onAddUpload: (fieldKey: string, nextValues: UploadItem[]) => void;
  onRemoveUpload: (fieldKey: string, index: number) => void;
  onOpenLibrary: (fieldKey: string) => void;
  onRejectedUpload: (message: string) => void;
  onAtLimit: () => void;
  onGenerateBaselineModel: (values: AdvancedSelectionMap) => Promise<string | null>;
  onUploadModels: (files: File[]) => Promise<ModelAsset[]>;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  selectedValues?: AdvancedSelectionMap;
  uploadFieldLabel?: string;
  uploadFieldMeta?: string;
  uploadFieldHint?: string;
  uploadLimitOverride?: number;
  showTrialMode?: boolean;
}) {
  const mainUploadKey = `${toolKey}:main`;
  const defaultTrialMode = showTrialMode ? selectedValues?.trialMode ?? "单产品试穿" : "单产品试穿";
  const [trialMode, setTrialMode] = useState(defaultTrialMode);
  const [activeTab, setActiveTab] = useState<"ai" | "mine" | "preference">(
    (selectedValues?.modelTryModelSource as "ai" | "mine" | "preference") ?? "mine"
  );
  const [selectedModelId, setSelectedModelId] = useState(selectedValues?.selectedModelId ?? "");
  const [gender, setGender] = useState(selectedValues?.gender ?? "");
  const [appearance, setAppearance] = useState(selectedValues?.appearance ?? "");
  const [age, setAge] = useState(selectedValues?.age ?? "");
  const [persona, setPersona] = useState(selectedValues?.persona ?? "");
  const [bodyType, setBodyType] = useState(selectedValues?.bodyType ?? "");
  const [detailSupplement, setDetailSupplement] = useState(selectedValues?.baselineModelSupplement ?? "");
  const [ethnicity, setEthnicity] = useState(selectedValues?.ethnicity ?? "");
  const [genderSpecies, setGenderSpecies] = useState(selectedValues?.genderSpecies ?? "");
  const [ageRange, setAgeRange] = useState(selectedValues?.ageRange ?? "");
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const trialMainUploads = uploads[mainUploadKey] ?? [];
  const modelCandidates = useMemo(
    () =>
      [...modelAssets].sort((left, right) => {
        if (left.sourceType !== right.sourceType) {
          return left.sourceType === "upload" ? -1 : 1;
        }
        return right.createdAt - left.createdAt;
      }),
    [modelAssets]
  );
  const uploadLimit = uploadLimitOverride ?? (trialMode === "单产品试穿" ? 24 : 6);
  const lastSyncedValuesRef = useRef("");

  useEffect(() => {
    const nextSyncKey = JSON.stringify({
      trialMode: showTrialMode ? selectedValues?.trialMode ?? "单产品试穿" : "单产品试穿",
      modelTryModelSource: (selectedValues?.modelTryModelSource as "ai" | "mine" | "preference") ?? "mine",
      selectedModelId: selectedValues?.selectedModelId ?? "",
      gender: selectedValues?.gender ?? "",
      appearance: selectedValues?.appearance ?? "",
      age: selectedValues?.age ?? "",
      persona: selectedValues?.persona ?? "",
      bodyType: selectedValues?.bodyType ?? "",
      baselineModelSupplement: selectedValues?.baselineModelSupplement ?? "",
      ethnicity: selectedValues?.ethnicity ?? "",
      genderSpecies: selectedValues?.genderSpecies ?? "",
      ageRange: selectedValues?.ageRange ?? ""
    });

    if (nextSyncKey === lastSyncedValuesRef.current) {
      return;
    }

    lastSyncedValuesRef.current = nextSyncKey;
    setTrialMode(showTrialMode ? selectedValues?.trialMode ?? "单产品试穿" : "单产品试穿");
    setActiveTab((selectedValues?.modelTryModelSource as "ai" | "mine" | "preference") ?? "mine");
    setSelectedModelId(selectedValues?.selectedModelId ?? "");
    setGender(selectedValues?.gender ?? "");
    setAppearance(selectedValues?.appearance ?? "");
    setAge(selectedValues?.age ?? "");
    setPersona(selectedValues?.persona ?? "");
    setBodyType(selectedValues?.bodyType ?? "");
    setDetailSupplement(selectedValues?.baselineModelSupplement ?? "");
    setEthnicity(selectedValues?.ethnicity ?? "");
    setGenderSpecies(selectedValues?.genderSpecies ?? "");
    setAgeRange(selectedValues?.ageRange ?? "");
  }, [selectedValues, showTrialMode]);

  useEffect(() => {
    const selectedModel = modelCandidates.find((item) => item.id === selectedModelId);
    const nextSelectionMap: AdvancedSelectionMap = {
      trialMode,
      modelTryModelSource: activeTab
    };

    if (activeTab === "ai") {
      nextSelectionMap.modelGenerateTypeKey = "real-model";
      nextSelectionMap.modelGenerateType = "真人模特图";
      if (gender) nextSelectionMap.gender = gender;
      if (appearance) nextSelectionMap.appearance = appearance;
      if (age) nextSelectionMap.age = age;
      if (persona) nextSelectionMap.persona = persona;
      if (bodyType) nextSelectionMap.bodyType = bodyType;
      if (detailSupplement) nextSelectionMap.baselineModelSupplement = detailSupplement;
      onSelectionChange?.(["AI生成", "真人模特图", gender, appearance, age, persona, bodyType, detailSupplement].filter(Boolean));
    } else if (activeTab === "mine") {
      if (selectedModelId) nextSelectionMap.selectedModelId = selectedModelId;
      if (selectedModel?.name) nextSelectionMap.selectedModelName = selectedModel.name;
      onSelectionChange?.(["我的模特", selectedModel?.name ?? ""].filter(Boolean));
    } else {
      if (ethnicity) nextSelectionMap.ethnicity = ethnicity;
      if (genderSpecies) nextSelectionMap.genderSpecies = genderSpecies;
      if (ageRange) nextSelectionMap.ageRange = ageRange;
      if (bodyType) nextSelectionMap.bodyType = bodyType;
      onSelectionChange?.(["模特偏好", ethnicity, genderSpecies, ageRange, bodyType].filter(Boolean));
    }

    onSelectionMapChange?.(nextSelectionMap);
  }, [
    activeTab,
    age,
    ageRange,
    appearance,
    bodyType,
    detailSupplement,
    ethnicity,
    gender,
    genderSpecies,
    modelCandidates,
    onSelectionChange,
    onSelectionMapChange,
    persona,
    selectedModelId,
    trialMode
  ]);

  const appendModelFiles = async (files: File[]) => {
    const nextModels = await onUploadModels(files);
    if (!selectedModelId && nextModels[0]?.id) {
      setActiveTab("mine");
      setSelectedModelId(nextModels[0].id);
    }
  };

  const handleOpenAiTab = () => {
    setActiveTab("ai");
    setSelectedModelId("");
  };

  const handleOpenMineTab = () => {
    setActiveTab("mine");
  };

  const handleOpenPreferenceTab = () => {
    setActiveTab("preference");
    setSelectedModelId("");
  };

  const handleGenerateModel = async () => {
    if (!gender || !appearance || !age || !persona || !bodyType) {
      return;
    }
    setIsGeneratingModel(true);
    try {
      const nextModelId = await onGenerateBaselineModel({
        baselineModelSource: "ai",
        modelGenerateTypeKey: "real-model",
        modelGenerateType: "真人模特图",
        gender,
        appearance,
        age,
        persona,
        bodyType,
        baselineModelSupplement: detailSupplement
      });
      if (nextModelId) {
        setActiveTab("mine");
        setSelectedModelId(nextModelId);
      }
    } finally {
      setIsGeneratingModel(false);
    }
  };

  return (
    <>
      {showTrialMode ? (
        <AdaptiveSegmentedField
          fullWidth
          label=""
          onChange={setTrialMode}
          options={["单产品试穿", "多产品搭配"]}
          required
          value={trialMode}
        />
      ) : null}

      <UploadField
        fieldKey={mainUploadKey}
        hint={uploadFieldHint ?? `最多${uploadLimit}张，支持JPG/PNG/WebP`}
        label={uploadFieldLabel}
        maxCount={uploadLimit}
        meta={uploadFieldMeta ?? `（单次最多上传${uploadLimit}张）`}
        onAdd={onAddUpload}
        onAtLimit={onAtLimit}
        onOpenLibrary={onOpenLibrary}
        onRejectedUpload={onRejectedUpload}
        onRemove={onRemoveUpload}
        remainingStorageMb={remainingStorageMb}
        required
        values={trialMainUploads}
      />

      <div className="ck-form-block">
        <FieldTitle label="选择模特" required />
        <div className="ck-task-rail-mode-switch ck-baseline-model-tabs">
          <button className={activeTab === "ai" ? "active" : ""} onClick={handleOpenAiTab} type="button">
            AI生成
          </button>
          <button className={activeTab === "mine" ? "active" : ""} onClick={handleOpenMineTab} type="button">
            我的模特
          </button>
          <button className={activeTab === "preference" ? "active" : ""} onClick={handleOpenPreferenceTab} type="button">
            模特偏好
          </button>
        </div>

        {activeTab === "ai" ? (
          <div className="ck-baseline-model-panel">
            <div className="ck-baseline-model-ai-row three">
              <SelectField fullWidth hideLabel label="性别" onChange={setGender} options={["男", "女"]} placeholder="性别" value={gender} />
              <SelectField fullWidth hideLabel label="年龄段" onChange={setAge} options={modelGenerateAgeOptions} placeholder="年龄段" value={age} />
              <SelectField fullWidth hideLabel label="体型" onChange={setBodyType} options={modelGenerateBodyOptions} placeholder="体型" value={bodyType} />
            </div>
            <div className="ck-baseline-model-ai-row two">
              <SelectField fullWidth hideLabel label="人设" onChange={setPersona} options={modelGeneratePersonaOptions} placeholder="人设" value={persona} />
              <SelectField fullWidth hideLabel label="外貌特征" onChange={setAppearance} options={modelGenerateAppearanceOptions} placeholder="外貌特征" value={appearance} />
            </div>
            <UnifiedTextareaField
              formBlockClassName="ck-form-block ck-set-pack-selling-points ck-model-input-detail"
              label="细节补充"
              maxLength={600}
              onChange={setDetailSupplement}
              optional
              placeholder="细节补充，例如：冷白皮、长卷发、镜头感强、站姿自然。"
              value={detailSupplement}
            />
            <div className="ck-baseline-model-ai-actions">
              <button className="ck-baseline-model-generate-mini" onClick={() => void handleGenerateModel()} type="button">
                <img alt="" src={figmaIcons.creditGem} />
                <span>5积分</span>
                <em>{isGeneratingModel ? "生成中..." : "生成模特"}</em>
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "mine" ? (
          <div className="ck-baseline-model-panel">
            <input
              accept="image/*"
              className="ck-upload-input"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (!files.length) return;
                void appendModelFiles(files);
                event.target.value = "";
              }}
              ref={inputRef}
              type="file"
            />
            <div className="ck-baseline-model-grid">
              <button className="ck-baseline-model-upload-card" onClick={() => inputRef.current?.click()} type="button">
                <span className="ck-baseline-model-upload-icon">+</span>
              </button>
              {modelCandidates.map((item) => (
                <button
                  className={`ck-baseline-model-card${selectedModelId === item.id ? " active" : ""}`}
                  key={item.id}
                  onClick={() => setSelectedModelId(item.id)}
                  type="button"
                >
                  <div className="ck-baseline-model-card-visual">
                    <img alt={item.name ?? "模特图"} src={item.src} />
                    <span className="ck-baseline-model-card-tag">{getModelSourceLabel(item.sourceType)}</span>
                  </div>
                </button>
              ))}
            </div>
            {modelCandidates.length === 0 ? <div className="ck-baseline-model-empty">当前还没有模特素材，先上传一张即可使用。</div> : null}
          </div>
        ) : null}

        {activeTab === "preference" ? (
          <div className="ck-baseline-model-panel ck-model-try-preference-panel">
            <div className="ck-baseline-model-ai-row two">
              <SelectField fullWidth hideLabel label="人种肤色" onChange={setEthnicity} options={modelTryEthnicityOptions} placeholder="人种肤色" value={ethnicity} />
              <SelectField
                fullWidth
                hideLabel
                label="性别物种"
                onChange={setGenderSpecies}
                options={modelTryGenderSpeciesOptions}
                placeholder="性别物种"
                value={genderSpecies}
              />
            </div>
            <div className="ck-baseline-model-ai-row two">
              <SelectField fullWidth hideLabel label="年龄维度" onChange={setAgeRange} options={modelTryAgeRangeOptions} placeholder="年龄维度" value={ageRange} />
              <SelectField fullWidth hideLabel label="身型身材" onChange={setBodyType} options={modelTryBodyTypeOptions} placeholder="身型身材" value={bodyType} />
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function RichImageSelectInlineField({
  value,
  options,
  placeholder,
  onChange
}: {
  value: string;
  options: RichSelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeOption = options.find((item) => item.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className="ck-select-dropdown full" ref={containerRef}>
      <button className={`ck-select full${value ? "" : " placeholder"}`} onClick={() => setOpen((current) => !current)} type="button">
        {activeOption?.displayLabel ?? placeholder ?? "请选择，或直接输入"}
        <span>⌄</span>
      </button>
      {open ? (
        <div className="ck-select-dropdown-menu full ck-rich-image-select-menu">
          {options.map((option) => (
            <button
              className={`ck-rich-image-option${option.value === value ? " active" : ""}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              type="button"
            >
              <div className="ck-rich-image-option-copy">
                <strong>{option.title}</strong>
                <span>{option.recommendation}</span>
              </div>
              {option.thumbnailSrc ? <img alt={option.title} src={option.thumbnailSrc} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReferenceUploadSection({
  fieldKey,
  config,
  hint,
  maxCount,
  values,
  onAdd,
  onRemove,
  onOpenLibrary,
  onRejectedUpload,
  onAtLimit,
  remainingStorageMb
}: {
  fieldKey: string;
  config: UploadModuleFieldConfig;
  hint: string;
  maxCount: number;
  values: UploadItem[];
  onAdd: (fieldKey: string, nextValues: UploadItem[]) => void;
  onRemove: (fieldKey: string, index: number) => void;
  onOpenLibrary: (fieldKey: string) => void;
  onRejectedUpload: (message: string) => void;
  onAtLimit: () => void;
  remainingStorageMb: number;
}) {
  return (
    <UploadField
      fieldKey={fieldKey}
      hint={hint}
      label={config.label}
      maxCount={maxCount}
      meta={config.meta}
      onAdd={onAdd}
      onAtLimit={onAtLimit}
      onOpenLibrary={onOpenLibrary}
      onRejectedUpload={onRejectedUpload}
      onRemove={onRemove}
      optional={config.optional}
      remainingStorageMb={remainingStorageMb}
      values={values}
    />
  );
}

function RetouchModeSection() {
  const [retouchMode, setRetouchMode] = useState<"original" | "extract">("original");
  const [extractMode, setExtractMode] = useState<"smart" | "custom">("smart");
  const [customSubject, setCustomSubject] = useState("");

  return (
    <div className="ck-form-block">
      <FieldTitle label="选择模式" required />
      <div className="ck-choice-row ck-choice-row-retouch ck-choice-row-retouch-primary">
        <button
          className={`ck-mode-card ck-mode-card-primary${retouchMode === "original" ? " active" : ""}`}
          onClick={() => setRetouchMode("original")}
          type="button"
        >
          <div className="ck-mode-card-head">
            <strong>原图精修</strong>
            <span className={`ck-check${retouchMode === "original" ? " active" : ""}`} />
          </div>
          <p>产品图不变，提示产品主体材质与高级感。</p>
        </button>
        <button
          className={`ck-mode-card ck-mode-card-primary${retouchMode === "extract" ? " active" : ""}`}
          onClick={() => setRetouchMode("extract")}
          type="button"
        >
          <div className="ck-mode-card-head">
            <strong>提取主体精修</strong>
            <span className={`ck-check${retouchMode === "extract" ? " active" : ""}`} />
          </div>
          <p>提取图片主体产品，进行精修，正面展示。</p>
        </button>
      </div>

      {retouchMode === "extract" ? (
        <div className="ck-retouch-extract-wrap">
          <FieldTitle label="主体提取方式" required />
          <div className="ck-choice-row ck-choice-row-retouch">
            <button
              className={`ck-mode-card ck-mode-card-extract${extractMode === "smart" ? " active" : ""}`}
              onClick={() => setExtractMode("smart")}
              type="button"
            >
              <div className="ck-mode-card-head">
                <strong>智能提取主体</strong>
                <span className={`ck-check${extractMode === "smart" ? " active" : ""}`} />
              </div>
              <p>自动识别主商品主体，适合大多数标准产品图。</p>
            </button>
            <button
              className={`ck-mode-card ck-mode-card-extract${extractMode === "custom" ? " active" : ""}`}
              onClick={() => setExtractMode("custom")}
              type="button"
            >
              <div className="ck-mode-card-head">
                <strong>自定义主体</strong>
                <span className={`ck-check${extractMode === "custom" ? " active" : ""}`} />
              </div>
              <p>手动说明要保留的主体范围，适合复杂构图。</p>
            </button>
          </div>

          {extractMode === "custom" ? (
            <UnifiedTextareaField
              formBlockClassName="ck-retouch-custom-textarea"
              maxLength={500}
              onChange={setCustomSubject}
              placeholder="请输入需要提取和精修的主体说明，例如：仅保留前景中的玻璃香水瓶，正面展示。"
              value={customSubject}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function WatermarkModeSection({
  selectedValues,
  uploads,
  onSelectionChange,
  onSelectionMapChange,
  onToast
}: {
  selectedValues?: AdvancedSelectionMap;
  uploads: UploadItem[];
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onToast: (message: string, tone?: "warning") => void;
}) {
  const skipSelectedValuesSyncRef = useRef(false);
  const lastSelectedValuesSignatureRef = useRef("");
  const isManualSupported = uploads.length <= 1;
  const [watermarkMode, setWatermarkMode] = useState<"smart" | "manual">(
    selectedValues?.watermarkModeKey === "manual" ? "manual" : "smart"
  );

  useEffect(() => {
    if (skipSelectedValuesSyncRef.current) {
      skipSelectedValuesSyncRef.current = false;
      return;
    }
    const nextMode = selectedValues?.watermarkModeKey === "manual" ? "manual" : "smart";
    const nextSignature = JSON.stringify({ watermarkModeKey: nextMode });
    if (nextSignature === lastSelectedValuesSignatureRef.current) return;
    lastSelectedValuesSignatureRef.current = nextSignature;
    setWatermarkMode((current) => (current === nextMode ? current : nextMode));
  }, [selectedValues, watermarkMode]);

  useEffect(() => {
    const modeLabel = watermarkMode === "manual" ? "手动涂抹去水印" : "智能去水印";
    skipSelectedValuesSyncRef.current = true;
    lastSelectedValuesSignatureRef.current = JSON.stringify({ watermarkModeKey: watermarkMode });
    onSelectionMapChange?.({
      watermarkModeKey: watermarkMode,
      watermarkMode: modeLabel
    });
    onSelectionChange?.([modeLabel]);
  }, [onSelectionChange, onSelectionMapChange, watermarkMode]);

  useEffect(() => {
    if (watermarkMode === "manual" && !isManualSupported) {
      setWatermarkMode("smart");
    }
  }, [isManualSupported, watermarkMode]);

  return (
    <div className="ck-form-block">
      <FieldTitle label="选择模式" required />
      <div className="ck-choice-row ck-choice-row-retouch ck-choice-row-retouch-primary">
        <button
          className={`ck-mode-card ck-mode-card-primary${watermarkMode === "smart" ? " active" : ""}`}
          onClick={() => setWatermarkMode((current) => (current === "smart" ? current : "smart"))}
          type="button"
        >
          <div className="ck-mode-card-head">
            <strong>智能去水印</strong>
            <span className={`ck-check${watermarkMode === "smart" ? " active" : ""}`} />
          </div>
          <p>自动识别图片中的常见水印区域并完成去除。</p>
        </button>
        <button
          className={`ck-mode-card ck-mode-card-primary${watermarkMode === "manual" ? " active" : ""}${isManualSupported ? "" : " disabled"}`}
          onClick={() => {
            if (!isManualSupported) {
              onToast("手动涂抹去水印仅支持单张图片，请只保留1张后再使用", "warning");
              return;
            }
            setWatermarkMode((current) => (current === "manual" ? current : "manual"));
          }}
          type="button"
        >
          <div className="ck-mode-card-head">
            <strong>手动涂抹去水印</strong>
            <span className={`ck-check${watermarkMode === "manual" ? " active" : ""}`} />
          </div>
          <p>通过手动圈定或涂抹区域，更精准地处理复杂水印。上传后仅支持单张图片。</p>
        </button>
      </div>
    </div>
  );
}

function UpscaleResolutionSection({
  selectedValues,
  onSelectionChange,
  onSelectionMapChange
}: {
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
}) {
  const skipSelectedValuesSyncRef = useRef(false);
  const lastSelectedValuesSignatureRef = useRef("");
  const options = ["2K", "4K", "8K"];
  const [resolution, setResolution] = useState(selectedValues?.upscaleResolution ?? options[0]);

  useEffect(() => {
    if (skipSelectedValuesSyncRef.current) {
      skipSelectedValuesSyncRef.current = false;
      return;
    }
    const nextResolution = typeof selectedValues?.upscaleResolution === "string" ? selectedValues.upscaleResolution : options[0];
    const nextSignature = JSON.stringify({ upscaleResolution: nextResolution });
    if (nextSignature === lastSelectedValuesSignatureRef.current) return;
    lastSelectedValuesSignatureRef.current = nextSignature;
    setResolution((current) => (current === nextResolution ? current : nextResolution));
  }, [resolution, selectedValues]);

  useEffect(() => {
    skipSelectedValuesSyncRef.current = true;
    lastSelectedValuesSignatureRef.current = JSON.stringify({ upscaleResolution: resolution });
    onSelectionMapChange?.({ upscaleResolution: resolution });
    onSelectionChange?.([resolution]);
  }, [onSelectionChange, onSelectionMapChange, resolution]);

  return (
    <div className="ck-form-block">
      <div className="ck-inline-field">
        <FieldTitle label="分辨率" required />
        <div className="ck-mini-switch" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
          {options.map((option) => (
            <button
              className={option === resolution ? "active" : ""}
              key={option}
              onClick={() => setResolution((current) => (current === option ? current : option))}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineartStyleSection({
  selectedValues,
  onSelectionChange,
  onSelectionMapChange
}: {
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
}) {
  const skipSelectedValuesSyncRef = useRef(false);
  const lastSelectedValuesSignatureRef = useRef("");
  const options = ["清稿", "草图/速写", "精细素描"];
  const [lineartStyle, setLineartStyle] = useState(selectedValues?.lineartStyle ?? options[0]);

  useEffect(() => {
    if (skipSelectedValuesSyncRef.current) {
      skipSelectedValuesSyncRef.current = false;
      return;
    }
    const nextStyle = typeof selectedValues?.lineartStyle === "string" ? selectedValues.lineartStyle : options[0];
    const nextSignature = JSON.stringify({ lineartStyle: nextStyle });
    if (nextSignature === lastSelectedValuesSignatureRef.current) return;
    lastSelectedValuesSignatureRef.current = nextSignature;
    setLineartStyle((current) => (current === nextStyle ? current : nextStyle));
  }, [lineartStyle, selectedValues]);

  useEffect(() => {
    skipSelectedValuesSyncRef.current = true;
    lastSelectedValuesSignatureRef.current = JSON.stringify({ lineartStyle });
    onSelectionMapChange?.({ lineartStyle });
    onSelectionChange?.([lineartStyle]);
  }, [lineartStyle, onSelectionChange, onSelectionMapChange]);

  return (
    <AdaptiveChoiceField
      label="线条类型"
      onChange={setLineartStyle}
      options={options.map((option) => ({ key: option, label: option }))}
      required
      value={lineartStyle}
    />
  );
}

function MaskEditorModal({
  imageSrc,
  initialMaskDataUrl,
  autoTargetLabel,
  onClose,
  onSave
}: {
  imageSrc: string;
  initialMaskDataUrl?: string;
  autoTargetLabel?: string;
  onClose: () => void;
  onSave: (maskDataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<"auto" | "add" | "erase">("auto");
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;

    const drawInitialMask = (context: CanvasRenderingContext2D) => {
      if (!initialMaskDataUrl) return;
      const maskImage = new Image();
      maskImage.onload = () => {
        context.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
      };
      maskImage.src = initialMaskDataUrl;
    };

    const handleLoad = () => {
      const maxWidth = 760;
      const maxHeight = 920;
      const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
      const width = Math.max(240, Math.round(image.naturalWidth * scale));
      const height = Math.max(240, Math.round(image.naturalHeight * scale));
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      image.style.width = `${width}px`;
      image.style.height = `${height}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      context.lineJoin = "round";
      drawInitialMask(context);
      setHistory(canvas.toDataURL("image/png") ? [canvas.toDataURL("image/png")] : []);
      setRedoHistory([]);
    };

    if (image.complete) {
      handleLoad();
    } else {
      image.onload = handleLoad;
    }
  }, [imageSrc, initialMaskDataUrl]);

  const getContext = () => canvasRef.current?.getContext("2d") ?? null;

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setHistory((current) => [...current, dataUrl]);
    setRedoHistory([]);
  };

  const restoreDataUrl = (dataUrl?: string) => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!dataUrl) return;
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = dataUrl;
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const nextHistory = history.slice(0, -1);
    const last = history[history.length - 1];
    setHistory(nextHistory);
    setRedoHistory((current) => [last, ...current]);
    restoreDataUrl(nextHistory[nextHistory.length - 1]);
  };

  const handleRedo = () => {
    if (!redoHistory.length) return;
    const [next, ...rest] = redoHistory;
    setRedoHistory(rest);
    setHistory((current) => [...current, next]);
    restoreDataUrl(next);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    pushHistory();
  };

  const drawBrushPoint = (context: CanvasRenderingContext2D, point: { x: number; y: number }) => {
    context.beginPath();
    context.arc(point.x, point.y, Math.max(6, brushSize / 2), 0, Math.PI * 2);
    if (tool === "erase") {
      context.fill();
      return;
    }
    context.fill();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getPoint(event);
    const context = getContext();
    if (!point || !context) return;
    setIsDrawing(true);
    setLastPoint(point);
    context.globalCompositeOperation = tool === "erase" ? "destination-out" : "source-over";
    context.strokeStyle = "#ffe34d";
    context.fillStyle = tool === "erase" ? "rgba(0,0,0,1)" : "rgba(255, 227, 77, 0.28)";
    context.lineWidth = brushSize;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(point.x, point.y);
    drawBrushPoint(context, point);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const point = getPoint(event);
    const context = getContext();
    if (!point || !context || !lastPoint) return;
    context.globalCompositeOperation = tool === "erase" ? "destination-out" : "source-over";
    context.strokeStyle = "#ffe34d";
    context.fillStyle = tool === "erase" ? "rgba(0,0,0,1)" : "rgba(255, 227, 77, 0.28)";
    context.lineWidth = brushSize;
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    drawBrushPoint(context, point);
    setLastPoint(point);
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      pushHistory();
    }
    setIsDrawing(false);
    setLastPoint(null);
  };

  return (
    <div className="ck-mask-editor-mask">
      <div className="ck-mask-editor-modal">
        <div className="ck-mask-editor-header">
          <div className="ck-mask-editor-toolbar">
            <div className="ck-task-rail-mode-switch ck-mask-editor-tools">
              {[
                ["auto", "自动识别"],
                ["add", "添加选区"],
                ["erase", "去除选区"]
              ].map(([key, label]) => (
                <button
                  className={tool === key ? "active" : ""}
                  key={key}
                  onClick={() => setTool(key as typeof tool)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="ck-mask-editor-brush">
              <span>涂抹大小</span>
              <input max={48} min={8} onChange={(event) => setBrushSize(Number(event.target.value))} type="range" value={brushSize} />
            </div>
            <div className="ck-mask-editor-actions">
              <button
                onClick={() => {
                  if (!autoTargetLabel) return;
                  restoreDataUrl(initialMaskDataUrl);
                  setHistory(initialMaskDataUrl ? [initialMaskDataUrl] : []);
                  setRedoHistory([]);
                }}
                type="button"
              >
                重新识别
              </button>
              <button onClick={handleUndo} type="button">撤销</button>
              <button disabled={!redoHistory.length} onClick={handleRedo} type="button">重做</button>
              <button onClick={handleClear} type="button">清空</button>
            </div>
          </div>
        </div>
        {autoTargetLabel ? <div className="ck-mask-editor-tip">已自动识别{autoTargetLabel}，可手动优化细节</div> : null}
        <div className="ck-mask-editor-stage">
          <div className="ck-mask-editor-canvas-wrap">
            <img alt="待编辑图片" ref={imageRef} src={imageSrc} />
            <canvas
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              ref={canvasRef}
            />
          </div>
        </div>
        <div className="ck-mask-editor-footer">
          <button className="ck-mask-editor-secondary" onClick={onClose} type="button">
            关闭
          </button>
          <button
            className="ck-mask-editor-primary"
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              onSave(canvas.toDataURL("image/png"));
            }}
            type="button"
          >
            编辑完成
          </button>
        </div>
      </div>
    </div>
  );
}

function MaskDrawSection({
  title = "绘制蒙版",
  buttonText = "开始涂抹",
  uploads,
  selectedValues,
  maskKey,
  helperText,
  singleUploadOnly = false,
  onSelectionChange,
  onSelectionMapChange,
  onToast
}: {
  title?: string;
  buttonText?: string;
  uploads: UploadItem[];
  selectedValues?: AdvancedSelectionMap;
  maskKey: string;
  helperText?: string;
  singleUploadOnly?: boolean;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onToast: (message: string, tone?: "warning") => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const maskDataUrl = typeof selectedValues?.[maskKey] === "string" ? selectedValues[maskKey] : "";
  const primaryImage = uploads[0]?.previewSrc || uploads[0]?.src || "/assets/upload-preview.png";
  const openMaskEditor = () => {
    if (!uploads.length) {
      onToast("请先上传图片后再绘制蒙版", "warning");
      return;
    }
    if (singleUploadOnly && uploads.length !== 1) {
      onToast("手动涂抹仅支持单张图片，请只保留1张后再使用", "warning");
      return;
    }
    setIsOpen(true);
  };

  return (
    <div className="ck-form-block">
      <FieldTitle label={title} required />
      <div className="ck-mask-draw-card">
        <div className="ck-mask-draw-content">
          <div className="ck-mask-draw-copy">
            <strong>绘制需要处理的区域</strong>
            <p>{helperText ?? "使用画笔或画框快速标注，提交后将仅处理蒙版范围。"}</p>
          </div>
        {maskDataUrl ? (
          <div className="ck-mask-draw-preview">
            <img alt="蒙版预览" src={maskDataUrl} />
            <button
              className="ck-mask-draw-trigger"
              onClick={openMaskEditor}
              type="button"
            >
              重新绘制
            </button>
          </div>
        ) : (
          <button
            className="ck-mask-draw-trigger"
            onClick={openMaskEditor}
            type="button"
          >
            {buttonText}
          </button>
        )}
        </div>
      </div>

      {isOpen ? (
      <MaskEditorModal
        imageSrc={primaryImage}
        initialMaskDataUrl={maskDataUrl}
        onClose={() => setIsOpen(false)}
        onSave={(nextMaskDataUrl) => {
            onSelectionMapChange?.({ [maskKey]: nextMaskDataUrl });
            onSelectionChange?.(["已绘制蒙版"]);
            setIsOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function ApplicablePlatformSection() {
  const [selectedPlatformId, setSelectedPlatformId] = useState("none");
  const [selectedMarket, setSelectedMarket] = useState("无区域");
  const [openKey, setOpenKey] = useState<"platform" | "market" | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedPlatform =
    applicablePlatformOptions.find((item) => item.id === selectedPlatformId) ?? applicablePlatformOptions[0];

  useEffect(() => {
    setSelectedMarket(selectedPlatform.markets[0] ?? "");
  }, [selectedPlatform]);

  useEffect(() => {
    if (!openKey) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenKey(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openKey]);

  return (
    <div className="ck-form-block">
      <FieldTitle label="使用平台" />
      <div className="ck-applicable-platform-row" ref={containerRef}>
        <div className="ck-select-dropdown full">
          <button className="ck-select full" onClick={() => setOpenKey((current) => (current === "platform" ? null : "platform"))} type="button">
            {selectedPlatform.label}
            <span>⌄</span>
          </button>
          {openKey === "platform" ? (
            <div className="ck-select-dropdown-menu full">
              {applicablePlatformOptions.map((option) => (
                <button
                  className={option.id === selectedPlatform.id ? "active" : ""}
                  key={option.id}
                  onClick={() => {
                    setSelectedPlatformId(option.id);
                    setOpenKey(null);
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="ck-select-dropdown full">
          <button className="ck-select full" onClick={() => setOpenKey((current) => (current === "market" ? null : "market"))} type="button">
            {selectedMarket}
            <span>⌄</span>
          </button>
          {openKey === "market" ? (
            <div className="ck-select-dropdown-menu full">
              {selectedPlatform.markets.map((market) => (
                <button
                  className={market === selectedMarket ? "active" : ""}
                  key={market}
                  onClick={() => {
                    setSelectedMarket(market);
                    setOpenKey(null);
                  }}
                  type="button"
                >
                  {market}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MoreTitleSetupSection({
  onSelectionChange,
  onSelectionMapChange,
  onToast,
  selectedValues
}: {
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onToast: (message: string, tone?: "warning") => void;
  selectedValues?: AdvancedSelectionMap;
}) {
  const [rows, setRows] = useState<MoreTitleDraftRow[]>(() => parseMoreTitleDraftRows(selectedValues?.moreTitleDraftRows));
  const [editingRowId, setEditingRowId] = useState<string>(() => parseMoreTitleDraftRows(selectedValues?.moreTitleDraftRows)[0]?.id ?? "");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draftRow, setDraftRow] = useState<MoreTitleDraftRow | null>(null);
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const lastSyncedValuesRef = useRef("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const createEmptyRow = (id: string): MoreTitleDraftRow => ({
    id,
    productName: "",
    brand: "",
    category: "",
    sellingPoints: "",
    specs: "",
    originalTitle: "",
    imageSrc: "",
    imageLabel: ""
  });

  useEffect(() => {
    const nextSyncKey = JSON.stringify({
      rows: parseMoreTitleDraftRows(selectedValues?.moreTitleDraftRows)
    });
    if (nextSyncKey === lastSyncedValuesRef.current) {
      return;
    }
    lastSyncedValuesRef.current = nextSyncKey;
    const nextRows = parseMoreTitleDraftRows(selectedValues?.moreTitleDraftRows);
    setRows(nextRows);
    if (!nextRows.some((row) => row.id === editingRowId)) {
      setEditingRowId(nextRows[0]?.id ?? "");
    }
  }, [editingRowId, selectedValues]);

  useEffect(() => {
    const filteredRows = rows.filter((row) => [row.productName, row.brand, row.category, row.sellingPoints, row.specs, row.originalTitle].some((value) => value.trim()));
    const nextSelectionMap: AdvancedSelectionMap = {
      moreTitleDraftRows: JSON.stringify(rows),
      moreTitleRowCount: String(filteredRows.length)
    };
    onSelectionMapChange?.(nextSelectionMap);
    onSelectionChange?.(
      dedupeStrings([
        ...filteredRows.flatMap((row) => [row.productName, row.brand, row.category, row.sellingPoints, row.specs, row.originalTitle]),
        filteredRows.length ? `${filteredRows.length}个商品` : ""
      ]).filter(Boolean)
    );
  }, [onSelectionChange, onSelectionMapChange, rows]);

  const updateDraftRow = (patch: Partial<MoreTitleDraftRow>) => {
    setDraftRow((current) => (current ? { ...current, ...patch } : current));
  };

  const addRow = () => {
    const nextId = `row-${Date.now()}-${rows.length + 1}`;
    setEditingRowId(nextId);
    setDraftRow(createEmptyRow(nextId));
    setIsCreatingRow(true);
    setIsEditorOpen(true);
  };

  const removeRow = (rowId: string) => {
    setRows((current) => {
      if (current.length <= 1) return current;
      const nextRows = current.filter((row) => row.id !== rowId);
      if (editingRowId === rowId) {
        setEditingRowId(nextRows[0]?.id ?? "");
      }
      return nextRows;
    });
  };

  const openEditorForRow = (rowId: string) => {
    const targetRow = rows.find((row) => row.id === rowId);
    if (!targetRow) return;
    setEditingRowId(rowId);
    setDraftRow({ ...targetRow });
    setIsCreatingRow(false);
    setIsEditorOpen(true);
  };
  const closeEditor = () => {
    setIsEditorOpen(false);
    setDraftRow(null);
    setIsCreatingRow(false);
  };
  const saveEditor = () => {
    if (!draftRow) return;
    setRows((current) =>
      isCreatingRow ? [...current, draftRow] : current.map((row) => (row.id === draftRow.id ? draftRow : row))
    );
    setEditingRowId(draftRow.id);
    closeEditor();
  };
  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = sheetName ? workbook.Sheets[sheetName] : null;
      if (!sheet) {
        onToast("未读取到可用工作表", "warning");
        return;
      }

      const importedRows = parseMoreTitleImportRows(
        XLSX.utils.sheet_to_json<MoreTitleImportSheetRow>(sheet, {
          defval: "",
          raw: false
        })
      );

      if (!importedRows.length) {
        onToast("未识别到可导入的商品信息，请检查表头", "warning");
        return;
      }

      setRows(importedRows);
      setEditingRowId(importedRows[0]?.id ?? "");
      setIsEditorOpen(false);
      setDraftRow(null);
      setIsCreatingRow(false);
      onToast(`已导入 ${importedRows.length} 个商品`, "warning");
    } catch {
      onToast("导入失败，请上传 .xlsx/.xls/.csv 文件并检查内容格式", "warning");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <>
      <div className="ck-more-title-setup">
        <div className="ck-more-title-header">
          <FieldTitle label="上传商品信息" required />
        </div>

        <div className="ck-more-title-product-panel">
          <div className="ck-more-title-product-actions">
            <button className="ck-more-title-add-row" onClick={addRow} type="button">
              + 添加商品
            </button>
            <button
              className="ck-more-title-add-row secondary"
              onClick={() => importInputRef.current?.click()}
              type="button"
            >
              本地导入
            </button>
            <input
              accept=".xlsx,.xls,.csv"
              className="ck-more-title-import-input"
              onChange={handleImportFile}
              ref={importInputRef}
              type="file"
            />
          </div>

          <div className="ck-more-title-preview-grid">
            {rows.map((row, index) => (
              <article className={`ck-more-title-preview-card${row.id === editingRowId && isEditorOpen ? " active" : ""}`} key={row.id}>
                <div className="ck-more-title-preview-body">
                  <div className="ck-more-title-preview-top">
                    <strong>{row.productName || row.originalTitle || `商品 ${index + 1}`}</strong>
                    <span>{[row.brand, row.category].filter(Boolean).join(" / ") || "待补充品牌与类目"}</span>
                  </div>
                  <div className="ck-more-title-preview-meta">
                    <p>
                      <em>原标题</em>
                      <span>{row.originalTitle || "未填写"}</span>
                    </p>
                    <p>
                      <em>卖点</em>
                      <span>{row.sellingPoints || "未填写"}</span>
                    </p>
                    <p>
                      <em>规格</em>
                      <span>{row.specs || "未填写"}</span>
                    </p>
                  </div>
                </div>
                <div className="ck-more-title-preview-thumb">
                  {row.imageSrc ? <img alt={row.imageLabel || row.productName || `商品${index + 1}`} src={row.imageSrc} /> : <span>商品图</span>}
                </div>
                <div className="ck-more-title-preview-actions">
                  <button onClick={() => openEditorForRow(row.id)} type="button">
                    编辑
                  </button>
                  <button className="danger" disabled={rows.length <= 1} onClick={() => removeRow(row.id)} type="button">
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

      </div>

      {draftRow && isEditorOpen ? (
        <div className="ck-set-pack-side-drawer-mask ck-more-title-edit-drawer-mask" onClick={closeEditor}>
          <div className="ck-set-pack-side-drawer ck-more-title-edit-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="ck-set-pack-side-drawer-head">
              <div className="ck-set-pack-drawer-title">
                <strong>{isCreatingRow ? "添加商品信息" : draftRow.productName || draftRow.originalTitle || "编辑商品信息"}</strong>
                <span>保存后同步更新左侧商品卡片</span>
              </div>
              <button aria-label="关闭商品编辑弹框" onClick={closeEditor} type="button">
                ×
              </button>
            </div>
            <div className="ck-set-pack-side-drawer-body">
              <div className="ck-more-title-editor-layout">
                <div className="ck-more-title-editor-thumb">
                  {draftRow.imageSrc ? (
                    <img alt={draftRow.imageLabel || draftRow.productName || "商品图"} src={draftRow.imageSrc} />
                  ) : (
                    <span>商品图预留区</span>
                  )}
                </div>
                <div className="ck-more-title-editor-fields">
                  <div className="ck-more-title-row-fields two">
                    <TextInputField
                      label="商品名"
                      onChange={(value) => updateDraftRow({ productName: value })}
                      placeholder="请输入商品名"
                      required
                      value={draftRow.productName}
                    />
                    <TextInputField
                      label="品牌"
                      onChange={(value) => updateDraftRow({ brand: value })}
                      placeholder="请输入品牌名"
                      value={draftRow.brand}
                    />
                  </div>
                  <div className="ck-more-title-row-fields two">
                    <SelectField
                      fullWidth
                      label="商品类目"
                      onChange={(value) => updateDraftRow({ category: value })}
                      options={moreTitleCategoryOptions}
                      placeholder="请选择"
                      value={draftRow.category}
                    />
                    <TextInputField
                      label="原始标题"
                      onChange={(value) => updateDraftRow({ originalTitle: value })}
                      placeholder="请输入当前在售标题"
                      value={draftRow.originalTitle}
                    />
                  </div>
                  <div className="ck-more-title-row-fields two textareas">
                    <UnifiedTextareaField
                      formBlockClassName="ck-form-block"
                      label="核心卖点"
                      maxLength={240}
                      onChange={(value) => updateDraftRow({ sellingPoints: value })}
                      placeholder="用分号分隔，例如：主动降噪；佩戴舒适；长续航"
                      value={draftRow.sellingPoints}
                    />
                    <UnifiedTextareaField
                      formBlockClassName="ck-form-block"
                      label="规格属性"
                      maxLength={240}
                      onChange={(value) => updateDraftRow({ specs: value })}
                      placeholder="用分号分隔，例如：蓝牙5.4；40小时续航；Type-C快充"
                      value={draftRow.specs}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="ck-more-title-edit-drawer-footer">
              <button className="secondary" onClick={closeEditor} type="button">
                取消
              </button>
              <button onClick={saveEditor} type="button">
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MoreTitleConstraintsSection({
  onSelectionChange,
  onSelectionMapChange,
  selectedValues
}: {
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  selectedValues?: AdvancedSelectionMap;
}) {
  const [mustInclude, setMustInclude] = useState(selectedValues?.moreTitleMustInclude ?? "");
  const [bannedTerms, setBannedTerms] = useState(selectedValues?.moreTitleBannedTerms ?? "");
  const lastSyncedValuesRef = useRef("");

  useEffect(() => {
    const nextSyncKey = JSON.stringify({
      mustInclude: selectedValues?.moreTitleMustInclude ?? "",
      bannedTerms: selectedValues?.moreTitleBannedTerms ?? ""
    });
    if (nextSyncKey === lastSyncedValuesRef.current) return;
    lastSyncedValuesRef.current = nextSyncKey;
    setMustInclude(selectedValues?.moreTitleMustInclude ?? "");
    setBannedTerms(selectedValues?.moreTitleBannedTerms ?? "");
  }, [selectedValues]);

  useEffect(() => {
    onSelectionMapChange?.({
      moreTitleMustInclude: mustInclude,
      moreTitleBannedTerms: bannedTerms
    });
    onSelectionChange?.(dedupeStrings([mustInclude, bannedTerms]).filter(Boolean));
  }, [bannedTerms, mustInclude, onSelectionChange, onSelectionMapChange]);

  return (
    <div className="ck-more-title-row-fields two textareas">
      <UnifiedTextareaField
        formBlockClassName="ck-form-block"
        label="必须包含词"
        maxLength={240}
        onChange={setMustInclude}
        optional
        placeholder="如有平台活动词、品牌保护词，可用分号分隔输入"
        value={mustInclude}
      />
      <UnifiedTextareaField
        formBlockClassName="ck-form-block"
        label="禁用词"
        maxLength={240}
        onChange={setBannedTerms}
        optional
        placeholder="如需避开夸大词、极限词、活动禁语，可用分号分隔输入"
        value={bannedTerms}
      />
    </div>
  );
}

function CreationModeSection({
  config,
  onSelectionChange,
  value,
  typeCountMultiplier = 1
}: {
  config: CreationModeConfig;
  onSelectionChange?: (selection: CreationModeSelection) => void;
  value?: CreationModeSelection | null;
  typeCountMultiplier?: number;
}) {
  const [activeModeId, setActiveModeId] = useState(config.modes[0]?.id ?? "");
  const [ratioOpen, setRatioOpen] = useState(false);
  const ratioDropdownRef = useRef<HTMLDivElement | null>(null);
  const isSetPackCreationMode = config.key === "set-pack";
  const [setPackPerTypeCount, setSetPackPerTypeCount] = useState(10);

  const activeMode = config.modes.find((mode) => mode.id === activeModeId) ?? config.modes[0];
  const [selectedRatio, setSelectedRatio] = useState(activeMode?.defaultRatio ?? activeMode?.ratioOptions[0] ?? "");
  const [selectedCount, setSelectedCount] = useState(activeMode?.defaultCount ?? activeMode?.countOptions[0] ?? "");
  const [selectedResolution, setSelectedResolution] = useState(
    activeMode?.defaultResolution ?? activeMode?.resolutionOptions?.[0] ?? ""
  );

  useEffect(() => {
    const nextMode = config.modes.find((mode) => mode.id === activeModeId) ?? config.modes[0];
    if (!nextMode) return;
    setSelectedRatio(nextMode.defaultRatio ?? nextMode.ratioOptions[0] ?? "");
    setSelectedCount(nextMode.defaultCount ?? nextMode.countOptions[0] ?? "");
    setSelectedResolution(nextMode.defaultResolution ?? nextMode.resolutionOptions?.[0] ?? "");
    if (isSetPackCreationMode) {
      setSetPackPerTypeCount(10);
    }
    setRatioOpen(false);
  }, [activeModeId, config.modes, isSetPackCreationMode]);

  useEffect(() => {
    if (!value) return;
    setActiveModeId(value.modeId);
    setSelectedRatio(value.ratio);
    setSelectedCount(String(value.count));
    setSelectedResolution(value.resolution ?? "");
    if (isSetPackCreationMode) {
      const nextPerTypeCount = Math.max(1, Math.round(value.count / Math.max(typeCountMultiplier, 1)) || 10);
      setSetPackPerTypeCount(nextPerTypeCount);
    }
    setRatioOpen(false);
  }, [isSetPackCreationMode, typeCountMultiplier, value]);

  useEffect(() => {
    if (!ratioOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!ratioDropdownRef.current?.contains(event.target as Node)) {
        setRatioOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [ratioOpen]);

  useEffect(() => {
    if (!activeMode) return;
    const unitCreditCost = activeMode.resolutionOptions?.length
      ? activeMode.resolutionUnitCreditCosts?.[selectedResolution] ?? 0
      : activeMode.baseUnitCreditCost ?? 0;
    onSelectionChange?.({
      modeId: activeMode.id,
      modeLabel: activeMode.label,
      ratio: selectedRatio,
      resolution: activeMode.resolutionOptions?.length ? selectedResolution : undefined,
      count: isSetPackCreationMode ? setPackPerTypeCount * Math.max(typeCountMultiplier, 1) : Number(selectedCount) || 1,
      unitCreditCost
    });
  }, [activeMode, isSetPackCreationMode, onSelectionChange, selectedCount, selectedRatio, selectedResolution, setPackPerTypeCount, typeCountMultiplier]);

  if (!activeMode) return null;

  return (
    <div className={`ck-creation-mode${isSetPackCreationMode ? " ck-creation-mode-set-pack" : ""}`}>
      <SegmentedField
        label={config.title ?? "创作模式"}
        options={config.modes.map((mode) => mode.label)}
        onChange={(index) => setActiveModeId(config.modes[index]?.id ?? config.modes[0]?.id ?? "")}
        required
        selected={config.modes.findIndex((mode) => mode.id === activeMode.id)}
      />

      {!config.hideRatioField ? (
        <div className="ck-inline-field">
          <FieldTitle label="出图比例" required />
          <div className="ck-select-dropdown" ref={ratioDropdownRef}>
            <button className="ck-select" onClick={() => setRatioOpen((value) => !value)} type="button">
              {selectedRatio}
              <span>⌄</span>
            </button>
            {ratioOpen ? (
              <div className="ck-select-dropdown-menu">
                {activeMode.ratioOptions.map((option) => (
                  <button
                    className={option === selectedRatio ? "active" : ""}
                    key={option}
                    onClick={() => {
                      setSelectedRatio(option);
                      setRatioOpen(false);
                    }}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {config.hideResolutionField || !activeMode.resolutionOptions?.length ? null : (
        <div className="ck-inline-field">
          <FieldTitle label="分辨率" required />
          <div className="ck-mini-switch" style={{ gridTemplateColumns: `repeat(${activeMode.resolutionOptions.length}, 1fr)` }}>
            {activeMode.resolutionOptions.map((option) => (
              <button
                className={option === selectedResolution ? "active" : ""}
                key={option}
                onClick={() => setSelectedResolution(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {isSetPackCreationMode ? (
        <NumberStepperField label="每个类型出图数" onChange={setSetPackPerTypeCount} required value={setPackPerTypeCount} />
      ) : null}

      {config.hideCountField ? null : (
        <CountField label="出图数量" onChange={setSelectedCount} options={activeMode.countOptions} required value={selectedCount} />
      )}
    </div>
  );
}

function MoreTitleWorkbench({
  task,
  onApplyCandidate,
  onFinalTitleChange,
  onCopyFinalTitles,
  onExportCsv
}: {
  task?: TaskRecord | null;
  onApplyCandidate: (taskId: string, rowId: string, candidateIndex: number) => void;
  onFinalTitleChange: (taskId: string, rowId: string, value: string) => void;
  onCopyFinalTitles: (taskId: string) => void;
  onExportCsv: (taskId: string) => void;
}) {
  const rows = parseMoreTitleGeneratedRows(task?.snapshot.advancedSelections.moreTitleGeneratedRows);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  if (!task) {
    return (
      <div className="ck-results-empty ck-more-title-empty">
        <div className="ck-results-empty-title">还没有标题任务</div>
        <div className="ck-results-empty-copy">请先在左侧补充商品信息并生成标题方案</div>
      </div>
    );
  }

  return (
    <div className="ck-more-title-workbench">
      <div className="ck-more-title-workbench-head">
        <div>
          <strong>批量标题结果</strong>
          <p>
            {task.snapshot.advancedSelections.platform ?? "目标平台"} / {task.snapshot.advancedSelections.region ?? "目标地区"} /{" "}
            {task.snapshot.advancedSelections.language ?? "目标语言"}
          </p>
        </div>
        <div className="ck-more-title-workbench-actions">
          <button onClick={() => onCopyFinalTitles(task.taskId)} type="button">
            复制已选标题
          </button>
          <button onClick={() => onExportCsv(task.taskId)} type="button">
            导出 CSV
          </button>
        </div>
      </div>

      {task.status !== "completed" ? <div className="ck-more-title-status-banner">标题方案生成中，候选结果即将完成。</div> : null}

      <div className="ck-more-title-result-list">
        {rows.map((row, index) => (
          <article className="ck-more-title-result-card" key={row.id}>
            <div className="ck-more-title-result-head">
              <div>
                <span>商品 {index + 1}</span>
                <strong>{row.productName || row.originalTitle || "未命名商品"}</strong>
              </div>
              <em>{row.brand || row.category || "待补充品牌/类目"}</em>
            </div>
            <div className="ck-more-title-result-meta">
              {row.originalTitle ? <span>原始标题：{row.originalTitle}</span> : null}
              {row.sellingPoints ? <span>卖点：{row.sellingPoints}</span> : null}
            </div>
            <div className="ck-more-title-candidate-grid">
              {row.candidates.map((candidate, candidateIndex) => (
                <button
                  className={`ck-more-title-candidate${candidateIndex === row.selectedCandidateIndex ? " active" : ""}`}
                  key={`${row.id}-${candidate.label}`}
                  onClick={() => onApplyCandidate(task.taskId, row.id, candidateIndex)}
                  type="button"
                >
                  <div className="ck-more-title-candidate-top">
                    <strong>{candidate.label}</strong>
                    <span>{candidate.charCount}字</span>
                  </div>
                  <p>{candidate.title}</p>
                  <div className="ck-more-title-candidate-foot">
                    <span>{candidate.risk}</span>
                    <em>{candidate.keywords.join(" / ") || "待补充关键词"}</em>
                  </div>
                </button>
              ))}
            </div>
            <div className="ck-more-title-selected-block">
              <div className="ck-more-title-selected-head">
                <strong>已选标题</strong>
                <button
                  onClick={() => setEditingRowId((current) => (current === row.id ? null : row.id))}
                  type="button"
                >
                  {editingRowId === row.id ? "收起微调" : "微调"}
                </button>
              </div>
              <p>{row.finalTitle}</p>
            </div>
            {editingRowId === row.id ? (
              <UnifiedTextareaField
                formBlockClassName="ck-form-block ck-more-title-final-field"
                label="微调标题"
                maxLength={260}
                onChange={(value) => onFinalTitleChange(task.taskId, row.id, value)}
                placeholder="可手动微调已选标题"
                value={row.finalTitle}
              />
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function AdvancedSettingsSection({
  config,
  onSelectionChange,
  onSelectionMapChange,
  onAiAssist,
  selectedValues
}: {
  config: AdvancedSettingsConfig;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onAiAssist?: (values: string[]) => Promise<AdvancedAiAssistResult | null | void>;
  selectedValues?: AdvancedSelectionMap;
}) {
  const platformOptions = useMemo(
    () => platformMockData.filter((item) => config.platformIds.includes(item.id)),
    [config.platformIds]
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fieldButtonRefs = useRef<Record<string, HTMLElement | null>>({});
  const fieldDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [selectedPlatformId, setSelectedPlatformId] = useState("");
  const [openFieldKey, setOpenFieldKey] = useState<string | null>(null);
  const [openDirection, setOpenDirection] = useState<"up" | "down">("down");
  const [isAiAssistLoading, setIsAiAssistLoading] = useState(false);
  const skipSelectedValuesSyncRef = useRef(false);
  const pendingSelectedValuesSignatureRef = useRef("");
  const lastSelectedValuesSignatureRef = useRef("");
  const lastSelectionValuesEmitSignatureRef = useRef("");
  const lastSelectionMapEmitSignatureRef = useRef("");

  const selectedPlatform = platformOptions.find((item) => item.id === selectedPlatformId);
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const selectedRegion = selectedPlatform?.regions.find((item) => item.id === selectedRegionId);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedExtraValues, setSelectedExtraValues] = useState<Record<string, string>>(
    () => Object.fromEntries((config.extraSelects ?? []).map((item) => [item.key, item.defaultValue ?? ""]))
  );
  const [conditionalDetailValue, setConditionalDetailValue] = useState("");
  const configSelectionSignature = useMemo(
    () =>
      JSON.stringify({
        fields: config.fields,
        extraSelects: (config.extraSelects ?? []).map((item) => ({
          key: item.key,
          mode: item.mode,
          options: item.options ?? item.richOptions?.map((option) => option.value) ?? []
        })),
        conditionalDetailFieldKey: config.conditionalDetailField?.triggerFieldKey ?? ""
      }),
    [config.conditionalDetailField?.triggerFieldKey, config.extraSelects, config.fields]
  );

  const buildSelectedValuesSignature = (values: AdvancedSelectionMap | undefined) =>
    JSON.stringify({
      platform: values?.platform ?? "",
      region: values?.region ?? "",
      language: values?.language ?? "",
      platformRuleDetail: values?.platformRuleDetail ?? "",
      extras: (config.extraSelects ?? []).reduce<Record<string, string>>((accumulator, item) => {
        accumulator[item.key] = typeof values?.[item.key] === "string" ? values[item.key] : item.defaultValue ?? "";
        return accumulator;
      }, {})
    });

  useEffect(() => {
    if (selectedPlatformId && !platformOptions.some((item) => item.id === selectedPlatformId)) {
      setSelectedPlatformId("");
    }
  }, [platformOptions, selectedPlatformId]);

  useEffect(() => {
    setSelectedPlatformId("");
    setSelectedRegionId("");
    setSelectedLanguage("");
    setSelectedExtraValues(Object.fromEntries((config.extraSelects ?? []).map((item) => [item.key, item.defaultValue ?? ""])));
    setConditionalDetailValue("");
  }, [configSelectionSignature, config.extraSelects]);

  useEffect(() => {
    const nextValues = dedupeStrings([
      config.fields.includes("platform") ? selectedPlatform?.label ?? "" : "",
      config.fields.includes("region") ? selectedRegion?.label ?? "" : "",
      config.fields.includes("language") ? selectedLanguage : "",
      ...(config.extraSelects ?? []).map((item) =>
        item.mode === "multi-select" ? parseMultiSelectValue(selectedExtraValues[item.key]).join("、") : selectedExtraValues[item.key] ?? ""
      ),
      conditionalDetailValue
    ]).filter(Boolean);

    const nextValuesSignature = JSON.stringify(nextValues);
    if (nextValuesSignature === lastSelectionValuesEmitSignatureRef.current) {
      return;
    }
    lastSelectionValuesEmitSignatureRef.current = nextValuesSignature;
    onSelectionChange?.(nextValues);
  }, [conditionalDetailValue, config.extraSelects, config.fields, onSelectionChange, selectedExtraValues, selectedLanguage, selectedPlatform, selectedRegion]);

  useEffect(() => {
    const nextSelectionMap: AdvancedSelectionMap = {};
    if (config.fields.includes("platform") && selectedPlatform?.label) nextSelectionMap.platform = selectedPlatform.label;
    if (config.fields.includes("region") && selectedRegion?.label) nextSelectionMap.region = selectedRegion.label;
    if (config.fields.includes("language") && selectedLanguage) nextSelectionMap.language = selectedLanguage;
    (config.extraSelects ?? []).forEach((item) => {
      const value = selectedExtraValues[item.key];
      if (value) nextSelectionMap[item.key] = value;
    });
    if (conditionalDetailValue) nextSelectionMap.platformRuleDetail = conditionalDetailValue;
    const nextSelectionMapSignature = JSON.stringify(nextSelectionMap);
    if (nextSelectionMapSignature === lastSelectionMapEmitSignatureRef.current) {
      return;
    }
    pendingSelectedValuesSignatureRef.current = buildSelectedValuesSignature(nextSelectionMap);
    lastSelectionMapEmitSignatureRef.current = nextSelectionMapSignature;
    onSelectionMapChange?.(nextSelectionMap);
  }, [conditionalDetailValue, config.extraSelects, config.fields, onSelectionMapChange, selectedExtraValues, selectedLanguage, selectedPlatform, selectedRegion]);

  useEffect(() => {
    if (!selectedValues) return;
    if (skipSelectedValuesSyncRef.current) {
      skipSelectedValuesSyncRef.current = false;
      return;
    }

    const nextSelectedValuesSignature = buildSelectedValuesSignature(selectedValues);

    if (pendingSelectedValuesSignatureRef.current) {
      if (nextSelectedValuesSignature !== pendingSelectedValuesSignatureRef.current) {
        return;
      }
      pendingSelectedValuesSignatureRef.current = "";
    }

    if (nextSelectedValuesSignature === lastSelectedValuesSignatureRef.current) {
      return;
    }

    lastSelectedValuesSignatureRef.current = nextSelectedValuesSignature;

    const nextPlatform = selectedValues.platform ? platformOptions.find((item) => item.label === selectedValues.platform) : null;
    const nextPlatformId = nextPlatform?.id ?? "";
    if (nextPlatformId !== selectedPlatformId) {
      setSelectedPlatformId(nextPlatformId);
    }

    const nextRegionId =
      selectedValues.region && nextPlatform
        ? nextPlatform.regions.find((item) => item.label === selectedValues.region)?.id ?? ""
        : "";
    if (nextRegionId !== selectedRegionId) {
      setSelectedRegionId(nextRegionId);
    }

    const nextLanguage = typeof selectedValues.language === "string" ? selectedValues.language : "";
    if (nextLanguage !== selectedLanguage) {
      setSelectedLanguage(nextLanguage);
    }

    const nextDetailValue = typeof selectedValues.platformRuleDetail === "string" ? selectedValues.platformRuleDetail : "";
    if (nextDetailValue !== conditionalDetailValue) {
      setConditionalDetailValue(nextDetailValue);
    }

    const nextExtraValues = Object.fromEntries(
      (config.extraSelects ?? []).map((item) => [
        item.key,
        typeof selectedValues[item.key] === "string" ? selectedValues[item.key] : item.defaultValue ?? ""
      ])
    );
    const hasExtraValueChanged = (config.extraSelects ?? []).some((item) => (selectedExtraValues[item.key] ?? "") !== (nextExtraValues[item.key] ?? ""));
    if (hasExtraValueChanged) {
      setSelectedExtraValues(nextExtraValues);
    }
  }, [
    conditionalDetailValue,
    config.extraSelects,
    platformOptions,
    selectedLanguage,
    selectedPlatformId,
    selectedRegionId,
    selectedExtraValues,
    selectedValues
  ]);

  const selectedSummaryValues = dedupeStrings([
    config.fields.includes("platform") ? selectedPlatform?.label ?? "" : "",
    config.fields.includes("region") ? selectedRegion?.label ?? "" : "",
    config.fields.includes("language") ? selectedLanguage : "",
    ...(config.extraSelects ?? []).map((item) =>
      item.mode === "multi-select" ? parseMultiSelectValue(selectedExtraValues[item.key]).join("、") : selectedExtraValues[item.key] ?? ""
    ),
    conditionalDetailValue
  ]).filter(Boolean);

  const shouldShowConditionalDetail = (() => {
    const fieldConfig = config.conditionalDetailField;
    if (!fieldConfig) return false;
    const triggerField = (config.extraSelects ?? []).find((item) => item.key === fieldConfig.triggerFieldKey);
    if (!triggerField) return false;
    const triggerValue = selectedExtraValues[fieldConfig.triggerFieldKey]?.trim() ?? "";
    if (!triggerValue) return false;
    if (fieldConfig.detailVisibleValues?.includes(triggerValue)) return true;
    return !(triggerField.options ?? []).includes(triggerValue);
  })();

  const applySelectionMapLocally = (values: AdvancedSelectionMap) => {
    skipSelectedValuesSyncRef.current = true;

    const nextPlatform = values.platform ? platformOptions.find((item) => item.label === values.platform) : null;
    setSelectedPlatformId(nextPlatform?.id ?? "");

    const nextRegionId =
      values.region && nextPlatform ? nextPlatform.regions.find((item) => item.label === values.region)?.id ?? "" : "";
    setSelectedRegionId(nextRegionId);

    setSelectedLanguage(typeof values.language === "string" ? values.language : "");
    setConditionalDetailValue(typeof values.platformRuleDetail === "string" ? values.platformRuleDetail : "");
    setSelectedExtraValues(
      Object.fromEntries(
        (config.extraSelects ?? []).map((item) => [item.key, typeof values[item.key] === "string" ? values[item.key] : item.defaultValue ?? ""])
      )
    );

    const nextSelectedValuesSignature = buildSelectedValuesSignature(values);
    pendingSelectedValuesSignatureRef.current = nextSelectedValuesSignature;
    lastSelectedValuesSignatureRef.current = nextSelectedValuesSignature;
    lastSelectionMapEmitSignatureRef.current = JSON.stringify(
      (() => {
        const nextSelectionMap: AdvancedSelectionMap = {};
        if (values.platform) nextSelectionMap.platform = values.platform;
        if (values.region) nextSelectionMap.region = values.region;
        if (values.language) nextSelectionMap.language = values.language;
        (config.extraSelects ?? []).forEach((item) => {
          const value = values[item.key];
          if (typeof value === "string" && value) nextSelectionMap[item.key] = value;
        });
        if (values.platformRuleDetail) nextSelectionMap.platformRuleDetail = values.platformRuleDetail;
        return nextSelectionMap;
      })()
    );
    lastSelectionValuesEmitSignatureRef.current = JSON.stringify(
      dedupeStrings([
        values.platform ?? "",
        values.region ?? "",
        values.language ?? "",
        ...(config.extraSelects ?? []).map((item) =>
          item.mode === "multi-select"
            ? parseMultiSelectValue(typeof values[item.key] === "string" ? values[item.key] : item.defaultValue ?? "").join("、")
            : typeof values[item.key] === "string"
              ? values[item.key]
              : item.defaultValue ?? ""
        ),
        values.platformRuleDetail ?? ""
      ]).filter(Boolean)
    );
  };

  useEffect(() => {
    if (!openFieldKey) return;

    const handlePointerDown = (event: PointerEvent) => {
      const targetNode = event.target as Node;
      const activeButton = fieldButtonRefs.current[openFieldKey];
      const activeDropdown = fieldDropdownRefs.current[openFieldKey];
      const clickedInsideActiveField =
        activeButton?.contains(targetNode) || activeDropdown?.contains(targetNode);

      if (!clickedInsideActiveField) {
        setOpenFieldKey(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openFieldKey]);

  const fields: Array<{
    key: string;
    label: string;
    value: string;
    options: string[];
    richOptions?: RichSelectOption[];
    mode?: "select" | "input-select" | "rich-select" | "multi-select";
    onSelect: (value: string) => void;
  }> = [];

  if (config.fields.includes("platform")) {
    fields.push({
      key: "platform",
      label: "电商平台",
      value: selectedPlatform?.label ?? "",
      options: platformOptions.map((item) => item.label),
      onSelect: (value) => {
        skipSelectedValuesSyncRef.current = true;
        const nextPlatform = platformOptions.find((item) => item.label === value);
        setSelectedPlatformId(nextPlatform?.id ?? "");
        setSelectedRegionId("");
        setSelectedLanguage("");
      }
    });
  }

  if (config.fields.includes("region")) {
    fields.push({
      key: "region",
      label: "地区",
      value: selectedRegion?.label ?? "",
      options: selectedPlatform?.regions.map((item) => item.label) ?? [],
      onSelect: (value) => {
        skipSelectedValuesSyncRef.current = true;
        const nextRegion = selectedPlatform?.regions.find((item) => item.label === value);
        setSelectedRegionId(nextRegion?.id ?? "");
        setSelectedLanguage("");
      }
    });
  }

  if (config.fields.includes("language")) {
    fields.push({
      key: "language",
      label: "语言",
      value: selectedLanguage,
      options: selectedRegion?.languages ?? [],
      onSelect: (value) => {
        skipSelectedValuesSyncRef.current = true;
        setSelectedLanguage(value);
      }
    });
  }

  (config.extraSelects ?? []).forEach((field) => {
    fields.push({
      key: field.key,
      label: field.label,
      mode: field.mode,
      value: selectedExtraValues[field.key] ?? "",
      options: field.options ?? field.richOptions?.map((item) => item.value) ?? [],
      richOptions: field.richOptions,
      onSelect: (value) => {
        skipSelectedValuesSyncRef.current = true;
        if (field.mode === "multi-select") {
          setSelectedExtraValues((current) => {
            const currentValues = parseMultiSelectValue(current[field.key]);
            const nextValues = currentValues.includes(value)
              ? currentValues.filter((item) => item !== value)
              : [...currentValues, value];
            return {
              ...current,
              [field.key]: serializeMultiSelectValue(nextValues)
            };
          });
        } else {
          setSelectedExtraValues((current) => ({
            ...current,
            [field.key]: value
          }));
        }
        if (config.conditionalDetailField?.triggerFieldKey === field.key) {
          const presetDetail = config.conditionalDetailField.detailPresetByValue?.[value] ?? "";
          setConditionalDetailValue(presetDetail);
        }
      }
    });
  });

  const openFieldDropdown = (fieldKey: string) => {
    const buttonRect = fieldButtonRefs.current[fieldKey]?.getBoundingClientRect();
    if (buttonRect) {
      const estimatedMenuHeight = 220;
      const scrollContainer = containerRef.current?.closest(".ck-panel-scroll");
      const scrollRect = scrollContainer?.getBoundingClientRect();
      const lowerBoundary = scrollRect ? Math.min(window.innerHeight, scrollRect.bottom) : window.innerHeight;
      const upperBoundary = scrollRect ? Math.max(0, scrollRect.top) : 0;
      const spaceBelow = lowerBoundary - buttonRect.bottom;
      const spaceAbove = buttonRect.top - upperBoundary;
      setOpenDirection(spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow ? "up" : "down");
    } else {
      setOpenDirection("down");
    }

    setOpenFieldKey(fieldKey);
  };

  const toggleFieldDropdown = (fieldKey: string) => {
    if (openFieldKey === fieldKey) {
      setOpenFieldKey(null);
      return;
    }
    openFieldDropdown(fieldKey);
  };

  return (
    <div className="ck-form-block" ref={containerRef}>
      <div className="ck-advanced-settings-head">
        <FieldTitle label={config.title} optional />
        {config.showAiAssist !== false ? (
          <button
            className="ck-advanced-settings-ai"
            disabled={isAiAssistLoading}
            onClick={async () => {
              if (!onAiAssist) return;
              skipSelectedValuesSyncRef.current = false;
              setIsAiAssistLoading(true);
              try {
                const assistResult = await onAiAssist(selectedSummaryValues);
                if (assistResult?.fieldValues) {
                  applySelectionMapLocally(assistResult.fieldValues);
                }
              } finally {
                setIsAiAssistLoading(false);
              }
            }}
            type="button"
          >
            {isAiAssistLoading ? "帮写中..." : "AI帮写"}
          </button>
        ) : null}
      </div>
      <div className="ck-platform-grid">
        {fields.map((field) => (
          <div className={`ck-platform-item${field.mode === "multi-select" ? " ck-platform-item-stacked" : ""}`} key={field.key}>
            <div className="ck-platform-item-label">{field.label}</div>
            <div className="ck-platform-inline-select">
              {field.mode === "multi-select" ? (
                <div
                  className="ck-choice-row ck-choice-row-retouch ck-choice-row-retouch-primary ck-more-title-mode-row"
                  style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(3, field.options.length))}, minmax(0, 1fr))` }}
                >
                  {field.options.map((option) => {
                    const selectedValues = parseMultiSelectValue(field.value);
                    const active = selectedValues.includes(option);
                    return (
                      <button
                        className={`ck-mode-card ck-mode-card-primary${active ? " active" : ""}`}
                        key={option}
                        onClick={() => field.onSelect(option)}
                        type="button"
                      >
                        <div className="ck-mode-card-head">
                          <strong>{option}</strong>
                          <span className={`ck-check${active ? " active" : ""}`} />
                        </div>
                        <p>{moreTitleStyleDescriptionMap[option] ?? ""}</p>
                      </button>
                    );
                  })}
                </div>
              ) : field.mode === "rich-select" && field.richOptions?.length ? (
                <RichImageSelectInlineField
                  onChange={field.onSelect}
                  options={field.richOptions}
                  placeholder="请选择场景"
                  value={field.value}
                />
              ) : field.mode === "select" ? (
                <SelectField
                  fullWidth
                  hideLabel
                  label={field.label}
                  onChange={field.onSelect}
                  options={field.options}
                  placeholder="请选择"
                  value={field.value}
                />
              ) : (
                <div className="ck-select-dropdown full">
                  {field.mode === "input-select" ? (
                    <div
                      className={`ck-input-select${field.value ? " has-value" : ""}${openFieldKey === field.key ? " active" : ""}`}
                      onClick={() => {
                        if (openFieldKey !== field.key) openFieldDropdown(field.key);
                      }}
                      ref={(node) => {
                        fieldButtonRefs.current[field.key] = node;
                      }}
                    >
                      <input
                        onChange={(event) => field.onSelect(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        onFocus={() => {
                          if (openFieldKey !== field.key) openFieldDropdown(field.key);
                        }}
                        placeholder="请选择或直接输入"
                        value={field.value}
                      />
                      {field.value ? (
                        <button
                          className="ck-input-select-clear"
                          onClick={(event) => {
                            event.stopPropagation();
                            field.onSelect("");
                            setOpenFieldKey(null);
                          }}
                          type="button"
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      className={`ck-select full${field.value ? "" : " placeholder"}`}
                      onClick={() => toggleFieldDropdown(field.key)}
                      ref={(node) => {
                        fieldButtonRefs.current[field.key] = node;
                      }}
                      type="button"
                    >
                      {field.value || "请选择"}
                      <span>⌄</span>
                    </button>
                  )}
                  {openFieldKey === field.key ? (
                    <div
                      className={`ck-select-dropdown-menu full${openDirection === "up" ? " up" : ""}`}
                      ref={(node) => {
                        fieldDropdownRefs.current[field.key] = node;
                      }}
                    >
                      {field.options.map((option) => (
                        <button
                          className={option === field.value ? "active" : ""}
                          key={option}
                          onClick={() => {
                            field.onSelect(option);
                            setOpenFieldKey(null);
                          }}
                          type="button"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {shouldShowConditionalDetail && config.conditionalDetailField ? (
        <UnifiedTextareaField
          label={config.conditionalDetailField.label}
          maxLength={500}
          onChange={(value) => {
            skipSelectedValuesSyncRef.current = true;
            setConditionalDetailValue(value);
          }}
          optional
          placeholder={config.conditionalDetailField.placeholder}
          style={{ marginTop: 12 }}
          value={conditionalDetailValue}
        />
      ) : null}
    </div>
  );
}

function SetPackStrategySection({
  selectedValues,
  onSelectionChange,
  onSelectionMapChange
}: {
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
}) {
  const platformOptions = useMemo(() => platformMockData.filter((item) => setPackPlatformIds.includes(item.id)), []);
  const defaultPlatform = platformOptions[0];
  const skipSelectedValuesSyncRef = useRef(false);
  const lastSelectedValuesSignatureRef = useRef("");
  const [platformId, setPlatformId] = useState(selectedValues?.platform ? platformOptions.find((item) => item.label === selectedValues.platform)?.id ?? defaultPlatform?.id ?? "" : defaultPlatform?.id ?? "");
  const selectedPlatform = platformOptions.find((item) => item.id === platformId) ?? defaultPlatform;
  const [targetMarket, setTargetMarket] = useState(selectedValues?.targetMarket ?? selectedValues?.region ?? "北美");
  const [copyLanguage, setCopyLanguage] = useState(selectedValues?.copyLanguage ?? selectedValues?.language ?? "英文");
  const [visualStyle, setVisualStyle] = useState(selectedValues?.setPackVisualStyle ?? setPackVisualStyleOptions[0] ?? "");

  useEffect(() => {
    if (!selectedValues) return;
    if (skipSelectedValuesSyncRef.current) {
      skipSelectedValuesSyncRef.current = false;
      return;
    }

    const nextSignature = JSON.stringify({
      platform: selectedValues.platform ?? "",
      targetMarket: selectedValues.targetMarket ?? selectedValues.region ?? "北美",
      copyLanguage: selectedValues.copyLanguage ?? selectedValues.language ?? "英文",
      visualStyle: selectedValues.setPackVisualStyle ?? setPackVisualStyleOptions[0] ?? ""
    });

    if (nextSignature === lastSelectedValuesSignatureRef.current) {
      return;
    }
    lastSelectedValuesSignatureRef.current = nextSignature;

    const nextPlatform = selectedValues.platform ? platformOptions.find((item) => item.label === selectedValues.platform) : null;
    const nextPlatformId = nextPlatform?.id ?? defaultPlatform?.id ?? "";
    if (nextPlatformId !== platformId) {
      setPlatformId(nextPlatformId);
    }

    const nextTargetMarket = selectedValues.targetMarket ?? selectedValues.region ?? "北美";
    if (nextTargetMarket !== targetMarket) {
      setTargetMarket(nextTargetMarket);
    }

    const nextCopyLanguage = selectedValues.copyLanguage ?? selectedValues.language ?? "英文";
    if (nextCopyLanguage !== copyLanguage) {
      setCopyLanguage(nextCopyLanguage);
    }

    const nextVisualStyle = selectedValues.setPackVisualStyle ?? setPackVisualStyleOptions[0] ?? "";
    if (nextVisualStyle !== visualStyle) {
      setVisualStyle(nextVisualStyle);
    }
  }, [copyLanguage, defaultPlatform?.id, platformId, platformOptions, selectedValues, targetMarket, visualStyle]);

  useEffect(() => {
    if (!selectedPlatform) return;
    const nextSelectionMap = {
      platform: selectedPlatform.label,
      region: targetMarket,
      targetMarket,
      language: copyLanguage,
      copyLanguage,
      setPackVisualStyle: visualStyle
    };
    skipSelectedValuesSyncRef.current = true;
    lastSelectedValuesSignatureRef.current = JSON.stringify({
      platform: nextSelectionMap.platform,
      targetMarket: nextSelectionMap.targetMarket,
      copyLanguage: nextSelectionMap.copyLanguage,
      visualStyle: nextSelectionMap.setPackVisualStyle
    });
    onSelectionMapChange?.({
      ...nextSelectionMap
    });
    onSelectionChange?.([selectedPlatform.label, targetMarket, copyLanguage, visualStyle].filter(Boolean));
  }, [copyLanguage, onSelectionChange, onSelectionMapChange, selectedPlatform, targetMarket, visualStyle]);

  return (
    <div className="ck-form-block ck-set-pack-market-block">
      <FieldTitle label="市场配置" required />
      <div className="ck-set-pack-strategy-grid ck-set-pack-strategy-grid-2x2">
        <SelectField
          fullWidth
          hideLabel
          label="目标平台"
          onChange={(value) => {
            const nextPlatform = platformOptions.find((item) => item.label === value);
            if (!nextPlatform) return;
            skipSelectedValuesSyncRef.current = true;
            setPlatformId(nextPlatform.id);
          }}
          options={platformOptions.map((item) => item.label)}
          required
          value={selectedPlatform?.label}
        />
        <SelectField
          fullWidth
          hideLabel
          label="目标市场"
          onChange={(value) => {
            skipSelectedValuesSyncRef.current = true;
            setTargetMarket(value);
          }}
          options={setPackTargetMarketOptions}
          required
          value={targetMarket}
        />
        <SelectField
          fullWidth
          hideLabel
          label="文案语种"
          onChange={(value) => {
            skipSelectedValuesSyncRef.current = true;
            setCopyLanguage(value);
          }}
          options={copyLanguageInputOptions}
          required
          value={copyLanguage}
        />
        <SelectField
          fullWidth
          hideLabel
          label="视觉风格"
          onChange={(value) => {
            skipSelectedValuesSyncRef.current = true;
            setVisualStyle(value);
          }}
          options={setPackVisualStyleOptions}
          value={visualStyle}
        />
      </div>
    </div>
  );
}

function SetPackSellingPointsSection({
  uploads,
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onToast
}: {
  uploads: UploadItem[];
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onToast: (message: string, tone?: "warning") => void;
}) {
  const [detailText, setDetailText] = useState(
    selectedValues?.setPackSellingPoints ??
      formatSetPackDetailText({
        productName: selectedValues?.setPackProductName ?? "",
        sellingPoints: selectedValues?.setPackSellingPoints ?? "",
        audience: selectedValues?.setPackAudience ?? "",
        scenario: selectedValues?.setPackScenario ?? "",
        parameters: selectedValues?.setPackParameters ?? ""
      })
  );
  const [detailDraft, setDetailDraft] = useState<SetPackSellingPointDraft>({
    productName: selectedValues?.setPackProductName ?? "",
    sellingPoints: selectedValues?.setPackSellingPoints ?? "",
    audience: selectedValues?.setPackAudience ?? "",
    scenario: selectedValues?.setPackScenario ?? "",
    parameters: selectedValues?.setPackParameters ?? ""
  });
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<SetPackSellingPointDraft | null>(null);
  const [draftText, setDraftText] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const lastLocalSyncSignatureRef = useRef("");
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  useEffect(() => {
    const nextDraft = {
      productName: selectedValues?.setPackProductName ?? "",
      sellingPoints: selectedValues?.setPackSellingPoints ?? "",
      audience: selectedValues?.setPackAudience ?? "",
      scenario: selectedValues?.setPackScenario ?? "",
      parameters: selectedValues?.setPackParameters ?? ""
    };
    const nextText = selectedValues?.setPackSellingPoints ?? formatSetPackDetailText(nextDraft);
    const nextSignature = JSON.stringify({
      ...nextDraft,
      detailText: nextText
    });

    if (nextSignature === lastLocalSyncSignatureRef.current) {
      return;
    }

    setDetailDraft((current) => {
      const currentSignature = JSON.stringify(current);
      const draftSignature = JSON.stringify(nextDraft);
      return currentSignature === draftSignature ? current : nextDraft;
    });
    setDetailText((current) => (current === nextText ? current : nextText));
  }, [
    selectedValues?.setPackAudience,
    selectedValues?.setPackParameters,
    selectedValues?.setPackProductName,
    selectedValues?.setPackScenario,
    selectedValues?.setPackSellingPoints
  ]);

  useEffect(() => {
    lastLocalSyncSignatureRef.current = JSON.stringify({
      productName: detailDraft.productName,
      sellingPoints: detailText,
      audience: detailDraft.audience,
      scenario: detailDraft.scenario,
      parameters: detailDraft.parameters,
      detailText
    });

    onSelectionMapChange?.({
      setPackProductName: detailDraft.productName,
      setPackSellingPoints: detailText,
      setPackAudience: detailDraft.audience,
      setPackScenario: detailDraft.scenario,
      setPackParameters: detailDraft.parameters
    });
    onSelectionChange?.(
      [detailDraft.productName, detailText, detailDraft.audience, detailDraft.scenario, detailDraft.parameters].filter(Boolean)
    );
  }, [detailDraft, detailText, onSelectionChange, onSelectionMapChange]);

  useEffect(() => {
    if (!popoverOpen) return;

    const updatePopoverPosition = () => {
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      if (!buttonRect) return;

      const panelElement = buttonRef.current?.closest(".ck-panel");
      const footerElement = panelElement?.querySelector(".ck-panel-footer") as HTMLElement | null;
      const panelRect = panelElement?.getBoundingClientRect();
      const footerRect = footerElement?.getBoundingClientRect();
      const popoverWidth = 280;
      const popoverHeight = 336;
      const gap = 12;
      const viewportPadding = 16;
      const leftBoundary = panelRect ? Math.max(viewportPadding, panelRect.right + gap) : viewportPadding;
      const topBoundary = panelRect ? Math.max(viewportPadding, panelRect.top) : viewportPadding;
      const bottomBoundary = footerRect ? Math.max(topBoundary, footerRect.top - gap) : window.innerHeight - viewportPadding;
      const availableRight = window.innerWidth - buttonRect.right;
      const availableLeft = buttonRect.left;
      const availableBelow = bottomBoundary - buttonRect.bottom;
      const availableAbove = buttonRect.top - topBoundary;
      const prefersRight = availableRight >= popoverWidth + gap;
      const prefersLeft = !prefersRight && availableLeft >= popoverWidth + gap;
      const nextLeft =
        prefersRight
          ? buttonRect.right + gap
          : prefersLeft
            ? buttonRect.left - popoverWidth - gap
            : Math.max(leftBoundary, Math.min(buttonRect.left, window.innerWidth - popoverWidth - viewportPadding));
      const nextTop =
        availableBelow >= popoverHeight + gap
          ? buttonRect.top
          : availableAbove >= popoverHeight + gap
            ? buttonRect.bottom - popoverHeight
            : Math.max(topBoundary, Math.min(buttonRect.top - popoverHeight / 2, bottomBoundary - popoverHeight));

      setPopoverStyle({
        left: `${nextLeft}px`,
        top: `${nextTop}px`
      });
    };

    updatePopoverPosition();
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [draftText, isGenerating, popoverOpen]);

  useEffect(() => {
    if (!popoverOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [popoverOpen]);

  const handleGenerateAiDraft = async () => {
    if (!uploads.length) {
      onToast("请先上传商品图后再使用AI帮写", "warning");
      return;
    }
    setPopoverOpen(true);
    setIsGenerating(true);
    const nextDraft = buildSetPackSellingPointDraft(uploads, selectedValues?.platform ?? "", selectedValues?.language ?? "");
    window.setTimeout(() => {
      setDraft(nextDraft);
      setDraftText(formatSetPackDetailText(nextDraft));
      setIsGenerating(false);
    }, 320);
  };

  return (
    <>
      <UnifiedTextareaField
        formBlockClassName="ck-form-block ck-set-pack-selling-points"
        header={
          <div className="ck-advanced-settings-head">
            <FieldTitle label="商品卖点&要求" optional />
            <div className="ck-ai-polish" ref={containerRef}>
              <button className="ck-advanced-settings-ai" onClick={() => void handleGenerateAiDraft()} ref={buttonRef} type="button">
                AI帮写
              </button>
              {popoverOpen ? (
                <div className={`ck-ai-polish-popover${isGenerating ? " is-generating" : ""}`} style={popoverStyle}>
                  <div className="ck-ai-polish-popover-head">
                    <div>
                      <strong>AI帮写</strong>
                    </div>
                    <button className="ck-ai-polish-close" onClick={() => setPopoverOpen(false)} type="button">
                      ×
                    </button>
                  </div>
                  <div className="ck-ai-polish-popover-body">
                    {isGenerating ? (
                      <div className="ck-ai-polish-loading">
                        <div className="ck-ai-polish-loading-card" aria-hidden="true">
                          <div className="ck-ai-polish-loading-badge">AI</div>
                          <div className="ck-ai-polish-loading-lines">
                            <span className="short" />
                            <span />
                            <span className="medium" />
                          </div>
                        </div>
                        <strong>AI 深度思考中...</strong>
                        <p>正在根据商品图与平台信息生成更完整的卖点文案</p>
                      </div>
                    ) : (
                      <div className="ck-ai-polish-result">
                        <pre>{draftText || "点击重新帮写后可再次生成当前文案。"}</pre>
                      </div>
                    )}
                  </div>
                  {isGenerating ? (
                    <div className="ck-ai-polish-popover-actions loading">
                      <button className="loading-indicator" disabled type="button">
                        正在帮写
                      </button>
                    </div>
                  ) : (
                    <div className="ck-ai-polish-popover-actions">
                      <button className="secondary" disabled={isGenerating} onClick={() => void handleGenerateAiDraft()} type="button">
                        重新帮写
                      </button>
                      <button
                        disabled={isGenerating || !draft}
                        onClick={() => {
                          if (!draft) return;
                          setDetailDraft(draft);
                          setDetailText(draftText);
                          setPopoverOpen(false);
                        }}
                        type="button"
                      >
                        确认
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        }
        maxLength={2000}
        onChange={setDetailText}
        placeholder={
          "建议包含以下信息生成更精准：\n1.产品名称\n2.核心卖点\n3.适用人群\n4.期望场景\n5.具体参数"
        }
        value={detailText}
      />
    </>
  );
}

function SetPackStyleAnalysisSection({
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onToast
}: {
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onToast: (message: string, tone?: "warning") => void;
}) {
  const [styles, setStyles] = useState<SetPackStyleCard[]>(safeParseJson<SetPackStyleCard[]>(selectedValues?.setPackStyleCards, []) ?? []);
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>((selectedValues?.setPackSelectedStyleIds ?? "").split(",").filter(Boolean));
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setStyles(safeParseJson<SetPackStyleCard[]>(selectedValues?.setPackStyleCards, []) ?? []);
    setSelectedStyleIds((selectedValues?.setPackSelectedStyleIds ?? "").split(",").filter(Boolean));
  }, [selectedValues?.setPackSelectedStyleIds, selectedValues?.setPackStyleCards]);

  useEffect(() => {
    const selectedCards = styles.filter((item) => selectedStyleIds.includes(item.id));
    onSelectionMapChange?.({
      setPackStyleCards: JSON.stringify(styles),
      setPackSelectedStyleIds: selectedStyleIds.join(","),
      setPackSelectedStyleNames: selectedCards.map((item) => item.name).join(" / ")
    });
    onSelectionChange?.(selectedCards.map((item) => item.name));
  }, [onSelectionChange, onSelectionMapChange, selectedStyleIds, styles]);

  const handleAnalyze = () => {
    if (!selectedValues?.setPackProductName && !selectedValues?.setPackSellingPoints) {
      onToast("请先填写商品信息或使用 AI 帮写后再分析风格", "warning");
      return;
    }
    setIsAnalyzing(true);
    window.setTimeout(() => {
      const nextStyles = buildSetPackStyleRecommendations(selectedValues ?? {});
      setStyles(nextStyles);
      setSelectedStyleIds(nextStyles[0]?.id ? [nextStyles[0].id] : []);
      setIsAnalyzing(false);
    }, 420);
  };

  return (
    <div className="ck-form-block">
      <div className="ck-advanced-settings-head">
        <FieldTitle label="爆款风格发现" optional />
        <button className="ck-advanced-settings-ai" onClick={handleAnalyze} type="button">
          {isAnalyzing ? "分析中..." : "开始分析"}
        </button>
      </div>
      {styles.length ? (
        <div className="ck-set-pack-style-grid">
          {styles.map((item) => {
            const isActive = selectedStyleIds.includes(item.id);
            return (
              <button
                className={`ck-set-pack-style-card${isActive ? " active" : ""}`}
                key={item.id}
                onClick={() =>
                  setSelectedStyleIds((current) =>
                    current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
                  )
                }
                type="button"
              >
                <div className="ck-set-pack-style-card-head">
                  <strong>{item.name}</strong>
                  <span>{isActive ? "已选" : "可选"}</span>
                </div>
                <p>{item.description}</p>
                <div className="ck-set-pack-style-swatches">
                  {item.colors.map((color) => (
                    <span key={color} style={{ background: color }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="ck-set-pack-style-empty">
          <strong>还没有风格方案</strong>
          <span>点击“开始分析”后，将结合平台、卖点和商品特征推荐 4 组以上风格。</span>
        </div>
      )}
    </div>
  );
}

function SetPackTypeSection({
  toolKey,
  selectedValues,
  onSelectionChange,
  onSelectionMapChange,
  onToast,
  perTypeCount,
  globalRatio,
  uploads
}: {
  toolKey: string;
  selectedValues?: AdvancedSelectionMap;
  onSelectionChange?: (values: string[]) => void;
  onSelectionMapChange?: (values: AdvancedSelectionMap) => void;
  onToast: (message: string, tone?: "warning") => void;
  perTypeCount: number;
  globalRatio: string;
  uploads: UploadItem[];
}) {
  const isAplusTool = toolKey === "set-aplus";
  const moduleLibrary = isAplusTool ? aplusModuleLibrary : setPackTypeLibrary;
  const selectionLimit = isAplusTool ? aplusModuleLibrary.length : SET_PACK_TYPE_LIMIT;
  const defaultAplusTypes = useMemo(
    () => aplusModuleLibrary.slice(0, 5).map((item) => createSetPackTypeItem(item, selectedValues ?? {}, { count: perTypeCount, ratio: globalRatio || item.defaultRatio })),
    [globalRatio, perTypeCount, selectedValues]
  );
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<SetPackTypeItem[]>(() => {
    const restoredTypes = getSetPackSelectedTypes(selectedValues ?? {}).map((item) =>
      syncSetPackTypeItemWithGlobalSettings({ ...item, count: item.count ?? perTypeCount }, globalRatio, perTypeCount)
    );
    if (restoredTypes.length) return restoredTypes;
    return isAplusTool ? defaultAplusTypes : [];
  });
  const [savedTemplates, setSavedTemplates] = useState<SetPackTypeSavedTemplate[]>(
    safeParseJson<SetPackTypeSavedTemplate[]>(selectedValues?.setPackSavedTypeTemplates, []) ?? []
  );
  const [modalMode, setModalMode] = useState<"ai" | "manual" | "edit" | "save-template" | null>(null);
  const [activeTab, setActiveTab] = useState<"recommended" | "custom" | "template">("recommended");
  const [draftTypes, setDraftTypes] = useState<SetPackTypeItem[]>([]);
  const [thoughtNotes, setThoughtNotes] = useState("");
  const [thinkingText, setThinkingText] = useState(buildSetPackTypeThinking(selectedValues ?? {}, "", uploads.length));
  const [displayThinkingText, setDisplayThinkingText] = useState("");
  const [analysisPreview, setAnalysisPreview] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiThoughtCollapsed, setAiThoughtCollapsed] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState("");
  const [pendingDeleteTypeId, setPendingDeleteTypeId] = useState("");
  const [drawerStyle, setDrawerStyle] = useState<CSSProperties>({});
  const [collapsed, setCollapsed] = useState(false);
  const drawerStyleRef = useRef<CSSProperties>({});
  const lastSelectedTypesSyncRef = useRef("");
  const lastSavedTemplatesSyncRef = useRef("");
  const lastGlobalSettingsSyncRef = useRef("");
  const [templateDraftName, setTemplateDraftName] = useState("未命名组图模板");
  const [customDraft, setCustomDraft] = useState<SetPackTypeItem>({
    id: "custom-draft",
    category: "",
    name: "",
    description: "",
    tag: "自定义",
    prompt: "",
    ratio: globalRatio || "1:1",
    resolution: "1K",
    count: perTypeCount
  });
  const customTypeLibrary = useMemo(() => {
    const dynamicCustomTypes = selectedTypes.filter((item) => item.tag === "自定义");
    const merged = [
      ...dynamicCustomTypes,
      ...setPackCustomTypePresets.map((item) => ({ ...item, ratio: globalRatio || item.ratio, count: perTypeCount }))
    ];
    return merged.filter((item, index, array) => array.findIndex((candidate) => candidate.category === item.category) === index);
  }, [globalRatio, perTypeCount, selectedTypes]);
  const templateLibrary = useMemo(() => {
    const presetTemplates = buildPresetSetPackTemplateLibrary(selectedValues ?? {}, perTypeCount);
    const merged = [...savedTemplates, ...presetTemplates];
    return merged.filter((item, index, array) => array.findIndex((candidate) => candidate.name === item.name) === index);
  }, [perTypeCount, savedTemplates, selectedValues]);
  const productName = selectedValues?.setPackProductName?.trim() || "当前商品";
  const productSellingPoints = splitMultilineValues(selectedValues?.setPackSellingPoints).slice(0, 3);
  const targetMarket = selectedValues?.targetMarket || selectedValues?.region || "";
  const copyLanguage = selectedValues?.copyLanguage || selectedValues?.language || "";
  const shouldShowThinkingPanel = isAnalyzing || Boolean(analysisPreview);

  useEffect(() => {
    const nextSelectedTypes = getSetPackSelectedTypes(selectedValues ?? {}).map((item) =>
      syncSetPackTypeItemWithGlobalSettings({ ...item, count: item.count ?? perTypeCount }, globalRatio, perTypeCount)
    );
    const nextSelectedTypesKey = JSON.stringify(nextSelectedTypes);
    if (!nextSelectedTypes.length && isAplusTool) {
      const defaultTypesKey = JSON.stringify(defaultAplusTypes);
      if (defaultTypesKey !== lastSelectedTypesSyncRef.current) {
        lastSelectedTypesSyncRef.current = defaultTypesKey;
        setSelectedTypes(defaultAplusTypes);
      }
    } else if (nextSelectedTypesKey !== lastSelectedTypesSyncRef.current) {
      lastSelectedTypesSyncRef.current = nextSelectedTypesKey;
      setSelectedTypes(nextSelectedTypes);
    }

    const nextSavedTemplates = (safeParseJson<SetPackTypeSavedTemplate[]>(selectedValues?.setPackSavedTypeTemplates, []) ?? []).map((template) => ({
      ...template,
      types: template.types.map((item) => ({ ...item, count: item.count ?? perTypeCount }))
    }));
    const nextSavedTemplatesKey = JSON.stringify(nextSavedTemplates);
    if (nextSavedTemplatesKey !== lastSavedTemplatesSyncRef.current) {
      lastSavedTemplatesSyncRef.current = nextSavedTemplatesKey;
      setSavedTemplates(nextSavedTemplates);
    }
  }, [defaultAplusTypes, globalRatio, isAplusTool, perTypeCount, selectedValues]);

  useEffect(() => {
    setThinkingText(buildSetPackTypeThinking(selectedValues ?? {}, thoughtNotes, uploads.length));
  }, [selectedValues, thoughtNotes, uploads.length]);

  useEffect(() => {
    if (!thinkingText) {
      setDisplayThinkingText("");
      return;
    }

    if (!isAnalyzing) {
      setDisplayThinkingText(thinkingText);
      return;
    }

    setDisplayThinkingText("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 8;
      setDisplayThinkingText(thinkingText.slice(0, index));
      if (index >= thinkingText.length) {
        window.clearInterval(timer);
      }
    }, 28);

    return () => window.clearInterval(timer);
  }, [isAnalyzing, thinkingText]);

  useEffect(() => {
    lastSelectedTypesSyncRef.current = JSON.stringify(selectedTypes);
  }, [selectedTypes]);

  useEffect(() => {
    lastSavedTemplatesSyncRef.current = JSON.stringify(savedTemplates);
  }, [savedTemplates]);

  useEffect(() => {
    const nextSignature = `${globalRatio}::${perTypeCount}`;
    if (nextSignature === lastGlobalSettingsSyncRef.current) {
      return;
    }
    lastGlobalSettingsSyncRef.current = nextSignature;

    setSelectedTypes((current) => {
      const nextTypes = current.map((item) => syncSetPackTypeItemWithGlobalSettings(item, globalRatio, perTypeCount));
      return nextTypes.every((item, index) => item === current[index]) ? current : nextTypes;
    });

    setDraftTypes((current) => {
      const nextTypes = current.map((item) => syncSetPackTypeItemWithGlobalSettings(item, globalRatio, perTypeCount));
      return nextTypes.every((item, index) => item === current[index]) ? current : nextTypes;
    });

    setCustomDraft((current) => syncSetPackTypeItemWithGlobalSettings(current, globalRatio, perTypeCount));
  }, [globalRatio, perTypeCount]);

  useEffect(() => {
    if (modalMode !== "ai") return;
    setAnalysisPreview(draftTypes.length ? serializeSetPackTypePlan(draftTypes) : "");
  }, [draftTypes, modalMode]);

  useEffect(() => {
    if (modalMode !== "manual" && modalMode !== "edit" && modalMode !== "ai") return;

    let frameId = 0;
    const updateDrawerPosition = () => {
      const sectionRect = sectionRef.current?.getBoundingClientRect();
      const currentPanel = sectionRef.current?.closest(".ck-panel");
      const currentPanelRect = currentPanel?.getBoundingClientRect();
      const resultPanel = currentPanel?.nextElementSibling instanceof HTMLElement && currentPanel.nextElementSibling.classList.contains("ck-panel")
        ? currentPanel.nextElementSibling
        : null;
      const resultPanelRect = resultPanel?.getBoundingClientRect();
      const resultToolbar = resultPanel?.querySelector(".ck-results-toolbar") as HTMLElement | null;
      const resultToolbarRect = resultToolbar?.getBoundingClientRect();
      if (!currentPanelRect) return;

      const horizontalGap = 16;
      const verticalGap = modalMode === "ai" ? 16 : 62;
      const nextLeft = Math.max(16, currentPanelRect.right + horizontalGap);
      const availableWidth = Math.max(320, window.innerWidth - nextLeft - 16);
      const defaultTop = Math.max(16, (resultToolbarRect?.bottom ?? currentPanelRect.top) + verticalGap);
      const manualAnchorTop =
        sectionRect && modalMode === "manual"
          ? Math.max(16, Math.min(sectionRect.top - 8, window.innerHeight - 478 - 16))
          : defaultTop;
      const nextTop = manualAnchorTop;
      const availableHeight = Math.max(360, window.innerHeight - nextTop - 16);
      const preferredWidth = (resultPanelRect?.width ?? Math.max(640, availableWidth)) * (modalMode === "ai" ? 1 : 0.8);
      const drawerWidth =
        modalMode === "manual"
          ? Math.min(availableWidth, 588)
          : Math.min(availableWidth, Math.max(modalMode === "ai" ? 920 : 420, preferredWidth));
      const preferredHeight = (resultPanelRect?.height ?? availableHeight) * (modalMode === "ai" ? 1 : 0.8);
      const nextHeight =
        modalMode === "manual"
          ? Math.min(availableHeight, 478)
          : Math.min(availableHeight, Math.max(modalMode === "ai" ? 560 : 420, preferredHeight));
      const nextStyle = {
        top: `${nextTop}px`,
        left: `${nextLeft}px`,
        width: `${drawerWidth}px`,
        height: `${modalMode === "manual" ? Math.max(360, nextHeight) : Math.max(480, nextHeight)}px`
      };

      if (
        drawerStyleRef.current.top === nextStyle.top &&
        drawerStyleRef.current.left === nextStyle.left &&
        drawerStyleRef.current.width === nextStyle.width &&
        drawerStyleRef.current.height === nextStyle.height
      ) {
        return;
      }

      drawerStyleRef.current = nextStyle;
      setDrawerStyle(nextStyle);
    };

    updateDrawerPosition();
    const requestUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateDrawerPosition);
    };

    const resizeObserver = new ResizeObserver(() => {
      requestUpdate();
    });
    const sectionNode = sectionRef.current;
    const currentPanelNode = sectionNode?.closest(".ck-panel");
    const secondaryNode = document.querySelector(".ck-secondary");
    const bodyNode = document.querySelector(".ck-body");
    const resultPanelNode =
      currentPanelNode?.nextElementSibling instanceof HTMLElement && currentPanelNode.nextElementSibling.classList.contains("ck-panel")
        ? currentPanelNode.nextElementSibling
        : null;

    [currentPanelNode, secondaryNode, bodyNode, resultPanelNode].forEach((node) => {
      if (node instanceof Element) {
        resizeObserver.observe(node);
      }
    });

    window.addEventListener("resize", updateDrawerPosition);
    window.addEventListener("scroll", updateDrawerPosition, true);
    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDrawerPosition);
      window.removeEventListener("scroll", updateDrawerPosition, true);
    };
  }, [modalMode]);

  useEffect(() => {
    onSelectionMapChange?.({
      setPackSelectedTypes: JSON.stringify(selectedTypes),
      setPackSelectedTypeNames: selectedTypes.map((item) => item.category).join(" / "),
      setPackSavedTypeTemplates: JSON.stringify(savedTemplates)
    });
    onSelectionChange?.(selectedTypes.map((item) => item.category));
  }, [onSelectionChange, onSelectionMapChange, savedTemplates, selectedTypes]);

  const openManualModal = () => {
    setModalMode("manual");
    setActiveTab("recommended");
    setDraftTypes(selectedTypes);
  };

  const cloneTypeItem = (item: SetPackTypeItem) => ({
    ...item,
    id: `${item.id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  });

  const openAiModal = () => {
    if (!uploads.length) {
      onToast("请先上传图片后再使用AI生成", "warning");
      return;
    }
    setModalMode("ai");
    setDraftTypes([]);
    setAnalysisPreview("");
    setAiThoughtCollapsed(false);
    setThinkingText(buildSetPackTypeThinking(selectedValues ?? {}, thoughtNotes, uploads.length));
  };

  const handleAnalyze = () => {
    if (!uploads.length) {
      onToast("请先上传图片后再使用AI生成", "warning");
      return;
    }
    setIsAnalyzing(true);
    setDraftTypes([]);
    setAnalysisPreview("");
    setThinkingText(buildSetPackTypeThinking(selectedValues ?? {}, thoughtNotes, uploads.length));
    const nextTypes = buildSetPackTypeRecommendations(selectedValues ?? {}, thoughtNotes, perTypeCount)
      .slice(0, 5)
      .map((item) => syncSetPackTypeItemWithGlobalSettings(item, globalRatio, perTypeCount));
    window.setTimeout(() => {
      setDraftTypes(nextTypes);
      setThinkingText(buildSetPackTypeAnalysisNarrative(nextTypes, selectedValues ?? {}, thoughtNotes, uploads.length));
      setAnalysisPreview(serializeSetPackTypePlan(nextTypes));
      setIsAnalyzing(false);
    }, 520);
  };

  const handleToggleRecommended = (template: SetPackTypeTemplate) => {
    const existingMatch = selectedTypes.find((item) => item.category === template.category);
    if (existingMatch) {
      setSelectedTypes((current) => current.filter((item) => item.category !== template.category));
      return;
    }
    if (selectedTypes.length >= selectionLimit) {
      onToast(`最多可添加 ${selectionLimit} 个${isAplusTool ? "模块" : "套图类型"}`, "warning");
      return;
    }
    setSelectedTypes((current) => [
      ...current,
      createSetPackTypeItem(template, selectedValues ?? {}, { ratio: globalRatio || template.defaultRatio, count: perTypeCount })
    ]);
  };

  const handleApplyDraftTypes = () => {
    if (!draftTypes.length) {
      onToast("请至少选择 1 个套图类型", "warning");
      return;
    }
    setSelectedTypes(
      draftTypes.slice(0, SET_PACK_TYPE_LIMIT).map((item) => ({
        ...item,
        count: item.count ?? perTypeCount
      }))
    );
    setModalMode(null);
  };

  const handleSaveCustomType = () => {
    if (!customDraft.category.trim()) {
      onToast("请先填写类型名称", "warning");
      return;
    }
    if (selectedTypes.length >= SET_PACK_TYPE_LIMIT) {
      onToast(`最多可添加 ${SET_PACK_TYPE_LIMIT} 个套图类型`, "warning");
      return;
    }
    setSelectedTypes((current) => [
      ...current,
      {
        ...customDraft,
        id: `custom-${Date.now()}`,
        name: customDraft.name.trim() || `${customDraft.category.trim()}展示`,
        description: customDraft.description.trim() || "自定义类型",
        prompt: customDraft.prompt.trim() || `${customDraft.category.trim()}，突出商品卖点与画面表达。`
      }
    ]);
    setCustomDraft({
      id: "custom-draft",
      category: "",
      name: "",
      description: "",
      tag: "自定义",
      prompt: "",
      ratio: globalRatio || "1:1",
      resolution: "1K",
      count: perTypeCount
    });
    setActiveTab("recommended");
  };

  const openSaveTemplateModal = () => {
    if (!selectedTypes.length) {
      onToast("当前没有可保存的套图类型", "warning");
      return;
    }
    setTemplateDraftName(`未命名组图模板`);
    setModalMode("save-template");
  };

  const handleSaveTemplate = () => {
    if (!selectedTypes.length) {
      onToast("当前没有可保存的套图类型", "warning");
      return;
    }
    const coverSrc = uploads[0]?.previewSrc ?? uploads[0]?.src ?? "";
    const nextTemplate: SetPackTypeSavedTemplate = {
      id: `type-template-${Date.now()}`,
      name: templateDraftName.trim() || `套图模板 ${savedTemplates.length + 1}`,
      coverSrc,
      types: selectedTypes.map((item) => ({ ...item }))
    };
    setSavedTemplates((current) => [nextTemplate, ...current].slice(0, 10));
    setModalMode(null);
    onToast("已保存为模板");
  };

  const handleApplyTemplate = (template: SetPackTypeSavedTemplate) => {
    setSelectedTypes((current) => {
      const availableSlots = SET_PACK_TYPE_LIMIT - current.length;
      if (availableSlots <= 0) {
        onToast(`最多可添加 ${SET_PACK_TYPE_LIMIT} 个套图类型`, "warning");
        return current;
      }
      const nextTypes = template.types
        .slice(0, availableSlots)
        .map((item) => cloneTypeItem(syncSetPackTypeItemWithGlobalSettings(item, globalRatio, perTypeCount)));
      if (nextTypes.length < template.types.length) {
        onToast(`最多可添加 ${SET_PACK_TYPE_LIMIT} 个套图类型`, "warning");
      }
      return [...current, ...nextTypes];
    });
    setActiveTab("template");
  };

  const handleApplyCustomType = (item: SetPackTypeItem) => {
    if (selectedTypes.length >= SET_PACK_TYPE_LIMIT) {
      onToast(`最多可添加 ${SET_PACK_TYPE_LIMIT} 个套图类型`, "warning");
      return;
    }
    setSelectedTypes((current) => [...current, cloneTypeItem(syncSetPackTypeItemWithGlobalSettings(item, globalRatio, perTypeCount))]);
  };

  const handleStartEdit = (item: SetPackTypeItem) => {
    setEditingTypeId(item.id);
    setCustomDraft(item);
    setModalMode("edit");
  };

  const handleConfirmEdit = () => {
    setSelectedTypes((current) => current.map((item) => (item.id === editingTypeId ? { ...customDraft, id: editingTypeId } : item)));
    setModalMode(null);
    setEditingTypeId("");
  };

  const handleConfirmDelete = () => {
    setSelectedTypes((current) => current.filter((item) => item.id !== pendingDeleteTypeId));
    setPendingDeleteTypeId("");
  };

  const currentEditType = selectedTypes.find((item) => item.id === editingTypeId);
  const pendingDeleteType = selectedTypes.find((item) => item.id === pendingDeleteTypeId);
  const drawerPanelStyle = drawerStyle;

  if (isAplusTool) {
    return (
      <div className="ck-form-block ck-set-pack-type-section" ref={sectionRef}>
        <div className="ck-aplus-module-head">
          <div className="ck-aplus-module-title-wrap">
            <div className="ck-field-title">
              包含模块（多选）
              <span>*</span>
            </div>
          </div>
          <div className="ck-aplus-module-summary">
            <span>已选 {selectedTypes.length}/{moduleLibrary.length}</span>
            <button onClick={() => setCollapsed((current) => !current)} type="button">
              {collapsed ? "展开" : "收起"}
            </button>
          </div>
        </div>
        {!collapsed ? (
          <div className="ck-aplus-module-grid">
            {moduleLibrary.map((item) => {
              const selected = selectedTypes.some((type) => type.category === item.category);
              return (
                <button
                  className={`ck-aplus-module-card${selected ? " active" : ""}`}
                  key={item.id}
                  onClick={() => handleToggleRecommended(item)}
                  type="button"
                >
                  <strong>{item.category}</strong>
                  <span>{item.description}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="ck-form-block" ref={sectionRef}>
        <div className="ck-set-pack-type-head">
          <div className="ck-set-pack-type-title-row">
            <div className="ck-field-title">
              出图类型
              <span>*</span>
              <em>（已选 {selectedTypes.length}/{SET_PACK_TYPE_LIMIT} 个）</em>
            </div>
          </div>
          <button className="ck-advanced-settings-ai" onClick={openAiModal} type="button">
            AI生成
          </button>
        </div>
        <div className="ck-set-pack-type-list">
          {selectedTypes.length ? (
            <>
              {selectedTypes.map((item, index) => (
                <article className="ck-set-pack-type-card" key={item.id}>
                  <div className="ck-set-pack-type-card-head">
                    <div className="ck-set-pack-type-title">
                      <strong>
                        {index + 1}. {item.category}
                      </strong>
                      <span>{item.tag}</span>
                    </div>
                    <div className="ck-set-pack-type-card-actions">
                      <button
                        aria-label="复制"
                        className="ck-set-pack-type-card-icon"
                        onClick={() => {
                          if (selectedTypes.length >= SET_PACK_TYPE_LIMIT) {
                            onToast(`最多可添加 ${SET_PACK_TYPE_LIMIT} 个套图类型`, "warning");
                            return;
                          }
                          setSelectedTypes((current) => [...current, cloneTypeItem(item)]);
                        }}
                        title="复制"
                        type="button"
                      >
                        <img alt="" aria-hidden="true" src="/assets/set-pack-type-copy.svg" />
                      </button>
                      <button aria-label="删除" className="ck-set-pack-type-card-icon" onClick={() => setPendingDeleteTypeId(item.id)} title="删除" type="button">
                        <img alt="" aria-hidden="true" src="/assets/set-pack-type-delete-full.svg" />
                      </button>
                      <button aria-label="设置" className="ck-set-pack-type-card-icon" onClick={() => handleStartEdit(item)} title="设置" type="button">
                        <img alt="" aria-hidden="true" src="/assets/set-pack-type-settings-full.svg" />
                      </button>
                    </div>
                  </div>
                  <div className="ck-set-pack-type-card-divider" />
                  <div className="ck-set-pack-type-meta">数量 {item.count ?? perTypeCount} 比例 {item.ratio} 分辨率 {item.resolution}</div>
                </article>
              ))}
              <button className="ck-set-pack-type-add-entry" onClick={openManualModal} type="button">
                <img alt="" aria-hidden="true" src="/assets/set-pack-type-add-purple.svg" />
                <span>继续添加类型</span>
              </button>
            </>
          ) : (
            <div className="ck-set-pack-type-empty">
              <div className="ck-set-pack-type-empty-card">
                <span>
                  请先选择出图类型
                  <br />
                  最多支持 15 个类型组合生成
                </span>
                <button className="ck-set-pack-type-add-entry" onClick={openManualModal} type="button">
                  <img alt="" aria-hidden="true" src="/assets/set-pack-type-add-dark.svg" />
                  <span>手动添加类型</span>
                </button>
              </div>
            </div>
          )}
        </div>
        {selectedTypes.length ? (
          <div className="ck-set-pack-type-bottom">
            <button className="ck-advanced-settings-ai" onClick={() => setSelectedTypes([])} type="button">
              清空所有类型
            </button>
            <button className="ck-advanced-settings-ai" onClick={openSaveTemplateModal} type="button">
              另存为模板
            </button>
          </div>
        ) : null}
      </div>

      {modalMode === "ai" ? (
        <div
          className="ck-set-pack-modal-mask ck-set-pack-ai-modal-mask"
          onClick={() => setModalMode(null)}
          role="presentation"
        >
          <div
            className="ck-set-pack-type-modal ck-set-pack-ai-type-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ck-set-pack-modal-head">
              <strong>AI智能电商组图</strong>
              <div className="ck-set-pack-ai-head-actions">
                <button className="ck-set-pack-ai-close" onClick={() => setModalMode(null)} type="button">
                  ×
                </button>
              </div>
            </div>
            <div className="ck-set-pack-modal-body">
              <div className="ck-set-pack-ai-layout">
                <aside className="ck-set-pack-ai-sidebar">
                  <div className="ck-set-pack-ai-box">
                    <div className="ck-set-pack-ai-section-title">商品信息</div>
                    <div className="ck-set-pack-ai-product-card">
                      <div className="ck-set-pack-ai-upload-thumb large">
                        {uploads[0]?.previewSrc || uploads[0]?.src ? <img alt="商品图" src={uploads[0]?.previewSrc ?? uploads[0]?.src} /> : null}
                      </div>
                      <div className="ck-set-pack-ai-product-meta">
                        <strong>{productName}</strong>
                        <div className="ck-set-pack-ai-product-tags">
                          <span>{uploads.length}张商品图</span>
                          {targetMarket ? <span>{targetMarket}</span> : null}
                          {copyLanguage ? <span>{copyLanguage}</span> : null}
                        </div>
                        {productSellingPoints.length ? (
                          <ul className="ck-set-pack-ai-product-points">
                            {productSellingPoints.map((point) => (
                              <li key={point}>{point}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="ck-set-pack-ai-product-empty">当前还没有补充商品卖点，将结合商品图信息进行分析。</p>
                        )}
                      </div>
                    </div>
                    <UnifiedTextareaField
                      formBlockClassName="ck-set-pack-ai-input-main"
                      label="细节补充"
                      maxLength={600}
                      onChange={setThoughtNotes}
                      optional
                      placeholder="可选：补充需求（如核心卖点、视觉风格、场景补充）"
                      value={thoughtNotes}
                    />
                    <button className="ck-set-pack-ai-start" disabled={isAnalyzing} onClick={handleAnalyze} type="button">
                      {isAnalyzing ? "分析中..." : analysisPreview ? "重新分析" : "开始分析"}
                    </button>
                  </div>
                </aside>

                <section className="ck-set-pack-ai-main">
                  <div className={`ck-set-pack-ai-box ck-set-pack-ai-thinking-panel${shouldShowThinkingPanel ? " expanded" : ""}`}>
                    <div className="ck-set-pack-ai-box-head">
                      <div className="ck-set-pack-ai-section-title">AI思考过程</div>
                      <button className="ck-set-pack-ai-collapse" onClick={() => setAiThoughtCollapsed((current) => !current)} type="button">
                        {aiThoughtCollapsed ? "展开" : "收起"}
                      </button>
                    </div>
                    {shouldShowThinkingPanel ? (
                      isAnalyzing ? (
                        <div className="ck-set-pack-ai-thinking-loading">
                          <div className="ck-set-pack-skeleton" />
                          <div className="ck-set-pack-skeleton" />
                          <div className="ck-set-pack-skeleton" />
                          <div className="ck-set-pack-skeleton medium" />
                        </div>
                      ) : (
                        <div className={`ck-set-pack-ai-thinking${aiThoughtCollapsed ? " collapsed" : ""}`}>{displayThinkingText}</div>
                      )
                    ) : null}
                  </div>

                  <div className="ck-set-pack-selected-panel">
                    <div className="ck-set-pack-selected-panel-head">
                      <strong>出图类型（{draftTypes.length}）</strong>
                      <button
                        disabled={!draftTypes.length}
                        onClick={() => {
                          setDraftTypes([]);
                          setAnalysisPreview("");
                          setThinkingText(buildSetPackTypeThinking(selectedValues ?? {}, thoughtNotes, uploads.length));
                        }}
                        type="button"
                      >
                        清空已选
                      </button>
                    </div>
                    <div className="ck-set-pack-selected-panel-content">
                      {isAnalyzing ? (
                        <div className="ck-set-pack-selected-drafts loading">
                          {Array.from({ length: 4 }).map((_, index) => (
                            <article className="ck-set-pack-draft-card skeleton" key={`skeleton-${index}`}>
                              <div className="ck-set-pack-skeleton short" />
                              <div className="ck-set-pack-skeleton" />
                              <div className="ck-set-pack-skeleton" />
                              <div className="ck-set-pack-skeleton medium" />
                            </article>
                          ))}
                        </div>
                      ) : draftTypes.length ? (
                        <div className="ck-set-pack-selected-drafts">
                          {draftTypes.map((item, index) => (
                            <article className="ck-set-pack-draft-card" key={item.id}>
                              <div className="ck-set-pack-draft-head">
                                <div className="ck-set-pack-draft-title">
                                  <div className="ck-set-pack-draft-title-row">
                                    <strong>
                                      {index + 1}. {item.category}
                                    </strong>
                                    {item.tag ? <span>{item.tag}</span> : null}
                                  </div>
                                </div>
                                <button
                                  aria-label="删除"
                                  className="ck-set-pack-draft-delete"
                                  onClick={() => setDraftTypes((current) => current.filter((type) => type.id !== item.id))}
                                  type="button"
                                >
                                  <img alt="" aria-hidden="true" src="/assets/set-pack-type-delete-full.svg" />
                                </button>
                              </div>
                              <div className="ck-set-pack-draft-copy">
                                <span>描述词</span>
                                <p>{item.prompt}</p>
                              </div>
                              <div className="ck-set-pack-draft-settings">
                                <div className="ck-set-pack-draft-inline">
                                  <span>出图比例</span>
                                  <SelectField
                                    fullWidth
                                    hideLabel
                                    label="图片比例"
                                    onChange={(value) => setDraftTypes((current) => current.map((type) => (type.id === item.id ? { ...type, ratio: value } : type)))}
                                    options={setPackRatioOptions}
                                    value={item.ratio}
                                  />
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="ck-set-pack-ai-empty-state">
                          <strong>分析完成后会自动生成并选用出图类型</strong>
                          <span>支持结合商品图、商品卖点与补充需求，生成可直接应用到套图的类型方案。</span>
                        </div>
                      )}
                    </div>
                    {draftTypes.length ? (
                      <div className="ck-set-pack-selected-actions">
                        <button className="ck-set-pack-ai-secondary" onClick={() => setModalMode(null)} type="button">
                          取消
                        </button>
                        <button className="ck-set-pack-ai-primary" onClick={handleApplyDraftTypes} type="button">
                          应用到套图
                        </button>
                      </div>
                    ) : null}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {modalMode === "manual" ? (
        <div
          className="ck-set-pack-side-drawer-mask"
          onClick={() => setModalMode(null)}
          role="presentation"
        >
          <div className="ck-set-pack-side-drawer" onClick={(event) => event.stopPropagation()} style={drawerPanelStyle}>
            <div className="ck-set-pack-side-drawer-head">
              <strong>出图类型</strong>
              <button onClick={() => setModalMode(null)} type="button">
                ×
              </button>
            </div>
            <div className="ck-set-pack-side-drawer-body">
              <div className="ck-set-pack-type-tabs ck-set-pack-type-tabs-pill">
                {[
                  ["recommended", "推荐类型"],
                  ["custom", "自定义类型"],
                  ["template", "自定义模板"]
                ].map(([key, label]) => (
                  <button
                    className={activeTab === key ? "active" : ""}
                    key={key}
                    onClick={() => setActiveTab(key as "recommended" | "custom" | "template")}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "recommended" ? (
                <div className="ck-set-pack-type-grid">
                  {setPackTypeLibrary.map((item) => {
                    const selected = selectedTypes.some((type) => type.category === item.category);
                    return (
                      <button className={`ck-set-pack-type-option${selected ? " active" : ""}`} key={item.id} onClick={() => handleToggleRecommended(item)} type="button">
                        <strong>{item.category}</strong>
                        <span>{item.description}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {activeTab === "custom" ? (
                <div className="ck-set-pack-type-grid">
                  {customTypeLibrary.map((item) => (
                    <button className="ck-set-pack-type-option" key={item.id} onClick={() => handleApplyCustomType(item)} type="button">
                      <strong>{item.category}</strong>
                      <span>{item.description}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {activeTab === "template" ? (
                <div className="ck-set-pack-type-grid">
                  {templateLibrary.length ? (
                    templateLibrary.map((item) => (
                      <button className="ck-set-pack-type-option ck-set-pack-template-option" key={item.id} onClick={() => handleApplyTemplate(item)} type="button">
                        <strong>{item.name}</strong>
                        <span>{item.types.map((type) => type.category).join(" / ")}</span>
                      </button>
                    ))
                  ) : (
                    <div className="ck-set-pack-type-empty">还没有保存的套图模板。</div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {modalMode === "edit" && currentEditType ? (
        <div
          className="ck-set-pack-side-drawer-mask"
          onClick={() => setModalMode(null)}
          role="presentation"
        >
          <div className="ck-set-pack-side-drawer ck-set-pack-side-drawer-wide" onClick={(event) => event.stopPropagation()} style={drawerPanelStyle}>
            <div className="ck-set-pack-side-drawer-head">
              <div className="ck-set-pack-drawer-title">
                <strong>{currentEditType.category} 属性设置</strong>
                <span>可单独调整当前类型的文案、出图数量、比例和分辨率。</span>
              </div>
              <button onClick={() => setModalMode(null)} type="button">
                ×
              </button>
            </div>
            <div className="ck-set-pack-side-drawer-body">
              <div className="ck-set-pack-edit-layout">
                <div className="ck-set-pack-edit-column">
                  <div className="ck-set-pack-edit-section">
                    <div className="ck-set-pack-edit-section-head">
                      <strong>个性化设置</strong>
                    </div>
                    <div className="ck-set-pack-copy-grid">
                      <div className="ck-set-pack-copy-block">
                        <FieldTitle label="类型名称" required />
                        <input onChange={(event) => setCustomDraft((current) => ({ ...current, category: event.target.value }))} value={customDraft.category} />
                      </div>
                      <div className="ck-set-pack-copy-block">
                        <FieldTitle label="类型标签" />
                        <input onChange={(event) => setCustomDraft((current) => ({ ...current, tag: event.target.value }))} value={customDraft.tag} />
                      </div>
                      <div className="ck-set-pack-copy-block">
                        <FieldTitle label="类型说明" />
                        <input onChange={(event) => setCustomDraft((current) => ({ ...current, description: event.target.value }))} value={customDraft.description} />
                      </div>
                      <div className="ck-set-pack-copy-block">
                        <FieldTitle label="展示名称" />
                        <input onChange={(event) => setCustomDraft((current) => ({ ...current, name: event.target.value }))} value={customDraft.name} />
                      </div>
                    </div>
                  </div>

                  <div className="ck-set-pack-edit-section">
                    <div className="ck-set-pack-edit-section-head">
                      <strong>补充说明</strong>
                    </div>
                    <UnifiedTextareaField
                      formBlockClassName="ck-set-pack-copy-block"
                      maxLength={2000}
                      onChange={(value) => setCustomDraft((current) => ({ ...current, prompt: value }))}
                      placeholder="请输入该类型的画面目标、主体构图和场景要求"
                      value={customDraft.prompt}
                    />
                  </div>
                </div>

                <div className="ck-set-pack-edit-column secondary">
                  <div className="ck-set-pack-edit-section">
                    <div className="ck-set-pack-edit-section-head">
                      <strong>出图设置</strong>
                    </div>
                    <div className="ck-set-pack-edit-settings">
                      <NumberStepperField
                        label="出图数量"
                        onChange={(value) => setCustomDraft((current) => ({ ...current, count: value }))}
                        value={customDraft.count ?? perTypeCount}
                      />
                      <SelectField
                        fullWidth
                        label="图片比例"
                        onChange={(value) => setCustomDraft((current) => ({ ...current, ratio: value }))}
                        options={setPackRatioOptions}
                        value={customDraft.ratio}
                      />
                      <SelectField
                        fullWidth
                        label="分辨率"
                        onChange={(value) => setCustomDraft((current) => ({ ...current, resolution: value }))}
                        options={defaultResolutionOptions}
                        value={customDraft.resolution}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ck-set-pack-modal-footer">
              <button onClick={openSaveTemplateModal} type="button">
                另存为模板
              </button>
              <button onClick={handleConfirmEdit} type="button">
                设置完成并关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalMode === "save-template" ? (
        <div className="ck-set-pack-modal-mask" onClick={() => setModalMode(null)}>
          <div className="ck-set-pack-modal edit ck-set-pack-template-save-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ck-set-pack-modal-head">
              <strong>另存组图模板</strong>
              <button onClick={() => setModalMode(null)} type="button">
                ×
              </button>
            </div>
            <div className="ck-set-pack-modal-body">
              <div className="ck-set-pack-copy-block">
                <FieldTitle label="模板名称" required />
                <div className="ck-set-pack-template-name-wrap">
                  <input
                    maxLength={200}
                    onChange={(event) => setTemplateDraftName(event.target.value)}
                    placeholder="请输入模板名称"
                    value={templateDraftName}
                  />
                  <span>{templateDraftName.length}/200</span>
                </div>
              </div>
              <div className="ck-set-pack-copy-block">
                <FieldTitle label="模板封面" optional />
                <div className="ck-set-pack-template-cover-card">
                  {uploads[0]?.previewSrc || uploads[0]?.src ? <img alt="模板封面" src={uploads[0]?.previewSrc ?? uploads[0]?.src} /> : <div className="ck-set-pack-template-cover-empty">使用当前商品图作为模板封面</div>}
                </div>
              </div>
            </div>
            <div className="ck-set-pack-modal-footer">
              <button onClick={() => setModalMode(null)} type="button">
                取消
              </button>
              <button onClick={handleSaveTemplate} type="button">
                保存模板
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteType ? (
        <div className="ck-result-confirm-mask" onClick={() => setPendingDeleteTypeId("")}>
          <div className="ck-result-confirm-modal ck-set-pack-delete-confirm-modal" onClick={(event) => event.stopPropagation()}>
            <strong>删除该类型？</strong>
            <p>删除后，{pendingDeleteType.category} 将从已选择列表中移除。</p>
            <div className="ck-result-confirm-actions">
              <button className="secondary" onClick={() => setPendingDeleteTypeId("")} type="button">
                取消
              </button>
              <button className="primary" onClick={handleConfirmDelete} type="button">
                确定
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function AplusPlanEditorSection({
  plan,
  stale,
  onBack,
  onGenerate,
  generateCostLabel,
  onDeleteModule,
  onMoveModule,
  onUpdateModule
}: {
  plan?: AplusPlanState;
  stale?: boolean;
  onBack: () => void;
  onGenerate: () => void;
  generateCostLabel: string;
  onDeleteModule: (moduleId: string) => void;
  onMoveModule: (dragId: string, targetId: string) => void;
  onUpdateModule: (moduleId: string, content: Partial<AplusPlanModule>) => void;
}) {
  const resolvedPlan = plan ?? { status: "idle", modules: [], summary: [] };
  const [editingModuleId, setEditingModuleId] = useState("");
  const [moduleDraft, setModuleDraft] = useState("");
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [draggingModuleId, setDraggingModuleId] = useState("");
  const summaryLines = resolvedPlan.summary ?? [];
  const visibleSummaryLines = summaryExpanded ? summaryLines : summaryLines.slice(0, 4);
  const canGenerate = resolvedPlan.status === "ready" && resolvedPlan.modules.length > 0 && !stale;

  return (
    <>
      <div className="ck-aplus-plan-step">
        <div className="ck-panel-title">模块策略与设计规范</div>
        {resolvedPlan.status === "generating" ? (
          <div className="ck-aplus-plan-loading-card in-panel">
            <div className="ck-aplus-plan-loading-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <strong>生成中...</strong>
          </div>
        ) : resolvedPlan.status === "ready" ? (
          <>
            <div className="ck-aplus-plan-summary-card compact">
              <strong>产品与卖点</strong>
              <div className="ck-aplus-plan-summary-lines">
                {visibleSummaryLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              {summaryLines.length > 4 ? (
                <button className="ck-aplus-summary-toggle" onClick={() => setSummaryExpanded((current) => !current)} type="button">
                  {summaryExpanded ? "收起" : "展开全部"} <span>{summaryExpanded ? "⌃" : "⌄"}</span>
                </button>
              ) : null}
            </div>

            <div className="ck-aplus-plan-section-label">模块内容</div>
                <div className="ck-aplus-plan-module-list compact">
                  {resolvedPlan.modules.map((module) => (
                    <article
                      className={`ck-aplus-plan-module-card compact${draggingModuleId === module.id ? " dragging" : ""}${editingModuleId === module.id ? " editing" : ""}`}
                      draggable
                      key={module.id}
                      onClick={() => {
                        setEditingModuleId(module.id);
                        setModuleDraft(module.lines.join("\n"));
                  }}
                  onDragEnd={() => setDraggingModuleId("")}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDraggingModuleId(module.id)}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!draggingModuleId || draggingModuleId === module.id) return;
                    onMoveModule(draggingModuleId, module.id);
                    setDraggingModuleId("");
                  }}
                >
                      <div className="ck-aplus-plan-module-actions compact">
                    <button
                      className="ck-aplus-plan-icon-button compact"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteModule(module.id);
                      }}
                      type="button"
                    >
                      ⌦
                    </button>
                    <button className="ck-aplus-plan-icon-button drag compact" onClick={(event) => event.stopPropagation()} type="button">
                      ⋮⋮
                    </button>
                      </div>
                      <strong>{module.headline}</strong>
                      {editingModuleId === module.id ? (
                        <UnifiedTextareaField
                          formBlockClassName="ck-aplus-plan-module-inline-editor"
                          hideCount
                          maxLength={1200}
                          onChange={(value) => {
                            setModuleDraft(value);
                            onUpdateModule(module.id, {
                              lines: value
                                .split("\n")
                                .map((line) => line.trim())
                                .filter(Boolean)
                            });
                          }}
                          placeholder=""
                          textareaProps={{
                            autoFocus: true,
                            onBlur: () => {
                              onUpdateModule(module.id, {
                                lines: moduleDraft
                                  .split("\n")
                                  .map((line) => line.trim())
                                  .filter(Boolean)
                              });
                            },
                            onClick: (event) => event.stopPropagation()
                          }}
                          value={moduleDraft}
                        />
                      ) : (
                        <div className="ck-aplus-plan-module-lines">
                          {module.lines.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
            {stale ? <div className="ck-aplus-plan-stale">第1步参数已变更，请重新生成规划方案。</div> : null}
          </>
        ) : (
          <div className="ck-aplus-plan-empty in-panel">
            <strong>还没有规划方案</strong>
            <span>请先返回上一步完成参数输入。</span>
          </div>
        )}
      </div>

      <div className="ck-panel-footer ck-aplus-step-footer">
        <div className="ck-aplus-plan-footer in-panel">
          <button className="secondary" onClick={onBack} type="button">
            上一步
          </button>
          <button className="ck-generate-btn ck-generate-btn-aplus-step" disabled={!canGenerate} onClick={onGenerate} type="button">
            <img alt="" className="ck-generate-icon" src={figmaIcons.generateButton} />
            <span>立即生成</span>
          </button>
        </div>
      </div>
    </>
  );
}

function FashionSceneEditorSection({
  plan,
  stale,
  onBack,
  onGenerate,
  generateCostLabel,
  onDeleteModule,
  onMoveModule,
  onUpdateModule
}: {
  plan?: AplusPlanState;
  stale?: boolean;
  onBack: () => void;
  onGenerate: () => void;
  generateCostLabel: string;
  onDeleteModule: (moduleId: string) => void;
  onMoveModule: (dragId: string, targetId: string) => void;
  onUpdateModule: (moduleId: string, content: Partial<AplusPlanModule>) => void;
}) {
  const resolvedPlan = plan ?? { status: "idle", modules: [], summary: [] };
  const [editingModuleId, setEditingModuleId] = useState("");
  const [moduleDraft, setModuleDraft] = useState("");
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [draggingModuleId, setDraggingModuleId] = useState("");
  const summaryLines = resolvedPlan.summary ?? [];
  const visibleSummaryLines = summaryExpanded ? summaryLines : summaryLines.slice(0, 4);
  const canGenerate = resolvedPlan.status === "ready" && resolvedPlan.modules.length > 0 && !stale;

  return (
    <>
      <div className="ck-aplus-plan-step">
        <div className="ck-panel-title">推荐场景</div>
        {resolvedPlan.status === "generating" ? (
          <div className="ck-aplus-plan-loading-card in-panel">
            <div className="ck-aplus-plan-loading-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <strong>AI 正在生成推荐场景...</strong>
          </div>
        ) : resolvedPlan.status === "ready" ? (
          <>
            <div className="ck-aplus-plan-summary-card compact">
              <strong>服装与模特信息</strong>
              <div className="ck-aplus-plan-summary-lines">
                {visibleSummaryLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              {summaryLines.length > 4 ? (
                <button className="ck-aplus-summary-toggle" onClick={() => setSummaryExpanded((current) => !current)} type="button">
                  {summaryExpanded ? "收起" : "展开全部"} <span>{summaryExpanded ? "⌃" : "⌄"}</span>
                </button>
              ) : null}
            </div>

            <div className="ck-aplus-plan-section-label">场景内容</div>
            <div className="ck-aplus-plan-module-list compact">
              {resolvedPlan.modules.map((module) => (
                <article
                  className={`ck-aplus-plan-module-card compact${draggingModuleId === module.id ? " dragging" : ""}${editingModuleId === module.id ? " editing" : ""}`}
                  draggable
                  key={module.id}
                  onClick={() => {
                    setEditingModuleId(module.id);
                    setModuleDraft(module.lines.join("\n"));
                  }}
                  onDragEnd={() => setDraggingModuleId("")}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDraggingModuleId(module.id)}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!draggingModuleId || draggingModuleId === module.id) return;
                    onMoveModule(draggingModuleId, module.id);
                    setDraggingModuleId("");
                  }}
                >
                  <div className="ck-aplus-plan-module-actions compact">
                    <button
                      className="ck-aplus-plan-icon-button compact"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteModule(module.id);
                      }}
                      type="button"
                    >
                      ⌦
                    </button>
                    <button className="ck-aplus-plan-icon-button drag compact" onClick={(event) => event.stopPropagation()} type="button">
                      ⋮⋮
                    </button>
                  </div>
                  <strong>{module.headline}</strong>
                  {editingModuleId === module.id ? (
                    <UnifiedTextareaField
                      formBlockClassName="ck-aplus-plan-module-inline-editor"
                      hideCount
                      maxLength={1200}
                      onChange={(value) => {
                        setModuleDraft(value);
                        onUpdateModule(module.id, {
                          lines: value
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean)
                        });
                      }}
                      placeholder=""
                      textareaProps={{
                        autoFocus: true,
                        onBlur: () => {
                          onUpdateModule(module.id, {
                            lines: moduleDraft
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean)
                          });
                        },
                        onClick: (event) => event.stopPropagation()
                      }}
                      value={moduleDraft}
                    />
                  ) : (
                    <div className="ck-aplus-plan-module-lines">
                      {module.lines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
            {stale ? <div className="ck-aplus-plan-stale">第1步信息已变更，请重新生成推荐场景。</div> : null}
          </>
        ) : (
          <div className="ck-aplus-plan-empty in-panel">
            <strong>还没有推荐场景</strong>
            <span>请先返回上一步完成图片与模特选择。</span>
          </div>
        )}
      </div>

      <div className="ck-panel-footer ck-aplus-step-footer">
        <div className="ck-aplus-plan-footer in-panel">
          <button className="secondary" onClick={onBack} type="button">
            上一步
          </button>
          <button className="ck-generate-btn ck-generate-btn-aplus-step" disabled={!canGenerate} onClick={onGenerate} type="button">
            <img alt="" className="ck-generate-icon" src={figmaIcons.generateButton} />
            <span>立即生成</span>
          </button>
        </div>
      </div>
    </>
  );
}

function ConfigPanel({
  tool,
  uploads,
  modelAssets,
  onAddUpload,
  onRemoveUpload,
  onOpenLibrary,
  onRejectedUpload,
  onAtLimit,
  onGenerate,
  onToast,
  uploadCountLimit,
  remainingStorageMb,
  restoredTask,
  supplementValue,
  onSupplementChange,
  onSupplementAiPolish,
  onSupplementAiAssist,
  onGenerateAplusPlan,
  onAplusDraftChange,
  aplusPlan,
  aplusPlanStep,
  aplusPlanStale,
  fashionPlan,
  fashionPlanStep,
  fashionPlanStale,
  onBackAplusStep,
  onGenerateAplusDetails,
  onDeleteAplusModule,
  onMoveAplusModule,
  onUpdateAplusModule,
  onGenerateFashionScenes,
  onBackFashionStep,
  onGenerateFashionResults,
  onDeleteFashionScene,
  onMoveFashionScene,
  onUpdateFashionScene,
  onNavigateTool,
  onGenerateBaselineModel,
  onUploadModels,
  onUpdateUploadItems,
  isGeneratingLocked
}: {
  tool: ToolConfig;
  uploads: Record<string, UploadItem[]>;
  modelAssets: ModelAsset[];
  onAddUpload: (fieldKey: string, nextValues: UploadItem[]) => void;
  onRemoveUpload: (fieldKey: string, index: number) => void;
  onUpdateUploadItems: (fieldKey: string, updater: (items: UploadItem[]) => UploadItem[]) => void;
  onOpenLibrary: (fieldKey: string) => void;
  onRejectedUpload: (message: string) => void;
  onAtLimit: () => void;
  onGenerate: (tool: ToolConfig, payload: GeneratePayload) => void;
  onToast: (message: string, tone?: "warning") => void;
  uploadCountLimit: number;
  remainingStorageMb: number;
  restoredTask?: TaskRecord | null;
  supplementValue: string;
  onSupplementChange: (toolKey: string, value: string) => void;
  onSupplementAiPolish: (toolKey: string, value: string, context?: SupplementAiPolishContext) => Promise<SupplementAiPolishResult>;
  onSupplementAiAssist: (
    toolKey: string,
    uploads: UploadItem[],
    advancedConfig?: AdvancedSettingsConfig,
    context?: SupplementAiPolishContext
  ) => Promise<AdvancedAiAssistResult | null>;
  onGenerateAplusPlan: (tool: ToolConfig, payload: GeneratePayload) => void;
  onAplusDraftChange: (toolKey: string, payload: GeneratePayload) => void;
  aplusPlan?: AplusPlanState;
  aplusPlanStep?: 1 | 2;
  aplusPlanStale?: boolean;
  fashionPlan?: AplusPlanState;
  fashionPlanStep?: 1 | 2;
  fashionPlanStale?: boolean;
  onBackAplusStep: () => void;
  onGenerateAplusDetails: () => void;
  onDeleteAplusModule: (moduleId: string) => void;
  onMoveAplusModule: (dragId: string, targetId: string) => void;
  onUpdateAplusModule: (moduleId: string, content: Partial<AplusPlanModule>) => void;
  onGenerateFashionScenes: (tool: ToolConfig, payload: GeneratePayload) => void;
  onBackFashionStep: () => void;
  onGenerateFashionResults: () => void;
  onDeleteFashionScene: (moduleId: string) => void;
  onMoveFashionScene: (dragId: string, targetId: string) => void;
  onUpdateFashionScene: (moduleId: string, content: Partial<AplusPlanModule>) => void;
  onNavigateTool: (toolKey: string) => void;
  onGenerateBaselineModel: (values: AdvancedSelectionMap) => Promise<string | null>;
  onUploadModels: (files: File[]) => Promise<ModelAsset[]>;
  isGeneratingLocked: boolean;
}) {
  const panelKind = tool.panelKind ?? "basic";
  const mainUploadKey = `${tool.key}:main`;
  const refUploadKey = `${tool.key}:reference`;
  const videoUploadKey = `${tool.key}:video`;
  const patternRepeatExpandUploadKey = `${tool.key}:expand`;
  const toolModuleConfig = toolModuleConfigs[tool.key] ?? toolModuleConfigs["more-title"];
  const mainUploadConfig = toolModuleConfig.uploads.main;
  const refUploadConfig = toolModuleConfig.uploads.reference;
  const videoUploadConfig = toolModuleConfig.uploads.video;
  const advancedSettingsConfig = toolModuleConfig.advancedSettings;
  const creationModeConfigKey =
    toolModuleConfig.creationModeConfigKey ?? creationModeConfigByToolKey[tool.key] ?? panelKind ?? "default";
  const creationModeConfig = creationModeConfigs[creationModeConfigKey] ?? creationModeConfigs.default;
  const supplementAiPolishConfig = supplementAiPolishConfigs[tool.key];
  const [creationModeSelection, setCreationModeSelection] = useState<CreationModeSelection | null>(null);
  const [advancedSettingValues, setAdvancedSettingValues] = useState<string[]>([]);
  const [advancedSettingSelections, setAdvancedSettingSelections] = useState<AdvancedSelectionMap>({});
  const [targetLanguageValue, setTargetLanguageValue] = useState("");
  const [editingUploadState, setEditingUploadState] = useState<{ fieldKey: string; index: number } | null>(null);
  const isWatermarkManualMode = tool.key === "image-watermark" && advancedSettingSelections.watermarkModeKey === "manual";
  const mainUploadCountLimit = isWatermarkManualMode ? 1 : mainUploadConfig.maxCount ?? uploadCountLimit;
  const refUploadCountLimit = refUploadConfig?.maxCount ?? uploadCountLimit;
  const videoUploadCountLimit = videoUploadConfig?.maxCount ?? uploadCountLimit;
  const mainUploadHint = mainUploadConfig.hintTemplate?.replace("{count}", String(mainUploadCountLimit)) ?? `最多${mainUploadCountLimit}张，支持JPG/PNG/WebP`;
  const mainUploadMeta =
    mainUploadConfig.singleUploadMeta?.replace("{count}", String(mainUploadCountLimit)) ??
    mainUploadConfig.meta?.replace("{count}", String(mainUploadCountLimit));
  const refUploadHint = refUploadConfig?.hintTemplate?.replace("{count}", String(refUploadCountLimit)) ?? `最多${refUploadCountLimit}张，支持JPG/PNG/WebP`;
  const videoUploadHint = videoUploadConfig?.hintTemplate?.replace("{count}", String(videoUploadCountLimit)) ?? `最多${videoUploadCountLimit}个，支持MP4/MOV`;
  const uploadImageCount = uploads[mainUploadKey]?.length ?? 0;
  const referenceUploadCount = uploads[refUploadKey]?.length ?? 0;
  const videoUploadCount = uploads[videoUploadKey]?.length ?? 0;
  const podFusionMetrics = useMemo(() => getPodFusionMetrics(advancedSettingSelections), [advancedSettingSelections]);
  const patternRepeatMetrics = useMemo(() => getPatternRepeatMetrics(advancedSettingSelections), [advancedSettingSelections]);
  const videoStylePrintMetrics = useMemo(() => getVideoStylePrintMetrics(advancedSettingSelections), [advancedSettingSelections]);
  const videoPrintExtendRatioCount = getVideoPrintExtendSelectedRatios(advancedSettingSelections).length;
  const setPackSelectedTypes = useMemo(() => getSetPackSelectedTypes(advancedSettingSelections), [advancedSettingSelections]);
  const setPackTypeCount = Math.max(1, setPackSelectedTypes.length);
  const moreTitleDraftRows = useMemo(() => parseMoreTitleDraftRows(advancedSettingSelections.moreTitleDraftRows), [advancedSettingSelections.moreTitleDraftRows]);
  const moreTitleFilledRowCount = useMemo(
    () =>
      moreTitleDraftRows.filter((row) =>
        [row.productName, row.brand, row.category, row.sellingPoints, row.specs, row.originalTitle].some((value) => value.trim())
      ).length,
    [moreTitleDraftRows]
  );
  const resolvedCreationModeSelection = useMemo<CreationModeSelection | null>(() => {
    const unitCreditCost = getResolvedToolUnitCreditCost(tool.key, creationModeSelection, advancedSettingSelections);
    if (!creationModeSelection) {
      return unitCreditCost > 0
        ? {
            modeId: tool.key,
            modeLabel: tool.panelTitle,
            ratio: tool.ratioLabel ?? "自适应尺寸",
            count: 1,
            unitCreditCost
          }
        : null;
    }

    return {
      ...creationModeSelection,
      unitCreditCost
    };
  }, [advancedSettingSelections, creationModeSelection, tool.key]);
  const batchOutputCount = resolvedCreationModeSelection?.count ?? 1;
  const effectiveSourceCount =
    tool.key === "pod-fusion"
      ? podFusionMetrics.sourceCount
      : tool.key === "video-pattern-repeat" && patternRepeatMetrics.type === "四方连续" && patternRepeatMetrics.createMode === "文生图"
        ? patternRepeatMetrics.promptCount
        : tool.key === "video-style-print" && videoStylePrintMetrics.createMode === "文生图"
          ? videoStylePrintMetrics.promptCount
        : tool.key === "more-title"
          ? moreTitleFilledRowCount
          : uploadImageCount;
  const effectiveReferenceCount = tool.key === "video-print-extend" ? videoPrintExtendRatioCount : referenceUploadCount;
  const generateCost =
    tool.key === "pod-fusion"
      ? effectiveSourceCount * (resolvedCreationModeSelection?.unitCreditCost ?? 0) * batchOutputCount
      : getSpecialToolGenerateCost(
          tool.key,
          effectiveSourceCount,
          effectiveReferenceCount,
          batchOutputCount,
          resolvedCreationModeSelection?.unitCreditCost ?? 0
        );
  const hasRequiredInputs =
    tool.key === "pod-fusion"
      ? podFusionMetrics.isReady
      : tool.key === "video-pattern-repeat"
        ? patternRepeatMetrics.requiresMainUploads
          ? uploadImageCount > 0
          : patternRepeatMetrics.isTextReady
        : tool.key === "video-style-print"
          ? referenceUploadCount > 0 && (videoStylePrintMetrics.requiresMainUploads ? uploadImageCount > 0 : videoStylePrintMetrics.isTextReady)
      : tool.key === "more-title"
        ? moreTitleFilledRowCount > 0
        : uploadImageCount > 0 &&
        (tool.key === "video-print-extend" ? effectiveReferenceCount > 0 : true) &&
        (tool.key === "set-replica" ? referenceUploadCount > 0 : true) &&
        (tool.key === "video-replica" || tool.key === "video-replace" ? videoUploadCount > 0 : true);
  const generateCostLabel = hasRequiredInputs ? `消耗${generateCost}积分` : tool.key === "more-title" ? "待补充商品信息" : "待上传素材";
  const defaultSectionOrderByPanelKind: Record<PanelKind, ToolModuleSectionKey[]> = {
    retouch: ["upload-main", "advanced-settings", "mode-choice", "creation-mode", "supplement"],
    white: ["upload-main", "advanced-settings", "creation-mode"],
    translate: ["upload-main", "advanced-settings", "creation-mode", "supplement"],
    "three-view": ["upload-main", "advanced-settings", "camera-angle", "creation-mode", "supplement"],
    background: ["upload-main", "advanced-settings", "camera-angle", "creation-mode", "supplement", "upload-reference"],
    marketing: ["upload-main", "advanced-settings", "creation-mode", "supplement"],
    basic: ["upload-main", "advanced-settings", "creation-mode", "supplement"]
  };
  const sectionOrder = toolModuleConfig.sectionOrder ?? defaultSectionOrderByPanelKind[panelKind];
  const isAplusTool = tool.key === "set-aplus";
  const isFashionTool = tool.key === "set-fashion";
  const showAplusPlanStep = isAplusTool && aplusPlanStep === 2;
  const showFashionPlanStep = isFashionTool && fashionPlanStep === 2;
  const modelGenerateProtectTarget = modelGenerateProtectTargetByType[advancedSettingSelections.modelGenerateTypeKey ?? ""] ?? "apparel";
  const modelGenerateProtectLabel = modelGenerateProtectTarget === "hair" ? "头发保护区" : "服饰保护区";
  const editingUploadItem = editingUploadState ? uploads[editingUploadState.fieldKey]?.[editingUploadState.index] ?? null : null;
  const effectiveGenerateCostLabel =
    showFashionPlanStep && fashionPlan?.modules.length
      ? (() => {
          const unitCreditCost = getDefaultCreationModeSelection("set-pack", fashionPlan.modules.length)?.unitCreditCost ?? 0;
          const totalCost = fashionPlan.modules.length * unitCreditCost;
          return totalCost > 0 ? `消耗${totalCost}积分` : `共${fashionPlan.modules.length}个场景`;
        })()
      : generateCostLabel;

  useEffect(() => {
    setAdvancedSettingValues([]);
    setAdvancedSettingSelections({});
    setTargetLanguageValue("");
  }, [tool.key]);

  useEffect(() => {
    setAdvancedSettingValues(
      Object.entries(advancedSettingSelections)
        .filter(([key, value]) => Boolean(value) && !key.endsWith("Key") && !key.endsWith(":label"))
        .map(([, value]) => value)
    );
  }, [advancedSettingSelections]);

  useEffect(() => {
    if (!restoredTask || restoredTask.toolKey !== tool.key) return;
    setAdvancedSettingSelections(restoredTask.snapshot.advancedSelections);
    setAdvancedSettingValues(Object.values(restoredTask.snapshot.advancedSelections).filter(Boolean));
    setTargetLanguageValue(restoredTask.snapshot.advancedSelections.targetLanguage ?? "");
  }, [restoredTask, tool.key]);

  useEffect(() => {
    if (!isAplusTool) return;
    onAplusDraftChange(tool.key, {
      generateCost,
      outputCount: Math.max(1, getSetPackSelectedTypes(advancedSettingSelections).length || 1),
      sourceUploads: uploads[mainUploadKey] ?? [],
      referenceUploads: uploads[refUploadKey] ?? [],
      videoUploads: uploads[videoUploadKey] ?? [],
      advancedSelections: advancedSettingSelections,
      supplementValue,
      creationModeSelection: resolvedCreationModeSelection
    });
  }, [
    advancedSettingSelections,
    generateCost,
    isAplusTool,
    mainUploadKey,
    onAplusDraftChange,
    refUploadKey,
    resolvedCreationModeSelection,
    supplementValue,
    tool.key,
    uploads,
    videoUploadKey
  ]);

  const renderSection = (section: ToolModuleSectionKey) => {
    if (section === "upload-main") {
      return (
        <>
          <UploadField
            fieldKey={mainUploadKey}
            hint={mainUploadHint}
            label={mainUploadConfig.label}
            maxCount={mainUploadCountLimit}
            meta={mainUploadMeta}
            onAdd={onAddUpload}
            onAtLimit={onAtLimit}
            onEditItem={
              tool.key === "model-generate"
                ? (fieldKey, index) => {
                    setEditingUploadState({ fieldKey, index });
                  }
                : undefined
            }
            onRefreshItem={
              tool.key === "model-generate"
                ? (fieldKey, index) => {
                    onUpdateUploadItems(fieldKey, (currentItems) =>
                      currentItems.map((item, currentIndex) =>
                        currentIndex === index && item.src
                          ? {
                              ...item,
                              maskDataUrl: createAutoProtectMaskDataUrl(item.src, modelGenerateProtectTarget),
                              maskLabel: modelGenerateProtectLabel
                            }
                          : item
                      )
                    );
                  }
                : undefined
            }
            onOpenLibrary={onOpenLibrary}
            onRejectedUpload={onRejectedUpload}
            onRemove={onRemoveUpload}
            remainingStorageMb={remainingStorageMb}
            required={mainUploadConfig.required}
            values={uploads[mainUploadKey] ?? []}
          />
        </>
      );
    }

    if (section === "model-generate-setup") {
      return toolModuleConfig.modelGenerateTypes?.length ? (
        <ModelGenerateTypeSection
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["modelGenerateTypeKey", "modelGenerateType"];
            const nextTypeKey = values.modelGenerateTypeKey ?? advancedSettingSelections.modelGenerateTypeKey ?? toolModuleConfig.modelGenerateTypes?.[0]?.key ?? "";
            const nextTarget = modelGenerateProtectTargetByType[nextTypeKey] ?? "apparel";
            const nextMaskLabel = nextTarget === "hair" ? "头发保护区" : "服饰保护区";
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
            if (tool.key === "model-generate") {
              onUpdateUploadItems(mainUploadKey, (currentMainUploads) => {
                if (!currentMainUploads.length) return currentMainUploads;
                return currentMainUploads.map((item) => ({
                  ...item,
                  maskLabel: nextMaskLabel,
                  maskDataUrl: item.status === "ready" && item.src ? createAutoProtectMaskDataUrl(item.src, nextTarget) : item.maskDataUrl
                }));
              });
            }
          }}
          selectedValues={advancedSettingSelections}
          types={toolModuleConfig.modelGenerateTypes}
        />
      ) : null;
    }

    if (section === "model-generate-parameters") {
      return toolModuleConfig.modelGenerateTypes?.length ? (
        <ModelGenerateFeatureSection
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["gender", "appearance", "age", "persona", "bodyType", "scene"];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          selectedValues={advancedSettingSelections}
        />
      ) : null;
    }

    if (section === "advanced-settings") {
      return advancedSettingsConfig ? (
        <AdvancedSettingsSection
          config={advancedSettingsConfig}
          onAiAssist={async () => {
            const creationModeValues = dedupeStrings([
              resolvedCreationModeSelection?.modeLabel ?? "",
              resolvedCreationModeSelection?.ratio ?? "",
              resolvedCreationModeSelection?.resolution ?? "",
              resolvedCreationModeSelection?.count ? `${resolvedCreationModeSelection.count}张` : ""
            ]);
            const nextAssistResult = await onSupplementAiAssist(tool.key, uploads[mainUploadKey] ?? [], advancedSettingsConfig, {
              advancedValues: advancedSettingValues,
              creationModeValues
            });
            if (!nextAssistResult) {
              onToast("请先上传商品图后再使用AI帮写", "warning");
              return null;
            }
            if (nextAssistResult.supplementValue) {
              onSupplementChange(tool.key, nextAssistResult.supplementValue);
            }
            onToast("已帮您完成高级设置写入，请核对");
            return nextAssistResult;
          }}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = [
              ...advancedSettingsConfig.fields,
              ...(advancedSettingsConfig.extraSelects ?? []).map((item) => item.key),
              "platformRuleDetail"
            ];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          selectedValues={advancedSettingSelections}
        />
      ) : null;
    }

    if (section === "more-title-setup" && tool.key === "more-title") {
      return (
        <MoreTitleSetupSection
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["moreTitleDraftRows", "moreTitleRowCount"];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          onToast={onToast}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "set-pack-strategy" && isSetPackLikeTool(tool.key)) {
      return (
        <SetPackStrategySection
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["platform", "region", "targetMarket", "language", "copyLanguage", "setPackVisualStyle"];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "set-pack-selling-points" && isSetPackLikeTool(tool.key)) {
      return (
        <SetPackSellingPointsSection
          onSelectionChange={(values) => {
            setAdvancedSettingValues((current) => dedupeStrings([...current, ...values]));
          }}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["setPackProductName", "setPackSellingPoints", "setPackAudience", "setPackScenario", "setPackParameters"];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          onToast={onToast}
          selectedValues={advancedSettingSelections}
          uploads={uploads[mainUploadKey] ?? []}
        />
      );
    }

    if (section === "set-pack-type-selector" && isSetPackLikeTool(tool.key)) {
      return (
        <SetPackTypeSection
          globalRatio={resolvedCreationModeSelection?.ratio ?? "1:1"}
          toolKey={tool.key}
          onSelectionChange={(values) => {
            setAdvancedSettingValues((current) => dedupeStrings([...current, ...values]));
          }}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["setPackSelectedTypes", "setPackSelectedTypeNames", "setPackSavedTypeTemplates"];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          onToast={onToast}
          perTypeCount={Math.max(1, Math.round((resolvedCreationModeSelection?.count ?? setPackTypeCount) / setPackTypeCount))}
          selectedValues={advancedSettingSelections}
          uploads={uploads[mainUploadKey] ?? []}
        />
      );
    }

    if (section === "set-pack-style-analysis" && tool.key === "set-main") {
      return (
        <SetPackStyleAnalysisSection
          onSelectionChange={(values) => {
            setAdvancedSettingValues((current) => dedupeStrings([...current, ...values]));
          }}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["setPackStyleCards", "setPackSelectedStyleIds", "setPackSelectedStyleNames"];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          onToast={onToast}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "model-change-action") {
      return toolModuleConfig.modelAdjustActions?.length ? (
        <ModelAdjustSection
          actions={toolModuleConfig.modelAdjustActions}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const modelAdjustActions = toolModuleConfig.modelAdjustActions ?? [];
            const sectionKeys = [
              "modelAdjustActionKey",
              "modelAdjustAction",
              ...modelAdjustActions.flatMap((action) => [`${action.key}:label`, `${action.key}:value`])
            ];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          onSupplementAiPolish={(value) =>
            onSupplementAiPolish(tool.key, value, {
              advancedValues: advancedSettingValues,
              creationModeValues: dedupeStrings([
                resolvedCreationModeSelection?.modeLabel ?? "",
                resolvedCreationModeSelection?.ratio ?? "",
                resolvedCreationModeSelection?.resolution ?? ""
              ])
            })
          }
          onSupplementChange={(value) => onSupplementChange(tool.key, value)}
          onToast={onToast}
          selectedValues={advancedSettingSelections}
          supplementValue={supplementValue}
          toolKey={tool.key}
        />
      ) : null;
    }

    if (section === "baseline-model-setup" && tool.key === "set-fashion") {
      return (
        <BaselineModelSection
          modelAssets={modelAssets}
          onGenerateBaselineModel={onGenerateBaselineModel}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = [
              "baselineModelSource",
              "selectedModelId",
              "selectedModelName",
              "modelGenerateTypeKey",
              "modelGenerateType",
              "gender",
              "appearance",
              "age",
              "persona",
              "bodyType",
              "baselineModelSupplement"
            ];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          onUploadModels={onUploadModels}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "model-try-setup") {
      const isFashionTryTool = tool.key === "set-fashion";
      return (
        <ModelTrySetupSection
          modelAssets={modelAssets}
          toolKey={tool.key}
          onAddUpload={onAddUpload}
          onAtLimit={onAtLimit}
          onGenerateBaselineModel={onGenerateBaselineModel}
          onOpenLibrary={onOpenLibrary}
          onRejectedUpload={onRejectedUpload}
          onRemoveUpload={onRemoveUpload}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = [
              "trialMode",
              "modelTryModelSource",
              "selectedModelId",
              "selectedModelName",
              "modelGenerateTypeKey",
              "modelGenerateType",
              "gender",
              "appearance",
              "age",
              "persona",
              "bodyType",
              "baselineModelSupplement",
              "ethnicity",
              "genderSpecies",
              "ageRange"
            ];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          onUploadModels={onUploadModels}
          remainingStorageMb={remainingStorageMb}
          selectedValues={advancedSettingSelections}
          showTrialMode={!isFashionTryTool}
          uploadFieldHint={isFashionTryTool ? "最多5张，请上传同一件衣服不同视角图" : undefined}
          uploadFieldLabel={isFashionTryTool ? "上传服装图片" : "上传商品图"}
          uploadFieldMeta={isFashionTryTool ? "（单次最多上传5张）" : undefined}
          uploadLimitOverride={isFashionTryTool ? 5 : undefined}
          uploads={uploads}
        />
      );
    }

    if (section === "target-language") {
      return (
        <InputSelectInlineField
          dropdownWidth={208}
          label="目标语言"
          labelNoWrap
          onChange={(value) => {
            setTargetLanguageValue(value);
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              if (value) {
                nextSelections.targetLanguage = value;
              } else {
                delete nextSelections.targetLanguage;
              }
              setAdvancedSettingValues(Object.values(nextSelections).filter(Boolean));
              return nextSelections;
            });
          }}
          options={targetLanguageInputOptions}
          placeholder="请选择，或直接输入"
          required
          value={targetLanguageValue}
        />
      );
    }

    if (section === "applicable-platform") {
      return toolModuleConfig.applicablePlatform ? <ApplicablePlatformSection /> : null;
    }

    if (section === "generation-rule-notice" && tool.key === "set-replica") {
      return <GenerationRuleNoticeSection batchCount={batchOutputCount} productCount={uploadImageCount} referenceCount={referenceUploadCount} />;
    }

    if (section === "pod-crop-mode" && tool.key === "pod-crop") {
      return (
        <PodCropModeSection
          onCreationModeChange={setCreationModeSelection}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            setAdvancedSettingSelections((current) => ({
              ...current,
              ...values
            }));
          }}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "pod-extract-setup" && tool.key === "pod-extract") {
      return (
        <PodExtractSetupSection
          onCreationModeChange={setCreationModeSelection}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            setAdvancedSettingSelections((current) => ({
              ...current,
              ...values
            }));
          }}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "pod-partial-edit-setup" && tool.key === "pod-partial-edit") {
      return (
        <PodPartialEditSetupSection
          onAddUpload={onAddUpload}
          onCreationModeChange={setCreationModeSelection}
          onOpenLibrary={onOpenLibrary}
          onRemoveUpload={onRemoveUpload}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = [
              "podPartialEditCategory",
              "podPartialEditRequirement",
              "podPartialEditFieldValues",
              "podPartialEditInstructionText",
              "podPartialEditOutputCount"
            ];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          referenceFieldKey={refUploadKey}
          referenceUploads={uploads[refUploadKey] ?? []}
          remainingStorageMb={remainingStorageMb}
          selectedValues={advancedSettingSelections}
          uploads={uploads[mainUploadKey] ?? []}
        />
      );
    }

    if (section === "pod-fusion-setup" && tool.key === "pod-fusion") {
      return (
        <PodFusionSetupSection
          onCreationModeChange={setCreationModeSelection}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = [
              "podFusionMode",
              "podFusionStyle",
              "podFusionBackground",
              "podFusionRatio",
              "podFusionOutputCount",
              "podFusionPairGroups",
              "podFusionOneToManySelection"
            ];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "video-pattern-repeat-setup" && tool.key === "video-pattern-repeat") {
      return (
        <PatternRepeatSetupSection
          onAddUpload={onAddUpload}
          onAtLimit={onAtLimit}
          onCreationModeChange={setCreationModeSelection}
          onOpenLibrary={onOpenLibrary}
          onRejectedUpload={onRejectedUpload}
          onRemoveUpload={onRemoveUpload}
          onSelectionChange={setAdvancedSettingValues}
          onUpdateUploadItems={onUpdateUploadItems}
          onSelectionMapChange={(values) => {
            const sectionKeys = [
              "patternRepeatType",
              "patternRepeatCreateMode",
              "patternRepeatGenerateMode",
              "patternRepeatRatio",
              "patternRepeatOutputCount",
              "patternRepeatDensityLevel",
              "patternRepeatPrompts"
            ];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          remainingStorageMb={remainingStorageMb}
          selectedValues={advancedSettingSelections}
          uploads={uploads}
        />
      );
    }

    if (section === "pod-variation-setup" && tool.key === "pod-variation") {
      return (
        <PodVariationSetupSection
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = [
              "podVariationCategory",
              "podVariationMode",
              "podVariationReferenceStyleLevel",
              "podVariationReferenceStrength",
              "podVariationDivergenceLevel",
              "podVariationBackgroundColor",
              "podVariationBurstContent",
              "podVariationContent",
              "podVariationGraphicStyle",
              "podVariationVariationDimension",
              "podVariationClockMode",
              "podVariationClockDialStyle",
              "podVariationClockGenerateMethod",
              "podVariationRatio",
              "podVariationTinEffectSource",
              "podVariationTinEffectPreset",
              "podVariationShape",
              "podVariationOutputCount"
            ];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          uploads={uploads[mainUploadKey] ?? []}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "video-scene-grid-setup" && tool.key === "video-scene-grid") {
      return (
        <VideoSceneGridSetupSection
          onCreationModeChange={setCreationModeSelection}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = [
              "videoSceneGridMode",
              "videoSceneGridVariation",
              "videoSceneGridDetailDimensions",
              "videoSceneGridRatio",
              "videoSceneGridOutputCount",
              "videoSceneGridUnitCreditCost",
              "videoSceneGridTotalCreditCost"
            ];
            setAdvancedSettingSelections((current) => {
              const isSame = sectionKeys.every((key) => (current[key] ?? "") === (values[key] ?? ""));
              if (isSame) return current;
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          selectedValues={advancedSettingSelections}
          uploadCount={uploads[mainUploadKey]?.length ?? 0}
        />
      );
    }

    if (section === "video-print-extend-setup" && tool.key === "video-print-extend") {
      return (
        <VideoPrintExtendSetupSection
          onCreationModeChange={setCreationModeSelection}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = [
              "videoPrintExtendSelectedRatios",
              "videoPrintExtendOutputCount",
              "videoPrintExtendRatioCount",
              "videoPrintExtendTotalResultCount",
              "videoPrintExtendUnitCreditCost",
              "videoPrintExtendTotalCreditCost"
            ];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          selectedValues={advancedSettingSelections}
          uploadCount={uploads[mainUploadKey]?.length ?? 0}
        />
      );
    }

    if (section === "video-style-print-setup" && tool.key === "video-style-print") {
      return (
        <VideoStylePrintSetupSection
          onAddUpload={onAddUpload}
          onAtLimit={onAtLimit}
          onCreationModeChange={setCreationModeSelection}
          onOpenLibrary={onOpenLibrary}
          onRejectedUpload={onRejectedUpload}
          onRemoveUpload={onRemoveUpload}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = [
              "videoStylePrintCreateMode",
              "videoStylePrintRatio",
              "videoStylePrintOutputCount",
              "videoStylePrintPrompts"
            ];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          remainingStorageMb={remainingStorageMb}
          selectedValues={advancedSettingSelections}
          uploads={uploads}
        />
      );
    }

    if (section === "video-2d3d-setup" && tool.key === "video-2d3d") {
      return (
        <Video2d3dSetupSection
          onCreationModeChange={setCreationModeSelection}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["video2d3dStyleCategory", "video2d3dStyle", "video2d3dRatio", "video2d3dOutputCount"];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "video-replica-setup" && (tool.key === "video-main" || tool.key === "video-replica" || tool.key === "video-replace")) {
      return (
        <VideoReplicaSetupSection
          toolKey={tool.key}
          onCreationModeChange={setCreationModeSelection}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            setAdvancedSettingSelections((current) => ({
              ...current,
              ...values
            }));
          }}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "video-main-script-setup" && tool.key === "video-main") {
      return (
        <VideoMainScriptSetupSection
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = [
              "videoMainScriptMode",
              "videoMainScriptModeLabel",
              "videoMainSellingPoint",
              "videoMainType",
              "videoMainMarketingNeed",
              "videoMainRhythm",
              "videoMainMusicMood",
              "videoMainVisualStyle",
              "videoMainAudience",
              "videoMainCharacterFit",
              "videoMainVoiceEnabled",
              "videoMainVoiceLanguage",
              "videoMainVoiceTone",
              "videoMainVoiceCopy"
            ];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          onSupplementAiPolish={(value) =>
            onSupplementAiPolish(tool.key, value, {
              advancedValues: advancedSettingValues,
              creationModeValues: dedupeStrings([
                resolvedCreationModeSelection?.modeLabel ?? "",
                resolvedCreationModeSelection?.ratio ?? "",
                resolvedCreationModeSelection?.resolution ?? ""
              ])
            })
          }
          onSupplementChange={(value) => onSupplementChange(tool.key, value)}
          onToast={onToast}
          uploads={uploads[mainUploadKey] ?? []}
          selectedValues={advancedSettingSelections}
          supplementValue={supplementValue}
          toolKey={tool.key}
        />
      );
    }

    if (section === "creation-mode") {
      return (
        <CreationModeSection
          config={creationModeConfig}
          onSelectionChange={setCreationModeSelection}
          typeCountMultiplier={isSetPackLikeTool(tool.key) ? setPackTypeCount : 1}
          value={restoredTask?.toolKey === tool.key ? restoredTask.snapshot.creationModeSelection : null}
        />
      );
    }

    if (section === "supplement") {
      const supplementFormBlockClassName =
        tool.key === "video-replica"
          ? "ck-form-block ck-set-pack-selling-points ck-video-replica-supplement"
          : tool.key === "video-replace"
            ? "ck-form-block ck-set-pack-selling-points ck-video-script-detail"
          : tool.key === "image-expand"
            ? "ck-form-block ck-set-pack-selling-points ck-video-script-detail"
          : tool.key === "model-adjust"
            ? "ck-form-block ck-set-pack-selling-points ck-model-input-detail"
            : undefined;

      return creationModeConfig.showSupplement ? (
        <>
          {tool.key === "more-title" ? (
            <MoreTitleConstraintsSection
              onSelectionChange={setAdvancedSettingValues}
              onSelectionMapChange={(values) => {
                const sectionKeys = ["moreTitleMustInclude", "moreTitleBannedTerms"];
                setAdvancedSettingSelections((current) => {
                  const nextSelections = { ...current };
                  sectionKeys.forEach((key) => {
                    delete nextSelections[key];
                  });
                  return { ...nextSelections, ...values };
                });
              }}
              selectedValues={advancedSettingSelections}
            />
          ) : null}
          <SupplementField
            aiPolishConfig={supplementAiPolishConfig}
            formBlockClassName={supplementFormBlockClassName}
            label={creationModeConfig.supplementLabel}
            maxLength={creationModeConfig.supplementMaxLength}
            onAiPolish={(value) =>
              onSupplementAiPolish(tool.key, value, {
                advancedValues: advancedSettingValues,
                creationModeValues: dedupeStrings([
                  resolvedCreationModeSelection?.modeLabel ?? "",
                  resolvedCreationModeSelection?.ratio ?? "",
                  resolvedCreationModeSelection?.resolution ?? "",
                  resolvedCreationModeSelection?.count ? `${resolvedCreationModeSelection.count}张` : ""
                ])
              })
            }
            onChange={(value) => onSupplementChange(tool.key, value)}
            onToast={onToast}
            placeholder={supplementPlaceholderOverrides[tool.key] ?? creationModeConfig.supplementPlaceholder}
            value={supplementValue}
          />
        </>
      ) : null;
    }

    if (section === "mode-choice" && panelKind === "retouch") {
      return <RetouchModeSection />;
    }

    if (section === "mode-choice" && tool.key === "image-watermark") {
      return (
        <WatermarkModeSection
          uploads={uploads[mainUploadKey] ?? []}
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["watermarkModeKey", "watermarkMode"];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          onToast={onToast}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "image-upscale-resolution" && tool.key === "image-upscale") {
      return (
        <UpscaleResolutionSection
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["upscaleResolution"];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "image-lineart-style" && tool.key === "image-lineart") {
      return (
        <LineartStyleSection
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["lineartStyle"];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          selectedValues={advancedSettingSelections}
        />
      );
    }

    if (section === "mask-draw" && tool.key === "image-watermark") {
      if (advancedSettingSelections.watermarkModeKey !== "manual") {
        return null;
      }
      return (
        <MaskDrawSection
          buttonText="开始涂抹"
          helperText="仅支持单张图片。建议沿水印边缘涂抹，便于更精准去除。"
          maskKey="watermarkMaskDataUrl"
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["watermarkMaskDataUrl"];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          onToast={onToast}
          selectedValues={advancedSettingSelections}
          singleUploadOnly
          uploads={uploads[mainUploadKey] ?? []}
        />
      );
    }

    if (section === "mask-draw" && tool.key === "image-remove") {
      return (
        <MaskDrawSection
          buttonText="开始涂抹"
          helperText="标注需要消除的物体区域，处理结果会更自然。"
          maskKey="removeMaskDataUrl"
          onSelectionChange={setAdvancedSettingValues}
          onSelectionMapChange={(values) => {
            const sectionKeys = ["removeMaskDataUrl"];
            setAdvancedSettingSelections((current) => {
              const nextSelections = { ...current };
              sectionKeys.forEach((key) => {
                delete nextSelections[key];
              });
              return { ...nextSelections, ...values };
            });
          }}
          onToast={onToast}
          selectedValues={advancedSettingSelections}
          uploads={uploads[mainUploadKey] ?? []}
        />
      );
    }

    if (section === "camera-angle" && (panelKind === "three-view" || panelKind === "background")) {
      if (tool.key === "goods-view") {
        return (
          <RichSelectField
            fullWidth
            label="拍摄视角"
            onChange={(value) => {
              setAdvancedSettingSelections((current) => {
                const nextSelections = { ...current };
                if (value) {
                  nextSelections.cameraAngle = value;
                } else {
                  delete nextSelections.cameraAngle;
                }
                setAdvancedSettingValues(Object.values(nextSelections).filter(Boolean));
                return nextSelections;
              });
            }}
            options={cameraAngleOptions}
            placeholder="请选择"
            required
            value={advancedSettingSelections.cameraAngle}
          />
        );
      }

      return <SelectField label="拍摄视角" placeholder="请选择" required />;
    }

    if (section === "upload-reference" && refUploadConfig) {
      if (tool.key === "pod-partial-edit" && normalizePodPartialEditRequirement(advancedSettingSelections.podPartialEditRequirement) !== "服饰贴纹理") {
        return null;
      }
      return (
        <ReferenceUploadSection
          config={refUploadConfig}
          fieldKey={refUploadKey}
          hint={refUploadHint}
          maxCount={refUploadCountLimit}
          onAdd={onAddUpload}
          onAtLimit={onAtLimit}
          onOpenLibrary={onOpenLibrary}
          onRejectedUpload={onRejectedUpload}
          onRemove={onRemoveUpload}
          remainingStorageMb={remainingStorageMb}
          values={uploads[refUploadKey] ?? []}
        />
      );
    }

    if (section === "upload-video" && videoUploadConfig) {
      return (
        <UploadVideoField
          fieldKey={videoUploadKey}
          hint={videoUploadHint}
          label={videoUploadConfig.label}
          maxCount={videoUploadCountLimit}
          maxDurationSeconds={videoUploadConfig.maxDurationSeconds}
          maxFileSizeMb={videoUploadConfig.maxFileSizeMb}
          meta={videoUploadConfig.singleUploadMeta?.replace("{count}", String(videoUploadCountLimit)) ?? videoUploadConfig.meta}
          minDurationSeconds={videoUploadConfig.minDurationSeconds}
          onAdd={onAddUpload}
          onAtLimit={onAtLimit}
          onOpenLibrary={onOpenLibrary}
          onRejectedUpload={onRejectedUpload}
          onRemove={onRemoveUpload}
          optional={videoUploadConfig.optional}
          remainingStorageMb={remainingStorageMb}
          required={videoUploadConfig.required}
          values={uploads[videoUploadKey] ?? []}
        />
      );
    }

    return null;
  };

  const renderFields = () => {
    return (
      <>
        {sectionOrder.map((section) => (
          <div key={`${tool.key}:${section}`}>{renderSection(section)}</div>
        ))}
      </>
    );
  };

  const resolvedSupplementValue =
    tool.key === "image-expand"
      ? buildImageExpandPrompt({
          sourceUploads: uploads[mainUploadKey] ?? [],
          referenceUploads: uploads[refUploadKey] ?? [],
          supplementValue,
          creationModeSelection: resolvedCreationModeSelection
        })
      : tool.key === "video-replace"
      ? buildVideoReplacePrompt({
          sourceUploads: uploads[mainUploadKey] ?? [],
          videoUploads: uploads[videoUploadKey] ?? [],
          supplementValue,
          creationModeSelection: resolvedCreationModeSelection,
          advancedSelections: advancedSettingSelections
        })
      : tool.key === "video-replica"
        ? buildVideoReplicaPrompt({
            sourceUploads: uploads[mainUploadKey] ?? [],
            videoUploads: uploads[videoUploadKey] ?? [],
            supplementValue,
            creationModeSelection: resolvedCreationModeSelection,
            advancedSelections: advancedSettingSelections
          })
      : tool.key === "goods-buyer"
      ? buildGoodsBuyerPromptAssembly(advancedSettingSelections, supplementValue).prompt
      : supplementValue;

  const resolvedAdvancedSelections =
    tool.key === "image-expand"
      ? {
          ...advancedSettingSelections,
          imageExpandPromptSummary: buildImageExpandPromptSummary({
            sourceUploads: uploads[mainUploadKey] ?? [],
            referenceUploads: uploads[refUploadKey] ?? [],
            supplementValue,
            creationModeSelection: resolvedCreationModeSelection
          }),
          imageExpandSystemPrompt: imageExpandSystemPrompt,
          imageExpandUserPrompt: buildImageExpandUserPrompt({
            sourceUploads: uploads[mainUploadKey] ?? [],
            referenceUploads: uploads[refUploadKey] ?? [],
            supplementValue,
            creationModeSelection: resolvedCreationModeSelection
          }),
          imageExpandUserDescription: supplementValue.trim()
        }
      : tool.key === "video-replace"
      ? {
          ...advancedSettingSelections,
          videoReplacePromptSummary: buildVideoReplacePromptSummary({
            sourceUploads: uploads[mainUploadKey] ?? [],
            videoUploads: uploads[videoUploadKey] ?? [],
            supplementValue,
            creationModeSelection: resolvedCreationModeSelection,
            advancedSelections: advancedSettingSelections
          }),
          videoReplaceUserDescription: supplementValue.trim()
        }
      : tool.key === "video-replica"
        ? {
            ...advancedSettingSelections,
            videoReplicaPromptSummary: buildVideoReplicaPromptSummary({
              sourceUploads: uploads[mainUploadKey] ?? [],
              videoUploads: uploads[videoUploadKey] ?? [],
              supplementValue,
              creationModeSelection: resolvedCreationModeSelection,
              advancedSelections: advancedSettingSelections
            }),
            videoReplicaUserDescription: supplementValue.trim()
          }
      : tool.key === "goods-buyer"
        ? {
            ...advancedSettingSelections,
            productCategory: normalizeGoodsBuyerCategoryByAliases(advancedSettingSelections.productType),
            goodsBuyerPrompt: buildGoodsBuyerPromptAssembly(advancedSettingSelections, supplementValue).prompt
          }
      : tool.key === "more-title"
        ? {
            ...advancedSettingSelections,
            moreTitleOperatorNote: supplementValue.trim(),
            moreTitleGeneratedRows: JSON.stringify(
              buildMoreTitleGeneratedRows({
                ...advancedSettingSelections,
                moreTitleOperatorNote: supplementValue.trim()
              })
            )
          }
      : advancedSettingSelections;

  const handleGenerateClick = () => {
    if (tool.key === "set-main" && isGeneratingLocked) {
      onToast("当前套图仍在生成中，请等待全部结果完成后再继续提交", "warning");
      return;
    }

    if (tool.key === "pod-fusion" && !podFusionMetrics.isReady) {
      onToast("请先完成素材配对或补充融合素材后再生成", "warning");
      return;
    }

    if (tool.key === "video-pattern-repeat" && !hasRequiredInputs) {
      onToast(
        patternRepeatMetrics.requiresMainUploads ? "请先添加素材后再生成" : "请至少填写一条提示词或导入一张反推图片后再生成",
        "warning"
      );
      return;
    }

    if (tool.key === "video-style-print" && !hasRequiredInputs) {
      onToast(
        referenceUploadCount <= 0
          ? "请先添加风格后再生成"
          : videoStylePrintMetrics.requiresMainUploads
            ? "请先添加素材后再生成"
            : "请至少填写一条提示词后再生成",
        "warning"
      );
      return;
    }

    if (
      !uploadImageCount &&
      tool.key !== "more-title" &&
      tool.key !== "pod-fusion" &&
      !(tool.key === "video-pattern-repeat" && !patternRepeatMetrics.requiresMainUploads) &&
      !(tool.key === "video-style-print" && !videoStylePrintMetrics.requiresMainUploads)
    ) {
      onToast("请先上传商品图后再生成", "warning");
      return;
    }

    if (tool.key === "set-replica" && !referenceUploadCount) {
      onToast("请先上传参考图后再生成", "warning");
      return;
    }

    if (tool.key === "video-print-extend" && !effectiveReferenceCount) {
      onToast("请至少选择一个延展比例后再生成", "warning");
      return;
    }

    if ((tool.key === "video-replica" || tool.key === "video-replace") && !videoUploadCount) {
      onToast("请先上传视频后再生成", "warning");
      return;
    }

    const outputCount =
      tool.key === "pod-fusion"
        ? podFusionMetrics.sourceCount * batchOutputCount
        : getSpecialToolOutputCount(tool.key, uploadImageCount, effectiveReferenceCount, batchOutputCount);
    const payload = {
      generateCost,
      outputCount,
      sourceUploads:
        tool.key === "pod-fusion"
          ? podFusionMetrics.payloadUploads
          : tool.key === "video-pattern-repeat" && patternRepeatMetrics.type === "四方连续" && patternRepeatMetrics.createMode === "文生图"
            ? patternRepeatMetrics.promptItems.flatMap((item) => (item.reverseImage ? [item.reverseImage] : []))
            : tool.key === "video-pattern-repeat" && patternRepeatMetrics.type === "扩大画幅"
              ? uploads[patternRepeatExpandUploadKey] ?? []
            : tool.key === "video-style-print" && videoStylePrintMetrics.createMode === "文生图"
              ? []
            : tool.key === "more-title"
              ? []
            : uploads[mainUploadKey] ?? [],
      referenceUploads: uploads[refUploadKey] ?? [],
      videoUploads: uploads[videoUploadKey] ?? [],
      advancedSelections: resolvedAdvancedSelections,
      supplementValue: resolvedSupplementValue,
      creationModeSelection: resolvedCreationModeSelection
    } satisfies GeneratePayload;

    if (isAplusTool) {
      onGenerateAplusPlan(tool, payload);
      return;
    }

    if (isFashionTool) {
      onGenerateFashionScenes(tool, payload);
      return;
    }

    onGenerate(tool, payload);
  };

  return (
    <section
      className={`ck-panel ck-panel-tool-${tool.key}${tool.key.startsWith("goods-") ? " ck-panel-ai-goods" : ""}${isSetPackLikeTool(tool.key) ? " ck-panel-set-pack" : ""}${showAplusPlanStep || showFashionPlanStep ? " ck-panel-step-layout" : ""}`}
    >
      {showAplusPlanStep ? (
        <AplusPlanEditorSection
          onBack={onBackAplusStep}
          onDeleteModule={onDeleteAplusModule}
          onGenerate={onGenerateAplusDetails}
          generateCostLabel={generateCostLabel}
          onMoveModule={onMoveAplusModule}
          onUpdateModule={onUpdateAplusModule}
          plan={aplusPlan}
          stale={aplusPlanStale}
        />
      ) : showFashionPlanStep ? (
        <FashionSceneEditorSection
          generateCostLabel={effectiveGenerateCostLabel}
          onBack={onBackFashionStep}
          onDeleteModule={onDeleteFashionScene}
          onGenerate={onGenerateFashionResults}
          onMoveModule={onMoveFashionScene}
          onUpdateModule={onUpdateFashionScene}
          plan={fashionPlan}
          stale={fashionPlanStale}
        />
      ) : (
        <>
          <div className="ck-panel-scroll">
            <div className="ck-panel-title">{tool.panelTitle}</div>
            {renderFields()}
          </div>
          {tool.key === "model-generate" && editingUploadItem?.src ? (
            <MaskEditorModal
              autoTargetLabel={modelGenerateProtectLabel}
              imageSrc={editingUploadItem.src}
              initialMaskDataUrl={editingUploadItem.maskDataUrl}
              onClose={() => setEditingUploadState(null)}
              onSave={(nextMaskDataUrl) => {
                if (!editingUploadState) return;
                onUpdateUploadItems(editingUploadState.fieldKey, (currentItems) =>
                  currentItems.map((item, currentIndex) =>
                    currentIndex === editingUploadState.index
                      ? {
                          ...item,
                          maskDataUrl: nextMaskDataUrl,
                          maskLabel: modelGenerateProtectLabel
                        }
                      : item
                  )
                );
                setEditingUploadState(null);
              }}
            />
          ) : null}

          <div className="ck-panel-footer">
            <button className={`ck-generate-btn${isFashionTool ? " fashion-step-btn" : ""}`} disabled={tool.key === "set-main" && isGeneratingLocked} onClick={handleGenerateClick} type="button">
              {isAplusTool || isFashionTool ? null : <img alt="" className="ck-generate-icon" src={figmaIcons.generateButton} />}
              <span>
                {tool.key === "set-main" && isGeneratingLocked
                  ? "套图生成中..."
                  : isAplusTool
                    ? "生成详情页规划方案"
                    : isFashionTool
                      ? "生成推荐场景"
                      : tool.key === "more-title"
                        ? "生成标题方案"
                        : "立即生成"}
              </span>
              {isAplusTool || isFashionTool ? null : (
                <em>
                  {tool.key === "set-main" && isGeneratingLocked
                    ? "请等待当前任务完成"
                    : generateCostLabel}
                </em>
              )}
            </button>
            <div className="ck-agreement">
              使用创客贴AI创作服务表示您已同意 <a href="/">《AI创作服务协议》</a>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function ResultPanel({
  collapsed,
  tool,
  activeTab,
  items,
  onDownload,
  onDownloadItem,
  onOpenCase,
  onApplyCase,
  onRetry,
  onDeleteFailed,
  onCancelQueued,
  onTabChange,
  onToggleItem,
  onToggleSelectAll,
  selectedTask,
  onGenerateSetPackTitles,
  onApplySetPackTitle,
  onApplyMoreTitleCandidate,
  onChangeMoreTitleFinal,
  onCopyMoreTitleTask,
  onExportMoreTitleTask,
  onPreviewItem,
  onEditItemText,
  onOpenDetail
}: {
  collapsed: boolean;
  tool: ToolConfig;
  activeTab: ResultTabKey;
  items: ResultItem[];
  onDownload: (tool: ToolConfig) => void;
  onDownloadItem: (item: ResultItem) => void;
  onOpenCase: (template: CaseTemplate) => void;
  onApplyCase: (template: CaseTemplate) => void;
  onRetry: (toolKey: string, itemId: string) => void;
  onDeleteFailed: (toolKey: string, itemId: string) => void;
  onCancelQueued: (toolKey: string, itemId: string) => void;
  onTabChange: (toolKey: string, tab: ResultTabKey) => void;
  onToggleItem: (toolKey: string, itemId: string) => void;
  onToggleSelectAll: (toolKey: string, checked: boolean) => void;
  selectedTask?: TaskRecord | null;
  onGenerateSetPackTitles: (taskId: string) => void;
  onApplySetPackTitle: (taskId: string, title: string) => void;
  onApplyMoreTitleCandidate: (taskId: string, rowId: string, candidateIndex: number) => void;
  onChangeMoreTitleFinal: (taskId: string, rowId: string, value: string) => void;
  onCopyMoreTitleTask: (taskId: string) => void;
  onExportMoreTitleTask: (taskId: string) => void;
  onPreviewItem: (item: ResultItem) => void;
  onEditItemText: (item: ResultItem) => void;
  onOpenDetail: (item: ResultItem) => void;
}) {
  const caseCollection = useMemo(() => createCaseCollection(tool), [tool]);
  const showCaseTab = !tool.key.startsWith("image-") && tool.key !== "more-title";
  const effectiveActiveTab: ResultTabKey = showCaseTab ? activeTab : "results";
  const readyItems = useMemo(() => items.filter((item) => item.status === "ready"), [items]);
  const selectedReadyCount = useMemo(() => readyItems.filter((item) => item.selected).length, [readyItems]);
  const allReadySelected = readyItems.length > 0 && readyItems.every((item) => item.selected);
  const resultCountText = `(${items.length})`;
  const downloadDisabled = effectiveActiveTab !== "results" || selectedReadyCount === 0;
  const showEmptyState = effectiveActiveTab === "results" && items.length === 0;
  const showNoMore = effectiveActiveTab === "results" && items.length > 0;
  const isNarrow = collapsed;
  const [setPackTitlePopoverOpen, setSetPackTitlePopoverOpen] = useState(false);
  const setPackTitleCandidates = safeParseJson<string[]>(selectedTask?.snapshot.advancedSelections.setPackTitleCandidates, []) ?? [];
  const selectedSetPackTitle = selectedTask?.snapshot.advancedSelections.setPackSelectedTitle ?? "";
  const canGenerateSetPackTitles = tool.key === "set-main" && Boolean(selectedTask?.taskId) && effectiveActiveTab === "results";
  const isMoreTitleTool = tool.key === "more-title";

  return (
    <section className={`ck-results ck-results-tool-${tool.key}`}>
      <div className="ck-results-toolbar">
        <div className="ck-result-tabs">
          <button className={effectiveActiveTab === "results" ? "active" : ""} onClick={() => onTabChange(tool.key, "results")} type="button">
            <span>生成结果</span>
            <em>{resultCountText}</em>
          </button>
          {showCaseTab ? (
            <button className={effectiveActiveTab === "cases" ? "active" : ""} onClick={() => onTabChange(tool.key, "cases")} type="button">
              创作案例
            </button>
          ) : null}
        </div>
        {effectiveActiveTab === "results" && !isMoreTitleTool ? (
          <div className="ck-results-actions">
            <label className="ck-results-check">
              <input
                checked={allReadySelected}
                disabled={effectiveActiveTab !== "results" || readyItems.length === 0}
                onChange={(event) => onToggleSelectAll(tool.key, event.target.checked)}
                type="checkbox"
              />
              <span className="ck-results-check-box">{allReadySelected ? "✓" : ""}</span>
              全选
            </label>
            <button disabled={downloadDisabled} onClick={() => onDownload(tool)} type="button">
              <img alt="" src={figmaIcons.download} />
              立即下载
            </button>
          </div>
        ) : null}
      </div>

      {canGenerateSetPackTitles ? (
        <div className="ck-set-pack-title-bar">
          <div className="ck-set-pack-title-copy">
            <span>已选标题</span>
            <strong>{selectedSetPackTitle || "还未选择上架标题"}</strong>
          </div>
          <div className="ck-set-pack-title-actions">
            <button
              onClick={() => {
                if (!selectedTask) return;
                onGenerateSetPackTitles(selectedTask.taskId);
                setSetPackTitlePopoverOpen(true);
              }}
              type="button"
            >
              智能生成上架标题
            </button>
            {setPackTitlePopoverOpen && setPackTitleCandidates.length ? (
              <div className="ck-set-pack-title-popover">
                {setPackTitleCandidates.map((title) => (
                  <button
                    className={title === selectedSetPackTitle ? "active" : ""}
                    key={title}
                    onClick={() => {
                      if (!selectedTask) return;
                      onApplySetPackTitle(selectedTask.taskId, title);
                      setSetPackTitlePopoverOpen(false);
                    }}
                    type="button"
                  >
                    {title}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={`ck-results-scroll${isNarrow ? " collapsed" : ""}`}>
        {effectiveActiveTab === "cases" ? (
          <div className="ck-case-panel">
            <div className="ck-case-hero">
              <h2>{caseCollection.headline}</h2>
              <p>{caseCollection.subheadline}</p>
            </div>
            <div className="ck-case-section-title">热门案例示例</div>
            <div className="ck-case-grid">
              {caseCollection.templates.map((template, index) => (
                <article className="ck-case-card" key={template.id}>
                  <button className="ck-case-card-visual" onClick={() => onOpenCase(template)} type="button">
                    <img alt={template.title} className="ck-case-card-cover" src={template.coverImage} />
                    <div className="ck-case-card-source">
                      <img alt="" src={template.sourceImage} />
                      <span>原图</span>
                    </div>
                    <span className="ck-case-card-divider" aria-hidden="true" />
                    <div className="ck-case-card-count">生成 {template.resultImages.length} 张套图</div>
                    <div className="ck-case-card-stack">
                      {template.resultImages.slice(0, 3).map((item) => (
                        <img alt="" key={item.id} src={item.src} />
                      ))}
                      {template.resultImages.length > 3 ? <span>+{template.resultImages.length}</span> : null}
                    </div>
                  </button>
                  <div className="ck-case-card-body">
                    <span className="ck-case-card-category">{template.category}</span>
                    <strong>{template.title}</strong>
                    <p>{template.description}</p>
                    <div className="ck-case-card-actions">
                      <button className={`ck-case-card-action${index === 0 ? " primary" : ""}`} onClick={() => (index === 0 ? onApplyCase(template) : onOpenCase(template))} type="button">
                        {index === 0 ? "立即生成同款" : "查看详情"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : isMoreTitleTool ? (
          <MoreTitleWorkbench
            onApplyCandidate={onApplyMoreTitleCandidate}
            onCopyFinalTitles={onCopyMoreTitleTask}
            onExportCsv={onExportMoreTitleTask}
            onFinalTitleChange={onChangeMoreTitleFinal}
            task={selectedTask}
          />
        ) : showEmptyState ? (
          <div className="ck-results-empty">
            <div className="ck-results-empty-icon" aria-hidden="true">
              <span className="ck-results-empty-card back" />
              <span className="ck-results-empty-card front" />
              <span className="ck-results-empty-badge" />
              <span className="ck-results-empty-close" />
            </div>
            <div className="ck-results-empty-title">暂无生成结果</div>
            <div className="ck-results-empty-copy">请在左侧上传并生成</div>
          </div>
        ) : (
          <>
            <div className="ck-card-grid">
              {items.map((item) => (
                <article
                  className={`ck-card status-${item.status}${item.selected ? " is-selected" : ""}${item.mediaKind === "video" ? " is-video" : ""}`}
                  key={item.id}
                  onClick={() => {
                    if (activeTab === "results" && item.status === "ready" && item.mediaKind === "image") {
                      onOpenDetail(item);
                    }
                  }}
                >
                  {item.status === "ready" && activeTab === "results" ? (
                    <label
                      className="ck-card-check"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <input checked={item.selected} onChange={() => onToggleItem(tool.key, item.id)} type="checkbox" />
                      <span className="ck-card-check-box">{item.selected ? "✓" : ""}</span>
                    </label>
                  ) : null}
                  {item.src ? <img alt={item.label} src={item.src} /> : <div className="ck-card-artwork-placeholder" aria-hidden="true" />}
                  {item.mediaKind === "video" && item.status === "ready" ? <span className="ck-card-video-play" aria-hidden="true" /> : null}
                  <span className="ck-card-tag">{item.label}</span>
                  {isSetPackLikeTool(tool.key) && item.roleLabel ? <span className="ck-set-pack-role-pill">{item.roleLabel}</span> : null}
                  {tool.key === "set-main" && item.overlayText ? <div className="ck-set-pack-overlay-text">{item.overlayText}</div> : null}
                  {activeTab === "results" && item.status === "ready" ? (
                    <button
                      className="ck-card-download"
                      data-label={isSetPackLikeTool(tool.key) ? "下载图" : "下载"}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDownloadItem(item);
                      }}
                      title="下载图片"
                      type="button"
                    >
                      <img alt="" src={figmaIcons.download} />
                    </button>
                  ) : null}
                  {tool.key === "set-main" && activeTab === "results" && item.status === "ready" ? (
                    <div className="ck-set-pack-card-actions">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onPreviewItem(item);
                        }}
                        type="button"
                      >
                        预览
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onRetry(tool.key, item.id);
                        }}
                        type="button"
                      >
                        重生
                      </button>
                      {/(卖点|参数)/.test(item.roleLabel ?? "") ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditItemText(item);
                          }}
                          type="button"
                        >
                          改文案
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {activeTab === "results" && item.status === "queued" ? (
                    <button
                      className="ck-card-action danger"
                      data-label="取消"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCancelQueued(tool.key, item.id);
                      }}
                      title="取消生成"
                      type="button"
                    >
                      ×
                    </button>
                  ) : null}
                  {activeTab === "results" && item.status === "failed" ? (
                    <button
                      className="ck-card-action danger"
                      data-label="删除"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteFailed(tool.key, item.id);
                      }}
                      title="删除失败结果"
                      type="button"
                    >
                      ×
                    </button>
                  ) : null}

                  {item.status === "queued" ? <span className="ck-card-state-pill">排队中</span> : null}
                  {item.status === "generating" ? <span className="ck-card-state-pill generating">生成中</span> : null}
                  {item.status === "generating" ? (
                    <div className="ck-card-generating">
                      <span className="ck-card-spinner" />
                    </div>
                  ) : null}
                  {item.status === "skeleton" ? <div className="ck-card-skeleton-shimmer" /> : null}
                  {item.status === "failed" ? (
                    <div className="ck-card-failed">
                      <span className="ck-card-failed-icon" aria-hidden="true">
                        <img alt="" src={figmaIcons.failedResult} />
                      </span>
                      <strong>生成失败</strong>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onRetry(tool.key, item.id);
                        }}
                        type="button"
                      >
                        重试生成
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
            {showNoMore ? <div className="ck-no-more">没有更多了~</div> : null}
          </>
        )}
      </div>
    </section>
  );
}

function CaseDetailModal({
  template,
  onApply,
  onClose,
  onShare
}: {
  template: CaseTemplate;
  onApply: (template: CaseTemplate) => void;
  onClose: () => void;
  onShare: (template: CaseTemplate) => void;
}) {
  return (
    <div className="ck-case-modal-mask" onClick={onClose}>
      <div className="ck-case-modal" onClick={(event) => event.stopPropagation()}>
        <div className="ck-case-modal-head">
          <strong>作品详情</strong>
          <button onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="ck-case-modal-content">
          <div className="ck-case-modal-source">
            <div className="ck-case-modal-source-card">
              <img alt={template.title} src={template.sourceImage} />
            </div>
            <div className="ck-case-modal-source-label">产品图片</div>
            <button className="ck-case-modal-primary" onClick={() => onApply(template)} type="button">
              一键做同款
            </button>
            <button className="ck-case-modal-secondary" onClick={() => onShare(template)} type="button">
              复制分享链接
            </button>
          </div>
          <div className="ck-case-modal-results">
            {template.resultImages.map((item) => (
              <div className="ck-case-modal-result-item" key={item.id}>
                <img alt={item.title} src={item.src} />
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskHistoryRail({
  activeCount,
  collapsed,
  records,
  selectedTaskId,
  onToggleCollapsed,
  onSelectTask
}: {
  activeCount: number;
  collapsed: boolean;
  records: TaskRecord[];
  selectedTaskId?: string | null;
  onToggleCollapsed: () => void;
  onSelectTask: (record: TaskRecord) => void;
}) {
  const groupedRecords = useMemo(() => {
    const groups: Array<{ date: string; items: TaskRecord[] }> = [];
    records.forEach((record) => {
      const date = formatTaskRecordDate(record.createdAt);
      const existingGroup = groups[groups.length - 1];
      if (existingGroup?.date === date) {
        existingGroup.items.push(record);
      } else {
        groups.push({
          date,
          items: [record]
        });
      }
    });
    return groups;
  }, [records]);

  return (
    <aside className={`ck-task-rail${collapsed ? " collapsed" : ""}`}>
      {!collapsed ? (
        <>
          <button aria-label="收起创作记录" className="ck-collapse-handle expand ck-task-rail-handle" onClick={onToggleCollapsed} type="button">
            <span className="ck-collapse-arrow expand">
              <img alt="" src={figmaIcons.collapse} />
            </span>
          </button>
          <div className="ck-task-rail-head">
            <span className="ck-task-rail-icon" aria-hidden="true">
              ↻
            </span>
            <div className="ck-task-rail-copy">
              <strong>创作记录</strong>
              <em>{activeCount > 0 ? `进行中 ${activeCount}` : ""}</em>
            </div>
          </div>
          <div className="ck-task-rail-body">
            {groupedRecords.length === 0 ? (
              <div className="ck-task-rail-empty">当前功能暂无任务记录</div>
            ) : (
              groupedRecords.map((group) => (
                <div className="ck-task-group" key={group.date}>
                  <div className="ck-task-group-date">{group.date}</div>
                  <div className="ck-task-group-list">
                    {group.items.map((record) => (
                      <button
                        className={`ck-task-card${selectedTaskId === record.taskId ? " active" : ""}`}
                        key={record.id}
                        onClick={() => onSelectTask(record)}
                        type="button"
                      >
                        <div className={`ck-task-card-preview${record.coverSrcs.length > 1 ? " collage" : ""}`}>
                          {record.coverSrcs.length > 0 ? (
                            record.coverSrcs.slice(0, 4).map((src, index) => <img alt="" key={`${record.id}-${index}`} src={src} />)
                          ) : (
                            <span className="ck-task-card-placeholder" />
                          )}
                          <span className={`ck-task-card-badge${record.status !== "completed" ? " is-generating" : ""}`}>
                            {record.status !== "completed" ? <i className="ck-task-card-loading-spinner" aria-hidden="true" /> : null}
                            {record.status !== "completed" ? `${record.successCount + record.failCount}/${record.totalCount}` : `+${record.totalCount}`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <button aria-label="展开创作记录" className="ck-collapse-handle collapse ck-task-rail-handle" onClick={onToggleCollapsed} type="button">
          <span className="ck-collapse-arrow collapse">
            <img alt="" src={figmaIcons.collapse} />
          </span>
          {activeCount > 0 ? <span className="ck-task-rail-handle-badge">{activeCount}</span> : null}
        </button>
      )}
    </aside>
  );
}

function MyCreationPage({
  mode,
  resultItems,
  selectedTaskIdsByTool,
  selectedToolKey,
  taskRecords,
  toolOptions,
  onChangeMode,
  onChangeToolKey,
  onDownloadItem,
  onOpenDetail,
  onSelectTask
}: {
  mode: CreationHistoryMode;
  resultItems: ResultItem[];
  selectedTaskIdsByTool: Record<string, string | null>;
  selectedToolKey: string;
  taskRecords: TaskRecord[];
  toolOptions: Array<{ key: string; label: string }>;
  onChangeMode: (mode: CreationHistoryMode) => void;
  onChangeToolKey: (toolKey: string) => void;
  onDownloadItem: (item: ResultItem) => void;
  onOpenDetail: (item: ResultItem) => void;
  onSelectTask: (record: TaskRecord) => void;
}) {
  return (
    <section className="ck-mine-page">
      <div className="ck-mine-head">
        <div>
          <strong>我的创作</strong>
          <span>查看全部功能下的创作任务与生成结果</span>
        </div>
      </div>
      <div className="ck-mine-toolbar">
        <div className="ck-task-rail-mode-switch">
          <button className={mode === "tasks" ? "active" : ""} onClick={() => onChangeMode("tasks")} type="button">
            任务
          </button>
          <button className={mode === "results" ? "active" : ""} onClick={() => onChangeMode("results")} type="button">
            结果图
          </button>
        </div>
        <div className="ck-mine-tool-select">
          <select className="ck-task-rail-filter" onChange={(event) => onChangeToolKey(event.target.value)} value={selectedToolKey}>
            <option value="all">全部功能</option>
            {toolOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="ck-mine-content">
        {mode === "tasks" ? (
          taskRecords.length === 0 ? (
            <div className="ck-mine-empty">当前筛选下暂无任务记录</div>
          ) : (
            <div className="ck-mine-task-grid">
              {taskRecords.map((record) => (
                <button
                  className={`ck-card ${record.status === "completed" ? "status-ready" : "status-generating"} ck-mine-task-result-card`}
                  key={record.id}
                  onClick={() => onSelectTask(record)}
                  type="button"
                >
                  <div className="ck-mine-task-result-preview">
                    {record.status === "completed" && record.coverSrcs[0] ? (
                      <img alt="" src={record.coverSrcs[0]} />
                    ) : (
                      <span className="ck-card-artwork-placeholder" />
                    )}
                    <span className="ck-task-card-tool">{toolOptions.find((option) => option.key === record.toolKey)?.label ?? record.toolKey}</span>
                    {record.status === "completed" ? (
                      <span className="ck-mine-task-result-count">+{record.totalCount}</span>
                    ) : (
                      <span className="ck-mine-task-result-count is-generating">
                        <i className="ck-mine-task-result-spinner" aria-hidden="true" />
                        生成中
                      </span>
                    )}
                  </div>
                  <div className="ck-mine-task-result-meta">
                    <strong>{record.taskId}</strong>
                    <span>{formatTaskRecordDateTime(record.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : resultItems.length === 0 ? (
          <div className="ck-mine-empty">当前筛选下暂无结果图</div>
        ) : (
          <div className="ck-mine-result-grid">
            {resultItems.map((item) => (
              <article
                className={`ck-card status-${item.status}${selectedTaskIdsByTool[item.toolKey] === item.taskId ? " is-selected" : ""}`}
                key={item.id}
                onClick={() => onOpenDetail(item)}
              >
                {item.src ? <img alt={item.label} src={item.src} /> : <span className="ck-card-artwork-placeholder" />}
                <span className="ck-task-card-tool">{toolOptions.find((option) => option.key === item.toolKey)?.label ?? item.toolKey}</span>
                <span className="ck-card-tag">{item.fileName}</span>
                {item.status === "ready" ? (
                  <button
                    className="ck-card-download"
                    data-label="下载"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDownloadItem(item);
                    }}
                    title="下载图片"
                    type="button"
                  >
                    <img alt="" src={figmaIcons.download} />
                  </button>
                ) : null}
                {item.status === "queued" ? <span className="ck-card-state-pill">排队中</span> : null}
                {item.status === "generating" ? <span className="ck-card-state-pill generating">生成中</span> : null}
                {item.status === "generating" ? (
                  <div className="ck-card-generating">
                    <span className="ck-card-spinner" />
                  </div>
                ) : null}
                {item.status === "failed" ? (
                  <div className="ck-card-failed">
                    <span className="ck-card-failed-icon" aria-hidden="true">
                      <img alt="" src={figmaIcons.failedResult} />
                    </span>
                    <strong>生成失败</strong>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MyModelsPage({
  filter,
  items,
  onChangeFilter,
  onOpenDetail,
  onOpenGenerate,
  onUpload
}: {
  filter: ModelFilterTab;
  items: ModelAsset[];
  onChangeFilter: (tab: ModelFilterTab) => void;
  onOpenDetail: (item: ModelAsset) => void;
  onOpenGenerate: () => void;
  onUpload: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="ck-mine-page">
      <div className="ck-mine-head">
        <div>
          <strong>我的模特</strong>
          <span>统一管理本地上传和 AI 生成的模特素材</span>
        </div>
      </div>
      <div className="ck-mine-toolbar">
        <div className="ck-task-rail-mode-switch ck-mine-model-filter">
          <button className={filter === "all" ? "active" : ""} onClick={() => onChangeFilter("all")} type="button">
            全部
          </button>
          <button className={filter === "upload" ? "active" : ""} onClick={() => onChangeFilter("upload")} type="button">
            本地上传
          </button>
          <button className={filter === "ai" ? "active" : ""} onClick={() => onChangeFilter("ai")} type="button">
            AI生成
          </button>
        </div>
        <div className="ck-mine-model-actions">
          <input
            accept="image/*"
            className="ck-upload-input"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (!files.length) return;
              onUpload(files);
              event.target.value = "";
            }}
            ref={inputRef}
            type="file"
          />
          <button className="secondary" onClick={() => inputRef.current?.click()} type="button">
            上传模特
          </button>
          <button className="primary" onClick={onOpenGenerate} type="button">
            AI生成模特
          </button>
        </div>
      </div>
      <div className="ck-mine-model-layout">
        <div className="ck-mine-model-grid">
          {items.length === 0 ? (
            <div className="ck-mine-empty">当前筛选下暂无模特</div>
          ) : (
            items.map((item) => (
              <button
                className="ck-mine-model-card"
                key={item.id}
                onClick={() => onOpenDetail(item)}
                type="button"
              >
                <div className="ck-mine-model-card-visual">
                  <img alt={item.name} src={item.src} />
                  <span className="ck-mine-model-card-tag">{getModelSourceLabel(item.sourceType)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function ModelDetailModal({
  item,
  onClose,
  onDelete,
  onDownload
}: {
  item: ModelAsset;
  onClose: () => void;
  onDelete: (item: ModelAsset) => void;
  onDownload: (item: ModelAsset) => void;
}) {
  return (
    <div className="ck-model-modal-mask" onClick={onClose}>
      <div className="ck-model-modal" onClick={(event) => event.stopPropagation()}>
        <div className="ck-model-modal-head">
          <strong>模特详情</strong>
          <button onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="ck-model-modal-body">
          <div className="ck-model-modal-hero">
            <img alt={item.name} src={item.src} />
            <div className="ck-model-modal-copy">
              <strong>{item.detailTitle ?? item.name}</strong>
              <span>{item.detailSubtitle || `${getModelSourceLabel(item.sourceType)}，${item.format ?? "PNG"}`}</span>
            </div>
          </div>
          <div className="ck-model-modal-sections">
            {(item.detailGroups?.length ? item.detailGroups : [{ label: "基础信息", values: [getModelSourceLabel(item.sourceType), item.format ?? "PNG"] }]).map((group) => (
              <section className="ck-model-modal-section" key={group.label}>
                <h4>{group.label}</h4>
                <div className="ck-model-modal-tags">
                  {group.values.map((value) => (
                    <span key={value}>{value}</span>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="ck-model-modal-footer">
            <button className="secondary" onClick={() => onDownload(item)} type="button">
              下载
            </button>
            <button className="danger" onClick={() => onDelete(item)} type="button">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultDetailModal({
  item,
  task,
  taskItems,
  toolLabel,
  onClose,
  onNavigate,
  onSelectItem,
  onDownloadCurrent,
  onDownloadAll,
  onDeleteCurrent,
  onUseTool
}: {
  item: ResultItem | null;
  task: TaskRecord | null;
  taskItems: ResultItem[];
  toolLabel: string;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
  onSelectItem: (item: ResultItem) => void;
  onDownloadCurrent: (item: ResultItem) => void;
  onDownloadAll: (task: TaskRecord) => void;
  onDeleteCurrent: (item: ResultItem, taskItems: ResultItem[]) => void;
  onUseTool: (toolKey: string, label: string, item: ResultItem) => void;
}) {
  const renderDetailGlyph = (type: "video" | "upscale" | "download" | "delete" | "close") => {
    if (type === "video") {
      return (
        <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
          <rect height="10" rx="2" stroke="currentColor" strokeWidth="1.4" width="8.8" x="2.2" y="3" />
          <path d="M11 6.1 13.6 4.5c.33-.2.74.04.74.43v6.14c0 .39-.41.63-.74.43L11 9.9V6.1Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
        </svg>
      );
    }
    if (type === "upscale") {
      return (
        <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
          <path d="M6 2.7H3.8A1.1 1.1 0 0 0 2.7 3.8V6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          <path d="M10 2.7h2.2c.61 0 1.1.49 1.1 1.1V6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          <path d="M6 13.3H3.8a1.1 1.1 0 0 1-1.1-1.1V10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          <path d="M10 13.3h2.2c.61 0 1.1-.49 1.1-1.1V10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      );
    }
    if (type === "download") {
      return (
        <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
          <path d="M8 2.5v7.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          <path d="m5.1 7.6 2.9 3 2.9-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
          <path d="M2.8 12.5h10.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      );
    }
    if (type === "delete") {
      return (
        <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
          <path d="M3.5 4.4h9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          <path d="M6.3 2.9h3.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          <path d="M5 4.4v7c0 .88.72 1.6 1.6 1.6h2.8c.88 0 1.6-.72 1.6-1.6v-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
          <path d="M6.9 6.8v3.2M9.1 6.8v3.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      );
    }
    return (
      <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
        <path d="M4 4 12 12M12 4 4 12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    );
  };
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const currentIndex = item ? taskItems.findIndex((taskItem) => taskItem.id === item.id) : -1;
  const hasOriginalImage = Boolean(task?.snapshot.mainUploads[0]?.previewSrc || task?.snapshot.mainUploads[0]?.src);
  const originalImageSrc = task?.snapshot.mainUploads[0]?.previewSrc ?? task?.snapshot.mainUploads[0]?.src ?? "";
  const createdAtLabel = task ? formatTaskRecordDateTime(task.createdAt) : "--";
  const modeSelection = task?.snapshot.creationModeSelection;
  const videoReplicaSummary = task?.snapshot.advancedSelections.videoReplicaPromptSummary;
  const videoReplicaUserDescription = task?.snapshot.advancedSelections.videoReplicaUserDescription;
  const videoReplaceSummary = task?.snapshot.advancedSelections.videoReplacePromptSummary;
  const videoReplaceUserDescription = task?.snapshot.advancedSelections.videoReplaceUserDescription;
  const toolbarActions = [
    { key: "video-main", label: "生成视频", icon: "video" as const },
    { key: "image-upscale", label: "4K放大", icon: "upscale" as const }
  ];
  const infoItems = [
    { label: "功能模块：", value: toolLabel },
    { label: "尺寸比例：", value: modeSelection?.ratio ?? "自适应尺寸" },
    { label: "生成数量：", value: String(task?.totalCount ?? "--") },
    ...(task?.toolKey === "video-replica" && videoReplicaSummary ? [{ label: "复刻摘要：", value: videoReplicaSummary }] : []),
    ...(task?.toolKey === "video-replica" && videoReplicaUserDescription
      ? [{ label: "用户描述：", value: videoReplicaUserDescription }]
      : []),
    ...(task?.toolKey === "video-replace" && videoReplaceSummary ? [{ label: "替换摘要：", value: videoReplaceSummary }] : []),
    ...(task?.toolKey === "video-replace" && videoReplaceUserDescription
      ? [{ label: "用户描述：", value: videoReplaceUserDescription }]
      : []),
    { label: "创建时间：", value: createdAtLabel },
    { label: "任务ID：", value: item?.id ?? task?.taskId ?? "--", multiline: true }
  ];

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="ck-result-detail-mask"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="ck-result-detail-modal"
          exit={{ opacity: 0, scale: 0.985, y: 18 }}
          initial={{ opacity: 0, scale: 0.972, y: 24 }}
          onClick={(event) => event.stopPropagation()}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          {item && task ? (
            <>
              <div className="ck-result-detail-shell">
                <div className="ck-result-detail-main">
                  <div className="ck-result-detail-content">
                    <div className={`ck-result-detail-stage${hasOriginalImage ? "" : " single"}`}>
                      {hasOriginalImage ? (
                        <div className="ck-result-detail-main-card original">
                          <span className="ck-result-detail-corner-tag original">原图</span>
                          <div className="ck-result-detail-image-wrap original-wrap">
                            <img alt="原图" referrerPolicy="no-referrer" src={originalImageSrc} />
                          </div>
                        </div>
                      ) : null}
                      <div className="ck-result-detail-main-card result">
                        <span className="ck-result-detail-corner-tag result">结果图</span>
                        {taskItems.length > 1 ? (
                          <>
                            <button
                              className="ck-result-detail-nav prev"
                              disabled={currentIndex <= 0}
                              onClick={() => onNavigate(-1)}
                              type="button"
                            >
                              ‹
                            </button>
                            <button
                              className="ck-result-detail-nav next"
                              disabled={currentIndex >= taskItems.length - 1}
                              onClick={() => onNavigate(1)}
                              type="button"
                            >
                              ›
                            </button>
                          </>
                        ) : null}
                        <div className="ck-result-detail-image-wrap result-wrap">
                          <img alt={item.label} referrerPolicy="no-referrer" src={item.src} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ck-result-detail-toolbar">
                    <div className="ck-result-detail-tool-actions">
                      {toolbarActions.map((action) => (
                        <button key={`${action.key}-${action.label}`} onClick={() => onUseTool(action.key, action.label, item)} type="button">
                          <span className="ck-result-detail-tool-icon" aria-hidden="true">
                            {renderDetailGlyph(action.icon)}
                          </span>
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="ck-result-detail-core-actions">
                      <button className="secondary outlined" onClick={() => onDownloadCurrent(item)} type="button">
                        <span className="ck-result-detail-core-icon" aria-hidden="true">
                          {renderDetailGlyph("download")}
                        </span>
                        下载当前图
                      </button>
                      <button className="primary" onClick={() => onDownloadAll(task)} type="button">
                        <span className="ck-result-detail-core-icon" aria-hidden="true">
                          {renderDetailGlyph("download")}
                        </span>
                        下载全部图
                      </button>
                      <button className="ghost icon-only" onClick={() => onDeleteCurrent(item, taskItems)} type="button">
                        <span className="ck-result-detail-core-icon" aria-hidden="true">
                          {renderDetailGlyph("delete")}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ck-result-detail-thumbs">
                  <div className="ck-result-detail-thumb-list">
                    {taskItems.map((taskItem) => (
                      <button
                        className={`ck-result-detail-thumb${taskItem.id === item.id ? " active" : ""}`}
                        key={taskItem.id}
                        onClick={() => onSelectItem(taskItem)}
                        type="button"
                      >
                        {taskItem.src ? <img alt={taskItem.fileName} loading="lazy" referrerPolicy="no-referrer" src={taskItem.src} /> : null}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ck-result-detail-info">
                  <button className="ck-result-detail-close plain" onClick={onClose} type="button">
                    {renderDetailGlyph("close")}
                  </button>
                  <div className="ck-result-detail-info-title">
                    <span className="ck-result-detail-info-accent" aria-hidden="true" />
                    <strong>生成信息</strong>
                  </div>
                  <div className="ck-result-detail-info-list">
                    {infoItems.map((info) => (
                      <div className={`ck-result-detail-info-item${info.multiline ? " multiline" : ""}`} key={info.label}>
                        <div className="ck-result-detail-info-copy">
                          <span>{info.label}</span>
                          <strong>{info.value}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ck-result-detail-mobile-entries">
                  <button
                    className="ck-result-detail-mobile-entry"
                    onClick={() => setMobileInfoOpen((value) => !value)}
                    type="button"
                  >
                    生成信息
                  </button>
                </div>
                {mobileInfoOpen ? (
                  <div className="ck-result-detail-mobile-info">
                    {infoItems.map((info) => (
                      <div className="ck-result-detail-mobile-info-item" key={`mobile-${info.label}`}>
                        <span>{info.label}</span>
                        <strong>{info.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="ck-result-detail-empty">
              <strong>该结果暂时不可用</strong>
              <span>可能已被删除，或当前地址中的任务信息无效。</span>
              <button onClick={onClose} type="button">
                返回
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<AppPage>("workspace");
  const [activePrimary, setActivePrimary] = useState<PrimaryKey>(navGroups[0]?.key ?? "set");
  const [activeTool, setActiveTool] = useState(navGroups[0]?.tools[0]?.key ?? "set-main");
  const [collapsed, setCollapsed] = useState(false);
  const [taskRailCollapsed, setTaskRailCollapsed] = useState(false);
  const [mineTab, setMineTab] = useState<MineTab>("creation");
  const [creationHistoryMode, setCreationHistoryMode] = useState<CreationHistoryMode>("tasks");
  const [creationHistoryToolKey, setCreationHistoryToolKey] = useState<string>("all");
  const [modelFilterTab, setModelFilterTab] = useState<ModelFilterTab>("all");
  const [activeCaseTemplate, setActiveCaseTemplate] = useState<CaseTemplate | null>(null);
  const [uploads, setUploads] = useState<Record<string, UploadItem[]>>({});
  const [uploadedModels, setUploadedModels] = useState<ModelAsset[]>(defaultUploadedModels);
  const [resultItemsByTool, setResultItemsByTool] = useState<Record<string, ResultItem[]>>(presetCreationResultItems);
  const [resultTabsByTool, setResultTabsByTool] = useState<Record<string, ResultTabKey>>({});
  const [taskRecordsByTool, setTaskRecordsByTool] = useState<Record<string, TaskRecord[]>>(presetCreationTaskRecords);
  const [selectedTaskIdByTool, setSelectedTaskIdByTool] = useState<Record<string, string | null>>({});
  const [libraryFieldKey, setLibraryFieldKey] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [limitModal, setLimitModal] = useState<LimitModalState | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [pointsModalOpen, setPointsModalOpen] = useState(false);
  const [pointsBalanceOpen, setPointsBalanceOpen] = useState(false);
  const [pointsRecordOpen, setPointsRecordOpen] = useState(false);
  const [pointsRecordTab, setPointsRecordTab] = useState<PointsRecordTab>("consume");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [exportPendingAction, setExportPendingAction] = useState<ExportPendingAction | null>(null);
  const [resultActionConfirm, setResultActionConfirm] = useState<ResultActionConfirmState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<UserTierId>("advanced-team");
  const [userMetrics, setUserMetrics] = useState<Record<UserTierId, UserTierMetrics>>(defaultUserMetrics);
  const [purchaseRecords, setPurchaseRecords] = useState<PointsRecordItem[]>(defaultPurchaseRecords);
  const [supplementValues, setSupplementValues] = useState<Record<string, string>>({});
  const [selectedMineModelId, setSelectedMineModelId] = useState("");
  const [previewResultItem, setPreviewResultItem] = useState<ResultItem | null>(null);
  const [editingResultItem, setEditingResultItem] = useState<ResultItem | null>(null);
  const [editingResultText, setEditingResultText] = useState("");
  const [aplusPlanByTool, setAplusPlanByTool] = useState<Record<string, AplusPlanState>>({});
  const [aplusDraftByTool, setAplusDraftByTool] = useState<Record<string, GeneratePayload>>({});
  const [aplusStepByTool, setAplusStepByTool] = useState<Record<string, 1 | 2>>({});
  const [fashionPlanByTool, setFashionPlanByTool] = useState<Record<string, AplusPlanState>>({});
  const [fashionDraftByTool, setFashionDraftByTool] = useState<Record<string, GeneratePayload>>({});
  const [fashionStepByTool, setFashionStepByTool] = useState<Record<string, 1 | 2>>({});

  const currentUser = userTierProfiles.find((item) => item.id === currentUserId) ?? userTierProfiles[0];
  const currentUserMetrics = userMetrics[currentUserId];
  const credits = currentUserMetrics.credits;
  const teamCredits = currentUserMetrics.teamCredits;
  const remainingStorageMb = currentUserMetrics.remainingStorageMb;
  const maxConcurrentTasks = currentUserMetrics.maxConcurrentTasks;
  const uploadCountLimit = currentUser.uploadCountLimit;
  const generationTimeoutsRef = useRef<ScheduledResultUpdate[]>([]);
  const aplusPlanRunRef = useRef<Record<string, number>>({});
  const fashionPlanRunRef = useRef<Record<string, number>>({});
  const lastVisitedWorkspaceToolRef = useRef<string | null>(null);
  const toolOptions = useMemo(() => navGroups.flatMap((group) => group.tools.map((tool) => ({ key: tool.key, label: tool.label, primaryKey: group.key }))), []);
  const toolMap = useMemo(
    () =>
      toolOptions.reduce<Record<string, { key: string; label: string; primaryKey: PrimaryKey }>>((accumulator, option) => {
        accumulator[option.key] = option;
        return accumulator;
      }, {}),
    [toolOptions]
  );
  const detailRoute = useMemo(() => parseResultDetailRoute(location.pathname, location.search), [location.pathname, location.search]);

  const currentGroup = navGroups.find((item) => item.key === activePrimary) ?? navGroups[1];
  const currentTool = currentGroup.tools.find((item) => item.key === activeTool) ?? currentGroup.tools[0];
  const currentAllResultItems = resultItemsByTool[currentTool.key] ?? [];
  const currentResultTab = resultTabsByTool[currentTool.key] ?? "results";
  const currentTaskRecords = taskRecordsByTool[currentTool.key] ?? [];
  const currentSelectedTaskId = selectedTaskIdByTool[currentTool.key] ?? null;
  const currentSelectedTask = currentTaskRecords.find((record) => record.taskId === currentSelectedTaskId) ?? null;
  const currentResultItems = currentSelectedTaskId
    ? currentAllResultItems.filter((item) => item.taskId === currentSelectedTaskId)
    : currentAllResultItems;
  const currentAplusPlan = aplusPlanByTool[currentTool.key];
  const currentAplusDraft = aplusDraftByTool[currentTool.key];
  const currentAplusStep = aplusStepByTool[currentTool.key] ?? 1;
  const currentAplusPlanStale =
    currentTool.key === "set-aplus" &&
    Boolean(currentAplusPlan?.signature && currentAplusDraft && currentAplusPlan.signature !== buildAplusPlanSignature(currentAplusDraft));
  const currentFashionPlan = fashionPlanByTool[currentTool.key];
  const currentFashionDraft = fashionDraftByTool[currentTool.key];
  const currentFashionStep = fashionStepByTool[currentTool.key] ?? 1;
  const currentFashionPlanStale =
    currentTool.key === "set-fashion" &&
    Boolean(currentFashionPlan?.signature && currentFashionDraft && currentFashionPlan.signature !== buildFashionSceneSignature(currentFashionDraft));
  const activeGeneratingTaskCount = useMemo(
    () =>
      Object.values(taskRecordsByTool).reduce(
        (sum, records) => sum + records.filter((record) => record.status === "queued" || record.status === "generating").length,
        0
      ),
    [taskRecordsByTool]
  );
  const currentToolActiveTaskCount = currentTaskRecords.filter(
    (record) => record.status === "queued" || record.status === "generating"
  ).length;
  const allTaskRecords = useMemo(
    () => Object.values(taskRecordsByTool).flat().sort((left, right) => right.createdAt - left.createdAt),
    [taskRecordsByTool]
  );
  const allGeneratedResultItems = useMemo(
    () =>
      Object.values(resultItemsByTool)
        .flat()
        .filter((item) => item.taskId !== "case")
        .sort((left, right) => right.createdAt - left.createdAt),
    [resultItemsByTool]
  );
  const filteredCreationTaskRecords = creationHistoryToolKey === "all" ? allTaskRecords : allTaskRecords.filter((record) => record.toolKey === creationHistoryToolKey);
  const filteredCreationResultItems =
    creationHistoryToolKey === "all"
      ? allGeneratedResultItems.filter((item) => item.status === "ready")
      : allGeneratedResultItems.filter((item) => item.toolKey === creationHistoryToolKey && item.status === "ready");
  const aiGeneratedModels = useMemo(
    () =>
      (resultItemsByTool["model-generate"] ?? [])
        .filter((item) => item.status === "ready" && item.src)
        .map((item) => {
          const taskRecord = (taskRecordsByTool["model-generate"] ?? []).find((record) => record.taskId === item.taskId);
          const advancedSelections = taskRecord?.snapshot.advancedSelections ?? {};
          const detailGroups = buildModelDetailGroups(advancedSelections);
          return {
            id: item.id,
            name: `${item.fileName}.${inferExtensionFromResult(item)}`,
            src: item.src ?? "",
            sizeMb: 12,
            createdAt: item.createdAt,
            sourceType: "ai",
            format: inferExtensionFromResult(item).toUpperCase(),
            detailTitle: advancedSelections.persona || advancedSelections.modelGenerateType || "AI模特",
            detailSubtitle: [advancedSelections.gender, advancedSelections.age, advancedSelections.appearance].filter(Boolean).join(","),
            detailGroups
          } satisfies ModelAsset;
        }),
    [resultItemsByTool, taskRecordsByTool]
  );
  const allMineModels = useMemo(
    () => [...aiGeneratedModels, ...uploadedModels].sort((left, right) => right.createdAt - left.createdAt),
    [aiGeneratedModels, uploadedModels]
  );
  const filteredMineModels = useMemo(() => {
    if (modelFilterTab === "all") return allMineModels;
    return allMineModels.filter((item) => item.sourceType === modelFilterTab);
  }, [allMineModels, modelFilterTab]);
  const activeModelDetail = allMineModels.find((item) => item.id === selectedMineModelId) ?? null;
  const detailToolOption = detailRoute ? toolMap[detailRoute.toolKey] : null;
  const detailTask = detailRoute ? (taskRecordsByTool[detailRoute.toolKey] ?? []).find((record) => record.taskId === detailRoute.taskId) ?? null : null;
  const detailTaskItems = useMemo(
    () =>
      detailRoute
        ? (resultItemsByTool[detailRoute.toolKey] ?? []).filter(
            (resultItem) => resultItem.taskId === detailRoute.taskId && resultItem.status === "ready" && resultItem.mediaKind === "image"
          )
        : [],
    [detailRoute, resultItemsByTool]
  );
  const activeDetailResultItem = detailRoute ? detailTaskItems.find((resultItem) => resultItem.id === detailRoute.resultId) ?? null : null;
  const activeBasePath = buildBasePath(activePage, mineTab, activeTool);
  const handlePrimaryChange = (key: PrimaryKey) => {
    const nextGroup = navGroups.find((item) => item.key === key) ?? navGroups[0];
    setActivePage("workspace");
    setActivePrimary(key);
    setActiveTool(nextGroup.tools[0].key);
    setCollapsed(false);
  };

  useEffect(() => {
    if (detailRoute) {
      if (detailRoute.source === "mine") {
        setActivePage("mine");
        setMineTab("creation");
      } else {
        setActivePage("workspace");
        const targetTool = toolMap[detailRoute.toolKey];
        if (targetTool) {
          setActivePrimary(targetTool.primaryKey);
          setActiveTool(targetTool.key);
        }
        setSelectedTaskIdByTool((current) => ({
          ...current,
          [detailRoute.toolKey]: detailRoute.taskId
        }));
        setResultTabsByTool((current) => ({
          ...current,
          [detailRoute.toolKey]: "results"
        }));
      }
      return;
    }

    if (location.pathname === "/" || location.pathname === "") return;

    if (location.pathname === "/mine" || location.pathname === "/mine/creation") {
      setActivePage("mine");
      setMineTab("creation");
      return;
    }

    if (location.pathname === "/mine/models") {
      setActivePage("mine");
      setMineTab("models");
      return;
    }

    const toolMatched = location.pathname.match(/^\/tools\/([^/]+)\/?$/);
    if (toolMatched) {
      const targetTool = toolMap[toolMatched[1]];
      if (!targetTool) return;
      setActivePage("workspace");
      setActivePrimary(targetTool.primaryKey);
      setActiveTool(targetTool.key);
      return;
    }
  }, [detailRoute, location.pathname, toolMap]);

  useEffect(() => {
    if (detailRoute) return;
    if (location.pathname === activeBasePath) return;
    if (location.pathname === "/" || location.pathname === "") {
      navigate(activeBasePath, { replace: true });
      return;
    }

    const isMinePath = location.pathname === "/mine" || location.pathname === "/mine/creation" || location.pathname === "/mine/models";
    const isToolPath = /^\/tools\/[^/]+\/?$/.test(location.pathname);
    if (isMinePath || isToolPath) return;

    navigate(activeBasePath, { replace: true });
  }, [activeBasePath, detailRoute, location.pathname, navigate]);

  useEffect(() => {
    const nextGroup = navGroups.find((item) => item.key === activePrimary) ?? navGroups[0];
    const toolStillExists = nextGroup.tools.some((item) => item.key === activeTool);
    if (!toolStillExists && nextGroup.tools[0]) {
      setActiveTool(nextGroup.tools[0].key);
    }
  }, [activePrimary, activeTool]);

  useEffect(() => {
    if (activePage !== "workspace") return;

    const enteringNewTool = lastVisitedWorkspaceToolRef.current !== activeTool;
    lastVisitedWorkspaceToolRef.current = activeTool;
    if (!enteringNewTool) return;

    const currentItems = resultItemsByTool[activeTool] ?? [];
    if (currentItems.length > 0) return;

    setResultTabsByTool((current) => ({
      ...current,
      [activeTool]: "cases"
    }));
  }, [activePage, activeTool, resultItemsByTool]);

  useEffect(() => {
    if (selectedMineModelId && !allMineModels.some((item) => item.id === selectedMineModelId)) {
      setSelectedMineModelId("");
    }
  }, [allMineModels, selectedMineModelId]);

  useEffect(
    () => () => {
      generationTimeoutsRef.current.forEach(({ timerId }) => window.clearTimeout(timerId));
    },
    []
  );

  const scheduleResultUpdate = (callback: () => void, delay: number, itemId?: string, phase?: ScheduledResultUpdate["phase"]) => {
    const timerId = window.setTimeout(callback, delay);
    generationTimeoutsRef.current.push({ timerId, itemId, phase });
  };

  const clearScheduledResultUpdates = (itemId: string) => {
    generationTimeoutsRef.current = generationTimeoutsRef.current.filter((entry) => {
      if (entry.itemId !== itemId) return true;
      window.clearTimeout(entry.timerId);
      return false;
    });
  };

  const updateResultItems = (toolKey: string, updater: (items: ResultItem[]) => ResultItem[]) => {
    setResultItemsByTool((current) => ({
      ...current,
      [toolKey]: updater(current[toolKey] ?? [])
    }));
  };

  const updateTaskRecords = (toolKey: string, updater: (records: TaskRecord[]) => TaskRecord[]) => {
    setTaskRecordsByTool((current) => ({
      ...current,
      [toolKey]: updater(current[toolKey] ?? [])
    }));
  };

  const removeResultFromTask = (toolKey: string, item: ResultItem) => {
    let removedTask = false;
    updateTaskRecords(toolKey, (records) =>
      records.flatMap((record) => {
        if (record.taskId !== item.taskId) return [record];

        const nextTotalCount = Math.max(0, record.totalCount - 1);
        const nextSuccessCount = record.successCount - (item.status === "ready" ? 1 : 0);
        const nextFailCount = Math.max(0, record.failCount - (item.status === "failed" ? 1 : 0));
        const nextItemIds = record.itemIds.filter((value) => value !== item.id);
        const nextCoverSrcs = item.src ? record.coverSrcs.filter((src) => src !== item.src) : record.coverSrcs;
        const nextFinishedCount = nextSuccessCount + nextFailCount;

        if (nextTotalCount <= 0 || nextItemIds.length === 0) {
          removedTask = true;
          return [];
        }

        return [
          {
            ...record,
            totalCount: nextTotalCount,
            successCount: nextSuccessCount,
            failCount: nextFailCount,
            itemIds: nextItemIds,
            coverSrcs: nextCoverSrcs.slice(0, 4),
            status: nextFinishedCount >= nextTotalCount ? "completed" : nextFinishedCount === 0 ? "queued" : "generating"
          }
        ];
      })
    );

    if (removedTask) {
      setSelectedTaskIdByTool((current) => ({
        ...current,
        [toolKey]: current[toolKey] === item.taskId ? null : current[toolKey]
      }));
    }
  };

  const syncTaskRecordProgress = (
    toolKey: string,
    taskId: string,
    item: ResultItem,
    phase: "start" | "finish" | "retry-start"
  ) => {
    updateTaskRecords(toolKey, (records) =>
      records.map((record) => {
        if (record.taskId !== taskId) return record;

        if (phase === "start") {
          return {
            ...record,
            status: "generating"
          };
        }

        if (phase === "retry-start") {
          return {
            ...record,
            status: "generating",
            failCount: Math.max(0, record.failCount - 1),
            coverSrcs: record.coverSrcs.filter((src) => src !== item.src)
          };
        }

        const nextSuccessCount = record.successCount + (item.status === "ready" ? 1 : 0);
        const nextFailCount = record.failCount + (item.status === "failed" ? 1 : 0);
        const nextCoverSrcs = item.status === "ready" && item.src ? [item.src, ...record.coverSrcs].slice(0, 4) : record.coverSrcs;
        const finishedCount = nextSuccessCount + nextFailCount;

        return {
          ...record,
          successCount: nextSuccessCount,
          failCount: nextFailCount,
          coverSrcs: nextCoverSrcs,
          status: finishedCount >= record.totalCount ? "completed" : "generating"
        };
      })
    );
  };

  const handleAddUpload = (fieldKey: string, nextValues: UploadItem[]) => {
    setUploads((current) => ({ ...current, [fieldKey]: nextValues }));
  };

  const handleUpdateUploadItems = (fieldKey: string, updater: (items: UploadItem[]) => UploadItem[]) => {
    setUploads((current) => ({
      ...current,
      [fieldKey]: updater(current[fieldKey] ?? [])
    }));
  };

  const handleRemoveUpload = (fieldKey: string, index: number) => {
    const removedSizeMb = (uploads[fieldKey] ?? [])[index]?.sizeMb ?? 0;
    setUploads((current) => ({
      ...current,
      [fieldKey]: (current[fieldKey] ?? []).filter((_, currentIndex) => currentIndex !== index)
    }));
    setUserMetrics((current) => ({
      ...current,
      [currentUserId]: {
        ...current[currentUserId],
        remainingStorageMb: Number((current[currentUserId].remainingStorageMb + removedSizeMb).toFixed(1))
      }
    }));
  };

  const handleUploadModels = async (files: File[]) => {
    const candidateFiles = files.filter((file) => file.type.startsWith("image/"));
    const filteredFiles = candidateFiles.filter((file) => !isSensitiveUpload(file));
    const nextModels: ModelAsset[] = [];
    const warnings: string[] = [];
    let availableStorageMb = remainingStorageMb;

    for (const file of filteredFiles) {
      const validation = await validateModelImageFile(file);
      if (!validation.ok) {
        warnings.push(validation.reason);
        continue;
      }

      const uploadItem = validation.item;
      const sizeMb = uploadItem.sizeMb;
      if (sizeMb > availableStorageMb) {
        warnings.push(`“${file.name}”上传失败，剩余存储空间不足。`);
        continue;
      }

      availableStorageMb = Number(Math.max(0, availableStorageMb - sizeMb).toFixed(1));
      nextModels.push({
        id: uploadItem.id,
        name: uploadItem.name ?? file.name,
        src: uploadItem.src ?? "",
        sizeMb,
        createdAt: Date.now() + nextModels.length,
        sourceType: "upload",
        format: uploadItem.format ?? getImageFormat(file.name),
        width: uploadItem.width,
        height: uploadItem.height,
        detailTitle: "本地上传模特",
        detailSubtitle: `${uploadItem.width ?? "-"} × ${uploadItem.height ?? "-"}`,
        detailGroups: [
          {
            label: "基础信息",
            values: ["本地上传", uploadItem.format ?? getImageFormat(file.name), `${uploadItem.width ?? "-"} × ${uploadItem.height ?? "-"}`]
          }
        ]
      });
    }

    if (candidateFiles.length !== filteredFiles.length) {
      warnings.push("存在图片未通过安全审核，已跳过。");
    }

    if (nextModels.length) {
      setUploadedModels((current) => [...nextModels, ...current]);
      setSelectedMineModelId(nextModels[0].id);
      setUserMetrics((current) => ({
        ...current,
        [currentUserId]: {
          ...current[currentUserId],
          remainingStorageMb: availableStorageMb
        }
      }));
      setToast({
        id: Date.now(),
        message: `已添加${nextModels.length}个模特`
      });
    } else if (!warnings.length) {
      warnings.push("未识别到可用模特图，请重新上传。");
    }

    if (warnings.length && !nextModels.length) {
      setToast({
        id: Date.now() + 1,
        message: warnings[0],
        tone: "warning"
      });
    }

    return nextModels;
  };

  const handleGenerateBaselineModel = async (values: AdvancedSelectionMap) => {
    const requiredKeys = ["gender", "appearance", "age", "persona", "bodyType"] as const;
    const missingRequired = requiredKeys.some((key) => !values[key]);
    if (missingRequired) {
      setToast({
        id: Date.now(),
        message: "请先完善 AI 模特参数",
        tone: "warning"
      });
      return null;
    }

    const taskId = generateRandomTenDigitId();
    const createdAt = Date.now();
    const assetPool = ["/assets/task-gallery-7.png", "/assets/task-gallery-8.png", "/assets/result-1.png", "/assets/result-4.png"];
    const src = assetPool[createdAt % assetPool.length];
    const fileName = `AI模特_${taskId}`;
    const resultId = `baseline-model-${taskId}`;
    const nextResultItem: ResultItem = {
      id: resultId,
      toolKey: "model-generate",
      label: fileName,
      fileName,
      taskId,
      mediaKind: "image",
      status: "ready",
      src,
      selected: false,
      createdAt
    };
    const nextTaskRecord: TaskRecord = {
      id: `task-${taskId}`,
      toolKey: "model-generate",
      taskId,
      createdAt,
      totalCount: 1,
      successCount: 1,
      failCount: 0,
      status: "completed",
      itemIds: [resultId],
      coverSrcs: [src],
      snapshot: {
        mainUploads: [],
        referenceUploads: [],
        videoUploads: [],
        advancedSelections: {
          ...values,
          modelGenerateTypeKey: "real-model",
          modelGenerateType: "通用模特"
        },
        supplementValue: values.baselineModelSupplement ?? "",
        creationModeSelection: null
      }
    };

    updateResultItems("model-generate", (items) => [nextResultItem, ...items]);
    updateTaskRecords("model-generate", (records) => [nextTaskRecord, ...records]);
    setSelectedTaskIdByTool((current) => ({
      ...current,
      "model-generate": taskId
    }));
    setResultTabsByTool((current) => ({
      ...current,
      "model-generate": "results"
    }));
    setToast({
      id: Date.now(),
      message: "已生成模特"
    });
    return resultId;
  };

  const handleOpenLibrary = (fieldKey: string) => {
    if (remainingStorageMb <= 0) {
      setLimitModal({
        title: "当前存储容量不足",
        description: getStorageLimitDescription(remainingStorageMb)
      });
      return;
    }
    setLibraryFieldKey(fieldKey);
  };

  const handleLibraryConfirm = (items: UploadItem[]) => {
    if (!libraryFieldKey || !items.length) return;
    const fittedItems: UploadItem[] = [];
    let availableStorageMb = remainingStorageMb;
    items.forEach((item) => {
      if (item.sizeMb <= availableStorageMb) {
        fittedItems.push(item);
        availableStorageMb = Number(Math.max(0, availableStorageMb - item.sizeMb).toFixed(1));
      }
    });
    if (!fittedItems.length) {
      handleAtLimit();
      return;
    }
    setUploads((current) => {
      const currentItems = current[libraryFieldKey] ?? [];
      return {
        ...current,
        [libraryFieldKey]: [...fittedItems, ...currentItems]
      };
    });
    setUserMetrics((current) => ({
      ...current,
      [currentUserId]: {
        ...current[currentUserId],
        remainingStorageMb: Number(
          Math.max(0, current[currentUserId].remainingStorageMb - fittedItems.reduce((sum, item) => sum + item.sizeMb, 0)).toFixed(1)
        )
      }
    }));
    if (fittedItems.length < items.length) {
      handleAtLimit();
    }
  };

  const getLibraryMaxSelectable = () => {
    if (!libraryFieldKey) return 0;
    const [toolKey, fieldKind] = libraryFieldKey.split(":");
    const config = toolModuleConfigs[toolKey];
    const fieldConfig =
      fieldKind === "reference" ? config?.uploads.reference : fieldKind === "video" ? config?.uploads.video : config?.uploads.main;
    const maxCount = fieldConfig?.maxCount ?? uploadCountLimit;
    return Math.max(0, maxCount - (uploads[libraryFieldKey] ?? []).length);
  };

  const handleRejectedUpload = (message: string) => {
    setToast({
      id: Date.now(),
      message,
      tone: "warning"
    });
  };

  const handleAtLimit = () => {
    setLimitModal({
      title: "当前存储容量不足",
      description: getStorageLimitDescription(remainingStorageMb)
    });
  };

  const handleOpenMembership = () => {
    setUserMenuOpen(false);
    setPointsBalanceOpen(false);
    setPayModalOpen(true);
  };

  const handleMembershipSuccess = () => {
    setCurrentUserId("flagship");
    setUserMetrics((current) => ({
      ...current,
      flagship: {
        ...current.flagship,
        credits: Math.max(current.flagship.credits, 120),
        teamCredits: Math.max(current.flagship.teamCredits, 188),
        remainingStorageMb: Math.max(current.flagship.remainingStorageMb, 4096),
        maxConcurrentTasks: Math.max(current.flagship.maxConcurrentTasks, 20)
      }
    }));
    setPayModalOpen(false);
    setLimitModal(null);
    setToast({
      id: Date.now(),
      message: "会员支付成功，已升级为旗舰会员"
    });
  };

  const handleOpenPointsModal = () => {
    setPointsBalanceOpen(false);
    setUserMenuOpen(false);
    setPointsModalOpen(true);
  };

  const handlePointsSuccess = (points: number) => {
    setUserMetrics((current) => ({
      ...current,
      [currentUserId]: {
        ...current[currentUserId],
        credits: current[currentUserId].credits + points
      }
    }));
    setPurchaseRecords((current) => [
      {
        id: `purchase-${Date.now()}`,
        userName: "赵文文-微...",
        avatar: "/assets/member-avatar.png",
        title: `购买${points}积分`,
        date: "2026-04-25",
        time: "12:00:00",
        amount: `+${points}`
      },
      ...current
    ]);
    setPointsModalOpen(false);
    setToast({
      id: Date.now(),
      message: `支付成功，已到账${points}积分`
    });
  };

  const handleOpenPointsBalance = () => {
    setUserMenuOpen(false);
    setPointsBalanceOpen(true);
  };

  const handleOpenRecords = (tab: PointsRecordTab = "consume") => {
    setPointsBalanceOpen(false);
    setPointsRecordTab(tab);
    setPointsRecordOpen(true);
  };

  const handleGenerate = (tool: ToolConfig, payload: GeneratePayload) => {
    setPointsBalanceOpen(false);
    setUserMenuOpen(false);
    setResultTabsByTool((current) => ({
      ...current,
      [tool.key]: "results"
    }));

    if (activeGeneratingTaskCount >= maxConcurrentTasks) {
      const canUpsellForMoreTasks = currentUserId !== "supreme-team" && currentUserId !== "flagship";
      setToast({
        id: Date.now(),
        message: canUpsellForMoreTasks
          ? `当前功能有${currentToolActiveTaskCount}个正在处理中的任务，升级会员添加更多任务`
          : `当前功能有${currentToolActiveTaskCount}个正在处理中的任务，已达上限，请等待完成后再继续添加`,
        tone: "warning"
      });
      if (canUpsellForMoreTasks) {
        setPayModalOpen(true);
      }
      return;
    }

    if (remainingStorageMb < GENERATE_STORAGE_COST_MB) {
      setToast({
        id: Date.now(),
        message: "剩余容量不足，请先扩展容量",
        tone: "warning"
      });
      setLimitModal({
        title: "当前存储容量不足",
        description: getStorageLimitDescription(remainingStorageMb)
      });
      return;
    }

    if (credits >= payload.generateCost) {
      const runSeed = Date.now();
      const taskId = generateRandomTenDigitId();
      const pendingItems = createPendingResultItems(tool, payload.sourceUploads, payload.outputCount, runSeed, taskId, payload.advancedSelections);
      const failIndex = tool.key === "set-main" ? -1 : pendingItems.length >= 4 ? pendingItems.length - 1 : -1;
      const nextTaskRecord: TaskRecord = {
        id: `${tool.key}-${taskId}`,
        toolKey: tool.key,
        taskId,
        createdAt: runSeed,
        totalCount: pendingItems.length,
        successCount: 0,
        failCount: 0,
        status: "queued",
        itemIds: pendingItems.map((item) => item.id),
        coverSrcs: [],
        snapshot: {
          mainUploads: payload.sourceUploads,
          referenceUploads: payload.referenceUploads ?? [],
          videoUploads: payload.videoUploads ?? [],
          advancedSelections: payload.advancedSelections,
          supplementValue: payload.supplementValue,
          creationModeSelection: payload.creationModeSelection
        }
      };

      setUserMetrics((current) => ({
        ...current,
        [currentUserId]: {
          ...current[currentUserId],
          credits: Math.max(0, current[currentUserId].credits - payload.generateCost),
          remainingStorageMb: Number(Math.max(0, current[currentUserId].remainingStorageMb - GENERATE_STORAGE_COST_MB).toFixed(1))
        }
      }));
      setResultItemsByTool((current) => ({
        ...current,
        [tool.key]: [...pendingItems, ...(current[tool.key] ?? [])]
      }));
      updateTaskRecords(tool.key, (records) => [nextTaskRecord, ...records]);
      setSelectedTaskIdByTool((current) => ({
        ...current,
        [tool.key]: taskId
      }));
      setToast({
        id: Date.now(),
        message: `已提交生成，消耗${payload.generateCost}积分和${formatStorageSize(GENERATE_STORAGE_COST_MB)}容量`
      });

      pendingItems.forEach((item, index) => {
        const startDelay = 500 + index * 900;
        const finishDelay = startDelay + 1500;

        scheduleResultUpdate(() => {
          updateResultItems(tool.key, (items) =>
            items.map((currentItem) =>
              currentItem.id === item.id
                ? {
                    ...currentItem,
                    status: "generating",
                    src: resultAssetPool[(runSeed + index) % resultAssetPool.length]
                  }
                : currentItem
            )
          );
          syncTaskRecordProgress(tool.key, taskId, item, "start");
        }, startDelay, item.id, "start");

        scheduleResultUpdate(() => {
          const finishedItem: ResultItem = {
            ...item,
            status: index === failIndex ? "failed" : "ready",
            src: resultAssetPool[(runSeed + index) % resultAssetPool.length]
          };
          updateResultItems(tool.key, (items) =>
            items.map((currentItem) =>
              currentItem.id === item.id
                ? finishedItem
                : currentItem
            )
          );
          syncTaskRecordProgress(tool.key, taskId, finishedItem, "finish");
        }, finishDelay, item.id, "finish");
      });

      return;
    }

    if (currentUser.canBuyPointsWhenInsufficient) {
      setToast({
        id: Date.now(),
        message: "积分不足，请先购买积分",
        tone: "warning"
      });
      setPointsModalOpen(true);
      return;
    }

    setToast({
      id: Date.now(),
      message: "升级会员获取更多积分",
      tone: "warning"
    });
    setPayModalOpen(true);
  };

  const handleAplusDraftChange = (toolKey: string, payload: GeneratePayload) => {
    setAplusDraftByTool((current) => ({
      ...current,
      [toolKey]: payload
    }));
  };

  const handleGenerateAplusPlan = (tool: ToolConfig, payload: GeneratePayload) => {
    if (!payload.sourceUploads.length) {
      setToast({
        id: Date.now(),
        message: "请先上传商品图后再生成规划方案",
        tone: "warning"
      });
      return;
    }

    const selectedModules = getSetPackSelectedTypes(payload.advancedSelections);
    if (!selectedModules.length) {
      setToast({
        id: Date.now(),
        message: "请先选择至少一个模块",
        tone: "warning"
      });
      return;
    }

    const signature = buildAplusPlanSignature(payload);
    const runToken = Date.now();
    aplusPlanRunRef.current[tool.key] = runToken;
    setResultTabsByTool((current) => ({
      ...current,
      [tool.key]: "results"
    }));
    setAplusStepByTool((current) => ({
      ...current,
      [tool.key]: 2
    }));
    setAplusDraftByTool((current) => ({
      ...current,
      [tool.key]: payload
    }));
    setAplusPlanByTool((current) => ({
      ...current,
      [tool.key]: {
        status: "generating",
        signature,
        modules: [],
        summary: []
      }
    }));

    window.setTimeout(() => {
      if (aplusPlanRunRef.current[tool.key] !== runToken) return;
      setAplusPlanByTool((current) => ({
        ...current,
        [tool.key]: {
          status: "ready",
          signature,
          summary: buildAplusPlanSummary(payload.advancedSelections),
          modules: buildAplusPlanModules(payload.advancedSelections),
          updatedAt: Date.now()
        }
      }));
    }, 880);
  };

  const updateAplusPlan = (toolKey: string, updater: (plan: AplusPlanState) => AplusPlanState) => {
    setAplusPlanByTool((current) => ({
      ...current,
      [toolKey]: updater(current[toolKey] ?? { status: "idle", modules: [] })
    }));
  };

  const handleResetAplusPlan = () => {
    aplusPlanRunRef.current[currentTool.key] = Date.now();
    setAplusStepByTool((current) => ({
      ...current,
      [currentTool.key]: 1
    }));
    setAplusPlanByTool((current) => ({
      ...current,
      [currentTool.key]: { status: "idle", modules: [] }
    }));
  };

  const handleDeleteAplusModule = (moduleId: string) => {
    updateAplusPlan(currentTool.key, (plan) => ({
      ...plan,
      modules: plan.modules.filter((item) => item.id !== moduleId)
    }));
  };

  const handleMoveAplusModule = (dragId: string, targetId: string) => {
    updateAplusPlan(currentTool.key, (plan) => {
      const nextModules = [...plan.modules];
      const dragIndex = nextModules.findIndex((item) => item.id === dragId);
      const targetIndex = nextModules.findIndex((item) => item.id === targetId);
      if (dragIndex < 0 || targetIndex < 0) return plan;
      const [dragItem] = nextModules.splice(dragIndex, 1);
      nextModules.splice(targetIndex, 0, dragItem);
      return {
        ...plan,
        modules: nextModules
      };
    });
  };

  const handleUpdateAplusModule = (moduleId: string, content: Partial<AplusPlanModule>) => {
    updateAplusPlan(currentTool.key, (plan) => ({
      ...plan,
      modules: plan.modules.map((item) => (item.id === moduleId ? { ...item, ...content } : item))
    }));
  };

  const handleGenerateAplusDetails = () => {
    const plan = aplusPlanByTool["set-aplus"];
    const draft = aplusDraftByTool["set-aplus"];
    if (!plan || plan.status !== "ready" || !draft) {
      setToast({
        id: Date.now(),
        message: "请先生成规划方案",
        tone: "warning"
      });
      return;
    }
    if (plan.signature !== buildAplusPlanSignature(draft)) {
      setToast({
        id: Date.now(),
        message: "左侧配置已变更，请重新生成规划方案",
        tone: "warning"
      });
      return;
    }
    const nextAdvancedSelections = {
      ...draft.advancedSelections,
      setPackSelectedTypes: JSON.stringify(
        plan.modules.map((module, index) => ({
          id: module.id,
          category: module.category,
          name: module.category,
          description: module.headline,
          tag: "A+模块",
          prompt: module.lines.join(" "),
          ratio: "3:4",
          resolution: "1K",
          count: 1,
          sortOrder: index + 1
        }))
      ),
      aplusPlanSummary: JSON.stringify(plan.summary ?? []),
      aplusPlanModules: JSON.stringify(plan.modules)
    };
    const unitCreditCost = draft.creationModeSelection?.unitCreditCost ?? 0;
    const outputCount = Math.max(1, plan.modules.length);
    handleGenerate(currentTool, {
      ...draft,
      advancedSelections: nextAdvancedSelections,
      outputCount,
      generateCost: outputCount * unitCreditCost,
      creationModeSelection: draft.creationModeSelection
        ? {
            ...draft.creationModeSelection,
            count: outputCount
          }
        : null
    });
  };

  const handleGenerateFashionScenes = (tool: ToolConfig, payload: GeneratePayload) => {
    if (!payload.sourceUploads.length) {
      setToast({
        id: Date.now(),
        message: "请先上传服装图片",
        tone: "warning"
      });
      return;
    }

    if (payload.advancedSelections.baselineModelSource === "mine") {
      if (!payload.advancedSelections.selectedModelId) {
        setToast({
          id: Date.now(),
          message: "请先选择我的模特，或先上传本地模特",
          tone: "warning"
        });
        return;
      }
    } else {
      const requiredKeys = ["gender", "appearance", "age", "persona", "bodyType"] as const;
      const missingRequired = requiredKeys.some((key) => !payload.advancedSelections[key]);
      if (missingRequired) {
        setToast({
          id: Date.now(),
          message: "请先完善 AI 生成模特参数",
          tone: "warning"
        });
        return;
      }
    }

    const signature = buildFashionSceneSignature(payload);
    const runToken = Date.now();
    fashionPlanRunRef.current[tool.key] = runToken;
    setResultTabsByTool((current) => ({
      ...current,
      [tool.key]: "results"
    }));
    setFashionStepByTool((current) => ({
      ...current,
      [tool.key]: 2
    }));
    setFashionDraftByTool((current) => ({
      ...current,
      [tool.key]: payload
    }));
    setFashionPlanByTool((current) => ({
      ...current,
      [tool.key]: {
        status: "generating",
        signature,
        modules: [],
        summary: []
      }
    }));

    window.setTimeout(() => {
      if (fashionPlanRunRef.current[tool.key] !== runToken) return;
      setFashionPlanByTool((current) => ({
        ...current,
        [tool.key]: {
          status: "ready",
          signature,
          summary: buildFashionSceneSummary(payload.advancedSelections, payload.sourceUploads.length),
          modules: buildFashionSceneModules(payload.advancedSelections),
          updatedAt: Date.now()
        }
      }));
    }, 880);
  };

  const updateFashionPlan = (toolKey: string, updater: (plan: AplusPlanState) => AplusPlanState) => {
    setFashionPlanByTool((current) => ({
      ...current,
      [toolKey]: updater(current[toolKey] ?? { status: "idle", modules: [] })
    }));
  };

  const handleResetFashionPlan = () => {
    fashionPlanRunRef.current[currentTool.key] = Date.now();
    setFashionStepByTool((current) => ({
      ...current,
      [currentTool.key]: 1
    }));
    setFashionPlanByTool((current) => ({
      ...current,
      [currentTool.key]: { status: "idle", modules: [] }
    }));
  };

  const handleDeleteFashionScene = (moduleId: string) => {
    updateFashionPlan(currentTool.key, (plan) => ({
      ...plan,
      modules: plan.modules.filter((item) => item.id !== moduleId)
    }));
  };

  const handleMoveFashionScene = (dragId: string, targetId: string) => {
    updateFashionPlan(currentTool.key, (plan) => {
      const nextModules = [...plan.modules];
      const dragIndex = nextModules.findIndex((item) => item.id === dragId);
      const targetIndex = nextModules.findIndex((item) => item.id === targetId);
      if (dragIndex < 0 || targetIndex < 0) return plan;
      const [dragItem] = nextModules.splice(dragIndex, 1);
      nextModules.splice(targetIndex, 0, dragItem);
      return {
        ...plan,
        modules: nextModules
      };
    });
  };

  const handleUpdateFashionScene = (moduleId: string, content: Partial<AplusPlanModule>) => {
    updateFashionPlan(currentTool.key, (plan) => ({
      ...plan,
      modules: plan.modules.map((item) => (item.id === moduleId ? { ...item, ...content } : item))
    }));
  };

  const handleGenerateFashionResults = () => {
    const plan = fashionPlanByTool["set-fashion"];
    const draft = fashionDraftByTool["set-fashion"];
    if (!plan || plan.status !== "ready" || !draft) {
      setToast({
        id: Date.now(),
        message: "请先生成推荐场景",
        tone: "warning"
      });
      return;
    }
    if (plan.signature !== buildFashionSceneSignature(draft)) {
      setToast({
        id: Date.now(),
        message: "第1步信息已变更，请重新生成推荐场景",
        tone: "warning"
      });
      return;
    }

    const sceneTypes = buildFashionSceneTypes(plan.modules);
    const outputCount = Math.max(1, sceneTypes.length);
    const fallbackModeSelection = getDefaultCreationModeSelection("set-pack", outputCount);
    const resolvedCreationModeSelection = draft.creationModeSelection
      ? { ...draft.creationModeSelection, count: outputCount }
      : fallbackModeSelection;
    const unitCreditCost = resolvedCreationModeSelection?.unitCreditCost ?? 0;

    handleGenerate(currentTool, {
      ...draft,
      advancedSelections: {
        ...draft.advancedSelections,
        setPackSelectedTypes: JSON.stringify(sceneTypes),
        fashionSceneSummary: JSON.stringify(plan.summary ?? []),
        fashionSceneModules: JSON.stringify(plan.modules)
      },
      outputCount,
      generateCost: outputCount * unitCreditCost,
      creationModeSelection: resolvedCreationModeSelection
    });
  };

  const handleResultTabChange = (toolKey: string, tab: ResultTabKey) => {
    setResultTabsByTool((current) => ({
      ...current,
      [toolKey]: tab
    }));
  };

  const handleToggleResultItem = (toolKey: string, itemId: string) => {
    updateResultItems(toolKey, (items) =>
      items.map((item) => (item.id === itemId && item.status === "ready" ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleToggleResultSelectAll = (toolKey: string, checked: boolean) => {
    updateResultItems(toolKey, (items) =>
      items.map((item) => (item.status === "ready" ? { ...item, selected: checked } : item))
    );
  };

  const performSingleDownload = async (item: ResultItem, preserveVisibleMark: boolean) => {
    try {
      const extension = inferExtensionFromResult(item);
      const originalBlob = await getResultBlob(item);
      const blob = preserveVisibleMark ? await addAiVisibleWatermark(originalBlob, item) : originalBlob;
      triggerDownload(blob, `${item.fileName}.${extension}`);
      setToast({
        id: Date.now(),
        message: `已下载 ${item.fileName}.${extension}`
      });
    } catch (error) {
      setToast({
        id: Date.now(),
        message: error instanceof Error ? error.message : "下载失败，请稍后重试",
        tone: "warning"
      });
    }
  };

  const performBatchDownload = async (tool: ToolConfig, preserveVisibleMark: boolean) => {
    const selectedItems = (resultItemsByTool[tool.key] ?? []).filter((item) => item.status === "ready" && item.selected);
    if (!selectedItems.length) {
      setToast({
        id: Date.now(),
        message: "请先选择需要下载的结果",
        tone: "warning"
      });
      return;
    }

    try {
      const zipEntries = await Promise.all(
        selectedItems.map(async (item) => {
          const originalBlob = await getResultBlob(item);
          const blob = preserveVisibleMark ? await addAiVisibleWatermark(originalBlob, item) : originalBlob;
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const extension = inferExtensionFromResult(item);
          return {
            fileName: `${item.fileName}.${extension}`,
            bytes
          } satisfies ZipEntry;
        })
      );
      const zipBlob = createZipBlob(zipEntries);
      const taskId = selectedItems[0]?.taskId ?? generateRandomTenDigitId();
      const zipName = `${tool.panelTitle}_${taskId}_${formatTaskTimestamp(Date.now())}.zip`;
      triggerDownload(zipBlob, zipName);
      setToast({
        id: Date.now(),
        message: `已打包下载${selectedItems.length}${tool.key.startsWith("video-") ? "个视频" : "张图片"}`
      });
    } catch (error) {
      setToast({
        id: Date.now(),
        message: error instanceof Error ? error.message : "打包下载失败，请稍后重试",
        tone: "warning"
      });
    }
  };

  const handleExportConfirm = async (preserveVisibleMark: boolean, skipForSevenDays: boolean) => {
    const pendingAction = exportPendingAction;
    setExportPendingAction(null);

    if (!pendingAction) return;

    if (skipForSevenDays) {
      saveExportPreference({
        preserveVisibleMark,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
      });
    } else {
      clearExportPreference();
    }

    if (pendingAction.type === "single") {
      await performSingleDownload(pendingAction.item, preserveVisibleMark);
      return;
    }

    await performBatchDownload(pendingAction.tool, preserveVisibleMark);
  };

  const handleDownloadItem = async (item: ResultItem) => {
    const isMemberUser = currentUserId !== "free";
    if (!isMemberUser) {
      await performSingleDownload(item, false);
      return;
    }

    const preference = loadExportPreference();
    if (preference) {
      await performSingleDownload(item, preference.preserveVisibleMark);
      return;
    }

    setExportPendingAction({
      type: "single",
      item
    });
  };

  const handleDownloadResults = async (tool: ToolConfig) => {
    const selectedItems = (resultItemsByTool[tool.key] ?? []).filter((item) => item.status === "ready" && item.selected);
    if (!selectedItems.length) {
      setToast({
        id: Date.now(),
        message: "请先选择需要下载的结果",
        tone: "warning"
      });
      return;
    }

    const isMemberUser = currentUserId !== "free";
    if (!isMemberUser) {
      await performBatchDownload(tool, false);
      return;
    }

    const preference = loadExportPreference();
    if (preference) {
      await performBatchDownload(tool, preference.preserveVisibleMark);
      return;
    }

    setExportPendingAction({
      type: "batch",
      tool
    });
  };

  const performTaskBatchDownload = async (task: TaskRecord, preserveVisibleMark: boolean) => {
    const taskReadyItems = (resultItemsByTool[task.toolKey] ?? []).filter(
      (resultItem) => resultItem.taskId === task.taskId && resultItem.status === "ready"
    );
    if (!taskReadyItems.length) {
      setToast({
        id: Date.now(),
        message: "当前任务暂无可下载结果",
        tone: "warning"
      });
      return;
    }

    try {
      const zipEntries = await Promise.all(
        taskReadyItems.map(async (taskItem) => {
          const originalBlob = await getResultBlob(taskItem);
          const blob = preserveVisibleMark ? await addAiVisibleWatermark(originalBlob, taskItem) : originalBlob;
          return {
            fileName: `${taskItem.fileName}.${inferExtensionFromResult(taskItem)}`,
            bytes: new Uint8Array(await blob.arrayBuffer())
          } satisfies ZipEntry;
        })
      );
      triggerDownload(createZipBlob(zipEntries), `${task.toolKey}_${task.taskId}_${formatTaskTimestamp(Date.now())}.zip`);
      setToast({
        id: Date.now(),
        message: `已打包下载该任务下 ${taskReadyItems.length} 张图片`
      });
    } catch (error) {
      setToast({
        id: Date.now(),
        message: error instanceof Error ? error.message : "打包下载失败，请稍后重试",
        tone: "warning"
      });
    }
  };

  const handleDownloadTaskResults = async (task: TaskRecord) => {
    if (task.toolKey === "more-title") {
      handleExportMoreTitleTask(task.taskId);
      return;
    }
    const isMemberUser = currentUserId !== "free";
    if (!isMemberUser) {
      await performTaskBatchDownload(task, false);
      return;
    }

    const preference = loadExportPreference();
    if (preference) {
      await performTaskBatchDownload(task, preference.preserveVisibleMark);
      return;
    }
    await performTaskBatchDownload(task, false);
  };

  const handleDownloadModel = async (item: ModelAsset) => {
    try {
      const response = await fetch(item.src);
      const blob = await response.blob();
      triggerDownload(blob, item.name);
      setToast({
        id: Date.now(),
        message: `已下载 ${item.name}`
      });
    } catch {
      setToast({
        id: Date.now(),
        message: "模特下载失败，请稍后重试",
        tone: "warning"
      });
    }
  };

  const handleDeleteModel = (item: ModelAsset) => {
    if (item.sourceType === "upload") {
      setUploadedModels((current) => current.filter((model) => model.id !== item.id));
      setUserMetrics((current) => ({
        ...current,
        [currentUserId]: {
          ...current[currentUserId],
          remainingStorageMb: Number((current[currentUserId].remainingStorageMb + item.sizeMb).toFixed(1))
        }
      }));
    } else {
      updateResultItems("model-generate", (items) => items.filter((result) => result.id !== item.id));
      const resultItem = (resultItemsByTool["model-generate"] ?? []).find((result) => result.id === item.id);
      if (resultItem) {
        removeResultFromTask("model-generate", resultItem);
      }
    }

    setSelectedMineModelId((current) => (current === item.id ? "" : current));
    setToast({
      id: Date.now(),
      message: "已删除模特"
    });
  };

  const handleOpenModelGenerate = () => {
    setActivePage("workspace");
    setActivePrimary("model");
    setActiveTool("model-generate");
    setCollapsed(false);
    setToast({
      id: Date.now(),
      message: "已跳转到模特生成"
    });
  };

  const handleRetryResult = (toolKey: string, itemId: string) => {
    const retrySeed = Date.now();
    let retryItemSnapshot: ResultItem | undefined;
    updateResultItems(toolKey, (items) =>
      items.map((item) =>
        item.id === itemId
          ? (() => {
              const nextItem: ResultItem = {
                ...item,
                status: "generating",
                selected: false,
                src: resultAssetPool[retrySeed % resultAssetPool.length]
              };
              retryItemSnapshot = nextItem;
              return nextItem;
            })()
          : item
      )
    );
    if (retryItemSnapshot) {
      syncTaskRecordProgress(toolKey, retryItemSnapshot.taskId, retryItemSnapshot, "retry-start");
    }
    scheduleResultUpdate(() => {
      let completedItemSnapshot: ResultItem | undefined;
      updateResultItems(toolKey, (items) =>
        items.map((item) =>
          item.id === itemId
            ? (() => {
                const nextItem: ResultItem = {
                  ...item,
                  status: "ready",
                  src: resultAssetPool[(retrySeed + 1) % resultAssetPool.length]
                };
                completedItemSnapshot = nextItem;
                return nextItem;
              })()
            : item
        )
      );
      if (completedItemSnapshot) {
        syncTaskRecordProgress(toolKey, completedItemSnapshot.taskId, completedItemSnapshot, "finish");
      }
    }, 1400, itemId, "retry");
  };

  const handlePreviewResult = (item: ResultItem) => {
    setPreviewResultItem(item);
  };

  const handleOpenResultDetail = (item: ResultItem, source: DetailRouteSource = "workspace") => {
    navigate(buildResultDetailPath(item, source));
  };

  const handleCloseResultDetail = () => {
    if (detailRoute) {
      const fallbackPath = detailRoute.source === "mine" ? "/mine/creation" : `/tools/${detailRoute.toolKey}`;
      navigate(fallbackPath);
      return;
    }
    navigate(activeBasePath);
  };

  const handleNavigateResultDetail = (direction: -1 | 1) => {
    if (!detailRoute || !activeDetailResultItem) return;
    const currentIndex = detailTaskItems.findIndex((resultItem) => resultItem.id === activeDetailResultItem.id);
    if (currentIndex < 0) return;
    const nextItem = detailTaskItems[currentIndex + direction];
    if (!nextItem) return;
    navigate(buildResultDetailPath(nextItem, detailRoute.source), { replace: true });
  };

  const handleOpenEditResultText = (item: ResultItem) => {
    setEditingResultItem(item);
    setEditingResultText(item.overlayText ?? "");
  };

  const handleConfirmEditResultText = () => {
    if (!editingResultItem) return;
    updateResultItems(editingResultItem.toolKey, (items) =>
      items.map((item) =>
        item.id === editingResultItem.id
          ? {
              ...item,
              overlayText: editingResultText.trim()
            }
          : item
      )
    );
    setEditingResultItem(null);
    setEditingResultText("");
    setToast({
      id: Date.now(),
      message: "已更新图片文案"
    });
  };

  const handleDeleteFailedResult = (toolKey: string, itemId: string) => {
    let removedItem: ResultItem | undefined;
    updateResultItems(toolKey, (items) =>
      items.filter((item) => {
        if (item.id === itemId) {
          removedItem = item;
          return false;
        }
        return true;
      })
    );
    if (removedItem) {
      removeResultFromTask(toolKey, removedItem);
      setToast({
        id: Date.now(),
        message: "已删除失败结果"
      });
    }
  };

  const handleDeleteReadyResult = (item: ResultItem) => {
    updateResultItems(item.toolKey, (items) => items.filter((resultItem) => resultItem.id !== item.id));
    removeResultFromTask(item.toolKey, item);
    setToast({
      id: Date.now(),
      message: "已删除当前结果"
    });
  };

  const handleCancelQueuedResult = (toolKey: string, itemId: string) => {
    let removedItem: ResultItem | undefined;
    let refundCredits = 0;
    let taskRecordSnapshot: TaskRecord | undefined;

    clearScheduledResultUpdates(itemId);
    const currentToolRecords = taskRecordsByTool[toolKey] ?? [];
    updateResultItems(toolKey, (items) =>
      items.filter((item) => {
        if (item.id === itemId) {
          removedItem = item;
          taskRecordSnapshot = currentToolRecords.find((record) => record.taskId === item.taskId);
          if (taskRecordSnapshot) {
            const uploadCount = taskRecordSnapshot.snapshot.mainUploads.length || 1;
            const unitCreditCost = taskRecordSnapshot.snapshot.creationModeSelection?.unitCreditCost ?? 0;
            refundCredits = getQueuedResultRefundCredits(taskRecordSnapshot.toolKey, uploadCount, unitCreditCost);
          }
          return false;
        }
        return true;
      })
    );

    if (removedItem) {
      removeResultFromTask(toolKey, removedItem);
      if (refundCredits > 0) {
        setUserMetrics((current) => ({
          ...current,
          [currentUserId]: {
            ...current[currentUserId],
            credits: current[currentUserId].credits + refundCredits
          }
        }));
      }
      setToast({
        id: Date.now(),
        message: refundCredits > 0 ? `已取消排队任务，退回${refundCredits}积分` : "已取消排队任务"
      });
    }
  };

  const handleConfirmResultAction = () => {
    if (!resultActionConfirm) return;
    if (resultActionConfirm.type === "delete-failed") {
      handleDeleteFailedResult(resultActionConfirm.toolKey, resultActionConfirm.itemId);
    } else {
      handleCancelQueuedResult(resultActionConfirm.toolKey, resultActionConfirm.itemId);
    }
    setResultActionConfirm(null);
  };

  const handleSelectTaskRecord = (record: TaskRecord) => {
    setActivePage("workspace");
    const targetTool = toolMap[record.toolKey];
    if (targetTool) {
      setActivePrimary(targetTool.primaryKey);
      setActiveTool(targetTool.key);
    }
    setSelectedTaskIdByTool((current) => ({
      ...current,
      [record.toolKey]: record.taskId
    }));
    setResultTabsByTool((current) => ({
      ...current,
      [record.toolKey]: "results"
    }));
    setUploads((current) => ({
      ...current,
      [`${record.toolKey}:main`]: record.snapshot.mainUploads,
      [`${record.toolKey}:reference`]: record.snapshot.referenceUploads,
      [`${record.toolKey}:video`]: record.snapshot.videoUploads ?? []
    }));
    setSupplementValues((current) => ({
      ...current,
      [record.toolKey]: record.snapshot.supplementValue
    }));
  };

  const handleSelectResultRecord = (item: ResultItem) => {
    setActivePage("workspace");
    const targetTool = toolMap[item.toolKey];
    if (targetTool) {
      setActivePrimary(targetTool.primaryKey);
      setActiveTool(targetTool.key);
    }
    const relatedTask = (taskRecordsByTool[item.toolKey] ?? []).find((record) => record.taskId === item.taskId);
    if (relatedTask) {
      handleSelectTaskRecord(relatedTask);
      return;
    }
    setResultTabsByTool((current) => ({
      ...current,
      [item.toolKey]: "results"
    }));
    setSelectedTaskIdByTool((current) => ({
      ...current,
      [item.toolKey]: item.taskId
    }));
  };

  const handleUseResultTool = (toolKey: string, actionLabel: string, item: ResultItem) => {
    const targetTool = toolMap[toolKey];
    if (!targetTool || !item.src) return;
    setActivePage("workspace");
    setActivePrimary(targetTool.primaryKey);
    setActiveTool(targetTool.key);
    setCollapsed(false);
    setUploads((current) => ({
      ...current,
      [`${toolKey}:main`]: [
        {
          id: generateRandomTenDigitId(),
          name: `${item.fileName}.png`,
          src: item.src,
          previewSrc: item.src,
          sizeMb: 6,
          status: "ready"
        }
      ]
    }));
    navigate(`/tools/${toolKey}`);
    setToast({
      id: Date.now(),
      message: `已将当前图片送入${actionLabel}`
    });
  };

  const handleOpenCaseTemplate = (template: CaseTemplate) => {
    setActiveCaseTemplate(template);
  };

  const handleApplyCaseTemplate = (template: CaseTemplate) => {
    const targetTool = toolMap[template.toolKey];
    if (targetTool) {
      setActivePage("workspace");
      setActivePrimary(targetTool.primaryKey);
      setActiveTool(targetTool.key);
    }
    setUploads((current) => ({
      ...current,
      [`${template.toolKey}:main`]: [
        {
          id: generateRandomTenDigitId(),
          name: `${template.title}.png`,
          src: template.sourceImage,
          sizeMb: 6,
          status: "ready"
        }
      ]
    }));
    setSupplementValues((current) => ({
      ...current,
      [template.toolKey]: template.description
    }));
    setResultTabsByTool((current) => ({
      ...current,
      [template.toolKey]: "results"
    }));
    setActiveCaseTemplate(null);
    setToast({
      id: Date.now(),
      message: "已载入案例原图，可直接生成同款"
    });
  };

  const handleShareCaseTemplate = async (template: CaseTemplate) => {
    const shareUrl = `https://demo.chuangkit.com/case/${template.toolKey}/${template.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setToast({
        id: Date.now(),
        message: "案例分享链接已复制"
      });
    } catch {
      setToast({
        id: Date.now(),
        message: shareUrl
      });
    }
  };

  const handleSwitchUser = (userId: UserTierId) => {
    const nextUser = userTierProfiles.find((item) => item.id === userId) ?? userTierProfiles[0];
    setCurrentUserId(nextUser.id);
    setUserMenuOpen(false);
    setPointsBalanceOpen(false);
    setPointsModalOpen(false);
    setPayModalOpen(false);
    setPointsRecordOpen(false);
    setToast({
      id: Date.now(),
      message: `已切换为${nextUser.label}`
    });
  };

  const handleUpdateCurrentUserMetric = (key: keyof UserTierMetrics, value: number) => {
    setUserMetrics((current) => ({
      ...current,
      [currentUserId]: {
        ...current[currentUserId],
        [key]: Math.max(0, Number.isFinite(value) ? value : 0)
      }
    }));
  };

  const handleSupplementChange = (toolKey: string, value: string) => {
    setSupplementValues((current) => ({
      ...current,
      [toolKey]: value
    }));
  };

  const handleSupplementAiPolish = async (toolKey: string, value: string, context?: SupplementAiPolishContext) =>
    runSupplementAiPolish(toolKey, value, context);

  const handleSupplementAiAssist = async (
    toolKey: string,
    uploadsForTool: UploadItem[],
    advancedConfig?: AdvancedSettingsConfig,
    context?: SupplementAiPolishContext
  ) => {
    if (!uploadsForTool.length) return null;
    const _prompt = advancedAiAssistPromptConfigs[toolKey] ?? advancedAiAssistPromptConfigs["goods-marketing"] ?? "";
    const assistResult = buildAdvancedAiAssistResult(toolKey, uploadsForTool, advancedConfig);
    const seedInput = dedupeStrings([
      ...Object.values(assistResult.fieldValues),
      assistResult.supplementValue ?? "",
      ...(context?.creationModeValues ?? [])
    ]).join("，");
    const polishResult = seedInput ? await runSupplementAiPolish(toolKey, seedInput, context) : null;

    return {
      fieldValues: assistResult.fieldValues,
      supplementValue: polishResult?.canUse ? polishResult.applyContent ?? assistResult.supplementValue : assistResult.supplementValue
    } satisfies AdvancedAiAssistResult;
  };

  const handleGenerateSetPackTitles = (taskId: string) => {
    const targetTask = (taskRecordsByTool["set-main"] ?? []).find((record) => record.taskId === taskId);
    if (!targetTask) return;
    const titleCandidates = buildSetPackTitleRecommendations(targetTask.snapshot.advancedSelections);
    updateTaskRecords("set-main", (records) =>
      records.map((record) =>
        record.taskId === taskId
          ? {
              ...record,
              snapshot: {
                ...record.snapshot,
                advancedSelections: {
                  ...record.snapshot.advancedSelections,
                  setPackTitleCandidates: JSON.stringify(titleCandidates)
                }
              }
            }
          : record
      )
    );
    setToast({
      id: Date.now(),
      message: "已生成 3 组上架标题"
    });
  };

  const handleApplySetPackTitle = (taskId: string, title: string) => {
    updateTaskRecords("set-main", (records) =>
      records.map((record) =>
        record.taskId === taskId
          ? {
              ...record,
              snapshot: {
                ...record.snapshot,
                advancedSelections: {
                  ...record.snapshot.advancedSelections,
                  setPackSelectedTitle: title
                }
              }
            }
          : record
      )
    );
    setToast({
      id: Date.now(),
      message: "已应用标题方案"
    });
  };

  const updateMoreTitleTaskRows = (taskId: string, updater: (rows: MoreTitleGeneratedRow[]) => MoreTitleGeneratedRow[]) => {
    updateTaskRecords("more-title", (records) =>
      records.map((record) => {
        if (record.taskId !== taskId) return record;
        const currentRows = parseMoreTitleGeneratedRows(record.snapshot.advancedSelections.moreTitleGeneratedRows);
        const nextRows = updater(currentRows);
        return {
          ...record,
          snapshot: {
            ...record.snapshot,
            advancedSelections: {
              ...record.snapshot.advancedSelections,
              moreTitleGeneratedRows: JSON.stringify(nextRows)
            }
          }
        };
      })
    );
  };

  const handleApplyMoreTitleCandidate = (taskId: string, rowId: string, candidateIndex: number) => {
    updateMoreTitleTaskRows(taskId, (rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              selectedCandidateIndex: candidateIndex,
              finalTitle: row.candidates[candidateIndex]?.title ?? row.finalTitle
            }
          : row
      )
    );
  };

  const handleChangeMoreTitleFinal = (taskId: string, rowId: string, value: string) => {
    updateMoreTitleTaskRows(taskId, (rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              finalTitle: value
            }
          : row
      )
    );
  };

  const handleCopyMoreTitleTask = async (taskId: string) => {
    const task = (taskRecordsByTool["more-title"] ?? []).find((record) => record.taskId === taskId);
    if (!task) return;
    const rows = parseMoreTitleGeneratedRows(task.snapshot.advancedSelections.moreTitleGeneratedRows);
    const content = rows.map((row) => row.finalTitle.trim()).filter(Boolean).join("\n");
    if (!content) {
      setToast({
        id: Date.now(),
        message: "当前任务暂无可复制标题",
        tone: "warning"
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      setToast({
        id: Date.now(),
        message: `已复制 ${rows.length} 条最终标题`
      });
    } catch {
      setToast({
        id: Date.now(),
        message: "复制失败，请稍后重试",
        tone: "warning"
      });
    }
  };

  const handleExportMoreTitleTask = (taskId: string) => {
    const task = (taskRecordsByTool["more-title"] ?? []).find((record) => record.taskId === taskId);
    if (!task) return;
    const rows = parseMoreTitleGeneratedRows(task.snapshot.advancedSelections.moreTitleGeneratedRows);
    if (!rows.length) {
      setToast({
        id: Date.now(),
        message: "当前任务暂无可导出标题",
        tone: "warning"
      });
      return;
    }
    const header = ["商品名", "品牌", "类目", "原始标题", "最终标题", "默认方案", "平台", "地区", "语言"];
    const csvLines = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.productName,
          row.brand,
          row.category,
          row.originalTitle,
          row.finalTitle,
          row.candidates[row.selectedCandidateIndex]?.label ?? "",
          task.snapshot.advancedSelections.platform ?? "",
          task.snapshot.advancedSelections.region ?? "",
          task.snapshot.advancedSelections.language ?? ""
        ]
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
    ];
    triggerDownload(new Blob([`\uFEFF${csvLines.join("\n")}`], { type: "text/csv;charset=utf-8;" }), `批量标题_${taskId}.csv`);
    setToast({
      id: Date.now(),
      message: `已导出 ${rows.length} 条标题`
    });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (currentTool.key !== "set-aplus" || !currentSelectedTask) return;
    const summary = safeParseJson<string[]>(currentSelectedTask.snapshot.advancedSelections.aplusPlanSummary, []);
    const modules = safeParseJson<AplusPlanModule[]>(currentSelectedTask.snapshot.advancedSelections.aplusPlanModules, []);
    if (!summary?.length && !modules?.length) return;
    const signature = buildAplusPlanSignature({
      generateCost: 0,
      outputCount: modules?.length ?? 0,
      sourceUploads: currentSelectedTask.snapshot.mainUploads,
      referenceUploads: currentSelectedTask.snapshot.referenceUploads,
      videoUploads: currentSelectedTask.snapshot.videoUploads ?? [],
      advancedSelections: currentSelectedTask.snapshot.advancedSelections,
      supplementValue: currentSelectedTask.snapshot.supplementValue,
      creationModeSelection: currentSelectedTask.snapshot.creationModeSelection
    });
    setAplusPlanByTool((current) => ({
      ...current,
      "set-aplus": {
        status: "ready",
        signature,
        summary: summary ?? [],
        modules: modules ?? [],
        updatedAt: currentSelectedTask.createdAt
      }
    }));
  }, [currentSelectedTask, currentTool.key]);

  useEffect(() => {
    if (currentTool.key !== "set-fashion" || !currentSelectedTask) return;
    const summary = safeParseJson<string[]>(currentSelectedTask.snapshot.advancedSelections.fashionSceneSummary, []);
    const modules = safeParseJson<AplusPlanModule[]>(currentSelectedTask.snapshot.advancedSelections.fashionSceneModules, []);
    if (!summary?.length && !modules?.length) return;
    const signature = buildFashionSceneSignature({
      generateCost: 0,
      outputCount: modules?.length ?? 0,
      sourceUploads: currentSelectedTask.snapshot.mainUploads,
      referenceUploads: currentSelectedTask.snapshot.referenceUploads,
      videoUploads: currentSelectedTask.snapshot.videoUploads ?? [],
      advancedSelections: currentSelectedTask.snapshot.advancedSelections,
      supplementValue: currentSelectedTask.snapshot.supplementValue,
      creationModeSelection: currentSelectedTask.snapshot.creationModeSelection
    });
    setFashionPlanByTool((current) => ({
      ...current,
      "set-fashion": {
        status: "ready",
        signature,
        summary: summary ?? [],
        modules: modules ?? [],
        updatedAt: currentSelectedTask.createdAt
      }
    }));
    setFashionStepByTool((current) => ({
      ...current,
      "set-fashion": 2
    }));
  }, [currentSelectedTask, currentTool.key]);

  usePageMeta({
    title:
      detailRoute && activeDetailResultItem
        ? `${detailToolOption?.label ?? activeDetailResultItem.toolKey} 结果详情 - 创客贴 AI 电商`
        : activePage === "mine"
        ? mineTab === "models"
          ? "我的模特 - 创客贴 AI 电商"
          : "我的创作 - 创客贴 AI 电商"
        : `${currentTool.panelTitle} - 创客贴 AI 电商`,
    description:
      detailRoute && activeDetailResultItem
        ? "创客贴 AI 电商结果详情页，可直接通过地址访问并在同任务内切换查看结果。"
        : activePage === "mine"
        ? mineTab === "models"
          ? "创客贴 AI 电商我的模特页面，集中管理用户上传和 AI 生成的模特素材。"
          : "创客贴 AI 电商我的创作页面，集中查看全部功能下的创作任务与结果。"
        : `创客贴 AI 电商 ${currentTool.panelTitle} 页面，按照 Figma 稿还原的工具框架页面。`,
    keywords:
      detailRoute && activeDetailResultItem
        ? "创客贴,AI电商,结果详情,创作记录,大图预览"
        : activePage === "mine"
        ? mineTab === "models"
          ? "创客贴,AI电商,我的模特,模特管理"
          : "创客贴,AI电商,我的创作,创作记录"
        : `创客贴,AI电商,${currentTool.panelTitle},AI商品图`
  });

  return (
    <div className={`ck-page${collapsed ? " sidebar-collapsed" : ""}`}>
      <TopBar
        credits={credits}
        currentUser={currentUser}
        onOpenMembership={handleOpenMembership}
        onOpenPointsBalance={handleOpenPointsBalance}
        onOpenUserMenu={() => setUserMenuOpen((value) => !value)}
      />
      {userMenuOpen ? (
        <div className="ck-user-menu-mask" onClick={() => setUserMenuOpen(false)}>
          <div className="ck-user-menu" onClick={(event) => event.stopPropagation()}>
            <div className="ck-user-menu-title">切换用户身份</div>
            {userTierProfiles.map((user) => (
              <button
                className={`ck-user-menu-item${user.id === currentUser.id ? " active" : ""}`}
                key={user.id}
                onClick={() => handleSwitchUser(user.id)}
                type="button"
              >
                <div className="ck-user-menu-item-main">
                  <img alt={user.name} src={user.avatar} />
                  <span>
                    <strong>{user.label}</strong>
                    <em>{user.teamLabel}</em>
                  </span>
                </div>
                <i>{user.id === currentUser.id ? "当前" : ""}</i>
              </button>
            ))}
            <div className="ck-user-menu-settings">
              <label className="ck-user-menu-field">
                <span>剩余积分</span>
                <input
                  min="0"
                  onChange={(event) => handleUpdateCurrentUserMetric("credits", Number(event.target.value))}
                  type="number"
                  value={credits}
                />
              </label>
              <label className="ck-user-menu-field">
                <span>团队积分</span>
                <input
                  min="0"
                  onChange={(event) => handleUpdateCurrentUserMetric("teamCredits", Number(event.target.value))}
                  type="number"
                  value={teamCredits}
                />
              </label>
              <label className="ck-user-menu-field">
                <span>剩余容量(MB)</span>
                <input
                  min="0"
                  onChange={(event) => handleUpdateCurrentUserMetric("remainingStorageMb", Number(event.target.value))}
                  type="number"
                  value={remainingStorageMb}
                />
              </label>
              <label className="ck-user-menu-field">
                <span>并发任务</span>
                <input
                  min="1"
                  onChange={(event) => handleUpdateCurrentUserMetric("maxConcurrentTasks", Number(event.target.value))}
                  type="number"
                  value={maxConcurrentTasks}
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}
      <div className="ck-body">
        <div className={`ck-nav-shell${activePage === "workspace" && collapsed ? " collapsed" : ""}${activePage === "mine" ? " mine" : ""}`}>
          <SideRail
            activePrimary={activePrimary}
            isMineActive={activePage === "mine"}
            onOpenMine={() => setActivePage("mine")}
            onSelectPrimary={handlePrimaryChange}
          />
          {activePage === "workspace" ? (
            <SecondaryMenu
              activeTool={activeTool}
              collapsed={collapsed}
              onToggle={() => setCollapsed((value) => !value)}
              onSelectTool={setActiveTool}
              title={currentGroup.label}
              tools={currentGroup.tools}
            />
          ) : (
            <MineSecondaryMenu activeTab={mineTab} onSelectTab={setMineTab} />
          )}
        </div>
        {activePage === "mine" ? (
          mineTab === "creation" ? (
            <MyCreationPage
              mode={creationHistoryMode}
              onChangeMode={setCreationHistoryMode}
              onChangeToolKey={setCreationHistoryToolKey}
              onDownloadItem={handleDownloadItem}
              onOpenDetail={(item) => handleOpenResultDetail(item, "mine")}
              onSelectTask={handleSelectTaskRecord}
              resultItems={filteredCreationResultItems}
              selectedTaskIdsByTool={selectedTaskIdByTool}
              selectedToolKey={creationHistoryToolKey}
              taskRecords={filteredCreationTaskRecords}
              toolOptions={toolOptions.map(({ key, label }) => ({ key, label }))}
            />
          ) : (
            <MyModelsPage
              filter={modelFilterTab}
              items={filteredMineModels}
              onChangeFilter={setModelFilterTab}
              onOpenDetail={(item) => setSelectedMineModelId(item.id)}
              onOpenGenerate={handleOpenModelGenerate}
              onUpload={(files) => {
                void handleUploadModels(files);
              }}
            />
          )
        ) : (
          <>
            <ConfigPanel
              aplusPlan={currentAplusPlan}
              aplusPlanStep={currentAplusStep}
              aplusPlanStale={Boolean(currentAplusPlanStale)}
              fashionPlan={currentFashionPlan}
              fashionPlanStep={currentFashionStep}
              fashionPlanStale={Boolean(currentFashionPlanStale)}
              modelAssets={allMineModels}
              onAddUpload={handleAddUpload}
              onBackAplusStep={handleResetAplusPlan}
              onBackFashionStep={handleResetFashionPlan}
              onDeleteAplusModule={handleDeleteAplusModule}
              onDeleteFashionScene={handleDeleteFashionScene}
              onAtLimit={handleAtLimit}
              onGenerate={handleGenerate}
              onGenerateAplusDetails={handleGenerateAplusDetails}
              onGenerateAplusPlan={handleGenerateAplusPlan}
              onGenerateFashionResults={handleGenerateFashionResults}
              onGenerateFashionScenes={handleGenerateFashionScenes}
              onAplusDraftChange={handleAplusDraftChange}
              onMoveAplusModule={handleMoveAplusModule}
              onMoveFashionScene={handleMoveFashionScene}
              onGenerateBaselineModel={handleGenerateBaselineModel}
              onNavigateTool={(toolKey) => {
                setActivePage("workspace");
                setActivePrimary("model");
                setActiveTool(toolKey);
                setCollapsed(false);
              }}
              onOpenLibrary={handleOpenLibrary}
              onRejectedUpload={handleRejectedUpload}
              onRemoveUpload={handleRemoveUpload}
              onSupplementAiAssist={handleSupplementAiAssist}
              onSupplementAiPolish={handleSupplementAiPolish}
              onSupplementChange={handleSupplementChange}
              onUpdateUploadItems={handleUpdateUploadItems}
              onUpdateAplusModule={handleUpdateAplusModule}
              onUpdateFashionScene={handleUpdateFashionScene}
              onUploadModels={handleUploadModels}
              onToast={(message, tone) =>
                setToast({
                  id: Date.now(),
                  message,
                  tone
                })
              }
              remainingStorageMb={remainingStorageMb}
              restoredTask={currentSelectedTask}
              isGeneratingLocked={currentTool.key === "set-main" && currentToolActiveTaskCount > 0}
              supplementValue={supplementValues[currentTool.key] ?? ""}
              tool={currentTool}
              uploadCountLimit={uploadCountLimit}
              uploads={uploads}
            />
            <ResultPanel
              activeTab={currentResultTab}
              collapsed={collapsed}
              onDownloadItem={handleDownloadItem}
              onApplyCase={handleApplyCaseTemplate}
              items={currentResultItems}
              onCancelQueued={(toolKey, itemId) => setResultActionConfirm({ type: "cancel-queued", toolKey, itemId })}
              onDeleteFailed={(toolKey, itemId) => setResultActionConfirm({ type: "delete-failed", toolKey, itemId })}
              onDownload={handleDownloadResults}
              onOpenCase={handleOpenCaseTemplate}
              onPreviewItem={handlePreviewResult}
              onEditItemText={handleOpenEditResultText}
              onGenerateSetPackTitles={handleGenerateSetPackTitles}
              onApplySetPackTitle={handleApplySetPackTitle}
              onApplyMoreTitleCandidate={handleApplyMoreTitleCandidate}
              onChangeMoreTitleFinal={handleChangeMoreTitleFinal}
              onCopyMoreTitleTask={handleCopyMoreTitleTask}
              onExportMoreTitleTask={handleExportMoreTitleTask}
              onRetry={handleRetryResult}
              selectedTask={currentSelectedTask}
              onTabChange={handleResultTabChange}
              onToggleItem={handleToggleResultItem}
              onToggleSelectAll={handleToggleResultSelectAll}
              onOpenDetail={(item) => handleOpenResultDetail(item, "workspace")}
              tool={currentTool}
            />
            <TaskHistoryRail
              activeCount={currentToolActiveTaskCount}
              collapsed={taskRailCollapsed}
              onSelectTask={handleSelectTaskRecord}
              onToggleCollapsed={() => setTaskRailCollapsed((value) => !value)}
              records={currentTaskRecords}
              selectedTaskId={currentSelectedTaskId}
            />
          </>
        )}
      </div>
      {toast ? (
        <div className={`ck-toast${toast.tone === "warning" ? " warning" : ""}`} key={toast.id}>
          <span className="ck-toast-icon">!</span>
          <span>{toast.message}</span>
        </div>
      ) : null}
      {activeCaseTemplate ? (
        <CaseDetailModal
          onApply={handleApplyCaseTemplate}
          onClose={() => setActiveCaseTemplate(null)}
          onShare={handleShareCaseTemplate}
          template={activeCaseTemplate}
        />
      ) : null}
      {activeModelDetail ? (
        <ModelDetailModal
          item={activeModelDetail}
          onClose={() => setSelectedMineModelId("")}
          onDelete={handleDeleteModel}
          onDownload={handleDownloadModel}
        />
      ) : null}
      {detailRoute ? (
        <ResultDetailModal
          item={activeDetailResultItem}
          onClose={handleCloseResultDetail}
          onDeleteCurrent={(item, taskItems) => {
            const currentIndex = taskItems.findIndex((taskItem) => taskItem.id === item.id);
            const fallbackItem = taskItems[currentIndex + 1] ?? taskItems[currentIndex - 1] ?? null;
            handleDeleteReadyResult(item);
            if (fallbackItem) {
              navigate(buildResultDetailPath(fallbackItem, detailRoute.source), { replace: true });
              return;
            }
            handleCloseResultDetail();
          }}
          onDownloadAll={handleDownloadTaskResults}
          onDownloadCurrent={handleDownloadItem}
          onNavigate={handleNavigateResultDetail}
          onSelectItem={(item) => navigate(buildResultDetailPath(item, detailRoute.source), { replace: true })}
          onUseTool={handleUseResultTool}
          task={detailTask}
          taskItems={detailTaskItems}
          toolLabel={detailToolOption?.label ?? detailRoute.toolKey}
        />
      ) : null}
      {previewResultItem ? (
        <div className="ck-set-pack-modal-mask" onClick={() => setPreviewResultItem(null)}>
          <div className="ck-set-pack-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ck-set-pack-modal-head">
              <strong>{previewResultItem.roleLabel ?? previewResultItem.label}</strong>
              <button onClick={() => setPreviewResultItem(null)} type="button">
                ×
              </button>
            </div>
            <div className="ck-set-pack-preview-body">
              {previewResultItem.src ? <img alt={previewResultItem.label} src={previewResultItem.src} /> : null}
              {previewResultItem.overlayText ? <p>{previewResultItem.overlayText}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
      {editingResultItem ? (
        <div className="ck-set-pack-modal-mask" onClick={() => setEditingResultItem(null)}>
          <div className="ck-set-pack-modal edit" onClick={(event) => event.stopPropagation()}>
            <div className="ck-set-pack-modal-head">
              <strong>编辑图片文案</strong>
              <button onClick={() => setEditingResultItem(null)} type="button">
                ×
              </button>
            </div>
            <div className="ck-set-pack-modal-body">
              <UnifiedTextareaField
                formBlockClassName="ck-set-pack-copy-block"
                label={editingResultItem.roleLabel ?? "文案"}
                maxLength={300}
                onChange={setEditingResultText}
                optional
                placeholder="请输入新的卖点或参数文案"
                value={editingResultText}
              />
            </div>
            <div className="ck-set-pack-modal-footer">
              <button className="secondary" onClick={() => setEditingResultItem(null)} type="button">
                取消
              </button>
              <button onClick={handleConfirmEditResultText} type="button">
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <ExportArtworkModal
        onClose={() => setExportPendingAction(null)}
        onConfirm={handleExportConfirm}
        open={Boolean(exportPendingAction)}
      />
      {resultActionConfirm ? (
        <div className="ck-result-confirm-mask" onClick={() => setResultActionConfirm(null)}>
          <div className="ck-result-confirm-modal" onClick={(event) => event.stopPropagation()}>
            <strong>{resultActionConfirm.type === "delete-failed" ? "确认删除失败结果？" : "确认取消排队任务？"}</strong>
            <p>
              {resultActionConfirm.type === "delete-failed"
                ? "删除后该失败结果将从当前任务中移除。"
                : "取消后该结果将不再继续生成，并退回对应积分。"}
            </p>
            <div className="ck-result-confirm-actions">
              <button className="secondary" onClick={() => setResultActionConfirm(null)} type="button">
                取消
              </button>
              <button className="primary" onClick={handleConfirmResultAction} type="button">
                确定
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <UploadCapacityModal
        description={limitModal?.description ?? ""}
        onClose={() => setLimitModal(null)}
        onUpgrade={handleOpenMembership}
        open={Boolean(limitModal)}
        promoText={UPGRADE_PROMO_COPY}
        title={limitModal?.title ?? ""}
      />
      <ResourceLibraryModal
        mediaKind={libraryFieldKey ? getLibraryMediaKindByFieldKey(libraryFieldKey) : "image"}
        maxSelectable={getLibraryMaxSelectable()}
        onClose={() => setLibraryFieldKey(null)}
        onConfirm={handleLibraryConfirm}
        open={Boolean(libraryFieldKey)}
      />
      <MembershipPaymentModal
        onClose={() => setPayModalOpen(false)}
        onSuccess={handleMembershipSuccess}
        open={payModalOpen}
      />
      <PointsPurchaseModal
        credits={credits}
        onClose={() => setPointsModalOpen(false)}
        onSuccess={handlePointsSuccess}
        open={pointsModalOpen}
      />
      <PointsBalancePopover
        credits={credits}
        onClose={() => setPointsBalanceOpen(false)}
        onOpenMembership={handleOpenMembership}
        onOpenPointsPurchase={handleOpenPointsModal}
        onOpenRecords={() => handleOpenRecords("consume")}
        open={pointsBalanceOpen}
        teamCredits={teamCredits}
      />
      <PointsRecordModal
        consumeRecords={defaultConsumeRecords}
        initialTab={pointsRecordTab}
        onClose={() => setPointsRecordOpen(false)}
        open={pointsRecordOpen}
        purchaseRecords={purchaseRecords}
      />
    </div>
  );
};
