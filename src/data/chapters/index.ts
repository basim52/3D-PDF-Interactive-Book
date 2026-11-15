import { BookPageData, ChapterNavGroup } from '../../types/book';
import { FRONT_MATTER_PAGES } from './frontMatter';
import { CHAPTER_1_PAGES } from './chapter1';
import { CHAPTER_2_PAGES } from './chapter2';
import { CHAPTER_3_PAGES } from './chapter3';
import { CHAPTER_4_PAGES } from './chapter4';
import { CHAPTER_5_PAGES } from './chapter5';
import { CHAPTER_6_PAGES } from './chapter6';
import { BACK_MATTER_PAGES } from './backMatter';

export const ALL_BOOK_PAGES: BookPageData[] = [
  ...FRONT_MATTER_PAGES,
  ...CHAPTER_1_PAGES,
  ...CHAPTER_2_PAGES,
  ...CHAPTER_3_PAGES,
  ...CHAPTER_4_PAGES,
  ...CHAPTER_5_PAGES,
  ...CHAPTER_6_PAGES,
  ...BACK_MATTER_PAGES,
].sort((a, b) => a.pageNumber - b.pageNumber);

const PAGE_MAP = new Map<number, BookPageData>(
  ALL_BOOK_PAGES.map((page) => [page.pageNumber, page]),
);

export const MIN_BOOK_PAGE = ALL_BOOK_PAGES[0]?.pageNumber ?? 7;
export const MAX_BOOK_PAGE = ALL_BOOK_PAGES[ALL_BOOK_PAGES.length - 1]?.pageNumber ?? 213;
export const TOTAL_BOOK_PAGES = ALL_BOOK_PAGES.length;

export function getPageByNumber(pageNumber: number): BookPageData | undefined {
  return PAGE_MAP.get(pageNumber);
}

/**
 * Arabic RTL open-book spread pairing (starts at page 7 after omitting pages 1–6):
 * Page 7 = First opener alone [7]
 * Page 2k, 2k+1 = Right page (even), Left page (odd) -> [8,9], [10,11], ..., [212,213]
 */
export function getSpreadForPage(pageNumber: number): {
  rightPage: number | null;
  leftPage: number | null;
} {
  const clamped = Math.max(MIN_BOOK_PAGE, Math.min(MAX_BOOK_PAGE, Math.round(pageNumber)));
  if (clamped === MIN_BOOK_PAGE) {
    return { rightPage: null, leftPage: MIN_BOOK_PAGE };
  }
  if (clamped % 2 === 0) {
    return {
      rightPage: clamped,
      leftPage: clamped + 1 <= MAX_BOOK_PAGE ? clamped + 1 : null,
    };
  }
  return {
    rightPage: clamped - 1,
    leftPage: clamped,
  };
}

