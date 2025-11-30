import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { lookupVenue } from './venue-database.js'

// Load environment variables from .env file
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Meetup API Event Fetcher
 * 
 * This script fetches events from the Meetup GraphQL API using a refresh token
 * that automatically renews the access token. No user intervention needed!
 * 
 * Required Environment Variables:
 * - MEETUP_CLIENT_ID: OAuth client ID
 * - MEETUP_CLIENT_SECRET: OAuth client secret  
 * - MEETUP_REFRESH_TOKEN: Long-lived refresh token (get once, use forever)
 * 
 * The refresh token is long-lived (~1 year) and automatically gets you a new
 * access token each time the script runs. You only need to authorize once!
 */

const MEETUP_GROUP_URLNAME = 'code-and-coffee-kc'
const OUTPUT_FILE = path.join(__dirname, '../public/data/events.json')

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`✓ Created directory: ${dir}`)
  }
}

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

// Get access token using refresh token (with automatic token rotation)
async function getAccessToken() {
  const { MEETUP_CLIENT_ID, MEETUP_CLIENT_SECRET } = process.env
  const REFRESH_TOKEN_FILE = path.join(__dirname, '../.meetup-refresh-token')

  if (!MEETUP_CLIENT_ID || !MEETUP_CLIENT_SECRET) {
    throw new Error('Missing required environment variables: MEETUP_CLIENT_ID, MEETUP_CLIENT_SECRET')
  }

  // Read current refresh token from file
  let refreshToken
  try {
    refreshToken = fs.readFileSync(REFRESH_TOKEN_FILE, 'utf8').trim()
    console.log('→ Read refresh token from file')
  } catch (error) {
    throw new Error(`Could not read refresh token from ${REFRESH_TOKEN_FILE}: ${error.message}`)
  }

  console.log('→ Refreshing access token...')

  const params = new URLSearchParams({
    client_id: MEETUP_CLIENT_ID,
    client_secret: MEETUP_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  })

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
  console.log('✓ Got fresh access token')
  
  // Save new refresh token to file (Meetup uses token rotation)
  if (data.refresh_token) {
    fs.writeFileSync(REFRESH_TOKEN_FILE, data.refresh_token)
    console.log('✓ Saved new refresh token to file')
  }
  
  return data.access_token
}

async function fetchEvents(accessToken) {
  console.log(`→ Fetching events for group: ${MEETUP_GROUP_URLNAME}`)

  const query = `
    query {
      groupByUrlname(urlname: "${MEETUP_GROUP_URLNAME}") {
        id
        name
        events {
          totalCount
          edges {
            node {
              id
              title
              description
              eventUrl
              dateTime
              endTime
              status
            }
          }
        }
      }
    }
  `

  const response = await fetch('https://api.meetup.com/gql-ext', {
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
}

function transformEvents(meetupEvents) {
  if (!meetupEvents || !meetupEvents.edges) {
    return []
  }

  return meetupEvents.edges
    .map(edge => edge.node)
    .filter(event => {
      // Filter out past events and inactive events
      const eventDate = new Date(event.dateTime)
      return eventDate > new Date() && event.status === 'ACTIVE'
    })
    .map(event => {
      // Calculate duration from dateTime and endTime
      const start = new Date(event.dateTime)
      const end = new Date(event.endTime)
      const durationMinutes = Math.round((end - start) / (1000 * 60))
      
      // Extract venue from title if it follows pattern "Event at Location"
      let venue = null
      const atMatch = event.title.match(/\sat\s(.+)$/i)
      if (atMatch) {
        const venueName = atMatch[1].trim()
        // Look up venue details from database
        venue = lookupVenue(venueName)
      }
      
      return {
        id: event.id,
        title: event.title,
        description: event.description || '',
        dateTime: event.dateTime,
        duration: durationMinutes,
        venue: venue,
        link: event.eventUrl
      }
    })
}

function writeEventsToFile(events) {
  const outputData = {
    events,
    lastUpdated: new Date().toISOString()
  }

  ensureDirectoryExists(OUTPUT_FILE)
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2))
  console.log(`✓ Wrote ${events.length} events to ${OUTPUT_FILE}`)
}

async function main() {
  console.log('='.repeat(60))
  console.log('Meetup Events Fetcher')
  console.log('='.repeat(60))

  try {
    // Step 1: Auto-refresh to get fresh access token
    const accessToken = await getAccessToken()

    // Step 2: Fetch events
    const meetupEvents = await fetchEvents(accessToken)

    // Step 3: Transform events
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
    
    createFallbackJSON()
    
    console.log('⚠ Build will continue with empty events')
    process.exit(0)
  }
}

main()
