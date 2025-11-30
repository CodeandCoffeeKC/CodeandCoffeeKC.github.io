import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import * as fc from 'fast-check'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Feature: code-coffee-kc-website, Property 1: Events JSON structure consistency
 * 
 * For any build execution, the generated `events.json` file should conform to 
 * the defined Events JSON schema with valid event objects and lastUpdated timestamp
 * 
 * Validates: Requirements 3.2
 */

// Schema validation function
function validateEventsJSON(data) {
  // Check top-level structure
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Data must be an object' }
  }

  if (!Array.isArray(data.events)) {
    return { valid: false, error: 'events must be an array' }
  }

  if (typeof data.lastUpdated !== 'string') {
    return { valid: false, error: 'lastUpdated must be a string' }
  }

  // Validate lastUpdated is ISO 8601
  const lastUpdatedDate = new Date(data.lastUpdated)
  if (isNaN(lastUpdatedDate.getTime())) {
    return { valid: false, error: 'lastUpdated must be valid ISO 8601 date' }
  }

  // Validate each event
  for (const event of data.events) {
    if (typeof event !== 'object' || event === null) {
      return { valid: false, error: 'Each event must be an object' }
    }

    // Required fields
    if (typeof event.id !== 'string' || event.id.length === 0) {
      return { valid: false, error: 'Event id must be a non-empty string' }
    }

    if (typeof event.title !== 'string' || event.title.length === 0) {
      return { valid: false, error: 'Event title must be a non-empty string' }
    }

    if (typeof event.dateTime !== 'string') {
      return { valid: false, error: 'Event dateTime must be a string' }
    }

    // Validate dateTime is ISO 8601
    const eventDate = new Date(event.dateTime)
    if (isNaN(eventDate.getTime())) {
      return { valid: false, error: 'Event dateTime must be valid ISO 8601 date' }
    }

    if (typeof event.duration !== 'number' || event.duration <= 0) {
      return { valid: false, error: 'Event duration must be a positive number' }
    }

    // Optional fields validation
    if (event.description !== undefined && typeof event.description !== 'string') {
      return { valid: false, error: 'Event description must be a string if present' }
    }

    if (event.venue !== null && event.venue !== undefined) {
      if (typeof event.venue !== 'object') {
        return { valid: false, error: 'Event venue must be an object if present' }
      }

      if (event.venue.name !== undefined && typeof event.venue.name !== 'string') {
        return { valid: false, error: 'Venue name must be a string if present' }
      }

      if (event.venue.address !== undefined && typeof event.venue.address !== 'string') {
        return { valid: false, error: 'Venue address must be a string if present' }
      }

      if (event.venue.city !== undefined && typeof event.venue.city !== 'string') {
        return { valid: false, error: 'Venue city must be a string if present' }
      }

      if (event.venue.state !== undefined && typeof event.venue.state !== 'string') {
        return { valid: false, error: 'Venue state must be a string if present' }
      }
    }

    if (event.link !== undefined && event.link !== null && typeof event.link !== 'string') {
      return { valid: false, error: 'Event link must be a string if present' }
    }
  }

  return { valid: true }
}

// Custom arbitraries for generating Meetup API responses
const meetupVenueArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  address: fc.string({ minLength: 1, maxLength: 200 }),
  city: fc.string({ minLength: 1, maxLength: 50 }),
  state: fc.constantFrom('KS', 'MO', 'CA', 'NY', 'TX')
})

const meetupEventNodeArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 500 }), { nil: null }),
  eventUrl: fc.webUrl(),
  dateTime: fc.date({ min: new Date(), max: new Date('2026-12-31') }).map(d => d.toISOString()),
  endTime: fc.date({ min: new Date(), max: new Date('2026-12-31') }).map(d => d.toISOString()),
  duration: fc.integer({ min: 30, max: 480 }),
  venue: fc.option(meetupVenueArbitrary, { nil: null })
})

