export type User = {
  id: number;
  email: string;
  nickname: string;
};

export type SignupInput = {
  email: string;
  nickname: string;
  password: string;
};

export type SignupErrors = Partial<Record<keyof SignupInput, string>>;

export type SignupState = {
  errors: SignupErrors;
  values: { email: string; nickname: string };
};
