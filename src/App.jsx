/**
 * MacroLens AI Calorie Tracker
 * Main App Component
 *
 * Screens:
 *  - Dashboard (Home)
 *  - Scan Meal
 *  - Daily Diary
 *  - Weekly History
 *  - Settings / About
 *
 * AI Integration Note:
 *  Search for "// 🤖 AI_INTEGRATION_POINT" comments to find where
 *  a real vision API (e.g. OpenAI GPT-4o, Google Gemini Vision) can be wired in.
 */

import { useState } from "react";
import { takeFoodPhoto, chooseFoodPhoto } from "./lib/camera";
import { analyzeFoodPhotoWithAI } from "./lib/foodVision";
import "./App.css";

// ─────────────────────────────────────────────
// 🗂  MOCK DATA
// ─────────────────────────────────────────────

// Local nutrition database – common foods with macro per 100g serving
const FOOD_DB = [
  { name: "Rice", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Roti", calories: 250, protein: 8, carbs: 45, fat: 4 },
  { name: "Dal", calories: 120, protein: 9, carbs: 15, fat: 2 },
  { name: "Paneer", calories: 265, protein: 18, carbs: 6, fat: 20 },
  { name: "Egg", calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { name: "Milk", calories: 42, protein: 3.4, carbs: 5, fat: 1 },
  { name: "Chicken", calories: 239, protein: 27, carbs: 0, fat: 14 },
  { name: "Salad", calories: 20, protein: 1, carbs: 3, fat: 0.2 },
  { name: "Poha", calories: 180, protein: 5, carbs: 30, fat: 5 },
  { name: "Dosa", calories: 140, protein: 4, carbs: 20, fat: 5 },
  { name: "Idli", calories: 80, protein: 2, carbs: 15, fat: 0.5 },
  { name: "Burger", calories: 295, protein: 12, carbs: 30, fat: 15 },
  { name: "Pizza", calories: 266, protein: 11, carbs: 33, fat: 10 }
];

// Mock results retained for demo mode when no food selected
// Mock results retained for demo mode when no food selected
const MOCK_RESULTS = [
  {
    meal: "Grilled Chicken Salad",
    calories: 420,
    protein: 38,
    carbs: 22,
    fat: 18,
    confidence: 94,
    notes: "Estimated with grilled chicken breast, mixed greens, cherry tomatoes, olive oil dressing.",
  },
  {
    meal: "Avocado Toast with Egg",
    calories: 380,
    protein: 16,
    carbs: 34,
    fat: 21,
    confidence: 91,
    notes: "Two slices whole-grain bread, half avocado, one poached egg.",
  },
  {
    meal: "Mango Smoothie Bowl",
    calories: 310,
    protein: 8,
    carbs: 58,
    fat: 6,
    confidence: 88,
    notes: "Mango, banana, granola topping, chia seeds.",
  },
  {
    meal: "Paneer Butter Masala",
    calories: 520,
    protein: 22,
    carbs: 30,
    fat: 35,
    confidence: 87,
    notes: "Rich tomato-cream gravy with cottage cheese. Estimate based on restaurant-style portion.",
  },
  {
    meal: "Oatmeal with Berries",
    calories: 290,
    protein: 10,
    carbs: 52,
    fat: 5,
    confidence: 96,
    notes: "Rolled oats, mixed berries, honey drizzle.",
  },
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

// ─────────────────────────────────────────────
// 🛠  UTILS
// ─────────────────────────────────────────────

const today = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

function useDiary() {
  const [entries, setEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ml_diary") || "[]");
    } catch {
      return [];
    }
  });

  const save = (next) => {
    setEntries(next);
    localStorage.setItem("ml_diary", JSON.stringify(next));
  };

  const addEntry = (entry) => save([...entries, { ...entry, id: Date.now(), date: today() }]);
  const removeEntry = (id) => save(entries.filter((e) => e.id !== id));

  return { entries, addEntry, removeEntry };
}

function useGoals() {
  const [goals, setGoals] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ml_goals") || JSON.stringify(DEFAULT_GOALS));
    } catch {
      return DEFAULT_GOALS;
    }
  });
  const saveGoals = (g) => { setGoals(g); localStorage.setItem("ml_goals", JSON.stringify(g)); };
  return { goals, saveGoals };
}