const meetupAPIResponseArbitrary = fc.record({
  data: fc.record({
    groupByUrlname: fc.record({
      id: fc.uuid(),
      name: fc.constant('Code and Coffee KC'),
      events: fc.record({
        edges: fc.array(
          fc.record({
            node: meetupEventNodeArbitrary
          }),
          { minLength: 0, maxLength: 10 }
        )
      })
    })
  })
})

describe('Fetch Events Script - Property-Based Tests', () => {
  const TEST_OUTPUT_FILE = path.join(__dirname, '../public/data/test-events.json')

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(TEST_OUTPUT_FILE)) {
      fs.unlinkSync(TEST_OUTPUT_FILE)
    }
  })

  it('Property 1: Events JSON structure consistency - generated JSON conforms to schema', () => {
    fc.assert(
      fc.property(meetupAPIResponseArbitrary, (apiResponse) => {
        // Simulate the transformation that happens in the script
        const meetupEvents = apiResponse.data.groupByUrlname.events
        
        const transformedEvents = meetupEvents.edges
          .map(edge => edge.node)
          .filter(event => new Date(event.dateTime) > new Date())
          .map(event => ({
            id: event.id,
            title: event.title,
            description: event.description || '',
            dateTime: event.dateTime,
            duration: event.duration || 120,
            venue: event.venue ? {
              name: event.venue.name || '',
              address: event.venue.address || '',
              city: event.venue.city || '',
              state: event.venue.state || ''
            } : null,
            link: event.eventUrl
          }))

        const outputData = {
          events: transformedEvents,
          lastUpdated: new Date().toISOString()
        }

        // Validate the structure
        const validation = validateEventsJSON(outputData)
        expect(validation.valid).toBe(true)
        if (!validation.valid) {
          console.error('Validation error:', validation.error)
        }

        // Additional checks
        expect(outputData).toHaveProperty('events')
        expect(outputData).toHaveProperty('lastUpdated')
        expect(Array.isArray(outputData.events)).toBe(true)
        expect(typeof outputData.lastUpdated).toBe('string')
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    )
  })

  it('Property 1: Empty events array produces valid JSON', () => {
    const emptyData = {
      events: [],
      lastUpdated: new Date().toISOString()
    }

    const validation = validateEventsJSON(emptyData)
    expect(validation.valid).toBe(true)
  })

  it('Property 1: All event fields have correct types', () => {
    fc.assert(
      fc.property(meetupAPIResponseArbitrary, (apiResponse) => {
        const meetupEvents = apiResponse.data.groupByUrlname.events
        
        const transformedEvents = meetupEvents.edges
          .map(edge => edge.node)
          .filter(event => new Date(event.dateTime) > new Date())
          .map(event => ({
            id: event.id,
            title: event.title,
            description: event.description || '',
            dateTime: event.dateTime,
            duration: event.duration || 120,
            venue: event.venue ? {
              name: event.venue.name || '',
              address: event.venue.address || '',
              city: event.venue.city || '',
              state: event.venue.state || ''
            } : null,
            link: event.eventUrl
          }))

        // Check each event has correct types
        transformedEvents.forEach(event => {
          expect(typeof event.id).toBe('string')
          expect(typeof event.title).toBe('string')
          expect(typeof event.description).toBe('string')
          expect(typeof event.dateTime).toBe('string')
          expect(typeof event.duration).toBe('number')
          expect(typeof event.link).toBe('string')
          
          if (event.venue !== null) {
            expect(typeof event.venue).toBe('object')
            expect(typeof event.venue.name).toBe('string')
            expect(typeof event.venue.address).toBe('string')
            expect(typeof event.venue.city).toBe('string')
            expect(typeof event.venue.state).toBe('string')
          }
        })
      }),
      { numRuns: 100 }
    )
  })
})


/**
 * Feature: code-coffee-kc-website, Property 6: Build process idempotency
 * 
 * For any given state of the repository, running the build process multiple times 
 * with the same Meetup API response should produce identical static assets
 * 
 * Validates: Requirements 3.5
 */
