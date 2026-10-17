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
      - main  # Замените на master, если ваша главная ветка называется так

jobs:
  # -------------------------------------------------------------------------
  # ЭТАП 1: CI (Continuous Integration) - Тестирование на серверах GitHub
  # -------------------------------------------------------------------------
  run-tests:
    runs-on: ubuntu-24.04

    steps:
      # Скачиваем код репозитория на виртуальный раннер GitHub для тестов
      - name: Checkout code
        uses: actions/checkout@v4.2.2

      # Поднимаем Python нужной версии
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11.4'

      # Устанавливаем зависимости бэкенда (включая Django и Gunicorn)
      - name: Install dependencies
        run: |
          cd backend_project
          python -m pip install --upgrade pip
          pip install flake8
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

      # Этап статического анализа кода бэкенда на ошибки и стиль PEP 8
      # --count: выведет количество ошибок
      # --select=E9,F63,F7,F82: найдет критические синтаксические ошибки (логика упадет)
      # --show-source: покажет строку с ошибкой в логах GitHub
      # Нарушения стиля оформления кода (длина строк, пробелы) — не роняют пайплайн, но выводят статистику
      - name: Lint Python code with flake8
        run: |
          cd backend_project
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
          flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127

      # Создаем временный .env файл из шаблона для успешного запуска тестов Django
      - name: Create env file for tests
        run: |
          cp .env.example .env
          echo "SECRET_KEY=test_secret_key_for_ci_cd" >> .env
          echo "DEBUG=True" >> .env

      # Запускаем тесты (благодаря коду в settings.py они пройдут на SQLite в памяти)
      - name: Run Django Tests
        run: |
          cd backend_project
          python manage.py test

  # -------------------------------------------------------------------------
  # ЭТАП 2: CD (Continuous Deployment) - Автоматический деплой на ваш VPS
  # -------------------------------------------------------------------------
  deploy:
    runs-on: ubuntu-24.04
    needs: run-tests # Деплой запустится только в том случае, если тесты прошли успешно

    steps:
      # Скачиваем код на раннер перед подключением к SSH
      - name: Checkout code
        uses: actions/checkout@v4.2.2

      # Подключаемся к вашему серверу по SSH и обновляем проект
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
            # 1. Переходим в папку проекта на сервере
            cd /root/online_shop_project
            
            # 2. Сбрасываем кэш Git на сервере и принудительно подтягиваем чистый код из GitHub
            git fetch origin main
            git reset --hard origin main
            
            # 3. Безопасно перезаписываем файл .env
            echo "$PROD_ENV_DATA" > .env

            # 4. Удаляем старые контейнеры, очищая оперативную память веб-сервера
            docker compose -f docker-compose.yml -f docker-compose.prod.yml down

            # 5. Собираем новые образы и запускаем новые контейнеры с нуля (гарантирует обновление стилей)
            docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   
            # 6. Накатываем новые миграции БД на проде (без интерактива)
            docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend python manage.py migrate --no-input
            
            # 7. Заново собираем чистую статику Django для веб-сервера во фронтенде
            docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --no-input
            
            # 8. Очищаем старые кэшированные Docker-образы, освобождая диск сервера
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
