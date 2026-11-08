/**
 * Tests for the order handlers.
 *
 * Intentionally thin. Lab 05 asks you to use the `test-specialist` agent to close the gaps,
 * so do not fill them in here: the missing cases are the exercise.
 *
 * Present:
 *   - createOrder rejects an invalid payload
 *   - createOrder lets a customer create their own order
 *
 * Missing, on purpose (the labs add these):
 *   - createOrder rejects a non-staff caller creating an order for someone else
 *   - getOrder rejects a caller reading another customer's order
 *   - updateStatus rejects a caller who is not staff
 *   - a rejected status update leaves the stored order unchanged
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createOrder, getOrder, updateStatus } from "./orders.js";
import * as orders from "../repositories/orders.js";
import type { Caller } from "../models.js";

const customer: Caller = { userId: "u-1", isStaff: false };
const otherCustomer: Caller = { userId: "u-2", isStaff: false };
const staff: Caller = { userId: "u-9", isStaff: true };

const validBody = {
  customerId: "u-1",
  lines: [{ sku: "sku-1", quantity: 2, unitPriceCents: 1500 }],
};

describe("createOrder", () => {
  it("rejects a payload with no lines", () => {
    orders.reset();
    const response = createOrder(customer, { customerId: "u-1", lines: [] });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, { error: "lines must contain at least one line item" });
    assert.equal(orders.listByCustomer("u-1").length, 0, "a rejected payload must create nothing");
  });

  it("creates an order for the calling customer", () => {
    orders.reset();
    const response = createOrder(customer, validBody);

    assert.equal(response.status, 201);
    assert.ok("id" in response.body, "a created order carries an id");
    assert.equal(orders.listByCustomer("u-1").length, 1);
  });
});

describe("getOrder", () => {
  it("returns an order to its owner", () => {
    orders.reset();
    const created = createOrder(customer, validBody);
    assert.ok("id" in created.body);

    const response = getOrder(customer, created.body.id);
    assert.equal(response.status, 200);
  });

  it("returns 404 for an unknown id", () => {
    orders.reset();
    const response = getOrder(customer, "o-404");
    assert.equal(response.status, 404);
  });
});

describe("updateStatus", () => {
  it("rejects a non-staff caller", () => {
    orders.reset();
    const created = createOrder(customer, validBody);
    assert.ok("id" in created.body);

    const response = updateStatus(customer, created.body.id, { status: "paid" });
    assert.equal(response.status, 403);
    assert.deepEqual(response.body, { error: "staff only" });
  });
});

// Referenced above so the unused-import warning does not fire during a reader's experiment.
void otherCustomer;
void staff;
