const { BUSINESS_PROFILES } = require('./business-profiles');

function formatPhone(phone) {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
}

function generateWhatsAppMessage(lead, style = 'professional') {
  const profile = BUSINESS_PROFILES[lead.category];
  if (!profile) return generateGenericWhatsApp(lead);

  const features = profile.features.slice(0, 3).map(f => f.title).join(', ');
  const hook = profile.whatsappHook.replace(/{name}/g, lead.name);

  const templates = {
    professional: `${hook}

I specialize in building WhatsApp automation for ${profile.label.toLowerCase()} businesses. Here's what I can set up for *${lead.name}*:

✅ ${profile.features[0].title} — ${profile.features[0].desc}
✅ ${profile.features[1].title} — ${profile.features[1].desc}
✅ ${profile.features[2].title} — ${profile.features[2].desc}

📊 *${profile.stat}*

I've prepared a quick preview of what your system would look like:
🔗 {landingPageUrl}

Would you be open to a free 5-minute demo this week?

Best regards,
NexBrothers — WhatsApp Automation`,

    casual: `Hey! 👋

${hook}

I can build you:
• ${profile.features[0].title}
• ${profile.features[1].title}
• ${profile.features[2].title}

Check out this quick preview I made for ${lead.name}:
🔗 {landingPageUrl}

Interested in a quick chat?`,

    direct: `Hi,

${profile.stat}.

I help ${profile.label.toLowerCase()} businesses like ${lead.name} automate their customer communication on WhatsApp.

See what I can build for you: {landingPageUrl}

Reply "YES" if you'd like a free demo.

— NexBrothers`
  };

  return templates[style] || templates.professional;
}

function generateEmailMessage(lead, style = 'professional') {
  const profile = BUSINESS_PROFILES[lead.category];
  if (!profile) return generateGenericEmail(lead);

  const subject = generateEmailSubject(lead, profile);
  const hook = profile.emailHook.replace(/{name}/g, lead.name);

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <p>Hi${lead.ownerName ? ' ' + lead.ownerName : ''},</p>

  <p>${hook}</p>

  <p>${profile.stat}. Businesses that automate their WhatsApp see a significant increase in customer engagement and revenue.</p>

  <p>Here's what I can build specifically for <strong>${lead.name}</strong>:</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    ${profile.features.slice(0, 4).map(f => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 8px; font-weight: bold; color: #2563eb; width: 35%;">✅ ${f.title}</td>
      <td style="padding: 12px 8px;">${f.desc}</td>
    </tr>`).join('')}
  </table>

  <p>I've prepared a personalized preview showing exactly what your WhatsApp system would look like:</p>

  <div style="text-align: center; margin: 25px 0;">
    <a href="{landingPageUrl}" style="background: #25D366; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
      👉 See Your WhatsApp System Preview
    </a>
  </div>

  <p>This takes just 2-3 days to set up and works on your existing WhatsApp number — no app downloads needed.</p>

  <p>Would you be open to a quick 5-minute call this week? I'd love to show you a live demo.</p>

  <p>Best regards,<br>
  <strong>Anuj</strong><br>
  NexBrothers — WhatsApp Automation for Businesses<br>
  <a href="https://wa.me/${formatPhone(lead.phone) || ''}">Chat on WhatsApp</a></p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="font-size: 11px; color: #999;">
    You received this email because your business was listed on Google.
    If this isn't relevant, simply ignore this email — no further messages will be sent.
  </p>
</div>`;

  const text = `Hi${lead.ownerName ? ' ' + lead.ownerName : ''},

${hook}

${profile.stat}.

Here's what I can build for ${lead.name}:

${profile.features.slice(0, 4).map(f => `✅ ${f.title} — ${f.desc}`).join('\n')}

See your personalized preview: {landingPageUrl}

Would you be open to a quick 5-minute call this week?

Best regards,
Anuj
NexBrothers — WhatsApp Automation`;

  return { subject, html, text };
}

function generateEmailSubject(lead, profile) {
  const subjects = [
    `Quick idea for ${lead.name}`,
    `${lead.name} — you might be losing customers`,
    `I built something for ${lead.name}`,
    `${lead.name} + WhatsApp automation`,
    `Saw ${lead.name} on Google — had an idea`
  ];
  // Pick based on lead id hash for consistency
  const index = lead.name.length % subjects.length;
  return subjects[index];
}

function generateGenericWhatsApp(lead) {
  return `Hi! I came across ${lead.name} online and was impressed.

I help businesses automate their customer communication on WhatsApp — booking, orders, support, and more.

Would you be open to a free 5-minute demo? I can show you exactly how it works for your business.

— NexBrothers`;
}

function generateGenericEmail(lead) {
  return {
    subject: `Quick idea for ${lead.name}`,
    html: `<p>Hi,</p><p>I help businesses automate customer communication on WhatsApp. Would love to show you what I can build for ${lead.name}.</p><p>Best, NexBrothers</p>`,
    text: `Hi, I help businesses automate customer communication on WhatsApp. Would love to show you what I can build for ${lead.name}. Best, NexBrothers`
  };
}

function generateWaLink(phone, message) {
  const cleanPhone = formatPhone(phone);
  if (!cleanPhone) return '';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function getMessagePreview(lead, baseUrl) {
  const landingPageUrl = `${baseUrl}/landing/${lead.id}`;

  const whatsapp = generateWhatsAppMessage(lead, 'professional')
    .replace(/{landingPageUrl}/g, landingPageUrl);

  const email = generateEmailMessage(lead, 'professional');
  email.html = email.html.replace(/{landingPageUrl}/g, landingPageUrl);
  email.text = email.text.replace(/{landingPageUrl}/g, landingPageUrl);

  const waLink = generateWaLink(lead.phone, whatsapp);

  return { whatsapp, email, waLink, landingPageUrl };
}

module.exports = {
  generateWhatsAppMessage,
  generateEmailMessage,
  generateWaLink,
  getMessagePreview,
  formatPhone
};
