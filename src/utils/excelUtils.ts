import * as XLSX from 'xlsx';
import { Hymn, Songbook } from '@/types/hymn';

export const parseStanzas = (stanzaText: string): string[] => {
  if (!stanzaText) return [];
  
  // Split by multiple line breaks (which appear as <br/><br/><br/> in the parsed data)
  const stanzas = stanzaText
    .split(/<br\/><br\/><br\/>|<br\/>\s*<br\/>\s*<br\/>/)
    .map(s => s.replace(/<br\/>/g, '\n').trim())
    .filter(s => s.length > 0);
  
  return stanzas;
};

export const parseChorus = (chorusText: string): string | undefined => {
  if (!chorusText) return undefined;
  
  // Remove "CHORUS:" prefix and clean up
  const cleaned = chorusText
    .replace(/^CHORUS:\s*/i, '')
    .replace(/<br\/>/g, '\n')
    .trim();
  
  return cleaned || undefined;
};

export const readExcelFile = async (file: File): Promise<Songbook> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        const hymns: Hymn[] = jsonData.map((row) => ({
          songNumber: Number(row['Song Number']) || 0,
          globalName: String(row['Global Name'] || ''),
          title: String(row['Title'] || ''),
          stanzas: parseStanzas(row['Stanzas'] || ''),
          chorus: parseChorus(row['Choruses'] || ''),
        }));
        
        resolve({
          id: 'hymns-collection',
          title: sheetName,
          hymns: hymns.sort((a, b) => a.songNumber - b.songNumber),
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};

export const loadDefaultSongbook = async (): Promise<Songbook> => {
  const response = await fetch('/data/hymns_collection.xlsx');
  const blob = await response.blob();
  const file = new File([blob], 'hymns_collection.xlsx');
  return readExcelFile(file);
};

export const writeExcelFile = (songbook: Songbook): Blob => {
  const data = songbook.hymns.map(hymn => ({
    'Song Number': hymn.songNumber,
    'Global Name': hymn.globalName,
    'Title': hymn.title,
    'Stanzas': hymn.stanzas.join('\n\n\n'),
    'Choruses': hymn.chorus ? `CHORUS:\n${hymn.chorus}` : '',
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, songbook.title);
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const downloadExcelFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
