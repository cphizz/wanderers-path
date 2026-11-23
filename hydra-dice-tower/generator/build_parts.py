"""
Build every printable part of the Baby Hydra Dice Tower and export STL files.

    python build_parts.py                # final quality (0.35 mm voxels, ~10 min)
    python build_parts.py --res 1.0      # fast preview

Pipeline for each part
  1. Evaluate the part's signed distance field on a voxel grid in its PRINT
     orientation (body upright, each neck standing on its joint face).
  2. "Overhang closure": walk up the grid layer by layer and remove any solid
     voxel above an internal cavity that is not supported within 45 degrees by
     the layer below.  This guarantees every internal ceiling of the dice path
     prints with NO support material (dome/arch-shaped roofs).
  3. Marching cubes -> watertight triangle mesh -> quadric decimation.
  4. Check the mesh is a valid closed 2-manifold (manifold3d) and save STL.
"""
import argparse
import json
import os
import time

import numpy as np
from scipy import ndimage
from skimage import measure
import trimesh
import fast_simplification
import manifold3d

import hydra_model as hm

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


# ----------------------------------------------------------------------------
# Part definitions: each returns sdf callables working on WORLD points
# ----------------------------------------------------------------------------
def body_fields(p, fine):
    """returns outer (with texture), cavity, extras for the body."""
    outer = hm.body_outer(p)
    if fine:
        x, y, z = p[:, 0], p[:, 1], p[:, 2]
        near = np.abs(outer) < 2.5
        rel = np.zeros(len(p))
        if near.any():
            q = p[near]
            bw = hm.body_belly_weight(q)
            sc = hm.scale_relief(q, cell=6.0, amp=0.7)
            pl = hm.plate_relief(q[:, 2], 7.5, 0.65)
            # keep feature areas smooth: spikes, claws/toes zone, near joints, base
            m = smoothstep_np(1.0, 4.0, hm.body_spikes(q))
            m *= smoothstep_np(2.0, 10.0, q[:, 2])
            for nk in hm.NECKS:
                jh = nk.joint_h(q)
                m *= np.where(np.abs(jh) < 6, smoothstep_np(-1.0, -6.0, jh), 1.0)
            # toes: smooth near the ground in front area
            m *= np.where((q[:, 1] > 8) & (q[:, 2] < 18), 0.35, 1.0)
            rel[near] = m * ((1 - bw) * sc + bw * pl)
        outer = outer - rel
    outer = hm.smin(outer, hm.exit_rim(p), 2.0)
    # nothing of the body may rise above a joint plane near a neck (only the spigot may)
    for nk in hm.NECKS:
        jh = nk.joint_h(p)
        rr = hm.norm((p - nk.J) - np.outer(jh, nk.axis))
        # smooth fall-off (25 -> 28 mm) instead of a hard-edged cylinder: avoids pinched edges
        outer = np.maximum(outer, jh + 0.25 - 60.0 * hm.smoothstep(hm.NECK_JOINT_R + 1.0, hm.NECK_JOINT_R + 4.0, rr))
    outer = np.minimum(outer, hm.spigots(p))
    outer = np.maximum(outer, -p[:, 2])
    # clearance against neck parts (so parts never overlap)
    sel = np.zeros(len(p), bool)
    for nk in hm.NECKS:
        sel |= (nk.joint_h(p) > -0.6) & (hm.norm(p - nk.J) < 90)
    if sel.any():
        q = p[sel]
        o = outer[sel]
        for nk in hm.NECKS:
            no, _ = hm.neck_outer(nk, q)
            nc = hm.neck_cavity(nk, q)
            neck_solid = np.maximum(no, -nc)
            # 0.25 mm fit gap at the joint face, plus room for the neck's raised scales above it
            gap = 0.25 + 0.75 * hm.smoothstep(1.0, 5.0, nk.joint_h(q))
            o = np.maximum(o, -(neck_solid - gap))
        outer[sel] = o
    cav = hm.body_cavity(p)
    extras = np.full(len(p), 1e9)
    return outer, cav, extras


