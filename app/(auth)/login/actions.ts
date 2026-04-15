"use server";

import { signIn as authSignIn } from "@/auth";
import { AuthError } from "next-auth";

export type LoginState = {
  error?: string;
};

export async function signInAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Credenciales incorrectas" };
  }

  try {
    await authSignIn("credentials", {
      email,
      password,
      // El proxy redirige por rol cuando un usuario autenticado entra a /login.
      redirectTo: "/login",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Credenciales incorrectas" };
    }

    throw error;
  }

  return {};
}
