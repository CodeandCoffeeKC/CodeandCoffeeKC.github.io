# Design Document

## Overview

The Code and Coffee KC website is a static React application built with Vite that showcases the local Kansas City chapter and displays upcoming meetup events. The architecture separates concerns into three main areas: a build-time data fetching script, a React frontend application, and a GitHub Actions deployment pipeline. This design prioritizes simplicity and maintainability for entry-level developers while securely handling API credentials through GitHub's CI/CD infrastructure.

## Architecture

The system follows a static site generation pattern with build-time data fetching:

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions Runner                    │
│                                                               │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │  Fetch Script    │────────>│   Meetup API            │  │
│  │  (Node.js)       │<────────│   (External Service)    │  │
│  └────────┬─────────┘         └─────────────────────────┘  │
│           │                                                   │
│           │ writes                                            │
│           ▼                                                   │
│  ┌──────────────────┐                                        │
│  │  events.json     │                                        │
│  │  (Static Data)   │                                        │
│  └────────┬─────────┘                                        │
│           │                                                   │
│           │ included in build                                │
│           ▼                                                   │
│  ┌──────────────────┐                                        │
│  │  Vite Build      │                                        │
│  │  (React App)     │                                        │
│  └────────┬─────────┘                                        │
│           │                                                   │
│           │ produces                                          │
│           ▼                                                   │
│  ┌──────────────────┐                                        │
│  │  dist/           │────────> GitHub Pages                  │
│  │  (Static Assets) │                                        │
│  └──────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘

                              │
                              │ serves
                              ▼
                    ┌──────────────────┐
                    │   Visitor's      │
                    │   Browser        │
                    └──────────────────┘
```

### Key Architectural Decisions

1. **Build-time API calls**: Meetup API is called during GitHub Actions build, not at runtime, eliminating the need for a backend service
2. **Static JSON storage**: Event data is stored as a static file that ships with the application
3. **Vite for tooling**: Modern, fast build tool with excellent developer experience
4. **React Router for navigation**: Simple client-side routing for multi-page experience
5. **Component-based structure**: Reusable UI components following React best practices

## Components and Interfaces

### Build-Time Components

#### Fetch Script (`scripts/fetch-events.js`)
- **Purpose**: Retrieves event data from Meetup API during build using OAuth 2.0 flow
- **Inputs**: 
  - `MEETUP_CLIENT_ID` (environment variable)
  - `MEETUP_CLIENT_SECRET` (environment variable)
  - `MEETUP_REFRESH_TOKEN` (environment variable - long-lived token)
  - Meetup group urlname: "code-and-coffee-kc"
- **Outputs**: `public/data/events.json`
- **OAuth Flow**:
  1. Use refresh token to get new access token
  2. Make GraphQL query to Meetup API with access token
  3. Transform response to Event interface
  4. Write to JSON file
- **Error Handling**: Creates empty array JSON on failure

#### GitHub Actions Workflow (`.github/workflows/deploy.yml`)
- **Purpose**: Orchestrates build and deployment
- **Steps**:
  1. Checkout code
  2. Setup Node.js
  3. Install dependencies
  4. Run fetch script with secrets
  5. Build React app with Vite
  6. Deploy to GitHub Pages

### Frontend Components

#### App Component (`src/App.jsx`)
- **Purpose**: Root component with routing configuration
- **Responsibilities**:
  - Sets up React Router
  - Defines route structure
  - Provides consistent layout wrapper

#### Layout Component (`src/components/Layout.jsx`)
- **Purpose**: Consistent page structure and navigation
- **Responsibilities**:
  - Renders header with navigation
  - Renders footer
  - Wraps page content

#### HomePage Component (`src/pages/HomePage.jsx`)
- **Purpose**: Main landing page
- **Responsibilities**:
  - Displays group information with placeholder content
  - Shows connection to national organization with placeholder text
  - Renders EventList component
  - Uses lorem ipsum text that can be easily replaced later

#### EventList Component (`src/components/EventList.jsx`)
- **Purpose**: Displays upcoming events
- **Responsibilities**:
  - Loads events from static JSON
  - Renders EventCard for each event
  - Shows empty state when no events

#### EventCard Component (`src/components/EventCard.jsx`)
- **Purpose**: Individual event display
- **Props**:
  - `title`: string
  - `date`: string (ISO 8601 format)
  - `time`: string
  - `location`: string
  - `description`: string (optional)
- **Responsibilities**:
  - Formats and displays event details
  - Provides consistent event styling

#### AboutPage Component (`src/pages/AboutPage.jsx`)
- **Purpose**: Additional information page
- **Responsibilities**:
  - Displays detailed information about Code and Coffee KC with placeholder content
  - Provides contact or community information with lorem ipsum text
  - Content structured for easy replacement later

### Data Interfaces

#### Event Object
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  dateTime: string; // ISO 8601 format
  duration: number; // minutes
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
  };
  link: string; // URL to Meetup event page
}
```

