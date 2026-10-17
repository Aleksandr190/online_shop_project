[НАЗАД К README](../README.md)

# Инструкция по настройке CI/CD через GitHub Actions

Данный документ описывает процесс настройки автоматического деплоя (CD) Django-приложения, запущенного на сервере Gunicorn внутри Docker Compose, на удаленный VPS/VDS сервер при каждом пуше в ветку `main`.

## Шаг 1. Конвертация приватного SSH-ключа (.ppk в OpenSSH)

GitHub Actions не поддерживает формат ключей PuTTY (`.ppk`). Ключ необходимо перевести в стандартный формат OpenSSH:

1. Откройте программу **PuTTYgen** на вашем компьютере.
2. Перейдите в верхнее меню: `File` -> `Load private key` и выберите ваш файл `private_key.ppk`.
3. Введите пароль (passphrase) от ключа, если он установлен.
4. В верхнем меню выберите: `Conversions` -> `Export OpenSSH key` (не выбирайте force new format, используйте стандартный).
5. Сохраните новый файл на компьютер под именем `id_rsa` (без расширения).
6. Откройте созданный файл `id_rsa` через любой текстовый редактор и скопируйте весь текст целиком, включая стартовую строку `-----BEGIN OPENSSH PRIVATE KEY-----` и финальную `-----END OPENSSH PRIVATE KEY-----`.

## Шаг 2. Добавление секретов (Secrets) в репозиторий GitHub

Для безопасного подключения к вашему серверу необходимо добавить переменные окружения в репозиторий GitHub, чтобы они не хранились в открытом коде.

Зайдите в ваш репозиторий на сайте GitHub, затем перейдите по пути:
`Settings` -> `Secrets and variables` -> `Actions` -> Нажмите кнопку `New repository secret`.

Добавьте по очереди следующие 5 секретов:

* **HOST**: IP-адрес вашего продакшен-сервера (например, `195.2.11.23`).
* **USERNAME**: Имя пользователя для подключения по SSH (например, `root` или `ubuntu`).
* **SSH_KEY**: Весь скопированный текст ключа OpenSSH из Шага 1.
* **SSH_PASSPHRASE**: Пароль (passphrase), которым зашифрован ваш приватный SSH-ключ.
* **ENV_FILE**: Полное содержимое вашего продакшен-файла `.env` (переменные для базы данных, Django `SECRET_KEY`, `ALLOWED_HOSTS` и т.д.).

## Шаг 3. Создание конфигурации воркфлоу локально

1. В корне вашего проекта на компьютере (локально) создайте структуру папок: `.github/workflows/`.
2. Внутри папки `workflows` создайте файл с именем `deploy.yml`.
3. Вставьте в файл `deploy.yml` следующий YAML-код (обратите внимание на строгое соблюдение отступов):

```yaml
name: Production Deployment

on:
  push:
    branches:
      - main  # Скрипт сработает автоматически при пуше в ветку main

jobs:
  deploy:
    runs-on: ubuntu-24.04

    steps:
      # Шаг 1: Скачиваем свежий код репозитория на виртуальный раннер GitHub
      - name: Checkout code
        uses: actions/checkout@v4.2.2

      # Шаг 2: Автоматически подключаемся по SSH и обновляем проект на сервере
      - name: Deploy to Server via SSH
        uses: appleboy/ssh-action@v1.0.3
        env:
          PROD_ENV_DATA: ${{ secrets.ENV_FILE }}
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          passphrase: ${{ secrets.SSH_PASSPHRASE }}
          envs: PROD_ENV_DATA
          script: |
            # 1. Переходим в папку проекта на сервере (замените путь на ваш актуальный результат команды 'pwd')
            cd /root/online_shop_project
            
            # 2. Скачиваем последние изменения из репозитория
            git pull origin main
            
            # 3. Безопасно перезаписываем .env файл, экранируя спецсимволы через переменную окружения
            echo "$PROD_ENV_DATA" > .env
            
            # 4. Пересобираем и запускаем контейнеры в прод-режиме (Django на Gunicorn)
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
            
            # 5. Применяем миграции базы данных (-T отключает интерактивный терминал, предотвращая ошибку TTY)
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend python manage.py migrate --no-input
            
            # 6. Собираем статические файлы Django в общий вольюм для фронтенда
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --no-input
            
            # 7. Очищаем неиспользуемые старые Docker-образы для экономии диска сервера
            docker image prune -f
```

## Шаг 4. Изменение setting.py

Скопируйте следующий код в \backend_project\core\settings.py. Когда GitHub Actions запускает тесты, ему не нужно поднимать тяжелую базу данных PostgreSQL. Для этого используется легковесная sqlite3.
```python
# Если Django запущен в режиме тестирования (вызвана команда 'test')
if 'test' in sys.argv:
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',  # База данных будет создана прямо в оперативной памяти раннера
    }

```

## Шаг 4. Пуш изменений и автоматический запуск

После сохранения файла локально выполните стандартные команды в терминале вашего компьютера, чтобы отправить конфигурацию воркфлоу на GitHub:

```bash
git add .github/workflows/deploy.yml
git commit -m "cd: setup github actions automation for prod deployment"
git push origin main
```

## Шаг 5. Проверка статуса деплоя

1. Перейдите на сайт GitHub в ваш репозиторий.
2. Откройте вкладку **Actions**.
3. Выберите запущенный воркфлоу с названием **"Production Deployment"**.
4. Нажмите на задачу `deploy` внутри воркфлоу, чтобы отслеживать логи выполнения каждой команды на сервере в режиме реального времени. Зеленый маркер будет означать успешное завершение деплоя.
