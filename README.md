# Taper Tracker

A medication taper tracking app with a daily dose logger and activity graph.
## Features

### Taper Tracker 
- **Daily Dose Logging** — track morning/afternoon/evening/night doses with quick +/- controls
- **Timeline View** — visualize your entire taper schedule with current stage indicator
- **History** — review past logs with  stats and streak tracking
- **Profile Management** — multiple medication profiles, configurable pace (Very Slow / Slow / Quick)
- **Waythrough Guide** — taper schedules based on the Waythrough benzodiazepine reduction guide

### Medication Tracker 
- **Prescription Management** — add common ADHD meds or custom prescriptions
- **One-Tap Dose Logging** — tap a med card to log a dose at the current time
- **Activity Curve** — real-time  graph showing estimated active medication levels

## Tech Stack

- **Next.js 15** (App Router, Server Components)
- **TypeScript** (strict mode)
- **Tailwind CSS** (custom design tokens, dark mode)
- **Framer Motion** (animations)
- **Recharts** (activity curve chart)
- **Notion API** (database layer)
- **Vercel** (deployment)

## Notion Database Setup

You need 4 Notion databases. Create them in your Notion workspace 

### 1. Taper Profiles DB
| Property | Type |
|---|---|
| Name | Title |
| Medication Name | Rich Text |
| Starting Dose | Number |
| Current Dose | Number |
| Duration On Med | Select (Under 1 year / 1–5 years / 5+ years) |
| Reduction Speed | Select (Very Slow / Slow / Quick) |
| Current Stage | Number |
| Start Date | Date |
| Status | Select (Active / Paused / Completed) |

### 2. Taper Dose Logs DB
| Property | Type |
|---|---|
| Name | Title |
| Date | Date |
| Target Dose | Number |
| Taken Dose | Number |
| Morning | Number |
| Afternoon | Number |
| Evening | Number |
| Night | Number |
| Notes | Rich Text |
| Status | Select (On Track / Over / Under / Missed) |
| Profile | Relation → Taper Profiles |

### 3. Med Prescriptions DB
| Property | Type |
|---|---|
| Name | Title |
| Dose mg | Number |
| Half Life Hours | Number |
| Onset Minutes | Number |
| Peak Hours | Number |
| Frequency | Select (once_daily / twice_daily / three_daily / as_needed) |
| Color | Rich Text |
| Active | Checkbox |

### 4. Med Logs DB
| Property | Type |
|---|---|
| Name | Title |
| Prescription | Relation → Med Prescriptions |
| Prescription Name | Rich Text |
| Dose mg | Number |
| Half Life Hours | Number |
| Taken At | Rich Text |
| Date | Date |
| Notes | Rich Text |

## Setup

```bash
# 1. Clone and install
git clone
npm install

# 2. add environment
  .env.local

# 3. Run development server
npm run dev
```

## Deployment

```bash
# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
```


