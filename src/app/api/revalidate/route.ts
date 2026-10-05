import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/** Constant-time compare so the secret can't be guessed from response timing. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Called by Livolife-Backend after a successful product/category write.
// The path is fixed to the homepage — never taken from the request — so this
// endpoint can't be used to invalidate anything else. The page regenerates on
// its next visit, so a burst of admin edits costs a single ISR write.
export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET;
  const provided = request.headers.get("x-revalidate-secret");

  if (!expected || !provided || !secretMatches(provided, expected)) {
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }

  revalidatePath("/");
  return NextResponse.json({ revalidated: true });
}
