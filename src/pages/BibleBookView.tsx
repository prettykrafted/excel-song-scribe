import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BibleCollection, BibleBook } from '@/types/bible';

const BibleBookView = () => {
  const { id, bookName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const collection = location.state?.collection as BibleCollection;
  const book = location.state?.book as BibleBook;

  const chapters = useMemo(() => {
    if (!book) return [];
    const chapterMap = new Map<number, number>();
    book.verses.forEach(verse => {
      chapterMap.set(verse.chapter, (chapterMap.get(verse.chapter) || 0) + 1);
    });
    return Array.from(chapterMap.entries()).sort((a, b) => a[0] - b[0]);
  }, [book]);

  if (!collection || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Book not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/bible/${id}`, { state: { collection } })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {collection.title}
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">{book.name}</h1>
          </div>
          <p className="text-muted-foreground">
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {chapters.map(([chapterNum, verseCount]) => (
            <Card
              key={chapterNum}
              className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary text-center"
              onClick={() => navigate(`/bible/${id}/book/${encodeURIComponent(book.name)}/chapter/${chapterNum}`, { 
                state: { collection, book, chapterNum } 
              })}
            >
              <div className="font-bold text-2xl text-foreground mb-1">{chapterNum}</div>
              <div className="text-xs text-muted-foreground">{verseCount} verses</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BibleBookView;
