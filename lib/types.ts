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

export interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  reward_id: string;
  earned_at: string;
  // Joined fields
  user?: Profile;
  reward?: Reward;
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
