# AGENTS.md - VoiceInvenXi

## Contexto del Proyecto

VoiceInvenXi es una aplicación de inventario para bodegas. Los operarios escanean productos con la cámara, hablan para registrar movimientos de stock, y todo se sincroniza con un backend.

**Arquitectura:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS v4 (ESTE REPOSITORIO)
- Backend: FastAPI + PostgreSQL (desplegado en Render)
- Deploy: Frontend en Vercel, Backend en Render, DB en Supabase

---

## Stack Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.x | Core UI |
| TypeScript | 6.x | Type safety |
| Vite | 8.x | Build tool |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| react-router | 7.x | Client-side routing |
| motion | 12.x | Animaciones (antes framer-motion) |
| lucide-react | 1.x | Iconos |

**NO usar:** MUI, Ant Design, Bootstrap, o cualquier librería de componentes pesada.

### Responsive Design

La app es full-screen y se adapta a cualquier dispositivo de forma automática:

- **Mobile** (`< 1024px`): llena 100% del viewport dinámico (`100dvh`), sin bordes ni sombras, sin max-width
- **Desktop** (`≥ 1024px`): mockup centrado de teléfono (480x844px) con border-radius 44px, borde sutil y sombra
- **Safe areas**: soporte automático para iPhones con notch/Dynamic Island via `env(safe-area-inset-*)` en html + `pb-[env(safe-area-inset-bottom)]` en navegación
- **Viewport meta**: `viewport-fit=cover` habilitado para llenar toda la pantalla
- **Dynamic viewport**: usa `100dvh` (dynamic viewport height) en html/body/PhoneFrame para adaptarse al chrome del navegador móvil (barra de URL, home indicator)

**Breakpoints:**
- `lg:` (1024px) es el único breakpoint — mobile llena pantalla, desktop muestra mockup

**Height chain (mobile):**
```
html → height: 100dvh + overflow: hidden + padding safe-area-insets
body → height: 100% + min-height: 100dvh + position: relative + overflow: hidden
#root → height: 100% + overflow: hidden
PhoneFrame outer → h-full w-full overflow-hidden (desktop: lg:flex items-center justify-center)
PhoneFrame inner → h-full w-full (mobile), lg:h-[min(844px,calc(100%-1.5rem))] lg:w-[480px] centrado (desktop)
Page → relative h-full flex flex-col
```

> **Importante:** `body` debe tener `height: 100%` (no solo `min-height`) para que la cadena de `height: 100%` de `#root`/PhoneFrame resuelva de forma definida en móvil. Sin esto, el layout colapsa en dispositivos móviles.

**ScanPage layout:**
- NavBar fijo en `absolute bottom-[10%] z-20` (elevada un 10% de la altura del frame; misma posición en todas las páginas, memoria muscular)
- FAB de búsqueda por voz **dentro de la misma fila que la NavBar** (`PageLayout navExtra`, `items-center gap-2`) — el micrófono y la navbar comparten exactamente la misma altura y nunca se solapan en pantallas angostas
- Hint pill "Apunta al código de barras" posicionado con `bottom-[calc(10%+7rem)]` centrado (`text-center whitespace-nowrap`), encima de la zona FAB/nav — escala fluido con la altura del frame
- Escaneo automático real con `html5-qrcode` (ZXing, `#scan-region` dentro de un strip 16:9 centrado en `aspect-video` — evita la distorsión del sampler que ocurre con regiones de aspecto distinto a la cámara). Decodifica QR/EAN/UPC/Code128/Code39 y funciona en todos los navegadores (incl. iOS Safari, donde `BarcodeDetector` no existe). fps: 8, `facingMode: 'environment'`
- Beep de escaneo con Web Audio (`src/lib/beep.ts`, `playScanBeep`) + `hapticSuccess()` al detectar un código
- Recuadro de escaneo: esquinas con `corner-pulse` (2.4s), línea de barrido con glow (`scan-line` anima `top` 0 → calc(100%-2px)), `ring` naranja mientras escanea
- Botón "Activo" (demo/simulación de escaneo) solo visible en desarrollo (`import.meta.env.DEV`)
- Título "VoiceInvenXi" **centrado horizontalmente** (`text-center`) en la top bar, `py-4` simétrico para centrado vertical — nunca se sale del frame
- Botón "Activo" (dev) en `absolute right-4 top-1/2 -translate-y-1/2` dentro de la top bar

