export default function ArticleRichContent({ content }: { content: string }) {
  const blocks = String(content || "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6 text-base leading-8 text-white/78 sm:text-[1.02rem]">
      {blocks.map((block, index) => (
        <p key={`${index}-${block.slice(0, 24)}`} className="whitespace-pre-line">
          {block}
        </p>
      ))}
    </div>
  );
}
