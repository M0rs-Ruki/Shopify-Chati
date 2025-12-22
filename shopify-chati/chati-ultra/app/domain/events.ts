export type ChatiEventType =
  | "ORDER_PLACED"
  | "ORDER_PAID"
  | "ORDER_CANCELLED"
  | "ORDER_UPDATED"
  | "REFUND_CREATED"
  | "FULFILLMENT_CREATED"
  | "FULFILLMENT_UPDATED"
  | "FULFILLMENT_EVENT";

export type ChatiEvent = {
  type: ChatiEventType;
  shop: string;
  payload: Record<string, unknown>;
};
