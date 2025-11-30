const accessToken = process.env.MEETUP_ACCESS_TOKEN

const query = `
  query {
    groupByUrlname(urlname: "code-and-coffee-kc") {
      id
      name
      upcomingEvents {
        count
        edges {
          node {
            id
            title
            description
            eventUrl
            dateTime
            endTime
            duration
          }
        }
      }
    }
  }
`

fetch('https://api.meetup.com/gql-ext', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({ query })
})
.then(r => r.json())
.then(d => console.log(JSON.stringify(d, null, 2)))
.catch(e => console.error('Error:', e.message))
