import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const current = payload.current as string[];
  console.log("ℹ️ Updated scopes:", current);
  console.log("ℹ️ Scope updates will be handled by Chati Core (MongoDB)");

  // No DB update needed - app is stateless
  // Scope updates will be handled by Chati Core service (MongoDB) later

  return new Response();
};
