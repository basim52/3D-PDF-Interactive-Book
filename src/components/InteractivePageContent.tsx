import React, { useState } from 'react';
import {
  BookOpen,
  FileImage,
  Box,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ArrowLeft,
  BookMarked,
  X,
} from 'lucide-react';
import { BookPageData, ContentBlock, Model3DId, PageAnswerState } from '../types/book';
import { GLOSSARY_TERMS } from '../data/glossary';
import { PdfPageCanvas } from './PdfPageCanvas';
import { PageQuizPanel } from './PageQuizPanel';

interface InteractivePageContentProps {
  page: BookPageData;
  answers: PageAnswerState;
  isBookmarked: boolean;
  onAnswer: (questionId: string, selectedIndex: number, isCorrect: boolean) => void;
  onResetPageQuiz: (questionIds: string[]) => void;
  onToggleBookmark: (pageNumber: number) => void;
  onFocus3D: (modelId: Model3DId, focusPart?: string, title?: string, hint?: string) => void;
  onJumpToPage?: (pageNumber: number) => void;
}

const ACCENT_TOP_LINE: Record<BookPageData['accent'], string> = {
  emerald: 'bg-emerald-700',
  amber: 'bg-amber-600',
  sky: 'bg-sky-700',
  indigo: 'bg-indigo-700',
  rose: 'bg-rose-700',
  teal: 'bg-teal-700',
};

const ACCENT_TEXT: Record<BookPageData['accent'], string> = {
  emerald: 'text-emerald-800',
  amber: 'text-amber-800',
  sky: 'text-sky-800',
  indigo: 'text-indigo-800',
  rose: 'text-rose-800',
  teal: 'text-teal-800',
};

