import { Router } from "express";
import {
  getCustomers,
  getCustomerById
} from "../services/customers.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const customers = await getCustomers(req.auth!.businessId);
      res.json({ customers });
    } catch (error) {
      console.error("Failed to load customers:", error);
      res.status(500).json({ message: "Failed to load customers." });
    }
  }
);

router.get(
  "/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const customer = await getCustomerById(
        req.params.id,
        req.auth!.businessId
      );

      if (!customer) {
        res.status(404).json({ message: "Customer not found." });
        return;
      }

      res.json({ customer });
    } catch (error) {
      console.error("Failed to load customer:", error);
      res.status(500).json({ message: "Failed to load customer." });
    }
  }
);

export default router;
