import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload } = await authenticate.webhook(request);

  console.log("🧹 CUSTOMER REDACT");
  console.log("Shop:", shop);
  console.log("Customer ID:", payload.customer?.id);

  // Delete or anonymize customer data in your DB
  // Example (if stored later):
  // await db.customer.deleteMany({ where: { shop, customerId: payload.customer.id } });

  return new Response("OK", { status: 200 });
};
