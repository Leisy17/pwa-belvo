# pwa-belvo

Aplicación PWA que conecta con servicios tipo Belvo para administrar instituciones, enlaces de usuarios, cuentas y movimientos financieros.

## Estructura del proyecto

- `frontend/`: Cliente React (Vite) con autenticación, flujo de bancos → usuarios vinculados → cuentas → transacciones.
- `backend/`: API FastAPI con persistencia SQLAlchemy. Expone endpoints para instituciones, links, cuentas, transacciones y autenticación.

## Configuración rápida

1. Clonar el repositorio y entrar al directorio raíz `pwa-belvo/`.
2. Backend:
   - Crear entorno virtual (`python -m venv venv`) e instalar dependencias con `pip install -r backend/requirements.txt`.
   - Configurar variables en `backend/env/.env` usando `backend/env/.env.example` como guía.
   - Ejecutar migraciones (`alembic upgrade head` o scripts SQL en `backend/migrations/sql/`).
   - Levantar el servidor: `uvicorn app.main:app --reload` desde `backend/`.
3. Frontend:
   - `cd frontend/`
   - Instalar dependencias: `npm install`
   - Iniciar entorno de desarrollo: `npm run dev`
   - Variables front: copiar `frontend/env/.env.example` → `frontend/env/.env`.

## Flujo funcional

1. **Bancos (`/banks`)**  
   Tabla con todas las instituciones disponibles mostrando código, nombre, país y si ya existen usuarios vinculados.
2. **Usuarios vinculados (`/banks/:institutionId`)**  
   - Lista los links registrados para la institución.  
   - Permite crear un nuevo link (usa `institution_name` para la conexión a Belvo).  
   - Cada fila permite navegar a las cuentas del link.
3. **Cuentas (`/banks/:institutionId/links/:linkId`)**  
   - Muestra los datos del link seleccionado más la tabla de cuentas.  
   - Opción para registrar cuentas manuales con saldo inicial; se genera un movimiento “Saldo inicial” y se sincroniza el resumen.  
   - Cada cuenta ofrece botón para ver transacciones.
4. **Transacciones (`/banks/:institutionId/accounts/:accountId`)**  
   - Resume ingresos, egresos y balance calculados desde la base local.  
   - Lista los movimientos asociados a la cuenta seleccionada.

## Consideraciones técnicas

- Los saldos iniciales se almacenan en `accounts.balance` y también como transacción tipo `CREDIT` o `DEBIT` para alimentar el resumen.
- El resumen de cuentas (ingresos, egresos, balance) se calcula únicamente con datos locales (`transactions`) sin depender del API de Belvo.
- Los endpoints relevantes:
  - `GET /banks`, `GET /banks/{institution_id}/links`, `POST /banks/{institution_id}/links`
  - `POST /banks/{institution_id}/links/{link_id}/accounts`
  - `GET /banks/{institution_id}/links/{link_id}/accounts`
  - `GET /accounts/{account_id}/summary`, `GET /accounts/{account_id}/transactions`

## Scripts principales

Frontend:
- `npm run dev` – servidor de desarrollo
- `npm run build` – build de producción
- `npm run lint` – ESLint

Backend:
- `uvicorn app.main:app --reload` – servidor FastAPI
- `pytest` (si se añaden pruebas)
- Scripts SQL en `backend/migrations/sql/` para inicializar la base

## Próximos pasos sugeridos

- Añadir pruebas automatizadas (PyTest en backend, React Testing Library en frontend).
- Configurar CI/CD para lint, pruebas y despliegue.
- Implementar gestión de transacciones manuales recientes (altas/bajas) para completar el flujo operativo.
