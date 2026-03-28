const BUSINESS_PROFILES = {
  restaurant: {
    label: "Restaurant / Cafe",
    searchTerms: ["restaurant", "cafe", "bistro", "diner", "pizzeria", "sushi", "fast food"],
    icon: "🍽️",
    painPoints: [
      "Losing reservations because customers don't want to call",
      "No way to share menu online quickly",
      "Missing delivery orders from WhatsApp inquiries",
      "Can't send daily specials to regular customers"
    ],
    features: [
      { title: "WhatsApp Menu", desc: "Digital menu with photos, prices & categories — customers browse and order directly" },
      { title: "Table Booking", desc: "Automated reservation system — customers pick date, time, guests" },
      { title: "Order Management", desc: "Receive & manage takeaway/delivery orders via WhatsApp" },
      { title: "Daily Specials Broadcast", desc: "Send today's specials to your customer list with one click" },
      { title: "Review Collection", desc: "Automated feedback request after dining — boost your Google rating" },
      { title: "Loyalty Program", desc: "Track repeat customers, send exclusive offers & birthday discounts" }
    ],
    emailHook: "I noticed {name} has great reviews but no way for customers to order or book via WhatsApp.",
    whatsappHook: "Hi! I saw {name} online — great reviews! I help restaurants get 3x more orders through WhatsApp automation. Quick question — do your customers currently message you on WhatsApp to place orders?",
    stat: "78% of customers prefer messaging over calling to place orders"
  },

  salon: {
    label: "Salon / Spa / Beauty",
    searchTerms: ["salon", "spa", "beauty", "hair salon", "barber", "nail salon", "beauty parlour"],
    icon: "💇",
    painPoints: [
      "Missed appointments because customers forget",
      "Phone always busy — losing new clients",
      "No way to showcase work (before/after photos)",
      "Can't manage walk-ins vs appointments efficiently"
    ],
    features: [
      { title: "Appointment Booking", desc: "Customers book their slot via WhatsApp — no calls needed" },
      { title: "Auto Reminders", desc: "Send appointment reminders 24hrs & 1hr before — reduce no-shows by 80%" },
      { title: "Service Menu", desc: "Full service list with prices, duration & photos" },
      { title: "Portfolio Showcase", desc: "Share before/after photos, latest styles & trends" },
      { title: "Loyalty Rewards", desc: "Track visits, offer discounts after every 5th visit" },
      { title: "Re-engagement", desc: "Automatically message clients who haven't visited in 30 days" }
    ],
    emailHook: "I noticed {name} doesn't have an online booking system — you might be losing clients who don't want to call.",
    whatsappHook: "Hi! I came across {name} — beautiful work! Quick question — do your clients currently book appointments via WhatsApp or do they have to call?",
    stat: "Salons with WhatsApp booking see 40% fewer no-shows"
  },

  clinic: {
    label: "Clinic / Doctor / Dentist",
    searchTerms: ["clinic", "doctor", "dentist", "dental", "medical", "physician", "healthcare", "veterinary", "vet"],
    icon: "🏥",
    painPoints: [
      "Reception line always busy — patients can't get through",
      "High no-show rate for appointments",
      "Patients calling just to ask timing/availability",
      "No system for prescription reminders or follow-ups"
    ],
    features: [
      { title: "Appointment Scheduling", desc: "Patients book via WhatsApp — see available slots instantly" },
      { title: "Queue Management", desc: "Send live queue updates — patients wait at home, not in clinic" },
      { title: "Prescription Reminders", desc: "Automated medicine reminders & refill notifications" },
      { title: "Doctor Availability", desc: "Patients check doctor schedule without calling" },
      { title: "Follow-up Automation", desc: "Auto-send follow-up reminders after visits" },
      { title: "Lab Reports", desc: "Share reports securely via WhatsApp — no need to visit clinic" }
    ],
    emailHook: "I noticed {name} doesn't have a WhatsApp booking system — your patients probably have to call and wait on hold.",
    whatsappHook: "Hi! I help clinics like {name} reduce phone calls by 60% with WhatsApp automation. Do your patients currently book via WhatsApp?",
    stat: "Clinics with WhatsApp scheduling see 60% fewer phone calls"
  },

  gym: {
    label: "Gym / Fitness Center",
    searchTerms: ["gym", "fitness", "yoga", "crossfit", "pilates", "personal trainer", "fitness center"],
    icon: "💪",
    painPoints: [
      "Members forget class timings",
      "High membership churn — no follow-up system",
      "New leads inquire but never sign up",
      "Can't broadcast schedule changes quickly"
    ],
    features: [
      { title: "Class Schedule", desc: "Members check today's classes & book slots via WhatsApp" },
      { title: "Membership Reminders", desc: "Auto-notify before membership expires — reduce churn" },
      { title: "Lead Follow-up", desc: "Automatically follow up with trial visitors who didn't sign up" },
      { title: "Workout Tips", desc: "Send daily fitness tips & nutrition advice to members" },
      { title: "Attendance Tracking", desc: "Members check-in via WhatsApp — track consistency" },
      { title: "Schedule Alerts", desc: "Instant broadcast when classes change or cancel" }
    ],
    emailHook: "I noticed {name} has no way for members to check schedules or book classes on WhatsApp.",
    whatsappHook: "Hi! I help gyms like {name} retain more members with WhatsApp automation — reminders, class bookings, and follow-ups. Do your members currently use WhatsApp to interact with you?",
    stat: "Gyms using WhatsApp reminders see 35% less membership churn"
  },

  hotel: {
    label: "Hotel / Resort / Guest House",
    searchTerms: ["hotel", "resort", "guest house", "hostel", "boutique hotel", "bed and breakfast", "bnb"],
    icon: "🏨",
    painPoints: [
      "Guests call for basic info (check-in time, wifi, directions)",
      "No quick way to handle booking inquiries",
      "Can't upsell services (spa, tours, dining)",
      "Post-checkout — no way to get reviews or repeat bookings"
    ],
    features: [
      { title: "Booking Inquiries", desc: "Handle room availability & pricing queries 24/7 on WhatsApp" },
      { title: "Guest Concierge", desc: "Auto-answer FAQs — wifi password, check-in time, directions" },
      { title: "Room Service", desc: "Guests order food, request amenities via WhatsApp" },
      { title: "Upsell Services", desc: "Suggest spa, tours, airport transfer during stay" },
      { title: "Review Collection", desc: "Auto-request reviews after checkout — boost ratings" },
      { title: "Repeat Booking", desc: "Send special offers to past guests for repeat visits" }
    ],
    emailHook: "I noticed {name} handles guest inquiries by phone — WhatsApp automation could free up your front desk significantly.",
    whatsappHook: "Hi! I help hotels like {name} automate guest communication on WhatsApp — from booking to checkout. Are your guests currently messaging you on WhatsApp?",
    stat: "Hotels with WhatsApp concierge save 4+ hours/day on front desk calls"
  },

  realestate: {
    label: "Real Estate / Property",
    searchTerms: ["real estate", "property", "realtor", "estate agent", "property dealer", "homes for sale"],
    icon: "🏠",
    painPoints: [
      "Leads go cold because response time is too slow",
      "Sharing property details over phone is inefficient",
      "Can't send property photos/videos quickly to multiple leads",
      "No follow-up system for interested buyers"
    ],
    features: [
      { title: "Property Catalog", desc: "Share property listings with photos, price, location on WhatsApp" },
      { title: "Instant Lead Response", desc: "Auto-reply to new inquiries within seconds — never lose a lead" },
      { title: "Virtual Tours", desc: "Send property videos & 360° tours via WhatsApp" },
      { title: "Follow-up Automation", desc: "Auto follow-up with leads who showed interest but didn't respond" },
      { title: "Price Alerts", desc: "Notify buyers when properties in their budget become available" },
      { title: "Document Sharing", desc: "Share brochures, floor plans, legal docs securely" }
    ],
    emailHook: "In real estate, the agent who responds first wins the deal. I noticed {name} doesn't have instant WhatsApp response — you might be losing leads.",
    whatsappHook: "Hi! I help real estate businesses like {name} respond to property inquiries instantly on WhatsApp — photos, prices, virtual tours. How are you currently handling leads?",
    stat: "Real estate agents who respond within 5 minutes are 10x more likely to close"
  },

  retail: {
    label: "Retail Shop / Store",
    searchTerms: ["shop", "store", "retail", "boutique", "electronics", "clothing", "jewelry", "furniture"],
    icon: "🛍️",
    painPoints: [
      "Customers call to check if items are in stock",
      "No online catalog — losing to e-commerce competitors",
      "Can't notify customers about new arrivals or sales",
      "No way to take orders for delivery"
    ],
    features: [
      { title: "Product Catalog", desc: "Share your entire catalog on WhatsApp — photos, prices, availability" },
      { title: "Order & Delivery", desc: "Customers order via WhatsApp — you deliver or they pick up" },
      { title: "Stock Alerts", desc: "Notify customers when requested items are back in stock" },
      { title: "Sale Broadcasts", desc: "Send flash sale announcements to your customer list" },
      { title: "Customer Support", desc: "Handle returns, exchanges, and queries on WhatsApp" },
      { title: "Payment Links", desc: "Send payment links directly in WhatsApp chat" }
    ],
    emailHook: "I noticed {name} doesn't have a WhatsApp catalog — your customers might be buying from competitors who do.",
    whatsappHook: "Hi! I help shops like {name} sell more through WhatsApp — product catalogs, orders & delivery. Are your customers currently ordering via WhatsApp?",
    stat: "Retail stores with WhatsApp catalogs see 25% more repeat purchases"
  },

  education: {
    label: "School / Coaching / Tuition",
    searchTerms: ["school", "coaching", "tuition", "academy", "training", "institute", "university", "college"],
    icon: "📚",
    painPoints: [
      "Parents calling for fee details, schedules, results",
      "No system to share homework/assignments quickly",
      "Attendance notification is manual and slow",
      "Admission inquiries get lost in the shuffle"
    ],
    features: [
      { title: "Admission Bot", desc: "Auto-answer admission queries — fees, eligibility, deadlines" },
      { title: "Attendance Alerts", desc: "Notify parents instantly when child is absent" },
      { title: "Assignment Sharing", desc: "Send homework, notes, study material on WhatsApp" },
      { title: "Fee Reminders", desc: "Automated fee payment reminders before due date" },
      { title: "Result Notifications", desc: "Share exam results & report cards via WhatsApp" },
      { title: "Event Updates", desc: "Broadcast school events, holidays, schedule changes" }
    ],
    emailHook: "I noticed {name} doesn't have a WhatsApp communication system — parents probably have to call for every update.",
    whatsappHook: "Hi! I help educational institutions like {name} automate parent communication on WhatsApp — attendance, fees, results. How do you currently communicate with parents?",
    stat: "Schools with WhatsApp automation reduce parent calls by 70%"
  }
};

