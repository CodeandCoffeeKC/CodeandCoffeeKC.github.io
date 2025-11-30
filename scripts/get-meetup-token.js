import readline from 'readline'

/**
 * Helper script to get Meetup access token from authorization code
 * 
 * Usage:
 * 1. Run: node scripts/get-meetup-token.js
 * 2. Follow the prompts
 * 3. Copy the access token to use in your environment variables
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

  const clientId = await question('Enter your MEETUP_CLIENT_ID: ')
  const clientSecret = await question('Enter your MEETUP_CLIENT_SECRET: ')
  
  console.log()
  console.log('Now, open this URL in your browser:')
  console.log()
  const authUrl = `https://secure.meetup.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=https://example.com/meetup-callback`
  console.log(authUrl)
  console.log()
  console.log('After authorizing, you will be redirected to a URL like:')
  console.log('https://example.com/meetup-callback?code=XXXXX')
  console.log()
  
  const authCode = await question('Enter the code from the redirect URL: ')
  
  console.log()
  console.log('→ Exchanging authorization code for access token...')
  
  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: 'https://example.com/meetup-callback',
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
    
    console.log()
    console.log('='.repeat(60))
    console.log('✓ Success! Here are your tokens:')
    console.log('='.repeat(60))
    console.log()
    console.log('ACCESS TOKEN (use this in MEETUP_ACCESS_TOKEN):')
    console.log(data.access_token)
    console.log()
    console.log('REFRESH TOKEN (save this for later):')
    console.log(data.refresh_token)
    console.log()
    console.log('Token expires in:', data.expires_in, 'seconds')
    console.log('That\'s approximately', Math.floor(data.expires_in / 3600), 'hours')
    console.log()
    console.log('='.repeat(60))
    console.log()
    console.log('Add this to your GitHub secrets:')
    console.log('MEETUP_ACCESS_TOKEN=' + data.access_token)
    console.log()
    
  } catch (error) {
    console.error('✗ Error:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
