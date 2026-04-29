import {
  getConnectorClassName,
  getStepBadgeLabel,
  getStepCircleClassName,
  getStepDescriptionClassName,
  getStepTextClassName,
  type TransactionStep,
} from "@/components/invoice/invoicePageUtils";

export default function InvoiceProgressSection({
  steps,
}: {
  steps: TransactionStep[];
}) {
  return (
    <div className="border-b border-white/8 bg-[#24262d] px-5 py-5 sm:px-6">
      <h2 className="text-[15px] font-semibold text-white">Progress Transaksi</h2>

      <div className="mt-5 hidden gap-0 md:flex">
        {steps.map((step, index) => (
          <div key={step.title} className="flex min-w-0 flex-1 items-start">
            <div className="min-w-0 flex-1">
              <div className="flex items-center">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold transition ${getStepCircleClassName(step.state)}`}
                >
                  {getStepBadgeLabel(step.state, index)}
                </div>
                {index < steps.length - 1 ? (
                  <div
                    className={`ml-3 h-[3px] flex-1 rounded-full ${getConnectorClassName(
                      step,
                      steps[index + 1]
                    )}`}
                  />
                ) : null}
              </div>
              <div className="pr-4 pt-5">
                <h3
                  className={`text-[14px] font-semibold ${getStepTextClassName(step.state)}`}
                >
                  {step.title}
                </h3>
                <p
                  className={`mt-1 text-[12px] leading-5 ${getStepDescriptionClassName(step.state)}`}
                >
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 md:hidden">
        <div className="grid grid-cols-4 gap-x-2">
          {steps.map((step, index) => (
            <div key={step.title} className="relative min-w-0">
              {index < steps.length - 1 ? (
                <div
                  className={`absolute left-[calc(50%+14px)] right-[-12px] top-[14px] h-[3px] rounded-full ${getConnectorClassName(
                    step,
                    steps[index + 1]
                  )}`}
                />
              ) : null}

              <div className="relative flex justify-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition ${getStepCircleClassName(step.state)}`}
                >
                  {getStepBadgeLabel(step.state, index)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
