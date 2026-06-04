# 🌿 MacroLens — AI Calorie Tracker

> **8xEngineer Contest Submission** · Cal AI Clone Challenge

A premium, mobile-first PWA that uses AI vision to analyze meals and track macros — built with React + Vite, styled like a polished iOS health app.

---

## 📸 Screenshots

> _(Add screenshots of each screen here before submission)_
> - Home Dashboard · Scan Meal · Diary · History · Settings

---

## ✨ Features

| Feature | Status |
|---|---|
| 🏠 Home Dashboard with calorie arc, macro rings, streak, weekly chart | ✅ |
| 📷 Scan Meal with photo upload & image preview | ✅ |
| 🧠 Animated AI analyzing state (mock → real AI ready) | ✅ |
| 🃏 Nutrition result card with confidence score | ✅ |
| 📋 Daily Diary grouped by Breakfast / Lunch / Dinner / Snack | ✅ |
| 📈 Weekly History with bar chart & macro trend | ✅ |
| ⚙️ Settings with editable daily goals & about page | ✅ |
| 💾 localStorage persistence for diary entries & goals | ✅ |
| 📱 Mobile-first PWA layout | ✅ |

---

## 🚀 Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/aethonvaleofficial/macrolens-ai-calorie-tracker.git
cd macrolens-ai-calorie-tracker

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

---

## 🤖 AI Integration

Currently uses **mock AI analysis** for demo stability. The real AI hook is one function swap away.

Search for `// 🤖 AI_INTEGRATION_POINT` in `src/App.jsx` — the comment block shows exactly how to plug in:

- **OpenAI GPT-4o Vision** (recommended)
- **Google Gemini 1.5 Flash Vision**
- **Any REST vision API**

Example integration point (in `ScanMeal` component):

```js
// 🤖 AI_INTEGRATION_POINT ─────────────────────────
// const base64 = await toBase64(image);
// const res = await fetch("https://api.openai.com/v1/chat/completions", {
//   method: "POST",
//   headers: { Authorization: `Bearer ${API_KEY}` },
//   body: JSON.stringify({ model: "gpt-4o", messages: [...] })
// });
// setResult(JSON.parse(data.choices[0].message.content));
```

---

## 🗂 Project Structure

```
macrolens-ai-calorie-tracker/
├── public/
│   └── vite.svg
├── src/
│   ├── App.jsx          # All screens + components
│   ├── App.css          # All styles (design system)
│   ├── index.css        # Global reset
│   └── main.jsx         # Entry point
├── ai-logs/             # AI conversation logs (contest requirement)
│   └── ai-logs/
  chatgpt-planning-01.md
  chatgpt-build-01.md
  claude-build-01.md
  session-01.md
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🛠 Tech Stack

- **React 18** — UI components
- **Vite** — Build tool
- **CSS Custom Properties** — Design token system
- **localStorage** — Client-side persistence
- **PWA-ready** — Mobile-first, installable

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| `--green` | `#34C759` | Primary accent, iOS green |
| `--orange` | `#FF9500` | Carbs, warnings |
| `--blue` | `#007AFF` | Protein, info |
| `--purple` | `#AF52DE` | Fat |
| `--bg` | `#F5F7F5` | App background |
| `--surface` | `#FFFFFF` | Cards |

---

## 📁 AI Logs

All AI conversations used to build this project are documented in [`/ai-logs/`](./ai-logs/).

---

## ⚠️ Disclaimer

Nutritional estimates are AI-generated and for informational purposes only. Consult a registered dietitian for medical nutrition advice.

---

## 📄 License

MIT — Built for the 8xEngineer "Build a Cal AI Clone" contest.
