import React, { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft, BookOpen, Compass } from 'lucide-react';
import { Model3DId, PageAnswerState } from '../types/book';
import { getPageByNumber, getSpreadForPage, TOTAL_BOOK_PAGES } from '../data/chapters/index';
import { InteractivePageContent } from './InteractivePageContent';

interface OpenBook3DProps {
  currentPage: number;
  answers: PageAnswerState;
  bookmarks: number[];
  notes: Record<number, string>;
  tiltEnabled: boolean;
  onNavigatePage: (pageNumber: number) => void;
  onAnswer: (questionId: string, selectedIndex: number, isCorrect: boolean) => void;
  onResetPageQuiz: (questionIds: string[]) => void;
  onToggleBookmark: (pageNumber: number) => void;
  onSaveNote: (pageNumber: number, text: string) => void;
  onFocus3D: (modelId: Model3DId, focusPart?: string, title?: string, hint?: string) => void;
}

export const OpenBook3D: React.FC<OpenBook3DProps> = ({
  currentPage,
  answers,
  bookmarks,
  notes,
  tiltEnabled,
  onNavigatePage,
  onAnswer,
  onResetPageQuiz,
  onToggleBookmark,
  onSaveNote,
  onFocus3D,
}) => {
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward' | null>(null);
  const [flipAngle, setFlipAngle] = useState(0);
  const [mobileSide, setMobileSide] = useState<'right' | 'left'>('right');

  const spread = getSpreadForPage(currentPage);
  const rightData = spread.rightPage ? getPageByNumber(spread.rightPage) : undefined;
  const leftData = spread.leftPage ? getPageByNumber(spread.leftPage) : undefined;

  useEffect(() => {
    // Keep mobile single-page view aligned with whatever page number user jumped to
    if (spread.rightPage === currentPage) {
      setMobileSide('right');
    } else if (spread.leftPage === currentPage) {
      setMobileSide('left');
    }
  }, [currentPage, spread.rightPage, spread.leftPage]);

  const triggerFlip = (dir: 'forward' | 'backward', targetPage: number) => {
    if (flipDirection) return;
    setFlipDirection(dir);
    setFlipAngle(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlipAngle(dir === 'forward' ? 180 : -180);
      });
    });
    window.setTimeout(() => {
      onNavigatePage(targetPage);
      setFlipDirection(null);
      setFlipAngle(0);
    }, 360);
  };

  const handleNextSpread = () => {
    if (currentPage === 1) {
      triggerFlip('forward', 2);
      return;
    }
    const nextRight = (spread.rightPage ?? 2) + 2;
    if (nextRight <= TOTAL_BOOK_PAGES) {
      triggerFlip('forward', nextRight);
    }
  };

  const handlePrevSpread = () => {
    if (currentPage <= 1) return;
    if (spread.rightPage === 2) {
      triggerFlip('backward', 1);
      return;
    }
    const prevRight = Math.max(2, (spread.rightPage ?? 2) - 2);
    triggerFlip('backward', prevRight);
  };

  const progressRatio = currentPage / TOTAL_BOOK_PAGES;
  const rightThicknessPx = Math.max(3, Math.round(progressRatio * 14));
  const leftThicknessPx = Math.max(3, Math.round((1 - progressRatio) * 14));

  const isCover = currentPage === 1;
  const hasPrev = currentPage > 1;
  const hasNext = isCover ? true : (spread.leftPage ?? TOTAL_BOOK_PAGES) < TOTAL_BOOK_PAGES;

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D Perspective Stage */}
      <div className="book-stage w-full">
        <div
          className="book-3d-shell relative mx-auto w-full rounded-2xl border border-stone-300/90 bg-gradient-to-b from-emerald-950 via-teal-950 to-stone-900 p-2 sm:p-3 shadow-[0_24px_55px_-15px_rgba(15,23,42,0.32)]"
          style={{
            transform: tiltEnabled ? 'rotateX(3.5deg)' : 'rotateX(0deg)',
          }}
        >
          {isCover && leftData ? (
            /* Front Cover 3D Standalone View (Page 1) */
            <div className="relative mx-auto max-w-[580px] rounded-xl border border-stone-200 bg-[#fffdf8] shadow-inner overflow-hidden h-[640px] flex flex-col">
              <div className="bg-gradient-to-l from-teal-800 to-emerald-900 px-5 py-3 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-bold">غلاف الكتاب المدرسي التفاعلي — ص ١</span>
                </div>
                <button
                  type="button"
                  onClick={handleNextSpread}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-3 py-1 text-xs font-extrabold text-stone-950 hover:bg-amber-300 transition-colors"
                >
                  <span>فتح الكتاب</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <InteractivePageContent
                  page={leftData}
                  answers={answers}
                  isBookmarked={bookmarks.includes(leftData.pageNumber)}
                  pageNote={notes[leftData.pageNumber] ?? ''}
                  onSaveNote={onSaveNote}
                  onAnswer={onAnswer}
                  onResetPageQuiz={onResetPageQuiz}
                  onToggleBookmark={onToggleBookmark}
                  onFocus3D={onFocus3D}
                  onJumpToPage={onNavigatePage}
                />
              </div>
            </div>
          ) : (
            /* Open Two-Page RTL Book Spread */
            <div className="relative flex flex-col lg:flex-row items-stretch">
              {/* Mobile Page Toggle Bar */}
              <div className="flex lg:hidden items-center justify-between gap-2 mb-2 px-1">
                <div className="flex rounded-lg bg-stone-900/60 p-0.5 border border-white/10 w-full">
                  {rightData && (
                    <button
                      type="button"
                      onClick={() => setMobileSide('right')}
                      className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-colors ${
                        mobileSide === 'right'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-200 hover:text-white'
                      }`}
                    >
                      الصفحة اليمنى (ص {rightData.pageNumber})
                    </button>
                  )}
                  {leftData && (
                    <button
                      type="button"
                      onClick={() => setMobileSide('left')}
                      className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-colors ${
                        mobileSide === 'left'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-200 hover:text-white'
                      }`}
                    >
                      الصفحة اليسرى (ص {leftData.pageNumber})
                    </button>
                  )}
                </div>
              </div>

              {/* Stacked Page Edges — Outer Right (Progress Indicator) */}
              <div
                className="hidden lg:block shrink-0 rounded-r-lg bg-gradient-to-l from-stone-200 via-stone-100 to-stone-300 border-y border-r border-stone-300"
                style={{ width: `${rightThicknessPx}px` }}
                aria-hidden="true"
              />

              {/* RIGHT PAGE (Even Pages: 2, 4, 6...) */}
              <div
                className={`book-page-surface page-gutter-right flex-1 min-w-0 bg-[#fffdf8] lg:rounded-r-lg border border-stone-200/90 h-[620px] xl:h-[660px] flex flex-col overflow-hidden ${
                  mobileSide === 'right' ? 'flex' : 'hidden lg:flex'
                }`}
              >
                {rightData ? (
                  <InteractivePageContent
                    page={rightData}
                    answers={answers}
                    isBookmarked={bookmarks.includes(rightData.pageNumber)}
                    pageNote={notes[rightData.pageNumber] ?? ''}
                    onSaveNote={onSaveNote}
                    onAnswer={onAnswer}
                    onResetPageQuiz={onResetPageQuiz}
                    onToggleBookmark={onToggleBookmark}
                    onFocus3D={onFocus3D}
                    onJumpToPage={onNavigatePage}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
                    نهاية الفصل
                  </div>
                )}
              </div>

              {/* CENTER 3D SPINE GUTTER */}
              <div
                className="hidden lg:flex w-4 shrink-0 bg-gradient-to-r from-stone-400/50 via-stone-700/40 to-stone-400/50 items-center justify-center relative z-10"
                aria-hidden="true"
              >
                <div className="w-px h-full bg-stone-900/25" />
              </div>

              {/* LEFT PAGE (Odd Pages: 3, 5, 7...) */}
              <div
                className={`book-page-surface page-gutter-left flex-1 min-w-0 bg-[#fffdf8] lg:rounded-l-lg border border-stone-200/90 h-[620px] xl:h-[660px] flex flex-col overflow-hidden ${
                  mobileSide === 'left' || !rightData ? 'flex' : 'hidden lg:flex'
                }`}
              >
                {leftData ? (
                  <InteractivePageContent
                    page={leftData}
                    answers={answers}
                    isBookmarked={bookmarks.includes(leftData.pageNumber)}
                    pageNote={notes[leftData.pageNumber] ?? ''}
                    onSaveNote={onSaveNote}
                    onAnswer={onAnswer}
                    onResetPageQuiz={onResetPageQuiz}
                    onToggleBookmark={onToggleBookmark}
                    onFocus3D={onFocus3D}
                    onJumpToPage={onNavigatePage}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500">
                    <Compass className="w-10 h-10 text-teal-700 mb-3" />
                    <p className="font-bold text-stone-800">خاتمة الكتاب المدرسي</p>
                    <p className="text-xs mt-1">أتممت استعراض الصفحات الـ ٢١٣ كاملة.</p>
                  </div>
                )}
              </div>

              {/* Stacked Page Edges — Outer Left (Remaining Pages) */}
              <div
                className="hidden lg:block shrink-0 rounded-l-lg bg-gradient-to-r from-stone-200 via-stone-100 to-stone-300 border-y border-l border-stone-300"
                style={{ width: `${leftThicknessPx}px` }}
                aria-hidden="true"
              />

              {/* Animated 3D Page-Flip Sheet Overlay */}
              {flipDirection && (
                <div
                  className="pointer-events-none hidden lg:block absolute top-0 bottom-0 z-30"
                  style={{
                    width: 'calc(50% - 14px)',
                    left: flipDirection === 'forward' ? '14px' : undefined,
                    right: flipDirection === 'backward' ? '14px' : undefined,
                    transformOrigin: flipDirection === 'forward' ? 'right center' : 'left center',
                    transform: `rotateY(${flipAngle}deg)`,
                    transition: 'transform 0.36s cubic-bezier(0.22, 1, 0.36, 1)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className="book-flip-face absolute inset-0 rounded-lg border border-stone-300 bg-[#fdfaf1] shadow-2xl flex items-center justify-center">
                    <span className="text-xs font-bold text-stone-400">جاري تقليب الصفحة...</span>
                  </div>
                  <div className="book-flip-face book-flip-face-back absolute inset-0 rounded-lg border border-stone-300 bg-[#f9f5e8] shadow-2xl" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Spread Turn Navigation Bar */}
      <div className="mt-3 w-full flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-xs">
        <button
          type="button"
          onClick={handlePrevSpread}
          disabled={!hasPrev}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          <span>الصفحة السابقة</span>
        </button>

        <div className="flex items-center gap-3 text-xs text-stone-600">
          {isCover ? (
            <span className="font-bold text-stone-900 tabular-nums">الغلاف · صفحة ١ من ٢١٣</span>
          ) : (
            <span className="font-bold text-stone-900 tabular-nums">
              الصفحتان {spread.rightPage} — {spread.leftPage ?? 'النهاية'} من ٢١٣
            </span>
          )}
          <span className="hidden sm:inline text-stone-400">|</span>
          <span className="hidden sm:inline text-[11px] text-stone-500">
            استخدم الأسهم ← → في لوحة المفاتيح لتقليب الصفحات
          </span>
        </div>

        <button
          type="button"
          onClick={handleNextSpread}
          disabled={!hasNext}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span>الصفحة التالية</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
