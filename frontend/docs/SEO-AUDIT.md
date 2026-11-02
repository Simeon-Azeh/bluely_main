# Bluely SEO audit — 2 November 2026

## Implemented

- Updated Vera's full name to Vera Itoe.
- Added a configurable production origin, defaulting to https://bluely.org, based on the supplied brand thumbnail. Set NEXT_PUBLIC_SITE_URL before the production build if this differs.
- Added unique titles and descriptions, self-referencing canonicals, Open Graph previews and Twitter large-image cards for the 11 public pages and three resource articles.
- Added Simeon Azeh as author/creator in site metadata, founder in custom metadata, founder in Organization structured data, and the named Person linked from the Organization and WebSite. The About page names him as founder in both visible content and metadata. Educational resource authors remain Bluely.
- Defaulted account, admin, authentication and health-tracking routes to noindex. Public routes explicitly opt into indexing. Robots allows HTML crawling so crawlers can see noindex; this is not access control.
- Added /sitemap.xml and /robots.txt. Sitemap includes only public pages, resources, and any future published story with a real video URL. No invented modification timestamps.
- Removed the viewport zoom restriction and added a main landmark to the homepage.
- Created public/images/bluely-og.jpg: 1200 × 630, approximately 127 KB, using the supplied children's insulin photo as the reference.

## Sitemap

After deployment: https://bluely.org/sitemap.xml
Locally: http://localhost:3000/sitemap.xml

Included routes: /, /about, /mission, /resources, /contact, /volunteer, /share-your-story, /channels, /privacy, /terms, /medical-disclaimer, and the three /resources/{slug} articles.

## Verification

Run npm run build, then node scripts/check-seo.mjs from frontend. The checks inspect generated production HTML, structured data, sitemap/robots output and OG dimensions.

## Deployment follow-up and limits

Deploy these files before submitting the sitemap in Google Search Console. Search Console verification, live indexing, social-platform cache refresh and real-world performance were not tested. Structured data identifies entities; it does not guarantee ranking or rich results. Social descriptions may be rewritten by search engines. Do not treat the global author tag as medical review or credentials.

The About and Mission page hero imagery still includes generated photography; this SEO task did not replace those assets. Existing next/image unoptimized configuration remains; selected new photographs have already been compressed.

## OG design provenance

Mode: built-in image_gen, reference image public/images/images.jpg. Final generated artwork resized and encoded to JPEG for the public asset.

Prompt:

Create a polished Bluely Open Graph social sharing image, landscape 1200:630 composition. Use the supplied real photograph of children checking glucose and taking insulin as the photographic portion on the right 42%, preserving their identities, real skin texture and medical actions without generating new people. Deep brand blue #1F2F98 and navy #132653 on left, elegant restrained wave seam between blue and photo. Large crisp white modern sans-serif headline, exact text: "More than a diagnosis." Small white wordmark text "Bluely" above. Under headline small readable text: "Diabetes tools, education & community for Africa." Bottom small text: "Founded by Simeon Azeh" and "bluely.org". Warm, dignified, editorial, professional nonprofit health brand. Keep all text inside generous safe margins. No invented statistics, no extra text, no fake logos, no watermarks. Preserve supplied photo's real people and do not beautify or alter faces.

## References

- https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- https://developers.google.com/search/docs/appearance/structured-data/organization