def neck_fields_factory(nk):
    def f(p, fine):
        outer, idx = hm.neck_outer(nk, p)
        if fine:
            near = np.abs(outer) < 2.5
            rel = np.zeros(len(p))
            if near.any():
                q = p[near]
                bw = hm.neck_belly_weight(nk, q, idx[near])
                sc = hm.scale_relief(q, cell=4.2, amp=0.6)
                s = nk.s[idx[near]]
                pl = hm.plate_relief(s, 6.0, 0.55)
                h = nk.joint_h(q)
                m = smoothstep_np(1.5, 6.0, h)                    # flush seam at joint
                m *= smoothstep_np(1.0, 3.5, nk.horn_sdf(q))      # smooth horns
                for ec, _ in nk.eyes_info():                      # smooth eyes
                    m *= smoothstep_np(10.5, 13.5, hm.norm(q - ec))
                m *= smoothstep_np(1.0, 6.0, nk.mouth_cavity(q))  # smooth lips
                # finer, flatter scales on the snout
                snout = smoothstep_np(30, 18, hm.norm(q - (nk.T + 18 * nk.B + 24 * nk.N)))
                rel[near] = m * ((1 - bw) * sc * (1 - 0.55 * snout) + bw * pl)
            outer = outer - rel
            outer = np.maximum(outer, -nk.joint_h(p))
        cav = hm.neck_cavity(nk, p)
        extras = np.minimum(nk.tongue(p), nk.fangs(p))
        extras = np.maximum(extras, -nk.joint_h(p))
        return outer, cav, extras
    return f


def tray_fields(p, fine):
    return hm.tray_sdf(p), np.full(len(p), 1e9), np.full(len(p), 1e9)


def smoothstep_np(e0, e1, x):
    return hm.smoothstep(e0, e1, x)


# ----------------------------------------------------------------------------
# Grid evaluation (coarse pass + exact narrow band)
# ----------------------------------------------------------------------------
def eval_part(fields, to_world, lo, hi, h, coarse_h=1.6, band=3.2, chunk=600_000):
    lo = np.asarray(lo, float); hi = np.asarray(hi, float)
    # coarse grid
    cshape = np.ceil((hi - lo) / coarse_h).astype(int) + 1
    cg = np.stack(np.meshgrid(*[lo[k] + coarse_h * np.arange(cshape[k]) for k in range(3)],
                              indexing='ij'), -1).reshape(-1, 3)
    co, cc, ce = [np.empty(len(cg)) for _ in range(3)]
    for i in range(0, len(cg), chunk):
        a, b, c = fields(to_world(cg[i:i + chunk]), False)
        co[i:i + chunk], cc[i:i + chunk], ce[i:i + chunk] = a, b, c
    co, cc, ce = [v.reshape(cshape) for v in (co, cc, ce)]
    # fine grid
    shape = np.ceil((hi - lo) / h).astype(int) + 1
    idx = [np.arange(shape[k]) * h / coarse_h for k in range(3)]
    mg = np.meshgrid(*idx, indexing='ij')
    coords = np.stack(mg, 0)
    del mg
    F = {}
    for name, cv in (('outer', co), ('cav', cc), ('extra', ce)):
        F[name] = ndimage.map_coordinates(cv.astype(np.float32), coords, order=1, mode='nearest').astype(np.float32)
    del coords
    bandmask = (np.abs(F['outer']) < band) | (np.abs(F['cav']) < band) | (np.abs(F['extra']) < band)
    ii = np.nonzero(bandmask.ravel())[0]
    print(f'    grid {tuple(shape)}  band points {len(ii)/1e6:.1f}M', flush=True)
    for i in range(0, len(ii), chunk):
        sub = ii[i:i + chunk]
        g = np.stack(np.unravel_index(sub, shape), 1) * h + lo
        a, b, c = fields(to_world(g), True)
        F['outer'].ravel()[sub] = a
        F['cav'].ravel()[sub] = b
        F['extra'].ravel()[sub] = c
    return F, shape


