export interface LoginDataResponse {
  message: string;
  csrfToken: string | string[];
  captchaKey: string | string[];
  captchaBase64: string;
  cookies: string[] | undefined;
}

export interface LoginResult {
  status: string;
  message: string;
  location?: string;
  sessionCookies?: string[];
}
