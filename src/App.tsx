import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Box,
  Layers,
  List,
  BookMarked,
  SlidersHorizontal,
} from 'lucide-react';
import { ALL_BOOK_PAGES, getPageByNumber, getSpreadForPage, TOTAL_BOOK_PAGES } from './data/chapters/index';
import { Model3DId, StudentProgress } from './types/book';
import { OpenBook3D } from './components/OpenBook3D';
import { Science3DStage } from './components/Science3DStage';
import { TableOfContentsDrawer } from './components/TableOfContentsDrawer';

type ViewMode = 'split' | 'book' | 'lab3d';

const STORAGE_KEY = 'science_g6_3d_book_progress_v1';

const DEFAULT_PROGRESS: StudentProgress = {
  answers: {},
  visitedPages: [1],
  bookmarks: [],
};

function loadProgress(): StudentProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<StudentProgress>;
    return {
      answers: parsed.answers ?? {},
      visitedPages: Array.isArray(parsed.visitedPages) ? parsed.visitedPages : [1],
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function App() {
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('science_g6_last_page');
      const num = saved ? parseInt(saved, 10) : 1;
      return !Number.isNaN(num) && num >= 1 && num <= TOTAL_BOOK_PAGES ? num : 1;
    } catch {
      return 1;
    }
  });

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [tiltEnabled, setTiltEnabled] = useState(true);
  const [progress, setProgress] = useState<StudentProgress>(loadProgress);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'toc' | 'glossary' | 'bookmarks'>('toc');

  const currentPageData = useMemo(
    () => getPageByNumber(currentPage) ?? ALL_BOOK_PAGES[0],
    [currentPage],
  );

  const [active3D, setActive3D] = useState<{
    modelId: Model3DId;
    focusPart?: string;
    title?: string;
    hint?: string;
  }>(() => ({
    modelId: currentPageData.model3dId,
    focusPart: currentPageData.model3dFocusPart,
    title: currentPageData.model3dTitle,
    hint: currentPageData.model3dHint,
  }));

  // Persist progress & last page
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      localStorage.setItem('science_g6_last_page', String(currentPage));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress, currentPage]);

  // Keep 3D stage synced whenever page changes
  useEffect(() => {
    const spread = getSpreadForPage(currentPage);
    const primaryNum = spread.rightPage ?? spread.leftPage ?? currentPage;
    const primaryData = getPageByNumber(primaryNum) ?? currentPageData;
    setActive3D({
      modelId: primaryData.model3dId,
      focusPart: primaryData.model3dFocusPart,
      title: primaryData.model3dTitle,
      hint: primaryData.model3dHint,
    });
  }, [currentPage, currentPageData]);

  const handleNavigatePage = useCallback((targetPage: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_BOOK_PAGES, targetPage));
    setCurrentPage(clamped);
    const spread = getSpreadForPage(clamped);
    setProgress((prev) => {
      const nextVisited = new Set(prev.visitedPages);
      if (spread.rightPage) nextVisited.add(spread.rightPage);
      if (spread.leftPage) nextVisited.add(spread.leftPage);
      return { ...prev, visitedPages: Array.from(nextVisited) };
    });
  }, []);

  // Arabic RTL keyboard navigation: ArrowLeft advances forward, ArrowRight goes back
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const spread = getSpreadForPage(currentPage);
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentPage === 1) handleNavigatePage(2);
        else if ((spread.rightPage ?? 2) + 2 <= TOTAL_BOOK_PAGES) {
          handleNavigatePage((spread.rightPage ?? 2) + 2);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentPage <= 1) return;
        if (spread.rightPage === 2) handleNavigatePage(1);
        else handleNavigatePage(Math.max(2, (spread.rightPage ?? 2) - 2));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentPage, handleNavigatePage]);

  const handleAnswer = useCallback(
    (questionId: string, selectedIndex: number, isCorrect: boolean) => {
      setProgress((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: { selectedIndex, isCorrect },
        },
      }));
    },
    [],
  );

  const handleResetPageQuiz = useCallback((questionIds: string[]) => {
    setProgress((prev) => {
      const nextAnswers = { ...prev.answers };
      for (const id of questionIds) {
        delete nextAnswers[id];
      }
      return { ...prev, answers: nextAnswers };
    });
  }, []);

  const handleToggleBookmark = useCallback((pageNumber: number) => {
    setProgress((prev) => {
      const exists = prev.bookmarks.includes(pageNumber);
      return {
        ...prev,
        bookmarks: exists
          ? prev.bookmarks.filter((n) => n !== pageNumber)
          : [...prev.bookmarks, pageNumber],
      };
    });
  }, []);

  const handleFocus3D = useCallback(
    (modelId: Model3DId, focusPart?: string, title?: string, hint?: string) => {
      setActive3D({ modelId, focusPart, title, hint });
      if (viewMode === 'book') {
        setViewMode('split');
      }
    },
    [viewMode],
  );

  const stats = useMemo(() => {
    const totalQuestions = ALL_BOOK_PAGES.reduce((sum, p) => sum + p.questions.length, 0);
    const entries = Object.values(progress.answers);
    const correct = entries.filter((a) => a.isCorrect).length;
    return {
      totalQuestions,
      answered: entries.length,
      correct,
    };
  }, [progress.answers]);

  const spread = getSpreadForPage(currentPage);
  const rightSpreadPage = spread.rightPage ? getPageByNumber(spread.rightPage) : undefined;
  const leftSpreadPage = spread.leftPage ? getPageByNumber(spread.leftPage) : undefined;

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-stone-900 flex flex-col">
      {/* 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Title */}
        <button
          type="button"
          onClick={() => handleNavigatePage(1)}
          className="flex items-center gap-2.5 text-right whitespace-nowrap shrink-0"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-700 text-white">
            <BookOpen className="w-4 h-4" />
          </span>
          <span className="font-display font-extrabold text-sm sm:text-base text-stone-900">
            العلوم · الصف السادس ٣D
          </span>
        </button>

        {/* Zone 2: Navigation & View Mode Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold whitespace-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`inline-flex items-center gap-1.5 py-1 border-b-2 transition-colors ${
              viewMode === 'split'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>الكتاب + الشرح ٣D</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('book')}
            className={`inline-flex items-center gap-1.5 py-1 border-b-2 transition-colors ${
              viewMode === 'book'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>الكتاب المفتوح</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('lab3d')}
            className={`inline-flex items-center gap-1.5 py-1 border-b-2 transition-colors ${
              viewMode === 'lab3d'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>المجسم ٣D لوحده</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDrawerTab('toc');
              setDrawerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 py-1 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <List className="w-3.5 h-3.5" />
            <span>الفهرس</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDrawerTab('glossary');
              setDrawerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 py-1 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>المعجم</span>
          </button>
        </nav>

        {/* Zone 3: Score Summary & Primary Action */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-600 tabular-nums">
            <span>الأسئلة:</span>
            <span className="font-bold text-teal-800">
              {stats.correct} / {stats.totalQuestions}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setTiltEnabled((t) => !t)}
            className="hidden lg:inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
            title="تبديل ميل المنظور الثلاثي الأبعاد للكتاب"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{tiltEnabled ? 'منظور مائل ٣D' : 'منظور مسطح'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDrawerTab('toc');
              setDrawerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors"
          >
            <List className="w-3.5 h-3.5" />
            <span>انتقل لصفحة</span>
          </button>
        </div>
      </header>

      {/* Mobile Compact View Bar */}
      <div className="flex md:hidden items-center justify-between gap-2 px-4 py-2 border-b border-stone-200 bg-white text-xs font-bold">
        <button
          type="button"
          onClick={() => setViewMode('split')}
          className={`flex-1 py-1 rounded ${viewMode === 'split' ? 'bg-teal-700 text-white' : 'text-stone-600'}`}
        >
          الكتاب + ٣D
        </button>
        <button
          type="button"
          onClick={() => setViewMode('book')}
          className={`flex-1 py-1 rounded ${viewMode === 'book' ? 'bg-teal-700 text-white' : 'text-stone-600'}`}
        >
          الكتاب
        </button>
        <button
          type="button"
          onClick={() => setViewMode('lab3d')}
          className={`flex-1 py-1 rounded ${viewMode === 'lab3d' ? 'bg-teal-700 text-white' : 'text-stone-600'}`}
        >
          المجسم ٣D
        </button>
      </div>

      {/* Main Stage */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-5 py-4 space-y-4">
        {/* Interactive 3D Scientific Viewport (Shown in Split or Lab3D mode) */}
        {(viewMode === 'split' || viewMode === 'lab3d') && (
          <section aria-label="المختبر ثلاثي الأبعاد">
            {/* Switch between Right Page / Left Page 3D Model when open spread has two different focuses */}
            {currentPage >= 2 && (rightSpreadPage || leftSpreadPage) && (
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <span className="font-bold text-stone-800">الشرح ثلاثي الأبعاد المرتبط بالصفحة:</span>
                  {rightSpreadPage && (
                    <button
                      type="button"
                      onClick={() =>
                        handleFocus3D(
                          rightSpreadPage.model3dId,
                          rightSpreadPage.model3dFocusPart,
                          rightSpreadPage.model3dTitle,
                          rightSpreadPage.model3dHint,
                        )
                      }
                      className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                        active3D.title === rightSpreadPage.model3dTitle &&
                        active3D.focusPart === rightSpreadPage.model3dFocusPart
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      مجسم ص {rightSpreadPage.pageNumber}: {rightSpreadPage.model3dTitle}
                    </button>
                  )}
                  {leftSpreadPage && (
                    <button
                      type="button"
                      onClick={() =>
                        handleFocus3D(
                          leftSpreadPage.model3dId,
                          leftSpreadPage.model3dFocusPart,
                          leftSpreadPage.model3dTitle,
                          leftSpreadPage.model3dHint,
                        )
                      }
                      className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                        active3D.title === leftSpreadPage.model3dTitle &&
                        active3D.focusPart === leftSpreadPage.model3dFocusPart
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      مجسم ص {leftSpreadPage.pageNumber}: {leftSpreadPage.model3dTitle}
                    </button>
                  )}
                </div>
              </div>
            )}

            <Science3DStage
              modelId={active3D.modelId}
              focusPartKey={active3D.focusPart}
              titleOverride={active3D.title}
              hintOverride={active3D.hint}
              compact={viewMode === 'split'}
              isSoloMode={viewMode === 'lab3d'}
              onToggleSoloMode={() =>
                setViewMode((prev) => (prev === 'lab3d' ? 'split' : 'lab3d'))
              }
            />
          </section>
        )}

        {/* 3D Open Book Spread (Shown in Split or Book mode) */}
        {(viewMode === 'split' || viewMode === 'book') && (
          <section aria-label="الكتاب المفتوح ثلاثي الأبعاد">
            <OpenBook3D
              currentPage={currentPage}
              answers={progress.answers}
              bookmarks={progress.bookmarks}
              tiltEnabled={tiltEnabled}
              onNavigatePage={handleNavigatePage}
              onAnswer={handleAnswer}
              onResetPageQuiz={handleResetPageQuiz}
              onToggleBookmark={handleToggleBookmark}
              onFocus3D={handleFocus3D}
            />
          </section>
        )}
      </main>

      {/* Table of Contents, Search & Glossary Drawer */}
      <TableOfContentsDrawer
        isOpen={drawerOpen}
        initialTab={drawerTab}
        currentPage={currentPage}
        answers={progress.answers}
        bookmarks={progress.bookmarks}
        onClose={() => setDrawerOpen(false)}
        onSelectPage={handleNavigatePage}
      />
    </div>
  );
}

export default App;
