import type { SignupErrors, SignupInput } from "./types";

export const MESSAGES = {
  email: "올바른 이메일을 입력해 주세요",
  nickname: "닉네임은 2~20자의 영문, 숫자, 밑줄(_)만 쓸 수 있어요",
  passwordShort: "비밀번호는 8자 이상이어야 해요",
  passwordLong: "비밀번호는 72자 이하여야 해요",
  emailTaken: "이미 사용 중인 이메일이에요",
  nicknameTaken: "이미 사용 중인 닉네임이에요",
} as const;

// 공백 없는 local@domain.tld 형태만 허용한다.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NICKNAME_PATTERN = /^[A-Za-z0-9_]{2,20}$/;
// bcrypt 는 72바이트 뒤를 무시하므로 그보다 긴 비밀번호는 받지 않는다.
const PASSWORD_MAX_BYTES = 72;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateSignup(input: SignupInput): SignupErrors {
  const errors: SignupErrors = {};

  const email = normalizeEmail(input.email);
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) errors.email = MESSAGES.email;

  if (!NICKNAME_PATTERN.test(input.nickname)) errors.nickname = MESSAGES.nickname;

  if (input.password.length < 8) errors.password = MESSAGES.passwordShort;
  else if (new TextEncoder().encode(input.password).length > PASSWORD_MAX_BYTES) {
    errors.password = MESSAGES.passwordLong;
  }

  return errors;
}
