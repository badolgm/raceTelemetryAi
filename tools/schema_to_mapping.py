"""
schema_to_mapping — Conversor del esquema del inspector a mapping.json

Lee el JSON generado por tools/inspect_raw_csv.py (schema_guess.json) y
produce un mapping.json compatible con CsvFileAdapter.

Uso:
  python tools/schema_to_mapping.py -i out/schema_guess.json \
      -o public/DataFiles/barber/mapping.json

Opcional:
  Puedes sobreescribir unidades detectadas con flags:
    --speed-unit [km/h|mph]
    --dist-unit [m|ft]
    --thr-unit [%|fraction]
    --brake-unit [bar|psi]

Nota:
  El conversor elimina campos no detectados (None) y mantiene sampling_hz
  si fue estimado por el inspector.
"""

from __future__ import annotations
import argparse
import json
from typing import Any, Dict


def build_mapping(guess: Dict[str, Any], overrides: Dict[str, str]) -> Dict[str, Any]:
  # Campos principales
  base = {
    key: guess.get(key)
    for key in [
      "Laptrigger_lapdist_dls",
      "Speed",
      "rpm",
      "Gear",
      "at",
      "pbrake_f",
      "SteeringAngle",
    ]
    if guess.get(key)
  }

  # Unidades
  units = dict(guess.get("units") or {})
  if overrides.get("Speed"):
    units["Speed"] = overrides["Speed"]
  if overrides.get("Laptrigger_lapdist_dls"):
    units["Laptrigger_lapdist_dls"] = overrides["Laptrigger_lapdist_dls"]
  if overrides.get("at"):
    units["at"] = overrides["at"]
  if overrides.get("pbrake_f"):
    units["pbrake_f"] = overrides["pbrake_f"]
  if overrides.get("SteeringAngle"):
    units["SteeringAngle"] = overrides["SteeringAngle"]

  if units:
    base["units"] = units

  # Frecuencia de muestreo si existe
  hz = guess.get("sampling_hz")
  if isinstance(hz, (int, float)) and hz > 0:
    base["sampling_hz"] = hz

  return base


def main():
  parser = argparse.ArgumentParser(description="Convierte schema_guess.json a mapping.json")
  parser.add_argument("-i", "--input", required=True, help="Ruta al schema_guess.json")
  parser.add_argument("-o", "--output", required=True, help="Ruta de salida mapping.json")
  parser.add_argument("--speed-unit", choices=["km/h", "mph"], help="Sobreescribir unidad de velocidad")
  parser.add_argument("--dist-unit", choices=["m", "ft"], help="Sobreescribir unidad de distancia")
  parser.add_argument("--thr-unit", choices=["%", "fraction"], help="Sobreescribir unidad de throttle")
  parser.add_argument("--brake-unit", choices=["bar", "psi"], help="Sobreescribir unidad de freno")
  parser.add_argument("--steer-unit", choices=["deg"], help="Sobreescribir unidad de dirección")
  args = parser.parse_args()

  with open(args.input, "r", encoding="utf-8") as f:
    data = json.load(f)

  guess = (data.get("mapping_guess") or {})
  if not guess:
    raise ValueError("mapping_guess no encontrado en el archivo de entrada")

  overrides = {}
  if args.speed_unit:
    overrides["Speed"] = args.speed_unit
  if args.dist_unit:
    overrides["Laptrigger_lapdist_dls"] = args.dist_unit
  if args.thr_unit:
    overrides["at"] = args.thr_unit
  if args.brake_unit:
    overrides["pbrake_f"] = args.brake_unit
  if args.steer_unit:
    overrides["SteeringAngle"] = args.steer_unit

  mapping = build_mapping(guess, overrides)

  # Crear carpeta si es necesario
  try:
    import os
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
  except Exception:
    pass

  with open(args.output, "w", encoding="utf-8") as f:
    json.dump(mapping, f, indent=2, ensure_ascii=False)

  print(f"mapping.json generado en: {args.output}")


if __name__ == "__main__":
  main()