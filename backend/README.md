# Belvo PWA Backend

Backend para la prueba técnica usando FastAPI, PostgreSQL y la API de Belvo.

## Requisitos previos

- Python 3.12+
- PostgreSQL 13+
- Credenciales activas del sandbox de Belvo (secret id, secret password y link ids)

## Preparar entorno virtual

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows usar: venv\\Scripts\\activate
pip install --upgrade pip
pip install -r requirements.txt
```

## Configurar variables de entorno

Copia el archivo de ejemplo y ajusta los valores:

```bash
cp env/.env.example env/.env
```

Completa:

- `DATABASE_URL` con la cadena de conexión de PostgreSQL.
- `SECRET_KEY` con una cadena segura.
- Credenciales de Belvo (`BELVO_SECRET_ID`, `BELVO_SECRET_PASSWORD`) y los `BELVO_LINK_IDS` que usarás para consultar cuentas.

## Aplicar migraciones

Ejecuta el script SQL usando `psql` (ajusta la ruta del archivo si es necesario):

```bash
psql "$DATABASE_URL" -f migrations/sql/001_initial_schema.sql
```

## Ejecutar la API

```bash
uvicorn app.main:app --reload
```

La API quedará disponible en `http://localhost:8000`. Los endpoints expuestos siguen el prefijo `/api` para alinear con el frontend.

## Endpoints principales

- `POST /api/auth/register`: Registro de usuarios (correo y contraseña).
- `POST /api/auth/login`: Inicio de sesión, devuelve token JWT.
- `GET /api/banks`: Listado de instituciones desde Belvo (con cache en BD si falla la consulta).
- `GET /api/banks/{institution_id}/accounts`: Lista de cuentas asociadas a la institución.
- `GET /api/banks/{institution_id}/accounts/{account_id}`: Movimientos de la cuenta.
- `GET /api/accounts/{account_id}/summary`: KPI de ingresos, egresos y balance.

Todos los endpoints de bancos requieren token Bearer en la cabecera `Authorization`.

## Notas sobre la integración con Belvo

- El servicio `BelvoService` usa `requests` y Basic Auth contra la API REST de Belvo.
- Los `BELVO_LINK_IDS` se usan para consultar las cuentas disponibles.
- En caso de error de red o credenciales, los datos se sirven desde la caché local en PostgreSQL si existe.

## Estructura

```
backend/
├── app/
│   ├── core/            # Configuración y seguridad
│   ├── controllers/     # Rutas FastAPI (controllers)
│   ├── database/        # Sesión de SQLAlchemy
│   ├── models/          # Modelos ORM
│   ├── repositories/    # Acceso a datos
│   ├── schemas/         # Modelos Pydantic
│   └── services/        # Lógica de negocio (Belvo, bancos, auth)
├── env/.env.example
├── migrations/sql/001_initial_schema.sql
└── requirements.txt
```

## Pruebas rápidas con HTTPie o curl

```bash
http POST :8000/api/auth/register email=user@example.com password=Secret123
http POST :8000/api/auth/login email=user@example.com password=Secret123
http GET :8000/api/banks "Authorization:Bearer <token>"
```

Asegúrate de tener datos en Belvo vinculados a los `link_ids` configurados.
