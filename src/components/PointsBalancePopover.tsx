type PointsBalancePopoverProps = {
  open: boolean;
  teamCredits: number;
  credits: number;
  onClose: () => void;
  onOpenMembership: () => void;
  onOpenPointsPurchase: () => void;
  onOpenRecords: () => void;
};

export function PointsBalancePopover({
  open,
  teamCredits,
  credits,
  onClose,
  onOpenMembership,
  onOpenPointsPurchase,
  onOpenRecords
}: PointsBalancePopoverProps) {
  if (!open) return null;

  return (
    <div className="ck-points-popover-mask" onClick={onClose}>
      <div className="ck-points-popover" onClick={(event) => event.stopPropagation()}>
        <button aria-label="关闭积分剩余弹层" className="ck-points-popover-close" onClick={onClose} type="button">
          ×
        </button>

        <h3>积分剩余</h3>

        <div className="ck-points-popover-summary">
          <div className="ck-points-popover-metric">
            <strong>{teamCredits}</strong>
            <span>团队积分</span>
          </div>
          <i />
          <div className="ck-points-popover-metric">
            <strong>{credits}</strong>
            <span>我的积分</span>
          </div>
        </div>

        <p>积分可用于AI创作、AI绘画、AI图片处理等AI功能使用。</p>

        <button className="ck-points-popover-membership" onClick={onOpenMembership} type="button">
          <span>开通会员 获取积分</span>
          <em>0.4元/天</em>
        </button>

        <button className="ck-points-popover-purchase" onClick={onOpenPointsPurchase} type="button">
          购买积分
        </button>

        <button className="ck-points-popover-records" onClick={onOpenRecords} type="button">
          查看积分记录
          <span>›</span>
        </button>
      </div>
    </div>
  );
}
