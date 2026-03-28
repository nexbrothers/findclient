const puppeteer = require('puppeteer');

class WebsiteAnalyzer {
  constructor() {
    this.browser = null;
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async analyze(website) {
    if (!website) return { hasWhatsApp: false, hasChat: false, emails: [], socials: [], techStack: [] };

    await this.init();
    const page = await this.browser.newPage();
    page.setDefaultNavigationTimeout(15000);

    const result = {
      hasWhatsApp: false,
      hasChat: false,
      hasBooking: false,
      emails: [],
      phones: [],
      socials: [],
      techStack: [],
      description: ''
    };

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.goto(website, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      const pageContent = await page.content();
      const bodyText = await page.evaluate(() => document.body?.innerText || '');

      // Check for WhatsApp presence
      result.hasWhatsApp = /whatsapp|wa\.me|api\.whatsapp/i.test(pageContent);

      // Check for chat widgets
      result.hasChat = /tawk\.to|crisp|intercom|zendesk|livechat|tidio|drift|hubspot.*chat|freshchat|olark/i.test(pageContent);

      // Check for booking systems
      result.hasBooking = /booking|appointment|schedule|calendly|acuity|fresha|booksy|setmore|square.*appointment/i.test(pageContent);

      // Extract emails
      const emailMatches = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      result.emails = [...new Set(emailMatches)].filter(e =>
        !e.includes('example.com') && !e.includes('sentry') && !e.includes('webpack')
      ).slice(0, 5);

      // Extract phone numbers from page text
      const phoneMatches = bodyText.match(/[\+]?[\d\s\-\(\)]{10,}/g) || [];
      result.phones = [...new Set(phoneMatches.map(p => p.trim()))].slice(0, 3);

      // Extract social media links
      const socialLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        return links
          .map(a => a.href)
          .filter(href => /facebook|instagram|twitter|linkedin|youtube|tiktok/i.test(href));
      });
      result.socials = [...new Set(socialLinks)].slice(0, 6);

      // Detect tech stack
      if (/wordpress|wp-content/i.test(pageContent)) result.techStack.push('WordPress');
      if (/wix\.com/i.test(pageContent)) result.techStack.push('Wix');
      if (/squarespace/i.test(pageContent)) result.techStack.push('Squarespace');
      if (/shopify/i.test(pageContent)) result.techStack.push('Shopify');
      if (/webflow/i.test(pageContent)) result.techStack.push('Webflow');

      // Get meta description
      result.description = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="description"]');
        return meta?.content || '';
      });

    } catch (err) {
      console.error(`Error analyzing ${website}:`, err.message);
    } finally {
      await page.close();
    }

    return result;
  }

  // Batch analyze multiple leads
  async analyzeBatch(leads, onProgress) {
    await this.init();
    const results = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      if (!lead.website) {
        results.push({ leadId: lead.id, analysis: null });
        continue;
      }

      onProgress && onProgress({
        current: i + 1,
        total: leads.length,
        percent: Math.round(((i + 1) / leads.length) * 100),
        message: `Analyzing ${lead.name}...`
      });

      const analysis = await this.analyze(lead.website);
      results.push({ leadId: lead.id, analysis });

      // Delay between requests
      await new Promise(r => setTimeout(r, 1000));
    }

    await this.close();
    return results;
  }

  // Update lead score based on website analysis
  static updateScore(lead) {
    if (!lead.websiteAnalysis) return lead.score;

    let bonus = 0;
    const a = lead.websiteAnalysis;

    // No WhatsApp on website = they need us
    if (!a.hasWhatsApp) bonus += 5;
    // No chat widget = they definitely need us
    if (!a.hasChat) bonus += 3;
    // No booking system = opportunity
    if (!a.hasBooking) bonus += 3;
    // We found their email = can reach them
    if (a.emails.length > 0) bonus += 2;
    // Basic tech stack (Wix, WordPress) = not tech-savvy, easier sell
    if (a.techStack.some(t => ['Wix', 'WordPress', 'Squarespace'].includes(t))) bonus += 2;

    return lead.score + bonus;
  }
}

module.exports = WebsiteAnalyzer;
