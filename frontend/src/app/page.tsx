import Link from "next/link";
import OfficerMenu from "@/components/OfficerMenu";

// A small made-up rainfall pattern that tells the false onset story visually.
// Each number is a day's rain height (0 to 100).
const STORY_RAIN = [
  0, 0, 5, 0, 0, 0, 55, 70, 48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 35, 60, 45, 80, 52,
  66, 40, 72, 58,
];

const STEPS = [
  {
    title: "The first rains arrive",
    text: "A few heavy showers fall. The soil darkens. Everyone in the village takes it as the signal the season has started.",
  },
  {
    title: "The farmer plants",
    text: "Seed, fertiliser and labour are paid for, often with the household's savings. The seeds sprout within days.",
  },
  {
    title: "Then the rain stops",
    text: "Two weeks of dry, hot weather follow. The young seedlings wither before the real rains come.",
  },
  {
    title: "Start again, poorer and later",
    text: "Those who can afford new seed replant, now late in the season. Those who cannot, lose the season.",
  },
];

const HOW = [
  {
    n: "01",
    title: "NASA satellite rainfall",
    text: "Daily rainfall from NASA POWER for every northern state, going back to 2000.",
  },
  {
    n: "02",
    title: "False onset risk",
    text: "We find every year the rains started and then broke, and score each state's risk for this season.",
  },
  {
    n: "03",
    title: "A phone call, in their language",
    text: "When a dry spell is likely, farmers get a short voice call telling them to wait. Any basic phone works.",
  },
];

