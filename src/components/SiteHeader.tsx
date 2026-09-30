import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-2 justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold">
          Devlog
        </Link>
        <nav aria-label="주 메뉴" className="flex items-center gap-4 text-sm">
          <Link href="/write" className="hover:underline">
            글쓰기
          </Link>
          {user ? (
            <span className="font-medium">{user.nickname}</span>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                로그인
              </Link>
              <Link href="/signup" className="hover:underline">
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
