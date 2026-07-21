import { Post, Group, EventItem, UserProfile } from "../types";

export const INITIAL_GROUPS: Group[] = [
  {
    id: "grp-1",
    name: "Inquiry Forum",
    description: "A welcoming place for seekers to ask questions, voice doubts, and explore the basics of Christian faith.",
    memberCount: 28,
    category: "Seekers",
    icon: "HelpCircle"
  },
  {
    id: "grp-2",
    name: "The Catechumenate",
    description: "Deep dive conversations into doctrine, Sacred Scripture, moral teachings, and church tradition.",
    memberCount: 18,
    category: "Formation",
    icon: "BookOpen"
  },
  {
    id: "grp-3",
    name: "Mystagogy & Neophytes",
    description: "For the newly baptized and received. Discerning parish ministries, and living out sacraments in the secular world.",
    memberCount: 12,
    category: "Sacraments",
    icon: "Flame"
  },
  {
    id: "grp-4",
    name: "Catechists & Sponsors",
    description: "Coordinating sessions, planning retreats, and supporting our catechumens on their path.",
    memberCount: 8,
    category: "Leadership",
    icon: "Users"
  },
  {
    id: "grp-5",
    name: "Prayer Requests Chain",
    description: "A sacred space where candidates, catechists, and parishioners intercede for one another's intentions.",
    memberCount: 35,
    category: "Community",
    icon: "HeartHandshake"
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: "pst-1",
    title: "Welcome to our OCIA Community & Formation Hub!",
    content: `Dear friends in Christ,

A warm welcome to this unified platform modeled after Circle.so! Whether you are a seeker asking your very first questions (Inquirer), a catechumen preparing for initiation, a baptized Christian entering full communion, a sponsor supporting a loved one, or a catechist guiding the flock—**this digital home is for you.**

Here you will find:
1. **The Formation Tab**: Self-paced courses covering Inquiry, Doctrine, Lent prep, and Mystagogy.
2. **Cyril the Chatbot**: Ask Cyril anything about Catholic doctrine or the OCIA process. He speaks with the voice of Cyril of Jerusalem!
3. **Discussion Groups**: Share reflections and questions with your cohort.
4. **Interactive Events**: Never miss a liturgy, class, or parish breakfast.
5. **Real-time Chats**: Engage instantly with other members.

May Cyril pray for us as we embark on this sacred journey of faith!

In Christ's peace,
**Father Thomas, OCIA Spiritual Director**`,
    category: "announcements",
    authorId: "user-fr-thomas",
    authorName: "Father Thomas",
    authorRole: "leader",
    authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    likes: ["user-current", "seeker-matthew", "cat-sarah"],
    isPinned: true,
    comments: [
      {
        id: "cmt-11",
        postId: "pst-1",
        content: "Thank you Father! This is a beautiful platform. Looking forward to our next group study.",
        authorId: "cat-sarah",
        authorName: "Sarah Jennings",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        timestamp: "2026-07-20T10:00:00-07:00"
      }
    ],
    timestamp: "2026-07-19T08:30:00-07:00"
  },
  {
    id: "pst-2",
    title: "How to choose a Confirmation Sponsor?",
    content: `Hello everyone! I am a Catechumen (unbaptized) preparing for initiation. 
I am starting to think about choosing my Sponsor, but I am not entirely sure what the requirements are or how to make the decision.

Does the sponsor have to be a family member? Should they be from our parish?
Any advice or wisdom from the catechists and leaders here would be greatly appreciated!`,
    category: "general",
    authorId: "seeker-matthew",
    authorName: "Matthew Cooper",
    authorRole: "candidate",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    likes: ["user-current"],
    comments: [
      {
        id: "cmt-21",
        postId: "pst-2",
        content: `Hi Matthew! That is an excellent question. 
According to Canon Law, a sponsor must be at least 16 years old, be a fully initiated Catholic (having received Baptism, Confirmation, and Eucharist), live a life of faith, and NOT be your parent. 
They don't have to be a family member, and they don't strictly have to be from our parish, but they should be someone who can walk with you spiritually.
Let's talk more about this at our session on Tuesday!`,
        authorId: "cat-sarah",
        authorName: "Sarah Jennings",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        timestamp: "2026-07-20T11:15:00-07:00"
      },
      {
        id: "cmt-22",
        postId: "pst-2",
        content: "I asked my godfather to be my sponsor! It's a beautiful way to renew that baptismal connection if you were baptized in another Christian tradition.",
        authorId: "user-current",
        authorName: "John Doe",
        authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        timestamp: "2026-07-20T14:20:00-07:00"
      }
    ],
    timestamp: "2026-07-20T09:12:00-07:00"
  },
  {
    id: "pst-3",
    title: "Unpacking St. Cyril's Mystagogical Catechesis",
    content: `For those in the Mystagogy stage (or anyone interested in early Church history!), I've been re-reading the Mystagogical Lectures of St. Cyril of Jerusalem. 

He wrote beautifully about the sacraments. On Baptism, he describes the oil of exorcism as drawing out the presence of the adversary, and compares the water to both a tomb and a womb. 

It makes me realize how ancient and deeply symbolic our Easter Vigil rites really are. For anyone preparing for sacraments, don't worry about memorizing the rubrics; focus on the deep sensory experience of the water, the oil, the light of the candle, and the white garment.`,
    category: "theology",
    authorId: "cat-sarah",
    authorName: "Sarah Jennings",
    authorRole: "catechist",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    likes: ["user-fr-thomas", "user-current"],
    comments: [],
    timestamp: "2026-07-20T13:45:00-07:00"
  },
  {
    id: "pst-4",
    title: "Prayer Request: For my grandmother's health",
    content: `Please join me in praying for my grandmother, Clara, who was admitted to the hospital last night with severe pneumonia. 
She is a woman of incredible faith and the person who first introduced me to the beauty of the Catholic Church. 

Asking for St. Luke (patron of physicians) and Our Lady of Lourdes to intercede for her recovery. Thank you all!`,
    category: "prayer-requests",
    authorId: "seeker-lucia",
    authorName: "Lucia Martinez",
    authorRole: "candidate",
    authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    likes: ["seeker-matthew", "cat-sarah", "user-current"],
    comments: [
      {
        id: "cmt-41",
        postId: "pst-4",
        content: "Praying for Clara! We will add her name to our parish intercessory scroll this Sunday.",
        authorId: "user-fr-thomas",
        authorName: "Father Thomas",
        authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        timestamp: "2026-07-20T15:10:00-07:00"
      },
      {
        id: "cmt-42",
        postId: "pst-4",
        content: "Lord, hear our prayers for Clara's healing and peace.",
        authorId: "user-current",
        authorName: "John Doe",
        authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        timestamp: "2026-07-20T16:00:00-07:00"
      }
    ],
    timestamp: "2026-07-20T14:30:00-07:00"
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: "evt-1",
    title: "OCIA Inquiry Session: Who is Jesus?",
    description: "An open, informal discussion about the central figure of Christian faith, His historical claims, and His message of love.",
    date: "2026-07-22",
    time: "7:00 PM - 8:30 PM",
    location: "Parish Hall & Zoom",
    type: "catechesis",
    attendees: ["user-current", "seeker-matthew", "seeker-lucia"]
  },
  {
    id: "evt-2",
    title: "Rite of Acceptance and Welcoming",
    description: "Our first major liturgical milestone! Seekers declare their intention to enter the Catechumenate during Sunday morning Mass.",
    date: "2026-07-26",
    time: "10:30 AM - 12:00 PM",
    location: "St. Mary's Church Main Sanctuary",
    type: "liturgy",
    attendees: ["seeker-matthew", "seeker-lucia"]
  },
  {
    id: "evt-3",
    title: "Mystagogy Dinner & Fellowship",
    description: "A casual potluck dinner for our neophytes (those initiated at Easter) to celebrate and share insights on their first months in the church.",
    date: "2026-07-24",
    time: "6:30 PM - 8:30 PM",
    location: "Rectory Garden",
    type: "fellowship",
    attendees: ["user-current", "cat-sarah"]
  },
  {
    id: "evt-4",
    title: "OCIA Cohort Spiritual Retreat",
    description: "A quiet half-day retreat focusing on the spiritual battle, examination of conscience, and preparing our souls for sacramental initiation.",
    date: "2026-08-01",
    time: "9:00 AM - 1:00 PM",
    location: "Our Lady of Peace Retreat House",
    type: "retreat",
    attendees: ["user-current", "seeker-matthew", "seeker-lucia"]
  }
];

