import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import * as fc from 'fast-check'
import EventList from './EventList'

/**
 * Feature: code-coffee-kc-website, Property 2: Event data persistence
 * 
 * For any successful API fetch, all event data written to the Static JSON 
 * should be readable by the React application without data loss or corruption
 * 
 * Validates: Requirements 2.4
 */

// Custom arbitraries for generating valid event data
const venueArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  address: fc.string({ minLength: 1, maxLength: 200 }),
  city: fc.string({ minLength: 1, maxLength: 50 }),
  state: fc.constantFrom('KS', 'MO', 'CA', 'NY', 'TX')
})

const eventArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 500 }), { nil: null }),
  dateTime: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
  duration: fc.integer({ min: 30, max: 480 }),
  venue: fc.option(venueArbitrary, { nil: null }),
  link: fc.option(fc.webUrl(), { nil: null })
})

const eventsDataArbitrary = fc.record({
  events: fc.array(eventArbitrary, { minLength: 0, maxLength: 10 }),
  lastUpdated: fc.date().map(d => d.toISOString())
})

describe('EventList - Property-Based Tests', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('Property 2: Event data persistence - all event data is readable without data loss', async () => {
    await fc.assert(
      fc.asyncProperty(eventsDataArbitrary, async (eventsData) => {
        // Mock fetch to return the generated events data
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => eventsData
        })

        render(<EventList />)

        // Wait for loading to complete
        await waitFor(() => {
          expect(screen.queryByText(/Loading events/i)).not.toBeInTheDocument()
        })

        // Verify all events are rendered
        if (eventsData.events.length === 0) {
          // Should show empty state
          expect(screen.getByText(/No Upcoming Events/i)).toBeInTheDocument()
        } else {
          // Should show all event titles
          eventsData.events.forEach(event => {
            expect(screen.getByText(event.title)).toBeInTheDocument()
          })

          // Verify the correct number of events are rendered
          const eventCards = screen.getAllByRole('article')
          expect(eventCards).toHaveLength(eventsData.events.length)
        }

        // Verify fetch was called with correct URL
        expect(global.fetch).toHaveBeenCalledWith('/data/events.json')
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    )
  })

  it('Property 2: Event data structure validation', async () => {
    await fc.assert(
      fc.asyncProperty(eventsDataArbitrary, async (eventsData) => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => eventsData
        })

        render(<EventList />)

        await waitFor(() => {
          expect(screen.queryByText(/Loading events/i)).not.toBeInTheDocument()
        })

        // Verify that the component handles the data structure correctly
        // No errors should be thrown during rendering
        expect(screen.queryByText(/Unable to load events/i)).not.toBeInTheDocument()
      }),
      { numRuns: 100 }
    )
  })

  it('Property 2: No runtime API calls to Meetup - only reads from static JSON', async () => {
    await fc.assert(
      fc.asyncProperty(eventsDataArbitrary, async (eventsData) => {
        const fetchSpy = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => eventsData
        })
        global.fetch = fetchSpy

        render(<EventList />)

        await waitFor(() => {
          expect(screen.queryByText(/Loading events/i)).not.toBeInTheDocument()
        })

        // Verify fetch was called exactly once
        expect(fetchSpy).toHaveBeenCalledTimes(1)
        
        // Verify it only called the static JSON endpoint, not Meetup API
        expect(fetchSpy).toHaveBeenCalledWith('/data/events.json')
        expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('meetup.com'))
        expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('api.meetup.com'))
      }),
      { numRuns: 100 }
    )
  })
})


/**
 * Unit Tests for Empty State Handling
 * Validates: Requirements 2.3
 */
describe('EventList - Empty State Unit Tests', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('displays empty state message when events array is empty', async () => {
    // Mock fetch to return empty events array
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        events: [],
        lastUpdated: new Date().toISOString()
      })
    })

    render(<EventList />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading events/i)).not.toBeInTheDocument()
    })

    // Verify empty state message is displayed
    expect(screen.getByText(/No Upcoming Events/i)).toBeInTheDocument()
    expect(screen.getByText(/We don't have any events scheduled at the moment/i)).toBeInTheDocument()
    
    // Verify no event cards are rendered
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('does not display empty state when events exist', async () => {
    // Mock fetch to return events
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        events: [
          {
            id: '1',
            title: 'Test Event',
            dateTime: new Date().toISOString(),
            duration: 120,
            venue: { name: 'Test Venue', address: '123 Main St', city: 'Kansas City', state: 'MO' },
            link: 'https://meetup.com/test'
          }
        ],
        lastUpdated: new Date().toISOString()
      })
    })

    render(<EventList />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading events/i)).not.toBeInTheDocument()
    })

    // Verify empty state is NOT displayed
    expect(screen.queryByText(/No Upcoming Events/i)).not.toBeInTheDocument()
    
    // Verify event is displayed
    expect(screen.getByText('Test Event')).toBeInTheDocument()
  })

  it('displays error state when fetch fails', async () => {
    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<EventList />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading events/i)).not.toBeInTheDocument()
    })

    // Verify error state is displayed
    expect(screen.getByText(/Unable to load events/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
  })

  it('displays error state when JSON is invalid', async () => {
    // Mock fetch to return invalid JSON structure
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ invalid: 'structure' })
    })

    render(<EventList />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading events/i)).not.toBeInTheDocument()
    })

    // Verify error state is displayed
    expect(screen.getByText(/Unable to load events/i)).toBeInTheDocument()
  })
})
