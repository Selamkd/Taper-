
const fs = require("fs");
const path = require("path");
const { Client } = require("@notionhq/client");

// Load env
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const [key, ...vals] = line.split("=");
      if (key && !key.startsWith("#")) {
        process.env[key.trim()] = vals.join("=").trim();
      }
    });
}

const notion = new Client({ auth: process.env.NEXT_NOTION_API_KEY });
const PARENT_ID = process.env.NEXT_NOTION_PARENT_PAGE_ID;

let PRESCRIPTIONS_DB = process.env.NEXT_NOTION_MED_PRESCRIPTIONS_DB_ID;
let MED_LOGS_DB = process.env.NEXT_NOTION_MED_LOGS_DB_ID;

async function ensurePrescriptionsDB() {
  if (PRESCRIPTIONS_DB) {
    console.log("🛠 Updating Med Prescriptions schema...");

    await notion.databases.update({
      database_id: PRESCRIPTIONS_DB,
      properties: {
        Name: { title: {} },
        "Dose mg": { number: {} },
        "Half Life Hours": { number: {} },
        "Onset Minutes": { number: {} },
        "Peak Hours": { number: {} },
        Frequency: {
          select: {
            options: [
              { name: "once_daily", color: "green" },
              { name: "twice_daily", color: "blue" },
              { name: "three_daily", color: "purple" },
              { name: "as_needed", color: "yellow" },
            ],
          },
        },
        Color: { rich_text: {} },
        Active: { checkbox: {} },
      },
    });

    return PRESCRIPTIONS_DB;
  }

  console.log("➕ Creating Med Prescriptions database...");

  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: PARENT_ID },
    title: [{ type: "text", text: { content: "Med Prescriptions" } }],
    properties: {
      Name: { title: {} },
      "Dose mg": { number: {} },
      "Half Life Hours": { number: {} },
      "Onset Minutes": { number: {} },
      "Peak Hours": { number: {} },
      Frequency: {
        select: {
          options: [
            { name: "once_daily", color: "green" },
            { name: "twice_daily", color: "blue" },
            { name: "three_daily", color: "purple" },
            { name: "as_needed", color: "yellow" },
          ],
        },
      },
      Color: { rich_text: {} },
      Active: { checkbox: {} },
    },
  });

  console.log(`✓ Created Med Prescriptions DB: ${db.id}`);
  return db.id;
}

async function ensureMedLogsDB(prescriptionsDbId) {
  if (MED_LOGS_DB) {
    console.log("🛠 Updating Med Logs schema...");

    await notion.databases.update({
      database_id: MED_LOGS_DB,
      properties: {
        Name: { title: {} },
        Prescription: {
          relation: {
            database_id: prescriptionsDbId,
            single_property: {},
          },
        },
        "Prescription Name": { rich_text: {} },
        "Dose mg": { number: {} },
        "Half Life Hours": { number: {} },
        "Taken At": { date: {} },
        Date: { date: {} },
        Notes: { rich_text: {} },
      },
    });

    return MED_LOGS_DB;
  }

  console.log("➕ Creating Med Logs database...");

  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: PARENT_ID },
    title: [{ type: "text", text: { content: "Med Logs" } }],
    properties: {
      Name: { title: {} },
      Prescription: {
        relation: {
          database_id: prescriptionsDbId,
          single_property: {},
        },
      },
      "Prescription Name": { rich_text: {} },
      "Dose mg": { number: {} },
      "Half Life Hours": { number: {} },
      "Taken At": { date: {} },
      Date: { date: {} },
      Notes: { rich_text: {} },
    },
  });

  console.log(`✓ Created Med Logs DB: ${db.id}`);
  return db.id;
}

function upsertEnv(key, value) {
  let env = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8")
    : "";

  const regex = new RegExp(`^${key}=.*$`, "m");

  if (regex.test(env)) {
    env = env.replace(regex, `${key}=${value}`);
  } else {
    env += `\n${key}=${value}`;
  }

  fs.writeFileSync(envPath, env);
}

async function main() {
  if (!process.env.NEXT_NOTION_API_KEY || !PARENT_ID) {
    console.error("❌ Missing required env vars");
    process.exit(1);
  }

  const prescriptionsDbId = await ensurePrescriptionsDB();
  const medLogsDbId = await ensureMedLogsDB(prescriptionsDbId);

  console.log("\n📋 Updating .env.local...\n");

  upsertEnv("NEXT_NOTION_MED_PRESCRIPTIONS_DB_ID", prescriptionsDbId);
  upsertEnv("NEXT_NOTION_MED_LOGS_DB_ID", medLogsDbId);

  console.log(`
✅ Done!

NEXT_NOTION_MED_PRESCRIPTIONS_DB_ID=${prescriptionsDbId}
NEXT_NOTION_MED_LOGS_DB_ID=${medLogsDbId}

⚠️  Don't forget to:
1. Open each database in Notion
2. Click "..." → Add connections
3. Select your integration
`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

