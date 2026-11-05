import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { loadData, validateData } from '../scripts/build.mjs';
import { renderHome, renderProject, publishedProjects, filterProjects, contactUrl, escapeHtml } from '../scripts/templates.mjs';
import { createStaticServer } from '../scripts/serve.mjs';

const data = await loadData();
test('verified portfolio data resolves every media asset with dimensions and alt text', () => {
  assert.equal(data.profile.fullName, 'Alif Fadhil Wibowo');
  assert.equal(data.profile.email, 'wibowalif22@gmail.com');
  for (const project of publishedProjects(data)) {
    assert.ok(project.coverImage.width > 0 && project.coverImage.height > 0);
    assert.ok(project.coverImage.alt);
  }
});
test('featured, full-catalog, and empty exploration filters return the correct data', () => {
  const projects = publishedProjects(data);
  assert.equal(filterProjects(projects).length, 4);
  assert.equal(filterProjects(projects, 'all', true).length, 5);
  assert.deepEqual(filterProjects(projects, 'exploration'), []);
  assert.ok(filterProjects(projects, 'real').every(project => project.projectType === 'real'));
});
test('unsafe, duplicate slugs and non-web preview URLs fail validation', () => {
  const unsafe = structuredClone(data); unsafe.projects[0].slug = '../escape';
  assert.throws(() => validateData(unsafe), /slug/);
  const duplicate = structuredClone(data); duplicate.projects[1].slug = duplicate.projects[0].slug;
  assert.throws(() => validateData(duplicate), /slug/);
  const script = structuredClone(data); script.projects[0].liveUrl = 'javascript:alert(1)';
  assert.throws(() => validateData(script), /URL/);
});
test('email template retains the real recipient, subject, and inquiry fields', () => {
  const url = new URL(contactUrl(data.profile));
  assert.equal(url.pathname, 'wibowalif22@gmail.com');
  assert.match(url.searchParams.get('body'), /Preferred time for a call:/);
  assert.match(url.searchParams.get('subject'), /Project inquiry/);
});
test('homepage has exactly one h1 and the five required sections in order', () => {
  const home = renderHome(data);
  assert.equal((home.match(/<h1\b/g) || []).length, 1);
  const positions = ['home', 'work', 'service', 'experience', 'contact'].map(id => home.indexOf(`id="${id}"`));
  assert.ok(positions.every(position => position > 0));
  assert.deepEqual([...positions].sort((a,b) => a-b), positions);
  assert.ok(!home.includes('three.min.js') && !home.includes('canvas-3d'));
  assert.match(home, /aria-controls="panel-web"/);
});
test('navbar follows the reference with a status pill, bracketed real counts, anchors and the existing contact template', () => {
  const header = renderHome(data).match(/<header class="site-header">[\s\S]*?<\/header>/)[0];
  assert.ok(!header.includes('home-mark') && !header.includes('<img'));
  assert.match(header, /class="header-identity"><span class="status"/);
  assert.ok(header.includes(`Work <span class="nav-count">[${String(publishedProjects(data).length).padStart(2, '0')}]</span>`));
  assert.ok(header.includes(`Service <span class="nav-count">[${data.services.length}]</span>`));
  assert.ok(header.includes(`Experience <span class="nav-count">[${data.profile.experienceYears}y+]</span>`));
  for (const anchor of ['work', 'service', 'experience', 'contact']) assert.ok(header.includes(`href="#${anchor}"`));
  assert.ok(header.includes(escapeHtml(contactUrl(data.profile))));
  assert.match(header, /aria-controls="primary-nav" aria-expanded="false"/);
});

