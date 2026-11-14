import Image from "next/image";
import Link from "next/link";
import OfficerMenu from "@/components/OfficerMenu";
import CountUp from "@/components/landing/CountUp";
import Icon from "@/components/landing/Icon";
import Reveal from "@/components/landing/Reveal";
import StateBubbleMap from "@/components/landing/StateBubbleMap";
import plannerShot from "../../public/screens/planner.webp";

const CHALLENGES = [
  {
    icon: "cloudRain",
    title: "The first rains are less reliable",
    text: "More seasons now start with rain, then a dry spell long enough to kill new seedlings. Farmers who plant early lose seed and money.",
  },
  {
    icon: "leaf",
    title: "Soil is wearing out",
    text: "Growing the same cereal on the same land every year drains nitrogen and builds up pests and Striga weed, so each year needs more fertiliser.",
  },
  {
    icon: "users",
    title: "Too few people to give advice",
    text: "One extension worker serves thousands of farm families, so most farmers never get advice that fits their area's changing climate.",
  },
];

const SOLUTIONS = [
  {
    icon: "satellite",
    title: "A climate profile for every state",
    text: "26 years of NASA data show how often the first rains fail, when it is safe to plant, and whether things are getting worse.",
  },
  {
    icon: "layers",
    title: "Rotations compared, not prescribed",
    text: "Today's common practice next to two alternatives, scored on water, climate resilience, soil and income, with benefits, risks and data gaps.",
  },
  {
    icon: "phone",
    title: "Advice that reaches the farm",
    text: "An AI briefing in plain language, approved by the extension officer, ready for farmers on any basic phone in their own language.",
  },
];

const STEPS = [
  {
    icon: "satellite",
    title: "NASA data in",
    text: "Daily rain, temperature and root-zone soil wetness from NASA POWER for 20 states, quality checked and refreshed every day.",
  },
  {
    icon: "chart",
    title: "Climate profile",
    text: "False start rate, safe planting window, dry-year season length and the trend since 2000.",
  },
  {
    icon: "layers",
    title: "Rotations scored",
    text: "Ten rotations of seven local crops, weighted by the farmers' biggest problem.",
  },
  {
    icon: "sparkles",
    title: "Briefing out",
    text: "AI writes it in plain language, the officer checks and approves it, then it goes to farmers.",
  },
];

const SAFEGUARDS = [
  "Every number comes from Shuka's own NASA analysis, never from the AI",
  "AI text is checked for invented numbers and off-limits topics like fertiliser doses",
  "An extension officer approves every briefing before it can be used",
  "No farmer names or phone numbers are ever sent to the AI",
  "Years with impossible NASA values are left out, and listed openly",
  "Officers can only work in their own state",
];

