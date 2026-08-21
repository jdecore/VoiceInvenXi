# StockXi — Control de stock para bodegas. Escanea, gestiona y sincroniza.

> **Antes VoiceInvenXi.** Nuevo nombre, misma misión: inventario de bodega sin planillas, sin tipeo, sin errores. Escaneas con la cámara, gestionas el stock y todo queda sincronizado. La voz es una ayuda, no una obligación.

Operario con celular → escanea código de barras → ve stock → registra movimientos → sincroniza con backend. Sin equipos especializados, sin fricción.

---

## El problema

| Lo que duele hoy | Consecuencia |
|---|---|
| Planillas mal llenadas | Errores de tipeo al cargar productos |
| Papeleo lento | Horas perdidas por conteo manual |
| Stock desactualizado | Ventas perdidas, compras de más, plata tirada |

Un error de tipeo en un conteo cuesta. StockXi lo elimina.

## La solución

| Acción | Cómo |
|---|---|
| **Escanea** el código con la cámara | `html5-qrcode` + overlay guiado, beep + haptics |
| **Gestiona** stock al instante | Entradas/salidas con confirmación visual y sonora |
| **Busca** por voz o texto | Búsqueda semántica (pgvector) con voz opcional |
| **Todo sincronizado** | Backend FastAPI + Postgres, sin equipos caros |

Cualquier operario, con su propio celular, maneja la bodega.

---

## Demo — Flujo en 20 segundos

1. Abres **StockXi** → cámara full-screen lista (`/`)
2. Apuntas al código → detecta barcode → `GET /api/products/:barcode`
3. Si existe → `/product/:barcode` ves stock y registras movimiento (voz o tap)
4. Si no existe → `/new/:barcode` wizard de 5 pasos para crearlo
5. Inventario (`/inventory`), Actividad (`/activity`) y Perfil quedan a un tap en la NavBar

---

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| **React** | 19.x | UI core |
| **TypeScript** | 6.x | Type safety |
| **Vite** | 8.x | Build tool |
| **react-router** | 7.x | Routing + lazy routes |
| **@tabler/icons-react** | 3.46.x | Iconos outline (migrado desde lucide-react) |
| **@formkit/auto-animate** | 0.8.x | Transiciones de listas / toasts |
| **html5-qrcode** | 2.3.8 | Escaneo de barras (ZXing interno) |
| **CSS custom** | — | `tokens.css` + `base.css` + `components.css` · Tema MD3 light, sin Tailwind runtime |

> **Colores:** `--surface: #f7f7f5` · brand `#F97316` · surface-1 `#F5F5F5` · textos `#1C1B1F` / `#6B6870` · success `#2E7D32` · error `#B3261E`

---

## Estructura

