require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initDB } = require("./db");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/chat", require("./routes/chat"));
app.get("/api/health", (_, res) => res.json({ status: "ok", time: new Date() }));

const PORT = process.env.PORT || 3001;
initDB().then(() => app.listen(PORT, () => console.log("FAIR запущен на порту " + PORT)));
