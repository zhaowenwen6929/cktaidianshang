import { useEffect, useState } from "react";

type ExportArtworkModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (preserveVisibleMark: boolean, skipForSevenDays: boolean) => void;
};

export function ExportArtworkModal({ open, onClose, onConfirm }: ExportArtworkModalProps) {
  const [skipForSevenDays, setSkipForSevenDays] = useState(false);

  useEffect(() => {
    if (!open) {
      setSkipForSevenDays(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="ck-export-mask" onClick={onClose}>
      <div className="ck-export-modal" onClick={(event) => event.stopPropagation()}>
        <div className="ck-export-title">导出作品提示</div>
        <div className="ck-export-copy">
          <p>当前导出内容含AI生成内容，是否保留AI显式标识？</p>
          <p>
            含AI生成内容均含隐式标识，使用需遵守国家相关法律法规，详见
            <a href="/" onClick={(event) => event.preventDefault()}>
              《用户服务协议》
            </a>
          </p>
        </div>
        <div className="ck-export-actions">
          <label className="ck-export-check">
            <input checked={skipForSevenDays} onChange={(event) => setSkipForSevenDays(event.target.checked)} type="checkbox" />
            <span className="ck-export-check-box">{skipForSevenDays ? "✓" : ""}</span>
            <span>7天内不再提示</span>
          </label>
          <div className="ck-export-buttons">
            <button className="secondary" onClick={() => onConfirm(true, skipForSevenDays)} type="button">
              保留
            </button>
            <button className="primary" onClick={() => onConfirm(false, skipForSevenDays)} type="button">
              去除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
