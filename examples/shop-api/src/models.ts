/**
 * Types and the validation boundary.
 *
 * Everything behind `parseOrderRequest` receives a validated type. Nothing behind it should
 * touch the raw payload: that is the rule `typescript.instructions.md` states, and the
 * handlers in `api/orders.ts` are written to it.
 */

export type OrderId = string;

export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export interface OrderLine {
  readonly sku: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
}

export interface Order {
  readonly id: OrderId;
  readonly customerId: string;
  readonly lines: readonly OrderLine[];
  readonly status: OrderStatus;
}

export interface Caller {
  readonly userId: string;
  readonly isStaff: boolean;
}

export interface OrderRequest {
  readonly customerId: string;
  readonly lines: readonly OrderLine[];
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const STATUSES: readonly string[] = ["pending", "paid", "shipped", "cancelled"];

function asRecord(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new ValidationError(`${what} must be an object, received ${describe(value)}`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, what: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ValidationError(`${what} must be a non-empty string, received ${describe(value)}`);
  }
  return value;
}

function asQuantity(value: unknown, what: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new ValidationError(`${what} must be a positive integer, received ${describe(value)}`);
  }
  return value;
}

function describe(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `an array of length ${value.length}`;
  return typeof value;
}

/**
 * Parse an untrusted create-order payload into a validated `OrderRequest`.
 *
 * This is the only place in the fixture that reads `unknown` input. If a handler ever reads
 * a raw payload directly, this boundary has been bypassed.
 */
export function parseOrderRequest(input: unknown): OrderRequest {
  const root = asRecord(input, "request body");
  const customerId = asString(root.customerId, "customerId");

  if (!Array.isArray(root.lines)) {
    throw new ValidationError(`lines must be an array, received ${describe(root.lines)}`);
  }
  if (root.lines.length === 0) {
    throw new ValidationError("lines must contain at least one line item");
  }

  const lines: OrderLine[] = root.lines.map((raw, index) => {
    const line = asRecord(raw, `lines[${index}]`);
    const unitPriceCents = asQuantity(line.unitPriceCents, `lines[${index}].unitPriceCents`);
    return {
      sku: asString(line.sku, `lines[${index}].sku`),
      quantity: asQuantity(line.quantity, `lines[${index}].quantity`),
      unitPriceCents,
    };
  });

  return { customerId, lines };
}

export function parseStatus(input: unknown): OrderStatus {
  const status = asString(input, "status");
  if (!STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of ${STATUSES.join(", ")}, received "${status}"`);
  }
  return status as OrderStatus;
}