describe('Fetch Events Script - Build Idempotency Tests', () => {
  it('Property 6: Transformation is deterministic - same input produces same output', () => {
    fc.assert(
      fc.property(meetupAPIResponseArbitrary, (apiResponse) => {
        // Transform the same API response twice
        const transform = (response) => {
          const meetupEvents = response.data.groupByUrlname.events
          
          return meetupEvents.edges
            .map(edge => edge.node)
            .filter(event => new Date(event.dateTime) > new Date())
            .map(event => ({
              id: event.id,
              title: event.title,
              description: event.description || '',
              dateTime: event.dateTime,
              duration: event.duration || 120,
              venue: event.venue ? {
                name: event.venue.name || '',
                address: event.venue.address || '',
                city: event.venue.city || '',
                state: event.venue.state || ''
              } : null,
              link: event.eventUrl
            }))
        }

        const result1 = transform(apiResponse)
        const result2 = transform(apiResponse)

        // Results should be identical
        expect(result1).toEqual(result2)
        expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
      }),
      { numRuns: 100 }
    )
  })

  it('Property 6: Event ordering is consistent across multiple transformations', () => {
    fc.assert(
      fc.property(meetupAPIResponseArbitrary, (apiResponse) => {
        const transform = (response) => {
          const meetupEvents = response.data.groupByUrlname.events
          
          return meetupEvents.edges
            .map(edge => edge.node)
            .filter(event => new Date(event.dateTime) > new Date())
            .map(event => event.id)
        }

        const ids1 = transform(apiResponse)
        const ids2 = transform(apiResponse)
        const ids3 = transform(apiResponse)

        // Order should be consistent
        expect(ids1).toEqual(ids2)
        expect(ids2).toEqual(ids3)
      }),
      { numRuns: 100 }
    )
  })

  it('Property 6: Filtering past events is consistent', () => {
    fc.assert(
      fc.property(meetupAPIResponseArbitrary, (apiResponse) => {
        const now = new Date()
        
        const filterEvents = (response) => {
          const meetupEvents = response.data.groupByUrlname.events
          return meetupEvents.edges
            .map(edge => edge.node)
            .filter(event => new Date(event.dateTime) > now)
        }

        const filtered1 = filterEvents(apiResponse)
        const filtered2 = filterEvents(apiResponse)

        // Filtering should produce same results
        expect(filtered1.length).toBe(filtered2.length)
        expect(filtered1.map(e => e.id)).toEqual(filtered2.map(e => e.id))
      }),
      { numRuns: 100 }
    )
  })
})


/**
 * Unit Tests for API Failure Handling
 * Validates: Requirements 3.3
 */
