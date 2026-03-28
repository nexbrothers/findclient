const fs = require('fs');
const path = require('path');
const { BUSINESS_PROFILES } = require('./business-profiles');
const { formatPhone } = require('./message-generator');

function generateLandingPage(lead, baseUrl) {
  const profile = BUSINESS_PROFILES[lead.category] || BUSINESS_PROFILES.retail;
  const waPhone = formatPhone(lead.phone) || '';
  const ctaLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi! I saw the demo you built for ${lead.name}. I'm interested in learning more.`)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lead.name} — WhatsApp Automation Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f0f2f5; color: #1a1a2e; }

    .hero {
      background: linear-gradient(135deg, #075e54 0%, #128c7e 50%, #25d366 100%);
      color: white; padding: 60px 20px; text-align: center;
    }
    .hero h1 { font-size: 28px; margin-bottom: 12px; }
    .hero p { font-size: 16px; opacity: 0.9; max-width: 600px; margin: 0 auto; }
    .hero .badge {
      display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 16px;
      border-radius: 20px; font-size: 13px; margin-bottom: 20px;
    }

    .container { max-width: 800px; margin: 0 auto; padding: 0 20px; }

    .phone-mockup {
      background: white; border-radius: 24px; max-width: 380px; margin: -40px auto 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; position: relative;
    }
    .phone-header {
      background: #075e54; color: white; padding: 16px 20px;
      display: flex; align-items: center; gap: 12px;
    }
    .phone-header .avatar {
      width: 40px; height: 40px; border-radius: 50%; background: #25d366;
      display: flex; align-items: center; justify-content: center; font-size: 20px;
    }
    .phone-header .name { font-weight: 600; font-size: 16px; }
    .phone-header .status { font-size: 12px; opacity: 0.8; }
    .phone-chat { background: #e5ddd5; padding: 20px; min-height: 300px; }
    .msg {
      max-width: 85%; padding: 10px 14px; border-radius: 12px; margin-bottom: 10px;
      font-size: 14px; line-height: 1.5; position: relative;
    }
    .msg-bot { background: white; border-radius: 0 12px 12px 12px; }
    .msg-user {
      background: #dcf8c6; margin-left: auto; border-radius: 12px 0 12px 12px;
    }
    .msg-time { font-size: 11px; color: #999; text-align: right; margin-top: 4px; }
    .msg-btns { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
    .msg-btn {
      background: #f0f0f0; border: 1px solid #ddd; padding: 8px 12px; border-radius: 8px;
      font-size: 13px; text-align: center; cursor: pointer; color: #075e54; font-weight: 500;
    }

    .features { padding: 50px 20px; }
    .features h2 { text-align: center; font-size: 24px; margin-bottom: 8px; }
    .features .subtitle { text-align: center; color: #666; margin-bottom: 40px; font-size: 15px; }
    .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
    .feature-card {
      background: white; padding: 24px; border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06); transition: transform 0.2s;
    }
    .feature-card:hover { transform: translateY(-4px); }
    .feature-card .icon { font-size: 32px; margin-bottom: 12px; }
    .feature-card h3 { font-size: 16px; margin-bottom: 8px; color: #075e54; }
    .feature-card p { font-size: 14px; color: #555; line-height: 1.6; }

    .stat-banner {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      color: white; padding: 40px 20px; text-align: center; margin: 0;
    }
    .stat-banner .number { font-size: 48px; font-weight: 800; color: #25d366; }
    .stat-banner p { font-size: 16px; opacity: 0.9; margin-top: 8px; }

    .cta-section { padding: 50px 20px; text-align: center; background: white; }
    .cta-section h2 { font-size: 24px; margin-bottom: 12px; }
    .cta-section p { color: #666; margin-bottom: 30px; font-size: 15px; }
    .cta-btn {
      display: inline-block; background: #25d366; color: white; padding: 16px 40px;
      border-radius: 12px; font-size: 18px; font-weight: 700; text-decoration: none;
      box-shadow: 0 4px 15px rgba(37,211,102,0.4); transition: all 0.3s;
    }
    .cta-btn:hover { background: #128c7e; transform: translateY(-2px); }
    .cta-note { font-size: 13px; color: #999; margin-top: 16px; }

    .footer {
      background: #1a1a2e; color: rgba(255,255,255,0.7); padding: 30px 20px;
      text-align: center; font-size: 13px;
    }

    @media (max-width: 480px) {
      .hero h1 { font-size: 22px; }
      .feature-grid { grid-template-columns: 1fr; }
      .stat-banner .number { font-size: 36px; }
    }
  </style>
</head>
<body>

  <div class="hero">
    <div class="badge">Built exclusively for ${lead.name}</div>
    <h1>${profile.icon} WhatsApp Automation for ${lead.name}</h1>
    <p>${profile.features[0].desc} — and much more. Here's a preview of what we'll build for you.</p>
  </div>

  <div class="container">
    <div class="phone-mockup">
      <div class="phone-header">
        <div class="avatar">${profile.icon}</div>
        <div>
          <div class="name">${lead.name}</div>
          <div class="status">🟢 Online — Powered by NexBrothers</div>
        </div>
      </div>
      <div class="phone-chat">
        <div class="msg msg-user">
          Hi, I'd like to ${lead.category === 'restaurant' ? 'see your menu' : lead.category === 'salon' ? 'book an appointment' : lead.category === 'clinic' ? 'book an appointment' : lead.category === 'hotel' ? 'check room availability' : lead.category === 'realestate' ? 'see available properties' : lead.category === 'gym' ? 'check class schedule' : 'know more about your services'} 👋
          <div class="msg-time">10:30 AM</div>
        </div>
        <div class="msg msg-bot">
          Welcome to *${lead.name}*! 🎉
          <br><br>
          I'm your AI assistant. How can I help you today?
          <div class="msg-btns">
            <div class="msg-btn">${profile.features[0].title}</div>
            <div class="msg-btn">${profile.features[1].title}</div>
            <div class="msg-btn">${profile.features[2].title}</div>
            <div class="msg-btn">💬 Talk to a human</div>
          </div>
          <div class="msg-time">10:30 AM ✓✓</div>
        </div>
        <div class="msg msg-user">
          ${profile.features[0].title} please!
          <div class="msg-time">10:31 AM</div>
        </div>
        <div class="msg msg-bot">
          ${profile.features[0].desc} ✅
          <br><br>
          Would you like to proceed? I can help you right away!
          <div class="msg-btns">
            <div class="msg-btn">✅ Yes, proceed</div>
            <div class="msg-btn">📞 Call us instead</div>
          </div>
          <div class="msg-time">10:31 AM ✓✓</div>
        </div>
      </div>
    </div>
  </div>

  <div class="features">
    <h2>What We'll Build for ${lead.name}</h2>
    <p class="subtitle">A complete WhatsApp automation system tailored to your business</p>
    <div class="feature-grid">
      ${profile.features.map((f, i) => `
      <div class="feature-card">
        <div class="icon">${['🚀', '⏰', '📋', '📢', '⭐', '🔄'][i] || '✅'}</div>
        <h3>${f.title}</h3>
        <p>${f.desc}</p>
      </div>`).join('')}
    </div>
  </div>

  <div class="stat-banner">
    <div class="number">${profile.stat.match(/\d+%?x?/)?.[0] || '3x'}</div>
    <p>${profile.stat}</p>
  </div>

  <div class="cta-section">
    <h2>Ready to automate ${lead.name}?</h2>
    <p>Takes just 2-3 days to set up. Works on your existing WhatsApp number.</p>
    <a href="${ctaLink}" class="cta-btn" target="_blank">💬 Get Started on WhatsApp</a>
    <p class="cta-note">Free consultation • No commitments • Setup in 48 hours</p>
  </div>

  <div class="footer">
    <p>Built with ❤️ by NexBrothers — WhatsApp Automation for Businesses</p>
    <p style="margin-top: 8px;">This preview was created specifically for ${lead.name}</p>
  </div>

</body>
</html>`;

  // Save the landing page
  const filePath = path.join(__dirname, '..', 'data', 'landing-pages', `${lead.id}.html`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html, 'utf-8');

  return `${baseUrl}/landing/${lead.id}`;
}

module.exports = { generateLandingPage };
