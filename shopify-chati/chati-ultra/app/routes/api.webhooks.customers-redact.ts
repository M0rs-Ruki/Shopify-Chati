import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload } = await authenticate.webhook(request);

  console.log("🧹 CUSTOMER REDACT");
  console.log("Shop:", shop);
  console.log("Customer ID:", payload.customer?.id);
  console.log("ℹ️ Customer data deletion will be handled by Chati Core (MongoDB)");

  // No DB cleanup needed - app is stateless
  // Customer data deletion will be handled by Chati Core service (MongoDB) later

  return new Response("OK", { status: 200 });
};
