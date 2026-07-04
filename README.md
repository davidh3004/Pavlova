# Pavlova Love Tampa

Sitio web bilingüe (Español / Inglés) para Pavlova Love Tampa — pastelería, café
y cocina venezolana en Tampa, Florida.

Construido con **Astro**, **React**, **Tailwind CSS + DaisyUI** y **Supabase**
como base de datos. El proyecto es autónomo: funciona en cualquier computadora
con Node.js y se configura por completo mediante variables de entorno.

---

## Requisitos

- **Node.js 20 o superior** (recomendado Node 24)
- npm (incluido con Node)

---

## Puesta en marcha rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de configuración
cp .env.example .env
#    Luego edita .env con tus credenciales (ver más abajo)

# 3. Arrancar en modo desarrollo
npm run dev
```

El sitio queda disponible en `http://localhost:4321`.

> El sitio **arranca aunque no configures Supabase**: en local usa
> `data/store.json`. En Vercel necesitas Supabase para que los datos persistan.

---

## Configuración (archivo `.env`)

Copia `.env.example` a `.env` y completa los valores. Resumen de las variables:

### Supabase (necesario para datos dinámicos en producción)

| Variable | Descripción |
| --- | --- |
| `SUPABASE_URL` | Project URL (Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (secret, solo servidor) |

Cómo configurarlas:

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el contenido de `scripts/supabase-schema.sql`.
3. En **Project Settings → API**, copia la **Project URL** y la clave **`service_role`** (no la `anon` key).

### Panel de administración (`/admin`)

| Variable | Descripción | Por defecto |
| --- | --- | --- |
| `ADMIN_USERNAME` | Usuario del panel | `admin` |
| `ADMIN_PASSWORD` | Contraseña del panel | `pavlovalove2024` |
| `SESSION_SECRET` | Texto aleatorio para firmar la sesión | (cámbialo) |

### Square (pagos en línea — opcional)

| Variable | Descripción |
| --- | --- |
| `SQUARE_ACCESS_TOKEN` | Token de acceso de Square |
| `SQUARE_APPLICATION_ID` | ID de la aplicación de Square |
| `SQUARE_LOCATION_ID` | ID de la ubicación de Square |
| `SQUARE_ENVIRONMENT` | `sandbox` (pruebas) o `production` (real) |

El checkout funciona sin Square; los pagos con tarjeta solo se activan si lo configuras.

---

## Cargar los datos iniciales (seed)

El proyecto incluye los datos actuales (categorías, productos, menú, reseñas y
ajustes del sitio) en `scripts/seed-data.json`. Para cargarlos en Supabase:

```bash
# Con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya puestos en .env
# y el schema SQL ya ejecutado
npm run seed
```

El script se puede ejecutar varias veces sin crear duplicados.

---

## Scripts disponibles

| Comando | Acción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run preview` | Previsualizar la compilación |
| `npm run typecheck` | Revisar tipos de TypeScript |

---

## Despliegue en Vercel

1. Sube este proyecto a un repositorio (GitHub, GitLab, etc.).
2. En [vercel.com](https://vercel.com) crea un proyecto nuevo e importa el repo.
3. Vercel detecta Astro automáticamente (adaptador `@astrojs/vercel` ya incluido).
4. En **Settings → Environment Variables** añade las mismas variables de tu `.env`.
5. Despliega. ¡Listo!

> Importante: en Vercel usa la clave **`service_role`**, nunca la `anon` key.

---

## Estructura del proyecto

```
src/
  pages/
    *.astro            Páginas públicas (inicio, menú, postres, etc.)
    admin/             Panel de administración
    api/               Endpoints REST (respaldados por Firestore)
  components/          Componentes de UI (incluye islas de React)
  server/              Capa de datos: Supabase, auth, Square
  i18n/                Traducciones ES / EN
scripts/
  seed-data.json       Datos exportados
  seed-firestore.mjs   Importador a Firestore
```

---

## Modelo de datos (colecciones de Firestore)

`categories`, `products`, `menus`, `menu_sections`, `menu_items`, `orders`,
`order_items`, `catering_inquiries`, `custom_orders`, `contact_messages`,
`reviews`, `gallery_items`, `site_settings`, `promotions`, `admin_users`,
`counters` (gestiona los ids numéricos autoincrementales).
