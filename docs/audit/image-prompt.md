# Hero portrait cutout

Mode: built-in `imagegen`, edit / `background-extraction`, transparent background enabled. The imagegen skill was used to meet PRD 01 UI-03 without replacing the owner's identity with the person in the reference.

Source: `dist/img/ChatGPT Image Aug 11, 2026, 06_59_37 PM.png` (retained unchanged).

Output: `dist/img/alif-portrait-cutout.png` (new derived asset). The original portrait is still used for the contact avatar. Grayscale is applied only through CSS. Browser verification samples a transparent corner and confirms an alpha value of zero.

Final prompt:

> Use case: background-extraction. Asset type: personal portfolio hero portrait cutout. Image 1 is the EDIT TARGET, not inspiration. Remove ONLY the gray studio background behind the person and return a genuinely transparent-background PNG with alpha. Preserve the exact person, facial identity, eyes, glasses, hair, skin, body proportions, crossed-arm pose, black jacket, white shirt, watch, original crop, and photographic details. Do not redraw, beautify, restyle, change lighting, invent body parts, or change clothing. Keep the full visible subject from the existing photo and natural clean edges around hair and clothing. Transparent background everywhere outside the person; no checkerboard painted into the image, no backdrop, no blue tint, no text, no shadow. Maintain original framing with the subject centered for overlapping large hero typography. This is an identity-preserving background removal only.

The result was visually inspected against the original. This is an AI-derived cutout, not a claim of pixel-identical photographic extraction.
