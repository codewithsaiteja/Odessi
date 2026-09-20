"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface WithAuthProps {
  redirectTo?: string;
  adminOnly?: boolean;
}

/**
 * Higher-order component that wraps a page to require authentication.
 * If user is not authenticated, they are redirected to /login.
 * If adminOnly=true, non-admins are redirected to /.
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthProps = {}
) {
  const { redirectTo = "/login", adminOnly = false } = options;

  return function ProtectedPage(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          router.replace(redirectTo);
        } else if (adminOnly && user.role !== "ADMIN") {
          router.replace("/");
        }
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        </div>
      );
    }

    if (!user) return null;

    if (adminOnly && user.role !== "ADMIN") return null;

    return <Component {...props} />;
  };
}
