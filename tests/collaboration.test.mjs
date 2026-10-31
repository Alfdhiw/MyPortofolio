import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import inquiry from '../dist/js/collaboration.js';
import { loadData } from '../scripts/build.mjs';
import { renderHome, renderProject, publishedProjects, escapeHtml } from '../scripts/templates.mjs';

const data = await loadData();
const config = { recipient: data.profile.email, services: data.services.map(service => service.title) };
const validInput = () => ({
  services: [config.services[0], config.services[1]], budget: '2-5m', name: 'Example Collaborator',
  email: 'collaboration+portfolio@example.com', company: 'Example Studio', projectTitle: 'Customer portal',
  details: 'We need a customer portal for tracking orders and sharing project updates.\nThe first release should focus on a clear dashboard.',
  timeline: '2-4-weeks', preferredCall: 'Weekdays, 14:00–16:00 WIB', source: 'GitHub'
});
test('collaboration draft uses the configured recipient and correctly encoded subject and CRLF body', () => {
  const input = validInput(), draft = inquiry.createDraft(input, config), url = new URL(draft.url);
  assert.equal(url.protocol, 'mailto:'); assert.equal(url.pathname, data.profile.email);
  assert.deepEqual([...url.searchParams.keys()].sort(), ['body', 'subject']);
  assert.equal(url.searchParams.get('subject'), 'Project collaboration — Customer portal');
  assert.equal(url.searchParams.get('body'), draft.body);
  for (const expected of [input.name, input.email, input.company, input.preferredCall, input.source, 'IDR 2,000,000–5,000,000', '2–4 weeks', ...input.services]) assert.ok(draft.body.includes(expected));
  assert.match(draft.body, /PROJECT BRIEF\r\n/); assert.match(draft.body, /CONTACT DETAILS\r\n/);
  assert.ok(!draft.body.replace(/\r\n/g, '').includes('\n'));
  assert.ok(!draft.url.includes(' '));
});
test('optional information has explicit neutral defaults and repeated services are deduplicated', () => {
  const input = validInput(); input.company = ''; input.preferredCall = ''; input.source = '';
  input.services = [config.services[0], config.services[0]];
  const result = inquiry.validateInquiry(input, config), draft = inquiry.createDraft(input, config);
  assert.equal(result.valid, true); assert.deepEqual(result.value.services, [config.services[0]]);
  assert.match(draft.body, /Individual \/ not specified/); assert.match(draft.body, /Preferred time for a call: To be discussed/);
  assert.match(draft.body, /portfolio through: Not specified/);
});
test('empty, whitespace-only, malformed and unsupported form choices cannot create a mailto draft', () => {
  assert.equal(inquiry.validateInquiry({}, config).valid, false);
  const changes = [
    { services: [] }, { services: ['Unlisted service'] }, { budget: 'unknown' }, { name: '   ' },
    { email: 'not-an-email' }, { email: 'one@example.com\r\nBcc: other@example.com' }, { projectTitle: ' \n ' },
    { details: 'Too short' }, { details: ' '.repeat(100) }, { timeline: 'tomorrow' }, { source: 'Unknown source' }
  ];
  for (const change of changes) {
    const input = { ...validInput(), ...change };
    assert.equal(inquiry.validateInquiry(input, config).valid, false, JSON.stringify(change));
    assert.throws(() => inquiry.createDraft(input, config), /complete/);
  }
});
test('all input length limits are enforced by the model, not only by HTML attributes', () => {
  for (const [field, maximum] of Object.entries(inquiry.limits)) {
    const result = inquiry.validateInquiry({ ...validInput(), [field]: 'x'.repeat(maximum + 1) }, config);
    assert.ok(result.errors[field], field);
  }
});
test('Unicode and punctuation round-trip as plain text without adding email headers or HTML', () => {
  const input = validInput();
  input.projectTitle = 'Portal pelanggan & laporan = 2026 🚀\r\nBcc: nobody@example.com';
  input.details = 'Kami membutuhkan portal pelanggan — dengan laporan bulanan, akses tim, dan dukungan bahasa Indonesia.\n<script>alert("example")</script>&bcc=not-a-header@example.com';
  const draft = inquiry.createDraft(input, config), url = new URL(draft.url);
  assert.ok(!draft.subject.includes('\r') && !draft.subject.includes('\n'));
  assert.equal(url.searchParams.get('subject'), draft.subject); assert.equal(url.searchParams.get('body'), draft.body);
  assert.deepEqual([...url.searchParams.keys()].sort(), ['body', 'subject']);
  assert.ok(draft.body.includes('<script>alert("example")</script>'));
  assert.ok(!draft.url.includes('<script>'));
});
test('invalid or encoded recipient/header injection is rejected', () => {
  for (const recipient of ['invalid', 'to@example.com?bcc=other@example.com', 'to@example.com\r\nBcc:other@example.com', 'to@example.com%0D%0ABcc%3Aother%40example.com', 'first,last@example.com']) assert.throws(() => inquiry.createDraft(validInput(), { ...config, recipient }), /recipient/);
});
test('dialog markup uses native labelled fields, keeps choice labels escaped and contains no testimonials', () => {
  const unsafe = '<img src=x onerror=alert(1)>', markup = inquiry.dialogMarkup({services:[unsafe]});
  assert.ok(!markup.includes(unsafe)); assert.ok(markup.includes(escapeHtml(unsafe)));
  assert.match(markup, /method="dialog" novalidate/);
  assert.match(markup, /type="checkbox" name="services"/); assert.match(markup, /type="radio" name="budget"/);
  assert.match(markup, /type="email" name="email"/); assert.match(markup, /autocomplete="email"/);
  assert.match(markup, /data-inquiry-preview/); assert.match(markup, /role="status" aria-live="polite"/);
  assert.ok(!/testimonial|Robin Noguier|Piqo Studio/i.test(markup));
});
test('collaboration component has one desktop rule block and one entrance keyframe definition', async () => {
  const css = await readFile(new URL('../dist/css/style.css', import.meta.url), 'utf8');
  assert.equal((css.match(/^\.collaboration-dialog \{/gm) || []).length, 1);
  assert.equal((css.match(/@keyframes inquiry-enter\b/g) || []).length, 1);
});

test('modal content shares a viewport-limited scroller with black standard and WebKit scrollbar styles', async () => {
  const css = await readFile(new URL('../dist/css/style.css', import.meta.url), 'utf8');
  const layout = css.match(/^\.inquiry-layout \{([^}]+)\}/m)?.[1] || '';
  assert.match(layout, /grid-template-rows: max-content/);
  assert.match(layout, /max-height: calc\(100dvh - 42px\)/);
  assert.match(layout, /overflow-y: auto/);
  assert.match(layout, /overflow-x: hidden/);
  assert.match(layout, /scrollbar-gutter: stable/);
  assert.match(css, /scrollbar-color: #000 #E8E8E8/);
  assert.match(css, /::-webkit-scrollbar-thumb \{ background: #000/);
  assert.match(css, /background: var\(--color-surface-elevated\); overflow: hidden; overflow: clip/);
  assert.ok(!/\.inquiry-main, \.inquiry-aside \{[^}]*overflow-y: auto/.test(css));
});
test('the source template and all six existing outputs load the configured component without overwriting current Hero edits', async () => {
  for (const page of [renderHome(data), ...publishedProjects(data).map(project => renderProject(data, project))]) {
    assert.equal((page.match(/\/js\/collaboration\.js/g) || []).length, 1);
    assert.ok(page.includes(`data-contact-email="${data.profile.email}"`));
    assert.ok(page.includes(`data-contact-services="${escapeHtml(JSON.stringify(config.services))}"`));
  }
  for (const path of ['index.html', ...publishedProjects(data).map(project => `work/${project.slug}/index.html`)]) {
    const page = await readFile(new URL('../' + path, import.meta.url), 'utf8');
    assert.equal((page.match(/\/js\/collaboration\.js/g) || []).length, 1);
    assert.ok(page.indexOf('/js/collaboration.js') < page.indexOf('/js/main.js'));
  }
  assert.match(await readFile(new URL('../index.html', import.meta.url), 'utf8'), /class="name-solid">Fadhil<\/span>/);
});
