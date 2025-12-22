import type { ChatiEvent } from "../domain/events";
import {
  handleOrderCreated,
  handleOrderPaid,
  handleOrderCancelled,
  handleOrderUpdated,
} from "./order-notification.server";

import {
  handleFulfillmentCreated,
  handleFulfillmentEvent,
} from "./fulfillment-notification.server";

export async function dispatchChatiEvent(event: ChatiEvent) {
  switch (event.type) {
    case "ORDER_PLACED":
      return handleOrderCreated({
        shop: event.shop,
        order: event.payload,
      });

    case "ORDER_PAID":
      return handleOrderPaid({
        shop: event.shop,
        order: event.payload,
      });

    case "FULFILLMENT_CREATED":
      return handleFulfillmentCreated({
        shop: event.shop,
        fulfillment: event.payload,
      });

    case "FULFILLMENT_EVENT":
      return handleFulfillmentEvent({
        shop: event.shop,
        fulfillment: event.payload,
      });

    case "ORDER_CANCELLED":
      return handleOrderCancelled({
        shop: event.shop,
        order: event.payload,
      });

    case "ORDER_UPDATED":
      return handleOrderUpdated({
        shop: event.shop,
        order: event.payload,
      });

    default:
      console.warn("⚠️ Unhandled Chati event:", event.type);
      return;
  }
}
