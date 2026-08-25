import { useState, useRef, useEffect } from "react";
import { api } from "./api";
import Checkout from "./components/Checkout.jsx";

var uid = 1;

export default function Buyer({ user, onLogout }) {
  const [msgs, setMsgs] = useState([
    { id: uid++, from: "bot", text: "Привет, " + user.name + "! Что ищешь?", products: null }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState([]);
  const chatEl = useRef(null);
  const inputEl = useRef(null);

  useEffect(() => {
    if (chatEl.current) chatEl.current.scrollTop = chatEl.current.scrollHeight;
  }, [msgs, busy]);

  function addToCart(p) {
    setCart(prev => {
      const ex = prev.find(c => c.id === p.id);
      if (ex) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...p, qty: 1 }];
    });
  }

  async function send() {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setBusy(true);

    const userMsg = { id: uid++, from: "user", text };
    setMsgs(prev => [...prev, userMsg]);

    try {
      const data = await api.chat(text);

      if (data.cartItem && data.cartItem.product) {
        addToCart(data.cartItem.product);
      }

      setMsgs(prev => [...prev, {
        id: uid++,
        from: "bot",
        text: data.reply,
        products: data.products || null
      }]);
    } catch (e) {
      setMsgs(prev => [...prev, { id: uid++, from: "bot", text: "Ошибка: " + e.message }]);
    }
    setBusy(false);
    inputEl.current && inputEl.current.focus();
  }

  async function loadOrders() {
    try { setOrders(await api.getMyOrders()); } catch (e) { console.error(e); }
  }

  const cartTotal = cart.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0e0e0e" }}>

      {showCheckout && (
        <Checkout
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onConfirm={async (body) => {
            const order = await api.createOrder(body);
            setCart([]);
            setShowCart(false);
            return order;
          }}
        />
      )}

      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #161616", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#c8f57a" }}>FAIR</div>
          <div style={{ fontSize: "11px", color: "#444" }}>{user.name}</div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => { setShowOrders(true); setShowCart(false); loadOrders(); }} style={ghostBtn}>Заказы</button>
          <button
            onClick={() => { setShowCart(!showCart); setShowOrders(false); }}
            style={{ ...ghostBtn, color: cartCount > 0 ? "#c8f57a" : "#444", borderColor: cartCount > 0 ? "#c8f57a44" : "#1e1e1e" }}
          >
            {cartCount > 0 ? "Корзина (" + cartCount + ")" : "Корзина"}
          </button>
          <button onClick={onLogout} style={ghostBtn}>Выйти</button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div ref={chatEl} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {msgs.map(msg => (
              <div key={msg.id}>
                <div style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "8px" }}>
                  {msg.from === "bot" && (
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#161616", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0 }}>F</div>
                  )}
                  <div style={{ maxWidth: "72%", padding: "10px 14px", borderRadius: msg.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.from === "user" ? "#1a1f12" : "#161616", color: msg.from === "user" ? "#c8f57a" : "#e8e8e8", fontSize: "14px", lineHeight: "1.55", border: "1px solid " + (msg.from === "user" ? "#c8f57a22" : "#222") }}>
                    {msg.text}
                  </div>
                </div>

                {/* Inline product cards */}
                {msg.products && msg.products.length > 0 && (
                  <div style={{ marginLeft: "36px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {msg.products.map(p => (
                      <div key={p.id} style={{ background: "#161616", border: "1px solid #222", borderRadius: "12px", padding: "14px", maxWidth: "360px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "22px" }}>{p.emoji}</span>
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: "600", color: "#e8e8e8" }}>{p.name}</div>
                              <div style={{ fontSize: "11px", color: "#555" }}>{p.vendor_name}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: "700", color: "#c8f57a", flexShrink: 0, marginLeft: "10px" }}>${parseFloat(p.price).toFixed(2)}</div>
                        </div>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px", lineHeight: "1.4" }}>{p.description}</div>
                        <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                          {p.color && <Chip>{p.color}</Chip>}
                          {p.size && <Chip>{p.size}</Chip>}
                          {p.tags && p.tags.map(t => <Chip key={t}>{t}</Chip>)}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", color: "#444" }}>В наличии: {p.stock}</span>
                          <button
                            onClick={() => addToCart(p)}
                            disabled={p.stock === 0}
                            style={{ padding: "7px 16px", background: p.stock === 0 ? "transparent" : "#1a1f12", border: "1px solid " + (p.stock === 0 ? "#1e1e1e" : "#c8f57a44"), borderRadius: "8px", color: p.stock === 0 ? "#333" : "#c8f57a", cursor: p.stock === 0 ? "default" : "pointer", fontSize: "12px", fontWeight: "600" }}
                          >
                            {p.stock === 0 ? "Нет в наличии" : "+ В корзину"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#161616", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>F</div>
                <div style={{ padding: "12px 16px", background: "#161616", border: "1px solid #222", borderRadius: "18px 18px 18px 4px" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#444", animation: "pulse 1.2s " + (i * 0.2) + "s infinite" }} />)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #161616", display: "flex", gap: "8px", flexShrink: 0 }}>
            <input
              ref={inputEl}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Что ищете?"
              style={{ flex: 1, background: "#161616", border: "1px solid #222", borderRadius: "10px", padding: "11px 16px", color: "#e8e8e8", fontSize: "14px", outline: "none" }}
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              style={{ padding: "11px 20px", background: busy || !input.trim() ? "#161616" : "#c8f57a", color: busy || !input.trim() ? "#333" : "#0e0e0e", border: "none", borderRadius: "10px", cursor: busy || !input.trim() ? "default" : "pointer", fontWeight: "700", fontSize: "13px" }}
            >
              →
            </button>
          </div>
        </div>

        {/* Cart panel */}
        {showCart && (
          <div style={{ width: "280px", borderLeft: "1px solid #161616", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #161616", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#e8e8e8" }}>Корзина</div>
              <button onClick={() => setShowCart(false)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "18px" }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", color: "#333", fontSize: "13px", padding: "32px 0" }}>Корзина пуста</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #161616" }}>
                    <div>
                      <div style={{ fontSize: "13px", color: "#e8e8e8" }}>{item.emoji} {item.name}</div>
                      <div style={{ fontSize: "11px", color: "#444", marginTop: "2px" }}>×{item.qty} · ${(parseFloat(item.price) * item.qty).toFixed(2)}</div>
                    </div>
                    <button onClick={() => setCart(p => p.filter(c => c.id !== item.id))} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: "18px" }}>×</button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: "14px 16px", borderTop: "1px solid #161616" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", color: "#666" }}>Итого</span>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#e8e8e8" }}>${cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={() => setShowCheckout(true)} style={{ width: "100%", padding: "12px", background: "#c8f57a", color: "#0e0e0e", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                  Оплатить криптой
                </button>
              </div>
            )}
          </div>
        )}

        {/* Orders panel */}
        {showOrders && (
          <div style={{ width: "320px", borderLeft: "1px solid #161616", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #161616", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#e8e8e8" }}>Мои заказы</div>
              <button onClick={() => setShowOrders(false)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "18px" }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
              {orders.length === 0 ? (
                <div style={{ textAlign: "center", color: "#333", fontSize: "13px", padding: "32px 0" }}>Заказов пока нет</div>
              ) : (
                orders.map(o => (
                  <div key={o.id} style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "12px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#c8f57a" }}>#{o.id}</div>
                      <div style={{ fontSize: "12px", color: "#555" }}>${parseFloat(o.total_usd).toFixed(2)}</div>
                    </div>
                    <div style={{ fontSize: "11px", color: "#444", marginBottom: "6px" }}>{new Date(o.created_at).toLocaleString("ru")}</div>
                    {o.items && o.items.map(item => (
                      <div key={item.id} style={{ fontSize: "12px", color: "#777" }}>{item.product_emoji} {item.product_name} ×{item.qty}</div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:0.3 } 50% { opacity:1 } }`}</style>
    </div>
  );
}

function Chip({ children }) {
  return <span style={{ fontSize: "10px", padding: "2px 8px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: "4px", color: "#666" }}>{children}</span>;
}

const ghostBtn = {
  padding: "6px 12px", background: "none", border: "1px solid #1e1e1e",
  borderRadius: "8px", color: "#444", cursor: "pointer", fontSize: "12px"
};
