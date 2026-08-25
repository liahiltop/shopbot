const CRYPTO_COLORS = { BTC: "#f7931a", ETH: "#627eea", SOL: "#9945ff", USDT: "#26a17b" };

export function ProductCard({ product, onAdd, compact }) {
  const p = product;
  return (
    <div style={{ background: "#161616", border: "1px solid #222", borderRadius: "12px", overflow: "hidden", width: compact ? "160px" : "100%" }}>
      <div style={{ padding: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <div style={{ fontSize: compact ? "22px" : "26px" }}>{p.emoji}</div>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#c8f57a" }}>${parseFloat(p.price).toFixed(2)}</div>
        </div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: "#e8e8e8", marginBottom: "4px", lineHeight: "1.3" }}>{p.name}</div>
        {!compact && <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px", lineHeight: "1.4" }}>{p.description}</div>}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: compact ? "0" : "10px" }}>
          {p.color && <Tag>{p.color}</Tag>}
          {p.size && <Tag>{p.size}</Tag>}
          <Tag dim>{p.vendor_name || "Продавец"}</Tag>
        </div>
        {!compact && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "11px", color: "#444" }}>{p.stock} в наличии</div>
            <button
              onClick={() => onAdd && onAdd(p)}
              disabled={p.stock === 0}
              style={{ padding: "7px 14px", background: p.stock === 0 ? "#1a1a1a" : "#1a1f12", border: "1px solid " + (p.stock === 0 ? "#222" : "#c8f57a44"), borderRadius: "7px", color: p.stock === 0 ? "#333" : "#c8f57a", cursor: p.stock === 0 ? "default" : "pointer", fontSize: "12px", fontWeight: "600" }}
            >
              {p.stock === 0 ? "Нет" : "+ В корзину"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ children, dim }) {
  return (
    <span style={{ fontSize: "10px", padding: "2px 7px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: "4px", color: dim ? "#444" : "#888" }}>
      {children}
    </span>
  );
}

export function CartItem({ item, onRemove }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
      <div>
        <div style={{ fontSize: "13px", color: "#e8e8e8" }}>{item.emoji} {item.name}</div>
        <div style={{ fontSize: "11px", color: "#444", marginTop: "2px" }}>×{item.qty} · ${(parseFloat(item.price) * item.qty).toFixed(2)}</div>
      </div>
      <button onClick={onRemove} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "4px" }}>×</button>
    </div>
  );
}

