import LogoutButton from "../../components/auth/LogoutButton";

type HeaderProps = {
  adminEmail?: string;
};

export default function Header({ adminEmail }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div>
        <h2 className="text-lg font-semibold">Admin Dashboard</h2>
        <p className="text-sm text-gray-500">
          {adminEmail ? `Login sebagai: ${adminEmail}` : "Selamat datang"}
        </p>
      </div>

      <LogoutButton />
    </header>
  );
}