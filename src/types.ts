export type UserRole =
  | "super admin"
  | "parish administrator"
  | "pastor"
  | "priest"
  | "parochial vicar"
  | "it support"
  | "OCIA Director/Coordinator"
  | "catechist"
  | "sponsor"
  | "parish leader"
  | "liturgist"
  | "deacon"
  | "bishop"
  | "sister"
  | "brother"
  | "seeker"
  | "catechumen"
  | "candidate"
  | "elect"
  | "neophyte"
  | "disciple"
  | "evangelist"
  | "musician"
  | "lay minister"
  | "leader";

export const ROOT_SUPER_ADMIN_EMAIL = "schoedelb@gmail.com";

/**
 * Returns true if the user is a Super Admin or is the Root Super Admin email (schoedelb@gmail.com).
 */
export const isSuperAdmin = (userOrRole?: string | UserProfile, email?: string): boolean => {
  if (email && email.toLowerCase().trim() === ROOT_SUPER_ADMIN_EMAIL.toLowerCase()) return true;
  if (!userOrRole) return false;
  if (typeof userOrRole === "string") {
    return userOrRole.toLowerCase().trim() === "super admin";
  }
  if (userOrRole.email && userOrRole.email.toLowerCase().trim() === ROOT_SUPER_ADMIN_EMAIL.toLowerCase()) return true;
  return userOrRole.role?.toLowerCase().trim() === "super admin";
};

/**
 * Returns true if the email or user is the immutable Root Super Admin (schoedelb@gmail.com).
 */
export const isRootSuperAdmin = (userOrEmail?: string | UserProfile): boolean => {
  if (!userOrEmail) return false;
  const emailStr = typeof userOrEmail === "string" ? userOrEmail : userOrEmail.email;
  return Boolean(emailStr && emailStr.toLowerCase().trim() === ROOT_SUPER_ADMIN_EMAIL.toLowerCase());
};

/**
 * Checks if the operating user can assign or revoke a role on target user.
 */
export const canModifyRole = (
  operator: UserProfile,
  targetUser: UserProfile,
  newRole: UserRole
): { allowed: boolean; reason?: string } => {
  // Check root super admin protection
  if (isRootSuperAdmin(targetUser) && newRole !== "super admin") {
    return {
      allowed: false,
      reason: "The Root Super Admin (schoedelb@gmail.com) is permanent and cannot be demoted or stripped of the super admin role."
    };
  }

  // Assigning or modifying a super admin role requires super admin operator
  if ((newRole === "super admin" || targetUser.role === "super admin") && !isSuperAdmin(operator)) {
    return {
      allowed: false,
      reason: "Only a Super Admin can create, modify, or assign the Super Admin role."
    };
  }

  return { allowed: true };
};

/**
 * Checks if the operating user can delete target user profile.
 */
export const canDeleteUser = (
  operator: UserProfile,
  targetUser: UserProfile
): { allowed: boolean; reason?: string } => {
  if (isRootSuperAdmin(targetUser)) {
    return {
      allowed: false,
      reason: "The Root Super Admin (schoedelb@gmail.com) is permanently protected and cannot be deleted."
    };
  }

  if (targetUser.role === "super admin" && !isSuperAdmin(operator)) {
    return {
      allowed: false,
      reason: "Only a Super Admin can delete another Super Admin."
    };
  }

  return { allowed: true };
};

/**
 * Checks if the user has authorization to access and manage the parish Stripe billing contract.
 * Per policy, ONLY Parish Administrators, OCIA Directors, Pastors, IT Support, and Super Admins
 * have billing access. (Priests, Parochial Vicars, Catechists, Sponsors, and Seekers do NOT).
 */
export const hasBillingAccess = (role?: string, permissions?: UserPermissions): boolean => {
  if (permissions?.isAdmin) return true;
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return (
    r === "super admin" ||
    r === "parish administrator" ||
    r === "ocia director/coordinator" ||
    r === "pastor" ||
    r === "it support"
  );
};

export const isOciaDirector = (role?: string): boolean => {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return (
    r === "super admin" ||
    r === "ocia director/coordinator" ||
    r === "parish administrator" ||
    r === "pastor" ||
    r === "it support" ||
    r === "parish leader" ||
    r === "leader"
  );
};

export const isClergy = (role?: string): boolean => {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return (
    r === "pastor" ||
    r === "priest" ||
    r === "parochial vicar" ||
    r === "deacon" ||
    r === "bishop"
  );
};

