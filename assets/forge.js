(() => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  function write(term, line, cls = '') {
    const row = document.createElement('div');
    row.textContent = line;
    if (cls) row.className = cls;
    term.appendChild(row);
    term.scrollTop = term.scrollHeight;
  }
  function clear(term, first) { term.innerHTML = ''; if (first) write(term, first); }
  async function post(url, body = {}) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`${url} -> ${r.status}`);
    return r.json();
  }
  async function get(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url} -> ${r.status}`);
    return r.json();
  }
  function fillArtifact(el, token) {
    if (!el || !window.PRISM) return;
    el.innerHTML = PRISM.artifactCard(token);
  }
  async function animateTrace(term, payload) {
    const steps = payload.steps || payload.trace?.steps || [];
    for (const s of steps) {
      write(term, `[${s.phase}] ${s.label}`);
      await sleep(420);
    }
  }
  async function refreshSessions() {
    const el = $('sessions');
    if (!el) return;
    try {
      const data = await get('/api/forge/sessions');
      const sessions = data.sessions || [];
      el.innerHTML = sessions.length ? sessions.map(s => `<div class="card"><h3>${s.id}</h3><p>${s.createdAt}</p><p>${s.note}</p></div>`).join('') : '<p class="muted">No demo write sessions yet.</p>';
    } catch (e) {
      el.innerHTML = `<p class="muted">Sessions unavailable: ${e.message}</p>`;
    }
  }
  async function replayExistingForge() {
    const term = $('term');
    clear(term, '[replay] loading existing live proof run...');
    try {
      const payload = await post('/api/forge/replay', { source: 'zk-forge' });
      await animateTrace(term, payload);
      write(term, '[complete] Replay rendered from live artifacts.');
    } catch (e) { write(term, `[error] ${e.message}`); }
  }
  async function prepareLaunchTrace() {
    const term = $('trace');
    clear(term, '[prepare] building launch trace from current artifacts...');
    try {
      const payload = await post('/api/forge/prepare', { template: $('template')?.value, networks: $('networks')?.value });
      write(term, `[command] ${payload.commandPreview}`);
      await animateTrace(term, payload);
      write(term, '[safe] Live wallet execution is disabled for public visitors.');
    } catch (e) { write(term, `[error] ${e.message}`); }
  }
  async function writeForgeSession() {
    const term = $('trace');
    write(term, '[write] creating public demo forge session artifact...');
    try {
      const session = await post('/api/forge/session', { template: $('template')?.value, networks: $('networks')?.value, requestedSupply: $('supply')?.value });
      await animateTrace(term, session.trace);
      write(term, `[written] ${session.id}`);
      await refreshSessions();
    } catch (e) { write(term, `[error] ${e.message}`); }
  }
  window.prismReplayExistingForge = replayExistingForge;
  window.prismPrepareLaunchTrace = prepareLaunchTrace;
  window.prismWriteForgeSession = writeForgeSession;
  window.PrismForge = {
    async initReplay() {
      const term = $('term');
      clear(term, '[ready] PrismZK animated forge initialized.');
      const replay = $('replay');
      if (replay && !replay.dataset.bound) { replay.addEventListener('click', replayExistingForge); replay.dataset.bound = '1'; }
      try { fillArtifact($('artifact'), await get('/api/artifacts/token')); } catch {}
    },
    async initLaunch() {
      const term = $('trace');
      clear(term, '[idle] Waiting for operator action.');
      const prepare = $('prepare');
      if (prepare && !prepare.dataset.bound) { prepare.addEventListener('click', prepareLaunchTrace); prepare.dataset.bound = '1'; }
      const writeBtn = $('writeSession');
      if (writeBtn && !writeBtn.dataset.bound) { writeBtn.addEventListener('click', writeForgeSession); writeBtn.dataset.bound = '1'; }
      try { fillArtifact($('artifact'), await get('/api/artifacts/token')); } catch {}
      await refreshSessions();
    }
  };
})();
