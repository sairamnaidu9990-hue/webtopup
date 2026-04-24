export default function RootTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="page-transition-shell">{children}</div>;
}
