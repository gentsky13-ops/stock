import fs from "node:fs";
import path from "node:path";
import { execFile, execFileSync } from "node:child_process";
import { db, FILES_DIR, MEDIA_DIR } from "../src/lib/db";
import { createProduct, slugify } from "../src/lib/products";

type Fmt = "ae" | "pr" | "both";
interface Spec {
  title: string;
  tagline: string;
  desc: string;
  fmt: Fmt;
  prices: [number, number]; // USD dollars: [ae, pr]
  tags: string[];
  colors: [string, string, string];
  cats: [string, number][];
  mb?: boolean;
  ar?: boolean;
  feat?: number;
  elements?: number;
  sale?: number;
  size: string;
  res?: "4k" | "hd" | "social";
  extras?: string[];
  custom?: { title: string; text: string }[];
}

const SPECS: Spec[] = [
  { title: "Kinetic Typography Pack", tagline: "Fast, rhythmic text animations for any story", desc: "A huge library of kinetic text animations built around beat-driven timing. Drop in your words, pick a style and let the layout adapt. Perfect for promos, lyric videos and explainers.", fmt: "ae", prices: [59, 0], tags: ["kinetic", "typography", "titles", "youtube", "promo"], colors: ["1b1034", "ff6a3d", "0b0b14"], cats: [["Kinetic Titles", 80], ["Typography", 60], ["Quotes & Statements", 30], ["Backgrounds", 20]], mb: true, ar: true, feat: 1, elements: 750, size: "1.8 GB", res: "4k", extras: ["Design files (.psd)", "Sound effects (.wav)"], custom: [{ title: "Color presets", text: "12 hand-picked palettes switchable in one click." }] },
  { title: "YouTube Essentials", tagline: "Everything a channel needs, in one pack", desc: "Intros, end screens, subscribe call-outs, lower thirds and chapter cards designed for modern YouTube. Fully customizable with a single controls panel. Works at any aspect ratio.", fmt: "both", prices: [69, 49], tags: ["youtube", "social media", "lower thirds", "titles", "opener"], colors: ["3a0d0d", "ff3d3d", "120808"], cats: [["YouTube Scenes", 90], ["Lower Thirds", 50], ["Call-outs", 40], ["Standard Titles", 30], ["Transitions", 10]], mb: true, feat: 2, elements: 1200, size: "2.4 GB", res: "4k", extras: ["Sound effects (.wav)", "Design files (.psd)"], custom: [{ title: "Channel branding kit", text: "Set your logo and colors once; every scene updates." }] },
  { title: "Social Media Auto-Resize Kit", tagline: "One design, every platform format", desc: "Build once and export for Reels, TikTok, Shorts, feeds and landscape in seconds. Auto-resize keeps every layout balanced at any composition size. Includes animated posts, stories and covers.", fmt: "both", prices: [64, 44], tags: ["social media", "instagram", "promo", "titles", "typography"], colors: ["0e2a47", "36d1c4", "0a0f1c"], cats: [["Social Media", 70], ["Stories", 40], ["Titles", 30], ["Call-outs", 20], ["Backgrounds", 10]], mb: true, ar: true, feat: 3, elements: 420, size: "1.4 GB", res: "social", extras: ["Design files (.psd)"] },
  { title: "Cinematic Title Sequence", tagline: "Trailer-grade titles with real weight", desc: "A cinematic title toolkit with light leaks, dust, film grain and bold serif treatments. Build opening credits and trailers that feel like cinema. Lightweight setup renders fast.", fmt: "both", prices: [79, 59], tags: ["cinematic", "titles", "opener", "broadcast", "minimal"], colors: ["1a1208", "d6a85a", "07060a"], cats: [["Standard Titles", 45], ["Cinematic Openers", 30], ["Credits", 25], ["Backgrounds", 20]], feat: 4, elements: 900, size: "2.1 GB", res: "4k", extras: ["Sound effects (.wav)", "Design files (.psd)"], custom: [{ title: "Film grain library", text: "20 scanned grain overlays included." }] },
  { title: "Logo Reveal Collection", tagline: "Sleek brand stings in seconds", desc: "Thirty polished logo reveals from minimal to explosive. Drag your logo in and the reveal reshapes itself around it. Auto-resize adapts every scene to your composition.", fmt: "ae", prices: [49, 0], tags: ["logo", "opener", "promo", "minimal", "glitch"], colors: ["20103a", "8f5bff", "08060f"], cats: [["Logo Reveals", 30], ["Glitch Reveals", 12], ["Minimal Reveals", 18]], mb: true, ar: true, feat: 5, elements: 650, size: "1.1 GB", res: "4k", extras: ["Sound effects (.wav)"] },
  { title: "Glitch Titles", tagline: "Digital distortion for bold statements", desc: "RGB splits, scanlines and signal-loss effects packaged as ready-to-use titles. Each preset is one controls-panel tweak away from your style.", fmt: "ae", prices: [34, 0], tags: ["glitch", "titles", "typography", "kinetic"], colors: ["0a2a1f", "2cff9a", "050a08"], cats: [["Glitch Titles", 40], ["Overlays", 20], ["Transitions", 15]], size: "720 MB", res: "hd", extras: ["Sound effects (.wav)"], sale: 30 },
  { title: "Minimal Lower Thirds", tagline: "Clean name tags that stay out of the way", desc: "Refined lower thirds with subtle motion for interviews, documentaries and corporate video. Text boxes grow and shrink automatically with your copy.", fmt: "both", prices: [29, 25], tags: ["lower thirds", "minimal", "corporate", "broadcast", "titles"], colors: ["16202b", "9fb4c9", "0a0d12"], cats: [["Lower Thirds", 60], ["Name Tags", 20], ["Callout Bars", 15]], mb: true, ar: true, size: "380 MB", res: "hd" },
  { title: "Corporate Slideshow", tagline: "Professional presentations in motion", desc: "A clean corporate slideshow with photo and video placeholders, charts and animated headlines. Great for company profiles and annual reports.", fmt: "pr", prices: [0, 39], tags: ["corporate", "slideshow", "infographics", "minimal"], colors: ["0f2236", "4a90e2", "070c14"], cats: [["Slides", 40], ["Infographics", 20], ["Titles", 15], ["Transitions", 10]], size: "640 MB", res: "hd" },
  { title: "Event Promo", tagline: "High-energy promo for launches and festivals", desc: "Punchy typography, dynamic transitions and countdown scenes for event teasers. Swap media and text in minutes.", fmt: "both", prices: [44, 34], tags: ["event", "promo", "typography", "music", "kinetic"], colors: ["3a0f2e", "ff4fa0", "10060c"], cats: [["Promo Scenes", 30], ["Typography", 25], ["Countdowns", 10], ["Transitions", 15]], size: "980 MB", res: "4k", extras: ["Sound effects (.wav)"] },
  { title: "Fashion Opener", tagline: "Editorial motion for style and luxury", desc: "Elegant serif titles and slick fast cuts inspired by fashion editorials. Designed for lookbooks, runway recaps and brand intros.", fmt: "ae", prices: [39, 0], tags: ["opener", "cinematic", "minimal", "promo", "titles"], colors: ["2b1c18", "e8c9b0", "0d0807"], cats: [["Openers", 20], ["Titles", 20], ["Photo Frames", 15]], size: "540 MB", res: "4k" },
  { title: "Sport Intro", tagline: "Aggressive speed for sports and gaming", desc: "Impactful sports intros with speed ramps, shattered glass and bold italics. Add your team logo and render.", fmt: "ae", prices: [39, 0], tags: ["opener", "promo", "glitch", "event", "titles"], colors: ["3a1a00", "ff8c1a", "0d0600"], cats: [["Intros", 18], ["Team Titles", 20], ["Stats Boards", 14], ["Transitions", 10]], size: "860 MB", res: "hd", sale: 25 },
  { title: "Podcast Toolkit", tagline: "Video podcast graphics made simple", desc: "Audio-reactive waveforms, guest lower thirds and clip captions for video podcasts. Built to be dropped straight onto your timeline.", fmt: "pr", prices: [0, 35], tags: ["music", "youtube", "lower thirds", "social media"], colors: ["1d1b3a", "7b6dff", "08070f"], cats: [["Waveforms", 15], ["Lower Thirds", 20], ["Captions", 15], ["Intros & Outros", 8]], size: "310 MB", res: "hd", extras: ["Video tutorial (.mp4)"] },
  { title: "Transitions Pack", tagline: "Seamless cuts that feel handcrafted", desc: "One hundred in-camera-style transitions: whip pans, zooms, glitches and shape wipes. Drag onto a cut and you are done.", fmt: "both", prices: [39, 29], tags: ["transitions", "youtube", "glitch", "social media"], colors: ["0b2e3a", "26c6da", "060f13"], cats: [["Whip Transitions", 30], ["Shape Wipes", 30], ["Glitch Transitions", 20], ["Zoom Transitions", 20]], mb: true, size: "450 MB", res: "4k", extras: ["Sound effects (.wav)"], sale: 20 },
  { title: "Call-outs & Info Lines", tagline: "Point at anything, label everything", desc: "Animated call-out lines, arrows, boxes and tags for tutorials and product reviews. Lines track your point and resize themselves around text.", fmt: "both", prices: [32, 26], tags: ["youtube", "infographics", "lower thirds", "minimal"], colors: ["102a2a", "5eead4", "061010"], cats: [["Call-outs", 50], ["Arrows & Lines", 30], ["Info Boxes", 20]], mb: true, ar: true, size: "260 MB", res: "hd", custom: [{ title: "Color presets", text: "12 hand-picked palettes switchable in one click." }] },
  { title: "Instagram Stories", tagline: "Scroll-stopping vertical templates", desc: "Eighty animated story templates for launches, quotes and announcements. Built vertically for 1080×1920 and ready for any brand palette.", fmt: "both", prices: [34, 29], tags: ["instagram", "social media", "typography", "promo"], colors: ["3a1230", "ff7ab8", "0f050c"], cats: [["Story Templates", 50], ["Quotes", 20], ["Promo Cards", 20], ["Highlights Covers", 10]], mb: true, ar: true, size: "520 MB", res: "social", extras: ["Design files (.psd)"], sale: 35 },
  { title: "Music Visualizer", tagline: "Make sound visible", desc: "Audio-reactive spectrums, bars and circular visualizers. Drop in a track and let expressions do the work.", fmt: "ae", prices: [29, 0], tags: ["music", "event", "promo", "glitch"], colors: ["1a0a3a", "c64bff", "070310"], cats: [["Spectrums", 20], ["Circular", 12], ["Backgrounds", 12]], size: "300 MB", res: "hd" },
  { title: "Countdown Timers", tagline: "Make every second count", desc: "Fifteen countdown styles for streams, launches and New Year videos. Set the start number in the controls panel.", fmt: "ae", prices: [19, 0], tags: ["event", "minimal", "kinetic", "social media"], colors: ["2a2a0e", "ffe14d", "0c0c04"], cats: [["Countdowns", 20], ["Numbers", 10]], size: "190 MB", res: "hd" },
  { title: "Infographics Pack", tagline: "Data that actually looks good", desc: "Animated charts, maps, counters and process diagrams. Edit values from a spreadsheet-style controls panel.", fmt: "ae", prices: [44, 0], tags: ["infographics", "corporate", "minimal", "broadcast"], colors: ["0e2a3a", "3dd5f3", "050d12"], cats: [["Charts", 40], ["Maps", 20], ["Counters", 20], ["Icons", 30]], ar: true, size: "700 MB", res: "4k", extras: ["Design files (.psd)"] },
  { title: "Real Estate Promo", tagline: "Show properties at their best", desc: "A refined showcase for listings with photo reveals, price tags and agent cards. Works equally well for hotels and holiday rentals.", fmt: "pr", prices: [0, 39], tags: ["promo", "slideshow", "corporate", "cinematic"], colors: ["14261c", "7fd4a0", "060d09"], cats: [["Property Scenes", 25], ["Price Tags", 10], ["Agent Cards", 8]], size: "610 MB", res: "4k" },
  { title: "Product Promo", tagline: "Make products the hero", desc: "Sleek product showcase scenes with feature callouts, spec lists and offer banners. Ideal for e-commerce and launch videos.", fmt: "ae", prices: [49, 0], tags: ["promo", "social media", "minimal", "cinematic"], colors: ["1c1c26", "b8c4ff", "08080c"], cats: [["Product Scenes", 30], ["Feature Callouts", 20], ["Offers", 12]], size: "820 MB", res: "4k" },
  { title: "Wedding Titles", tagline: "Romantic titles with timeless elegance", desc: "Delicate script titles, floral frames and soft transitions for wedding films. Easy to personalize with names and dates.", fmt: "pr", prices: [0, 29], tags: ["titles", "cinematic", "slideshow", "minimal"], colors: ["2e2024", "f2c6d0", "0e0809"], cats: [["Titles", 30], ["Frames", 15], ["Transitions", 10]], size: "280 MB", res: "hd" },
  { title: "News Broadcast Pack", tagline: "Studio-grade graphics for news and talk", desc: "Tickers, breaking-news banners, lower thirds and data boards for broadcast. Resizes to fit any ticker length automatically.", fmt: "ae", prices: [69, 0], tags: ["broadcast", "lower thirds", "infographics", "corporate", "titles"], colors: ["0a1a3a", "ff2f4a", "04070f"], cats: [["Lower Thirds", 40], ["Tickers", 20], ["Data Boards", 25], ["Openers", 10]], size: "1.3 GB", res: "hd" },
  { title: "Minimal Opener", tagline: "Quiet, confident, modern", desc: "A calm opener system with soft type and subtle grids. A great foundation for personal brands and documentaries.", fmt: "ae", prices: [24, 0], tags: ["minimal", "opener", "titles", "typography"], colors: ["202020", "e0e0e0", "090909"], cats: [["Openers", 15], ["Titles", 15]], size: "210 MB", res: "hd" },
  { title: "Hand-drawn Elements", tagline: "Organic doodles and sketchy motion", desc: "Hundreds of hand-drawn arrows, underlines, scribbles and shapes that animate on. Gives any video a human touch.", fmt: "both", prices: [29, 24], tags: ["youtube", "social media", "kinetic", "infographics"], colors: ["2a2414", "f5d76e", "0d0b05"], cats: [["Arrows", 40], ["Underlines", 40], ["Doodles", 60], ["Frames", 20]], elements: 160, size: "240 MB", res: "hd" },
];

