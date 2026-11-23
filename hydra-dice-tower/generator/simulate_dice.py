"""
Physics test: drop virtual dice into every mouth of the assembled tower and
check that they come out of the rear into the tray.

Uses pybullet (Bullet physics).  The tower parts are loaded as static
triangle-mesh colliders, the dice as convex polyhedra with acrylic-like mass,
PLA-like friction and some bounce.

    python simulate_dice.py --drops 40          # quick
    python simulate_dice.py --drops 300 --fair  # also run the d6 fairness test

Units inside the simulation are centimetres (Bullet behaves poorly with
millimetre-sized objects expressed in metres).
"""
import argparse
import json
import os
import time

import numpy as np
import pybullet as pb
import trimesh
import fast_simplification

import hydra_model as hm

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STL = os.environ.get('HYDRA_STL', os.path.join(ROOT, 'stl'))
S = 0.1                      # mm -> cm
TRAY_OFFSET = None           # filled from assembly.json


def polyhedra():
    phi = (1 + 5 ** 0.5) / 2
    d = {}
    d['d4'] = np.array([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]], float)
    d['d6'] = np.array([[x, y, z] for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)], float)
    d['d8'] = np.array([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], float)
    # d10: pentagonal trapezohedron
    v = [[0, 0, 1], [0, 0, -1]]
    for k in range(10):
        a = 2 * np.pi * k / 10
        v.append([np.cos(a), np.sin(a), 0.105 * (1 if k % 2 else -1)])
    d['d10'] = np.array(v, float)
    d['d12'] = np.array([[x, y, z] for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)] +
                        [[0, s / phi, t * phi] for s in (-1, 1) for t in (-1, 1)] +
                        [[s / phi, t * phi, 0] for s in (-1, 1) for t in (-1, 1)] +
                        [[s * phi, 0, t / phi] for s in (-1, 1) for t in (-1, 1)], float)
    d['d20'] = np.array([[0, s, t * phi] for s in (-1, 1) for t in (-1, 1)] +
                        [[s, t * phi, 0] for s in (-1, 1) for t in (-1, 1)] +
                        [[s * phi, 0, t] for s in (-1, 1) for t in (-1, 1)], float)
    # size = largest vertex-to-vertex distance (mm); generous real-world sizes
    size = dict(d4=22.0, d6=16.0, d8=20.0, d10=21.0, d12=21.0, d20=26.0)
    out = {}
    for k, v in d.items():
        v = v - v.mean(0)
        diam = max(np.linalg.norm(a - b) for a in v for b in v)
        out[k] = v * size[k] / diam
    return out


def load_tower(client, faces_per_part=90_000):
    with open(os.path.join(STL, 'assembly.json')) as f:
        asm = json.load(f)
    ids = []
    for name, M in asm.items():
        m = trimesh.load(os.path.join(STL, f'{name}.stl'))
        if len(m.faces) > faces_per_part:
            v, fc = fast_simplification.simplify(m.vertices.astype(np.float32), m.faces,
                                                 1 - faces_per_part / len(m.faces))
            m = trimesh.Trimesh(v, fc)
        M = np.array(M)
        verts = (m.vertices @ M[:3, :3].T + M[:3, 3]) * S
        col = pb.createCollisionShape(pb.GEOM_MESH, vertices=verts.tolist(), indices=m.faces.ravel().tolist(),
                                      flags=pb.GEOM_FORCE_CONCAVE_TRIMESH, physicsClientId=client)
        bid = pb.createMultiBody(0, col, physicsClientId=client)
        pb.changeDynamics(bid, -1, lateralFriction=0.35, restitution=0.35, physicsClientId=client)
        ids.append(bid)
    # table
    plane = pb.createCollisionShape(pb.GEOM_PLANE, physicsClientId=client)
    pid = pb.createMultiBody(0, plane, physicsClientId=client)
    pb.changeDynamics(pid, -1, lateralFriction=0.5, restitution=0.2, physicsClientId=client)
    return ids


def make_die(client, verts):
    col = pb.createCollisionShape(pb.GEOM_MESH, vertices=(verts * S).tolist(), physicsClientId=client)
    hull = trimesh.convex.convex_hull(verts)
    mass = hull.volume / 1000 * 1.18 / 1000          # grams -> kg  (acrylic 1.18 g/cm3)
    bid = pb.createMultiBody(mass, col, physicsClientId=client)
    pb.changeDynamics(bid, -1, lateralFriction=0.35, restitution=0.4, rollingFriction=0.0005,
                      spinningFriction=0.0005, ccdSweptSphereRadius=0.2, physicsClientId=client)
    return bid, hull


