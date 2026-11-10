"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import type { ProductInput } from "@/lib/products";

type Initial = ProductInput & { id: number };

const toDollars = (c: number | null | undefined) => (c == null ? "" : String(c / 100));
const toCents = (s: string) => (s.trim() === "" ? null : Math.round(Number(s) * 100));
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

interface CatRow {
  name: string;
  count: string;
  files: File[];
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label mb-2 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass space-y-4 rounded-[28px] p-6">
      <h2 className="text-lg">{title}</h2>
      {children}
    </section>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-white" />
      {children}
    </label>
  );
}

export default function ProductForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [hasAe, setHasAe] = useState(initial?.hasAe ?? true);
  const [hasPr, setHasPr] = useState(initial?.hasPr ?? false);
  const [priceAe, setPriceAe] = useState(toDollars(initial?.priceAe));
  const [pricePr, setPricePr] = useState(toDollars(initial?.pricePr));
  const [priceBoth, setPriceBoth] = useState(toDollars(initial?.priceBoth));
  const [motionbro, setMotionbro] = useState(initial?.motionbro ?? false);
  const [autoresize, setAutoresize] = useState(initial?.autoresize ?? false);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [featuredOrder, setFeaturedOrder] = useState(String(initial?.featuredOrder || 1));
  const [salePercent, setSalePercent] = useState(String(initial?.salePercent ?? 0));
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [filesIncluded, setFilesIncluded] = useState((initial?.filesIncluded ?? []).join("\n"));
  const [sizeLabel, setSizeLabel] = useState(initial?.sizeLabel ?? "");
  const [resolution, setResolution] = useState(initial?.resolution ?? "");
  const [elementsCount, setElementsCount] = useState(initial?.elementsCount ? String(initial.elementsCount) : "");
  const [features, setFeatures] = useState(initial?.customFeatures ?? []);
  const [cats, setCats] = useState<CatRow[]>(
    (initial?.categories ?? []).map((c) => ({ name: c.name, count: String(c.count), files: [] })),
  );
  const [scenes, setScenes] = useState(initial?.scenes ?? []);
  const [previewImage, setPreviewImage] = useState(initial?.previewImage ?? "");
  const [previewVideo, setPreviewVideo] = useState(initial?.previewVideo ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fileAe, setFileAe] = useState(initial?.fileAe ?? "");
  const [filePr, setFilePr] = useState(initial?.filePr ?? "");
  const [aeUpload, setAeUpload] = useState<File | null>(null);
  const [prUpload, setPrUpload] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const setCat = (i: number, patch: Partial<CatRow>) => setCats((c) => c.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  function renameCat(i: number, name: string) {
    const old = cats[i].name;
    setCat(i, { name });
    if (old) setScenes((s) => s.map((sc) => (sc.category === old ? { ...sc, category: name } : sc)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const data = {
      title,
      slug: slug || slugify(title),
      tagline,
      description,
      hasAe,
      hasPr,
      priceAe: toCents(priceAe),
      pricePr: toCents(pricePr),
      priceBoth: toCents(priceBoth),
      motionbro,
      autoresize,
      featured,
      featuredOrder: Number(featuredOrder),
      salePercent: Number(salePercent) || 0,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      filesIncluded: filesIncluded.split("\n").map((t) => t.trim()).filter(Boolean),
      sizeLabel,
      resolution,
      elementsCount: elementsCount.trim() === "" ? null : Number(elementsCount),
      customFeatures: features,
      categories: cats.map((c) => ({ name: c.name, count: Number(c.count) || 0 })),
      scenes,
      previewImage,
      previewVideo,
      fileAe,
      filePr,
    };
    const fd = new FormData();
    fd.set("data", JSON.stringify(data));
    if (imageFile) fd.set("previewImage", imageFile);
    if (videoFile) fd.set("previewVideo", videoFile);
    if (aeUpload) fd.set("fileAe", aeUpload);
    if (prUpload) fd.set("filePr", prUpload);
    cats.forEach((c, i) => c.files.forEach((f) => fd.append(`scene:${i}`, f)));
    try {
      const res = await fetch(initial ? `/api/admin/products/${initial.id}` : "/api/admin/products", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function remove() {
    if (!initial || !confirm(`Delete "${initial.title}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/products/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Could not delete.");
      setBusy(false);
    }
  }

  const downloadField = (label: string, value: string, setValue: (v: string) => void, file: File | null, setFile: (f: File | null) => void) => {
    const isKey = value !== "" && !/^https?:\/\//i.test(value);
    return (
      <div className="space-y-2">
        <span className="label block">{label}</span>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="input" />
        <input
          className="input"
          placeholder="…or paste an external download URL"
          value={file ? "" : isKey ? "" : value}
          disabled={!!file}
          onChange={(e) => setValue(e.target.value)}
        />
        <p className="text-xs text-ink-3">
          {file ? `New upload: ${file.name}` : isKey ? `Current: uploaded file (${value})` : value ? "Current: external link" : "Nothing set yet."}
        </p>
      </div>
    );
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="glass rounded-[20px] p-4 text-sale" role="alert">{error}</div>}

      <Section title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input
              className="input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
          </Field>
          <Field label="Slug">
            <input className="input" value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} />
          </Field>
        </div>
        <Field label="Tagline">
          <input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </Field>
        <Field label="Description (2–3 sentences)">
          <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </Section>

      <Section title="Formats & pricing (USD)">
        <div className="flex flex-wrap gap-6">
          <Check checked={hasAe} onChange={setHasAe}>After Effects</Check>
          <Check checked={hasPr} onChange={setHasPr}>Premiere Pro</Check>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {hasAe && (
            <Field label="After Effects price">
              <input className="input" type="number" min="0" step="0.01" value={priceAe} onChange={(e) => setPriceAe(e.target.value)} />
            </Field>
          )}
          {hasPr && (
            <Field label="Premiere Pro price">
              <input className="input" type="number" min="0" step="0.01" value={pricePr} onChange={(e) => setPricePr(e.target.value)} />
            </Field>
          )}
          {hasAe && hasPr && (
            <Field label="Both formats bundle price" hint="Leave blank for automatic pricing.">
              <input className="input" type="number" min="0" step="0.01" value={priceBoth} onChange={(e) => setPriceBoth(e.target.value)} />
            </Field>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Sale percent (0–90)">
            <input className="input" type="number" min="0" max="90" value={salePercent} onChange={(e) => setSalePercent(e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Flags">
        <div className="flex flex-wrap items-center gap-6">
          <Check checked={motionbro} onChange={setMotionbro}>MotionBro compatible</Check>
          <Check checked={autoresize} onChange={setAutoresize}>Auto-resize</Check>
          <Check checked={featured} onChange={setFeatured}>Featured</Check>
          {featured && (
            <label className="flex items-center gap-2 text-sm">
              Order
              <input className="input !w-20" type="number" min="1" max="5" value={featuredOrder} onChange={(e) => setFeaturedOrder(e.target.value)} />
            </label>
          )}
        </div>
      </Section>

      <Section title="Details">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Size label"><input className="input" placeholder="1.2 GB" value={sizeLabel} onChange={(e) => setSizeLabel(e.target.value)} /></Field>
          <Field label="Resolution"><input className="input" placeholder="4K" value={resolution} onChange={(e) => setResolution(e.target.value)} /></Field>
          <Field label="Elements count (optional)">
            <input className="input" type="number" min="0" value={elementsCount} onChange={(e) => setElementsCount(e.target.value)} />
          </Field>
        </div>
        <Field label="Tags (comma separated)">
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
        <Field label="Files included (one per line)">
          <textarea className="input" rows={4} value={filesIncluded} onChange={(e) => setFilesIncluded(e.target.value)} />
        </Field>
      </Section>

      <Section title="Extra key features">
        {features.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input className="input !w-1/3" placeholder="Title" value={f.title} onChange={(e) => setFeatures((l) => l.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <input className="input" placeholder="Text" value={f.text} onChange={(e) => setFeatures((l) => l.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
            <button type="button" className="pill" aria-label="Remove feature" onClick={() => setFeatures((l) => l.filter((_, j) => j !== i))}><X size={16} /></button>
          </div>
        ))}
        <button type="button" className="pill" onClick={() => setFeatures((l) => [...l, { title: "", text: "" }])}><Plus size={16} /> Add feature</button>
      </Section>

      <Section title="What's included">
        {cats.map((c, i) => {
          const catScenes = scenes.filter((s) => s.category === c.name && c.name);
          return (
            <div key={i} className="space-y-3 rounded-[20px] border border-line p-4">
              <div className="flex gap-2">
                <input className="input" placeholder="Category name (e.g. Typography)" value={c.name} onChange={(e) => renameCat(i, e.target.value)} />
                <input className="input !w-28" type="number" min="0" placeholder="Scenes" value={c.count} onChange={(e) => setCat(i, { count: e.target.value })} />
                <button
                  type="button"
                  className="pill"
                  aria-label="Remove category"
                  onClick={() => {
                    setScenes((s) => s.filter((sc) => sc.category !== c.name));
                    setCats((l) => l.filter((_, j) => j !== i));
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <input type="file" accept="image/*" multiple className="input" onChange={(e) => setCat(i, { files: Array.from(e.target.files ?? []) })} />
              {c.files.length > 0 && <p className="text-xs text-ink-3">{c.files.length} new image(s) will be uploaded.</p>}
              {catScenes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {catScenes.map((s) => (
                    <div key={s.image} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.image} alt="" className="h-14 w-24 rounded-lg object-cover" />
                      <button
                        type="button"
                        aria-label="Remove scene"
                        className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/80 text-white"
                        onClick={() => setScenes((l) => l.filter((x) => x.image !== s.image))}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <button type="button" className="pill" onClick={() => setCats((l) => [...l, { name: "", count: "", files: [] }])}><Plus size={16} /> Add category</button>
      </Section>

      <Section title="Media">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <span className="label block">Preview image (poster)</span>
            <input type="file" accept="image/*" className="input" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {previewImage && !imageFile && <img src={previewImage} alt="" className="h-28 rounded-xl object-cover" />}
            {imageFile && <p className="text-xs text-ink-3">New upload: {imageFile.name}</p>}
            {previewImage && <button type="button" className="text-xs text-ink-3 underline" onClick={() => { setPreviewImage(""); setImageFile(null); }}>Remove current</button>}
          </div>
          <div className="space-y-2">
            <span className="label block">Preview video (mp4)</span>
            <input type="file" accept="video/mp4" className="input" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
            {previewVideo && !videoFile && <video src={previewVideo} className="h-28 rounded-xl" muted controls />}
            {videoFile && <p className="text-xs text-ink-3">New upload: {videoFile.name}</p>}
            {previewVideo && <button type="button" className="text-xs text-ink-3 underline" onClick={() => { setPreviewVideo(""); setVideoFile(null); }}>Remove current</button>}
          </div>
        </div>
      </Section>

      <Section title="Project downloads">
        <div className="grid gap-6 md:grid-cols-2">
          {hasAe && downloadField("After Effects archive", fileAe, setFileAe, aeUpload, setAeUpload)}
          {hasPr && downloadField("Premiere Pro archive", filePr, setFilePr, prUpload, setPrUpload)}
        </div>
      </Section>

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Create project"}</button>
          <button type="button" className="pill" onClick={() => router.push("/admin")} disabled={busy}>Cancel</button>
        </div>
        {initial && (
          <button type="button" className="pill" onClick={remove} disabled={busy}><Trash2 size={16} /> Delete</button>
        )}
      </div>
    </form>
  );
}
