export type Model3DId =
  | 'book_overview'
  | 'comet_method'
  | 'cell_microscope'
  | 'animal_plant_cell'
  | 'cell_division'
  | 'genetics_dna'
  | 'plant_processes'
  | 'microorganisms'
  | 'human_systems_1'
  | 'human_systems_2'
  | 'ecosystems_pyramid'
  | 'soil_energy';

export type PageType =
  | 'cover'
  | 'front_matter'
  | 'unit_opener'
  | 'chapter_opener'
  | 'vocab'
  | 'lesson_intro'
  | 'explore'
  | 'explain'
  | 'activity'
  | 'review'
  | 'test'
  | 'reading'
  | 'writing'
  | 'reference'
  | 'glossary';

export type AccentTheme = 'emerald' | 'amber' | 'sky' | 'indigo' | 'rose' | 'teal';

export type QuestionType = 'mcq' | 'tf';

export interface InteractiveQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceLabel?: string;
}

export type ContentBlock =
  | { kind: 'verse'; text: string; reference: string }
  | { kind: 'concept'; title: string; body: string }
  | { kind: 'points'; title: string; items: string[] }
  | { kind: 'steps'; title: string; items: string[] }
  | { kind: 'vocab'; terms: string[] }
  | { kind: 'equation'; title: string; left: string; arrowLabel: string; right: string }
  | { kind: 'table'; title: string; headers: string[]; rows: string[][] }
  | { kind: 'fact'; label: string; text: string }
  | { kind: 'prompt_box'; title: string; text: string };

export interface BookPageData {
  pageNumber: number;
  title: string;
  unitTitle: string;
  chapterTitle: string;
  lessonTitle?: string;
  pageType: PageType;
  accent: AccentTheme;
  summary: string;
  blocks: ContentBlock[];
  model3dId: Model3DId;
  model3dTitle: string;
  model3dFocusPart?: string;
  model3dHint: string;
  questions: InteractiveQuestion[];
}

export interface ChapterNavGroup {
  id: string;
  unitTitle: string;
  title: string;
  startPage: number;
  endPage: number;
  accent: AccentTheme;
  model3dId: Model3DId;
  lessons: {
    title: string;
    page: number;
  }[];
}

export interface PageAnswerState {
  [questionId: string]: {
    selectedIndex: number;
    isCorrect: boolean;
  };
}

export interface StudentProgress {
  answers: PageAnswerState;
  visitedPages: number[];
  bookmarks: number[];
  notes?: Record<number, string>;
  masteredTerms?: string[];
}
