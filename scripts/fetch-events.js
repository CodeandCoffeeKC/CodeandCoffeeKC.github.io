import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Meetup API Event Fetcher
 * 
 * This script fetches events from the Meetup GraphQL API using OAuth 2.0
 * and writes them to a static JSON file for the website to consume.
 * 
 * Required Environment Variables:
 * - MEETUP_CLIENT_ID: OAuth client ID
 * - MEETUP_CLIENT_SECRET: OAuth client secret
 * - MEETUP_REFRESH_TOKEN: Long-lived refresh token
 */

const MEETUP_GROUP_URLNAME = 'code-and-coffee-kc'
const OUTPUT_FILE = path.join(__dirname, '../public/data/events.json')

// Ensure the output directory exists
function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`✓ Created directory: ${dir}`)
  }
}

// Create fallback empty JSON file
function createFallbackJSON() {
  const fallbackData = {
    events: [],
    lastUpdated: new Date().toISOString(),
    note: 'No events available - API fetch failed or returned no data'
  }
  
  ensureDirectoryExists(OUTPUT_FILE)
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fallbackData, null, 2))
  console.log('✓ Created fallback events.json with empty events array')
}

// Refresh the access token using the refresh token
async function refreshAccessToken() {
  const { MEETUP_CLIENT_ID, MEETUP_CLIENT_SECRET, MEETUP_REFRESH_TOKEN } = process.env

  if (!MEETUP_CLIENT_ID || !MEETUP_CLIENT_SECRET || !MEETUP_REFRESH_TOKEN) {
    throw new Error('Missing required environment variables: MEETUP_CLIENT_ID, MEETUP_CLIENT_SECRET, MEETUP_REFRESH_TOKEN')
  }

  console.log('→ Refreshing access token...')

  const params = new URLSearchParams({
    client_id: MEETUP_CLIENT_ID,
    client_secret: MEETUP_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: MEETUP_REFRESH_TOKEN
  })

  try {
    const response = await fetch('https://secure.meetup.com/oauth2/access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Token refresh failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✓ Access token refreshed successfully')
    
    return data.access_token
  } catch (error) {
    console.error('✗ Error refreshing access token:', error.message)
    throw error
  }
}

// Fetch events from Meetup GraphQL API
async function fetchEvents(accessToken) {
  console.log(`→ Fetching events for group: ${MEETUP_GROUP_URLNAME}`)

  const query = `
    query {
      groupByUrlname(urlname: "${MEETUP_GROUP_URLNAME}") {
        id
        name
        events(input: { first: 10 }) {
          edges {
            node {
              id
              title
              description
              eventUrl
              dateTime
              endTime
              duration
              venue {
                name
                address
                city
                state
              }
            }
          }
        }
      }
    }
  `

  try {
    const response = await fetch('https://api.meetup.com/gql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GraphQL query failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
    }

    if (!data.data || !data.data.groupByUrlname) {
      throw new Error('Invalid response structure from Meetup API')
    }

    console.log('✓ Events fetched successfully')
    return data.data.groupByUrlname.events
  } catch (error) {
    console.error('✗ Error fetching events:', error.message)
    throw error
  }
}

// Transform Meetup API response to our Event interface
function transformEvents(meetupEvents) {
  if (!meetupEvents || !meetupEvents.edges) {
    return []
  }

  return meetupEvents.edges
    .map(edge => edge.node)
    .filter(event => {
      // Filter out past events
      const eventDate = new Date(event.dateTime)
      return eventDate > new Date()
    })
    .map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || '',
      dateTime: event.dateTime,
      duration: event.duration || 120, // Default to 2 hours if not specified
      venue: event.venue ? {
        name: event.venue.name || '',
        address: event.venue.address || '',
        city: event.venue.city || '',
        state: event.venue.state || ''
      } : null,
      link: event.eventUrl
    }))
}

// Write events to JSON file
function writeEventsToFile(events) {
  const outputData = {
    events,
    lastUpdated: new Date().toISOString()
  }

  ensureDirectoryExists(OUTPUT_FILE)
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2))
  console.log(`✓ Wrote ${events.length} events to ${OUTPUT_FILE}`)
}

// Main execution
async function main() {
  console.log('='.repeat(60))
  console.log('Meetup Events Fetcher')
  console.log('='.repeat(60))

  try {
    // Step 1: Refresh access token
    const accessToken = await refreshAccessToken()

    // Step 2: Fetch events from Meetup API
    const meetupEvents = await fetchEvents(accessToken)

    // Step 3: Transform events to our format
    const transformedEvents = transformEvents(meetupEvents)
    console.log(`✓ Transformed ${transformedEvents.length} upcoming events`)

    // Step 4: Write to file
    writeEventsToFile(transformedEvents)

    console.log('='.repeat(60))
    console.log('✓ Success! Events file updated')
    console.log('='.repeat(60))
    process.exit(0)
  } catch (error) {
    console.error('='.repeat(60))
    console.error('✗ Error:', error.message)
    console.error('='.repeat(60))
    console.error('Creating fallback empty events file...')
    
    // Create fallback file on error
    createFallbackJSON()
    
    // Exit with warning code (not failure, since we created fallback)
    console.log('⚠ Build will continue with empty events')
    process.exit(0)
  }
}

// Run the script
main()
