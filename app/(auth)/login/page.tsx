"use client";

import { useActionState, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-neutral ">
      <div className="flex min-h-screen w-full max-w-1/2 items-center justify-center">
        <section className="flex flex-col w-full min-h-screen justify-around  rounded-2xl bg-card p-6 shadow-lg sm:p-8">
          <header className="mb-6 space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-primary/90">Iniciar sesion</h1>
            <p className="text-sm text-muted-foreground">Accede a tu cuenta para continuar.</p>
          </header>

          {state?.error ? (
            <Alert variant="destructive" className="mb-4 text-center bg-red-200 border-white">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electronico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="correo@gs.utm.mx"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                >
                  <span className="text-xs font-medium">{showPassword ? "Ocultar" : "Mostrar"}</span>
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full hover:bg-primary/35 hover:scale-105 ease-in-out" disabled={isPending}>
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Verificando...
                </span>
              ) : (
                "Iniciar sesion"
              )}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
