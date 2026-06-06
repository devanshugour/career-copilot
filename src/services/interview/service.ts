import { prisma } from "@/lib/prisma";
import { ai } from "@/services/ai";
import { resumeRepo } from "@/services/resume/repository";
import type { ResumeProfile } from "@/types/resume";

export async function startInterviewSession(opts: {
  userId: string;
  jobId?: string;
  jobTitle?: string;
  jdSnippet?: string;
  count?: number;
}) {
  const resume = await resumeRepo.getActive(opts.userId);
  if (!resume) throw new Error("Upload a resume first");

  const profile = resume.parsedProfile as unknown as ResumeProfile;
  const job = opts.jobId
    ? await prisma.job.findUnique({ where: { id: opts.jobId }, include: { skills: { include: { skill: true } } } })
    : null;
  const title = job?.title ?? opts.jobTitle ?? profile.headline ?? "Software Engineer";
  const jd = job ? job.description : opts.jdSnippet;

  const { questions } = await ai.generateInterview({
    profile,
    jobTitle: title,
    jdSnippet: jd?.slice(0, 1500),
    count: opts.count ?? 5,
  });

  const session = await prisma.interviewSession.create({
    data: {
      userId: opts.userId,
      jobId: job?.id,
      resumeId: resume.id,
      jobTitle: title,
      jdSnippet: jd?.slice(0, 500),
      questions: {
        create: questions.map((q) => ({
          order: q.order,
          type: q.type,
          prompt: q.prompt,
          rubric: q.rubric,
        })),
      },
    },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  return session;
}

export async function evaluateInterviewAnswer(opts: {
  userId: string;
  questionId: string;
  answer: string;
}) {
  const question = await prisma.interviewQuestion.findUnique({
    where: { id: opts.questionId },
    include: { session: { include: { user: true } } },
  });
  if (!question || question.session.userId !== opts.userId) throw new Error("Forbidden");

  const resume = await resumeRepo.getActive(opts.userId);
  const profile = resume?.parsedProfile as unknown as ResumeProfile | undefined;

  const evaluation = await ai.evaluateAnswer({
    question: question.prompt,
    answer: opts.answer,
    rubric: question.rubric ?? undefined,
    profile,
  });

  const saved = await prisma.interviewAnswer.upsert({
    where: { questionId: question.id },
    create: {
      questionId: question.id,
      answer: opts.answer,
      score: evaluation.score,
      accuracy: evaluation.accuracy,
      communication: evaluation.communication,
      completeness: evaluation.completeness,
      relevance: evaluation.relevance,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      suggestedAnswer: evaluation.suggestedAnswer,
    },
    update: {
      answer: opts.answer,
      score: evaluation.score,
      accuracy: evaluation.accuracy,
      communication: evaluation.communication,
      completeness: evaluation.completeness,
      relevance: evaluation.relevance,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      suggestedAnswer: evaluation.suggestedAnswer,
    },
  });

  await refreshSessionScore(question.sessionId);
  return saved;
}

async function refreshSessionScore(sessionId: string) {
  const answers = await prisma.interviewAnswer.findMany({
    where: { question: { sessionId } },
    select: { score: true },
  });
  if (!answers.length) return;
  const avg = Math.round(answers.reduce((s, a) => s + a.score, 0) / answers.length);
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: { _count: { select: { questions: true } } },
  });
  if (!session) return;
  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      overallScore: avg,
      status: answers.length >= session._count.questions ? "completed" : "active",
    },
  });
}
