export type UserRole = "intern" | "admin";

export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type ReportStatus = "draft" | "submitted" | "reviewed";
export type ReportMood = "great" | "good" | "neutral" | "challenging" | "difficult";

export type OnlineStatus = "online" | "away" | "offline";
export type AuthProvider = "email" | "google" | "facebook" | "tiktok" | "oauth";

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  department: string | null;
  phone: string | null;
  bio: string | null;
  start_date: string | null;
  end_date: string | null;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  online_status: OnlineStatus;
  last_seen_at: string | null;
  last_active_at: string | null;
  is_typing_to: string | null;
  auth_provider: AuthProvider | null;
  last_seen_version?: string;
  documents_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assigned_to: string;
  assigned_by: string;
  points: number;
  approval_status?: "pending" | "approved" | "rejected";
  tags: string[];
  attachments: string[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  assignee?: Profile;
  assigner?: Profile;
}

export interface DailyReport {
  id: string;
  user_id: string;
  report_date: string;
  tasks_completed: string[];
  tasks_in_progress: string[];
  blockers: string | null;
  learnings: string | null;
  mood: ReportMood;
  hours_worked: number;
  status: ReportStatus;
  admin_feedback: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  user?: Profile;
  reviewer?: Profile;
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
}

export interface Message {
  id: string | number;
  channel_id: string | null;
  sender_id: string;
  recipient_id: string | null;
  content: string;
  attachments?: string[];
  is_read: boolean;
  read_at: string | null;
  status?: "sending" | "sent" | "delivered" | "read";
  delivered_at?: string | null;
  created_at: string;
  updated_at?: string;
  message_type?: string;
  call_type?: string;
  call_status?: string;
  call_duration?: string;
  // Joined fields
  sender?: Partial<Profile> & { id: string; email: string };
  receiver?: Profile;
  channel?: Channel;
}

export interface PerformanceScore {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  task_completion_rate: number;
  report_submission_rate: number;
  quality_score: number;
  communication_score: number;
  overall_score: number;
  notes: string | null;
  scored_by: string;
  created_at: string;
  // Joined fields
  user?: Profile;
  scorer?: Profile;
}

export type RewardType = 'coupon' | 'ai_credits' | 'free_course' | 'subscription_days' | 'badge';

export interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  icon?: string;
  reward_type?: "coupon" | "ai_credits" | "free_course" | "subscription_days" | "badge";
  reward_value?: Record<string, any>;
  is_active: boolean;
  max_redemptions?: number;
  current_redemptions?: number;
  expires_at?: string;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RewardClaim {
  id: string;
  user_id: string;
  reward_item_id: string;
  claimed_at: string;
  status: "pending" | "delivered" | "rejected";
  updated_at: string;
  reward_item?: Reward;
  user?: any;
}

export interface Achievement {
  id: string;
  user_id: string;
  reward_id?: string; // Legacy
  reward_item_id?: string; // New
  earned_at: string;
  // Joined fields
  user?: Profile;
  reward?: Reward;
}

// =============================================
// REFERRAL SYSTEM TYPES
// =============================================

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: 'pending' | 'confirmed' | 'rejected';
  ip_address: string | null;
  created_at: string;
  confirmed_at: string | null;
  // Joined
  referrer?: Profile;
  referred?: Profile;
}

export interface ReferralPoint {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  reference_id: string | null;
  created_at: string;
}

export interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  coupon_code: string | null;
  status: 'completed' | 'revoked';
  created_at: string;
  // Joined
  reward?: Reward;
}

