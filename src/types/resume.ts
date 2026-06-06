import { z } from "zod";

export const SkillItemSchema = z.object({
  name: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
  years: z.number().min(0).max(40).default(0),
});

export const ExperienceItemSchema = z.object({
  title: z.string(),
  company: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  highlights: z.array(z.string()).default([]),
});

export const EducationItemSchema = z.object({
  degree: z.string(),
  school: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  grade: z.string().optional(),
});

export const ProjectItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  tech: z.array(z.string()).default([]),
  link: z.string().optional(),
});

export const CertificationItemSchema = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  year: z.string().optional(),
});

export const ResumeProfileSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string(),
  skills: z.array(SkillItemSchema),
  experience: z.array(ExperienceItemSchema),
  education: z.array(EducationItemSchema),
  projects: z.array(ProjectItemSchema),
  certifications: z.array(CertificationItemSchema),
  totalYearsExperience: z.number().min(0).max(50).default(0),
});

export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;
export type SkillItem = z.infer<typeof SkillItemSchema>;
