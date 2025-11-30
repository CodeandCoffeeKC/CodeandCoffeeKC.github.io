const accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIyNzQxMzIxMzAiLCJuYmYiOjE3NjQ1MjM1ODksInJvbGUiOiJ0aGlyZF9wYXJ0eSIsImlzcyI6Ii5tZWV0dXAuY29tIiwicXVhbnR1bV9sZWFwZWQiOmZhbHNlLCJyZWZyZXNoX3Rva2Vuc19jaGFpbl9pZCI6ImVjYjcyM2I2LTBiYjYtNDExMS04MWU3LWI2NmE5NmI2NmRkYiIsImV4cCI6MTc2NDUyNzE4OSwiaWF0IjoxNzY0NTIzNTg5LCJqdGkiOiJiZTYzYTlhOC1iNzU3LTRiYzYtYTE2MS03YzU4ZjBmMzc5NWUiLCJvYXV0aF9jbGllbnRfaWQiOiIyMDY0NTIifQ.2R-TKcTfzDb_MtV_I1Dnw4-W53e-dOSPzp4Pu66cDR747L6NWf2dzmeki_zxNPgLJ8Uprpnr2x8Say9y57W_UQ'

// First test - your working query
console.log('Testing self query...')
fetch('https://api.meetup.com/gql-ext', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({ query: "query { self { id name } }" })
})
.then(r => r.json())
.then(d => {
  console.log('Self query result:', JSON.stringify(d, null, 2))
  
  // Now test the events query from your original Postman
  console.log('\nTesting events query...')
  const eventsQuery = `query { groupByUrlname(urlname: "code-and-coffee-kc") { id name events { totalCount edges { node { id title description eventUrl dateTime endTime status } } } } }`
  
  return fetch('https://api.meetup.com/gql-ext', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ query: eventsQuery })
  })
})
.then(r => r.json())
.then(d => console.log('Events query result:', JSON.stringify(d, null, 2)))
.catch(e => console.error('Error:', e.message))
