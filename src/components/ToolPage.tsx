import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { demoTasks, productRetouchGallery } from "../data/tasks";
import type {
  EditModeOption,
  InputSelectFieldConfig,
  LinkedFieldGroup,
  TextAreaFieldConfig,
  ToolDefinition
} from "../types";

type ToolPageProps = {
  tool: ToolDefinition;
};

const defaultResolutions = ["1K", "2K", "4K"];
const defaultBatchCounts = ["1", "2"];

const AdaptiveOptionGrid = ({
  label,
  options,
  selectedId,
  onSelect
}: {
  label: string;
  options: { id: string; label: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}) => (
  <div className="form-section">
    <label className="section-title">
      {label}
      <span>*</span>
    </label>
    <div className="adaptive-option-grid">
      {options.map((option) => (
        <button
          key={option.id}
          className={`adaptive-option-card${option.id === selectedId ? " selected" : ""}`}
          onClick={() => onSelect(option.id)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

const InputSelectField = ({ field }: { field: InputSelectFieldConfig }) => {
  const [value, setValue] = useState("");

  return (
    <div className="linked-field">
      <label className="section-title">
        {field.label}
        {field.required ? <span>*</span> : null}
      </label>
      <div className="input-select-shell">
        <input
          onChange={(event) => setValue(event.target.value)}
          placeholder={field.placeholder ?? "请选择，或直接输入"}
          value={value}
        />
        <span className="input-select-caret">⌄</span>
        <div className="input-select-menu">
          {field.options.map((option) => (
            <button key={option} onClick={() => setValue(option)} type="button">
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const TextAreaField = ({ field }: { field: TextAreaFieldConfig }) => (
  <div className="linked-field">
    <label className="section-title">
      {field.label}
      {field.helperText ? <small>{field.helperText}</small> : null}
    </label>
    <textarea placeholder={field.placeholder} rows={5} />
    <div className="input-footer">
      <button type="button">AI润色</button>
      <button type="button">提示词工具</button>
      <span>0/2000</span>
    </div>
  </div>
);

const renderLinkedField = (field: LinkedFieldGroup) => {
  if (field.type === "input-select") {
    return <InputSelectField key={field.key} field={field.field} />;
  }

  return <TextAreaField key={field.key} field={field.field} />;
};

const UploadSection = ({
  config,
  image,
  title
}: {
  config: NonNullable<ToolDefinition["uploads"]>[keyof NonNullable<ToolDefinition["uploads"]>];
  image: string;
  title?: string;
}) => {
  if (!config) {
    return null;
  }

  return (
    <div className="form-section">
      <label className="section-title">
        {title ?? config.label}
        {config.required ? <span>*</span> : null}
        {config.helperText ? <em>{config.helperText}</em> : null}
      </label>
      <div className="upload-block single">
        <div className="upload-preview tall">
          <img alt={config.label} src={image} />
        </div>
        <div className="upload-preview-actions">
          <button type="button">替换</button>
          <button type="button">删除</button>
        </div>
      </div>
      {config.maxCount ? <div className="field-tip">仅支持上传 {config.maxCount} 张</div> : null}
    </div>
  );
};

const CreationModeSection = ({
  tool,
  selectedMode,
  onSelectMode
}: {
  tool: ToolDefinition;
  selectedMode: string;
  onSelectMode: (id: string) => void;
}) => {
  if (!tool.creationModes) {
    return null;
  }

  const ratioOptions = tool.ratioOptions ?? ["自动"];
  const resolutionOptions = tool.resolutionOptions ?? defaultResolutions;
  const batchCountOptions = tool.batchCountOptions ?? defaultBatchCounts;

  return (
    <>
      <div className="form-section">
        <label className="section-title">
          {tool.creationModes.label}
          <span>*</span>
          {tool.creationModes.helperText ? <em>{tool.creationModes.helperText}</em> : null}
        </label>
        <div className="switcher">
          {tool.creationModes.options.map((option) => (
            <button
              key={option.id}
              className={option.id === selectedMode ? "active" : ""}
              onClick={() => onSelectMode(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-section compact-grid">
        <div>
          <label className="section-title">
            出图比例
            <span>*</span>
          </label>
          <button className="select-like" type="button">
            {ratioOptions[0]}
            <span>⌄</span>
          </button>
        </div>
        <div>
          <label className="section-title">
            分辨率
            <span>*</span>
          </label>
          <div className="segmented-list">
            {resolutionOptions.map((item, index) => (
              <button key={item} className={index === 0 ? "active" : ""} type="button">
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tool.batchCountOptions ? (
        <div className="form-section compact-grid">
          <div>
            <label className="section-title">
              每批次出图数量
              <span>*</span>
            </label>
            <div className="segmented-list">
              {batchCountOptions.map((item, index) => (
                <button key={item} className={index === 0 ? "active" : ""} type="button">
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div />
        </div>
      ) : null}
    </>
  );
};

const DefaultToolForm = ({ tool }: { tool: ToolDefinition }) => (
  <>
    {tool.uploads?.main ? <UploadSection config={tool.uploads.main} image={productRetouchGallery[0]} /> : null}

    {tool.modeChoice ? (
      <div className="form-section">
        <label className="section-title">
          {tool.modeChoice.label}
          <span>*</span>
        </label>
        <div className="choice-grid">
          {tool.modeChoice.options.map((option, index) => (
            <button key={option.label} className={`choice-card${index === 0 ? " selected" : ""}`} type="button">
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </div>
    ) : null}

    <CreationModeSection onSelectMode={() => undefined} selectedMode={tool.creationModes?.options[0]?.id ?? ""} tool={tool} />

    {tool.supplement ? <TextAreaField field={tool.supplement} /> : null}
  </>
);

const ModelChangeForm = ({ tool }: { tool: ToolDefinition }) => {
  const defaultEditMode = tool.editModes?.options[0]?.id ?? "";
  const defaultCreationMode = tool.creationModes?.options[0]?.id ?? "";
  const [selectedEditMode, setSelectedEditMode] = useState(defaultEditMode);
  const [selectedCreationMode, setSelectedCreationMode] = useState(defaultCreationMode);

  const currentEditMode = useMemo<EditModeOption | undefined>(
    () => tool.editModes?.options.find((option) => option.id === selectedEditMode),
    [selectedEditMode, tool.editModes?.options]
  );

  return (
    <>
      {tool.uploads?.main ? <UploadSection config={tool.uploads.main} image="/assets/task-gallery-6.png" title="上传模特图" /> : null}

      {tool.editModes ? (
        <AdaptiveOptionGrid
          label={tool.editModes.label}
          onSelect={setSelectedEditMode}
          options={tool.editModes.options.map((option) => ({ id: option.id, label: option.label }))}
          selectedId={selectedEditMode}
        />
      ) : null}

      {currentEditMode?.fields.map(renderLinkedField)}

      <CreationModeSection onSelectMode={setSelectedCreationMode} selectedMode={selectedCreationMode} tool={tool} />

      {tool.uploads?.reference ? <UploadSection config={tool.uploads.reference} image="/assets/task-gallery-4.png" /> : null}
    </>
  );
};

export const ToolPage = ({ tool }: ToolPageProps) => {
  const relatedTasks = demoTasks.filter((task) => task.toolSlug === tool.slug);
  const isModelChange = tool.slug === "model-change";

  return (
    <div className="tool-page">
      <section className="control-panel">
        <div className="panel-header compact">
          <h1>{tool.heroTitle}</h1>
        </div>

        {isModelChange ? <ModelChangeForm tool={tool} /> : <DefaultToolForm tool={tool} />}

        <button className="primary-action" type="button">
          立即生成
          <span>消耗 10 积分</span>
        </button>

        <div className="task-callout subtle">
          <div>
            <strong>任务统一归档到“我的”</strong>
            <p>所有工具提交任务后，都可按功能筛选查看。</p>
          </div>
          <Link to="/my/tasks">查看任务列表</Link>
        </div>
      </section>

      <section className="result-panel">
        <div className="result-toolbar">
          <div className="result-toolbar-left">
            <button className="result-tab active" type="button">
              生成结果
            </button>
            <button className="result-tab" type="button">
              创作案例
            </button>
          </div>
          <div className="result-toolbar-right">
            <label className="checkbox-label">
              <input type="checkbox" />
              全选
            </label>
            <button className="toolbar-button" type="button">
              批量下载
            </button>
          </div>
        </div>

        <div className="result-meta">{relatedTasks.length} 个任务已归档到“我的”</div>

        <div className="result-grid">
          {productRetouchGallery.map((image, index) => (
            <article key={image} className="result-card">
              <label className="result-check">
                <input type="checkbox" />
              </label>
              <img alt={`${tool.name}结果 ${index + 1}`} src={image} />
              <span className="result-label">{tool.shortName}</span>
            </article>
          ))}
        </div>

        <div className="result-empty">没有更多了~</div>
      </section>
    </div>
  );
};