export const isOciaLeader = (role?: string): boolean => {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return (
    r === "super admin" ||
    r === "ocia director/coordinator" ||
    r === "parish administrator" ||
    r === "pastor" ||
    r === "priest" ||
    r === "parochial vicar" ||
    r === "it support" ||
    r === "parish leader" ||
    r === "leader" ||
    r === "deacon" ||
    r === "bishop" ||
    r === "catechist"
  );
};

export const isSponsor = (role?: string): boolean => {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return r === "sponsor";
};

export type TenantType = "parish" | "parish_group" | "diocese";

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  city?: string;
  stateOrRegion?: string;
  patronSaint?: string;
  subscriptionStatus: "free" | "premium";
  subscriptionRenewsAt?: string;
  billingContactEmail?: string;
  billingContactName?: string;
  createdAt: string;
  memberCount?: number;
  description?: string;
}

export const generateUniqueUserId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `usr_${timestamp}_${randomStr}`;
};

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
  phone?: string;
  address?: string;
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
  tenantId?: string;
  tenantName?: string;
  tenantType?: TenantType;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  bannedBy?: string;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
  isFlagged?: boolean;
  flagReason?: string;
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
  isFlagged?: boolean;
  flagReason?: string;
  flaggedWords?: string[];
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

export interface OciaRegistrationRecord {
  id: string;
  userId: string;
  fullName: string;
  preferredName?: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  track: "seeker" | "catechumen" | "candidate" | "sponsor" | "catechist" | "inquirer";
  baptismStatus: "unbaptized" | "baptized_catholic" | "baptized_non_catholic" | "unknown";
  baptismChurchDetails?: string;
  firstEucharistReceived?: boolean;
  confirmationReceived?: boolean;
  maritalStatus: "single" | "married_catholic" | "married_civil" | "divorced" | "widowed" | "engaged";
  sponsorName?: string;
  sponsorEmail?: string;
  sponsorPhone?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  dietaryOrSpecialNeeds?: string;
  registrationDate: string;
  status: "pending" | "approved" | "archived";
  notes?: string;
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
  isPinned?: boolean;
  category?: "session-topics" | "event-scheduling" | "general-feedback" | "spiritual-reflection";
}

export interface CustomNavItem {
  id: string;
  label: string;
  enabled: boolean;
  type?: "builtin" | "external";
  externalUrl?: string;
}

export interface AppConfig {
  parishName: string;
  parishTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  announcementText: string;
  showAnnouncement: boolean;
  announcementType: "notice" | "alert" | "celebration";
  liturgicalSeasonOverride: "auto" | "lent" | "ordinary" | "easter" | "pentecost";
  themePreset: "gold" | "emerald" | "violet" | "crimson" | "marian";
  contactAddress: string;
  contactEmail: string;
  contactPhone: string;
  massTimes: string;
  confessionTimes?: string;
  officeHours?: string;
  pastorName?: string;
  cyrilBotGreeting: string;
  cyrilBotInstructions: string;
  navItems: CustomNavItem[];
  defaultTab: string;

  // Live Stream & Virtual Meeting Space
  isLiveStreamActive?: boolean;
  liveStreamTitle?: string;
  liveStreamSpeaker?: string;
  liveStreamUrl?: string;
  liveStreamMeetingLink?: string;
  liveStreamCategory?: "Liturgy" | "Q&A" | "Discussion" | "Prayer" | "Music";

  // Registration & Intake Form Policy
  registrationInstructions?: string;
  requireBirthDate?: boolean;
  requireAddress?: boolean;
  requireEmergencyContact?: boolean;
  requireMaritalStatus?: boolean;
  requireBaptismDetails?: boolean;
  registrationApprovalMode?: "auto" | "manual";

  // Feature Module Control Toggles
  enableForum?: boolean;
  enableLiveStream?: boolean;
  enableCyrilBot?: boolean;
  enableClassroom?: boolean;
  enableLeaderboard?: boolean;

  // Super Admin Moderation & Word Filtering Rules
  forbiddenWords?: string[];
  allowedWords?: string[];
  moderationMode?: "block" | "censor" | "flag";
  autoFlagSpamLinks?: boolean;
  maxPostsPerDayPerUser?: number;
  bannedUserIds?: string[];
  bannedUserEmails?: string[];
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  category: "user" | "content" | "config" | "security";
}