---

## Estructura del Proyecto

```
src/
├── main.tsx                    # Entry point, renderiza App en StrictMode
├── index.css                   # Tailwind CSS imports + theme (colores, animaciones, MD3 light)
├── App.tsx                     # ToastProvider + ErrorBoundary + BrowserRouter + PhoneFrame (con ToastHost) + lazy routes
├── vite-env.d.ts               # Tipos globales (SpeechRecognition, SpeechRecognitionErrorEvent)
├── types.ts                    # Interfaces: Product, Movement, CreateProductDTO, CreateMovementDTO, ApiResponse, SemanticSearchResult
├── constants.ts                # API_BASE URL
├── api.ts                      # Fetcher genérico (timeout 120s, extrae error de detail.message) + productApi + movementApi + searchApi + agentApi
│
├── lib/
│   ├── stt.ts                  # Cliente para POST /api/stt (transcribe audio → texto)
│   ├── haptics.ts              # Wrapper de navigator.vibrate (feature-check, no-op en desktop/https-fail)
│   ├── barcode.ts              # generateRandomBarcode() — EAN-13 válido para simulación/scanner dev
│   ├── beep.ts                 # playScanBeep — beep de escaneo con Web Audio
│   ├── numbers.ts              # parseSpanishNumber — parser local de números en español (fallback offline)
│   └── elevenlabs.ts           # (ELIMINADO — TTS ya no usa ElevenLabs; el audio usa speechSynthesis nativo)
│
├── hooks/
│   ├── useSTT.ts               # STT: Web Speech API preferido, ElevenLabs MediaRecorder como fallback
│   └── useTTS.ts               # TTS: speechSynthesis nativo (sin ElevenLabs)
│
├── components/ui/              # 17 componentes UI con Tailwind CSS (tema MD3 light)
│   ├── Button.tsx              # Botón MD3 (filled/tonal/outlined/text) con variantes
│   ├── Card.tsx                # Card reutilizable con glass effect
│   ├── Input.tsx               # Input MD3 con label, icono, error state
│   ├── FAB.tsx                 # Floating Action Button (micrófono)
│   ├── StockBadge.tsx          # Badge de stock color-coded (verde/ambar/rojo)
│   ├── StockValue.tsx          # Número de stock + getStockColor (texto, sin pill)
│   ├── ProductRow.tsx          # Fila estándar de producto (tile + nombre + meta + StockBadge)
│   ├── Header.tsx              # Header de página con back button
│   ├── PageLayout.tsx          # Scaffold único: header slot + región scroll + NavBar opcional (nav/scroll/contentClassName)
│   ├── NavBar.tsx              # Navegación inferior (4 items) flotante
│   ├── PhoneFrame.tsx          # Contenedor responsive (full-screen mobile, mockup desktop, ambient blobs)
│   ├── Toast.tsx               # Sistema de toasts (ToastProvider + ToastHost + useToast; host vive dentro de PhoneFrame)
│   ├── VoiceWave.tsx           # Barras animadas de onda de voz
│   ├── Skeleton.tsx            # Skeleton loader con shimmer
│   ├── EmptyState.tsx          # Estado vacío reutilizable
│   ├── SuccessAnimation.tsx    # Overlay de éxito con check animado
│   ├── ErrorBoundary.tsx       # Class error boundary con fallback
│   └── index.ts               # Barrel exports
│
└── pages/                      # 8 pantallas lazy-loaded
    ├── ScanPage.tsx            # Ruta: / – Cámara + viewfinder + bottom nav flotante
    ├── SearchPage.tsx          # Ruta: /search – Búsqueda semántica por voz/texto
    ├── ProductPage.tsx         # Ruta: /product/:barcode – Detalle + movimiento por voz
    ├── NewProductPage.tsx      # Ruta: /new/:barcode – Wizard 5 pasos con STT
    ├── ScanPageRedirect.tsx    # Ruta: /new – Redirect a escaneo aleatorio
    ├── InventoryPage.tsx       # Ruta: /inventory – Lista de productos
    ├── ActivityPage.tsx        # Ruta: /activity – Historial de movimientos
    └── ProfilePage.tsx         # Ruta: /profile – Perfil de usuario
```

