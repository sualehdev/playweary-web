# Christmas art: what to generate (Higgsfield)

Formats Higgsfield gives you: PNG, GIF, SVG. The site accepts **GIF, PNG or WebP** and picks whichever file it finds (GIF first), so just drop files into `public/christmas/` with these names. Until a file exists the site shows the built-in SVG drawing.

Model: **GPT Image 2.6** (`gpt_image_2_6`), the one that can output GIF and transparent PNG.

Style to match the site: glossy 3D cartoon, soft rounded shapes, big friendly eyes, bright saturated colours (violet #9f3eff, amber #fcc006, red, green), full figure, centered, no text, no logos.

| File | Format | Settings | Prompt |
|---|---|---|---|
| `santa.png` (do first, style check) | PNG | background transparent, 1k | "Cute 3D cartoon Santa Claus waving with one hand, full body, friendly round face, glossy plastic toy look, bright red suit, white beard, soft studio lighting, no text" |
| `tree.png` | PNG | background transparent, 1k | "Cute 3D cartoon Christmas tree decorated with colourful baubles, a golden star on top and small wrapped presents at the base, glossy toy look, bright saturated colours, no text" |
| `santa.gif` (replaces santa.png when present) | GIF | size 288x352 (divisible by 16), frame_count 12, frame_duration_ms 120, background **opaque dark purple #2a0a5e** | "Cute 3D cartoon Santa Claus waving his hand in a smooth loop, full body, glossy toy look, bright red suit, on a flat dark purple background, same character in every frame, no text" |

## GIF cautions
- A GIF can only be fully see-through or fully solid, so a transparent GIF gets jagged edges. The dark-purple background matches the pop-up's art panel, so it blends in there. On the small floating gift button it shows as a purple box, so keep the PNG for that if it looks off.
- Keep it under ~300 KB: fewer frames (8 to 12), 288 px wide. Heavier GIFs slow the page.
- If the GIF is rough, an MP4/WebP of the same wave is smaller and smoother; ask and I'll wire a `<video>` version.

Use PNGs for still art (tree, gifts) and the GIF only for the one moving Santa. That keeps the page light.

---

# Flying sleigh (loops across the top of the page)

The site flies the sleigh across the screen itself (CSS), again and again every ~12 s. The GIF only needs to be the sleigh and reindeer **in place, galloping and bobbing**. Save it as `public/christmas/sleigh.gif` (or `sleigh.png` for a still). Until it exists the site shows the built-in drawing.

**Settings (GPT Image 2.6):** format GIF, background **Transparent** (it flies over a light page, so an opaque box would show), quality Medium, size **480x240**, frames **12**, frame duration **100 ms**, batch size **1**.

**Prompt:**

> Looping animated sticker of Santa Claus riding a red sleigh pulled by one cute reindeer with a glowing red nose, side view facing right, whole sleigh and reindeer fully in frame and centered, cute glossy 3D cartoon toy style, bright saturated colours (red, gold, brown), sack of colourful gift boxes in the sleigh, golden runners. The reindeer gallops in place with its legs and antlers moving, the sleigh gently bobs up and down, Santa waves one hand, a few golden sparkles twinkle behind the sleigh. Transparent background, no ground, no sky, no clouds, no snow, no text. Camera completely still, same size and position in every frame, smooth seamless loop where the last frame matches the first.

**Avoid (add at the end if there's a negative field):** background, ground shadow, camera movement, zoom, text, watermark, extra reindeer, blurry frames.

**If the transparent GIF has rough edges** (a GIF cannot do soft edges): generate the same prompt as a **PNG** (background transparent, 1k, single frame, "still pose, no animation") and save it as `sleigh.png`. The site already makes it bob, and it flies across with sparkles, which looks smoother than a rough GIF.
