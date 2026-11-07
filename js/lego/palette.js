// Plastic colours, approximating official LEGO colour names.
// `cls` picks the material class a part is merged into.
export const C = {
  white:        { hex: 0xf2f3f2 },
  lightGray:    { hex: 0xa0a5a9 },
  darkGray:     { hex: 0x6c6e68 },
  black:        { hex: 0x1b2a34 },
  red:          { hex: 0xc91a09 },
  darkRed:      { hex: 0x720e0f },
  yellow:       { hex: 0xf2cd37 },
  orange:       { hex: 0xfe8a18 },
  darkOrange:   { hex: 0xa95500 },
  brown:        { hex: 0x582a12 },   // reddish brown
  darkBrown:    { hex: 0x352100 },
  tan:          { hex: 0xe4cd9e },
  darkTan:      { hex: 0x958a73 },
  green:        { hex: 0x237841 },
  brightGreen:  { hex: 0x4b9f4a },
  darkGreen:    { hex: 0x184632 },
  sandGreen:    { hex: 0xa0bcac },
  olive:        { hex: 0x9b9a5a },
  sandBlue:     { hex: 0x6074a1 },
  darkBlue:     { hex: 0x0a3463 },
  blue:         { hex: 0x0055bf },
  azure:        { hex: 0x36aebf },     // medium azure
  darkAzure:    { hex: 0x078bc9 },
  lime:         { hex: 0xbbe90b },
  pearlGold:    { hex: 0xaa7f2e, cls: 'metal' },
  silver:       { hex: 0x898788, cls: 'metal' },
  transClear:   { hex: 0xeef4f6, cls: 'trans' },
  transBlue:    { hex: 0xaeefec, cls: 'trans' },
  transOrange:  { hex: 0xf08f1c, cls: 'trans' },
  // Light-emitting pieces. Values above 1 drive bloom after tone mapping.
  glowAmber:    { hex: 0xffa040, cls: 'glow', power: 1.9 },
  glowWarm:     { hex: 0xffc27a, cls: 'glow', power: 1.5 },
  glowCyan:     { hex: 0x4fd8e8, cls: 'glow', power: 1.9 },
  glowMoon:     { hex: 0xcfdcf2, cls: 'glow', power: 1.6 },
  glowRed:      { hex: 0xff4a3a, cls: 'glow', power: 2.2 },
  glowGreen:    { hex: 0x7dff8a, cls: 'glow', power: 1.8 },
};

/** Resolve a colour key or object to a palette entry. */
export function col(c) {
  if (typeof c === 'string') {
    const e = C[c];
    if (!e) throw new Error(`Unknown brick colour: ${c}`);
    return e;
  }
  return c;
}
