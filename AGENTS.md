# AGENTS.md - VoiceInvenXi

## Contexto del Proyecto

VoiceInvenXi es una aplicación de inventario para bodegas. Los operarios escanean productos con la cámara, hablan para registrar movimientos de stock, y todo se sincroniza con un backend.

**Arquitectura:**
- Frontend: React 19 + TypeScript + Vite (ESTE REPOSITORIO)
- Backend: FastAPI + PostgreSQL (desplegado en Render)
- Deploy: Frontend en Vercel, Backend en Render, DB en Supabase

---

## Stack Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.x | Core UI |
| TypeScript | 6.x | Type safety |
| Vite | 8.x | Build tool |
| react-router | 7.x | Client-side routing |
| motion | 12.x | Animaciones (antes framer-motion) |
| lucide-react | 1.x | Iconos |
| CSS Modules | - | Estilos con scope |

**NO usar:** Tailwind, MUI, Ant Design, Bootstrap, o cualquier librería de componentes pesada.

### Responsive Design

La app es full-screen y se adapta a cualquier dispositivo:

- **Mobile** (`< 481px`): sin bordes ni sombras, ocupa 100% de la pantalla
- **Desktop** (`≥ 481px`): se centra como mockup de teléfono con max-width 480px, border-radius 44px y sombra, altura máxima 844px
- **CSS Custom Properties fluídas**: spacing, font-size y radius usan `clamp()` para escalar suavemente entre pantallas chicas y grandes
- **Unidades relativas**: todos los componentes usan `100%`, `100dvh`, `flex`, y las variables CSS fluidas. Sin valores fijos en pixeles para layout

---

## Estructura del Proyecto

```
src/
├── main.tsx                    # Entry point, renderiza App en StrictMode
├── App.tsx                     # BrowserRouter + PhoneFrame + lazy routes
├── vite-env.d.ts               # Tipos globales (CSS Modules, SpeechRecognition, SpeechRecognitionErrorEvent)
├── types.ts                    # Interfaces: Product, Movement, CreateProductDTO, CreateMovementDTO, ApiResponse
├── constants.ts                # API_BASE URL, MOCK_PRODUCTS array, findMockProduct()
├── api.ts                      # Fetcher genérico (timeout 15s, extrae error de detail.message) + productApi + movementApi
│
├── styles/
│   ├── globals.css             # CSS custom properties (tokens), reset, font Inter
│   └── animations.css          # @keyframes compartidos (pulse, ripple, scanLine, waveBar: 4px-24px, etc.)
│
├── lib/
│   └── elevenlabs.ts           # Cliente para POST /api/tts y /api/stt
│
├── hooks/
│   ├── useVoiceRecognition.ts  # (deprecated) Wrapper Web Speech API
│   ├── useSTT.ts               # STT: Web Speech API preferido, ElevenLabs MediaRecorder como fallback. Incluye error handling, timeout de 10s, y estado `error`
│   ├── useTTS.ts               # TTS: speechSynthesis nativo preferido, ElevenLabs como fallback
│   └── useCamera.ts            # getUserMedia + capture a blob
│
├── components/                 # 11 componentes reutilizables
│   ├── GlassCard.tsx           # Card glassmorphism, variants: elevated, interactive, compact
│   ├── GlassButton.tsx         # Botón pill, variants: primary, secondary, danger; sizes: sm, md, lg
│   ├── GlassInput.tsx          # Input con label, icono, error state
│   ├── GlassIconButton.tsx     # Botón circular glass puro
│   ├── MicButton.tsx           # Botón de micrófono con estado listening (80px en NewProductPage, 50px por defecto, sin animación ripple)
│   ├── CameraView.tsx          # Video feed + overlay de escaneo con corners animados
│   ├── ProductImage.tsx        # Imagen con placeholder (Package icon)
│   ├── Barcode.tsx             # Display de código de barras en pill
│   ├── StockBadge.tsx          # Badge color-coded: low (rojo), medium (amarillo), high (verde)
│   ├── VoiceWave.tsx           # 5 barras animadas de onda de voz (32px height, 4px width bars)
│   ├── SuccessCheck.tsx        # Overlay con check verde animado + ripple + mensaje
│   ├── LoadingDots.tsx         # 3 puntos que rebotan + texto
│   └── PhoneFrame.tsx          # Contenedor responsive: full-screen en mobile, mockup teléfono centrado en desktop (max-width 480px, border-radius 44px)
│
└── pages/                      # 3 pantallas lazy-loaded
    ├── SearchPage.tsx          # Ruta: / – TTS bienvenida + escaneo de cámara
    ├── ProductPage.tsx         # Ruta: /product/:barcode – TTS lee producto con delay de 2s en confirmación, si no existe redirige a /new/:barcode
    └── NewProductPage.tsx      # Ruta: /new/:barcode – Wizard paso a paso (5 pasos) con STT por campo + TTS al guardar. Botón mic 80px, voice wave 32px
```

---

## Flujo de Navegación

