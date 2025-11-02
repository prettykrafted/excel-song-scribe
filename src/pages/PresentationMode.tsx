import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Settings, Maximize, Minimize } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';

const STORAGE_KEY = 'presentation-settings';

interface PresentationSettings {
  backgroundColor: string;
  textColor: string;
  baseFontSize: number;
  isBold: boolean;
  showStanzaLabel: boolean;
  showSongTitle: boolean;
}

const defaultSettings: PresentationSettings = {
  backgroundColor: '#1a2332',
  textColor: '#f5f1e8',
  baseFontSize: 50,
  isBold: false,
  showStanzaLabel: true,
  showSongTitle: true,
};

const PresentationMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hymn = location.state?.hymn as Hymn;
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [adaptiveFontSize, setAdaptiveFontSize] = useState(50);
  
  // Load settings from localStorage
  const loadSettings = (): PresentationSettings => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return defaultSettings;
  };

  const [settings, setSettings] = useState<PresentationSettings>(loadSettings());
  const { backgroundColor, textColor, baseFontSize, isBold, showStanzaLabel, showSongTitle } = settings;

  // Save settings to localStorage
  const updateSettings = (newSettings: Partial<PresentationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Build slides array: stanza -> chorus pattern
  const slides = hymn?.stanzas.flatMap((stanza, idx) => {
    const stanzaSlide = { type: 'stanza' as const, content: stanza, number: idx + 1 };
    if (hymn.chorus) {
      return [stanzaSlide, { type: 'chorus' as const, content: hymn.chorus, number: undefined }];
    }
    return [stanzaSlide];
  }) || [];

  const currentSlide = slides[currentIndex];

  // Dynamic font sizing to fit screen
  useEffect(() => {
    if (!currentSlide || !contentRef.current || !containerRef.current) return;
    
    const adjustFontSize = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const contentLength = currentSlide.content.length;
      const lineCount = currentSlide.content.split('\n').length;
      
      let calculatedSize = baseFontSize;
      
      // Adjust for content length
      if (contentLength > 400) calculatedSize *= 0.65;
      else if (contentLength > 300) calculatedSize *= 0.75;
      else if (contentLength > 200) calculatedSize *= 0.85;
      
      // Adjust for line count
      if (lineCount > 10) calculatedSize *= 0.7;
      else if (lineCount > 8) calculatedSize *= 0.8;
      else if (lineCount > 6) calculatedSize *= 0.9;
      
      // Fit to container height
      const estimatedHeight = lineCount * calculatedSize * 1.5;
      if (estimatedHeight > containerHeight * 0.8) {
        calculatedSize = (containerHeight * 0.8) / (lineCount * 1.5);
      }
      
      // Fit to container width (rough estimate)
      const avgLineLength = contentLength / lineCount;
      const estimatedWidth = avgLineLength * calculatedSize * 0.6;
      if (estimatedWidth > containerWidth * 0.9) {
        calculatedSize = (containerWidth * 0.9) / (avgLineLength * 0.6);
      }
      
      setAdaptiveFontSize(Math.max(20, Math.min(calculatedSize, 100)));
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [currentSlide, baseFontSize, isFullscreen]);

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

  // Fullscreen management
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          navigate(-1);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious, navigate, toggleFullscreen]);

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
        <Button 
          variant="secondary" 
          size="icon"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>

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
                    onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
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
                    onChange={(e) => updateSettings({ textColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={textColor}
                    onChange={(e) => updateSettings({ textColor: e.target.value })}
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
                  onChange={(e) => updateSettings({ baseFontSize: Number(e.target.value) })}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="bold-text">Bold Text</Label>
                <Switch
                  id="bold-text"
                  checked={isBold}
                  onCheckedChange={(checked) => updateSettings({ isBold: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-stanza">Show Stanza Label</Label>
                <Switch
                  id="show-stanza"
                  checked={showStanzaLabel}
                  onCheckedChange={(checked) => updateSettings({ showStanzaLabel: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-title">Show Song Title</Label>
                <Switch
                  id="show-title"
                  checked={showSongTitle}
                  onCheckedChange={(checked) => updateSettings({ showSongTitle: checked })}
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
      <div ref={containerRef} className="flex-1 flex items-center justify-center p-12">
        <div ref={contentRef} className="max-w-5xl w-full text-center">
          {showStanzaLabel && (
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
          )}
          
          <p 
            className="whitespace-pre-wrap leading-relaxed"
            style={{ 
              fontSize: `${adaptiveFontSize}px`,
              fontStyle: currentSlide.type === 'chorus' ? 'italic' : 'normal',
              fontWeight: isBold ? 'bold' : 'normal'
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

        {showSongTitle && (
          <div className="text-center">
            <p className="font-semibold text-lg">{hymn.globalName}</p>
            <p className="text-sm opacity-70">
              {currentIndex + 1} / {slides.length}
            </p>
          </div>
        )}

        {!showSongTitle && (
          <div className="text-center">
            <p className="text-sm opacity-70">
              {currentIndex + 1} / {slides.length}
            </p>
          </div>
        )}

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