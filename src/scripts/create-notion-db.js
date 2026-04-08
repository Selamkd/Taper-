
const fs   = require('fs')
const path = require('path')
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && !key.startsWith('#')) process.env[key.trim()] = vals.join('=').trim()
  })
}
const { Client } = require('@notionhq/client')

const notion      = new Client({ auth: process.env.NEXT_NOTION_API_KEY })
const PARENT_ID   = process.env.NEXT_NOTION_PARENT_PAGE_ID
async function main() {
  if (!process.env.NEXT_NOTION_API_KEY || !PARENT_ID) {
    console.log(process.env.NEXT_NOTION_API_KEY )
       console.log( PARENT_ID)
    console.error('❌  Missing NEXT_NOTION_API_KEY or NEXT_NOTION_PARENT_PAGE_ID in .env.local')
    process.exit(1)
  }


 
console.log('➕  Creating Med Prescriptions database...')

const prescriptionsDb = await notion.databases.create({
  parent: { type: 'page_id', page_id: PARENT_ID },
  title: [{ type: 'text', text: { content: 'Med Prescriptions' } }],
  properties: {
    Name: { title: {} },

    'Dose (mg)': { number: {} },
    'Half-life (hrs)': { number: {} },
    'Onset (min)': { number: {} },
    'Peak (hrs)': { number: {} },

    Frequency: {
      select: {
        options: [
          { name: 'once_daily',  color: 'green' },
          { name: 'twice_daily', color: 'blue' },
          { name: 'three_daily', color: 'purple' },
          { name: 'as_needed',   color: 'yellow' },
        ],
      },
    },

    Color: { rich_text: {} },

    Active: { checkbox: {} },

    'Created At': { date: {} },
  },
})
console.log('➕  Creating Med Logs database...')

const medLogsDb = await notion.databases.create({
  parent: { type: 'page_id', page_id: PARENT_ID },
  title: [{ type: 'text', text: { content: 'Med Logs' } }],
  properties: {
    Name: { title: {} },

    Prescription: {
      relation: {
        database_id: prescriptionsDb.id,
        single_property: {},
      },
    },

    'Prescription Name': { rich_text: {} },

    'Dose (mg)': { number: {} },
    'Half-life (hrs)': { number: {} },

    'Taken At': { date: {} },
    Date: { date: {} },

    Notes: { rich_text: {} },

    'Created At': { date: {} },
  },
})

console.log(`

# Medication Tracker
NOTION_MED_PRESCRIPTIONS_DB_ID=${prescriptionsDb.id}
NOTION_MED_LOGS_DB_ID=${medLogsDb.id}
`)

}
 
main().catch(err => { console.error('❌  Error:', err.message); process.exit(1) })
 