#### Events JSON File (`public/data/events.json`)
```json
{
  "events": Event[],
  "lastUpdated": string // ISO 8601 timestamp
}
```

## Data Models

### Event Data Flow

1. **Fetch Phase** (Build-time):
   - Fetch script calls Meetup API
   - Transforms API response to Event interface
   - Writes to `public/data/events.json`

2. **Build Phase**:
   - Vite includes `events.json` in public assets
   - React app is compiled to static assets

3. **Runtime Phase**:
   - Browser loads React app
   - EventList component fetches `/data/events.json`
   - Events are rendered to DOM

### State Management

Given the simplicity of the application, React's built-in `useState` and `useEffect` hooks are sufficient:

- **EventList Component State**:
  - `events`: Event[] - loaded from JSON
  - `loading`: boolean - fetch status
  - `error`: string | null - error message

No global state management library (Redux, Zustand, etc.) is needed for this application.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Events JSON structure consistency
*For any* build execution, the generated `events.json` file should conform to the defined Events JSON schema with valid event objects and lastUpdated timestamp
**Validates: Requirements 3.2**

### Property 2: Event data persistence
*For any* successful API fetch, all event data written to the Static JSON should be readable by the React application without data loss or corruption
**Validates: Requirements 2.4**

### Property 3: Navigation routing consistency
*For any* navigation action between pages, the Website should update the URL and render the correct page component without losing application state
**Validates: Requirements 6.3**

### Property 4: Empty state handling
*For any* events.json file with an empty events array, the EventList component should render the empty state message instead of attempting to render event cards
**Validates: Requirements 2.3**

### Property 5: Event display completeness
*For any* valid event object in the events array, the rendered EventCard should display all required fields (title, date, time, location)
**Validates: Requirements 2.2**

### Property 6: Build process idempotency
*For any* given state of the repository, running the build process multiple times with the same Meetup API response should produce identical static assets
**Validates: Requirements 3.5**

### Property 7: API failure graceful degradation
*For any* Meetup API call failure during build, the build process should complete successfully and produce a valid events.json file (even if empty)
**Validates: Requirements 3.3**

## Error Handling

### Build-Time Errors

1. **Meetup API Failures**:
   - Network errors: Retry once, then create empty events.json
   - Authentication errors: Log error, create empty events.json, fail build with warning
   - Rate limiting: Log error, use cached data if available, otherwise empty array

2. **File System Errors**:
   - Cannot write events.json: Fail build with clear error message
   - Missing public directory: Create directory, then write file

### Runtime Errors

1. **Events JSON Loading**:
   - 404 Not Found: Display empty state message
   - Invalid JSON: Log error, display error message to user
   - Network error: Display retry button

2. **Routing Errors**:
   - Invalid route: Redirect to home page
   - Navigation failure: Log error, maintain current page

3. **Component Errors**:
   - Use React Error Boundaries to catch rendering errors
   - Display friendly error message
   - Provide fallback UI

## Testing Strategy

### Unit Testing

