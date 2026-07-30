# Правила работы над проектом

## Обязательный бэкап перед каждым изменением

Перед **любым** изменением файлов проекта необходимо создать полный бэкап текущего состояния. Это золотое правило для данного проекта и всех последующих.

### Как делать бэкап

1. Перед каждой правкой выполняй полный архив проекта:

   ```bash
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   tar -czf "/home/pasha/cook-and-fry/backups/cook-and-fry-full-${TIMESTAMP}.tar.gz" \
     --exclude='node_modules' \
     --exclude='backups' \
     --exclude='logs' \
     -C /home/pasha cook-and-fry
   ```

2. Архив сохраняй в `cook-and-fry/backups/`.

3. **Обязательно** делай бэкап базы данных отдельно — это нужно, чтобы восстановить проект даже при полной утере:

   ```bash
   ./scripts/backup-db.sh
   ```

### Хранение бэкапов

- Полные бэкапы и бэкапы БД храни в `cook-and-fry/backups/`.
- По умолчанию оставляй последние 30 полных бэкапов и 30 бэкапов БД.
- Если диск ограничен — согласовывай количество с владельцем проекта.

### Откат изменений

Если правка пошла не так, восстановись из последнего полного бэкапа:

```bash
cd /home/pasha
tar -xzf /home/pasha/cook-and-fry/backups/cook-and-fry-full-YYYYMMDD_HHMMSS.tar.gz
```

### Восстановление при полной утере проекта

1. Распакуй полный архив:

   ```bash
   cd /home/pasha
tar -xzf /home/pasha/cook-and-fry/backups/cook-and-fry-full-YYYYMMDD_HHMMSS.tar.gz
   ```

2. Восстанови базу данных из последнего бэкапа:

   ```bash
   cd /home/pasha/cook-and-fry
   mkdir -p data
   gunzip -c backups/orders-YYYYMMDD_HHMMSS.db.gz > data/orders.db
   ```

3. Установи зависимости и запусти проект:

   ```bash
   npm install
   npm test
   npm start
   ```

## Другие правила

- Делай минимальные изменения, решающие конкретную задачу.
- После изменений запускай тесты: `npm test` и `npm run test:frontend`.
- Не добавляй новые зависимости без согласования.
