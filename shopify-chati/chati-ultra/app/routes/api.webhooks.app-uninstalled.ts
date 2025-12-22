import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop } = await authenticate.webhook(request);

  console.log("🗑️ APP UNINSTALLED:", shop);

  // Soft delete / mark shop inactive
  await db.session.deleteMany({
    where: { shop },
  });

  // (Later: also delete settings, events, configs)

  return new Response("OK", { status: 200 });
};
