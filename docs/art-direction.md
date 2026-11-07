# Art direction

## The look in one paragraph

A plastic toy world photographed at night with a macro lens. The bricks keep their bright toy colours; everything around them (sky, fog, the cloud sea below) is deep blue and charcoal. Light comes from a cold moon behind the islands and from small warm lanterns on them. The camera behaves like a real miniature camera: shallow focus at the top and bottom of the frame, slight vignette, a little film grain. Characters and machines move on twos (12 frames a second) like stop-motion; the camera and the light move smoothly.

## Colour

### Environment (not plastic)

| Token | Hex | Use |
|---|---|---|
| sky-zenith | `#05080f` | top of the sky dome |
| sky-horizon | `#1a2738` | horizon band |
| fog | `#111b28` | distance fog; everything far away goes to this |
| cloud-deep | `#0d1520` | cloud sea, shadowed |
| cloud-lit | `#2a3a50` | cloud sea, moonlit tops |
| moon | `#cfdcf2` | moon disc and key light tint |
| amber | `#ffb15a` | lanterns, windows, the figure's lantern |
| cyan | `#4fd8e8` | data tiles, Lab lamps, one pulse on the Dormant Rock. Used sparingly |

### Plastic palette (approximate LEGO colour names)

| Name | Hex | Where |
|---|---|---|
| White | `#f2f3f2` | Lab, lighthouse stripes |
| Light bluish grey | `#a0a5a9` | stone, machines |
| Dark bluish grey | `#6c6e68` | rock, Works structures |
| Black | `#1b2a34` | Works, Dormant Rock |
| Bright red | `#c91a09` | lighthouse stripes, accents |
| Dark red | `#720e0f` | Works halls, Archive banners |
| Bright yellow | `#f2cd37` | hazard trim, flowers |
| Orange | `#fe8a18` | the crane |
| Dark orange | `#a95500` | the figure's jacket, Workshop |
| Reddish brown | `#582a12` | timber, dock planks, roots |
| Tan | `#e4cd9e` | paths, Archive stone |
| Dark tan | `#958a73` | cliffs, Archive |
| Green | `#237841` | grass |
| Bright green | `#4b9f4a` | grass patches |
| Dark green | `#184632` | trees, moss |
| Sand green | `#a0bcac` | roofs, copper |
| Sand blue | `#6074a1` | Lab, the figure's trousers |
| Dark blue | `#0a3463` | Lab trim |
| Medium azure | `#36aebf` | Lab details |
| Lime | `#bbe90b` | the figure's straps and chest mark (the classic site's `#bada55` brand lime) |
| Pearl gold | `#aa7f2e` | pipes, gauges |
| Trans clear | `#fcfcfc` at 35% | windows |
| Trans light blue | `#aeefec` at 55% | Lab glass, data tiles |
| Trans orange | `#f08f1c` at 70% | lanterns |

Every brick gets a tiny random shift in lightness (about ±2%) so large areas of one colour do not look like a single printed surface.

## Materials

| Class | Three.js setup | Notes |
|---|---|---|
| Plastic | `MeshPhysicalMaterial`, roughness 0.32, clearcoat 0.25 (high tier), vertex colours | All opaque bricks of an island share one material and one draw call. |
| Transparent | `MeshPhysicalMaterial`, transmission off, opacity 0.45 to 0.6, roughness 0.05 | Windows, glass, data tiles. |
| Glow | `MeshBasicMaterial`, colour multiplied above 1 so bloom picks it up | Lit windows, lanterns, lamp heads. Kept near 3 to avoid white slabs under tone mapping. |
| Metal | `MeshStandardMaterial`, metalness 0.85, roughness 0.35 | Pearl gold and flat silver pieces. |

Reflections come from a dim `RoomEnvironment` (intensity about 0.35). It gives the plastic its specular edge without lighting the night scene like a studio.

## Geometry rules (what makes it read as LEGO)

- Real proportions: stud pitch 1, plate 0.4, brick 1.2, stud diameter 0.6, stud height 0.21 (from 8 / 3.2 / 9.6 / 4.8 / 1.7 mm).
- Every brick has 45° chamfered edges (0.03) so edges catch a thin highlight.
- Bricks are 0.016 narrower than their grid cell, so seams between neighbours show.
- Studs have a rounded top edge and appear only where nothing covers them.
- Paths are smooth tiles, grass is studded plates. The difference between studded and smooth surfaces carries a lot of the realism.
- Walls are built in running bond (each course offset), never from one long block.
- Slight imperfection: each brick may sit up to 0.01 off its grid position and up to 0.3° off square.

## Lighting

