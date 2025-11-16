
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