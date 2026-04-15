"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = {
  error?: string;
};

export async function signIn(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Credenciales incorrectas" };
  }

  const { email, password } = parsed.data;

  const isValid = email === "admin@sigci.com" && password === "password123";

  if (!isValid) {
    return { error: "Credenciales incorrectas" };
  }

  redirect("/dashboard");
}