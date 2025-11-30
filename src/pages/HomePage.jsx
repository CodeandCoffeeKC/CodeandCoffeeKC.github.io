import React from 'react'
import EventList from '../components/EventList'
import './HomePage.css'

function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to Code & Coffee KC</h1>
        <p className="hero-subtitle">
          Kansas City's premier community for developers, designers, and tech enthusiasts
        </p>
      </section>

      <section className="about-section">
        <h2>About Our Community</h2>
        {/* TODO: Replace with real content about Code & Coffee KC */}
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
          fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in 
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </section>

      <section className="national-org-section">
        <h2>Part of a National Movement</h2>
        {/* TODO: Replace with real content about the national Code & Coffee organization */}
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Code and Coffee is a 
          national organization with chapters across the country. Sed do eiusmod tempor 
          incididunt ut labore et dolore magna aliqua.
        </p>
        <p>
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut 
          aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in 
          voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        </p>
      </section>

      <section className="events-section">
        <EventList />
      </section>
    </div>
  )
}

export default HomePage
