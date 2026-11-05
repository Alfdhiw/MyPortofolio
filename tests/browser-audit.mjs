import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, writeFile, mkdir, mkdtemp, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createStaticServer, root } from '../scripts/serve.mjs';
import { loadData } from '../scripts/build.mjs';

const output = join(root, 'docs/audit');
const simonePreviewsOnly = process.argv.includes('--simone-previews-only');
const portfolio = await loadData();
const carouselSource = await readFile(join(root, 'dist/js/main.js'), 'utf8');
const carouselInterval = Number(carouselSource.match(/function initExperienceCarousels\(\)[\s\S]*?const interval = (\d+);/)?.[1]);
assert.ok(Number.isFinite(carouselInterval) && carouselInterval > 0, 'Carousel interval must be a positive number.');
await mkdir(output, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), 'portfolio-browser-'));
const candidates = [process.env.BROWSER_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean);
let executable;
for (const candidate of candidates) { try { await access(candidate); executable = candidate; break; } catch {} }
if (!executable) throw new Error('Set BROWSER_PATH to an installed Chrome/Edge executable.');
const server = createStaticServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const chrome = spawn(executable, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const report = { date: '2026-11-06', mode: simonePreviewsOnly ? 'simone-previews-only' : 'full', reference: 'PRD 01, 02, 03; source video not available', checks: [], viewports: [], exceptions: [], failedLocalRequests: [] };
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 50; attempt++) { try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await delay(200); } }
  if (!port) throw new Error('Chrome did not start.');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') report.exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Network.responseReceived' && message.params.response.url.startsWith(origin) && message.params.response.status >= 400) report.failedLocalRequests.push(message.params.response.url.replace(origin, ''));
    const request = pending.get(message.id);
    if (!request) return;
    clearTimeout(request.timeout); pending.delete(message.id);
    message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result);
  });
  function call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 20000);
      pending.set(id, { resolve, reject, timeout }); socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async function wait(expression, timeoutMs = 5000) {
    for (let attempt = 0; attempt < Math.ceil(timeoutMs / 50); attempt++) {
      try { if (await evaluate(expression)) return; }
      catch (error) { if (!/context|execution/i.test(error.message)) throw error; }
      await delay(50);
    }
    throw new Error(`Condition not met: ${expression}`);
  }
  const settle = () => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  async function viewport(width, touch = false, height = 1000) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: touch });
    await call('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: 1 });
    await settle();
  }
  async function navigate(path) {
    const url = path.startsWith('file:') ? path : origin + path;
    await call('Page.navigate', { url });
    await wait(`location.href === ${JSON.stringify(url)} && document.readyState !== 'loading' && document.documentElement.classList.contains('is-enhanced')`);
    await evaluate('Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 3000))]).then(() => true)');
    await settle();
  }
  async function check(name, action) {
    try { await action(); report.checks.push({ name, passed: true }); console.log('PASS ' + name); }
    catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log('FAIL ' + name + ': ' + error.message); }
  }
  async function screenshot(name, fullPage = false) {
    if (fullPage) {
      const height = await evaluate('document.documentElement.scrollHeight');
      for (let y = 0; y < height; y += 800) { await evaluate(`scrollTo(0,${y})`); await settle(); }
      await evaluate('Promise.race([Promise.all([...document.images].filter(image => image.hasAttribute("src") && !image.closest("[hidden]")).map(image => image.decode().catch(() => {}))),new Promise(resolve => setTimeout(resolve, 2000))])');
      await evaluate('scrollTo(0,0)'); await settle();
      const width = await evaluate('document.documentElement.clientWidth');
      const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height, scale: 1 } });
      await writeFile(join(output, name), Buffer.from(shot.data, 'base64'));
    } else {
      const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(join(output, name), Buffer.from(shot.data, 'base64'));
    }
  }
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  if (!simonePreviewsOnly) {
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await viewport(1440); await navigate('/');
  await check('Homepage has five ordered sections and one h1', async () => {
    assert.deepEqual(await evaluate("[...document.querySelectorAll('main > section')].map(element => element.id)"), ['home', 'work', 'service', 'experience', 'contact']);
    assert.equal(await evaluate("document.querySelectorAll('h1').length"), 1);
  });
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await viewport(width, width < 768);
    await check(`Homepage layout ${width}px`, async () => {
      const result = await evaluate(`(() => { const grid = getComputedStyle(document.querySelector('.work-grid')); return { page: 'home', requested: ${width}, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, columns: grid.gridTemplateColumns.split(' ').length, overflow: [...document.querySelectorAll('main *,header *,footer *')].filter(element => element.getBoundingClientRect().width && element.getBoundingClientRect().right > innerWidth + 1).slice(0,8).map(element => element.className) }; })()`);
      report.viewports.push(result);
      assert.ok(result.scrollWidth <= width + 1, JSON.stringify(result));
      assert.equal(result.columns, width < 768 ? 1 : 2);
      const nameSizes = await evaluate("[...document.querySelectorAll('.hero-name > span')].map(span => getComputedStyle(span).fontSize)");
      assert.equal(nameSizes.length, 2);
      assert.equal(nameSizes[0], nameSizes[1], `Hero name sizes differ at ${width}px: ${nameSizes.join(' / ')}`);
    });
    if (width === 390) { await screenshot('home-mobile.png', true); await screenshot('hero-mobile.png'); }
    if (width === 1440) { await screenshot('home-desktop.png', true); await screenshot('hero-desktop.png'); }
    if (width === 768) await screenshot('hero-tablet.png');
  }
  await viewport(1440); await evaluate('scrollTo(0,0)');
  await check('Reference navbar has a pill status, bracketed counts, balanced spacing and a flat shadowed CTA', async () => {
    for (const width of [900, 932, 996, 1440]) {
      await viewport(width); await evaluate('scrollTo(0,0)');
      const result = await evaluate(`(() => {
        const header = document.querySelector('.site-header'), nav = header.querySelector('.primary-nav'), status = header.querySelector('.status'), cta = nav.querySelector('.button');
        const box = element => { const r = element.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right}; };
        return {header:box(header),status:box(status),links:[...nav.querySelectorAll('a')].map(box),counts:[...nav.querySelectorAll('.nav-count')].map(item => item.textContent),hasLogo:!!header.querySelector('img'),menuVisible:getComputedStyle(header.querySelector('.menu-button')).display !== 'none',navVisible:getComputedStyle(nav).display !== 'none',statusRadius:getComputedStyle(status).borderRadius,statusShadow:getComputedStyle(status).boxShadow,ctaShadow:getComputedStyle(cta).boxShadow,ctaTransform:getComputedStyle(cta).transform,background:getComputedStyle(header).backgroundColor};
      })()`);
      assert.equal(result.hasLogo, false); assert.equal(result.menuVisible, false); assert.equal(result.navVisible, true);
      assert.deepEqual(result.counts, [`[${String(portfolio.projects.filter(project => project.published).length).padStart(2,'0')}]`, `[${portfolio.services.length}]`, `[${portfolio.profile.experienceYears}y+]`]);
      assert.equal(result.statusRadius, '999px'); assert.notEqual(result.statusShadow, 'none'); assert.notEqual(result.ctaShadow, 'none');
      assert.equal(result.ctaTransform, 'none');
      // The owner may let the navbar inherit the off-white frame rather than paint a white strip.
      assert.ok(['rgb(255, 255, 255)', 'rgba(0, 0, 0, 0)'].includes(result.background));
      assert.ok(result.links.every(link => Math.abs((link.y + link.height/2) - (result.status.y + result.status.height/2)) < 1));
      assert.ok(result.links[0].x > result.status.right + 20);
      assert.ok(result.links.at(-1).right <= result.header.right - 16);
      for (let index = 1; index < result.links.length; index++) assert.ok(result.links[index].x > result.links[index-1].right + 16);
      if (width === 996) {
        const clip = {x:result.header.x,y:result.header.y,width:result.header.width,height:result.header.height,scale:1};
        const shot = await call('Page.captureScreenshot', {format:'png',captureBeyondViewport:true,clip});
        await writeFile(join(output, 'navbar-reference-width.png'), Buffer.from(shot.data,'base64'));
      }
    }
    await viewport(1440);
    const cta = await evaluate("(() => {const r = document.querySelector('.primary-nav .button').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
    await call('Input.dispatchMouseEvent', {type:'mouseMoved',x:cta.x,y:cta.y});
    await evaluate("Promise.all(document.querySelector('.primary-nav .button').getAnimations().map(animation => animation.finished.catch(() => {})))");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.primary-nav .button')).transform"), 'none');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.primary-nav .button .arrow')).transform"), 'none');
    await call('Input.dispatchMouseEvent', {type:'mouseMoved',x:0,y:0});
  });
  await check('Navbar breakpoint closes the mobile menu and restores the desktop row at 900px', async () => {
    await viewport(899);
    await evaluate("document.querySelector('.menu-button').click()");
    assert.equal(await evaluate("document.querySelector('.menu-button').getAttribute('aria-expanded')"), 'true');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.primary-nav')).display"), 'flex');
    await viewport(900);
    await wait("document.querySelector('.menu-button').getAttribute('aria-expanded') === 'false'");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.menu-button')).display"), 'none');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.primary-nav')).display"), 'flex');
    await viewport(899);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.primary-nav')).display"), 'none');
    await viewport(1440);
  });
  await check('PRD palette, dimensions, portrait, dark Experience, no WebGL', async () => {
    const result = await evaluate("({ page: getComputedStyle(document.body).backgroundColor, frame: getComputedStyle(document.querySelector('.site-frame')).backgroundColor, dark: getComputedStyle(document.querySelector('.experience')).backgroundColor, portrait: !!document.querySelector('.hero-portrait img'), frameWidth: document.querySelector('.site-frame').getBoundingClientRect().width, imagesValid: [...document.images].filter(image => image.hasAttribute('src') && image.complete).every(image => image.naturalWidth > 0), webgl: !!document.querySelector('canvas') })");
    report.visual = result;
    assert.equal(result.page, 'rgb(201, 201, 201)'); assert.equal(result.frame, 'rgb(248, 248, 248)');
    assert.equal(result.dark, 'rgb(36, 36, 36)'); assert.equal(result.frameWidth, 1280);
    assert.ok(result.portrait && result.imagesValid && !result.webgl);
  });
  await check('Hero cutout has real transparent pixels', async () => {
    const alpha = await evaluate("(() => { const image = document.querySelector('.hero-portrait img'); const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1; const context = canvas.getContext('2d'); context.drawImage(image,0,0); return context.getImageData(0,0,1,1).data[3]; })()");
    report.portraitCornerAlpha = alpha; assert.equal(alpha, 0);
  });
  async function capturePortrait() {
    const clip = await evaluate("(() => {const r = document.querySelector('.hero-portrait').getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()");
    // This crop is inside the viewport. Beyond-viewport capture can temporarily resize
    // the document, correctly resetting the effect before the compositor takes the shot.
    const shot = await call('Page.captureScreenshot', {format:'png',captureBeyondViewport:false,clip});
    const colors = await evaluate(`(async () => {
      const image = new Image(); image.src = ${JSON.stringify('data:image/png;base64,')} + ${JSON.stringify(shot.data)}; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image,0,0);
      const sample = (x,y) => [...context.getImageData(Math.round(canvas.width*x),Math.round(canvas.height*y),1,1).data].slice(0,3);
      return {face:sample(.58,.30),outside:sample(.5,.85)};
    })()`);
    return {clip,colors,data:shot.data};
  }
  await check('Portrait reveals real color only near the cursor, follows movement, and returns to grayscale on leave', async () => {
    await viewport(1440); await evaluate('scrollTo(0,0)');
    await call('Input.dispatchMouseEvent', {type:'mouseMoved',x:0,y:0});
    assert.equal(await evaluate("document.querySelectorAll('.portrait-color-reveal').length"), 0);
    const before = await capturePortrait();
    assert.ok(Math.max(...before.colors.face) - Math.min(...before.colors.face) <= 1, 'Base photo must be grayscale');
    await call('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await wait("!matchMedia('(prefers-reduced-motion: reduce)').matches"); await settle();
    const point = {x:before.clip.x+before.clip.width*.58,y:before.clip.y+before.clip.height*.30};
    await call('Input.dispatchMouseEvent', {type:'mouseMoved',...point});
    try {
      await wait("document.querySelector('.hero-portrait').classList.contains('is-color-revealed') && document.querySelector('.portrait-color-reveal')?.complete && getComputedStyle(document.querySelector('.portrait-color-reveal')).opacity === '1'");
    } catch (error) {
      report.portraitRevealFailure = await evaluate(`(() => {const image = document.querySelector('.portrait-color-reveal'); return {portrait:document.querySelector('.hero-portrait').className,hit:document.elementFromPoint(${point.x},${point.y})?.className,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,fine:matchMedia('(hover: hover) and (pointer: fine)').matches,opacity:image && getComputedStyle(image).opacity,mask:image && getComputedStyle(image).maskImage,complete:image?.complete,position:document.querySelector('.hero-portrait').getAttribute('style')};})()`);
      console.log(JSON.stringify(report.portraitRevealFailure));
      await screenshot('portrait-reveal-failure.png'); throw error;
    }
    const metadata = await evaluate("(() => {const image = document.querySelector('.portrait-color-reveal'); return {aria:image.getAttribute('aria-hidden'),alt:image.alt,pointer:getComputedStyle(image).pointerEvents,filter:getComputedStyle(image).filter,mask:getComputedStyle(image).maskImage,src:image.currentSrc,original:document.querySelector('.portrait-image').currentSrc,x:document.querySelector('.hero-portrait').style.getPropertyValue('--portrait-reveal-x')};})()");
    assert.equal(metadata.aria,'true'); assert.equal(metadata.alt,''); assert.equal(metadata.pointer,'none'); assert.equal(metadata.filter,'none');
    assert.ok(metadata.mask.includes('radial-gradient')); assert.equal(metadata.src,metadata.original);
    const during = await capturePortrait();
    await writeFile(join(output,'portrait-color-reveal.png'),Buffer.from(during.data,'base64'));
    const originalColor = await evaluate(`(() => {
      const image = document.querySelector('.portrait-image'), rect = image.getBoundingClientRect();
      const canvas = document.createElement('canvas'); canvas.width = Math.round(rect.width); canvas.height = Math.round(rect.height);
      const context = canvas.getContext('2d');
      const scale = Math.max(rect.width/image.naturalWidth,rect.height/image.naturalHeight), width = image.naturalWidth*scale, height = image.naturalHeight*scale;
      context.drawImage(image,(rect.width-width)/2,rect.height-height,width,height);
      return [...context.getImageData(Math.round(canvas.width*.58),Math.round(canvas.height*.30),1,1).data].slice(0,3);
    })()`);
    const afterCapture = await evaluate("(() => {const portrait=document.querySelector('.hero-portrait'), image=portrait.querySelector('.portrait-color-reveal'), style=getComputedStyle(image); return {active:portrait.className,opacity:style.opacity,mask:style.maskImage,x:portrait.style.getPropertyValue('--portrait-reveal-x'),y:portrait.style.getPropertyValue('--portrait-reveal-y'),imageRect:JSON.stringify(image.getBoundingClientRect()),portraitRect:JSON.stringify(portrait.getBoundingClientRect())};})()");
    report.portraitReveal = {before:before.colors,during:during.colors,originalColor,metadata,afterCapture};
    assert.ok(afterCapture.active.includes('is-color-revealed'), 'Taking an in-viewport screenshot must not reset the reveal');
    assert.ok(Math.max(...during.colors.face) - Math.min(...during.colors.face) > 15, `Cursor area should show original color: ${during.colors.face}`);
    assert.ok(during.colors.face.every((value,index) => Math.abs(value-originalColor[index]) <= 10), `Revealed color ${during.colors.face} should match the original asset ${originalColor}`);
    assert.deepEqual(during.colors.outside,before.colors.outside, 'Pixels outside the spotlight must stay unchanged');
    await call('Input.dispatchMouseEvent', {type:'mouseMoved',x:point.x+24,y:point.y+12});
    await wait(`document.querySelector('.hero-portrait').style.getPropertyValue('--portrait-reveal-x') !== ${JSON.stringify(metadata.x)}`);
    assert.equal(await evaluate("document.querySelectorAll('.portrait-color-reveal').length"),1);
    await call('Input.dispatchMouseEvent', {type:'mouseMoved',x:0,y:0});
    await wait("!document.querySelector('.hero-portrait').classList.contains('is-color-revealed') && getComputedStyle(document.querySelector('.portrait-color-reveal')).opacity === '0'");
    assert.deepEqual((await capturePortrait()).colors,before.colors);
  });
  await check('Portrait reveal resets on scroll and respects reduced motion and touch input', async () => {
    const rect = await evaluate("(() => {const r = document.querySelector('.hero-portrait').getBoundingClientRect(); return {x:r.x+r.width*.5,y:r.y+r.height*.28};})()");
    await call('Input.dispatchMouseEvent', {type:'mouseMoved',...rect});
    await wait("document.querySelector('.hero-portrait').classList.contains('is-color-revealed')");
    await evaluate('scrollTo(0,12)');
    await wait("!document.querySelector('.hero-portrait').classList.contains('is-color-revealed')");
    await evaluate('scrollTo(0,0)'); await settle();
    await call('Input.dispatchMouseEvent', {type:'mouseMoved',x:rect.x+1,y:rect.y+1});
    await wait("document.querySelector('.hero-portrait').classList.contains('is-color-revealed')");
    await call('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await wait("!document.querySelector('.hero-portrait').classList.contains('is-color-revealed')");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.portrait-color-reveal')).display"),'none');
    await call('Input.dispatchMouseEvent', {type:'mouseMoved',x:rect.x+2,y:rect.y+2}); await settle();
    assert.equal(await evaluate("document.querySelector('.hero-portrait').classList.contains('is-color-revealed')"),false);
    await call('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await settle();
    await viewport(390,true);
    const touch = await evaluate("(() => {const r = document.querySelector('.hero-portrait').getBoundingClientRect(); return {x:r.x+r.width*.5,y:r.y+r.height*.28};})()");
    await call('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[touch]});
    await call('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]}); await settle();
    assert.equal(await evaluate("document.querySelector('.hero-portrait').classList.contains('is-color-revealed')"),false);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.portrait-color-reveal')).display"),'none');
    await viewport(1440);
    await call('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  });
  await check('Sampled text contrast meets AA on light and dark sections', async () => {
    report.contrast = await evaluate(`(() => {
      const luminance = value => { const rgb = value.match(/[0-9.]+/g).slice(0,3).map(Number).map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }); return rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722; };
      return ['.hero-bio p','.status','.hero-socials .social-pill','.project-kind','.project-caption .tags span','.experience-intro','.experience-role','.experience-period','.contact-heading p','.site-footer','.button-dark'].map(selector => { const element = document.querySelector(selector); let ancestor = element, background; while(ancestor) { background = getComputedStyle(ancestor).backgroundColor; if(background !== 'rgba(0, 0, 0, 0)') break; ancestor = ancestor.parentElement; } const a = luminance(getComputedStyle(element).color), b = luminance(background); return {selector,ratio:Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2))}; });
    })()`);
    assert.ok(report.contrast.every(item => item.ratio >= 4.5), JSON.stringify(report.contrast));
  });
  await check('Project filters: featured, empty state, reset, real, view all', async () => {
    const count = () => evaluate("[...document.querySelectorAll('[data-work-grid] .project-card')].filter(card => !card.hidden).length");
    assert.equal(await count(), 4);
    await evaluate("document.querySelector('[data-filter=exploration]').click()"); await wait("document.querySelector('[data-work-grid]').getAttribute('aria-busy') === 'false'");
    assert.equal(await count(), 0); assert.equal(await evaluate("document.querySelector('[data-empty-state]').hidden"), false);
    await evaluate("document.querySelector('[data-reset-filter]').click()"); assert.equal(await count(), 4);
    await evaluate("document.querySelector('[data-filter=real]').click()"); assert.equal(await count(), 4);
    await evaluate("document.querySelector('[data-view-all]').click()"); assert.equal(await count(), 5);
  });
  await check('Service accordion is keyboard operable and at most one panel opens', async () => {
    assert.equal(await evaluate("document.querySelectorAll('.service-trigger[aria-expanded=true]').length"), 0);
    await evaluate("(() => { const b = document.querySelector('#service-web'); b.scrollIntoView({block:'center',behavior:'instant'}); b.focus(); })()");
    await settle();
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    assert.equal(await evaluate("document.querySelector('#service-web').getAttribute('aria-expanded')"), 'true');
    await evaluate("document.querySelector('#service-uiux').click()");
    await wait("getComputedStyle(document.querySelector('#service-uiux').closest('.service-item')).backgroundColor === 'rgb(36, 36, 36)'");
    assert.equal(await evaluate("document.querySelectorAll('.service-trigger[aria-expanded=true]').length"), 1);
    assert.equal(await evaluate("document.querySelector('#panel-web').hidden"), true);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('#service-uiux').closest('.service-item')).backgroundColor"), 'rgb(36, 36, 36)');
    await evaluate("document.querySelector('#service').scrollIntoView()"); await settle(); await screenshot('service-open.png');
    await evaluate("document.querySelector('#service-uiux').click()");
    assert.equal(await evaluate("document.querySelectorAll('.service-trigger[aria-expanded=true]').length"), 0);
  });
  await check('Contact destination and FAQ preserved', async () => {
    const href = await evaluate("document.querySelector('#contact .button').getAttribute('href')");
    assert.ok(href.startsWith('mailto:wibowalif22@gmail.com?subject='));
    await evaluate("document.querySelector('.practical-faqs > summary').click(); document.querySelector('.faq-list summary').click()");
    assert.equal(await evaluate("document.querySelector('.faq-list details').open"), true);
  });
  await evaluate(`(() => {
    window.__inquiryMailtoAttempts = [];
    // Registered after the app's listener: the real modal still opens, but no test
    // can launch an external email client, including a failed interception.
    document.addEventListener('click', event => {
      const link = event.target.closest?.('a[href^="mailto:"]');
      if (!link) return;
      event.preventDefault();
      if (link.matches('[data-inquiry-launch]')) window.__inquiryMailtoAttempts.push(link.href);
    });
  })()`);
  await check('Collaboration CTA opens a labelled modal with live choices, scroll lock and keyboard focus containment', async () => {
    await evaluate("window.PortfolioInquiry.init(document,document.querySelector('script[data-contact-email]'))");
    await viewport(1440); await evaluate("document.querySelector('.hero-bio .button').focus(); document.querySelector('.hero-bio .button').click()");
    await wait("document.querySelector('.collaboration-dialog')?.open");
    assert.equal(await evaluate("document.activeElement.id"), 'inquiry-title');
    assert.equal(await evaluate("document.documentElement.style.overflow"), 'hidden');
    assert.equal(await evaluate("document.querySelector('.collaboration-dialog').getAttribute('aria-labelledby')"), 'inquiry-title');
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.inquiry-chip input[name=services]')].map(input => input.value)"), [...portfolio.services.map(service => service.title), 'Other']);
    await evaluate("document.querySelector('[data-inquiry-recipient]').focus()");
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    assert.equal(await evaluate("document.activeElement.hasAttribute('data-inquiry-close')"),true);
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
    assert.equal(await evaluate("document.activeElement.hasAttribute('data-inquiry-recipient')"),true);
    assert.equal(await evaluate("document.querySelectorAll('.collaboration-dialog').length"),1);
    await evaluate("(() => {document.querySelector('[name=services]').click(); document.querySelector('[name=budget][value=discuss]').click(); const input=document.querySelector('[name=timeline]'); input.value='flexible'; input.dispatchEvent(new Event('input',{bubbles:true}));})()");
    assert.equal(await evaluate("document.querySelector('[data-inquiry-summary=services]').textContent"),portfolio.services[0].title);
    assert.equal(await evaluate("document.querySelector('[data-inquiry-summary=budget]').textContent"),'Let’s discuss');
    await evaluate("document.querySelector('.inquiry-form').reset(); document.querySelector('.inquiry-form').dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('#inquiry-title').focus()");
    await screenshot('collaboration-modal-desktop.png');
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await wait("!document.querySelector('.collaboration-dialog').open");
    await wait("document.activeElement === document.querySelector('.hero-bio .button')");
    assert.equal(await evaluate("document.documentElement.style.overflow"),'');
  });
  await check('Invalid collaboration forms never compose an email and close/backdrop remain operable', async () => {
    await evaluate("document.querySelector('#contact .button').click(); document.querySelector('.inquiry-form').requestSubmit()");
    assert.equal(await evaluate("window.__inquiryMailtoAttempts.length"),0);
    assert.equal(await evaluate("document.querySelector('[data-inquiry-ready]').hidden"),true);
    assert.ok((await evaluate("document.querySelector('[data-inquiry-error=services]').textContent")).length > 0);
    assert.equal(await evaluate("document.activeElement.name"),'services');
    await evaluate("document.querySelector('[data-inquiry-close]').click()");
    await wait("document.activeElement === document.querySelector('#contact .button')");
    await evaluate("document.querySelector('.primary-nav .button').click()");
    await call('Input.dispatchMouseEvent',{type:'mousePressed',x:8,y:8,button:'left',clickCount:1});
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:8,y:8,button:'left',clickCount:1});
    await wait("!document.querySelector('.collaboration-dialog').open");
    assert.equal(await evaluate("document.documentElement.style.overflow"),'');
  });
  await check('A valid collaboration form composes an encoded email without sending, supports copy, and invalidates stale drafts', async () => {
    await evaluate(`(() => {
      document.querySelector('.hero-bio .button').click();
      const form=document.querySelector('.inquiry-form');
      const values={name:'Example Collaborator',email:'collaboration@example.com',company:'Example Studio',projectTitle:'Portal pelanggan & laporan',details:'Kami membutuhkan portal pelanggan dengan dashboard dan laporan bulanan.\\nPrioritas pertama adalah alur pemesanan yang jelas.',timeline:'2-4-weeks',preferredCall:'Weekdays, 14:00 WIB'};
      for(const [name,value] of Object.entries(values)) {form.elements.namedItem(name).value=value;}
      form.querySelector('[name=services]').checked=true; form.querySelector('[name=budget][value="2-5m"]').checked=true; form.querySelector('[name=source][value=GitHub]').checked=true;
      form.dispatchEvent(new Event('input',{bubbles:true})); form.requestSubmit();
    })()`);
    const href = await evaluate("window.__inquiryMailtoAttempts.at(-1)");
    const draft = new URL(href);
    assert.equal(draft.protocol,'mailto:'); assert.equal(draft.pathname,portfolio.profile.email);
    assert.equal(draft.searchParams.get('subject'),'Project collaboration — Portal pelanggan & laporan');
    assert.match(draft.searchParams.get('body'),/Reply email: collaboration@example.com/);
    assert.match(draft.searchParams.get('body'),/Prioritas pertama/);
    assert.equal(await evaluate("document.querySelector('[data-inquiry-preview]').value"),draft.searchParams.get('body').replace(/\r\n/g,'\n'));
    assert.equal(await evaluate("document.querySelector('[data-inquiry-ready]').hidden"),false);
    assert.equal(await evaluate("document.querySelector('.inquiry-aside-heading').nextElementSibling.hasAttribute('data-inquiry-ready')"),true);
    await screenshot('collaboration-email-preview.png');
    assert.ok(!(await evaluate("document.querySelector('[data-inquiry-status]').textContent")).includes('successfully sent'));
    await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__inquiryCopied=value;}}}); document.querySelector('[data-inquiry-copy]').click();`);
    await wait("document.querySelector('[data-inquiry-status]').textContent.includes('copied')");
    assert.ok((await evaluate('window.__inquiryCopied')).includes('To: '+portfolio.profile.email));
    await evaluate("navigator.clipboard.writeText=async()=>{throw new Error('Test: clipboard unavailable');}; document.querySelector('[data-inquiry-copy]').click()");
    await wait("document.querySelector('[data-inquiry-status]').textContent.includes('manually')");
    assert.equal(await evaluate("document.activeElement.hasAttribute('data-inquiry-preview')"),true);
    await evaluate("(() => {const field=document.querySelector('[name=projectTitle]'); field.value='Updated project'; field.dispatchEvent(new Event('input',{bubbles:true}));})()");
    assert.equal(await evaluate("document.querySelector('[data-inquiry-ready]').hidden"),true);
    assert.equal(await evaluate("document.querySelector('[data-inquiry-launch]').hasAttribute('href')"),false);
    await evaluate("(() => {document.querySelector('.inquiry-form').requestSubmit(); const field=document.querySelector('[name=timeline]'); field.value='flexible'; field.dispatchEvent(new Event('change',{bubbles:true}));})()");
    assert.equal(await evaluate("document.querySelector('[data-inquiry-ready]').hidden"),true);
    await evaluate("document.querySelector('.inquiry-form').reset(); document.querySelector('.inquiry-form').dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[data-inquiry-close]').click()");
  });
  await check('Collaboration modal stays within small and large viewports with reachable close and submit controls', async () => {
    await evaluate("document.querySelector('#contact .button').click()");
    for (const width of [360,390,768,1024,1440]) {
      await viewport(width,width<768);
      const result=await evaluate(`(() => {const dialog=document.querySelector('.collaboration-dialog'),r=dialog.getBoundingClientRect(),layout=dialog.querySelector('.inquiry-layout'),close=dialog.querySelector('[data-inquiry-close]').getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height,width:r.width,scroll:layout.scrollWidth,client:layout.clientWidth,columns:getComputedStyle(layout).display,closeWidth:close.width,closeHeight:close.height};})()`);
      assert.ok(result.x>=0 && result.y>=0 && result.right<=width+1 && result.bottom<=1001,JSON.stringify(result));
      assert.ok(result.scroll<=result.client+1,JSON.stringify(result));
      assert.ok(result.closeWidth>=44 && result.closeHeight>=44);
      assert.equal(result.columns,width<768?'block':'grid');
      await evaluate("document.querySelector('.inquiry-submit').scrollIntoView({block:'center',behavior:'instant'})");
      assert.equal(await evaluate("(() => {const r=document.querySelector('.inquiry-submit').getBoundingClientRect();return r.y>=0 && r.bottom<=innerHeight;})()"),true);
      await evaluate("document.querySelector('.inquiry-layout').scrollTop=0; document.querySelector('.inquiry-main').scrollTop=0;");
      if(width===390) await screenshot('collaboration-modal-mobile.png');
    }
    await evaluate("document.querySelector('[data-inquiry-close]').click()");
    await viewport(1440);
  });
  await check('Short laptop and mobile modals have one black vertical scrollbar with wheel, keyboard and full-content access', async () => {
    await evaluate("document.querySelector('.hero-bio .button').click()");
    report.inquiryScroll = [];
    try {
      for (const [width,height] of [[1366,620],[1280,600],[1093,510],[1024,600],[390,600]]) {
        await viewport(width,width<768,height);
        await evaluate("document.querySelector('.inquiry-layout').scrollTop=0");
        const geometry = await evaluate(`(() => {
          const layout=document.querySelector('.inquiry-layout'),dialog=document.querySelector('.collaboration-dialog'),r=layout.getBoundingClientRect(),close=document.querySelector('.inquiry-close').getBoundingClientRect(),style=getComputedStyle(layout);
          return {width:innerWidth,height:innerHeight,x:r.x,y:r.y,right:r.right,bottom:r.bottom,scrollHeight:layout.scrollHeight,clientHeight:layout.clientHeight,scrollWidth:layout.scrollWidth,clientWidth:layout.clientWidth,overflow:style.overflowY,color:style.scrollbarColor,panels:[...dialog.querySelectorAll('.inquiry-main,.inquiry-aside')].map(panel=>getComputedStyle(panel).overflowY),close:{x:close.x,y:close.y,bottom:close.bottom},pageY:scrollY};
        })()`);
        report.inquiryScroll.push(geometry);
        assert.ok(geometry.y>=0 && geometry.bottom<=height+1,JSON.stringify(geometry));
        assert.ok(geometry.scrollHeight>geometry.clientHeight+50,JSON.stringify(geometry));
        assert.ok(geometry.scrollWidth<=geometry.clientWidth+1,JSON.stringify(geometry));
        assert.equal(geometry.overflow,'auto');
        assert.equal(geometry.color,'rgb(0, 0, 0) rgb(232, 232, 232)');
        assert.deepEqual(geometry.panels,['visible','visible']);
        if(width===1366) await screenshot('collaboration-modal-laptop.png');
        // Scroll over either column: both must move the same modal scroller, not the page.
        for (const x of [geometry.x+30,geometry.right-30]) {
          await evaluate("document.querySelector('.inquiry-layout').scrollTop=0");
          await call('Input.dispatchMouseEvent',{type:'mouseMoved',x,y:geometry.y+80});
          await call('Input.dispatchMouseEvent',{type:'mouseWheel',x,y:geometry.y+80,deltaX:0,deltaY:400});
          await wait("document.querySelector('.inquiry-layout').scrollTop>0");
          assert.equal(await evaluate('scrollY'),geometry.pageY);
        }
        await evaluate("document.querySelector('.inquiry-layout').scrollTop=1e6");
        assert.equal(await evaluate("(() => {const r=document.querySelector('[data-inquiry-recipient]').closest('.inquiry-card').getBoundingClientRect(),layout=document.querySelector('.inquiry-layout').getBoundingClientRect();return r.bottom<=layout.bottom+1;})()"),true);
        assert.equal(await evaluate("(() => {const r=document.querySelector('.inquiry-close').getBoundingClientRect();return r.y>=0 && r.bottom<=innerHeight && r.y==="+geometry.close.y+";})()"),true);
        if(width===1366) await screenshot('collaboration-modal-laptop-bottom.png');
        await evaluate("document.querySelector('.inquiry-submit').scrollIntoView({block:'center',behavior:'instant'})");
        assert.equal(await evaluate("(() => {const r=document.querySelector('.inquiry-submit').getBoundingClientRect(),layout=document.querySelector('.inquiry-layout').getBoundingClientRect();return r.y>=layout.y && r.bottom<=layout.bottom;})()"),true);
        await evaluate("document.querySelector('[data-inquiry-recipient]').focus()");
        await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
        await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
        assert.equal(await evaluate("document.activeElement.hasAttribute('data-inquiry-close')"),true);
      }
      await viewport(1366,false,620);
      await evaluate(`(() => {
        const form=document.querySelector('.inquiry-form');
        for(const [name,value] of Object.entries({name:'Example Collaborator',email:'collaboration@example.com',projectTitle:'Laptop scroll regression',details:'We need a customer dashboard that stays usable on compact laptop screens.',timeline:'flexible'})) form.elements.namedItem(name).value=value;
        form.querySelector('[name=services]').checked=true; form.querySelector('[name=budget][value=discuss]').checked=true;
        form.dispatchEvent(new Event('input',{bubbles:true})); form.requestSubmit();
      })()`);
      assert.equal(await evaluate("(() => {const ready=document.querySelector('[data-inquiry-ready]'),r=ready.getBoundingClientRect(),layout=document.querySelector('.inquiry-layout').getBoundingClientRect();return !ready.hidden && r.y>=layout.y && r.y<layout.bottom;})()"),true);
      await evaluate("document.querySelector('[data-inquiry-copy]').scrollIntoView({block:'center',behavior:'instant'})");
      assert.equal(await evaluate("(() => {const r=document.querySelector('[data-inquiry-copy]').getBoundingClientRect(),layout=document.querySelector('.inquiry-layout').getBoundingClientRect();return r.y>=layout.y && r.bottom<=layout.bottom;})()"),true);
      await evaluate("document.querySelector('[data-inquiry-close]').click(); document.querySelector('.hero-bio .button').click()");
      assert.equal(await evaluate("document.querySelector('.inquiry-layout').scrollTop"),0);
    } finally {
      await evaluate("document.querySelector('.inquiry-form').reset(); document.querySelector('.inquiry-form').dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[data-inquiry-close]').click()");
      await viewport(1440);
    }
  });
  await viewport(390, true);
  await check('Mobile menu, Escape, focus restore, anchors, touch Experience fallback', async () => {
    await evaluate("document.querySelector('.menu-button').click()");
    assert.equal(await evaluate("document.querySelector('.menu-button').getAttribute('aria-expanded')"), 'true');
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    assert.equal(await evaluate("document.querySelector('.menu-button').getAttribute('aria-expanded')"), 'false');
    assert.equal(await evaluate("document.activeElement.className"), 'menu-button');
    await evaluate("document.querySelector('.menu-button').click(); document.querySelector('.primary-nav a[href=\"#service\"]').click()");
    assert.equal(await evaluate('location.hash'), '#service');
    assert.equal(await evaluate("document.querySelector('.menu-button').getAttribute('aria-expanded')"), 'false');
    await evaluate("document.querySelector('.experience-trigger').click()");
    assert.equal(await evaluate("document.querySelector('.experience-inline').hidden"), false);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-floating-preview]')).display"), 'none');
  });
  await check('Mobile visible controls have 44px touch targets', async () => {
    const small = await evaluate("[...document.querySelectorAll('a,button,summary')].filter(element => { const r = element.getBoundingClientRect(); return r.width && r.height && r.bottom > 0 && (r.height < 43.9 || r.width < 43.9); }).map(element => ({text:element.textContent.trim(),class:element.className,width:element.getBoundingClientRect().width,height:element.getBoundingClientRect().height}))");
    assert.deepEqual(small, []);
  });
  await viewport(1440);
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await check('Normal motion: filter cancellation and accordion rapid-toggle settle correctly', async () => {
    await evaluate("document.querySelector('[data-filter=exploration]').click(); document.querySelector('[data-filter=all]').click(); document.querySelector('[data-filter=real]').click()");
    await wait("document.querySelector('[data-work-grid]').getAttribute('aria-busy') === 'false'");
    assert.equal(await evaluate("[...document.querySelectorAll('[data-work-grid] .project-card')].filter(e => !e.hidden).length"), 5);
    await evaluate("document.querySelector('#service-web').click()");
    await wait("document.querySelector('#panel-web').getAnimations().length === 0");
    assert.equal(await evaluate("document.querySelector('#panel-web').hidden"), false);
    await evaluate("document.querySelector('#service-uiux').click(); document.querySelector('#service-uiux').click(); document.querySelector('#service-web').click(); document.querySelector('#service-web').click()");
    await wait("[...document.querySelectorAll('.service-panel')].every(e => e.hidden)");
    assert.equal(await evaluate("document.querySelectorAll('.service-trigger[aria-expanded=true]').length"), 0);
  });
  await check('Experience panels open and close smoothly, reverse from their current height, and settle accessibly', async () => {
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    for(const id of ['independent','bps-semarang','internship']) {
      await viewport(1440);
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
      await evaluate(`(() => {const button=document.querySelector('[aria-controls="experience-${id}"]'); if(button.getAttribute('aria-expanded')==='true') button.click();})()`);
      await wait(`document.querySelector('#experience-${id}').hidden`);
      await evaluate(`document.querySelector('[aria-controls="experience-${id}"]').click()`);
      const opening=await evaluate(`(() => {const panel=document.querySelector('#experience-${id}'),animation=panel.getAnimations()[0];return {hidden:panel.hidden,inert:panel.inert,aria:panel.getAttribute('aria-hidden'),duration:animation.effect.getTiming().duration,frames:animation.effect.getKeyframes().map(frame=>({height:frame.height,opacity:frame.opacity})),overflow:getComputedStyle(panel).overflowY};})()`);
      assert.equal(opening.hidden,false); assert.equal(opening.inert,false); assert.equal(opening.aria,'false');
      assert.equal(opening.duration,560); assert.equal(opening.overflow,'hidden');
      assert.equal(parseFloat(opening.frames[0].height),0); assert.equal(Number(opening.frames[0].opacity),0);
      assert.ok(parseFloat(opening.frames.at(-1).height)>100); assert.equal(Number(opening.frames.at(-1).opacity),1);
      await wait(`!document.querySelector('#experience-${id}').classList.contains('is-experience-transitioning')`);
      await evaluate(`document.querySelector('#experience-${id}').querySelector('.text-link, .experience-carousel-dot').focus(); document.querySelector('[aria-controls="experience-${id}"]').click()`);
      assert.equal(await evaluate(`document.activeElement===document.querySelector('[aria-controls="experience-${id}"]')`),true,`${id}: closing restores trigger focus`);
      assert.equal(await evaluate(`document.querySelector('#experience-${id}').inert`),true,`${id}: closing makes the panel inert immediately`);
      assert.equal(await evaluate(`document.querySelector('#experience-${id}').hidden`),false);
      await settle();
      const reversal=await evaluate(`(() => {const panel=document.querySelector('#experience-${id}'),height=panel.getBoundingClientRect().height;document.querySelector('[aria-controls="experience-${id}"]').click();return {height,start:parseFloat(panel.getAnimations()[0].effect.getKeyframes()[0].height)};})()`);
      assert.ok(Math.abs(reversal.height-reversal.start)<1,JSON.stringify(reversal));
      await evaluate(`for(let count=0;count<3;count++) document.querySelector('[aria-controls="experience-${id}"]').click()`);
      await wait(`document.querySelector('#experience-${id}').hidden && !document.querySelector('#experience-${id}').classList.contains('is-experience-transitioning')`);
      assert.equal(await evaluate(`document.querySelector('#experience-${id}').getAnimations().length`),0);
      assert.equal(await evaluate(`document.querySelector('#experience-${id}').style.height`),'');
      await evaluate(`document.querySelector('[aria-controls="experience-${id}"]').click()`);
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
      await wait(`!document.querySelector('#experience-${id}').classList.contains('is-experience-transitioning')`);
      assert.equal(await evaluate(`document.querySelector('#experience-${id}').hidden`),false);
      assert.equal(await evaluate(`document.querySelector('#experience-${id}').getAnimations().length`),0);
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
      await evaluate(`document.querySelector('[aria-controls="experience-${id}"]').click(); document.querySelector('[aria-controls="experience-${id}"]').click()`);
      await viewport(390,true);
      await wait(`!document.querySelector('#experience-${id}').classList.contains('is-experience-transitioning')`);
      assert.equal(await evaluate(`document.querySelector('#experience-${id}').hidden`),false);
      assert.equal(await evaluate(`document.querySelector('#experience-${id}').style.height`),'');
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
      await wait("matchMedia('(prefers-reduced-motion: reduce)').matches");
      await settle();
      await evaluate(`document.querySelector('[aria-controls="experience-${id}"]').focus()`);
      await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
      await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
      assert.equal(await evaluate(`document.querySelector('#experience-${id}').hidden`),true,`${id}: reduced-motion keyboard activation closes immediately`);
      assert.equal(await evaluate(`document.querySelector('#experience-${id}').getAttribute('aria-hidden')`),'true');
    }
    await viewport(1440);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  });
  await check('Desktop floating preview follows pointer and stays in viewport', async () => {
    await evaluate("document.querySelectorAll('.experience-trigger[aria-expanded=true]').forEach(button => button.click())");
    await wait("document.querySelectorAll('.experience-inline.is-experience-transitioning').length === 0");
    const point = await evaluate("(() => { const row = document.querySelector('.experience-row[data-preview]'); row.scrollIntoView({block:'center',behavior:'instant'}); const r = row.getBoundingClientRect(); return {x:r.left + r.width*.6,y:r.top+r.height/2}; })()");
    await settle();
    report.pointerEnvironment = await evaluate("({hover:matchMedia('(hover: hover)').matches,fine:matchMedia('(pointer: fine)').matches,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches})");
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
    await wait("document.querySelector('[data-floating-preview]').classList.contains('is-visible')");
    await delay(300);
    const preview = await evaluate("(() => { const e = document.querySelector('[data-floating-preview]'); const r = e.getBoundingClientRect(); return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,events:getComputedStyle(e).pointerEvents,src:e.querySelector('img').getAttribute('src')}; })()");
    report.preview = preview;
    assert.equal(preview.events, 'none'); assert.ok(preview.src.includes('karind.png'));
    assert.ok(preview.x >= 0 && preview.y >= 0 && preview.right <= 1440 && preview.bottom <= 1000, JSON.stringify(preview));
    await screenshot('experience-preview.png');
  });
  await check('Reduced motion disables floating preview without hiding content', async () => {
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await wait("document.querySelector('[data-floating-preview]').hidden");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-name')).opacity"), '1');
  });
  await check('Experience carousel uses full-width list content and supports 3D with dots only and keyboard navigation', async () => {
    await viewport(1440);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await evaluate("(() => {const button=document.querySelector('[aria-controls=experience-independent]'); if(button.getAttribute('aria-expanded')!=='true') button.click();})()");
    await wait("!document.querySelector('#experience-independent').classList.contains('is-experience-transitioning')");
    await evaluate("document.querySelector('[data-carousel-stage]').scrollIntoView({block:'center',behavior:'instant'})");
    await evaluate("Promise.all([...document.querySelectorAll('[data-carousel-slide] img')].map(image=>image.decode())).then(()=>true)");
    const count=portfolio.experience[0].galleryImages.length+1;
    assert.equal(await evaluate("document.querySelectorAll('#experience-independent .experience-responsibilities li').length"),portfolio.experience[0].description.length);
    assert.equal(await evaluate("document.querySelectorAll('#experience-independent [data-carousel-slide]').length"),count);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('#experience-independent')).maxWidth"),'none');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-carousel-stage]')).perspective"),'1200px');
    assert.notEqual(await evaluate("getComputedStyle(document.querySelector('[data-carousel-position=active]')).transform"),'none');
    assert.equal(await evaluate("document.querySelectorAll('#experience-independent [data-carousel-slide][aria-hidden=false]').length"),1);
    assert.equal(await evaluate("document.querySelectorAll('[data-carousel-previous],[data-carousel-next]').length"),0);
    assert.equal(await evaluate("document.querySelector('[data-carousel-status]').classList.contains('sr-only')"),true);
    await evaluate("document.querySelector('[data-carousel-go=\"1\"]').click()");
    assert.equal(await evaluate("document.querySelector('[data-carousel-status]').textContent"),`2 / ${count}`);
    await evaluate("document.querySelector('[data-carousel-go=\"0\"]').click()");
    assert.equal(await evaluate("document.querySelector('[data-carousel-status]').textContent"),`1 / ${count}`);
    await evaluate(`document.querySelector('[data-carousel-go="${count-1}"]').click(); document.querySelector('[data-carousel-stage]').focus()`);
    for(const [key,code,value,expected] of [['Home','Home',36,1],['ArrowLeft','ArrowLeft',37,count],['ArrowRight','ArrowRight',39,1],['End','End',35,count]]) {
      await call('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:value});
      await call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:value});
      assert.equal(await evaluate("document.querySelector('[data-carousel-status]').textContent"),`${expected} / ${count}`);
    }
    assert.equal(await evaluate("[...document.querySelectorAll('[data-carousel-slide]')].every(slide=>slide.inert===(slide.getAttribute('aria-hidden')==='true'))"),true);
    await evaluate("document.querySelector('[data-carousel-go=\"0\"]').click(); document.activeElement.blur(); Promise.all(document.querySelector('[data-experience-carousel]').getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))");
    await screenshot('experience-carousel-desktop.png');
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    await wait("document.querySelector('[data-floating-preview]').hidden");
  });
  await check('Supplied Karind login screenshot renders as its own slide and dot on desktop and mobile', async () => {
    const gallery=portfolio.experience[0].galleryImages;
    const index=gallery.findIndex(media=>media.src==='dist/img/portfolio/karind-login.png')+1;
    assert.ok(index>0);
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    for(const width of [1440,390]) {
      await viewport(width,width<768);
      await evaluate(`document.querySelector('[data-carousel-go="${index}"]').click(); document.activeElement.blur(); document.querySelector('[data-carousel-stage]').scrollIntoView({block:'center',behavior:'instant'})`);
      await evaluate("Promise.all(document.querySelector('[data-experience-carousel]').getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))");
      await evaluate("document.querySelector('[data-carousel-slide][data-carousel-position=active] img').decode()");
      const login=await evaluate("(() => {const slide=document.querySelector('[data-carousel-slide][data-carousel-position=active]'),image=slide.querySelector('img');return {src:image.getAttribute('src'),width:image.naturalWidth,height:image.naturalHeight,caption:slide.querySelector('figcaption').textContent,pressed:document.querySelector('[data-carousel-go][aria-pressed=true]').dataset.carouselGo,overflow:document.documentElement.scrollWidth>innerWidth};})()");
      assert.equal(login.src,'dist/img/portfolio/karind-login.png');
      assert.equal(login.caption,'Karind login page'); assert.equal(Number(login.pressed),index);
      assert.ok(login.width>0 && login.height>0 && !login.overflow);
      await screenshot(width===1440?'experience-karind-login-desktop.png':'experience-karind-login-mobile.png');
    }
    await viewport(1440);
  });
  await check('Carousel transitions share 850ms easing, recycle side cards behind and preserve motion on rapid input', async () => {
    await viewport(1440);
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await evaluate("document.querySelector('[data-carousel-go=\"0\"]').click(); document.activeElement.blur(); document.querySelector('[data-carousel-stage]').scrollIntoView({block:'center',behavior:'instant'}); Promise.all(document.querySelector('[data-experience-carousel]').getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))");
    await evaluate("document.querySelector('[data-carousel-go=\"1\"]').click()");
    const timing=await evaluate("(() => {const root=document.querySelector('[data-experience-carousel]'),ghost=root.querySelector('.is-carousel-ghost'),side=[...root.querySelectorAll('[data-carousel-slide]')].find(slide=>slide.style.zIndex==='0');return {duration:ghost.getAnimations()[0].effect.getTiming().duration,easing:ghost.getAnimations()[0].effect.getTiming().easing,cssDuration:getComputedStyle(root).getPropertyValue('--carousel-motion-duration').trim(),sideFrames:side.getAnimations()[0].effect.getKeyframes().map(frame=>({opacity:frame.opacity,transform:frame.transform}))};})()");
    assert.equal(timing.duration,850); assert.equal(timing.cssDuration,'850ms');
    assert.match(timing.easing,/cubic-bezier\(0\.4, 0, 0\.2, 1\)/);
    assert.ok(timing.sideFrames.some(frame=>Number(frame.opacity)===0 && frame.transform.includes('-340px')),JSON.stringify(timing));
    await settle();
    const continuity=await evaluate("(() => {const before=getComputedStyle(document.querySelector('.is-carousel-ghost')).transform; document.querySelector('[data-carousel-go=\"2\"]').click(); const outgoing=[...document.querySelectorAll('[data-carousel-slide]')].find(slide=>slide.style.zIndex==='2'); return {before,from:outgoing.getAnimations()[0].effect.getKeyframes()[0].transform};})()");
    assert.equal(continuity.from,continuity.before);
    await evaluate("for(const index of [0,2,1,0]) document.querySelector('[data-carousel-go=\"'+index+'\"]').click(); Promise.all(document.querySelector('[data-experience-carousel]').getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))");
    await wait("document.querySelectorAll('.is-carousel-ghost').length === 0");
    assert.equal(await evaluate("document.querySelectorAll('.is-carousel-ghost').length"),0,'Rapid input leaves no decorative slide behind');
    assert.equal(await evaluate("document.querySelector('[data-experience-carousel]').classList.contains('is-changing')"),false);
    assert.equal(await evaluate("[...document.querySelectorAll('[data-carousel-slide]')].every(slide=>!slide.style.visibility && !slide.style.zIndex)"),true);
    await evaluate("document.querySelector('[data-carousel-go=\"1\"]').click()");
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await wait("document.querySelectorAll('.is-carousel-ghost').length === 0");
    assert.equal(await evaluate("document.querySelectorAll('.is-carousel-ghost').length"),0,'Reduced motion clears the running transition');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-carousel-position=active]')).transform"),'none');
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await evaluate("document.querySelector('[data-carousel-go=\"0\"]').click(); Promise.all(document.querySelector('[data-experience-carousel]').getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))");
  });
  await check('Carousel edge cursors use local circle arrows, allow directional clicks, and leave center and touch taps unchanged', async () => {
    await viewport(1440);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await wait("matchMedia('(prefers-reduced-motion: reduce)').matches");
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    await evaluate("document.querySelector('[data-carousel-go=\"0\"]').click(); document.activeElement.blur(); document.querySelector('[data-carousel-stage]').scrollIntoView({block:'center',behavior:'instant'})");
    await settle();
    const count=portfolio.experience[0].galleryImages.length+1;
    const points=await evaluate("(() => {const r=document.querySelector('[data-carousel-stage]').getBoundingClientRect();return {left:{x:r.x+r.width*.1,y:r.y+r.height*.5},center:{x:r.x+r.width*.5,y:r.y+r.height*.5},right:{x:r.x+r.width*.9,y:r.y+r.height*.5}};})()");
    async function move(point) { await call('Input.dispatchMouseEvent',{type:'mouseMoved',...point}); }
    async function click(point) {
      await call('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
      await call('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
    }
    for(const [side,direction,expected] of [['left','previous',count],['right','next',1]]) {
      await move(points[side]);
      const cursor=await evaluate(`({side:document.querySelector('[data-carousel-stage]').dataset.carouselCursor,cursor:getComputedStyle(document.elementFromPoint(${points[side].x},${points[side].y})).cursor})`);
      assert.equal(cursor.side,direction);
      assert.ok(cursor.cursor.includes(`cursor-circle-${side}.svg`) && cursor.cursor.includes('18 18'),JSON.stringify(cursor));
      await click(points[side]);
      assert.equal(await evaluate("document.querySelector('[data-carousel-status]').textContent"),`${expected} / ${count}`);
    }
    await move(points.center); await click(points.center);
    assert.equal(await evaluate("document.querySelector('[data-carousel-stage]').hasAttribute('data-carousel-cursor')"),false);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('[data-carousel-stage]')).cursor"),'auto');
    assert.equal(await evaluate("document.querySelector('[data-carousel-status]').textContent"),`1 / ${count}`);
    await move(points.left);
    await call('Input.dispatchMouseEvent',{type:'mousePressed',...points.left,button:'left',clickCount:1});
    await move(points.center);
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',...points.center,button:'left',clickCount:1});
    assert.equal(await evaluate("document.querySelector('[data-carousel-status]').textContent"),`${count} / ${count}`);
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    assert.equal(await evaluate("document.querySelector('[data-carousel-stage]').hasAttribute('data-carousel-cursor')"),false);
    for(const side of ['left','right']) assert.equal(await evaluate(`fetch('dist/img/cursor-circle-${side}.svg').then(response=>response.status)`),200);
    const preview=await evaluate(`(async () => {
      const canvas=document.createElement('canvas'); canvas.width=112; canvas.height=56; const context=canvas.getContext('2d'); context.fillStyle='#242424'; context.fillRect(0,0,112,56);
      for(const [index,side] of ['left','right'].entries()) {const image=new Image(); image.src='dist/img/cursor-circle-'+side+'.svg'; await image.decode(); context.drawImage(image,10+index*56,10,36,36);}
      return canvas.toDataURL('image/png').split(',')[1];
    })()`);
    await writeFile(join(output,'carousel-cursor-icons.png'),Buffer.from(preview,'base64'));
    await viewport(390,true);
    await evaluate("document.querySelector('[data-carousel-go=\"0\"]').click(); document.querySelector('[data-carousel-stage]').scrollIntoView({block:'center',behavior:'instant'})");
    const touch=await evaluate("(() => {const r=document.querySelector('[data-carousel-stage]').getBoundingClientRect();return {x:r.x+r.width*.1,y:r.y+r.height*.5};})()");
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...touch,id:1}]});
    await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await evaluate("document.querySelector('[data-carousel-stage]').hasAttribute('data-carousel-cursor')"),false);
    assert.equal(await evaluate("document.querySelector('[data-carousel-status]').textContent"),`1 / ${count}`);
    await viewport(1440);
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
  });
  await check(`Hover rotates every ${carouselInterval / 1000} seconds to the left, wraps forward to slide one, and pauses outside the stage`, async () => {
    report.carouselInterval = carouselInterval;
    await viewport(1440);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    await evaluate("document.querySelector('[data-carousel-go=\"0\"]').click(); document.activeElement.blur(); document.querySelector('[data-carousel-stage]').scrollIntoView({block:'center',behavior:'instant'})");
    const count=portfolio.experience[0].galleryImages.length+1;
    const status=()=>evaluate("document.querySelector('[data-carousel-status]').textContent");
    const point=await evaluate("(() => {const r=document.querySelector('[data-carousel-stage]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
    const hover=()=>call('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});
    try {
      await delay(carouselInterval+150); assert.equal(await status(),`1 / ${count}`);
      await hover(); await delay(Math.max(100,carouselInterval-400)); assert.equal(await status(),`1 / ${count}`);
      for(let step=1;step<=count;step++) {
        const expected=`${step%count+1} / ${count}`;
        await wait(`document.querySelector('[data-carousel-status]').textContent===${JSON.stringify(expected)}`,carouselInterval+1500);
        const frames=await evaluate("(() => {const ghost=document.querySelector('.is-carousel-ghost'),outgoing=[...document.querySelectorAll('[data-carousel-slide]')].find(slide=>slide.style.zIndex==='2');return {ghost:!!ghost,decorative:ghost?.getAttribute('aria-hidden'),incoming:ghost?.getAnimations()[0]?.effect.getKeyframes()[0]?.transform,outgoing:outgoing?.getAnimations()[0]?.effect.getKeyframes().at(-1)?.transform};})()");
        assert.equal(frames.ghost,true); assert.equal(frames.decorative,'true');
        assert.match(frames.incoming,/translate3d\(46%/); assert.match(frames.outgoing,/translate3d\(-46%/);
      }
      await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
      await evaluate("Promise.all(document.querySelector('[data-experience-carousel]').getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))");
      assert.equal(await evaluate("document.querySelectorAll('.is-carousel-ghost').length"),0);
      await delay(carouselInterval+150); assert.equal(await status(),`1 / ${count}`);
      await hover(); await evaluate("window.dispatchEvent(new Event('blur'))");
      await delay(carouselInterval+150); assert.equal(await status(),`1 / ${count}`);
      await evaluate("window.dispatchEvent(new Event('focus'))");
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
      await delay(carouselInterval+150); assert.equal(await status(),`1 / ${count}`);
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
      await evaluate("document.querySelector('[aria-controls=experience-independent]').click()");
      await delay(carouselInterval+150); assert.equal(await status(),`1 / ${count}`);
      await evaluate("document.querySelector('[aria-controls=experience-independent]').click()");
    } finally {
      await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
      await evaluate("window.dispatchEvent(new Event('focus')); document.activeElement.blur()");
    }
  });
  await check('Experience carousel fits six viewports and becomes a flat accessible slideshow with reduced motion', async () => {
    report.experienceCarousel=[];
    for(const width of [360,390,768,1024,1440,1920]) {
      await viewport(width,width<768);
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
      await evaluate("Promise.all(document.querySelector('[data-experience-carousel]').getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))");
      const normal=await evaluate("(() => {const stage=document.querySelector('[data-carousel-stage]').getBoundingClientRect(),active=document.querySelector('[data-carousel-position=active]').getBoundingClientRect();return {pageWidth:document.documentElement.scrollWidth,top:active.top-stage.top,left:active.left-stage.left,right:stage.right-active.right,bottom:stage.bottom-active.bottom};})()");
      assert.ok(normal.pageWidth<=width+1 && normal.top>=0 && normal.left>=0 && normal.right>=0 && normal.bottom>=0,JSON.stringify({width,...normal}));
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
      await evaluate("document.querySelector('[data-carousel-stage]').scrollIntoView({block:'center',behavior:'instant'})");
      const result=await evaluate(`(() => {const panel=document.querySelector('#experience-independent'),stage=panel.querySelector('[data-carousel-stage]'),r=panel.getBoundingClientRect(),slide=panel.querySelector('[data-carousel-position=active]');return {width:innerWidth,pageWidth:document.documentElement.scrollWidth,panelWidth:r.width,rowWidth:panel.parentElement.getBoundingClientRect().width,perspective:getComputedStyle(stage).perspective,transform:getComputedStyle(slide).transform,visible:[...panel.querySelectorAll('[data-carousel-slide]')].filter(slide=>getComputedStyle(slide).display!=='none').length,controls:[...panel.querySelectorAll('.experience-carousel-controls button')].map(button=>{const r=button.getBoundingClientRect();return {width:r.width,height:r.height,right:r.right};})};})()`);
      report.experienceCarousel.push(result);
      assert.ok(result.pageWidth<=width+1,JSON.stringify(result));
      assert.ok(Math.abs(result.panelWidth-result.rowWidth)<1,JSON.stringify(result));
      assert.equal(result.perspective,'none'); assert.equal(result.transform,'none'); assert.equal(result.visible,1);
      assert.ok(result.controls.every(control=>control.width>=44 && control.height>=44 && control.right<=width),JSON.stringify(result));
      if(width===390) await screenshot('experience-carousel-mobile.png');
    }
    await viewport(1440);
  });
  await check('Experience carousel accepts horizontal touch swipe and preserves the selected slide after closing', async () => {
    await viewport(390,true);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await evaluate("document.querySelector('[data-carousel-go=\"0\"]').click(); document.querySelector('[data-carousel-stage]').scrollIntoView({block:'center',behavior:'instant'})");
    const point=await evaluate("(() => {const r=document.querySelector('[data-carousel-stage]').getBoundingClientRect();return {x:r.x+r.width*.8,y:r.y+r.height*.4};})()");
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y,id:1}]});
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x-60,y:point.y,id:1}]});
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x-140,y:point.y,id:1}]});
    await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const expected=`2 / ${portfolio.experience[0].galleryImages.length+1}`;
    await wait(`document.querySelector('[data-carousel-status]').textContent===${JSON.stringify(expected)}`);
    await evaluate("document.activeElement.blur(); Promise.all(document.querySelector('[data-experience-carousel]').getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))");
    await screenshot('experience-carousel-mobile-3d.png');
    await evaluate("document.querySelector('[aria-controls=experience-independent]').click(); document.querySelector('[aria-controls=experience-independent]').click()");
    assert.equal(await evaluate("document.querySelector('[data-carousel-status]').textContent"),expected);
    await evaluate("document.querySelector('[aria-controls=experience-independent]').click()");
    await viewport(1440);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  });
  await check('BPS internship follows Karind, displays all seven original assets and keeps carousel state independent on desktop and mobile', async () => {
    const bps=portfolio.experience.find(item=>item.id==='bps-semarang');
    const media=[bps.previewImage,...bps.galleryImages];
    await viewport(1440);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    const order=await evaluate("[...document.querySelectorAll('.experience-trigger')].map(button=>button.getAttribute('aria-controls'))");
    assert.deepEqual(order.slice(0,2),['experience-independent','experience-bps-semarang']);
    assert.equal(await evaluate("document.querySelector('[aria-controls=experience-bps-semarang] .experience-period').textContent"),'Aug 2025 — Jan 2026');
    assert.equal(await evaluate("document.querySelector('[aria-controls=experience-bps-semarang] .experience-role').textContent"),bps.role);
    await evaluate("document.querySelector('[aria-controls=experience-bps-semarang]').click()");
    assert.equal(await evaluate("document.querySelector('#experience-bps-semarang').getAnimations()[0].effect.getTiming().duration"),560);
    await wait("!document.querySelector('#experience-bps-semarang').classList.contains('is-experience-transitioning')");
    assert.equal(await evaluate("document.querySelectorAll('#experience-bps-semarang [data-carousel-slide]').length"),7);
    assert.equal(await evaluate("document.querySelectorAll('#experience-bps-semarang [data-carousel-go]').length"),7);
    assert.equal(await evaluate("document.querySelectorAll('#experience-bps-semarang .experience-responsibilities li').length"),bps.description.length);
    assert.equal(await evaluate("document.querySelector('#experience-bps-semarang .text-link')"),null);
    assert.equal(await evaluate("document.querySelector('a[href*=undefined]')"),null);
    const karindStatus=await evaluate("document.querySelector('#experience-independent [data-carousel-status]').textContent");
    await evaluate("Promise.all([...document.querySelectorAll('#experience-bps-semarang img')].map(image=>image.decode())).then(()=>true)");
    for(const width of [1440,390,360]) {
      await viewport(width,width<768);
      await evaluate("document.querySelector('#experience-bps-semarang [data-carousel-stage]').scrollIntoView({block:'center',behavior:'instant'})");
      await settle();
      const dimensions=await evaluate("(() => {const panel=document.querySelector('#experience-bps-semarang'),stage=panel.querySelector('[data-carousel-stage]'),r=stage.getBoundingClientRect();return {perspective:getComputedStyle(stage).perspective,width:innerWidth,pageWidth:document.documentElement.scrollWidth,buttons:[...panel.querySelectorAll('[data-carousel-go]')].map(button=>{const b=button.getBoundingClientRect();return {width:b.width,height:b.height,left:b.left,right:b.right};})};})()");
      assert.equal(dimensions.perspective,'1200px'); assert.ok(dimensions.pageWidth<=width+1);
      assert.ok(dimensions.buttons.every(button=>button.width>=44 && button.height>=44 && button.left>=0 && button.right<=width),JSON.stringify(dimensions));
      for(const [index,image] of media.entries()) {
        await evaluate(`document.querySelector('#experience-bps-semarang [data-carousel-go="${index}"]').click(); document.activeElement.blur(); Promise.all(document.querySelector('#experience-bps-semarang [data-experience-carousel]').getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))`);
        const active=await evaluate("(() => {const panel=document.querySelector('#experience-bps-semarang'),slide=panel.querySelector('[data-carousel-position=active]'),image=slide.querySelector('img');return {src:image.getAttribute('src'),width:image.naturalWidth,height:image.naturalHeight,fit:getComputedStyle(image).objectFit,caption:slide.querySelector('figcaption').textContent,status:panel.querySelector('[data-carousel-status]').textContent,pressed:panel.querySelector('[aria-pressed=true]').dataset.carouselGo};})()");
        assert.equal(active.src,image.src); assert.equal(active.width,image.width); assert.equal(active.height,image.height);
        assert.equal(active.fit,'contain'); assert.equal(active.caption,image.caption);
        assert.equal(active.status,`${index+1} / 7`); assert.equal(Number(active.pressed),index);
        assert.equal(await evaluate("document.querySelector('#experience-independent [data-carousel-status]').textContent"),karindStatus);
      }
      if(width!==360) {
        await evaluate("document.querySelector('#experience-bps-semarang [data-carousel-go=\"4\"]').click(); Promise.all(document.querySelector('#experience-bps-semarang [data-experience-carousel]').getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))");
        await evaluate("document.querySelector('[aria-controls=experience-bps-semarang]').scrollIntoView({block:'start',behavior:'instant'})");
        await screenshot(width===1440?'experience-bps-desktop.png':'experience-bps-mobile.png');
      }
    }
    await viewport(1440);
    await evaluate("document.querySelector('#experience-bps-semarang [data-carousel-go=\"6\"]').click(); document.activeElement.blur(); document.querySelector('#experience-bps-semarang [data-carousel-stage]').scrollIntoView({block:'center',behavior:'instant'}); Promise.all(document.querySelector('#experience-bps-semarang [data-experience-carousel]').getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))");
    await settle();
    const point=await evaluate("(() => {const r=document.querySelector('#experience-bps-semarang [data-carousel-stage]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
    await wait("document.querySelector('#experience-bps-semarang [data-carousel-status]').textContent==='1 / 7'",carouselInterval+1500);
    assert.equal(await evaluate("document.querySelector('#experience-independent [data-carousel-status]').textContent"),karindStatus);
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await wait("document.querySelectorAll('#experience-bps-semarang .is-carousel-ghost').length===0");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('#experience-bps-semarang [data-carousel-stage]')).perspective"),'none');
    await evaluate("document.querySelector('[aria-controls=experience-bps-semarang]').click()");
    await wait("document.querySelector('#experience-bps-semarang').hidden");
  });
  await check('SIMONE Institutional Systems keeps the original screenshot and two labelled reconstruction slides without affecting other carousels', async () => {
    const experience=portfolio.experience.find(item=>item.id==='internship');
    const media=[experience.previewImage,...experience.galleryImages];
    const siblings=await evaluate("['independent','bps-semarang'].map(id=>document.querySelector('#experience-'+id+' [data-carousel-status]').textContent)");
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    await viewport(1440);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await evaluate("document.querySelector('[aria-controls=experience-internship]').click()");
    await wait("!document.querySelector('#experience-internship').classList.contains('is-experience-transitioning')");
    assert.equal(await evaluate("document.querySelectorAll('#experience-internship [data-carousel-go]').length"),3);
    for(const width of [1440,390]) {
      await viewport(width,width<768);
      await evaluate("document.querySelector('#experience-internship [data-carousel-stage]').scrollIntoView({block:'center',behavior:'instant'}); Promise.all([...document.querySelectorAll('#experience-internship img')].map(image=>image.decode())).then(()=>true)");
      for(const [index,image] of media.entries()) {
        await evaluate(`document.querySelector('#experience-internship [data-carousel-go="${index}"]').click(); document.activeElement.blur(); Promise.all(document.querySelector('#experience-internship [data-experience-carousel]').getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))`);
        const active=await evaluate("(() => {const panel=document.querySelector('#experience-internship'),image=panel.querySelector('[data-carousel-position=active] img');return {src:image.getAttribute('src'),width:image.naturalWidth,height:image.naturalHeight,caption:panel.querySelector('[data-carousel-position=active] figcaption').textContent,visible:panel.querySelectorAll('[data-carousel-slide][aria-hidden=false]').length,fit:getComputedStyle(image).objectFit,pressed:panel.querySelector('[aria-pressed=true]').dataset.carouselGo,pageWidth:document.documentElement.scrollWidth};})()");
        assert.equal(active.src,image.src); assert.equal(active.width,image.width); assert.equal(active.height,image.height);
        assert.equal(active.caption,image.caption); assert.equal(active.fit,'contain'); assert.equal(active.visible,1);
        assert.equal(Number(active.pressed),index); assert.ok(active.pageWidth<=width+1);
      }
      await evaluate("document.querySelector('[aria-controls=experience-internship]').scrollIntoView({block:'start',behavior:'instant'})");
      await screenshot(width===1440?'experience-simone-desktop.png':'experience-simone-mobile.png');
    }
    assert.deepEqual(await evaluate("['independent','bps-semarang'].map(id=>document.querySelector('#experience-'+id+' [data-carousel-status]').textContent)"),siblings);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await wait("document.querySelectorAll('#experience-internship .is-carousel-ghost').length===0");
    await evaluate("document.querySelector('[aria-controls=experience-internship]').click()");
    await wait("document.querySelector('#experience-internship').hidden");
    await viewport(1440);
  });
  await check('Real navigation to detail and browser Back preserve work state', async () => {
    await evaluate("document.querySelector('[data-work-grid] [data-slug=karind] a').click()");
    await wait("document.body.dataset.page === 'project' && location.pathname.includes('/work/karind/')");
    assert.equal(await evaluate("document.querySelector('h1').textContent"), 'Karya Indonesia (Karind)');
    assert.equal(await evaluate("document.querySelectorAll('.more-work [data-slug=karind]').length"), 0);
    await evaluate("document.querySelector('[data-back]').click()");
    await wait("document.body.dataset.page === 'home'");
    // Native Back may expose the homepage DOM before its saved filter is restored.
    await wait("document.querySelector('[data-work-grid]')?.getAttribute('aria-busy') === 'false' && [...document.querySelectorAll('[data-work-grid] .project-card')].filter(e => !e.hidden).length === 5");
    assert.equal(await evaluate("[...document.querySelectorAll('[data-work-grid] .project-card')].filter(e => !e.hidden).length"), 5);
  });
  await check('Animated detail navigation and Back do not leave the homepage faded out', async () => {
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await evaluate("document.querySelector('[data-work-grid] [data-slug=karind] a').click()");
    await wait("document.body.dataset.page === 'project' && document.documentElement.classList.contains('is-enhanced')");
    await evaluate("document.querySelector('[data-back]').click()");
    await wait("document.body.dataset.page === 'home' && getComputedStyle(document.querySelector('main')).opacity === '1'");
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  });
  await navigate('/work/karind/');
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await viewport(width, width < 768);
    await check(`Project detail layout ${width}px`, async () => {
      const result = await evaluate(`({ page:'detail', requested:${width}, width:innerWidth, scrollWidth:document.documentElement.scrollWidth, h1:document.querySelectorAll('h1').length, columns:getComputedStyle(document.querySelector('.detail-header')).gridTemplateColumns.split(' ').length })`);
      report.viewports.push(result); assert.ok(result.scrollWidth <= width + 1, JSON.stringify(result));
      assert.equal(result.h1, 1); assert.equal(result.columns, width < 768 ? 1 : 2);
    });
    if (width === 1440) await screenshot('detail-desktop.png', true);
    if (width === 390) await screenshot('detail-mobile.png', true);
  }
  await check('Every case study renders its narratives and real metadata without mobile or desktop overflow', async () => {
    for (const project of portfolio.projects.filter(project => project.published)) {
      await navigate('/work/' + project.slug + '/');
      for (const width of [390, 1440]) {
        await viewport(width, width < 768);
        const result = await evaluate(`({ page:document.body.dataset.page, title:document.querySelector('h1').textContent, metadata:Object.fromEntries([...document.querySelectorAll('.project-metadata > div')].map(row => [row.querySelector('dt').textContent,row.querySelector('dd').textContent])), sections:[...document.querySelectorAll('.case-section')].map(section => ({ heading:section.querySelector('h2').textContent, paragraphs:[...section.querySelectorAll('p')].map(paragraph => paragraph.textContent) })), caption:document.querySelector('.project-showcase figcaption')?.textContent, live:document.querySelector('a[target="_blank"].button-dark')?.href || null, emptyLinks:document.querySelectorAll('a[href="#"]').length, scrollWidth:document.documentElement.scrollWidth })`);
        assert.equal(result.page, 'project'); assert.equal(result.title, project.title);
        assert.equal(result.metadata.Role, project.role);
        assert.equal(result.metadata.Timeline, project.timelineText);
        assert.equal(result.metadata.Tools, project.tools.length ? project.tools.join('') : undefined);
        assert.deepEqual(result.sections, project.sections.map(({ heading, paragraphs }) => ({ heading, paragraphs })));
        assert.equal(result.caption, project.coverImage.caption);
        assert.equal(result.live, project.liveUrl ? new URL(project.liveUrl).href : null);
        assert.equal(result.emptyLinks, 0);
        assert.ok(result.scrollWidth <= width + 1, `${project.slug} overflows at ${width}px`);
        if (project.slug === 'matsuri-castle') await screenshot(`detail-matsuri-${width}.png`, true);
      }
      await evaluate(`document.addEventListener('click',event=>{if(event.target.closest?.('a[href^="mailto:"]')) event.preventDefault();}); document.querySelector('.detail-actions a[href^="mailto:"]').click();`);
      await wait("document.querySelector('.collaboration-dialog')?.open");
      assert.equal(await evaluate("document.querySelector('[data-inquiry-recipient]').textContent"),portfolio.profile.email);
      await evaluate("document.querySelector('[data-inquiry-close]').click()");
    }
  });
  await check('Direct-entry Back has a working homepage work fallback', async () => {
    assert.ok((await evaluate("document.querySelector('[data-back]').href")).endsWith('/#work'));
    await evaluate("document.querySelector('[data-back]').click()"); await wait("document.body.dataset.page === 'home'");
  });
  await check('JavaScript-disabled homepage keeps portrait, content, work, and service descriptions visible', async () => {
    await call('Emulation.setScriptExecutionDisabled', { value: true });
    await call('Page.navigate', { url: origin + '/' }); await delay(500);
    assert.equal(await evaluate("document.querySelectorAll('h1').length"), 1);
    assert.equal(await evaluate("[...document.querySelectorAll('.service-panel')].every(e => !e.hidden)"), true);
    assert.equal(await evaluate("[...document.querySelectorAll('.project-card')].filter(e => !e.hidden).length"), 5);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-name')).opacity"), '1');
    assert.equal(await evaluate("document.querySelectorAll('.portrait-color-reveal').length"), 0);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.portrait-image')).filter"), 'grayscale(1)');
    assert.equal(await evaluate("document.querySelectorAll('.collaboration-dialog').length"),0);
    assert.ok((await evaluate("document.querySelector('.hero-bio .button').getAttribute('href')")).startsWith('mailto:'+portfolio.profile.email));
    assert.equal(await evaluate("[...document.querySelectorAll('.experience-inline')].every(panel=>!panel.hidden)"),true);
    assert.equal(await evaluate("document.querySelectorAll('[data-carousel-slide][aria-hidden]').length"),0);
    assert.equal(await evaluate("document.querySelector('[data-carousel-controls]').hidden"),true);
    assert.equal(await evaluate("document.querySelectorAll('#experience-independent .experience-responsibilities li').length"),portfolio.experience[0].description.length);
    await call('Emulation.setScriptExecutionDisabled', { value: false });
  });
  await check('Double-click file entry loads homepage and real index.html detail links', async () => {
    await navigate(pathToFileURL(join(root, 'index.html')).href);
    assert.ok((await evaluate("document.querySelector('[data-work-link]').href")).endsWith('/work/karind/index.html'));
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.site-frame')).backgroundColor"), 'rgb(248, 248, 248)');
    await evaluate(`document.addEventListener('click',event=>{if(event.target.closest?.('a[href^="mailto:"]')) event.preventDefault();}); document.querySelector('.hero-bio .button').click();`);
    await wait("document.querySelector('.collaboration-dialog')?.open");
    await evaluate("document.querySelector('[data-inquiry-close]').click()");
  });
  }
  await check('Editable SIMONE reconstruction sources fit their exact screenshot viewport with demo labels and all form actions visible', async () => {
    await viewport(1440,false,900);
    for (const scene of ['dashboard','registration']) {
      const url=pathToFileURL(join(root,`assets/previews/simone/${scene}.html`)).href;
      await call('Page.navigate',{url});
      await wait(`location.href===${JSON.stringify(url)} && document.readyState==='complete'`);
      await settle();
      const state=await evaluate("(() => {const footer=document.querySelector('footer'),r=footer.getBoundingClientRect();return {width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,footer:footer.textContent,bottom:r.bottom,actions:[...document.querySelectorAll('.form-actions button')].map(button=>button.getBoundingClientRect().bottom)};})()");
      assert.equal(state.width,1440); assert.equal(state.height,900);
      assert.ok(state.pageWidth<=1440 && state.pageHeight<=900,JSON.stringify({scene,...state}));
      assert.ok(state.bottom<=900,JSON.stringify({scene,...state}));
      assert.match(state.footer,/Rekonstruksi antarmuka · Data demonstrasi/);
      if(scene==='registration') {assert.equal(state.actions.length,2); assert.ok(state.actions.every(bottom=>bottom<900));}
    }
  });
  await check('No runtime errors or failed local asset requests', async () => {
    assert.deepEqual(report.exceptions, []); assert.deepEqual(report.failedLocalRequests, []);
  });
  report.passed = report.checks.filter(check => check.passed).length;
  report.failed = report.checks.length - report.passed;
  await writeFile(join(output, simonePreviewsOnly ? 'results-simone-previews.json' : 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, failed: report.failed, output }, null, 2));
  if (report.failed) process.exitCode = 1;
} finally {
  socket?.close(); chrome.kill(); server.close();
}
