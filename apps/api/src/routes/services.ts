import { Router } from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} from "../services/services.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const services = await getServices();

    res.json({
      services
    });
  } catch (error) {
    console.error(
      "Failed to load services:",
      error
    );

    res.status(500).json({
      message: "Failed to load services."
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const service = await getServiceById(
      req.params.id
    );

    if (!service) {
      res.status(404).json({
        message: "Service not found."
      });

      return;
    }

    res.json({
      service
    });
  } catch (error) {
    console.error(
      "Failed to load service:",
      error
    );

    res.status(500).json({
      message: "Failed to load service."
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      businessId,
      name,
      category,
      description,
      active
    } = req.body;

    if (!businessId) {
      res.status(400).json({
        message: "Business ID is required."
      });

      return;
    }

    if (!name || !category) {
      res.status(400).json({
        message: "Name and category are required."
      });

      return;
    }

    const service = await createService({
      businessId,
      name,
      category,
      description,
      active
    });

    res.status(201).json({
      service
    });
  } catch (error) {
    console.error(
      "Failed to create service:",
      error
    );

    res.status(500).json({
      message: "Failed to create service."
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const service = await updateService(
      req.params.id,
      req.body
    );

    if (!service) {
      res.status(404).json({
        message: "Service not found."
      });

      return;
    }

    res.json({
      service
    });
  } catch (error) {
    console.error(
      "Failed to update service:",
      error
    );

    res.status(500).json({
      message: "Failed to update service."
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const service = await deleteService(
      req.params.id
    );

    if (!service) {
      res.status(404).json({
        message: "Service not found."
      });

      return;
    }

    res.json({
      message: "Service deleted successfully."
    });
  } catch (error) {
    console.error(
      "Failed to delete service:",
      error
    );

    res.status(500).json({
      message: "Failed to delete service."
    });
  }
});

export default router;