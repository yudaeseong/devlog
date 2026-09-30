import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueUser, type TestUser } from "./helpers";

const NICKNAME_ERROR = "닉네임은 2~20자의 영문, 숫자, 밑줄(_)만 쓸 수 있어요";

async function submitSignup(page: Page, user: TestUser) {
  await page.goto("/signup");
  await page.getByLabel("이메일").fill(user.email);
  await page.getByLabel("닉네임").fill(user.nickname);
  await page.getByLabel("비밀번호").fill(user.password);
  await page.getByRole("button", { name: "가입하기" }).click();
}

test.describe("F003 회원가입", () => {
  test("기준1: /signup 에서 이메일, 닉네임, 비밀번호를 입력해 가입할 수 있다", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("이메일")).toBeVisible();
    await expect(page.getByLabel("닉네임")).toBeVisible();
    await expect(page.getByLabel("비밀번호")).toBeVisible();

    await signUp(page);
  });

  test("기준2: 가입에 성공하면 로그인된 상태로 홈으로 이동하고 헤더에 닉네임이 보인다", async ({ page, context }) => {
    const user = await signUp(page);

    await expect(page).toHaveURL("/");
    const banner = page.getByRole("banner");
    await expect(banner.getByText(user.nickname)).toBeVisible();
    await expect(banner.getByRole("link", { name: "로그인" })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("banner").getByText(user.nickname)).toBeVisible();

    const session = (await context.cookies()).find((c) => c.name === "devlog_session");
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe("Lax");
  });

  test("기준2: 로그인하지 않은 방문자의 헤더에는 닉네임 대신 로그인 링크가 보인다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("link", { name: "로그인" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "회원가입" })).toHaveAttribute("href", "/signup");
  });

  test("기준3: 이메일 형식이 틀리면 '올바른 이메일을 입력해 주세요' 오류가 보인다", async ({ page, context }) => {
    for (const email of ["abc", "a@b", "a b@test.dev"]) {
      await submitSignup(page, { ...uniqueUser(), email });
      await expect(page.getByText("올바른 이메일을 입력해 주세요")).toBeVisible();
      await expect(page.getByLabel("이메일")).toHaveAccessibleDescription("올바른 이메일을 입력해 주세요");
      await expect(page).toHaveURL("/signup");
    }
    expect((await context.cookies()).find((c) => c.name === "devlog_session")).toBeUndefined();
  });

  test("기준4: 비밀번호가 8자 미만이면 '비밀번호는 8자 이상이어야 해요' 오류가 보인다", async ({ page }) => {
    await submitSignup(page, { ...uniqueUser(), password: "1234567" });
    await expect(page.getByText("비밀번호는 8자 이상이어야 해요")).toBeVisible();
    await expect(page.getByLabel("비밀번호")).toHaveAccessibleDescription("비밀번호는 8자 이상이어야 해요");
    await expect(page).toHaveURL("/signup");

    // 정확히 8자는 가입된다
    await signUp(page, { ...uniqueUser(), password: "12345678" });
  });

  test("기준5: 닉네임 규칙을 어기면 오류가 보인다", async ({ page }) => {
    for (const nickname of ["a", "a".repeat(21), "한글닉", "a b", "a-b"]) {
      await submitSignup(page, { ...uniqueUser(), nickname });
      await expect(page.getByText(NICKNAME_ERROR)).toBeVisible();
      await expect(page.getByLabel("닉네임")).toHaveAccessibleDescription(NICKNAME_ERROR);
      await expect(page).toHaveURL("/signup");
    }
  });

  test("기준5: 2자, 20자, 밑줄이 들어간 닉네임은 가입된다", async ({ browser }) => {
    const suffix = Date.now().toString(36).slice(-6);
    const nicknames = [`${suffix.slice(0, 2)}`, `z${suffix}`.padEnd(20, "0"), `a_${suffix}`];
    for (const nickname of nicknames) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const user = await signUp(page, { ...uniqueUser(), nickname });
      await expect(page.getByRole("banner").getByText(user.nickname)).toBeVisible();
      await context.close();
    }
  });

  test("서버 검증: 여러 필드가 틀리면 오류가 함께 보이고 가입되지 않는다", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("이메일").fill("not-an-email");
    await page.getByLabel("닉네임").fill("x");
    await page.getByLabel("비밀번호").fill("short");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByText("올바른 이메일을 입력해 주세요")).toBeVisible();
    await expect(page.getByText(NICKNAME_ERROR)).toBeVisible();
    await expect(page.getByText("비밀번호는 8자 이상이어야 해요")).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "로그인" })).toBeVisible();
  });
});
