import { Router } from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} from "../services/services.js";
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
      const services = await getServices(
        req.auth!.businessId
      );

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
  }
);

router.get(
  "/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const service = await getServiceById(
        String(req.params.id),
        req.auth!.businessId
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
  }
);

router.post(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        name,
        category,
        description,
        active
      } = req.body;

      if (!name || !category) {
        res.status(400).json({
          message: "Name and category are required."
        });

        return;
      }

      const service = await createService({
        businessId: req.auth!.businessId,
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
  }
);

router.patch(
  "/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const service = await updateService(
        String(req.params.id),
        req.auth!.businessId,
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
  }
);

router.delete(
  "/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const service = await deleteService(
        String(req.params.id),
        req.auth!.businessId
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
  }
);

export default router;