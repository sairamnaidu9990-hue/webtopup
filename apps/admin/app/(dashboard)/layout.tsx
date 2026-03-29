import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const res = await fetch("http://localhost:3000/api/auth/me", {
    headers: {
      Cookie: `admin_token=${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/login");
  }

  const data = await res.json();
  const adminEmail = data?.admin?.email;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <Header adminEmail={adminEmail} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}