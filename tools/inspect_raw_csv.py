"""
CSV Inspector — Telemetría cruda

Analiza un CSV de telemetría (crudo) y genera una conjetura de mapeo a los
campos esperados por TelemetryDataPoint del proyecto:

  - Laptrigger_lapdist_dls (m)
  - Speed (km/h)
  - rpm
  - Gear
  - at (Throttle, %)
  - pbrake_f (Pressure, bar)
  - SteeringAngle (deg)

También estima el sampling rate si encuentra una columna de tiempo.

Uso:
  python tools/inspect_raw_csv.py -i "ruta/al.csv" -o out/schema_guess.json

Nota:
  Este script NO modifica datos; solo propone un mapeo y unidades.
"""

from __future__ import annotations
import argparse
import csv
import json
import math
from statistics import mean
from typing import Dict, List, Any, Optional


def is_float(s: str) -> bool:
    try:
        float(s)
        return True
    except Exception:
        return False


def read_csv_head(path: str, max_rows: int = 2000) -> Dict[str, Any]:
    with open(path, "r", newline="", encoding="utf-8") as f:
        sample = f.read(4096)
        f.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample)
        except Exception:
            # Fallback común (coma)
            dialect = csv.excel
        reader = csv.reader(f, dialect)
        rows: List[List[str]] = []
        for i, row in enumerate(reader):
            if i == 0:
                headers = row
                # Si el header parece numérico, asumir sin encabezado
                if all(is_float(h) for h in headers):
                    # Generar headers genéricos
                    headers = [f"col_{j}" for j in range(len(row))]
                    rows.append(row)
                continue
            rows.append(row)
            if len(rows) >= max_rows:
                break
    return {"headers": headers, "rows": rows}


def column_as_floats(rows: List[List[str]], idx: int) -> List[float]:
    vals: List[float] = []
    for r in rows:
        if idx >= len(r):
            continue
        v = r[idx]
        if v is None or v == "":
            continue
        try:
            vals.append(float(v))
        except Exception:
            # soportar formato con comas decimales
            try:
                vals.append(float(v.replace(",", ".")))
            except Exception:
                pass
    return vals


def is_monotonic_non_decreasing(vals: List[float]) -> float:
    if len(vals) < 5:
        return 0.0
    ok = 0
    total = 0
    prev = vals[0]
    for v in vals[1:]:
        total += 1
        if v >= prev:
            ok += 1
        prev = v
    return ok / max(1, total)


