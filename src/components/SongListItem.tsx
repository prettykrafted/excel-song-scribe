import { Music } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Hymn } from '@/types/hymn';

interface SongListItemProps {
  hymn: Hymn;
  onClick: () => void;
}

const SongListItem = ({ hymn, onClick }: SongListItemProps) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-semibold flex-shrink-0">
          {hymn.songNumber}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{hymn.globalName}</h3>
          <p className="text-sm text-muted-foreground truncate">{hymn.title}</p>
        </div>
        <Music className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </CardContent>
    </Card>
  );
};

export default SongListItem;
