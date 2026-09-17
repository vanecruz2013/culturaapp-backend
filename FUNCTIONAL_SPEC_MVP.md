# Documento Funcional — MVP
## Cultura App · Red Social de Descubrimiento Cultural

**Versión:** 1.0 — MVP  
**Fecha:** Septiembre 2026  
**Plataformas:** iOS · Android (React Native)

---

## 1. VISIÓN DEL PRODUCTO

Cultura App es una red social para registrar, puntuar y compartir películas, libros y música. Su elemento diferencial es hacer visible quién recomendó cada contenido y qué impacto tuvo esa recomendación, convirtiendo el consumo cultural en una experiencia de descubrimiento, conexión y reconocimiento.

**Ciclo principal de experiencia:**  
`Descubrir → Recomendar → Consumir → Puntuar → Compartir → Reconocer → Conectar`

---

## 2. ALCANCE DEL MVP (Fase 1)

El MVP cubre las funcionalidades esenciales para validar la propuesta de valor:

| Área | Incluido en MVP |
|------|----------------|
| Autenticación | ✅ Registro / Login |
| Perfil de usuario | ✅ Básico |
| Películas | ✅ Completo |
| Libros | ✅ Completo |
| Series | ✅ Básico |
| Música | ✅ Básico |
| Recomendaciones entre usuarios | ✅ Completo |
| Feed social | ❌ Fase 2 |
| Sistema de afinidad | ❌ Fase 3 |
| Agente virtual IA | ❌ Fase 4 |

---

## 3. ARQUITECTURA GENERAL

```
┌─────────────────────────────────────┐
│          Apps Móviles               │
│      iOS + Android (React Native)   │
└────────────────┬────────────────────┘
                 │ REST API / GraphQL
┌────────────────▼────────────────────┐
│           Backend API               │
│         Node.js + Express           │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│            Base de datos            │
│          PostgreSQL + Redis         │
└─────────────────────────────────────┘
         │               │
  APIs externas:   Almacenamiento:
  - TMDB (cine)    - S3 (imágenes)
  - Google Books
  - MusicBrainz
```

**Repositorios:**
- `culturaapp-mobile` — App React Native (iOS + Android)
- `culturaapp-backend` — API Node.js

---

## 4. MÓDULOS FUNCIONALES DEL MVP

---

### 4.1 AUTENTICACIÓN

#### Registro
**Datos requeridos:**
- Nombre de usuario (único, 3–30 caracteres, sin espacios)
- Email (único, válido)
- Contraseña (mínimo 8 caracteres)
- Nombre visible (puede editarse)

**Flujo:**
1. Usuario introduce datos en el formulario de registro.
2. El sistema valida unicidad de usuario y email.
3. Se envía email de verificación.
4. Usuario confirma email y accede a la app.

#### Login
- Login con email + contraseña.
- Opción "Recordarme" (token persistente 30 días).
- Recuperación de contraseña por email.

#### Sesión
- JWT con refresh token.
- Logout manual disponible.

---

### 4.2 PERFIL DE USUARIO

#### Vista del perfil propio
El perfil muestra la identidad cultural del usuario.

**Elementos:**
- Foto de perfil (opcional, con imagen por defecto)
- Nombre visible
- Nombre de usuario (`@usuario`)
- Biografía (máx. 150 caracteres, opcional)
- Fecha de registro
- Contadores: películas vistas / libros leídos / series seguidas
- Sección de favoritos (1 película · 1 libro · 1 canción)
- Actividad reciente (últimas 5 acciones)
- Historial por categoría (pestañas: Películas · Libros · Series · Música)

#### Vista del perfil de otro usuario
Igual que el propio, pero sin opciones de edición.  
Incluye botón "Recomendar algo" (accede al flujo de recomendación).

#### Edición del perfil
- Cambio de foto
- Edición de nombre visible
- Edición de biografía
- Selección de favoritos destacados

---

### 4.3 PELÍCULAS

#### Estados disponibles
| Estado | Descripción |
|--------|-------------|
| Vista | El usuario ya la ha visto |
| Quiero verla | Lista privada de películas pendientes |
| Favorita | Marcada como favorita (puede ser vista o no) |

#### Acciones sobre una película
- Añadir a "Vista"
- Registrar fecha en que la vio (opcional, por defecto la fecha actual)
- Puntuar (1–5 estrellas), disponible solo si está en "Vista"
- Escribir reseña (máx. 500 caracteres), disponible solo si está en "Vista"
- Marcar como favorita
- Añadir a "Quiero verla"
- Recomendar a un usuario
- Registrar origen de la recomendación (si fue recomendada, queda guardado)

