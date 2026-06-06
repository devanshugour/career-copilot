export const APP = {
  name: "Career Copilot",
  tagline: "From Resume to Offer — Your AI Career Copilot",
} as const;

export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 12,
  maxPageSize: 50,
} as const;

export const UPLOAD = {
  maxResumeBytes: 5 * 1024 * 1024,
  acceptedMime: ["application/pdf"] as const,
} as const;
