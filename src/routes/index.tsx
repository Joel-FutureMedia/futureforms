import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("futuremedia.auth");
      throw redirect({ to: raw ? "/panel/overview" : "/login" });
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