#### Búsqueda de películas
- Búsqueda por título (integración con API de TMDB)
- Resultados muestran: portada, título, año, puntuación TMDB
- Detalle de película: sinopsis, director, género, reparto principal, año

#### Historial de películas vistas
- Lista ordenada por fecha (más reciente primero)
- Filtro por puntuación
- Filtro por año
- Filtro por género

---

### 4.4 LIBROS

#### Estados disponibles
| Estado | Descripción |
|--------|-------------|
| Leído | El usuario lo ha terminado |
| Leyendo | En progreso actualmente |
| Quiero leerlo | Lista privada de pendientes |
| Favorito | Marcado como favorito |

#### Progreso de lectura
El usuario puede actualizar su progreso mientras lo está leyendo:
- Por porcentaje (0–100%)
- Por página actual (si se conocen el total de páginas)

Visualización:
```
Harry Potter y la piedra filosofal
████████░░ 80%
```

#### Acciones sobre un libro
- Cambiar estado
- Registrar fecha de inicio y fecha de finalización
- Actualizar progreso (si está en "Leyendo")
- Puntuar (1–5 estrellas), disponible solo si está en "Leído"
- Escribir reseña (máx. 500 caracteres)
- Marcar como favorito
- Recomendar a un usuario
- Ver quién se lo recomendó

#### Búsqueda de libros
- Búsqueda por título o autor (integración con Google Books API)
- Resultados muestran: portada, título, autor, año
- Detalle: sinopsis, autor, género, número de páginas, año de publicación

---

### 4.5 SERIES

#### Estados disponibles
| Estado | Descripción |
|--------|-------------|
| Vista | Terminada o temporada vista |
| Viendo | En progreso actualmente |
| Quiero verla | Lista privada de pendientes |
| Favorita | Marcada como favorita |

#### Progreso
- Temporada actual / número de temporadas
- Episodio actual / episodios en la temporada

Visualización:
```
Breaking Bad · T4 E8
████████░░ 75%
```

#### Acciones
- Cambiar estado
- Actualizar progreso (temporada + episodio)
- Puntuar (1–5 estrellas)
- Escribir reseña
- Marcar como favorita
- Recomendar
- Ver quién se la recomendó

#### Búsqueda
- Integración con TMDB (misma API que películas)

---

### 4.6 MÚSICA

La música tiene un modelo más sencillo en el MVP, centrado en lo que escucho y lo que me recomiendan.

#### Elementos registrables
- Artistas favoritos
- Álbumes favoritos
- Canciones favoritas

#### Acciones
- Añadir artista/álbum/canción a favoritos
- Puntuar (1–5 estrellas)
- Recomendar a un usuario
- Ver quién recomendó algo

#### Búsqueda
- Búsqueda por nombre de artista, álbum o canción (MusicBrainz API)

> **Nota MVP:** No hay "lista de pendientes" para música. El foco es en favoritos y recomendaciones.

---

### 4.7 SISTEMA DE RECOMENDACIONES ENTRE USUARIOS

Esta es la funcionalidad diferencial del producto.

#### Enviar una recomendación
1. Desde el detalle de cualquier contenido, el usuario pulsa "Recomendar".
2. Aparece un buscador de usuarios para seleccionar a quién enviársela.
3. El usuario puede añadir un mensaje personal (opcional, máx. 200 caracteres).
4. La recomendación se envía como notificación al receptor.

**Formato de la notificación recibida:**
> 🎬 **Juan** te recomienda *Interstellar*  
> "Creo que te va a encantar, es justo lo tuyo."

#### Recibir una recomendación
El receptor ve la recomendación en su bandeja de notificaciones con:
- Nombre y avatar del remitente
- Contenido recomendado (con portada)
- Mensaje personal (si lo hay)
- Botones: **Guardar en pendientes** · **Ya lo he visto/leído/escuchado** · **Ignorar**

#### Origen de la recomendación
Cuando un usuario añade un contenido a "Visto/Leído" que tenía en pendientes por recomendación, la app le pregunta:
> ¿Lo has consumido gracias a la recomendación de Juan?
- Sí (queda registrado en el historial: "Recomendado por Juan")
- No (se registra sin origen)

Si confirma que sí, Juan recibe una notificación de reconocimiento:
> ❤️ **María** ha visto *Interstellar* que le recomendaste.

