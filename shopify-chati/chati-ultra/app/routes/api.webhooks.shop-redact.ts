import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop } = await authenticate.webhook(request);

  console.log("🧨 SHOP REDACT:", shop);

  // Delete ALL shop data
  await db.session.deleteMany({ where: { shop } });
  await db.webhookEvent.deleteMany({ where: { shop } });

  // Later: delete settings, configs, logs

  return new Response("OK", { status: 200 });
};