- **Key:** one directional moonlight, `#b8c8e8`, from behind-left of the route (the moon is visible in the sky in that direction). Soft PCF shadows; the shadow camera follows the active island so shadows stay sharp.
- **Fill:** a hemisphere light, sky `#3b5372`, ground `#0b0f16`, low intensity, so the undersides of the islands fall into darkness.
- **Practicals:** a pool of four warm point lights (two on the low tier) assigned each frame to the lanterns nearest the camera's focus, plus the figure's own lantern.
- **Selective cyan:** emissive only, no real lights, so it stays a detail.
- **Atmosphere:** linear fog to `#111b28`; a cloud sea far below; faint additive light cones under lanterns and from the lighthouse.

## Camera language

- Lens: 35 to 40° vertical field of view for wide shots, 28 to 32° for close shots. Never wider than 45°.
- Height: wide shots look down 20 to 35°; exhibit shots sit near the figure's eye line, slightly above.
- Miniature focus: a tilt-shift blur blurs the top and bottom bands of the frame; strength rises on wide shots and falls on close ones.
- Movement is smooth, damped and slow. No roll, no shake, no orbiting while the visitor reads.
- When a panel opens, the image shifts so the subject sits in the visible part of the screen, rather than the camera moving around it.

## Character

A custom minifigure in standard proportions with yellow skin (the classic neutral, no personal features invented).

- **Clothes:** dark orange explorer jacket with a printed lime chest mark (the classic site's `hub` emblem) and lime backpack straps; sand-blue trousers; reddish-brown wide-brim hat.
- **Accessories:** a tan backpack and a hand lantern (trans orange) that casts a real warm light.
- **Face:** printed eyes with a highlight and a small smile. Blinks every 3 to 6 seconds. The eyes look toward the exhibit being discussed.

## Animation vocabulary

| What | Rate | Character of motion |
|---|---|---|
| Figure: walk, run, idle, look, discover, interact | 12 fps (on twos) | Held poses, small overshoot on landings |
| Figure position on the route | 12 fps | Moves in discrete steps while the camera glides |
| Brick assembly | 12 fps | Each brick drops two plates, then one, then seats; next brick starts as the previous seats |
| Machines: conveyor, crane, clock hand, gears | 8 fps | Mechanical, one tooth or one stud per frame |
| Small life: flags, smoke puffs, antenna blink | 6 fps | Sparse, irregular |
| Camera, fog, light changes, lighthouse beam | continuous | Smooth, eased |
| UI panels | continuous, 180 to 240 ms | ease-out; no bounce |

Under reduced motion, stepped loops stop (machines rest on a frame, the figure stands), camera moves become cuts, and assembly shows the finished build.

## Typography

Dealt by the taste skill for a game page: **Bricolage Grotesque** (headings; its uneven, hand-cut character suits stop-motion), **Figtree** (body text, panels), **DM Mono** (step numbers, part counts, metrics labels). Sentence case everywhere. Panel body 16 to 17 px, line height 1.55.

## UI treatment

The interface is drawn as **building-instruction booklet pages** held over the scene: cream paper, dark ink, thin rules, step numbers in square boxes, and a pale blue "parts used" callout for each project's tech stack. This ties the UI to the brick world without imitating game HUDs or dashboards.

| Token | Value |
|---|---|
| paper | `#f2ede2` |
| paper-deep | `#e6dfcf` |
| ink | `#17202b` |
| ink-muted | `#4d5866` (7:1 on paper) |
| rule | `#cdc4b1` |
| callout | `#dbe6ec` |
| accent (labels, active marks) | `#a3421a` (5.4:1 on paper, measured) |

One card style, one primary button (ink fill, paper text), one secondary (ink outline). Buttons lift 1 px on hover and press to 0.97. Panels slide 16 px and fade in 220 ms.

## Environmental details

Lanterns on posts, ropes on the dock, crates, hazard stripes, smoke puffs, hanging roots under every island, moss plates on cliffs, tiny flowers, a brick tree per island in that island's palette, signage as printed tiles, a moored skiff, distant ruined rocks in the fog, and a faint moon halo.

## Anti-patterns (do not do)

- Smooth cubes with no studs or seams.
- Neon outlines, glowing grids, holographic panels, "cyber" dashboards. The classic site's terminal look stays on the classic site.
- Bloom on everything. Only lamp and window bricks are bright enough to bloom.
- Saturated sky. The sky is nearly black-blue; colour belongs to the plastic.
- Violet or purple anywhere in the world's own palette.
- Repeated identical buildings. Each island's buildings use a different footprint and palette.
- Floating details that do not attach to anything.
- Important text as 3D lettering. Signs carry a word or two; paragraphs live in panels.
- Particles for their own sake. Dust motes are few and slow.
