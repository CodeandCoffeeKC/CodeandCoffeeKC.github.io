# Code & Coffee KC Website

Welcome to the Code and Coffee Kansas City website repository! This is a static React website built with Vite that showcases our local developer community and displays upcoming meetup events.

## 🎯 Project Overview

This website is designed to be:
- **Simple**: Easy for entry-level developers to understand and contribute to
- **Static**: No backend required - deploys to GitHub Pages
- **Automated**: Events are fetched from Meetup API during build time
- **Maintainable**: Clean code structure with centralized styling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/code-coffee-kc-website.git
   cd code-coffee-kc-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the URL shown in your terminal)

The development server includes hot module replacement, so changes you make will appear instantly in the browser!

## 📁 Project Structure

```
code-coffee-kc-website/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── public/
│   └── data/
│       └── events.json         # Generated events data (static)
├── scripts/
│   └── fetch-events.js         # Meetup API fetcher script
├── src/
│   ├── components/             # Reusable React components
│   │   ├── Layout.jsx          # Page layout with header/footer
│   │   ├── EventList.jsx       # Events list container
│   │   └── EventCard.jsx       # Individual event display
│   ├── pages/                  # Page components
│   │   ├── HomePage.jsx        # Main landing page
│   │   └── AboutPage.jsx       # About page
│   ├── styles/                 # Global styles
│   │   ├── variables.css       # CSS custom properties (theme)
│   │   └── global.css          # Global styles and resets
│   ├── App.jsx                 # Root component with routing
│   └── main.jsx                # Application entry point
├── index.html                  # HTML template
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite configuration
└── README.md                   # This file!
```

## 🎨 Customizing Styles

All styling is centralized using CSS custom properties (variables). To change the theme:

1. Open `src/styles/variables.css`
2. Modify the CSS variables:

```css
:root {
  --color-primary: #2c5f2d;      /* Main brand color */
  --color-secondary: #97c1a9;    /* Secondary color */
  --spacing-unit: 8px;            /* Base spacing unit */
  --font-family-base: ...;        /* Font family */
  /* ... and many more! */
}
```

All components use these variables, so changes propagate throughout the entire site automatically.

## ✏️ Updating Content

### Placeholder Text

The site currently uses placeholder (lorem ipsum) text that should be replaced with real content:

1. **Home Page**: Edit `src/pages/HomePage.jsx`
   - Update the hero section
   - Replace "About Our Community" section
   - Replace "Part of a National Movement" section

2. **About Page**: Edit `src/pages/AboutPage.jsx`
   - Replace all section content
   - Add real contact information

Look for comments in the code that say `[Content to be replaced]` or lorem ipsum text.

## 🔌 Meetup API Integration

### How It Works

1. During the build process, `scripts/fetch-events.js` runs
2. It uses OAuth 2.0 to authenticate with Meetup API
3. It fetches upcoming events for the "code-and-coffee-kc" group
4. Events are written to `public/data/events.json`
5. The React app reads from this static JSON file (no runtime API calls!)

### Getting Meetup API Credentials

1. **Create a Meetup OAuth Consumer**
   - Go to https://secure.meetup.com/meetup_api/oauth_consumers/
   - Click "Create New Consumer"
   - Fill in the required information
   - Set redirect URI to `https://example.com/meetup-callback` (for testing)
   - Save your `client_id` and `client_secret`

2. **Get Initial Refresh Token**
   
   You need to perform the OAuth flow once to get a refresh token:

   a. Open this URL in your browser (replace `YOUR_CLIENT_ID`):
   ```
   https://secure.meetup.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://example.com/meetup-callback
   ```

   b. Authorize the application

   c. You'll be redirected to a URL like:
   ```
   https://example.com/meetup-callback?code=AUTHORIZATION_CODE
   ```
   Copy the `code` parameter value

   d. Exchange the code for tokens using curl or Postman:
   ```bash
   curl -X POST https://secure.meetup.com/oauth2/access \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "grant_type=authorization_code" \
     -d "redirect_uri=https://example.com/meetup-callback" \
     -d "code=AUTHORIZATION_CODE"
   ```

   e. Save the `refresh_token` from the response (it's long-lived, ~1 year)

3. **Configure GitHub Secrets**
   
   In your GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Add three secrets:
     - `MEETUP_CLIENT_ID`: Your OAuth client ID
     - `MEETUP_CLIENT_SECRET`: Your OAuth client secret
     - `MEETUP_REFRESH_TOKEN`: Your refresh token

### Testing Locally

To test the fetch script locally:

1. Create a `.env.local` file:
   ```
   MEETUP_CLIENT_ID=your_client_id
   MEETUP_CLIENT_SECRET=your_client_secret
   MEETUP_REFRESH_TOKEN=your_refresh_token
   ```

2. Run the fetch script:
   ```bash
   npm run fetch-events
   ```

3. Check `public/data/events.json` for the fetched events

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Coverage

The project includes:
- **Property-based tests** using fast-check (100+ iterations each)
- **Unit tests** for components and utilities
- **Integration tests** for the fetch script

Tests validate:
- Navigation routing consistency
- Event display completeness
- Event data persistence
- JSON structure consistency
- Build process idempotency
- API failure handling

## 🚢 Deployment

### Automatic Deployment

The site automatically deploys to GitHub Pages when you push to the `main` branch:

1. Push your changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. GitHub Actions will:
   - Install dependencies
   - Fetch events from Meetup API
   - Build the React app
   - Deploy to GitHub Pages

3. Your site will be live at:
   ```
   https://YOUR_USERNAME.github.io/code-coffee-kc-website/
   ```

### Manual Deployment

You can also trigger deployment manually:
1. Go to the "Actions" tab in GitHub
2. Select "Deploy to GitHub Pages"
3. Click "Run workflow"

### First-Time Setup

1. Go to repository Settings → Pages
2. Under "Source", select "GitHub Actions"
3. Save the settings

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run fetch-events` - Fetch events from Meetup API

## 🤝 Contributing

We welcome contributions from developers of all skill levels!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test your changes**
   ```bash
   npm test
   npm run dev
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add: description of your changes"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**

### Code Style

- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing code structure
- Use CSS variables for styling
- Write tests for new features

## 📚 Learning Resources

New to React or web development? Here are some helpful resources:

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS Custom Properties Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

## 🐛 Troubleshooting

### Development server won't start
- Make sure you've run `npm install`
- Check that port 5173 isn't already in use
- Try deleting `node_modules` and running `npm install` again

### Events not loading
- Check that `public/data/events.json` exists
- Verify the JSON structure is valid
- Check browser console for errors

### Build fails
- Ensure all dependencies are installed
- Check for syntax errors in your code
- Review the error message in the terminal

### GitHub Actions deployment fails
- Verify GitHub secrets are set correctly
- Check the Actions tab for detailed error logs
- Ensure the Meetup API credentials are valid

## 📄 License

This project is open source and available under the MIT License.

## 💬 Questions or Issues?

- Open an issue on GitHub
- Reach out at a Code & Coffee meetup
- Check our Meetup page: https://www.meetup.com/code-and-coffee-kc/

---

**Happy Coding! ☕️💻**