#### Historial de recomendaciones
En el perfil, sección dedicada:
- Recomendaciones enviadas (con estado: pendiente / seguida / ignorada)
- Recomendaciones recibidas (con origen visible)

---

### 4.8 BÚSQUEDA Y DESCUBRIMIENTO

#### Búsqueda global
- Barra de búsqueda global en la pestaña Descubrir
- Búsqueda unificada de películas, libros, series y música
- Búsqueda de usuarios por nombre o @usuario

#### Detalle de contenido
Cada ítem tiene su página de detalle con:
- Portada / imagen
- Título, autor/director/artista, año, género
- Sinopsis / descripción
- Puntuación media en la plataforma
- Cuántos usuarios lo han registrado
- Acciones disponibles (añadir, puntuar, recomendar, etc.)

---

### 4.9 NOTIFICACIONES

En el MVP, las notificaciones son internas (badge en la app, no push).

| Tipo | Descripción |
|------|-------------|
| Recomendación recibida | Alguien te ha recomendado contenido |
| Reconocimiento | Alguien ha seguido tu recomendación |
| Solicitud de amistad / seguir | (si aplica modelo social) |

> **Post-MVP:** Notificaciones push (iOS + Android).

---

## 5. NAVEGACIÓN DE LA APP

### Pestañas principales (bottom tab bar)

```
🏠 Inicio    🔎 Descubrir    ➕ Registrar    🔔 Notificaciones    👤 Perfil
```

#### 🏠 Inicio
- Actividad reciente del usuario (últimas acciones propias)
- Resumen de progreso activo (libros leyendo, series viendo)

> *En el MVP no hay feed social de amigos (llega en Fase 2).*

#### 🔎 Descubrir
- Buscador global (películas, libros, series, música, usuarios)
- Acceso rápido a cada categoría

#### ➕ Registrar
- Acceso directo a añadir contenido en cualquier categoría
- Botón de acción principal flotante (FAB)

#### 🔔 Notificaciones
- Lista de notificaciones internas
- Badge con número de no leídas

#### 👤 Perfil
- Vista del propio perfil
- Acceso a ajustes y edición

---

## 6. MODELOS DE DATOS PRINCIPALES

### Usuario
```
id, username, email, password_hash, display_name, bio, avatar_url,
created_at, updated_at
```

### Contenido (tabla polimórfica por tipo)
```
id, type (movie|book|series|music), external_id, title, subtitle,
creator, year, genre, cover_url, synopsis, created_at
```

### Entrada de usuario (UserContent)
```
id, user_id, content_id, status, rating (1-5), review,
date_started, date_finished, progress_value, progress_total,
is_favorite, recommended_by_user_id, created_at, updated_at
```

### Recomendación
```
id, sender_id, receiver_id, content_id, message,
status (pending|saved|acknowledged|ignored),
acknowledged_at, created_at
```

### Notificación
```
id, user_id, type, data (JSON), read, created_at
```

---

## 7. FLUJOS PRINCIPALES DE USUARIO

### Flujo 1: Registrar una película vista
1. Usuario pulsa ➕ o busca la película
2. Abre el detalle de la película
3. Pulsa "Marcar como vista"
4. Opcionalmente: añade fecha, puntuación, reseña
5. Confirma → la película aparece en su historial

### Flujo 2: Recomendar contenido
1. Usuario abre el detalle de cualquier contenido
2. Pulsa "Recomendar"
3. Busca al usuario destinatario
4. Añade mensaje opcional
5. Envía → el receptor recibe notificación

### Flujo 3: Seguir una recomendación
1. Usuario recibe notificación de recomendación
2. Abre el detalle del contenido
3. Lo guarda en pendientes o lo marca directamente como visto/leído
4. Si lo consumió, confirma el origen (la recomendación)
5. El remitente recibe reconocimiento

---

## 8. APIS EXTERNAS