```
src/
├── main.tsx                    # StrictMode + App
├── App.tsx                     # ToastProvider + ErrorBoundary + BrowserRouter + PhoneFrame + lazy routes
├── constants.ts                # API_BASE (VITE_API_URL || https://stockxi-api.onrender.com)
├── api.ts                      # fetcher (timeout 120s, detail.message) + productApi + movementApi + searchApi + agentApi
├── types.ts                    # Product, Movement, CreateProductDTO, ApiResponse, SemanticSearchResult
│
├── lib/
│   ├── barcode.ts              # generateRandomBarcode() EAN-13 para simular scan en dev
│   ├── beep.ts                 # playScanBeep() Web Audio (desbloquea AudioContext en primer gesto)
│   ├── numbers.ts              # parseSpanishNumber — parser local fallback
│   ├── haptics.ts              # navigator.vibrate con feature-check
│   ├── stt.ts                  # POST /api/stt proxy
│   └── wake.ts                 # wakeBackend() para cold-start de Render
│
├── hooks/
│   ├── useSTT.ts               # Web Speech API preferido, MediaRecorder/ElevenLabs como fallback · timeout 10s
│   └── useTTS.ts               # speechSynthesis nativo
│
├── styles/
│   ├── tokens.css              # Design tokens MD3 light (#f7f7f5 como surface)
│   ├── base.css                # Reset + html 100dvh + safe-area + utilidades
│   └── components.css          # Page, Card, FAB, NavBar, Scan overlay, etc.
│
├── components/ui/              # 18 componentes
│   ├── PageLayout.tsx          # Scaffold único: header + scroll + NavBar flotante navExtra
│   ├── PhoneFrame.tsx          # Full-screen mobile / mockup 480x844 desktop + blobs ambient (solo desktop)
│   ├── NavBar.tsx              # 4 items flotantes bottom-[10%] con safe-area
│   ├── FAB.tsx                 # Mic flotante (mismo nivel que NavBar)
│   ├── Header.tsx              # Título + back
│   ├── Card.tsx / Input.tsx / Button.tsx
│   ├── StockBadge.tsx / StockValue.tsx / ProductRow.tsx
│   ├── Toast.tsx               # ToastProvider + ToastHost (vive dentro de PhoneFrame)
│   ├── VoiceWave.tsx / Skeleton.tsx / EmptyState.tsx / SuccessAnimation.tsx / ErrorBoundary.tsx / BootSplash.tsx
│   └── index.ts
│
└── pages/                      # 8 pantallas lazy
    ├── ScanPage.tsx            # / — cámara full-screen + viewfinder (NO usa surface, scan-bg-black)
    ├── SearchPage.tsx          # /search — búsqueda semántica voz/texto, auto-navega al mejor match si es por voz
    ├── ProductPage.tsx         # /product/:barcode — detalle + movimientos por voz + replay TTS
    ├── NewProductPage.tsx      # /new/:barcode — wizard 5 pasos con auto-avance por voz
    ├── ScanPageRedirect.tsx    # /new — simula scan aleatorio
    ├── InventoryPage.tsx       # /inventory — lista con ProductRow
    ├── ActivityPage.tsx        # /activity — historial con iconos in/out
    └── ProfilePage.tsx         # /profile — reseed embeddings + logout
```

---

## Pantallas

| Ruta | Página | Qué hace |
|---|---|---|
| `/` | **ScanPage** | Cámara `Html5Qrcode` full-screen, overlay esquinas + scan-line, hint pill, FAB voz (`/search?voice=true`), beep + haptics, fallback `EmptyState` si no hay cámara |
| `/search` | **SearchPage** | Input + `IconSearch`, `VoiceWave` si escucha, `Sparkles` sugerencias, debounce 400ms, `POST /api/search/semantic`, si viene por voz navega al mejor resultado y lo lee con TTS |
| `/product/:barcode` | **ProductPage** | `GET /api/products/:barcode` → si 404 redirige a `/new/:barcode`, card stock + `Volume2` replay, toggle `in/out`, FAB voz → `POST /api/agent/parse-movement` + fallback `parseSpanishNumber` → `POST /api/movements` + `SuccessAnimation` |
| `/new/:barcode` | **NewProductPage** | Wizard Nombre* → Marca → Categoría → Presentación → Unidad, un campo por paso, FAB grande, `parse-product` intenta autocompletar, `POST /api/products` |
| `/new` | **ScanPageRedirect** | Genera `EAN-13` aleatorio y navega a `/new/:barcode` |
| `/inventory` | **InventoryPage** | `GET /api/products`, lista `Card > ProductRow`, skeleton, empty |
| `/activity` | **ActivityPage** | `GET /api/movements`, `ArrowUpCircle/DownCircle` según tipo, `formatTimeAgo` |
| `/profile` | **ProfilePage** | Avatar, `POST /api/search/seed-embeddings` (regenerar vectores), logout toast |

**Responsive:** Mobile `<1024px` llena `100dvh` sin bordes; Desktop `≥1024px` mockup centrado `480x844` radius 44, sombra, blobs ambient. `viewport-fit=cover` + `env(safe-area-inset-*)`. NavBar siempre `absolute bottom-[10%]` — memoria muscular.

---

## Diseño UX