test('Web Development experience keeps its full-stack description and existing company title consistent in source and homepage', async () => {
  const experience = data.experience.find(item => item.id === 'independent');
  assert.equal(experience.organization, 'Web Development - PT Karya Indonesia');
  assert.equal(experience.role, 'Full Stack Web Development');
  assert.equal(experience.description.length, 4);
  const description = experience.description.join(' ');
  for (const subject of ['backend application logic', 'responsive web interfaces', 'application data', 'integrate APIs', 'functional requirements', 'maintainable code']) assert.ok(description.includes(subject), subject);
  const currentHome = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const page of [renderHome(data), currentHome]) {
    const details = page.match(/<div class="experience-inline" id="experience-independent">[\s\S]*?<\/article>/)[0];
    assert.match(details, /<ul class="experience-responsibilities">/);
    for (const item of experience.description) assert.ok(details.includes(`<li>${escapeHtml(item)}</li>`));
    assert.match(details, /data-experience-carousel/);
    assert.equal((details.match(/data-carousel-slide /g) || []).length, experience.galleryImages.length + 1);
    assert.ok(page.includes(`<span class="experience-org">${escapeHtml(experience.organization)}</span>`));
    assert.ok(!page.includes('Web products, application logic, APIs, and practical digital systems.'));
  }
});

test('BPS internship follows Karind with the confirmed period, backend list, seven assets and no fabricated project link', async () => {
  const index = data.experience.findIndex(item => item.id === 'bps-semarang');
  const bps = data.experience[index];
  assert.equal(data.experience[index - 1].id, 'independent');
  assert.equal(bps.organization, 'Badan Pusat Statistik (BPS) Kota Semarang');
  assert.equal(bps.role, 'Web Application - Backend Developer');
  assert.equal(bps.startDate, '2025-08'); assert.equal(bps.endDate, '2026-01'); assert.equal(bps.isCurrent, false);
  assert.equal(bps.description.length, 6);
  for (const subject of ['SIMKADPRO', 'data models', 'server-side validation', 'authentication', 'CSV export', 'test application workflows']) assert.ok(bps.description.join(' ').includes(subject), subject);
  const media = [bps.previewImage, ...bps.galleryImages];
  assert.equal(media.length, 7); assert.equal(new Set(media.map(item => item.src)).size, 7);
  assert.equal(media.filter(item => item.src.endsWith('.png')).length, 4);
  assert.equal(media.filter(item => item.src.endsWith('.jpeg')).length, 3);
  for (const item of media) {
    assert.ok(item.width > 0 && item.height > 0 && item.alt && item.caption);
    const bytes = await readFile(new URL('../' + item.src, import.meta.url));
    assert.ok(bytes.length > 0);
    if (item.src.endsWith('.png')) { assert.equal(bytes.readUInt32BE(16), item.width); assert.equal(bytes.readUInt32BE(20), item.height); }
    else assert.equal(bytes.readUInt16BE(0), 0xffd8);
  }
  for (const home of [renderHome(data), await readFile(new URL('../index.html', import.meta.url), 'utf8')]) {
    assert.ok(home.indexOf('aria-controls="experience-independent"') < home.indexOf('aria-controls="experience-bps-semarang"'));
    assert.ok(home.indexOf('aria-controls="experience-bps-semarang"') < home.indexOf('aria-controls="experience-internship"'));
    const panel = home.match(/<div class="experience-inline" id="experience-bps-semarang">[\s\S]*?<\/article>/)[0];
    assert.equal((panel.match(/data-carousel-slide /g) || []).length, 7);
    assert.equal((panel.match(/class="experience-carousel-dot"/g) || []).length, 7);
    assert.equal((panel.match(/<li>/g) || []).length, bps.description.length);
    for (const item of media) assert.ok(panel.includes(`src="${item.src}"`) && panel.includes(escapeHtml(item.caption)));
    assert.ok(home.includes('Aug 2025 — Jan 2026'));
    assert.ok(!panel.includes('Related project') && !home.includes('work/undefined/'));
    assert.ok(home.includes('href="work/karind/index.html"'));
  }
});

