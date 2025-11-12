"""
generate_mock_csv — Crea un CSV de telemetría sintética para Barber

Genera un archivo CSV con encabezados compatibles con CsvFileAdapter:
  Laptrigger_lapdist_dls, Speed, rpm, Gear, at, pbrake_f, SteeringAngle

Los valores simulan una vuelta con variaciones de velocidad, freno y dirección.

Uso (Windows, PowerShell):
  .\.venv312\Scripts\python.exe tools\generate_mock_csv.py \
      -o public\DataFiles\barber\R1_barber_telemetry_data.csv

Uso (genérico):
  python tools/generate_mock_csv.py -o public/DataFiles/barber/R1_barber_telemetry_data.csv
"""

from __future__ import annotations
import argparse
import csv
import math
import random


def generate_row(i: int, points: int, lap_distance_m: float) -> dict:
  # Distancia a lo largo de la vuelta
  dist = (i / max(1, points - 1)) * lap_distance_m

  # Variación de velocidad (km/h) por secciones (senos superpuestos)
  speed_base = 90.0
  speed_wave1 = 70.0 * (math.sin(2 * math.pi * (i / points) * 1.8) + 0.8)
  speed_wave2 = 40.0 * (math.sin(2 * math.pi * (i / points) * 5.2 + 0.7))
  speed_noise = random.uniform(-2.0, 2.0)
  speed = max(30.0, speed_base + speed_wave1 + speed_wave2 + speed_noise)

  # Marcha aproximada según velocidad
  gear = max(1, min(6, int(speed // 35)))

  # RPM aproximadas
  rpm = int(1500 + speed * 35 + 200 * math.sin(2 * math.pi * (i / points) * 3.0))

  # Acelerador (%)
  thr_base = 40.0 + 30.0 * math.sin(2 * math.pi * (i / points) * 1.5)
  thr_corner = 20.0 * (1.0 - (abs(math.sin(2 * math.pi * (i / points) * 2.2))))
  throttle = max(0.0, min(100.0, thr_base + thr_corner))

  # Freno (bar), más alto cuando la velocidad decrece
  decel = max(0.0, (speed_base + 50.0) - speed)
  brake = max(0.0, min(90.0, decel * 0.6))

  # Ángulo de dirección (deg)
  steer = 35.0 * math.sin(2 * math.pi * (i / points) * 4.0)

  return {
    "Laptrigger_lapdist_dls": round(dist, 3),
    "Speed": round(speed, 2),
    "rpm": rpm,
    "Gear": gear,
    "at": round(throttle, 1),
    "pbrake_f": round(brake, 2),
    "SteeringAngle": round(steer, 2),
  }


def main():
  parser = argparse.ArgumentParser(description="Genera un CSV de telemetría sintética para Barber")
  parser.add_argument("-o", "--output", required=True, help="Ruta de salida del CSV")
  parser.add_argument("-p", "--points", type=int, default=800, help="Número de puntos (filas) de la vuelta")
  parser.add_argument("-d", "--lap-distance", type=float, default=3674.66, help="Longitud de la vuelta en metros")
  parser.add_argument("--seed", type=int, default=42, help="Semilla para reproducibilidad")
  args = parser.parse_args()

  random.seed(args.seed)

  headers = [
    "Laptrigger_lapdist_dls",
    "Speed",
    "rpm",
    "Gear",
    "at",
    "pbrake_f",
    "SteeringAngle",
  ]

  rows = [generate_row(i, args.points, args.lap_distance) for i in range(args.points)]

  # Crear carpeta si hace falta
  try:
    import os
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
  except Exception:
    pass

  with open(args.output, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(rows)

  print(f"CSV generado en: {args.output} ({args.points} puntos, {args.lap_distance} m)")


if __name__ == "__main__":
  main()