# **VoiceInvenXi**: Inventario por voz. Simple, rapido, sin errores

## El Problema

| | |
|---|---|
| Planillas mal llenadas | Errores de tipeo al registrar productos |
| Tiempo perdido en papeleo | Inventarios incorrectos que cuestan dinero |

Los metodos manuales abren la puerta a equivocaciones costosas. Cada error en un conteo puede significar perdidas dificiles de recuperar.

## La Solucion

| | |
|---|---|
| Escanea el codigo de barras con la camara | Habla para registrar entradas y salidas de stock |
| Todo se sincroniza al instante | Economico, sin equipos especializados |

VoiceInvenXi permite que cualquier operario con un celular maneje el inventario **sin planillas, sin tipeo, sin errores**.

## Stack

| Tecnologia | Uso |
|---|---|
| **React 19** + **TypeScript** | UI moderna y tipada |
| **Vite** | Build rapido |
| **react-router** | Navegacion |
| **motion** | Animaciones |
| **lucide-react** | Iconos |
| **CSS Modules** | Estilos con scope |

## Estructura

```
src/
├── App.tsx                     # Router principal + PhoneFrame
├── hooks/
│   ├── useSTT.ts               # Speech-to-Text (Web Speech + ElevenLabs fallback)
│   └── useTTS.ts               # Text-to-Speech (speechSynthesis + ElevenLabs fallback)
├── components/                 # 11 componentes Glass reutilizables
└── pages/
    ├── SearchPage.tsx          # Camara + escaneo de barras
    ├── ProductPage.tsx         # Ver producto + registrar movimiento por voz
    └── NewProductPage.tsx      # Wizard de 5 pasos para crear producto
```

## Pantallas

### SearchPage (`/`)
Escaneo de codigo de barras con la camara. Al detectar un barcode, busca el producto y navega a `/product/:barcode`. Si no existe, navega a `/new/:barcode`.

### ProductPage (`/product/:barcode`)
Muestra info del producto (nombre, marca, stock actual). El usuario toca el microfono y dice algo como "Entraron veinte cajas". La app detecta el numero, crea el movimiento, y confirma con audio despues de 2 segundos.

### NewProductPage (`/new/:barcode`)
Wizard de 5 pasos para crear un producto nuevo. Cada paso muestra un solo campo con microfono grande para dictar. Los campos opcionales se auto-avanzan al recibir voz.

**Pasos:**
1. Nombre del producto (requerido)
2. Marca
3. Categoria
4. Presentacion
5. Unidad de Medida

## Comandos

```bash
npm install          # Instalar dependencias
npm run dev          # Desarrollo en http://localhost:5173
npm run build        # Build de produccion
npm run lint         # Linting con oxlint
```

## Desarrollo sin Backend

La app funciona completamente sin backend. Los hooks `useTTS` y `useSTT` usan automaticamente las APIs nativas del navegador (`speechSynthesis` y `SpeechRecognition`). Los mock data en `src/constants.ts` simulan 5 productos de prueba.

## Variable de Entorno

```
VITE_API_URL=https://voiceinvenoxi-api.onrender.com
```
