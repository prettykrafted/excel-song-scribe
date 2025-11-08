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

export interface BibleMetadata {
  id: string;
  title: string;
  bookCount: number;
}

export type ContentType = 'bible' | 'songbook';

export interface Collection {
  type: ContentType;
  data: BibleCollection | any; // Songbook type
}
