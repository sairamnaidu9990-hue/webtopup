type SectionTitleProps = {
  title: string;
  subtitle?: string;
};

export default function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
      {subtitle ? (
        <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
