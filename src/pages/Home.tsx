import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Upload, Trash2 } from 'lucide-react';
import SongbookCard from '@/components/SongbookCard';
import { Button } from '@/components/ui/button';
import { Songbook } from '@/types/hymn';
import { readExcelFileAllSheets, loadDefaultSongbooks } from '@/utils/excelUtils';
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

const STORAGE_KEY = 'songbooks-collection';

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [songbooks, setSongbooks] = useState<Songbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; songbookId: string | null }>({
    open: false,
    songbookId: null,
  });

  useEffect(() => {
    loadSongbooks();
  }, []);

  // Load songbooks from localStorage
  const loadSongbooks = async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSongbooks(parsed);
      } else {
        // Try to load default songbooks from public folder
        try {
          const defaultSongbooks = await loadDefaultSongbooks();
          if (defaultSongbooks.length > 0) {
            saveSongbooks(defaultSongbooks);
          } else {
            setSongbooks([]);
          }
        } catch (error) {
          console.log('No default songbooks found, starting with empty collection');
          setSongbooks([]);
        }
      }
    } catch (error) {
      console.error('Error loading songbooks:', error);
      setSongbooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Save songbooks to localStorage
  const saveSongbooks = (books: Songbook[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleDeleteSongbook = (songbookId: string) => {
    setDeleteDialog({ open: true, songbookId });
  };

  const confirmDelete = () => {
    if (deleteDialog.songbookId) {
      const updatedSongbooks = songbooks.filter(sb => sb.id !== deleteDialog.songbookId);
      saveSongbooks(updatedSongbooks);
      
      const deletedBook = songbooks.find(sb => sb.id === deleteDialog.songbookId);
      toast({
        title: 'Songbook deleted',
        description: `"${deletedBook?.title}" has been removed.`,
      });
    }
    setDeleteDialog({ open: false, songbookId: null });
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
            <Music2 className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold text-foreground">Hymnal Collection</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A treasury of sacred songs and hymns for worship and praise
          </p>
        </header>

        <div className="mb-8 flex justify-center">
          <Button variant="outline" className="relative overflow-hidden">
            <Upload className="mr-2 h-4 w-4" />
            Upload Songbook
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
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
            <p className="text-sm text-muted-foreground">
              Tip: All sheets in your Excel file will be imported as separate songbooks, even empty ones
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
                    handleDeleteSongbook(songbook.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, songbookId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Songbook?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this songbook? This action cannot be undone.
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