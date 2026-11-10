import { Check, X } from "lucide-react";
import { LICENSES } from "@/lib/config";

export const metadata = { title: "Licenses" };

const ROWS: [string, boolean, boolean][] = [
  ["Personal and commercial use", true, true],
  ["Client work", true, true],
  ["Social media, YouTube, websites", true, true],
  ["Number of end products", false, true],
  ["Paid advertising campaigns", false, true],
  ["TV / broadcast and film", false, true],
  ["Lifetime, free updates", true, true],
];

export default function LicensesPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-8 md:px-8">
      <p className="label">Licenses</p>
      <h1 className="mt-3 max-w-2xl text-[clamp(2rem,4vw,3.2rem)] leading-[1.04] tracking-[-0.03em]">
        Two simple licenses.
        <br />
        <span className="text-ink-3">Both are yours forever.</span>
      </h1>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {(["standard", "multi"] as const).map((k) => (
          <div key={k} className="glass rounded-[28px] p-7">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl tracking-tight">{LICENSES[k].label}</p>
              <p className="label">{k === "standard" ? "Base price" : `×${LICENSES[k].multiplier} price`}</p>
            </div>
            <p className="mt-2 text-[14px] text-ink-2">{LICENSES[k].hint}</p>
            <ul className="mt-6 space-y-2.5 text-[14px]">
              {ROWS.map(([label, std, multi]) => {
                const ok = k === "standard" ? std : multi;
                const text = label === "Number of end products" ? (k === "standard" ? "One end product" : "Unlimited end products") : label;
                return (
                  <li key={label} className={`flex items-center gap-2.5 ${ok || label === "Number of end products" ? "" : "text-ink-3"}`}>
                    {ok || label === "Number of end products" ? <Check size={15} /> : <X size={15} />} {text}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-[13px] text-ink-3">
        An “end product” is a single finished video or piece of media that uses the template. Templates can&apos;t be resold or
        redistributed as templates.
      </p>
    </div>
  );
}
