import type { ResumeProfile } from "@/types/resume";
import type {
  JdAnalysis,
  JobMatch,
  CareerReadiness,
  InterviewQuestionGen,
  InterviewEvaluation,
  ApplicationGuide,
} from "@/types/analysis";

export interface AIService {
  /**
   * Parse a PDF resume directly using Claude's native document input.
   * Pass the raw PDF bytes — no text extraction needed client-side.
   */
  parseResume(pdf: Buffer): Promise<ResumeProfile>;

  matchJob(input: {
    profile: ResumeProfile;
    jobTitle: string;
    jobSkills: string[];
    jobDescription: string;
  }): Promise<JobMatch>;

  analyzeResumeVsJd(input: {
    profile: ResumeProfile;
    jobDescription: string;
  }): Promise<JdAnalysis>;

  careerReadiness(input: {
    profile: ResumeProfile;
    latestAnalysis?: JdAnalysis;
  }): Promise<CareerReadiness>;

  generateInterview(input: {
    profile: ResumeProfile;
    jobTitle: string;
    jdSnippet?: string;
    count?: number;
  }): Promise<InterviewQuestionGen>;

  evaluateAnswer(input: {
    question: string;
    answer: string;
    rubric?: string;
    profile?: ResumeProfile;
  }): Promise<InterviewEvaluation>;

  /**
   * Rich head-to-head analysis of a candidate vs a specific job.
   * Returns match %, pros / cons, readiness narrative, missing skills,
   * a personalized learning roadmap, practice tips, and a draft cover-letter email.
   */
  applicationGuide(input: {
    profile: ResumeProfile;
    jobTitle: string;
    company: string;
    location: string;
    jobLevel: string;
    jobSkills: { name: string; required: boolean }[];
    jobDescription: string;
    responsibilities: string[];
  }): Promise<ApplicationGuide>;
}
