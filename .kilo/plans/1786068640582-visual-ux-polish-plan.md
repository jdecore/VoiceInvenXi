# Plan: Pulido Visual/UX "Pro" — VoiceInvenXi (adaptado al estado actual)

## RESTRICCIÓN DURA (recordatorio del usuario)
**NO ejecutar `npm install` ni añadir NINGUNA dependencia nueva al `package.json`.**
Todo se logra con el stack ya instalado (`react`, `react-dom`, `react-router`, `motion`, `lucide-react`, `html5-qrcode`) + CSS Modules + APIs nativas del navegador (`navigator.vibrate`, Web Audio ya usado, `prefers-reduced-motion`). Los assets `favicon.svg`/`icons.svg` ya existen en `public/`.

## Contexto
El proyecto ya tiene base pulida (glassmorphism, `motion`, scanner `html5-qrcode`, STT/TTS con fallback, wizard de 5 pasos, overlays de éxito, `useTTS` con `speechSynthesis` nativo). Objetivo: **elevar la percepción de calidad profesional** sin añadir dependencias ni gastar recursos.

Decisiones confirmadas con el usuario:
- **Enfoque:** solo Pulido visual/UX (no nuevas funciones de negocio).
- **Dependencias:** ninguna nueva (recomendación). Solo `motion`, `lucide-react`, CSS Modules y APIs nativas (`navigator.vibrate`, Web Audio ya existente, `prefers-reduced-motion` ya existe).
- **Backend:** no. Solo frontend / `MOCK_PRODUCTS`. Degrada bien si hay API.

## Estado actual relevante (verificado)
- `src/styles/animations.css` **ya define** `@keyframes shimmer`, `pulse`, `ripple`, `glowPulse`, `waveBar`, `dotBounce`, `scanLine`, `checkDraw` → **reusar, no redefinir**.
- `src/components/GlassButton.tsx` ya aplica `styles.focusVisible` (focus ring). Falta en `MicButton`, `GlassIconButton` y botones crudos de páginas.
- `src/components/PhoneFrame.module.css`: `.phoneFrame` tiene `background: var(--color-bg)` sólido. El fondo ambiente debe ir en una capa **detrás** del PhoneFrame (wrapper externo en `App`), no dentro.
- `public/favicon.svg` y `public/icons.svg` **ya existen**. `index.html` NO los referencia y NO hay `manifest.webmanifest`.
- `src/types.ts` ya tiene `SemanticSearchResponse`/`SemanticSearchResult`; `SearchPageText` ya usa `searchApi.semanticSearch`.
- NO existen aún: `Toast`, `SplashScreen`, `ErrorBoundary`, `Skeleton`, `EmptyState`, `lib/haptics.ts`.
- `globals.css` ya tiene bloque `prefers-reduced-motion` que anula animaciones → las nuevas deben respetarlo.

---

## Tareas (ordenadas por impacto/costo)

### 1. Fondo ambiente animado (profundidad)
- Capa fija detrás de `PhoneFrame`: 2–3 "blobs"/aurora con gradiente que se desplazan lento vía `@keyframes` (CSS, `transform`/`opacity`), respetando `prefers-reduced-motion` (degradar a estático).
- Implementar en `App.tsx` (wrapper) + `src/App.module.css` (o `globals.css`). El `PhoneFrame` queda encima y mantiene su bg sólido/transparente.

### 2. Splash / intro de marca
- Pantalla de arranque breve (logo `VoiceInvenXi` + glow) animada con `motion`, una sola vez al abrir, antes del router, desvaneciéndose (~1.2s). Respetar `prefers-reduced-motion` (mostrar y ocultar sin animar).
- Nuevo `src/components/SplashScreen.tsx` + `.module.css`. Integrar en `App.tsx` con estado `showSplash`.

### 3. Sistema de Toasts cohesivo
- `ToastProvider` (context) + `useToast()` para reemplazar errores/validaciones visibles dispersas (`NewProductPage` `validationError`, `SearchPageText` `error`).
- Toasts glass, apilados, icono (check/alert), auto-dismiss, animación `motion`, `aria-live="polite"`.
- Nuevo `src/components/Toast.tsx` + `.module.css` + `src/hooks/useToast.ts`. Envolver en `App.tsx`.
- Migrar: `NewProductPage` (mostrar toast además de seguir hablando el error con TTS → feedback dual) y `SearchPageText` (error de búsqueda → toast). Mantener `LoadingDots` para estados inline cortos.

