import { getDb } from "@/lib/db";
import type { User } from "./types";

export class DuplicateUserError extends Error {
  constructor(readonly field: "email" | "nickname") {
    super(`duplicate ${field}`);
  }
}

// UNIQUE 위반은 어느 컬럼인지 구분해 DuplicateUserError 로 바꾼다.
export async function insertUser(email: string, nickname: string, passwordHash: string): Promise<number> {
  try {
    const result = await getDb().execute({
      sql: "INSERT INTO users (email, nickname, password_hash, created_at) VALUES (?, ?, ?, ?)",
      args: [email, nickname, passwordHash, new Date().toISOString()],
    });
    return Number(result.lastInsertRowid);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE") && message.includes("users.email")) throw new DuplicateUserError("email");
    if (message.includes("UNIQUE") && message.includes("users.nickname")) throw new DuplicateUserError("nickname");
    throw error;
  }
}

export async function insertSession(tokenHash: string, userId: number, expiresAt: Date): Promise<void> {
  await getDb().execute({
    sql: "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    args: [tokenHash, userId, expiresAt.toISOString(), new Date().toISOString()],
  });
}

export async function findUserBySessionHash(tokenHash: string): Promise<User | null> {
  const result = await getDb().execute({
    sql: `SELECT users.id, users.email, users.nickname
          FROM sessions JOIN users ON users.id = sessions.user_id
          WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    args: [tokenHash, new Date().toISOString()],
  });
  const row = result.rows[0];
  if (!row) return null;
  return { id: Number(row.id), email: String(row.email), nickname: String(row.nickname) };
}
