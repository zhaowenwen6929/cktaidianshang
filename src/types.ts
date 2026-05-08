export type UploadFieldConfig = {
  label: string;
  required?: boolean;
  helperText?: string;
  maxCount?: number;
};

export type ChoiceCardOption = {
  label: string;
  description: string;
};

export type InputSelectFieldConfig = {
  label: string;
  required?: boolean;
  placeholder?: string;
  options: string[];
  optionPrompts?: Record<string, string>;
};

export type TextAreaFieldConfig = {
  label: string;
  helperText?: string;
  placeholder: string;
};

export type LinkedFieldGroup =
  | {
      type: "textarea";
      key: string;
      field: TextAreaFieldConfig;
    }
  | {
      type: "input-select";
      key: string;
      field: InputSelectFieldConfig;
    };

export type EditModeOption = {
  id: string;
  label: string;
  prompt?: string;
  fields: LinkedFieldGroup[];
};

export type CreationModeOption = {
  id: string;
  label: string;
};

export type ToolDefinition = {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  keywords: string;
  heroTitle: string;
  heroDescription: string;
  tags: string[];
  uploads?: {
    main?: UploadFieldConfig;
    reference?: UploadFieldConfig;
  };
  modeChoice?: {
    label: string;
    options: ChoiceCardOption[];
  };
  editModes?: {
    label: string;
    options: EditModeOption[];
  };
  creationModes?: {
    label: string;
    helperText?: string;
    options: CreationModeOption[];
  };
  ratioOptions?: string[];
  resolutionOptions?: string[];
  batchCountOptions?: string[];
  supplement?: TextAreaFieldConfig;
};

export type TaskStatus = "生成中" | "已完成" | "失败";

export type TaskRecord = {
  id: string;
  toolSlug: string;
  title: string;
  createdAt: string;
  status: TaskStatus;
  credits: number;
  thumb: string;
};
