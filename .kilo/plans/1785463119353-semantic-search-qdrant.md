# RAG + Qdrant: Búsqueda Semántica de Productos

## Resumen

Agregar búsqueda semántica sobre el catálogo de productos usando Qdrant como vector store.  
Esto convierte la `SearchPage` (hoy fake, elige mock aleatorio) en una búsqueda real por voz o texto, y agrega sugerencias inteligentes en el wizard de `NewProductPage`.

**Fuera de scope inicial**: parseo de intención de voz (mejor resolverlo con un LLM pequeño, no con RAG puro).

---

## Problema actual

1. `SearchPage` no busca: el botón elige un barcode mock aleatorio (`src/pages/SearchPage.tsx:51-62`).
2. `ProductPage` parsea voz con regex: `transcript.match(/(\d+)/)` solo extrae el número (`src/pages/ProductPage.tsx:65`). No entiende "registra salida de veinte cajas de aceite".
3. `NewProductPage` es un wizard rígido de 5 pasos sin sugerencias.

RAG no resuelve el punto 2 (parseo de intención). Un LLM pequeño sí.  
RAG **sí** resuelve el punto 1 (búsqueda semántica) y mejora el 3 (sugerencias).

---

## Arquitectura propuesta

### Backend (FastAPI)

```
backend/
├── routers/
│   ├── search.py          # POST /api/search/semantic
│   └── products.py        # Modificar POST para indexar en Qdrant
├── qdrant/
│   ├── client.py          # Conexión + helpers
│   └── embeddings.py      # Generación de embeddings
└── main.py                # Incluir router search
```

**Embeddings:**
- Modelo: `all-MiniLM-L6-v2` (gratis, multilingüe decente) o `text-embedding-3-small` de OpenAI.
- Texto a embedear por producto: `"{name} {brand} {category} {presentation}"`.
- Se indexa al crear/actualizar producto.

**Endpoint nuevo:**
```
POST /api/search/semantic
Body: { "query": "aceite de oliva", "limit": 5 }
Response: { "success": true, "data": [{ "product": {...}, "score": 0.89 }] }
```

**Endpoint modificado:**
- `POST /api/products` → después de crear, generar embedding y upsert en Qdrant.

### Frontend (React)

**SearchPage:**
- Input de texto + botón de micrófono.
- Al enviar/transcribir, llamar `POST /api/search/semantic`.
- Si hay match (>0.7): navegar a `/product/:barcode`.
- Si no hay match: TTS "No encontré ese producto, ¿querés crearlo?" + botón para ir a `/new/:barcode`.

**NewProductPage:**
- En cada paso, consultar Qdrant por productos similares.
- Mostrar hasta 3 sugerencias como chips clickeables (marca, categoría, unidad).
- Al hacer clic, autocompletar el campo actual.

---

## Decisiones de diseño

| Decisión | Opción | Elegida | Razón |
|----------|--------|---------|-------|
| Modelo de embeddings | OpenAI vs sentence-transformers | `all-MiniLM-L6-v2` | Gratis, sin latencia de red, decente para ES |
| Hosting Qdrant | Cloud vs self-hosted | Qdrant Cloud (free tier) | Sin ops, suficiente para catálogo chico/mediano |
| Cuándo indexar | On-create vs batch | On-create + batch al deploy | Sincronización inmediata + backfill inicial |
| Dimensión del vector | 384 (MiniLM) | 384 | Match con el modelo elegido |
| Score mínimo | 0.6 vs 0.7 vs 0.8 | 0.7 | Balance entre recall y precisión para nombres cortos |

---

## Flujo de datos

```
Usuario dice "aceite de oliva"
    ↓
useSTT → transcript = "aceite de oliva"
    ↓
POST /api/search/semantic { query: "aceite de oliva" }
    ↓
Backend: embed(query) → search Qdrant → top 5 productos
    ↓
Response: [{ barcode: "7790123456789", score: 0.92, ... }]
    ↓
Frontend: si score > 0.7 → navigate(`/product/${barcode}`)
    ↓
ProductPage carga y TTS lee el producto
```

---

## Collection de Qdrant

```json
{
  "name": "products",
  "vectors": {
    "size": 384,
    "distance": "Cosine"
  },
  "payload": {
    "barcode": "string",
    "name": "string",
    "brand": "string",
    "category": "string",
    "presentation": "string",
    "unit": "string"
  }
}
```

Punto clave: guardar `barcode` en el payload para navegación directa, sin necesidad de consultar PostgreSQL después del search.

---

## Migración / Backfill

1. Crear collection en Qdrant.
2. Leer todos los productos de PostgreSQL.
3. Generar embedding para cada uno y upsert en Qdrant.
4. Script de mantenimiento: re-indexar productos modificados en las últimas 24h (por si falló el on-create).

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Embeddings malos para productos cortos | Agregar contexto: category + brand al texto a embedear |
| Qdrant caído | Fallback: si falla `/api/search/semantic`, volver al comportamiento mock actual |
| Latencia de generación de embeddings | Cachear embeddings por producto; usar modelo chico (MiniLM) |
| Productos con nombres idénticos | Incluir brand/category en el embedding para diferenciar |

---

## Pasos de implementación

1. **Backend - Qdrant setup**
   - Agregar `qdrant-client` y `sentence-transformers` a `requirements.txt`.
   - Crear `backend/qdrant/client.py` y `backend/qdrant/embeddings.py`.
   - Crear collection con índice HNSW.

2. **Backend - Indexación de productos**
   - Modificar `routers/products.py`: al crear producto, generar embedding y upsert en Qdrant.
   - Crear endpoint `POST /api/products/reindex` (admin) para backfill.

3. **Backend - Búsqueda semántica**
   - Crear `routers/search.py` con `POST /api/search/semantic`.
   - Lógica: embed(query) → search Qdrant (top 5) → filtrar por score > 0.7 → devolver productos.

4. **Frontend - SearchPage con voz**
   - Reemplazar lógica de mock aleatorio por llamada a `/api/search/semantic`.
   - Agregar input de texto como fallback.
   - Mostrar resultados en lista; si hay 1 claro (>0.8), auto-navegar.

5. **Frontend - Sugerencias en wizard**
   - En `NewProductPage`, consultar Qdrant en cada paso con el texto ingresado hasta el momento.
   - Mostrar chips de sugerencias clickeables.

6. **Testing**
   - Probar con productos existentes: "aceite", "leche", "jabón", "arroz".
   - Probar typos: "azeite", "leche entera", "papel".
   - Probar empty state: Qdrant caído → fallback a mock.

---

## Métricas de éxito

- Búsqueda por voz/texto funciona para >80% de los productos del catálogo con score >0.7.
- Latencia p95 de `/api/search/semantic` < 500ms (modelo local + Qdrant Cloud).
- 0% de regresión en flujos existentes (escaneo de barcode, creación de producto).

---

## No incluido (out of scope)

- Parseo de intención de voz (entrada/salida/cantidad) → requiere LLM, no RAG.
- Chat conversacional sobre inventario → requiere LLM + RAG combinado.
- Historial de movimientos como contexto para búsqueda → futura iteración.
