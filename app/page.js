"use client"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function Home() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <h1>Fusion AI</h1>
      <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>Toggle Theme</Button>
    </div>
  );
}
