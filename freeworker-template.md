# Шаблон: сервис приёма заявок + админ-панель

> Универсальный паттерн для быстрого создания небольшого веб-сервиса, где клиенты оставляют заявки, а администраторы обрабатывают их в панели управления.
> Основан на проекте Freeworker (Node.js + Express + SQLite + PWA + Telegram-уведомления).

---

## 1. Общая архитектура

```
┌──────────────┐      POST /api/orders      ┌──────────────┐
│  Форма заявки│ ──────────────────────────> │   Express    │
│  (PWA/SPA)   │                             │    API       │
└──────────────┘                             └──────┬───────┘
                                                   │
                          ┌────────────┐           │
                          │  SQLite    │ <─────────┤
                          │ orders.db  │           │
                          └────────────┘           │
                                                   │
                          ┌────────────┐           │
                          │  Telegram  │ <─────────┘
                          │    бот     │  уведомления
                          └────────────┘
```

**Поток данных:**
1. Клиент заполняет форму → POST `/api/orders`.
2. API сохраняет заявку в БД и отправляет уведомление в Telegram.
3. Админ открывает `/admin.html`, логинится и видит список заявок.
4. Админ меняет статус, добавляет комментарий, закрывает заявку.
5. Клиент может проверить статус по ссылке/номеру (опционально).

---

## 2. Рекомендуемый стек

| Слой | Технология |
|------|-----------|
| Бэкенд | Node.js 18+, Express 4 |
| База данных | SQLite (`better-sqlite3`) |
| Аутентификация | JWT (`jsonwebtoken`) + bcryptjs |
| Валидация | express-validator (или ручная) |
| Rate limiting | express-rate-limit |
| Уведомления | node-telegram-bot-api |
| Процессы | PM2 |
| Фронтенд | HTML + Tailwind CSS + Alpine.js (CDN) |
| PWA | Service Worker + manifest |
| Тесты | Jest + Supertest |
| Документация API | Swagger / OpenAPI |

---

## 3. Структура проекта

```
my-orders-service/
├── server.js                 # Точка входа
├── src/
│   ├── app.js                # Настройка Express + маршруты
│   ├── config/
│   │   └── index.js          # CORS, лимиты, константы
│   ├── db/
│   │   ├── index.js          # Инициализация SQLite
│   │   └── migrations.js     # Создание/обновление таблиц
│   ├── middleware/
│   │   ├── auth.js           # Проверка JWT
│   │   ├── adminAuth.js      # Проверка admin-токена
│   │   ├── errorHandler.js   # Централизованная обработка ошибок
│   │   └── rateLimiter.js    # Лимиты на публичные endpoint'ы
│   ├── routes/
│   │   ├── health.js
│   │   ├── orders.js         # Публичные заявки
│   │   ├── auth.js           # Регистрация/вход клиентов
│   │   ├── client.js         # Личный кабинет клиента
│   │   └── admin.js          # Админ-панель
│   └── utils/
│       ├── telegram.js       # Отправка уведомлений
│       └── validators.js     # Общие валидаторы
├── frontend/
│   ├── index.html            # Лендинг / форма заявки
│   ├── admin.html            # Админ-панель
│   ├── pwa/
│   │   ├── index.html        # Клиентское PWA
│   │   ├── manifest.json
│   │   └── sw.js
│   └── icons/
├── data/
│   └── orders.db             # SQLite
├── scripts/
│   ├── backup-db.sh          # Бэкап БД
│   └── monitor.sh            # Мониторинг
├── tests/
│   └── api.test.js
├── .env                      # Переменные окружения
├── .env.example
├── package.json
├── swagger.json              # OpenAPI
└── README.md
```

---

## 4. Пошаговое создание проекта

### 4.1. Инициализация

```bash
mkdir my-orders-service && cd my-orders-service
npm init -y
npm install express better-sqlite3 jsonwebtoken bcryptjs express-rate-limit node-telegram-bot-api dotenv helmet cors
npm install --save-dev jest supertest nodemon
```

