import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bluely.org').replace(/\/$/, '');
const read = (path) => readFileSync(`.next/server/app/${path}`, 'utf8');
const pages = ['index', 'about', 'mission', 'resources', 'contact', 'volunteer', 'share-your-story', 'channels', 'privacy', 'terms', 'medical-disclaimer', 'resources/understanding-type-1-diabetes', 'resources/diabetes-at-school', 'resources/supporting-someone-with-t1d'];
const titles = new Set();
for (const page of pages) {
    const html = read(`${page}.html`);
    const path = page === 'index' ? '/' : `/${page}`;
    const canonical = html.match(/<link rel="canonical" href="([^\"]+)"/)?.[1];
    assert.ok(canonical, `Canonical missing: ${page}`);
    assert.equal(new URL(canonical).href, new URL(path, siteUrl).href, `Canonical incorrect: ${page}`);
    assert.match(html, /name="robots" content="index, follow"/, `Public route must be indexable: ${page}`);
    assert.match(html, /property="og:image" content="[^\"]+\/images\/bluely-og.jpg"/, `OG image missing: ${page}`);
    assert.match(html, /name="twitter:card" content="summary_large_image"/, `Twitter card missing: ${page}`);
    assert.match(html, /name="description" content="[^\"]+"/, `Description missing: ${page}`);
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    assert.ok(title && !titles.has(title), `Missing or duplicate title: ${page}`);
    titles.add(title);
}
for (const page of ['dashboard', 'glucose', 'settings', 'login', 'signup', 'admin', 'onboarding']) {
    assert.match(read(`${page}.html`), /name="robots" content="noindex, follow"/, `Account route must be noindex: ${page}`);
}
const home = read('index.html');
const schemaText = home.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1];
assert.ok(schemaText, 'Structured data missing');
const graph = JSON.parse(schemaText)['@graph'];
assert.equal(graph.find((item) => item['@type'] === 'Person').name, 'Simeon Azeh');
assert.ok(graph.find((item) => item['@type'] === 'Organization').founder);
assert.ok(read('about.html').includes('Vera Itoe'));
const sitemap = read('sitemap.xml.body');
assert.equal((sitemap.match(/<loc>/g) || []).length, pages.length);
for (const page of pages) assert.ok(sitemap.includes(`<loc>${siteUrl}${page === 'index' ? '/' : `/${page}`}</loc>`), `Sitemap missing ${page}`);
assert.ok(!sitemap.includes('/dashboard') && !sitemap.includes('/stories/01'));
assert.ok(read('robots.txt.body').includes(`${siteUrl}/sitemap.xml`));
const image = await sharp('public/images/bluely-og.jpg').metadata();
assert.equal(image.width, 1200);
assert.equal(image.height, 630);
console.log(`SEO checks passed: ${pages.length} public URLs, account-page noindex, founder schema, sitemap, robots.txt and 1200×630 OG image.`);
