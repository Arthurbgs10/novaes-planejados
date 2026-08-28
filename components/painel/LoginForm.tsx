"use client";

import { useActionState } from "react";
import { signInAction, type LoginState } from "@/app/painel/login/actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <div className="np-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
      <div className="np-card" style={{ padding: 32, width: "min(380px, 100%)" }}>
        <p className="np-serif" style={{ fontSize: 24, marginBottom: 4 }}>Novaes Planejados</p>
        <p style={{ fontSize: 13, color: "var(--np-fog)", marginBottom: 26 }}>Entrar no painel</p>

        <form action={formAction}>
          <div style={{ marginBottom: 16 }}>
            <label className="np-label" htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="np-input" placeholder="voce@novaesplanejados.com.br" />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label className="np-label" htmlFor="password">Senha</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="np-input" />
          </div>

          {state.error && (
            <p style={{ fontSize: 12.5, color: "#b3261e", marginBottom: 16 }}>{state.error}</p>
          )}

          <button type="submit" className="np-btn np-btn-filled" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
