
<p align="center">
  <img src="assets/hack-the-track-banner.svg" alt="Hack the Track — Unleash the Data. Engineer Victory." width="100%" />
</p>

# Hackathon 2025: Race Telemetry AI Coach

Proyecto base y documentación para analizar telemetría de competición (GR Cup / SRO) y visualizar insights por sectores de pista, con IA orientada a coaching en tiempo real y post‑sesión.

## Índice
- [Banners rápidos (sitios oficiales)](#banners-rápidos-sitios-oficiales)
- [Descripción general](#descripción-general)
- [Documento técnico (MASTERDOC)](#documento-técnico-masterdoc)
- [Pistas y mapas](#pistas-y-mapas)
- [Fuentes de datos](#fuentes-de-datos)
- [Proveedores de telemetría](#proveedores-de-telemetría)
- [Cómo correr localmente](#cómo-correr-localmente)
- [Exportar a PDF](#exportar-a-pdf)
- [GitHub del autor](#github-del-autor)
- [Licencia](#licencia)
- [Créditos y referencias](#créditos-y-referencias)
- [Modo IA (Gemini) y seguridad](#modo-ia-gemini-y-seguridad)
- [Entrenamiento offline y artefactos](#entrenamiento-offline-y-artefactos)
- [Uso por fuente: Demo, CSV y WebSocket](#uso-por-fuente-demo-csv-y-websocket)
- [Instalación y despliegue (PC, tablet, vehículo)](#instalación-y-despliegue-pc-tablet-vehículo)
 - [Demostración en video (YouTube)](#demostración-en-video-youtube)
 - [Preguntas frecuentes (FAQ)](#preguntas-frecuentes-faq)

## Banners rápidos (sitios oficiales)

[![Hackathon 2025](https://img.shields.io/badge/Hackathon_2025-Docs-blue?style=for-the-badge)](#) 
[![SRO America](https://img.shields.io/badge/SRO-America-red?style=for-the-badge)](https://www.sroamerica.com/) 
[![GT World Challenge America](https://img.shields.io/badge/GT_World_Challenge-America-darkred?style=for-the-badge)](https://www.sro-motorsports.com/gt-world-challenge-america) 
[![GR Cup TGRNA](https://img.shields.io/badge/GR_Cup-TGRNA-black?style=for-the-badge)](https://www.grcupseries.com/) 

[![Barber Motorsports Park](https://img.shields.io/badge/Barber-Motorsports_Park-teal?style=for-the-badge)](https://barberracingevents.com/) 
[![Circuit of The Americas](https://img.shields.io/badge/COTA-Campus_Map-purple?style=for-the-badge)](https://circuitoftheamericas.com/campus-map/) 
[![Indianapolis Motor Speedway](https://img.shields.io/badge/IMS-Maps-orange?style=for-the-badge)](https://www.indianapolismotorspeedway.com/events/indy500/plan-ahead/maps-hub) 
[![Road America](https://img.shields.io/badge/Road_America-Maps-green?style=for-the-badge)](https://www.roadamerica.com/maps) 
[![Sebring Raceway](https://img.shields.io/badge/Sebring-Track_Maps-navy?style=for-the-badge)](https://www.sebringraceway.com/track-maps/) 
[![Sonoma Raceway](https://img.shields.io/badge/Sonoma-Maps-brown?style=for-the-badge)](https://www.sonomaraceway.com/fans/maps/) 
[![VIR](https://img.shields.io/badge/VIR-Configurations-darkgreen?style=for-the-badge)](https://virnow.com/track/configurations/)

[![MoTeC](https://img.shields.io/badge/MoTeC-Official-darkblue?style=for-the-badge)](https://www.motec.com.au/site/what-we-do) 
[![AIM Technologies](https://img.shields.io/badge/AIM-Technologies-black?style=for-the-badge)](https://www.aimtechnologies.com/) 
[![Bosch Motorsport](https://img.shields.io/badge/Bosch-Motorsport-grey?style=for-the-badge)](https://www.bosch-motorsport.com/) 
[![CAN bus](https://img.shields.io/badge/CAN-Bus_Overview-lightgrey?style=for-the-badge)](https://en.wikipedia.org/wiki/CAN_bus)

> Nota: Algunos circuitos no publican mapas de pista "oficiales" de libre acceso; se incluyen páginas oficiales de mapas del recinto o configuraciones. Donde exista un PDF oficial, se enlaza.

## Descripción general
Este repositorio acompaña la aplicación web "Race Telemetry AI Coach" (Vite) y la documentación técnica del proyecto. El objetivo es procesar telemetría (velocidad, RPM, frenos, aceleraciones, dirección, GPS, lapdist) y ofrecer:
- Segmentación por sectores S1.a/S1.b ... S3.b, coherente con los "análisis por secciones" del hackathon.
- Mapas de riesgo por sector y recomendaciones de conducción.
- Gráficas de vueltas, tiempos y eventos (frenada, aceleración, cambios de marcha).
- Integración con IA para estimar oportunidades de mejora y detectar anomalías de sensores (ECU/VBOX).

### IA y entrenamiento
- Entrenamiento offline sobre datasets locales (∼20GB) produce artefactos ligeros por pista (ej.: `public/DataFiles/models/riskModel.json`, `trackModels.json`).
- El runtime aplica esos artefactos: pesos y umbrales por componente, normalizaciones y longitudes por pista.
- Integración generativa opcional: si defines `VITE_API_KEY`, el servicio `Gemini` puede generar recomendaciones textuales; si no, se usa el motor de riesgo heurístico con calibración.

## Modo IA (Gemini) y seguridad
- Activación desde la UI:
  - En el Dashboard, barra superior, botón `Configurar IA`.
  - Pega tu clave en `Clave Gemini` y pulsa `Guardar`.
  - Indicador cambia a `Gemini listo`.
- Verificación en el asistente:
  - Pulsa `Analizar vuelta`. Si la IA está activa, aparece el badge `Fuente IA: Gemini`; si no, `Fuente IA: Motor de Riesgo`.
- Referencias de código:
  - Controles de UI: `components/Header.tsx:126-147`.
  - Detección de clave y fallback: `services/geminiService.ts:4-18` y `components/AIAssistant.tsx:31-36`.
  - Badge de fuente: `components/AIAssistant.tsx:59-63`.
- Seguridad:
  - La clave pegada en la UI se guarda en `localStorage` del navegador y NO se sube a GitHub.
  - Alternativa: definir `VITE_API_KEY` en el entorno del sistema o del proveedor de despliegue.
  - No incluyas la clave en archivos versionados.

## Entrenamiento offline y artefactos
- Objetivo: evitar procesar ∼20GB en tiempo real y reducir falsos positivos. Se procesan offline y se exportan artefactos por pista.
- Artefactos soportados por la app:
  - `public/DataFiles/models/riskModel.json`: pesos (`tire/engine/brake`) y umbrales (`engineHigh/engineCritical/tireWearHigh/fuel*`) por pista.
  - `public/DataFiles/models/trackModels.json`: normalizaciones (máximos realistas de `speed/rpm/brake/steer`), sectorización y longitud de vuelta.
- Carga y uso en runtime:
  - Loader de modelos: `services/modelLoader.ts:65-92`.
  - Motor de riesgo que aplica pesos/umbrales: `services/riskEngine.ts:86-95,167-182`.
  - Precarga al cambiar de pista: `components/Dashboard.tsx:23-28`.
- Cómo verificar que se aplican:
  - Modifica `riskModel.json` para tu pista (ej. Barber) y recarga: el panel del asistente mostrará los nuevos pesos/umbrales y cambiarán las alertas.
  - Panel informativo del asistente: `components/AIAssistant.tsx:66-70`.

## Uso por fuente: Demo, CSV y WebSocket
- Selección de fuente en el Header: `components/Header.tsx:75-84`.
- Demo:
  - Fuente `demo` usa datos simulados coherentes para mostrar UI y alertas.
- CSV (Barber incluido):
  - Coloca tu CSV y mapping:
    - `public/DataFiles/barber/R1_barber_telemetry_data.csv`
    - `public/DataFiles/barber/mapping.json`
  - Adaptador CSV: `services/telemetryAdapter.ts:95-190`.
  - Conversión de unidades y mapeo de columnas: `services/telemetryAdapter.ts:62-79,222-233`.
- WebSocket (tiempo real desde logger/ECU):
  - Adaptador WS: `services/telemetryAdapter.ts:235-260`.
  - Conecta tu logger que emita frames con el contrato `TelemetryDataPoint`.

## Instalación y despliegue (PC, tablet, vehículo)
- Desarrollo local:
  - `npm install`
  - `npm run dev` y abrir `http://localhost:5173/`.
- Build de producción y vista previa:
  - `npm run build`
  - `npm run preview` (servidor estático de prueba).
- Tablet del piloto (PWA/browser):
  - Servir el `dist/` en un servidor accesible vía Wi‑Fi del paddock/coche.
  - Abrir en Chrome/Safari y usar “Agregar a pantalla de inicio” (PWA) para acceso rápido.
  - Fuente `ws` si conectas al logger en el vehículo; `csv` para reproducir sesiones.
- Sin “ejecutable” nativo:
  - Esta app es web. No incluye `.exe/.apk` por defecto.
  - Opciones futuras: empaquetar con `Electron`/`Tauri` o usar un contenedor con `nginx` para servir `dist/` en dispositivos embebidos.
- Claves y seguridad:
  - Usa `Configurar IA` en la UI o variables de entorno del proveedor. Evita subir claves a Git.

## Demostración en video (YouTube)
- Objetivo: mostrar telemetría en vivo/reproducida, alertas de riesgo, análisis del asistente y la activación de Gemini.
- Guion sugerido:
  1) Inicio: Dashboard, explicar selector de fuente (`demo/csv/ws`) y selector de pista.
  2) CSV Barber: seleccionar `Source: csv` y pista `Barber`. Verás gauges, mapa y barra de progreso moviéndose.
  3) Artefactos offline: mostrar panel del asistente con `Modelo de riesgo cargado para Barber` (pesos/umbrales activos).
  4) IA: pulsar `Configurar IA`, pegar clave de `https://aistudio.google.com/apikey`, guardar. Pulsar `Analizar vuelta` y mostrar el badge `Fuente IA: Gemini` y las recomendaciones textuales.
  5) Alertas: provocar o explicar alertas visuales (motor/neumáticos/frenos/combustible) en `VisualAlerts`.
  6) Cierre: cambiar a otra pista con artefactos distintos (`cota`) y repetir análisis para comparar.
- Enlace del video:
  - Pega tu URL aquí cuando esté publicado: `https://youtu.be/TU_ENLACE_DEMO`
  - También puedes añadirlo al banner superior o a la sección “Descripción general”.

## Preguntas frecuentes (FAQ)
- ¿Qué clave debo usar y dónde la obtengo?
  - Es la API key de Gemini. Obténla en `https://aistudio.google.com/apikey`.
- ¿Se sube la clave a GitHub si la pego en la UI?
  - No. Se guarda en `localStorage` del navegador y no forma parte del repo. En producción usa variables de entorno (`VITE_API_KEY`).
- ¿Cómo borro la clave?
  - Dashboard → `Configurar IA` → vacía `Clave Gemini` → `Guardar`; o `localStorage.removeItem('gemini_api_key')` en consola.
- ¿Cómo preparo `riskModel.json` para una pista nueva?
  - Crea una entrada con `weights` y `thresholds` calibrados, por ejemplo:
    ```json
    {
      "mi_pista": {
        "weights": { "tire": 0.50, "engine": 0.28, "brake": 0.22 },
        "thresholds": {
          "overallHigh": 0.65,
          "engineHigh": 105,
          "engineCritical": 110,
          "tireWearHigh": 0.92,
          "tireWearMedium": 0.76,
          "fuelCriticalPct": 0.07,
          "fuelHighPct": 0.12
        }
      }
    }
    ```
  - La app aplicará estos valores en `services/riskEngine.ts:86-95,167-182`.
- ¿Cómo uso CSV vs. WebSocket?
  - CSV: coloca `public/DataFiles/<pista>/*.csv` y `mapping.json`. El adaptador está en `services/telemetryAdapter.ts:95-190`.
  - WebSocket: conecta tu logger que emita frames con el contrato `TelemetryDataPoint` (`services/telemetryAdapter.ts:235-260`).
- ¿Hay ejecutable (.exe/.apk)?
  - No incluido por defecto. Esta app es web (Vite/React). Puedes empaquetar con `Electron/Tauri` o servir `dist/` con `nginx`.
- ¿Cómo usar sin internet en el vehículo?
  - Sirve `dist/` en un hotspot local (paddock/vehículo). Abre en la tablet (Chrome/Safari) y usa “Agregar a pantalla de inicio”. Fuente `ws` para tiempo real.
- ¿Compatibilidad de dispositivos?
  - Navegadores modernos (Chrome 116+, Safari 16+, Edge). Pantallas 10–13" recomendadas para cockpit; modo `high/ultra` contraste en exteriores.

## Documento técnico (MASTERDOC)
Revisa el documento técnico completo en `raceTelemetryAi/MASTERDOC.md`, con diagramas UML, diseño de BD, flujos de datos y fórmulas del motor de riesgos.

## Pistas y mapas
- Barber Motorsports Park: https://barberracingevents.com/
- Circuit of The Americas (COTA): https://circuitoftheamericas.com/campus-map/
- Indianapolis Motor Speedway (IMS): https://www.indianapolismotorspeedway.com/events/indy500/plan-ahead/maps-hub
- Road America: https://www.roadamerica.com/maps
- Sebring International Raceway: https://www.sebringraceway.com/track-maps/
- Sonoma Raceway: https://www.sonomaraceway.com/fans/maps/
- Virginia International Raceway (VIR): https://virnow.com/track/configurations/

> Si necesitas track maps vectoriales, consulta también las secciones de "Créditos y referencias" al final.

## Fuentes de datos
- Serie SRO / GT World Challenge America (oficial): https://www.sro-motorsports.com/gt-world-challenge-america y https://www.sroamerica.com/
- GR Cup North America (TGRNA, oficial): https://www.grcupseries.com/ y comunicado 2025: https://pressroom.toyota.com/toyota-gazoo-racing-north-america-unveils-2025-gr-cup-series-schedule/
- Paquetes del hackathon 2025 (zip) por circuito: Barber, COTA, Indianapolis, Road America, Sebring, Sonoma, VIR.

## Proveedores de telemetría
- MoTeC (dash/logger/ECU): https://www.motec.com.au/site/what-we-do
- AIM Technologies (MX series, X‑Log, expansiones): https://www.aimtechnologies.com/mx-series/
- Bosch Motorsport (data loggers C60/C70/C80): Ejemplo C80: https://www.bosch-motorsport.com/content/downloads/Raceparts/en-GB/242692107319146635.html
- CAN bus (estándar de comunicación ECU): visión general: https://en.wikipedia.org/wiki/CAN_bus

## Cómo correr localmente
Requisitos:
- Node.js >= 18
- npm o pnpm

Pasos:
1. Instala dependencias: `npm install`
2. Arranca desarrollo: `npm run dev`
3. Abre `http://localhost:5173/` en el navegador.

Estructura de datos sugerida (ajústala a tus carpetas "Datos"):
```
data/
  barber-motorsports-park.zip
  circuito-de-las-americas.zip
  indianapolis.zip
  road-america.zip
  sebring.zip
  sonoma.zip
  Virginia International Raceway.zip
```

## Exportar a PDF
- Opción 1: Extensión "Markdown PDF" de tu IDE.
- Opción 2: `pandoc` (Windows):
  - Instala pandoc.
  - `pandoc README.md -o README.pdf`
  - `pandoc MASTERDOC.md -o MASTERDOC.pdf`

## GitHub del autor
- Autor: Bernardo Adolfo Gómez Montoya — `https://github.com/badolgm`.
- Comandos básicos (PowerShell):
  - `git init`
  - `git add .`
  - `git commit -m "docs: README y MASTERDOC iniciales"`
  - `git branch -M main`
  - `git remote add origin https://github.com/TU_USUARIO/NOMBRE_REPO.git`
  - `git push -u origin main`

## Licencia
Este proyecto se publica bajo licencia MIT. Consulta `raceTelemetryAi/LICENSE`.

## Créditos y referencias
- SRO / GT World Challenge America (oficial): https://www.sro-motorsports.com/gt-world-challenge-america
- SRO America: https://www.sroamerica.com/
- GR Cup (oficial): https://www.grcupseries.com/
- Comunicado TGRNA 2025 (oficial): https://pressroom.toyota.com/toyota-gazoo-racing-north-america-unveils-2025-gr-cup-series-schedule/
- COTA Campus Map (oficial): https://circuitoftheamericas.com/campus-map/
- Road America Map (oficial): https://www.roadamerica.com/maps
- Sebring Track Maps (oficial): https://www.sebringraceway.com/track-maps/
- Sonoma Maps (oficial): https://www.sonomaraceway.com/fans/maps/
- VIR Configurations (oficial): https://virnow.com/track/configurations/
- IMS Maps Hub (oficial): https://www.indianapolismotorspeedway.com/events/indy500/plan-ahead/maps-hub
- Barber — sitio oficial del parque/museo: https://barberracingevents.com/ y https://www.barbermuseum.org/barber-motorsports-park/
- MoTeC — página oficial: https://www.motec.com.au/site/what-we-do
- AIM Technologies — MX Series: https://www.aimtechnologies.com/mx-series/
- Bosch Motorsport — C80 data logger: https://www.bosch-motorsport.com/content/downloads/Raceparts/en-GB/242692107319146635.html
- CAN bus — descripción general: https://en.wikipedia.org/wiki/CAN_bus