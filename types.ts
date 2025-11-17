
export enum Tab {
  Vocabulary = 'Vocabulary',
  Pronunciation = 'Pronunciation',
  Conversation = 'Conversation',
  Reading = 'Reading',
  Grammar = 'Grammar',
}

export interface WordInfo {
  word: string;
  definition: string;
  example: string;
  synonyms: string[];
  antonyms: string[];
}

export interface ComprehensionContent {
  story: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
}

export interface GrammarCorrection {
  correctedText: string;
  explanations: {
    original: string;
    correction: string;
    reason: string;
  }[];
}
