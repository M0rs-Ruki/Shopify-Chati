import type { ChatiEvent } from "../domain/events";
import {
  handleOrderCreated,
  handleOrderPaid,
} from "./order-notification.server";

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

    default:
      console.warn("⚠️ Unhandled Chati event:", event.type);
      return;
  }
}