def overhang_closure(cavity):
    """cavity: bool grid (x,y,z) with z = print-up.  Returns enlarged cavity whose
    ceilings never overhang more than 45 degrees (cross-shaped neighbourhood)."""
    G = ~cavity
    P = np.empty_like(G)
    P[:, :, 0] = G[:, :, 0]
    for z in range(1, G.shape[2]):
        prev = P[:, :, z - 1]
        dil = prev.copy()
        dil[1:, :] |= prev[:-1, :]
        dil[:-1, :] |= prev[1:, :]
        dil[:, 1:] |= prev[:, :-1]
        dil[:, :-1] |= prev[:, 1:]
        P[:, :, z] = G[:, :, z] & dil
    return ~P


def signed_edt(mask, h):
    inside = ndimage.distance_transform_edt(mask) * h
    outside = ndimage.distance_transform_edt(~mask) * h
    return (outside - inside).astype(np.float32)


def build_part(name, fields, to_world, lo, hi, h, target_faces, out_dir, frame_info, lip_round=0.0):
    t0 = time.time()
    lo = np.asarray(lo, float)
    print(f'[{name}]', flush=True)
    F, shape = eval_part(fields, to_world, lo, hi, h)
    # smooth max = rounded lips where the cavity breaks through the skin (no knife edges)
    sharp = np.maximum(F['outer'], -F['cav'])
    if lip_round:
        # round only the mouth / inlet rims, never the joint face or bore (bottom 25 mm in print pose)
        zz = (lo[2] + h * np.arange(shape[2])).astype(np.float32)
        w = hm.smoothstep(18.0, 26.0, zz)[None, None, :] if name.startswith('neck') else np.float32(1.0)
        sharp = sharp * (1 - w) + hm.smax(F['outer'], -F['cav'], lip_round) * w
    base = np.minimum(sharp, F['extra'])
    cav_air = (F['cav'] < 0) & (F['outer'] < 0) & (F['extra'] > 0)
    closed = overhang_closure(cav_air)
    added = closed & ~cav_air & (base < 0)
    print(f'    closure removed {added.sum() * h**3 / 1000:.1f} cm3 of unsupported ceiling', flush=True)
    if added.any():
        # signed distance to the "added" region, only needed nearby
        sd = signed_edt(ndimage.binary_dilation(added, iterations=1) & closed, h)
        sd = ndimage.gaussian_filter(sd, 0.6)
        field = np.maximum(base, -sd)
    else:
        field = base
    field = np.where(np.abs(field) < 1e-4, np.float32(1e-4), field).astype(np.float32)  # no exact zeros
    field = np.pad(field, 2, constant_values=10.0)
    verts, faces, _, _ = measure.marching_cubes(field, 0.0, spacing=(h, h, h))
    verts = verts - 2 * h + lo
    mesh = trimesh.Trimesh(verts, faces, process=True)
    if mesh.volume < 0:
        mesh.invert()
    print(f'    raw mesh {len(mesh.faces)/1e3:.0f}k faces, watertight={mesh.is_watertight}', flush=True)
    red = 1 - min(1.0, target_faces / len(mesh.faces))
    if red > 0:
        v2, f2 = fast_simplification.simplify(mesh.vertices.astype(np.float32), mesh.faces, red, agg=4)
        mesh = trimesh.Trimesh(v2, f2, process=True)
    # keep only the main body (drops any sub-voxel specks)
    comps = mesh.split(only_watertight=False)
    if len(comps) > 1:
        comps = sorted(comps, key=lambda m: -abs(m.volume))
        print(f'    dropping {len(comps)-1} tiny fragments (vol {sum(abs(c.volume) for c in comps[1:]):.2f} mm3)')
        mesh = comps[0]
    trimesh.repair.fix_normals(mesh)
    man = manifold3d.Manifold(manifold3d.Mesh(mesh.vertices.astype(np.float32), mesh.faces.astype(np.uint32)))
    status = str(man.status())
    info = dict(name=name, faces=int(len(mesh.faces)), watertight=bool(mesh.is_watertight),
                winding_consistent=bool(mesh.is_winding_consistent), manifold_status=status,
                volume_cm3=round(mesh.volume / 1000, 1), genus=int(man.genus()),
                extents_mm=[round(float(e), 1) for e in mesh.extents], seconds=round(time.time() - t0))
    print('    ', info, flush=True)
    mesh.export(os.path.join(out_dir, f'{name}.stl'))
    np.save(os.path.join(out_dir, f'_{name}_frame.npy'), frame_info)
    return mesh, info, (field, lo - 2 * h, h, closed, cav_air)