- **Tema:** MD3 light, brand `#F97316`, surface `#f7f7f5` (cálido, no blanco puro), superficies `F5F5F5/EEEEEE`, texto `#1C1B1F`.
- **Scan:** Recuadro `corner-pulse 2.4s` + `scan-line` glow naranja, `ring` al escanear. `AudioContext` se desbloquea en primer `pointerdown`.
- **Toasts:** Stack glass dentro de `PhoneFrame`, `aria-live="polite"`, auto-dismiss 3s.
- **Estados:** `Skeleton` shimmer, `EmptyState` reutilizable, `SuccessAnimation` check + ripple + haptics, `ErrorBoundary` con retry.
- **Iconos:** `@tabler/icons-react` outline `stroke 2`, 21 iconos (`IconScan`, `IconPackage`, `IconActivity`, etc.).
- **Accesibilidad:** `prefers-reduced-motion`, `aria-label` en FAB/NavBar.

---

## API Contract

Base: `VITE_API_URL` (default `https://stockxi-api.onrender.com` · ver `src/constants.ts` y `src/api.ts`).

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/products` | Lista productos `{ success, data: Product[] }` |
| `GET` | `/api/products/:barcode` | Producto por barcode · 404 `{ success:false }` |
| `POST` | `/api/products` | Crea producto · body `CreateProductDTO` |
| `GET` | `/api/movements` | Lista movimientos con `productName` |
| `POST` | `/api/movements` | Crea movimiento `in/out` y actualiza stock atómico |
| `POST` | `/api/search/semantic` | Búsqueda vectorial `{ query }` → `{ results: SemanticSearchResult[] }` |
| `POST` | `/api/search/seed-embeddings` | Genera embeddings faltantes `{ updated, total }` |
| `POST` | `/api/stt` | Proxy ElevenLabs `multipart file` → `{ text }` |
| `POST` | `/api/agent/parse-movement` | Cactus Needle `{ text }` → `{ quantity, type, confidence }` o 422 |
| `POST` | `/api/agent/parse-product` | Cactus Needle → campos producto o 422 |

Ver `AGENTS.md` para schemas, ejemplos JSON y debugging (SSL `require`, `PG_UUID`, `model_validator`, `statement_cache_size=0`).

---

## Variables de entorno

```bash
# Frontend (.env)
VITE_API_URL=https://stockxi-api.onrender.com

# Backend (Render)
DATABASE_URL=postgresql://user:pass@host:6543/postgres
ELEVENLABS_API_KEY=sk_...        # opcional, fallback a Web Speech
COHERE_API_KEY=...               # para embeddings (primario)
JINA_API_KEY=...                 # fallback embeddings
CORS_ORIGINS=https://tu-vercel.app  # opcional, default *
```

---

## Comandos

```bash
# Frontend (pnpm)
pnpm install          # instala
pnpm run dev          # http://localhost:5173
pnpm run build        # tsc -b && vite build
pnpm run lint         # oxlint
pnpm run preview      # preview build

# Backend (opcional)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Sin backend: `pnpm run dev` funciona igual — `useSTT`/`useTTS` caen a APIs nativas del navegador y `ScanPage` simula barcodes con `generateRandomBarcode()`.

---

## Arquitectura

```
Vercel (Frontend StockXi) → Render (FastAPI) → Supabase (Postgres + pgvector)
                                   ↕
                         Cohere/Jina (embeddings) + Cactus Needle (agent local)
```

Deploy: Frontend Vercel, Backend Render, DB Supabase (pooler 6543 `ssl=require`). CORS configurable. Health check con `SELECT 1`.

---

## Tech debt / Notas

- TTS/STT: sin backend usa `speechSynthesis` / `SpeechRecognition`; con backend proxy ElevenLabs.
- Sin auth ni offline (agregar JWT / service worker cuando toque).
- `imageUrl` existe pero sin upload aún.
- RLS Supabase deshabilitado (conexión `postgres` bypasea RLS).
- Semantic search requiere columna `embedding vector(1024)` + índice HNSW; llamar a `/seed-embeddings` tras crear productos.
- Cactus Needle `NEEDLE_CONFIDENCE_THRESHOLD=0.35` — bajo 0.35 devuelve 422 y el FE usa `parseSpanishNumber` local.

Ver `AGENTS.md` para guía completa de backend, debugging y reglas.

---

## Licencia

Privado — StockXi interno para bodegas.
