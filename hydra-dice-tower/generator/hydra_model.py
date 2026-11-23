"""
Baby Hydra Dice Tower - shape definitions.

Everything here is a *signed distance function* (SDF): a function that takes
an array of 3D points (N,3) in millimetres and returns, for each point, the
distance to the surface.  Negative = inside the solid, positive = outside.

Why SDFs instead of Blender booleans?
  * Union / smooth-blend / subtraction are just min/max arithmetic, so they
    never fail the way mesh booleans do on organic shapes.
  * Turning an SDF into a mesh with marching cubes always produces a closed
    (watertight, manifold) surface - exactly what a slicer needs.

Coordinate system (assembled model, millimetres):
  +X = hydra's left (viewer's right when looking at its face)
  +Y = the direction the hydra faces (front)
  -Y = rear (dice exit + tray)
  +Z = up, Z = 0 is the table.
"""
import numpy as np
from scipy.spatial import cKDTree

# ----------------------------------------------------------------------------
# Key functional dimensions (all mm).  Change these and re-run build_parts.py
# ----------------------------------------------------------------------------
NECK_CHANNEL_R = 18.5      # 37.0 mm clear tube inside each neck
STUMP_CHANNEL_R = 18.9     # 37.8 mm in the body stub: slightly WIDER downstream,
                           # so the joint step can never catch a die
NECK_JOINT_R = 24.0        # outer radius of neck where it meets the body
SPIGOT_WALL = 2.0          # body spigot wall thickness
SPIGOT_H = 9.0             # how far the spigot sticks up into the neck
FIT_CLEARANCE = 0.25       # radial clearance spigot<->neck bore (PLA, 0.4 nozzle)
KEY_W, KEY_DEPTH = 4.0, 1.6
EYE_R = 11.5
BODY_WALL = 4.0            # minimum shell around the internal chamber
FLOOR_SLOPE_DEG = 32.0     # main ramp slope (dice need >~25 deg to never stall)
FUNNEL_DEG = 0.0           # (no side funnel: inlet tubes feed the ramp directly)
EXIT_HALF_W = 23.0         # exit tunnel half width (46 mm wide)
EXIT_WALL_H = 31.0         # vertical wall height of the exit arch before the 45° roof

SPIGOT_ID_R = STUMP_CHANNEL_R
SPIGOT_OD_R = SPIGOT_ID_R + SPIGOT_WALL
BORE_R = SPIGOT_OD_R + FIT_CLEARANCE


# ----------------------------------------------------------------------------
# Generic SDF helpers
# ----------------------------------------------------------------------------
def norm(v):
    return np.sqrt(np.einsum('...i,...i->...', v, v))


def unit(v):
    v = np.asarray(v, float)
    return v / np.linalg.norm(v)


def smin(a, b, k):
    """Smooth union: blends two shapes with a fillet of size ~k."""
    if k <= 0:
        return np.minimum(a, b)
    h = np.clip(k - np.abs(a - b), 0, None) / k
    return np.minimum(a, b) - h * h * k * 0.25


def smax(a, b, k):
    return -smin(-a, -b, k)


def sd_ellipsoid(p, c, r, R=None):
    """Ellipsoid centred at c, radii r, optional rotation R (columns = local axes)."""
    q = p - c
    if R is not None:
        q = q @ R
    r = np.asarray(r, float)
    k0 = norm(q / r)
    k1 = norm(q / (r * r))
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def sd_round_cone(p, a, b, r1, r2, lat_scale=None, lat_axis=None):
    """Capsule from a (radius r1) to b (radius r2).  Optional sideways squash."""
    a = np.asarray(a, float); b = np.asarray(b, float)
    q = p
    if lat_scale is not None:
        # stretch space along lat_axis so the cone becomes elliptical
        ax = unit(lat_axis)
        comp = (p - a) @ ax
        q = p - np.outer(comp, ax) * (1 - 1 / lat_scale)
    ba = b - a
    l2 = ba @ ba
    rr = r1 - r2
    a2 = l2 - rr * rr
    il2 = 1.0 / l2
    pa = q - a
    y = pa @ ba
    z = y - l2
    w = pa * l2 - np.outer(y, ba)
    x2 = np.einsum('ij,ij->i', w, w)
    y2 = y * y * l2
    z2 = z * z * l2
    k = np.sign(rr) * rr * rr * x2
    d_mid = (np.sqrt(np.maximum(x2 * a2 * il2, 0)) + y * rr) * il2 - r1
    d_b = np.sqrt(x2 + z2) * il2 - r2
    d_a = np.sqrt(x2 + y2) * il2 - r1
    out = np.where(np.sign(z) * a2 * z2 > k, d_b,
                   np.where(np.sign(y) * a2 * y2 < k, d_a, d_mid))
    return out


