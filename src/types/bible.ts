export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleBook {
  name: string;
  verses: BibleVerse[];
}

export interface BibleCollection {
  id: string;
  title: string;
  books: BibleBook[];
}

export type ContentType = 'bible' | 'songbook';

export interface Collection {
  type: ContentType;
  data: BibleCollection | any; // Songbook type
}
