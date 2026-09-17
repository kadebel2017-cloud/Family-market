import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion admin",
};

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}