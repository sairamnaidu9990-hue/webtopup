type SectionTitleProps = {
  title: string;
  subtitle?: string;
};

export default function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="mb-6 space-y-1">
      <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="max-w-3xl text-sm leading-6 text-gray-500 sm:text-[15px]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
