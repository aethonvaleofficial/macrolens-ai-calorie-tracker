# AI Log 01 — ChatGPT Planning

## Prompt
I found a contest on 8xEngineer called “Build a Cal AI Clone — AI Calorie Tracker.” It asks to build a mobile app where users photograph food and get calories, protein, carbs, fat, diary, macro progress rings, weekly charts, streaks, and goals. What should I build?

## Response
We should build a mobile-first PWA prototype called MacroLens using React + Vite. It should include a home dashboard, scan/upload screen, AI nutrition result, daily diary, macro rings, weekly chart, streak tracking, and settings. Because the deadline is short, the first version should focus on polished screenshots and a working demo flow. If real AI API integration is not possible in time, use mock AI mode with realistic structured nutrition results.

---

## Prompt
Is the contest asking to build website or app?

## Response
The contest asks for a mobile app. A mobile-first PWA is a good low-cost approach because it behaves like an app, works in the browser, and avoids App Store or Play Store publishing fees. We can honestly describe it as a mobile-first PWA prototype of an AI calorie tracker app.

---

## Prompt
They say AI logs are required before coding. What should I do?

## Response
Create an /ai-logs/ folder before writing app code. Save AI conversations as .md, .txt, or .jsonl files. Each interaction should clearly separate Prompt and Response. Commit this folder to GitHub before building the app.

---

## Prompt
What stack should I use?

## Response
Use React + Vite, mobile-first UI, localStorage for diary/goals, mock AI analysis first, reusable components, and optional real AI integration later. Publish using GitHub + Vercel or Netlify for free.

---

## Prompt
What is the safest no-cost build strategy?

## Response
Use a public GitHub repository, React + Vite, and free deployment through Vercel or Netlify. Do not depend on paid no-code publishing. The contest needs a public GitHub URL, Loom walkthrough, screenshots, reflection, and AI logs.
