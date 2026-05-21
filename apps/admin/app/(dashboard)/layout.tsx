import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_LAST_ACTIVE_COOKIE_NAME,
  ADMIN_TOKEN_COOKIE_NAME,
  isAdminSessionIdle,
} from "@/lib/adminSession";

import DashboardShell from "./DashboardShell";

type DashboardShellProps = {
  adminEmail?: string;
  children: React.ReactNode;
};

export default async function DashboardLayout({
  adminEmail,
  children,
}: DashboardShellProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_TOKEN_COOKIE_NAME)?.value || "";
  const lastActive =
    cookieStore.get(ADMIN_LAST_ACTIVE_COOKIE_NAME)?.value || "";

  if (!token) {
    redirect("/login");
  }

  if (isAdminSessionIdle(lastActive)) {
    redirect("/login?reason=session-expired");
  }

  return <DashboardShell adminEmail={adminEmail}>{children}</DashboardShell>;
}
