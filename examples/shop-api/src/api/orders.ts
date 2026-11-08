/**
 * Order handlers.
 *
 * The shape is intentional: parse at the edge, hand a validated type inward.
 *
 * `getOrder` contains a deliberate authorization defect. Do not fix it here — it is the
 * subject of `.github/prompts/review-api-security.prompt.md` and lab 03. Read the comment on
 * that function before assuming it is an oversight.
 */

import { parseOrderRequest, parseStatus, ValidationError } from "../models.js";
import type { Caller, Order, OrderId } from "../models.js";
import * as orders from "../repositories/orders.js";

export interface Response<T> {
  readonly status: number;
  readonly body: T | { readonly error: string };
}

/**
 * POST /orders
 *
 * Authenticated callers may create an order for themselves. Staff may create one for any
 * customer. The caller is never trusted to declare who they are: `customerId` is checked
 * against the authenticated caller rather than taken at face value.
 */
export function createOrder(caller: Caller, body: unknown): Response<Order> {
  let request;
  try {
    request = parseOrderRequest(body);
  } catch (error) {
    if (error instanceof ValidationError) {
      return { status: 400, body: { error: error.message } };
    }
    throw error;
  }

  if (!caller.isStaff && request.customerId !== caller.userId) {
    return { status: 403, body: { error: "cannot create an order for another customer" } };
  }

  return { status: 201, body: orders.create(request) };
}

/**
 * GET /orders/:id
 *
 * DELIBERATE DEFECT: this returns any order to any authenticated caller. It authenticates
 * (the caller exists) but does not authorize (the caller may not see this order). That is
 * the difference the security review prompt asks a reviewer to notice, and it is an
 * insecure direct object reference — the most common authorization bug in an order API.
 *
 * Leave it as is. Lab 03 relies on this being present.
 */
export function getOrder(caller: Caller, id: OrderId): Response<Order> {
  if (!caller) {
    return { status: 401, body: { error: "authentication required" } };
  }

  const order = orders.findById(id);
  if (!order) {
    return { status: 404, body: { error: `no order with id "${id}"` } };
  }

  return { status: 200, body: order };
}

/**
 * GET /orders?customerId=...
 *
 * Scoped correctly, so it can serve as the comparison case in a review: the same caller,
 * the same resource type, and here the ownership check is present.
 */
export function listOrders(caller: Caller, customerId: string): Response<readonly Order[]> {
  if (!caller) {
    return { status: 401, body: { error: "authentication required" } };
  }
  if (!caller.isStaff && caller.userId !== customerId) {
    return { status: 403, body: { error: "cannot list another customer's orders" } };
  }
  return { status: 200, body: orders.listByCustomer(customerId) };
}

/**
 * PATCH /orders/:id/status
 *
 * Staff only. Validates the status before touching the record so a rejected value cannot
 * leave a half-updated order behind.
 */
export function updateStatus(caller: Caller, id: OrderId, body: unknown): Response<Order> {
  if (!caller?.isStaff) {
    return { status: 403, body: { error: "staff only" } };
  }

  let status;
  try {
    const record = body as Record<string, unknown> | null;
    status = parseStatus(record?.status);
  } catch (error) {
    if (error instanceof ValidationError) {
      return { status: 400, body: { error: error.message } };
    }
    throw error;
  }

  const existing = orders.findById(id);
  if (!existing) {
    return { status: 404, body: { error: `no order with id "${id}"` } };
  }

  const updated: Order = { ...existing, status };
  return { status: 200, body: updated };
}
