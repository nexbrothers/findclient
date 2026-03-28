require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const PlacesWorker = require('./workers/places-worker');
const WebsiteAnalyzer = require('./workers/website-analyzer');
const { getMessagePreview, formatPhone, generateEmailMessage, generateWhatsAppMessage } = require('./lib/message-generator');
const { generateLandingPage } = require('./lib/landing-page-generator');
const { getAllCategories, getAllRegions, BUSINESS_PROFILES } = require('./lib/business-profiles');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.RENDER_EXTERNAL_URL || process.env.BASE_URL || `http://localhost:${PORT}`;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== Data Helpers =====
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'landing-pages'), { recursive: true });

function readJSON(file, defaultVal = []) {
  const filePath = path.join(DATA_DIR, file);
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) { console.error(`Error reading ${file}:`, e.message); }
  return defaultVal;
}

function writeJSON(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), 'utf-8');
}

function getLeads() { return readJSON('leads.json', []); }
function saveLeads(leads) { writeJSON('leads.json', leads); }
function getSentLog() { return readJSON('sent_log.json', []); }
function saveSentLog(log) { writeJSON('sent_log.json', log); }
function getConfig() {
  return readJSON('config.json', {
    emailUser: process.env.EMAIL_USER || '',
    emailPass: process.env.EMAIL_PASS || '',
    emailFromName: process.env.EMAIL_FROM_NAME || 'NexBrothers',
    googleApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
    hunterApiKey: process.env.HUNTER_API_KEY || '',
    defaultMaxResults: 20,
    whatsappDelay: 15
  });
}
function saveConfig(config) { writeJSON('config.json', config); }

// ===== Workers =====
let placesWorker = null;
let websiteAnalyzer = null;

// ===== API Routes =====

// Stats
app.get('/api/stats', (req, res) => {
  const leads = getLeads();
  const log = getSentLog();
  res.json({
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    replied: leads.filter(l => l.status === 'replied').length,
    converted: leads.filter(l => l.status === 'converted').length,
    messagesSent: log.filter(l => l.type === 'whatsapp').length,
    emailsSent: log.filter(l => l.type === 'email').length,
    byCategory: Object.entries(
      leads.reduce((acc, l) => { acc[l.category] = (acc[l.category] || 0) + 1; return acc; }, {})
    ).map(([k, v]) => ({ category: k, count: v })),
    byCity: Object.entries(
      leads.reduce((acc, l) => { acc[l.city] = (acc[l.city] || 0) + 1; return acc; }, {})
    ).map(([k, v]) => ({ city: k, count: v })),
    byStatus: Object.entries(
      leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {})
    ).map(([k, v]) => ({ status: k, count: v }))
  });
});