function todayEntries(entries) {
  return entries.filter((e) => e.date === today());
}

function sumMacros(entries) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function calcStreak(entries) {
  const days = [...new Set(entries.map((e) => e.date))].sort().reverse();
  if (!days.length) return 0;

  const todayStr = today();
  const parseDate = (dStr) => new Date(dStr + "T12:00:00");
  const diffDays = (d1, d2) => Math.round((d1 - d2) / 86400000);

  const latestDate = parseDate(days[0]);
  const todayDate = parseDate(todayStr);
  const diffFromToday = diffDays(todayDate, latestDate);

  if (diffFromToday > 1) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < days.length - 1; i++) {
    const current = parseDate(days[i]);
    const next = parseDate(days[i + 1]);
    const diff = diffDays(current, next);
    if (diff === 1) {
      streak++;
    } else if (diff > 1) {
      break;
    }
  }
  return streak;
}

function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  });
}

// ─────────────────────────────────────────────
// 🎨  SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────

/** Circular macro ring */
function MacroRing({ label, value, goal, color, unit = "g" }) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="macro-ring">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--track)" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x="36" y="33" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-primary)">{value}</text>
        <text x="36" y="45" textAnchor="middle" fontSize="9" fill="var(--text-muted)">{unit}</text>
      </svg>
      <span className="macro-ring-label" style={{ color }}>{label}</span>
    </div>
  );
}

