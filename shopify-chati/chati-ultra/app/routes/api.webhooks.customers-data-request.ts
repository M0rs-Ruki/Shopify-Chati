import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload } = await authenticate.webhook(request);

  console.log("📄 CUSTOMER DATA REQUEST");
  console.log("Shop:", shop);
  console.log("Customer ID:", payload.customer?.id);

  // Shopify requires acknowledgment only.
  // Actual data export is handled outside webhook.

  return new Response("OK", { status: 200 });
};
