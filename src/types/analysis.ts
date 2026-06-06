import { z } from "zod";

export const JobMatchSchema = z.object({
  matchScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missingSkills: z.array(z.string()),
  rationale: z.string(),
});
export type JobMatch = z.infer<typeof JobMatchSchema>;

export const JdAnalysisSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
  atsScore: z.number().min(0).max(100),
  missingSkills: z.array(z.string()),
  matchedSkills: z.array(z.string()),
  resumeOptimizations: z.array(z.string()),
  improvements: z.array(z.string()),
  learningRoadmap: z.array(
    z.object({
      skill: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      durationWeeks: z.number().min(1).max(52),
      resources: z.array(z.string()),
    }),
  ),
  verdict: z.string(),
});
export type JdAnalysis = z.infer<typeof JdAnalysisSchema>;

export const CareerReadinessSchema = z.object({
  careerScore: z.number().min(0).max(100),
  employabilityScore: z.number().min(0).max(100),
  atsReadiness: z.number().min(0).max(100),
  interviewReadiness: z.number().min(0).max(100),
  skillReadiness: z.number().min(0).max(100),
  improvementPlan: z.array(z.string()),
  actionItems: z.array(z.string()),
  recommendations: z.array(z.string()),
});
export type CareerReadiness = z.infer<typeof CareerReadinessSchema>;

export const InterviewQuestionGenSchema = z.object({
  questions: z.array(
    z.object({
      order: z.number().int().min(1),
      type: z.enum(["TECHNICAL", "HR", "BEHAVIORAL", "SCENARIO"]),
      prompt: z.string(),
      rubric: z.string().optional(),
    }),
  ),
});
export type InterviewQuestionGen = z.infer<typeof InterviewQuestionGenSchema>;

export const InterviewEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  accuracy: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  completeness: z.number().min(0).max(100),
  relevance: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestedAnswer: z.string(),
});
export type InterviewEvaluation = z.infer<typeof InterviewEvaluationSchema>;

export const ApplicationGuideSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
  verdict: z.enum(["strong", "good", "stretch", "long_shot"]),
  readinessAssessment: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  skillsToLearn: z.array(
    z.object({
      skill: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      durationWeeks: z.number().min(1).max(52),
      resources: z.array(z.string()),
    }),
  ),
  practiceTips: z.array(z.string()),
  coverLetterEmail: z.string(),
});
export type ApplicationGuide = z.infer<typeof ApplicationGuideSchema>;
