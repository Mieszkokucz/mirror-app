import { useState, useRef, useEffect } from "react";

// ─── DATA ───────────────────────────────────────────────────────────────
const CONVERSATIONS = [
  { id: 1, title: "Morning check-in", date: "2026-03-06", time: "07:32", preview: "Feeling calm today, though there's a lot on my plate. The project is picking up speed.", type: "morning", mood: "calm" },
  { id: 2, title: "Evening reflection", date: "2026-03-05", time: "21:15", preview: "It was an intense day. The meeting with Mark gave me a lot to think about regarding the team's direction.", type: "evening", mood: "thoughtful" },
  { id: 3, title: "Afternoon review", date: "2026-03-05", time: "14:20", preview: "Caught a moment to breathe after lunch. The project is moving forward and I'm happy with the progress.", type: "midday", mood: "energized" },
  { id: 4, title: "Morning check-in", date: "2026-03-05", time: "08:10", preview: "Finally got a proper night's sleep. I have a plan for today and I'm feeling motivated to get things done.", type: "morning", mood: "motivated" },
  { id: 5, title: "Evening reflection", date: "2026-03-04", time: "22:00", preview: "Tough day. But I tackled things I'd been putting off for a week. There's relief in that.", type: "evening", mood: "relieved" },
  { id: 6, title: "Morning check-in", date: "2026-03-04", time: "07:45", preview: "Slight anxiety before the meeting, but I know what I want to say. I've prepared well.", type: "morning", mood: "anxious" },
  { id: 7, title: "Evening reflection", date: "2026-03-03", time: "21:30", preview: "Quiet day. Read, thought, took notes. Sometimes a day like this is exactly what's needed.", type: "evening", mood: "calm" },
  { id: 8, title: "Morning check-in", date: "2026-03-03", time: "08:00", preview: "Monday. New week, new possibilities. Feeling ready.", type: "morning", mood: "motivated" },
  { id: 9, title: "Evening reflection", date: "2026-03-01", time: "20:45", preview: "The weekend gave me space. I needed it more than I realized.", type: "evening", mood: "relieved" },
  { id: 10, title: "Morning check-in", date: "2026-02-28", time: "07:50", preview: "Last day of February. Time to take stock of the month.", type: "morning", mood: "thoughtful" },
];

const REFLECTIONS_MAP = {
  "2026-03-06": {
    day: "Friday",
    sessions: [
      { type: "morning", text: "The day started quietly. I feel like I'm settling into a new rhythm — less reactive, more aware. I've been thinking a lot about how I want to lead this project. It's no longer just about the deadline, but about doing it right. I notice that when I give myself a moment to breathe in the morning, the whole day feels different." }
    ]
  },
  "2026-03-05": {
    day: "Thursday",
    sessions: [
      { type: "morning", text: "Morning thoughts kept circling around motivation. I slept properly for the first time in a week and felt the difference — clearer head, more energy. Maybe this is the missing piece." },
      { type: "midday", text: "Had a moment of clarity over coffee in the afternoon. The project is taking shape and I can see the final picture now. The conversation with Anna helped organize my thoughts." },
      { type: "evening", text: "Intense day, but productive. The meeting with Mark opened a new perspective on collaboration. I need to remember that not everything has to be perfect right away. Progress matters more than perfection." }
    ]
  },
  "2026-03-04": {
    day: "Wednesday",
    sessions: [
      { type: "morning", text: "Slight stress before the client meeting. But I prepared well and I know what I want to convey. It's interesting that anxiety returns despite experience — maybe that's just normal." },
      { type: "evening", text: "Hard day, but I did the things I'd been putting off for a week. There's something satisfying about pushing through resistance and seeing that relief waits on the other side. Tomorrow will be lighter." }
    ]
  },
  "2026-03-03": {
    day: "Monday",
    sessions: [
      { type: "morning", text: "New week. Feeling ready with a clear plan. The weekend break gave me a perspective that was missing on Friday." },
      { type: "evening", text: "Quiet day. Read, thought, took notes. Sometimes a day like this is needed to recharge before an intense week ahead." }
    ]
  },
  "2026-03-01": {
    day: "Saturday",
    sessions: [
      { type: "evening", text: "The weekend gave me space. I needed it more than I thought. Went for walks, cooked, didn't think about work. I feel more present." }
    ]
  },
  "2026-02-28": {
    day: "Saturday",
    sessions: [
      { type: "morning", text: "Last day of February. Time to take stock of the month. A lot happened — new project, new challenges. But I feel like I'm growing." }
    ]
  },
};

