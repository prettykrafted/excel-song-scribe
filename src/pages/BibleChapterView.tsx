import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BibleCollection, BibleBook } from '@/types/bible';

const BibleChapterView = () => {
  const { id, bookName, chapter } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const collection = location.state?.collection as BibleCollection;
  const book = location.state?.book as BibleBook;
  const chapterNum = parseInt(chapter || '1');

  const verses = useMemo(() => {
    if (!book) return [];
    return book.verses.filter(v => v.chapter === chapterNum);
  }, [book, chapterNum]);

  const maxChapter = useMemo(() => {
    if (!book) return 1;
    return Math.max(...book.verses.map(v => v.chapter));
  }, [book]);

  if (!collection || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Chapter not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const goToPrevChapter = () => {
    if (chapterNum > 1) {
      navigate(`/bible/${id}/book/${encodeURIComponent(book.name)}/chapter/${chapterNum - 1}`, {
        state: { collection, book, chapterNum: chapterNum - 1 }
      });
    }
  };

  const goToNextChapter = () => {
    if (chapterNum < maxChapter) {
      navigate(`/bible/${id}/book/${encodeURIComponent(book.name)}/chapter/${chapterNum + 1}`, {
        state: { collection, book, chapterNum: chapterNum + 1 }
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/bible/${id}/book/${encodeURIComponent(book.name)}`, { state: { collection, book } })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {book.name}
        </Button>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">{book.name} {chapterNum}</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevChapter}
                disabled={chapterNum <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextChapter}
                disabled={chapterNum >= maxChapter}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-card rounded-lg p-6 border">
            {verses.map((verse) => (
              <p key={`${verse.chapter}:${verse.verse}`} className="mb-4 text-foreground">
                <sup className="text-primary font-bold mr-2">{verse.verse}</sup>
                {verse.text}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={goToPrevChapter}
            disabled={chapterNum <= 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous Chapter
          </Button>
          <Button
            variant="outline"
            onClick={goToNextChapter}
            disabled={chapterNum >= maxChapter}
          >
            Next Chapter
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BibleChapterView;
