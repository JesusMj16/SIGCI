"use client";

import { useActionState, useState } from "react";
import { signIn, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";


import { satoshi } from "@/app/UI/font"; 

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterPanel, setIsRegisterPanel] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f13",
        padding: "1rem",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');

        .slider-wrapper {
          width: 100%;
          max-width: 820px;
          height: 520px;
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.45);
          background: #fff;
        }

        .panel-signin {
          position: absolute;
          top: 0; left: 0;
          width: 50%; height: 100%;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 44px 40px;
          z-index: 2;
        }

        .panel-register {
          position: absolute;
          top: 0; right: 0;
          width: 50%; height: 100%;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 44px 40px;
          z-index: 2;
        }

        /* El overlay se desliza encima de ambos paneles */
        .overlay {
          position: absolute;
          top: 0; left: 0;
          width: 50%; height: 100%;
          z-index: 10;
          overflow: hidden;
          border-radius: 0 24px 24px 0;
          transition: transform 0.75s cubic-bezier(0.77, 0, 0.175, 1),
                      border-radius 0.75s ease;
        }

        .slider-wrapper.active .overlay {
          transform: translateX(100%);
          border-radius: 24px 0 0 24px;
        }

        .overlay-bg {
          position: absolute; inset: 0;
          background: linear-gradient(150deg, #25d4ae 0%, #0ea882 50%, #0a7d65 100%);
        }

        .bubble {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.13);
        }
        .b1 { width: 180px; height: 180px; top: -50px; left: -65px; }
        .b2 { width: 115px; height: 115px; bottom: 10px; right: -35px; }
        .b3 { width: 65px; height: 65px; top: 46%; left: 60%; }
        .b4 { width: 45px; height: 45px; top: 22px; right: 32px; }
        .b5 { width: 200px; height: 200px; bottom: -90px; left: 8px; background: rgba(255,255,255,0.07); }

        .ov-body {
          position: relative; z-index: 5;
          height: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 44px; text-align: center; color: #fff;
        }

        .ov-body h3 {
          font-family: 'Playfair Display', serif;
          font-size: 30px; line-height: 1.2;
          letter-spacing: -0.5px; margin-bottom: 14px;
        }
        .ov-body p {
          font-size: 13.5px; line-height: 1.65;
          color: rgba(255,255,255,0.85);
          max-width: 210px; margin-bottom: 28px;
        }

        .btn-ghost {
          padding: 11px 30px;
          border: 2px solid rgba(255,255,255,0.85);
          border-radius: 30px;
          color: #fff; background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          cursor: pointer; letter-spacing: 0.3px;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.18); transform: scale(1.04); }

        .panel-heading {
          font-family: 'Playfair Display', serif;
          font-size: 26px; color: #111;
          margin-bottom: 20px;
          align-self: flex-start;
          letter-spacing: -0.4px;
        }

        .input-row { width: 100%; margin-bottom: 11px; }

        .input-label {
          font-size: 12px; color: #888;
          margin-bottom: 5px; display: block;
          font-weight: 500;
        }

        .password-wrap { position: relative; width: 100%; }
        .pw-toggle {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; color: #aaa;
          display: flex; align-items: center;
          padding: 2px; transition: color 0.2s;
        }
        .pw-toggle:hover { color: #20c4a0; }

        .meta-row {
          display: flex; width: 100%;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 12.5px; color: #999;
        }
        .meta-row label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .meta-row input[type="checkbox"] { accent-color: #20c4a0; width: 13px; height: 13px; }
        .meta-row a { color: #20c4a0; text-decoration: none; }
        .meta-row a:hover { text-decoration: underline; }

        .divider {
          display: flex; align-items: center; gap: 10px;
          width: 100%; margin: 13px 0 11px;
          color: #ccc; font-size: 12px;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: #eee;
        }

        .socials { display: flex; gap: 10px; }
        .soc-btn {
          width: 40px; height: 40px;
          border: 1.5px solid #e8e8e8; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 13px; font-weight: 700; color: #666;
          background: #fff; transition: border-color 0.2s, transform 0.15s;
        }
        .soc-btn:hover { border-color: #20c4a0; transform: translateY(-2px); }

        @media (max-width: 600px) {
          .slider-wrapper {
            height: auto;
            display: flex;
            flex-direction: column;
            border-radius: 16px;
          }
          .panel-signin, .panel-register {
            position: relative;
            width: 100%; height: auto;
            padding: 36px 24px;
          }
          .panel-register { border-top: 1px solid #f0f0f0; }
          .overlay { display: none; }
        }
      `}</style>

      <div className={`slider-wrapper${isRegisterPanel ? " active" : ""}`}>

        {/* ── SIGN IN — izquierda ── */}
        <div className="panel-signin">
          <h2 className="panel-heading">Iniciar sesión</h2>

          {state?.error && (
            <Alert variant="destructive" className="mb-3 w-full py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs ml-1">
                {state.error}
              </AlertDescription>
            </Alert>
          )}

          <form action={formAction} className="w-full">
            <div className="input-row">
              <label htmlFor="email" className="input-label">Correo electrónico</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                required
                autoComplete="email"
                disabled={isPending}
                className="h-10 text-sm border-[#e8e8e8] focus-visible:ring-[#20c4a0] focus-visible:border-[#20c4a0]"
              />
            </div>

            <div className="input-row">
              <label htmlFor="password" className="input-label">Contraseña</label>
              <div className="password-wrap">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={isPending}
                  className="h-10 text-sm pr-10 border-[#e8e8e8] focus-visible:ring-[#20c4a0] focus-visible:border-[#20c4a0]"
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="meta-row">
              <label>
                <input type="checkbox" name="remember" /> Recuérdame
              </label>
              <a href="#">¿Olvidaste tu contraseña?</a>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 text-sm font-medium border-0 text-white cursor-pointer"
              style={{ background: "linear-gradient(135deg,#20c4a0,#0ea882)" }}
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

        </div>

        {/* ── SIGN UP — derecha ── */}
        <div className="panel-register">
          <h2 className="panel-heading">Crear cuenta</h2>
          <div className="input-row">
            <label className="input-label">Nombre completo</label>
            <Input type="text" placeholder="Tu nombre"
              className="h-10 text-sm border-[#e8e8e8] focus-visible:ring-[#20c4a0]" />
          </div>
          <div className="input-row">
            <label className="input-label">Correo electrónico</label>
            <Input type="email" placeholder="correo@ejemplo.com"
              className="h-10 text-sm border-[#e8e8e8] focus-visible:ring-[#20c4a0]" />
          </div>
          <div className="input-row">
            <label className="input-label">Contraseña</label>
            <Input type="password" placeholder="••••••••"
              className="h-10 text-sm border-[#e8e8e8] focus-visible:ring-[#20c4a0]" />
          </div>
          <Button
            className="w-full h-10 text-sm font-medium border-0 text-white mt-1"
            style={{ background: "linear-gradient(135deg,#20c4a0,#0ea882)" }}
          >
            Registrarse
          </Button>
          
          
          
        </div>

        {/* ── OVERLAY — se desliza encima ── */}
        <div className="overlay">
          <div className="overlay-bg" />
          <div className="bubble b1" /><div className="bubble b2" />
          <div className="bubble b3" /><div className="bubble b4" />
          <div className="bubble b5" />
          <div className="ov-body">
            {!isRegisterPanel ? (
              <>
                <h3>¡Hola,<br />bienvenido!</h3>
                <p>¿Aún no tienes cuenta? Regístrate y comienza tu experiencia en SIGCI.</p>
                <button className="btn-ghost" onClick={() => setIsRegisterPanel(true)}>
                  Registrarse
                </button>
              </>
            ) : (
              <>
                <h3>Comienza tu camino ahora</h3>
                <p>¿Ya tienes cuenta? Inicia sesión y continúa donde lo dejaste.</p>
                <button className="btn-ghost" onClick={() => setIsRegisterPanel(false)}>
                  Iniciar sesión
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}