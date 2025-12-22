import db from "../app/db.server";

async function clearWebhookEvents() {
  try {
    const result = await db.webhookEvent.deleteMany({});
    console.log(`✅ Cleared ${result.count} webhook events from database`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing webhook events:", error);
    process.exit(1);
  }
}

clearWebhookEvents();

