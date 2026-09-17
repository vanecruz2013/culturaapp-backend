# Cultura App — Backend

API REST para la red social de descubrimiento cultural.

## Stack

- **Node.js** + **Express**
- **PostgreSQL** — base de datos principal
- **Redis** — caché de búsquedas y sesiones
- **Prisma ORM** — migraciones y queries
- **JWT** — autenticación

## Requisitos

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

## Instalación

```bash
npm install
cp .env.example .env
# Edita .env con tus credenciales de base de datos
npx prisma migrate dev
npm run dev
```

## Variables de entorno

```env
DATABASE_URL=postgresql://user:password@localhost:5432/culturaapp
REDIS_URL=redis://localhost:6379
JWT_SECRET=tu_secreto_aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
TMDB_API_KEY=tu_clave_tmdb
GOOGLE_BOOKS_API_KEY=tu_clave_google_books
PORT=3000
```

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/register` | Registro de usuario |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Renovar token |
| GET | `/users/:username` | Perfil de usuario |
| GET | `/content/search` | Búsqueda de contenido |
| POST | `/user-content` | Añadir contenido al perfil |
| POST | `/recommendations` | Enviar recomendación |
| GET | `/notifications` | Notificaciones del usuario |

## Estructura

```
src/
├── routes/          # Endpoints
├── controllers/     # Lógica de negocio
├── middleware/      # Auth, validación, errores
├── services/        # Integraciones APIs externas
└── utils/           # Helpers
prisma/
└── schema.prisma    # Esquema de base de datos
```

## Repositorios del proyecto

- **App móvil:** [culturaapp-mobile](https://github.com/vanecruz2013/culturaapp-mobile)