test('SIMONE experience preserves the original and clearly identifies both code-rendered reconstruction assets', async () => {
  const item=data.experience.find(experience=>experience.id==='internship');
  assert.equal(item.organization,'Institutional Systems - Pengadilan Negeri Semarang');
  assert.equal(item.previewImage.src,'dist/img/portfolio/simone.PNG');
  assert.match(item.previewImage.caption,/original screenshot/);
  assert.equal(item.galleryImages.length,2);
  for (const [index,scene] of ['dashboard','registration'].entries()) {
    const media=item.galleryImages[index];
    assert.equal(media.src,`dist/img/portfolio/simone-${scene}-concept.png`);
    assert.match(media.alt,/Reconstructed SIMONE/); assert.match(media.caption,/interface reconstruction, demo data/);
    assert.equal(media.width,1440); assert.equal(media.height,900);
    const bytes=await readFile(new URL('../'+media.src,import.meta.url));
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
    assert.equal(bytes.readUInt32BE(16),1440); assert.equal(bytes.readUInt32BE(20),900);
    const source=await readFile(new URL(`../assets/previews/simone/${scene}.html`,import.meta.url),'utf8');
    assert.match(source,/Rekonstruksi antarmuka · Data demonstrasi/);
    assert.match(source,/Mahasiswa Demo/);
    assert.ok(!/<script|https?:\/\//i.test(source));
  }
  for (const page of [renderHome(data),await readFile(new URL('../index.html',import.meta.url),'utf8')]) {
    const panel=page.match(/<div class="experience-inline" id="experience-internship">[\s\S]*?<\/article>/)[0];
    assert.equal((panel.match(/data-carousel-slide /g)||[]).length,3);
    assert.equal((panel.match(/class="experience-carousel-dot"/g)||[]).length,3);
    for (const media of [item.previewImage,...item.galleryImages]) assert.ok(panel.includes(`src="${media.src}"`) && panel.includes(escapeHtml(media.caption)));
    assert.ok(panel.includes('href="work/simone/index.html"'));
  }
  // Reconstruction images are not silently presented as historical case-study evidence.
  assert.equal(data.projects.find(project=>project.slug==='simone').galleryImages.length,0);
});

test('experience descriptions and galleries are validated and screenshot captions are escaped', () => {
  for (const description of [[], [''], ['Valid text', 12], '', null]) {
    const changed = structuredClone(data); changed.experience[0].description = description;
    assert.throws(() => validateData(changed), /experience description/);
  }
  for (const gallery of ['invalid', [{}], [{src:'image.png',alt:''}], [data.experience[0].previewImage]]) {
    const changed = structuredClone(data); changed.experience[0].galleryImages = gallery;
    assert.throws(() => validateData(changed), /experience gallery/);
  }
  for (const media of [data.experience[0].previewImage,...data.experience[0].galleryImages]) assert.ok(media.width > 0 && media.height > 0 && media.alt);
  const changed = structuredClone(data), payload = '<script>alert("example")</script>';
  changed.experience[0].description = [payload]; changed.experience[0].galleryImages[0].caption = payload;
  const page = renderHome(changed);
  assert.ok(!page.includes(payload)); assert.ok(page.includes(escapeHtml(payload)));
  assert.ok(!page.includes('data-carousel-previous') && !page.includes('data-carousel-next'));
  assert.match(page, /class="sr-only" data-carousel-status/);
  assert.match(page, /Hover to rotate automatically, click the edges/);
});

test('carousel edge cursors use local SVG assets, scoped fine-pointer styles and valid centered hotspots', async () => {
  const css = await readFile(new URL('../dist/css/style.css', import.meta.url), 'utf8');
  for (const direction of ['left', 'right']) {
    const svg = await readFile(new URL(`../dist/img/cursor-circle-${direction}.svg`, import.meta.url), 'utf8');
    assert.match(svg, /width="36" height="36" viewBox="0 0 36 36"/);
    assert.match(svg, /<circle/); assert.match(svg, /<path/);
    assert.ok(!/https?:\/\/(?!www.w3.org\/2000\/svg)|<script|<image/.test(svg));
    assert.ok(css.includes(`cursor: url("../img/cursor-circle-${direction}.svg") 18 18`));
  }
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.experience-carousel\.is-ready \.experience-carousel-stage\[data-carousel-cursor="previous"\]/);
});

