# Tótem Biblioteca UAI

Sistema de autoservicio para biblioteca universitaria que permite a estudiantes rentar, devolver y gestionar préstamos de libros mediante lectura de códigos de barras.

## Características

- **Autoservicio completo**: Escaneo de códigos de barras para operaciones de biblioteca
- **Gestión de préstamos**: Rentar, devolver, extender y consultar información de libros
- **Control de acceso**: Roles de STUDENT y ADMIN con permisos diferenciados
- **Interfaz kiosk**: Diseño optimizado para pantalla táctil y uso autónomo
- **Tiempo real**: Seguimiento de timestamps y estados de préstamos

## Arquitectura

```
library-kiosk/
├── backend/          # API REST con Flask + SQLAlchemy
├── frontend/         # React + TypeScript + Vite
├── docker-compose.yml
└── .env.example
```

## Stack Tecnológico

### Backend
- **Python 3.11** + **Flask** + **SQLAlchemy 2.x**
- **MySQL 8.x** con **Alembic** para migraciones
- **JWT** para autenticación
- **Pydantic** para validación de esquemas

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **@zxing/browser** para lectura de códigos por cámara
- Diseño responsive optimizado para kiosks

### DevOps
- **Docker Compose** para orquestación
- **Adminer** para administración de BD
- Logs estructurados en JSON

## Quick Start

### Prerequisitos
- Docker y Docker Compose instalados
- Node.js 18+ (para desarrollo frontend local)
- Python 3.11+ (para desarrollo backend local)

### 1. Clonar y configurar
```bash
git clone <repository-url>
cd library-kiosk

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus configuraciones específicas si es necesario
# Las configuraciones por defecto funcionan para desarrollo local
```

### 2. Inicio rápido con Docker (Recomendado)
```bash
# Levantar todos los servicios con Docker Compose
docker-compose up -d

# Esperar a que los servicios inicien (aproximadamente 30-60 segundos)
# Los logs se pueden ver con:
docker-compose logs -f

# Inicializar la base de datos con datos de ejemplo
docker-compose exec backend poetry run python -m app.db.init_db
```

### 3. Desarrollo local (Alternativo)
```bash
# Levantar solo la base de datos y adminer
docker-compose up -d db adminer

# Backend
cd backend
make install          # Instalar dependencias con Poetry
make upgrade          # Aplicar migraciones
make seed             # Insertar datos de ejemplo
make run              # Ejecutar servidor de desarrollo

# Frontend (en otra terminal)
cd frontend
npm install           # Instalar dependencias
npm run dev           # Ejecutar servidor de desarrollo
```

### 4. Acceder a la aplicación
- **Frontend (Kiosk)**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Adminer (DB Admin)**: http://localhost:8080
- **Health Check**: http://localhost:8000/healthz

### 5. Credenciales de prueba
```
Admin:
Email: admin@uai.edu
Password: admin123

Estudiante:
Email: juan.perez@uai.edu
Password: student123
```

## Flujos de Usuario

### Estudiante (STUDENT)
1. **Escanear código** → Input manual o cámara
2. **Seleccionar acción**:
   - **Rentar**: Cambia estado a 'Prestado', inicia timestamp
   - **Devolver**: Actualiza estado, registra devolución  
   - **Ver info**: Muestra detalles del libro
   - **Extender**: Añade días según reglas de negocio

### Administrador (ADMIN)
- Dashboard con métricas y gestión
- CRUD de libros y usuarios
- Configuración de reglas de préstamo

## Modelo de Datos

### Entidades Principales
- **User**: Estudiantes y administradores
- **Book**: Catálogo de libros con códigos de barras
- **Loan**: Registro de préstamos con timestamps

### Estados de Libro
- `AVAILABLE`: Disponible para préstamo
- `LOANED`: Prestado a un estudiante
- `RESERVED`: Reservado
- `MAINTENANCE`: En mantenimiento

## Desarrollo

### Backend
```bash
cd backend
make install      # Instalar dependencias
make migrate      # Ejecutar migraciones
make test         # Ejecutar tests
make lint         # Linting y formato
make run          # Servidor de desarrollo
```

### Frontend
```bash
cd frontend
npm install       # Instalar dependencias
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción
npm run test      # Ejecutar tests
npm run lint      # Linting
```

## Testing

### Backend
```bash
cd backend
make test
# O específicamente:
pytest tests/test_books.py
pytest tests/test_loans.py
pytest tests/test_auth.py
```

### Frontend
```bash
cd frontend
npm run test
```

## Despliegue

### Producción completa
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Solo servicios core
```bash
docker-compose up -d db backend frontend
```

## Monitoreo

- **Health Check**: `GET /healthz`
- **Logs**: Estructura JSON para agregación
- **Métricas**: Dashboard admin con estadísticas de uso

## Seguridad

- Autenticación JWT con refresh tokens
- Validación de entrada con Pydantic
- CORS configurado para frontend
- Variables sensibles en .env

## API Endpoints

### Autenticación
- `POST /auth/login` - Login de usuario
- `POST /auth/refresh` - Refresh token

### Libros
- `GET /books/scan/{barcode}` - Obtener libro por código
- `GET /books/{book_id}` - Detalle de libro
- `POST /books` - Crear libro (ADMIN)

### Préstamos
- `POST /loans/rent` - Rentar libro
- `POST /loans/return` - Devolver libro
- `POST /loans/extend` - Extender préstamo
- `GET /loans/user/{user_id}` - Préstamos de usuario

