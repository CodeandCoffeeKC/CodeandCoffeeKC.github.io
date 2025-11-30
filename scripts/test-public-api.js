// Test if we can access public group events without OAuth

async function testPublicAccess() {
  console.log('Testing public API access...')
  
  // Try the REST API endpoint for public group events
  const groupUrlname = 'code-and-coffee-kc'
  
  try {
    // Try REST API
    console.log('\n1. Trying REST API...')
    const restUrl = `https://api.meetup.com/${groupUrlname}/events`
    console.log('URL:', restUrl)
    
    const restResponse = await fetch(restUrl)
    console.log('Status:', restResponse.status)
    
    if (restResponse.ok) {
      const data = await restResponse.json()
      console.log('Success! Found', data.length, 'events')
      console.log('First event:', JSON.stringify(data[0], null, 2))
      return
    }
    
    const restError = await restResponse.text()
    console.log('Error:', restError.substring(0, 200))
    
  } catch (error) {
    console.error('Error:', error.message)
  }
  
  try {
    // Try GraphQL without auth
    console.log('\n2. Trying GraphQL without auth...')
    const query = `
      query {
        groupByUrlname(urlname: "${groupUrlname}") {
          name
          upcomingEvents {
            count
            edges {
              node {
                id
                title
                dateTime
              }
            }
          }
        }
      }
    `
    
    const gqlResponse = await fetch('https://api.meetup.com/gql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    })
    
    console.log('Status:', gqlResponse.status)
    const gqlData = await gqlResponse.json()
    console.log('Response:', JSON.stringify(gqlData, null, 2))
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testPublicAccess()
