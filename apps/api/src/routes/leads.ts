import { Router } from "express";
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead
} from "../services/leads.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const leads = await getLeads();

    res.json({
      leads
    });
  } catch (error) {
    console.error("Failed to load leads:", error);

    res.status(500).json({
      message: "Failed to load leads."
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const lead = await getLeadById(req.params.id);

    res.json({
      lead
    });
  } catch (error) {
    console.error("Failed to load lead:", error);

    res.status(500).json({
      message: "Failed to load lead."
    });
  }
});

router.post("/", async (req, res) => {
  const {
    businessId,
    customerId,
    serviceCategory,
    notes
  } = req.body;

  if (!businessId || !customerId) {
    return res.status(400).json({
      message: "businessId and customerId are required."
    });
  }

  try {
    const lead = await createLead(
      businessId,
      customerId,
      serviceCategory,
      notes
    );

    res.status(201).json({
      lead
    });
  } catch (error) {
    console.error("Failed to create lead:", error);

    res.status(500).json({
      message: "Failed to create lead."
    });
  }
});

router.patch("/:id", async (req, res) => {
  const {
    status,
    serviceCategory,
    notes
  } = req.body;

  try {
    const lead = await updateLead(
      req.params.id,
      {
        status,
        serviceCategory,
        notes
      }
    );

    res.json({
      lead
    });
  } catch (error) {
    console.error("Failed to update lead:", error);

    res.status(500).json({
      message: "Failed to update lead."
    });
  }
});

export default router;