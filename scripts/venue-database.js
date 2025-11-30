/**
 * Venue Database
 * 
 * Manual mapping of venue names to full address and coordinates
 * This is needed because Meetup's GraphQL API doesn't expose venue details
 */

export const venueDatabase = {
  'Lenexa Public Market': {
    name: 'Lenexa Public Market',
    address: '8750 Penrose Ln',
    city: 'Lenexa',
    state: 'KS',
    postalCode: '66219',
    lat: 38.9539,
    lng: -94.7336
  },
  'Keystone CoLAB': {
    name: 'Keystone CoLAB',
    address: '5015 Main St',
    city: 'Kansas City',
    state: 'MO',
    postalCode: '64112',
    lat: 39.0403,
    lng: -94.5897
  }
}

/**
 * Look up venue details by name
 * @param {string} venueName - The name of the venue
 * @returns {object|null} Venue details or null if not found
 */
export function lookupVenue(venueName) {
  if (!venueName) return null
  
  // Try exact match first
  if (venueDatabase[venueName]) {
    return venueDatabase[venueName]
  }
  
  // Try case-insensitive partial match
  const normalizedName = venueName.toLowerCase()
  for (const [key, venue] of Object.entries(venueDatabase)) {
    if (key.toLowerCase().includes(normalizedName) || normalizedName.includes(key.toLowerCase())) {
      return venue
    }
  }
  
  // Return basic venue with just the name if not found in database
  return {
    name: venueName,
    address: '',
    city: '',
    state: '',
    postalCode: '',
    lat: null,
    lng: null
  }
}
