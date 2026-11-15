import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { FileText, AlertCircle, Upload } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const DEFAULT_PDF_URL = '/assets/aistudio/1448-GE-PE-K06-SM1-SCIN_5a500c30.pdf';

let activePdfUrl = DEFAULT_PDF_URL;
let cachedPdfPromise: Promise<pdfjsLib.PDFDocumentProxy> | null = null;

function getPdfDocument(url: string): Promise<pdfjsLib.PDFDocumentProxy> {
  if (!cachedPdfPromise || url !== activePdfUrl) {
    activePdfUrl = url;
    cachedPdfPromise = pdfjsLib.getDocument({ url }).promise;
  }
  return cachedPdfPromise;
}

interface PdfPageCanvasProps {
  pageNumber: number;
}

export const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({ pageNumber }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [customUrl, setCustomUrl] = useState<string>(activePdfUrl);

  useEffect(() => {
    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;

    setStatus('loading');

    (async () => {
      try {
        const pdf = await getPdfDocument(customUrl);
        if (cancelled) return;

        const safePage = Math.max(1, Math.min(pdf.numPages, pageNumber));
        const page = await pdf.getPage(safePage);
        if (cancelled) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = Math.max(container.clientWidth - 8, 280);
        const cssScale = targetWidth / baseViewport.width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const renderViewport = page.getViewport({ scale: cssScale * dpr });
        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(baseViewport.width * cssScale)}px`;
        canvas.style.height = `${Math.floor(baseViewport.height * cssScale)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        renderTask = page.render({
          canvas,
          canvasContext: ctx,
          viewport: renderViewport,
        });

        await renderTask.promise;
        if (!cancelled) {
          setStatus('ready');
        }
      } catch (err) {
        if (!cancelled && (err as { name?: string })?.name !== 'RenderingCancelledException') {
          cachedPdfPromise = null;
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pageNumber, customUrl]);

  const handleSelectLocalPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    cachedPdfPromise = null;
    setCustomUrl(blobUrl);
  };

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center justify-center rounded-lg border border-stone-200 bg-white p-1 overflow-hidden min-h-[380px]">
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50/90 text-stone-600 z-10">
          <FileText className="w-7 h-7 text-teal-700 mb-2" />
          <span className="text-xs font-semibold">جاري عرض صفحة الكتاب الأصلية ({pageNumber})...</span>
        </div>
      )}

      {status === 'error' ? (
        <div className="flex flex-col items-center justify-center p-6 text-center text-stone-600">
          <AlertCircle className="w-7 h-7 text-amber-600 mb-2" />
          <p className="text-sm font-semibold">تعذر تحميل ملف PDF المرفق تلقائيًا.</p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm leading-relaxed">
            يمكنك متابعة «التنسيق التفاعلي» لجميع الصفحات الـ ٢٠٧ (٧ — ٢١٣) أو اختيار ملف PDF الكتاب من جهازك لعرض الصفحة الأصلية.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleSelectLocalPdf}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-teal-700/30 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>اختيار ملف PDF من جهازك</span>
          </button>
        </div>
      ) : (
        <canvas ref={canvasRef} className="rounded shadow-sm max-w-full h-auto block" />
      )}
    </div>
  );
};