---

## Flujo de Navegación

```
/                    → ScanPage (cámara + viewfinder + bottom nav flotante)
/search              → SearchPage (búsqueda semántica por voz o texto)
/product/:barcode    → ProductPage (producto encontrado → registrar movimiento por voz)
                    → si no existe → redirige automáticamente a /new/:barcode
/new/:barcode        → NewProductPage (wizard de 5 pasos: Nombre → Marca → Categoría → Presentación → Unidad)
/new                 → ScanPageRedirect (simula escaneo aleatorio)
/inventory           → InventoryPage (lista de productos)
/activity            → ActivityPage (historial de movimientos)
/profile             → ProfilePage (perfil de usuario)
```

### Nota sobre producto no encontrado
Cuando `ProductPage` recibe un 404 del backend (o el producto no está en mock data), redirige automáticamente a `/new/:barcode` con `{ replace: true }`. No muestra mensaje estático de "no encontrado".

### NewProductPage - Wizard
El formulario de creación de producto usa un wizard de 5 pasos con transiciones animadas (fade + slide):
- **Paso 1**: Nombre del producto (requerido)
- **Paso 2**: Marca
- **Paso 3**: Categoría
- **Paso 4**: Presentación
- **Paso 5**: Unidad de Medida

Cada paso muestra un solo campo de entrada + botón de micrófono grande. Los campos opcionales se auto-avanzan después de 600ms al recibir input de voz.

---

## Diseño Visual / UX

### Tema MD3 Light
- **Brand color**: `#F97316` (naranja vibrante)
- **Superficies**: `#FAFAFA` (surface), `#F5F5F5` (surface-1), `#EEEEEE` (surface-2)
- **Textos**: `#1C1B1F` (on-surface), `#79747E` (on-surface-muted)
- **Éxito**: `#2E7D32`, **Error**: `#B3261E`, **Warning**: `#ED6C02`

### CSS base (index.css)
- `html`: `height: 100dvh` + `overflow: hidden` + padding con `env(safe-area-inset-*)` para soporte de safe areas
- `body`: `position: relative; height: 100%; min-height: 100dvh; touch-action: manipulation; overflow: hidden`
- `#root`: `height: 100%; overflow: hidden`
- Scrollbar personalizado: 4px de ancho, translúcido

### Fondo ambiente (profundidad)
- `PhoneFrame.tsx` define 3 blobs animados (naranja, verde, púrpura) con blur y animación CSS
- Los blobs solo son visibles en desktop (`hidden lg:block`) — en mobile el fondo es sólido
- Todos los componentes usan `background: transparent` para que el ambiente se vea

### Sistema de Toasts
- `Toast.tsx`: `ToastProvider` (context) + `useToast()` + `ToastHost` (renderiza la pila UI)
- El `ToastHost` se monta **dentro de `PhoneFrame`** (App.tsx) anclado al frame, no a la ventana — en desktop los toasts quedan dentro del mockup de teléfono
- Toasts glass apilados, icono (check/alert/info), auto-dismiss, animación `motion`, `aria-live="polite"`

### PageLayout (scaffold único)
- Todas las páginas usan `PageLayout` con la misma estructura: header slot + región scroll + NavBar opcional
- Props: `header?: ReactNode`, `nav?: boolean` (renderiza NavBar flotante con safe-area), `scroll?: boolean` (default true; `false` para layouts full-bleed como ScanPage), `contentClassName`, `className`
- El NavBar se posiciona `absolute bottom-[10%]` dentro del layout — no repetir el bloque en cada página

### Lenguaje de fila estándar
- `ProductRow.tsx`: tile de icono `w-11 h-11 rounded-2xl bg-brand-container` + nombre + meta + `StockBadge` — usado por Inventory y Search
- Activity usa el mismo ritmo de tiles (`rounded-2xl`) con colores success/error según tipo de movimiento

### Skeleton loaders
- `Skeleton.tsx`: utilidad de shimmer con Tailwind

### Feedback háptico
- `haptics.ts`: wrapper de `navigator.vibrate(...)` con feature-check y no-op en desktop

### Error Boundary
- `ErrorBoundary.tsx` (clase) con fallback + botón "Reintentar"

