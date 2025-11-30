# Quick Setup Guide

## Before You Deploy

### 1. Update Repository Name References

Update the base path in two files to match your GitHub repository name:

**vite.config.js:**
```javascript
base: '/your-repo-name/', // Change this!
```

**src/App.jsx:**
```javascript
<Router basename="/your-repo-name"> {/* Change this! */}
```

### 2. Configure GitHub Secrets

Go to your repository Settings → Secrets and variables → Actions, and add:

- `MEETUP_CLIENT_ID`
- `MEETUP_CLIENT_SECRET`
- `MEETUP_REFRESH_TOKEN`

See README.md for detailed instructions on getting these credentials.

### 3. Enable GitHub Pages

1. Go to repository Settings → Pages
2. Under "Source", select "GitHub Actions"
3. Save

### 4. Replace Placeholder Content

Search for `TODO:` comments in:
- `src/pages/HomePage.jsx`
- `src/pages/AboutPage.jsx`

Replace the lorem ipsum text with real content about your group.

### 5. Customize Styling (Optional)

Edit `src/styles/variables.css` to change colors, fonts, spacing, etc.

## First Deployment

1. Commit and push your changes to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Your site will be live at: `https://YOUR_USERNAME.github.io/your-repo-name/`

## Local Development

```bash
npm install
npm run dev
```

Visit http://localhost:5173

## Testing

```bash
npm test
```

That's it! 🎉
