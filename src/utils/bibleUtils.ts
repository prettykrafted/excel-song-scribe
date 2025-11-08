import * as XLSX from 'xlsx';
import { BibleCollection, BibleBook, BibleVerse } from '@/types/bible';

const parseVerseReference = (text: string): { book: string; chapter: number; verse: number; content: string } | null => {
  // Parse "Genesis 1:1<br/>verse text" format
  const match = text.match(/^([^<]+?)\s+(\d+):(\d+)(?:<br\/?>)?(.*)$/s);
  if (!match) return null;
  
  const [, book, chapter, verse, content] = match;
  return {
    book: book.trim(),
    chapter: parseInt(chapter),
    verse: parseInt(verse),
    content: content.replace(/<br\s*\/?>/gi, ' ').trim()
  };
};

export const readBibleExcelFile = async (file: File): Promise<BibleCollection[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const collections: BibleCollection[] = [];
        const timestamp = Date.now();
        
        // Process each sheet (Old Testament, New Testament, etc.)
        for (let sheetIndex = 0; sheetIndex < workbook.SheetNames.length; sheetIndex++) {
          const sheetName = workbook.SheetNames[sheetIndex];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length === 0) continue;
          
          const bookNames = jsonData[0] as string[]; // First row contains book names
          const booksMap = new Map<string, BibleVerse[]>();
          
          // Initialize books
          bookNames.forEach(bookName => {
            if (bookName) {
              booksMap.set(bookName, []);
            }
          });
          
          // Parse verses from each column
          for (let row = 1; row < jsonData.length; row++) {
            const rowData = jsonData[row];
            
            for (let col = 0; col < rowData.length && col < bookNames.length; col++) {
              const cellValue = rowData[col];
              const bookName = bookNames[col];
              
              if (!cellValue || !bookName) continue;
              
              const parsed = parseVerseReference(String(cellValue));
              if (parsed) {
                booksMap.get(bookName)?.push({
                  book: parsed.book,
                  chapter: parsed.chapter,
                  verse: parsed.verse,
                  text: parsed.content
                });
              }
            }
          }
          
          // Convert map to array of books
          const books: BibleBook[] = Array.from(booksMap.entries())
            .filter(([, verses]) => verses.length > 0)
            .map(([name, verses]) => ({
              name,
              verses: verses.sort((a, b) => {
                if (a.chapter !== b.chapter) return a.chapter - b.chapter;
                return a.verse - b.verse;
              })
            }));
          
          if (books.length > 0) {
            collections.push({
              id: `bible-${sheetName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}-${sheetIndex}`,
              title: sheetName,
              books
            });
          }
        }
        
        resolve(collections);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};

export const loadDefaultBible = async (): Promise<BibleCollection[]> => {
  const basePath = import.meta.env.BASE_URL || '/';
  const response = await fetch(`${basePath}data/kjv_bible.xlsx`);
  if (!response.ok) throw new Error('Failed to load default Bible');
  const blob = await response.blob();
  const file = new File([blob], 'kjv_bible.xlsx');
  return readBibleExcelFile(file);
};

export const loadBibleById = async (id: string): Promise<BibleCollection | null> => {
  // For now, we only support the default KJV Bible
  if (id.startsWith('bible-')) {
    const collections = await loadDefaultBible();
    return collections.find(c => c.id === id) || null;
  }
  return null;
};
