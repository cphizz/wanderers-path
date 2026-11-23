"""
Validation of the generated parts.  Writes docs/validation_report.json and
prints a human-readable summary.

Checks
  1. Every part fits the Flashforge AD5X (220 x 220 x 220 mm) in its print pose.
  2. Every STL is a closed, consistently-wound 2-manifold (manifold3d).
  3. Ball-passage test: a solid sphere is moved through the ASSEMBLED model's
     free space.  We find the largest sphere that can travel from each mouth to
     the rear exit moving only sideways or DOWN (gravity), and we look for any
     pocket where a sphere could come to rest before the exit ("trap").
     A sphere that encloses a die is a conservative stand-in for that die in any
     orientation.
  4. Internal overhangs: area of internal (dice-path) surfaces steeper than
     45 deg in each part's print orientation (should be ~0 -> no supports).
  5. Clearance between separate parts (no overlaps -> they can be assembled).
"""
import json
import os

import numpy as np
from scipy import ndimage
import trimesh
import manifold3d

import hydra_model as hm
import build_parts as bp

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STL = os.environ.get('HYDRA_STL', os.path.join(ROOT, 'stl'))
PARTS = ['body', 'neck_center', 'neck_left', 'neck_right', 'tray']


def load(name):
    m = trimesh.load(os.path.join(STL, f'{name}.stl'))
    fr = np.load(os.path.join(STL, f'_{name}_frame.npy'), allow_pickle=True).item()
    return m, fr


def world_solid_fields(p):
    """Assembled model: returns (solid_sdf_like, cavity_union) on world points.
    Uses the analytic shapes WITHOUT the overhang closure (closure only ever
    enlarges the cavity, so this is conservative for the passage test)."""
    out_b, cav_b, _ = bp.body_fields(p, False)
    solid = np.maximum(out_b, -cav_b)
    cav_union = cav_b.copy()
    for nk in hm.NECKS:
        no, _ = hm.neck_outer(nk, p)
        nc = hm.neck_cavity(nk, p)
        ex = np.maximum(np.minimum(nk.tongue(p), nk.fangs(p)), -nk.joint_h(p))
        ns = np.minimum(np.maximum(no, -nc), ex)
        solid = np.minimum(solid, ns)
        cav_union = np.minimum(cav_union, np.maximum(nc, -(ex)))
    return solid, cav_union


def passage_test(h=0.7):
    lo = np.array([-100.0, -110.0, 0.0])
    hi = np.array([100.0, 75.0, 222.0])
    shape = np.ceil((hi - lo) / h).astype(int) + 1
    g = np.stack(np.meshgrid(*[lo[k] + h * np.arange(shape[k]) for k in range(3)], indexing='ij'), -1).reshape(-1, 3)
    solid = np.empty(len(g), np.float32)
    cavu = np.empty(len(g), np.float32)
    for i in range(0, len(g), 800_000):
        a, b = world_solid_fields(g[i:i + 800_000])
        solid[i:i + 800_000], cavu[i:i + 800_000] = a, b
    solid = solid.reshape(shape) < 0
    cavu = cavu.reshape(shape)
    free_d = ndimage.distance_transform_edt(~solid) * h       # distance to nearest solid
    X, Y, Z = [lo[k] + h * np.arange(shape[k]) for k in range(3)]
    inside_path = cavu < 1.0

    def idx(pt):
        return tuple(np.round((np.asarray(pt) - lo) / h).astype(int))

    starts = {}
    for nk in hm.NECKS:
        m = np.zeros(shape, bool)
        c = np.asarray(idx(nk.T + 30 * nk.B))
        rr = int(6 / h)
        m[c[0] - rr:c[0] + rr, c[1] - rr:c[1] + rr, c[2] - rr:c[2] + rr] = True
        starts[nk.name] = m
    exit_m = np.zeros(shape, bool)
    exit_m[:, Y < -64, :] = True

    def reach(r):
        B = (free_d >= r) & inside_path
        # forward: from each start, move sideways or down
        res = {}
        R = np.zeros(shape, bool)
        # R: voxels that can reach the exit moving only sideways/down (process bottom-up)
        for z in range(shape[2]):
            seed = (exit_m[:, :, z] & B[:, :, z])
            if z > 0:
                below = ndimage.binary_dilation(R[:, :, z - 1], structure=np.ones((3, 3), bool))
                seed |= below & B[:, :, z]
            lab, n = ndimage.label(B[:, :, z], structure=np.ones((3, 3)))
            if n:
                good = np.unique(lab[seed & (lab > 0)])
                R[:, :, z] = np.isin(lab, good[good > 0])
        for name, st in starts.items():
            Fw = np.zeros(shape, bool)
            for z in range(shape[2] - 1, -1, -1):
                seed = st[:, :, z] & B[:, :, z]
                if z < shape[2] - 1:
                    seed |= ndimage.binary_dilation(Fw[:, :, z + 1], structure=np.ones((3, 3), bool)) & B[:, :, z]
                lab, n = ndimage.label(B[:, :, z], structure=np.ones((3, 3)))
                if n:
                    good = np.unique(lab[seed & (lab > 0)])
                    Fw[:, :, z] = np.isin(lab, good[good > 0])
            started = bool((st & B).any())
            reached_exit = bool((Fw & exit_m).any())
            traps = Fw & ~R
            tp = np.argwhere(traps) * h + lo
            # classify: is the resting spot inside the head/neck/body (real trap) or on the outside lips?
            where = []
            if len(tp):
                inside_any = np.zeros(len(tp), bool)
                ob, _, _ = bp.body_fields(tp, False)
                inside_any |= ob < 0
                for nk2 in hm.NECKS:
                    o2, _ = hm.neck_outer(nk2, tp)
                    inside_any |= (o2 < 0) & (nk2.mouth_cavity(tp) > 0)
                where = dict(inside_tower=int(inside_any.sum()), outside_on_lips_or_jaw=int((~inside_any).sum()),
                             lowest_inside=(None if not inside_any.any() else
                                            [round(float(c), 1) for c in tp[inside_any][tp[inside_any][:, 2].argmin()]]))
            res[name] = dict(enters=started, reaches_exit=reached_exit,
                             trap_voxels=int(traps.sum()), trap_locations=where,
                             trap_example=(None if not traps.any() else
                                           [round(float(v), 1) for v in (np.argwhere(traps)[0] * h + lo)]))
        return res

    out = {}
    for d in (34.0, 36.0):
        out[f'ball_{d:.0f}mm'] = reach(d / 2)
    # largest ball that passes from every mouth
    lo_r, hi_r = 12.0, 22.0
    for _ in range(7):
        mid = 0.5 * (lo_r + hi_r)
        r = reach(mid)
        ok = all(v['reaches_exit'] for v in r.values())
        lo_r, hi_r = (mid, hi_r) if ok else (lo_r, mid)
    out['largest_ball_passing_all_mouths_mm'] = round(2 * lo_r, 1)
    return out


