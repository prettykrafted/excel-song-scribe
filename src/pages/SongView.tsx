import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Presentation, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hymn, Songbook } from '@/types/hymn';
import { useToast } from '@/hooks/use-toast';
import { writeExcelFile, downloadExcelFile } from '@/utils/excelUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SongView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const hymn = location.state?.hymn as Hymn;
  const songbook = location.state?.songbook as Songbook;

  const handleDelete = () => {
    if (!songbook) return;

    const updatedHymns = songbook.hymns.filter(h => h.songNumber !== hymn.songNumber);
    const updatedSongbook = { ...songbook, hymns: updatedHymns };
    
    const blob = writeExcelFile(updatedSongbook);
    downloadExcelFile(blob, `${songbook.title}_updated.xlsx`);
    
    toast({
      title: 'Song deleted',
      description: 'The updated songbook has been downloaded',
    });
    
    navigate(`/songbook/${songbook.id}`, { state: { songbook: updatedSongbook } });
  };

  if (!hymn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Song not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/presentation', { state: { hymn } })}
            >
              <Presentation className="h-4 w-4 mr-2" />
              Present
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/song/${hymn.songNumber}/edit`, { state: { hymn, songbook } })}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete "{hymn.globalName}" from the songbook. 
                    The updated Excel file will be downloaded.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold">
                    {hymn.songNumber}
                  </div>
                  <CardTitle className="text-3xl">{hymn.globalName}</CardTitle>
                </div>
                <p className="text-muted-foreground text-lg">{hymn.title}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {hymn.stanzas.map((stanza, index) => (
              <div key={index}>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-primary mb-3">
                    Stanza {index + 1}
                  </h3>
                  <p className="whitespace-pre-wrap text-foreground leading-relaxed text-lg">
                    {stanza}
                  </p>
                </div>
                
                {hymn.chorus && (
                  <div className="ml-6 pl-4 border-l-4 border-accent">
                    <h3 className="text-lg font-semibold text-accent mb-3">Chorus</h3>
                    <p className="whitespace-pre-wrap text-foreground leading-relaxed text-lg italic">
                      {hymn.chorus}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SongView;