export interface ReferralStats {
  totalReferrals: number;
  confirmedReferrals: number;
  totalPoints: number;
  leaderboardRank: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "task" | "report" | "message" | "achievement" | "system";
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PlatformSettings {
  id: string;
  maintenance_mode: boolean;
  portal_selection: boolean;
  new_registrations: boolean;
  ai_content_generation: boolean;
  marketing_banner_active: boolean;
  marketing_banner_text: string | null;
  system_announcement: string | null;
  referral_system_enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  event_type: "meeting" | "deadline" | "review" | "training" | "assessment" | "other";
  location: string | null;
  attendees: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Joined fields
  user?: Profile;
}

export interface AIChat {
  id: string;
  user_id: string;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalPoints: number;
  currentStreak: number;
  reportsSubmitted: number;
  unreadMessages: number;
}

// Admin Stats
export interface AdminStats {
  totalInterns: number;
  activeInterns: number;
  totalTasks: number;
  pendingReports: number;
  averagePerformance: number;
  topPerformers: Profile[];
}

// =============================================
// LMS TYPES
// =============================================

export type QuizQuestionType = 'mcq' | 'multi_select' | 'boolean' | 'short_answer' | 'file_upload';
export type QuizAttemptStatus = 'in_progress' | 'submitted' | 'timed_out' | 'flagged';
export type QuizAttachmentLevel = 'course' | 'module' | 'lesson';

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  module_id: string | null;
  lesson_id: string | null;
  attachment_level: QuizAttachmentLevel;
  time_limit_seconds: number;
  passing_score: number;
  attempts_allowed: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  show_correct_answers: boolean;
  show_explanations: boolean;
  strict_mode: boolean;
  fullscreen_required: boolean;
  detect_tab_switch: boolean;
  auto_submit_on_cheat: boolean;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestionOption {
  id: string;
  text: string;
  image_url?: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  type: QuizQuestionType;
  question_text: string;
  question_image_url: string | null;
  options: QuizQuestionOption[];
  correct_answers: string[]; // Hidden from interns in app layer
  points: number;
  partial_credit: boolean;
  explanation: string | null;
  hint: string | null;
  order_index: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  time_spent_seconds: number;
  status: QuizAttemptStatus;
  total_points: number;
  earned_points: number;
  score_percentage: number;
  passed: boolean;
  tab_switches: number;
  idle_time_seconds: number;
  fullscreen_exits: number;
  flagged_reason: string | null;
  attempt_number: number;
  created_at: string;
  quiz?: Quiz;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_options: string[];
  text_answer: string | null;
  file_url: string | null;
  is_correct: boolean | null;
  points_earned: number;
  auto_graded: boolean;
  admin_feedback: string | null;
  answered_at: string;
  time_to_answer_seconds: number;
  question?: QuizQuestion;
}

export interface LessonTimeTracking {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  first_accessed_at: string;
  last_accessed_at: string;
  total_active_seconds: number;
  total_idle_seconds: number;
  current_session_start: string | null;
  is_paused: boolean;
  pause_reason: string | null;
  completed: boolean;
  completed_at: string | null;
  completion_percentage: number;
  video_watched_seconds: number;
  content_scroll_percentage: number;
}

export interface CourseCertificate {
  id: string;
  certificate_id: string;
  user_id: string;
  course_id: string;
  intern_name: string;
  course_title: string;
  completion_date: string;
  final_score: number | null;
  total_time_spent_seconds: number;
  certificate_url: string | null;
  template_used: string;
  verification_url: string | null;
  qr_code_url: string | null;
  is_valid: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
  issued_by: string | null;
  admin_signature: string | null;
  created_at: string;
}

export interface CourseSettings {
  id: string;
  course_id: string;
  required_time_percentage: number;
  allow_skip_lessons: boolean;
  auto_mark_complete: boolean;
  auto_move_next: boolean;
  quiz_required_for_completion: boolean;
  retry_failed_quizzes: boolean;
  show_quiz_feedback: boolean;
  lock_next_until_previous: boolean;
  lock_quiz_until_lesson: boolean;
  certificate_on_completion: boolean;
  min_score_for_certificate: number;
  enable_strict_mode: boolean;
  strict_mode_for_quizzes: boolean;
  strict_mode_for_lessons: boolean;
  enable_time_tracking: boolean;
  updated_at: string;
}

export interface CourseWithProgress {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  level: string;
  duration_minutes: number;
  is_published: boolean;
  course_modules: ModuleWithProgress[];
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  total_time_spent_seconds: number;
  certificate?: CourseCertificate;
  course_settings?: CourseSettings;
  is_completed?: boolean;
  // Legacy or Direct from courses table (some columns were added directly to courses)
  enable_time_tracking?: boolean;
  enable_strict_mode?: boolean;
  passing_score?: number;
  certificate_enabled?: boolean;
  auto_issue_certificate?: boolean;
}

export interface ModuleWithProgress {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  course_lessons: LessonWithProgress[];
  quiz_id: string | null;
  quiz?: Quiz;
  completed?: boolean;
  progress_percentage?: number;
}

export interface LessonWithProgress {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number;
  order_index: number;
  required_time_seconds: number;
  is_locked: boolean;
  allow_skip: boolean;
  quiz_id: string | null;
  completed: boolean;
  time_spent_seconds: number;
  effective_required_time?: number;
  quiz?: Quiz;
  quiz_attempt?: QuizAttempt;
}
