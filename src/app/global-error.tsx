"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
          padding: "1rem"
        }}>
          <div style={{
            maxWidth: "32rem",
            width: "100%",
            background: "white",
            borderRadius: "1rem",
            padding: "2rem",
            textAlign: "center",
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)"
          }}>
            <h1 style={{
              fontSize: "1.875rem",
              fontWeight: "bold",
              color: "#0f172a",
              marginBottom: "1rem"
            }}>
              Erro Crítico
            </h1>
            <p style={{
              color: "#64748b",
              marginBottom: "2rem"
            }}>
              Ocorreu um erro crítico na aplicação. Por favor, recarregue a página.
            </p>
            <button
              onClick={() => reset()}
              style={{
                background: "#0f766e",
                color: "white",
                padding: "0.5rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "500"
              }}
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
