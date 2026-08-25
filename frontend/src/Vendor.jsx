import { useState, useRef, useEffect } from "react";
import { api } from "./api";

var uid = 1000;

export default function Vendor({ user, onLogout }) {
  const [msgs, setMsgs] = useState([
    { id: uid++, from: "bot", text: user.name + ", добрый день! Опишите товар который хотите разместить — название, цену, количество. Я помогу оформить." }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("chat");
  const chatEl = useRef(null);
  const inputEl = useRef(null);

  useEffect(() => {
    api.getMyProducts().then(setProducts).catch(console.error);
  }, []);

  useEffect(() => {
    if (chatEl.current) chatEl.current.scrollTop = chatEl.current.scrollHeight;
  }, [msgs, busy]);

  useEffect(() => {
    if (tab === "orders") api.getVendorOrders().then(setOrders).catch(console.error);
    if (tab === "products") api.getMyProducts().then(setProducts).catch(console.error);
  }, [tab]);

  async function send() {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setBusy(true);
    setMsgs(prev => [...prev, { id: uid++, from: "user", text }]);

    try {
      const data = await api.chat(text);
      if (data.newProduct) {
        setProducts(prev => [data.newProduct, ...prev]);
      }
      setMsgs(prev => [...prev, { id: uid++, from: "bot", text: data.reply }]);
    } catch (e) {
      setMsgs(prev => [...prev, { id: uid++, from: "bot", text: "Ошибка: " + e.message }]);
    }
    setBusy(false);
    inputEl.current && inputEl.current.focus();
  }

  async function remove(id) {
    try {
      await api.deleteProduct(id);
      setProducts(p => p.filter(x => x.id !== id));
    } catch (e) { alert(e.message); }
  }

  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_usd || 0), 0);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0e0e0e" }}>

      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #161616", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#c8f57a" }}>FAIR</div>
          <div style={{ fontSize: "11px", color: "#444" }}>Продавец: {user.name}</div>
        </div>
        <button onClick={onLogout} style={{ padding: "6px 12px", background: "none", border: "1px solid #1e1e1e", borderRadius: "8px", color: "#444", cursor: "pointer", fontSize: "12px" }}>Выйти</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #161616", flexShrink: 0 }}>
        {[["chat", "Добавить товар"], ["products", "Мои товары (" + products.length + ")"], ["orders", "Продажи"]].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "12px 20px", background: "none", border: "none", borderBottom: "2px solid " + (tab === t ? "#c8f57a" : "transparent"), color: tab === t ? "#c8f57a" : "#444", cursor: "pointer", fontSize: "13px", fontWeight: tab === t ? "600" : "400" }}>
            {l}
          </button>
        ))}
      </div>

      {/* Chat */}
      {tab === "chat" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div ref={chatEl} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {msgs.map(msg => {
              const isUser = msg.from === "user";
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "8px" }}>
                  {!isUser && (
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#161616", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0 }}>F</div>
                  )}
                  <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isUser ? "#111820" : "#161616", color: isUser ? "#c8f57a" : "#e8e8e8", fontSize: "14px", lineHeight: "1.55", border: "1px solid " + (isUser ? "#c8f57a22" : "#222") }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
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
          <div style={{ padding: "12px 16px", borderTop: "1px solid #161616", display: "flex", gap: "8px", flexShrink: 0 }}>
            <input
              ref={inputEl}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Опишите товар..."
              style={{ flex: 1, background: "#161616", border: "1px solid #222", borderRadius: "10px", padding: "11px 16px", color: "#e8e8e8", fontSize: "14px", outline: "none" }}
            />
            <button onClick={send} disabled={busy || !input.trim()} style={{ padding: "11px 20px", background: busy || !input.trim() ? "#161616" : "#c8f57a", color: busy || !input.trim() ? "#333" : "#0e0e0e", border: "none", borderRadius: "10px", cursor: busy || !input.trim() ? "default" : "pointer", fontWeight: "700", fontSize: "13px" }}>
              →
            </button>
          </div>
        </div>
      )}

      {/* Products */}
      {tab === "products" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {products.length === 0 ? (
            <div style={{ textAlign: "center", color: "#333", fontSize: "14px", padding: "60px 0" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📦</div>
              Товаров пока нет. Опишите их в чате!
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
              {products.map(p => (
                <div key={p.id} style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{ fontSize: "26px" }}>{p.emoji}</span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#c8f57a" }}>${parseFloat(p.price).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#e8e8e8", marginBottom: "4px" }}>{p.name}</div>
                  <div style={{ fontSize: "12px", color: "#555", marginBottom: "10px", lineHeight: "1.4" }}>{p.description}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#444" }}>Склад: {p.stock}</span>
                    <button onClick={() => remove(p.id)} style={{ padding: "5px 12px", background: "none", border: "1px solid #2a1414", borderRadius: "6px", color: "#c07070", cursor: "pointer", fontSize: "11px" }}>Снять</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders */}
      {tab === "orders" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {orders.length > 0 && (
            <div style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: "#444", marginBottom: "4px" }}>ОБЩАЯ ВЫРУЧКА (за вычетом 5%)</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#c8f57a" }}>${(totalRevenue * 0.95).toFixed(2)}</div>
            </div>
          )}
          {orders.length === 0 ? (
            <div style={{ textAlign: "center", color: "#333", fontSize: "14px", padding: "60px 0" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📊</div>
              Продаж пока нет
            </div>
          ) : (
            orders.map(o => (
              <div key={o.id} style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "14px", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#e8e8e8" }}>Заказ #{o.id}</div>
                    <div style={{ fontSize: "11px", color: "#444" }}>{o.buyer_name} · {new Date(o.created_at).toLocaleString("ru")}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#c8f57a" }}>${(parseFloat(o.total_usd) * 0.95).toFixed(2)}</div>
                    <div style={{ fontSize: "10px", color: "#333" }}>после комиссии</div>
                  </div>
                </div>
                {o.items && o.items.map((item, i) => (
                  <div key={i} style={{ fontSize: "12px", color: "#666", padding: "2px 0" }}>{item.emoji} {item.name} ×{item.qty}</div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity:0.3 } 50% { opacity:1 } }`}</style>
    </div>
  );
}
