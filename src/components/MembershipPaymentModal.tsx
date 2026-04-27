import { useEffect, useState } from "react";

type MembershipPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type PayPlan = {
  id: string;
  title: string;
  price: string;
  note: string;
  tag?: string;
  selected?: boolean;
};

type BenefitItem = {
  title: string;
  description: string;
  icon: string;
};

const payPlans: PayPlan[] = [
  { id: "forever", title: "终身", price: "379", note: "已优惠40元", selected: true },
  { id: "season", title: "连续包季", price: "79", note: "续费价79元", tag: "新用户专享" },
  { id: "two-year", title: "2年", price: "199", note: "送300积分" },
  { id: "year", title: "连续包年", price: "159", note: "13.2元/月  送300积分", tag: "直降40元!" }
];

const benefitItems: BenefitItem[] = [
  {
    title: "企业商用授权",
    description: "线上线下，商用无忧",
    icon: "/assets/member-benefit-auth.svg"
  },
  {
    title: "100万+精美模版",
    description: "轻松编辑，每日更新",
    icon: "/assets/member-benefit-template-base.svg"
  },
  {
    title: "1亿+素材",
    description: "多类型素材，随心使用",
    icon: "/assets/member-benefit-material.svg"
  },
  {
    title: "无水印下载",
    description: "高清大图，无水印导出",
    icon: "/assets/member-benefit-download-base.svg"
  },
  {
    title: "300贴贴/月",
    description: "赋能AI创作，灵感不息",
    icon: "/assets/member-benefit-sticker-base.svg"
  },
  {
    title: "60GB存储空间",
    description: "超大存储，资产更安全",
    icon: "/assets/member-benefit-storage.svg"
  }
];

function FakeQrCode({
  scanned,
  onScan
}: {
  scanned: boolean;
  onScan: () => void;
}) {
  return (
    <button
      aria-label={scanned ? "支付成功" : "点击模拟扫码支付"}
      className={`ck-pay-qr${scanned ? " scanned" : ""}`}
      onClick={() => {
        if (!scanned) onScan();
      }}
      type="button"
    >
      <div className="ck-pay-qr-grid" aria-hidden="true">
        {Array.from({ length: 225 }).map((_, index) => (
          <i
            className={
              index % 2 === 0 ||
              index % 7 === 0 ||
              (index > 22 && index < 42) ||
              (index > 140 && index < 170)
                ? "dark"
                : ""
            }
            key={index}
          />
        ))}
      </div>
      <span className="ck-pay-qr-finder top-left" />
      <span className="ck-pay-qr-finder top-right" />
      <span className="ck-pay-qr-finder bottom-left" />
      <span className="ck-pay-qr-scanline" />
      <span className="ck-pay-qr-overlay">{scanned ? "支付成功" : "点击二维码模拟扫码"}</span>
    </button>
  );
}

