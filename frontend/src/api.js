const BASE = import.meta.env.VITE_API_URL || "";

function getToken() { return localStorage.getItem("fair_token"); }

async function req(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  let res;
  try {
    res = await fetch(BASE + "/api" + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new Error("Сервер недоступен. Проверьте подключение.");
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      "Ошибка сервера (статус " + res.status + ").\n" +
      "Проверьте VITE_API_URL в настройках Railway.\n" +
      "Ответ: " + text.slice(0, 150)
    );
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}

export const api = {
  register: (b) => req("POST", "/auth/register", b),
  login: (b) => req("POST", "/auth/login", b),

  getProducts: () => req("GET", "/products"),
  getMyProducts: () => req("GET", "/products/my"),
  addProduct: (b) => req("POST", "/products", b),
  updateProduct: (id, b) => req("PUT", "/products/" + id, b),
  deleteProduct: (id) => req("DELETE", "/products/" + id),

  chat: (message) => req("POST", "/chat", { message }),
  clearHistory: () => req("DELETE", "/chat/history"),

  createOrder: (b) => req("POST", "/orders", b),
  getMyOrders: () => req("GET", "/orders/my"),
  getVendorOrders: () => req("GET", "/orders/vendor"),
};
