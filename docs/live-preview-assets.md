# Live personalization preview assets

Created with the built-in `image_gen.imagegen` tool, not the CLI. Rendering while typing runs locally in Canvas 2D and makes no image-generation requests.

## Saved project assets

- `public/assets/preview-corduroy-blank.png`: original blank ivory corduroy product mockup (retained source).
- `public/assets/preview-corduroy-cutout.png`: alpha cutout used by the live corduroy preview and programmatic recoloring.
- `public/assets/preview-jute-blank.png`: blank burlap tote photograph used by the Christmas live preview.
- `public/assets/product52.jpg`: reference listing photograph from Callie's public product page, downloaded from `https://d3ouql8tmwncoe.cloudfront.net/uploads/20241127/8479812e0a553cd1887bdf1805e68409.jpg?d=1000`.
- `public/assets/preview-lobster.ttf`: Lobster typeface from Google Fonts; the license is retained as `public/assets/preview-lobster-OFL.txt`.

These are design mockups. They do not constitute production print files or exact manufacturer proofs. Christmas lettering, snowflakes, ornaments, name patches and accessory illustrations are composed by `public/live-preview.js`.

## Final prompt set

### Corduroy blank product photo

Use case: product-mockup. Generate a production-ready blank product photo for a live personalization editor. Square 1024x1024. A single small children's corduroy crossbody handbag exactly front-on, centered, natural ivory/cream color, two short round top handles and discreet side shoulder strap loops. The same shape as a cute small corduroy name-patch kids handbag: rounded rectangular body, prominent fine vertical ribbing, fabric covered round handles, small metal snap at top center. Body occupies x=180..840 and y=400..860, handles rise to y=150. Neutral warm off-white seamless studio background, gentle daylight from top left, subtle grounded shadow. Entire bag front completely blank with no name, no writing, no patch, no decorations, no logos; no other objects. Camera faces the bag perfectly straight, no side perspective. Carefully retain realistic fine vertical ribbed fabric across entire blank front for overlaying letters later.

### Jute blank product photo

Use case: product-mockup. Generate a production-ready blank product photo for a live Christmas name tote editor. Square 1024x1024. One natural tan burlap/jute shopping tote bag in a straight front-on studio view, centered. Rectangular wide open-top tote, two upright rounded matching tan woven fabric handles, warm cream cotton rectangular front panel surrounded by a 35px tan burlap border, extremely fine realistic jute woven texture on panel. Bag front perfectly flat, no side perspective. Main rectangular body from x=165 to855 and y=380 to900, handles rise to y=110. Warm very pale beige studio seamless background and soft grounded shadow. No lettering, no name, no printed design, no logos, no ornaments or decoration. Photorealistic catalog product, high fidelity realistic texture, generous blank front for adding festive letters dynamically.

### Corduroy transparent cutout

Use case: background-extraction. Edit target: the attached blank ivory corduroy handbag product photograph. Remove only the background and all floor/shadow pixels. Return the identical bag on a truly transparent background, including true transparency in the open space inside/between the two handles. Preserve exact image dimensions, product position, silhouette, fine ribbed fabric, snap, strap loops, all details, proportions and lighting unchanged. Do not redraw or move the bag. No lettering, no name, no patch, no other objects. This alpha cutout will be recolored programmatically in a live product preview.
