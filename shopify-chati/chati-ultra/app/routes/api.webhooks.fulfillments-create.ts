import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  checkAndRecordWebhook,
  updateWebhookStatus,
} from "../utils/webhook-idempotency.server";
import { dispatchChatiEvent } from "../services/event-dispatcher.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  const resourceId = String(payload.id);

  const { isDuplicate, eventId } = await checkAndRecordWebhook(
    shop,
    topic,
    resourceId,
  );

  if (isDuplicate) return new Response("OK", { status: 200 });

  try {
    await dispatchChatiEvent({
      type: "FULFILLMENT_CREATED",
      shop,
      payload,
    });

    if (eventId) await updateWebhookStatus(eventId, "success");
    return new Response("OK", { status: 200 });
  } catch (error) {
    if (eventId) {
      await updateWebhookStatus(
        eventId,
        "failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
    return new Response("OK", { status: 200 });
  }
};
