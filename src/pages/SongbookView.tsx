import { useState, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SongListItem from '@/components/SongListItem';
import { Songbook } from '@/types/hymn';
import { writeExcelFile, downloadExcelFile } from '@/utils/excelUtils';
import { useToast } from '@/hooks/use-toast';

const SongbookView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const songbook = location.state?.songbook as Songbook;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHymns = useMemo(() => {
    if (!songbook) return [];
    if (!searchQuery.trim()) return songbook.hymns;

    const query = searchQuery.toLowerCase();
    return songbook.hymns.filter(hymn => {
      const matchesNumber = hymn.songNumber.toString().includes(query);
      const matchesName = hymn.globalName.toLowerCase().includes(query);
      const matchesTitle = hymn.title.toLowerCase().includes(query);
      const matchesStanzas = hymn.stanzas.some(s => s.toLowerCase().includes(query));
      const matchesChorus = hymn.chorus?.toLowerCase().includes(query);
      
      return matchesNumber || matchesName || matchesTitle || matchesStanzas || matchesChorus;
    });
  }, [songbook, searchQuery]);

  const handleDownload = () => {
    if (!songbook) return;
    
    try {
      const blob = writeExcelFile(songbook);
      downloadExcelFile(blob, `${songbook.title}.xlsx`);
      toast({
        title: 'Success',
        description: 'Songbook downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download songbook',
        variant: 'destructive',
      });
    }
  };

  if (!songbook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Songbook not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/songbook/${id}/add`, { state: { songbook } })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Song
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{songbook.title}</h1>
          <p className="text-muted-foreground">{songbook.hymns.length} hymns</p>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by number, name, or lyrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>

        <div className="space-y-3">
          {filteredHymns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hymns found matching your search
            </div>
          ) : (
            filteredHymns.map((hymn) => (
              <SongListItem
                key={hymn.songNumber}
                hymn={hymn}
                onClick={() => navigate(`/song/${hymn.songNumber}`, { state: { hymn, songbook } })}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SongbookView;