test('Web Engineer gallery includes the supplied login screenshot with caption, alt text and verified dimensions', async () => {
  const experience = data.experience.find(item => item.id === 'independent');
  const login = experience.galleryImages.find(media => media.src === 'dist/img/portfolio/karind-login.png');
  assert.ok(login); assert.equal(login.caption, 'Karind login page');
  assert.match(login.alt, /email and password fields/);
  assert.ok(login.width > 0 && login.height > 0);
  const bytes = await readFile(new URL('../' + login.src, import.meta.url));
  assert.equal(bytes.readUInt32BE(16), login.width); assert.equal(bytes.readUInt32BE(20), login.height);
  for (const home of [renderHome(data), await readFile(new URL('../index.html', import.meta.url), 'utf8')]) {
    assert.ok(home.includes(`src="${login.src}"`));
    assert.ok(home.includes(`alt="${escapeHtml(login.alt)}"`));
    assert.ok(home.includes(`<figcaption>${escapeHtml(login.caption)}</figcaption>`));
  }
});

test('carousel motion has shared smooth timing without changing the autoplay interval', async () => {
  const css = await readFile(new URL('../dist/css/style.css', import.meta.url), 'utf8');
  const source = await readFile(new URL('../dist/js/main.js', import.meta.url), 'utf8');
  const carousel = source.slice(source.indexOf('function initExperienceCarousels()'), source.indexOf('function initFaqs()'));
  assert.match(css, /--carousel-motion-duration: 850ms/);
  assert.match(css, /--carousel-motion-ease: cubic-bezier\(\.4, 0, \.2, 1\)/);
  assert.match(carousel, /getPropertyValue\('--carousel-motion-duration'\)/);
  assert.match(carousel, /getPropertyValue\('--carousel-motion-ease'\)/);
  assert.match(carousel, /const interval = 5000;/);
  assert.ok(!carousel.includes('duration: 480'));
});

