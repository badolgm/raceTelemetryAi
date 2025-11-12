# Hackathon 2025 — Envío del Proyecto

Este documento resume la entrega conforme a los requisitos oficiales.

## Categoría seleccionada
- Análisis en tiempo real: herramienta que simula la toma de decisiones del ingeniero de carrera y del piloto, con cálculo de riesgos por sector, ventana de parada en boxes y alertas visuales/voz.

## Conjunto(s) de datos utilizados
- Telemetría cruda en CSV de Barber (GR Cup), ejemplo: `public/DataFiles/barber/R1_barber_telemetry_data.csv`.
- Esquema/mapping de columnas y unidades: `public/DataFiles/barber/mapping.json`.
- Mapas de pista en PDF: carpeta `TrackMap/`.

## Descripción (texto)
- El proyecto es un dashboard de análisis de telemetría en tiempo real que:
  - Ingiere CSVs de telemetría mediante un adaptador profesional (`CsvFileAdapter`), normalizando unidades a métricas.
  - Define el modelo de pista (longitud y sectores) y calibración para activar riesgos de motor, frenos, neumáticos y combustible.
  - Calcula la ventana óptima de parada en boxes en función de riesgo y combustible, y emite alertas visuales y de voz.
  - Muestra progreso sobre el mapa del circuito y un mapa de riesgos por sector.

## Proyecto publicado (para que los jueces prueben)
- Ver DEPLOY.md para opciones de publicación (Vercel/Netlify/GitHub Pages). La app es SPA con `vite`.

## URL del repositorio de código
- Repositorio: [colocar aquí la URL]
- Si es privado, compartir con `testing@devpost.com` y `trd.hackathon@toyota.com`.

## Vídeo de demostración (~3 minutos)
- Guion sugerido:
  1) Presentación: objetivo y categoría.
  2) Carga de CSV y mapping (mostrar `mapping.json` y streaming en vivo).
  3) Explicar riesgos por sector y ventana de pit con un ejemplo real.
  4) Mostrar alertas visuales y de voz.
  5) Conclusiones: cómo ayuda al piloto y al equipo.

## Cómo ejecutar localmente
1. Requisitos: Node.js 18+.
2. Instalación: `npm install`.
3. Colocar CSV: `public/DataFiles/barber/R1_barber_telemetry_data.csv`.
4. Ajustar mapping: `public/DataFiles/barber/mapping.json` con nombres de columnas y unidades reales.
5. Ejecutar: `npm run dev` y abrir `http://localhost:5173/`.
6. En el header, seleccionar fuente `CSV` y pista `Barber`.

## Notas sobre coherencia y veracidad
- Longitud oficial Barber: `3674.66 m` (consistente en catálogo y modelo).
- Sectores suman la longitud oficial (sin huecos/solapes).
- Unidades convertidas a métricas automáticamente (mph→km/h, ft→m, fraction→%, psi→bar).