export const InteractivePageContent: React.FC<InteractivePageContentProps> = ({
  page,
  answers,
  isBookmarked,
  onAnswer,
  onResetPageQuiz,
  onToggleBookmark,
  onFocus3D,
  onJumpToPage,
}) => {
  const [displayMode, setDisplayMode] = useState<'interactive' | 'pdf'>('interactive');
  const [activeTerm, setActiveTerm] = useState<string | null>(null);

  const solvedCount = page.questions.filter((q) => answers[q.id] !== undefined).length;
  const correctCount = page.questions.filter((q) => answers[q.id]?.isCorrect).length;
  const activeGlossaryEntry = activeTerm ? GLOSSARY_TERMS[activeTerm] : undefined;

  const renderBlock = (block: ContentBlock, idx: number) => {
    switch (block.kind) {
      case 'verse':
        return (
          <div
            key={idx}
            className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-center"
          >
            <p className="font-classical text-lg leading-loose text-emerald-950">
              {block.text}
            </p>
            <p className="text-xs font-medium text-emerald-700 mt-1">{block.reference}</p>
          </div>
        );

      case 'concept':
        return (
          <div
            key={idx}
            className="rounded-lg border border-stone-200 bg-white/80 px-4 py-3"
          >
            <h4 className={`text-sm font-bold mb-1 ${ACCENT_TEXT[page.accent]}`}>
              {block.title}
            </h4>
            <p className="text-sm leading-relaxed text-stone-700">{block.body}</p>
          </div>
        );

      case 'points':
        return (
          <div
            key={idx}
            className="rounded-lg border border-stone-200 bg-stone-50/70 px-4 py-3"
          >
            <h4 className="text-sm font-bold text-stone-900 mb-2">{block.title}</h4>
            <ul className="space-y-1.5 text-sm text-stone-700">
              {block.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal-700 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'steps':
        return (
          <div
            key={idx}
            className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3"
          >
            <h4 className="text-sm font-bold text-sky-900 mb-2">{block.title}</h4>
            <ol className="space-y-2 text-sm text-stone-800">
              {block.items.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-sky-700 text-white text-xs font-bold shrink-0 tabular-nums mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        );

      case 'vocab':
        return (
          <div
            key={idx}
            className="rounded-lg border border-indigo-200 bg-indigo-50/40 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-indigo-700" />
                <span>المفردات العلمية (اضغط لعرض التعريف)</span>
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {block.terms.map((term) => {
                const selected = activeTerm === term;
                const hasDef = Boolean(GLOSSARY_TERMS[term]);
                return (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setActiveTerm(selected ? null : term)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      selected
                        ? 'border-indigo-700 bg-indigo-700 text-white'
                        : hasDef
                          ? 'border-indigo-200 bg-white text-indigo-900 hover:bg-indigo-100/70'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {term}
                  </button>
                );
              })}
            </div>
            {activeTerm && (
              <div className="mt-2.5 rounded-md border border-indigo-200 bg-white p-3 text-xs text-stone-700">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-indigo-950">{activeTerm}</span>
                  <button
                    type="button"
                    onClick={() => setActiveTerm(null)}
                    className="text-stone-400 hover:text-stone-700"
                    title="إغلاق التعريف"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {activeGlossaryEntry ? (
                  <>
                    <p className="leading-relaxed text-stone-700">
                      {activeGlossaryEntry.definition}
                    </p>
                    {onJumpToPage && activeGlossaryEntry.pageRef !== page.pageNumber && (
                      <button
                        type="button"
                        onClick={() => onJumpToPage(activeGlossaryEntry.pageRef)}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline"
                      >
                        <span>المرجع في الكتاب: صفحة {activeGlossaryEntry.pageRef}</span>
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-stone-600">
                    مصطلح علمي أساسي مشروح ضمن سياق الدرس الحالي في صفحة {page.pageNumber}.
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 'equation':
        return (
          <div
            key={idx}
            className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3"
          >
            <h4 className="text-xs font-bold text-amber-900 mb-2">{block.title}</h4>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-stone-800 bg-white rounded-md border border-amber-100 p-2.5">
              <span className="text-center">{block.left}</span>
              <span className="inline-flex items-center gap-1 text-amber-700 font-bold px-2">
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>{block.arrowLabel}</span>
              </span>
              <span className="text-center text-teal-800">{block.right}</span>
            </div>
          </div>
        );

      case 'table':
        return (
          <div
            key={idx}
            className="rounded-lg border border-stone-200 bg-white overflow-hidden"
          >
            <div className="bg-stone-50 px-3.5 py-2 border-b border-stone-200">
              <h4 className="text-xs font-bold text-stone-800">{block.title}</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/60 text-stone-700">
                    {block.headers.map((h, hi) => (
                      <th key={hi} className="px-3 py-2 font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {block.rows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-stone-50/60">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 text-stone-700 leading-relaxed">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'fact':
        return (
          <div
            key={idx}
            className="rounded-lg border border-teal-200 bg-teal-50/50 px-4 py-3"
          >
            <span className="block text-xs font-bold text-teal-800 mb-1">
              {block.label}
            </span>
            <p className="text-sm text-stone-700 leading-relaxed">{block.text}</p>
          </div>
        );

      case 'prompt_box':
        return (
          <div
            key={idx}
            className="rounded-lg border border-amber-200 bg-amber-50/40 px-4 py-3"
          >
            <h4 className="text-xs font-bold text-amber-900 mb-1">{block.title}</h4>
            <p className="text-sm text-stone-700 leading-relaxed">{block.text}</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Subtle Top Chapter Rule */}
      <div className={`h-1 w-full rounded-t ${ACCENT_TOP_LINE[page.accent]} opacity-85`} />

      {/* Page Header & Unboxed Metadata */}
      <div className="px-4 sm:px-5 pt-3.5 pb-2.5 border-b border-stone-200/80">
        <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-stone-500">
          <div className="truncate">
            <span>{page.unitTitle}</span>
            <span className="mx-1.5 text-stone-300">·</span>
            <span className={ACCENT_TEXT[page.accent]}>{page.chapterTitle}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono font-bold text-stone-700 tabular-nums">
              ص {page.pageNumber}
            </span>
            <button
              type="button"
              onClick={() => onToggleBookmark(page.pageNumber)}
              className="text-stone-400 hover:text-amber-600 transition-colors"
              title={isBookmarked ? 'إزالة العلامة المرجعية' : 'حفظ علامة مرجعية'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-amber-600" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-extrabold text-stone-900 mt-1 leading-snug">
          {page.title}
        </h3>

        {/* Mode Switcher + 3D Launch Toolbar */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-md border border-stone-200 bg-stone-100 p-0.5">
            <button
              type="button"
              onClick={() => setDisplayMode('interactive')}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                displayMode === 'interactive'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>التنسيق التفاعلي</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('pdf')}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                displayMode === 'pdf'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>صفحة PDF الأصلية</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              onFocus3D(
                page.model3dId,
                page.model3dFocusPart,
                page.model3dTitle,
                page.model3dHint,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-teal-700/25 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
          >
            <Box className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[175px]">{page.model3dTitle}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Page Body */}
      <div className="flex-1 overflow-y-auto book-scroll px-4 sm:px-5 py-3.5 space-y-3">
        {displayMode === 'pdf' ? (
          <PdfPageCanvas pageNumber={page.pageNumber} />
        ) : (
          <>
            <p className="text-sm text-stone-700 leading-relaxed bg-stone-50/80 border border-stone-200/80 rounded-lg px-3.5 py-2.5">
              {page.summary}
            </p>

            {/* 3D Sync Callout */}
            <button
              type="button"
              onClick={() =>
                onFocus3D(
                  page.model3dId,
                  page.model3dFocusPart,
                  page.model3dTitle,
                  page.model3dHint,
                )
              }
              className="w-full text-right rounded-lg border border-teal-200 bg-teal-50/35 hover:bg-teal-50/80 px-3.5 py-2.5 transition-colors flex items-start gap-2.5"
            >
              <Box className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-teal-900">
                  تزامن الشرح ثلاثي الأبعاد: {page.model3dTitle}
                </div>
                <p className="text-xs text-stone-600 mt-0.5 leading-snug">
                  {page.model3dHint}
                </p>
              </div>
            </button>

            {page.blocks.map((b, i) => renderBlock(b, i))}
          </>
        )}

        {/* Per-Page Interactive Questions Section (always attached to page) */}
        <div className="pt-2 border-t border-stone-200">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <h4 className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>أسئلة تفاعلية — صفحة {page.pageNumber}</span>
            </h4>
            <span className="text-xs font-semibold text-stone-600 tabular-nums">
              {correctCount} / {page.questions.length} صحيح
              {solvedCount < page.questions.length && ` · متبقي ${page.questions.length - solvedCount}`}
            </span>
          </div>

          <PageQuizPanel
            pageNumber={page.pageNumber}
            questions={page.questions}
            answers={answers}
            onAnswer={onAnswer}
            onReset={() => onResetPageQuiz(page.questions.map((q) => q.id))}
          />
        </div>
      </div>

      {/* Page Footer */}
      <div className="px-4 sm:px-5 py-2 border-t border-stone-200/80 bg-stone-50/70 flex items-center justify-between text-[11px] text-stone-500">
        <span className="truncate">{page.lessonTitle || page.chapterTitle}</span>
        <span className="font-mono font-bold text-stone-700 tabular-nums">
          {page.pageNumber} / ٢١٣
        </span>
      </div>
    </div>
  );
};
