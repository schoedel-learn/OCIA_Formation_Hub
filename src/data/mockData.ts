import { Post, Group, EventItem, UserProfile, Poll } from "../types";

export const INITIAL_GROUPS: Group[] = [
  {
    id: "grp-1",
    name: "Inquiry Forum",
    description: "A welcoming place for seekers to ask questions, voice doubts, and explore the basics of Christian faith.",
    memberCount: 1,
    category: "Seekers",
    icon: "HelpCircle"
  },
  {
    id: "grp-2",
    name: "The Catechumenate",
    description: "Deep dive conversations into doctrine, Sacred Scripture, moral teachings, and church tradition.",
    memberCount: 1,
    category: "Formation",
    icon: "BookOpen"
  },
  {
    id: "grp-3",
    name: "Mystagogy & Neophytes",
    description: "For the newly baptized and received. Discerning parish ministries, and living out sacraments in the secular world.",
    memberCount: 1,
    category: "Sacraments",
    icon: "Flame"
  },
  {
    id: "grp-4",
    name: "Catechists & Sponsors",
    description: "Coordinating sessions, planning retreats, and supporting our catechumens on their path.",
    memberCount: 1,
    category: "Leadership",
    icon: "Users"
  },
  {
    id: "grp-5",
    name: "Prayer Requests Chain",
    description: "A sacred space where candidates, catechists, and parishioners intercede for one another's intentions.",
    memberCount: 1,
    category: "Community",
    icon: "HeartHandshake"
  }
];

export const INITIAL_POSTS: Post[] = [];

export const INITIAL_EVENTS: EventItem[] = [];

export const DEFAULT_USER: UserProfile = {
  id: "usr_001_barry_schoedel",
  name: "Barry Schoedel",
  email: "schoedelb@gmail.com",
  phone: "(555) 019-2831",
  address: "777 Sacred Heart Blvd, Suite 100, Cityville, ST 12345",
  role: "super admin",
  streak: 15,
  lastActive: new Date().toISOString(),
  points: 1000,
  completedLessons: ["inq-1", "inq-2", "cat-1"],
  subscriptionStatus: "premium",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  notificationsEnabled: true,
  savedResources: [],
  tenantId: "tenant-st-jude",
  tenantName: "St. Jude Catholic Parish",
  tenantType: "parish",
  permissions: {
    canCreateResources: true,
    canCreateEvents: true,
    canManagePermissions: true,
    isAdmin: true,
    canModerateForum: true
  }
};

export const INITIAL_POLLS: Poll[] = [];

