"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABEL } from "@/lib/presentation/user-display";
import type { UserRole } from "@/lib/generated/prisma/enums";
import { CARRERAS_UTM } from "@/lib/contracts/carreras";
import { crearUsuarioConCredencial } from "../actions";

const EMAIL_DOMAIN = "@gs.utm.mx";

// Sanitizers: filtran caracteres invalidos al teclear (impiden que entren al state).
const onlyDigits = (v: string) => v.replace(/\D+/g, "").slice(0, 10);
const onlyLetters = (v: string) =>
  v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+/g, "");
const onlyEmailLocal = (v: string) =>
  v.replace(/[^a-zA-Z0-9._-]+/g, "").toLowerCase();

type FormState = {
  matricula: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  carrera: string;
  role: UserRole | "";
};

const INITIAL: FormState = {
  matricula: "",
  nombre: "",
  apellidos: "",
  email: "",
  password: "",
  carrera: "",
  role: "",
};

const ROLE_OPTIONS = (Object.keys(ROLE_LABEL) as UserRole[]).map((r) => ({
  value: r,
  label: ROLE_LABEL[r],
}));

export function NuevoUsuarioForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(INITIAL);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    | { kind: "error"; message: string }
    | { kind: "success"; message: string }
    | null
  >(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);

    if (!state.role) {
      setFeedback({ kind: "error", message: "Selecciona un rol." });
      return;
    }

    startTransition(async () => {
      const res = await crearUsuarioConCredencial({
        matricula: state.matricula,
        nombre: state.nombre,
        apellidos: state.apellidos,
        email: `${state.email}${EMAIL_DOMAIN}`,
        password: state.password,
        carrera: state.carrera,
        role: state.role as UserRole,
      });

      if (res.ok) {
        setFeedback({
          kind: "success",
          message: `Credencial generada (${res.data.credentialId}).`,
        });
        setState(INITIAL);
        router.push("/admin/usuarios");
        router.refresh();
      } else {
        setFeedback({ kind: "error", message: res.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-xl bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Matrícula" htmlFor="matricula">
          <Input
            id="matricula"
            required
            autoComplete="off"
            inputMode="numeric"
            maxLength={10}
            pattern="^\d{10}$"
            title="Debe contener exactamente 10 dígitos numéricos (ej. 2024000123)"
            value={state.matricula}
            onChange={(e) => update("matricula", onlyDigits(e.target.value))}
            onKeyDown={(e) => {
              if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (!/^\d+$/.test(text)) e.preventDefault();
            }}
          />
        </Field>
        <Field label="Usuario institucional" htmlFor="email">
          <div className="flex items-center">
            <Input
              id="email"
              type="text"
              required
              autoComplete="off"
              pattern="^[^\s@]+$"
              title="Ingresa solo tu nombre de usuario, sin el @gs.utm.mx ni espacios"
              value={state.email}
              onChange={(e) => update("email", onlyEmailLocal(e.target.value))}
              className="rounded-r-none focus-visible:z-10"
            />
            <span className="flex h-9 items-center justify-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap">
              {EMAIL_DOMAIN}
            </span>
          </div>
        </Field>
        <Field label="Nombre" htmlFor="nombre">
          <Input
            id="nombre"
            required
            pattern="^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$"
            title="Solo se permiten letras y espacios, sin números ni símbolos"
            value={state.nombre}
            onChange={(e) => update("nombre", onlyLetters(e.target.value))}
          />
        </Field>
        <Field label="Apellidos" htmlFor="apellidos">
          <Input
            id="apellidos"
            required
            pattern="^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$"
            title="Solo se permiten letras y espacios, sin números ni símbolos"
            value={state.apellidos}
            onChange={(e) => update("apellidos", onlyLetters(e.target.value))}
          />
        </Field>
        <Field label="Carrera" htmlFor="carrera">
          <select
            id="carrera"
            required
            value={state.carrera}
            onChange={(e) => update("carrera", e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm capitalize outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Selecciona una carrera…
            </option>
            {CARRERAS_UTM.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Contraseña inicial" htmlFor="password">
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            pattern="(?=.*[A-Z]).{8,}"
            title="Mínimo 8 caracteres y al menos una letra mayúscula"
            value={state.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </Field>
        <Field label="Rol" htmlFor="role">
          <select
            id="role"
            required
            value={state.role}
            onChange={(e) => update("role", e.target.value as UserRole | "")}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Selecciona un rol…
            </option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {feedback && (
        <p
          aria-live="polite"
          className={
            "rounded-lg px-3 py-2 text-sm " +
            (feedback.kind === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary")
          }
        >
          {feedback.message}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Generando credencial…" : "Registrar y generar QR"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
