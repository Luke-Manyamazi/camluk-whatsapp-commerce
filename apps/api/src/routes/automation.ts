import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  createAutomationRule,
  deleteAutomationRule,
  getAutomationRuleById,
  getAutomationRules,
  updateAutomationRule,
} from "../services/automation.js";
import { evaluateAutomationRules } from "../services/automation-engine.js";
import {
  executeAutomationAction
} from "../services/automation-actions.js";

const router = Router();

const validMatchTypes = ["any", "all", "exact", "contains"] as const;

const validActionTypes = [
  "send_reply",
  "create_lead",
  "update_lead",
  "change_status",
  "add_tag",
  "human_handoff",
] as const;

router.post(
  "/test",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { message } = req.body;

      if (
        typeof message !== "string" ||
        !message.trim()
      ) {
        res.status(400).json({
          error: "Bad Request",
          message: "Message is required."
        });

        return;
      }

      const result =
        await evaluateAutomationRules(
          req.auth!.businessId,
          message
        );

      res.json({
        input: message,
        ...result
      });
    } catch (error) {
      console.error(
        "Failed to test automation rules:",
        error
      );

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to evaluate automation rules."
      });
    }
  }
);

router.post(
  "/execute",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        message,
        customerId,
        conversationId,
        messageId
      } = req.body;

      if (
        typeof message !== "string" ||
        !message.trim()
      ) {
        res.status(400).json({
          error: "Bad Request",
          message: "Message is required."
        });

        return;
      }

      const match =
        await evaluateAutomationRules(
          req.auth!.businessId,
          message
        );

      if (!match.matched) {
        res.json({
          input: message,
          matched: false,
          actionExecuted: false,
          result: {
            message:
              "No automation rule matched."
          }
        });

        return;
      }

      const actionResult =
        await executeAutomationAction(
          match,
          {
            businessId:
              req.auth!.businessId,
            customerId,
            conversationId,
            messageId,
            inputText: message
          }
        );

      res.json({
        input: message,
        matched: true,
        rule: match.rule,
        responseText:
          match.responseText,
        actionType:
          match.actionType,
        actionExecuted:
          actionResult.success,
        actionResult
      });
    } catch (error) {
      console.error(
        "Failed to execute automation:",
        error
      );

      res.status(500).json({
        error: "Internal Server Error",
        message:
          "Failed to execute automation."
      });
    }
  }
);

router.get("/rules", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const rules = await getAutomationRules(req.auth!.businessId);

    res.json({
      rules,
    });
  } catch (error) {
    console.error("Failed to fetch automation rules:", error);

    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch automation rules.",
    });
  }
});

router.get(
  "/rules/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const rule = await getAutomationRuleById(
        String(req.params.id),
        req.auth!.businessId,
      );

      if (!rule) {
        res.status(404).json({
          error: "Not Found",
          message: "Automation rule not found.",
        });

        return;
      }

      res.json({
        rule,
      });
    } catch (error) {
      console.error("Failed to fetch automation rule:", error);

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch automation rule.",
      });
    }
  },
);

router.post("/rules", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      description,
      enabled,
      priority,
      matchType,
      keywords,
      responseText,
      actionType,
      actionConfig,
    } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        error: "Bad Request",
        message: "Rule name is required.",
      });

      return;
    }

    if (
      !Array.isArray(keywords) ||
      keywords.some(
        (keyword: unknown) => typeof keyword !== "string" || !keyword.trim(),
      )
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: "Keywords must be a non-empty array of strings.",
      });

      return;
    }

    if (matchType !== undefined && !validMatchTypes.includes(matchType)) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid match type.",
      });

      return;
    }

    if (actionType !== undefined && !validActionTypes.includes(actionType)) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid action type.",
      });

      return;
    }

    const rule = await createAutomationRule({
      businessId: req.auth!.businessId,
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : null,
      enabled: typeof enabled === "boolean" ? enabled : true,
      priority: typeof priority === "number" ? priority : 0,
      matchType,
      keywords: keywords.map((keyword: string) => keyword.trim()),
      responseText:
        typeof responseText === "string" ? responseText.trim() : null,
      actionType,
      actionConfig:
        actionConfig && typeof actionConfig === "object" ? actionConfig : {},
    });

    res.status(201).json({
      rule,
    });
  } catch (error) {
    console.error("Failed to create automation rule:", error);

    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create automation rule.",
    });
  }
});

router.patch(
  "/rules/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        name,
        description,
        enabled,
        priority,
        matchType,
        keywords,
        responseText,
        actionType,
        actionConfig,
      } = req.body;

      if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        res.status(400).json({
          error: "Bad Request",
          message: "Rule name cannot be empty.",
        });

        return;
      }

      if (
        keywords !== undefined &&
        (!Array.isArray(keywords) ||
          keywords.some(
            (keyword: unknown) =>
              typeof keyword !== "string" || !keyword.trim(),
          ))
      ) {
        res.status(400).json({
          error: "Bad Request",
          message: "Keywords must be an array of non-empty strings.",
        });

        return;
      }

      if (matchType !== undefined && !validMatchTypes.includes(matchType)) {
        res.status(400).json({
          error: "Bad Request",
          message: "Invalid match type.",
        });

        return;
      }

      if (actionType !== undefined && !validActionTypes.includes(actionType)) {
        res.status(400).json({
          error: "Bad Request",
          message: "Invalid action type.",
        });

        return;
      }

      const rule = await updateAutomationRule(
        String(req.params.id),
        req.auth!.businessId,
        {
          name: typeof name === "string" ? name.trim() : undefined,
          description:
            typeof description === "string" ? description.trim() : description,
          enabled,
          priority,
          matchType,
          keywords: Array.isArray(keywords)
            ? keywords.map((keyword: string) => keyword.trim())
            : undefined,
          responseText:
            typeof responseText === "string"
              ? responseText.trim()
              : responseText,
          actionType,
          actionConfig,
        },
      );

      if (!rule) {
        res.status(404).json({
          error: "Not Found",
          message: "Automation rule not found.",
        });

        return;
      }

      res.json({
        rule,
      });
    } catch (error) {
      console.error("Failed to update automation rule:", error);

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to update automation rule.",
      });
    }
  },
);

router.delete(
  "/rules/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const rule = await deleteAutomationRule(
        String(req.params.id),
        req.auth!.businessId,
      );

      if (!rule) {
        res.status(404).json({
          error: "Not Found",
          message: "Automation rule not found.",
        });

        return;
      }

      res.json({
        message: "Automation rule deleted successfully.",
        rule,
      });
    } catch (error) {
      console.error("Failed to delete automation rule:", error);

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to delete automation rule.",
      });
    }
  },
);

export default router;