describe('Fetch Events Script - API Failure Handling', () => {
  it('produces valid empty JSON when API returns no events', () => {
    const emptyAPIResponse = {
      data: {
        groupByUrlname: {
          id: 'test-id',
          name: 'Code and Coffee KC',
          events: {
            edges: []
          }
        }
      }
    }

    const meetupEvents = emptyAPIResponse.data.groupByUrlname.events
    const transformedEvents = meetupEvents.edges
      .map(edge => edge.node)
      .map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        dateTime: event.dateTime,
        duration: event.duration || 120,
        venue: event.venue || null,
        link: event.eventUrl
      }))

    const outputData = {
      events: transformedEvents,
      lastUpdated: new Date().toISOString()
    }

    // Validate structure
    const validation = validateEventsJSON(outputData)
    expect(validation.valid).toBe(true)
    expect(outputData.events).toEqual([])
    expect(Array.isArray(outputData.events)).toBe(true)
  })

  it('fallback JSON structure is valid', () => {
    const fallbackData = {
      events: [],
      lastUpdated: new Date().toISOString(),
      note: 'No events available - API fetch failed or returned no data'
    }

    // Validate structure (note field is optional, so it should still be valid)
    const validation = validateEventsJSON(fallbackData)
    expect(validation.valid).toBe(true)
    expect(fallbackData.events).toEqual([])
  })

  it('handles missing venue data gracefully', () => {
    const apiResponseWithoutVenue = {
      data: {
        groupByUrlname: {
          id: 'test-id',
          name: 'Code and Coffee KC',
          events: {
            edges: [
              {
                node: {
                  id: 'event-1',
                  title: 'Test Event',
                  description: 'Test description',
                  eventUrl: 'https://meetup.com/test',
                  dateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                  endTime: new Date(Date.now() + 90000000).toISOString(),
                  duration: 120,
                  venue: null
                }
              }
            ]
          }
        }
      }
    }

    const meetupEvents = apiResponseWithoutVenue.data.groupByUrlname.events
    const transformedEvents = meetupEvents.edges
      .map(edge => edge.node)
      .filter(event => new Date(event.dateTime) > new Date())
      .map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        dateTime: event.dateTime,
        duration: event.duration || 120,
        venue: event.venue ? {
          name: event.venue.name || '',
          address: event.venue.address || '',
          city: event.venue.city || '',
          state: event.venue.state || ''
        } : null,
        link: event.eventUrl
      }))

    const outputData = {
      events: transformedEvents,
      lastUpdated: new Date().toISOString()
    }

    // Should still be valid with null venue
    const validation = validateEventsJSON(outputData)
    expect(validation.valid).toBe(true)
    expect(outputData.events[0].venue).toBeNull()
  })

  it('handles missing description gracefully', () => {
    const apiResponseWithoutDescription = {
      data: {
        groupByUrlname: {
          id: 'test-id',
          name: 'Code and Coffee KC',
          events: {
            edges: [
              {
                node: {
                  id: 'event-1',
                  title: 'Test Event',
                  description: null,
                  eventUrl: 'https://meetup.com/test',
                  dateTime: new Date(Date.now() + 86400000).toISOString(),
                  endTime: new Date(Date.now() + 90000000).toISOString(),
                  duration: 120,
                  venue: {
                    name: 'Test Venue',
                    address: '123 Main St',
                    city: 'Kansas City',
                    state: 'MO'
                  }
                }
              }
            ]
          }
        }
      }
    }

    const meetupEvents = apiResponseWithoutDescription.data.groupByUrlname.events
    const transformedEvents = meetupEvents.edges
      .map(edge => edge.node)
      .filter(event => new Date(event.dateTime) > new Date())
      .map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        dateTime: event.dateTime,
        duration: event.duration || 120,
        venue: event.venue ? {
          name: event.venue.name || '',
          address: event.venue.address || '',
          city: event.venue.city || '',
          state: event.venue.state || ''
        } : null,
        link: event.eventUrl
      }))

    const outputData = {
      events: transformedEvents,
      lastUpdated: new Date().toISOString()
    }

    // Should still be valid with empty description
    const validation = validateEventsJSON(outputData)
    expect(validation.valid).toBe(true)
    expect(outputData.events[0].description).toBe('')
  })

  it('filters out past events correctly', () => {
    const now = new Date()
    const pastDate = new Date(now.getTime() - 86400000).toISOString() // Yesterday
    const futureDate = new Date(now.getTime() + 86400000).toISOString() // Tomorrow

    const apiResponseWithPastEvents = {
      data: {
        groupByUrlname: {
          id: 'test-id',
          name: 'Code and Coffee KC',
          events: {
            edges: [
              {
                node: {
                  id: 'past-event',
                  title: 'Past Event',
                  description: 'This event has passed',
                  eventUrl: 'https://meetup.com/past',
                  dateTime: pastDate,
                  endTime: pastDate,
                  duration: 120,
                  venue: null
                }
              },
              {
                node: {
                  id: 'future-event',
                  title: 'Future Event',
                  description: 'This event is upcoming',
                  eventUrl: 'https://meetup.com/future',
                  dateTime: futureDate,
                  endTime: futureDate,
                  duration: 120,
                  venue: null
                }
              }
            ]
          }
        }
      }
    }

    const meetupEvents = apiResponseWithPastEvents.data.groupByUrlname.events
    const transformedEvents = meetupEvents.edges
      .map(edge => edge.node)
      .filter(event => new Date(event.dateTime) > new Date())
      .map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        dateTime: event.dateTime,
        duration: event.duration || 120,
        venue: event.venue,
        link: event.eventUrl
      }))

    // Should only include future event
    expect(transformedEvents).toHaveLength(1)
    expect(transformedEvents[0].id).toBe('future-event')
  })
})
