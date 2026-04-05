"use client"
import { Suspense } from "react"
import { ChatInputBox } from "./_components/ChatInputBox"

export default function Home() {
  return (
    <div>
      <Suspense fallback={null}>
        <ChatInputBox />
      </Suspense>
    </div>
  );
}
