import type { ChatiEvent } from "../domain/events";
import {
  handleOrderCreated,
  handleOrderPaid,
  handleOrderCancelled,
  handleOrderUpdated,
  handleRefundCreated,
} from "./order-notification.server";

import {
  handleFulfillmentCreated,
  handleFulfillmentEvent,
  handleFulfillmentUpdated,
  handleFulfillmentEventDeleted,
} from "./fulfillment-notification.server";

import {
  handleCheckoutCreated,
  handleCheckoutUpdated,
  handleCheckoutDeleted,
} from "./checkout-notification.server";

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

    case "REFUND_CREATED":
      return handleRefundCreated({
        shop: event.shop,
        refund: event.payload,
      });

    case "FULFILLMENT_UPDATED":
      return handleFulfillmentUpdated({
        shop: event.shop,
        fulfillment: event.payload,
      });

    case "FULFILLMENT_EVENT_DELETED":
      return handleFulfillmentEventDeleted({
        shop: event.shop,
        fulfillment: event.payload,
      });

    case "CHECKOUT_CREATED":
      return handleCheckoutCreated({
        shop: event.shop,
        checkout: event.payload,
      });

    case "CHECKOUT_UPDATED":
      return handleCheckoutUpdated({
        shop: event.shop,
        checkout: event.payload,
      });

    case "CHECKOUT_DELETED":
      return handleCheckoutDeleted({
        shop: event.shop,
        checkout: event.payload,
      });

    default:
      console.warn("⚠️ Unhandled Chati event:", event.type);
      return;
  }
}
