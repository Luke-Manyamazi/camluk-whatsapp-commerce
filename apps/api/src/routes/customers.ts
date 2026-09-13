import { Router } from "express";
import {
  getCustomers,
  getCustomerById
} from "../services/customers.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const customers = await getCustomers();

    res.json({
      customers
    });
  } catch (error) {
    console.error("Failed to load customers:", error);

    res.status(500).json({
      message: "Failed to load customers."
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const customer = await getCustomerById(
      req.params.id
    );

    if (!customer) {
      res.status(404).json({
        message: "Customer not found."
      });

      return;
    }

    res.json({
      customer
    });
  } catch (error) {
    console.error(
      "Failed to load customer:",
      error
    );

    res.status(500).json({
      message: "Failed to load customer."
    });
  }
});

export default router;