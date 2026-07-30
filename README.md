# Cook and Fry

Сервис приёма заявок на доставку обедов для компании Cook and Fry. Клиент выбирает дату доставки, три блюда, напиток и хлебобулочное изделие. Администратор обрабатывает заказы в панели управления.

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Создать .env из шаблона
cp .env.example .env
# Отредактировать .env

# Запуск в режиме разработки
npm run dev
```

## Структура

- `server.js` — точка входа
- `src/app.js` — настройка Express
- `src/routes/` — API endpoints
- `src/db/` — SQLite и миграции
- `src/middleware/` — middleware аутентификации и ошибок
- `src/notifications/` — уведомления (Telegram, VK, Max)
- `frontend/` — форма заказа и админ-панель
- `tests/` — тесты
- `scripts/` — бэкапы и деплой

## API

### Публичные

- `POST /api/orders` — создать заказ на обед
- `GET /api/orders/:id` — получить заказ

### Административные (требуется `X-Admin-Token`)

- `GET /api/admin/orders` — список заказов с фильтрами
- `PATCH /api/admin/orders/:id/status` — изменить статус заказа
- `GET /api/admin/stats` — статистика по статусам
- `GET /api/admin/companies` — список компаний

## Поля заказа

| Поле | Описание |
|------|----------|
| `company_name` | Компания-заказчик |
| `delivery_date` | Дата доставки обеда |
| `customer_name` | Имя заказчика |
| `customer_phone` | Телефон |
| `customer_email` | Email (опционально) |
| `dish1`, `dish2`, `dish3` | Три блюда |
| `drink` | Напиток (опционально) |
| `bread` | Хлебобулочное изделие (опционально) |
| `comment` | Комментарий (опционально) |
| `status` | Статус: `new`, `confirmed`, `preparing`, `delivered`, `cancelled` |

## Деплой

### 1. Подготовка окружения

Скопируй `.env.example` в `.env` и заполни секреты:

```bash
cp .env.example .env
# Отредактируй .env: ADMIN_PASSWORD_HASH, ADMIN_TOKEN, JWT_SECRET, TELEGRAM_* и т.д.
```

### 2. Запуск через PM2

```bash
./scripts/deploy.sh
```

Это установит зависимости и запустит/перезапустит приложение через `ecosystem.config.js` на порту `3001`.

### 3. Настройка nginx

Файл конфигурации уже подготовлен:

```bash
# Запустить от root или с sudo:
./deploy/apply-nginx.sh
```

После этого сервис будет доступен по HTTP на IP `82.26.94.231` (порт 80).

### 4. SSL и домен

Когда появится домен:

1. Замени `example.com` в `deploy/nginx-cook-and-fry-ssl.conf` на свой домен.
2. Установи certbot и получи сертификат:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d example.com -d www.example.com
   ```
3. Активируй SSL-конфиг:
   ```bash
   sudo cp deploy/nginx-cook-and-fry-ssl.conf /etc/nginx/sites-available/cook-and-fry
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### 5. Автозапуск

PM2 уже сохраняет список процессов. Для автозапуска после перезагрузки:

```bash
pm2 startup
# Выполнить команду, которую выведет pm2
pm2 save
```

### 6. Бэкапы

```bash
./scripts/backup-db.sh
```

Резервные копии сохраняются в `backups/` внутри проекта.

## Логирование

Все логи пишутся в папку `logs/`:

- `access.log` — каждый HTTP-запрос (метод, URL, статус, время, IP, User-Agent).
- `server-errors.log` — ошибки сервера из `errorHandler`.
- `client-errors.log` — ошибки и необработанные исключения с клиентской страницы (`/api/log`).
- `out.log` / `err.log` — stdout/stderr процесса PM2.

Клиентская страница сама отправляет JS-ошибки на `POST /api/log`, поэтому проблемы в браузере видны в `logs/client-errors.log`.

## Тестирование

```bash
# API-тесты
npm test

# Проверка клиентской страницы (headless, jsdom)
npm run test:frontend
```
