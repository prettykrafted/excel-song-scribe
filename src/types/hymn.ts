export interface Hymn {
  songNumber: number;
  globalName: string;
  title: string;
  stanzas: string[];
  chorus?: string;
}

export interface Songbook {
  id: string;
  title: string;
  description?: string;
  hymns: Hymn[];
}

export interface PresentationSettings {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
}
