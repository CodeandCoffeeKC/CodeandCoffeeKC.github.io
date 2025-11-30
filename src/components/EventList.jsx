import React, { useState, useEffect } from 'react'
import EventCard from './EventCard'
import './EventList.css'

/**
 * EventList Component
 * Loads and displays a list of upcoming events from static JSON
 */
function EventList() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch events from static JSON file
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/data/events.json')
        
        if (!response.ok) {
          throw new Error(`Failed to load events: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Validate data structure
        if (!data || !Array.isArray(data.events)) {
          throw new Error('Invalid events data format')
        }
        
        setEvents(data.events)
      } catch (err) {
        console.error('Error loading events:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="event-list">
        <div className="event-list-loading">
          <div className="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="event-list">
        <div className="event-list-error">
          <p className="error-message">Unable to load events at this time.</p>
          <p className="error-detail">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="event-list">
        <div className="event-list-empty">
          <h3>No Upcoming Events</h3>
          <p>
            We don't have any events scheduled at the moment. Check back soon or 
            follow us on social media for updates!
          </p>
        </div>
      </div>
    )
  }

  // Events list
  return (
    <div className="event-list">
      <h2 className="event-list-title">Upcoming Events</h2>
      <div className="event-list-items">
        {events.map((event) => (
          <EventCard key={event.id} {...event} />
        ))}
      </div>
    </div>
  )
}

export default EventList