### 4. Skeleton loaders (reusar `shimmer`)
- Nuevo `src/components/Skeleton.tsx` + `.module.css` usando el `@keyframes shimmer` **ya existente** (no redefinir).
- Usar en `ProductPage` (estado `isLoading`) y en `SearchPageText` (resultados `loading`) en lugar de `LoadingDots` para contenido estructurado.

### 5. Feedback háptico (sin deps)
- Nuevo `src/lib/haptics.ts`: wrapper de `navigator.vibrate(...)` con feature-check (`'vibrate' in navigator`) y no-op en desktop/https-fail.
- Usar en: `CameraView.playScanBeep` (al escanear), `MicButton` (toggle listening), `SuccessCheck` (al éxito).

### 6. Error Boundary
- Nuevo `src/components/ErrorBoundary.tsx` (clase) con fallback glass elegante + botón "Reintentar" (`window.location.reload()`).
- Envolver `PhoneFrame` en `App.tsx`.

### 7. Pasada de accesibilidad
- Añadir `:focus-visible` global en `globals.css` (outline con token de acento) para `MicButton`, `GlassIconButton` y botones crudos de páginas (`SearchPage` text/search buttons). GlassButton ya lo cubre.
- `VoiceWave` → `aria-hidden="true"`. Toasts → `aria-live`. `MicButton` ya tiene `aria-label`.

### 8. Pulido del momento de éxito
- En `SuccessCheck`: añadir "particle burst" ligero con `motion` (4–6 partículas) + haptic (tarea 5). Reusar estética de `ripple`/`pulse`. Sin librerías.

### 9. Empty states consistentes
- Nuevo `src/components/EmptyState.tsx` + `.module.css` (icono lucide + título + subtítulo). Refactorizar el empty state inline de `SearchPageText` para usarlo; reutilizable para futuras listas.

### 10. Manifest PWA (reusar assets existentes)
- Crear `public/manifest.webmanifest` apuntando a `public/favicon.svg` y `public/icons.svg` ya existentes (name, `theme_color`, `background_color`, `display: standalone`, icons).
- Editar `index.html`: `<link rel="icon" href="/favicon.svg">` y `<link rel="manifest" href="/manifest.webmanifest">`.
- **Sin** service worker (respeta "sin offline" de AGENTS.md). Cero nuevas deps (vite sirve `/public` en raíz).

---

## Archivos a crear
- `src/components/SplashScreen.tsx` (+ css)
- `src/components/Toast.tsx` (+ css) + `src/hooks/useToast.ts`
- `src/components/Skeleton.tsx` (+ css)
- `src/components/EmptyState.tsx` (+ css)
- `src/components/ErrorBoundary.tsx`
- `src/lib/haptics.ts`
- `public/manifest.webmanifest`

## Archivos a editar
- `src/App.tsx` (Splash, ToastProvider, ErrorBoundary, fondo ambiente wrapper)
- `src/App.module.css` o `src/styles/globals.css` (fondo ambiente, `:focus-visible`)
- `src/components/SuccessCheck.tsx` + css (particles + haptic)
- `src/components/CameraView.tsx`, `MicButton.tsx` (haptic vía `lib/haptics`)
- `src/pages/NewProductPage.tsx`, `src/pages/SearchPageText.tsx` (migrar a toast / EmptyState)
- `index.html` (favicon + manifest)

## Riesgos / notas
- `navigator.vibrate` y Web Audio solo en táctil/https → feature-check obligatorio.
- `prefers-reduced-motion` debe desactivar blobs/splash/particles/shimmer (degradar a estático). `globals.css` ya anula `animation/transition`; añadir `animation: none` a las nuevas capas si es necesario.
- No redefinir `@keyframes` ya existentes (`shimmer`, etc.).
- No romper lazy routes ni flujo de navegación.
- Manifest/favicon: usar SVGs existentes; no añadir binarios pesados.

## Validación
- `npm run lint` (oxlint) sin errores.
- `npm run build` (tsc + vite) exitoso; verificar que el tamaño de bundle no crece de forma significativa.
- `npm run dev` + revisión manual en viewport móvil (DevTools):
  - Splash al arrancar; fondo ambiente detrás del phone frame.
  - Scanner → toast + haptic; wizard → toast/empty; éxito con haptic + partículas.
  - Forzar error para ver ErrorBoundary.
  - Activar `prefers-reduced-motion` → todo degrada a estático.
  - `index.html` referencia favicon + manifest; manifest válido (icons resuelven).