def guess_columns(headers: List[str], rows: List[List[str]]) -> Dict[str, Any]:
    # Precalcular columnas numéricas
    numeric_cols: Dict[int, List[float]] = {}
    for i, h in enumerate(headers):
        vals = column_as_floats(rows, i)
        if len(vals) > 0 and len(vals) >= max(10, len(rows)//10):
            numeric_cols[i] = vals

    def find_by_name(candidates: List[str]) -> Optional[int]:
        low_headers = [h.lower() for h in headers]
        for i, h in enumerate(low_headers):
            for c in candidates:
                if c in h:
                    return i
        return None

    guess: Dict[str, Any] = {
        "Laptrigger_lapdist_dls": None,
        "Speed": None,
        "rpm": None,
        "Gear": None,
        "at": None,
        "pbrake_f": None,
        "SteeringAngle": None,
        "units": {},
        "sampling_hz": None,
        "timestamp_col": None,
    }

    # Distancia de vuelta
    idx = find_by_name(["laptrigger_lapdist_dls", "lapdist", "lap_dist", "distance", "dist_m", "lapdistance"])
    if idx is None:
        # heurística: columna numérica con rango 300-7000 y monotónica
        best_score = -1
        best_idx = None
        for i, vals in numeric_cols.items():
            rng = (max(vals) - min(vals))
            mono = is_monotonic_non_decreasing(vals)
            score = mono * math.log10(max(1e-6, rng))
            if score > best_score and mono > 0.8 and rng > 200:
                best_score = score
                best_idx = i
        idx = best_idx
    if idx is not None:
        guess["Laptrigger_lapdist_dls"] = headers[idx]
        # Suponemos metros si el máximo está entre 300 y 7000
        vals = numeric_cols.get(idx, [])
        maxv = max(vals) if vals else 0
        unit = "m" if 300 <= maxv <= 7000 else "unknown"
        guess["units"]["Laptrigger_lapdist_dls"] = unit

    # Speed
    idx = find_by_name(["speed", "kmh", "km/h", "mph"]) 
    if idx is None:
        # rango típico velocidad
        best_idx = None
        best_width = -1
        for i, vals in numeric_cols.items():
            w = max(vals) - min(vals)
            if 50 < max(vals, default=0) < 400 and w > best_width:
                best_width = w
                best_idx = i
        idx = best_idx
    if idx is not None:
        vals = numeric_cols.get(idx, [])
        avg = mean(vals) if vals else 0
        unit = "km/h" if avg > 60 else "mph" if avg > 30 else "unknown"
        guess["Speed"] = headers[idx]
        guess["units"]["Speed"] = unit

    # rpm
    idx = find_by_name(["rpm"]) 
    if idx is None:
        for i, vals in numeric_cols.items():
            if 800 < mean(vals) < 12000 and max(vals) > 2000:
                idx = i
                break
    if idx is not None:
        guess["rpm"] = headers[idx]
        guess["units"]["rpm"] = "rpm"

    # Gear
    idx = find_by_name(["gear", "gearpos", "gear_position"]) 
    if idx is None:
        for i, vals in numeric_cols.items():
            if all(float(int(v)) == float(v) for v in vals[:50]) and 0 <= max(vals) <= 9:
                idx = i
                break
    if idx is not None:
        guess["Gear"] = headers[idx]
        guess["units"]["Gear"] = "index"

    # Throttle (%)
    idx = find_by_name(["throttle", "tps", "at", "throttle_pct"]) 
    if idx is None:
        for i, vals in numeric_cols.items():
            m, M = min(vals), max(vals)
            if (0 <= m <= 1 and 0.7 <= M <= 1.01) or (0 <= m <= 10 and 60 <= M <= 100):
                idx = i
                break
    if idx is not None:
        vals = numeric_cols.get(idx, [])
        m, M = (min(vals) if vals else 0, max(vals) if vals else 0)
        unit = "%" if M > 1.5 else "fraction"
        guess["at"] = headers[idx]
        guess["units"]["at"] = unit

    # Brake pressure (bar)
    idx = find_by_name(["brake", "brake_pressure", "pbrake_f", "bp", "brake_bar"]) 
    if idx is None:
        for i, vals in numeric_cols.items():
            # Presión típica en bar (0-100), descartar %
            if 0 <= min(vals) <= 1 and max(vals) <= 1.2:
                continue
            if 0 <= min(vals) <= 10 and 10 <= max(vals) <= 120:
                idx = i
                break
    if idx is not None:
        guess["pbrake_f"] = headers[idx]
        guess["units"]["pbrake_f"] = "bar"

    # Steering angle (deg)
    idx = find_by_name(["steer", "steering", "steeringangle", "swa"]) 
    if idx is None:
        for i, vals in numeric_cols.items():
            if -720 <= min(vals) <= 0 and 0 <= max(vals) <= 720:
                idx = i
                break
    if idx is not None:
        guess["SteeringAngle"] = headers[idx]
        guess["units"]["SteeringAngle"] = "deg"

    # Timestamp y frecuencia
    ts_idx = find_by_name(["timestamp", "time_ms", "time", "ts"])
    if ts_idx is not None:
        ts_vals = column_as_floats(rows, ts_idx)
        deltas = []
        for a, b in zip(ts_vals, ts_vals[1:]):
            d = b - a
            if d > 0:
                deltas.append(d)
        if deltas:
            avg_ms = mean(deltas)
            hz = 1000.0 / avg_ms
            guess["sampling_hz"] = round(hz, 2)
            guess["timestamp_col"] = headers[ts_idx]

    return guess


def main():
    parser = argparse.ArgumentParser(description="Inspección de CSV de telemetría cruda")
    parser.add_argument("-i", "--input", required=True, help="Ruta al CSV crudo")
    parser.add_argument("-o", "--output", default="out/schema_guess.json", help="Ruta de salida JSON")
    args = parser.parse_args()

    data = read_csv_head(args.input)
    headers = data["headers"]
    rows = data["rows"]
    guess = guess_columns(headers, rows)

    out = {
        "input": args.input,
        "headers": headers,
        "mapping_guess": guess,
        "notes": {
            "Speed": "Si unidad es mph, convertir: km/h = mph * 1.60934",
            "at": "Si unidad es fracción [0..1], convertir a % multiplicando por 100",
            "Laptrigger_lapdist_dls": "Debe estar en metros para coherencia con riskEngine",
        },
    }

    # Crear carpeta de salida si es necesario
    try:
        import os
        os.makedirs(os.path.dirname(args.output), exist_ok=True)
    except Exception:
        pass

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f"Esquema inferido guardado en: {args.output}")
    if guess.get("sampling_hz"):
        print(f"Frecuencia estimada: {guess['sampling_hz']} Hz (timestamp: {guess.get('timestamp_col')})")


if __name__ == "__main__":
    main()