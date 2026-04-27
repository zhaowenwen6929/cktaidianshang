import { useEffect, useState } from "react";

type PointsPurchaseModalProps = {
  open: boolean;
  credits: number;
  onClose: () => void;
  onSuccess: (points: number) => void;
};

type PointsPlan = {
  id: string;
  points: number;
  title: string;
  price: number;
  originalPrice: number;
  estimate: string;
  tag?: string;
};

const pointsPlans: PointsPlan[] = [
  {
    id: "p-1500",
    points: 1500,
    title: "1500积分/年",
    price: 100,
    originalPrice: 200,
    estimate: "约生150～375张图"
  },
  {
    id: "p-3000",
    points: 3000,
    title: "3000积分/年",
    price: 199,
    originalPrice: 420,
    estimate: "约生300～750张图",
    tag: "限时特惠"
  },
  {
    id: "p-900",
    points: 900,
    title: "900积分/年",
    price: 60,
    originalPrice: 100,
    estimate: "约生90～225张图",
    tag: "入门首选"
  },
  {
    id: "p-7500",
    points: 7500,
    title: "7500积分/年",
    price: 495,
    originalPrice: 1100,
    estimate: "约生750～1875张图"
  }
];

function FakePointsQr({
  scanned,
  onScan
}: {
  scanned: boolean;
  onScan: () => void;
}) {
  return (
    <button
      aria-label={scanned ? "积分支付成功" : "点击二维码模拟积分支付"}
      className={`ck-points-qr${scanned ? " scanned" : ""}`}
      onClick={() => {
        if (!scanned) onScan();
      }}
      type="button"
    >
      <div className="ck-points-qr-grid" aria-hidden="true">
        {Array.from({ length: 256 }).map((_, index) => (
          <i
            className={
              index % 2 === 0 ||
              index % 5 === 0 ||
              (index > 18 && index < 34) ||
              (index > 136 && index < 170)
                ? "dark"
                : ""
            }
            key={index}
          />
        ))}
      </div>
      <span className="ck-points-qr-finder top-left" />
      <span className="ck-points-qr-finder top-right" />
      <span className="ck-points-qr-finder bottom-left" />
      <span className="ck-points-qr-scanline" />
      <span className="ck-points-qr-overlay">{scanned ? "支付成功" : "点击二维码模拟扫码"}</span>
    </button>
  );
}

export function PointsPurchaseModal({
  open,
  credits,
  onClose,
  onSuccess
}: PointsPurchaseModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState(pointsPlans[0].id);
  const [scanned, setScanned] = useState(false);

  const selectedPlan =
    pointsPlans.find((plan) => plan.id === selectedPlanId) ?? pointsPlans[0];

  useEffect(() => {
    if (!open) {
      setSelectedPlanId(pointsPlans[0].id);
      setScanned(false);
      return;
    }

    if (!scanned) return;
    const timer = window.setTimeout(() => {
      onSuccess(selectedPlan.points);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [open, onSuccess, scanned, selectedPlan.points]);

  if (!open) return null;

  return (
    <div className="ck-points-mask" onClick={onClose}>
      <div className="ck-points-modal" onClick={(event) => event.stopPropagation()}>
        <button
          aria-label="关闭积分购买弹框"
          className="ck-points-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        <div className="ck-points-header">
          <div className="ck-points-user">
            <img alt="赵文文" className="ck-points-avatar" src="/assets/member-avatar.png" />
            <div className="ck-points-user-copy">
              <strong>赵文文</strong>
              <div>
                <span>团队版</span>
                <i />
                <span>基础版（单人）</span>
                <i />
                <span>
                  剩余积分：
                  <em>{credits}</em>
                </span>
              </div>
            </div>
          </div>
          <button className="ck-points-contact" type="button">
            联系客服
          </button>
        </div>

        <div className="ck-points-body">
          <aside className="ck-points-sidebar">
            <div className="ck-points-sidebar-title">
              <span className="ck-points-sidebar-badge">AI</span>
              <div>
                <strong>AI积分</strong>
                <p>适用于所有生成式AI功能</p>
              </div>
            </div>

            <div className="ck-points-sidebar-sections">
              <section>
                <h4>AI 智能体创作</h4>
                <p>AI Agent无限画布、AI生图片、生设计、生视频、生实物、AI 3D等</p>
              </section>
              <section>
                <h4>AI绘画</h4>
                <p>AI生绘本、生背景图、生素材、生字体等</p>
              </section>
              <section>
                <h4>AI图片处理</h4>
                <p>主体抓取、智能消除、智能改图、图片变清晰、图片翻译等</p>
              </section>
              <section>
                <h4>AI LOGO</h4>
                <p>智能生成LOGO</p>
              </section>
              <section>
                <h4>AI 商品图</h4>
                <p>适用于电商，生产商拍场景设计图</p>
              </section>
            </div>

            <button className="ck-points-more" type="button">
              更多AI能力 &gt;
            </button>
          </aside>

          <section className="ck-points-main">
            <h3>选择积分套餐</h3>

            <div className="ck-points-plan-grid">
              {pointsPlans.map((plan) => {
                const selected = plan.id === selectedPlanId;

                return (
                  <button
                    className={`ck-points-plan-card${selected ? " selected" : ""}`}
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    type="button"
                  >
                    {plan.tag ? <span className="ck-points-plan-tag">{plan.tag}</span> : null}
                    <div className="ck-points-plan-inner">
                      <div className="ck-points-plan-title">{plan.title}</div>
                      <div className="ck-points-plan-price">
                        <span>¥</span>
                        <strong>{plan.price}</strong>
                      </div>
                      <div className="ck-points-plan-origin">原价￥{plan.originalPrice}</div>
                    </div>
                    <div className="ck-points-plan-foot">{plan.estimate}</div>
                  </button>
                );
              })}
              <button className="ck-points-plan-next" type="button">
                ›
              </button>
            </div>

            <div className="ck-points-divider" />

            <div className="ck-points-pay">
              <div className="ck-points-qr-wrap">
                <div className={`ck-points-qr-shell${scanned ? " scanned" : ""}`}>
                  <FakePointsQr onScan={() => setScanned(true)} scanned={scanned} />
                </div>
                <div className="ck-points-qr-hint">{scanned ? "支付处理中..." : "点击二维码模拟支付"}</div>
              </div>

              <div className="ck-points-pay-copy">
                <div className="ck-points-pay-price">
                  <span>¥</span>
                  <strong>{selectedPlan.price}</strong>
                  <em>已优惠{selectedPlan.originalPrice - selectedPlan.price}.00元</em>
                </div>
                <p>
                  购买后有效期至：
                  <span>2027-04-24</span>
                </p>
                <div className="ck-points-pay-methods">
                  <img alt="" src="/assets/member-alipay-icon.svg" />
                  <span>支付宝</span>
                  <img alt="" src="/assets/member-wechat-icon.svg" />
                  <span>微信</span>
                  <strong>{scanned ? "支付处理中..." : "扫码完成支付"}</strong>
                </div>
                <div className="ck-points-pay-agreement">
                  支付即代表您已同意《创客贴积分购买协议》，支付后可联系客服开具发票。
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