### Accesibilidad
- `VoiceWave` lleva `aria-hidden="true"`
- Toasts `aria-live="polite"`
- Animaciones usan `prefers-reduced-motion` para degradar

### Momento de éxito
- `SuccessAnimation.tsx`: check verde animado + ripple + particle burst + haptic

### Empty states
- `EmptyState.tsx`: icono lucide + título + subtítulo, reutilizable

---

## API Contract

El frontend espera un backend con esta API. El archivo `src/api.ts` contiene el fetcher base.

### Base URL
```
VITE_API_URL环境变量，默认: https://voiceinvenoxi-api.onrender.com
```

### Endpoints

#### GET /api/products
Lista todos los productos.

**Response exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "barcode": "7790123456789",
      "name": "Aceite de Oliva",
      "brand": "La Española",
      "category": "Abarrotes",
      "presentation": "Botella 500ml",
      "unit": "Unidad",
      "stock": 120,
      "imageUrl": null
    }
  ]
}
```

#### GET /api/products/:barcode
Busca un producto por código de barras.

**Response exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "barcode": "7790123456789",
    "name": "Aceite de Oliva",
    "brand": "La Española",
    "category": "Abarrotes",
    "presentation": "Botella 500ml",
    "unit": "Unidad",
    "stock": 120,
    "imageUrl": null
  }
}
```

**Response no encontrado (404):**
```json
{
  "success": false,
  "message": "Producto no encontrado"
}
```

#### POST /api/products
Crea un nuevo producto.

**Request body:**
```json
{
  "barcode": "7790123456789",
  "name": "Aceite de Oliva",
  "brand": "La Española",
  "category": "Abarrotes",
  "presentation": "Botella 500ml",
  "unit": "Unidad"
}
```

**Response exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "barcode": "7790123456789",
    "name": "Aceite de Oliva",
    "brand": "La Española",
    "category": "Abarrotes",
    "presentation": "Botella 500ml",
    "unit": "Unidad",
    "stock": 0,
    "imageUrl": null
  }
}
```

#### POST /api/stt
Convierte audio a texto usando ElevenLabs.

**Request:** Multipart form con campo `file` (audio/webm).

**Response exitosa (200):**
```json
{
  "text": "veinte unidades"
}
```

#### POST /api/agent/parse-movement
Extrae cantidad y tipo de movimiento de un transcript de voz usando Cactus Needle (modelo local en el backend, sin red).

**Request body:**
```json
{
  "text": "veinte unidades de entrada"
}
```

**Response exitosa (200):**
```json
{
  "success": true,
  "data": {
    "quantity": 20,
    "type": "in",
    "confidence": 0.7799
  }
}
```

**Refusal/confianza baja (422):** `detail.message` con instrucciones para ingresar manualmente. El frontend escala al parser local `parseSpanishNumber` + toggle de tipo.

#### POST /api/agent/parse-product
Extrae campos de producto (name/brand/category/presentation/unit) de una frase de voz con Cactus Needle.

**Request body:**
```json
{
  "text": "aceite de oliva extra virgen, botella 500ml, abarrotes"
}
```

**Response exitosa (200):** `data` con los campos encontrados + `confidence`. En español el modelo base suele rechazar (422) → el wizard sigue el flujo manual paso a paso. Ver tech debt #12 (hace falta LoRA fine-tune para desbloquearlo).

#### GET /api/movements
Lista todos los movimientos con nombre del producto.

**Response exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "quantity": 20,
      "type": "in",
      "createdAt": "2026-07-28T12:00:00Z",
      "productName": "Aceite de Oliva"
    }
  ]
}
```

#### POST /api/movements
Registra un movimiento de stock (entrada o salida).

**Request body:**
```json
{
  "productId": "uuid",
  "quantity": 20,
  "type": "in"
}
```

**Response exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "quantity": 20,
    "type": "in",
    "createdAt": "2026-07-28T12:00:00Z"
  }
}
```

#### POST /api/search/semantic
Búsqueda semántica de productos por similitud vectorial (pgvector).

**Request body:**
```json
{
  "query": "aceite de oliva"
}
```

**Response exitosa (200):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "barcode": "7790123456789",
        "name": "Aceite de Oliva Extra Virgen",
        "brand": "La Española",
        "category": "Abarrotes",
        "presentation": "Botella 500ml",
        "unit": "Unidad",
        "stock": 120,
        "score": 0.6254
      }
    ]
  }
}
```

