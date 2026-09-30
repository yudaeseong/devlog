"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { DuplicateUserError, insertUser } from "./queries";
import { createSession } from "./session";
import type { SignupState } from "./types";
import { MESSAGES, normalizeEmail, validateSignup } from "./validation";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const input = {
    email: field(formData, "email"),
    nickname: field(formData, "nickname"),
    password: field(formData, "password"),
  };
  // 실패하면 이메일·닉네임은 다시 채워 주고, 비밀번호는 돌려주지 않는다.
  const values = { email: input.email, nickname: input.nickname };

  const errors = validateSignup(input);
  if (Object.keys(errors).length > 0) return { errors, values };

  const passwordHash = await bcrypt.hash(input.password, 10);
  let userId: number;
  try {
    userId = await insertUser(normalizeEmail(input.email), input.nickname, passwordHash);
  } catch (error) {
    if (error instanceof DuplicateUserError) {
      const message = error.field === "email" ? MESSAGES.emailTaken : MESSAGES.nicknameTaken;
      return { errors: { [error.field]: message }, values };
    }
    throw error;
  }

  await createSession(userId);
  redirect("/");
}
