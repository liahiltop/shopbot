const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const { pool } = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildBuyerSystem(products) {
  const list = products.length === 0
    ? "Товаров пока нет."
    : products.map(p =>
        `ID:${p.id} | ${p.emoji} ${p.name} | $${parseFloat(p.price).toFixed(2)} | ${p.category}` +
        (p.color ? ` | цвет:${p.color}` : "") +
        (p.size ? ` | размер:${p.size}` : "") +
        (p.tags ? ` | теги:${p.tags.join(",")}` : "") +
        ` | склад:${p.stock} | ${p.description} | продавец:${p.vendor_name}`
      ).join("\n");

  return `Ты — честный торговый помощник FAIR. Отвечай только на русском.

ПРАВИЛА (строго):
- Показывай ТОЛЬКО товары которые реально подходят под запрос
- Никогда не предлагай лишнего — пользователь спросил про ботинки, покажи ботинки
- Никаких "с этим берут", никакой допродажи, никакой рекламы
- Если товара нет — скажи честно
- Отвечай коротко и по делу

Когда показываешь товары — добавь в конец ответа:
---PRODUCTS---
[{"id":1},{"id":2}]
---END---

Когда пользователь хочет добавить в корзину:
---CART---
{"id":0,"qty":1}
---END---

Товары:
${list}`;
}

function buildVendorSystem(name) {
  return `Ты помощник продавца "${name}" на платформе FAIR. Отвечай только на русском.

Помоги разместить товар. Собери:
- название
- описание (честное, без преувеличений)  
- цена в USD
- категория
- количество
- цвет (если важно)
- размер (если важно)
- теги через запятую (для поиска)

Когда всё собрано:
---PRODUCT---
{"name":"","description":"","price":0,"category":"","stock":0,"emoji":"","color":"","size":"","tags":["тег1","тег2"]}
---END---

Важно: описание должно быть честным. Платформа FAIR — без рекламных трюков.`;
}

function extract(text, open, close) {
  const s = text.indexOf(open);
  if (s === -1) return null;
  const e = text.indexOf(close, s + open.length);
  if (e === -1) return null;
  try { return JSON.parse(text.slice(s + open.length, e).trim()); } catch { return null; }
}

function clean(text) {
  return text
    .replace(/---PRODUCTS---[\s\S]*?---END---/g, "")
    .replace(/---PRODUCT---[\s\S]*?---END---/g, "")
    .replace(/---CART---[\s\S]*?---END---/g, "")
    .trim();
}

router.post("/", requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Сообщение пустое" });

  try {
    const histRows = await pool.query(
      "SELECT role,content FROM chat_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20",
      [req.user.id]
    );
    const history = histRows.rows.reverse();
    const messages = [...history, { role: "user", content: message }];

    let system, products = [];

    if (req.user.role === "buyer") {
      const pr = await pool.query(
        `SELECT p.*,u.name as vendor_name FROM products p
         JOIN users u ON p.vendor_id=u.id WHERE p.active=TRUE ORDER BY p.created_at DESC`
      );
      products = pr.rows;
      system = buildBuyerSystem(products);
    } else {
      system = buildVendorSystem(req.user.name);
    }

    const response = await claude.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system,
      messages
    });

    const reply = response.content[0].text;
    const cleanReply = clean(reply);

    // Save history
    await pool.query(
      "INSERT INTO chat_history (user_id,role,content) VALUES ($1,$2,$3)",
      [req.user.id, "user", message]
    );
    await pool.query(
      "INSERT INTO chat_history (user_id,role,content) VALUES ($1,$2,$3)",
      [req.user.id, "assistant", cleanReply]
    );

    const result = { reply: cleanReply };

    // Parse matched products to show as cards
    if (req.user.role === "buyer") {
      const productIds = extract(reply, "---PRODUCTS---\n", "\n---END---") ||
                         extract(reply, "---PRODUCTS---", "---END---");
      if (Array.isArray(productIds)) {
        result.products = productIds
          .map(p => products.find(x => x.id === p.id))
          .filter(Boolean);
      }

      const cartItem = extract(reply, "---CART---\n", "\n---END---") ||
                       extract(reply, "---CART---", "---END---");
      if (cartItem && typeof cartItem.id === "number") {
        const found = products.find(p => p.id === cartItem.id);
        if (found) result.cartItem = { ...cartItem, product: found };
      }
    }

    if (req.user.role === "vendor") {
      const prod = extract(reply, "---PRODUCT---\n", "\n---END---") ||
                   extract(reply, "---PRODUCT---", "---END---");
      if (prod && prod.name) {
        const ins = await pool.query(
          `INSERT INTO products (vendor_id,name,description,price,category,stock,emoji,color,size,tags)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [req.user.id, prod.name, prod.description, prod.price, prod.category,
           prod.stock, prod.emoji || "📦", prod.color || null, prod.size || null,
           prod.tags || null]
        );
        result.newProduct = ins.rows[0];
      }
    }

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/history", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM chat_history WHERE user_id=$1", [req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
