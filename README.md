**NASA-powered crop planning for northern Nigeria.**

Built for the NASA Space Apps Challenge 2026 (Field Shift: Adapting Farms with NASA Data), Abuja.

Shuka is a crop planning tool for northern Nigeria that helps extension officers advise farmers on what, how and when to plant. It turns more than 25 years of NASA POWER climate data into a profile for each state, then compares the crop rotation farmers use today with better alternatives, scored for water use, soil health, climate fit and income. Every option comes with a plain explanation of why it was suggested, the evidence, the benefits and the risks. The officer then turns the advice into a farmer briefing in plain language, ready to reach registered farmers in their own language on any basic phone.

This matters because most northern farmers rely on rain that is becoming less predictable, and Nigeria has roughly one extension worker for every 6,466 farm families, so good advice rarely reaches them in time.

## The problem

- Smallholder farmers grow about 85% of the food Nigerians eat, and in the north they farm almost entirely on rain.
- The first rains are less reliable. In Kano, a false start (first rains followed by a dry spell that kills new seedlings) happened in 14% of seasons from 2000 to 2013 and 42% since 2014.
- Growing the same cereal every year wears out the soil and builds up Striga weed.
- With so few extension workers, most farmers never get advice that fits their area's changing climate.

## What Shuka does

- **Climate risk map.** All 19 northern states and the FCT, coloured by false start risk, with a season-by-season history for each.
- **Climate profile.** False start rate and trend, safe planting window, season length and rain in a dry year, and heat days.
- **Rotation planner.** The officer picks a state, what farmers grow today and their biggest problem. Shuka compares the current practice with two alternatives and explains each one.
- **Farmer registry.** Officers add farmers one by one or upload a CSV, with consent recorded.
- **AI farmer briefing.** Gemini writes the advice in plain language with likely farmer questions. The officer reviews and approves it before it is used.

## How it works

```
NASA POWER  →  quality check  →  climate profile  →  rotation scoring  →  AI briefing  →  officer approval
```

1. **NASA data.** Daily data from 2000 to today for each state capital, refreshed every day.
2. **Climate profile.** Shuka finds the onset of rains each year and marks a false start when a dry spell of more than 7 days follows within 30 days. Years with impossible values are left out and listed openly.
3. **Rotation scoring.** Ten rotations of seven local crops (maize, guinea corn, millet, beans, groundnut, soya beans and beniseed) are scored 0 to 100 on water fit, climate resilience, soil health and income, weighted by the farmers' biggest problem.
4. **AI briefing.** Gemini only receives numbers computed by Shuka. Any other number, and topics like fertiliser doses or prices, are flagged for review. No farmer names or phone numbers are sent to the AI.

## NASA data

| Dataset | Variable | Use |
|---|---|---|
| NASA POWER daily API | `PRECTOTCORR` precipitation | Onset, false starts, dry spells, season length |
| NASA POWER daily API | `T2M_MAX` max temperature | Heat stress days (35 °C and above) |
| NASA POWER daily API | `GWETROOT` root-zone soil wetness | Soil moisture during the season |

## Tech stack

- **Frontend.** Next.js, React, TypeScript, Tailwind CSS, React Leaflet, Recharts
- **Backend.** Python, FastAPI, SQLite
- **AI.** Google Gemini
