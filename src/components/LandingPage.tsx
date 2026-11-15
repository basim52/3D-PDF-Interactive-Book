import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Box,
  CheckCircle2,
  Compass,
  FileText,
  GraduationCap,
  Layers,
  Microscope,
  NotebookPen,
  Search,
  Volume2,
} from 'lucide-react';
import {
  ALL_BOOK_PAGES,
  CHAPTER_NAV_GROUPS,
  MAX_BOOK_PAGE,
  MIN_BOOK_PAGE,
  TOTAL_BOOK_PAGES,
} from '../data/chapters/index';
import { GLOSSARY_TERMS } from '../data/glossary';
import { Model3DId, PageAnswerState } from '../types/book';
import { Science3DStage } from './Science3DStage';
import heroBookImg from '../assets/images/hero_science_book_3d_1794728460346.jpg';
import cellPlateImg from '../assets/images/curriculum_cell_botany_1794728459545.jpg';
import earthPlateImg from '../assets/images/curriculum_earth_solar_1794728460704.jpg';

interface LandingPageProps {
  savedPage: number;
  answers: PageAnswerState;
  visitedPages: number[];
  onEnterBook: (pageNumber?: number, mode?: 'split' | 'book' | 'lab3d') => void;
  onOpenStudyHub: () => void;
}

interface FeaturedModelItem {
  id: Model3DId;
  title: string;
  unitLabel: string;
  description: string;
  pageRef: number;
}

const HERO_IMAGE_SRC = heroBookImg;
const CELL_PLATE_SRC = cellPlateImg;
const EARTH_PLATE_SRC = earthPlateImg;

const FEATURED_3D_MODELS: FeaturedModelItem[] = [
  {
    id: 'animal_plant_cell',
    title: 'الخلية النباتية والخلية الحيوانية',
    unitLabel: 'الوحدة الأولى · الفصل الأول',
    description:
      'قارن بين الجدار الخلوي والبلاستيدات الخضراء والفجوة العصارية في الخلية النباتية وبين عضيات الخلية الحيوانية مع إمكانية تفكيك الأجزاء.',
    pageRef: 32,
  },
  {
    id: 'human_systems_1',
    title: 'أجهزة جسم الإنسان (الهضم والدوران والتنفس)',
    unitLabel: 'الوحدة الثانية · الفصل الرابع',
    description:
      'استكشف مسار الهواء إلى الرئتين، ونبض القلب في الجهاز الدوري، وتكامل أعضاء الهضم والإخراج في نموذج تشريحي ثلاثي الأبعاد.',
    pageRef: 108,
  },
  {
    id: 'ecosystems_pyramid',
    title: 'هرم الطاقة والسلاسل الغذائية',
    unitLabel: 'الوحدة الثالثة · الفصل الخامس',
    description:
      'شاهد انتقال الطاقة من المنتجات إلى المستهلكات الأولية فالثانوية وتناقصها عبر مستويات الهرم البيئي.',
    pageRef: 138,
  },
  {
    id: 'comet_method',
    title: 'مذنب هالي والطريقة العلمية',
    unitLabel: 'الاستهلال · أعمل كالعلماء',
    description:
      'تتبع المدار الإهليلجي لمذنب هالي حول الشمس ولاحظ تغير طول الذيل الغازي مع الاقتراب من حرارة الشمس.',
    pageRef: 7,
  },
];

const ARABIC_CHAPTER_INDEX = ['٠١', '٠٢', '٠٣', '٠٤', '٠٥', '٠٦', '٠٧', '٠٨'];

