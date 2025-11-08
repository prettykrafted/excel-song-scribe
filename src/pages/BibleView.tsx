import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BibleCollection } from '@/types/bible';
import { loadBibleById } from '@/utils/bibleUtils';
import { useToast } from '@/hooks/use-toast';

const BibleView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [collection, setCollection] = useState<BibleCollection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCollection = async () => {
      if (!id) return;
      
      try {
        const data = await loadBibleById(id);
        if (data) {
          setCollection(data);
        } else {
          toast({
            title: 'Error',
            description: 'Bible collection not found',
            variant: 'destructive',
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error loading Bible:', error);
        toast({
          title: 'Error',
          description: 'Failed to load Bible collection',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    loadCollection();
  }, [id, navigate, toast]);

  if (loading || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading Bible...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">{collection.title}</h1>
          </div>
          <p className="text-muted-foreground">
            {collection.books.length} book{collection.books.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {collection.books.map((book) => (
            <Card
              key={book.name}
              className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary"
              onClick={() => navigate(`/bible/${id}/book/${encodeURIComponent(book.name)}`, { 
                state: { collection, book } 
              })}
            >
              <h3 className="font-semibold text-foreground mb-1">{book.name}</h3>
              <p className="text-sm text-muted-foreground">
                {book.verses.length} verses
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BibleView;
