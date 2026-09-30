"use client";

import { useActionState } from "react";
import { signupAction } from "@/lib/auth/actions";
import type { SignupState } from "@/lib/auth/types";

const initialState: SignupState = { errors: {}, values: { email: "", nickname: "" } };

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900 aria-invalid:border-red-500";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const { errors, values } = state;

  return (
    // 서버 검증 문구를 보여주기 위해 브라우저 기본 검증은 끈다.
    <form action={formAction} noValidate className="mt-8 flex flex-col gap-5">
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={values.email}
          key={`email-${values.email}`}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={inputClass}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>

      <div>
        <label htmlFor="nickname" className="text-sm font-medium">
          닉네임
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          autoComplete="username"
          required
          defaultValue={values.nickname}
          key={`nickname-${values.nickname}`}
          aria-invalid={errors.nickname ? true : undefined}
          aria-describedby={errors.nickname ? "nickname-error" : "nickname-hint"}
          className={inputClass}
        />
        {errors.nickname ? (
          <FieldError id="nickname-error" message={errors.nickname} />
        ) : (
          <p id="nickname-hint" className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            2~20자의 영문, 숫자, 밑줄(_)
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "password-error" : "password-hint"}
          className={inputClass}
        />
        {errors.password ? (
          <FieldError id="password-error" message={errors.password} />
        ) : (
          <p id="password-hint" className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            8자 이상
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        {pending ? "가입하는 중…" : "가입하기"}
      </button>
    </form>
  );
}
