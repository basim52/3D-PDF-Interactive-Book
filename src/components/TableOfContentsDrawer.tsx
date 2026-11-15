import React, { useMemo, useState } from 'react';
import { X, Search, BookOpen, CheckCircle2, BookmarkCheck, ArrowLeft } from 'lucide-react';
import { CHAPTER_NAV_GROUPS, ALL_BOOK_PAGES } from '../data/chapters/index';
import { GLOSSARY_TERMS } from '../data/glossary';
import { PageAnswerState } from '../types/book';

interface TableOfContentsDrawerProps {
  isOpen: boolean;
  initialTab?: 'toc' | 'glossary' | 'bookmarks';
  currentPage: number;
  answers: PageAnswerState;
  bookmarks: number[];
  onClose: () => void;
  onSelectPage: (pageNumber: number) => void;
}

export const TableOfContentsDrawer: React.FC<TableOfContentsDrawerProps> = ({
  isOpen,
  initialTab = 'toc',
  currentPage,
  answers,
  bookmarks,
  onClose,
  onSelectPage,
}) => {
  const [tab, setTab] = useState<'toc' | 'glossary' | 'bookmarks'>(initialTab);
  const [query, setQuery] = useState('');
  const [jumpInput, setJumpInput] = useState('');

  React.useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);

  const pageCompletion = useMemo(() => {
    const map = new Map<number, { total: number; correct: number }>();
    for (const p of ALL_BOOK_PAGES) {
      const total = p.questions.length;
      const correct = p.questions.filter((q) => answers[q.id]?.isCorrect).length;
      map.set(p.pageNumber, { total, correct });
    }
    return map;
  }, [answers]);

  const filteredGlossary = useMemo(() => {
    const q = query.trim();
    const list = Object.values(GLOSSARY_TERMS);
    if (!q) return list;
    return list.filter(
      (item) => item.term.includes(q) || item.definition.includes(q),
    );
  }, [query]);

  const filteredPages = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return ALL_BOOK_PAGES.filter(
      (p) =>
        p.title.includes(q) ||
        p.summary.includes(q) ||
        p.chapterTitle.includes(q) ||
        String(p.pageNumber) === q,
    ).slice(0, 24);
  }, [query]);

  if (!isOpen) return null;

  const handleDirectJump = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(jumpInput, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 213) {
      onSelectPage(n);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-slate-950/45">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-stone-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-stone-200 flex items-center justify-between gap-2 bg-stone-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-extrabold text-stone-900">فهرس الكتاب والمعجم</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-500 hover:bg-stone-200/70 hover:text-stone-900 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct Jump + Search */}
        <div className="p-3 border-b border-stone-200 space-y-2.5 bg-white">
          <form onSubmit={handleDirectJump} className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={213}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder="انتقال سريع لصفحة (١ — ٢١٣)"
              className="flex-1 rounded-md border border-stone-200 px-3 py-1.5 text-xs focus:outline-none focus:border-teal-600"
            />
            <button
              type="submit"
              className="rounded-md bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors"
            >
              انتقال
            </button>
          </form>

          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-2.5 top-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === 'glossary' ? 'ابحث في المصطلحات العلمية...' : 'ابحث عن درس أو عنوان صفحة...'
              }
              className="w-full rounded-md border border-stone-200 pr-8 pl-3 py-1.5 text-xs focus:outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex rounded-lg border border-stone-200 bg-stone-100 p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTab('toc')}
              className={`flex-1 rounded-md py-1.5 transition-colors ${
                tab === 'toc' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              الفهرس (٢١٣ ص)
            </button>
            <button
              type="button"
              onClick={() => setTab('glossary')}
              className={`flex-1 rounded-md py-1.5 transition-colors ${
                tab === 'glossary' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              المعجم ({Object.keys(GLOSSARY_TERMS).length})
            </button>
            <button
              type="button"
              onClick={() => setTab('bookmarks')}
              className={`flex-1 rounded-md py-1.5 transition-colors ${
                tab === 'bookmarks' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              العلامات ({bookmarks.length})
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 book-scroll">
          {tab === 'toc' && query.trim() ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-500">نتائج البحث في الصفحات:</p>
              {filteredPages.length === 0 ? (
                <p className="text-xs text-stone-500 py-4 text-center">لم يُعثر على صفحات مطابقة.</p>
              ) : (
                filteredPages.map((p) => (
                  <button
                    key={p.pageNumber}
                    type="button"
                    onClick={() => {
                      onSelectPage(p.pageNumber);
                      onClose();
                    }}
                    className="w-full text-right rounded-lg border border-stone-200 bg-white p-2.5 hover:bg-teal-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-stone-900">
                      <span className="truncate">{p.title}</span>
                      <span className="font-mono text-teal-800 shrink-0">ص {p.pageNumber}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5 truncate">{p.chapterTitle}</p>
                  </button>
                ))
              )}
            </div>
          ) : tab === 'toc' ? (
            <div className="space-y-3">
              {CHAPTER_NAV_GROUPS.map((grp) => {
                const pagesRange = Array.from(
                  { length: grp.endPage - grp.startPage + 1 },
                  (_, i) => grp.startPage + i,
                );
                const solvedInChapter = pagesRange.filter((n) => {
                  const stat = pageCompletion.get(n);
                  return stat && stat.correct === stat.total && stat.total > 0;
                }).length;

                return (
                  <div
                    key={grp.id}
                    className="rounded-xl border border-stone-200 bg-white overflow-hidden"
                  >
                    <div className="bg-stone-50 px-3.5 py-2.5 border-b border-stone-200 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-medium text-stone-500">{grp.unitTitle}</p>
                        <h3 className="text-xs font-extrabold text-stone-900">{grp.title}</h3>
                      </div>
                      <span className="text-[11px] font-semibold text-teal-800 tabular-nums shrink-0">
                        ص {grp.startPage}—{grp.endPage} · ({solvedInChapter}/{pagesRange.length})
                      </span>
                    </div>

                    <div className="p-2.5 space-y-1.5">
                      {grp.lessons.map((lesson) => (
                        <button
                          key={lesson.page}
                          type="button"
                          onClick={() => {
                            onSelectPage(lesson.page);
                            onClose();
                          }}
                          className="w-full text-right rounded-md px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-teal-50 hover:text-teal-900 flex items-center justify-between gap-2 transition-colors"
                        >
                          <span className="truncate">{lesson.title}</span>
                          <span className="font-mono text-[11px] text-stone-500 shrink-0">
                            ص {lesson.page}
                          </span>
                        </button>
                      ))}

                      {/* Mini Page Grid for Instant Click to Every Page */}
                      <div className="pt-2 mt-1 border-t border-stone-100 flex flex-wrap gap-1">
                        {pagesRange.map((num) => {
                          const active = num === currentPage;
                          const stat = pageCompletion.get(num);
                          const mastered = stat && stat.correct === stat.total && stat.total > 0;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                onSelectPage(num);
                                onClose();
                              }}
                              title={`صفحة ${num}`}
                              className={`w-7 h-7 rounded text-[11px] font-mono tabular-nums transition-colors ${
                                active
                                  ? 'bg-teal-700 text-white font-bold'
                                  : mastered
                                    ? 'bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300'
                                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : tab === 'glossary' ? (
            <div className="space-y-2">
              {filteredGlossary.map((entry) => (
                <div
                  key={entry.term}
                  className="rounded-lg border border-stone-200 bg-white p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-indigo-950">{entry.term}</span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPage(entry.pageRef);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline"
                    >
                      <span>ص {entry.pageRef}</span>
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{entry.definition}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {bookmarks.length === 0 ? (
                <div className="text-center py-10 text-stone-500 text-xs">
                  <BookmarkCheck className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  لم تقم بحفظ علامات مرجعية بعد. اضغط على أيقونة العلامة أعلى أي صفحة لحفظها هنا.
                </div>
              ) : (
                bookmarks
                  .slice()
                  .sort((a, b) => a - b)
                  .map((num) => {
                    const p = ALL_BOOK_PAGES.find((item) => item.pageNumber === num);
                    if (!p) return null;
                    const stat = pageCompletion.get(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          onSelectPage(num);
                          onClose();
                        }}
                        className="w-full text-right rounded-lg border border-stone-200 bg-white p-3 hover:bg-amber-50/40 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-stone-900 truncate">{p.title}</div>
                          <div className="text-[11px] text-stone-500 truncate mt-0.5">
                            {p.chapterTitle}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5 text-xs font-mono font-bold text-teal-800">
                          {stat && stat.correct === stat.total && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>ص {num}</span>
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