#### POST /api/search/seed-embeddings
Genera embeddings vectoriales para todos los productos sin embedding. Usar después de crear productos nuevos.

**Response exitosa (200):**
```json
{
  "updated": 39,
  "total": 41
}
```

---

## Modelos de Datos (TypeScript)

```typescript
// src/types.ts

interface Product {
  id: string
  barcode: string
  name: string
  brand: string
  category: string
  presentation: string
  unit: string
  stock: number
  imageUrl: string | null
}

interface CreateProductDTO {
  barcode: string
  name: string
  brand: string
  category: string
  presentation: string
  unit: string
}

interface Movement {
  id: string
  productId: string
  quantity: number
  type: 'in' | 'out'
  createdAt: string
}

interface CreateMovementDTO {
  productId: string
  quantity: number
  type: 'in' | 'out'
}

interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

interface SemanticSearchResult extends Product {
  score: number
}
```

---

## Backend (FastAPI) - Guía de Implementación

### Estructura
```
backend/
├── main.py                 # FastAPI app, lifespan context manager (incl. warmup de Needle), CORS configurable, health check con DB
├── database.py             # SQLAlchemy async + asyncpg (load_dotenv, ssl=require, statement_cache_size=0). Fail-fast sin DATABASE_URL
├── models.py               # SQLAlchemy models (PG_UUID para columnas id/product_id, Vector(1024) embedding)
├── schemas.py              # Pydantic schemas (model_validator para convertir UUID→str)
├── needle_agent.py         # Cactus Needle: tools de movimiento/producto, get_agent(), warmup(), _call() con gate de confianza
├── embeddings.py           # Cohere (primario) + Jina (fallback), batch embeddings (96 texts/request)
├── routers/
│   ├── products.py         # GET /api/products, GET /api/products/:barcode, POST /api/products
│   ├── movements.py        # GET /api/movements, POST /api/movements
│   ├── search.py           # POST /api/search/semantic (queries parametrizadas), POST /api/search/seed-embeddings (batch)
│   ├── agent.py            # POST /api/agent/parse-movement, POST /api/agent/parse-product (Cactus Needle)
│   └── elevenlabs.py       # POST /api/stt (proxy a ElevenLabs)
├── requirements.txt        # fastapi, uvicorn, sqlalchemy, asyncpg, httpx, python-multipart, python-dotenv, pgvector, cactus-needle
├── init.sql                # Script completo: tablas (con embedding + HNSW index) + 32 productos + movimientos (pegar en Supabase SQL Editor)
├── setup.sql               # Solo tablas (con embedding + HNSW index, sin datos)
├── seed.sql                # Solo datos (después de setup.sql)
└── .env.example            # Template con todas las variables de entorno requeridas
```

### CORS
El frontend se ejecuta en origen diferente. Configurar via variable de entorno `CORS_ORIGINS` (comma-separated). Default: `*`:
```python
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Database Schema (PostgreSQL via Supabase)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  category VARCHAR(255),
  presentation VARCHAR(255),
  unit VARCHAR(50),
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  embedding vector(1024),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_movements_product_id ON movements(product_id);
CREATE INDEX idx_products_embedding ON products USING hnsw (embedding vector_cosine_ops);
```

### Lógica de Movimiento
Cuando se crea un movimiento:
- Si `type = 'in'`: `UPDATE products SET stock = stock + quantity WHERE id = product_id`
- Si `type = 'out'`: `UPDATE products SET stock = stock - quantity WHERE id = product_id` (validar que stock >= 0)

### Guía de Debugging Backend

Cuando el backend falla con 500, seguir este checklist:

1. **Probar `/api/health`** — Si falla, el backend no arrancó (error de deploy o startup). El health check ahora verifica conexión a DB con `SELECT 1`.
2. **Probar raw SQL** — Si `/api/health` funciona pero los endpoints de negocio fallan, puede ser:
   - **Conexión a DB**: La causa más común es que falta `ssl="require"` en `connect_args` de asyncpg. Supabase pooler (port 6543) exige SSL.
   - **`create_all` fallando**: El pooler de Supabase no soporta DDL en transacciones. Envolver en `try/except`.
