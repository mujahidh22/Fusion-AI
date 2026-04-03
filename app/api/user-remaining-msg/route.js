import { currentUser } from "@clerk/nextjs/server";
import { aj } from "@/config/Arcjet";
import { NextResponse } from "next/server";

export async function GET(req, res) {
    const userId = await currentUser();
    const decision = await aj.protect(req, {
        userId: userId?.primaryEmailAddress?.emailAddress,
        requested: 0
    });

    const remainingToken = decision.reason?.remaining ?? 5;
    return NextResponse.json({ remainingToken: remainingToken });
}