export const LandingPage: React.FC<LandingPageProps> = ({
  savedPage,
  answers,
  visitedPages,
  onEnterBook,
  onOpenStudyHub,
}) => {
  const [selectedModel, setSelectedModel] = useState<FeaturedModelItem>(FEATURED_3D_MODELS[0]);
  const [glossarySearch, setGlossarySearch] = useState('');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [cellImgFailed, setCellImgFailed] = useState(false);
  const [earthImgFailed, setEarthImgFailed] = useState(false);

  const metrics = useMemo(() => {
    const totalQuestions = ALL_BOOK_PAGES.reduce((sum, p) => sum + p.questions.length, 0);
    const totalTerms = Object.keys(GLOSSARY_TERMS).length;
    const answeredCount = Object.keys(answers).length;
    const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
    const validVisited = visitedPages.filter((p) => p >= MIN_BOOK_PAGE && p <= MAX_BOOK_PAGE).length;
    return {
      totalQuestions,
      totalTerms,
      answeredCount,
      correctCount,
      validVisited,
    };
  }, [answers, visitedPages]);

  const previewTerms = useMemo(() => {
    const q = glossarySearch.trim();
    const list = Object.values(GLOSSARY_TERMS);
    if (!q) return list.slice(0, 6);
    return list
      .filter((entry) => entry.term.includes(q) || entry.definition.includes(q))
      .slice(0, 6);
  }, [glossarySearch]);

  const hasSavedProgress = savedPage > MIN_BOOK_PAGE || metrics.answeredCount > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="font-display font-extrabold text-base sm:text-lg tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
          >
            العلوم · الصف السادس
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="أقسام الصفحة الرئيسية"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#models3d"
              className="hover:text-teal-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              المجسمات ٣D
            </a>
            <a
              href="#chapters"
              className="hover:text-teal-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              خريطة الفصول
            </a>
            <a
              href="#tools"
              className="hover:text-teal-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              أدوات الطالب
            </a>
            <a
              href="#glossary-preview"
              className="hover:text-teal-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              المعجم العلمي
            </a>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onEnterBook(hasSavedProgress ? savedPage : MIN_BOOK_PAGE, 'split')}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              <span>{hasSavedProgress ? 'متابعة الكتاب التفاعلي' : 'افتح الكتاب التفاعلي'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* SECTION 1: Hero Proposition + 16:9 Visual Showcase + Full-Width Proof Strip */}
        <section className="border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Text Proposition Column */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-8">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                    <span>منهج العلوم المدرسي</span>
                    <span aria-hidden="true">·</span>
                    <span>الصف السادس الابتدائي — الجزء الأول</span>
                    <span aria-hidden="true">·</span>
                    <span>طبعة ١٤٤٨هـ</span>
                  </div>

                  <h1 className="font-display font-extrabold text-slate-900 leading-[1.18] tracking-tight text-[clamp(2.15rem,3.8vw,3.35rem)]">
                    كتاب العلوم المفتوح بشرحٍ تفاعلي ثلاثي الأبعاد
                  </h1>

                  <p className="text-base sm:text-lg text-slate-600 leading-[1.7] max-w-xl">
                    تجربة رقمية متكاملة تحاكي الكتاب المدرسي المفتوح من اليمين إلى اليسار عبر{' '}
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {TOTAL_BOOK_PAGES} صفحة
                    </span>{' '}
                    دراسية منسّقة، مع{' '}
                    <span className="font-semibold text-slate-900">
                      ١٢ مجسمًا علميًا ثلاثي الأبعاد
                    </span>{' '}
                    وأسئلة فورية وتفسير علمي لكل صفحة.
                  </p>
                </div>

                {/* Primary CTA + Secondary Contextual Action */}
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEnterBook(MIN_BOOK_PAGE, 'split')}
                      className="inline-flex items-center gap-2.5 rounded-lg bg-teal-700 px-6 py-3 text-sm font-bold text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>ابدأ تصفح الكتاب (من صفحة {MIN_BOOK_PAGE})</span>
                    </button>

                    {hasSavedProgress ? (
                      <button
                        type="button"
                        onClick={() => onEnterBook(savedPage, 'split')}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>متابعة القراءة (ص {savedPage})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEnterBook(MIN_BOOK_PAGE, 'lab3d')}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Box className="w-4 h-4 text-teal-700" />
                        <span>استعراض المجسمات ٣D لوحدها</span>
                      </button>
                    )}
                  </div>

                  {/* Quiet Reading Progress Summary if student already started */}
                  {hasSavedProgress && (
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 pt-1">
                      <span className="font-semibold text-teal-800">
                        تقدمك المسجّل:
                      </span>
                      <span className="tabular-nums">
                        تصفّحت {metrics.validVisited} من {TOTAL_BOOK_PAGES} صفحة
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        أجبت عن {metrics.correctCount} سؤالًا صحيحًا
                      </span>
                      <button
                        type="button"
                        onClick={onOpenStudyHub}
                        className="font-bold text-teal-700 hover:underline"
                      >
                        افتح مركز المذاكرة ←
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Hero 16:9 Editorial Visual Showcase Column */}
              <div className="lg:col-span-6">
                <div className="relative h-full min-h-[300px] lg:min-h-[420px] rounded-xl border border-slate-200 bg-slate-900 overflow-hidden">
                  {!heroImgFailed ? (
                    <img
                      src={HERO_IMAGE_SRC}
                      alt="كتاب العلوم المفتوح مع المجهر البصري والمنشور الزجاجي على طاولة المختبر"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full lg:h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-8 text-center text-white">
                      <Microscope className="w-12 h-12 text-amber-400 mb-3" />
                      <p className="font-display font-bold text-lg">
                        مختبر العلوم المفتوح ثلاثي الأبعاد
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        صفحات تفاعلية ومجسمات تشريحية وفلكية للمرحلة الابتدائية
                      </p>
                    </div>
                  )}

                  {/* Measured Contrast Scrim Overlay */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent p-6 pt-16 text-white">
                    <p className="font-classical text-base sm:text-lg text-amber-200">
                      «نتعلّم لنعمل» — من الملاحظة العلمية إلى استكشاف الخلية والبيئة
                    </p>
                    <p className="text-xs text-slate-200 mt-1 tabular-nums">
                      الصفحات {MIN_BOOK_PAGE} — {MAX_BOOK_PAGE} · عرض تفاعلي متزامن مع ملف الكتاب الأصلي
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Curriculum Proof Strip */}
            <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="space-y-1">
                <p className="font-mono text-2xl sm:text-3xl font-semibold text-slate-900 tabular-nums">
                  {TOTAL_BOOK_PAGES}
                </p>
                <p className="text-sm font-bold text-slate-800">صفحة دراسية تفاعلية</p>
                <p className="text-xs text-slate-500 tabular-nums">
                  من صفحة {MIN_BOOK_PAGE} إلى {MAX_BOOK_PAGE} بتصفح عربي
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-mono text-2xl sm:text-3xl font-semibold text-teal-800 tabular-nums">
                  {metrics.totalQuestions}
                </p>
                <p className="text-sm font-bold text-slate-800">سؤالًا تفاعليًا بمصحح فوري</p>
                <p className="text-xs text-slate-500">
                  سؤالان فأكثر لكل صفحة مع التفسير العلمي
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-mono text-2xl sm:text-3xl font-semibold text-slate-900 tabular-nums">
                  12
                </p>
                <p className="text-sm font-bold text-slate-800">مجسمًا علميًا ثلاثي الأبعاد</p>
                <p className="text-xs text-slate-500">
                  تدوير، تفكيك الأجزاء، ووضع إخفاء النصوص
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-mono text-2xl sm:text-3xl font-semibold text-amber-700 tabular-nums">
                  {metrics.totalTerms}
                </p>
                <p className="text-sm font-bold text-slate-800">مصطلحًا في المعجم التفاعلي</p>
                <p className="text-xs text-slate-500">
                  تعريفات فورية وبطاقات استذكار مرتبطة بالصفحة
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Live Interactive 3D Laboratory Showcase */}
        <section id="models3d" className="py-14 lg:py-20 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-bold text-teal-800">
                  ٠١. المختبر التفاعلي الثلاثي الأبعاد
                </p>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
                  حرّك المجسمات العلمية وفكّك أجزاءها مباشرة قبل بدء القراءة
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  اختر أحد النماذج التالية لتجربة التفاعل الحي، أو اضغط على «المجسم لوحده» و«إخفاء الكلام» لفحص التكوين الهندسي دون تشويش.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onEnterBook(selectedModel.pageRef, 'split')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors self-start md:self-auto whitespace-nowrap shrink-0"
              >
                <span>افتح درس «{selectedModel.title}» (ص {selectedModel.pageRef})</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Interactive Selector Rail (Right side in RTL) */}
              <div className="lg:col-span-4 space-y-2.5">
                {FEATURED_3D_MODELS.map((item) => {
                  const active = item.id === selectedModel.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedModel(item)}
                      className={`w-full text-right rounded-xl border p-4 transition-colors ${
                        active
                          ? 'border-teal-700 bg-white shadow-xs'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span>{item.unitLabel}</span>
                        <span className="font-mono tabular-nums text-teal-800 font-semibold">
                          ص {item.pageRef}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 mt-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Live WebGL Viewport */}
              <div className="lg:col-span-8">
                <Science3DStage
                  modelId={selectedModel.id}
                  titleOverride={selectedModel.title}
                  hintOverride={selectedModel.description}
                  compact={false}
                  isSoloMode={false}
                  onToggleSoloMode={() => onEnterBook(selectedModel.pageRef, 'lab3d')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Visual Curriculum Plates + Complete 8-Chapter Index */}
        <section id="chapters" className="py-14 lg:py-20 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-10">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-bold text-teal-800">
                ٠٢. هيكل المنهج وخريطة الوحدات الدراسية
              </p>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
                ثلاث وحدات علمية متدرجة من الخلية المجهرية حتى موارد الكوكب
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                انتقل مباشرة إلى أي فصل أو درس ليُفتح أمامك الكتاب على الصفحة المطلوبة مع المجسم الثلاثي الأبعاد المطابق لموضوعها.
              </p>
            </div>

            {/* Asymmetric Visual Plates Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Primary Plate (7 columns) */}
              <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-[#F8FAFC] overflow-hidden flex flex-col">
                <div className="aspect-[16/10] w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                  {!cellImgFailed ? (
                    <img
                      src={CELL_PLATE_SRC}
                      alt="لوحة علمية توضيحية لتركيب الخلية النباتية وأنسجة الخشب واللحاء"
                      referrerPolicy="no-referrer"
                      onError={() => setCellImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-teal-800 bg-emerald-50">
                      <Microscope className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">
                      الوحدتان الأولى والثانية · الفصول ١ — ٤ · صفحات ١٩ — ١٣٢
                    </p>
                    <h3 className="font-display font-extrabold text-xl text-slate-900">
                      تنوع الحياة وعمليات الخلايا والنباتات وجسم الإنسان
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      يستكشف الطالب تركيب الخلية النباتية والحيوانية، والانقسام المتساوي والمنصف، والوراثة، والبناء الضوئي، وصولًا إلى أجهزة الهضم والتنفس والدوران والحركة في الإنسان.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => onEnterBook(19, 'split')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:underline"
                    >
                      <span>ابدأ الوحدة الأولى (ص ١٩)</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnterBook(75, 'split')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-teal-800 hover:underline"
                    >
                      <span>ابدأ الوحدة الثانية (ص ٧٥)</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Secondary Plate (5 columns) */}
              <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-[#F8FAFC] overflow-hidden flex flex-col">
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                  {!earthImgFailed ? (
                    <img
                      src={EARTH_PLATE_SRC}
                      alt="لوحة علمية للأنظمة البيئية ونطاقات التربة وطاقة الرياح المتجددة"
                      referrerPolicy="no-referrer"
                      onError={() => setEarthImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-700 bg-amber-50">
                      <Compass className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">
                      الوحدة الثالثة ومرجعيات الطالب · الفصول ٥ — ٦ · صفحات ١٣٣ — ٢١٣
                    </p>
                    <h3 className="font-display font-extrabold text-xl text-slate-900">
                      الأنظمة البيئية وموارد الأرض والطاقة النظيفة
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      السلاسل والشبكات الغذائية، المناطق الحيوية في المملكة (كمحمية ريدة)، نطاقات التربة، وترشيد الطاقة المتجددة مع مرجعيات الأجهزة والمصطلحات.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => onEnterBook(133, 'split')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:underline"
                    >
                      <span>ابدأ الوحدة الثالثة (ص ١٣٣)</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnterBook(191, 'split')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-teal-800 hover:underline"
                    >
                      <span>مرجعيات الطالب (ص ١٩١)</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Clean 8-Section Curriculum Directory */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {CHAPTER_NAV_GROUPS.map((grp, idx) => {
                const pageCount = grp.endPage - grp.startPage + 1;
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => onEnterBook(grp.startPage, 'split')}
                    className="group text-right rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600 transition-colors flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-mono font-semibold text-teal-800">
                          {ARABIC_CHAPTER_INDEX[idx] ?? idx + 1}
                        </span>
                        <span className="tabular-nums">
                          ص {grp.startPage} — {grp.endPage} ({pageCount} ص)
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 group-hover:text-teal-800 transition-colors">
                        {grp.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {grp.lessons.map((l) => l.title).slice(0, 2).join(' · ')}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 pt-2 border-t border-slate-100">
                      <span>افتح الفصل</span>
                      <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 4: Student Tools & Live Interactive Glossary Lookup */}
        <section id="tools" className="py-14 lg:py-20 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Editorial Numbered Student Capabilities (7 columns) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-teal-800">
                  ٠٣. أدوات الطالب والمذاكرة الفعالة
                </p>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
                  كل ما يحتاجه الطالب لفهم الدرس ومراجعته قبل الاختبار
                </h2>
              </div>

              <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white rounded-xl overflow-hidden">
                <div className="p-5 flex items-start gap-4">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-teal-800 shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-base text-slate-900">
                      ٠١. وضعان متكاملان لكل صفحة: التلخيص التفاعلي أو صورة الـ PDF
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      اقرأ المفاهيم والجداول والأنشطة بتنسيق رقمي واضح ومريح للعين، أو بدّل بزر واحد إلى صفحة الكتاب الورقية الأصلية في أي لحظة.
                    </p>
                  </div>
                </div>

                <div className="p-5 flex items-start gap-4">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-teal-800 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-base text-slate-900">
                      ٠٢. أسئلة تفاعلية وبنك أخطاء تلقائي لكل صفحة
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      كل صفحة تضم أسئلة اختيار من متعدد وصواب/خطأ مع التصحيح والشرح العلمي الفوري، وتُحفظ الأخطاء تلقائيًا في بنك المراجعة بمركز المذاكرة.
                    </p>
                  </div>
                </div>

                <div className="p-5 flex items-start gap-4">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-teal-800 shrink-0 mt-0.5">
                    <Volume2 className="w-4 h-4" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-base text-slate-900">
                      ٠٣. الاستماع الصوتي العربي ودفتر الملاحظات الشخصي
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      استمع لقراءة ملخص الصفحة ومفاهيمها باللغة العربية، ودوّن ملاحظاتك الخاصة على أي صفحة لتبقى محفوظة وتُستعرض من مكان واحد.
                    </p>
                  </div>
                </div>

                <div className="p-5 flex items-start gap-4">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-teal-800 shrink-0 mt-0.5">
                    <NotebookPen className="w-4 h-4" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-base text-slate-900">
                      ٠٤. اختبارات تدريبية عشوائية وبطاقات استذكار للمصطلحات
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      تدرّب عبر اختبارات من ١٠ أسئلة لأي فصل أو للمنهج كاملًا، وراجع مصطلحات الكتاب عبر بطاقات الاستذكار القابلة للقلب.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Glossary Quick-Lookup Panel (5 columns) */}
            <div
              id="glossary-preview"
              className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-5"
            >
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-teal-800">
                  معاينة المعجم العلمي التفاعلي
                </p>
                <h3 className="font-display font-extrabold text-xl text-slate-900">
                  ابحث عن أي مصطلح علمي وانتقل لصفحته فورًا
                </h3>
                <p className="text-xs text-slate-500 tabular-nums">
                  يضم المعجم {metrics.totalTerms} مصطلحًا مرتبطة بصفحات الكتاب ({MIN_BOOK_PAGE} — {MAX_BOOK_PAGE}).
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  placeholder="ابحث مثل: الخلية، البناء الضوئي، الكروموسوم..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pr-9 pl-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-teal-700 focus:bg-white transition-colors"
                />
              </div>

              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {previewTerms.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">
                    لا توجد مصطلحات مطابقة لبحثك. جرّب كلمة أخرى.
                  </p>
                ) : (
                  previewTerms.map((entry) => (
                    <div key={entry.term} className="py-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-bold text-sm text-slate-900">
                          {entry.term}
                        </span>
                        <button
                          type="button"
                          onClick={() => onEnterBook(entry.pageRef, 'split')}
                          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline shrink-0 tabular-nums"
                        >
                          <span>صفحة {entry.pageRef}</span>
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {entry.definition}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Final Conversion Block */}
        <section className="py-14 lg:py-20 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center space-y-6">
            <p className="text-xs font-bold text-amber-300">
              جاهز للاستكشاف والمذاكرة
            </p>
            <h2 className="font-display font-extrabold text-2xl sm:text-4xl leading-snug text-white">
              افتح كتاب العلوم للصف السادس واختبر فهمك في كل صفحة
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              ابدأ من استهلال «أعمل كالعلماء» في الصفحة {MIN_BOOK_PAGE}، أو ادخل مباشرة إلى مركز المذاكرة لتقييم مستواك عبر اختبار تدريبي شامل.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onEnterBook(hasSavedProgress ? savedPage : MIN_BOOK_PAGE, 'split')}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-sm font-bold text-white hover:bg-teal-500 transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4" />
                <span>
                  {hasSavedProgress
                    ? `متابعة التصفح (صفحة ${savedPage})`
                    : `فتح الكتاب التفاعلي (ص ${MIN_BOOK_PAGE})`}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenStudyHub}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-bold text-slate-100 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
              >
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span>افتح مركز المذاكرة والاختبار</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Academic Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-extrabold text-sm text-slate-900">
              العلوم · الصف السادس ٣D
            </span>
            <span aria-hidden="true">·</span>
            <span>الجزء الأول (١٤٤٨هـ) — الصفحات {MIN_BOOK_PAGE} إلى {MAX_BOOK_PAGE}</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 font-medium text-slate-600">
            <button
              type="button"
              onClick={() => onEnterBook(MIN_BOOK_PAGE, 'book')}
              className="inline-flex items-center gap-1 hover:text-teal-800 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>الكتاب المفتوح</span>
            </button>
            <button
              type="button"
              onClick={() => onEnterBook(MIN_BOOK_PAGE, 'lab3d')}
              className="inline-flex items-center gap-1 hover:text-teal-800 transition-colors"
            >
              <Box className="w-3.5 h-3.5" />
              <span>المجسمات ٣D</span>
            </button>
            <button
              type="button"
              onClick={onOpenStudyHub}
              className="inline-flex items-center gap-1 hover:text-teal-800 transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>مركز المذاكرة</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