def sd_sphere(p, c, r):
    return norm(p - np.asarray(c, float)) - r


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def catmull_rom(pts, n_per=60):
    """Smooth curve through control points (centripetal Catmull-Rom)."""
    P = np.asarray(pts, float)
    P = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        t0 = 0.0
        t1 = t0 + np.linalg.norm(p1 - p0) ** 0.5
        t2 = t1 + np.linalg.norm(p2 - p1) ** 0.5
        t3 = t2 + np.linalg.norm(p3 - p2) ** 0.5
        for t in np.linspace(t1, t2, n_per, endpoint=False):
            a1 = (t1 - t) / (t1 - t0) * p0 + (t - t0) / (t1 - t0) * p1
            a2 = (t2 - t) / (t2 - t1) * p1 + (t - t1) / (t2 - t1) * p2
            a3 = (t3 - t) / (t3 - t2) * p2 + (t - t2) / (t3 - t2) * p3
            b1 = (t2 - t) / (t2 - t0) * a1 + (t - t0) / (t2 - t0) * a2
            b2 = (t3 - t) / (t3 - t1) * a2 + (t - t1) / (t3 - t1) * a3
            out.append((t2 - t) / (t2 - t1) * b1 + (t - t1) / (t2 - t1) * b2)
    out.append(P[-2])
    return np.array(out)


