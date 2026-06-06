import { notFound } from "next/navigation";
import { requireSession } from "@/services/auth/session";
import { prisma } from "@/lib/prisma";
import { SessionRunner } from "@/features/interview/session-runner";

export default async function InterviewSessionPage(props: PageProps<"/interview/[sessionId]">) {
  const session = await requireSession();
  const { sessionId } = await props.params;
  const data = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: { questions: { orderBy: { order: "asc" }, include: { answer: true } } },
  });
  if (!data) notFound();

  const initial = {
    id: data.id,
    jobTitle: data.jobTitle,
    overallScore: data.overallScore,
    questions: data.questions.map((q) => ({
      id: q.id,
      order: q.order,
      type: q.type,
      prompt: q.prompt,
      rubric: q.rubric,
      answer: q.answer
        ? {
            answer: q.answer.answer,
            score: q.answer.score,
            accuracy: q.answer.accuracy,
            communication: q.answer.communication,
            completeness: q.answer.completeness,
            relevance: q.answer.relevance,
            strengths: q.answer.strengths,
            weaknesses: q.answer.weaknesses,
            suggestedAnswer: q.answer.suggestedAnswer,
          }
        : null,
    })),
  };

  return <SessionRunner session={initial} />;
}
