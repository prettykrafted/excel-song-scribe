import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Upload } from 'lucide-react';
import SongbookCard from '@/components/SongbookCard';
import { Button } from '@/components/ui/button';
import { Songbook } from '@/types/hymn';
import { loadDefaultSongbook, readExcelFile } from '@/utils/excelUtils';
import { useToast } from '@/hooks/use-toast';

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [songbooks, setSongbooks] = useState<Songbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSongbooks();
  }, []);

  const loadSongbooks = async () => {
    try {
      const defaultBook = await loadDefaultSongbook();
      setSongbooks([defaultBook]);
    } catch (error) {
      console.error('Error loading songbooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load songbooks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const songbook = await readExcelFile(file);
      setSongbooks([...songbooks, songbook]);
      toast({
        title: 'Success',
        description: 'Songbook loaded successfully',
      });
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to read Excel file',
        variant: 'destructive',
      });
    }
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {songbooks.map((songbook) => (
            <SongbookCard
              key={songbook.id}
              songbook={songbook}
              onClick={() => navigate(`/songbook/${songbook.id}`, { state: { songbook } })}
            />
          ))}
        </div>

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
    </div>
  );
};

export default Home;
