[НАЗАД К README](../README.md)

# 🛒 Инструкция по развертыванию интернет-магазина (Django + React + Docker)

Данный проект представляет собой монорепозиторий, содержащий бэкенд на **Django REST Framework** и фронтенд на **React (Vite)**. Все компоненты полностью контейнеризированы с помощью Docker.

---

## 1. Локальный запуск (Разработка на компьютере)

В режиме разработки фронтенд запускается через Vite dev-сервер (порт `5173`). Запросы к API (`/api`), админке (`/admin`), статике (`/static`) и медиафайлам (`/media`) автоматически проксируются в контейнер бэкенда (`backend:8000`).

### Шаг 1. Клонирование репозитория
Откройте терминал на компьютере и выполните:
```bash
git clone https://github.com/Aleksandr190/online_shop_project.git
cd online-shop
```

### Шаг 2. Настройка окружения (.env)
Создайте файл **`.env`** в корневой папке проекта и добавьте следующие локальные настройки:
```ini
# Django
SECRET_KEY="local-development-key-123"
DEBUG=True

# Сетевые настройки
ALLOWED_HOSTS=*
CSRF_TRUSTED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# База Данных Postgres
DB_HOST=db
DB_PORT=5432
POSTGRES_DB=придумайте название
POSTGRES_USER=придумайте имя
POSTGRES_PASSWORD=придумайте пароль
```

### Шаг 3. Сборка и запуск Docker-контейнеров
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### Шаг 4. Настройка базы данных и суперпользователя
```bash
# Применение миграций (создание таблиц)
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py migrate

# Создание локального аккаунта администратора
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py createsuperuser
```

* **Сайт (фронтенд) доступен по адресу:** [http://localhost:5173](http://localhost:5173)
* **Панель администратора Django:** [http://localhost:5173/admin/](http://localhost:5173/admin/)

---

## 2. Боевой запуск (Деплой на сервере через SSH)

В продакшен-режиме проект запускается с выключенной отладкой (`DEBUG=False`). Порт Django `8000` закрыт наружу, фронтенд собирается в оптимизированный production-билд, а раздачей всей статики, медиафайлов и проксированием API занимается веб-сервер **Nginx** (порт `80`).

### Шаг 1. Полная очистка старой версии (Если деплоите повторно)
Если на сервере запущена старая конфигурация, остановите её и очистите папки:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
cd ..
rm -rf имя_старой_папки
```

### Шаг 2. Клонирование свежего кода из GitHub
```bash
git clone clone https://github.com/Aleksandr190/online_shop_project.git
cd online-shop
```

### Шаг 3. Создание боевого файла .env
Создайте файл **`.env`** в корне проекта на сервере (`nano .env`) и пропишите безопасные продакшен-настройки:
```ini
# Django
SECRET_KEY="СЛОЖНЫЙ_БОЕВОЙ_КЛЮЧ_ГЕНЕРАТОРА"
DEBUG=False

# Сетевые настройки (Укажите IP вашего сервера и/или домен)
ALLOWED_HOSTS=Укажите IP вашего сервера и/или домен
CSRF_TRUSTED_ORIGINS=Укажите IP вашего сервера и/или домен
CORS_ALLOWED_ORIGINS=Укажите IP вашегего сервера

# База Данных Postgres (Обязательно придумайте новый пароль)
DB_HOST=db
DB_PORT=5432
POSTGRES_DB=придумайте название
POSTGRES_USER=придумайте имя
POSTGRES_PASSWORD=придумайте пароль
```

### Шаг 4. Запуск боевой сборки
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Шаг 5. Первоначальная инициализация бэкенда на сервере
```bash
# 1. Создание таблиц в боевой PostgreSQL
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py migrate

# 2. Создание боевого аккаунта администратора сайта
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# 3. Сбор статики админки в общий Docker Volume для Nginx
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

## 3. Полезные команды для обеих сред

*Заменяйте флаги `-f ...dev.yml` на `-f ...prod.yml` в зависимости от того, где вы выполняете команды (на ПК или сервере).*

* **Просмотр логов контейнера бэкенда в реальном времени:**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.dev.yml logs backend -f
  ```
* **Остановить проект (все данные в базе данных сохранятся):**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.dev.yml down
  ```
* **Полный сброс проекта (очистка всех Docker Volumes, включая базу данных и картинки):**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v