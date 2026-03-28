import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "../components/auth/LogoutButton";

export default async function DashboardPage() {
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

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <LogoutButton />
      </div>

      <p className="mb-2">Selamat datang di Admin Panel</p>
      <p className="text-sm text-gray-600">
        Login sebagai: {data?.admin?.email}
      </p>
    </div>
  );
}