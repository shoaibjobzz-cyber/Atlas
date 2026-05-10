FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app
COPY run_migrations.py ./run_migrations.py
COPY start.sh ./start.sh

RUN chmod +x ./start.sh

EXPOSE 8000

CMD ["./start.sh"]
