"use strict";

const SCIENCE = {
  CALORIES_PER_KEYPRESS: 0.0024,
  KEY_TRAVEL_MM: 3.5,
  CHAR_WIDTH_MM: 2.1,
  RESPECTS_PER_F: 1,
  WPM_ASSUMED: 90,
  PYRAMID_BLOCKS: 2_300_000,
};

function readRecord() {
  if (typeof officialRecordAttempt !== "string") {
    console.error("⛔ record_data.js was not loaded or has been corrupted.");
    return "";
  }
  return officialRecordAttempt;
}

function antiVijaiValidation(record) {
  const report = {
    passed: true,
    verdict: "VALIDATED BY A HUMAN 🧑‍💻",
    flags: [],
  };

  const impurities = record.replace(/f/g, "");
  if (impurities.length > 0) {
    report.flags.push(
      `🚫 ${impurities.length} non-"f" character(s) detected. ` +
      `A clean record contains ONLY "f".`
    );
    report.passed = false;
  }

  if (record.length >= 1000 && record.length % 1000 === 0) {
    report.flags.push(
      "🪨 Suspiciously round length. A physical rock might be sitting on " +
      "the F key. Please take it off your laptop."
    );
  }

  if (record.length > 50_000) {
    report.flags.push(
      "🤖 Over 50,000 'f's. Either you're a legend, or you're Vijai. " +
      "The committee is keeping an eye on you. 👀"
    );
  }

  if (!report.passed) {
    report.verdict = "REJECTED — impure record ⛔";
  } else if (report.flags.length > 0) {
    report.verdict = "VALIDATED (with remarks) ⚠️";
  }

  return report;
}

function computeStats(record) {
  const count = (record.match(/f/g) || []).length;

  const caloriesBurned = count * SCIENCE.CALORIES_PER_KEYPRESS;
  const fingerTravelMeters = (count * SCIENCE.KEY_TRAVEL_MM) / 1000;
  const textLengthMeters = (count * SCIENCE.CHAR_WIDTH_MM) / 1000;
  const respectsPaid = count * SCIENCE.RESPECTS_PER_F;
  const minutesTyping = count / SCIENCE.WPM_ASSUMED;
  const pyramidPercent = (count / SCIENCE.PYRAMID_BLOCKS) * 100;

  return {
    count,
    caloriesBurned,
    fingerTravelMeters,
    textLengthMeters,
    respectsPaid,
    minutesTyping,
    pyramidPercent,
  };
}

function getRank(count) {
  const ranks = [
    { min: 0,      title: "Unregistered Beginner",        emoji: "🥚" },
    { min: 1,      title: "F-Key Apprentice",             emoji: "🐣" },
    { min: 100,    title: "Dedicated Presser",            emoji: "✊" },
    { min: 1_000,  title: "Master of Respect",            emoji: "🎖️" },
    { min: 10_000, title: "Grand Mason of the Letter F",  emoji: "🏛️" },
    { min: 50_000, title: "Living Legend",                emoji: "🐉" },
    { min: 100_000,title: "WORLD RECORD HOLDER",          emoji: "👑" },
  ];
  let current = ranks[0];
  for (const r of ranks) if (count >= r.min) current = r;
  const next = ranks.find((r) => r.min > count) || null;
  return { current, next };
}

