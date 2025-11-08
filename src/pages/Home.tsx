import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Upload, Trash2, BookOpen } from 'lucide-react';
import SongbookCard from '@/components/SongbookCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Songbook } from '@/types/hymn';
import { BibleMetadata } from '@/types/bible';
import { readExcelFileAllSheets, loadDefaultSongbooks } from '@/utils/excelUtils';
import { readBibleExcelFile, loadDefaultBible } from '@/utils/bibleUtils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SONGBOOKS_STORAGE_KEY = 'songbooks-collection';
const BIBLE_STORAGE_KEY = 'bible-collection';

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [songbooks, setSongbooks] = useState<Songbook[]>([]);
  const [bibleMetadata, setBibleMetadata] = useState<BibleMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'songbooks' | 'bible'>('songbooks');
  const [deleteDialog, setDeleteDialog] = useState<{ 
    open: boolean; 
    id: string | null;
    type: 'songbook' | 'bible' | null;
  }>({
    open: false,
    id: null,
    type: null,
  });

  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([loadSongbooks(), loadBibleCollections()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  const loadSongbooks = async () => {
    try {
      const saved = localStorage.getItem(SONGBOOKS_STORAGE_KEY);
      if (saved) {
        setSongbooks(JSON.parse(saved));
      } else {
        try {
          const defaultSongbooks = await loadDefaultSongbooks();
          if (defaultSongbooks.length > 0) {
            saveSongbooks(defaultSongbooks);
          }
        } catch (error) {
          console.log('No default songbooks found');
        }
      }
    } catch (error) {
      console.error('Error loading songbooks:', error);
    }
  };

  const loadBibleCollections = async () => {
    try {
      const saved = localStorage.getItem(BIBLE_STORAGE_KEY);
      if (saved) {
        setBibleMetadata(JSON.parse(saved));
      } else {
        try {
          const defaultBible = await loadDefaultBible();
          if (defaultBible.length > 0) {
            // Store only metadata, not full content
            const metadata: BibleMetadata[] = defaultBible.map(bible => ({
              id: bible.id,
              title: bible.title,
              bookCount: bible.books.length
            }));
            saveBibleMetadata(metadata);
          }
        } catch (error) {
          console.log('No default Bible found');
        }
      }
    } catch (error) {
      console.error('Error loading Bible:', error);
    }
  };

  const saveSongbooks = (books: Songbook[]) => {
    try {
      localStorage.setItem(SONGBOOKS_STORAGE_KEY, JSON.stringify(books));
      setSongbooks(books);
    } catch (error) {
      console.error('Error saving songbooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to save songbooks',
        variant: 'destructive',
      });
    }
  };

  const saveBibleMetadata = (metadata: BibleMetadata[]) => {
    try {
      localStorage.setItem(BIBLE_STORAGE_KEY, JSON.stringify(metadata));
      setBibleMetadata(metadata);
    } catch (error) {
      console.error('Error saving Bible metadata:', error);
      toast({
        title: 'Error',
        description: 'Failed to save Bible metadata',
        variant: 'destructive',
      });
    }
  };

  const handleSongbookUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const newSongbooks = await readExcelFileAllSheets(file);
      
      if (newSongbooks.length === 0) {
        toast({
          title: 'No sheets found',
          description: 'The Excel file contains no sheets.',
          variant: 'destructive',
        });
        return;
      }

      let addedCount = 0;
      let replacedCount = 0;
      const updatedSongbooks = [...songbooks];

      for (const newSongbook of newSongbooks) {
        const existingIndex = updatedSongbooks.findIndex(sb => sb.title === newSongbook.title);
        
        if (existingIndex >= 0) {
          // Replace existing songbook with same title
          updatedSongbooks[existingIndex] = newSongbook;
          replacedCount++;
        } else {
          // Add new songbook
          updatedSongbooks.push(newSongbook);
          addedCount++;
        }
      }

      saveSongbooks(updatedSongbooks);
      
      let message = '';
      if (addedCount > 0 && replacedCount > 0) {
        message = `Added ${addedCount} new songbook(s), replaced ${replacedCount} existing. Total sheets imported: ${newSongbooks.length}`;
      } else if (addedCount > 0) {
        message = `Added ${addedCount} songbook(s) successfully from ${newSongbooks.length} sheet(s).`;
      } else {
        message = `Updated ${replacedCount} songbook(s) from ${newSongbooks.length} sheet(s).`;
      }

      toast({
        title: 'Success',
        description: message,
      });
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to read Excel file. Please check the file format.',
        variant: 'destructive',
      });
    }
  };

  const handleBibleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const newCollections = await readBibleExcelFile(file);
      
      if (newCollections.length === 0) {
        toast({
          title: 'No sheets found',
          description: 'The Excel file contains no valid Bible data.',
          variant: 'destructive',
        });
        return;
      }

      // Store only metadata
      const newMetadata: BibleMetadata[] = newCollections.map(bible => ({
        id: bible.id,
        title: bible.title,
        bookCount: bible.books.length
      }));
      
      const updatedMetadata = [...bibleMetadata, ...newMetadata];
      saveBibleMetadata(updatedMetadata);
      
      toast({
        title: 'Success',
        description: `Added ${newCollections.length} Bible collection(s) successfully.`,
      });
      
      event.target.value = '';
    } catch (error) {
      console.error('Error reading Bible file:', error);
      toast({
        title: 'Error',
        description: 'Failed to read Excel file. Please check the file format.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (id: string, type: 'songbook' | 'bible') => {
    setDeleteDialog({ open: true, id, type });
  };

  const confirmDelete = () => {
    if (!deleteDialog.id || !deleteDialog.type) return;

    if (deleteDialog.type === 'songbook') {
      const updated = songbooks.filter(sb => sb.id !== deleteDialog.id);
      saveSongbooks(updated);
      const deleted = songbooks.find(sb => sb.id === deleteDialog.id);
      toast({
        title: 'Songbook deleted',
        description: `"${deleted?.title}" has been removed.`,
      });
    } else {
      const updated = bibleMetadata.filter(bc => bc.id !== deleteDialog.id);
      saveBibleMetadata(updated);
      const deleted = bibleMetadata.find(bc => bc.id === deleteDialog.id);
      toast({
        title: 'Bible collection deleted',
        description: `"${deleted?.title}" has been removed.`,
      });
    }
    
    setDeleteDialog({ open: false, id: null, type: null });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Music2 className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading songbooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold text-foreground">Sacred Library</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your collection of hymns and scripture for worship and study
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'songbooks' | 'bible')} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="songbooks" className="flex items-center gap-2">
              <Music2 className="h-4 w-4" />
              Songbooks
            </TabsTrigger>
            <TabsTrigger value="bible" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Bible
            </TabsTrigger>
          </TabsList>

          <TabsContent value="songbooks" className="space-y-8">
            <div className="flex justify-center">
              <Button variant="outline" className="relative overflow-hidden">
                <Upload className="mr-2 h-4 w-4" />
                Upload Songbook
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleSongbookUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>

            {songbooks.length === 0 ? (
              <div className="text-center py-16">
                <Music2 className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2 text-foreground">No songbooks yet</h2>
                <p className="text-muted-foreground mb-6">
                  Upload your first songbook to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {songbooks.map((songbook) => (
                  <div key={songbook.id} className="relative group">
                    <SongbookCard
                      songbook={songbook}
                      onClick={() => navigate(`/songbook/${songbook.id}`, { state: { songbook } })}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(songbook.id, 'songbook');
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bible" className="space-y-8">
            <div className="flex justify-center">
              <Button variant="outline" className="relative overflow-hidden">
                <Upload className="mr-2 h-4 w-4" />
                Upload Bible
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleBibleUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>

            {bibleMetadata.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2 text-foreground">No Bible collections yet</h2>
                <p className="text-muted-foreground mb-6">
                  Upload your first Bible collection to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bibleMetadata.map((metadata) => (
                  <div key={metadata.id} className="relative group">
                    <Card 
                      className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary"
                      onClick={() => navigate(`/bible/${metadata.id}`)}
                    >
                      <div className="flex items-start gap-4">
                        <BookOpen className="h-8 w-8 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-foreground mb-2 truncate">
                            {metadata.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {metadata.bookCount} book{metadata.bookCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(metadata.id, 'bible');
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-16 bg-card rounded-2xl p-8 shadow-lg border-2 border-border">
          <blockquote className="text-center">
            <p className="text-2xl font-serif italic text-foreground mb-4">
              "Sing to the Lord a new song; sing to the Lord, all the earth. 
              Sing to the Lord, praise his name; proclaim his salvation day after day."
            </p>
            <footer className="text-lg text-muted-foreground font-semibold">
              — Psalm 96:1-2
            </footer>
          </blockquote>
        </div>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: null, type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteDialog.type === 'bible' ? 'Bible Collection' : 'Songbook'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteDialog.type === 'bible' ? 'Bible collection' : 'songbook'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Home;