import { useState } from "react";

const RATES = { BTC: 0.000015, ETH: 0.00026, SOL: 0.0044, USDT: 1.0 };
const NAMES = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", USDT: "Tether" };
const COLORS = { BTC: "#f7931a", ETH: "#627eea", SOL: "#9945ff", USDT: "#26a17b" };
const COMMISSION = 0.05;

function randHex(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

export default function CryptoCheckout({ cart, onClose, onConfirm }) {
  const [step, setStep] = useState(0);
  const [coin, setCoin] = useState("ETH");
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const total = cart.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0);
  const commission = +(total * COMMISSION).toFixed(2);
  const cryptoAmt = (total * RATES[coin]).toFixed(8);
  const walletAddr = "0x" + randHex(40);

  async function confirm() {
    setPaying(true);
    try {
      const txHash = "0x" + randHex(64);
      const order = await onConfirm({ cart, coin, cryptoAmount: cryptoAmt, txHash });
      setReceipt({ ...order, amount: cryptoAmt, items: cart.slice() });
      setStep(2);
    } catch (e) {
      alert("Ошибка: " + e.message);
    }
    setPaying(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 16px 16px" }}>
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: "20px 20px 16px 16px", padding: "28px", width: "100%", maxWidth: "420px", maxHeight: "90vh", overflowY: "auto" }}>

        {step === 0 && (
          <div>
            <ModalHeader title="Выберите валюту" sub={"$" + total.toFixed(2) + " + $" + commission + " комиссия платформы (5%)"} onClose={onClose} />
            <div style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px", fontSize: "12px", color: "#555", lineHeight: "1.5" }}>
              Комиссия 5% — вместо рекламы. Продавец получает ${(total - commission).toFixed(2)}.
            </div>
            {Object.keys(RATES).map(c => {
              const active = coin === c;
              return (
                <div key={c} onClick={() => setCoin(c)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 14px", background: active ? "#0d1117" : "#111", border: "1px solid " + (active ? COLORS[c] + "66" : "#1e1e1e"), borderRadius: "10px", marginBottom: "8px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: COLORS[c] + "22", border: "1px solid " + COLORS[c] + "55", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: COLORS[c], fontSize: "13px" }}>{c[0]}</div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#e8e8e8" }}>{NAMES[c]}</div>
                      <div style={{ fontSize: "11px", color: "#555" }}>{c}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: COLORS[c] }}>{(total * RATES[c]).toFixed(6)}</div>
                </div>
              );
            })}
            <ModalBtn onClick={() => setStep(1)} bg="#c8f57a" color="#0e0e0e">Продолжить с {coin}</ModalBtn>
          </div>
        )}

        {step === 1 && (
          <div>
            <ModalHeader title={"Отправить " + coin} sub="Переведите точную сумму на адрес" onClose={onClose} />
            <div style={{ background: "#0d1117", border: "1px solid " + COLORS[coin] + "44", borderRadius: "12px", padding: "20px", marginBottom: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#555", marginBottom: "6px" }}>Отправьте ровно</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: COLORS[coin], fontFamily: "monospace" }}>{cryptoAmt}</div>
              <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>{coin} · ~${total.toFixed(2)}</div>
            </div>
            <div style={{ background: "#161616", borderRadius: "10px", padding: "12px", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", color: "#444", marginBottom: "8px", letterSpacing: "1px" }}>АДРЕС КОШЕЛЬКА</div>
              <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#888", wordBreak: "break-all", lineHeight: "1.6" }}>{walletAddr}</div>
            </div>
            <div style={{ fontSize: "11px", color: "#333", marginBottom: "16px", textAlign: "center" }}>⏱ Адрес действителен 15 минут</div>
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
            <ModalBtn onClick={confirm} disabled={paying} bg={paying ? "#1a1a1a" : COLORS[coin]} color="#fff">
              {paying ? "Подтверждение..." : "Я отправил оплату"}
            </ModalBtn>
            {paying && <div style={{ textAlign: "center", fontSize: "11px", color: "#555", marginTop: "10px" }}>Ожидаем подтверждения сети...</div>}
            <button onClick={() => setStep(0)} style={{ width: "100%", marginTop: "8px", padding: "10px", background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "13px" }}>Назад</button>
          </div>
        )}

        {step === 2 && receipt && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "14px" }}>✅</div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#c8f57a", marginBottom: "4px" }}>Оплата подтверждена</div>
            <div style={{ fontSize: "12px", color: "#555", marginBottom: "24px" }}>Заказ #{receipt.id}</div>
            <div style={{ background: "#161616", borderRadius: "12px", padding: "16px", marginBottom: "12px", textAlign: "left" }}>
              <InfoRow label="Оплачено" value={receipt.amount + " " + receipt.crypto_coin} valueColor={COLORS[receipt.crypto_coin]} />
              <InfoRow label="В долларах" value={"$" + parseFloat(receipt.total_usd).toFixed(2)} />
              <div style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "10px", color: "#444", marginBottom: "6px", letterSpacing: "1px" }}>TX HASH</div>
                <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#c8f57a", wordBreak: "break-all", background: "#111", padding: "10px", borderRadius: "8px" }}>{receipt.tx_hash}</div>
              </div>
            </div>
            <div style={{ background: "#161616", borderRadius: "12px", padding: "14px", marginBottom: "16px", textAlign: "left" }}>
              <div style={{ fontSize: "11px", color: "#444", marginBottom: "8px" }}>ТОВАРЫ</div>
              {receipt.items.map(item => (
                <div key={item.id} style={{ fontSize: "13px", color: "#888", padding: "2px 0" }}>{item.emoji} {item.name} ×{item.qty}</div>
              ))}
            </div>
            <ModalBtn onClick={onClose} bg="#c8f57a" color="#0e0e0e">Готово</ModalBtn>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalHeader({ title, sub, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
      <div>
        <div style={{ fontSize: "17px", fontWeight: "700", color: "#e8e8e8" }}>{title}</div>
        {sub && <div style={{ fontSize: "11px", color: "#555", marginTop: "3px" }}>{sub}</div>}
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "22px", lineHeight: 1 }}>×</button>
    </div>
  );
}

function ModalBtn({ children, onClick, disabled, bg, color }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "13px", background: bg, color: color, border: "none", borderRadius: "10px", cursor: disabled ? "default" : "pointer", fontSize: "14px", fontWeight: "700", opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
      <span style={{ fontSize: "12px", color: "#555" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: "600", color: valueColor || "#e8e8e8" }}>{value}</span>
    </div>
  );
}
