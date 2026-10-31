(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.PortfolioInquiry = api;
    if (root.document) api.init(root.document, root.document.currentScript);
  }
})(globalThis, function () {
  'use strict';
  const defaultServices = Object.freeze(['Web Design & Development', 'UI/UX Design', 'Cross-Platform Development', 'Other']);
  const budgets = Object.freeze([
    { value: 'under-2m', label: '< Rp 2m', emailLabel: 'Under IDR 2,000,000' },
    { value: '2-5m', label: 'Rp 2–5m', emailLabel: 'IDR 2,000,000–5,000,000' },
    { value: '5-10m', label: 'Rp 5–10m', emailLabel: 'IDR 5,000,000–10,000,000' },
    { value: '10m-plus', label: 'Rp 10m+', emailLabel: 'IDR 10,000,000+' },
    { value: 'discuss', label: 'Let’s discuss', emailLabel: 'To be discussed' }
  ]);
  const timelines = Object.freeze([
    { value: 'under-2-weeks', label: 'Less than 2 weeks' },
    { value: '2-4-weeks', label: '2–4 weeks' },
    { value: '1-2-months', label: '1–2 months' },
    { value: 'flexible', label: 'Flexible / let’s discuss' }
  ]);
  const sources = Object.freeze(['Google', 'GitHub', 'Instagram', 'LinkedIn', 'Referral', 'Other']);
  const limits = Object.freeze({ name: 80, email: 160, company: 100, projectTitle: 120, details: 1200, preferredCall: 100 });
  const text = value => typeof value === 'string' ? value.trim() : '';
  const line = value => text(value).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
  const emailPattern = /^[^\s@<>?&#]+@[^\s@<>?&#]+\.[^\s@<>?&#]+$/;
  const isRecipient = value => emailPattern.test(value) && value.length <= 160 && !/[%:;,]/.test(value);
  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

  function servicesFor(config = {}) {
    const items = Array.isArray(config.services) ? config.services.filter(value => typeof value === 'string' && value.trim() && value.length <= 100).slice(0, 8).map(line) : defaultServices;
    return [...new Set([...items, 'Other'])];
  }
  function validateInquiry(input = {}, config = {}) {
    const allowed = servicesFor(config);
    const value = {
      services: Array.isArray(input.services) ? [...new Set(input.services.map(line))] : [],
      budget: text(input.budget), name: line(input.name), email: text(input.email), company: line(input.company),
      projectTitle: line(input.projectTitle), details: text(input.details).replace(/\r\n?/g, '\n'),
      timeline: text(input.timeline), preferredCall: line(input.preferredCall), source: text(input.source)
    };
    const errors = {};
    if (!value.services.length || value.services.some(service => !allowed.includes(service))) errors.services = 'Choose at least one of the available services.';
    if (!budgets.some(item => item.value === value.budget)) errors.budget = 'Choose a budget range, or select “Let’s discuss”.';
    if (!value.name) errors.name = 'Enter your name.';
    if (!emailPattern.test(value.email)) errors.email = 'Enter a valid reply email address.';
    if (!value.projectTitle) errors.projectTitle = 'Give your project a short title.';
    if (value.details.length < 30) errors.details = 'Please describe your project in at least 30 characters.';
    if (!timelines.some(item => item.value === value.timeline)) errors.timeline = 'Choose a timeline, or select the flexible option.';
    if (value.source && !sources.includes(value.source)) errors.source = 'Choose one of the listed sources.';
    for (const [field, maximum] of Object.entries(limits)) if (value[field].length > maximum) errors[field] = `Use no more than ${maximum} characters.`;
    return { value, errors, valid: Object.keys(errors).length === 0 };
  }
  function createDraft(input, config = {}) {
    const recipient = text(config.recipient);
    if (!isRecipient(recipient)) throw new Error('A valid collaboration recipient is required.');
    const result = validateInquiry(input, config);
    if (!result.valid) {
      const error = new Error('Please complete the collaboration form.'); error.fields = result.errors; throw error;
    }
    const value = result.value;
    const subject = `Project collaboration — ${value.projectTitle}`;
    const body = [
      'Hi Alif,', '', 'I’d like to discuss a collaboration on the following project.', '',
      'PROJECT BRIEF', `Project: ${value.projectTitle}`, `Services: ${value.services.join(', ')}`,
      `Budget range: ${budgets.find(item => item.value === value.budget).emailLabel}`,
      `Preferred timeline: ${timelines.find(item => item.value === value.timeline).label}`, '',
      'Project details:', value.details, '', 'CONTACT DETAILS', `Name: ${value.name}`, `Reply email: ${value.email}`,
      `Company / organization: ${value.company || 'Individual / not specified'}`,
      `Preferred time for a call: ${value.preferredCall || 'To be discussed'}`, '',
      `I found your portfolio through: ${value.source || 'Not specified'}`, '', 'Thank you,', value.name
    ].join('\n').replace(/\n/g, '\r\n');
    return { recipient, subject, body, url: `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
  }
  function dialogMarkup(config = {}) {
    const chip = (name, value, label, type = 'radio') => `<label class="inquiry-chip"><input type="${type}" name="${name}" value="${escape(value)}" aria-describedby="inquiry-error-${name}" /><span>${escape(label)}</span></label>`;
    const error = name => `<span class="inquiry-error" id="inquiry-error-${name}" data-inquiry-error="${name}"></span>`;
    const field = (name, label, extra = '', type = 'text') => `<label class="inquiry-field" data-inquiry-field="${name}"><span class="sr-only">${label}</span><input type="${type}" name="${name}" placeholder="${label}" maxlength="${limits[name]}" aria-describedby="inquiry-error-${name}" ${extra} />${error(name)}</label>`;
    return `<button class="inquiry-close" type="button" data-inquiry-close aria-label="Close collaboration form">×</button>
      <div class="inquiry-layout">
        <div class="inquiry-main">
          <header class="inquiry-heading"><h2 id="inquiry-title" tabindex="-1">Got an idea?<br />Let’s build it.</h2><p id="inquiry-description">Share a few details. I’ll help turn them into a clear starting point.</p></header>
          <form class="inquiry-form" method="dialog" novalidate>
            <fieldset data-inquiry-field="services"><legend>Service <span>*</span></legend><div class="inquiry-choices">${servicesFor(config).map(service => chip('services', service, service, 'checkbox')).join('')}</div>${error('services')}</fieldset>
            <fieldset data-inquiry-field="budget"><legend>Budget · IDR <span>*</span></legend><div class="inquiry-choices">${budgets.map(item => chip('budget', item.value, item.label)).join('')}</div>${error('budget')}</fieldset>
            <fieldset><legend>Information</legend><div class="inquiry-fields">
              ${field('name', 'Your name *', 'autocomplete="name" required')}${field('email', 'Email address *', 'autocomplete="email" required', 'email')}
              ${field('company', 'Company / organization (optional)', 'autocomplete="organization"')}${field('projectTitle', 'Project title *', 'required')}
              <label class="inquiry-field inquiry-field-wide" data-inquiry-field="details"><span class="sr-only">Project brief *</span><textarea name="details" rows="3" minlength="30" maxlength="${limits.details}" placeholder="What would you like to build? Tell me about the goal, key features, or problem you want to solve. *" required aria-describedby="inquiry-error-details"></textarea>${error('details')}</label>
            </div></fieldset>
            <fieldset><legend>Timeline</legend><div class="inquiry-fields">
              <label class="inquiry-field" data-inquiry-field="timeline"><span class="sr-only">Preferred timeline *</span><select name="timeline" required aria-describedby="inquiry-error-timeline"><option value="" disabled selected>Preferred timeline *</option>${timelines.map(item => `<option value="${item.value}">${escape(item.label)}</option>`).join('')}</select>${error('timeline')}</label>
              ${field('preferredCall', 'Preferred call time (optional)')}
            </div></fieldset>
            <fieldset data-inquiry-field="source"><legend>I found your portfolio through <span class="inquiry-optional">(optional)</span></legend><div class="inquiry-choices">${sources.map(source => chip('source', source, source)).join('')}</div>${error('source')}</fieldset>
            <div class="inquiry-submit-row"><button class="button button-dark inquiry-submit" type="submit">Open email app <span class="arrow" aria-hidden="true">↗</span></button><span class="inquiry-required">* Required fields</span></div>
            <p class="inquiry-disclosure">This prepares an email draft, not an automatic submission. Review it and press Send in your email app.</p>
            <p class="inquiry-status" role="status" aria-live="polite" data-inquiry-status></p>
          </form>
        </div>
        <aside class="inquiry-aside" aria-label="Collaboration summary">
          <div class="inquiry-aside-heading"><span class="small-label">A LITTLE CLARITY GOES A LONG WAY</span><h3>Your next project,<br />in a few details.</h3></div>
          <section class="inquiry-card"><h4>Your collaboration brief</h4><dl class="inquiry-summary"><div><dt>Service</dt><dd data-inquiry-summary="services">Choose your services</dd></div><div><dt>Budget</dt><dd data-inquiry-summary="budget">Let’s find the right scope</dd></div><div><dt>Timeline</dt><dd data-inquiry-summary="timeline">Choose a preferred timeline</dd></div></dl><p class="inquiry-card-note">Budget ranges help frame the conversation. They are not fixed quotes.</p></section>
          <section class="inquiry-card"><h4>What happens next?</h4><ol class="inquiry-next-steps"><li><span>01</span><p><strong>Tell me the essentials.</strong> Your goals, scope, and timeline shape the conversation.</p></li><li><span>02</span><p><strong>Open your email draft.</strong> The form formats your subject and message automatically.</p></li><li><span>03</span><p><strong>Review, then send.</strong> You stay in control of what is shared.</p></li></ol></section>
          <section class="inquiry-card inquiry-email-card"><h4>Send to</h4><a class="inquiry-recipient" data-inquiry-recipient data-inquiry-direct></a><p class="inquiry-card-note">Your details stay in this page until you open your email app. Nothing is saved to a server or browser storage.</p></section>
          <section class="inquiry-card inquiry-ready" data-inquiry-ready hidden><h4>Your formatted email</h4><p class="inquiry-card-note">To: <span data-inquiry-draft-recipient></span></p><p class="inquiry-email-subject" data-inquiry-subject></p><label class="sr-only" for="inquiry-email-preview">Formatted email message</label><textarea id="inquiry-email-preview" readonly rows="9" data-inquiry-preview></textarea><div class="inquiry-draft-actions"><a class="button button-dark" data-inquiry-launch>Open draft again ↗</a><button class="button button-outline" type="button" data-inquiry-copy>Copy email text</button></div><p class="inquiry-card-note">No email app configured? Copy the message into your preferred email service.</p></section>
        </aside>
      </div>`;
  }
  function init(doc, script) {
    const recipient = text(script?.dataset.contactEmail);
    if (!isRecipient(recipient) || doc.documentElement.hasAttribute('data-collaboration-ready')) return;
    doc.documentElement.setAttribute('data-collaboration-ready', '');
    let serviceList;
    try { serviceList = JSON.parse(script.dataset.contactServices || 'null'); } catch { serviceList = null; }
    const config = { recipient, services: serviceList || defaultServices };
    let dialog, form, opener, scrollState, lastDraft = null, draftDirty = false;
    function clearErrors() {
      for (const element of form.elements) {
        if (typeof element.setCustomValidity === 'function') element.setCustomValidity('');
        element.removeAttribute('aria-invalid');
      }
      form.querySelectorAll('[data-inquiry-error]').forEach(element => { element.textContent = ''; });
      form.querySelectorAll('[data-inquiry-field]').forEach(element => { element.classList.remove('has-error'); });
    }
    function readForm() {
      const data = new FormData(form);
      return Object.fromEntries(['budget', 'name', 'email', 'company', 'projectTitle', 'details', 'timeline', 'preferredCall', 'source'].map(name => [name, data.get(name) || '']).concat([['services', data.getAll('services')]]));
    }
    function updateSummary() {
      const value = readForm();
      dialog.querySelector('[data-inquiry-summary="services"]').textContent = value.services.join(', ') || 'Choose your services';
      dialog.querySelector('[data-inquiry-summary="budget"]').textContent = budgets.find(item => item.value === value.budget)?.label || 'Let’s find the right scope';
      dialog.querySelector('[data-inquiry-summary="timeline"]').textContent = timelines.find(item => item.value === value.timeline)?.label || 'Choose a preferred timeline';
    }
    function restorePage() {
      if (!scrollState || dialog?.open) return;
      doc.documentElement.style.overflow = scrollState.overflow; doc.body.style.paddingRight = scrollState.paddingRight;
      scrollState = null;
      opener?.isConnected && opener.focus({ preventScroll: true });
    }
    function close() { if (dialog?.open) dialog.close(); restorePage(); }
    function createDialog() {
      dialog = doc.createElement('dialog');
      if (typeof dialog.showModal !== 'function') { dialog = null; return false; }
      dialog.className = 'collaboration-dialog'; dialog.id = 'collaboration-dialog';
      dialog.setAttribute('aria-labelledby', 'inquiry-title'); dialog.setAttribute('aria-describedby', 'inquiry-description');
      dialog.innerHTML = dialogMarkup(config); doc.body.append(dialog);
      form = dialog.querySelector('form');
      const status = dialog.querySelector('[data-inquiry-status]');
      const launch = dialog.querySelector('[data-inquiry-launch]');
      const ready = dialog.querySelector('[data-inquiry-ready]');
      const preview = dialog.querySelector('[data-inquiry-preview]');
      const direct = dialog.querySelector('[data-inquiry-recipient]');
      direct.textContent = recipient; direct.href = `mailto:${recipient}`;
      dialog.querySelector('[data-inquiry-draft-recipient]').textContent = recipient;
      dialog.querySelector('[data-inquiry-close]').addEventListener('click', close);
      dialog.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const controls = [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')].filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
        const first = controls[0], last = controls[controls.length - 1], active = doc.activeElement;
        if (event.shiftKey && (active === first || active.id === 'inquiry-title')) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && active === last) { event.preventDefault(); first?.focus(); }
      });
      let backdropPressed = false;
      const outside = event => { const rect = dialog.getBoundingClientRect(); return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; };
      dialog.addEventListener('pointerdown', event => { backdropPressed = event.target === dialog && outside(event); });
      dialog.addEventListener('click', event => { if (backdropPressed && event.target === dialog && outside(event)) close(); backdropPressed = false; });
      dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
      dialog.addEventListener('close', restorePage);
      function formChanged() {
        clearErrors(); updateSummary();
        if (lastDraft) {
          lastDraft = null; draftDirty = true; ready.hidden = true; launch.removeAttribute('href'); preview.value = '';
        }
        status.textContent = draftDirty ? 'Your details changed. Submit again to update the email draft.' : '';
      }
      form.addEventListener('input', formChanged);
      form.addEventListener('change', formChanged);
      form.addEventListener('submit', event => {
        event.preventDefault(); clearErrors();
        const input = readForm(), result = validateInquiry(input, config);
        if (!result.valid) {
          for (const [name, message] of Object.entries(result.errors)) {
            const control = form.elements.namedItem(name);
            const first = control?.length !== undefined && !control.tagName ? control[0] : control;
            first?.setCustomValidity(message); first?.setAttribute('aria-invalid', 'true');
            form.querySelector(`[data-inquiry-field="${name}"]`)?.classList.add('has-error');
            form.querySelector(`[data-inquiry-error="${name}"]`).textContent = message;
          }
          status.textContent = 'Please check the highlighted fields before preparing your email.';
          form.reportValidity(); return;
        }
        if (!form.reportValidity()) return;
        lastDraft = createDraft(input, config); draftDirty = false;
        launch.href = lastDraft.url; preview.value = lastDraft.body;
        dialog.querySelector('[data-inquiry-subject]').textContent = lastDraft.subject;
        ready.hidden = false;
        dialog.querySelector('.inquiry-aside-heading').insertAdjacentElement('afterend', ready);
        ready.scrollIntoView({ block: 'start', behavior: 'instant' });
        status.textContent = 'Your email draft is ready. Review and send it in your email app. If it did not open, use “Open draft again” or copy the email text.';
        launch.click();
      });
      dialog.querySelector('[data-inquiry-copy]').addEventListener('click', async () => {
        if (!lastDraft) return;
        const copy = `To: ${lastDraft.recipient}\r\nSubject: ${lastDraft.subject}\r\n\r\n${lastDraft.body}`;
        try {
          if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
          await navigator.clipboard.writeText(copy);
          status.textContent = 'Email text copied. Paste it into your email app and send when ready.';
        } catch {
          preview.focus(); preview.select();
          status.textContent = 'Automatic copy is unavailable. Select and copy the message manually; the recipient and subject are shown above.';
        }
      });
      return true;
    }
    doc.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.('a[href^="mailto:"]');
      if (!link || link.closest('.collaboration-dialog')) return;
      let target;
      try { target = decodeURIComponent(new URL(link.href).pathname); } catch { return; }
      if (target.toLowerCase() !== recipient.toLowerCase()) return;
      if (!dialog && !createDialog()) return;
      event.preventDefault();
      if (dialog.open) return;
      opener = link;
      const gutter = Math.max(0, innerWidth - doc.documentElement.clientWidth);
      scrollState = { overflow: doc.documentElement.style.overflow, paddingRight: doc.body.style.paddingRight };
      const padding = parseFloat(getComputedStyle(doc.body).paddingRight) || 0;
      doc.body.style.paddingRight = `${padding + gutter}px`; doc.documentElement.style.overflow = 'hidden';
      dialog.showModal(); dialog.querySelector('.inquiry-layout').scrollTop = 0;
      dialog.querySelector('#inquiry-title').focus({ preventScroll: true });
    });
    addEventListener('pagehide', () => { if (dialog?.open) close(); });
  }
  return Object.freeze({ budgets, timelines, sources, limits, defaultServices, validateInquiry, createDraft, dialogMarkup, init });
});
