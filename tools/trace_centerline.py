#!/usr/bin/env python3
"""
Extrae el "centro de pista" (skeleton) desde una imagen PNG/JPG del circuito
y genera un path SVG (atributo `d`) normalizado a 0..100.

Uso:
  python tools/trace_centerline.py TrackMap/Barber_Circuit_Map_img0.png --epsilon 2 --invert

Requisitos:
  pip install opencv-python numpy

Salida:
  - Imprime el atributo `d` por consola (para pegar en trackPaths.json)
  - Guarda out/trace_path.svg con el path renderizado
"""

import argparse
import os
import sys
from typing import List, Tuple

import numpy as np
import cv2
def compute_skeleton(bw: np.ndarray) -> np.ndarray:
    """
    Obtiene skeleton de 1 px.
    - Si está disponible ximgproc.thinning (Guo-Hall), lo usa.
    - Si no, recurre a un método morfológico iterativo.
    Devuelve máscara uint8 (0/1).
    """
    try:
        import cv2.ximgproc as ximgproc
        skel = ximgproc.thinning(bw)
        return (skel > 0).astype(np.uint8)
    except Exception:
        element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
        skel = np.zeros(bw.shape, np.uint8)
        img = bw.copy()
        while True:
            eroded = cv2.erode(img, element)
            temp = cv2.dilate(eroded, element)
            temp = cv2.subtract(img, temp)
            skel = cv2.bitwise_or(skel, temp)
            img = eroded.copy()
            if cv2.countNonZero(img) == 0:
                break
        return (skel > 0).astype(np.uint8)


def rdp(points: List[Tuple[float, float]], epsilon: float) -> List[Tuple[float, float]]:
    if len(points) < 3:
        return points

    def perp_dist(p, a, b):
        if a == b:
            return np.hypot(p[0]-a[0], p[1]-a[1])
        x0, y0 = p
        x1, y1 = a
        x2, y2 = b
        num = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2*y1 - y2*x1)
        den = np.hypot(y2 - y1, x2 - x1)
        return num / (den + 1e-9)

    def _rdp(pts):
        dmax = 0.0
        index = 0
        end = len(pts) - 1
        for i in range(1, end):
            d = perp_dist(pts[i], pts[0], pts[end])
            if d > dmax:
                index = i
                dmax = d
        if dmax > epsilon:
            res1 = _rdp(pts[:index+1])
            res2 = _rdp(pts[index:])
            return res1[:-1] + res2
        else:
            return [pts[0], pts[end]]

    return _rdp(points)


def neighbors8(x: int, y: int, mask: np.ndarray) -> List[Tuple[int, int]]:
    neigh = []
    h, w = mask.shape
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and mask[ny, nx]:
                neigh.append((nx, ny))
    return neigh


def find_endpoints(mask: np.ndarray) -> List[Tuple[int, int]]:
    pts = np.argwhere(mask)
    endpoints = []
    for y, x in pts:
        deg = len(neighbors8(x, y, mask))
        if deg == 1:
            endpoints.append((x, y))
    return endpoints


def trace_path(mask: np.ndarray) -> List[Tuple[int, int]]:
    endpoints = find_endpoints(mask)
    if not endpoints:
        # Si no hay endpoints, intenta comenzar desde el píxel más a la izquierda
        ys, xs = np.where(mask)
        if len(xs) == 0:
            return []
        start = (int(xs.min()), int(ys[np.argmin(xs)]))
    else:
        # toma el endpoint más cercano a la esquina inferior izquierda
        start = min(endpoints, key=lambda p: (p[0] + p[1]))

    path = [start]
    visited = set([start])
    prev = None
    current = start

    while True:
        neigh = [n for n in neighbors8(current[0], current[1], mask) if n not in visited]
        if not neigh:
            break
        if prev is None:
            nxt = neigh[0]
        else:
            v_prev = np.array([current[0] - prev[0], current[1] - prev[1]], dtype=float)
            best = None
            best_dot = -1e9
            for n in neigh:
                v = np.array([n[0] - current[0], n[1] - current[1]], dtype=float)
                dot = np.dot(v_prev, v) / (np.linalg.norm(v_prev) * np.linalg.norm(v) + 1e-9)
                if dot > best_dot:
                    best_dot = dot
                    best = n
            nxt = best
        path.append(nxt)
        visited.add(nxt)
        prev, current = current, nxt
    return path


def normalize_points(points: List[Tuple[int, int]]) -> List[Tuple[float, float]]:
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    minx, miny = min(xs), min(ys)
    maxx, maxy = max(xs), max(ys)
    w = maxx - minx
    h = maxy - miny
    if w == 0 or h == 0:
        return [(0.0, 0.0)]
    return [((x - minx) * 100.0 / w, (y - miny) * 100.0 / h) for x, y in points]


def to_svg_path(points: List[Tuple[float, float]]) -> str:
    if not points:
        return ""
    cmds = [f"M {points[0][0]:.3f},{points[0][1]:.3f}"]
    cmds += [f"L {x:.3f},{y:.3f}" for x, y in points[1:]]
    return " ".join(cmds)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image_path', help='Ruta a la imagen PNG/JPG con la pista')
    ap.add_argument('--epsilon', type=float, default=2.0, help='Tolerancia RDP para simplificar nodos')
    ap.add_argument('--invert', action='store_true', help='Invertir colores si la pista es clara sobre fondo claro')
    ap.add_argument('--use-hsv', action='store_true', help='Usar segmentación por saturación (HSV) para aislar trazos de color')
    args = ap.parse_args()

    # Carga en color para HSV (si se requiere), y en gris para umbral estándar
    img_color = cv2.imread(args.image_path, cv2.IMREAD_COLOR)
    img_gray = cv2.imread(args.image_path, cv2.IMREAD_GRAYSCALE)
    if img_gray is None or img_color is None:
        print('No se pudo leer la imagen:', args.image_path)
        sys.exit(1)

    if args.use_hsv:
        hsv = cv2.cvtColor(img_color, cv2.COLOR_BGR2HSV)
        s = hsv[:, :, 1]
        v = hsv[:, :, 2]
        # Aislar trazos de color (alta saturación y brillo razonable)
        mask = (s > 80) & (v > 50)
        bw = (mask.astype(np.uint8)) * 255
    else:
        # Umbral binario Otsu en escala de grises
        _, bw = cv2.threshold(img_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        if args.invert:
            bw = 255 - bw

    # Limpieza y conexión de pequeñas discontinuidades
    se = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    bw = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, se, iterations=1)

    # Skeleton (ximgproc.thinning si disponible, si no morfológico)
    sk = compute_skeleton(bw).astype(bool)

    # Trazado de camino
    path = trace_path(sk)
    if not path:
        print('No se pudo trazar el camino; intenta --invert o recorta la imagen alrededor de la pista.')
        sys.exit(2)

    # Simplificación
    pts = [(float(x), float(y)) for (x, y) in path]
    simplified = rdp(pts, epsilon=args.epsilon)
    norm = normalize_points([(int(x), int(y)) for (x, y) in simplified])
    d = to_svg_path(norm)

    # Guardar SVG de verificación
    os.makedirs('out', exist_ok=True)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="{d}" fill="none" stroke="black" stroke-width="0.8"/></svg>'
    with open('out/trace_path.svg', 'w', encoding='utf-8') as f:
        f.write(svg)

    print('\n=== SVG path d ===')
    print(d)
    print('\nGuardado: out/trace_path.svg')


if __name__ == '__main__':
    main()