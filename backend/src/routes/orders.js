const express = require("express");
const { pool } = require("../db");
const { requireAuth, requireRole } = require("../auth");
const router = express.Router();

const COMMISSION = 0.05; // 5%

router.post("/", requireAuth, requireRole("buyer"), async (req, res) => {
  const { cart, coin, cryptoAmount, txHash } = req.body;
  if (!cart || !cart.length || !coin || !cryptoAmount || !txHash)
    return res.status(400).json({ error: "Некорректные данные" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const total = cart.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0);
    const commission = +(total * COMMISSION).toFixed(2);

    const orderRes = await client.query(
      `INSERT INTO orders (buyer_id,total_usd,commission_usd,crypto_coin,crypto_amount,tx_hash)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, total.toFixed(2), commission, coin, cryptoAmount, txHash]
    );
    const order = orderRes.rows[0];

    for (const item of cart) {
      await client.query(
        `INSERT INTO order_items (order_id,product_id,product_name,product_emoji,vendor_id,price,qty)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [order.id, item.id, item.name, item.emoji, item.vendor_id, item.price, item.qty]
      );
      await client.query(
        "UPDATE products SET stock=GREATEST(0,stock-$1) WHERE id=$2",
        [item.qty, item.id]
      );
    }
    await client.query("COMMIT");
    res.json(order);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Ошибка создания заказа" });
  } finally {
    client.release();
  }
});

router.get("/my", requireAuth, async (req, res) => {
  try {
    const orders = await pool.query(
      "SELECT * FROM orders WHERE buyer_id=$1 ORDER BY created_at DESC", [req.user.id]
    );
    const items = await pool.query(
      `SELECT oi.* FROM order_items oi
       JOIN orders o ON oi.order_id=o.id WHERE o.buyer_id=$1`, [req.user.id]
    );
    res.json(orders.rows.map(o => ({ ...o, items: items.rows.filter(i => i.order_id === o.id) })));
  } catch (e) { res.status(500).json({ error: "Ошибка сервера" }); }
});

router.get("/vendor", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.*, u.name as buyer_name,
              json_agg(json_build_object(
                'name', oi.product_name, 'emoji', oi.product_emoji,
                'qty', oi.qty, 'price', oi.price
              )) as items
       FROM orders o
       JOIN order_items oi ON oi.order_id=o.id
       JOIN users u ON o.buyer_id=u.id
       WHERE oi.vendor_id=$1
       GROUP BY o.id, u.name
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: "Ошибка сервера" }); }
});

module.exports = router;
