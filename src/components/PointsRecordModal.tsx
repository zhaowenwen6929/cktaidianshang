import { useEffect, useState } from "react";

export type PointsRecordTab = "purchase" | "consume";

export type PointsRecordItem = {
  id: string;
  userName: string;
  avatar: string;
  title: string;
  date: string;
  time: string;
  amount: string;
};

type PointsRecordModalProps = {
  open: boolean;
  initialTab?: PointsRecordTab;
  purchaseRecords: PointsRecordItem[];
  consumeRecords: PointsRecordItem[];
  onClose: () => void;
};

export function PointsRecordModal({
  open,
  initialTab = "consume",
  purchaseRecords,
  consumeRecords,
  onClose
}: PointsRecordModalProps) {
  const [activeTab, setActiveTab] = useState<PointsRecordTab>(initialTab);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [initialTab, open]);

  if (!open) return null;

  const visibleRecords = activeTab === "purchase" ? purchaseRecords : consumeRecords;

  return (
    <div className="ck-points-record-mask" onClick={onClose}>
      <div className="ck-points-record-modal" onClick={(event) => event.stopPropagation()}>
        <button aria-label="关闭积分记录弹框" className="ck-points-record-close" onClick={onClose} type="button">
          ×
        </button>

        <h3>积分记录</h3>

        <div className="ck-points-record-tabs">
          <button
            className={activeTab === "purchase" ? "active" : ""}
            onClick={() => setActiveTab("purchase")}
            type="button"
          >
            购买/奖励
          </button>
          <button
            className={activeTab === "consume" ? "active" : ""}
            onClick={() => setActiveTab("consume")}
            type="button"
          >
            消耗
          </button>
        </div>

        <div className="ck-points-record-divider" />

        <div className="ck-points-record-filters">
          <button className="ck-points-record-filter" type="button">
            团队记录
            <span>▲</span>
          </button>
          <button className="ck-points-record-filter" type="button">
            2026年3月
            <span>▲</span>
          </button>
        </div>

        <div className="ck-points-record-list">
          {visibleRecords.map((record) => (
            <article className="ck-points-record-item" key={record.id}>
              <div className="ck-points-record-user">
                <img alt={record.userName} src={record.avatar} />
                <strong>{record.userName}</strong>
              </div>
              <div className="ck-points-record-title">{record.title}</div>
              <div className="ck-points-record-time">
                <span>{record.date}</span>
                <span>{record.time}</span>
              </div>
              <div className="ck-points-record-amount">{record.amount}</div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