test('Experience disclosure has scoped smooth timing and clips content only during its transition', async () => {
  const css = await readFile(new URL('../dist/css/style.css', import.meta.url), 'utf8');
  const source = await readFile(new URL('../dist/js/main.js', import.meta.url), 'utf8');
  const disclosure = source.slice(source.indexOf('function initExperience()'), source.indexOf('function initExperienceCarousels()'));
  assert.match(css, /--experience-toggle-duration: 560ms/);
  assert.match(css, /\.experience-inline\.is-experience-transitioning \{ overflow: hidden/);
  assert.match(css, /\.experience-trigger\[aria-expanded="true"\] \.experience-indicator \{ transform: rotate\(90deg\)/);
  assert.match(disclosure, /getPropertyValue\('--experience-toggle-duration'\)/);
  assert.match(disclosure, /height: \[startHeight/);
  assert.match(disclosure, /opacity: \[startOpacity/);
  assert.match(disclosure, /panel\.inert = !open/);
});
test('all project pages have unique titles, full media, and only other related works', () => {
  for (const project of publishedProjects(data)) {
    const page = renderProject(data, project);
    assert.equal((page.match(/<h1\b/g) || []).length, 1);
    assert.ok(page.includes(escapeHtml(project.title)));
    assert.ok(page.includes('../../dist/css/style.css'));
    const more = page.slice(page.indexOf('<section class="more-work'));
    assert.ok(!more.includes(`data-slug="${project.slug}"`));
    assert.equal((more.match(/data-work-link/g) || []).length, 2);
  }
});
test('unknown timeline/tools and unavailable live URLs are omitted, not fabricated', () => {
  const project = structuredClone(data.projects[0]);
  delete project.role;
  delete project.timelineText;
  delete project.liveUrl;
  project.tools = [];
  const page = renderProject(data, project);
  assert.ok(!page.includes('>Live Preview') && !page.includes('<dt>Role</dt>') && !page.includes('<dt>Timeline</dt>') && !page.includes('<dt>Tools</dt>'));
  assert.ok(!page.includes('href="#"'));
});
test('case studies render specific narratives, owner-confirmed roles, qualified durations, and captions', () => {
  const narratives = new Set();
  for (const project of publishedProjects(data)) {
    assert.deepEqual(project.sections.map(section => section.heading), ['Overview', 'The challenge', 'My role & scope', 'Interface approach', 'Key features', 'Outcome']);
    assert.equal(project.role, 'Full Stack Developer');
    assert.equal(project.timelineText, '1–3 weeks (typical project range)');
    assert.ok(project.coverImage.caption);
    const page = renderProject(data, project);
    assert.equal((page.match(/class="case-section reveal"/g) || []).length, project.sections.length);
    assert.match(page, /<dt>Role<\/dt><dd>Full Stack Developer<\/dd>/);
    assert.ok(page.includes(escapeHtml(project.timelineText)));
    assert.ok(page.includes(`<figcaption>${escapeHtml(project.coverImage.caption)}</figcaption>`));
    for (const section of project.sections) for (const paragraph of section.paragraphs) assert.ok(page.includes(`<p>${escapeHtml(paragraph)}</p>`));
    narratives.add(project.sections.map(section => section.paragraphs.join(' ')).join(' '));
  }
  assert.equal(narratives.size, publishedProjects(data).length);
});
test('only source-verified technologies are published and the repurposed marketplace has no live CTA', () => {
  const matsuri = data.projects.find(project => project.slug === 'matsuri-castle');
  assert.deepEqual(matsuri.tools, ['HTML5', 'CSS3', 'JavaScript', 'Bootstrap', 'jQuery', 'Owl Carousel']);
  const page = renderProject(data, matsuri);
  for (const tool of matsuri.tools) assert.ok(page.includes(`<span>${escapeHtml(tool)}</span>`));
  for (const project of data.projects.filter(project => project.slug !== matsuri.slug)) assert.deepEqual(project.tools, []);
  const marketplace = data.projects.find(project => project.slug === 'pasar-iwak');
  assert.ok(!marketplace.liveUrl);
  assert.ok(!renderProject(data, marketplace).includes('>Live Preview'));
});
test('incomplete case-study sections and malformed metadata fail validation', () => {
  const mutations = [
    project => { project.sections = []; },
    project => { project.sections[0].heading = ' '; },
    project => { project.sections[0].paragraphs = []; },
    project => { project.sections[0].paragraphs = [42]; },
    project => { project.sections[0].images = 'not-an-array'; },
    project => { project.tools = 'Laravel'; },
    project => { project.services = ['']; },
    project => { project.role = false; },
    project => { project.timelineText = ' '; }
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(data); mutate(changed.projects[0]);
    assert.throws(() => validateData(changed), /case-study|project/);
  }
});
test('template text is escaped instead of becoming executable markup', () => {
  const changed = structuredClone(data); changed.profile.fullName = '<img src=x onerror=alert(1)>';
  const home = renderHome(changed);
  assert.ok(!home.includes('<img src=x onerror=alert(1)>'));
  assert.ok(home.includes('&lt;img src=x onerror=alert(1)&gt;'));
  const project = structuredClone(data.projects[0]);
  const payload = '<script>alert("case study")</script>';
  project.role = payload;
  project.timelineText = payload;
  project.coverImage.caption = payload;
  project.sections[0].heading = payload;
  project.sections[0].paragraphs = [payload];
  const detail = renderProject(data, project);
  assert.ok(!detail.includes(payload));
  assert.ok(detail.includes(escapeHtml(payload)));
});
test('static hosting resolves clean detail routes/assets and does not fake unknown routes', async t => {
  const server = createStaticServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => server.close());
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const project of publishedProjects(data)) {
    const response = await fetch(`${origin}/work/${project.slug}/`);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes(escapeHtml(project.title)));
  }
  assert.equal((await fetch(`${origin}/dist/css/style.css`)).status, 200);
  assert.equal((await fetch(`${origin}/work/not-a-project/`)).status, 404);
  assert.equal((await fetch(`${origin}/.git/config`)).status, 403);
});
