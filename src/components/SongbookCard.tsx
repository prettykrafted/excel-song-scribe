import { Book } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Songbook } from '@/types/hymn';

interface SongbookCardProps {
  songbook: Songbook;
  onClick: () => void;
}

const SongbookCard = ({ songbook, onClick }: SongbookCardProps) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 bg-card"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Book className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">{songbook.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{songbook.hymns.length} hymns</p>
      </CardContent>
    </Card>
  );
};

export default SongbookCard;
