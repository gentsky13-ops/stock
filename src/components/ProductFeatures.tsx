import {
  Expand,
  Gift,
  Headphones,
  Infinity as InfinityIcon,
  Languages,
  Layers,
  PlayCircle,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  TextCursorInput,
  Timer,
  Type,
  Feather,
} from "lucide-react";
import type { Product } from "@/lib/types";

interface Feature {
  icon: React.ReactNode;
  title: string;
  text: string;
}

const Mark = ({ children, tone }: { children: React.ReactNode; tone: string }) => (
  <span className={`grid h-full w-full place-items-center text-[13px] font-semibold ${tone}`}>{children}</span>
);

function premiumFeatures(p: Product): Feature[] {
  const out: Feature[] = [];
  if (p.motionbro)
    out.push({ icon: <Mark tone="text-[#ffd2b0]">Mo</Mark>, title: "Works with MotionBro", text: "Browse and drop scenes straight from the MotionBro panel." });
  if (p.autoresize)
    out.push({ icon: <Expand size={17} />, title: "Auto-resize", text: "Adapts to the size of your composition — horizontal, vertical or square." });
  out.push({ icon: <Timer size={17} />, title: "Duration control", text: "Drag the composition on the timeline; the animation re-times itself." });
  if (p.elementsCount)
    out.push({ icon: <Layers size={17} />, title: `${p.elementsCount}+ elements`, text: "A full toolkit of scenes, titles and graphics in one project." });
  out.push({ icon: <RefreshCw size={17} />, title: "Free updates", text: "New scenes and fixes are added to your library at no cost." });
  out.push({ icon: <InfinityIcon size={17} />, title: "Lifetime license", text: "Pay once, use it for as long as you need." });
  out.push({ icon: <Headphones size={17} />, title: "Support", text: "Questions about the project? We reply within one business day." });
  return out;
}

function baseFeatures(p: Product): Feature[] {
  const apps = [p.hasAe && "After Effects", p.hasPr && "Premiere Pro"].filter(Boolean).join(" & ");
  return [
    {
      icon: p.hasAe ? <Mark tone="text-[#c9b8ff]">Ae</Mark> : <Mark tone="text-[#b6c7ff]">Pr</Mark>,
      title: `${apps} 2024+`,
      text: `Built and tested for ${apps} 2024 and newer.`,
    },
    { icon: <SlidersHorizontal size={17} />, title: "Controls panel", text: "Key settings live in one place for fast customization." },
    { icon: <TextCursorInput size={17} />, title: "Auto text-box resize", text: "Boxes and frames stretch to fit your text automatically." },
    { icon: <Type size={17} />, title: "Free fonts", text: "Only free fonts are used — download links are inside the project." },
    { icon: <PlayCircle size={17} />, title: "Video tutorial included", text: "A step-by-step walkthrough of editing the template." },
    { icon: <Languages size={17} />, title: "Universal expressions", text: "No expression errors in any language version of the app." },
    { icon: <Feather size={17} />, title: "Well-organized & lightweight", text: "Clean structure, light effects and no heavy files — smooth previews." },
  ];
}

function FeatureGrid({ items }: { items: Feature[] }) {
  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((f) => (
        <div key={f.title} className="flex gap-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-ink">{f.icon}</span>
          <div>
            <p className="text-[15px] tracking-tight">{f.title}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{f.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductFeatures({ product: p }: { product: Product }) {
  const custom: Feature[] = p.customFeatures.map((c) => ({ icon: <Sparkles size={17} />, title: c.title, text: c.text }));
  return (
    <div className="space-y-12">
      {p.featured && (
        <div>
          <p className="label mb-5 flex items-center gap-2">
            <Gift size={12} /> Premium pack
          </p>
          <FeatureGrid items={premiumFeatures(p)} />
        </div>
      )}
      <div>
        <p className="label mb-5">Key features</p>
        <FeatureGrid items={[...custom, ...baseFeatures(p)]} />
      </div>
    </div>
  );
}
