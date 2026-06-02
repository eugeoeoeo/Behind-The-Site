// BehindTheSite - Storage Service Abstraction
// Handles client-side state management, streaks, achievements, and XP progress, fully decoupled from components.

const STORAGE_KEY = "bts_student_progress";

const DEFAULT_PROGRESS = {
  activeChapterId: 1,
  activeLessonId: "1.1",
  completedLessons: [], // Array of lesson IDs e.g. ["1.1"]
  xp: 0,
  streak: 0,
  lastActivityDate: null,
  achievements: [] // Array of IDs e.g. ["first_steps", "folder_master"]
};

const ACHIEVEMENTS_LIST = [
  { id: "first_steps", title: "First Steps", desc: "Completed your first backend lesson", icon: "🚀" },
  { id: "internet_surfer", title: "Internet Navigator", desc: "Mastered DNS and HTTP lifecycle", icon: "🌐" },
  { id: "route_architect", title: "API Architect", desc: "Built routes and controllers", icon: "🛤️" },
  { id: "folder_master", title: "Folder Master", desc: "Successfully organized the modular sandbox", icon: "📁" },
  { id: "security_guardian", title: "Security Guardian", desc: "Defended endpoints against raw exposures", icon: "🛡️" },
  { id: "ai_pioneer", title: "AI Integrator", desc: "Wrote secure controller scripts calling AI services", icon: "🤖" },
  { id: "bts_graduate", title: "BehindTheSite Graduate", desc: "Completed the entire Graduation Capstone Exam", icon: "🎓" }
];

export const getProgress = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    saveProgress(DEFAULT_PROGRESS);
    return { ...DEFAULT_PROGRESS, achievementsList: ACHIEVEMENTS_LIST };
  }
  try {
    const parsed = JSON.parse(data);
    return { ...DEFAULT_PROGRESS, ...parsed, achievementsList: ACHIEVEMENTS_LIST };
  } catch (e) {
    return { ...DEFAULT_PROGRESS, achievementsList: ACHIEVEMENTS_LIST };
  }
};

export const saveProgress = (progress) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const addXP = (amount) => {
  const p = getProgress();
  p.xp += amount;
  saveProgress(p);
  return p;
};

export const deductXP = (amount) => {
  const p = getProgress();
  p.xp = Math.max(0, p.xp - amount);
  saveProgress(p);
  return p;
};

export const completeLesson = (lessonId, awardedXp) => {
  const p = getProgress();
  
  if (!p.completedLessons.includes(lessonId)) {
    p.completedLessons.push(lessonId);
    p.xp += awardedXp;
  }
  
  // Track achievements
  if (lessonId === "1.1" && !p.achievements.includes("first_steps")) {
    p.achievements.push("first_steps");
  }
  if (lessonId === "2.2" && !p.achievements.includes("internet_surfer")) {
    p.achievements.push("internet_surfer");
  }
  if (lessonId === "5.1" && !p.achievements.includes("route_architect")) {
    p.achievements.push("route_architect");
  }
  if (lessonId === "8.1" && !p.achievements.includes("folder_master")) {
    p.achievements.push("folder_master");
  }
  if (lessonId === "12.1" && !p.achievements.includes("ai_pioneer")) {
    p.achievements.push("ai_pioneer");
  }
  if (lessonId === "15.1" && !p.achievements.includes("bts_graduate")) {
    p.achievements.push("bts_graduate");
  }

  // Calculate Streak
  const today = new Date().toDateString();
  if (p.lastActivityDate !== today) {
    if (p.lastActivityDate) {
      const lastDate = new Date(p.lastActivityDate);
      const diffTime = Math.abs(new Date(today) - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        p.streak += 1;
      } else if (diffDays > 1) {
        p.streak = 1;
      }
    } else {
      p.streak = 1;
    }
    p.lastActivityDate = today;
  }

  saveProgress(p);
  return p;
};

export const resetProgress = () => {
  saveProgress(DEFAULT_PROGRESS);
  return { ...DEFAULT_PROGRESS, achievementsList: ACHIEVEMENTS_LIST };
};
