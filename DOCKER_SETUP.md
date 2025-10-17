# Configuración de Docker para Biblioteca Totem

## Resumen del Sistema

El proyecto "Biblioteca Totem" está completamente containerizado usando Docker y Docker Compose, con una arquitectura de microservicios que incluye:

- **Frontend**: React + TypeScript + Vite servido por Nginx
- **Backend**: Flask (Python) con Poetry para gestión de dependencias
- **Base de Datos**: MySQL 8.0
- **Administrador DB**: Adminer para gestión visual de la base de datos

## Arquitectura Docker

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                  (library_network)                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │   Backend    │  │   Adminer    │  │
│  │   (Nginx)    │  │   (Flask)    │  │   (DB GUI)   │  │
│  │  Port 5173   │  │  Port 8000   │  │  Port 8080   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
│                    ┌───────▼────────┐                    │
│                    │   MySQL 8.0    │                    │
│                    │   Port 3307    │                    │
│                    │ (host:3307->   │                    │
│                    │  container:    │                    │
│                    │     3306)      │                    │
│                    └────────────────┘                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Problemas Encontrados y Soluciones

### 1. **Error: Backend no podía importar módulos de Flask**

**Problema**: El contenedor del backend entraba en un loop infinito de reinicios con error:
```
ModuleNotFoundError: No module named 'flask'
```

**Causa**: Poetry estaba instalando los paquetes en un virtualenv dentro del contenedor, pero el comando `CMD ["python", "-m", "app.main"]` ejecutaba Python del sistema, que no tenía acceso al virtualenv.

**Solución**:
```dockerfile
# En backend/Dockerfile
ENV POETRY_VIRTUALENVS_CREATE=false
```

Esto hace que Poetry instale todos los paquetes directamente en el Python del sistema del contenedor, haciéndolos accesibles globalmente.

**Archivo modificado**: `backend/Dockerfile:7`

---

### 2. **Error: SQLAlchemy - Relaciones ambiguas**

**Problema**:
```
AmbiguousForeignKeysError: Could not determine join condition between parent/child tables on relationship User.loans
```

**Causa**: La tabla `loans` tiene múltiples foreign keys hacia `users` (user_id, created_by, returned_by), y SQLAlchemy no sabía cuál usar para la relación principal.

**Solución**:
```python
# En backend/app/models/user.py
loans: Mapped[List["Loan"]] = relationship(
    "Loan",
    back_populates="user",
    foreign_keys="Loan.user_id",  # Especificar cuál FK usar
    lazy="dynamic"
)
```

**Archivo modificado**: `backend/app/models/user.py:35-40`

---

### 3. **Error: SQLAlchemy 2.x - SELECT sin text()**

**Problema**:
```
Textual SQL expression 'SELECT 1' should be explicitly declared as text('SELECT 1')
```

**Causa**: SQLAlchemy 2.x requiere que las consultas SQL raw se envuelvan en la función `text()` por seguridad.

**Solución**:
```python
# En backend/app/main.py
from sqlalchemy import text

# En el health check
db.session.execute(text("SELECT 1"))
```

**Archivos modificados**:
- `backend/app/main.py:8` (import)
- `backend/app/main.py:47` (uso)

---

### 4. **Error: Puerto MySQL en uso (3306)**

**Problema**:
```
Ports are not available: listen tcp 0.0.0.0:3306: bind: Only one usage of each socket address is normally permitted
```

**Causa**: MySQL local ya estaba usando el puerto 3306.

**Solución**: Cambiar el mapeo de puertos en docker-compose.yml:
```yaml
db:
  ports:
    - "3307:3306"  # Host usa 3307, contenedor usa 3306
```

**Archivo modificado**: `docker-compose.yml:15`

---

### 5. **Error: Frontend - Nginx sin permisos**

**Problema**:
```
nginx: [emerg] open() "/run/nginx.pid" failed (13: Permission denied)
```

**Causa**: El contenedor frontend ejecuta Nginx como usuario no-root (nextjs), pero no tenía permisos para escribir el archivo PID.

**Solución**:
```dockerfile
# En frontend/Dockerfile
RUN chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d && \
    touch /run/nginx.pid && \
    chown -R nextjs:nodejs /run/nginx.pid
```

**Archivo modificado**: `frontend/Dockerfile:39-44`

---

### 6. **Error: TypeScript - Imports de React no usados**