export function CryptoCheckout({ cart, onClose, onConfirm, paying }) {
  const RATES = { BTC: 0.000015, ETH: 0.00026, SOL: 0.0044, USDT: 1.0 };
  const NAMES = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", USDT: "Tether" };
  const [step, setStep] = useState(0);
  const [coin, setCoin] = useState("ETH");
  const [receipt, setReceipt] = useState(null);

  const { useState } = require("react");

  const total = cart.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0);
  const commission = +(total * 0.05).toFixed(2);
  const cryptoAmt = (total * RATES[coin]).toFixed(8);

  function randHex(n) { let s = ""; for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16); return s; }

  async function confirm() {
    const txHash = "0x" + randHex(64);
    const r = await onConfirm({ cart, coin, cryptoAmount: cryptoAmt, txHash });
    setReceipt({ ...r, amount: cryptoAmt, items: cart.slice() });
    setStep(2);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: "20px 20px 16px 16px", padding: "28px", width: "100%", maxWidth: "420px", maxHeight: "90vh", overflowY: "auto" }}>

        {step === 0 && (
          <div>
            <Header title="Оплата" sub={"Итого $" + total.toFixed(2) + " + $" + commission + " комиссия (5%)"} onClose={onClose} />
            <div style={{ fontSize: "11px", color: "#444", marginBottom: "12px", background: "#161616", padding: "10px 12px", borderRadius: "8px" }}>
              Комиссия платформы 5% — вместо рекламного бюджета. Продавец получает ${(total - commission).toFixed(2)}.
            </div>
            {Object.keys(RATES).map(c => {
              const active = coin === c;
              return (
                <div key={c} onClick={() => setCoin(c)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 14px", background: active ? "#111820" : "#111", border: "1px solid " + (active ? CRYPTO_COLORS[c] + "66" : "#1e1e1e"), borderRadius: "10px", marginBottom: "8px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: CRYPTO_COLORS[c] + "22", border: "1px solid " + CRYPTO_COLORS[c] + "66", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: CRYPTO_COLORS[c], fontSize: "12px" }}>{c[0]}</div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#e8e8e8" }}>{NAMES[c]}</div>
                      <div style={{ fontSize: "11px", color: "#555" }}>{c}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: CRYPTO_COLORS[c] }}>{(total * RATES[c]).toFixed(6)}</div>
                  </div>
                </div>
              );
            })}
            <Btn onClick={() => setStep(1)} color="#c8f57a" textColor="#0e0e0e">Продолжить с {coin}</Btn>
          </div>
        )}

        {step === 1 && (
          <div>
            <Header title={"Отправить " + coin} sub="Переведите точную сумму" onClose={onClose} />
            <div style={{ background: "#111820", border: "1px solid " + CRYPTO_COLORS[coin] + "44", borderRadius: "12px", padding: "20px", marginBottom: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>Отправьте ровно</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: CRYPTO_COLORS[coin], fontFamily: "monospace", letterSpacing: "-1px" }}>{cryptoAmt}</div>
              <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>{coin} · ~${total.toFixed(2)}</div>
            </div>
            <div style={{ background: "#161616", borderRadius: "10px", padding: "12px", marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: "#444", marginBottom: "8px" }}>НА АДРЕС</div>
              <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#888", wordBreak: "break-all", lineHeight: "1.6" }}>{"0x" + randHex(40)}</div>
            </div>
            <div style={{ fontSize: "11px", color: "#333", marginBottom: "14px", textAlign: "center" }}>Адрес действителен 15 минут</div>
            <div style={{ marginBottom: "16px" }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#666", padding: "3px 0" }}>
                  <span>{item.emoji} {item.name} ×{item.qty}</span>
                  <span>${(parseFloat(item.price) * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", color: "#e8e8e8", borderTop: "1px solid #1e1e1e", paddingTop: "8px", marginTop: "8px" }}>
                <span>Итого</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
            <Btn onClick={confirm} disabled={paying} color={paying ? "#1e1e1e" : CRYPTO_COLORS[coin]} textColor="#fff">
              {paying ? "Подтверждение..." : "Я отправил оплату"}
            </Btn>
            {paying && <div style={{ textAlign: "center", fontSize: "11px", color: "#555", marginTop: "8px" }}>Ожидаем подтверждения сети...</div>}
          </div>
        )}

        {step === 2 && receipt && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>✅</div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#c8f57a", marginBottom: "6px" }}>Оплата подтверждена</div>
            <div style={{ fontSize: "12px", color: "#555", marginBottom: "24px" }}>Заказ #{receipt.id}</div>
            <div style={{ background: "#161616", borderRadius: "12px", padding: "16px", marginBottom: "12px", textAlign: "left" }}>
              <Row label="Оплачено" value={receipt.amount + " " + receipt.crypto_coin} color={CRYPTO_COLORS[receipt.crypto_coin]} />
              <Row label="USD" value={"$" + parseFloat(receipt.total_usd).toFixed(2)} />
              <div style={{ fontSize: "11px", color: "#444", marginTop: "10px", marginBottom: "4px" }}>TX HASH</div>
              <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#c8f57a", wordBreak: "break-all", background: "#111", padding: "8px", borderRadius: "6px" }}>{receipt.tx_hash}</div>
            </div>
            <Btn onClick={onClose} color="#c8f57a" textColor="#0e0e0e">Готово</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ title, sub, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
      <div>
        <div style={{ fontSize: "17px", fontWeight: "700", color: "#e8e8e8" }}>{title}</div>
        {sub && <div style={{ fontSize: "11px", color: "#555", marginTop: "3px" }}>{sub}</div>}
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "2px" }}>×</button>
    </div>
  );
}

function Btn({ children, onClick, disabled, color, textColor }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "13px", background: disabled ? "#1a1a1a" : color, color: textColor, border: "none", borderRadius: "10px", cursor: disabled ? "default" : "pointer", fontSize: "14px", fontWeight: "700", opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
      <span style={{ fontSize: "12px", color: "#555" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: "600", color: color || "#e8e8e8" }}>{value}</span>
    </div>
  );
}
