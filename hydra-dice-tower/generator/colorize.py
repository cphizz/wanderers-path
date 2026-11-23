"""
Give each part per-vertex colours (purple scales, cream belly/horns/claws,
white eyes with dark pupils, pink mouth) for renders and the Blender scene.
Writes blender/parts_colored/<part>.ply  (print pose; placement in stl/assembly.json).
These colours are for visuals only - the STL files are what you print.
"""
import json
import os

import numpy as np
import trimesh

import hydra_model as hm

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STL = os.environ.get('HYDRA_STL', os.path.join(ROOT, 'stl'))
OUT = os.path.join(ROOT, 'blender', 'parts_colored')

PURPLE = np.array([0.50, 0.33, 0.74])
PURPLE_DARK = np.array([0.36, 0.22, 0.56])
CREAM = np.array([0.97, 0.86, 0.66])
WHITE = np.array([0.97, 0.97, 0.97])
PUPIL = np.array([0.06, 0.04, 0.10])
PINK = np.array([0.93, 0.50, 0.55])
TONGUE = np.array([0.88, 0.36, 0.45])
TRAY = np.array([0.62, 0.52, 0.70])


def blend(base, col, w):
    return base * (1 - w[:, None]) + col[None, :] * w[:, None]


def body_colors(pw):
    c = np.tile(PURPLE, (len(pw), 1))
    # darker spots/patches on the back like the reference
    sp = hm.scale_relief(pw * 0.35 + 11.0, cell=6.0, amp=1.0)
    c = blend(c, PURPLE_DARK, hm.smoothstep(0.55, 0.35, sp) * 0.45)
    c = blend(c, CREAM, hm.smoothstep(0.35, 0.6, hm.body_belly_weight(pw)))
    c = blend(c, CREAM, hm.smoothstep(1.2, 0.2, hm.body_spikes(pw)))
    c = blend(c, CREAM, hm.smoothstep(0.8, 0.0, hm.claws_sdf(pw)))
    inside = hm.body_cavity(pw) < 1.5
    c[inside] = PURPLE_DARK
    return c


def neck_colors(nk, pw):
    c = np.tile(PURPLE, (len(pw), 1))
    sp = hm.scale_relief(pw * 0.35 + 5.0, cell=6.0, amp=1.0)
    c = blend(c, PURPLE_DARK, hm.smoothstep(0.55, 0.35, sp) * 0.4)
    d, idx = nk.tube(pw, 'outer')
    c = blend(c, CREAM, hm.smoothstep(0.3, 0.55, hm.neck_belly_weight(nk, pw, idx)))
    c = blend(c, CREAM, hm.smoothstep(1.0, 0.2, nk.horn_sdf(pw)))
    mouth = (nk.mouth_cavity(pw) < 1.2)
    c[mouth] = PINK
    chan = (hm.neck_cavity(nk, pw) < 1.2) & ~mouth
    c[chan] = PURPLE_DARK
    c = blend(c, TONGUE, hm.smoothstep(0.8, 0.0, nk.tongue(pw)))
    c = blend(c, WHITE, hm.smoothstep(0.8, 0.0, nk.fangs(pw)))
    for ec, look in nk.eyes_info():
        de = hm.norm(pw - ec)
        eye = (de < hm.EYE_R + 0.9) & ~mouth & ~chan
        c[eye] = WHITE
        pc = ec + look * hm.EYE_R
        dp = hm.norm(pw - pc)
        c[eye & (dp < 6.6)] = PUPIL
        # two catch-lights
        hl1 = ec + hm.unit(look + 0.35 * nk.U + 0.25 * nk.S * np.sign((ec - nk.T) @ nk.S)) * hm.EYE_R
        c[eye & (hm.norm(pw - hl1) < 1.9)] = WHITE
        hl2 = ec + hm.unit(look - 0.25 * nk.U - 0.15 * nk.S * np.sign((ec - nk.T) @ nk.S)) * hm.EYE_R
        c[eye & (hm.norm(pw - hl2) < 0.9)] = WHITE
    return c


def dice_paths():
    """Centre-line of a die travelling from each mouth, down the neck and the
    inlet tube inside the body, along the ramp and out into the tray."""
    hm.body_cavity(np.zeros((1, 3)))          # builds hm.INLETS
    out = {}
    for nk, inlet in zip(hm.NECKS, hm.INLETS):
        pts = [nk.T + 42 * nk.B, nk.T + 20 * nk.B]
        it = int(np.argmin(hm.norm(nk.curve - nk.T)))
        pts += [q for q in nk.curve[it:nk.ij:-10]]           # down the neck to the joint
        c = inlet.curve
        ij = int(np.argmin(hm.norm(c - nk.J)))
        for q in c[ij::8]:                                    # down the inlet tube
            fl = hm.floor_profile(np.array([q[1]]))[0]
            if q[2] < fl + 19.5:
                break
            pts.append(q)
        last = pts[-1]
        for y in np.linspace(last[1] - 4, -98, 40):           # along the ramp, out of the rump
            w = hm.smoothstep(last[1], last[1] - 25, y)
            x = last[0] * (1 - w)
            z = max(hm.floor_profile(np.array([y]))[0] + 13.0, 2.4 + 12.0)
            pts.append(np.array([x, y, z]))
        out[nk.name] = [[round(float(v), 2) for v in p] for p in pts]
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(STL, 'dice_paths.json'), 'w') as f:
        json.dump(dice_paths(), f)
    asm = json.load(open(os.path.join(STL, 'assembly.json')))
    for name, M in asm.items():
        M = np.array(M)
        m = trimesh.load(os.path.join(STL, f'{name}.stl'))
        pw = m.vertices @ M[:3, :3].T + M[:3, 3]
        if name == 'body':
            col = body_colors(pw)
        elif name == 'tray':
            col = np.tile(TRAY, (len(pw), 1))
        else:
            nk = [n for n in hm.NECKS if 'neck_' + n.name == name][0]
            col = neck_colors(nk, pw)
        rgba = np.concatenate([np.clip(col, 0, 1) * 255, np.full((len(col), 1), 255)], 1).astype(np.uint8)
        m.visual = trimesh.visual.ColorVisuals(m, vertex_colors=rgba)
        m.export(os.path.join(OUT, f'{name}.ply'))
        print('coloured', name, len(m.vertices))


if __name__ == '__main__':
    main()
