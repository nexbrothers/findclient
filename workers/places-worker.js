const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { matchCategoryFromTypes } = require('../lib/business-profiles');

class PlacesWorker {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.running = false;
  }

  stop() {
    this.running = false;
  }

  async search({ categories, cities, maxPerCombo = 20, existingLeads = [], onProgress, onLead, onComplete, onError }) {
    this.running = true;
    const allLeads = [];
    const seenPhones = new Set();
    const seenPlaceIds = new Set();
    const seenNames = new Set();
    const totalCombos = categories.length * cities.length;

    // Pre-load existing leads to prevent duplicates across searches
    if (existingLeads) {
      for (const el of existingLeads) {
        if (el.phone) seenPhones.add(el.phone);
        if (el.placeId) seenPlaceIds.add(el.placeId);
        seenNames.add(`${el.name.toLowerCase().trim()}__${el.city.toLowerCase().trim()}`);
      }
    }
    let completedCombos = 0;

    try {
      for (const city of cities) {
        for (const category of categories) {
          if (!this.running) {
            onComplete && onComplete(allLeads);
            return allLeads;
          }

          onProgress && onProgress({
            percent: Math.round((completedCombos / totalCombos) * 100),
            city,
            category,
            found: allLeads.length,
            message: `Searching ${category} in ${city}...`
          });

          try {
            const leads = await this.searchPlaces(category, city, maxPerCombo);

            for (const lead of leads) {
              if (!this.running) break;

              // Deduplicate by phone
              if (lead.phone && seenPhones.has(lead.phone)) continue;
              if (lead.phone) seenPhones.add(lead.phone);

              // Deduplicate by placeId
              if (lead.placeId && seenPlaceIds.has(lead.placeId)) continue;
              if (lead.placeId) seenPlaceIds.add(lead.placeId);

              // Deduplicate by name+city combo
              const nameKey = `${lead.name.toLowerCase().trim()}__${lead.city.toLowerCase().trim()}`;
              if (seenNames.has(nameKey)) continue;
              seenNames.add(nameKey);

              lead.searchCategory = category;
              allLeads.push(lead);
              onLead && onLead(lead);
            }
          } catch (err) {
            console.error(`Error searching ${category} in ${city}:`, err.message);
          }

          completedCombos++;

          // Small delay between requests to respect rate limits
          await this.delay(500);
        }
      }

      onProgress && onProgress({
        percent: 100,
        city: '',
        category: '',
        found: allLeads.length,
        message: `Done! Found ${allLeads.length} leads.`
      });

      onComplete && onComplete(allLeads);
      return allLeads;

    } catch (err) {
      onError && onError(err.message);
      return allLeads;
    } finally {
      this.running = false;
    }
  }

  async searchPlaces(category, city, maxResults) {
    const query = `${category} in ${city}`;
    const leads = [];

    try {
      // Google Places API (New) - Text Search
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        {
          textQuery: query,
          maxResultCount: Math.min(maxResults, 20),
          languageCode: 'en'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.types,places.rating,places.userRatingCount,places.businessStatus'
          }
        }
      );

      const places = response.data.places || [];

      for (const place of places) {
        if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') continue;

        const lead = {
          id: uuidv4(),
          placeId: place.id || '',
          name: place.displayName?.text || 'Unknown',
          category: matchCategoryFromTypes(place.types || []),
          phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
          email: null,
          website: place.websiteUri || '',
          address: place.formattedAddress || '',
          city: city,
          rating: place.rating || 0,
          ratingCount: place.userRatingCount || 0,
          googleMapsUrl: place.googleMapsUri || '',
          websiteAnalysis: null,
          score: 0,
          status: 'new', // new, contacted, replied, converted, rejected
          messageSent: false,
          emailSent: false,
          notes: '',
          createdAt: new Date().toISOString()
        };

        // Calculate lead score
        lead.score = this.calculateScore(lead);
        leads.push(lead);
      }
    } catch (err) {
      // If API fails, try legacy Places API as fallback
      if (err.response?.status === 403 || err.response?.status === 400) {
        return await this.searchPlacesLegacy(category, city, maxResults);
      }
      throw err;
    }

    return leads;
  }

  // Fallback: Legacy Places API
  async searchPlacesLegacy(category, city, maxResults) {
    const query = `${category} in ${city}`;
    const leads = [];

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/textsearch/json',
        {
          params: {
            query,
            key: this.apiKey
          }
        }
      );

      const results = response.data.results || [];

      for (const place of results.slice(0, maxResults)) {
        if (place.business_status && place.business_status !== 'OPERATIONAL') continue;

        // Get phone number from Place Details
        let phone = '';
        let website = '';
        try {
          const details = await axios.get(
            'https://maps.googleapis.com/maps/api/place/details/json',
            {
              params: {
                place_id: place.place_id,
                fields: 'formatted_phone_number,international_phone_number,website',
                key: this.apiKey
              }
            }
          );
          phone = details.data.result?.international_phone_number || details.data.result?.formatted_phone_number || '';
          website = details.data.result?.website || '';
          await this.delay(200);
        } catch (e) {
          console.error('Details fetch error:', e.message);
        }

        const lead = {
          id: uuidv4(),
          placeId: place.place_id || '',
          name: place.name || 'Unknown',
          category: matchCategoryFromTypes(place.types || []),
          phone,
          email: null,
          website,
          address: place.formatted_address || '',
          city,
          rating: place.rating || 0,
          ratingCount: place.user_ratings_total || 0,
          googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          websiteAnalysis: null,
          score: 0,
          status: 'new',
          messageSent: false,
          emailSent: false,
          notes: '',
          createdAt: new Date().toISOString()
        };

        lead.score = this.calculateScore(lead);
        leads.push(lead);
      }
    } catch (err) {
      throw err;
    }

    return leads;
  }

  calculateScore(lead) {
    let score = 0;

    // Has phone number (can reach them)
    if (lead.phone) score += 3;

    // Has website (established business, but might not have WhatsApp)
    if (lead.website) score += 2;

    // No website (definitely needs digital help)
    if (!lead.website) score += 4;

    // Good rating (busy, successful business = can afford services)
    if (lead.rating >= 4.0) score += 3;
    if (lead.rating >= 4.5) score += 2;

    // High review count (popular = more to gain from automation)
    if (lead.ratingCount >= 50) score += 2;
    if (lead.ratingCount >= 200) score += 2;

    // Has both phone and no website = hot lead
    if (lead.phone && !lead.website) score += 3;

    return score;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = PlacesWorker;