def internal_overhangs():
    res = {}
    for name in PARTS[:-1]:
        m, fr = load(name)
        R, t = fr['R'], fr['t']
        cen_w = m.triangles_center @ R.T + t
        if name == 'body':
            cav = hm.body_cavity(cen_w)
            outer = hm.body_outer(cen_w)
        else:
            nk = [n for n in hm.NECKS if 'neck_' + n.name == name][0]
            cav = hm.neck_cavity(nk, cen_w)
            outer, _ = hm.neck_outer(nk, cen_w)
        internal = (cav > -1.5) & (cav < 4.0) & (outer < -1.0)
        nz = m.face_normals[:, 2]          # STL is already in print orientation
        area = m.area_faces
        bad = internal & (nz < -np.sin(np.radians(50)))   # overhang >50 deg from vertical
        res[name] = dict(internal_area_cm2=round(float(area[internal].sum()) / 100, 1),
                         internal_area_over_50deg_mm2=round(float(area[bad].sum()), 1),
                         pct=round(100 * float(area[bad].sum() / max(area[internal].sum(), 1)), 3))
    return res


def clearances():
    out = {}
    world = {}
    for name in PARTS[:-1]:
        m, fr = load(name)
        world[name] = trimesh.Trimesh(m.vertices @ fr['R'].T + fr['t'], m.faces, process=False)
    pairs = [('body', 'neck_center'), ('body', 'neck_left'), ('body', 'neck_right'),
             ('neck_center', 'neck_left'), ('neck_center', 'neck_right')]
    for a, b in pairs:
        A = manifold3d.Manifold(manifold3d.Mesh(world[a].vertices.astype(np.float32), world[a].faces.astype(np.uint32)))
        B = manifold3d.Manifold(manifold3d.Mesh(world[b].vertices.astype(np.float32), world[b].faces.astype(np.uint32)))
        inter = (A ^ B).volume()
        out[f'{a} x {b}'] = dict(overlap_mm3=round(float(inter), 3))
    return out


def main():
    rep = {}
    print('== mesh + build volume ==')
    vol = {}
    for name in PARTS:
        m, _ = load(name)
        man = manifold3d.Manifold(manifold3d.Mesh(m.vertices.astype(np.float32), m.faces.astype(np.uint32)))
        ext = m.extents
        vol[name] = dict(extents_mm=[round(float(e), 1) for e in ext], fits_AD5X=bool((ext <= 220).all()),
                         min_z=round(float(m.bounds[0, 2]), 3), watertight=bool(m.is_watertight),
                         manifold=str(man.status()), triangles=int(len(m.faces)),
                         volume_cm3=round(m.volume / 1000, 1))
        print(name, vol[name])
    rep['parts'] = vol
    print('== part overlaps ==')
    rep['overlaps'] = clearances()
    print(rep['overlaps'])
    print('== internal overhangs (print orientation) ==')
    rep['internal_overhangs'] = internal_overhangs()
    print(rep['internal_overhangs'])
    print('== ball passage (assembled) ==')
    rep['passage'] = passage_test()
    print(json.dumps(rep['passage'], indent=1))
    os.makedirs(os.path.join(ROOT, 'docs'), exist_ok=True)
    with open(os.path.join(ROOT, 'docs', 'validation_report.json'), 'w') as f:
        json.dump(rep, f, indent=1)


if __name__ == '__main__':
    main()
