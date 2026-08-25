const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { signToken } = require("../auth");
const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) return res.status(400).json({ error: "Заполните все поля" });
  if (!["buyer", "vendor"].includes(role)) return res.status(400).json({ error: "Роль: buyer или vendor" });
  if (password.length < 6) return res.status(400).json({ error: "Пароль минимум 6 символов" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      "INSERT INTO users (email,password_hash,role,name) VALUES ($1,$2,$3,$4) RETURNING id,email,role,name",
      [email.toLowerCase(), hash, role, name]
    );
    const user = r.rows[0];
    res.json({ token: signToken(user), user });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Email уже зарегистрирован" });
    console.error(e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Введите email и пароль" });
  try {
    const r = await pool.query("SELECT * FROM users WHERE email=$1", [email.toLowerCase()]);
    const user = r.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: "Неверный email или пароль" });
    res.json({ token: signToken(user), user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