export const DEFAULT_USER: UserProfile = {
  id: "user-current",
  name: "John Doe",
  email: "schoedelb@gmail.com",
  role: "candidate",
  streak: 5,
  lastActive: new Date().toISOString(),
  points: 320,
  completedLessons: ["inq-1"],
  subscriptionStatus: "free",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  notificationsEnabled: true,
  savedResources: ["res-2"],
  permissions: {
    canCreateResources: true,
    canCreateEvents: true,
    canManagePermissions: true
  }
};

export const INITIAL_POLLS = [
  {
    id: "pl-1",
    question: "Which liturgical season speaks most profoundly to your soul?",
    options: [
      { id: "opt-1", text: "Advent (Expectant Waiting)", votes: ["seeker-matthew"] },
      { id: "opt-2", text: "Lent (Repentance & Grace)", votes: ["user-current", "seeker-lucia"] },
      { id: "opt-3", text: "Eastertide (Resurrection Joy)", votes: ["cat-sarah"] },
      { id: "opt-4", text: "Ordinary Time (Steadfast Growth)", votes: [] }
    ],
    authorId: "leader-thomas",
    authorName: "Father Thomas",
    authorRole: "priest",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
  },
  {
    id: "pl-2",
    question: "What is your primary spiritual goal for this stage of your OCIA journey?",
    options: [
      { id: "opt-5", text: "Establishing a daily habit of prayer", votes: ["seeker-matthew"] },
      { id: "opt-6", text: "Deepening my intellectual understanding of dogma", votes: [] },
      { id: "opt-7", text: "Building genuine community with fellow catechumens", votes: ["seeker-lucia"] },
      { id: "opt-8", text: "Discerning personal calling & lay ministries", votes: [] }
    ],
    authorId: "leader-thomas",
    authorName: "Father Thomas",
    authorRole: "priest",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  }
];

