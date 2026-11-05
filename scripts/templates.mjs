export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const e = escapeHtml;
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
const pad = number => String(number).padStart(2, '0');
const asset = (media, base = '') => base + media.src.split('/').map(encodeURIComponent).join('/');
export const publishedProjects = data => data.projects.filter(project => project.published).sort((a, b) => a.order - b.order);
export const filterProjects = (projects, type = 'all', showAll = false) => projects.filter(project => (showAll || project.featured) && (type === 'all' || project.projectType === type));
export const projectHref = (project, base = '') => `${base}work/${encodeURIComponent(project.slug)}/index.html`;

export function contactUrl(profile) {
  const body = 'Hi Alif,\r\n\r\nMy name is:\r\nCompany / organization:\r\nProject or idea:\r\nEstimated timeline:\r\nBudget range:\r\nPreferred time for a call:\r\n\r\nThank you,';
  return `mailto:${profile.email}?subject=${encodeURIComponent('Project inquiry from your portfolio')}&body=${encodeURIComponent(body)}`;
}

function image(media, base = '', className = '', eager = false) {
  return `<img class="${e(className)}" src="${e(asset(media, base))}" alt="${e(media.alt)}" width="${media.width}" height="${media.height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />`;
}
function status(profile) {
  return `<span class="status${profile.availableForWork ? '' : ' is-unavailable'}"><span class="status-dot" aria-hidden="true"></span>${e(profile.availableForWork ? profile.availabilityLabel : 'Not accepting new projects')}</span>`;
}
function socials(profile) {
  return profile.socialLinks.filter(social => social.url).map(social => `<a class="social-pill" href="${e(social.url)}" target="_blank" rel="noopener noreferrer">${e(social.label)} ${arrow}</a>`).join('\n');
}
function sectionHeading(title, ghost, detail = '') {
  return `<div class="section-heading reveal"><span class="ghost-title" aria-hidden="true">${e(ghost)}</span><h2>/${e(title)}</h2>${detail ? `<p>${detail}</p>` : ''}</div>`;
}
export function projectCard(project, base = '') {
  return `<article class="project-card reveal" data-project-type="${project.projectType}" data-featured="${project.featured}" data-slug="${e(project.slug)}">
    <a class="project-link" href="${projectHref(project, base)}" data-work-link>
      <div class="project-media"><span class="category-pill">${e(project.category)}</span>${image(project.coverImage, base)}<span class="project-arrow" aria-hidden="true">↗</span></div>
      <div class="project-caption"><h3>${e(project.title)}</h3><span class="project-kind">${project.projectType === 'real' ? 'Real Project' : 'Exploration'}</span><div class="tags">${project.tags.map(tag => `<span>${e(tag)}</span>`).join('')}</div></div>
    </a>
  </article>`;
}
function header(data) {
  const projects = publishedProjects(data);
  return `<header class="site-header">
    <div class="header-identity">${status(data.profile)}</div>
    <button class="menu-button" type="button" aria-controls="primary-nav" aria-expanded="false" hidden><span>Menu</span><span class="menu-symbol" aria-hidden="true">☰</span></button>
    <nav class="primary-nav" id="primary-nav" aria-label="Primary"><a href="#work">Work <span class="nav-count">[${pad(projects.length)}]</span></a><a href="#service">Service <span class="nav-count">[${data.services.length}]</span></a><a href="#experience">Experience <span class="nav-count">[${data.profile.experienceYears}y+]</span></a><a href="#contact">Contact</a><a class="button button-dark" href="${e(contactUrl(data.profile))}">Let’s Talk ${arrow}</a></nav>
  </header>`;
}
function hero(data) {
  const profile = data.profile;
  return `<section class="hero" id="home" aria-labelledby="hero-name">
    <p class="hero-kicker">Independent developer · ${e(profile.location)}</p>
    <h1 class="hero-name" id="hero-name"><span class="name-outline">${e(profile.outlinePart)}</span><span class="name-solid">${e(profile.solidPart)}</span></h1>
    <div class="hero-bottom">
      <div class="hero-bio"><span class="small-label">Thoughtful design. Practical code.</span><h2>${e(profile.role)}</h2><p>${e(profile.shortBio)}</p><a class="button button-dark" href="${e(contactUrl(profile))}">Let’s collaborate ${arrow}</a></div>
      <figure class="hero-portrait">${image(profile.portraitCutout || profile.portrait, '', 'portrait-image', true)}<figcaption class="sr-only">${e(profile.fullName)}, ${e(profile.role)}</figcaption></figure>
      <div class="hero-socials"><span class="small-label">Find me elsewhere</span>${socials(profile)}<span class="hero-scroll">Scroll to explore <span aria-hidden="true">↓</span></span></div>
    </div>
  </section>`;
}
function work(data) {
  const projects = publishedProjects(data);
  return `<section class="work section" id="work" aria-label="Selected Work">${sectionHeading('Selected Work', 'Portfolio')}
    <div class="work-toolbar"><div class="filters" role="group" aria-label="Filter projects" hidden><button type="button" data-filter="all" aria-pressed="true">All</button><button type="button" data-filter="real" aria-pressed="false">Real Project</button><button type="button" data-filter="exploration" aria-pressed="false">Exploration</button></div><button class="button button-outline" type="button" data-view-all hidden>View All Work ${arrow}</button></div>
    <p class="work-status small-label" role="status" aria-live="polite">${projects.length} projects</p><div class="work-grid" data-work-grid>${projects.map(project => projectCard(project)).join('\n')}</div>
    <p class="empty-state" data-empty-state hidden>Belum ada karya pada kategori ini. <button type="button" class="text-button" data-reset-filter>View all projects ${arrow}</button></p>
  </section>`;
}
function services(data) {
  return `<section class="service section" id="service" aria-label="Services">${sectionHeading('Service', 'Service', 'From a clear first impression to the systems behind it.')}<div class="service-list">${data.services.map((service, index) => `<article class="service-item">
    <h3><button class="service-trigger" id="service-${e(service.id)}" type="button" aria-expanded="true" aria-controls="panel-${e(service.id)}"><span class="service-number">${pad(index + 1)}</span><span>${e(service.title)}</span><span class="service-symbol" aria-hidden="true">↗</span></button></h3>
    <div class="service-panel" id="panel-${e(service.id)}" role="region" aria-labelledby="service-${e(service.id)}"><div class="service-panel-inner"><div class="service-copy"><p>${e(service.summary)}</p><ul>${service.capabilities.map(capability => `<li>${e(capability)}</li>`).join('')}</ul><a class="button button-light" href="${e(contactUrl(data.profile))}">Let’s talk about it ${arrow}</a></div><figure class="service-mockup">${image(service.mockupImage)}<figcaption>Selected work · ${e(service.mockupImage.alt)}</figcaption></figure></div></div>
  </article>`).join('\n')}</div><noscript><p>All service details are shown while JavaScript is disabled.</p></noscript></section>`;
}
function formatDate(value) {
  if (/^\d{4}$/.test(value)) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T00:00:00Z`));
}
function experienceMedia(item) {
  const slides = [item.previewImage, ...(item.galleryImages || [])];
  if (slides.length < 2) return image(item.previewImage);
  return `<section class="experience-carousel" data-experience-carousel role="region" aria-roledescription="carousel" aria-label="${e(item.organization)} project screenshots"><div class="experience-carousel-stage" data-carousel-stage tabindex="0" aria-label="Project screenshots. Hover to rotate automatically, click the edges, or use the left and right arrow keys.">${slides.map((media, index) => `<figure class="experience-slide" data-carousel-slide role="group" aria-roledescription="slide" aria-label="${index + 1} of ${slides.length}">${image(media, '', 'experience-slide-image')}<figcaption>${e(media.caption || media.alt)}</figcaption></figure>`).join('')}</div><div class="experience-carousel-controls" data-carousel-controls hidden><span class="sr-only" data-carousel-status role="status" aria-live="polite" aria-atomic="true">1 / ${slides.length}</span><div class="experience-carousel-dots" aria-label="Choose a screenshot">${slides.map((media, index) => `<button class="experience-carousel-dot" type="button" data-carousel-go="${index}" aria-label="Show screenshot ${index + 1}: ${e(media.caption || media.alt)}" aria-pressed="${index === 0}"><span aria-hidden="true"></span></button>`).join('')}</div></div></section>`;
}
export function renderExperience(data) {
  return `<section class="experience section" id="experience" aria-label="Experience">${sectionHeading('Experience', 'Experience', `<span class="experience-years">${data.profile.experienceYears}+ years of experience</span>`)}<p class="experience-intro reveal">${e(data.profile.about)}</p><div class="experience-list">${data.experience.map(experience => {
    const description = `<span class="experience-org">${e(experience.organization)}</span><span class="experience-role">${e(experience.role)}</span><span class="experience-period">${e(formatDate(experience.startDate))} — ${experience.isCurrent ? 'Present' : e(formatDate(experience.endDate))}</span>`;
    const details = Array.isArray(experience.description) ? `<ul class="experience-responsibilities">${experience.description.map(text => `<li>${e(text)}</li>`).join('')}</ul>` : `<p>${e(experience.description)}</p>`;
    const relatedProject = experience.projectSlug ? `<a class="text-link" href="work/${e(experience.projectSlug)}/index.html" data-work-link>Related project ${arrow}</a>` : '';
    return `<article class="experience-row reveal" ${experience.previewImage ? `data-preview="${e(asset(experience.previewImage))}" data-preview-alt="${e(experience.previewImage.alt)}"` : ''}>${experience.previewImage ? `<h3><button class="experience-trigger" type="button" aria-expanded="true" aria-controls="experience-${e(experience.id)}">${description}<span class="experience-indicator" aria-hidden="true">↗</span></button></h3><div class="experience-inline" id="experience-${e(experience.id)}">${experienceMedia(experience)}${details}${relatedProject}</div>` : `<div class="experience-static"><h3>${description}</h3></div>`}</article>`;
  }).join('\n')}</div><div class="experience-skills reveal"><span class="small-label">Working with</span><div class="tags">${data.profile.skills.map(skill => `<span>${e(skill)}</span>`).join('')}</div></div></section>`;
}
function contact(data, base = '', includeFaqs = false) {
  const profile = data.profile;
  return `<section class="contact section" id="contact" aria-label="Contact"><div class="contact-heading reveal">${status(profile)}<h2>${e(profile.contactHeadline)}</h2><p>${e(profile.contactBody)}</p><a class="button button-dark" href="${e(contactUrl(profile))}">Contact Me ${arrow}</a></div><div class="contact-social-row reveal"><a class="profile-pill" href="${base}index.html#home">${image(profile.portrait, base, 'avatar')}<span>${e(profile.fullName)}</span></a><div class="contact-socials">${socials(profile)}</div></div>${includeFaqs ? `<details class="practical-faqs" id="faqs"><summary>Questions before we start? <span aria-hidden="true">+</span></summary><div class="faq-list">${data.faqs.map(faq => `<details><summary>${e(faq.question)}</summary><p>${e(faq.answer)}</p></details>`).join('')}</div></details>` : ''}</section>`;
}
function footer(profile, base = '') {
  return `<footer class="site-footer"><span>© ${new Date().getFullYear()} ${e(profile.fullName)}</span><span>${e(profile.location)}</span><a href="${base}index.html#home">Back to top ↑</a></footer>`;
}
function documentHtml(data, content, { base = '', title, description, cover, kind = 'home' } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${e(description)}" />
  <meta name="theme-color" content="#F8F8F8" />
  <meta property="og:title" content="${e(title)}" />
  <meta property="og:description" content="${e(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${e(asset(cover, base))}" />
  <title>${e(title)}</title>
  <link rel="icon" type="image/svg+xml" href="${base}dist/img/logo-alif.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${base}dist/css/style.css" />
  <script src="${base}dist/js/collaboration.js" data-contact-email="${e(data.profile.email)}" data-contact-services="${e(JSON.stringify(data.services.map(service => service.title)))}" defer></script>
  <script src="${base}dist/js/main.js" defer></script>
</head>
<body data-page="${kind}">
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="site-frame">${content}${footer(data.profile, base)}</div>
  ${kind === 'home' ? '<figure class="floating-preview" data-floating-preview hidden aria-hidden="true"><img width="960" height="600" alt="" /></figure>' : ''}
</body>
</html>
`;
}
export function renderHome(data) {
  return documentHtml(data, `${header(data)}<main id="main">${hero(data)}${work(data)}${services(data)}${renderExperience(data)}${contact(data, '', true)}</main>`, { title: `${data.profile.fullName} — ${data.profile.role}`, description: data.profile.shortBio, cover: data.profile.portrait });
}
export function renderProject(data, project) {
  const base = '../../';
  const related = publishedProjects(data).filter(item => item.slug !== project.slug).slice(0, 2);
  const metadata = `<dl class="project-metadata">${project.role ? `<div><dt>Role</dt><dd>${e(project.role)}</dd></div>` : ''}<div><dt>Service</dt><dd>${project.services.map(e).join('<br />')}</dd></div>${project.timelineText ? `<div><dt>Timeline</dt><dd>${e(project.timelineText)}</dd></div>` : ''}${project.tools.length ? `<div><dt>Tools</dt><dd class="tags">${project.tools.map(tool => `<span>${e(tool)}</span>`).join('')}</dd></div>` : ''}</dl>`;
  const showcase = media => `<figure class="project-showcase reveal">${image(media, base)}${media.caption ? `<figcaption>${e(media.caption)}</figcaption>` : ''}</figure>`;
  const content = `<header class="detail-nav"><a class="button button-outline" href="../../index.html#work" data-back>← Back to work</a>${status(data.profile)}</header><main id="main"><section class="detail-header section" aria-labelledby="project-title"><div class="detail-info"><div class="tags reveal"><span>${e(project.category)}</span>${project.studioOrClient ? `<span>${e(project.studioOrClient)}</span>` : ''}</div><p class="small-label reveal">/${project.projectType === 'real' ? 'Real Project' : 'Exploration'}</p><h1 class="reveal" id="project-title" tabindex="-1">${e(project.title)}</h1><p class="detail-summary reveal">${e(project.summary)}</p><div class="detail-actions reveal">${project.liveUrl ? `<a class="button button-dark" href="${e(project.liveUrl)}" target="_blank" rel="noopener noreferrer">Live Preview ${arrow}</a>` : ''}<a class="button button-outline" href="${e(contactUrl(data.profile))}">Contact Me ${arrow}</a></div></div>${metadata}</section><div class="detail-content">${showcase(project.coverImage)}<div class="case-study">${project.sections.map(section => `<section class="case-section reveal"><h2>${e(section.heading)}</h2><div>${section.paragraphs.map(paragraph => `<p>${e(paragraph)}</p>`).join('')}${(section.images || []).map(showcase).join('')}</div></section>`).join('')}</div>${project.galleryImages.map(showcase).join('')}</div><section class="more-work section" id="work">${sectionHeading('More Work', 'More Work')}<div class="work-grid">${related.map(item => projectCard(item, base)).join('')}</div></section>${contact(data, base)}</main>`;
  return documentHtml(data, content, { base, title: `${project.title} — ${data.profile.fullName}`, description: project.summary, cover: project.coverImage, kind: 'project' });
}
