# FAIR — Честный рынок

Мессенджер-маркетплейс. Пользователь спрашивает — получает товары. Никакой рекламы, никакой манипуляции.

## Идея

Все маркетплейсы показывают тысячи товаров и давят на пользователя на каждом шаге.
FAIR работает как рынок: ты пришёл за ботинками — получил ботинки. Ничего лишнего.

**Монетизация:** 5% с каждой продажи. Без рекламных аукционов — все товары равны.

---

## Деплой на Railway

### Шаг 1. Загрузи на GitHub
Структура репозитория:
```
fair/
  backend/
  frontend/
```

### Шаг 2. Бэкенд

1. Railway → New Project → GitHub repo
2. Root Directory: `backend`
3. Добавь переменные (Settings → Variables):

```
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=минимум-32-случайных-символа
NODE_ENV=production
FRONTEND_URL=https://твой-фронтенд.up.railway.app
```

### Шаг 3. PostgreSQL

1. Add Service → Database → PostgreSQL
2. `DATABASE_URL` подключится к бэкенду автоматически
3. Таблицы создадутся при первом запуске

### Шаг 4. Фронтенд

1. Add Service → GitHub repo
2. Root Directory: `frontend`
3. Переменные:

```
VITE_API_URL=https://твой-бэкенд.up.railway.app
```

### Шаг 5. Обнови FRONTEND_URL

Скопируй URL фронтенда и вставь в переменную `FRONTEND_URL` бэкенда.

---

## Локальная разработка

```bash
# Бэкенд
cd backend
cp .env.example .env   # заполни своими ключами
npm install
npm run dev            # запустится на :3001

# Фронтенд
cd frontend
# .env не нужен — vite.config.js проксирует /api на :3001
npm install
npm run dev            # запустится на :5173
```

---

## Как работает

### Покупатель
- Регистрация → роль "Покупатель"
- В чате: *"ищу зимние ботинки размер 42 до 5000р"*
- Бот показывает только подходящие товары — карточками прямо в чате
- Нажать "+ В корзину" → Оплатить криптой (BTC/ETH/SOL/USDT)

### Продавец
- Регистрация → роль "Продавец"
- В чате описывает товар: *"продаю кроссовки Nike Air Max, белые, размер 42, $89, 5 пар"*
- Бот уточняет и добавляет товар в каталог
- Вкладка "Продажи" показывает заказы и выручку за вычетом 5%

---

## API

| Метод | URL | Доступ |
|---|---|---|
| POST | /api/auth/register | Публичный |
| POST | /api/auth/login | Публичный |
| GET | /api/products | Публичный |
| POST | /api/products | Продавец |
| PUT | /api/products/:id | Продавец |
| DELETE | /api/products/:id | Продавец |
| POST | /api/chat | Авторизован |
| DELETE | /api/chat/history | Авторизован |
| POST | /api/orders | Покупатель |
| GET | /api/orders/my | Покупатель |
| GET | /api/orders/vendor | Продавец |
| GET | /api/health | Публичный |
