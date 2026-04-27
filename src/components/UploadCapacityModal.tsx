type UploadCapacityModalProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onUpgrade: () => void;
  promoText?: string;
};

export function UploadCapacityModal({
  open,
  title,
  description,
  onClose,
  onUpgrade,
  promoText = "双旦大促·升级会员最低至5折起"
}: UploadCapacityModalProps) {
  if (!open) return null;

  return (
    <div className="ck-limit-mask" onClick={onClose}>
      <div className="ck-limit-modal" onClick={(event) => event.stopPropagation()}>
        <div className="ck-limit-header">
          <p>{title}</p>
          <button aria-label="关闭弹窗" className="ck-limit-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="ck-limit-content">
          <p className="ck-limit-desc">{description}</p>
          <button className="ck-limit-banner" onClick={onUpgrade} type="button">
            <span className="ck-limit-banner-icon">🔥</span>
            <span className="ck-limit-banner-copy">
              <span>{promoText.split("5折")[0]}</span>
              <strong>5折</strong>
              <span>{promoText.split("5折")[1] ?? ""}</span>
            </span>
          </button>
        </div>

        <div className="ck-limit-actions">
          <button className="primary" onClick={onUpgrade} type="button">
            扩展容量
          </button>
          <button className="secondary" onClick={onClose} type="button">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