// Target countries with cities
const TARGET_REGIONS = {
  uae: {
    label: "UAE",
    currency: "$",
    language: "en",
    cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
    timezone: "Asia/Dubai",
    bestCategories: ["restaurant", "salon", "realestate", "hotel", "retail"]
  },
  saudi: {
    label: "Saudi Arabia",
    currency: "$",
    language: "en",
    cities: ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina"],
    timezone: "Asia/Riyadh",
    bestCategories: ["restaurant", "clinic", "salon", "retail", "realestate"]
  },
  uk: {
    label: "United Kingdom",
    currency: "£",
    language: "en",
    cities: ["London", "Manchester", "Birmingham", "Leeds", "Liverpool"],
    timezone: "Europe/London",
    bestCategories: ["restaurant", "salon", "clinic", "retail", "gym"]
  },
  usa: {
    label: "United States",
    currency: "$",
    language: "en",
    cities: ["New York", "Los Angeles", "Chicago", "Houston", "Miami"],
    timezone: "America/New_York",
    bestCategories: ["restaurant", "clinic", "realestate", "salon", "gym"]
  },
  canada: {
    label: "Canada",
    currency: "$",
    language: "en",
    cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
    timezone: "America/Toronto",
    bestCategories: ["restaurant", "clinic", "realestate", "salon", "retail"]
  },
  singapore: {
    label: "Singapore",
    currency: "$",
    language: "en",
    cities: ["Singapore"],
    timezone: "Asia/Singapore",
    bestCategories: ["restaurant", "salon", "clinic", "retail", "education"]
  },
  australia: {
    label: "Australia",
    currency: "A$",
    language: "en",
    cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
    timezone: "Australia/Sydney",
    bestCategories: ["restaurant", "salon", "clinic", "gym", "realestate"]
  },
  india: {
    label: "India",
    currency: "₹",
    language: "en",
    cities: ["Mumbai", "Delhi", "Bangalore", "Jaipur", "Hyderabad", "Pune", "Chennai"],
    timezone: "Asia/Kolkata",
    bestCategories: ["restaurant", "salon", "clinic", "education", "retail"]
  }
};

function getProfileForCategory(category) {
  return BUSINESS_PROFILES[category] || null;
}

function getAllCategories() {
  return Object.entries(BUSINESS_PROFILES).map(([key, val]) => ({
    key,
    label: val.label,
    icon: val.icon
  }));
}

function getAllRegions() {
  return Object.entries(TARGET_REGIONS).map(([key, val]) => ({
    key,
    label: val.label,
    cities: val.cities,
    bestCategories: val.bestCategories
  }));
}

function matchCategoryFromTypes(googleTypes) {
  for (const [key, profile] of Object.entries(BUSINESS_PROFILES)) {
    for (const term of profile.searchTerms) {
      if (googleTypes.some(t => t.toLowerCase().includes(term) || term.includes(t.toLowerCase()))) {
        return key;
      }
    }
  }
  return "retail"; // default fallback
}

module.exports = {
  BUSINESS_PROFILES,
  TARGET_REGIONS,
  getProfileForCategory,
  getAllCategories,
  getAllRegions,
  matchCategoryFromTypes
};
