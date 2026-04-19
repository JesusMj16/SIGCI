"use client";

import { useTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { reactivarUsuarioYGenerarCredencial } from "./actions";

export function ReactivarUsuarioButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onClick() {
    setMsg(null);
    startTransition(async () => {
      const res = await reactivarUsuarioYGenerarCredencial(userId);
      setMsg(res.ok ? "Reactivado" : `Error: ${res.error}`);
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={isPending}
        aria-label="Reactivar usuario y regenerar credencial"
      >
        {isPending ? "Reactivando..." : "Reactivar"}
      </Button>
      {msg && (
        <span
          aria-live="polite"
          className={
            "text-xs " +
            (msg.startsWith("Error") ? "text-destructive" : "text-primary")
          }
        >
          {msg}
        </span>
      )}
    </span>
  );
}
