import React, { useMemo, useState } from 'react';
import {
  X,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCw,
  Shuffle,
  Award,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { ALL_BOOK_PAGES, CHAPTER_NAV_GROUPS } from '../data/chapters/index';
import { GLOSSARY_TERMS } from '../data/glossary';
import { InteractiveQuestion, PageAnswerState } from '../types/book';

interface StudentStudyHubModalProps {
  isOpen: boolean;
  answers: PageAnswerState;
  visitedPages: number[];
  notes: Record<number, string>;
  masteredTerms: string[];
  onClose: () => void;
  onJumpToPage: (pageNumber: number) => void;
  onAnswer: (questionId: string, selectedIndex: number, isCorrect: boolean) => void;
  onToggleMasteredTerm: (term: string) => void;
}

interface QuestionWithContext {
  pageNumber: number;
  pageTitle: string;
  chapterTitle: string;
  question: InteractiveQuestion;
}

export const StudentStudyHubModal: React.FC<StudentStudyHubModalProps> = ({
  isOpen,
  answers,
  visitedPages,
  notes,
  masteredTerms,
  onClose,
  onJumpToPage,
  onAnswer,
  onToggleMasteredTerm,
}) => {
  const [tab, setTab] = useState<'overview' | 'mistakes' | 'quiz' | 'flashcards'>('overview');

  // Chapter Quick Quiz State
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [quizPool, setQuizPool] = useState<QuestionWithContext[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizResponses, setQuizResponses] = useState<Record<string, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);

  // Flashcards State
  const [cardFilter, setCardFilter] = useState<'all' | 'review'>('all');
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  const chapterStats = useMemo(() => {
    return CHAPTER_NAV_GROUPS.map((grp) => {
      const pages = ALL_BOOK_PAGES.filter(
        (p) => p.pageNumber >= grp.startPage && p.pageNumber <= grp.endPage,
      );
      const totalQ = pages.reduce((acc, p) => acc + p.questions.length, 0);
      const correctQ = pages.reduce(
        (acc, p) => acc + p.questions.filter((q) => answers[q.id]?.isCorrect).length,
        0,
      );
      const visitedInChapter = pages.filter((p) => visitedPages.includes(p.pageNumber)).length;
      return {
        ...grp,
        totalPages: pages.length,
        visitedPages: visitedInChapter,
        totalQ,
        correctQ,
      };
    });
  }, [answers, visitedPages]);

  const mistakeList = useMemo<QuestionWithContext[]>(() => {
    const out: QuestionWithContext[] = [];
    for (const page of ALL_BOOK_PAGES) {
      for (const q of page.questions) {
        const ans = answers[q.id];
        if (ans && !ans.isCorrect) {
          out.push({
            pageNumber: page.pageNumber,
            pageTitle: page.title,
            chapterTitle: page.chapterTitle,
            question: q,
          });
        }
      }
    }
    return out;
  }, [answers]);

  const notesList = useMemo(() => {
    return Object.entries(notes)
      .filter(([, txt]) => txt.trim().length > 0)
      .map(([numStr, txt]) => {
        const pageNumber = parseInt(numStr, 10);
        const page = ALL_BOOK_PAGES.find((p) => p.pageNumber === pageNumber);
        return {
          pageNumber,
          title: page?.title ?? `صفحة ${pageNumber}`,
          text: txt,
        };
      })
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }, [notes]);

  const flashcardDeck = useMemo(() => {
    const allTerms = Object.values(GLOSSARY_TERMS);
    if (cardFilter === 'review') {
      return allTerms.filter((t) => !masteredTerms.includes(t.term));
    }
    return allTerms;
  }, [cardFilter, masteredTerms]);

  const startPracticeQuiz = (chapterId: string) => {
    const grp = CHAPTER_NAV_GROUPS.find((g) => g.id === chapterId);
    const sourcePages = grp
      ? ALL_BOOK_PAGES.filter((p) => p.pageNumber >= grp.startPage && p.pageNumber <= grp.endPage)
      : ALL_BOOK_PAGES;

    const allQuestions: QuestionWithContext[] = [];
    for (const p of sourcePages) {
      for (const q of p.questions) {
        allQuestions.push({
          pageNumber: p.pageNumber,
          pageTitle: p.title,
          chapterTitle: p.chapterTitle,
          question: q,
        });
      }
    }

    // Fisher-Yates shuffle & pick 10
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    setSelectedChapterId(chapterId);
    setQuizPool(allQuestions.slice(0, 10));
    setQuizIdx(0);
    setQuizResponses({});
    setQuizFinished(false);
    setTab('quiz');
  };

  if (!isOpen) return null;

  const totalQuestions = ALL_BOOK_PAGES.reduce((s, p) => s + p.questions.length, 0);
  const totalCorrect = Object.values(answers).filter((a) => a.isCorrect).length;
  const overallPct = Math.round((totalCorrect / Math.max(totalQuestions, 1)) * 100);

  const activeCard = flashcardDeck[cardIndex % Math.max(flashcardDeck.length, 1)];
  const currentQuizItem = quizPool[quizIdx];
  const quizCorrectCount = quizPool.filter(
    (item) => quizResponses[item.question.id] === item.question.correctIndex,
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-5">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl border border-stone-200 bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-teal-700 text-white">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-stone-900">
                مركز المذاكرة والاختبار الذكي
              </h2>
              <p className="text-xs text-stone-500">
                إنجاز المنهج · بنك الأخطاء · اختبار تدريبي · بطاقات استذكار المصطلحات
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-200/70 hover:text-stone-900 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-2.5 border-b border-stone-200 bg-white flex items-center gap-4 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors ${
              tab === 'overview'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            ملخص التقدم وملاحظاتي
          </button>
          <button
            type="button"
            onClick={() => setTab('mistakes')}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              tab === 'mistakes'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <span>بنك الأخطاء للمراجعة</span>
            <span className="font-mono tabular-nums text-[11px] text-rose-700">
              ({mistakeList.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (quizPool.length === 0) startPracticeQuiz('all');
              else setTab('quiz');
            }}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors ${
              tab === 'quiz'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            اختبار تدريبي (١٠ أسئلة)
          </button>
          <button
            type="button"
            onClick={() => setTab('flashcards')}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors ${
              tab === 'flashcards'
                ? 'border-indigo-700 text-indigo-800'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            بطاقات الاستذكار ({masteredTerms.length}/{Object.keys(GLOSSARY_TERMS).length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 book-scroll bg-[#faf9f6]">
          {tab === 'overview' && (
            <>
              {/* Top Stats Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs font-semibold text-stone-500">نسبة إتقان الأسئلة</p>
                  <p className="text-2xl font-extrabold text-teal-800 mt-1 tabular-nums">
                    {overallPct}٪
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5 tabular-nums">
                    {totalCorrect} من {totalQuestions} سؤالاً صحيحًا
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs font-semibold text-stone-500">الصفحات المتصفحة</p>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1 tabular-nums">
                    {visitedPages.length} / ٢١٣
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5">صفحة من الكتاب المدرسي</p>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs font-semibold text-stone-500">أسئلة تحتاج مراجعة</p>
                  <p className="text-2xl font-extrabold text-rose-700 mt-1 tabular-nums">
                    {mistakeList.length}
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('mistakes')}
                    className="text-xs font-bold text-teal-700 hover:underline mt-0.5"
                  >
                    افتح بنك الأخطاء الآن ←
                  </button>
                </div>
              </div>

              {/* Chapter Progress + Quick Launch Quiz per Chapter */}
              <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-stone-900">
                    التقدم حسب الفصول والاختبار السريع
                  </h3>
                  <button
                    type="button"
                    onClick={() => startPracticeQuiz('all')}
                    className="inline-flex items-center gap-1 rounded-md bg-teal-700 px-3 py-1 text-xs font-bold text-white hover:bg-teal-800 transition-colors"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>اختبار شامل للمنهج</span>
                  </button>
                </div>
                <div className="divide-y divide-stone-100">
                  {chapterStats.map((ch) => {
                    const qPct = Math.round((ch.correctQ / Math.max(ch.totalQ, 1)) * 100);
                    return (
                      <div
                        key={ch.id}
                        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                              {ch.title}
                            </span>
                            <span className="text-xs font-mono text-stone-600 tabular-nums shrink-0">
                              {ch.correctQ}/{ch.totalQ} سؤال · {ch.visitedPages}/{ch.totalPages} ص
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                            <div
                              className="h-full bg-teal-600 transition-all"
                              style={{ width: `${qPct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              onJumpToPage(ch.startPage);
                              onClose();
                            }}
                            className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                          >
                            اقرأ (ص {ch.startPage})
                          </button>
                          <button
                            type="button"
                            onClick={() => startPracticeQuiz(ch.id)}
                            className="rounded-md border border-teal-700/30 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100"
                          >
                            اختبرني
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Saved Student Notes List */}
              <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-200 bg-stone-50">
                  <h3 className="text-sm font-extrabold text-stone-900">
                    ملاحظاتي الشخصية المسجلة على الصفحات ({notesList.length})
                  </h3>
                </div>
                {notesList.length === 0 ? (
                  <p className="p-4 text-xs text-stone-500">
                    لم تدون ملاحظات بعد. افتح أي صفحة واضغط «ملاحظاتي على الصفحة» لتدوين ملخصاتك.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {notesList.map((n) => (
                      <div key={n.pageNumber} className="p-3.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-stone-900">
                            ص {n.pageNumber}: {n.title}
                          </div>
                          <p className="text-xs text-stone-700 mt-1 leading-relaxed whitespace-pre-line">
                            {n.text}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onJumpToPage(n.pageNumber);
                            onClose();
                          }}
                          className="shrink-0 text-xs font-bold text-teal-700 hover:underline"
                        >
                          انتقل للصفحة
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'mistakes' && (
            <div className="space-y-3">
              {mistakeList.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-8 text-center">
                  <Award className="w-10 h-10 text-emerald-700 mx-auto mb-2" />
                  <h3 className="text-base font-extrabold text-emerald-950">
                    لا توجد أخطاء مسجلة حاليًا!
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    كل الأسئلة التي أجبت عنها حتى الآن صحيحة، أو يمكنك إطلاق اختبار تدريبي لاختبار معلوماتك.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs text-stone-600 bg-white border border-stone-200 rounded-lg px-3.5 py-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      اضغط على الإجابة الصحيحة لتصحيح خطئك وإزالته من قائمة المراجعة، أو انتقل لصفحة الكتاب لقراءة الشرح.
                    </span>
                  </div>

                  {mistakeList.map((item) => (
                    <div
                      key={item.question.id}
                      className="rounded-xl border border-stone-200 bg-white p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500">
                        <span>
                          {item.chapterTitle} · {item.pageTitle}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onJumpToPage(item.pageNumber);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 font-bold text-teal-700 hover:underline shrink-0"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>راجع الشرح (ص {item.pageNumber})</span>
                        </button>
                      </div>

                      <p className="text-sm font-bold text-stone-900">{item.question.prompt}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {item.question.options.map((opt, idx) => {
                          const prevSel = answers[item.question.id]?.selectedIndex === idx;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                onAnswer(item.question.id, idx, idx === item.question.correctIndex)
                              }
                              className={`text-right rounded-md border px-3 py-2 text-xs transition-colors ${
                                prevSel
                                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                                  : 'border-stone-200 bg-stone-50 text-stone-800 hover:bg-teal-50 hover:border-teal-400'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-xs text-stone-600 bg-stone-50 rounded-md px-3 py-2 border border-stone-200">
                        <span className="font-bold text-stone-800 ml-1">التوضيح:</span>
                        {item.question.explanation}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === 'quiz' && (
            <div className="space-y-4">
              {/* Chapter selector bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3">
                <div className="flex items-center gap-2 text-xs">
                  <label htmlFor="quiz-chapter-select" className="font-bold text-stone-800">
                    نطاق الاختبار:
                  </label>
                  <select
                    id="quiz-chapter-select"
                    value={selectedChapterId}
                    onChange={(e) => startPracticeQuiz(e.target.value)}
                    className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-800"
                  >
                    <option value="all">جميع فصول الكتاب (١ — ٢١٣)</option>
                    {CHAPTER_NAV_GROUPS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => startPracticeQuiz(selectedChapterId)}
                  className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>أسئلة جديدة عشوائية</span>
                </button>
              </div>

              {quizFinished ? (
                <div className="rounded-xl border border-teal-200 bg-white p-6 text-center space-y-3">
                  <Award className="w-12 h-12 text-amber-500 mx-auto" />
                  <h3 className="text-xl font-extrabold text-stone-900">
                    نتيجتك في الاختبار التدريبي: {quizCorrectCount} من {quizPool.length}
                  </h3>
                  <p className="text-sm text-stone-600">
                    النسبة المئوية: {Math.round((quizCorrectCount / Math.max(quizPool.length, 1)) * 100)}٪
                    {quizCorrectCount >= 8
                      ? ' — أداء ممتاز! استمر على هذا التفوق.'
                      : ' — عمل رائع! راجع الأسئلة الخاطئة في بنك الأخطاء لتثبيت المعلومة.'}
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => startPracticeQuiz(selectedChapterId)}
                      className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800"
                    >
                      ابدأ اختبارًا جديدًا
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('mistakes')}
                      className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100"
                    >
                      راجع أخطائي
                    </button>
                  </div>
                </div>
              ) : currentQuizItem ? (
                <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-bold text-teal-800 tabular-nums">
                      السؤال {quizIdx + 1} من {quizPool.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToPage(currentQuizItem.pageNumber);
                        onClose();
                      }}
                      className="text-stone-500 hover:text-teal-700 underline"
                    >
                      مرجع صفحة {currentQuizItem.pageNumber}
                    </button>
                  </div>

                  <p className="text-base font-extrabold text-stone-900 leading-relaxed">
                    {currentQuizItem.question.prompt}
                  </p>

                  <div className="space-y-2">
                    {currentQuizItem.question.options.map((opt, oIdx) => {
                      const chosen = quizResponses[currentQuizItem.question.id];
                      const answered = chosen !== undefined;
                      const isCorrectOpt = oIdx === currentQuizItem.question.correctIndex;
                      const isSel = chosen === oIdx;

                      let cls =
                        'border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100';
                      if (answered) {
                        if (isCorrectOpt)
                          cls = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                        else if (isSel)
                          cls = 'border-rose-400 bg-rose-50 text-rose-900';
                        else cls = 'border-stone-200 bg-white text-stone-400';
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={answered}
                          onClick={() => {
                            setQuizResponses((prev) => ({
                              ...prev,
                              [currentQuizItem.question.id]: oIdx,
                            }));
                            onAnswer(
                              currentQuizItem.question.id,
                              oIdx,
                              oIdx === currentQuizItem.question.correctIndex,
                            );
                          }}
                          className={`w-full text-right rounded-lg border px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${cls}`}
                        >
                          <span>{opt}</span>
                          {answered && isCorrectOpt && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {answered && isSel && !isCorrectOpt && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizResponses[currentQuizItem.question.id] !== undefined && (
                    <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 text-xs text-stone-800 leading-relaxed">
                      <span className="font-bold text-teal-900 ml-1">التفسير العلمي:</span>
                      {currentQuizItem.question.explanation}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <span className="text-xs font-semibold text-stone-600 tabular-nums">
                      النقاط الحالية: {quizCorrectCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (quizIdx + 1 < quizPool.length) {
                          setQuizIdx((i) => i + 1);
                        } else {
                          setQuizFinished(true);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800"
                    >
                      <span>
                        {quizIdx + 1 < quizPool.length ? 'السؤال التالي' : 'عرض النتيجة النهائية'}
                      </span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {tab === 'flashcards' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setCardFilter('all');
                      setCardIndex(0);
                      setCardFlipped(false);
                    }}
                    className={`rounded-md px-3 py-1.5 ${
                      cardFilter === 'all' ? 'bg-indigo-700 text-white' : 'text-stone-600'
                    }`}
                  >
                    كل المصطلحات ({Object.keys(GLOSSARY_TERMS).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCardFilter('review');
                      setCardIndex(0);
                      setCardFlipped(false);
                    }}
                    className={`rounded-md px-3 py-1.5 ${
                      cardFilter === 'review' ? 'bg-indigo-700 text-white' : 'text-stone-600'
                    }`}
                  >
                    تحتاج حفظًا ({Object.keys(GLOSSARY_TERMS).length - masteredTerms.length})
                  </button>
                </div>

                {flashcardDeck.length > 0 && (
                  <span className="text-xs font-mono text-stone-600 tabular-nums">
                    بطاقة {(cardIndex % flashcardDeck.length) + 1} من {flashcardDeck.length}
                  </span>
                )}
              </div>

              {!activeCard ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                  <Sparkles className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                  <p className="text-sm font-extrabold text-emerald-950">
                    أحسنت! أتقنت جميع مصطلحات المنهج العلمية.
                  </p>
                </div>
              ) : (
                <div className="max-w-xl mx-auto space-y-3">
                  <button
                    type="button"
                    onClick={() => setCardFlipped((f) => !f)}
                    className="w-full min-h-[220px] rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-sm hover:border-indigo-400 transition-all flex flex-col items-center justify-center text-center"
                  >
                    <span className="text-[11px] font-bold text-indigo-700 mb-2">
                      {cardFlipped ? 'التعريف العلمي (اضغط للقلب)' : 'المصطلح العلمي (اضغط لكشف التعريف)'}
                    </span>
                    {!cardFlipped ? (
                      <h3 className="text-2xl font-extrabold text-stone-900">
                        {activeCard.term}
                      </h3>
                    ) : (
                      <p className="text-base leading-relaxed text-stone-800 font-medium">
                        {activeCard.definition}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-xs text-stone-400">
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>مرجع الكتاب: صفحة {activeCard.pageRef}</span>
                    </span>
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCardIndex(
                          (i) => (i - 1 + flashcardDeck.length) % flashcardDeck.length,
                        );
                        setCardFlipped(false);
                      }}
                      className="rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
                    >
                      السابقة
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleMasteredTerm(activeCard.term)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-bold transition-colors ${
                        masteredTerms.includes(activeCard.term)
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {masteredTerms.includes(activeCard.term)
                          ? 'تم الحفظ والإتقان ✓'
                          : 'علّم كمصطلح متقن'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCardIndex((i) => (i + 1) % flashcardDeck.length);
                        setCardFlipped(false);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-800"
                    >
                      <span>التالية</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