3. **Tipo UUID vs String** — Si el POST falla con `column "id" is of type uuid but expression is of type character varying`:
   - El modelo SQLAlchemy usa `String` para el `id` pero la DB tiene `UUID`. Usar `PG_UUID(as_uuid=False)` de `sqlalchemy.dialects.postgresql`.
4. **Pydantic ValidationError** — Si el GET falla con `Input should be a valid string, input_value=UUID(...)`:
   - SQLAlchemy retorna objetos `UUID` de PostgreSQL. Agregar `model_validator(mode="before")` en los schemas Pydantic que convierta `UUID → str`.
5. **DATABASE_URL** — En Render, la variable de entorno `DATABASE_URL` debe estar configurada en el dashboard (no en `.env`, que está en `.gitignore`). El `.env` es solo para desarrollo local.

**Patrón de error típico y solución:**
```
Error: column "id" is of type uuid but expression is of type character varying
→ Causa: models.py usa String para id, DB tiene UUID
→ Fix: _id_type = PG_UUID(as_uuid=False) if IS_POSTGRES else String

Error: Input should be a valid string [type=string_type, input_value=UUID('...')]
→ Causa: Pydantic espera str pero recibe objeto UUID
→ Fix: Agregar @model_validator(mode="before") que convierta UUID→str
```

---

## Variables de Entorno

### Frontend (.env)
```
VITE_API_URL=https://voiceinvenoxi-api.onrender.com
```

### Backend (Render)
```
DATABASE_URL=postgresql://user:pass@host:6543/postgres
ELEVENLABS_API_KEY=sk_...         # Optional - falls back to browser native APIs
COHERE_API_KEY=...               # Optional - for semantic search embeddings
JINA_API_KEY=...                 # Optional - fallback for embeddings
CORS_ORIGINS=https://app.vercel.app  # Optional - default: *
```

---

## Comandos

