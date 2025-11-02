import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Hymn } from '@/types/hymn';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const PresentationMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hymn = location.state?.hymn as Hymn;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#1a2332');
  const [textColor, setTextColor] = useState('#f5f1e8');
  const [baseFontSize, setBaseFontSize] = useState(48);
  const [adaptiveFontSize, setAdaptiveFontSize] = useState(48);

  // Build slides array: stanza -> chorus pattern
  const slides = hymn?.stanzas.flatMap((stanza, idx) => {
    const stanzaSlide = { type: 'stanza' as const, content: stanza, number: idx + 1 };
    if (hymn.chorus) {
      return [stanzaSlide, { type: 'chorus' as const, content: hymn.chorus, number: undefined }];
    }
    return [stanzaSlide];
  }) || [];

  const currentSlide = slides[currentIndex];

  // Adaptive font sizing based on content length
  useEffect(() => {
    if (!currentSlide) return;
    
    const contentLength = currentSlide.content.length;
    const lineCount = currentSlide.content.split('\n').length;
    
    let calculated = baseFontSize;
    
    // Adjust for content length
    if (contentLength > 400) calculated *= 0.7;
    else if (contentLength > 300) calculated *= 0.8;
    else if (contentLength > 200) calculated *= 0.9;
    
    // Adjust for line count
    if (lineCount > 8) calculated *= 0.85;
    else if (lineCount > 6) calculated *= 0.95;
    
    setAdaptiveFontSize(Math.max(24, Math.min(calculated, 72)));
  }, [currentSlide, baseFontSize]);

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, slides.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'Escape') {
        navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious, navigate]);

  if (!hymn || !currentSlide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No song selected</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col relative"
      style={{ backgroundColor, color: textColor }}
    >
      {/* Top controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Presentation Settings</SheetTitle>
              <SheetDescription>
                Customize the appearance of your presentation
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div>
                <Label htmlFor="bg-color">Background Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="bg-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="text-color"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="font-size">Base Font Size: {baseFontSize}px</Label>
                <Input
                  id="font-size"
                  type="range"
                  min="24"
                  max="96"
                  value={baseFontSize}
                  onChange={(e) => setBaseFontSize(Number(e.target.value))}
                  className="mt-2"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <Button 
          variant="secondary" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="max-w-5xl w-full text-center">
          <div className="mb-8">
            <h2 
              className="font-bold mb-2"
              style={{ fontSize: `${Math.min(adaptiveFontSize * 0.6, 36)}px` }}
            >
              {currentSlide.type === 'stanza' && currentSlide.number
                ? `Stanza ${currentSlide.number}` 
                : 'Chorus'}
            </h2>
          </div>
          
          <p 
            className="whitespace-pre-wrap leading-relaxed"
            style={{ 
              fontSize: `${adaptiveFontSize}px`,
              fontStyle: currentSlide.type === 'chorus' ? 'italic' : 'normal'
            }}
          >
            {currentSlide.content}
          </p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="p-6 flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="text-center">
          <p className="font-semibold text-lg">{hymn.globalName}</p>
          <p className="text-sm opacity-70">
            {currentIndex + 1} / {slides.length}
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={handleNext}
          disabled={currentIndex === slides.length - 1}
          className="gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PresentationMode;
