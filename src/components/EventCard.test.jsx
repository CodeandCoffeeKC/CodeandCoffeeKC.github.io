import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as fc from 'fast-check'
import EventCard from './EventCard'

/**
 * Feature: code-coffee-kc-website, Property 5: Event display completeness
 * 
 * For any valid event object in the events array, the rendered EventCard 
 * should display all required fields (title, date, time, location)
 * 
 * Validates: Requirements 2.2
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

describe('EventCard - Property-Based Tests', () => {
  it('Property 5: Event display completeness - all required fields are displayed', () => {
    fc.assert(
      fc.property(eventArbitrary, (event) => {
        render(<EventCard {...event} />)

        // Verify title is displayed
        expect(screen.getByText(event.title)).toBeInTheDocument()

        // Verify date is displayed (check for "Date:" label)
        expect(screen.getByText(/Date:/i)).toBeInTheDocument()
        
        // Verify time is displayed (check for "Time:" label)
        expect(screen.getByText(/Time:/i)).toBeInTheDocument()
        
        // Verify location is displayed (check for "Location:" label)
        expect(screen.getByText(/Location:/i)).toBeInTheDocument()

        // If venue exists, verify location details are shown
        if (event.venue) {
          if (event.venue.name) {
            expect(screen.getByText(new RegExp(event.venue.name, 'i'))).toBeInTheDocument()
          }
          if (event.venue.city && event.venue.state) {
            expect(screen.getByText(new RegExp(`${event.venue.city}, ${event.venue.state}`, 'i'))).toBeInTheDocument()
          }
        } else {
          // If no venue, should show "Location TBA"
          expect(screen.getByText(/Location TBA/i)).toBeInTheDocument()
        }

        // If description exists, verify it's displayed
        if (event.description) {
          expect(screen.getByText(event.description)).toBeInTheDocument()
        }

        // If link exists, verify it's displayed
        if (event.link) {
          const linkElement = screen.getByRole('link', { name: /View on Meetup/i })
          expect(linkElement).toBeInTheDocument()
          expect(linkElement).toHaveAttribute('href', event.link)
          expect(linkElement).toHaveAttribute('target', '_blank')
          expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer')
        }
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    )
  })

  it('Property 5: Date and time formatting is consistent', () => {
    fc.assert(
      fc.property(eventArbitrary, (event) => {
        render(<EventCard {...event} />)

        // Verify date is formatted (should contain month name or day of week)
        const dateElement = screen.getByText(/Date:/i).parentElement
        expect(dateElement.textContent).toMatch(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/)

        // Verify time is formatted (should contain AM or PM)
        const timeElement = screen.getByText(/Time:/i).parentElement
        expect(timeElement.textContent).toMatch(/(AM|PM)/i)
      }),
      { numRuns: 100 }
    )
  })

  it('Property 5: EventCard renders as an article element', () => {
    fc.assert(
      fc.property(eventArbitrary, (event) => {
        const { container } = render(<EventCard {...event} />)
        
        // Verify the component renders as an article (semantic HTML)
        const article = container.querySelector('article')
        expect(article).toBeInTheDocument()
        expect(article).toHaveClass('event-card')
      }),
      { numRuns: 100 }
    )
  })
})
