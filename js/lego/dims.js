// LEGO system dimensions in world units. 1 unit = one stud pitch (8 mm).
// Derived from public measurements: pitch 8.0 mm, plate 3.2 mm, brick 9.6 mm,
// stud diameter 4.8 mm, stud height 1.7 mm.
export const STUD = 1;
export const PLATE = 0.4;
export const BRICK = 1.2;
export const STUD_R = 0.3;
export const STUD_H = 0.21;
export const GAP = 0.008;      // per side; neighbouring bricks show a 0.016 seam
export const CHAMFER = 0.028;  // edge chamfer that catches the highlight line

/** Plates to world height. */
export const py = (plates) => plates * PLATE;
