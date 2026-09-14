import {
  getAutomationRules,
  type AutomationRule
} from "./automation.js";

export interface AutomationMatchResult {
  matched: boolean;
  rule: AutomationRule | null;
  responseText: string | null;
  actionType: AutomationRule["action_type"] | null;
  actionConfig: Record<string, unknown>;
}

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function keywordMatches(
  inputText: string,
  keyword: string,
  matchType: AutomationRule["match_type"]
): boolean {
  const input = normalizeText(inputText);
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) {
    return false;
  }

  switch (matchType) {
    case "exact":
      return input === normalizedKeyword;

    case "contains":
      return input.includes(normalizedKeyword);

    case "any":
      return input.includes(normalizedKeyword);

    case "all":
      return input.includes(normalizedKeyword);

    default:
      return false;
  }
}

function ruleMatches(
  inputText: string,
  rule: AutomationRule
): boolean {
  if (!rule.enabled || rule.keywords.length === 0) {
    return false;
  }

  switch (rule.match_type) {
    case "any":
      return rule.keywords.some((keyword) =>
        keywordMatches(
          inputText,
          keyword,
          "any"
        )
      );

    case "all":
      return rule.keywords.every((keyword) =>
        keywordMatches(
          inputText,
          keyword,
          "all"
        )
      );

    case "exact":
      return rule.keywords.some((keyword) =>
        keywordMatches(
          inputText,
          keyword,
          "exact"
        )
      );

    case "contains":
      return rule.keywords.some((keyword) =>
        keywordMatches(
          inputText,
          keyword,
          "contains"
        )
      );

    default:
      return false;
  }
}

export async function evaluateAutomationRules(
  businessId: string,
  inputText: string
): Promise<AutomationMatchResult> {
  const normalizedInput = normalizeText(inputText);

  if (!normalizedInput) {
    return {
      matched: false,
      rule: null,
      responseText: null,
      actionType: null,
      actionConfig: {}
    };
  }

  const rules = await getAutomationRules(
    businessId
  );

  for (const rule of rules) {
    if (!ruleMatches(normalizedInput, rule)) {
      continue;
    }

    return {
      matched: true,
      rule,
      responseText: rule.response_text,
      actionType: rule.action_type,
      actionConfig: rule.action_config
    };
  }

  return {
    matched: false,
    rule: null,
    responseText: null,
    actionType: null,
    actionConfig: {}
  };
}