const BUILT = ["Climate risk map", "Rotation planner", "Farmer registry with consent", "AI farmer briefings"];
const NEXT = [
  { title: "Voice call agent", text: "Farmers talk to Shuka by phone in Hausa and other languages." },
  { title: "USSD sign-up", text: "Farmers join from any basic phone with a short code." },
  { title: "Yam and cassava", text: "Multi-year rotations for the middle belt." },
  { title: "Dry-season vegetables", text: "Irrigated onion and tomato advice using SMAP and ECOSTRESS." },
  { title: "LGA-level detail", text: "Finer rainfall from GPM IMERG." },
  { title: "Dry spell alerts", text: "A warning to officers when NASA data shows a dry spell starting." },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f7f4] text-zinc-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200/70 bg-[#f6f7f4]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">🌱</span>
            <span className="text-lg font-bold">Shuka</span>
          </Link>
          <div className="flex items-center gap-5">
            <a href="#challenge" className="hidden text-sm font-semibold text-zinc-600 hover:text-zinc-900 lg:inline">
              The challenge
            </a>
            <a href="#how" className="hidden text-sm font-semibold text-zinc-600 hover:text-zinc-900 lg:inline">
              How it works
            </a>
            <div className="hidden sm:block">
              <OfficerMenu />
            </div>
            <Link
              href="/dashboard"
              className="whitespace-nowrap rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              <span className="sm:hidden">Dashboard</span>
              <span className="hidden sm:inline">Open dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden">


        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-14 text-center sm:px-8 lg:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400 bg-white/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">

            NASA Space Apps Challenge 2026 · Field Shift · Abuja
          </p>

          <h1 className="mt-6 text-[5.5rem] font-black leading-none tracking-tighter text-emerald-900 sm:text-[9rem] lg:text-[11rem]">
            Shuka
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
            Crop rotation advice for northern Nigeria, built on 26 years of NASA climate data.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 font-semibold text-white shadow-[0_12px_30px_-10px_rgba(4,120,87,0.7)] transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Explore the climate map
              <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login?next=/plan"
              className="rounded-xl border border-zinc-300 bg-white px-6 py-3.5 font-semibold transition hover:-translate-y-0.5 hover:border-zinc-400"
            >
              Try the officer demo
            </Link>
          </div>

          {/* Product picture */}
          <div className="relative mx-auto mt-14 max-w-5xl text-left">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-emerald-300/40 via-lime-200/30 to-amber-200/40 blur-2xl" />
            <div className="relative">
              <BrowserFrame url="shuka / plan / kano">
                <Image
                  src={plannerShot}
                  alt="Shuka rotation planner for Kano"
                  placeholder="blur"
                  priority
                  sizes="(min-width: 1024px) 1024px, 100vw"
                />
              </BrowserFrame>
            </div>
            <div className="absolute -bottom-6 -left-2 hidden items-center gap-2.5 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-lg sm:flex lg:-left-10">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Icon name="sun" className="h-4 w-4" />
              </span>
              <div className="text-sm leading-tight">
                <p className="font-semibold">Safe to plant</p>
                <p className="text-zinc-500">from about 4 July</p>
              </div>
            </div>
            <div className="absolute -right-2 top-16 hidden items-center gap-2.5 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-lg sm:flex lg:-right-10">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Icon name="cloudRain" className="h-4 w-4" />
              </span>
              <div className="text-sm leading-tight">
                <p className="font-semibold">Kano false starts</p>
                <p className="text-zinc-500">14% → 42% since 2014</p>
              </div>
            </div>
            <div className="absolute -bottom-5 right-10 hidden items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-lg sm:flex">
              <Icon name="shield" className="h-4 w-4" />
              Officer approved
            </div>
          </div>
        </div>
      </header>

      {/* The challenge */}
      <section id="challenge" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <Eyebrow>Field Shift</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            The challenge we&apos;re solving
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-zinc-600">
            Farming in northern Nigeria runs on rain, and the seasons farmers grew up with are changing.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-red-700">
              <Icon name="alert" className="h-5 w-5" /> The problem
            </h3>
            <div className="mt-5 space-y-4">
              {CHALLENGES.map((c, i) => (
                <Reveal key={c.title} delay={i * 100}>
                  <FeatureRow icon={c.icon} title={c.title} text={c.text} tone="red" />
                </Reveal>
              ))}
            </div>
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-700">
              <Icon name="check" className="h-5 w-5" /> What Shuka does
            </h3>
            <div className="mt-5 space-y-4">
              {SOLUTIONS.map((c, i) => (
                <Reveal key={c.title} delay={i * 100 + 50}>
                  <FeatureRow icon={c.icon} title={c.title} text={c.text} tone="green" />
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            big={<CountUp to={85} suffix="%" />}
            text="of the food Nigerians eat comes from smallholder farmers."
            source="Minister of Agriculture, 2025"
          />
          <StatCard
            big={<CountUp to={3} suffix="×" />}
            text="more false starts in Kano since 2014. 14% of seasons up to 2013, 42% since."
            source="Shuka analysis of NASA POWER"
          />
          <StatCard
            big={<CountUp to={21} suffix=" days" />}
            text="dry spells forecast for June to August 2026 in parts of 14 northern states."
            source="NiMet 2026 Seasonal Climate Prediction"
          />
          <StatCard
            big={<CountUp to={6466} prefix="1 : " />}
            text="extension workers to farm families. FAO recommends 1 to 800."
            source="National Extension Review, 2025"
          />
        </div>
      </section>

      {/* Map */}
      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <Eyebrow>From NASA POWER, 2000 to 2026</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Where the first rains fail most
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-zinc-600">
              Each circle is a state, sized by how often the first rains were followed by a dry spell. The
              risk is not only in the far north. Nasarawa, Plateau and Kano top the list.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { name: "Nasarawa", value: 32, color: "bg-red-500" },
                { name: "Plateau", value: 29, color: "bg-amber-500" },
                { name: "Kano", value: 27, color: "bg-amber-500" },
              ].map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{s.name}</span>
                    <span className="text-zinc-500">{s.value}% of seasons</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-zinc-100">
                    <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${(s.value / 35) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-xs font-medium text-zinc-500">
              <Legend color="bg-red-500" label="High risk" />
              <Legend color="bg-amber-500" label="Medium" />
              <Legend color="bg-green-600" label="Low" />
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-[#fafbf8] p-4 sm:p-6">
              <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
              <div className="relative">
                <StateBubbleMap />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Why rotation */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Evidence from northern Nigeria
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-zinc-600">
            Rotating cereals like millet, guinea corn and maize with beans and groundnut is one of the cheapest
            ways to protect yields, soil and income when rain is unreliable.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <EvidenceCard
            icon="leaf"
            big={<CountUp to={84} suffix=" kg" />}
            unit="nitrogen per hectare"
            text="fixed from the air by cowpea and groundnut in Bunkure, Kano, about 74% of their needs, left for the next cereal."
            source="Wageningen University"
          />
          <EvidenceCard
            icon="sprout"
            big={<CountUp to={138} prefix="+" suffix="%" />}
            unit="maize yield after cowpea"
            text="In Kaduna trials, maize after early cowpea gave 690 kg per hectare with no fertiliser, against 290 kg without, close to the 760 kg with urea."
            source="IITA"
          />
          <EvidenceCard
            icon="bug"
            big="46 to 100%"
            unit="less Striga weed"
            text="when Striga-tolerant maize was rotated with legumes on farms across Nigeria's Sudan savanna."
            source="ICRISAT and IITA"
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <Reveal className="mx-auto max-w-3xl text-center">

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              How Shuka works
            </h2>
          </Reveal>

          <div className="relative mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <div className="absolute left-[12%] right-[12%] top-8 hidden h-0.5 bg-zinc-200 lg:block" />
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 120} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-lg ring-1 ring-zinc-200">
                  <Icon name={s.icon} className="h-7 w-7" />
                </div>
                <p className="mt-5 font-mono text-xs text-zinc-400">Step {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs leading-relaxed text-zinc-600">{s.text}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-zinc-200 bg-[#f6f7f4] p-7">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Icon name="users" className="h-5 w-5 text-emerald-700" /> Who uses it
                </h3>
                <ul className="mt-4 space-y-3 leading-relaxed text-zinc-600">
                  <li>
                    <span className="font-semibold text-zinc-800">Extension officers and ADPs</span> build advice
                    for their state, register farmers and approve what is sent.
                  </li>
                  <li>
                    <span className="font-semibold text-zinc-800">Farmers</span> receive it in their language on
                    any basic phone. No smartphone, data or reading needed.
                  </li>
                  <li>
                    <span className="font-semibold text-zinc-800">Planners and NGOs</span> use the map to see
                    which states are becoming riskier.
                  </li>
                </ul>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="h-full rounded-2xl border border-zinc-200 bg-[#f6f7f4] p-7">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Icon name="shield" className="h-5 w-5 text-emerald-700" /> Built to be trusted
                </h3>
                <ul className="mt-4 space-y-2.5 text-zinc-600">
                  {SAFEGUARDS.map((s) => (
                    <li key={s} className="flex gap-2 leading-snug">
                      <span className="font-bold text-emerald-600">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Our Roadmap
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 lg:grid-cols-[0.9fr_2fr]">
          <Reveal>
            <div className="h-full rounded-2xl bg-emerald-800 p-7 text-white shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">Built this weekend</p>
              <ul className="mt-5 space-y-3">
                {BUILT.map((b) => (
                  <li key={b} className="flex items-center gap-3 font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NEXT.map((r, i) => (
              <Reveal key={r.title} delay={i * 80}>
                <div className="h-full rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-5 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-white">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Next</p>
                  <h3 className="mt-1 font-semibold">{r.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{r.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-emerald-800 p-8 text-white shadow-xl sm:p-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-xl">
                <h2 className="text-3xl font-bold sm:text-4xl">See how your state&apos;s seasons have changed</h2>
                <p className="mt-3 text-lg text-emerald-100">
                  All 19 northern states and the FCT, with a climate profile and rotation advice for each.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-white px-6 py-3.5 font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  Open the map →
                </Link>
                <Link
                  href="/login?next=/plan"
                  className="rounded-xl border border-emerald-300/60 px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Officer demo
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="overflow-hidden border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 pt-14 sm:px-8">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
                Crop rotation advice for northern Nigeria, built on NASA climate data. Shuka means &ldquo;plant&rdquo;
                in Hausa.
              </p>
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-zinc-400">
                Shuka supports, and does not replace, farmers&apos; judgement and local expert advice.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                { label: "Climate map", href: "/dashboard" },
                { label: "Rotation planner", href: "/plan" },
                { label: "Officer sign in", href: "/login" },
              ]}
            />
            <FooterCol
              title="Data"
              links={[
                { label: "NASA POWER", href: "https://power.larc.nasa.gov" },
                { label: "NiMet", href: "https://nimet.gov.ng" },
              ]}
            />
            <FooterCol
              title="Project"
              links={[
                { label: "GitHub", href: "https://github.com/isaac-akhigbe/shuka" },
                { label: "NASA Space Apps", href: "https://www.spaceappschallenge.org" },
              ]}
            />
          </div>
          <p className="mt-12 text-xs text-zinc-400">© 2026 Shuka. NASA Space Apps Challenge 2026, Abuja.</p>
        </div>
        <p
          aria-hidden
          className="mt-6 select-none text-center text-[27vw] font-black leading-[0.78] tracking-tighter text-emerald-900"
        >
          Shuka
        </p>
      </footer>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">{children}</p>;
}

function Accent({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "red" | "blue" }) {
  const colors = { green: "text-emerald-700", red: "text-red-600", blue: "text-blue-600" };
  return <span className={colors[tone]}>{children}</span>;
}

function FeatureRow({ icon, title, text, tone }: { icon: string; title: string; text: string; tone: "red" | "green" }) {
  const styles =
    tone === "red"
      ? "bg-red-50 text-red-600 ring-red-100"
      : "bg-emerald-50 text-emerald-700 ring-emerald-100";
  return (
    <div className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${styles}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-1 leading-relaxed text-zinc-600">{text}</p>
      </div>
    </div>
  );
}

function StatCard({ big, text, source }: { big: React.ReactNode; text: string; source: string }) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-4xl font-black tracking-tight text-red-600">{big}</p>
      <p className="mt-3 flex-1 leading-relaxed text-zinc-700">{text}</p>
      <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">{source}</p>
    </div>
  );
}

function EvidenceCard({
  icon,
  big,
  unit,
  text,
  source,
}: {
  icon: string;
  big: React.ReactNode;
  unit: string;
  text: string;
  source: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="relative mt-5 text-4xl font-black tracking-tight text-emerald-700">{big}</p>
      <p className="relative font-semibold">{unit}</p>
      <p className="relative mt-3 leading-relaxed text-zinc-600">{text}</p>
      <p className="relative mt-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">{source}</p>
    </div>
  );
}

function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-emerald-900/10">
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-3 rounded-md bg-white px-3 py-1 text-xs text-zinc-500 ring-1 ring-zinc-200">{url}</span>
      </div>
      {children}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-zinc-500">
        {links.map((l) => (
          <li key={l.label}>
            {l.href.startsWith("http") ? (
              <a href={l.href} className="hover:text-zinc-900">
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="hover:text-zinc-900">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
