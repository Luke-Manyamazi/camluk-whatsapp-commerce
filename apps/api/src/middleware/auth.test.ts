import test from "node:test";
import assert from "node:assert/strict";
import { isValidBusinessRole, membershipMatchesRequestedBusiness } from "./auth.js";

test("accepts only supported business roles", () => {
  assert.equal(isValidBusinessRole("owner"), true);
  assert.equal(isValidBusinessRole("admin"), true);
  assert.equal(isValidBusinessRole("member"), true);
  assert.equal(isValidBusinessRole("super_admin"), false);
  assert.equal(isValidBusinessRole(undefined), false);
});

test("tenant membership must match the requested business", () => {
  const membership = { business_id: "business-a" };
  assert.equal(membershipMatchesRequestedBusiness(membership, "business-a"), true);
  assert.equal(membershipMatchesRequestedBusiness(membership, "business-b"), false);
  assert.equal(membershipMatchesRequestedBusiness(null, "business-a"), false);
});

test("a missing requested business falls back to the authenticated user's membership", () => {
  assert.equal(membershipMatchesRequestedBusiness({ business_id: "business-a" }, null), true);
});