# ----------------------------------------------------------------------------
def neck_frame(nk):
    w = nk.axis
    e1 = nk.key_dir
    e2 = np.cross(w, e1)
    R = np.stack([e1, e2, w], 1)          # columns: local axes in world
    return R


def write_assembly(out_dir):
    """4x4 placement (print pose -> assembled pose) for every part."""
    asm = {}
    body = trimesh.load(os.path.join(out_dir, 'body.stl'))
    v = body.vertices
    low = v[(v[:, 2] < hm.TRAY_H_FRONT + 1) & (np.abs(v[:, 0]) < hm.TRAY_IN[0] / 2 + hm.TRAY_WALL)]
    y_back = float(low[:, 1].min())
    hy = hm.TRAY_IN[1] / 2 + hm.TRAY_WALL
    for name in ['body', 'neck_center', 'neck_left', 'neck_right', 'tray']:
        M = np.eye(4)
        if name == 'tray':
            M[:3, 3] = (0, y_back - 1.0 - hy, 0)
        else:
            fr = np.load(os.path.join(out_dir, f'_{name}_frame.npy'), allow_pickle=True).item()
            M[:3, :3] = fr['R']; M[:3, 3] = fr['t']
        asm[name] = M.tolist()
    with open(os.path.join(out_dir, 'assembly.json'), 'w') as f:
        json.dump(asm, f, indent=1)
    print('tray placed with its near wall 1 mm behind the rump (y = %.1f)' % (y_back - 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--res', type=float, default=0.35)
    ap.add_argument('--out', default=os.path.join(ROOT, 'stl'))
    ap.add_argument('--only', default='')
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    h = args.res
    fine = h < 0.6
    infos = []
    parts = {}

    if not args.only or 'body' in args.only:
        ident = lambda g: g
        m, info, extra = build_part('body', body_fields, ident, (-78, -78, -0.6), (78, 66, 116), h,
                                    700_000 if fine else 200_000, args.out,
                                    dict(R=np.eye(3), t=np.zeros(3)), lip_round=1.5)
        infos.append(info)
        np.savez_compressed(os.path.join(args.out, '_body_cavity.npz'), closed=np.packbits(extra[3]),
                            shape=extra[3].shape, lo=extra[1] + 2 * extra[2], h=extra[2])

    for nk in hm.NECKS:
        nm = f'neck_{nk.name}'
        if args.only and nm not in args.only:
            continue
        R = neck_frame(nk)
        J = nk.J
        to_world = (lambda R, J: (lambda g: g @ R.T + J))(R, J)
        m, info, extra = build_part(nm, neck_fields_factory(nk), to_world, (-72, -72, -0.6),
                                    (72, 72, 132), h, 420_000 if fine else 120_000, args.out,
                                    dict(R=R, t=J), lip_round=3.0)
        infos.append(info)

    if not args.only or 'tray' in args.only:
        m, info, extra = build_part('tray', tray_fields, lambda g: g, (-58, -51, -0.6), (58, 51, 21), min(h, 0.4),
                                    120_000, args.out, dict(R=np.eye(3), t=np.zeros(3)))
        infos.append(info)

    with open(os.path.join(args.out, '_build_report.json'), 'w') as f:
        json.dump(infos, f, indent=1, default=float)
    if not args.only:
        write_assembly(args.out)


if __name__ == '__main__':
    main()
