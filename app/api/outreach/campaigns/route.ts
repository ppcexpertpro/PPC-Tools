import { NextResponse } from "next/server";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns } from "@/db/schema";
import { createCampaignSchema } from "@/lib/outreach/campaigns/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: z.flattenError(parsed.error) }, { status: 400 });
  }

  const [campaign] = await db.insert(campaigns).values(parsed.data).returning();
  return NextResponse.json({ campaign }, { status: 201 });
}

export async function GET() {
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  return NextResponse.json({ campaigns: rows });
}
