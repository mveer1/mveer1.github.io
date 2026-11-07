// Map of the islands drawn from the real stud cells of each island.
import { ISLANDS, islandById } from '../content/content.js';

const FILL = { harbour: '#5a9f52', works: '#7a7c76', lab: '#9db8aa', workshop: '#b06a28', archive: '#a2967c', lookout: '#c0392b', dormant: '#2c3a46' };

export function mapSVG(world, fig, hiddenFound) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  const groups = [];
  for (const is of world.walk.islands) {
    if (is.id === 'dormant' && !hiddenFound) continue;
    let d = '';
    let cx = 0, cz = 0, n = 0, top = Infinity;
    for (const k of is.cells) {
      const [x, z] = k.split(',').map(Number);
      const X = x + is.ox, Z = z + is.oz;
      d += `M${X} ${Z}h1v1h-1z`;
      minX = Math.min(minX, X); maxX = Math.max(maxX, X + 1); minZ = Math.min(minZ, Z); maxZ = Math.max(maxZ, Z + 1);
      cx += X; cz += Z; n++; top = Math.min(top, Z);
    }
    cx /= n; cz /= n;
    const info = islandById[is.id];
    groups.push(`<g class="map-island" data-island="${is.id}" tabindex="0" role="button" aria-label="Travel to ${info.name}">
      <path class="cells" d="${d}" fill="${FILL[is.id]}" stroke="rgba(23,32,43,0.18)" stroke-width="0.12"/>
      <text x="${cx}" y="${top - 4.2}" text-anchor="middle">${info.name.replace('The ', '')}</text>
      <text class="sub-label" x="${cx}" y="${top - 1.2}" text-anchor="middle">${info.label}</text>
    </g>`);
  }
  const lines = world.bridges.map((b) => `<line x1="${b.a.x}" y1="${b.a.z}" x2="${b.b.x}" y2="${b.b.z}" stroke="#582a12" stroke-width="1.6" stroke-dasharray="0.8 0.5"/>`);
  for (const tr of world.transports || []) if (tr.mapLine && (tr.id !== 'lift' || hiddenFound)) lines.push(`<line x1="${tr.mapLine[0].x}" y1="${tr.mapLine[0].z}" x2="${tr.mapLine[1].x}" y2="${tr.mapLine[1].z}" stroke="#17202b" stroke-width="0.5" stroke-dasharray="2 1"/>`);
  const pad = 10;
  const vb = `${minX - pad} ${minZ - pad - 6} ${maxX - minX + pad * 2} ${maxZ - minZ + pad * 2 + 6}`;
  const you = fig ? `<g class="map-you"><circle cx="${fig.x}" cy="${fig.z}" r="1.6" fill="#c4561f" stroke="#f2ede2" stroke-width="0.5"/><text x="${fig.x + 2.4}" y="${fig.z + 1}" style="font: 600 3px Figtree, sans-serif; fill:#c4561f">You</text></g>` : '';
  return `<svg viewBox="${vb}" role="img" aria-label="Map of the islands"><title>Map of the islands</title>${lines.join('')}${groups.join('')}${you}</svg>`;
}

export { ISLANDS };