**Problema**:
```
error TS6133: 'React' is declared but its value is never read.
```

**Causa**: React 17+ con el nuevo JSX transform no requiere importar React explícitamente.

**Solución**: Eliminamos `import React from 'react'` de todos los componentes que no lo necesitaban, dejando solo los hooks específicos como `useState`, `useEffect`.

**Archivos modificados**: 7 archivos en `frontend/src/`

---

### 7. **Error: TailwindCSS - Clases inválidas**

**Problema**:
```
[postcss] The `border-border` class does not exist
```

**Causa**: Usábamos clases personalizadas de TailwindCSS que no estaban definidas.

**Solución**: Reemplazamos con clases estándar de Tailwind:
```css
/* Antes */
@apply border-border bg-background text-foreground;

/* Después */
@apply bg-gray-50 text-gray-900;
```

**Archivo modificado**: `frontend/src/styles/globals.css:6-9`

---

## Estructura de los Dockerfiles

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

# Variables de entorno críticas
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false  # ← CLAVE para evitar problemas de imports

# Instalar dependencias del sistema para MySQL
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar Poetry
RUN pip install poetry

WORKDIR /app

# Copiar archivos de Poetry y instalar dependencias
COPY pyproject.toml poetry.lock* ./
RUN poetry install --only=main --no-root

# Copiar código y instalar la app
COPY . .
RUN poetry install --only-root

# Usuario no-root para seguridad
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Health check usando curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/healthz || exit 1

# Ejecutar directamente con Python (no con poetry run)
CMD ["python", "-m", "app.main"]
```

### Frontend Dockerfile

```dockerfile
# Etapa 1: Build
FROM node:18-alpine as build

ARG VITE_API_BASE_URL=http://localhost:8000
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Etapa 2: Producción
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Permisos para Nginx running como no-root
RUN chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d && \
    touch /run/nginx.pid && \
    chown -R nextjs:nodejs /run/nginx.pid

USER nextjs

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

## Docker Compose

### Características Principales

```yaml
version: '3.8'

services:
  # Base de datos
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-library_kiosk}
      MYSQL_USER: ${MYSQL_USER:-library_user}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-library_password}
    ports:
      - "3307:3306"  # Puerto cambiado para evitar conflictos
    volumes:
      - mysql_data:/var/lib/mysql  # Persistencia de datos
      - ./backend/scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
    networks:
      - library_network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=mysql+pymysql://${MYSQL_USER}:${MYSQL_PASSWORD}@db:3306/${MYSQL_DATABASE}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY:-your-super-secret-jwt-key}
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy  # Espera a que DB esté saludable
    volumes:
      - ./backend:/app  # Hot reload en desarrollo
      - backend_logs:/app/logs
    networks:
      - library_network

  # Frontend React
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_BASE_URL=${VITE_API_BASE_URL:-http://localhost:8000}
    ports:
      - "5173:80"
    depends_on:
      - backend
    networks:
      - library_network

  # Adminer para gestión DB
  adminer:
    image: adminer:4.8.1
    ports:
      - "8080:8080"
    depends_on:
      - db
    networks:
      - library_network

volumes:
  mysql_data:  # Volumen persistente para MySQL
    driver: local
  backend_logs:
    driver: local

networks:
  library_network:  # Red privada para los contenedores
    driver: bridge
```

## Comandos Útiles

### Construcción y Inicio

```bash
# Construir todos los contenedores
docker-compose build

# Construir solo un servicio específico
docker-compose build backend
docker-compose build frontend

# Iniciar todos los servicios
docker-compose up -d

# Iniciar solo algunos servicios
docker-compose up -d db backend

# Ver logs en tiempo real
docker-compose logs -f backend

# Ver estado de los contenedores
docker-compose ps
```

### Gestión de Base de Datos

```bash
# Inicializar la base de datos con datos de prueba
docker-compose exec backend python -m app.db.init_db

# Acceder a MySQL directamente
docker-compose exec db mysql -u library_user -p library_kiosk

# Hacer backup de la base de datos
docker-compose exec db mysqldump -u library_user -p library_kiosk > backup.sql

# Restaurar backup
docker-compose exec -T db mysql -u library_user -p library_kiosk < backup.sql
```

### Debugging

