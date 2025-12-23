import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop } = await authenticate.webhook(request);

  console.log("🗑️ APP UNINSTALLED:", shop);
  console.log("ℹ️ Cleanup will be handled by Chati Core (MongoDB)");

  // No DB cleanup needed - app is stateless
  // Cleanup will be handled by Chati Core service (MongoDB) later

  return new Response("OK", { status: 200 });
};
