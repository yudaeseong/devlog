import { expect, test } from "@playwright/test";

test.describe("F001 공통 레이아웃", () => {
  test("기준1: 헤더의 'Devlog'를 누르면 홈으로 이동한다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("link", { name: "Devlog" })).toBeVisible();

    await page.goto("/no-such-page");
    const logo = page.getByRole("banner").getByRole("link", { name: "Devlog" });
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("기준2: 헤더에 '글쓰기'와 '로그인' 링크가 있다", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "글쓰기" })).toHaveAttribute("href", "/write");
    await expect(banner.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
  });

  test("기준3: 하단 푸터에 '© Devlog' 문구가 있다", async ({ page }) => {
    for (const path of ["/", "/no-such-page"]) {
      await page.goto(path);
      await expect(page.getByRole("contentinfo").getByText("© Devlog")).toBeVisible();
    }
  });
});