const fmt = {
  int: (n) => Math.round(n).toLocaleString("en-US"),
  dec: (n, d = 2) => n.toLocaleString("en-US", { maximumFractionDigits: d }),
};

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function render() {
  const record = readRecord();
  const stats = computeStats(record);
  const audit = antiVijaiValidation(record);
  const { current, next } = getRank(stats.count);

  setText("f-count", fmt.int(stats.count));

  setText("rank-emoji", current.emoji);
  setText("rank-title", current.title);
  if (next) {
    const remaining = next.min - stats.count;
    setText("rank-next", `${fmt.int(remaining)} more "f" until the next title.`);
    const span = next.min - current.min;
    const done = stats.count - current.min;
    const pct = span > 0 ? Math.min(100, (done / span) * 100) : 100;
    const bar = document.getElementById("rank-bar");
    if (bar) bar.style.width = pct.toFixed(1) + "%";
  } else {
    setText("rank-next", "You've reached the top. You are history. 👑");
    const bar = document.getElementById("rank-bar");
    if (bar) bar.style.width = "100%";
  }

  setText("stat-respects", fmt.int(stats.respectsPaid));
  setText("stat-calories", fmt.dec(stats.caloriesBurned, 2) + " kcal");
  setText("stat-travel", fmt.dec(stats.fingerTravelMeters, 3) + " m");
  setText("stat-textlen", fmt.dec(stats.textLengthMeters, 3) + " m");
  setText("stat-time", fmt.dec(stats.minutesTyping, 1) + " min");
  setText("stat-pyramid", fmt.dec(stats.pyramidPercent, 6) + " %");

  setText("audit-verdict", audit.verdict);
  const auditEl = document.getElementById("audit-box");
  if (auditEl) {
    auditEl.classList.toggle("audit-fail", !audit.passed);
    auditEl.classList.toggle("audit-pass", audit.passed);
  }
  const flagsEl = document.getElementById("audit-flags");
  if (flagsEl) {
    flagsEl.innerHTML = "";
    if (audit.flags.length === 0) {
      const li = document.createElement("li");
      li.textContent = "✅ No suspicious signals. Clean record.";
      flagsEl.appendChild(li);
    } else {
      for (const flag of audit.flags) {
        const li = document.createElement("li");
        li.textContent = flag;
        flagsEl.appendChild(li);
      }
    }
  }

  setText("last-sync", new Date().toLocaleString("en-US"));
}

const cadence = {
  timestamps: [],
  MIN_SAMPLES: 8,
  CV_ROBOT: 6,
  CV_HUMAN: 15,
};

function cadenceStdDev(intervals, mean) {
  const variance =
    intervals.reduce((s, x) => s + (x - mean) ** 2, 0) / intervals.length;
  return Math.sqrt(variance);
}

function analyzeCadence() {
  const ts = cadence.timestamps;
  const setCad = (id, v) => setText(id, v);

  setCad("cad-count", ts.length);

  if (ts.length < 2) {
    setCad("cad-interval", "— ms");
    setCad("cad-variation", "— %");
    setText("cad-verdict", "Waiting for first keystrokes…");
    return;
  }

  const intervals = [];
  for (let i = 1; i < ts.length; i++) intervals.push(ts[i] - ts[i - 1]);

  const mean = intervals.reduce((s, x) => s + x, 0) / intervals.length;
  const sd = cadenceStdDev(intervals, mean);
  const cv = mean > 0 ? (sd / mean) * 100 : 0;

  setCad("cad-interval", fmt.int(mean) + " ms");
  setCad("cad-variation", fmt.dec(cv, 1) + " %");

  const box = document.getElementById("cadence-box");
  const verdictEl = document.getElementById("cad-verdict");
  if (!verdictEl) return;

  if (ts.length < cadence.MIN_SAMPLES) {
    verdictEl.textContent =
      `🔎 Gathering evidence… (${ts.length}/${cadence.MIN_SAMPLES} keystrokes)`;
    box && box.classList.remove("cadence-fail", "cadence-pass");
    return;
  }

  if (cv < cadence.CV_ROBOT) {
    verdictEl.textContent =
      `🪨 ROCK / AUTO-REPEAT DETECTED! Interval too constant ` +
      `(${fmt.dec(cv, 1)}%). Take the rock off the F key. 🚨`;
    box && box.classList.add("cadence-fail");
    box && box.classList.remove("cadence-pass");
  } else if (cv < cadence.CV_HUMAN) {
    verdictEl.textContent =
      `⚠️ Suspiciously regular rhythm (${fmt.dec(cv, 1)}%). ` +
      `Are you human… or just a very bored human?`;
    box && box.classList.remove("cadence-fail", "cadence-pass");
  } else {
    verdictEl.textContent =
      `✅ Human cadence confirmed (variation ${fmt.dec(cv, 1)}%). ` +
      `Real fingers at work. 🧑‍💻`;
    box && box.classList.add("cadence-pass");
    box && box.classList.remove("cadence-fail");
  }
}

function initCadenceMonitor() {
  const input = document.getElementById("cadence-input");
  const reset = document.getElementById("cad-reset");
  if (!input) return;

  input.addEventListener("keydown", (e) => {
    if (e.key === "f" || e.key === "F") {
      cadence.timestamps.push(performance.now());
      analyzeCadence();
    }
  });

  reset && reset.addEventListener("click", () => {
    cadence.timestamps = [];
    if (input) input.value = "";
    const box = document.getElementById("cadence-box");
    box && box.classList.remove("cadence-fail", "cadence-pass");
    analyzeCadence();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  initCadenceMonitor();
});
