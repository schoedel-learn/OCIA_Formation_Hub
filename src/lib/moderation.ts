import { AppConfig, UserProfile } from "../types";

export interface ModerationCheckResult {
  allowed: boolean;
  cleanText: string;
  cleanTitle?: string;
  flaggedWords: string[];
  reason?: string;
  isFlagged?: boolean;
}

export const DEFAULT_FORBIDDEN_WORDS = [
  // Profanity, Vulgarities & Cursing
  "fuck", "fucking", "fucker", "shit", "shitting", "bullshit", "asshole", "bitch", "bitches",
  "cunt", "bastard", "dick", "pussy", "cock", "motherfucker", "whore", "slut", "douche",
  "prick", "wanker", "twat", "damn", "crap", "goddamn", "jackass", "piss", "pissed",
  // Slurs & Hate Speech
  "nigger", "faggot", "retard", "spic", "chink", "kyke", "kike", "dyke", "tranny",
  // Spam, Fraud & Illegal/Adult Content
  "spam", "scam", "casino", "poker", "viagra", "crypto", "free money", "cheap drugs",
  "cheap loan", "payday loan", "telegram-bot", "whatsapp-group", "hacker", "payday",
  "porn", "porno", "xxx", "onlyfans", "sex", "erotic", "gambling", "betting", "escort"
];

/**
  Checks text content against the Super Admin forbidden words list and moderation settings.
 */
export function checkContentModeration(
  text: string,
  title?: string,
  config?: AppConfig
): ModerationCheckResult {
  const forbiddenWords = config?.forbiddenWords && config.forbiddenWords.length > 0 
    ? config.forbiddenWords 
    : DEFAULT_FORBIDDEN_WORDS;
  
  const allowedWords = (config?.allowedWords || []).map(w => w.trim().toLowerCase()).filter(Boolean);
  
  const mode = config?.moderationMode || "block";
  const autoFlagLinks = config?.autoFlagSpamLinks ?? true;

  const foundWords: string[] = [];
  let cleanText = text;
  let cleanTitle = title || "";

  const combinedText = ((title ? title + " " : "") + text).toLowerCase();

  // Check forbidden words
  for (const rawWord of forbiddenWords) {
    const word = rawWord.trim().toLowerCase();
    if (!word) continue;

    // Skip if word is explicitly in allowed whitelist
    if (allowedWords.includes(word)) continue;

    // Escape special regex characters
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    if (regex.test(combinedText)) {
      foundWords.push(word);

      if (mode === "censor") {
        const mask = "*".repeat(word.length);
        cleanText = cleanText.replace(regex, mask);
        if (cleanTitle) {
          cleanTitle = cleanTitle.replace(regex, mask);
        }
      }
    }
  }

  // Check suspicious links if enabled
  let suspiciousLinkFound = false;
  if (autoFlagLinks) {
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = combinedText.match(linkRegex);
    if (matches && matches.length > 0) {
      // Check if any link looks suspicious (e.g., bit.ly, t.me, unknown adult/gambling domains)
      const spamLinkRegex = /(bit\.ly|t\.me|whatsapp|casino|poker|crypto|loans|telegram|discord\.gg\/spam)/gi;
      if (spamLinkRegex.test(combinedText)) {
        suspiciousLinkFound = true;
        foundWords.push("suspicious-spam-link");
      }
    }
  }

  if (foundWords.length > 0 || suspiciousLinkFound) {
    if (mode === "block") {
      return {
        allowed: false,
        cleanText: text,
        cleanTitle: title,
        flaggedWords: foundWords,
        reason: `Your submission contains prohibited language or terms: "${foundWords.join(", ")}". Please revise your post.`
      };
    } else if (mode === "flag" || suspiciousLinkFound) {
      return {
        allowed: true,
        cleanText: mode === "censor" ? cleanText : text,
        cleanTitle: mode === "censor" ? cleanTitle : title,
        flaggedWords: foundWords,
        isFlagged: true,
        reason: `Flagged for Super Admin review due to prohibited keyword(s): "${foundWords.join(", ")}"`
      };
    } else if (mode === "censor") {
      return {
        allowed: true,
        cleanText,
        cleanTitle,
        flaggedWords: foundWords
      };
    }
  }

  return {
    allowed: true,
    cleanText: text,
    cleanTitle: title,
    flaggedWords: []
  };
}

/**
 * Checks if a user is currently banned or suspended by Super Admin.
 */
export function isUserBanned(user?: UserProfile | null, config?: AppConfig): { isBanned: boolean; reason?: string } {
  if (!user) return { isBanned: false };

  // Check direct user property
  if (user.isBanned) {
    return {
      isBanned: true,
      reason: user.banReason || "Account suspended by Super Admin due to community guidelines violation."
    };
  }

  // Check config banned lists
  if (config?.bannedUserIds?.includes(user.id)) {
    return {
      isBanned: true,
      reason: "Account suspended by Super Admin authority."
    };
  }

  if (user.email && config?.bannedUserEmails?.map(e => e.toLowerCase()).includes(user.email.toLowerCase())) {
    return {
      isBanned: true,
      reason: "Account email address is suspended from platform activities."
    };
  }

  return { isBanned: false };
}
