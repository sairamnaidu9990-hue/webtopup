type Props = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function SettingsSubsection({
  title,
  description,
  children,
}: Props) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-5 sm:p-6 lg:col-span-2">
      <div className="mb-5 border-b border-gray-200 pb-4">
        <p className="text-base font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </div>
  );
}