// Leads CRUD
app.get('/api/leads', (req, res) => {
  let leads = getLeads();
  const { category, city, status, search, sortBy, page = 1, limit = 50,
          hasWebsite, hasPhone, hasEmail, messageSent, emailSent } = req.query;

  if (category) leads = leads.filter(l => l.category === category);
  if (city) leads = leads.filter(l => l.city.toLowerCase().includes(city.toLowerCase()));
  if (status) leads = leads.filter(l => l.status === status);
  if (search) leads = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.address || '').toLowerCase().includes(search.toLowerCase())
  );

  // Advanced filters
  if (hasWebsite === 'yes') leads = leads.filter(l => l.website);
  if (hasWebsite === 'no') leads = leads.filter(l => !l.website);
  if (hasPhone === 'yes') leads = leads.filter(l => l.phone);
  if (hasPhone === 'no') leads = leads.filter(l => !l.phone);
  if (hasEmail === 'yes') leads = leads.filter(l => l.email);
  if (hasEmail === 'no') leads = leads.filter(l => !l.email);
  if (messageSent === 'yes') leads = leads.filter(l => l.messageSent);
  if (messageSent === 'no') leads = leads.filter(l => !l.messageSent);
  if (emailSent === 'yes') leads = leads.filter(l => l.emailSent);
  if (emailSent === 'no') leads = leads.filter(l => !l.emailSent);

  // Sort
  if (sortBy === 'score') leads.sort((a, b) => b.score - a.score);
  else if (sortBy === 'rating') leads.sort((a, b) => b.rating - a.rating);
  else if (sortBy === 'name') leads.sort((a, b) => a.name.localeCompare(b.name));
  else leads.sort((a, b) => b.score - a.score); // default: by score

  const total = leads.length;
  const start = (page - 1) * limit;
  const paginated = leads.slice(start, start + parseInt(limit));

  res.json({ leads: paginated, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

app.get('/api/leads/:id', (req, res) => {
  const leads = getLeads();
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

app.put('/api/leads/:id', (req, res) => {
  const leads = getLeads();
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
  leads[idx] = { ...leads[idx], ...req.body };
  saveLeads(leads);
  res.json(leads[idx]);
});

app.delete('/api/leads/:id', (req, res) => {
  let leads = getLeads();
  leads = leads.filter(l => l.id !== req.params.id);
  saveLeads(leads);
  res.json({ success: true });
});

app.delete('/api/leads', (req, res) => {
  saveLeads([]);
  res.json({ success: true });
});

// Categories & Regions
app.get('/api/categories', (req, res) => res.json(getAllCategories()));
app.get('/api/regions', (req, res) => res.json(getAllRegions()));

// Message Preview
app.get('/api/message-preview/:id', (req, res) => {
  const leads = getLeads();
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const preview = getMessagePreview(lead, BASE_URL);
  res.json(preview);
});

// Generate Landing Page
app.post('/api/landing-page/:id', (req, res) => {
  const leads = getLeads();
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const url = generateLandingPage(lead, BASE_URL);

  // Update lead with landing page URL
  const idx = leads.findIndex(l => l.id === req.params.id);
  leads[idx].landingPageUrl = url;
  saveLeads(leads);

  res.json({ url });
});

// Serve Landing Pages
app.get('/landing/:id', (req, res) => {
  const filePath = path.join(DATA_DIR, 'landing-pages', `${req.params.id}.html`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Try to generate it
    const leads = getLeads();
    const lead = leads.find(l => l.id === req.params.id);
    if (!lead) return res.status(404).send('Page not found');
    generateLandingPage(lead, BASE_URL);
    res.sendFile(filePath);
  }
});

// Send Email
app.post('/api/send-email/:id', async (req, res) => {
  const config = getConfig();
  const leads = getLeads();
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const targetEmail = lead.email || req.body.email;
  if (!targetEmail) return res.status(400).json({ error: 'No email address' });

  try {
    // Generate landing page first
    const landingUrl = generateLandingPage(lead, BASE_URL);
    const emailData = generateEmailMessage(lead);
    emailData.html = emailData.html.replace(/{landingPageUrl}/g, landingUrl);
    emailData.text = emailData.text.replace(/{landingPageUrl}/g, landingUrl);

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: config.emailUser, pass: config.emailPass }
    });

    await transporter.sendMail({
      from: `"${config.emailFromName}" <${config.emailUser}>`,
      to: targetEmail,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html
    });

    // Update lead
    const idx = leads.findIndex(l => l.id === req.params.id);
    leads[idx].emailSent = true;
    leads[idx].status = leads[idx].status === 'new' ? 'contacted' : leads[idx].status;
    saveLeads(leads);

    // Log
    const log = getSentLog();
    log.push({ leadId: lead.id, leadName: lead.name, type: 'email', to: targetEmail, sentAt: new Date().toISOString() });
    saveSentLog(log);

    res.json({ success: true, message: 'Email sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Email Send
app.post('/api/bulk-email', async (req, res) => {
  const config = getConfig();
  const { leadIds, serviceType } = req.body;

  if (!config.emailUser || !config.emailPass) {
    return res.status(400).json({ error: 'Email not configured. Go to Settings.' });
  }

  const leads = getLeads();
  const targets = leadIds ? leads.filter(l => leadIds.includes(l.id)) : [];

  if (targets.length === 0) {
    return res.status(400).json({ error: 'No leads selected' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: config.emailUser, pass: config.emailPass }
  });

  let sent = 0;
  let failed = 0;
  const log = getSentLog();

  for (const lead of targets) {
    const targetEmail = lead.email || req.body.fallbackEmail;
    if (!targetEmail) { failed++; continue; }

    try {
      const landingUrl = generateLandingPage(lead, BASE_URL);
      let emailData;

      if (serviceType === 'website') {
        emailData = generateWebsiteDevEmail(lead);
      } else {
        emailData = generateEmailMessage(lead);
      }
      emailData.html = emailData.html.replace(/{landingPageUrl}/g, landingUrl);
      emailData.text = emailData.text.replace(/{landingPageUrl}/g, landingUrl);

      await transporter.sendMail({
        from: `"${config.emailFromName}" <${config.emailUser}>`,
        to: targetEmail,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html
      });

      // Update lead
      const idx = leads.findIndex(l => l.id === lead.id);
      if (idx !== -1) {
        leads[idx].emailSent = true;
        leads[idx].status = leads[idx].status === 'new' ? 'contacted' : leads[idx].status;
      }

      log.push({ leadId: lead.id, leadName: lead.name, type: 'email', to: targetEmail, serviceType: serviceType || 'whatsapp', sentAt: new Date().toISOString() });
      sent++;

      // Delay between emails to avoid spam detection
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`Bulk email error for ${lead.name}:`, err.message);
      failed++;
    }
  }

  saveLeads(leads);
  saveSentLog(log);
  res.json({ success: true, sent, failed, total: targets.length });
});

// Generate website development email
function generateWebsiteDevEmail(lead) {
  const subject = `${lead.name} — you need a website`;
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <p>Hi,</p>

  <p>I came across <strong>${lead.name}</strong> on Google and noticed you don't have a website yet.</p>

  <p>In 2026, <strong>70% of customers search online before visiting a business</strong>. Without a website, you're invisible to a huge chunk of potential customers.</p>

  <p>Here's what I can build for <strong>${lead.name}</strong>:</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 8px; font-weight: bold; color: #2563eb;">🌐 Professional Website</td>
      <td style="padding: 12px 8px;">Mobile-friendly, fast-loading website that showcases your business</td>
    </tr>
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 8px; font-weight: bold; color: #2563eb;">📱 Google My Business</td>
      <td style="padding: 12px 8px;">Optimize your Google listing to appear higher in local searches</td>
    </tr>
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 8px; font-weight: bold; color: #2563eb;">💬 WhatsApp Integration</td>
      <td style="padding: 12px 8px;">Let customers contact you instantly from your website</td>
    </tr>
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 8px; font-weight: bold; color: #2563eb;">📋 Online Booking/Menu</td>
      <td style="padding: 12px 8px;">Customers can book appointments or view your services online</td>
    </tr>
  </table>

  <p>I've prepared a quick preview of what your website & system could look like:</p>

  <div style="text-align: center; margin: 25px 0;">
    <a href="{landingPageUrl}" style="background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
      👉 See Your Website Preview
    </a>
  </div>

  <p>Ready to get started? Reply to this email or click the link above.</p>

  <p>Best regards,<br>
  <strong>Anuj</strong><br>
  NexBrothers — Web Development & Automation</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="font-size: 11px; color: #999;">
    You received this email because your business was listed on Google without a website.
    If this isn't relevant, simply ignore this email.
  </p>
</div>`;

  const text = `Hi,

I came across ${lead.name} on Google and noticed you don't have a website yet.

70% of customers search online before visiting a business. Without a website, you're missing out.

I can build you: Professional Website, Google Optimization, WhatsApp Integration, Online Booking.

See your preview: {landingPageUrl}

Reply to get started!

Best, Anuj — NexBrothers`;

  return { subject, html, text };
}

// Config
app.get('/api/config', (req, res) => {
  const config = getConfig();
  // Hide sensitive data
  res.json({
    ...config,
    emailPass: config.emailPass ? '****' : '',
    googleApiKey: config.googleApiKey ? config.googleApiKey.slice(0, 8) + '****' : ''
  });
});

app.put('/api/config', (req, res) => {
  const current = getConfig();
  const updated = { ...current, ...req.body };
  // Don't overwrite with masked values
  if (req.body.emailPass === '****') updated.emailPass = current.emailPass;
  if (req.body.googleApiKey?.endsWith('****')) updated.googleApiKey = current.googleApiKey;
  saveConfig(updated);
  res.json({ success: true });
});

// Sent Log
app.get('/api/sent-log', (req, res) => {
  const log = getSentLog();
  res.json(log.reverse().slice(0, 100));
});

// ===== Socket.IO Events =====
io.on('connection', (socket) => {
  console.log('Dashboard connected');

  // Search for leads
  socket.on('start-search', async (data) => {
    const { categories, cities, maxPerCombo } = data;
    const config = getConfig();

    if (!config.googleApiKey || config.googleApiKey === 'YOUR_API_KEY_HERE') {
      socket.emit('search-error', 'Google Places API key not configured. Go to Settings to add it.');
      return;
    }

    placesWorker = new PlacesWorker(config.googleApiKey);
    const existingLeads = getLeads();

    socket.emit('search-started', { categories, cities });

    await placesWorker.search({
      categories,
      cities,
      maxPerCombo: maxPerCombo || config.defaultMaxResults,
      existingLeads,
      onProgress: (progress) => socket.emit('search-progress', progress),
      onLead: (lead) => {
        existingLeads.push(lead);
        saveLeads(existingLeads);
        socket.emit('search-lead', lead);
      },
      onComplete: (leads) => {
        socket.emit('search-complete', { total: existingLeads.length, newFound: leads.length });
      },
      onError: (err) => socket.emit('search-error', err)
    });
  });

  socket.on('stop-search', () => {
    if (placesWorker) placesWorker.stop();
    socket.emit('search-stopped');
  });

  // Analyze websites
  socket.on('analyze-websites', async (data) => {
    const { leadIds } = data;
    const leads = getLeads();
    const toAnalyze = leadIds ? leads.filter(l => leadIds.includes(l.id)) : leads.filter(l => l.website && !l.websiteAnalysis);

    if (toAnalyze.length === 0) {
      socket.emit('analyze-complete', { analyzed: 0 });
      return;
    }

    socket.emit('analyze-started', { total: toAnalyze.length });

    websiteAnalyzer = new WebsiteAnalyzer();
    const results = await websiteAnalyzer.analyzeBatch(toAnalyze, (progress) => {
      socket.emit('analyze-progress', progress);
    });

    // Update leads with analysis results
    const allLeads = getLeads();
    for (const result of results) {
      if (!result.analysis) continue;
      const idx = allLeads.findIndex(l => l.id === result.leadId);
      if (idx !== -1) {
        allLeads[idx].websiteAnalysis = result.analysis;
        // Update email if found
        if (result.analysis.emails.length > 0 && !allLeads[idx].email) {
          allLeads[idx].email = result.analysis.emails[0];
        }
        // Update score
        allLeads[idx].score = WebsiteAnalyzer.updateScore(allLeads[idx]);
      }
    }
    saveLeads(allLeads);

    await websiteAnalyzer.close();
    socket.emit('analyze-complete', { analyzed: results.filter(r => r.analysis).length });
  });

  // Generate landing pages for leads
  socket.on('generate-landing-pages', (data) => {
    const { leadIds } = data;
    const leads = getLeads();
    const toGenerate = leadIds ? leads.filter(l => leadIds.includes(l.id)) : leads;

    let generated = 0;
    for (const lead of toGenerate) {
      const url = generateLandingPage(lead, BASE_URL);
      const idx = leads.findIndex(l => l.id === lead.id);
      if (idx !== -1) leads[idx].landingPageUrl = url;
      generated++;
      socket.emit('landing-page-progress', { current: generated, total: toGenerate.length, leadName: lead.name });
    }
    saveLeads(leads);
    socket.emit('landing-pages-complete', { generated });
  });

  // Mark lead status
  socket.on('update-lead-status', (data) => {
    const { leadId, status } = data;
    const leads = getLeads();
    const idx = leads.findIndex(l => l.id === leadId);
    if (idx !== -1) {
      leads[idx].status = status;
      saveLeads(leads);
      socket.emit('lead-updated', leads[idx]);
    }
  });

  // WhatsApp link generated (log it)
  socket.on('whatsapp-opened', (data) => {
    const { leadId } = data;
    const leads = getLeads();
    const idx = leads.findIndex(l => l.id === leadId);
    if (idx !== -1) {
      leads[idx].messageSent = true;
      leads[idx].status = leads[idx].status === 'new' ? 'contacted' : leads[idx].status;
      saveLeads(leads);

      const log = getSentLog();
      log.push({ leadId, leadName: leads[idx].name, type: 'whatsapp', sentAt: new Date().toISOString() });
      saveSentLog(log);

      socket.emit('lead-updated', leads[idx]);
    }
  });

  socket.on('disconnect', () => {
    console.log('Dashboard disconnected');
  });
});

// ===== Start Server =====
server.listen(PORT, () => {
  console.log(`\n🚀 Find Client Dashboard running at ${BASE_URL}`);
  console.log(`📊 Dashboard: ${BASE_URL}`);
  console.log(`🔌 API: ${BASE_URL}/api\n`);
});
