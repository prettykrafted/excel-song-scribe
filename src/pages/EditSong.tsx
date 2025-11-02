import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hymn, Songbook } from '@/types/hymn';
import { writeExcelFile, downloadExcelFile } from '@/utils/excelUtils';
import { useToast } from '@/hooks/use-toast';

const EditSong = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const hymn = location.state?.hymn as Hymn;
  const songbook = location.state?.songbook as Songbook;
  const isNew = !hymn;

  const [formData, setFormData] = useState({
    songNumber: hymn?.songNumber || 0,
    globalName: hymn?.globalName || '',
    title: hymn?.title || '',
    stanzas: hymn?.stanzas.join('\n\n---\n\n') || '',
    chorus: hymn?.chorus || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!songbook) {
      toast({
        title: 'Error',
        description: 'Songbook not found',
        variant: 'destructive',
      });
      return;
    }

    const stanzasArray = formData.stanzas
      .split(/\n\s*---\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const updatedHymn: Hymn = {
      songNumber: Number(formData.songNumber),
      globalName: formData.globalName,
      title: formData.title,
      stanzas: stanzasArray,
      chorus: formData.chorus.trim() || undefined,
    };

    let updatedHymns;
    if (isNew) {
      updatedHymns = [...songbook.hymns, updatedHymn].sort((a, b) => a.songNumber - b.songNumber);
    } else {
      updatedHymns = songbook.hymns.map(h => 
        h.songNumber === hymn.songNumber ? updatedHymn : h
      );
    }

    const updatedSongbook = { ...songbook, hymns: updatedHymns };
    const blob = writeExcelFile(updatedSongbook);
    downloadExcelFile(blob, `${songbook.title}_updated.xlsx`);

    toast({
      title: 'Success',
      description: `Song ${isNew ? 'added' : 'updated'} successfully. Download the updated file.`,
    });

    navigate(`/songbook/${songbook.id}`, { state: { songbook: updatedSongbook } });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              {isNew ? 'Add New Song' : 'Edit Song'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="songNumber">Song Number</Label>
                <Input
                  id="songNumber"
                  type="number"
                  value={formData.songNumber}
                  onChange={(e) => setFormData({ ...formData, songNumber: Number(e.target.value) })}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="globalName">Global Name</Label>
                <Input
                  id="globalName"
                  value={formData.globalName}
                  onChange={(e) => setFormData({ ...formData, globalName: e.target.value })}
                  required
                  className="mt-2"
                  placeholder="e.g., Amazing Grace"
                />
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="mt-2"
                  placeholder="e.g., AMAZING GRACE D"
                />
              </div>

              <div>
                <Label htmlFor="stanzas">Stanzas</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Separate each stanza with "---" on a new line
                </p>
                <Textarea
                  id="stanzas"
                  value={formData.stanzas}
                  onChange={(e) => setFormData({ ...formData, stanzas: e.target.value })}
                  required
                  rows={12}
                  className="mt-2 font-mono"
                  placeholder="First stanza text here

---

Second stanza text here"
                />
              </div>

              <div>
                <Label htmlFor="chorus">Chorus (Optional)</Label>
                <Textarea
                  id="chorus"
                  value={formData.chorus}
                  onChange={(e) => setFormData({ ...formData, chorus: e.target.value })}
                  rows={4}
                  className="mt-2 font-mono"
                  placeholder="Chorus text here (leave empty if no chorus)"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {isNew ? 'Add Song' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditSong;
