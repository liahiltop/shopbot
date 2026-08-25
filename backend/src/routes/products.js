const express = require("express");
const { pool } = require("../db");
const { requireAuth, requireRole } = require("../auth");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT p.*, u.name as vendor_name
       FROM products p JOIN users u ON p.vendor_id=u.id
       WHERE p.active=TRUE ORDER BY p.created_at DESC`
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: "Ошибка сервера" }); }
});

router.get("/my", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM products WHERE vendor_id=$1 ORDER BY created_at DESC", [req.user.id]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: "Ошибка сервера" }); }
});

router.post("/", requireAuth, requireRole("vendor"), async (req, res) => {
  const { name, description, price, category, stock, emoji, color, size, tags } = req.body;
  if (!name || !description || !price || !category || stock === undefined)
    return res.status(400).json({ error: "Заполните обязательные поля" });
  try {
    const r = await pool.query(
      `INSERT INTO products (vendor_id,name,description,price,category,stock,emoji,color,size,tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.id, name, description, price, category, stock, emoji || "📦",
       color || null, size || null, tags || null]
    );
    res.json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: "Ошибка сервера" }); }
});

router.put("/:id", requireAuth, requireRole("vendor"), async (req, res) => {
  const { name, description, price, category, stock, emoji, color, size, tags, active } = req.body;
  try {
    const r = await pool.query(
      `UPDATE products SET name=$1,description=$2,price=$3,category=$4,stock=$5,
       emoji=$6,color=$7,size=$8,tags=$9,active=$10
       WHERE id=$11 AND vendor_id=$12 RETURNING *`,
      [name, description, price, category, stock, emoji, color, size, tags, active !== false, req.params.id, req.user.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Товар не найден" });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: "Ошибка сервера" }); }
});

router.delete("/:id", requireAuth, requireRole("vendor"), async (req, res) => {
  try {
    await pool.query("UPDATE products SET active=FALSE WHERE id=$1 AND vendor_id=$2", [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Ошибка сервера" }); }
});

module.exports = router;
