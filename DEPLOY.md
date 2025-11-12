# Despliegue — Opciones para publicar el proyecto

La app es una SPA basada en `vite`. Puedes publicarla fácilmente en:

## Opción A: Vercel
1. Crear cuenta en Vercel y conectar el repo.
2. Configurar build:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Desplegar. Vercel detecta `vite` automáticamente.
4. Verifica la URL pública y compártela en el envío.

## Opción B: Netlify
1. Crear cuenta en Netlify y conectar el repo.
2. Configurar build:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
3. Desplegar y probar.

## Opción C: GitHub Pages
1. Ejecutar `npm run build` para generar `dist/`.
2. Publicar `dist/` en Pages (puedes usar la rama `gh-pages` o acción de GitHub).
3. Asegúrate de que los paths de recursos (PDFs en `/TrackMap/*`) se sirvan correctamente; en Pages puede requerir rutas relativas si no está en raíz.

## Verificación post-despliegue
- Probar que se cargan los PDFs de `TrackMap/` y los archivos en `public/DataFiles/*`.
- Probar el selector de fuente `CSV` y que el adaptador lea correctamente:
  - CSV: `/DataFiles/barber/R1_barber_telemetry_data.csv`
  - Mapping: `/DataFiles/barber/mapping.json`
- Verificar alertas visuales y voz (si el navegador permite audio).

## Troubleshooting
- Si el CSV no carga en producción, verifica las rutas y que los archivos estén incluidos en el artefacto.
- En GitHub Pages, evita rutas absolutas (usa relativas o configura base en `vite.config.ts`).