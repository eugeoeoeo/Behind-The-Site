// BehindTheSite - API & Live Supabase PostgreSQL Connection Layer
import { supabase } from "./supabaseClient";

// 1. AUTHENTICATION MODULES
export const signupUser = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }
  return { success: true, user: data.user };
};

export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }
  return { success: true, user: data.user, session: data.session };
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
  return { success: true };
};

export const forgotPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  if (error) {
    throw new Error(error.message);
  }
  return { success: true };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// 2. USER PROGRESS DATABASE MODULES (Synched to profiles SQL table)
const ACHIEVEMENTS_LIST = [
  { id: "first_steps", title: "First Steps", desc: "Completed your first backend lesson", icon: "🚀" },
  { id: "internet_surfer", title: "Internet Navigator", desc: "Mastered DNS and HTTP lifecycle", icon: "🌐" },
  { id: "route_architect", title: "API Architect", desc: "Built routes and controllers", icon: "🛤️" },
  { id: "folder_master", title: "Folder Master", desc: "Successfully organized the modular sandbox", icon: "📁" },
  { id: "security_guardian", title: "Security Guardian", desc: "Defended endpoints against raw exposures", icon: "🛡️" },
  { id: "ai_pioneer", title: "AI Integrator", desc: "Wrote secure controller scripts calling AI services", icon: "🤖" },
  { id: "bts_graduate", title: "BehindTheSite Graduate", desc: "Completed the entire Graduation Capstone Exam", icon: "🎓" }
];

export const fetchUserProgress = async () => {
  const user = await getCurrentUser();
  if (!user) {
    // Return standard guest progress if not logged in
    return {
      isGuest: true,
      activeLessonId: "1.1",
      completedLessons: [],
      xp: 0,
      streak: 0,
      achievements: [],
      achievementsList: ACHIEVEMENTS_LIST
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Profile not found or fetch error. Auto-creating fallback row.", error);
    // Profile might not have finished seeding yet, return stubs
    return {
      activeLessonId: "1.1",
      completedLessons: [],
      xp: 0,
      streak: 0,
      achievements: [],
      achievementsList: ACHIEVEMENTS_LIST
    };
  }

  return {
    activeLessonId: data.active_lesson_id || "1.1",
    completedLessons: data.completed_lessons || [],
    xp: data.xp || 0,
    streak: data.streak || 0,
    achievements: data.achievements || [],
    achievementsList: ACHIEVEMENTS_LIST
  };
};

export const saveUserProgress = async (progress) => {
  const user = await getCurrentUser();
  if (!user) {
    // If guest user, keep in memory/do not throw to block experience
    return { success: true, isGuest: true };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      xp: progress.xp,
      streak: progress.streak,
      completed_lessons: progress.completedLessons,
      achievements: progress.achievements,
      active_lesson_id: progress.activeLessonId,
      last_activity_date: progress.lastActivityDate ? new Date(progress.lastActivityDate).toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }
  return { success: true };
};

export const resetUserProgress = async () => {
  const user = await getCurrentUser();
  if (!user) return { success: true, isGuest: true };

  const { error } = await supabase
    .from("profiles")
    .update({
      xp: 0,
      streak: 0,
      completed_lessons: [],
      achievements: [],
      active_lesson_id: "1.1",
      last_activity_date: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }
  
  return fetchUserProgress();
};

// 3. SECURE AI TUTOR FEEDBACK ENGINE
export const queryAITutor = async (userCode, lesson) => {
  // Simulates Gemini secure endpoint responses based on student solutions
  await new Promise((r) => setTimeout(r, 600));
  const codeLower = userCode.toLowerCase();

  if (lesson.id === "1.2") {
    if (codeLower.includes("____")) {
      return "Hello! I see you still have placeholder blanks `____`. Replace the first blank with `is_premium` and the second with the standard greeting text.";
    }
    if (!codeLower.includes("is_premium")) {
      return "Hi! You need to evaluate the parameter `is_premium`. Try checking `if is_premium:` in Python to trigger the conditional statement.";
    }
  }

  if (lesson.id === "2.2") {
    if (codeLower.includes("____")) {
      return "You're close! Replace the first blank with `\"POST\"` (used to CREATE resources) and the second with `\"GET\"` (used to READ resources). Keep coding!";
    }
  }

  if (lesson.id === "3.3") {
    if (codeLower.includes("____")) {
      return "Remember that registries map string path endpoints directly to function callbacks. Complete the blank: `\"/users\": fetch_users_list`.";
    }
  }

  return "Your logic looks solid! Double check that you've replaced all blanks and met all validations, then click 'Submit Answer' to see if all tests pass.";
};
