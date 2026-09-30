import { expect, test } from "@playwright/test";

test.describe("F002 404 페이지", () => {
  test("기준1: 없는 주소는 404 상태와 '페이지를 찾을 수 없어요' 문구를 보여준다", async ({ page }) => {
    for (const path of ["/no-such-page", "/a/b/c"]) {
      const res = await page.goto(path);
      expect(res?.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1, name: "페이지를 찾을 수 없어요" })).toBeVisible();
      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeInViewport();
    }
  });

  test("기준2: '홈으로' 링크를 누르면 홈으로 이동한다", async ({ page }) => {
    await page.goto("/no-such-page");
    const home = page.getByRole("main").getByRole("link", { name: "홈으로" });
    await expect(home).toHaveAttribute("href", "/");
    await home.click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1, name: "Devlog" })).toBeVisible();
  });
});
