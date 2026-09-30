import { expect, type Page } from "@playwright/test";

export type TestUser = { email: string; nickname: string; password: string };

let seq = 0;

// 테스트끼리 겹치지 않는 사용자 값을 만든다. 닉네임은 20자 이하.
export function uniqueUser(): TestUser {
  const id = `${Date.now().toString(36)}${(seq++).toString(36)}`;
  return { email: `u${id}@test.dev`, nickname: `u_${id}`, password: "password123" };
}

// /signup 에서 가입하고 홈으로 이동할 때까지 기다린다.
export async function signUp(page: Page, user: TestUser = uniqueUser()): Promise<TestUser> {
  await page.goto("/signup");
  await page.getByLabel("이메일").fill(user.email);
  await page.getByLabel("닉네임").fill(user.nickname);
  await page.getByLabel("비밀번호").fill(user.password);
  await page.getByRole("button", { name: "가입하기" }).click();
  await expect(page).toHaveURL("/");
  return user;
}
