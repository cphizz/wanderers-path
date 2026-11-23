# Printing & Assembly — Flashforge AD5X, PLA

## Parts (all files in `stl/`, already in their print orientation)

| File | What it is | Print orientation | Supports |
|---|---|---|---|
| `body.stl` | Torso, legs, tail, internal ramp + exit, 3 neck spigots | Upright, as exported (flat base on bed) | **Outside only**: tree supports, *build plate only* |
| `neck_center.stl` | Middle neck + head | Standing on its flat joint face (as exported) | Tree, build plate only (chin, snout, eyes) |
| `neck_left.stl` | Hydra's left neck + head (viewer's right) | Standing on its flat joint face | Tree, build plate only |
| `neck_right.stl` | Hydra's right neck + head (viewer's left) | Standing on its flat joint face | Tree, build plate only |
| `tray.stl` | Removable catch tray | Flat, floor down | None |

Don't rotate the parts. The internal dice path was shaped so that **no internal
surface overhangs more than 45° in exactly these orientations**, so the slicer
never needs to put support inside the dice channels.

## Slicer settings (Orca-Flashforge / FlashPrint 6)

| Setting | Body | Necks | Tray |
|---|---|---|---|
| Nozzle | 0.4 mm | 0.4 mm (0.25 mm optional, see below) | 0.4 mm |
| Layer height | 0.16 mm (0.20 for a faster draft) | 0.12 mm | 0.20 mm |
| Walls / perimeters | 3 (1.2 mm) | 3 | 3 |
| Top / bottom layers | 5 / 4 | 5 / 4 | 5 / 4 |
| Infill | 12–15 % gyroid | 15 % gyroid | 20 % |
| Supports | Tree (auto), threshold 50°, **build plate only** | Tree (auto), threshold 50°, **build plate only** | Off |
| Brim | 5 mm (optional) | **5 mm, recommended** (it stands on a 3 mm-wide ring) | Off |
| Nozzle / bed temp | 210 °C / 60 °C | 210 °C / 60 °C | 210 °C / 60 °C |
| Seam | "Back" / aligned rear | Aligned, rear | Any |

Why **build plate only**: with "everywhere", a slicer can still seed tiny
supports on the internal ramp under the inlet funnels. Those can't be removed
through the openings, and they'd become dice snags. With "build plate only",
supports go only under the belly, arms, chin and tail.

**0.25 mm nozzle (optional):** the heads print noticeably crisper with a
0.25 mm nozzle at 0.12 mm layers (sharper scales, pupils and nostrils). They take
about 2.5× longer. The body is fine on 0.4 mm.

**Multi-colour on the AD5X:** the STLs are single bodies. To get the
cream belly, horns and claws from the reference, use the slicer's colour-painting
tool (Orca-Flashforge: *Color painting*, "smart fill" by angle) on the belly
plates, horns, back spikes, claws and fangs, with purple as the base filament.
The flat-bottomed belly plates and the grooves around them make the smart-fill
boundaries easy to hit. Hand-painting with acrylics after printing works too.
The eyes look best painted: white eyeball, black pupil (the pupil is a shallow
dish you can flood with paint), plus a white dot.

## Before assembly

1. Remove the exterior supports. Check that **nothing** hangs inside the mouths
   or the rear arch; there shouldn't be any supports in there.
2. Shine a phone torch through each mouth and look out of the rear arch. You
   should see light along the ramp with no strings or blobs. Trim any stringing
   with a hobby knife.
3. Test-fit each neck on its spigot **before** any glue.

## Assembly

1. **Find the matching spigot.** Each of the three round spigots on the
   shoulders points along its own neck's axis: the middle one is near-vertical
   and the side ones lean out about 38°. Left/right follows the hydra's own
   left/right, so `neck_left` sits on the spigot at **+X**, the viewer's
   *right* when facing the hydra.
2. **Line up the key.** Each spigot has a small rib on its rear side, and each
   neck's bore has a matching slot. Turn the neck until the slot meets the rib.
3. **Push down** until the neck's flat face meets the stub's flat face. The
   seam is a thin line at the base of each neck.
4. **Fit check.** The default radial clearance is 0.25 mm (`FIT_CLEARANCE` in
   `generator/hydra_model.py`).
   - Too tight: sand the spigot lightly, or reprint the neck with
     `FIT_CLEARANCE = 0.3`.
   - Wobbly: a wrap of thin tape on the spigot, or 3–4 small dots of CA glue.
     **Leaving the necks unglued is recommended**, so a neck can be lifted off
     to clear a stuck die or a non-standard die.
5. Put the **tray** behind the hydra with its low wall against the rump, so it
   sits under the arch. A self-adhesive felt sheet in the tray floor makes it
   much quieter.

## Using it

Drop any standard die (d4 … d20, up to ~26 mm) into any mouth. It drops
through the neck, lands on the 42° impact deflector, tumbles over two 6 mm steps
on the 32° ramp, and "plops" out of the rear arch into the tray.

## If a die ever sticks

- Lift the neck off (it isn't glued) and tip the die out.
- Very large or unusually shaped dice (metal d20s over 26 mm, novelty dice)
  are outside what was tested. See `docs/validation_report.json` and
  `docs/dice_simulation.json` for what was verified.
