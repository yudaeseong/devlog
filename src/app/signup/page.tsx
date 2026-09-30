import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "회원가입 · Devlog",
};

export default function SignupPage() {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-16">
      <h1 className="text-2xl font-bold">회원가입</h1>
      <SignupForm />
    </main>
  );
}