```bash
# Entrar al contenedor backend
docker-compose exec backend /bin/sh

# Entrar al contenedor de base de datos
docker-compose exec db /bin/bash

# Ver logs de un servicio específico (últimas 50 líneas)
docker-compose logs backend --tail 50

# Reiniciar un servicio
docker-compose restart backend

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Borra los datos)
docker-compose down -v
```

### Limpieza

```bash
# Eliminar contenedores detenidos
docker-compose down

# Eliminar contenedores e imágenes
docker-compose down --rmi all

# Eliminar todo incluyendo volúmenes
docker-compose down -v --rmi all

# Limpiar cache de Docker
docker system prune -a
```

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto para personalizar la configuración:

```env
# Base de datos
MYSQL_ROOT_PASSWORD=tu_password_seguro
MYSQL_DATABASE=library_kiosk
MYSQL_USER=library_user
MYSQL_PASSWORD=tu_password_seguro

# Backend
JWT_SECRET_KEY=tu-clave-jwt-super-secreta-cambiala
SECRET_KEY=tu-flask-secret-key
FLASK_ENV=development

# Frontend
VITE_API_BASE_URL=http://localhost:8000

# Puertos (opcionales)
BACKEND_PORT=8000
FRONTEND_PORT=5173
ADMINER_PORT=8080
```

## Flujo de Inicio del Sistema

1. **Docker Compose lee `docker-compose.yml`**
2. **Inicia la red `library_network`**
3. **Crea volúmenes para datos persistentes**
4. **Inicia MySQL** (db)
   - Espera health check (mysqladmin ping)
   - Ejecuta `init.sql` si es la primera vez
5. **Inicia Backend** (solo cuando db está healthy)
   - Poetry instala dependencias
   - Flask inicia en modo debug
   - Healthcheck en `/healthz`
6. **Inicia Frontend** (después del backend)
   - npm build crea archivos estáticos
   - Nginx sirve la aplicación
7. **Inicia Adminer** (después de db)
   - Interfaz web para gestión de BD

## Health Checks

Todos los servicios implementan health checks para asegurar que estén funcionando:

### Backend
```bash
curl -f http://localhost:8000/healthz
# Respuesta: {"status": "healthy", "timestamp": "...", "version": "1.0.0"}
```

### Frontend
```bash
curl -f http://localhost:5173/health
# Respuesta: healthy
```

### Database
```bash
docker-compose exec db mysqladmin ping -h localhost
# Respuesta: mysqld is alive
```

## Mejores Prácticas Implementadas

1. **Multi-stage builds** (Frontend): Reduce el tamaño de la imagen final
2. **Health checks**: Monitoreo automático del estado de los servicios
3. **Usuarios no-root**: Mayor seguridad en contenedores
4. **Volúmenes nombrados**: Persistencia de datos
5. **Redes personalizadas**: Aislamiento y comunicación segura
6. **Variables de entorno**: Configuración flexible
7. **Dependencias explícitas**: Control del orden de inicio
8. **Logs estructurados**: Facilita el debugging

## Solución de Problemas Comunes

### Backend no se conecta a la base de datos

```bash
# Verificar que MySQL esté corriendo
docker-compose ps db

# Ver logs de MySQL
docker-compose logs db --tail 50

# Verificar variables de entorno del backend
docker-compose exec backend env | grep DATABASE
```

### Frontend no puede conectarse al backend

```bash
# Verificar que el backend esté corriendo
docker-compose ps backend

# Verificar la variable VITE_API_BASE_URL
docker-compose logs frontend | grep VITE

# Revisar la configuración de CORS en el backend
docker-compose exec backend cat app/config.py | grep ALLOWED_ORIGINS
```

### Contenedor se reinicia constantemente

```bash
# Ver los logs para identificar el error
docker-compose logs [servicio] --tail 100

# Entrar al contenedor para debugging
docker-compose exec [servicio] /bin/sh
```

## Conclusión

Esta configuración de Docker proporciona:

- **Aislamiento**: Cada servicio en su propio contenedor
- **Portabilidad**: Funciona en cualquier sistema con Docker
- **Reproducibilidad**: Mismo entorno en desarrollo y producción
- **Escalabilidad**: Fácil de escalar horizontalmente
- **Mantenibilidad**: Configuración declarativa y versionada

Todos los problemas encontrados durante la implementación se documentaron y solucionaron, resultando en un sistema robusto y fácil de mantener.
