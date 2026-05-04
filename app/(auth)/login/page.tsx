"use client";

import { useActionState, useState } from "react";
import {
  AcademicCapIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type LoginState } from "./actions";

const initialState: LoginState = {};


export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="grid min-h-screen bg-neutral lg:grid-cols-[1.1fr_1fr]">
      {/* Panel institucional — solo desktop. aria-hidden porque es decorativo. */}
      <aside
        aria-hidden="true"
        className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex"
      >
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary-foreground/10">
            <AcademicCapIcon className="size-6" aria-hidden />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight">
            UTM &middot; SIGCI
          </span>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/70">
            Plataforma academica
          </p>
          <h2 className="font-heading text-4xl font-bold leading-tight tracking-tight">
            Gestion de calificaciones e informacion academica.
          </h2>
          <p className="text-sm leading-relaxed text-primary-foreground/80">
            Accede a credenciales digitales, grupos, tramites y reportes
            desde un solo lugar.
          </p>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/60">
          Universidad Tecnologica de la Mixteca
        </p>

        {/* Acento decorativo: blur circular secundario en esquina superior derecha. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-secondary/30 blur-3xl"
        />
      </aside>

      {/* Formulario */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <header className="mb-8 space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Acceso SIGCI
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-primary">
              Iniciar sesion
            </h1>
            <p className="text-sm text-muted-foreground">
              Ingresa con tu cuenta institucional para continuar.
            </p>
          </header>

          {state?.error ? (
            <Alert variant="destructive" className="mb-6">
              <ExclamationTriangleIcon aria-hidden />
              <AlertTitle>No pudimos iniciar tu sesion</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <form action={formAction} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electronico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="correo@gs.utm.mx"
                required
                autoFocus
                disabled={isPending}
                className="h-11"
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
                  placeholder="********"
                  required
                  disabled={isPending}
                  className="h-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "Ocultar contrasena" : "Mostrar contrasena"
                  }
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="size-4" aria-hidden />
                  ) : (
                    <EyeIcon className="size-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                  Verificando...
                </span>
              ) : (
                "Iniciar sesion"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Problemas para acceder? Contacta a servicios escolares.
          </p>
        </div>
      </section>
    </main>
  );
}
