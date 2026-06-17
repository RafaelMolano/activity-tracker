# Activity Tracker — Instrucciones para Claude Code

## Descripción del proyecto
Sistema web interno para que cada miembro del equipo registre sus actividades diarias.
Se despliega en un **servidor local empresarial** usando Docker Compose.

---

## Stack tecnológico

### Backend
- **Python 3.12** + **FastAPI**
- **SQLAlchemy 2.x** (ORM async) + **Alembic** (migraciones)
- **PostgreSQL 16** como base de datos
- **Redis** para blacklist de tokens JWT
- **JWT** (python-jose) + **bcrypt** (passlib) para autenticación
- **Pydantic v2** para validación de datos

### Frontend
- **React 18** + **Vite 5**
- **TailwindCSS 3**
- **shadcn/ui** para componentes
- **React Query (TanStack Query v5)** para estado del servidor
- **React Router v6**
- **React Hook Form** + **Zod** para formularios

### Infraestructura
- **Docker** + **Docker Compose** para orquestación
- **Nginx** como reverse proxy y servidor de archivos estáticos
- `docker-compose.yml` en la raíz del proyecto

---

## Estructura del proyecto

```
activity-tracker/
├── CLAUDE.md                  ← este archivo
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── models/
│       │   ├── user.py
│       │   └── activity.py
│       ├── schemas/
│       │   ├── user.py
│       │   └── activity.py
│       ├── routers/
│       │   ├── auth.py
│       │   ├── activities.py
│       │   └── admin.py
│       ├── services/
│       │   ├── auth_service.py
│       │   └── activity_service.py
│       └── dependencies.py
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/
        │   ├── client.ts
        │   ├── auth.ts
        │   └── activities.ts
        ├── components/
        │   ├── ui/            ← shadcn/ui components
        │   ├── ActivityForm.tsx
        │   ├── ActivityList.tsx
        │   ├── ActivityFilters.tsx
        │   └── Layout.tsx
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   ├── DashboardPage.tsx
        │   └── AdminPage.tsx
        ├── hooks/
        │   └── useActivities.ts
        ├── store/
        │   └── authStore.ts
        └── types/
            └── index.ts
```

---

## Modelo de datos

### Tabla `users`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Generado automáticamente |
| email | VARCHAR (unique) | Email del usuario |
| hashed_password | VARCHAR | bcrypt |
| full_name | VARCHAR | Nombre completo |
| role | ENUM('user', 'admin') | Rol del usuario |
| is_active | BOOLEAN | Estado de la cuenta |
| created_at | TIMESTAMP | Fecha de registro |

### Tabla `activities`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Generado automáticamente |
| user_id | UUID (FK → users) | Dueño de la actividad |
| name | VARCHAR(255) | Nombre o resumen |
| date | DATE | Fecha de la actividad |
| start_time | TIME | Hora de inicio |
| end_time | TIME | Hora de finalización |
| tags | VARCHAR[] | Array de etiquetas |
| created_at | TIMESTAMP | Cuando se registró |
| updated_at | TIMESTAMP | Última modificación |

---

## API REST — Endpoints

### Autenticación (`/api/auth`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/register` | Registro con email y contraseña | No |
| POST | `/login` | Login → devuelve JWT | No |
| POST | `/logout` | Invalida el token en Redis | Sí |
| GET | `/me` | Datos del usuario actual | Sí |

### Actividades (`/api/activities`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Lista actividades del usuario (con filtros) | Sí |
| POST | `/` | Crear actividad | Sí |
| GET | `/{id}` | Ver actividad (solo la propia) | Sí |
| PUT | `/{id}` | Editar actividad (solo la propia) | Sí |
| DELETE | `/{id}` | Eliminar actividad (solo la propia) | Sí |

#### Query params para filtros en `GET /api/activities`
- `date_from` — fecha inicio (YYYY-MM-DD)
- `date_to` — fecha fin (YYYY-MM-DD)
- `search` — búsqueda en el campo `name` (ILIKE)
- `tags` — filtrar por tags (comma-separated)
- `page` / `page_size` — paginación

### Admin (`/api/admin`) — solo role=admin
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/activities` | Todas las actividades de todos los usuarios |
| GET | `/users` | Lista de usuarios |
| GET | `/users/{id}/activities` | Actividades de un usuario específico |
| PATCH | `/users/{id}` | Activar/desactivar usuario |

---

## Reglas de negocio importantes

1. **Aislamiento por usuario**: todo query a `activities` debe incluir `WHERE user_id = current_user.id` salvo que el rol sea `admin`.
2. **Validación de horas**: `end_time` debe ser mayor que `start_time`.
3. **Tags**: almacenar como array PostgreSQL (`ARRAY[]`), normalizar a minúsculas al guardar.
4. **Primer usuario**: considerar crear un seed que genere un usuario admin por defecto (`admin@empresa.com`). Admin2024!
5. **JWT expiry**: access token 30 min, refresh token 7 días.
6. **Contraseñas**: mínimo 8 caracteres, al menos una mayúscula y un número.

---

## Convenciones de código

### Backend (Python)
- Usar `async/await` en todos los endpoints y queries
- Schemas Pydantic separados para `Create`, `Update`, `Response`
- Dependencias de FastAPI para inyectar `current_user` y `db_session`
- Errores HTTP con `HTTPException` y mensajes en español
- Nunca exponer el `hashed_password` en ningún schema de respuesta

### Frontend (TypeScript)
- Todos los archivos en TypeScript estricto (`strict: true` en tsconfig)
- Custom hooks para toda la lógica de datos (`useActivities`, `useAuth`)
- `api/client.ts` centraliza el axios instance con interceptor para JWT
- Manejo de errores centralizado en React Query
- Formularios siempre con React Hook Form + Zod schema
- Rutas protegidas con componente `<ProtectedRoute role="admin">`

---

## Comandos útiles

```bash
# Levantar todo el entorno
docker-compose up -d

# Ver logs del backend
docker-compose logs -f backend

# Correr migraciones
docker-compose exec backend alembic upgrade head

# Crear nueva migración
docker-compose exec backend alembic revision --autogenerate -m "descripcion"

# Acceder a la BD
docker-compose exec db psql -U postgres -d activity_tracker

# Rebuild tras cambios en Dockerfile
docker-compose up -d --build
```

---

## Variables de entorno (`.env`)
Ver `.env.example` para la lista completa. Nunca commitear `.env` real.

---

## Orden de implementación sugerido

1. `docker-compose.yml` + Dockerfiles
2. Modelos SQLAlchemy + primera migración Alembic
3. Auth endpoints (register, login, me)
4. CRUD de actividades con filtros
5. Endpoints de admin
6. Frontend: estructura base + routing
7. Frontend: auth (login, registro)
8. Frontend: dashboard de actividades (lista + filtros + form)
9. Frontend: panel de administrador
10. Ajustes finales, seed de datos y documentación
