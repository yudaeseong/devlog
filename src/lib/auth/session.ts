import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { findUserBySessionHash, insertSession } from "./queries";
import type { User } from "./types";

export const SESSION_COOKIE = "devlog_session";
const SESSION_DAYS = 30;

// DB 에는 토큰 원문이 아니라 해시만 저장한다. DB 가 유출돼도 세션을 가로챌 수 없다.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// 서버 액션이나 route handler 에서만 호출한다. (쿠키 설정)
export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await insertSession(hashToken(token), userId, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

// 모든 권한 검사는 이 함수로 한다. 한 요청 안에서는 한 번만 조회한다.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return findUserBySessionHash(hashToken(token));
});
