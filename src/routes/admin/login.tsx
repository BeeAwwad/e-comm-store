import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setError("");
    setIsSubmitting(true);

    const { error: signInError } = await authClient.signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    if (signInError) {
      setError("Incorrect email or password");
      setIsSubmitting(false);
      return;
    }

    await navigate({
      to: "/admin",
    });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#080808] px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border border-white/10 p-7"
      >
        <p className="text-xs uppercase tracking-[0.25em] text-red-500">
          Store access
        </p>

        <h1 className="mt-4 text-4xl font-black uppercase tracking-[-0.04em]">
          Admin login
        </h1>

        <div className="mt-8 space-y-4">
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email address"
            className="w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-neutral-600 focus:border-white"
          />

          <input
            required
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            className="w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-neutral-600 focus:border-white"
          />
        </div>

        {error && (
          <p className="mt-4 border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full bg-red-600 px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] hover:bg-red-500 disabled:opacity-50"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