export function MembershipPaymentModal({
  open,
  onClose,
  onSuccess
}: MembershipPaymentModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState("forever");
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!open) {
      setScanned(false);
      setSelectedPlanId("forever");
      return;
    }

    if (!scanned) return;
    const timer = window.setTimeout(() => {
      onSuccess();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [open, scanned, onSuccess]);

  if (!open) return null;

  return (
    <div className="ck-pay-mask" onClick={onClose}>
      <div className="ck-pay-modal" onClick={(event) => event.stopPropagation()}>
        <button aria-label="关闭会员支付弹框" className="ck-pay-close" onClick={onClose} type="button">
          ×
        </button>

        <div className="ck-pay-main">
          <section className="ck-pay-left">
            <div className="ck-pay-userbar">
              <div className="ck-pay-userinfo">
                <img alt="顾念慈" className="ck-pay-avatar" src="/assets/member-avatar.png" />
                <div className="ck-pay-usercopy">
                  <div className="ck-pay-userline">
                    <strong>顾念慈</strong>
                    <span>普通用户</span>
                  </div>
                  <p>模板在线编辑 快速出图</p>
                </div>
              </div>
              <button className="ck-pay-promo" onClick={() => setSelectedPlanId("forever")} type="button">
                <span>🔥双旦大促 · 升级会员最低至5折起</span>
              </button>
            </div>

            <div className="ck-pay-content">
              <div className="ck-pay-usage-tabs">
                <button className="active" type="button">
                  单人用 (1人)
                </button>
                <button type="button">团队用 (2~10人)</button>
              </div>

              <div className="ck-pay-tier-tabs">
                <button className="active" type="button">
                  基础版
                </button>
                <button type="button">高级版</button>
                <button type="button">专业版</button>
                <button type="button">至尊版</button>
              </div>

              <p className="ck-pay-tier-copy">
                <span>仅限个人非工商主体</span>
                <strong>1人使用</strong>
                <span>，体验agent创作，企业使用请选购</span>
                <strong>进阶版及以上版本</strong>
              </p>

              <div className="ck-pay-plan-grid">
                {payPlans.map((plan, index) => {
                  const selected = plan.id === selectedPlanId;

                  return (
                    <button
                      className={`ck-pay-plan-card${selected ? " selected" : ""}`}
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      type="button"
                    >
                      {plan.tag ? <span className="ck-pay-plan-tag">{plan.tag}</span> : null}
                      <div className="ck-pay-plan-body">
                        <div className="ck-pay-plan-title">{plan.title}</div>
                        <div className="ck-pay-plan-price">
                          <span>¥</span>
                          <strong>{plan.price}</strong>
                        </div>
                        {selected && plan.id === "forever" ? (
                          <span className="ck-pay-plan-discount-pill">{plan.note}</span>
                        ) : null}
                      </div>
                      <div className="ck-pay-plan-foot">
                        {selected && plan.id === "forever" ? (
                          <>
                            <span>剩余</span>
                            <em>00:57:28</em>
                          </>
                        ) : (
                          <span>{plan.note}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
                <button className="ck-pay-plan-next" type="button">
                  ›
                </button>
              </div>

              <p className="ck-pay-renew-copy">到期后按每季度￥199自动续费，可随时取消</p>

              <div className="ck-pay-benefits-head">
                <h3>会员权益</h3>
                <button type="button">
                  查看更多
                  <span>›</span>
                </button>
              </div>

              <div className="ck-pay-benefits">
                {benefitItems.map((item) => (
                  <div className="ck-pay-benefit-item" key={item.title}>
                    <span className="ck-pay-benefit-icon">
                      <img alt="" src={item.icon} />
                    </span>
                    <div className="ck-pay-benefit-copy">
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ck-pay-footer-links">
                <button type="button">常见问题</button>
                <span />
                <button type="button">咨询客服</button>
              </div>
            </div>
          </section>

          <aside className="ck-pay-right">
            <button className="ck-pay-coupon" type="button">
              <span>使用优惠券/码</span>
              <i>›</i>
            </button>

            <div className="ck-pay-price-block">
              <div className="ck-pay-price">
                <span>¥</span>
                <strong>379</strong>
              </div>
              <div className="ck-pay-origin">
                <span>原价￥950</span>
                <em>省551元</em>
              </div>
              <div className="ck-pay-discount">
                <img alt="" src="/assets/member-coupon-icon.svg" />
                <span>双旦专享立减券</span>
                <em>-￥20</em>
              </div>
            </div>

            <div className="ck-pay-qr-wrap">
              <div
                className={`ck-pay-qr-shell${scanned ? " scanned" : ""}`}
                onClick={() => {
                  if (!scanned) setScanned(true);
                }}
              >
                <FakeQrCode onScan={() => setScanned(true)} scanned={scanned} />
                <span className="ck-pay-qr-hint">{scanned ? "支付处理中..." : "点击二维码模拟支付"}</span>
              </div>

              <div className="ck-pay-methods">
                <div>
                  <img alt="" src="/assets/member-alipay-icon.svg" />
                  <span>支付宝</span>
                </div>
                <span className="divider" />
                <div>
                  <img alt="" src="/assets/member-wechat-icon.svg" />
                  <span>微信</span>
                </div>
              </div>

              <p className="ck-pay-agreement">
                支付即视为您同意《服务协议》与《授权许可》
                <br />
                支付后可在订单中心开具发票
              </p>
            </div>

            <div className="ck-pay-bank-wrap">
              <button className="ck-pay-bank" type="button">
                <img alt="" src="/assets/member-bank-icon.png" />
                我要对公转账
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
