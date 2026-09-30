import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">404</p>
      <h1 className="mt-2 text-3xl font-bold">페이지를 찾을 수 없어요</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">주소가 바뀌었거나 삭제된 페이지예요. 주소를 다시 확인해 주세요.</p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        홈으로
      </Link>
    </main>
  );
}
