import { useState } from "react";
import { api } from "./api";

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "buyer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const data = mode === "login"
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      localStorage.setItem("fair_token", data.token);
      onAuth(data.user);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: "#0e0e0e" }}>

      <div style={{ marginBottom: "48px", textAlign: "center" }}>
        <div style={{ fontSize: "28px", fontWeight: "700", color: "#c8f57a", letterSpacing: "-0.5px", marginBottom: "6px" }}>FAIR</div>
        <div style={{ fontSize: "13px", color: "#444", letterSpacing: "2px" }}>ЧЕСТНЫЙ РЫНОК</div>
      </div>

      <div style={{ width: "100%", maxWidth: "360px" }}>
        <div style={{ display: "flex", gap: "4px", marginBottom: "28px", background: "#161616", padding: "4px", borderRadius: "10px" }}>
          {[["login", "Войти"], ["register", "Регистрация"]].map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "9px", background: mode === m ? "#1e1e1e" : "transparent", color: mode === m ? "#e8e8e8" : "#555", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
              {l}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: "#e57373", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
            {error}
          </div>
        )}

        {mode === "register" && (
          <Field label="Имя">
            <input placeholder="Как вас зовут" value={form.name} onChange={e => set("name", e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} style={inputStyle} />
          </Field>
        )}

        <Field label="Email">
          <input type="email" placeholder="you@example.com" value={form.email} onChange={e => set("email", e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} style={inputStyle} />
        </Field>

        <Field label="Пароль">
          <input type="password" placeholder="Минимум 6 символов" value={form.password} onChange={e => set("password", e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} style={inputStyle} />
        </Field>

        {mode === "register" && (
          <Field label="Я хочу">
            <div style={{ display: "flex", gap: "8px" }}>
              {[["buyer", "🛍️ Покупать"], ["vendor", "📦 Продавать"]].map(([r, l]) => (
                <button key={r} onClick={() => set("role", r)} style={{ flex: 1, padding: "11px", background: form.role === r ? "#1a1f12" : "#161616", border: "1px solid " + (form.role === r ? "#c8f57a44" : "#222"), borderRadius: "8px", color: form.role === r ? "#c8f57a" : "#666", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
        )}

        <button onClick={submit} disabled={loading} style={{ width: "100%", padding: "13px", background: loading ? "#1a1a1a" : "#c8f57a", color: "#0e0e0e", border: "none", borderRadius: "10px", cursor: loading ? "default" : "pointer", fontSize: "14px", fontWeight: "700", marginTop: "8px" }}>
          {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
      </div>

      <div style={{ marginTop: "48px", fontSize: "11px", color: "#2a2a2a", textAlign: "center", lineHeight: "1.8" }}>
        Никакой рекламы. Никакой манипуляции.<br />
        5% комиссия только с продаж.
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ fontSize: "11px", color: "#444", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "7px" }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "#161616", border: "1px solid #222", borderRadius: "8px",
  padding: "11px 14px", color: "#e8e8e8", fontSize: "14px", outline: "none"
};
