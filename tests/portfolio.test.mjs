import { test } from 'node:test';
import assert from 'node:assert/strict';
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