const DAYS = [3, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 36, 40, 4, 6, 9, 12, 15, 18, 22, 25, 28, 31, 38];
const FONTS = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
];
const MONOS = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
  "/usr/share/fonts/truetype/freefont/FreeMono.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
];

const pick = (list: string[], what: string) => {
  const f = list.find((p) => fs.existsSync(p));
  if (!f) throw new Error(`No ${what} font found. Install one, e.g. apt-get install -y fonts-dejavu-core`);
  return f;
};

function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile("ffmpeg", ["-y", "-v", "error", ...args], (err, _o, stderr) =>
      err ? reject(new Error(`ffmpeg failed: ${stderr || err.message}`)) : resolve(),
    );
  });
}

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

// drawtext-unsafe characters are dropped rather than escaped
const esc = (s: string) => s.replace(/[\\':%,&]/g, "");
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

async function makeVideo(slug: string, s: Spec, dir: string, font: string, mono: string) {
  const size = Math.max(40, Math.min(84, Math.floor(1100 / (s.title.length * 0.62)))) * 0.75;
  const [c0, c1, c2] = s.colors;
  const h = hash(slug);
  const f0 = 180 + (h % 5) * 40;
  const vf =
    `gradients=s=960x540:c0=0x${c0}:c1=0x${c1}:c2=0x${c2}:nb_colors=3:speed=${(0.008 + (h % 7) * 0.002).toFixed(3)}:rate=25:d=7:seed=${h % 1000},` +
    `eq=brightness=-0.12:saturation=0.9,vignette=PI/4,` +
    `drawtext=fontfile=${font}:text='${esc(s.title)}':fontsize=${Math.round(size)}:fontcolor=white:` +
    `x=(w-text_w)/2:y=(h-text_h)/2+40*pow(1-min(t/1.2\\,1)\\,2):alpha='min(t/1\\,1)*min((6.8-t)/0.6\\,1)',` +
    `drawtext=fontfile=${mono}:text='${esc(s.tagline.toUpperCase())}':fontsize=15:fontcolor=white@0.7:x=(w-text_w)/2:y=h/2+${Math.round(size)}:alpha='min(max(t-0.6\\,0)/1\\,1)*min((6.8-t)/0.6\\,1)',` +
    `drawtext=fontfile=${mono}:text='FRAME SUPPLY / DEMO PREVIEW':fontsize=12:fontcolor=white@0.5:x=24:y=h-32,` +
    `format=yuv420p`;
  const out = path.join(dir, "preview.mp4");
  await run([
    "-f", "lavfi", "-i", vf,
    "-f", "lavfi", "-i", `sine=frequency=${f0}:sample_rate=44100:duration=7`,
    "-f", "lavfi", "-i", `sine=frequency=${Math.round(f0 * 1.5)}:sample_rate=44100:duration=7`,
    "-f", "lavfi", "-i", `sine=frequency=${Math.round(f0 * 2.25)}:sample_rate=44100:duration=7`,
    "-filter_complex", "[1:a]volume=0.5[a1];[2:a]volume=0.3,tremolo=f=0.6:d=0.7[a2];[3:a]volume=0.15,tremolo=f=1.2:d=0.8[a3];[a1][a2][a3]amix=inputs=3:normalize=0,afade=t=in:d=1,afade=t=out:st=5.8:d=1.2,volume=0.5[a]",
    "-map", "0:v", "-map", "[a]", "-t", "7",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", "-pix_fmt", "yuv420p", "-r", "25",
    "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", out,
  ]);
  await run(["-ss", "2", "-i", out, "-frames:v", "1", "-q:v", "4", path.join(dir, "poster.jpg")]);
}

async function makeScene(dir: string, idx: number, cat: string, s: Spec, slug: string, font: string, mono: string) {
  const h = hash(slug + idx);
  const [c0, c1, c2] = s.colors;
  const [a, b] = idx % 2 ? [c1, c0] : [c0, c1];
  const vf =
    `gradients=s=480x270:c0=0x${a}:c1=0x${b}:c2=0x${c2}:nb_colors=3:seed=${h % 5000}:d=1:rate=1,` +
    `eq=brightness=-0.1,vignette=PI/4,` +
    `drawtext=fontfile=${font}:text='${esc(cat)}':fontsize=26:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2,` +
    `drawtext=fontfile=${mono}:text='SCENE ${String(idx + 1).padStart(2, "0")}':fontsize=13:fontcolor=white@0.7:x=16:y=h-28`;
  await run(["-f", "lavfi", "-i", vf, "-frames:v", "1", "-q:v", "6", path.join(dir, `scene-${String(idx + 1).padStart(2, "0")}.jpg`)]);
}

function makeZip(file: string, title: string, fmt: string) {
  const tmp = fs.mkdtempSync(path.join(FILES_DIR, ".z-"));
  fs.writeFileSync(path.join(tmp, "README.txt"), `Frame Supply demo file\n\n${title} (${fmt})\nThis is a placeholder archive for the demo store. Real project files are uploaded in the admin.\n`);
  fs.rmSync(file, { force: true });
  execFileSync("zip", ["-q", "-j", file, path.join(tmp, "README.txt")]);
  fs.rmSync(tmp, { recursive: true, force: true });
}

async function main() {
  const reset = process.argv.includes("--reset");
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  } catch {
    throw new Error("ffmpeg is required but was not found on PATH. Install it (e.g. apt-get install -y ffmpeg).");
  }
  try {
    execFileSync("zip", ["-v"], { stdio: "ignore" });
  } catch {
    throw new Error("zip CLI is required to build placeholder downloads (apt-get install -y zip).");
  }
  const font = pick(FONTS, "bold sans");
  const mono = pick(MONOS, "mono");
  const d = db();
  const existing = (d.prepare("SELECT COUNT(*) c FROM products").get() as { c: number }).c;
  if (existing && !reset) {
    console.log(`Database already has ${existing} products. Pass --reset to wipe and reseed.`);
    return;
  }
  fs.mkdirSync(FILES_DIR, { recursive: true });
  if (reset) {
    for (const t of ["reviews", "order_items", "orders", "products"]) d.exec(`DELETE FROM ${t}`);
    fs.rmSync(path.join(MEDIA_DIR, "demo"), { recursive: true, force: true });
    for (const f of fs.readdirSync(FILES_DIR)) if (f.startsWith("demo-")) fs.rmSync(path.join(FILES_DIR, f), { force: true });
  }
  const t0 = Date.now();
  const jobs: (() => Promise<void>)[] = [];

  SPECS.forEach((s, i) => {
    const slug = slugify(s.title);
    const dir = path.join(MEDIA_DIR, "demo", slug);
    fs.mkdirSync(dir, { recursive: true });
    const hasAe = s.fmt !== "pr";
    const hasPr = s.fmt !== "ae";
    const [ae, pr] = s.prices;
    const both = hasAe && hasPr ? Math.round((ae + pr) * 0.78) : 0;
    const categories = s.cats.map(([name, count]) => ({ name, count }));
    const total = categories.reduce((a, c) => a + c.count, 0);
    const nScenes = Math.min(45, Math.max(20, total));
    const sceneCats = Array.from({ length: nScenes }, (_, k) => categories[k % categories.length].name);
    const scenes = sceneCats.map((category, k) => ({ image: `/media/demo/${slug}/scene-${String(k + 1).padStart(2, "0")}.jpg`, category }));

    const files = [
      ...(hasAe ? ["After Effects project (.aep)"] : []),
      ...(hasPr ? ["Premiere Pro templates (.mogrt)"] : []),
      ...(s.mb ? ["MotionBro preset (.mbr)"] : []),
      ...(s.extras ?? []),
    ];
    if (!files.includes("Video tutorial (.mp4)")) files.push("Video tutorial (.mp4)");

    const fileAe = hasAe ? `demo-${slug}-ae.zip` : "";
    const filePr = hasPr ? `demo-${slug}-pr.zip` : "";
    if (fileAe) makeZip(path.join(FILES_DIR, fileAe), s.title, "After Effects");
    if (filePr) makeZip(path.join(FILES_DIR, filePr), s.title, "Premiere Pro");

    const created = new Date(Date.now() - DAYS[i % DAYS.length] * 86400000).toISOString();
    createProduct({
      slug,
      title: s.title,
      tagline: s.tagline,
      description: s.desc,
      hasAe,
      hasPr,
      motionbro: !!s.mb,
      autoresize: !!s.ar,
      featured: !!s.feat,
      featuredOrder: s.feat ?? 0,
      priceAe: hasAe ? ae * 100 : null,
      pricePr: hasPr ? pr * 100 : null,
      priceBoth: hasAe && hasPr ? both * 100 : null,
      salePercent: s.sale ?? 0,
      tags: s.tags,
      filesIncluded: files,
      sizeLabel: s.size,
      resolution: s.res === "social" ? "Vertical 1080×1920 + Square + Horizontal" : s.res === "4k" ? "4K · 3840×2160" : "Full HD · 1920×1080",
      elementsCount: s.elements ?? (i % 3 === 0 ? total : null),
      customFeatures: s.custom ?? (i % 4 === 1 ? [{ title: "Color presets", text: "12 hand-picked palettes switchable in one click." }] : []),
      categories,
      scenes,
      previewImage: `/media/demo/${slug}/poster.jpg`,
      previewVideo: `/media/demo/${slug}/preview.mp4`,
      fileAe,
      filePr,
      createdAt: created,
      sales: s.feat ? 900 - s.feat * 90 + i : 20 + ((i * 97) % 600),
    });

    jobs.push(() => makeVideo(slug, s, dir, font, mono));
    sceneCats.forEach((cat, k) => jobs.push(() => makeScene(dir, k, cat, s, slug, font, mono)));
  });

  console.log(`Inserted ${SPECS.length} products; rendering ${jobs.length} media jobs...`);
  let done = 0;
  await pool(jobs, 4, async (j) => {
    await j();
    if (++done % 100 === 0) console.log(`  ${done}/${jobs.length}`);
  });
  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