def resample(curve, step=0.4):
    seg = np.linalg.norm(np.diff(curve, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    n = max(int(s[-1] / step), 2)
    si = np.linspace(0, s[-1], n)
    return np.stack([np.interp(si, s, curve[:, k]) for k in range(3)], 1), si


# ----------------------------------------------------------------------------
# Procedural surface texture: scales (cellular noise) and belly plates
# ----------------------------------------------------------------------------
def _hash3(ix, iy, iz):
    h = (ix.astype(np.int64) * 73856093) ^ (iy.astype(np.int64) * 19349663) ^ (iz.astype(np.int64) * 83492791)
    h = h & 0xFFFFFFFF
    out = []
    for salt in (0x9E3779B1, 0x85EBCA77, 0xC2B2AE3D):
        x = (h ^ salt) * 0x27D4EB2D & 0xFFFFFFFF
        x ^= x >> 15
        x = x * 0x165667B1 & 0xFFFFFFFF
        x ^= x >> 13
        out.append((x & 0xFFFF) / 65535.0)
    return np.stack(out, -1)


def scale_relief(p, cell=5.0, amp=0.65):
    """Raised scale tiles separated by grooves (0 = groove, amp = scale top)."""
    q = p / cell
    b = np.floor(q)
    f1 = np.full(len(p), 9.0)
    f2 = np.full(len(p), 9.0)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for dz in (-1, 0, 1):
                c = b + np.array([dx, dy, dz])
                feat = c + 0.15 + 0.7 * _hash3(c[:, 0], c[:, 1], c[:, 2])
                d = norm(q - feat)
                f2 = np.where(d < f1, f1, np.minimum(f2, d))
                f1 = np.minimum(f1, d)
    edge = f2 - f1
    tile = np.sqrt(np.clip(edge / 0.32, 0, 1))
    dome = 1 - 0.35 * np.clip(f1, 0, 1) ** 2
    return amp * tile * dome


def plate_relief(coord, period=7.0, amp=0.6):
    f = np.mod(coord / period, 1.0)
    return amp * smoothstep(0.0, 0.16, f) * smoothstep(1.0, 0.84, f)


# ----------------------------------------------------------------------------
# Necks and heads
# ----------------------------------------------------------------------------
def _dir(F, U, deg):
    t = np.radians(deg)
    return np.cos(t) * F + np.sin(t) * U


class Neck:
    """One neck + head.  Control points: [inside body, JOINT, ..., throat]."""

    def __init__(self, name, ctrl, yaw_deg, mouth_elev=62.0):
        self.name = name
        F = np.array([np.sin(np.radians(yaw_deg)), np.cos(np.radians(yaw_deg)), 0.0])
        U = np.array([0, 0, 1.0])
        S = np.cross(U, F)
        self.F, self.U, self.S = F, U, S
        self.T = np.asarray(ctrl[-1], float)            # throat centre
        self.B = _dir(F, U, mouth_elev)                 # mouth axis
        self.N = _dir(F, U, mouth_elev + 90)            # "up-back" perpendicular
        pts = list(ctrl) + [self.T + 10 * self.B]
        curve = catmull_rom(pts, 80)
        self.curve, self.s = resample(curve, 0.35)
        self.tree = cKDTree(self.curve)
        # joint = control point index 1
        J = np.asarray(ctrl[1], float)
        ij = int(np.argmin(norm(self.curve - J)))
        self.ij = ij
        self.J = self.curve[ij]
        a = self.curve[min(ij + 6, len(self.curve) - 1)] - self.curve[max(ij - 6, 0)]
        self.axis = unit(a)                              # joint axis (print "up")
        self.s_J = self.s[ij]
        it = int(np.argmin(norm(self.curve - self.T)))
        self.s_T = self.s[it]
        # tangent frames for belly-side detection
        tang = np.gradient(self.curve, axis=0)
        self.tang = tang / norm(tang)[:, None]
        # key direction on spigot: toward the rear of the hydra, perpendicular to axis
        kd = np.array([0, -1.0, 0]) - self.axis * (np.array([0, -1.0, 0]) @ self.axis)
        self.key_dir = unit(kd)

    # outer radius along arc length
    def radius(self, s):
        sj, st = self.s_J, self.s_T
        r = np.where(s < sj, NECK_JOINT_R + 1.5 * smoothstep(sj, sj - 25, s),
                     NECK_JOINT_R - 1.2 * smoothstep(sj, sj + 0.5 * (st - sj), s)
                     + 0.8 * smoothstep(sj + 0.5 * (st - sj), st, s))
        return r

    def _nearest(self, p):
        d, i = self.tree.query(p, workers=-1)
        return d, i

    def tube(self, p, which='outer'):
        d, i = self._nearest(p)
        s = self.s[i]
        if which == 'outer':
            return d - self.radius(s), i
        return d - np.where(s < self.s_J, STUMP_CHANNEL_R, NECK_CHANNEL_R), i

    def joint_h(self, p):
        """signed height of p above the joint plane (along joint axis)."""
        return (p - self.J) @ self.axis

    # ---------------- head ----------------
    def head(self, p):
        T, B, N, S, F, U = self.T, self.B, self.N, self.S, self.F, self.U
        up_dir = unit(_dir(B, N, 12))      # upper jaw tilts back a little
        lo_dir = unit(_dir(B, N, -22))     # lower jaw drops forward (wide-open look)
        cc = self.cran_c()
        cran = sd_ellipsoid(p, cc, (25, 27, 30), R=np.stack([B, N, S], 1))
        upj = sd_round_cone(p, T + 3 * B + 21 * N, T + 3 * B + 21 * N + 26 * up_dir,
                            15.0, 12.0, lat_scale=1.35, lat_axis=S)
        loj = sd_round_cone(p, T + 1 * B - 22 * N, T + 1 * B - 22 * N + 24 * lo_dir,
                            12.0, 9.5, lat_scale=1.5, lat_axis=S)
        d = smin(cran, upj, 14)
        d = smin(d, loj, 14)
        for sg in (-1, 1):                  # chubby cheeks
            d = smin(d, sd_sphere(p, T - 2 * B - 3 * N + sg * 20 * S, 12.5), 12)
        for ec, look in self.eyes_info():   # brow + eyeball
            side = np.sign((ec - T) @ S)
            d = smin(d, sd_ellipsoid(p, ec + 7.5 * N - 2 * B + side * 1.0 * S, (8.5, 3.6, 10),
                                     R=np.stack([B, N, S], 1)), 4)
            d = smin(d, sd_sphere(p, ec, EYE_R), 2.5)
        d = smin(d, self.horn_sdf(p), 3)
        for sg in (-1, 1):                  # ear fins
            fc = cc - 4 * B + 6 * N + sg * 28 * S
            fin = sd_ellipsoid(p, fc, (10, 7, 2.6), R=np.stack([unit(-B + 0.6 * N), unit(N + 0.6 * B), S], 1))
            d = smin(d, fin, 4)
        for sg in (-1, 1):                  # nostrils
            nc = T + 3 * B + 21 * N + 26 * up_dir + 8.5 * unit(N - 0.2 * B) + sg * 5 * S
            d = np.maximum(d, -sd_sphere(p, nc, 2.1))
        for ec, look in self.eyes_info():   # big pupils: shallow dish in each eye
            d = np.maximum(d, -sd_sphere(p, ec + look * (EYE_R + 4.6), 6.0))
        return d

    def cran_c(self):
        return self.T - 4 * self.B + 15 * self.N

    def horn_sdf(self, p):
        T, B, N, S = self.T, self.B, self.N, self.S
        h = np.full(len(p), 1e9)
        for sg in (-1, 1):
            base = self.cran_c() - 6 * B + 17 * N + sg * 12 * S
            tip = base + 13 * unit(-0.55 * B + 0.8 * N + sg * 0.35 * S)
            h = np.minimum(h, sd_round_cone(p, base, tip, 5.2, 1.3))
        return h

    def tongue(self, p):
        T, B, N = self.T, self.B, self.N
        return sd_ellipsoid(p, T + 24 * B - 21.0 * N, (9, 3.4, 8.5), R=np.stack([B, N, self.S], 1))

    def fangs(self, p):
        T, B, N, S = self.T, self.B, self.N, self.S
        f = np.full(len(p), 1e9)
        for sg in (-1, 1):
            # upper fangs hang toward the lower jaw, lower fangs point up
            b1 = T + 33 * B + 25.5 * N + sg * 10 * S
            f = np.minimum(f, sd_round_cone(p, b1, b1 - 5.5 * N + 1 * B, 2.6, 0.5))
            b2 = T + 30 * B - 25.5 * N + sg * 9 * S
            f = np.minimum(f, sd_round_cone(p, b2, b2 + 5.0 * N + 1 * B, 2.4, 0.5))
        return f

    def mouth_cavity(self, p):
        """Open mouth: a widening cone from the throat out past the lips."""
        T, B = self.T, self.B
        return sd_round_cone(p, T - 4 * B, T + 46 * B, NECK_CHANNEL_R, 27.5)

    def eyes_info(self):
        T, B, N, S, F = self.T, self.B, self.N, self.S, self.F
        out = []
        for sg in (-1, 1):
            ec = T + 9 * B + 19 * N + sg * 26 * S + 7 * F
            look = unit((ec - self.cran_c()) * np.array([1, 1, 0.6]) + 22 * F)
            out.append((ec, look))
        return out


def make_necks():
    centre = Neck('center',
                  [(0, 0, 76), (0, 0, 99), (0, -3, 118), (0, -1, 138), (0, 6, 156)],
                  yaw_deg=0, mouth_elev=56)
    left = Neck('left',
                [(16, 0, 60), (44, 0, 91), (59, 0, 111), (71, 2, 128), (77, 5, 144)],
                yaw_deg=34, mouth_elev=54)
    right = Neck('right',
                 [(-16, 0, 60), (-44, 0, 91), (-59, 0, 111), (-71, 2, 128), (-77, 5, 144)],
                 yaw_deg=-34, mouth_elev=54)
    return [centre, left, right]


NECKS = make_necks()


# ----------------------------------------------------------------------------
# Body
# ----------------------------------------------------------------------------
def body_core(p):
    """Torso only (used for the inner shell limit)."""
    d = sd_ellipsoid(p, (0, -6, 36), (54, 48, 42))                 # belly / lower body
    d = smin(d, sd_ellipsoid(p, (0, 2, 72), (36, 33, 30)), 22)     # chest
    d = smin(d, sd_ellipsoid(p, (0, -26, 28), (50, 40, 34)), 18)   # rump
    d = smin(d, sd_ellipsoid(p, (0, -28, 56), (38, 32, 34)), 20)   # lower back
    for sg in (-1, 1):                                              # chunky shoulders
        d = smin(d, sd_ellipsoid(p, (sg * 28, -12, 72), (24, 30, 26)), 16)
    return d


def _toes(p, d, foot_c, fwd, side_n, toe_r, spread, claws):
    fwd = unit(fwd)
    side = unit(np.cross([0, 0, 1.0], fwd))
    for k in range(-1, 2):
        tc = np.asarray(foot_c, float) + fwd * spread[0] + side * k * spread[1] + np.array([0, 0, -1.0])
        tc[2] = toe_r * 0.9
        d = smin(d, sd_sphere(p, tc, toe_r), 3)
        tip = tc + fwd * (toe_r + 3.2) + np.array([0, 0, -toe_r * 0.35])
        claws.append((tc + fwd * toe_r * 0.5, tip, toe_r * 0.62))
    return d


def body_outer(p, with_claws=True):
    d = body_core(p)
    claws = []
    for sg in (-1, 1):
        # haunches / thighs (sitting)
        d = smin(d, sd_ellipsoid(p, (sg * 40, -14, 26), (19, 32, 26)), 12)
        # hind feet pointing forward
        d = smin(d, sd_ellipsoid(p, (sg * 44, 22, 8), (15, 24, 10)), 8)
        d = _toes(p, d, (sg * 44, 22, 8), (sg * 0.15, 1, 0), sg, 6.0, (19, 8.5), claws)
        # front legs
        d = smin(d, sd_round_cone(p, (sg * 30, 16, 64), (sg * 31, 36, 12), 13.5, 10.5), 12)
        d = smin(d, sd_ellipsoid(p, (sg * 31, 40, 7), (13, 16, 8.5)), 6)
        d = _toes(p, d, (sg * 31, 40, 7), (sg * 0.1, 1, 0), sg, 5.0, (13, 7.5), claws)
    # short tail curling round the left haunch (away from the exit)
    tail_pts = catmull_rom([(14, -54, 18), (36, -60, 12), (56, -46, 8), (64, -22, 7)], 30)
    tail_pts, ts = resample(tail_pts, 1.0)
    tr = np.interp(ts, [0, ts[-1]], [13, 4.5])
    tdist = np.full(len(p), 1e9)
    for i in range(0, len(tail_pts) - 1, 3):
        j = min(i + 3, len(tail_pts) - 1)
        tdist = np.minimum(tdist, sd_round_cone(p, tail_pts[i], tail_pts[j], tr[i], tr[j]))
    d = smin(d, tdist, 10)
    # neck stumps (the part of each neck that belongs to the body)
    for nk in NECKS:
        t, _ = nk.tube(p, 'outer')
        t = np.maximum(t, nk.joint_h(p))                # only below the joint
        d = smin(d, t, 16)
        if abs(nk.J[0]) > 1:                            # extra shoulder mass round the side inlet bend
            d = smin(d, np.maximum(sd_sphere(p, nk.J - 11 * nk.axis + np.array([0, -3, 0]), 27.0), nk.joint_h(p) + 1.0), 12)
    spikes = body_spikes(p)
    d = smin(d, spikes, 3)
    CLAWS[:] = claws
    if with_claws:
        cl = np.full(len(p), 1e9)
        for a, b, r in claws:
            cl = np.minimum(cl, sd_round_cone(p, a, b, r, 0.9))
        d = smin(d, cl, 1.5)
    return d


CLAWS = []   # filled by body_outer (used for colouring)


def claws_sdf(p):
    if not CLAWS:
        body_outer(p[:1])
    cl = np.full(len(p), 1e9)
    for a, b, r in CLAWS:
        cl = np.minimum(cl, sd_round_cone(p, a, b, r, 0.9))
    return cl


SPIKE_POS = [((0, -30, 92), (0, -0.55, 0.83), 7.0), ((0, -42, 80), (0, -0.8, 0.6), 7.5),
             ((0, -52, 66), (0, -0.92, 0.38), 7.5), ((0, -60, 50), (0, -1, 0.1), 6.5),
             ((0, -18, 101), (0, -0.25, 0.97), 6.0)]


def body_spikes(p):
    d = np.full(len(p), 1e9)
    for base, n, h in SPIKE_POS:
        base = np.asarray(base, float)
        n = unit(n)
        d = np.minimum(d, sd_round_cone(p, base - 3 * n, base + h * n, 6.0, 1.4))
    return d


# ----------------------------------------------------------------------------
# Internal dice path (body)
# ----------------------------------------------------------------------------
Y_EXIT = -62.0
Z_EXIT = 14.0                 # floor height where the exit tube leaves the rump
RAMP_DEG = 34.0               # main ramp slope toward the rear exit
SIDE_PATH = [(16.0, -22.0, 63.3), (6.0, -40.0, 49.9)]   # side inlet tubes run down to the ramp here (x mirrored)


def floor_profile(y):
    """Centre-line floor height: 34 deg ramp down to the rear exit, 42 deg deflector up to the front."""
    t = np.tan(np.radians(RAMP_DEG))
    g = Z_EXIT + (y - Y_EXIT) * t
    g = g + np.clip(y - 4.0, 0, None) * (np.tan(np.radians(42)) - t)
    return g


def floor_height(x, y):
    w0 = 12.0
    # the side funnel only exists under the inlets; the tunnel to the exit has a flat-across floor
    lateral = np.clip(np.abs(x) - w0, 0, None) * np.tan(np.radians(FUNNEL_DEG))
    return floor_profile(y) + lateral


def tunnel_roof(x, y):
    return floor_profile(y) + EXIT_WALL_H + (EXIT_HALF_W - np.abs(x))


def chamber(p):
    """Funnel floor under the three inlet tubes + arched ramp tunnel to the rear exit."""
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    d_floor = floor_height(x, y) - z
    tun = np.maximum.reduce([d_floor, np.abs(x) - EXIT_HALF_W, z - tunnel_roof(x, y),
                             y - 16.0, -(y + 100.0)])
    return tun


def exit_rim(p):
    """Raised 'pucker' lip around the exit hole (it is a cartoon, after all)."""
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    tun = np.maximum.reduce([floor_profile(y) - z, np.abs(x) - EXIT_HALF_W, z - tunnel_roof(x, y)])
    return np.maximum.reduce([np.abs(tun - 2.6) - 2.6, body_core(p) - 2.2, -(body_core(p) + 6), y + 40])


class InletTube:
    """Channel inside the body from a neck joint down to the funnel floor."""

    def __init__(self, nk):
        a, J = nk.axis, nk.J
        if abs(J[0]) < 1:
            pts = [J + 12 * a, J, (0, 0, 70), (0, 0, 40)]
        else:
            sg = np.sign(J[0])
            pts = [J + 12 * a, J, J - 8 * a] + [(sg * bx, by, bz) for bx, by, bz in SIDE_PATH]
        self.curve, _ = resample(catmull_rom(pts, 60), 0.35)
        self.tree = cKDTree(self.curve)

    def sdf(self, p):
        d, _ = self.tree.query(p, workers=-1)
        return d - STUMP_CHANNEL_R


INLETS = None


def body_cavity(p):
    global INLETS
    if INLETS is None:
        INLETS = [InletTube(nk) for nk in NECKS]
    c = chamber(p)
    for nk, it in zip(NECKS, INLETS):
        t = it.sdf(p)
        t = np.maximum(t, nk.joint_h(p) - SPIGOT_H - 0.01)   # through the spigot
        # never let an inlet tube dig below the funnel floor (that would be a dice trap)
        t = np.maximum(t, floor_height(p[:, 0], p[:, 1]) - p[:, 2])
        c = np.minimum(c, t)
    return c


def spigots(p):
    """Male spigots on top of each body stump + anti-rotation key."""
    d = np.full(len(p), 1e9)
    for nk in NECKS:
        h = nk.joint_h(p)
        rv = (p - nk.J) - np.outer(h, nk.axis)
        r = norm(rv)
        ring = np.maximum(r - SPIGOT_OD_R, SPIGOT_ID_R - 0.4 - r)   # overlap channel slightly
        sp = np.maximum.reduce([ring, h - SPIGOT_H, -h - 1.0])
        # top outer chamfer so it slides in easily
        sp = np.maximum(sp, (r - SPIGOT_OD_R) + (h - SPIGOT_H + 0.8))
        # key rib
        kc = rv @ nk.key_dir
        side = norm(rv - np.outer(kc, nk.key_dir))
        key = np.maximum.reduce([np.abs(side) - KEY_W / 2, kc - (SPIGOT_OD_R + KEY_DEPTH),
                                 SPIGOT_OD_R - 1 - kc, h - (SPIGOT_H - 1.5), -h - 1.0])
        d = np.minimum.reduce([d, sp, key])
    return d


def body_solid_outer(p):
    """Body exterior (without cavity), including spigots and exit rim."""
    d = body_outer(p)
    d = smin(d, exit_rim(p), 2.0)
    d = np.minimum(d, spigots(p))
    d = np.maximum(d, -p[:, 2])        # flat bottom on the table
    return d


# belly mask for the body (front-facing region of the torso)
def body_belly_weight(p):
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    rel_y = y + 4
    ang = rel_y / np.maximum(np.sqrt(x * x + rel_y * rel_y), 1e-6)
    return smoothstep(0.62, 0.78, ang) * smoothstep(8, 18, z) * smoothstep(104, 92, z) * smoothstep(34, 26, np.abs(x))


# ----------------------------------------------------------------------------
# Neck part (everything above the joint plane)
# ----------------------------------------------------------------------------
def neck_outer(nk, p):
    t, idx = nk.tube(p, 'outer')
    d = smin(t, nk.head(p), 12)
    # stop the neck at the joint plane (flat face = print bed face)
    d = np.maximum(d, -nk.joint_h(p))
    return d, idx


def neck_belly_weight(nk, p, idx):
    c = nk.curve[idx]
    rv = p - c
    tg = nk.tang[idx]
    rv = rv - tg * np.einsum('ij,ij->i', rv, tg)[:, None]
    front = nk.F - tg * (tg @ nk.F)[:, None]
    front /= norm(front)[:, None]
    cosang = np.einsum('ij,ij->i', rv, front) / np.maximum(norm(rv), 1e-6)
    s = nk.s[idx]
    w = smoothstep(0.35, 0.6, cosang) * smoothstep(nk.s_T - 4, nk.s_T - 14, s)
    return w


def neck_cavity(nk, p):
    t, _ = nk.tube(p, 'channel')
    c = np.minimum(t, nk.mouth_cavity(p))
    # female bore for the body spigot + 45° lead-in cone above it
    h = nk.joint_h(p)
    rv = (p - nk.J) - np.outer(h, nk.axis)
    r = norm(rv)
    bore = np.maximum.reduce([r - BORE_R, h - (SPIGOT_H + 0.4), -h - 5])
    cone = np.maximum.reduce([r - (BORE_R - (h - SPIGOT_H - 0.4)), (SPIGOT_H + 0.4) - h - 0.01, h - (SPIGOT_H + 0.4 + BORE_R)])
    kc = rv @ nk.key_dir
    side = norm(rv - np.outer(kc, nk.key_dir))
    slot = np.maximum.reduce([np.abs(side) - (KEY_W / 2 + 0.3), kc - (SPIGOT_OD_R + KEY_DEPTH + 0.35),
                              -kc, h - (SPIGOT_H - 1.0), -h - 5])
    c = np.minimum.reduce([c, bore, cone, slot])
    return c


# ----------------------------------------------------------------------------
# Tray
# ----------------------------------------------------------------------------
TRAY_IN = (98.0, 84.0)     # inner width (x), inner depth (y)
TRAY_WALL = 2.6
TRAY_FLOOR = 2.4
TRAY_H_BACK = 18.0
TRAY_H_FRONT = 8.0


def _rbox2(x, y, hx, hy, r):
    qx = np.abs(x) - hx + r
    qy = np.abs(y) - hy + r
    return np.sqrt(np.clip(qx, 0, None) ** 2 + np.clip(qy, 0, None) ** 2) + np.minimum(np.maximum(qx, qy), 0) - r


def tray_sdf(p):
    """Tray in its own frame: origin at centre of the floor, +Y toward the hydra."""
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    hx, hy = TRAY_IN[0] / 2 + TRAY_WALL, TRAY_IN[1] / 2 + TRAY_WALL
    outer2 = _rbox2(x, y, hx, hy, 16)
    inner2 = _rbox2(x, y, hx - TRAY_WALL, hy - TRAY_WALL, 16 - TRAY_WALL)
    # wall height ramps from 18 (back) down to 8 at the hydra side
    wall_h = TRAY_H_BACK + (TRAY_H_FRONT - TRAY_H_BACK) * smoothstep(-10, hy - 4, y)
    shell = np.maximum.reduce([outer2, -z, z - wall_h])
    pocket = np.maximum(inner2, TRAY_FLOOR - z)
    d = np.maximum(shell, -pocket)
    # rounded top lip
    d = smin(d, np.maximum(np.abs(outer2 + TRAY_WALL / 2) - 1.9, np.abs(z - wall_h) - 1.0), 1.0)
    d = np.maximum(d, -z)
    # embossed D20 (hexagon + inner triangle) on the outside of the back wall
    yb = -(hy)
    u, v = x, z - 9.5
    hexd = np.maximum.reduce([np.abs(u) * 0.866 + np.abs(v) * 0.5, np.abs(v)]) - 6.8
    hex_ring = np.abs(hexd) - 0.7
    tri = np.maximum.reduce([-v - 3.2, v * 0.5 + np.abs(u) * 0.866 - 1.9])
    tri_ring = np.abs(tri) - 0.6
    emb = np.minimum(hex_ring, tri_ring)
    emb3 = np.maximum.reduce([emb, -(y - yb) - 0.8, (y - yb) - 0.5])
    d = np.minimum(d, emb3)
    # leaf swirls either side (simple raised arcs)
    for sg in (-1, 1):
        cx = sg * 26
        arc = np.abs(np.sqrt((x - cx) ** 2 + (z - 4) ** 2) - 7.5) - 0.7
        arc = np.maximum(arc, -(z - 7.5))
        arc = np.maximum.reduce([arc, -(y - yb) - 0.8, (y - yb) - 0.5, z - 15.5])
        d = np.minimum(d, arc)
    return d
