"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import PageLoader from "@/components/PageLoader";

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <PageLoader message="Signing you in..." />;
  }

  if (!user && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
