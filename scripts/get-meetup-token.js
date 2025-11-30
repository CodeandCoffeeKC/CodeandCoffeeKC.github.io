import readline from 'readline'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env file
dotenv.config()

/**
 * Helper script to get Meetup access token from authorization code
 * 
 * Usage:
 * 1. Create a .env file with MEETUP_CLIENT_ID and MEETUP_CLIENT_SECRET
 * 2. Run: node scripts/get-meetup-token.js
 * 3. Follow the prompts
 * 4. Copy the refresh token to .meetup-refresh-token file
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log('='.repeat(60))
  console.log('Meetup API Token Generator')
  console.log('='.repeat(60))
  console.log()

  const clientId = process.env.MEETUP_CLIENT_ID
  const clientSecret = process.env.MEETUP_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    console.error('Error: Missing MEETUP_CLIENT_ID or MEETUP_CLIENT_SECRET in .env file')
    console.log()
    console.log('Please create a .env file with:')
    console.log('MEETUP_CLIENT_ID=your_client_id')
    console.log('MEETUP_CLIENT_SECRET=your_client_secret')
    process.exit(1)
  }
  
  console.log('Using credentials from .env file')
  console.log()
  
  const redirectUri = 'https://oauth.pstmn.io/v1/callback'
  
  console.log()
  console.log('Now, open this URL in your browser:')
  console.log()
  const authUrl = `https://secure.meetup.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`
  console.log(authUrl)
  console.log()
  console.log('After authorizing, you will be redirected to a URL like:')
  console.log(`${redirectUri}?code=XXXXX`)
  console.log()
  
  const authCode = await question('Enter the code from the redirect URL: ')
  
  console.log()
  console.log('→ Exchanging authorization code for access token...')
  
  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: authCode
    })

    const response = await fetch('https://secure.meetup.com/oauth2/access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Token exchange failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Save refresh token to file
    const refreshTokenFile = path.join(__dirname, '../.meetup-refresh-token')
    fs.writeFileSync(refreshTokenFile, data.refresh_token)
    
    console.log()
    console.log('='.repeat(60))
    console.log('✓ Success! Here are your tokens:')
    console.log('='.repeat(60))
    console.log()
    console.log('ACCESS TOKEN (expires in ~1 hour):')
    console.log(data.access_token)
    console.log()
    console.log('REFRESH TOKEN (saved to .meetup-refresh-token):')
    console.log(data.refresh_token)
    console.log()
    console.log('✓ Refresh token automatically saved to .meetup-refresh-token')
    console.log()
    console.log('Token expires in:', data.expires_in, 'seconds')
    console.log('That\'s approximately', Math.floor(data.expires_in / 3600), 'hours')
    console.log()
    console.log('='.repeat(60))
    console.log()
    console.log('Next steps:')
    console.log('1. Commit the .meetup-refresh-token file:')
    console.log('   git add .meetup-refresh-token')
    console.log('   git commit -m "chore: update refresh token"')
    console.log('   git push')
    console.log()
    console.log('2. The GitHub Action will automatically use it on next deployment')
    console.log()
    
  } catch (error) {
    console.error('✗ Error:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
