#!/bin/bash
set -e  # Detiene la ejecución si ocurre un error

echo "🚀 Iniciando despliegue del backend FastAPI en Railway..."

# Ir a la carpeta del backend
cd backend

# Instalar dependencias
echo "📦 Instalando dependencias..."
pip install --no-cache-dir -r requirements.txt

# Lanzar el servidor FastAPI
echo "🌐 Iniciando servidor en el puerto $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