```
/                    → SearchPage (cámara + botón búsqueda + TTS "Apunta la cámara al código de barras")
/product/:barcode    → ProductPage (producto encontrado → registrar movimiento por voz)
                    → si no existe → redirige automáticamente a /new/:barcode
/new/:barcode        → NewProductPage (wizard de 5 pasos: Nombre → Marca → Categoría → Presentación → Unidad)
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

## API Contract

El frontend espera un backend con esta API. El archivo `src/api.ts` contiene el fetcher base.

### Base URL
```
VITE_API_URL环境变量，默认: https://voiceinvenoxi-api.onrender.com
```

### Endpoints

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

#### POST /api/tts
Convierte texto a voz usando ElevenLabs.

**Request body:**
```json
{
  "text": "Aceite de Oliva, 120 unidades en stock",
  "voice_id": "LnGOA2SxH2fX1e1iNzEp"
}
```

**Response (200):** Audio MP3 (`audio/mpeg`).

#### POST /api/stt
Convierte audio a texto usando ElevenLabs.

**Request:** Multipart form con campo `file` (audio/webm).

**Response exitosa (200):**
```json
{
  "text": "veinte unidades"
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
```

---

## Backend (FastAPI) - Guía de Implementación

### Estructura
```
backend/
├── main.py                 # FastAPI app, CORS, startup (create_all con try/except), routers
├── database.py             # SQLAlchemy async + asyncpg (load_dotenv, ssl=require, statement_cache_size=0)
├── models.py               # SQLAlchemy models (PG_UUID para columnas id/product_id)
├── schemas.py              # Pydantic schemas (model_validator para convertir UUID→str)
├── routers/
│   ├── products.py         # GET /api/products/:barcode, POST /api/products
│   ├── movements.py        # POST /api/movements
│   └── elevenlabs.py       # POST /api/tts, POST /api/stt (proxy a ElevenLabs)
├── requirements.txt        # fastapi, uvicorn, sqlalchemy, asyncpg, aiosqlite, httpx, python-multipart, python-dotenv
├── init.sql                # Script completo: tablas + 32 productos + movimientos (pegar en Supabase SQL Editor)
├── setup.sql               # Solo tablas (sin datos)
└── seed.sql                # Solo datos (después de setup.sql)
```

### CORS
El frontend se ejecuta en origen diferente. **NO usar wildcards como `*.vercel.app`** — FastAPI's `CORSMiddleware` hace match exacto y no soporta glob patterns. Usar `["*"]`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
```

### Lógica de Movimiento
Cuando se crea un movimiento:
- Si `type = 'in'`: `UPDATE products SET stock = stock + quantity WHERE id = product_id`
- Si `type = 'out'`: `UPDATE products SET stock = stock - quantity WHERE id = product_id` (validar que stock >= 0)

### Guía de Debugging Backend

Cuando el backend falla con 500, seguir este checklist:

1. **Probar `/api/health`** — Si falla, el backend no arrancó (error de deploy o startup).
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
DATABASE_URL=postgresql://user:pass@host:5432/voiceinvenoxi
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
ELEVENLABS_API_KEY=sk_...
```

---

## Comandos

```bash
# Frontend
npm install          # Instalar dependencias
npm run dev          # Desarrollo en http://localhost:5173
npm run build        # Build de producción
npm run lint         # Linting con oxlint
npm run preview      # Preview del build

# Backend (cuando exista)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Reglas para el Backend Agent

1. **Respeta el `ApiResponse<T>` wrapper** - Todos los endpoints de negocio deben devolver `{ success: boolean, data: T, message?: string }`. Los endpoints `/api/tts` y `/api/stt` son proxies a ElevenLabs y devuelven formatos diferentes (audio MP3 y `{ text }` respectivamente).
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

Para probar el frontend sin backend, ejecutar `npm run dev` y usar los mock data que están en `src/constants.ts`. El SearchPage simula escaneos aleatorios de los 5 productos mock.

**TTS/STT en desarrollo**: Sin backend, los hooks `useTTS` y `useSTT` fallback automáticamente a las APIs nativas del navegador (`window.speechSynthesis` y `SpeechRecognition`). No requieren configuración adicional.

Para probar con backend real, crear la variable de entorno `VITE_API_URL` apuntando a tu API.

---

## Tech Debt / Known Issues

1. **Mock data**: Los 5 productos en `constants.ts` son solo para desarrollo. El backend real los reemplazará.
2. **ElevenLabs + fallback Web Speech**: TTS (`useTTS.ts`) y STT (`useSTT.ts`) intentan ElevenLabs vía backend proxy. Si falla (desarrollo sin backend), caen automáticamente a `speechSynthesis` y `SpeechRecognition` nativos del navegador. Voice ID por defecto: `LnGOA2SxH2fX1e1iNzEp`.
3. **STT error handling**: `useSTT` expone un estado `error` con mensajes como "Permiso de micrófono denegado", "No se detectó voz", "Tiempo de espera agotado". Timeout de 10s en Web Speech API.
4. **Audio de confirmación con delay**: En `ProductPage`, el TTS de confirmación se reproduce con 2s de delay después del overlay de éxito.
5. **No hay autenticación**: El backend actual no requiere auth. Agregar JWT/API keys cuando sea necesario.
6. **No hay manejo offline**: La app asume conexión. Agregar service worker si se necesita offline.
7. **Imágenes de producto**: El campo `imageUrl` existe pero no hay upload de imágenes aún. Agregar endpoint POST /api/products/:id/image.
8. **Mobile responsive**: Las páginas usan CSS compacto con `min-height: 0` en contenedores flex, `env(safe-area-inset-bottom)` para notch, tamaños de imagen reducidos vía media queries `max-height: 700px`, y spacing fluido con `clamp()`.
9. **Supabase RLS deshabilitado**: Las tablas `products` y `movements` tienen RLS deshabilitado. El backend se conecta vía PostgreSQL directo (pooler puerto 6543) con el usuario `postgres`, que bypasea RLS. Si se necesita re-habilitar RLS, crear policies de INSERT/SELECT para el rol de conexión.
10. **Error handling en frontend**: `productApi.create` y `movementApi.create` propagan errores reales al UI (no hay catch silencioso). El `fetcher` extrae mensajes de error de `detail.message` de FastAPI. Timeout de 15s para cold-starts de Render.
