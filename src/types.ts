export type UserRole =
  | "catechist"
  | "parish leader"
  | "liturgist"
  | "priest"
  | "deacon"
  | "bishop"
  | "sister"
  | "brother"
  | "seeker"
  | "catechumen"
  | "elect"
  | "neophyte"
  | "disciple"
  | "evangelist"
  | "musician"
  | "lay minister"
  | "candidate"
  | "leader";

export interface UserPermissions {
  canCreateResources: boolean;
  canCreateEvents: boolean;
  canManagePermissions: boolean;
  isAdmin?: boolean;
  canModerateForum?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  streak: number;
  lastActive: string;
  points: number;
  completedLessons: string[]; // lesson IDs
  subscriptionStatus: "free" | "premium";
  avatar: string;
  notificationsEnabled: boolean;
  savedResources: string[];
  permissions?: UserPermissions;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: "image" | "video" | "pdf";
  url: string; // Base64 data URL or external URL
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category: "announcements" | "general" | "theology" | "prayer-requests" | "mystagogy";
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar: string;
  likes: string[]; // user IDs who liked
  comments: Comment[];
  timestamp: string;
  isPinned?: boolean;
  attachments?: Attachment[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  icon: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  type: "liturgy" | "catechesis" | "fellowship" | "retreat";
  attendees: string[]; // user IDs
}

export interface Lesson {
  id: string;
  title: string;
  stage: 1 | 2 | 3 | 4; // 1: Evangelization & Pre-Catechumenate, 2: Catechumenate, 3: Purification & Enlightenment, 4: Mystagogy
  stageName: string;
  description: string;
  content: string; // Markdown / Text content
  duration: number; // in minutes
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "link" | "video" | "document";
  category: "liturgy" | "doctrine" | "catechism" | "scripture" | "prayer";
  url: string;
  downloadCount: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // List of user IDs who voted for this option
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  timestamp: string;
  expiresAt?: string;
}