### 4.2. Переменные окружения

Файл `.env.example`:

```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/orders.db

# Админка
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2a$10$...  # bcrypt хеш пароля
ADMIN_TOKEN=very-strong-random-string
JWT_SECRET=another-strong-random-string

# Telegram-бот
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_ADMIN_CHAT_ID=-1001234567890

# URL
BASE_URL=https://my-service.example.com
```

### 4.3. Схема базы данных

Файл `src/db/migrations.js`:

```javascript
"use strict";

const TABLES = {
  orders: `
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      client_email TEXT,
      description TEXT NOT NULL,
      address TEXT,
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'in_progress', 'done', 'cancelled')),
      price INTEGER,
      comment TEXT,
      source TEXT DEFAULT 'site',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  clients: `
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  invites: `
    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  admins: `
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `
};

function migrate(db) {
  Object.values(TABLES).forEach((sql) => {
    db.exec(sql);
  });
}

module.exports = { migrate };
```

Файл `src/db/index.js`:

```javascript
"use strict";

const Database = require("better-sqlite3");
const path = require("path");
const { migrate } = require("./migrations");

const dbPath = process.env.DB_PATH || path.join(__dirname, "../../data/orders.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
migrate(db);

module.exports = db;
```

### 4.4. Точка входа Express

Файл `server.js`:

```javascript
"use strict";

require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Файл `src/app.js`:

```javascript
"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const healthRouter = require("./routes/health");
const ordersRouter = require("./routes/orders");
const authRouter = require("./routes/auth");
const clientRouter = require("./routes/client");
const adminRouter = require("./routes/admin");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.BASE_URL || "*" }));
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/auth", authRouter);
app.use("/api/client", clientRouter);
app.use("/api/admin", adminRouter);

app.use(errorHandler);

module.exports = app;
```

### 4.5. Публичный endpoint заявок

Файл `src/routes/orders.js`:

```javascript
"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const db = require("../db");
const { notifyNewOrder } = require("../utils/telegram");

const router = express.Router();

const createLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Слишком много заявок. Попробуйте позже." }
});

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${date}-${random}`;
}

