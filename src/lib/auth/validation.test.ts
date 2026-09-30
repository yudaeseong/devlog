import { describe, expect, it } from "vitest";
import { MESSAGES, normalizeEmail, validateSignup } from "./validation";

const valid = { email: "user@test.dev", nickname: "dev_01", password: "12345678" };

describe("validateSignup", () => {
  it("올바른 입력은 오류가 없다", () => {
    expect(validateSignup(valid)).toEqual({});
  });

  it.each(["abc", "a@b", "a b@test.dev", "@test.dev", "user@", ""])("이메일 %j 은 거절한다", (email) => {
    expect(validateSignup({ ...valid, email }).email).toBe(MESSAGES.email);
  });

  it("이메일 앞뒤 공백과 대문자는 정규화한다", () => {
    expect(normalizeEmail("  User@Test.DEV ")).toBe("user@test.dev");
    expect(validateSignup({ ...valid, email: "  User@Test.DEV " })).toEqual({});
  });

  it.each(["ab", "a".repeat(20), "a_1", "ABC_def_123"])("닉네임 %j 은 허용한다", (nickname) => {
    expect(validateSignup({ ...valid, nickname }).nickname).toBeUndefined();
  });

  it.each(["a", "a".repeat(21), "한글닉", "a b", "a-b", ""])("닉네임 %j 은 거절한다", (nickname) => {
    expect(validateSignup({ ...valid, nickname }).nickname).toBe(MESSAGES.nickname);
  });

  it("비밀번호는 8자 이상이어야 한다", () => {
    expect(validateSignup({ ...valid, password: "1234567" }).password).toBe(MESSAGES.passwordShort);
    expect(validateSignup({ ...valid, password: "12345678" }).password).toBeUndefined();
  });

  it("비밀번호는 72바이트를 넘을 수 없다", () => {
    expect(validateSignup({ ...valid, password: "a".repeat(72) }).password).toBeUndefined();
    expect(validateSignup({ ...valid, password: "a".repeat(73) }).password).toBe(MESSAGES.passwordLong);
    expect(validateSignup({ ...valid, password: "가".repeat(25) }).password).toBe(MESSAGES.passwordLong);
  });
});
