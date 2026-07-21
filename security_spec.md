# Firestore Security Specification

This document details the security specification for the OCIA Cohort Portal database integration, implementing zero-trust configurations.

## Data Invariants

1. **User Profiles (`/user_profiles/{userId}`)**:
   - Only the authenticated user matching `userId` can write to their profile.
   - Users cannot arbitrarily modify their `role` to elevate privileges.
   - Points must only increase or decrease by standard amounts.

2. **Chat Messages (`/chat_messages/{messageId}`)**:
   - Any signed-in user can create a chat message.
   - The message sender's identity (`senderId`) must strictly match the sender's auth UID.
   - Messages are immutable once written; they cannot be updated or deleted by other users.

3. **Google Meet Spaces (`/meet_spaces/{spaceId}`)**:
   - Only parish leaders, catechists, or administrators can create Meet spaces.
   - The creator ID must match the current user's authenticated ID.
   - Only the creator or leaders can delete/close a Meet space.

4. **Posts (`/posts/{postId}`)**:
   - Only authenticated users can write posts.
   - The authorId must match the authenticated user.
   - Anyone can like/unlike or comment on a post (which updates likes/comments lists).

5. **Polls (`/polls/{pollId}`)**:
   - Any signed-in user can vote on options.
   - Voting updates the `options` array, which must restrict voter manipulation of other options.

---

## The "Dirty Dozen" Vandalism Payloads

The following payloads represent attempt-patterns that are strictly forbidden and MUST return `PERMISSION_DENIED`:

1. **Identity Theft Profile**: Setting `/user_profiles/victim-id` as `attacker-id`.
2. **Privilege Escalation**: Attacker updating their own `role` field from `"candidate"` to `"parish leader"`.
3. **Chat Spoofing**: Creating a chat message with `senderId: "father-thomas"` when logged in as a candidate.
4. **Chat Message Erasure**: Deleting another user's chat message.
5. **Classroom Hijack**: Creating a Google Meet Space under another user's creator ID.
6. **Classroom Shutdown**: Deleting an active Google Meet Space created by a leader, when signed in as a regular seeker.
7. **Post Spoofing**: Posting content pretending to be the Priest.
8. **Malicious Post Deletion**: Deleting a pinned parish announcement when not the creator or leader.
9. **Option Inflation**: Modifying votes in a poll on options that the user didn't select.
10. **Shadow Fields**: Injecting non-schema keys like `isAdmin: true` into a message or profile.
11. **Negative Score Exploit**: Updating point values directly to arbitrary numbers like `99999`.
12. **Null-Timestamp Bypass**: Using client-generated fake timestamps instead of request.time for document creation.
