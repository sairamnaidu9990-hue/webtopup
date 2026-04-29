"use client";

export default function GameFaqSection({
  gameFaqs,
  openFaqItems,
  onToggle,
}: {
  gameFaqs: Array<{
    question: string;
    answer: string;
  }>;
  openFaqItems: Record<number, boolean>;
  onToggle: (index: number) => void;
}) {
  if (gameFaqs.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-[1rem] font-semibold text-white sm:text-[1.06rem]">
          Kamu Punya Pertanyaan?
        </h2>
      </div>

      <div className="space-y-3">
        {gameFaqs.map((item, index) => {
          const isOpen = openFaqItems[index] ?? false;

          return (
            <section
              key={`game-faq-${index}`}
              className="overflow-hidden rounded-[16px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
            >
              <button
                type="button"
                onClick={() => onToggle(index)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
              >
                <span className="text-[13px] font-semibold leading-6 text-white sm:text-[14px]">
                  {item.question}
                </span>
                <span className="shrink-0 text-[15px] text-white/72">
                  {isOpen ? "▴" : "▾"}
                </span>
              </button>

              {isOpen ? (
                <div className="border-t border-white/8 px-4 py-4 text-[13px] leading-7 text-white/76 sm:px-5 sm:text-[14px]">
                  <div className="whitespace-pre-line">{item.answer}</div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </section>
  );
}
