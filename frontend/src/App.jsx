import { useState, useEffect } from "react";
import Auth from "./Auth.jsx";
import Buyer from "./Buyer.jsx";
import Vendor from "./Vendor.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("fair_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({ id: payload.id, email: payload.email, role: payload.role, name: payload.name });
        } else {
          localStorage.removeItem("fair_token");
        }
      } catch {
        localStorage.removeItem("fair_token");
      }
    }
    setReady(true);
  }, []);

  function onAuth(u) { setUser(u); }
  function onLogout() { localStorage.removeItem("fair_token"); setUser(null); }

  if (!ready) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0e0e0e", color: "#333", fontSize: "13px" }}>
      Загрузка...
    </div>
  );

  if (!user) return <Auth onAuth={onAuth} />;
  if (user.role === "vendor") return <Vendor user={user} onLogout={onLogout} />;
  return <Buyer user={user} onLogout={onLogout} />;
}
