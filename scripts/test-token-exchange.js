// Quick test of the token exchange logic
const clientId = '4eo7v8sohmt023iv49ds6lm06p'
const clientSecret = 'g9chqqrk3qqej11sh6iqu92abn'
const authCode = 'a2bf8535c5cbc62491d22b7cfb449056' // Your old code (will be expired)

async function test() {
  console.log('Testing token exchange...')
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: 'https://example.com/meetup-callback',
    code: authCode
  })

  try {
    const response = await fetch('https://secure.meetup.com/oauth2/access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

test()
