import type { Service } from "@camluk/shared";

export const camlukServices: Service[] = [
  {
    id: "web-development",
    name: "Web Development",
    category: "web-development",
    description: "Modern websites and web applications.",
    active: true
  },
  {
    id: "business-software",
    name: "Business Software",
    category: "business-software",
    description:
      "Custom systems for daily operations, sales, stock, customers and reporting.",
    active: true
  },
  {
    id: "ai-automation",
    name: "AI & Automation",
    category: "ai-automation",
    description:
      "Smarter operations with less repetitive work through AI and automation.",
    active: true
  },
  {
    id: "cloud-deployment",
    name: "Cloud & Deployment",
    category: "cloud-deployment",
    description:
      "Cloud infrastructure, deployment and hosting solutions for digital products.",
    active: true
  }
];