import React from 'react'
import './EventCard.css'

/**
 * EventCard Component
 * Displays individual event details including title, date, time, location, and description
 */
function EventCard({ title, dateTime, duration, venue, description, link }) {
  // Format the date and time from ISO 8601 format
  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Format location from venue object
  const formatLocation = (venue) => {
    if (!venue) return 'Location TBA'
    
    const parts = []
    if (venue.name) parts.push(venue.name)
    if (venue.address) parts.push(venue.address)
    if (venue.city && venue.state) parts.push(`${venue.city}, ${venue.state}`)
    
    return parts.length > 0 ? parts.join(', ') : 'Location TBA'
  }

  // Generate Google Maps link if coordinates are available
  const getMapLink = (venue) => {
    if (!venue) return null
    
    if (venue.lat && venue.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`
    }
    
    // Fallback to address search if no coordinates
    if (venue.address && venue.city && venue.state) {
      const query = encodeURIComponent(`${venue.address}, ${venue.city}, ${venue.state}`)
      return `https://www.google.com/maps/search/?api=1&query=${query}`
    }
    
    // Fallback to venue name search
    if (venue.name) {
      const query = encodeURIComponent(venue.name)
      return `https://www.google.com/maps/search/?api=1&query=${query}`
    }
    
    return null
  }

  const mapLink = getMapLink(venue)

  return (
    <article className="event-card">
      <div className="event-card-header">
        <h3 className="event-title">{title}</h3>
      </div>
      
      <div className="event-card-body">
        <div className="event-detail">
          <span className="event-detail-label">Date:</span>
          <span className="event-detail-value">{formatDate(dateTime)}</span>
        </div>
        
        <div className="event-detail">
          <span className="event-detail-label">Time:</span>
          <span className="event-detail-value">{formatTime(dateTime)}</span>
        </div>
        
        <div className="event-detail">
          <span className="event-detail-label">Location:</span>
          <span className="event-detail-value">
            {formatLocation(venue)}
            {mapLink && (
              <a 
                href={mapLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="map-link"
                style={{ marginLeft: '8px', fontSize: '0.9em' }}
              >
                📍 Map
              </a>
            )}
          </span>
        </div>
        
        {description && (
          <div className="event-description">
            <p>{description}</p>
          </div>
        )}
      </div>
      
      {link && (
        <div className="event-card-footer">
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="event-link"
          >
            View on Meetup →
          </a>
        </div>
      )}
    </article>
  )
}

export default EventCard
