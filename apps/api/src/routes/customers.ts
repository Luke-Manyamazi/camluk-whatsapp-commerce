import { Router } from "express";
import { getCustomers, getCustomerById, updateCustomer } from "../services/customers.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 5);
    const search = typeof req.query.search === "string" ? req.query.search : "";
    res.json(await getCustomers(req.auth!.businessId, page, limit, search));
  } catch (error) {
    console.error("Failed to load customers:", error);
    res.status(500).json({ message: "Failed to load customers." });
  }
});

router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const customer = await getCustomerById(String(req.params.id), req.auth!.businessId);
    if (!customer) { res.status(404).json({ message: "Customer not found." }); return; }
    res.json({ customer });
  } catch (error) { console.error("Failed to load customer:", error); res.status(500).json({ message: "Failed to load customer." }); }
});

router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = req.body ?? {};
    if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.some((tag: unknown) => typeof tag !== "string"))) { res.status(400).json({ message: "Tags must be an array of strings." }); return; }
    const customer = await updateCustomer(String(req.params.id), req.auth!.businessId, {
      name: typeof body.name === "string" ? body.name : undefined, phone: typeof body.phone === "string" ? body.phone : undefined,
      email: typeof body.email === "string" ? body.email : undefined, tags: body.tags, notes: typeof body.notes === "string" ? body.notes : undefined,
    });
    if (!customer) { res.status(404).json({ message: "Customer not found." }); return; }
    res.json({ customer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update customer.";
    console.error("Failed to update customer:", error);
    const badRequest = message.includes("required") || message.includes("No customer");
    res.status(badRequest ? 400 : 500).json({ message: badRequest ? message : "Failed to update customer." });
  }
});

export default router;