| Categoría | API | Uso | Gratuita |
|-----------|-----|-----|---------|
| Películas + Series | [TMDB](https://www.themoviedb.org/documentation/api) | Búsqueda, metadata, portadas | ✅ |
| Libros | [Google Books API](https://developers.google.com/books) | Búsqueda, metadata, portadas | ✅ |
| Música | [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API) | Búsqueda de artistas/álbumes | ✅ |
| Imágenes música | [Last.fm API](https://www.last.fm/api) | Portadas de artistas/álbumes | ✅ |

---

## 9. REQUISITOS NO FUNCIONALES

### Rendimiento
- Tiempo de carga inicial: < 2 segundos
- Respuesta de API: < 500ms en P95
- Imágenes con lazy loading y caché local

### Privacidad
- Las listas "Quiero ver / Quiero leer" son **privadas por defecto**
- El usuario puede decidir hacer su perfil privado (MVP básico: público/privado)
- Cumplimiento GDPR: derecho de eliminación de cuenta y datos

### Seguridad
- Contraseñas almacenadas con bcrypt (cost factor 12)
- HTTPS obligatorio
- Tokens JWT con expiración (access: 15min, refresh: 30 días)

### Accesibilidad
- Tamaños de texto mínimos legibles
- Contraste suficiente en UI
- Labels descriptivos para lectores de pantalla

---

## 10. STACK TECNOLÓGICO

### App móvil — `culturaapp-mobile`
| Tecnología | Motivo |
|-----------|--------|
| React Native | Una codebase para iOS y Android |
| Expo | Setup más rápido, OTA updates |
| React Navigation | Navegación estándar |
| Zustand | Estado global simple |
| React Query | Cache y sincronización con API |
| Expo Image | Carga y caché de imágenes |

### Backend — `culturaapp-backend`
| Tecnología | Motivo |
|-----------|--------|
| Node.js + Express | Rápido de desarrollar, gran ecosistema |
| PostgreSQL | Base de datos relacional robusta |
| Redis | Caché de búsquedas y sesiones |
| Prisma ORM | Migraciones y queries tipadas |
| JWT | Autenticación stateless |

---

## 11. ESTRUCTURA DE REPOSITORIOS

### culturaapp-mobile
```
src/
├── api/          # Llamadas a la API backend + APIs externas
├── components/   # Componentes reutilizables (botones, tarjetas, etc.)
├── screens/      # Pantallas principales de la app
│   ├── auth/     # Login, registro, recuperar contraseña
│   ├── home/     # Pantalla de inicio
│   ├── discover/ # Búsqueda y descubrimiento
│   ├── profile/  # Perfil propio y ajeno
│   └── content/  # Detalle de películas, libros, etc.
├── store/        # Estado global (Zustand)
├── navigation/   # Configuración de navegación
├── hooks/        # Custom hooks
└── utils/        # Helpers y constantes
```

### culturaapp-backend
```
src/
├── routes/       # Endpoints de la API
│   ├── auth.js
│   ├── users.js
│   ├── content.js
│   └── recommendations.js
├── controllers/  # Lógica de negocio
├── models/       # Modelos Prisma
├── middleware/   # Auth, validación, errores
├── services/     # Integraciones con APIs externas
└── utils/        # Helpers
prisma/
└── schema.prisma # Esquema de base de datos
```

---

## 12. ROADMAP DE DESARROLLO

### Sprint 1 — Base (2 semanas)
- [ ] Setup repositorios y CI básico
- [ ] Autenticación completa (registro, login, JWT)
- [ ] Modelo de usuario y perfil básico
- [ ] Integración TMDB: búsqueda de películas
- [ ] Añadir película como vista / puntuar

### Sprint 2 — Contenido (2 semanas)
- [ ] Libros: integración Google Books, estados, progreso
- [ ] Series: integración TMDB, estados, progreso por episodio
- [ ] Música: integración MusicBrainz, favoritos
- [ ] Perfil con historial por categoría

### Sprint 3 — Recomendaciones (2 semanas)
- [ ] Sistema de recomendaciones (enviar / recibir)
- [ ] Sistema de notificaciones internas
- [ ] Reconocimiento cuando se sigue una recomendación
- [ ] Historial de recomendaciones en el perfil

### Sprint 4 — Pulido y lanzamiento (2 semanas)
- [ ] Búsqueda de usuarios
- [ ] Ajustes de privacidad básicos
- [ ] Testing y corrección de bugs
- [ ] Preparación para App Store / Google Play

---

## 13. CRITERIOS DE ÉXITO DEL MVP

El MVP se considera exitoso si:

1. Un usuario puede registrarse y completar su perfil.
2. Puede añadir y puntuar películas, libros, series y música.
3. Puede enviar una recomendación a otro usuario.
4. El receptor puede ver la recomendación y confirmar si la siguió.
5. El emisor recibe el reconocimiento correspondiente.
6. El historial de recomendaciones es visible en el perfil.

---

*Documento vivo — se actualizará conforme avance el desarrollo.*