const SOURCES = [
  {
    label: "Ati, O.F. (1995). Onset of the growing season in the Sudan Savanna of northern Nigeria. Ahmadu Bello University.",
    href: "https://kubanni.abu.edu.ng/handle/123456789/4756",
  },
  {
    label: "Ati, Stigter & Oladipo (2002). International Journal of Climatology.",
    href: "https://zendy.io/title/10.1002/joc.712",
  },
  {
    label: "ARISE News (2026). NiMet: Don't plant yet, early rains don't signal season start.",
    href: "https://www.arise.tv/james-ijampe-adamu-dont-plant-yet-early-rains-dont-signal-season-start/",
  },
  {
    label: "AllAfrica / The Conversation (2026). Climate change and Nigeria's rain-fed farming.",
    href: "https://allafrica.com/stories/202601260003.html",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f6f7f4] text-zinc-900">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-lg">
            🌱
          </span>
          <span className="text-lg font-bold">Shuka</span>
        </Link>
        <div className="flex items-center gap-5">
          <OfficerMenu />
          <Link
            href="/dashboard"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Open dashboard
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-2 lg:pt-16">
        <div>
          <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            NASA Space Apps Challenge 2026 · Abuja
          </p>
          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            The first rain is not always the <span className="text-emerald-700">real</span> rain.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600">
            Shuka turns NASA satellite rainfall into clear planting advice, and calls farmers in
            their own language before a false start costs them their seed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-zinc-900 px-6 py-3.5 font-semibold text-white transition hover:bg-zinc-700"
            >
              Open the risk dashboard →
            </Link>
            <a
              href="#how"
              className="rounded-xl border border-zinc-300 bg-white px-6 py-3.5 font-semibold transition hover:border-zinc-400"
            >
              How it works
            </a>
          </div>
        </div>

        {/* Visual: the false onset in one picture */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Daily rainfall, early season</p>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
              False onset
            </span>
          </div>
          <div className="mt-8 flex h-44 items-end gap-[3px]">
            {STORY_RAIN.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-sm ${
                  i >= 6 && i <= 8 ? "bg-amber-500" : i >= 23 ? "bg-emerald-600" : "bg-zinc-300"
                }`}
                style={{ height: `${Math.max(h, 2)}%` }}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] leading-snug sm:text-xs">
            <p>
              <span className="font-semibold text-amber-600">Early showers</span>
              <br />
              <span className="text-zinc-500">farmers plant</span>
            </p>
            <p className="text-center">
              <span className="font-semibold text-red-600">Dry spell</span>
              <br />
              <span className="text-zinc-500">seedlings die</span>
            </p>
            <p className="text-right">
              <span className="font-semibold text-emerald-700">Real onset</span>
              <br />
              <span className="text-zinc-500">the right time</span>
            </p>
          </div>
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <span className="font-semibold">Shuka&apos;s call:</span> wait for the green, not the amber.
          </div>
        </div>
      </header>

      {/* Why Shuka: the story */}
      <section id="why" className="border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Why Shuka
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Every year, the sky sends northern farmers a wrong signal.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">
            Farming in Nigeria runs on rain, not irrigation. So the most important decision of the
            year is simple and unforgiving. When do you plant? Get it wrong, and this is what happens.
          </p>

          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-zinc-200 bg-[#f6f7f4] p-6">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    i === 2 ? "bg-red-100 text-red-700" : "bg-zinc-900 text-white"
                  }`}
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{step.text}</p>
              </li>
            ))}
          </ol>

          {/* The numbers behind the story */}
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <Stat
              big="1 in 3"
              text="In parts of northern Nigeria's savanna, common ways of judging the start of the rains were fooled by false starts in up to a third of years."
              source="Ati, ABU Zaria"
            />
            <Stat
              big="+28%"
              text="Extreme dry spells in Nigeria have risen by an estimated 28% compared with the 1990s, making early-season breaks more likely."
              source="The Conversation, 2026"
            />
            <Stat
              big="Every year"
              text={`Nigeria's weather agency warns that farmers keep losing money by planting on the first rains. In its words, "we find our farmers losing their resources by rushing to plant."`}
              source="NiMet, 2026"
            />
          </div>

          <div className="mt-14 rounded-3xl bg-zinc-900 p-8 text-white sm:p-10">
            <p className="text-xl font-semibold leading-relaxed sm:text-2xl">
              Back in 2002, researchers studying northern Nigeria recommended a team that would
              calculate the real onset live each season and tell farmers directly.
            </p>
            <p className="mt-4 text-lg text-zinc-300">
              Shuka is that idea, automated with NASA data and delivered by a phone call.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          From satellite to farmer in three steps
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {HOW.map((item) => (
            <div key={item.n} className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
              <p className="font-mono text-sm text-zinc-400">{item.n}</p>
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-zinc-600">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
            <h3 className="font-semibold">Why a voice call</h3>
            <p className="mt-2 leading-relaxed text-zinc-600">
              No smartphone, no data bundle and no reading needed. If a phone can ring, the farmer
              gets the warning.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
            <h3 className="font-semibold">Why local languages</h3>
            <p className="mt-2 leading-relaxed text-zinc-600">
              Northern Nigeria speaks many languages. Advice only helps if it is understood, so
              alerts are recorded in the languages farmers actually use.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-emerald-700 p-8 text-white sm:p-12 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">See this season&apos;s risk map</h2>
            <p className="mt-2 text-emerald-100">
              All 19 northern states and the FCT, with a planting verdict for each.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl bg-white px-6 py-3.5 font-semibold text-emerald-800 transition hover:bg-emerald-50"
          >
            Open dashboard →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-zinc-500 sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <p>Built for the NASA Space Apps Challenge 2026, Abuja.</p>
            <p>
              Rainfall data from{" "}
              <a href="https://power.larc.nasa.gov" className="underline hover:text-zinc-800">
                NASA POWER
              </a>
              {" · "}
              <a
                href="https://github.com/isaac-akhigbe/shuka"
                className="underline hover:text-zinc-800"
              >
                GitHub
              </a>
            </p>
          </div>
          <div className="mt-8">
            <p className="font-semibold text-zinc-700">Sources</p>
            <ul className="mt-2 space-y-1">
              {SOURCES.map((s) => (
                <li key={s.href}>
                  <a href={s.href} className="hover:text-zinc-800 hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ big, text, source }: { big: string; text: string; source: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-7">
      <p className="text-4xl font-black tracking-tight text-red-600">{big}</p>
      <p className="mt-3 leading-relaxed text-zinc-700">{text}</p>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-zinc-400">{source}</p>
    </div>
  );
}
