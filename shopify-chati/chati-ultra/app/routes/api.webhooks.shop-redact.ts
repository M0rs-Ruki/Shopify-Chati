import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop } = await authenticate.webhook(request);

  console.log("🧨 SHOP REDACT:", shop);
  console.log("ℹ️ Data deletion will be handled by Chati Core (MongoDB)");

  // No DB cleanup needed - app is stateless
  // Data deletion will be handled by Chati Core service (MongoDB) later

  return new Response("OK", { status: 200 });
};
