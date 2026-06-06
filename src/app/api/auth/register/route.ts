import { NextResponse } from "next/server";
import { registerUser } from "@/services/auth/register";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const result = await registerUser(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ userId: result.userId }, { status: 201 });
}