def face_up(hull, quat):
    R = np.array(pb.getMatrixFromQuaternion(quat)).reshape(3, 3)
    n = hull.facets_normal if len(hull.facets) else hull.face_normals
    up = (n @ R.T)[:, 2]
    return int(np.argmax(up))


def drop(client, die, hull, start, quat, t_max=5.0, dt=1 / 960):
    pb.resetBasePositionAndOrientation(die, (np.asarray(start) * S).tolist(), quat, physicsClientId=client)
    pb.resetBaseVelocity(die, [0, 0, -20.0], [0, 0, 0], physicsClientId=client)   # gentle toss: 20 cm/s down
    t = 0.0
    traj = []
    still = 0
    while t < t_max:
        pb.stepSimulation(physicsClientId=client)
        t += dt
        if int(t / dt) % 24 == 0:
            pos, q = pb.getBasePositionAndOrientation(die, physicsClientId=client)
            traj.append(np.array(pos) / S)
            v, w = pb.getBaseVelocity(die, physicsClientId=client)
            if np.linalg.norm(v) < 0.5 and np.linalg.norm(w) < 0.5:
                still += 1
                if still > 8:
                    break
            else:
                still = 0
    pos, q = pb.getBasePositionAndOrientation(die, physicsClientId=client)
    pos = np.array(pos) / S
    return pos, q, t, np.array(traj)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--drops', type=int, default=20)
    ap.add_argument('--fair', type=int, default=0, help='number of d6 drops for the fairness test')
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--dice', default='', help='comma list, e.g. d4,d20 (default: all)')
    ap.add_argument('--out', default='dice_simulation.json')
    args = ap.parse_args()
    rng = np.random.default_rng(args.seed)
    client = pb.connect(pb.DIRECT)
    pb.setGravity(0, 0, -981.0, physicsClientId=client)
    pb.setPhysicsEngineParameter(fixedTimeStep=1 / 960, numSubSteps=2, physicsClientId=client)
    load_tower(client)
    dice = polyhedra()
    results = {}
    t0 = time.time()
    trajectories = {}
    for dname, v in dice.items():
        if args.dice and dname not in args.dice.split(','):
            continue
        die, hull = make_die(client, v)
        for nk in hm.NECKS:
            ok = 0
            times = []
            fails = []
            for i in range(args.drops):
                start = nk.T + 40 * nk.B + np.array([0, 0, 22.0]) + rng.uniform(-5, 5, 3)
                q = pb.getQuaternionFromEuler(rng.uniform(0, 2 * np.pi, 3).tolist())
                pos, qf, t, traj = drop(client, die, hull, start, q)
                in_tray = pos[1] < -64 and pos[2] < 25
                if in_tray:
                    ok += 1
                    times.append(t)
                else:
                    fails.append([round(float(c), 1) for c in pos])
                if dname == 'd20' and i == 0:
                    trajectories[nk.name] = traj.tolist()
            results[f'{dname} via {nk.name} mouth'] = dict(drops=args.drops, reached_tray=ok,
                                                           mean_time_s=round(float(np.mean(times)), 2) if times else None,
                                                           stuck_positions=fails[:5])
            print(dname, nk.name, ok, '/', args.drops, f'{time.time()-t0:.0f}s', fails[:3], flush=True)
        pb.removeBody(die, physicsClientId=client)

    fair = None
    if args.fair:
        # Fairness: ALWAYS start with the same face up and the same orientation;
        # only the drop point varies by +-3 mm.  A good tower still gives
        # uniformly random results.
        die, hull = make_die(client, dice['d6'])
        counts = np.zeros(6, int)
        q = pb.getQuaternionFromEuler([0, 0, 0])
        nk = hm.NECKS[0]
        for i in range(args.fair):
            nk = hm.NECKS[i % 3]
            start = nk.T + 40 * nk.B + np.array([0, 0, 22.0]) + rng.uniform(-3, 3, 3)
            pos, qf, t, _ = drop(client, die, hull, start, q)
            if pos[1] < -64:
                counts[face_up(hull, qf)] += 1
        n = counts.sum()
        exp = n / 6
        chi2 = float(((counts - exp) ** 2 / exp).sum())
        fair = dict(start_orientation='identical every drop', landed=int(n), counts=counts.tolist(),
                    chi_square=round(chi2, 2), chi_square_critical_95pct_5dof=11.07,
                    uniform_at_95pct=bool(chi2 < 11.07))
        print('fairness', fair)
    out = dict(results=results, fairness_d6=fair, sample_d20_trajectories_mm=trajectories)
    os.makedirs(os.path.join(ROOT, 'docs'), exist_ok=True)
    with open(os.path.join(ROOT, 'docs', args.out), 'w') as f:
        json.dump(out, f, indent=1)


if __name__ == '__main__':
    main()
