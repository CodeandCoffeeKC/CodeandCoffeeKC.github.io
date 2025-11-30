import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import * as fc from 'fast-check'
import Layout from './Layout'

/**
 * Feature: code-coffee-kc-website, Property 3: Navigation routing consistency
 * 
 * For any navigation action between pages, the Website should update the URL 
 * and render the correct page component without losing application state
 * 
 * Validates: Requirements 6.3
 */

// Test pages for routing
const TestHomePage = () => <div data-testid="home-page">Home Page Content</div>
const TestAboutPage = () => <div data-testid="about-page">About Page Content</div>

describe('Layout Navigation - Property-Based Tests', () => {
  it('Property 3: Navigation routing consistency - navigating between pages updates URL and renders correct component', async () => {
    // Run property test with 100 iterations
    await fc.assert(
      fc.asyncProperty(
        // Generate a sequence of navigation actions
        fc.array(fc.constantFrom('/', '/about'), { minLength: 1, maxLength: 10 }),
        async (navigationSequence) => {
          const user = userEvent.setup()
          
          // Render the app with routing
          const { container } = render(
            <MemoryRouter initialEntries={['/']}>
              <Layout>
                <Routes>
                  <Route path="/" element={<TestHomePage />} />
                  <Route path="/about" element={<TestAboutPage />} />
                </Routes>
              </Layout>
            </MemoryRouter>
          )

          // Perform navigation sequence
          for (const targetPath of navigationSequence) {
            // Find and click the appropriate navigation link
            const linkText = targetPath === '/' ? 'Home' : 'About'
            const navLink = screen.getByRole('link', { name: linkText })
            
            await user.click(navLink)

            // Verify the correct page is rendered
            if (targetPath === '/') {
              expect(screen.getByTestId('home-page')).toBeInTheDocument()
              expect(screen.queryByTestId('about-page')).not.toBeInTheDocument()
            } else if (targetPath === '/about') {
              expect(screen.getByTestId('about-page')).toBeInTheDocument()
              expect(screen.queryByTestId('home-page')).not.toBeInTheDocument()
            }

            // Verify layout elements persist (header and footer remain)
            expect(screen.getByText(/Code & Coffee KC/i)).toBeInTheDocument()
            expect(screen.getByText(/Part of the national Code and Coffee community/i)).toBeInTheDocument()
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    )
  })

  it('Property 3: Navigation maintains layout structure across all routes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('/', '/about'),
        async (route) => {
          const user = userEvent.setup()
          
          render(
            <MemoryRouter initialEntries={[route]}>
              <Layout>
                <Routes>
                  <Route path="/" element={<TestHomePage />} />
                  <Route path="/about" element={<TestAboutPage />} />
                </Routes>
              </Layout>
            </MemoryRouter>
          )

          // Verify layout structure exists regardless of route
          expect(screen.getByRole('banner')).toBeInTheDocument() // header
          expect(screen.getByRole('main')).toBeInTheDocument() // main content
          expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
          
          // Verify navigation links are present
          expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument()
          expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument()
        }
      ),
      { numRuns: 100 }
    )
  })
})
