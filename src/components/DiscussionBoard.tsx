import React, { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { MessageSquare, Heart, Pin, Share2, Plus, ArrowLeft, Send, Check, Link, Globe, BarChart2, Trash2, Edit2, CheckCircle2, Clock, Paperclip, Video, FileText, X, Loader2 } from "lucide-react";
import { Post, UserProfile, Comment, UserRole, Poll, PollOption, Attachment } from "../types";
import URLPreview from "./URLPreview";

interface DiscussionBoardProps {
  user: UserProfile;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  polls: Poll[];
  setPolls: (polls: Poll[]) => void;
  addPoints: (amount: number) => void;
}

export default function DiscussionBoard({ user, posts, setPosts, polls, setPolls, addPoints }: DiscussionBoardProps) {
  const [activeTab, setActiveTab] = useState<"all" | "polls" | "announcements" | "general" | "theology" | "prayer-requests" | "mystagogy">("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState<"general" | "theology" | "prayer-requests" | "mystagogy">("general");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Editing Post States
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostCategory, setEditPostCategory] = useState<"general" | "theology" | "prayer-requests" | "mystagogy">("general");
  const [editPostAttachments, setEditPostAttachments] = useState<Attachment[]>([]);

  // Attachment States
  const [newPostAttachments, setNewPostAttachments] = useState<Attachment[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);

  // Poll creation states
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionsInputs, setPollOptionsInputs] = useState<string[]>(["", ""]);
  const [pollExpiresAt, setPollExpiresAt] = useState("");

  const categories = [
    { id: "all", label: "All Spaces" },
    { id: "polls", label: "📊 Cohort Polls" },
    { id: "announcements", label: "📢 Announcements" },
    { id: "general", label: "💬 General Discussions" },
    { id: "theology", label: "📜 Theology & Scripture" },
    { id: "prayer-requests", label: "🙏 Prayer Wall" },
    { id: "mystagogy", label: "🔥 Mystagogy & Growth" }
  ];

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "OCIA Director/Coordinator":
      case "priest":
      case "deacon":
      case "bishop":
      case "parish leader":
      case "leader":
        return "bg-red-100 text-red-800 dark:bg-red-950/45 dark:text-red-400 border-red-200/50 dark:border-red-800/40";
      
      case "catechist":
      case "liturgist":
      case "evangelist":
      case "musician":
      case "lay minister":
        return "bg-accent-light text-accent dark:bg-accent/15 dark:text-accent border border-accent/20";
      
      case "sister":
      case "brother":
      case "disciple":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40";
      
      case "seeker":
      case "candidate":
      case "catechumen":
      case "elect":
      case "neophyte":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40";
      
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
    }
  };

  const handleLike = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const alreadyLiked = p.likes.includes(user.id);
        const updatedLikes = alreadyLiked 
          ? p.likes.filter(id => id !== user.id)
          : [...p.likes, user.id];
        
        if (!alreadyLiked) addPoints(5); // 5 points for liking posts
        
        return { ...p, likes: updatedLikes };
      }
      return p;
    }));

    if (selectedPost && selectedPost.id === postId) {
      const alreadyLiked = selectedPost.likes.includes(user.id);
      setSelectedPost(prev => prev ? {
        ...prev,
        likes: alreadyLiked 
          ? prev.likes.filter(id => id !== user.id)
          : [...prev.likes, user.id]
      } : null);
    }
  };

  const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s)]+)/gi;
    const matches = text.match(urlRegex);
    if (!matches) return [];
    return Array.from(new Set(matches));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsReadingFiles(true);
    const readPromises = Array.from(files).map((file) => {
      return new Promise<Attachment>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          let type: "image" | "video" | "pdf" = "pdf";
          if (file.type.startsWith("image/")) {
            type = "image";
          } else if (file.type.startsWith("video/")) {
            type = "video";
          }

          resolve({
            id: "att-" + Math.random().toString(36).substring(2, 9),
            name: file.name,
            type,
            url: reader.result as string
          });
        };
        reader.onerror = () => reject(new Error("File reading failed"));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises)
      .then((newAtts) => {
        if (isEdit) {
          setEditPostAttachments((prev) => [...prev, ...newAtts]);
        } else {
          setNewPostAttachments((prev) => [...prev, ...newAtts]);
        }
      })
      .catch((err) => console.error("Error reading file:", err))
      .finally(() => {
        setIsReadingFiles(false);
        e.target.value = "";
      });
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const newPost: Post = {
      id: "pst-" + Math.random().toString(36).substring(2, 9),
      title: newPostTitle,
      content: newPostContent,
      category: newPostCategory,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      authorAvatar: user.avatar,
      likes: [],
      comments: [],
      timestamp: new Date().toISOString(),
      attachments: newPostAttachments
    };

    setPosts(prev => [newPost, ...prev]);
    setNewPostTitle("");
    setNewPostContent("");
    setNewPostAttachments([]);
    setIsCreatingPost(false);
    addPoints(30); // 30 points for initiating discussions!
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedPost) return;

    const newComment: Comment = {
      id: "cmt-" + Math.random().toString(36).substring(2, 9),
      postId: selectedPost.id,
      content: commentInput,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      timestamp: new Date().toISOString()
    };

    const updatedPost = {
      ...selectedPost,
      comments: [...selectedPost.comments, newComment]
    };

    setPosts(prev => prev.map(p => p.id === selectedPost.id ? updatedPost : p));
    setSelectedPost(updatedPost);
    setCommentInput("");
    addPoints(10); // 10 points for replying / community building!
  };

  const triggerCopyLink = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = window.location.origin + `/posts/${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    setShareSuccess(post.id);
    setTimeout(() => setShareSuccess(null), 3000);
    addPoints(5); // Reward points for sharing/reference!
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm("Are you sure you want to delete this discussion post? This action cannot be undone.")) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setSelectedPost(null);
    }
  };

  const handleSaveEditPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPostTitle.trim() || !editPostContent.trim() || !selectedPost) return;

    const updatedPost: Post = {
      ...selectedPost,
      title: editPostTitle,
      content: editPostContent,
      category: editPostCategory,
      attachments: editPostAttachments,
    };

    setPosts(prev => prev.map(p => p.id === selectedPost.id ? updatedPost : p));
    setSelectedPost(updatedPost);
    setIsEditingPost(false);
  };

  const isLeader = ["OCIA Director/Coordinator", "leader", "parish leader", "priest", "deacon", "bishop", "catechist"].includes(user.role);

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion.trim()) return;

    const filteredOptions = pollOptionsInputs.map(opt => opt.trim()).filter(Boolean);
    if (filteredOptions.length < 2) return;

    const newPoll: Poll = {
      id: "pl-" + Math.random().toString(36).substring(2, 9),
      question: pollQuestion.trim(),
      options: filteredOptions.map((text, idx) => ({
        id: `opt-${idx + 1}-${Math.random().toString(36).substring(2, 5)}`,
        text,
        votes: []
      })),
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      authorAvatar: user.avatar,
      timestamp: new Date().toISOString(),
      expiresAt: pollExpiresAt ? new Date(pollExpiresAt).toISOString() : undefined
    };

    setPolls([newPoll, ...polls]);
    setPollQuestion("");
    setPollOptionsInputs(["", ""]);
    setPollExpiresAt("");
    setIsCreatingPoll(false);
    addPoints(25); // Award points for fostering cohort dialogue!
  };

  const handleVote = (pollId: string, optionId: string) => {
    const updatedPolls = polls.map(p => {
      if (p.id === pollId) {
        const isExpired = p.expiresAt ? new Date(p.expiresAt).getTime() < Date.now() : false;
        if (isExpired) return p;

        const hasVotedBefore = p.options.some(opt => opt.votes.includes(user.id));
        const newOptions = p.options.map(opt => {
          let updatedVotes = opt.votes.filter(uid => uid !== user.id);
          if (opt.id === optionId) {
            updatedVotes = [...updatedVotes, user.id];
          }
          return { ...opt, votes: updatedVotes };
        });

        if (!hasVotedBefore) {
          addPoints(5); // 5 points for taking part in community polls
        }

        return { ...p, options: newOptions };
      }
      return p;
    });
    setPolls(updatedPolls);
  };

  const handleDeletePoll = (pollId: string) => {
    const updatedPolls = polls.filter(p => p.id !== pollId);
    setPolls(updatedPolls);
  };

  const filteredPosts = posts.filter(p => activeTab === "all" || p.category === activeTab);

  return (
    <div id="discussion-board-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
      {/* Categories Sidebar */}
      <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs h-fit">
        <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 px-3 mb-3 text-base">Community Spaces</h3>
        <div className="space-y-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveTab(cat.id as any);
                setSelectedPost(null);
                setIsCreatingPost(false);
                setIsCreatingPoll(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition duration-200 text-left cursor-pointer ${
                activeTab === cat.id
                  ? "bg-brand-light dark:bg-brand/15 text-brand"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full text-zinc-500">
                {cat.id === "all" ? posts.length : cat.id === "polls" ? polls.length : posts.filter(p => p.category === cat.id).length}
              </span>
            </button>
          ))}
        </div>
        
        {activeTab === "polls" ? (
          isLeader && (
            <button
              onClick={() => {
                setIsCreatingPoll(true);
                setIsCreatingPost(false);
              }}
              className="w-full mt-4 bg-brand hover:bg-brand-hover text-white py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Poll</span>
            </button>
          )
        ) : (
          <button
            onClick={() => {
              setIsCreatingPost(true);
              setSelectedPost(null);
              setIsCreatingPoll(false);
            }}
            className="w-full mt-4 bg-brand hover:bg-brand-hover text-white py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Discussion</span>
          </button>
        )}
      </div>

      {/* Main Board Area */}
      <div className="lg:col-span-3">
        {isCreatingPoll ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <button
              onClick={() => {
                setIsCreatingPoll(false);
                setPollQuestion("");
                setPollOptionsInputs(["", ""]);
                setPollExpiresAt("");
              }}
              className="flex items-center space-x-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-sm mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Polls</span>
            </button>
            <h3 className="font-serif font-bold text-xl text-zinc-900 dark:text-zinc-100 mb-2">Create Cohort Poll</h3>
            <p className="text-xs text-zinc-500 mb-6">Ask a doctrinal, liturgical, or spiritual reflection question to spark discussion in your cohort.</p>
            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Poll Question</label>
                <input
                  type="text"
                  placeholder="e.g. Which sacrament speaks to your heart the most right now?"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Response Options (Minimum 2)</label>
                <div className="space-y-2">
                  {pollOptionsInputs.map((optionText, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-400 w-5">{index + 1}.</span>
                      <input
                        type="text"
                        placeholder={`Option ${index + 1}`}
                        value={optionText}
                        onChange={e => {
                          const updated = [...pollOptionsInputs];
                          updated[index] = e.target.value;
                          setPollOptionsInputs(updated);
                        }}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-brand"
                        required
                      />
                      {pollOptionsInputs.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setPollOptionsInputs(pollOptionsInputs.filter((_, i) => i !== index));
                          }}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition"
                          title="Remove option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptionsInputs.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setPollOptionsInputs([...pollOptionsInputs, ""])}
                    className="mt-3 text-xs text-brand font-semibold hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add option</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Expiry Date & Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={pollExpiresAt}
                  onChange={e => setPollExpiresAt(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 px-3 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <p className="text-[10px] text-zinc-400 mt-1">Leave empty if the poll should run indefinitely with no expiration date.</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingPoll(false);
                    setPollQuestion("");
                    setPollOptionsInputs(["", ""]);
                    setPollExpiresAt("");
                  }}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pollOptionsInputs.filter(Boolean).length < 2}
                  className="px-5 py-2 bg-brand hover:bg-brand-hover disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  Create & Publish
                </button>
              </div>
            </form>
          </div>
        ) : isCreatingPost ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <button
              onClick={() => setIsCreatingPost(false)}
              className="flex items-center space-x-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-sm mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to posts</span>
            </button>
            <h3 className="font-serif font-bold text-xl text-zinc-900 dark:text-zinc-100 mb-4">Start a New Discussion</h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  placeholder="What is on your mind?"
                  value={newPostTitle}
                  onChange={e => setNewPostTitle(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Space (Category)</label>
                  <select
                    value={newPostCategory}
                    onChange={e => setNewPostCategory(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="general">💬 General Discussions</option>
                    <option value="theology">📜 Theology & Scripture</option>
                    <option value="prayer-requests">🙏 Prayer Wall</option>
                    <option value="mystagogy">🔥 Mystagogy & Growth</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Content</label>
                <textarea
                  rows={6}
                  placeholder="Share your thoughts, experiences, questions, or prayer intentions..."
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
              </div>

              {/* File Attachments Section */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Attachments (Images, Videos, PDFs)</label>
                
                <div className="flex items-center space-x-3">
                  <label className="flex items-center justify-center space-x-2 px-4 py-2 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-brand hover:text-brand dark:hover:border-brand rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer transition">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Choose files...</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,image/svg+xml,video/*,application/pdf,.svg"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                  {isReadingFiles && (
                    <div className="flex items-center space-x-1.5 text-xs text-zinc-500 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                      <span>Reading files...</span>
                    </div>
                  )}
                </div>

                {newPostAttachments.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {newPostAttachments.map((file) => (
                      <div key={file.id} className="relative group p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          {file.type === "image" ? (
                            <img src={file.url} alt="thumbnail" className="w-8 h-8 rounded-md object-cover border border-zinc-200" />
                          ) : file.type === "video" ? (
                            <div className="w-8 h-8 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                              <Video className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[100px]">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewPostAttachments(prev => prev.filter(f => f.id !== file.id))}
                          className="p-1 rounded bg-zinc-100 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 dark:hover:bg-red-950/35 transition cursor-pointer"
                          title="Remove attachment"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingPost(false)}
                  className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  Post to Community
                </button>
              </div>
            </form>
          </div>
        ) : selectedPost ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <button
              onClick={() => setSelectedPost(null)}
              className="flex items-center space-x-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-sm mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to list</span>
            </button>

            {/* Author details */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedPost.authorAvatar}
                  alt={selectedPost.authorName}
                  className="w-12 h-12 rounded-full border border-zinc-200 object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-serif font-bold text-zinc-900 dark:text-zinc-100">{selectedPost.authorName}</span>
                    <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full border ${getRoleBadgeColor(selectedPost.authorRole)}`}>
                      {selectedPost.authorRole.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {new Date(selectedPost.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
              </div>

              {/* Share and Edit/Delete Controls */}
              <div className="flex items-center space-x-1.5">
                {selectedPost.authorId === user.id && !isEditingPost && (
                  <button
                    onClick={() => {
                      setEditPostTitle(selectedPost.title);
                      setEditPostContent(selectedPost.content);
                      setEditPostCategory(selectedPost.category as any);
                      setEditPostAttachments(selectedPost.attachments || []);
                      setIsEditingPost(true);
                    }}
                    title="Edit Post"
                    className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-zinc-400 hover:text-amber-600 transition cursor-pointer flex items-center"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {(selectedPost.authorId === user.id || isLeader) && !isEditingPost && (
                  <button
                    onClick={() => handleDeletePost(selectedPost.id)}
                    title="Delete Post"
                    className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-600 transition cursor-pointer flex items-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => triggerCopyLink(selectedPost, e)}
                  title="Copy Reference Link"
                  className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-brand-light dark:hover:bg-brand/15 text-zinc-400 hover:text-brand transition cursor-pointer flex items-center"
                >
                  {shareSuccess === selectedPost.id ? <Check className="w-4 h-4 text-emerald-500 animate-scaleIn" /> : <Link className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isEditingPost ? (
              <form onSubmit={handleSaveEditPost} className="space-y-4 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Title</label>
                  <input
                    type="text"
                    value={editPostTitle}
                    onChange={e => setEditPostTitle(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Space (Category)</label>
                  <select
                    value={editPostCategory}
                    onChange={e => setEditPostCategory(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="general">💬 General Discussions</option>
                    <option value="theology">📜 Theology & Scripture</option>
                    <option value="prayer-requests">🙏 Prayer Wall</option>
                    <option value="mystagogy">🔥 Mystagogy & Growth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Content (supports Markdown)</label>
                  <textarea
                    rows={6}
                    value={editPostContent}
                    onChange={e => setEditPostContent(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand"
                    required
                  />
                </div>

                {/* File Attachments Section for Editing */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Attachments (Images, Videos, PDFs)</label>
                  
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center justify-center space-x-2 px-4 py-2 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-brand hover:text-brand dark:hover:border-brand rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer transition">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Choose files...</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,image/svg+xml,video/*,application/pdf,.svg"
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                    {isReadingFiles && (
                      <div className="flex items-center space-x-1.5 text-xs text-zinc-500 font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                        <span>Reading files...</span>
                      </div>
                    )}
                  </div>

                  {editPostAttachments.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {editPostAttachments.map((file) => (
                        <div key={file.id} className="relative group p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            {file.type === "image" ? (
                              <img src={file.url} alt="thumbnail" className="w-8 h-8 rounded-md object-cover border border-zinc-200" />
                            ) : file.type === "video" ? (
                              <div className="w-8 h-8 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                <Video className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-md bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[100px]">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditPostAttachments(prev => prev.filter(f => f.id !== file.id))}
                            className="p-1 rounded bg-zinc-100 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 dark:hover:bg-red-950/35 transition cursor-pointer"
                            title="Remove attachment"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingPost(false)}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="font-serif font-bold text-2xl text-zinc-900 dark:text-zinc-100 mb-4">{selectedPost.title}</h2>
                
                <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed mb-6">
                  <MarkdownRenderer content={selectedPost.content} />
                </div>

                {/* Render Uploaded Attachments */}
                {selectedPost.attachments && selectedPost.attachments.length > 0 && (
                  <div className="space-y-4 mb-6 pt-2">
                    <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Attachments</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedPost.attachments.map((att) => {
                        if (att.type === "image") {
                          return (
                            <div key={att.id} className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 shadow-2xs group">
                              <img src={att.url} alt={att.name} referrerPolicy="no-referrer" className="w-full h-auto max-h-72 object-cover" />
                              <div className="absolute bottom-2 left-2 bg-black/60 px-2.5 py-1 rounded-lg text-[10px] text-white">
                                {att.name}
                              </div>
                            </div>
                          );
                        } else if (att.type === "video") {
                          return (
                            <div key={att.id} className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 shadow-2xs p-1">
                              <video src={att.url} controls className="w-full h-auto max-h-72 rounded-lg" />
                              <div className="p-2 text-xs text-zinc-500 font-mono truncate">{att.name}</div>
                            </div>
                          );
                        } else {
                          return (
                            <a
                              key={att.id}
                              href={att.url}
                              download={att.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shadow-2xs"
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className="p-2 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-lg shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="text-left min-w-0">
                                  <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">{att.name}</span>
                                  <span className="block text-[10px] text-zinc-400 uppercase font-mono font-bold">PDF Document</span>
                                </div>
                              </div>
                              <span className="text-xs text-brand hover:underline font-semibold shrink-0 ml-3">View/Download</span>
                            </a>
                          );
                        }
                      })}
                    </div>
                  </div>
                )}

                {/* Render URL Previews */}
                {(() => {
                  const urls = extractUrls(selectedPost.content);
                  if (urls.length === 0) return null;
                  return (
                    <div className="space-y-3 mb-6 pt-2">
                      <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Shared Links</h4>
                      <div className="space-y-3">
                        {urls.map((url, idx) => (
                          <URLPreview key={idx} url={url} />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-6" />
              </>
            )}

            {/* Like and comment metrics */}
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={(e) => handleLike(selectedPost.id, e)}
                className={`flex items-center space-x-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border transition duration-200 cursor-pointer ${
                  selectedPost.likes.includes(user.id)
                    ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/50"
                    : "bg-zinc-50 border-zinc-200 text-zinc-500 dark:bg-zinc-800/50 dark:border-zinc-700/60 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Heart className={`w-4 h-4 ${selectedPost.likes.includes(user.id) ? "fill-rose-500" : ""}`} />
                <span>{selectedPost.likes.length} Likes</span>
              </button>
              <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
                <MessageSquare className="w-4 h-4" />
                <span>{selectedPost.comments.length} Comments</span>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">Comments ({selectedPost.comments.length})</h4>
              {selectedPost.comments.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No comments yet. Start the conversation!</p>
              ) : (
                <div className="space-y-3.5">
                  {selectedPost.comments.map(comment => (
                    <div key={comment.id} className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 p-3.5 rounded-xl text-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <img
                            src={comment.authorAvatar}
                            alt={comment.authorName}
                            className="w-6 h-6 rounded-full object-cover border border-zinc-200"
                          />
                          <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">{comment.authorName}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(comment.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed pl-8">
                        <MarkdownRenderer content={comment.content} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a respectful, encouraging reply..."
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand border border-zinc-200 dark:border-zinc-700"
              />
              <button
                type="submit"
                className="bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 rounded-lg flex items-center justify-center cursor-pointer transition"
                disabled={!commentInput.trim()}
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                Reply
              </button>
            </form>
          </div>
        ) : activeTab === "polls" ? (
          <div className="space-y-4">
            {polls.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center shadow-xs">
                <BarChart2 className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No active polls in the cohort yet.</p>
                {isLeader && (
                  <button
                    onClick={() => setIsCreatingPoll(true)}
                    className="mt-3 text-xs text-brand font-bold hover:underline cursor-pointer"
                  >
                    Create the first poll!
                  </button>
                )}
              </div>
            ) : (
              polls.map(poll => {
                const isExpired = poll.expiresAt ? new Date(poll.expiresAt).getTime() < Date.now() : false;
                const hasVoted = poll.options.some(opt => opt.votes.includes(user.id));
                const showResults = hasVoted || isExpired;
                const myVoteOptionId = poll.options.find(opt => opt.votes.includes(user.id))?.id;
                const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

                return (
                  <div
                    key={poll.id}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-5 shadow-xs relative group"
                  >
                    {/* Delete button (only for poll author or leader) */}
                    {(user.id === poll.authorId || isLeader) && (
                      <button
                        onClick={() => handleDeletePoll(poll.id)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                        title="Delete Poll"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Header Author Info */}
                    <div className="flex items-center space-x-2.5 mb-3">
                      <img
                        src={poll.authorAvatar}
                        alt={poll.authorName}
                        className="w-9 h-9 rounded-full object-cover border border-zinc-200"
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">{poll.authorName}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${getRoleBadgeColor(poll.authorRole as UserRole)}`}>
                            {poll.authorRole.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(poll.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(poll.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 text-base mb-1 leading-snug">
                      {poll.question}
                    </h3>

                    {poll.expiresAt && (
                      <div className={`flex items-center space-x-1 text-[10px] mb-4 px-2 py-0.5 rounded-full w-fit border ${
                        isExpired 
                          ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30" 
                          : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>
                          {isExpired 
                            ? `Voting closed on ${new Date(poll.expiresAt).toLocaleDateString([], { month: "short", day: "numeric" })} at ${new Date(poll.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : `Expires on ${new Date(poll.expiresAt).toLocaleDateString([], { month: "short", day: "numeric" })} at ${new Date(poll.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          }
                        </span>
                      </div>
                    )}

                    {!poll.expiresAt && <div className="mb-4" />}

                    {!showResults ? (
                      <div className="space-y-2">
                        {poll.options.map(option => (
                          <button
                            key={option.id}
                            onClick={() => handleVote(poll.id, option.id)}
                            className="w-full text-left bg-zinc-50 hover:bg-brand-light/30 dark:bg-zinc-800/45 dark:hover:bg-brand/10 border border-zinc-200/60 dark:border-zinc-800 hover:border-brand/40 px-4 py-3 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center justify-between transition-all duration-200 group"
                          >
                            <span>{option.text}</span>
                            <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 dark:border-zinc-700 group-hover:border-brand flex items-center justify-center text-[10px] text-white"></span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {poll.options.map(option => {
                          const voteCount = option.votes.length;
                          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                          const isMyVote = option.id === myVoteOptionId;

                          return (
                            <div key={option.id} className="relative">
                              <div className="w-full h-11 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl overflow-hidden flex items-center px-4 relative">
                                <div
                                  className={`absolute top-0 left-0 bottom-0 transition-all duration-500 ease-out ${
                                    isMyVote
                                      ? "bg-brand/10 dark:bg-brand/15 border-r border-brand/20"
                                      : "bg-zinc-100 dark:bg-zinc-800/70"
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />

                                <div className="relative z-10 w-full flex items-center justify-between text-xs">
                                  <div className="flex items-center space-x-2">
                                    {isMyVote ? (
                                      <CheckCircle2 className="w-4 h-4 text-brand fill-brand-light dark:fill-brand/10 shrink-0" />
                                    ) : (
                                      <span className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] text-white shrink-0" />
                                    )}
                                    <span className={`font-semibold ${isMyVote ? "text-brand font-bold" : "text-zinc-700 dark:text-zinc-300"}`}>
                                      {option.text}
                                    </span>
                                  </div>
                                  <span className="font-mono text-zinc-500 font-bold shrink-0 pl-2">
                                    {voteCount} {voteCount === 1 ? 'vote' : 'votes'} ({percentage}%)
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px] text-zinc-400">
                          <span>Total participation: {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast</span>
                          {isExpired ? (
                            <span className="font-bold text-red-500 dark:text-red-400">Voting Closed</span>
                          ) : (
                            <button
                              onClick={() => {
                                const updatedPolls = polls.map(p => {
                                  if (p.id === poll.id) {
                                    const cleanedOptions = p.options.map(o => ({
                                      ...o,
                                      votes: o.votes.filter(uid => uid !== user.id)
                                    }));
                                    return { ...p, options: cleanedOptions };
                                  }
                                  return p;
                                });
                                setPolls(updatedPolls);
                              }}
                              className="text-brand hover:underline font-bold cursor-pointer"
                            >
                              Change Vote
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Posts Grid List */}
            {filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center shadow-xs">
                <MessageSquare className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No postings in this space yet.</p>
                <button
                  onClick={() => setIsCreatingPost(true)}
                  className="mt-3 text-xs text-brand font-bold hover:underline cursor-pointer"
                >
                  Be the first to post!
                </button>
              </div>
            ) : (
              filteredPosts.map(post => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-5 hover:border-brand/50 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer relative group"
                >
                  {post.isPinned && (
                    <span className="absolute top-4 right-4 text-accent flex items-center space-x-1 text-[10px] font-bold bg-accent-light dark:bg-accent/15 px-2.5 py-0.5 rounded-full border border-accent/20">
                      <Pin className="w-3 h-3 fill-accent mr-0.5" />
                      Pinned
                    </span>
                  )}

                  {/* Header Author Info */}
                  <div className="flex items-center space-x-2.5 mb-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-9 h-9 rounded-full object-cover border border-zinc-200"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">{post.authorName}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${getRoleBadgeColor(post.authorRole)}`}>
                          {post.authorRole.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(post.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(post.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Content snippet */}
                  <h4 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 text-base mb-1.5 group-hover:text-brand transition duration-150">
                    {post.title}
                  </h4>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-3">
                    <MarkdownRenderer content={post.content} />
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-3 text-zinc-400 text-xs">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={(e) => handleLike(post.id, e)}
                        className={`flex items-center space-x-1.5 hover:text-rose-500 transition duration-150 cursor-pointer ${
                          post.likes.includes(user.id) ? "text-rose-500 font-semibold" : ""
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.likes.includes(user.id) ? "fill-rose-500" : ""}`} />
                        <span>{post.likes.length}</span>
                      </button>
                      <div className="flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comments.length}</span>
                      </div>
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="flex items-center space-x-1 text-zinc-400">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{post.attachments.length}</span>
                        </div>
                      )}
                    </div>

                    {/* Controls (Edit, Delete, Copy Link) */}
                    <div className="flex items-center space-x-2">
                      {post.authorId === user.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPost(post);
                            setEditPostTitle(post.title);
                            setEditPostContent(post.content);
                            setEditPostCategory(post.category as any);
                            setEditPostAttachments(post.attachments || []);
                            setIsEditingPost(true);
                          }}
                          title="Edit Post"
                          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-amber-600 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(post.authorId === user.id || isLeader) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                          title="Delete Post"
                          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => triggerCopyLink(post, e)}
                        className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-brand transition relative cursor-pointer"
                        title="Copy Reference Link"
                      >
                        {shareSuccess === post.id ? (
                          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded">Copied!</span>
                        ) : (
                          <Link className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
