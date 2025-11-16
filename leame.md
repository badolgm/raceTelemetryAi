# RaceTelemetry AI — Detalles del Proyecto (Devpost)

## Inspiration
- En pista bajo sol fuerte, las pantallas pierden legibilidad y los mapas suelen ser aproximados. Queríamos un copiloto visual que priorice seguridad y estrategia: trazado real, progreso exacto y alertas claras aun con reflejos o vibración.
- Buscamos una base extensible para sumar más circuitos y análisis sin rehacer la interfaz.

## What it does
- Muestra el trazado real del circuito en SVG (Barber integrado) con un cursor que avanza según la telemetría de distancia de vuelta.
- Estima riesgo por sector y dispara alertas visuales/sonoras para apoyar decisiones del piloto y del pit wall.
- Ofrece “Modo visual” con alto/ultra contraste para lectura directa bajo sol intenso.
- Presenta progreso de vuelta y barras de pit/sectores, conservando compatibilidad con datos existentes.

## How we built it
- Frontend: React + TypeScript + Vite; selector de contraste en `components/Header.tsx` y estilos globales en `index.html`.
- Visor de circuito (`components/CircuitViewer.tsx`):
  - Carga `public/DataFiles/config/trackPaths.json` para usar `viewBox` y `d` del SVG real.
  - Ajusta el tamaño del cursor según el `viewBox` y recorre el path con la proporción `Laptrigger_lapdist_dls / lapDistance` proveniente de la telemetría.
- Telemetría y riesgo:
  - Ingesta/adaptación en `services/telemetryAdapter.ts`.
  - Motor de riesgo en `services/riskEngine.ts` (velocidad, dinámica lateral/longitudinal, eventos) y alertas visuales en `components/VisualAlerts.tsx`.
  - Sonidos en `services/audioAlerts.ts`.
- Herramientas de datos: scripts en `tools/` para inspección/generación de CSV y mapeo de esquemas; rutas reales centralizadas en `trackPaths.json`.

## Challenges we ran into
- Alinear la distancia de vuelta (metros) con la longitud efectiva del path SVG (pixeles) para que el cursor “caiga” donde corresponde.
- Diseñar alto/ultra contraste que mejore legibilidad sin romper estilos existentes.
- Estructurar la configuración (`trackPaths.json`) para soportar múltiples circuitos con diferentes `viewBox` y trazados alternativos.

## Accomplishments that we're proud of
- Integración del trazado real de Barber desde SVG con cursor suave y escalado automático del marcador.
- Modo visual de alto/ultra contraste que mejora significativamente la lectura bajo sol.
- Arquitectura limpia y extensible: añadir COTA e Indy será tan simple como sumar sus `d` y `viewBox` al `trackPaths.json`.

## What we learned
- La normalización de unidades es crítica: mezclar pixeles (SVG) con metros (telemetría) exige una capa clara de conversión/escala.
- Pequeñas mejoras de UX (alto contraste, halos) tienen gran impacto en uso real en pista.
- Centralizar rutas reales en un config versionado acelera colaboración y despliegues.

## What's next for RaceTelemetry AI
- Añadir más circuitos (COTA, Indy) cuando tengamos sus `SVG`, `d` y `viewBox`.
- Colorear sectores por nivel de riesgo y añadir texturas/relieves para mejor lectura del mapa.
- Persistir el “Modo visual” en `localStorage` y seleccionar automáticamente según luz ambiente.
- Exportar/compartir perfiles de riesgo y sesiones para análisis post‑carrera.

## How to run
```bash
npm install
npm run dev
# Abrir http://localhost:5173/
```
- En el Header, activar “Modo visual” para alto/ultra contraste.
- En el visor del circuito, el cursor avanza con la telemetría; sin stream, usar datos de prueba con scripts en `tools/`.

## Links
- Repo: https://github.com/badolgm/raceTelemetryAi
- Mapas de referencia (PDF/PNG): carpeta `TrackMap/` del repositorio.

## Licencia
- Este proyecto se publica bajo licencia `MIT`. Consulta el archivo de licencia en `raceTelemetryAi/LICENSE` dentro del repositorio.

## Créditos y software/hardware de código abierto
- React — MIT License  
  https://github.com/facebook/react/blob/main/LICENSE
- TypeScript — Apache-2.0  
  https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt
- Vite — MIT License  
  https://github.com/vitejs/vite/blob/main/LICENSE
- Node.js — MIT License  
  https://github.com/nodejs/node/blob/main/LICENSE
- Python — PSF License  
  https://github.com/python/cpython/blob/main/LICENSE
- Estilos utilitarios compatibles con Tailwind CSS — MIT  
  https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE

### Cumplimiento de licencias
- Respetamos las licencias MIT/Apache/PSF indicadas y no distribuimos código modificado de terceros sin mantener sus avisos.
- El código propio del proyecto se publica en el repositorio bajo una licencia permisiva (p. ej., MIT), separado de dependencias externas.
- Los trazados SVG utilizados (por ejemplo, Barber) fueron generados/extraídos por nosotros para uso demostrativo; no incluimos marcas ni logotipos de terceros. Si se incorporan mapas adicionales, verificaremos y documentaremos sus licencias/atribución correspondiente.
- Servicios externos no abiertos (p. ej., APIs) se usan conforme a sus Términos de Servicio y no están cubiertos por licencias de código abierto.

> Si añadimos nuevas librerías o assets abiertos para COTA/Indy, actualizaremos esta sección con su licencia y atribución.