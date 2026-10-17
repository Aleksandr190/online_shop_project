# Используем официальный легковесный образ Python 3.11 на базе Debian
FROM python:3.11-slim
# Устанавливаем рабочую директорию внутри контейнера бэкенда
WORKDIR /app
# Запрещаем Python записывать файлы кэша .pyc на диск внутри контейнера
ENV PYTHONDONTWRITEBYTECODE 1
# Отключаем буферизацию потоков вывода для мгновенного отображения логов Django
ENV PYTHONUNBUFFERED 1
# Системные зависимости для сборки psycopg2 (драйвера Postgres) и после очищаем кэш пакетного менеджера для уменьшения размера образа
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* 
# Сначала копируем зависимости (для кэширования слоев Docker)
COPY requirements.txt /app/
# Обновляем менеджер пакетов pip и устанавливаем все зависимости бэкенда без сохранения кэша
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt
# Копируем весь остальной код
COPY . /app/
# Информируем Docker, что веб-сервер внутри контейнера использует порт 8000
EXPOSE 8000
# Запускаем миграции и сервер
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]