The application will use **Vitest** (Vite's native testing framework) for unit tests and **React Testing Library** for component testing.

**Unit Test Coverage**:
- Fetch script functions (API calling, data transformation, file writing)
- Event data parsing and validation
- Component rendering with various props
- Empty state and error state rendering
- Date formatting utilities
- Navigation behavior

**Example Unit Tests**:
- EventCard renders with all required fields
- EventList shows empty state when events array is empty
- Fetch script creates valid JSON structure
- Date formatting handles various ISO 8601 formats

### Property-Based Testing

The application will use **fast-check** for property-based testing in JavaScript/TypeScript.

**Configuration**:
- Each property test will run a minimum of 100 iterations
- Tests will use custom generators for Event objects and API responses

**Property Test Coverage**:
- Each correctness property listed above will have a corresponding property-based test
- Tests will be tagged with comments referencing the design document property

**Example Property Tests**:
- **Feature: code-coffee-kc-website, Property 1: Events JSON structure consistency** - Generate random API responses, verify output JSON schema
- **Feature: code-coffee-kc-website, Property 5: Event display completeness** - Generate random valid events, verify all fields appear in rendered output
- **Feature: code-coffee-kc-website, Property 7: API failure graceful degradation** - Generate various API error scenarios, verify build completes with valid JSON

### Integration Testing

- Test full build process locally
- Verify GitHub Actions workflow in test environment
- Test deployed site on GitHub Pages preview

### Testing Approach

1. **Implementation-first development**: Implement features before writing tests
2. **Complementary testing**: Unit tests verify specific examples, property tests verify universal behaviors
3. **Minimal test solutions**: Focus on core functionality and important edge cases
4. **Real functionality**: No mocks for core logic, only for external APIs in unit tests

## Development Workflow

### Local Development

1. Clone repository
2. Run `npm install`
3. (Optional) Create `.env.local` with Meetup credentials for testing fetch script:
   ```
   MEETUP_CLIENT_ID=your_client_id
   MEETUP_CLIENT_SECRET=your_client_secret
   MEETUP_REFRESH_TOKEN=your_refresh_token
   ```
4. Run `npm run dev` for development server (uses existing events.json)
5. Run `npm run fetch-events` to test event fetching locally
6. Run `npm run build` to test production build

### Deployment Workflow

1. Push to main branch
2. GitHub Actions triggers
3. Fetch script runs with secrets
4. Vite builds application
5. Deploy to GitHub Pages
6. Site available at `https://[username].github.io/[repo-name]`

## Styling Architecture

The application uses a centralized styling approach for easy theme customization:

### CSS Variables (`src/styles/variables.css`)
- Define all colors, spacing, typography, and breakpoints as CSS custom properties
- Single source of truth for design tokens
- Easy to update theme by changing variable values

### Global Styles (`src/styles/global.css`)
- Base styles and resets
- Typography defaults
- Common utility classes

### Component Styles
- Each component has its own CSS file (e.g., `EventCard.css`)
- Uses CSS variables for consistency
- Scoped to component to avoid conflicts

### Example Structure:
```css
/* variables.css */
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --spacing-unit: 8px;
  --font-family: 'Inter', sans-serif;
}

/* Component uses variables */
.event-card {
  padding: calc(var(--spacing-unit) * 2);
  color: var(--color-primary);
}
```

## Meetup API Integration

### OAuth 2.0 Flow

The Meetup API uses OAuth 2.0 with a GraphQL endpoint. The implementation follows this pattern:

#### Initial Setup (One-time, Manual)
1. Create OAuth client at Meetup.com
2. Get `client_id` and `client_secret`
3. Perform authorization flow to get initial `refresh_token`
4. Store `refresh_token` in GitHub Secrets (long-lived, ~1 year)

#### Build-Time Flow (Automated)
1. **Refresh Access Token**:
   ```
   POST https://secure.meetup.com/oauth2/access
   Body: {
     client_id: <MEETUP_CLIENT_ID>,
     client_secret: <MEETUP_CLIENT_SECRET>,
     grant_type: "refresh_token",
     refresh_token: <MEETUP_REFRESH_TOKEN>
   }
   Response: { access_token, refresh_token, expires_in }
   ```

2. **Query Events via GraphQL**:
   ```
   POST https://api.meetup.com/gql
   Headers: { Authorization: "Bearer <access_token>" }
   Body: {
     query: `
       query {
         groupByUrlname(urlname: "code-and-coffee-kc") {
           id
           name
           events {
             edges {
               node {
                 id
                 title
                 description
                 eventUrl
                 dateTime
                 endTime
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
   }
   ```

3. **Transform and Save**:
   - Extract events from GraphQL response
   - Map to Event interface
   - Write to `public/data/events.json`

### Fetch Script Implementation Details

The `scripts/fetch-events.js` will:
- Use `node-fetch` or native `fetch` for HTTP requests
- Implement retry logic for token refresh
- Handle GraphQL errors gracefully
- Log detailed information for debugging
- Create fallback empty JSON on any failure

### GitHub Secrets Configuration

Required secrets in repository settings:
- `MEETUP_CLIENT_ID`: OAuth client ID
- `MEETUP_CLIENT_SECRET`: OAuth client secret
- `MEETUP_REFRESH_TOKEN`: Long-lived refresh token from initial auth

## Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Routing**: React Router 6
- **Styling**: Plain CSS with CSS Variables (centralized theming)
- **Testing**: Vitest + React Testing Library + fast-check
- **Deployment**: GitHub Pages via GitHub Actions
- **API**: Meetup GraphQL API with OAuth 2.0
- **HTTP Client**: node-fetch (for fetch script)

## File Structure

```
code-coffee-kc-website/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
│   └── data/
│       └── events.json (generated)
├── scripts/
│   └── fetch-events.js
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── Layout.css
│   │   ├── EventList.jsx
│   │   ├── EventList.css
│   │   ├── EventCard.jsx
│   │   └── EventCard.css
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── HomePage.css
│   │   ├── AboutPage.jsx
│   │   └── AboutPage.css
│   ├── styles/
│   │   ├── variables.css
│   │   └── global.css
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

This structure is intentionally flat and simple to help entry-level developers navigate the codebase easily.
