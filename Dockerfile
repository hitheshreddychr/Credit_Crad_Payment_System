FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN cp /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf /app/fonts/DejaVuSans.ttf && \
    cp /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf /app/fonts/DejaVuSans-Bold.ttf

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]