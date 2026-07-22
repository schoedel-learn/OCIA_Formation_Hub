import React, { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { BookOpen, CheckCircle, ChevronRight, Award, HelpCircle, AlertCircle, FileText, Lock, Check, Plus, X } from "lucide-react";
import { Lesson, UserProfile } from "../types";
import { OCIA_LESSONS } from "../data/lessons";

interface FormationsProps {
  user: UserProfile;
  completeLesson: (lessonId: string) => void;
  addPoints: (amount: number) => void;
  allLessons?: Lesson[];
}

export default function Formations({ user, completeLesson, addPoints, allLessons }: FormationsProps) {
  const [customLessons, setCustomLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem("ocia_custom_lessons");
    return saved ? JSON.parse(saved) : [];
  });

  const lessons = allLessons || [...OCIA_LESSONS, ...customLessons];

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<boolean | null>(null);
  const [showCertificate, setShowCertificate] = useState<number | null>(null); // Stage index for certificate

  // Resource creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStage, setNewStage] = useState<1 | 2 | 3 | 4>(1);
  const [newDescription, setNewDescription] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newDuration, setNewDuration] = useState(15);
  
  // Custom quiz inside new resource
  const [newQuizQuestion, setNewQuizQuestion] = useState("");
  const [newQuizOpt1, setNewQuizOpt1] = useState("");
  const [newQuizOpt2, setNewQuizOpt2] = useState("");
  const [newQuizOpt3, setNewQuizOpt3] = useState("");
  const [newQuizOpt4, setNewQuizOpt4] = useState("");
  const [newQuizCorrectIdx, setNewQuizCorrectIdx] = useState(0);
  const [newQuizExplanation, setNewQuizExplanation] = useState("");

  const stages = [
    { id: 1, name: "The Period of Evangelization and the Pre-Catechumenate", icon: "🌱", desc: "For seekers exploring the Gospel, asking questions, and seeking truth." },
    { id: 2, name: "The Period of the Catechumenate", icon: "⛪", desc: "Deep instruction in Doctrine, Liturgy, and Christian community life." },
    { id: 3, name: "The Period of Purification and Enlightenment", icon: "🔥", desc: "Spiritual reflection and Lent preparation leading to Sacraments." },
    { id: 4, name: "The Period of Mystagogy", icon: "🕊️", desc: "Post-baptismal deepening of sacramental living and active mission." }
  ];

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newId = "custom-les-" + Math.random().toString(36).substring(2, 9);
    const stageObj = stages.find(s => s.id === newStage);

    const hasQuiz = newQuizQuestion.trim() && newQuizOpt1.trim() && newQuizOpt2.trim();
    const quiz = hasQuiz ? [{
      question: newQuizQuestion.trim(),
      options: [newQuizOpt1.trim(), newQuizOpt2.trim(), ...(newQuizOpt3.trim() ? [newQuizOpt3.trim()] : []), ...(newQuizOpt4.trim() ? [newQuizOpt4.trim()] : [])],
      correctIndex: newQuizCorrectIdx,
      explanation: newQuizExplanation.trim() || "Correct! Keep up the good work studying the catechism teachings."
    }] : undefined;

    const created: Lesson = {
      id: newId,
      title: newTitle.trim(),
      stage: newStage,
      stageName: stageObj ? stageObj.name : "Custom Formation Resource",
      description: newDescription.trim() || "Supplemental study material created by dynamic parish mentors.",
      content: newContent.trim(),
      duration: newDuration,
      quiz
    };

    const updated = [...customLessons, created];
    setCustomLessons(updated);
    localStorage.setItem("ocia_custom_lessons", JSON.stringify(updated));
    addPoints(75); // Reward points for contributing content

    // Reset Form
    setNewTitle("");
    setNewStage(1);
    setNewDescription("");
    setNewContent("");
    setNewDuration(15);
    setNewQuizQuestion("");
    setNewQuizOpt1("");
    setNewQuizOpt2("");
    setNewQuizOpt3("");
    setNewQuizOpt4("");
    setNewQuizCorrectIdx(0);
    setNewQuizExplanation("");
    setShowCreateModal(false);

    alert("Resource has been added to the parish Discipleship & Faith syllabus successfully!");
  };

  const handleQuizSubmit = (lesson: Lesson) => {
    if (!lesson.quiz) return;
    
    let allCorrect = true;
    lesson.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] !== q.correctIndex) {
        allCorrect = false;
      }
    });

    setQuizSubmitted(true);
    setQuizFeedback(allCorrect);

    if (allCorrect) {
      addPoints(100); // 100 points bonus for perfect quiz score!
    } else {
      addPoints(20); // Participation points
    }
  };

  const handleMarkComplete = (lesson: Lesson) => {
    completeLesson(lesson.id);
    addPoints(50); // 50 points for reading the catechism material!
    
    // Check if user completed all lessons in this stage
    const stageLessons = lessons.filter(l => l.stage === lesson.stage);
    const completedStageLessons = stageLessons.filter(l => 
      l.id === lesson.id || user.completedLessons.includes(l.id)
    );

    if (completedStageLessons.length === stageLessons.length) {
      addPoints(150); // 150 points for completing a stage!
      setShowCertificate(lesson.stage);
    }
  };

  const isStageUnlocked = (stageNum: number) => {
    if (stageNum === 1) return true;
    
    // Check if all lessons of the previous stage are completed
    const prevLessons = lessons.filter(l => l.stage === stageNum - 1);
    return prevLessons.every(l => user.completedLessons.includes(l.id));
  };

  return (
    <div id="formations-hub-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      
      {/* Stages and Lessons List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
            <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-base">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Catechumenal Path
            </h3>
            {user.permissions?.canCreateResources && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-1.5 bg-amber-50 dark:bg-amber-950/45 text-amber-800 dark:text-amber-400 rounded-lg border border-amber-200/50 hover:bg-amber-100 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                title="Create resource"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Syllabus Resource</span>
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            Progress sequentially through the four classical stages of the Christian Initiation process.
          </p>

          <div className="space-y-3.5">
            {stages.map((stg) => {
              const unlocked = isStageUnlocked(stg.id);
              const stgLessons = lessons.filter(l => l.stage === stg.id);
              const completedCount = stgLessons.filter(l => user.completedLessons.includes(l.id)).length;
              const percent = stgLessons.length > 0 ? Math.round((completedCount / stgLessons.length) * 100) : 0;

              return (
                <div
                  key={stg.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    unlocked
                      ? "bg-zinc-50 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800"
                      : "bg-zinc-100/45 dark:bg-zinc-950/25 border-zinc-200/50 dark:border-zinc-900 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl shrink-0">{stg.icon}</span>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-zinc-800 dark:text-zinc-200">
                          {stg.name}
                        </h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{stg.desc}</p>
                      </div>
                    </div>
                    {!unlocked && <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-1" />}
                  </div>

                  {unlocked && (
                    <div className="mt-3 space-y-1.5">
                      {/* Progress Bar */}
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mb-1">
                        <span>{completedCount}/{stgLessons.length} lessons</span>
                        <span>{percent}% Complete</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-700 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      {/* Lessons buttons */}
                      <div className="pt-2 space-y-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
                        {stgLessons.map((les) => {
                          const isCompleted = user.completedLessons.includes(les.id);
                          const isPlaying = selectedLesson?.id === les.id;

                          return (
                            <button
                              key={les.id}
                              onClick={() => {
                                setSelectedLesson(les);
                                setQuizAnswers({});
                                setQuizSubmitted(false);
                                setQuizFeedback(null);
                                setShowCertificate(null);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                                isPlaying
                                  ? "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 border border-amber-200/50"
                                  : "text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 border border-transparent"
                              }`}
                            >
                              <span className="flex items-center space-x-1.5 text-left line-clamp-1">
                                {isCompleted ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                )}
                                <span>{les.title}</span>
                              </span>
                              <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                            </button>
                          );
                        })}
                      </div>

                      {percent === 100 && (
                        <button
                          onClick={() => {
                            setShowCertificate(stg.id);
                            setSelectedLesson(null);
                          }}
                          className="w-full mt-2 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer hover:from-amber-700 hover:to-amber-800"
                        >
                          <Award className="w-3.5 h-3.5" /> View Certificate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Course Reader / Player */}
      <div className="lg:col-span-2">
        {showCertificate ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border-4 border-amber-500/30 p-8 shadow-xl text-center relative overflow-hidden animate-scaleIn">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600"></div>
            
            <div className="my-6">
              <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center mx-auto border-2 border-amber-400">
                <Award className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
            </div>

            <p className="text-amber-600 dark:text-amber-400 font-serif font-bold text-xs uppercase tracking-widest">
              Decree of Formation Accomplishment
            </p>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-zinc-900 dark:text-zinc-100 mt-2">
              Certificate of Initiation Progress
            </h2>
            <p className="text-xs text-zinc-400 italic mt-1 font-serif">
              Order of Christian Initiation of Adults
            </p>

            <div className="border-t border-b border-zinc-100 dark:border-zinc-800 py-6 my-6 max-w-md mx-auto">
              <p className="text-xs text-zinc-500">This certifies that</p>
              <h3 className="text-lg font-bold font-serif text-zinc-800 dark:text-zinc-200 mt-1">{user.name}</h3>
              <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
                has successfully completed the complete syllabus, scriptural meditations, and catechism quizzes for the stage of
              </p>
              <h4 className="text-base font-bold text-amber-800 dark:text-amber-400 font-serif mt-1">
                {stages.find(s => s.id === showCertificate)?.name}
              </h4>
            </div>

            <div className="flex justify-between items-center text-[10px] text-zinc-400 max-w-md mx-auto font-serif">
              <div className="text-left">
                <p className="font-mono">Date Accomplished</p>
                <p className="font-semibold text-zinc-600 mt-0.5">{new Date().toLocaleDateString([], { dateStyle: "long" })}</p>
              </div>
              <div className="text-right">
                <p className="italic font-semibold text-zinc-600">Cyril, Spiritual Patron</p>
                <p className="font-mono">Insignia of Mystagogy</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Print Certificate
              </button>
              <button
                onClick={() => {
                  // Social share certificate!
                  const text = `I just completed the ${stages.find(s => s.id === showCertificate)?.name} stage of OCIA! 🎓🌱`;
                  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                  window.open(twitterUrl, "_blank");
                }}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" /> Share Achievement
              </button>
            </div>
          </div>
        ) : selectedLesson ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
              {selectedLesson.stageName}
            </span>
            <h2 className="font-serif font-bold text-2xl text-zinc-900 dark:text-zinc-100 mt-3 mb-2">
              {selectedLesson.title}
            </h2>
            <div className="flex items-center space-x-3 text-xs text-zinc-400 font-mono mb-6">
              <span>Duration: {selectedLesson.duration} mins</span>
              <span>•</span>
              <span>Earn {user.completedLessons.includes(selectedLesson.id) ? "Already Read" : "+50 Points"}</span>
            </div>

            {/* Reading Material with rich typography */}
            <div className="prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed font-serif mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-6">
              <MarkdownRenderer content={selectedLesson.content} />
            </div>

            {/* Completion checkbox & action */}
            {!user.completedLessons.includes(selectedLesson.id) && (
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 mb-6">
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Reflect on the Teaching</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Ready to progress further? Mark this lesson complete.</p>
                </div>
                <button
                  onClick={() => handleMarkComplete(selectedLesson)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition duration-150 flex items-center space-x-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark Complete (+50 pts)</span>
                </button>
              </div>
            )}

            {/* Quiz Section if completed & exists */}
            {selectedLesson.quiz && (
              <div className="bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/50 dark:border-amber-900/40 rounded-xl p-5 mt-6">
                <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-400 mb-4">
                  <HelpCircle className="w-5 h-5 shrink-0" />
                  <h3 className="font-serif font-bold text-base">Interactive Catechesis Quiz</h3>
                </div>

                <div className="space-y-5">
                  {selectedLesson.quiz.map((q, qIdx) => (
                    <div key={qIdx} className="space-y-2">
                      <p className="text-xs font-serif font-semibold text-zinc-800 dark:text-zinc-200">
                        Q{qIdx + 1}: {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = quizAnswers[qIdx] === oIdx;
                          const isCorrect = q.correctIndex === oIdx;

                          let btnStyle = "bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
                          if (isSelected) {
                            btnStyle = "bg-amber-700 text-white border-amber-800";
                          }
                          if (quizSubmitted) {
                            if (isCorrect) {
                              btnStyle = "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900";
                            } else if (isSelected) {
                              btnStyle = "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900";
                            } else {
                              btnStyle = "bg-zinc-100 text-zinc-400 dark:bg-zinc-800/30 dark:text-zinc-600 border-zinc-100 opacity-60";
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => {
                                if (quizSubmitted) return;
                                setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
                              }}
                              disabled={quizSubmitted}
                              className={`w-full text-left text-xs p-3 rounded-lg border font-medium transition duration-150 cursor-pointer ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="bg-white/50 dark:bg-zinc-800/40 p-3 rounded-lg text-[11px] text-zinc-600 dark:text-zinc-400 mt-2 border border-zinc-100">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">Explanation:</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!quizSubmitted ? (
                  <button
                    onClick={() => handleQuizSubmit(selectedLesson)}
                    disabled={Object.keys(quizAnswers).length < (selectedLesson.quiz?.length || 0)}
                    className="w-full mt-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-lg shadow-sm transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Submit Answers
                  </button>
                ) : (
                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-200/50 pt-4">
                    <div className="flex items-center space-x-2">
                      {quizFeedback ? (
                        <div className="flex items-center space-x-1.5 text-emerald-600 font-bold text-xs">
                          <Check className="w-4 h-4" />
                          <span>100% Correct! Earned +100 Points!</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
                          <AlertCircle className="w-4 h-4" />
                          <span>Passed! Review answers to master the doctrine.</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                        setQuizFeedback(null);
                      }}
                      className="text-xs text-amber-800 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                    >
                      Retry Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center shadow-xs flex flex-col justify-center items-center h-full min-h-[400px]">
            <Award className="w-12 h-12 text-zinc-300 mb-3 animate-pulse" />
            <h3 className="font-serif font-bold text-zinc-800 dark:text-zinc-200 text-lg mb-1">Select a Formation Session</h3>
            <p className="text-zinc-400 text-xs max-w-sm leading-relaxed mb-4">
              Choose a lesson on the left to begin reading spiritual reflections, theological context, and testing your doctrinal understanding!
            </p>
          </div>
        )}
      </div>

      {/* Dynamic Resource Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-xl relative my-8 animate-scaleIn">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 mb-5 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-zinc-900 dark:text-zinc-50 text-base leading-tight">Create Syllabus Resource</h4>
                <p className="text-[10px] text-zinc-400">Add supplemental catechism studies, liturgical readings or lessons to the Catechumenal Path</p>
              </div>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 styled-scrollbars text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Resource Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Understanding the Holy Trinity"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 px-3 py-2 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Initiation Stage Placement</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(Number(e.target.value) as any)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 px-3 py-2 outline-none"
                  >
                    <option value={1}>🌱 Stage 1: Evangelization & Pre-Catechumenate</option>
                    <option value={2}>⛪ Stage 2: The Catechumenate</option>
                    <option value={3}>🔥 Stage 3: Purification & Enlightenment</option>
                    <option value={4}>🕊️ Stage 4: Mystagogy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Brief Description</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief single-sentence explanation..."
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 px-3 py-2 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Study Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 px-3 py-2 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Resource Content (Markdown Supported)</label>
                <textarea
                  required
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="### Introduction&#10;Write the core theological instruction here..."
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 p-3 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Collapsible Quiz Builder Section */}
              <div className="border border-amber-100 dark:border-amber-950/60 rounded-xl p-4 bg-amber-50/20 dark:bg-amber-950/10">
                <h5 className="text-xs font-serif font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-3">
                  <HelpCircle className="w-4 h-4" />
                  Doctrinal Quiz Question Builder (Optional)
                </h5>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Quiz Question</label>
                    <input
                      type="text"
                      value={newQuizQuestion}
                      onChange={(e) => setNewQuizQuestion(e.target.value)}
                      placeholder="e.g. What is the source and summit of Christian life?"
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 px-3 py-2 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Option 1</label>
                      <input
                        type="text"
                        value={newQuizOpt1}
                        onChange={(e) => setNewQuizOpt1(e.target.value)}
                        placeholder="Option A (Required)"
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-[11px] text-zinc-800 dark:text-zinc-200 px-2.5 py-1.5 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Option 2</label>
                      <input
                        type="text"
                        value={newQuizOpt2}
                        onChange={(e) => setNewQuizOpt2(e.target.value)}
                        placeholder="Option B (Required)"
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-[11px] text-zinc-800 dark:text-zinc-200 px-2.5 py-1.5 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Option 3</label>
                      <input
                        type="text"
                        value={newQuizOpt3}
                        onChange={(e) => setNewQuizOpt3(e.target.value)}
                        placeholder="Option C (Optional)"
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-[11px] text-zinc-800 dark:text-zinc-200 px-2.5 py-1.5 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Option 4</label>
                      <input
                        type="text"
                        value={newQuizOpt4}
                        onChange={(e) => setNewQuizOpt4(e.target.value)}
                        placeholder="Option D (Optional)"
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-[11px] text-zinc-800 dark:text-zinc-200 px-2.5 py-1.5 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Correct Answer Choice</label>
                      <select
                        value={newQuizCorrectIdx}
                        onChange={(e) => setNewQuizCorrectIdx(Number(e.target.value))}
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 px-3 py-1.5 outline-none"
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400 mb-1 font-mono">Explanation Text</label>
                      <input
                        type="text"
                        value={newQuizExplanation}
                        onChange={(e) => setNewQuizExplanation(e.target.value)}
                        placeholder="Why is this answer correct? Cite Catechism..."
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-[11px] text-zinc-800 dark:text-zinc-200 px-2.5 py-1.5 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  Publish to Path (+75 XP)
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
