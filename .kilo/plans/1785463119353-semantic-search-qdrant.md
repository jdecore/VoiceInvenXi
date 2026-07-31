# RAG Demo con Qdrant: Búsqueda Semántica + Trace Visible

## Objetivo

Agregar un **botón Demo RAG separado** en `SearchPage` que use Qdrant para búsqueda semántica de productos, sin tocar Supabase. Incluir un **panel de trace RAG** visible que muestre en tiempo real el embedding generado, los scores de similitud y el camino de recuperación. La demo es para que empresas vean la tecnología de vectores en acción.

---

## Alcance

- **SearchPage actual**: intacta. Escaneo de barcode y botón mock siguen funcionando igual.
- **Nuevo botón**: "Buscar con IA" (o similar) en `SearchPage` que activa modo RAG.
- **Modo RAG**: input de texto + botón de micrófono. El usuario escribe o dicta una consulta en lenguaje natural sobre productos.
- **Backend**: endpoint `POST /api/search/semantic` que genera embedding del query, busca en Qdrant y devuelve top 5 productos rankeados.
- **Qdrant**: collection `products` con índice de vectores. Sin tocar Supabase.
- **Frontend**: muestra resultados con scores. Si score > 0.7, navega a `/product/:barcode`. Si no, sugiere crear producto.
- **Plus demo**: panel "RAG Trace" que muestra:
  - Query textual
  - Embedding generado (valores simplificados)
  - Top 3 resultados con scores y badge de confianza

---

## Fuera de scope

- Parseo de intención de voz (entrada/salida/cantidad) → requiere LLM, no es RAG puro
- Indexar movimientos o reglas de negocio
- Migrar Supabase a Qdrant
- Autenticación o multi-tenant

---

## Arquitectura

### Backend

```
backend/
├── routers/
│   └── search.py          # POST /api/search/semantic
├── qdrant/
│   ├── client.py          # Conexión a Qdrant Cloud
│   └── embeddings.py      # Generación de embeddings locales
├── requirements.txt       # Agregar: qdrant-client, sentence-transformers
└── main.py                # Incluir router search
```

**Embeddings:**
- Modelo: `all-MiniLM-L6-v2` (gratis, corre local, 384 dimensiones)
- Texto a indexar por producto: `"{name} {brand} {category} {presentation}"`
- Se indexa al crear producto en `POST /api/products`

**Collection Qdrant:**
```json
{
  "name": "products",
  "vectors": { "size": 384, "distance": "Cosine" },
  "payload": ["barcode", "name", "brand", "category", "presentation", "unit"]
}
```

**Endpoint nuevo:**
```
POST /api/search/semantic
Body: { "query": "aceite de oliva", "limit": 5 }
Response: { "success": true, "data": [{ "product": {...}, "score": 0.92 }] }
```

### Frontend

**SearchPage:**
- Botón "Buscar con IA" al lado del botón de escaneo actual
- Al activarlo: muestra input de texto + botón de micrófono
- Al enviar/transcribir: llama a `/api/search/semantic`
- Muestra resultados en lista con scores
- Si score > 0.7: navega a `/product/:barcode`
- Si no: TTS "No encontré ese producto, ¿querés crearlo?" + botón a `/new/:barcode`
- Panel "RAG Trace" expandible debajo de los resultados

**RAG Trace panel:**
```
🔍 RAG Internals
Query: "aceite de oliva"
Embedding (384 dims): [0.12, -0.45, ...]

Top matches:
1. Aceite de Oliva Extra Virgen - Score: 0.92 ✓
2. Aceite de Girasol - Score: 0.78
3. Vinagre de Oliva - Score: 0.65
```

---

## Decisiones

| Decisión | Elección | Razón |
|----------|----------|-------|
| Hosting Qdrant | Qdrant Cloud free tier | Sin ops, suficiente para demo |
| Modelo embeddings | all-MiniLM-L6-v2 | Gratis, local, decente para ES |
| Cuándo indexar | On-create + batch al deploy | Sincronización inmediata + backfill |
| Score mínimo | 0.7 | Balance recall/precisión |
| Fuente de verdad | Supabase | Qdrant es solo índice de búsqueda |

---

## Flujo de datos

```
Usuario escribe/dice: "aceite de oliva"
    ↓
Frontend: POST /api/search/semantic { query: "aceite de oliva" }
    ↓
Backend: 
  1. Genera embedding local con sentence-transformers
  2. Busca en Qdrant (top 5)
  3. Filtra por score > 0.5
  4. Devuelve productos rankeados
    ↓
Frontend: 
  1. Muestra RAG Trace con scores
  2. Si hay match > 0.7 → navega a /product/:barcode
  3. Si no → sugiere crear producto
```

---

## Pasos de implementación

1. **Backend - Qdrant setup**
   - Agregar `qdrant-client` y `sentence-transformers` a `requirements.txt`
   - Crear `backend/qdrant/client.py` (conexión a Qdrant Cloud)
   - Crear `backend/qdrant/embeddings.py` (modelo MiniLM)
   - Crear collection `products` al iniciar la app

2. **Backend - Indexación**
   - Modificar `routers/products.py`: al crear producto, generar embedding y upsert en Qdrant
   - Crear script `backend/scripts/reindex.py` para backfill inicial

3. **Backend - Endpoint de búsqueda**
   - Crear `routers/search.py` con `POST /api/search/semantic`
   - Lógica: embed(query) → search Qdrant → filtrar score → devolver

4. **Frontend - Botón RAG**
   - Agregar botón "Buscar con IA" en `SearchPage`
   - Estado para activar/desactivar modo RAG
   - Input de texto + micrófono
   - Llamada a `/api/search/semantic`

5. **Frontend - RAG Trace**
   - Componente `RagTrace.tsx` para mostrar internals
   - Mostrar query, embedding simplificado, top 3 resultados con scores
   - Indicador visual de confianza (verde >0.8, amarillo 0.6-0.8, rojo <0.6)

6. **Variables de entorno**
   - Backend: `QDRANT_URL`, `QDRANT_API_KEY`
   - Frontend: ninguna adicional

7. **Testing**
   - Probar búsquedas: "aceite", "leche entera", "jabón en barra", typos
   - Probar que SearchPage normal no se rompa
   - Probar fallback si Qdrant caído

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Qdrant caído | Fallback: si falla `/api/search/semantic`, mostrar error sin romper flujo normal |
| Embeddings malos para productos cortos | Incluir category + brand en el texto a embedear |
| Latencia de MiniLM en cold start | Cachear modelo en memoria; first request puede ser lenta |
| Confusión usuario | Botón claramente separado del flujo normal de escaneo |

---

## Validación

- [ ] Botón "Buscar con IA" aparece en SearchPage sin afectar flujo actual
- [ ] Al escribir "aceite de oliva" devuelve el producto correcto con score > 0.8
- [ ] RAG Trace muestra embedding y scores correctamente
- [ ] Si Qdrant falla, el resto de la app sigue funcionando
- [ ] Productos nuevos se indexan automáticamente al crearse
