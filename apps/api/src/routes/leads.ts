import { Router } from "express";
import { getLeads, getLeadById, createLead, updateLead } from "../services/leads.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();
const leadStatuses = ["new", "contacted", "qualified", "converted", "lost"];
const serviceCategories = ["general", "web-development", "business-software", "ai-automation", "cloud-deployment"];

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page ?? 1), limit = Number(req.query.limit ?? 5);
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const service = typeof req.query.service === "string" ? req.query.service : "";
    if (status && !leadStatuses.includes(status)) return res.status(400).json({ message: "Invalid lead status filter." });
    if (service && !serviceCategories.includes(service)) return res.status(400).json({ message: "Invalid service filter." });
    res.json(await getLeads(req.auth!.businessId, page, limit, status, service));
  } catch (error) { console.error("Failed to load leads:", error); res.status(500).json({ message: "Failed to load leads." }); }
});

router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res) => { try { const lead = await getLeadById(req.params.id, req.auth!.businessId); if (!lead) return res.status(404).json({ message: "Lead not found." }); res.json({ lead }); } catch (error) { console.error("Failed to load lead:", error); res.status(500).json({ message: "Failed to load lead." }); } });

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { customerId, serviceCategory, notes } = req.body ?? {};
  if (typeof customerId !== "string" || !customerId.trim()) return res.status(400).json({ message: "customerId is required." });
  if (serviceCategory !== undefined && serviceCategory !== null && !serviceCategories.includes(serviceCategory)) return res.status(400).json({ message: "Invalid service category." });
  if (notes !== undefined && notes !== null && typeof notes !== "string") return res.status(400).json({ message: "notes must be a string." });
  try { const lead = await createLead(req.auth!.businessId, customerId, serviceCategory, notes); if (!lead) return res.status(404).json({ message: "Customer not found." }); res.status(201).json({ lead }); } catch (error) { console.error("Failed to create lead:", error); res.status(500).json({ message: "Failed to create lead." }); }
});

router.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { status, serviceCategory, notes } = req.body ?? {};
  if (status !== undefined && !leadStatuses.includes(status)) return res.status(400).json({ message: "Invalid lead status." });
  if (serviceCategory !== undefined && serviceCategory !== null && !serviceCategories.includes(serviceCategory)) return res.status(400).json({ message: "Invalid service category." });
  if (notes !== undefined && typeof notes !== "string") return res.status(400).json({ message: "notes must be a string." });
  try { const lead = await updateLead(req.params.id, req.auth!.businessId, { status, serviceCategory, notes }); if (!lead) return res.status(404).json({ message: "Lead not found." }); res.json({ lead }); } catch (error) { console.error("Failed to update lead:", error); res.status(500).json({ message: "Failed to update lead." }); }
});

export default router;