```bash
# Frontend (usar pnpm)
pnpm install          # Instalar dependencias
pnpm run dev          # Desarrollo en http://localhost:5173
pnpm run build        # Build de producción
pnpm run lint         # Linting con oxlint
pnpm run preview      # Preview del build

# Backend (cuando exista)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Reglas para el Backend Agent

1. **Respeta el `ApiResponse<T>` wrapper** - Todos los endpoints de negocio (products, movements, search, agent) deben devolver `{ success: boolean, data: T, message?: string }`. El endpoint `/api/stt` es un proxy a ElevenLabs y devuelve `{ text }`. Los endpoints de agent devuelven 422 (o 503) con `detail.message` descriptivo cuando el modelo rechaza o falla — el frontend escala al parser local.
2. **statement_cache_size=0** - En `database.py` está configurado porque Supabase usa pgbouncer (pooler) que no soporta prepared statements de asyncpg.
3. **El barcode es string, no number** - Puede contener letras en el futuro.
4. **El stock se actualiza en el backend** - El frontend solo lee el stock, no lo muta directamente.
5. **CORS obligatorio** - El frontend y backend están en dominios diferentes.
6. **UUIDs para IDs** - Usar `gen_random_uuid()` en PostgreSQL.
7. **La imagen es opcional** - `imageUrl` puede ser `null`. El frontend muestra un placeholder.
8. **El movimiento puede ser negativo** - Validar que el stock no baje de 0 en el backend.
9. **El endpoint de movimiento debe actualizar el stock** - Hacer UPDATE atómico en la misma transacción.
10. **Deploy en Render** - El backend debe funcionar como servicio web, no como script.

---

## Testing del Frontend

Para probar el frontend sin backend, ejecutar `pnpm run dev`. El `ScanPage` simula escaneos aleatorios de códigos de barras EAN-13 válidos vía `generateRandomBarcode()`.

**TTS/STT en desarrollo**: Sin backend, los hooks `useTTS` y `useSTT` fallback automáticamente a las APIs nativas del navegador (`window.speechSynthesis` y `SpeechRecognition`). No requieren configuración adicional.

Para probar con backend real, crear la variable de entorno `VITE_API_URL` apuntando a tu API.

---

## Tech Debt / Known Issues

1. **Mock data eliminado**: Ya no hay productos mock en el frontend. El `ScanPage` simula escaneos con `generateRandomBarcode()`; para datos reales se necesita el backend.
2. **TTS / STT**: TTS usa `speechSynthesis` nativo del navegador (sin ElevenLabs). STT intenta ElevenLabs vía backend proxy (`POST /api/stt`); si falla (desarrollo sin backend), cae a `SpeechRecognition` nativo. Voice ID por defecto: `LnGOA2SxH2fX1e1iNzEp`.
3. **STT error handling**: `useSTT` expone un estado `error` con mensajes como "Permiso de micrófono denegado", "No se detectó voz", "Tiempo de espera agotado". Timeout de 10s en Web Speech API.
4. **Audio de confirmación con delay**: En `ProductPage`, el TTS de confirmación se reproduce con 2.5s de delay después del overlay de éxito.
5. **No hay autenticación**: El backend actual no requiere auth. Agregar JWT/API keys cuando sea necesario.
6. **No hay manejo offline**: La app asume conexión. Agregar service worker si se necesita offline.
7. **Imágenes de producto**: El campo `imageUrl` existe pero no hay upload de imágenes aún. Agregar endpoint POST /api/products/:id/image.
8. **Mobile responsive**: Los componentes usan Tailwind CSS v4 con responsive design. `PhoneFrame` se adapta entre mobile (full-screen) y desktop (mockup centrado con ambient blobs). `ScanPage` usa cámara full-screen con viewfinder flotante. `NavBar` está fijo en `absolute bottom-[10%] z-20` en todas las páginas (posición consistente, elevada 10% de la altura del frame). El viewport usa `100dvh` para adaptarse al chrome del navegador móvil.
9. **Supabase RLS deshabilitado**: Las tablas `products` y `movements` tienen RLS deshabilitado. El backend se conecta vía PostgreSQL directo (pooler puerto 6543) con el usuario `postgres`, que bypasea RLS. Si se necesita re-habilitar RLS, crear policies de INSERT/SELECT para el rol de conexión.
10. **Error handling en frontend**: `productApi.create` y `movementApi.create` propagan errores reales al UI (no hay catch silencioso). El `fetcher` extrae mensajes de error de `detail.message` de FastAPI. Timeout de 120s para cold-starts de Render.
11. **Semantic search (RAG)**: `POST /api/search/semantic` busca productos por similitud vectorial usando pgvector. `POST /api/search/seed-embeddings` genera embeddings para todos los productos. La columna `embedding vector(1024)` debe existir en la tabla `products`. Los embeddings se generan con Cohere (primario) y Jina como fallback automático cuando Cohere rate-limite (429) o no esté configurado. Después de crear productos nuevos, llamar a `/api/search/seed-embeddings` para generar sus embeddings.
12. **Cactus Needle (agent)**: `POST /api/agent/parse-movement` y `parse-product` extraen intentos de voz con el modelo local `cactus-needle` (sfairXC/FsfairX-LLaMA3-RM-v0.1, ~14MB, run en GPU/CPU en Render, sin red). Gate de confianza: `NEEDLE_CONFIDENCE_THRESHOLD` (default 0.35) — si la confianza del call es menor, devuelve 422 y el frontend escala a `parseSpanishNumber` + inputs manuales. El engine se descarga una vez de Hugging Face al primer warmup (requiere red en el arranque; aviso de "unauthenticated requests" es inofensivo). **Calibración empírica**: descriptions/tools cortos calibran mejor (few-shot largo rompió la confianza: 0.83 → 0.003); multi-tool (5 calls) calibra honesto mientras single-tool forzado infla falsos positivos; en español `parse-product` casi siempre queda bajo el umbral (conf ~0.0) → el wizard usa dictado paso a paso. Probar cambios de prompt SIEMPRE con smoke test en `/tmp/opencode/needle-venv` (cactus-needle instalado) y medir confianza con `NEEDLE_CONFIDENCE_THRESHOLD=0.01`.
13. **Fondo ambiente**: `PhoneFrame.tsx` define 3 blobs animados (naranja, verde, púrpura) con blur. Todos los componentes usan `background: transparent` para que el ambiente se vea. Los blobs solo son visibles en desktop (`hidden lg:block`).
