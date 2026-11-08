/**
 * In-memory order store.
 *
 * Deliberately simple: the fixture demonstrates boundary and handler shape, not persistence.
 * Handlers must not reach into `store` directly; they call the functions below.
 */

import type { Order, OrderId, OrderRequest } from "../models.js";

const store = new Map<OrderId, Order>();
let sequence = 0;

function nextId(): OrderId {
  sequence += 1;
  return `o-${sequence}`;
}

export function create(request: OrderRequest): Order {
  const order: Order = {
    id: nextId(),
    customerId: request.customerId,
    lines: request.lines,
    status: "pending",
  };
  store.set(order.id, order);
  return order;
}

export function findById(id: OrderId): Order | undefined {
  return store.get(id);
}

export function listByCustomer(customerId: string): readonly Order[] {
  return [...store.values()].filter((order) => order.customerId === customerId);
}

export function totalCents(order: Order): number {
  return order.lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
}

/** Test-only reset. Exported so the test file can isolate cases. */
export function reset(): void {
  store.clear();
  sequence = 0;
}