export const CHAPTER_NAV_GROUPS: ChapterNavGroup[] = [
  {
    id: 'front_matter',
    unitTitle: 'المقدمة والمنهجية العلمية',
    title: 'أعمل كالعلماء والطريقة العلمية',
    startPage: 7,
    endPage: 18,
    accent: 'sky',
    model3dId: 'comet_method',
    lessons: [
      { title: 'أعمل كالعلماء — استهلال (مذنب هالي)', page: 7 },
      { title: 'أدرس كالعلماء (المذنب هيل-بوب)', page: 8 },
      { title: 'ما عمل العلماء؟ وتقصي الملاحظات', page: 12 },
      { title: 'خطوات الطريقة العلمية والمذنب', page: 16 },
    ],
  },
  {
    id: 'chapter_1',
    unitTitle: 'الوحدة الأولى: تنوع الحياة',
    title: 'الفصل الأول: الخلايا',
    startPage: 19,
    endPage: 47,
    accent: 'emerald',
    model3dId: 'animal_plant_cell',
    lessons: [
      { title: 'مدخل الوحدة الأولى والفصل الأول', page: 19 },
      { title: 'الدرس ١: نظرية الخلية والمجهر', page: 22 },
      { title: 'الدرس ٢: الخلية النباتية والخلية الحيوانية', page: 32 },
      { title: 'الكتابة العلمية والمراجعة والاختبار', page: 42 },
    ],
  },
  {
    id: 'chapter_2',
    unitTitle: 'الوحدة الأولى: تنوع الحياة',
    title: 'الفصل الثاني: الخلية والوراثة',
    startPage: 48,
    endPage: 74,
    accent: 'indigo',
    model3dId: 'cell_division',
    lessons: [
      { title: 'مدخل الفصل الثاني والمفردات', page: 48 },
      { title: 'الدرس ١: انقسام الخلايا (المتساوي والمنصف)', page: 50 },
      { title: 'الدرس ٢: الوراثة والصفات والـ DNA', page: 60 },
      { title: 'الكتابة العلمية والمراجعة والاختبار', page: 68 },
    ],
  },
  {
    id: 'chapter_3',
    unitTitle: 'الوحدة الثانية: عمليات الحياة',
    title: 'الفصل الثالث: النباتات والمخلوقات الدقيقة',
    startPage: 75,
    endPage: 105,
    accent: 'emerald',
    model3dId: 'plant_processes',
    lessons: [
      { title: 'مدخل الوحدة الثانية والفصل الثالث', page: 75 },
      { title: 'الدرس ١: عمليات الحياة في النباتات', page: 78 },
      { title: 'الدرس ٢: المخلوقات الحية الدقيقة', page: 92 },
      { title: 'الحياة في الأعماق والمراجعة والاختبار', page: 100 },
    ],
  },
  {
    id: 'chapter_4',
    unitTitle: 'الوحدة الثانية: عمليات الحياة',
    title: 'الفصل الرابع: عمليات الحياة في الإنسان والحيوانات',
    startPage: 106,
    endPage: 132,
    accent: 'emerald',
    model3dId: 'human_systems_1',
    lessons: [
      { title: 'مدخل الفصل الرابع والمفردات', page: 106 },
      { title: 'الدرس ١: الهضم والإخراج والتنفس والدوران', page: 108 },
      { title: 'الدرس ٢: الحركة والإحساس', page: 120 },
      { title: 'المحافظة على الصحة والمراجعة والاختبار', page: 127 },
    ],
  },
  {
    id: 'chapter_5',
    unitTitle: 'الوحدة الثالثة: الأنظمة البيئية ومواردها',
    title: 'الفصل الخامس: الأنظمة البيئية',
    startPage: 133,
    endPage: 163,
    accent: 'amber',
    model3dId: 'ecosystems_pyramid',
    lessons: [
      { title: 'مدخل الوحدة الثالثة والفصل الخامس', page: 133 },
      { title: 'الدرس ١: السلاسل والشبكات الغذائية وهرم الطاقة', page: 136 },
      { title: 'الدرس ٢: مقارنة الأنظمة البيئية', page: 146 },
      { title: 'محمية ريدة والمراجعة والاختبار', page: 158 },
    ],
  },
  {
    id: 'chapter_6',
    unitTitle: 'الوحدة الثالثة: الأنظمة البيئية ومواردها',
    title: 'الفصل السادس: موارد الأرض والحفاظ عليها',
    startPage: 164,
    endPage: 190,
    accent: 'amber',
    model3dId: 'soil_energy',
    lessons: [
      { title: 'مدخل الفصل السادس والمفردات', page: 164 },
      { title: 'الدرس ١: التربة ونطاقاتها وحفظها', page: 166 },
      { title: 'الدرس ٢: حماية الموارد والطاقة المتجددة', page: 176 },
      { title: 'الطاقة النظيفة والمراجعة والاختبار', page: 184 },
    ],
  },
  {
    id: 'back_matter',
    unitTitle: 'مرجعيات الطالب',
    title: 'الأدوات العلمية، جسم الإنسان، والمصطلحات',
    startPage: 191,
    endPage: 213,
    accent: 'teal',
    model3dId: 'human_systems_2',
    lessons: [
      { title: 'الأدوات العلمية (المجهر والمنظار)', page: 191 },
      { title: 'مرجع أجهزة جسم الإنسان والحواس', page: 194 },
      { title: 'معجم المصطلحات العلمية (أ — و)', page: 206 },
      { title: 'رؤية ٢٠٣٠ وختام الكتاب', page: 213 },
    ],
  },
];