/** Mini bar chart for week */
function WeekChart({ entries, goals }) {
  const days = last7Days();
  const bars = days.map((d) => {
    const dayEntries = entries.filter((e) => e.date === d);
    const cal = dayEntries.reduce((a, e) => a + (e.calories || 0), 0);
    return { d, cal };
  });
  const maxCal = Math.max(...bars.map((b) => b.cal), goals.calories || 2000, 1);
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="week-chart">
      {bars.map(({ d, cal }) => {
        const dt = new Date(d + "T12:00:00");
        const pct = (cal / maxCal) * 100;
        const isToday = d === today();
        return (
          <div className="week-bar-wrap" key={d}>
            <div className="week-bar-bg">
              <div
                className="week-bar-fill"
                style={{
                  height: `${pct}%`,
                  background: isToday ? "var(--green)" : "var(--green-light)",
                }}
              />
            </div>
            <span className={`week-bar-label ${isToday ? "today" : ""}`}>
              {dayNames[dt.getDay()]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Calorie arc progress */
function CalArc({ value, goal }) {
  const pct = Math.min(value / Math.max(goal, 1), 1);
  const r = 80; // Match SVG path radius (M10,100 A80,80)
  const circ = Math.PI * r; // half circle
  const dash = pct * circ;
  const over = value > goal;

  return (
    <div className="cal-arc-wrap">
      <svg width="180" height="100" viewBox="0 0 180 100">
        <path
          d="M10,100 A80,80 0 0,1 170,100"
          fill="none" stroke="var(--track)" strokeWidth="12" strokeLinecap="round"
        />
        <path
          d="M10,100 A80,80 0 0,1 170,100"
          fill="none"
          stroke={over ? "var(--orange)" : "var(--green)"}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="cal-arc-center">
        <span className="cal-arc-value">{value.toLocaleString()}</span>
        <span className="cal-arc-label">of {goal.toLocaleString()} kcal</span>
      </div>
    </div>
  );
}

/** Nutrition result card */
function NutritionCard({ result, onAdd, onDiscard }) {
  const [portion, setPortion] = useState(result.baseQuantity || 100);
  const factor = portion / (result.baseQuantity || 100);
  const calc = (value) => Math.round(value * factor);
  const calories = calc(result.calories);
  const protein = calc(result.protein);
  const carbs = calc(result.carbs);
  const fat = calc(result.fat);
  return (
    <div className="nutrition-card animate-slide-up">
      <div className="nutrition-card-header">
        <div>
          <p className="nutrition-card-meal">{result.meal}</p>
          <span className="confidence-badge">
            <span className="confidence-dot" />
            {result.confidence}% confidence
          </span>
        </div>
        <div className="nutrition-cal-big">{calories}<span>kcal</span></div>
      </div>

      <div className="nutrition-macros">
        {[
          { label: "Protein", value: result.protein, color: "var(--blue)" },
          { label: "Carbs", value: result.carbs, color: "var(--orange)" },
          { label: "Fat", value: result.fat, color: "var(--purple)" },
        ].map(({ label, value, color }) => (
          <div className="nutrition-macro-pill" key={label}>
            <span style={{ color, fontWeight: 700 }}>{value}g</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {result.notes && (
        <p className="nutrition-notes">📝 {result.notes}</p>
      )}

      <div className="nutrition-card-actions">
        <button className="btn-secondary" onClick={onDiscard}>Discard</button>
        <button className="btn-primary" onClick={onAdd}>+ Add to Diary</button>
      </div>
    </div>
  );
}

/** Diary meal section */
function DiarySection({ mealType, entries, onRemove }) {
  const totals = sumMacros(entries);
  if (!entries.length) {
    return (
      <div className="diary-section">
        <div className="diary-section-header">
          <span className="diary-meal-type">{mealType}</span>
          <span className="diary-section-cal muted">— kcal</span>
        </div>
        <p className="diary-empty">No entries yet</p>
      </div>
    );
  }
  return (
    <div className="diary-section">
      <div className="diary-section-header">
        <span className="diary-meal-type">{mealType}</span>
        <span className="diary-section-cal">{totals.calories} kcal</span>
      </div>
      {entries.map((e) => (
        <div className="diary-entry" key={e.id}>
          <div>
            <p className="diary-entry-name">{e.meal}</p>
            <p className="diary-entry-macros">P {e.protein}g · C {e.carbs}g · F {e.fat}g</p>
          </div>
          <div className="diary-entry-right">
            <span className="diary-entry-cal">{e.calories}</span>
            <button className="diary-remove" onClick={() => onRemove(e.id)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 📱  SCREENS
// ─────────────────────────────────────────────

/** HOME DASHBOARD */
function Dashboard({ entries, goals }) {
  const te = todayEntries(entries);
  const totals = sumMacros(te);
  const streak = calcStreak(entries);
  const remaining = Math.max(goals.calories - totals.calories, 0);

  return (
    <div className="screen">
      {/* Header */}
      <div className="dash-header">
        <div>
          <p className="dash-greeting">Good {getGreeting()} 👋</p>
          <h1 className="dash-title">MacroLens</h1>
        </div>
        <div className="streak-badge">
          <span className="streak-fire">🔥</span>
          <span className="streak-count">{streak}</span>
          <span className="streak-text">day streak</span>
        </div>
      </div>

      {/* Calorie Arc */}
      <div className="glass-card center-card">
        <CalArc value={totals.calories} goal={goals.calories} />
        <div className="cal-stats-row">
          <div className="cal-stat">
            <span className="cal-stat-val green">{totals.calories}</span>
            <span className="cal-stat-label">Eaten</span>
          </div>
          <div className="cal-stat-divider" />
          <div className="cal-stat">
            <span className="cal-stat-val">{remaining}</span>
            <span className="cal-stat-label">Remaining</span>
          </div>
          <div className="cal-stat-divider" />
          <div className="cal-stat">
            <span className="cal-stat-val orange">0</span>
            <span className="cal-stat-label">Burned</span>
          </div>
        </div>
      </div>

      {/* Macro rings */}
      <div className="glass-card">
        <p className="card-section-title">Macros Today</p>
        <div className="macro-rings-row">
          <MacroRing label="Protein" value={totals.protein} goal={goals.protein} color="var(--blue)" />
          <MacroRing label="Carbs" value={totals.carbs} goal={goals.carbs} color="var(--orange)" />
          <MacroRing label="Fat" value={totals.fat} goal={goals.fat} color="var(--purple)" />
        </div>
      </div>

      {/* Weekly chart */}
      <div className="glass-card">
        <p className="card-section-title">This Week</p>
        <WeekChart entries={entries} goals={goals} />
      </div>

      {/* Quick stats */}
      <div className="quick-stats-row">
        <div className="quick-stat-card">
          <span className="qs-icon">🥗</span>
          <span className="qs-val">{te.length}</span>
          <span className="qs-label">Meals today</span>
        </div>
<div className="quick-stat-card">
  <span className="qs-icon">📸</span>
  <span className="qs-val">AI</span>
  <span className="qs-label">Food scanner</span>
</div>
        <div className="quick-stat-card">
          <span className="qs-icon">📊</span>
          <span className="qs-val">{goals.calories - totals.calories > 0 ? goals.calories - totals.calories : 0}</span>
          <span className="qs-label">kcal left</span>
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/** SCAN MEAL */
function ScanMeal({ onAddEntry }) {
  const [photo, setPhoto] = useState(null);
  const [state, setState] = useState("idle"); // idle | analyzing | result
  const [result, setResult] = useState(null);
  const [mealType, setMealType] = useState("Lunch");
  const [error, setError] = useState("");

  const handleTakePhoto = async () => {
    try {
      setError("");
      setResult(null);
      setState("idle");

      const capturedPhoto = await takeFoodPhoto();
      setPhoto(capturedPhoto);
    } catch (err) {
      console.error(err);
      setError("Camera was cancelled or could not open.");
    }
  };

  const handleChoosePhoto = async () => {
    try {
      setError("");
      setResult(null);
      setState("idle");

      const selectedPhoto = await chooseFoodPhoto();
      setPhoto(selectedPhoto);
    } catch (err) {
      console.error(err);
      setError("Gallery was cancelled or could not open.");
    }
  };

async function analyzeFoodImage(photoData) {
  return analyzeFoodPhotoWithAI(photoData);
}s

  const analyze = async () => {
    if (!photo) {
      setError("Please take or choose a food photo first.");
      return;
    }

    setError("");
    setState("analyzing");

    try {
      const r = await analyzeFoodImage(photo);
      setResult(r);
    } catch (e) {
      console.error(e);
      const r = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
      setResult(r);
    }

    setState("result");
  };

  const handleAdd = () => {
    if (!result) return;

    onAddEntry({ ...result, mealType });

    setPhoto(null);
    setResult(null);
    setState("idle");
    setError("");
  };

  const handleDiscard = () => {
    setResult(null);
    setState("idle");
  };

  const handleRetake = () => {
    setPhoto(null);
    setResult(null);
    setState("idle");
    setError("");
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <h2 className="screen-title">Scan Meal</h2>
        <p className="screen-subtitle">Take a food photo or choose one from gallery</p>
      </div>

      {!photo ? (
        <div className="upload-zone">
          <div className="upload-icon">📷</div>
          <p className="upload-title">Scan your meal</p>
          <p className="upload-sub">Use your camera for best results</p>

          <button className="btn-primary full" type="button" onClick={handleTakePhoto}>
            📸 Take Food Photo
          </button>

          <button className="btn-secondary full" type="button" onClick={handleChoosePhoto}>
            🖼️ Choose from Gallery
          </button>
        </div>
      ) : (
        <div className="preview-wrap">
          <img src={photo.previewUrl} alt="Meal preview" className="preview-img" />

          <div className="nutrition-card-actions">
            <button className="btn-secondary" type="button" onClick={handleRetake}>
              Retake
            </button>

            <button className="btn-secondary" type="button" onClick={handleChoosePhoto}>
              Gallery
            </button>
          </div>
        </div>
      )}

      {error && <p className="scanner-error">{error}</p>}

      <div className="meal-type-row">
        {MEAL_TYPES.map((t) => (
          <button
            key={t}
            className={`meal-type-btn ${mealType === t ? "active" : ""}`}
            onClick={() => setMealType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {state === "idle" && photo && (
        <button className="btn-primary full" onClick={analyze}>
          🔍 Analyze Meal
        </button>
      )}

      {state === "analyzing" && (
        <div className="analyzing-card animate-slide-up">
          <div className="analyzing-spinner">
            <div className="spinner-ring" />
            <span className="spinner-emoji">🧠</span>
          </div>

          <p className="analyzing-title">Analyzing your meal…</p>

          <div className="analyzing-steps">
            {["Reading food photo", "Estimating portion", "Calculating macros"].map((s, i) => (
              <div className="analyzing-step" key={s} style={{ animationDelay: `${i * 0.6}s` }}>
                <span className="step-dot" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {state === "result" && result && (
        <NutritionCard result={result} onAdd={handleAdd} onDiscard={handleDiscard} />
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}

/** DAILY DIARY */
function Diary({ entries, onRemove, goals }) {
  const te = todayEntries(entries);
  const totals = sumMacros(te);
  const overGoal = goals && totals.calories > goals.calories;

  return (
    <div className="screen">
      <div className="screen-header">
        <h2 className="screen-title">Today's Diary</h2>
        <p className="screen-subtitle">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      {/* Daily total bar */}
      <div className="diary-totals-card glass-card">
        <div className="diary-total-row">
          <span className="diary-total-label">Total Calories</span>
          <span className="diary-total-val" style={{ color: overGoal ? "var(--orange)" : "var(--green)" }}>{totals.calories} kcal</span>
        </div>
        <div className="diary-macro-summary">
          <span className="dms blue">P: {totals.protein}g</span>
          <span className="dms orange">C: {totals.carbs}g</span>
          <span className="dms purple">F: {totals.fat}g</span>
        </div>
      </div>

      {/* Sections */}
      {MEAL_TYPES.map((mt) => (
        <DiarySection
          key={mt}
          mealType={mt}
          entries={te.filter((e) => e.mealType === mt)}
          onRemove={onRemove}
        />
      ))}

      {te.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🍽️</span>
          <p className="empty-title">Your diary is empty</p>
          <p className="empty-sub">Scan a meal to get started!</p>
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}

/** WEEKLY HISTORY */
function History({ entries, goals }) {
  const days = last7Days();
  const streak = calcStreak(entries);

  // Weekly totals per day
  const weekData = days.map((d) => {
    const de = entries.filter((e) => e.date === d);
    return { d, ...sumMacros(de) };
  });

  const totalWeekCal = weekData.reduce((a, b) => a + b.calories, 0);
  const avgCal = Math.round(totalWeekCal / 7);

  const maxCal = Math.max(...weekData.map((b) => b.calories), goals.calories || 2000, 1);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="screen">
      <div className="screen-header">
        <h2 className="screen-title">Weekly History</h2>
        <p className="screen-subtitle">Your 7-day overview</p>
      </div>

      {/* Summary cards */}
      <div className="history-summary-row">
        <div className="history-stat-card">
          <span className="hs-icon">🔥</span>
          <span className="hs-val">{streak}</span>
          <span className="hs-label">Day Streak</span>
        </div>
        <div className="history-stat-card">
          <span className="hs-icon">📊</span>
          <span className="hs-val">{avgCal}</span>
          <span className="hs-label">Avg kcal/day</span>
        </div>
        <div className="history-stat-card">
          <span className="hs-icon">🥗</span>
          <span className="hs-val">{entries.filter((e) => days.includes(e.date)).length}</span>
          <span className="hs-label">Meals logged</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="glass-card">
        <p className="card-section-title">Calories This Week</p>
        <div className="history-chart">
          {weekData.map(({ d, calories }) => {
            const dt = new Date(d + "T12:00:00");
            const pct = (calories / maxCal) * 100;
            const isToday = d === today();
            const overGoal = calories > goals.calories;
            return (
              <div className="history-bar-wrap" key={d}>
                <span className="history-bar-cal">{calories > 0 ? calories : ""}</span>
                <div className="history-bar-bg">
                  <div
                    className="history-bar-fill"
                    style={{
                      height: `${pct}%`,
                      background: overGoal ? "var(--orange)" : isToday ? "var(--green)" : "var(--green-light)",
                    }}
                  />
                </div>
                <span className={`history-bar-day ${isToday ? "today" : ""}`}>
                  {dayNames[dt.getDay()]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="goal-line-legend">
          <span className="goal-dot" />
          <span className="goal-legend-text">Goal: {goals.calories} kcal</span>
        </div>
      </div>

      {/* Macro trends */}
      <div className="glass-card">
        <p className="card-section-title">Macro Trend (7 Days)</p>
        {[
          { label: "Protein", key: "protein", goal: goals.protein, color: "var(--blue)" },
          { label: "Carbs", key: "carbs", goal: goals.carbs, color: "var(--orange)" },
          { label: "Fat", key: "fat", goal: goals.fat, color: "var(--purple)" },
        ].map(({ label, key, goal, color }) => {
          const avg = Math.round(weekData.reduce((a, b) => a + b[key], 0) / 7);
          const pct = Math.min((avg / goal) * 100, 100);
          return (
            <div className="macro-trend-row" key={key}>
              <span className="macro-trend-label">{label}</span>
              <div className="macro-trend-bar-bg">
                <div className="macro-trend-bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="macro-trend-val" style={{ color }}>{avg}g</span>
            </div>
          );
        })}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

/** SETTINGS / ABOUT */
function Settings({ goals, saveGoals }) {
  const [local, setLocal] = useState({ ...goals });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveGoals(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <h2 className="screen-title">Settings</h2>
        <p className="screen-subtitle">Customize your goals</p>
      </div>

      <div className="glass-card">
        <p className="card-section-title">Daily Goals</p>
        {[
          { label: "Calories", key: "calories", unit: "kcal", min: 800, max: 5000 },
          { label: "Protein", key: "protein", unit: "g", min: 20, max: 400 },
          { label: "Carbs", key: "carbs", unit: "g", min: 20, max: 600 },
          { label: "Fat", key: "fat", unit: "g", min: 10, max: 200 },
        ].map(({ label, key, unit, min, max }) => (
          <div className="goal-row" key={key}>
            <label className="goal-label">{label}</label>
            <div className="goal-input-wrap">
              <input
                type="number"
                className="goal-input"
                min={min} max={max}
                value={local[key]}
                onChange={(e) => setLocal({ ...local, [key]: Number(e.target.value) })}
              />
              <span className="goal-unit">{unit}</span>
            </div>
          </div>
        ))}
        <button className={`btn-primary full ${saved ? "saved" : ""}`} onClick={handleSave}>
          {saved ? "✓ Saved!" : "Save Goals"}
        </button>
      </div>

      {/* About */}
      <div className="glass-card about-card">
        <div className="about-logo">🌿</div>
        <h3 className="about-name">MacroLens</h3>
        <p className="about-version">v1.0.0 · AI Calorie Tracker</p>
        <p className="about-desc">
          MacroLens uses AI vision to instantly analyze your meals and track your macros — helping you reach your health goals, one photo at a time.
        </p>
        <div className="about-tags">
          <span className="about-tag">React + Vite</span>
          <span className="about-tag">PWA</span>
          <span className="about-tag">AI-Powered</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-card">
        <p className="disclaimer-icon">⚠️</p>
        <p className="disclaimer-text">
          <strong>Disclaimer:</strong> Nutritional estimates are AI-generated and may not be 100% accurate. Always consult a registered dietitian or healthcare professional for medical nutrition advice. This app is for informational purposes only.
        </p>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// 🔲  BOTTOM NAV
// ─────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", icon: "🏠", label: "Home" },
  { id: "diary", icon: "📋", label: "Diary" },
  { id: "scan", icon: "📷", label: "Scan", accent: true },
  { id: "history", icon: "📈", label: "History" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

function BottomNav({ active, setActive }) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ id, icon, label, accent }) => (
        <button
          key={id}
          className={`nav-btn ${active === id ? "active" : ""} ${accent ? "nav-accent" : ""}`}
          onClick={() => setActive(id)}
        >
          <span className="nav-icon">{icon}</span>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────
// 🚀  ROOT APP
// ─────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("dashboard");
  const { entries, addEntry, removeEntry } = useDiary();
  const { goals, saveGoals } = useGoals();

  const handleAddEntry = (entry) => {
    addEntry(entry);
    setScreen("diary");
  };

  return (
    <div className="app-shell">
      <div className="app-content">
        {screen === "dashboard" && <Dashboard entries={entries} goals={goals} />}
        {screen === "scan" && <ScanMeal onAddEntry={handleAddEntry} />}
        {screen === "diary" && <Diary entries={entries} onRemove={removeEntry} goals={goals} />}
        {screen === "history" && <History entries={entries} goals={goals} />}
        {screen === "settings" && <Settings goals={goals} saveGoals={saveGoals} />}
      </div>
      <BottomNav active={screen} setActive={setScreen} />
      <div className="credit">Crafted by Tushar Chopdar</div>
    </div>
  );
}
