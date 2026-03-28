const socket = io();
let currentPage = 'dashboard';
let currentLeadPage = 1;
let currentModalLead = null;

// ===== NAVIGATION =====
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.page));
});

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');

  if (page === 'dashboard') loadDashboard();
  if (page === 'leads') loadLeads();
  if (page === 'outreach') loadOutreach();
  if (page === 'settings') loadSettings();
}

// ===== TOAST =====
function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${message}`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const res = await fetch('/api/stats');
    const stats = await res.json();

    document.getElementById('stat-total').textContent = stats.totalLeads;
    document.getElementById('stat-new').textContent = stats.newLeads;
    document.getElementById('stat-contacted').textContent = stats.contacted;
    document.getElementById('stat-replied').textContent = stats.replied;
    document.getElementById('stat-converted').textContent = stats.converted;
    document.getElementById('stat-emails').textContent = stats.emailsSent;
    document.getElementById('leads-count').textContent = stats.totalLeads;

    // Category chart (simple bars)
    const catEl = document.getElementById('chart-category');
    if (stats.byCategory.length > 0) {
      const maxCat = Math.max(...stats.byCategory.map(c => c.count));
      catEl.innerHTML = stats.byCategory.map(c => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="width:100px;font-size:13px;">${c.category}</span>
          <div style="flex:1;background:var(--bg);border-radius:4px;height:24px;overflow:hidden;">
            <div style="width:${(c.count/maxCat)*100}%;height:100%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:4px;display:flex;align-items:center;padding-left:8px;color:white;font-size:12px;font-weight:600;">${c.count}</div>
          </div>
        </div>
      `).join('');
    } else {
      catEl.innerHTML = '<p style="color:var(--text-light);font-size:14px;">No data yet</p>';
    }

    // City chart
    const cityEl = document.getElementById('chart-city');
    if (stats.byCity.length > 0) {
      const maxCity = Math.max(...stats.byCity.map(c => c.count));
      cityEl.innerHTML = stats.byCity.map(c => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="width:100px;font-size:13px;">${c.city}</span>
          <div style="flex:1;background:var(--bg);border-radius:4px;height:24px;overflow:hidden;">
            <div style="width:${(c.count/maxCity)*100}%;height:100%;background:linear-gradient(90deg,#3498db,#2ecc71);border-radius:4px;display:flex;align-items:center;padding-left:8px;color:white;font-size:12px;font-weight:600;">${c.count}</div>
          </div>
        </div>
      `).join('');
    } else {
      cityEl.innerHTML = '<p style="color:var(--text-light);font-size:14px;">No data yet</p>';
    }

    // Recent activity
    const logRes = await fetch('/api/sent-log');
    const log = await logRes.json();
    const actEl = document.getElementById('recent-activity');
    if (log.length > 0) {
      actEl.innerHTML = log.slice(0, 10).map(l => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
          <span style="font-size:20px;">${l.type === 'whatsapp' ? '💬' : '📧'}</span>
          <div>
            <div style="font-size:14px;font-weight:600;">${l.leadName}</div>
            <div style="font-size:12px;color:var(--text-light);">${l.type} — ${new Date(l.sentAt).toLocaleString()}</div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

// ===== SEARCH =====
async function initSearch() {
  // Load categories
  const catRes = await fetch('/api/categories');
  const categories = await catRes.json();
  const grid = document.getElementById('category-checkboxes');
  grid.innerHTML = categories.map(c => `
    <div class="checkbox-item" onclick="toggleCheck(this)" data-value="${c.key}">
      <input type="checkbox" value="${c.key}">
      <span class="check-box">✓</span>
      <span>${c.icon} ${c.label}</span>
    </div>
  `).join('');

  // Load regions
  const regRes = await fetch('/api/regions');
  const regions = await regRes.json();
  const sel = document.getElementById('region-select');
  regions.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.key;
    opt.textContent = `${r.label} (${r.cities.join(', ')})`;
    opt.dataset.cities = r.cities.join(', ');
    sel.appendChild(opt);
  });
}

function selectRegion(key) {
  const sel = document.getElementById('region-select');
  const opt = sel.querySelector(`option[value="${key}"]`);
  if (opt) {
    const current = document.getElementById('cities-input').value;
    const newCities = opt.dataset.cities;
    document.getElementById('cities-input').value = current ? `${current}, ${newCities}` : newCities;
  }
}

function toggleCheck(el) {
  el.classList.toggle('checked');
  el.querySelector('input').checked = el.classList.contains('checked');
}

function toggleAllCategories() {
  const items = document.querySelectorAll('#category-checkboxes .checkbox-item');
  const allChecked = Array.from(items).every(i => i.classList.contains('checked'));
  items.forEach(item => {
    if (allChecked) {
      item.classList.remove('checked');
      item.querySelector('input').checked = false;
    } else {
      item.classList.add('checked');
      item.querySelector('input').checked = true;
    }
  });
}

function startSearch() {
  const checkboxes = document.querySelectorAll('#category-checkboxes input:checked');
  const categories = Array.from(checkboxes).map(c => c.value);
  const citiesRaw = document.getElementById('cities-input').value;
  const cities = citiesRaw.split(',').map(c => c.trim()).filter(Boolean);
  const maxPerCombo = parseInt(document.getElementById('max-results').value) || 20;

  if (categories.length === 0) return toast('Select at least one category', 'error');
  if (cities.length === 0) return toast('Enter at least one city', 'error');

  socket.emit('start-search', { categories, cities, maxPerCombo });

  document.getElementById('btn-start-search').style.display = 'none';
  document.getElementById('btn-stop-search').style.display = 'inline-flex';
  document.getElementById('search-progress-panel').style.display = 'block';
  document.getElementById('search-live-results').innerHTML = '';
}

function stopSearch() {
  socket.emit('stop-search');
}

socket.on('search-started', () => toast('Search started!', 'info'));

socket.on('search-progress', (data) => {
  document.getElementById('search-progress-bar').style.width = `${data.percent}%`;
  document.getElementById('search-progress-text').textContent = `${data.message} (${data.found} found)`;
});

socket.on('search-lead', (lead) => {
  const el = document.getElementById('search-live-results');
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px 12px;border-bottom:1px solid var(--border);font-size:13px;';
  div.innerHTML = `
    <span class="score-badge ${lead.score >= 12 ? 'score-hot' : lead.score >= 8 ? 'score-warm' : 'score-cold'}">${lead.score}</span>
    <strong>${lead.name}</strong>
    <span style="color:var(--text-light);">${lead.city}</span>
    <span style="color:var(--text-light);">${lead.phone || 'No phone'}</span>
    <span class="rating">${lead.rating ? '⭐ ' + lead.rating : ''}</span>
  `;
  el.prepend(div);
});

socket.on('search-complete', (data) => {
  document.getElementById('btn-start-search').style.display = 'inline-flex';
  document.getElementById('btn-stop-search').style.display = 'none';
  document.getElementById('search-progress-bar').style.width = '100%';
  document.getElementById('search-progress-text').textContent = `Done! Total: ${data.total} leads (${data.newFound} new)`;
  toast(`Found ${data.newFound} new leads! Total: ${data.total}`, 'success');
  document.getElementById('leads-count').textContent = data.total;
});

socket.on('search-stopped', () => {
  document.getElementById('btn-start-search').style.display = 'inline-flex';
  document.getElementById('btn-stop-search').style.display = 'none';
  toast('Search stopped', 'info');
});

socket.on('search-error', (msg) => {
  document.getElementById('btn-start-search').style.display = 'inline-flex';
  document.getElementById('btn-stop-search').style.display = 'none';
  toast(msg, 'error');
});

// ===== LEADS =====
async function loadLeads() {
  const search = document.getElementById('filter-search')?.value || '';
  const category = document.getElementById('filter-category')?.value || '';
  const city = document.getElementById('filter-city')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';
  const sortBy = document.getElementById('filter-sort')?.value || 'score';

  const params = new URLSearchParams({ search, category, city, status, sortBy, page: currentLeadPage, limit: 50 });
  const res = await fetch(`/api/leads?${params}`);
  const data = await res.json();

  const tbody = document.getElementById('leads-table-body');

  if (data.leads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="icon">🔍</div><p>No leads found. Try a different filter or search for new leads!</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = data.leads.map(lead => `
    <tr>
      <td><span class="score-badge ${lead.score >= 12 ? 'score-hot' : lead.score >= 8 ? 'score-warm' : 'score-cold'}">${lead.score}</span></td>
      <td>
        <div style="font-weight:600;">${lead.name}</div>
        <div style="font-size:12px;color:var(--text-light);">${lead.address?.substring(0, 40) || ''}...</div>
        ${lead.website ? `<a href="${lead.website}" target="_blank" style="font-size:11px;">🌐 Website</a>` : '<span style="font-size:11px;color:var(--danger);">No website</span>'}
        ${lead.email ? `<span style="font-size:11px;color:var(--success);margin-left:8px;">📧 ${lead.email}</span>` : ''}
      </td>
      <td><span style="font-size:13px;">${lead.category}</span></td>
      <td>${lead.city}</td>
      <td>${lead.phone ? `<a href="tel:${lead.phone}" style="font-size:13px;">${lead.phone}</a>` : '<span style="color:var(--text-light);">—</span>'}</td>
      <td><span class="rating">${lead.rating ? '⭐ ' + lead.rating + ' (' + lead.ratingCount + ')' : '—'}</span></td>
      <td>
        <select onchange="updateStatus('${lead.id}', this.value)" style="padding:4px 8px;font-size:12px;width:auto;">
          <option value="new" ${lead.status==='new'?'selected':''}>New</option>
          <option value="contacted" ${lead.status==='contacted'?'selected':''}>Contacted</option>
          <option value="replied" ${lead.status==='replied'?'selected':''}>Replied</option>
          <option value="converted" ${lead.status==='converted'?'selected':''}>Converted</option>
          <option value="rejected" ${lead.status==='rejected'?'selected':''}>Rejected</option>
        </select>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn btn-accent btn-sm" onclick="openMessageModal('${lead.id}')" title="Message">💬</button>
          ${lead.phone ? `<a href="https://wa.me/${lead.phone.replace(/[\\s\\-\\(\\)\\+]/g, '')}" target="_blank" class="btn btn-sm" style="background:#25d366;color:white;text-decoration:none;" onclick="logWhatsApp('${lead.id}')" title="WhatsApp Direct">📱</a>` : ''}
          ${lead.googleMapsUrl ? `<a href="${lead.googleMapsUrl}" target="_blank" class="btn btn-outline btn-sm" style="text-decoration:none;" title="Google Maps">📍</a>` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteLead('${lead.id}')" title="Delete">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Pagination
  const pagEl = document.getElementById('leads-pagination');
  if (data.totalPages > 1) {
    let html = '';
    for (let i = 1; i <= data.totalPages; i++) {
      html += `<button class="btn ${i === data.page ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="currentLeadPage=${i};loadLeads();">${i}</button>`;
    }
    pagEl.innerHTML = html;
  } else {
    pagEl.innerHTML = '';
  }

  // Update filter dropdowns with available options
  updateFilterOptions(data);
}

function updateFilterOptions(data) {
  // This is called once to populate filter dropdowns from actual data
}

async function updateStatus(leadId, status) {
  socket.emit('update-lead-status', { leadId, status });
  toast(`Status updated to ${status}`, 'success');
}

function logWhatsApp(leadId) {
  socket.emit('whatsapp-opened', { leadId });
}

async function deleteLead(leadId) {
  if (!confirm('Delete this lead?')) return;
  await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
  loadLeads();
  toast('Lead deleted', 'info');
}

// ===== ANALYZE WEBSITES =====
function analyzeWebsites() {
  socket.emit('analyze-websites', {});
  document.getElementById('analyze-progress-panel').style.display = 'block';
  toast('Starting website analysis...', 'info');
}

socket.on('analyze-started', (data) => {
  document.getElementById('analyze-progress-text').textContent = `Analyzing ${data.total} websites...`;
});

socket.on('analyze-progress', (data) => {
  document.getElementById('analyze-progress-bar').style.width = `${data.percent}%`;
  document.getElementById('analyze-progress-text').textContent = data.message;
});

socket.on('analyze-complete', (data) => {
  document.getElementById('analyze-progress-panel').style.display = 'none';
  toast(`Analyzed ${data.analyzed} websites! Lead scores updated.`, 'success');
  loadLeads();
});

// ===== GENERATE LANDING PAGES =====
function generateAllLandingPages() {
  socket.emit('generate-landing-pages', {});
  toast('Generating landing pages...', 'info');
}

socket.on('landing-pages-complete', (data) => {
  toast(`Generated ${data.generated} landing pages!`, 'success');
});

// ===== MESSAGE MODAL =====
async function openMessageModal(leadId) {
  try {
    // Generate landing page first
    await fetch(`/api/landing-page/${leadId}`, { method: 'POST' });

    const res = await fetch(`/api/message-preview/${leadId}`);
    const preview = await res.json();

    const leadRes = await fetch(`/api/leads/${leadId}`);
    const lead = await leadRes.json();
    currentModalLead = lead;

    document.getElementById('modal-title').textContent = `Message — ${lead.name}`;
    document.getElementById('modal-wa-message').textContent = preview.whatsapp;
    document.getElementById('modal-wa-link').href = preview.waLink || '#';
    document.getElementById('modal-email-subject').value = preview.email.subject;
    document.getElementById('modal-email-body').innerHTML = preview.email.html;
    document.getElementById('modal-email-to').value = lead.email || '';
    document.getElementById('modal-landing-url').value = preview.landingPageUrl;
    document.getElementById('modal-landing-link').href = preview.landingPageUrl;
    document.getElementById('modal-landing-iframe').src = preview.landingPageUrl;

    document.getElementById('message-modal').classList.add('active');
    switchTab(document.querySelector('.tab[data-tab="whatsapp"]'), 'whatsapp');
  } catch (err) {
    toast('Error loading message preview: ' + err.message, 'error');
  }
}

function closeModal() {
  document.getElementById('message-modal').classList.remove('active');
  currentModalLead = null;
}

function switchTab(el, tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-whatsapp').style.display = tabName === 'whatsapp' ? 'block' : 'none';
  document.getElementById('tab-email').style.display = tabName === 'email' ? 'block' : 'none';
  document.getElementById('tab-landing').style.display = tabName === 'landing' ? 'block' : 'none';
}

function copyWaMessage() {
  const text = document.getElementById('modal-wa-message').textContent;
  navigator.clipboard.writeText(text);
  toast('WhatsApp message copied!', 'success');
}

function copyLandingUrl() {
  const url = document.getElementById('modal-landing-url').value;
  navigator.clipboard.writeText(url);
  toast('Landing page URL copied!', 'success');
}

async function sendEmailFromModal() {
  if (!currentModalLead) return;
  const email = document.getElementById('modal-email-to').value;
  if (!email) return toast('Enter recipient email', 'error');

  try {
    const res = await fetch(`/api/send-email/${currentModalLead.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.success) {
      toast('Email sent successfully!', 'success');
    } else {
      toast('Error: ' + (data.error || 'Failed to send'), 'error');
    }
  } catch (err) {
    toast('Error sending email: ' + err.message, 'error');
  }
}

// ===== OUTREACH PAGE =====
async function loadOutreach() {
  const statsRes = await fetch('/api/stats');
  const stats = await statsRes.json();
  document.getElementById('stat-wa-sent').textContent = stats.messagesSent;
  document.getElementById('stat-em-sent').textContent = stats.emailsSent;

  const leadsRes = await fetch('/api/leads?limit=1000');
  const leadsData = await leadsRes.json();
  document.getElementById('stat-lp-count').textContent = leadsData.leads.filter(l => l.landingPageUrl).length;

  const logRes = await fetch('/api/sent-log');
  const log = await logRes.json();
  const tbody = document.getElementById('sent-log-body');
  if (log.length > 0) {
    tbody.innerHTML = log.map(l => `
      <tr>
        <td><strong>${l.leadName}</strong></td>
        <td>${l.type === 'whatsapp' ? '💬 WhatsApp' : '📧 Email'}${l.to ? ' → ' + l.to : ''}</td>
        <td>${new Date(l.sentAt).toLocaleString()}</td>
      </tr>
    `).join('');
  }
}

// ===== SETTINGS =====
async function loadSettings() {
  const res = await fetch('/api/config');
  const config = await res.json();
  document.getElementById('cfg-google-key').value = config.googleApiKey || '';
  document.getElementById('cfg-email-user').value = config.emailUser || '';
  document.getElementById('cfg-email-pass').value = config.emailPass || '';
  document.getElementById('cfg-email-name').value = config.emailFromName || '';
}

async function saveSettings() {
  const data = {
    googleApiKey: document.getElementById('cfg-google-key').value,
    emailUser: document.getElementById('cfg-email-user').value,
    emailPass: document.getElementById('cfg-email-pass').value,
    emailFromName: document.getElementById('cfg-email-name').value
  };
  await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  toast('Settings saved!', 'success');
}

// ===== SOCKET EVENTS =====
socket.on('lead-updated', (lead) => {
  if (currentPage === 'leads') loadLeads();
});

// Close modal on click outside
document.getElementById('message-modal').addEventListener('click', (e) => {
  if (e.target.id === 'message-modal') closeModal();
});

// Keyboard shortcut: ESC to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ===== INIT =====
(async function init() {
  await initSearch();
  loadDashboard();
})();
