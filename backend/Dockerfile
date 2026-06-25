FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libmagic-dev \
    poppler-utils \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Install uv first
RUN pip install uv

# Install PyTorch CPU-only with uv
RUN uv pip install --system --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install other requirements with uv
RUN uv pip install --system --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
