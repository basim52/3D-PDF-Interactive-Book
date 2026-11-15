import React from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { InteractiveQuestion, PageAnswerState } from '../types/book';

interface PageQuizPanelProps {
  pageNumber: number;
  questions: InteractiveQuestion[];
  answers: PageAnswerState;
  onAnswer: (questionId: string, selectedIndex: number, isCorrect: boolean) => void;
  onReset: () => void;
}

export const PageQuizPanel: React.FC<PageQuizPanelProps> = ({
  questions,
  answers,
  onAnswer,
  onReset,
}) => {
  const anyAnswered = questions.some((q) => answers[q.id] !== undefined);

  return (
    <div className="space-y-3">
      {questions.map((q, qIdx) => {
        const answer = answers[q.id];
        const isAnswered = answer !== undefined;

        return (
          <div
            key={q.id}
            className="rounded-lg border border-stone-200 bg-white p-3.5 shadow-2xs"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs sm:text-sm font-bold text-stone-900 leading-relaxed">
                <span className="inline-block ml-1.5 text-teal-800 tabular-nums">
                  س{qIdx + 1}:
                </span>
                {q.prompt}
              </p>
              {q.sourceLabel && (
                <span className="shrink-0 text-[10px] font-medium text-stone-500 mt-0.5">
                  {q.sourceLabel}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {q.options.map((opt, optIdx) => {
                const isSelected = isAnswered && answer.selectedIndex === optIdx;
                const isCorrectOpt = q.correctIndex === optIdx;

                let btnClass =
                  'border-stone-200 bg-stone-50/70 text-stone-800 hover:bg-stone-100 hover:border-stone-300';

                if (isAnswered) {
                  if (isCorrectOpt) {
                    btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
                  } else if (isSelected && !isCorrectOpt) {
                    btnClass = 'border-rose-400 bg-rose-50 text-rose-950';
                  } else {
                    btnClass = 'border-stone-200 bg-white text-stone-400';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => {
                      if (!isAnswered) {
                        onAnswer(q.id, optIdx, optIdx === q.correctIndex);
                      }
                    }}
                    disabled={isAnswered}
                    className={`w-full text-right rounded-md border px-3 py-2 text-xs leading-snug transition-colors flex items-center justify-between gap-2 ${btnClass}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && isCorrectOpt && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrectOpt && (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div
                className={`mt-2.5 rounded-md border px-3 py-2 text-xs leading-relaxed ${
                  answer.isCorrect
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                    : 'border-amber-200 bg-amber-50/70 text-amber-950'
                }`}
              >
                <span className="font-bold ml-1">
                  {answer.isCorrect ? 'إجابة صحيحة:' : 'توضيح الإجابة:'}
                </span>
                <span>{q.explanation}</span>
              </div>
            )}
          </div>
        );
      })}

      {anyAnswered && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة حل أسئلة الصفحة</span>
          </button>
        </div>
      )}
    </div>
  );
};
