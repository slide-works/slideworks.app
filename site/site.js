// SlideWorks landing page. Plain script, no build step.
// One sample deck (the <template id="deck">) is cloned into every slide frame on the page.
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------------------------------------------------------------- theme */
  $('#themeBtn').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('sw-theme', root.dataset.theme); } catch {}
  });

  /* ---------------------------------------------------------------- the deck */
  const PARTS = ['The cost', 'Slice it', 'Ship it', 'Make it stick'];
  const DECK = 'Ship smaller';
  const slides = [...$('#deck').content.children].filter(el => el.classList.contains('sw'));
  const N = slides.length;
  // Chrome from the default template: part tracker, footer and progress bar.
  slides.forEach((s, i) => {
    if (!s.classList.contains('dark')) {
      const part = +s.dataset.part;
      const nav = document.createElement('div');
      nav.className = 'snav';
      nav.innerHTML = PARTS.map((p, k) => `<span class="${k < part ? 'past' : k === part ? 'on' : ''}">${p}</span>`).join('');
      s.prepend(nav);
      const foot = document.createElement('div');
      foot.className = 'sfoot';
      foot.innerHTML = `<span><b>${i + 1}</b> / ${N} · ${DECK} · Sam Rivera</span>`;
      s.append(foot);
    }
    const prog = document.createElement('div');
    prog.className = 'sprog';
    prog.style.width = ((i + 1) / N * 100) + '%';
    s.append(prog);
  });
  const byLayout = name => slides.findIndex(s => s.dataset.layout === name);
  const stepsOf = i => slides[i].querySelectorAll('.f').length;

  // Keep every frame's 1920x1080 slide scaled to the frame's width.
  const ro = new ResizeObserver(entries => {
    for (const e of entries) e.target.style.setProperty('--s', e.contentRect.width / 1920);
  });
  function mount(frame, i, step) {
    const s = slides[i].cloneNode(true);
    if (step !== undefined) s.querySelectorAll('.f').forEach((f, k) => f.classList.toggle('on', k < step));
    frame.replaceChildren(s);
    if (!frame.dataset.ro) { ro.observe(frame); frame.dataset.ro = '1'; }
  }
  function newFrame(i) {
    const f = document.createElement('div');
    f.className = 'frame';
    mount(f, i);
    return f;
  }

  /* ---------------------------------------------------------------- hero player */
  {
    const stage = $('#heroStage');
    const player = $('#heroPlayer');
    const frames = $$('[data-player-frame]', stage);
    const autoBtn = $('[data-p="auto"]', stage);
    let idx = 0, step = 0, paused = reduced, visible = true, timer = 0;

    function render() {
      frames.forEach(f => mount(f, idx, step));
      $$('[data-count]', stage).forEach(c => c.textContent = `${idx + 1} / ${N}`);
      $$('[data-bar]', stage).forEach(b => b.style.width = ((idx + 1) / N * 100) + '%');
      $$('[data-hash]', stage).forEach(h => h.textContent = '#' + (idx + 1) + (step ? '.' + step : ''));
      const n = stepsOf(idx);
      $('[data-steps]', stage).innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k < step ? 'on' : ''}"></i>`).join('');
    }
    function next() { if (step < stepsOf(idx)) step++; else { idx = (idx + 1) % N; step = 0; } render(); }
    function prev() { if (step > 0) step--; else if (idx > 0) { idx--; step = stepsOf(idx); } render(); }
    function schedule() {
      clearTimeout(timer);
      if (paused || !visible || document.hidden) return;
      const isStep = step < stepsOf(idx);
      timer = setTimeout(() => { next(); schedule(); }, isStep ? 1100 : 3400);
    }
    function setPaused(p) {
      paused = p;
      autoBtn.classList.toggle('paused', p);
      autoBtn.setAttribute('aria-label', p ? 'Play the deck automatically' : 'Pause the autoplay');
      schedule();
    }
    function user(fn) { fn(); setPaused(true); }
    $$('[data-p]', stage).forEach(b => b.addEventListener('click', () => {
      if (b.dataset.p === 'next') user(next);
      else if (b.dataset.p === 'prev') user(prev);
      else setPaused(!paused);
    }));
    frames[0].addEventListener('click', () => user(next));
    player.addEventListener('keydown', e => {
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); user(next); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); user(prev); }
      else if (e.key === 'Home') { e.preventDefault(); user(() => { idx = 0; step = 0; render(); }); }
      else if (e.key === 'End') { e.preventDefault(); user(() => { idx = N - 1; step = 0; render(); }); }
    });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: .25 }).observe(player);
    document.addEventListener('visibilitychange', schedule);
    render();
    setPaused(paused);
  }

  /* ---------------------------------------------------------------- mounts by layout */
  $$('[data-slide]').forEach(f => mount(f, byLayout(f.dataset.slide)));
  $$('[data-mini]').forEach(f => mount(f, +f.dataset.mini));

  /* ---------------------------------------------------------------- gallery + lightbox */
  {
    const gallery = $('#gallery');
    const dlg = $('#lightbox');
    const lbFrame = $('#lbFrame');
    const lbCap = $('#lbCap');
    let cur = 0;
    const slotsHtml = s => s.dataset.slots.split(' · ').map(x => `<span class="slot">${x}</span>`).join('');
    slides.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'g-item rv';
      b.setAttribute('aria-label', `Slide ${i + 1}, the ${s.dataset.layout} layout. Open it larger.`);
      b.append(newFrame(i));
      const m = document.createElement('div');
      m.className = 'g-meta';
      m.innerHTML = `<span class="no">${String(i + 1).padStart(2, '0')}</span><code class="layout">${s.dataset.layout}</code>` + slotsHtml(s);
      b.append(m);
      b.addEventListener('click', () => open(i));
      gallery.append(b);
    });
    function show(i) {
      cur = (i + N) % N;
      mount(lbFrame, cur);
      const s = slides[cur];
      lbCap.innerHTML = `<code class="layout">${s.dataset.layout}</code>${slotsHtml(s)}<span class="notes">Notes: ${s.dataset.notes}</span>`;
    }
    function open(i) { show(i); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    $$('[data-lb]', dlg).forEach(b => b.addEventListener('click', () => {
      if (b.dataset.lb === 'close') dlg.close(); else show(cur + (b.dataset.lb === 'next' ? 1 : -1));
    }));
    dlg.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'ArrowLeft') show(cur - 1);
    });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }

  /* ---------------------------------------------------------------- palettes */
  {
    const stage = $('#palStage');
    $$('input[name="pal"]').forEach(r => r.addEventListener('change', () => { if (r.checked) stage.dataset.pal = r.value; }));
  }

  /* ---------------------------------------------------------------- the agent's session */
  {
    const out = $('#termOut');
    const thumbs = $('#dpThumbs');
    const feed = $('#dpFeed');
    const dpFrame = $('#dpFrame');
    const empty = dpFrame.innerHTML;
    const title = $('#dpTitle'), count = $('#dpCount'), share = $('#dpShare'), reject = $('#dpReject');
    const L = {
      c: t => ({ t: `<span class="c">${t}</span>` }),
      call: (t, then) => ({ type: true, t: `<span class="call">→ ${t}</span>`, then }),
      ok: (t, then) => ({ t: `<span class="ok">← ${t}</span>`, then }),
      err: (t, then) => ({ t: `<span class="err">✗ ${t}</span>`, then }),
    };
    const s = str => `<span class="s">${str}</span>`;
    let added = 0;
    const add = (i, who = 'added slide ' + (i + 1)) => () => {
      added++;
      count.textContent = added + (added === 1 ? ' slide' : ' slides');
      mount(dpFrame, i);
      const slot = thumbs.children[i];
      slot.replaceChildren(newFrame(i));
      log(`<b>Claude</b> via MCP · ${who}`);
    };
    function log(html) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="ag">AI</span><span>${html}</span>`;
      feed.prepend(li);
      while (feed.children.length > 3) feed.lastChild.remove();
    }
    const SCRIPT = [
      L.c(`# brief: "20-minute offsite talk on shipping smaller, in four parts"`),
      L.call('list_layouts()'),
      L.ok('17 layouts: title, divider, bullets, big-number, gantt, quote, practice, compare, two-column, table, chart … (each with its slot schema)'),
      L.call(`create_deck({ title: ${s('"Ship smaller"')}, template: ${s('"talk"')}, palette: ${s('"cobalt"')},\n    parts: [${s('"The cost"')}, ${s('"Slice it"')}, ${s('"Ship it"')}, ${s('"Make it stick"')}] })`),
      L.ok('deck 7Kq2 · private · /d/7Kq2/ship-smaller', () => { title.textContent = DECK; count.textContent = '0 slides'; log('<b>Claude</b> via MCP · created the deck'); }),
      L.call(`add_slide({ layout: ${s('"title"')}, title: ${s('"Ship smaller"')}, stamp: ${s('"draft"')}, … })`),
      L.ok('slide 1', add(0)),
      L.call(`add_slide({ layout: ${s('"bullets"')}, part: 1, reveal: ${s('"one-by-one"')}, items: [ … ] })`),
      L.ok('slide 3 · steps 4', add(2)),
      L.call(`add_slide({ layout: ${s('"compare"')}, part: 2,\n    left: { tag: ${s('"Failure mode"')}, title: ${s('"Slice by layer"')}, items: [ … ] } })`),
      L.err('rejected: compare.right is required { tag, title, items[] }', () => { reject.hidden = false; }),
      L.call(`add_slide({ layout: ${s('"compare"')}, part: 2, left: { … },\n    right: { tag: ${s('"Success mode"')}, title: ${s('"Slice by customer action"')}, items: [ … ] } })`),
      L.ok('slide 9', () => { reject.hidden = true; add(8)(); }),
      L.call(`add_slide({ layout: ${s('"chart"')}, part: 3, chart: { type: ${s('"bar"')}, unit: ${s('"wk"')}, series: [ … ] } })`),
      L.ok('slide 12', add(11)),
      L.c('# … 12 more slides, then speaker notes for all 16'),
      { t: '<span class="ok">← slides 2, 4–8, 10, 11, 13–16 · notes set</span>', then: fillRest },
      L.call(`set_sharing({ deck: ${s('"7Kq2"')}, level: ${s('"link"')} })`),
      L.ok('sharing: link · logged to activity', () => { share.hidden = false; log('<b>Claude</b> via MCP · shared with anyone with the link'); }),
      L.call(`get_deck_url({ deck: ${s('"7Kq2"')}, slide: 1 })`),
      L.ok('https://slides.example.com/d/7Kq2/ship-smaller#1', () => mount(dpFrame, 0)),
    ];
    async function fillRest() {
      for (let i = 0; i < N; i++) {
        if (thumbs.children[i].firstChild) continue;
        added++;
        thumbs.children[i].replaceChildren(newFrame(i));
        mount(dpFrame, i);
        if (!fast) await sleep(110);
      }
      count.textContent = N + ' slides';
      log('<b>Claude</b> via MCP · added 12 slides and notes');
    }
    let run = 0, fast = false;
    function reset() {
      out.innerHTML = '';
      thumbs.innerHTML = Array.from({ length: N }, () => '<div class="slot"></div>').join('');
      feed.innerHTML = '';
      dpFrame.innerHTML = empty;
      title.textContent = 'Waiting for the agent…';
      count.textContent = '0 slides';
      share.hidden = true; reject.hidden = true; added = 0;
    }
    async function play(instant) {
      const me = ++run;
      fast = instant;
      reset();
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      for (const line of SCRIPT) {
        if (me !== run) return;
        const ln = document.createElement('span');
        ln.className = 'ln';
        out.append(ln);
        if (line.type && !instant) {
          // type the call out, keeping the markup intact
          const tmp = document.createElement('span');
          tmp.innerHTML = line.t;
          const text = tmp.textContent;
          ln.textContent = '';
          ln.append(cursor);
          for (let k = 0; k <= text.length; k += 3) {
            if (me !== run) return;
            ln.textContent = text.slice(0, k);
            ln.append(cursor);
            out.scrollTop = out.scrollHeight;
            await sleep(12);
          }
          ln.innerHTML = line.t;
          await sleep(380);
        } else {
          ln.innerHTML = line.t;
        }
        ln.append('\n');
        if (line.then) await line.then();
        out.scrollTop = out.scrollHeight;
        if (!instant) await sleep(line.t.includes('class="c"') ? 500 : 700);
      }
      if (!instant) out.append(cursor);
    }
    reset();
    if (reduced) play(true);
    else {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); play(false); } }, { threshold: .35 });
      io.observe($('#session'));
    }
    $('#termReplay').addEventListener('click', () => play(reduced));
  }

  /* ---------------------------------------------------------------- presenter + phone remote */
  {
    const pr = $('#presenter');
    const sec = $('#present');
    let idx = byLayout('practice'), black = false;
    const fmt = t => String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
    function notesHtml(i) {
      const n = slides[i].dataset.notes || '';
      const cut = n.indexOf('. ');
      return cut > 0 ? `<b>${n.slice(0, cut + 1)}</b>${n.slice(cut + 1)}` : `<b>${n}</b>`;
    }
    function partOf(i) {
      const s = slides[i];
      if (s.dataset.part !== undefined) return PARTS[+s.dataset.part];
      for (let k = i + 1; k < N; k++) if (slides[k].dataset.part !== undefined) return PARTS[+slides[k].dataset.part];
      return PARTS[PARTS.length - 1];
    }
    function render() {
      $$('[data-pr-now]', sec).forEach(f => mount(f, idx));
      $$('[data-pr-next]', sec).forEach(f => idx < N - 1 ? mount(f, idx + 1) : f.replaceChildren());
      $$('[data-pr-notes]', sec).forEach(n => n.innerHTML = notesHtml(idx));
      $('[data-pr-count]', sec).textContent = `${idx + 1} / ${N}`;
      $('[data-pr-next-no]', sec).textContent = idx < N - 1 ? `slide ${idx + 2}` : 'end of deck';
      $('[data-pr-part]', sec).textContent = partOf(idx);
      $('[data-pr-bar]', sec).style.width = ((idx + 1) / N * 100) + '%';
      $('[data-pr-black]', sec).hidden = !black;
      const bb = $('[data-pr="black"]', sec);
      bb.setAttribute('aria-pressed', black);
    }
    const go = d => { idx = Math.max(0, Math.min(N - 1, idx + d)); render(); };
    const toggleBlack = () => { black = !black; render(); };
    $$('[data-pr]', sec).forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.pr;
      if (a === 'next') go(1); else if (a === 'prev') go(-1); else if (a === 'black') toggleBlack();
    }));
    pr.addEventListener('keydown', e => {
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(1); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
      else if (e.key === 'b' || e.key === 'B') toggleBlack();
    });
    render();
    // The talk clock: 12:42 in, of a 30-minute slot. Runs while the section is on screen.
    let elapsed = 12 * 60 + 42, tick = 0;
    const clock = $('[data-pr-clock]', sec), left = $('[data-pr-left]', sec);
    function drawClock() {
      clock.textContent = fmt(elapsed);
      const l = Math.max(0, 30 * 60 - elapsed);
      left.textContent = fmt(l);
      clock.parentElement.parentElement.classList.toggle('amber', l <= 300);
    }
    drawClock();
    if (!reduced) new IntersectionObserver(([e]) => {
      clearInterval(tick);
      if (e.isIntersecting) tick = setInterval(() => { elapsed++; drawClock(); }, 1000);
    }).observe(pr);
  }

  /* ---------------------------------------------------------------- audience: QR + poll */
  {
    // A QR-like pattern (decorative): three finder squares and seeded modules.
    const n = 25;
    let seed = 482913;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    let cells = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inFinder(x, y) && rnd() > .52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    $$('[data-qr]').forEach(q => q.innerHTML = `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-hidden="true"><g fill="#0b1020">${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}${cells}</g></svg>`);

    const opts = $('#pollOpts');
    $$('button', opts).forEach(b => {
      b.innerHTML = `<span>${b.textContent}</span><span class="pc"></span>`;
      b.addEventListener('click', () => {
        if (opts.classList.contains('voted')) return;
        opts.classList.add('voted');
        b.classList.add('mine');
        $$('button', opts).forEach(o => {
          const v = +o.dataset.v + (o === b ? 1 : 0);
          o.style.setProperty('--w', v + '%');
          $('.pc', o).textContent = v + '%';
        });
      });
    });
  }

  /* ---------------------------------------------------------------- copy buttons */
  $$('[data-copy], [data-copy-from]').forEach(b => b.addEventListener('click', async () => {
    const text = b.dataset.copy || $('#' + b.dataset.copyFrom).textContent.replace(/^#.*\n/m, '');
    try {
      await navigator.clipboard.writeText(text.trim());
      b.classList.add('done');
      const was = b.firstChild && b.firstChild.nodeType === 3 ? b.textContent : null;
      if (was) b.textContent = 'Copied';
      setTimeout(() => { b.classList.remove('done'); if (was) b.textContent = was; }, 1400);
    } catch {}
  }));

  /* ---------------------------------------------------------------- reveal on scroll */
  {
    const els = $$('.sec-head, .steps3, .session, .pal-picker, .pal-stage, .templates, .app, .feature-row, .present-wrap, .journey4, .roadmap, .start-grid, .pillars .cards');
    els.forEach(el => el.classList.add('rv'));
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('.rv').forEach(el => io.observe(el));
  }
})();