const MOOD_COLORS = { calm: "#7BA7BC", thoughtful: "#9B8EC4", energized: "#E8A849", motivated: "#6BBF7A", relieved: "#8EBFA0", anxious: "#D4956A" };
const TYPE_ICONS = { morning: "☀", midday: "◐", evening: "☽" };
const TYPE_LABELS = { morning: "Morning", midday: "Afternoon", evening: "Evening" };

const SAMPLE_MESSAGES = [
  { role: "assistant", text: "Hey! How are you feeling today? Tell me what's on your mind." },
  { role: "user", text: "The day started quietly. I feel like I'm settling into a new rhythm — less reactive, more aware." },
  { role: "assistant", text: "I like that observation about being less reactive. What specifically changed in your approach that made you notice this shift? And where does this greater awareness come from — practice, circumstances, or something else entirely?" },
  { role: "user", text: "I think it's because I give myself a moment to breathe in the morning before diving into the day. I used to check emails right away, now I have my coffee first and just think." },
  { role: "assistant", text: "That's a small ritual, but it sounds like it makes a big difference. A coffee buffer between sleep and work. Do you notice that this morning pause also affects how you handle difficulties later in the day?" },
];

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date("2026-03-06T00:00:00");
  const diff = Math.floor((today - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

// ─── CALENDAR ───────────────────────────────────────────────────────────
function Calendar({ currentMonth, setCurrentMonth, selectedDate, setSelectedDate, reflectionDates }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const today = new Date("2026-03-06T00:00:00");

  const weeks = [];
  let week = new Array(startDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const toKey = (day) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const hasReflection = (day) => day && reflectionDates.has(toKey(day));
  const isToday = (day) => day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  const isSelected = (day) => day && selectedDate && toKey(day) === selectedDate;

  const handleClick = (day) => {
    if (!day) return;
    const ds = toKey(day);
    if (hasReflection(day)) setSelectedDate(selectedDate === ds ? null : ds);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1))} style={calNavBtn}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#C8BDA8", fontFamily: "var(--font-display)" }}>{monthLabel}</span>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1))} style={calNavBtn}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
          <div key={d} style={{ fontSize: 10, color: "#444", fontWeight: 600, padding: "4px 0", letterSpacing: "0.05em" }}>{d}</div>
        ))}
        {weeks.flat().map((day, i) => {
          const active = hasReflection(day);
          const sel = isSelected(day);
          const td = isToday(day);
          return (
            <div
              key={i}
              onClick={() => handleClick(day)}
              style={{
                width: "100%", aspectRatio: "1",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontSize: 12,
                fontWeight: td ? 700 : 400,
                color: !day ? "transparent" : sel ? "#0D0D10" : td ? "#E8DCC8" : active ? "#C8BDA8" : "#333",
                background: sel ? "#E8DCC8" : "transparent",
                borderRadius: 8,
                cursor: active ? "pointer" : "default",
                position: "relative",
                transition: "all 0.15s ease",
              }}
            >
              {day || ""}
              {active && !sel && (
                <div style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: "#E8DCC8", position: "absolute", bottom: 3, opacity: 0.6,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const calNavBtn = {
  background: "none", border: "1px solid #1E1E22", borderRadius: 6,
  color: "#888", fontSize: 16, width: 28, height: 28, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

// ─── SIDEBAR ────────────────────────────────────────────────────────────
function Sidebar({ isOpen, toggle, conversations, selectedConv, setSelectedConv, setView }) {
  const grouped = {};
  conversations.forEach(c => {
    const label = formatDate(c.date);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(c);
  });

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, bottom: 0,
      width: isOpen ? 300 : 0,
      background: "#0A0A0D",
      borderRight: isOpen ? "1px solid #1A1A1F" : "none",
      overflow: "hidden",
      transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      zIndex: 50,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "20px 16px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #141418", flexShrink: 0,
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#E8DCC8", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>
          Conversations
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => { setSelectedConv(null); setView("chat"); }}
            style={sidebarIconBtn} title="New conversation"
          >+</button>
          <button onClick={toggle} style={sidebarIconBtn}>✕</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {Object.entries(grouped).map(([label, convs]) => (
          <div key={label}>
            <div style={{
              padding: "14px 16px 6px", fontSize: 10, fontWeight: 700,
              color: "#3A3A40", textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap",
            }}>{label}</div>
            {convs.map(c => (
              <div
                key={c.id}
                onClick={() => { setSelectedConv(c.id); setView("chat"); }}
                style={{
                  padding: "10px 16px", cursor: "pointer",
                  background: selectedConv === c.id ? "#14141A" : "transparent",
                  borderLeft: selectedConv === c.id ? "2px solid #E8DCC8" : "2px solid transparent",
                  transition: "all 0.1s ease", whiteSpace: "nowrap", overflow: "hidden",
                }}
                onMouseEnter={e => { if (selectedConv !== c.id) e.currentTarget.style.background = "#0E0E12"; }}
                onMouseLeave={e => { if (selectedConv !== c.id) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, opacity: 0.4 }}>{TYPE_ICONS[c.type]}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#C8BDA8" }}>{c.title}</span>
                  <span style={{ fontSize: 10, color: "#444", marginLeft: "auto" }}>{c.time}</span>
                </div>
                <p style={{
                  fontSize: 11, color: "#555", margin: 0, lineHeight: 1.4,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{c.preview}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const sidebarIconBtn = {
  background: "none", border: "1px solid #2A2A30", borderRadius: 6,
  color: "#888", fontSize: 14, width: 30, height: 30, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

// ─── CHAT VIEW ──────────────────────────────────────────────────────────
function ChatView({ selectedConv }) {
  const conv = CONVERSATIONS.find(c => c.id === selectedConv);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selectedConv]);

  if (!conv) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, opacity: 0.4 }}>
        <div style={{ fontSize: 48 }}>✦</div>
        <p style={{ fontSize: 16, fontFamily: "var(--font-display)", color: "#666" }}>Start a new reflection</p>
        <p style={{ fontSize: 13, color: "#444", maxWidth: 300, textAlign: "center", lineHeight: 1.6 }}>
          Share what's on your mind, how you're feeling, or what you'd like to think through.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "16px 32px", borderBottom: "1px solid #161619",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, opacity: 0.4 }}>{TYPE_ICONS[conv.type]}</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#C8BDA8", fontFamily: "var(--font-display)" }}>{conv.title}</span>
        <span style={{ fontSize: 12, color: "#444" }}>· {formatDateFull(conv.date)}</span>
        <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: MOOD_COLORS[conv.mood] || "#555" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 32px" }}>
          {SAMPLE_MESSAGES.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div key={i} style={{
                marginBottom: 16,
                display: "flex",
                flexDirection: isUser ? "row-reverse" : "row",
                alignItems: "flex-end",
                gap: 10,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: isUser
                    ? "linear-gradient(135deg, #2A261E, #3A3428)"
                    : "linear-gradient(135deg, #1E1E24, #2A2A32)",
                  border: `1px solid ${isUser ? "#3A3428" : "#2A2A32"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: isUser ? "#C8BDA8" : "#888",
                }}>
                  {isUser ? "Y" : "✦"}
                </div>
                {/* Bubble */}
                <div style={{
                  maxWidth: "72%",
                  padding: "12px 16px",
                  borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isUser
                    ? "linear-gradient(135deg, #2A261E, #302C22)"
                    : "#151518",
                  border: `1px solid ${isUser ? "#3A3428" : "#1E1E24"}`,
                }}>
                  <p style={{
                    fontSize: 14, color: isUser ? "#D4C8A8" : "#AAA",
                    lineHeight: 1.7, margin: 0, fontFamily: "var(--font-body)",
                  }}>{msg.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div style={{ padding: "16px 32px 24px", flexShrink: 0 }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{
            background: "#111114", border: "1px solid #1E1E24",
            borderRadius: 14, padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <input
              placeholder="Write something..."
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: "#C8BDA8", fontSize: 14, fontFamily: "var(--font-body)",
              }}
            />
            <button style={{
              background: "#E8DCC8", color: "#0D0D10", border: "none",
              borderRadius: 8, width: 34, height: 34, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, flexShrink: 0,
            }}>↑</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REFLECTIONS VIEW ───────────────────────────────────────────────────
function ReflectionsView() {
  const reflectionDates = new Set(Object.keys(REFLECTIONS_MAP));
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2));
  const [selectedDate, setSelectedDate] = useState(null);

  const sortedDates = Object.keys(REFLECTIONS_MAP).sort((a, b) => b.localeCompare(a));
  const displayDates = selectedDate && REFLECTIONS_MAP[selectedDate] ? [selectedDate] : sortedDates;

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex" }}>
      {/* Calendar panel */}
      <div style={{
        width: 300, flexShrink: 0, borderRight: "1px solid #141418",
        padding: "28px 24px", overflowY: "auto",
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#C8BDA8", fontFamily: "var(--font-display)", marginTop: 0, marginBottom: 20 }}>
          Reflection Calendar
        </h2>
        <Calendar
          currentMonth={currentMonth} setCurrentMonth={setCurrentMonth}
          selectedDate={selectedDate} setSelectedDate={setSelectedDate}
          reflectionDates={reflectionDates}
        />
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #1A1A1F" }}>
          <div style={{ fontSize: 11, color: "#444", marginBottom: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Statistics</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "This month", value: "5" },
              { label: "Streak", value: "5 days" },
              { label: "Total", value: "23" },
              { label: "Avg / week", value: "4.2" },
            ].map(s => (
              <div key={s.label} style={{
                background: "#0E0E12", borderRadius: 8, padding: "10px 12px",
                border: "1px solid #161619",
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#E8DCC8" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        {selectedDate && (
          <button
            onClick={() => setSelectedDate(null)}
            style={{
              marginTop: 16, width: "100%", padding: "10px",
              background: "none", border: "1px solid #1E1E24", borderRadius: 8,
              color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)",
            }}
          >Show all reflections</button>
        )}
      </div>

      {/* Reflections list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 40px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#C8BDA8", fontFamily: "var(--font-display)", marginTop: 0, marginBottom: 24 }}>
          {selectedDate ? formatDateFull(selectedDate) : "All Reflections"}
        </h2>
        {displayDates.map(dateKey => {
          const ref = REFLECTIONS_MAP[dateKey];
          if (!ref) return null;
          return (
            <div key={dateKey} style={{
              marginBottom: 24, background: "#0E0E12",
              border: "1px solid #161619", borderRadius: 12, overflow: "hidden",
            }}>
              <div style={{
                padding: "16px 24px", borderBottom: "1px solid #161619",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#C8BDA8", fontFamily: "var(--font-display)" }}>
                  {formatDateFull(dateKey)}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  {ref.sessions.map(s => (
                    <span key={s.type} style={{
                      fontSize: 10, padding: "3px 8px", borderRadius: 10,
                      background: "#1A1A20", color: "#666", fontWeight: 500,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      {TYPE_ICONS[s.type]} {TYPE_LABELS[s.type]}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ padding: "20px 24px" }}>
                {ref.sessions.map((session, i) => (
                  <div key={session.type} style={{ marginTop: i > 0 ? 20 : 0 }}>
                    {ref.sessions.length > 1 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, opacity: 0.4 }}>{TYPE_ICONS[session.type]}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: "#444",
                          textTransform: "uppercase", letterSpacing: "0.1em",
                        }}>{TYPE_LABELS[session.type]}</span>
                        <div style={{ flex: 1, height: 1, background: "#1A1A20", marginLeft: 8 }} />
                      </div>
                    )}
                    <p style={{
                      fontSize: 14, color: "#999", lineHeight: 1.8, margin: 0,
                      fontFamily: "var(--font-display)",
                    }}>{session.text}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────
export default function JournalApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedConv, setSelectedConv] = useState(1);
  const [view, setView] = useState("chat");

  return (
    <div style={{
      width: "100%", height: "100vh", display: "flex", flexDirection: "column",
      background: "#0D0D10", color: "#E0D8CA",
      fontFamily: "var(--font-body)", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Libre+Franklin:wght@300;400;500;600;700&display=swap');
        :root {
          --font-display: 'Instrument Serif', Georgia, serif;
          --font-body: 'Libre Franklin', -apple-system, sans-serif;
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #333; }
        input::placeholder { color: #444; }
      `}</style>

      <Sidebar
        isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={CONVERSATIONS} selectedConv={selectedConv}
        setSelectedConv={setSelectedConv} setView={setView}
      />

      <div style={{
        marginLeft: sidebarOpen ? 300 : 0,
        transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        flex: 1, display: "flex", flexDirection: "column", height: "100vh",
      }}>
        {/* Top bar */}
        <div style={{
          height: 52, flexShrink: 0, borderBottom: "1px solid #141418",
          display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
        }}>
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none", border: "none", color: "#666",
                cursor: "pointer", fontSize: 20, padding: "4px 8px",
                display: "flex", alignItems: "center",
              }}
              title="Open conversations"
            >☰</button>
          )}

          <div style={{
            display: "flex", alignItems: "center",
            background: "#111114", borderRadius: 8, border: "1px solid #1A1A20", overflow: "hidden",
          }}>
            {[
              { key: "chat", label: "Chat", icon: "◯" },
              { key: "reflections", label: "Reflections", icon: "◈" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                style={{
                  background: view === tab.key ? "#1E1E24" : "transparent",
                  border: "none", padding: "7px 16px", fontSize: 12,
                  fontWeight: view === tab.key ? 600 : 400,
                  color: view === tab.key ? "#E8DCC8" : "#555",
                  cursor: "pointer", fontFamily: "var(--font-body)",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 10, opacity: 0.5 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22, fontFamily: "var(--font-display)", color: "#E8DCC8", fontWeight: 400, letterSpacing: "-0.02em" }}>
              ✦ Journal
            </span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {view === "chat" && <ChatView selectedConv={selectedConv} />}
          {view === "reflections" && <ReflectionsView />}
        </div>
      </div>
    </div>
  );
}