router.post("/", createLimit, (req, res, next) => {
  try {
    const { client_name, client_phone, client_email, description, address } = req.body;

    if (!client_name || !client_phone || !description) {
      return res.status(400).json({ error: "Заполните обязательные поля" });
    }

    const orderNumber = generateOrderNumber();
    const stmt = db.prepare(`
      INSERT INTO orders (order_number, client_name, client_phone, client_email, description, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(orderNumber, client_name, client_phone, client_email || null, description, address || null);

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(result.lastInsertRowid);

    notifyNewOrder(order).catch(console.error);

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", (req, res, next) => {
  try {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
    if (!order) return res.status(404).json({ error: "Заявка не найдена" });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

### 4.6. Telegram-уведомления

Файл `src/utils/telegram.js`:

```javascript
"use strict";

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

const bot = token ? new TelegramBot(token, { polling: false }) : null;

async function notifyNewOrder(order) {
  if (!bot || !chatId) return;

  const text = [
    `🆕 Новая заявка #${order.order_number}`,
    `👤 ${order.client_name}`,
    `📞 ${order.client_phone}`,
    `📧 ${order.client_email || "—"}`,
    `🏠 ${order.address || "—"}`,
    `📝 ${order.description}`
  ].join("\n");

  await bot.sendMessage(chatId, text);
}

module.exports = { notifyNewOrder };
```

### 4.7. Админ-аутентификация

Файл `src/middleware/adminAuth.js`:

```javascript
"use strict";

function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"] || req.headers.authorization?.replace("Bearer ", "");
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

module.exports = adminAuth;
```

### 4.8. Админ-роуты

Файл `src/routes/admin.js`:

```javascript
"use strict";

const express = require("express");
const db = require("../db");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();
router.use(adminAuth);

router.get("/orders", (req, res, next) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    let sql = "SELECT * FROM orders WHERE 1=1";
    const params = [];

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    if (search) {
      sql += " AND (client_name LIKE ? OR client_phone LIKE ? OR order_number LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const orders = db.prepare(sql).all(...params);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

router.patch("/orders/:id/status", (req, res, next) => {
  try {
    const { status, comment, price } = req.body;
    const stmt = db.prepare(`
      UPDATE orders SET status = ?, comment = ?, price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(status, comment || null, price || null, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get("/stats", (req, res, next) => {
  try {
    const total = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
    const newOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'new'").get().count;
    res.json({ total, new: newOrders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

### 4.9. Форма заявки (frontend/index.html)

Минимальный пример формы:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Оставить заявку</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
  <form id="orderForm" class="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
    <h1 class="text-2xl font-bold mb-4">Заявка на ремонт</h1>

    <label class="block mb-2">Имя</label>
    <input name="client_name" required class="w-full border p-2 rounded mb-4">

    <label class="block mb-2">Телефон</label>
    <input name="client_phone" required class="w-full border p-2 rounded mb-4">

    <label class="block mb-2">Email</label>
    <input name="client_email" type="email" class="w-full border p-2 rounded mb-4">

    <label class="block mb-2">Адрес</label>
    <input name="address" class="w-full border p-2 rounded mb-4">

    <label class="block mb-2">Описание проблемы</label>
    <textarea name="description" required class="w-full border p-2 rounded mb-4" rows="4"></textarea>

    <!-- Honeypot -->
    <input type="text" name="website" class="hidden" tabindex="-1" autocomplete="off">

    <button type="submit" class="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
      Отправить заявку
    </button>

    <p id="result" class="mt-4 text-center"></p>
  </form>

  <script>
    document.getElementById("orderForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      if (form.website.value) return; // honeypot

      const data = Object.fromEntries(new FormData(form));
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      document.getElementById("result").textContent =
        json.success ? `Заявка принята: ${json.order.order_number}` : json.error;
    });
  </script>
</body>
</html>
```

### 4.10. Админ-панель (frontend/admin.html)

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Админ-панель</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="bg-gray-100 p-4" x-data="adminApp()">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Заявки</h1>

    <template x-if="!token">
      <div class="bg-white p-6 rounded shadow max-w-sm mx-auto">
        <input x-model="inputToken" type="password" placeholder="Admin token" class="w-full border p-2 rounded mb-4">
        <button @click="login()" class="w-full bg-blue-600 text-white p-2 rounded">Войти</button>
      </div>
    </template>

    <template x-if="token">
      <div>
        <div class="mb-4 flex gap-2">
          <button @click="load()" class="bg-gray-200 px-4 py-2 rounded">Обновить</button>
          <span class="py-2">Всего: <b x-text="stats.total"></b> | Новых: <b x-text="stats.new"></b></span>
        </div>

        <table class="w-full bg-white rounded shadow">
          <thead class="bg-gray-200">
            <tr>
              <th class="p-2 text-left">№</th>
              <th class="p-2 text-left">Клиент</th>
              <th class="p-2 text-left">Телефон</th>
              <th class="p-2 text-left">Статус</th>
              <th class="p-2 text-left">Создана</th>
            </tr>
          </thead>
          <tbody>
            <template x-for="order in orders" :key="order.id">
              <tr class="border-t">
                <td class="p-2" x-text="order.order_number"></td>
                <td class="p-2" x-text="order.client_name"></td>
                <td class="p-2" x-text="order.client_phone"></td>
                <td class="p-2" x-text="order.status"></td>
                <td class="p-2" x-text="order.created_at"></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </template>
  </div>

  <script>
    function adminApp() {
      return {
        token: localStorage.getItem("adminToken") || "",
        inputToken: "",
        orders: [],
        stats: { total: 0, new: 0 },
        async login() {
          this.token = this.inputToken;
          localStorage.setItem("adminToken", this.token);
          await this.load();
        },
        async load() {
          const headers = { "X-Admin-Token": this.token };
          const [ordersRes, statsRes] = await Promise.all([
            fetch("/api/admin/orders", { headers }),
            fetch("/api/admin/stats", { headers })
          ]);
          if (!ordersRes.ok) {
            this.token = "";
            localStorage.removeItem("adminToken");
            return;
          }
          this.orders = (await ordersRes.json()).orders;
          this.stats = await statsRes.json();
        }
      };
    }
  </script>
</body>
</html>
```

### 4.11. Обработка ошибок

Файл `src/middleware/errorHandler.js`:

```javascript
"use strict";

function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
  });
}

module.exports = errorHandler;
```

### 4.12. Тесты

Файл `tests/api.test.js`:

```javascript
"use strict";

const request = require("supertest");
const app = require("../src/app");

describe("Orders API", () => {
  it("POST /api/orders creates order", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({
        client_name: "Иван",
        client_phone: "+79990000000",
        description: "Не работает холодильник"
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});
```

### 4.13. package.json

```json
{
  "name": "my-orders-service",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --runInBand"
  }
}
```

---

## 5. Деплой

### Вариант A: простой запуск на сервере

```bash
# Клонировать, установить зависимости
git clone <repo> /srv/my-service
cd /srv/my-service
npm install --production

# Создать .env
cp .env.example .env
nano .env

# Запустить через PM2
pm2 start server.js --name my-service-api
pm2 save
pm2 startup
```

### Вариант B: с nginx + SSL

```nginx
server {
    listen 443 ssl http2;
    server_name my-service.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        root /var/www/my-service;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Автодеплой фронтенда

Скрипт `scripts/deploy-frontend.sh`:

```bash
#!/bin/bash
set -e
SRC="/srv/my-service/frontend"
DEST="/var/www/my-service"
mkdir -p "$DEST"
cp -r "$SRC"/* "$DEST"
echo "Frontend deployed to $DEST"
```

---

## 6. Чеклист запуска проекта

- [ ] Создать репозиторий и скопировать структуру
- [ ] Установить зависимости (`npm install`)
- [ ] Настроить `.env`
- [ ] Создать папку `data/`
- [ ] Проверить запуск (`npm run dev`)
- [ ] Проверить создание заявки через форму
- [ ] Проверить Telegram-уведомления
- [ ] Проверить вход в админку
- [ ] Настроить бэкап БД (`scripts/backup-db.sh`)
- [ ] Настроить nginx + SSL
- [ ] Запустить через PM2
- [ ] Написать тесты (`npm test`)
- [ ] Добавить PWA (опционально)

---

## 7. Рекомендации по безопасности

- **Никогда не коммитьте `.env`** — используйте `.env.example`.
- Генерируйте длинные случайные `ADMIN_TOKEN` и `JWT_SECRET`.
- Используйте `bcryptjs` для хеширования паролей.
- Включайте `express-rate-limit` на публичных endpoint'ах.
- Добавьте honeypot-поле в формы для защиты от ботов.
- Используйте `helmet` для заголовков безопасности.
- Проверяйте входные данные перед записью в БД.
- Делайте регулярные бэкапы БД.
- Ограничьте доступ к `/admin.html` на уровне nginx по IP (дополнительно).

---

## 8. Возможные расширения

- Email-уведомления клиентам (Nodemailer).
- SMS-уведомления (Twilio, SMSC.ru).
- Интеграция с CRM / Google Sheets.
- Экспорт заявок в Excel.
- Фильтры, пагинация и сортировка в админке.
- Роли администраторов (менеджер, мастер).
- Прикрепление фото к заявкам.
- Календарь выезда мастера (`.ics`).
- n8n-автоматизации.

---

## Лицензия

Шаблон свободен для использования в личных и коммерческих проектах.
