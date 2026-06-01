import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, 
  Sun, 
  Book, 
  BookOpen,
  Calendar as CalendarIcon, 
  MessageSquare, 
  Compass, 
  Clock,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Mic,
  Search,
  Menu,
  X,
  Settings,
  Bell,
  BellOff,
  MapPin,
  RefreshCw,
  Copy,
  Share2,
  Heart,
  Star,
  Activity,
  Check,
  PenTool,
  Trash2,
  RotateCcw,
  History,
  Plus,
  List,
  ArrowUp,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  Database
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, backupToCloud, fetchFromCloud } from './services/firebase';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { cn } from './lib/utils';
import { getDailyHadith } from './services/geminiService';
import { getPrayerTimes, CALCULATION_METHODS, geocodeLocation, reverseGeocode } from './services/prayerService';
import { DUAS, EVENTS, ZIYARATS, NAMAZ, SALAT_MASOOMEEN, SALAWAAT } from './constants';
import { getDailyRecommendations, Recommendation } from './services/recommendationService';
import { getHijriDateString, getHijriDateParts, ISLAMIC_MONTHS } from './lib/hijri';
import { 
  Hadith, 
  PrayerTime, 
  Dua, 
  DuaLine, 
  Ziyarat, 
  IslamicEvent, 
  PrayerSettings, 
  PrayerReminder, 
  JournalEntry, 
  RelatedItem,
  AudioTrack,
  AudioState
} from './types';
import { useTranslation } from './i18n';

// Audio Context
interface AudioContextType extends AudioState {
  playTrack: (track: AudioTrack, onEnded?: () => void) => void;
  togglePlay: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  fastForward: () => void;
  rewind: () => void;
}

const AudioContext = React.createContext<AudioContextType | undefined>(undefined);

function useAudio() {
  const context = React.useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AudioState>({
    currentTrack: null,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 0.8,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndedRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    
    const updateTime = () => setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    const updateDuration = () => setState(prev => ({ ...prev, duration: audio.duration || 0 }));
    const onEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      if (onEndedRef.current) {
        onEndedRef.current();
      }
    };
    const onPlay = () => setState(prev => ({ ...prev, isPlaying: true }));
    const onPause = () => setState(prev => ({ ...prev, isPlaying: false }));

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.pause();
    };
  }, []);

  const playTrack = (track: AudioTrack, onEnded?: () => void) => {
    if (!audioRef.current) return;
    
    if (state.currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    onEndedRef.current = onEnded || null;
    audioRef.current.src = track.url;
    audioRef.current.play().catch(console.error);
    setState(prev => ({ ...prev, currentTrack: track, isPlaying: true }));
  };

  const togglePlay = () => {
    if (!audioRef.current || !state.currentTrack) return;
    if (state.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const stop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setState(prev => ({ ...prev, currentTrack: null, isPlaying: false, currentTime: 0, duration: 0 }));
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
  };

  const setVolume = (volume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    setState(prev => ({ ...prev, volume }));
  };

  const fastForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioRef.current.duration);
  };

  const rewind = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
  };

  const value = {
    ...state,
    playTrack,
    togglePlay,
    stop,
    seek,
    setVolume,
    fastForward,
    rewind,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

function PersistentAudioPlayer() {
  const { currentTrack, isPlaying, duration, currentTime, togglePlay, stop, seek } = useAudio();

  if (!currentTrack) return null;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
      className="fixed top-2 left-4 right-4 z-[9999] pointer-events-none pt-2"
    >
      <div className="max-w-[400px] mx-auto pointer-events-auto">
        <div className="bg-olive/60 text-paper rounded-2xl p-2.5 px-4 shadow-xl border border-paper/10 backdrop-blur-lg overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="serif text-xs font-bold truncate text-paper">{currentTrack.title}</h4>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-widest text-gold font-bold opacity-90">
                  {currentTrack.category || 'Audio'}
                </span>
                <span className="text-[10px] font-mono opacity-70">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-gold text-olive flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>
              <button 
                onClick={stop} 
                className="p-2 hover:bg-paper/10 rounded-full transition-colors text-paper/60 hover:text-gold"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          
          <div className="mt-2 relative">
            <input 
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime || 0}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-1 bg-paper/20 rounded-full cursor-pointer accent-gold appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const getFontSize = (baseSize: string, arabicFontSize: number = 5) => {
  const tiers = ['text-[10px]', 'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl'];
  const baseIndex = tiers.indexOf(baseSize);
  if (baseIndex === -1) return baseSize;
  const offset = Number(arabicFontSize) - 5;
  const newIndex = Math.min(Math.max(baseIndex + offset, 0), tiers.length - 1);
  return tiers[newIndex];
};

function SearchView({ 
  settings, 
  onNavigate, 
  setSelectedDua, 
  setSelectedZiyarat,
  setSelectedSurahNumber,
  setSelectedSectionIndex,
  surahs = []
}: { 
  settings: PrayerSettings, 
  onNavigate: (tab: string) => void,
  setSelectedDua: (dua: Dua| null) => void,
  setSelectedZiyarat: (ziyarat: Ziyarat | null) => void,
  setSelectedSurahNumber: (num: number | null) => void,
  setSelectedSectionIndex: (index: number) => void,
  surahs?: any[]
}) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'quran' | 'duas' | 'ziyarats' | 'events'>('all');
  const [quranResults, setQuranResults] = useState<any[]>([]);
  const [isSearchingQuran, setIsSearchingQuran] = useState(false);
  const t = useTranslation(settings.language);

  const filteredSurahs = query.length > 0 ? surahs.filter(s => 
    s.englishName.toLowerCase().includes(query.toLowerCase()) ||
    s.name.includes(query) ||
    s.number.toString() === query
  ) : [];

  const filteredDuas = DUAS.filter(d => 
    (d.title?.toLowerCase().includes(query.toLowerCase()) || false) || 
    (d.translation?.toLowerCase().includes(query.toLowerCase()) || false) ||
    (d.translationUrdu && d.translationUrdu.includes(query))
  ).sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const filteredZiyarats = ZIYARATS.filter(z => 
    (z.title?.toLowerCase().includes(query.toLowerCase()) || false) || 
    (z.translation?.toLowerCase().includes(query.toLowerCase()) || false) ||
    (z.translationUrdu && z.translationUrdu.includes(query))
  ).sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  
  const filteredEvents = EVENTS.filter(e => 
    (e.title?.toLowerCase().includes(query.toLowerCase()) || false)
  );

  useEffect(() => {
    if (query.length > 2 && (activeFilter === 'all' || activeFilter === 'quran')) {
      const searchQuran = async () => {
        setIsSearchingQuran(true);
        try {
          const res = await fetch(`https://api.alquran.cloud/v1/search/${query}/all/en`);
          const data = await res.json();
          if (data.code === 200) {
            setQuranResults(data.data.matches);
          } else {
            setQuranResults([]);
          }
        } catch (error) {
          console.error("Error searching Quran:", error);
          setQuranResults([]);
        } finally {
          setIsSearchingQuran(false);
        }
      };
      
      const timeoutId = setTimeout(searchQuran, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setQuranResults([]);
    }
  }, [query, activeFilter]);

  const hasResults = query.length > 0 && (
    (activeFilter === 'all' || activeFilter === 'quran') && filteredSurahs.length > 0 ||
    (activeFilter === 'all' || activeFilter === 'duas') && filteredDuas.length > 0 ||
    (activeFilter === 'all' || activeFilter === 'ziyarats') && filteredZiyarats.length > 0 ||
    (activeFilter === 'all' || activeFilter === 'events') && filteredEvents.length > 0 ||
    (activeFilter === 'all' || activeFilter === 'quran') && quranResults.length > 0
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-6"
    >
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-olive/40" size={20} />
        <input
          type="text"
          autoFocus
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-paper rounded-[24px] p-4 pl-12 border border-olive/10 focus:outline-none focus:ring-2 focus:ring-gold/20 text-olive placeholder:text-olive/40 text-lg"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-olive/40 hover:text-olive"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'quran', 'duas', 'ziyarats', 'events'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter as any)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all",
              activeFilter === filter 
                ? "bg-olive text-paper" 
                : "bg-paper text-olive/60 border border-olive/10 hover:bg-olive/5"
            )}
          >
            {t(filter as any)}
          </button>
        ))}
      </div>

      <div className="space-y-6 pb-20">
        {!query ? (
          <div className="text-center py-20 text-olive/40">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p>{t('typeToSearch')}</p>
          </div>
        ) : !hasResults && !isSearchingQuran ? (
          <div className="text-center py-20 text-olive/40">
            <p>{t('noResults')} "{query}"</p>
          </div>
        ) : (
          <>
            {(activeFilter === 'all' || activeFilter === 'quran') && filteredSurahs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gold">{t('surahs')}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {filteredSurahs.map(surah => (
                    <button 
                      key={surah.number}
                      onClick={() => {
                        setSelectedSurahNumber(surah.number);
                        onNavigate('quran');
                      }}
                      className="w-full text-left bg-paper p-4 rounded-[20px] border border-olive/5 hover:bg-olive/5 transition-colors flex justify-between items-center"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center text-[10px] font-bold">
                          {surah.number}
                        </span>
                        <div>
                          <h4 className="serif text-lg text-olive">{surah.englishName}</h4>
                          <p className="text-[10px] text-olive/40 uppercase tracking-widest">{surah.englishNameTranslation}</p>
                        </div>
                      </div>
                      <span className="font-arabic text-xl text-olive">{surah.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(activeFilter === 'all' || activeFilter === 'quran') && (quranResults.length > 0 || isSearchingQuran) && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gold">{t('quranVerses')}</h3>
                {isSearchingQuran ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                  </div>
                ) : (
                  quranResults.slice(0, 10).map((result, idx) => (
                    <button 
                      key={`quran-search-${result.surah.number}-${result.numberInSurah}-${idx}`}
                      onClick={() => {
                        setSelectedSurahNumber(result.surah.number);
                        onNavigate('quran');
                      }}
                      className="w-full text-left bg-paper p-4 rounded-[20px] border border-olive/5 hover:bg-olive/5 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] uppercase tracking-widest text-gold font-bold">
                          {result.surah.englishName} • Verse {result.numberInSurah}
                        </span>
                      </div>
                      <p className="text-sm text-olive/80 leading-relaxed italic line-clamp-2">
                        {result.text}
                      </p>
                    </button>
                  ))
                )}
                {quranResults.length > 10 && (
                  <p className="text-xs text-center text-olive/40 italic">Showing top 10 results</p>
                )}
              </div>
            )}

            {(activeFilter === 'all' || activeFilter === 'duas') && filteredDuas.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gold">{t('duas')}</h3>
                {filteredDuas.map(dua => (
                  <button 
                    key={dua.id}
                    onClick={() => {
                      setSelectedDua(dua);
                      setSelectedSectionIndex(0);
                      onNavigate('duas');
                    }}
                    className="w-full text-left bg-paper p-4 rounded-[20px] border border-olive/5 hover:bg-olive/5 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] uppercase tracking-widest text-gold font-bold">{dua.category}</p>
                        {dua.audioUrl && <Volume2 size={10} className="text-gold" />}
                      </div>
                      <h4 className="serif text-lg text-olive">{dua.title}</h4>
                    </div>
                    <ChevronRight className="text-gold" size={16} />
                  </button>
                ))}
              </div>
            )}

            {(activeFilter === 'all' || activeFilter === 'ziyarats') && filteredZiyarats.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gold">{t('ziyarats')}</h3>
                {filteredZiyarats.map(ziyarat => (
                  <button 
                    key={ziyarat.id}
                    onClick={() => {
                      setSelectedZiyarat(ziyarat);
                      setSelectedSectionIndex(0);
                      onNavigate('ziyarats');
                    }}
                    className="w-full text-left bg-paper p-4 rounded-[20px] border border-olive/5 hover:bg-olive/5 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] uppercase tracking-widest text-gold font-bold">{ziyarat.category}</p>
                        {ziyarat.audioUrl && <Volume2 size={10} className="text-gold" />}
                      </div>
                      <h4 className="serif text-lg text-olive">{ziyarat.title}</h4>
                    </div>
                    <ChevronRight className="text-gold" size={16} />
                  </button>
                ))}
              </div>
            )}

            {(activeFilter === 'all' || activeFilter === 'events') && filteredEvents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gold">{t('events')}</h3>
                {filteredEvents.map((event, idx) => (
                  <div key={`search-event-${idx}-${event.title}`} className="bg-paper p-4 rounded-[20px] border border-olive/5">
                    <h4 className="serif text-lg text-olive">{event.title}</h4>
                    <p className="text-xs text-olive/60 mt-1">{event.hijriDay} {ISLAMIC_MONTHS[event.hijriMonth - 1]}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

const safeStringify = (data: any, key: string) => {
  const cache = new Set();
  try {
    return JSON.stringify(data, (k, v) => {
      if (typeof v === 'object' && v !== null) {
        if (cache.has(v)) return '[Circular]';
        cache.add(v);
      }
      return v;
    });
  } catch (e) {
    console.error('Error stringifying', key, e);
    return null;
  }
};

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-warm-bg flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center text-gold mb-6">
            <BellOff size={40} />
          </div>
          <h1 className="serif text-2xl text-olive mb-4">Something went wrong</h1>
          <p className="text-olive/60 mb-8 max-w-xs mx-auto">
            We encountered an unexpected error. Please try refreshing the application.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-olive text-paper rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-olive/90 transition-colors"
          >
            Refresh App
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-paper/50 rounded-xl text-left text-xs text-red-500 overflow-auto max-w-full">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {

  const [activeTab, setActiveTab] = useState<string>('home');
  const [history, setHistory] = useState<string[]>(['home']);
  const [selectedDua, setSelectedDua] = useState<Dua | null>(null);
  const [selectedZiyarat, setSelectedZiyarat] = useState<Ziyarat | null>(null);
  const [selectedSalawat, setSelectedSalawat] = useState<any | null>(null);
  const [selectedNamaz, setSelectedNamaz] = useState<any | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | null>(null);

  // Lifted States for unified cloud sync
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('noor_journal_entries');
    if (saved) {
      try {
        const loaded: JournalEntry[] = JSON.parse(saved);
        const now = new Date();
        const thirtyDaysAgo = 30 * 24 * 60 * 60 * 1000;
        return loaded.filter(e => {
          if (e.deletedAt) {
            return (now.getTime() - new Date(e.deletedAt).getTime()) < thirtyDaysAgo;
          }
          return true;
        });
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [customTasbihs, setCustomTasbihs] = useState<{id: string, name: string, target: number}[]>(() => {
    const saved = localStorage.getItem('custom_tasbihs');
    return saved ? JSON.parse(saved) : [];
  });

  // Firebase auth & cloud sync states
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [settingsSubPage, setSettingsSubPage] = useState<string | null>(null);

  const [readingProgress, setReadingProgress] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('reading_progress');
    return saved ? JSON.parse(saved) : {};
  });



  // Track scroll position
  useEffect(() => {
    if (!selectedDua && !selectedZiyarat) return;

    let itemId = '';
    if (selectedDua) {
      itemId = (selectedDua.sections && selectedDua.sections.length > 0)
        ? `dua-${selectedDua.id}-${selectedSectionIndex}`
        : `dua-${selectedDua.id}`;
    } else if (selectedZiyarat) {
      itemId = (selectedZiyarat.sections && selectedZiyarat.sections.length > 0)
        ? `ziyarat-${selectedZiyarat.id}-${selectedSectionIndex}`
        : `ziyarat-${selectedZiyarat.id}`;
    }

    if (!itemId) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-line-index') || '0');
            setReadingProgress(prev => {
              const current = prev[itemId] || 0;
              if (index > current) {
                const updated = { ...prev, [itemId]: index };
                localStorage.setItem('reading_progress', JSON.stringify(updated));
                return updated;
              }
              return prev;
            });
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40% 0px' }
    );

    // Target elements
    const elements = document.querySelectorAll('[data-line-index]');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [selectedDua, selectedZiyarat, selectedSectionIndex, activeTab]);

  const handleResume = (id: string) => {
    const savedIndex = readingProgress[id];
    if (savedIndex !== undefined) {
      const element = document.querySelector(`[data-line-index="${savedIndex}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };
  const [targetAyahNumber, setTargetAyahNumber] = useState<number | null>(null);
  const [targetHadith, setTargetHadith] = useState<Hadith | null>(null);
  const [cityName, setCityName] = useState<string>('');
  const [surahs, setSurahs] = useState<any[]>([]);
  const [isLoadingSurahs, setIsLoadingSurahs] = useState(false);
  const [surahsError, setSurahsError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number, y: number } | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // min swipe distance
  const minSwipeDistance = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    const firstTouch = e.touches[0] || e.changedTouches[0];
    if (firstTouch) {
      setTouchEnd(null);
      setTouchStart({ x: firstTouch.clientX, y: firstTouch.clientY });
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const firstTouch = e.touches[0] || e.changedTouches[0];
    if (firstTouch) {
      setTouchEnd({ x: firstTouch.clientX, y: firstTouch.clientY });
    }
  };

  const onTouchEnd = () => {
    handleSwipeCheck();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('select') || target.closest('.no-swipe')) {
      return;
    }
    setTouchEnd(null);
    setTouchStart({ x: e.clientX, y: e.clientY });
    setIsMouseDown(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isMouseDown && touchStart) {
      setTouchEnd({ x: e.clientX, y: e.clientY });
    }
  };

  const onMouseUp = () => {
    if (isMouseDown) {
      handleSwipeCheck();
      setIsMouseDown(false);
    }
  };

  const onMouseLeave = () => {
    if (isMouseDown) {
      handleSwipeCheck();
      setIsMouseDown(false);
    }
  };

  const handleSwipeCheck = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    
    const isRightSwipe = distanceX < -minSwipeDistance;
    
    if (Math.abs(distanceX) > Math.abs(distanceY) * 1.2) {
      const edgeThreshold = 180; // generous left edge region mapping (180px)
      const canGoBack = activeTab !== 'home' || 
                        selectedDua !== null || 
                        selectedZiyarat !== null || 
                        selectedSurahNumber !== null || 
                        selectedNamaz !== null || 
                        selectedSalawat !== null || 
                        targetHadith !== null;
      if (isRightSwipe && touchStart.x < edgeThreshold && canGoBack) {
        goBack();
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const [bookmarks, setBookmarks] = useState<any[]>(() => {
    const saved = localStorage.getItem('app_bookmarks');
    if (saved) return JSON.parse(saved);
    
    const migrated = [];
    const oldQuran = localStorage.getItem('quran_bookmarks');
    if (oldQuran) {
      const parsed = JSON.parse(oldQuran);
      migrated.push(...parsed.map((b: any) => ({
        id: `quran-${b.surahNumber}-${b.numberInSurah}`,
        type: 'quran',
        title: b.surahName,
        subtitle: `Verse ${b.numberInSurah}`,
        arabic: b.text,
        data: b
      })));
    }
    
    const oldHadith = localStorage.getItem('noor_favorite_hadiths');
    if (oldHadith) {
      const parsed = JSON.parse(oldHadith);
      migrated.push(...parsed.map((h: any) => ({
        id: `hadith-${((h && h.arabic) || '').substring(0, 20)}`,
        type: 'hadith',
        title: 'Daily Wisdom',
        arabic: h.arabic,
        data: h
      })));
    }
    
    if (migrated.length > 0) {
      const stringified = safeStringify(migrated, 'app_bookmarks');
      if (stringified) localStorage.setItem('app_bookmarks', stringified);
    }
    return migrated;
  });

  const toggleBookmark = (item: any) => {
    const isBookmarked = bookmarks.some(b => b.id === item.id);
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter(b => b.id !== item.id);
    } else {
      newBookmarks = [...bookmarks, item];
    }
    setBookmarks(newBookmarks);
    const stringified = safeStringify(newBookmarks, 'app_bookmarks');
    if (stringified) localStorage.setItem('app_bookmarks', stringified);
  };

  const navigateTo = (tab: string) => {
    if (tab === 'home') {
      setActiveTab('home');
      setHistory(['home']);
      // Clear all selections for "fresh" start
      setSelectedDua(null);
      setSelectedZiyarat(null);
      setSelectedSurahNumber(null);
      setTargetAyahNumber(null);
      setTargetHadith(null);
      setSelectedSectionIndex(0);
      return;
    }
    
    if (activeTab === tab) return;

    setHistory(prev => [...prev, tab]);
    setActiveTab(tab);
  };

  const goBack = () => {
    // 1. Check for detail views to clear first
    if (selectedDua) {
      setSelectedDua(null);
      setSelectedSectionIndex(0);
      return;
    }
    if (selectedZiyarat) {
      setSelectedZiyarat(null);
      setSelectedSectionIndex(0);
      return;
    }
    if (selectedSurahNumber) {
      setSelectedSurahNumber(null);
      setTargetAyahNumber(null);
      return;
    }
    if (targetHadith) {
      setTargetHadith(null);
      return;
    }
    if (selectedNamaz) {
      setSelectedNamaz(null);
      return;
    }
    if (selectedSalawat) {
      setSelectedSalawat(null);
      return;
    }

    // 2. Tab history navigation
    setHistory(prev => {
      if (prev.length <= 1) return prev;
      const newHist = prev.slice(0, -1);
      const prevTab = newHist[newHist.length - 1];
      setActiveTab(prevTab);
      
      // If we go back to home, ensure it's fresh
      if (prevTab === 'home') {
        setSelectedDua(null);
        setSelectedZiyarat(null);
        setSelectedSurahNumber(null);
        setTargetAyahNumber(null);
        setTargetHadith(null);
      }
      
      return newHist;
    });
  };

  const scrollToTop = () => {
    const containers = document.querySelectorAll('.overflow-y-auto');
    let scrolled = false;
    containers.forEach(container => {
      if (container.scrollTop > 10) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
        scrolled = true;
      }
    });
    
    if (!scrolled) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = (e: any) => {
      let scrollTop = 0;
      if (e.target === document || e.target === window) {
        scrollTop = window.scrollY || document.documentElement.scrollTop;
      } else if (e.target && e.target.scrollTop !== undefined) {
        scrollTop = e.target.scrollTop;
      }
      
      // Update state if we are above or below threshold
      setShowScrollTop(prev => {
        const shouldShow = scrollTop > 300;
        return shouldShow;
      });
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Keep it empty or clear previous ones
    if (notifications.length > 0) {
      const stringified = safeStringify(notifications, 'noor_notifications_v3');
      if (stringified) localStorage.setItem('noor_notifications_v3', stringified);
    }
  }, [notifications]);

  // Click away for notifications
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      // For mobile devices
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);

  // Clear selections when returning to home via any means
  useEffect(() => {
    if (activeTab === 'home') {
      setSelectedSurahNumber(null);
      setSelectedDua(null);
      setSelectedZiyarat(null);
      setSelectedSalawat(null);
      setSelectedNamaz(null);
      setTargetAyahNumber(null);
      setTargetHadith(null);
    }
  }, [activeTab]);

  // Prayer related state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [prayerSettings, setPrayerSettings] = useState<PrayerSettings>(() => {
    const saved = localStorage.getItem('noor_prayer_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...parsed, 
        arabicFont: parsed.arabicFont || 'Amiri Quran',
        hijriOffset: parsed.hijriOffset || 0,
        prayerOffsets: parsed.prayerOffsets || {},
        language: parsed.language || 'en',
        arabicFontSize: parsed.arabicFontSize || 5
      };
    }
    return {
      method: 'Tehran',
      madhab: 'Shafi',
      highLatitudeRule: 'MiddleOfTheNight',
      arabicFont: 'Amiri Quran',
      hijriOffset: 0,
      prayerOffsets: {},
      language: 'en',
      arabicFontSize: 5
    };
  });

  useEffect(() => {
    const stringified = safeStringify(prayerSettings, 'noor_prayer_settings');
    if (stringified) localStorage.setItem('noor_prayer_settings', stringified);
  }, [prayerSettings]);
  const [reminders, setReminders] = useState<PrayerReminder[]>(() => {
    const saved = localStorage.getItem('noor_reminders');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 'fajr', enabled: false },
      { id: 'dhuhr', enabled: false },
      { id: 'maghrib', enabled: false },
    ];
  });

  useEffect(() => {
    const stringified = safeStringify(reminders, 'noor_reminders');
    if (stringified) localStorage.setItem('noor_reminders', stringified);
  }, [reminders]);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Inteligent auto merge on login
  const handleAutoSyncOnLogin = async (user: any) => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      const cloudData = await fetchFromCloud(user.uid);
      if (cloudData) {
        let updated = false;

        if (cloudData.bookmarks && Array.isArray(cloudData.bookmarks)) {
          setBookmarks(prev => {
            const merged = [...prev];
            cloudData.bookmarks!.forEach((cb: any) => {
              if (!merged.some(mb => mb.id === cb.id)) {
                merged.push(cb);
                updated = true;
              }
            });
            if (updated) {
              localStorage.setItem('app_bookmarks', JSON.stringify(merged));
            }
            return merged;
          });
        }

        if (cloudData.prayerSettings) {
          setPrayerSettings(prev => {
            const merged = { ...prev, ...cloudData.prayerSettings };
            localStorage.setItem('noor_prayer_settings', JSON.stringify(merged));
            return merged;
          });
        }

        if (cloudData.reminders && Array.isArray(cloudData.reminders)) {
          setReminders(prev => {
            const merged = [...prev];
            cloudData.reminders!.forEach((cr: any) => {
              if (!merged.some(mr => mr.id === cr.id)) {
                merged.push(cr);
                updated = true;
              }
            });
            if (updated) {
              localStorage.setItem('noor_reminders', JSON.stringify(merged));
            }
            return merged;
          });
        }

        if (cloudData.readingProgress) {
          setReadingProgress(prev => {
            const merged = { ...prev, ...cloudData.readingProgress };
            localStorage.setItem('reading_progress', JSON.stringify(merged));
            return merged;
          });
        }

        if (cloudData.journalEntries && Array.isArray(cloudData.journalEntries)) {
          setJournalEntries(prev => {
            const merged = [...prev];
            cloudData.journalEntries!.forEach((cj: any) => {
              if (!merged.some(mj => mj.id === cj.id)) {
                merged.push(cj);
                updated = true;
              }
            });
            if (updated) {
              localStorage.setItem('noor_journal_entries', JSON.stringify(merged));
            }
            return merged;
          });
        }

        if (cloudData.customTasbihs && Array.isArray(cloudData.customTasbihs)) {
          setCustomTasbihs(prev => {
            const merged = [...prev];
            cloudData.customTasbihs!.forEach((ct: any) => {
              if (!merged.some(mt => mt.id === ct.id)) {
                merged.push(ct);
                updated = true;
              }
            });
            if (updated) {
              localStorage.setItem('custom_tasbihs', JSON.stringify(merged));
            }
            return merged;
          });
        }

        setSyncStatus('success');
        setLastSync(new Date().toISOString());
      } else {
        // No backup exists on cloud, upload current local state instantly to set up initial copy
        const localJournal = JSON.parse(localStorage.getItem('noor_journal_entries') || '[]');
        const localTasbihs = JSON.parse(localStorage.getItem('custom_tasbihs') || '[]');

        await backupToCloud(user.uid, {
          prayerSettings,
          journalEntries: localJournal,
          bookmarks,
          customTasbihs: localTasbihs,
          readingProgress,
          reminders
        });
        setSyncStatus('success');
        setLastSync(new Date().toISOString());
      }
    } catch (err) {
      console.error("Cloud auto sync login failed:", err);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerSync = async () => {
    if (!auth.currentUser) return;
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      await backupToCloud(auth.currentUser.uid, {
        prayerSettings,
        journalEntries,
        bookmarks,
        customTasbihs,
        readingProgress,
        reminders
      });
      setSyncStatus('success');
      setLastSync(new Date().toISOString());
    } catch (err) {
      console.error("Background sync failed:", err);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        handleAutoSyncOnLogin(user);
      } else {
        setSyncStatus('idle');
      }
    });
    return () => unsubscribe();
  }, []);

  // Background auto sync trigger on state changes (4 seconds debounce)
  useEffect(() => {
    if (!firebaseUser) return;
    const timer = setTimeout(() => {
      triggerSync();
    }, 4000);
    return () => clearTimeout(timer);
  }, [bookmarks, prayerSettings, reminders, readingProgress, journalEntries, customTasbihs, firebaseUser]);

  useEffect(() => {
    getDailyHadith().then(setHadith);
    
    // Request notification permission
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    // Fetch surahs globally
    const fetchSurahs = async () => {
      // Check cache first
      const cached = localStorage.getItem('noor_surahs_v1');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSurahs(parsed);
            setIsLoadingSurahs(false);
            // We can still refresh in background if needed, but for now just return
            return;
          }
        } catch (e) {
          console.warn("Failed to parse cached surahs", e);
        }
      }

      setIsLoadingSurahs(true);
      setSurahsError(null);
      try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.code !== 200) throw new Error(data.data || "Failed to fetch surahs");
        setSurahs(data.data);
        localStorage.setItem('noor_surahs_v1', JSON.stringify(data.data));
      } catch (e) {
        console.error("Error fetching surahs:", e);
        setSurahsError(e instanceof Error ? e.message : "Failed to load surahs");
      } finally {
        setIsLoadingSurahs(false);
      }
    };
    fetchSurahs();
  }, []);

  useEffect(() => {
    if (prayerSettings.manualLocation?.lat && prayerSettings.manualLocation?.lng) {
      const newLoc = {
        lat: prayerSettings.manualLocation.lat,
        lng: prayerSettings.manualLocation.lng
      };
      setLocation(prev => {
        if (prev?.lat === newLoc.lat && prev?.lng === newLoc.lng) return prev;
        return newLoc;
      });
      setLocationError(null);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(prev => {
            if (prev?.lat === newLoc.lat && prev?.lng === newLoc.lng) return prev;
            return newLoc;
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError("Could not get location. Using default (Tehran).");
          // Default to Tehran if geolocation fails
          setLocation({ lat: 35.6892, lng: 51.3890 });
        }
      );
    } else {
      setLocationError("Geolocation not supported. Using default (Tehran).");
      setLocation({ lat: 35.6892, lng: 51.3890 });
    }
  }, [prayerSettings.manualLocation]);

  useEffect(() => {
    if (location) {
      const times = getPrayerTimes(location.lat, location.lng, prayerSettings);
      setPrayerTimes(prev => {
        if (JSON.stringify(prev) === JSON.stringify(times)) return prev;
        return times;
      });

      // Reverse geocode to get city name if not manually set
      if (prayerSettings.manualLocation?.city) {
        setCityName(prayerSettings.manualLocation.city);
      } else {
        reverseGeocode(location.lat, location.lng).then(city => {
          if (city) setCityName(city);
        });
      }
    }
  }, [location, prayerSettings]);

  // Check for reminders every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTimeStr = format(now, 'HH:mm');

      prayerTimes.forEach(pt => {
        const reminder = reminders.find(r => r.id === pt.id);
        if (reminder?.enabled && pt.time === currentTimeStr) {
          // Trigger notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Time for ${pt.name}`, {
              body: `It is now time for ${pt.name} prayer.`,
              icon: '/favicon.ico'
            });
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [prayerTimes, reminders]);

  const toggleReminder = (id: string) => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
        }
      });
    } else {
      setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    }
  };

  const t = useTranslation(prayerSettings.language);

  const handleNavigateToItem = (item: RelatedItem) => {
    if (item.type === 'ziyarat') {
      const z = ZIYARATS.find(ziy => ziy.id === item.id);
      if (z) {
        setSelectedZiyarat(z);
        setActiveTab('ziyarats');
      }
    } else if (item.type === 'dua' || item.type === 'supplication') {
      const d = DUAS.find(dua => dua.id === item.id);
      if (d) {
        setSelectedDua(d);
        setActiveTab('duas');
      }
    }
    window.scrollTo(0, 0);
  };

  const tabs = [
    { id: 'home', label: t('home'), icon: Moon },
    { id: 'quran', label: t('quran'), icon: Book },
    { id: 'namaz', label: t('namaz'), icon: Star },
    { id: 'salawaat', label: t('salawaat'), icon: Heart },
    { id: 'duas', label: t('duas'), icon: BookOpen },
    { id: 'ziyarats', label: t('ziyarats'), icon: BookOpen },
    { id: 'tasbih', label: t('tasbih'), icon: Activity },
    { id: 'calendar', label: t('calendar'), icon: CalendarIcon },
    { id: 'journal', label: t('journal'), icon: PenTool },
  ];

  return (
    <AudioProvider>
      <div 
        className="h-screen overflow-hidden flex flex-col max-w-md mx-auto bg-warm-bg shadow-xl select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
      {/* Header */}
      <header className="px-6 py-1 flex justify-between items-center border-b border-olive/10 bg-paper/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {activeTab !== 'home' && (
            <button onClick={goBack} className="p-1 rounded-full text-olive hover:bg-olive/10 transition-colors">
              <ChevronLeft size={20} />
            </button>
          )}
          <div onClick={() => navigateTo('home')} className="cursor-pointer">
            <h1 className="font-display text-xl font-bold text-olive tracking-wider">Noor</h1>
            <p className="text-[8px] uppercase tracking-[0.2em] text-gold font-semibold -mt-0.5">Shia Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => navigateTo('bookmarks')}
            className={cn(
              "p-1 rounded-full transition-colors",
              activeTab === 'bookmarks' ? "bg-olive/10 text-gold" : "hover:bg-olive/5 text-olive"
            )}
          >
            <Bookmark size={16} />
          </button>
          <button 
            onClick={() => navigateTo('search')}
            className={cn(
              "p-1 rounded-full transition-colors",
              activeTab === 'search' ? "bg-olive/10 text-gold" : "hover:bg-olive/5 text-olive"
            )}
          >
            <Search size={16} />
          </button>
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  setNotifications(notifications.map(n => ({ ...n, read: true })));
                }
              }}
              className={cn(
                "p-1 rounded-full transition-colors relative",
                showNotifications ? "bg-olive/10 text-gold" : "hover:bg-olive/5 text-olive"
              )}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-paper"></span>
              )}
            </button>
 
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-72 bg-paper border border-olive/10 rounded-2xl shadow-xl z-50 p-4 max-h-96 flex flex-col"
                >
                  <div className="flex justify-between items-center mb-3 text-sm">
                    <h3 className="font-bold text-olive">Notifications</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotifications([]);
                        }} 
                        className="text-[10px] text-red-500 uppercase tracking-wider font-bold hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-olive/50 text-center py-4">No notifications</p>
                  ) : (
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                      {notifications.map(n => (
                        <div key={n.id} className="text-xs text-olive/80 border-b border-olive/5 pb-2 last:border-0">
                          <p className="leading-relaxed">{n.message}</p>
                          <span className="text-[9px] opacity-50 block mt-1">
                            {new Date(n.date).toLocaleDateString()} {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => {
              navigateTo('settings');
              setSettingsSubPage('sync_page');
            }}
            className={cn(
              "p-1.5 rounded-full transition-colors relative flex items-center justify-center",
              (activeTab === 'settings' && settingsSubPage === 'sync_page') ? "bg-olive/10 text-gold" : "hover:bg-olive/5 text-olive"
            )}
            title={firebaseUser ? `Linked Backup Account: ${firebaseUser.email}` : "Cloud Backup Disabled - Tap to Sign In"}
          >
            {firebaseUser ? (
              <>
                <Cloud size={16} className={cn(syncStatus === 'syncing' ? "text-gold animate-pulse" : "text-green-600")} />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 ring-1 ring-paper" />
              </>
            ) : (
              <CloudOff size={16} className="opacity-60" />
            )}
          </button>

          <button 
            onClick={() => {
              navigateTo('settings');
              setSettingsSubPage(null);
            }}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              (activeTab === 'settings' && settingsSubPage !== 'sync_page') ? "bg-olive/10 text-gold" : "hover:bg-olive/5 text-olive"
            )}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <HomeView 
              hadith={targetHadith || hadith} 
              prayerTimes={prayerTimes} 
              reminders={reminders} 
              onToggleReminder={toggleReminder}
              locationError={locationError}
              onNavigate={(tab) => navigateTo(tab as any)}
              settings={prayerSettings}
              tabs={tabs}
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
              isTargetHadith={!!targetHadith}
              onClearTargetHadith={() => setTargetHadith(null)}
              cityName={cityName}
              onSelectDua={(dua) => { setSelectedDua(dua); setSelectedSectionIndex(0); navigateTo('duas'); }}
              onSelectZiyarat={(ziyarat) => { setSelectedZiyarat(ziyarat); setSelectedSectionIndex(0); navigateTo('ziyarats'); }}
              onSelectSalawat={(salawat) => { setSelectedSalawat(salawat); navigateTo('salawaat'); }}
              onSelectNamaz={(namaz) => { setSelectedNamaz(namaz); navigateTo('namaz'); }}
            />
          )}
          {activeTab === 'duas' && (
            <DuasView 
              settings={prayerSettings} 
              selectedDua={selectedDua} 
              onSelectDua={setSelectedDua} 
              bookmarks={bookmarks} 
              toggleBookmark={toggleBookmark} 
              goBack={goBack} 
              onNavigateToItem={handleNavigateToItem}
              selectedSectionIndex={selectedSectionIndex}
              setSelectedSectionIndex={setSelectedSectionIndex}
              readingProgress={readingProgress}
              handleResume={handleResume}
            />
          )}
          {activeTab === 'ziyarats' && (
            <ZiyaratsView 
              settings={prayerSettings} 
              selectedZiyarat={selectedZiyarat} 
              onSelectZiyarat={setSelectedZiyarat} 
              bookmarks={bookmarks} 
              toggleBookmark={toggleBookmark} 
              goBack={goBack} 
              onNavigateToItem={handleNavigateToItem}
              selectedSectionIndex={selectedSectionIndex}
              setSelectedSectionIndex={setSelectedSectionIndex}
              readingProgress={readingProgress}
              handleResume={handleResume}
            />
          )}
          {activeTab === 'quran' && (
            <QuranView 
              settings={prayerSettings} 
              selectedSurahNumber={selectedSurahNumber} 
              onSelectSurahNumber={setSelectedSurahNumber} 
              targetAyahNumber={targetAyahNumber} 
              onClearTargetAyah={() => setTargetAyahNumber(null)} 
              bookmarks={bookmarks} 
              toggleBookmark={toggleBookmark} 
              goBack={goBack}
              surahs={surahs}
              isLoadingSurahs={isLoadingSurahs}
              surahsError={surahsError}
            />
          )}
          {activeTab === 'calendar' && <CalendarView settings={prayerSettings} />}
          {activeTab === 'journal' && (
            <JournalView 
              settings={prayerSettings} 
              goBack={goBack}
              entries={journalEntries}
              onSaveEntries={(updated) => {
                setJournalEntries(updated);
                localStorage.setItem('noor_journal_entries', JSON.stringify(updated));
              }}
            />
          )}
          {activeTab === 'namaz' && (
            <NamazView 
              settings={prayerSettings} 
              onBack={() => navigateTo('home')} 
              onNavigateToSalawaat={() => navigateTo('salawaat')}
              selectedNamaz={selectedNamaz}
              onSelectNamaz={setSelectedNamaz}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsView 
              settings={prayerSettings} 
              onUpdateSettings={setPrayerSettings} 
              firebaseUser={firebaseUser}
              isSyncing={isSyncing}
              syncStatus={syncStatus}
              lastSync={lastSync}
              onSyncNow={triggerSync}
              activeSubPage={settingsSubPage}
              onActiveSubPageChange={setSettingsSubPage}
            />
          )}
          {activeTab === 'tasbih' && (
            <TasbihView 
              onBack={goBack} 
              settings={prayerSettings} 
              customTasbihs={customTasbihs}
              onUpdateCustomTasbihs={(tasbihs) => {
                setCustomTasbihs(tasbihs);
                localStorage.setItem('custom_tasbihs', JSON.stringify(tasbihs));
              }}
            />
          )}
          {activeTab === 'salawaat' && (
            <SalawaatView 
              settings={prayerSettings} 
              onBack={() => navigateTo('home')} 
              selectedSalawat={selectedSalawat}
              onSelectSalawat={setSelectedSalawat}
            />
          )}
          {activeTab === 'search' && (
            <SearchView 
              settings={prayerSettings} 
              onNavigate={navigateTo}
              setSelectedDua={setSelectedDua}
              setSelectedZiyarat={setSelectedZiyarat}
              setSelectedSurahNumber={setSelectedSurahNumber}
              setSelectedSectionIndex={setSelectedSectionIndex}
              surahs={surahs}
            />
          )}
          {activeTab === 'bookmarks' && (
            <BookmarksView 
              bookmarks={bookmarks} 
              toggleBookmark={toggleBookmark} 
              onNavigate={navigateTo}
              setSelectedSurahNumber={setSelectedSurahNumber}
              setTargetAyahNumber={setTargetAyahNumber}
              setSelectedDua={setSelectedDua}
              setSelectedZiyarat={setSelectedZiyarat}
              setTargetHadith={setTargetHadith}
              setSelectedSectionIndex={setSelectedSectionIndex}
            />
          )}
        </AnimatePresence>
      </ErrorBoundary>
      </main>

      {/* Go to Top Button */}
      <AnimatePresence>
        {showScrollTop && activeTab !== 'home' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-6 z-[999] w-12 h-12 bg-gold text-paper rounded-full shadow-lg flex items-center justify-center hover:bg-gold/90 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50"
            title="Go to top"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
      <PersistentAudioPlayer />
    </AudioProvider>
  );
}

interface HomeViewProps {
  hadith: Hadith | null;
  prayerTimes: PrayerTime[];
  reminders: PrayerReminder[];
  onToggleReminder: (id: string) => void;
  locationError: string | null;
  onNavigate: (tab: string) => void;
  settings: PrayerSettings;
  tabs: { id: string; label: string; icon: any }[];
  bookmarks: any[];
  toggleBookmark: (item: any) => void;
  isTargetHadith?: boolean;
  onClearTargetHadith?: () => void;
  cityName?: string;
  onSelectDua: (dua: Dua) => void;
  onSelectZiyarat: (ziyarat: Ziyarat) => void;
  onSelectSalawat: (salawat: any) => void;
  onSelectNamaz: (namaz: any) => void;
}

function HomeView({ hadith, prayerTimes, reminders, onToggleReminder, locationError, onNavigate, settings, tabs, bookmarks, toggleBookmark, isTargetHadith, onClearTargetHadith, cityName, onSelectDua, onSelectZiyarat, onSelectSalawat, onSelectNamaz }: HomeViewProps) {
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());

  const isEidDay = useMemo(() => {
    const { day, month } = getHijriDateParts(currentDate, settings.hijriOffset);
    // Eid al-Fitr: 1st and 2nd Shawwal (Month 10)
    const isEidAlFitr = month === 10 && (day === 1 || day === 2);
    // Eid al-Adha: 10th, 11th, and 12th Dhu al-Hijjah (Month 12)
    const isEidAlAdha = month === 12 && (day === 10 || day === 11 || day === 12);
    return isEidAlFitr || isEidAlAdha;
  }, [currentDate, settings.hijriOffset]);

  const t = useTranslation(settings.language);

  const handleCopyHadith = () => {
    if (hadith) {
      navigator.clipboard.writeText(`${hadith.arabic}\n\n${hadith.english}\n\n— ${hadith.source}`);
    }
  };

  const handleShareHadith = () => {
    if (hadith && navigator.share) {
      navigator.share({
        title: 'Daily Hadith',
        text: `${hadith.arabic}\n\n${hadith.english}\n\n— ${hadith.source}`,
      }).catch((err) => {
        // Ignore share errors as they are usually user cancellations
      });
    }
  };

  const hadithBookmarkId = (hadith && hadith.arabic) ? `hadith-${hadith.arabic.substring(0, 20)}` : '';
  const isHadithFavorite = bookmarks.some(b => b.id === hadithBookmarkId);

  const toggleFavoriteHadith = () => {
    if (!hadith) return;
    toggleBookmark({
      id: hadithBookmarkId,
      type: 'hadith',
      title: 'Daily Wisdom',
      arabic: hadith.arabic,
      data: hadith
    });
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      setCurrentDate(now);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const upcoming = prayerTimes
        .filter(pt => pt.id !== 'sunrise' && pt.id !== 'sunset')
        .map(pt => {
          const [h, m] = (pt.time || "00:00").split(':').map(Number);
          let ptMinutes = h * 60 + m;
          if (ptMinutes + 60 <= nowMinutes) ptMinutes += 24 * 60; // Next day
          return { ...pt, ptMinutes };
        })
        .sort((a, b) => a.ptMinutes - b.ptMinutes)[0];

      if (upcoming) {
        setNextPrayer(upcoming);
        const diff = upcoming.ptMinutes - nowMinutes;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        setCountdown(`${h}h ${m}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-8"
    >
      {/* Eid Mubarak Banner */}
      {isEidDay && (
        <div className="flex justify-center -mb-8">
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ 
              y: [0, -10, 0],
              opacity: 1 
            }}
            transition={{ 
              y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              },
              opacity: { duration: 0.8 }
            }}
            className="relative inline-flex flex-col items-center text-center py-6"
          >
            {/* Large integrated moon bg */}
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.6, 0.8, 0.6]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none"
            >
              <Moon size={140} className="text-gold/30 fill-gold/15" />
            </motion.div>

            <div className="relative z-10 space-y-0.5">
              <h1 className="text-5xl font-arabic text-olive leading-tight drop-shadow-[0_2px_10px_rgba(197,160,89,0.2)]" 
                  style={{ fontFamily: '"Amiri Quran", serif' }}>
                عید مبارک
              </h1>
              <div className="flex items-center justify-center gap-2">
                <div className="h-px w-6 bg-gold/30" />
                <p className="serif text-xs text-gold tracking-[0.5em] font-medium uppercase">
                  Eid Mubarak
                </p>
                <div className="h-px w-6 bg-gold/30" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Date & Location */}
      <section className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <h2 className="serif text-xl md:text-2xl text-olive">{format(currentDate, 'EEEE, MMMM do')}</h2>
          <span className="text-gold/40 px-1">•</span>
          <p className="text-xs uppercase tracking-widest text-gold font-bold">{getHijriDateString(currentDate, settings.hijriOffset)}</p>
        </div>
        {locationError && (
          <div className="flex items-center justify-center gap-1 text-[10px] text-red-500/70 font-medium">
            <MapPin size={10} />
            <span>{locationError}</span>
          </div>
        )}
      </section>

      {/* Next Prayer Countdown Removed */}

      {/* Quick Access */}
      <section className="grid grid-cols-4 gap-3">
        {tabs.filter(tab => !['home', 'settings', 'qa', 'notification'].includes(tab.id)).map(tab => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-paper rounded-[24px] border border-olive/5 shadow-sm hover:bg-olive/5 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-bold text-olive text-center leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </section>

      {/* Prayer Times Card */}
      <section className="bg-paper rounded-[24px] p-5 shadow-sm border border-olive/5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="serif text-lg text-olive">{t('prayerTimes')}{cityName ? ` - ${cityName}` : ''}</h3>
          <span className="text-[9px] uppercase tracking-widest text-gold font-bold">{t('jafariMethod')}</span>
        </div>
        <div className="flex justify-between items-center overflow-x-auto pb-2 gap-2 hide-scrollbar">
          {prayerTimes.length > 0 ? (
            prayerTimes.map((pt) => {
              const now = new Date();
              const nowMinutes = now.getHours() * 60 + now.getMinutes();
              const [h, m] = (pt.time || "00:00").split(':').map(Number);
              const ptMinutes = h * 60 + m;
              
              const isNext = nextPrayer?.id === pt.id;
              const hasPassed = ptMinutes <= nowMinutes && !isNext;
              
              return (
                <div 
                  key={pt.id} 
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all min-w-[70px] flex-1 relative group",
                    isNext ? "bg-olive/10 border-gold/30 shadow-sm" : 
                    hasPassed ? "bg-warm-bg/30 border-olive/5 opacity-60" : 
                    "bg-warm-bg/50 border-olive/5"
                  )}
                >
                  {['fajr', 'dhuhr', 'maghrib'].includes(pt.id) && (
                    <button
                      onClick={() => onToggleReminder(pt.id)}
                      className={cn(
                        "absolute -top-2 -right-2 p-1.5 rounded-full bg-paper border shadow-sm transition-all opacity-0 group-hover:opacity-100 md:opacity-100",
                        reminders.find(r => r.id === pt.id)?.enabled ? "text-gold border-gold/30" : "text-olive/40 border-olive/10 hover:text-olive"
                      )}
                    >
                      <Bell size={12} className={reminders.find(r => r.id === pt.id)?.enabled ? "fill-current" : ""} />
                    </button>
                  )}
                  <span className={cn("text-[10px] font-bold mb-1 text-center leading-tight", isNext ? "text-olive" : "text-olive/80")}>{pt.name}</span>
                  <span className={cn("text-sm font-bold", isNext ? "text-olive" : "text-olive/80")}>{pt.formattedTime || pt.time}</span>
                </div>
              );
            })
          ) : (
            <div className="flex gap-2 w-full animate-pulse">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 flex-1 bg-warm-bg/50 rounded-xl border border-olive/5" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Daily Hadith */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="serif text-xl text-olive">{isTargetHadith ? 'Bookmarked Hadith' : t('dailyWisdom')}</h3>
          {isTargetHadith && onClearTargetHadith && (
            <button 
              onClick={onClearTargetHadith}
              className="text-xs font-bold text-olive/60 hover:text-olive uppercase tracking-wider"
            >
              Clear
            </button>
          )}
        </div>
        <div className="bg-olive text-paper rounded-[32px] p-8 shadow-lg relative overflow-hidden">
          <Moon className="absolute -right-4 -top-4 text-paper/10" size={120} />
          <div className="relative z-10 space-y-6">
            {hadith ? (
              <>
                <p className="text-xl leading-relaxed text-right font-arabic" dir="rtl" style={{ fontFamily: `"${settings.arabicFont || 'Amiri Quran'}", serif` }}>
                  {hadith.arabic}
                </p>
                <p className="serif text-lg italic opacity-90 leading-relaxed">
                  "{hadith.english}"
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-paper/10">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">
                    — {hadith.source}
                  </p>
                  <div className="flex items-center gap-3">
                    <button onClick={handleCopyHadith} className="p-2 hover:bg-paper/10 rounded-full transition-colors" title="Copy Hadith">
                      <Copy size={16} />
                    </button>
                    {navigator.share && (
                      <button onClick={handleShareHadith} className="p-2 hover:bg-paper/10 rounded-full transition-colors" title="Share Hadith">
                        <Share2 size={16} />
                      </button>
                    )}
                    <button onClick={toggleFavoriteHadith} className="p-2 hover:bg-paper/10 rounded-full transition-colors" title={isHadithFavorite ? "Remove from Favorites" : "Add to Favorites"}>
                      <Heart size={16} fill={isHadithFavorite ? "currentColor" : "none"} className={isHadithFavorite ? "text-gold" : ""} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-paper/20 rounded w-3/4 ml-auto"></div>
                <div className="h-4 bg-paper/20 rounded w-full"></div>
                <div className="h-2 bg-paper/20 rounded w-1/4"></div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recommended Section */}
      <RecommendedSection 
        settings={settings} 
        onNavigate={onNavigate} 
        hijriDate={getHijriDateParts(currentDate, settings.hijriOffset)}
        onSelectDua={onSelectDua}
        onSelectZiyarat={onSelectZiyarat}
        onSelectSalawat={onSelectSalawat}
        onSelectNamaz={onSelectNamaz}
      />

      {/* Events Today & Tomorrow */}
      {(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayParts = getHijriDateParts(now, settings.hijriOffset);
        const tomorrowParts = getHijriDateParts(tomorrow, settings.hijriOffset);
        
        const eventsToday = EVENTS.filter(e => e.hijriDay === todayParts.day && e.hijriMonth === todayParts.month);
        const eventsTomorrow = EVENTS.filter(e => e.hijriDay === tomorrowParts.day && e.hijriMonth === tomorrowParts.month);

        const sortedEvents = [...EVENTS].sort((a, b) => {
          if (a.hijriMonth !== b.hijriMonth) return a.hijriMonth - b.hijriMonth;
          return a.hijriDay - b.hijriDay;
        });

        const nextEvents = sortedEvents.filter(e => {
          if (e.hijriMonth > todayParts.month) return true;
          if (e.hijriMonth === todayParts.month && e.hijriDay > todayParts.day) return true;
          return false;
        });

        const upcomingEvent = nextEvents.length > 0 ? nextEvents[0] : sortedEvents[0];

        return (
          <div className="space-y-4">
            {eventsToday.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <CalendarIcon size={14} className="text-gold" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gold">
                    {t('todayEvents')}
                  </h3>
                </div>
                {eventsToday.map((event, idx) => (
                  <section key={`home-event-today-${idx}-${event.title}`} className="rounded-[24px] p-5 shadow-sm border bg-gold/10 border-gold/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none bg-gold/20" />
                    <h4 className="serif text-lg text-olive leading-tight">{event.title}</h4>
                    <p className="text-xs text-olive/70 mt-1">{event.hijriDay} {ISLAMIC_MONTHS[event.hijriMonth - 1]}</p>
                  </section>
                ))}
              </div>
            )}

            {eventsTomorrow.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <CalendarIcon size={14} className="text-gold/60" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-olive/60">
                    {t('tomorrowEvents')}
                  </h3>
                </div>
                {eventsTomorrow.map((event, idx) => (
                  <section key={`home-event-tomorrow-${idx}-${event.title}`} className="rounded-[24px] p-5 shadow-sm border bg-paper border-olive/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none bg-gold/5" />
                    <h4 className="serif text-lg text-olive leading-tight">{event.title}</h4>
                    <p className="text-xs text-olive/70 mt-1">{event.hijriDay} {ISLAMIC_MONTHS[event.hijriMonth - 1]}</p>
                  </section>
                ))}
              </div>
            )}

            {eventsToday.length === 0 && eventsTomorrow.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <CalendarIcon size={14} className="text-gold/60" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-olive/60">
                    {t('upcomingEvent')}
                  </h3>
                </div>
                <section className="rounded-[24px] p-5 shadow-sm border bg-paper border-olive/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none bg-gold/5" />
                  <h4 className="serif text-lg text-olive leading-tight">{upcomingEvent.title}</h4>
                  <p className="text-xs text-olive/70 mt-1">{upcomingEvent.hijriDay} {ISLAMIC_MONTHS[upcomingEvent.hijriMonth - 1]}</p>
                </section>
              </div>
            )}
          </div>
        );
      })()}

      {/* Under Development Disclaimer removed */}
    </motion.div>
  );
}

function SettingsView({ 
  settings, 
  onUpdateSettings,
  firebaseUser,
  isSyncing,
  syncStatus,
  lastSync,
  onSyncNow,
  activeSubPage: propActiveSubPage,
  onActiveSubPageChange
}: { 
  settings: PrayerSettings, 
  onUpdateSettings: (s: PrayerSettings) => void,
  firebaseUser: any | null,
  isSyncing: boolean,
  syncStatus: string,
  lastSync: string | null,
  onSyncNow: () => void,
  activeSubPage: string | null,
  onActiveSubPageChange: (page: string | null) => void
}) {
  const activeSubPage = propActiveSubPage;
  const setActiveSubPage = onActiveSubPageChange;
  const t = useTranslation(settings.language);
  
  const [authError, setAuthError] = useState<string | null>(null);
  const [localSyncing, setLocalSyncing] = useState(false);

  const handleSignIn = async () => {
    setAuthError(null);
    setLocalSyncing(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
        setAuthError("The pop-up was closed before completing Google Sign-In. If you are using the embedded browser preview, please open the app in a new window/tab (using the top-right button) to let the Google account sign-in pop-up run cleanly.");
      } else {
        setAuthError(err?.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setLocalSyncing(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error(err);
      setAuthError(err?.message || "Failed to sign out.");
    }
  };
  
  const [city, setCity] = useState(settings.manualLocation?.city || '');
  const [country, setCountry] = useState(settings.manualLocation?.country || '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetManualLocation = async () => {
    if (!city || !country) {
      setError("Please enter both city and country.");
      return;
    }
    setIsGeocoding(true);
    setError(null);
    const coords = await geocodeLocation(city, country);
    if (coords) {
      onUpdateSettings({
        ...settings,
        manualLocation: {
          city,
          country,
          lat: coords.lat,
          lng: coords.lng
        }
      });
      setError("Location updated successfully.");
    } else {
      setError("Could not find location. Please check spelling.");
    }
    setIsGeocoding(false);
  };

  const handleClearManualLocation = () => {
    setCity('');
    setCountry('');
    onUpdateSettings({
      ...settings,
      manualLocation: undefined
    });
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Noor - Shia Companion',
        text: 'Check out Noor, a comprehensive Shia Islamic companion app.',
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert("Sharing is not supported on this browser.");
    }
  };

  if (activeSubPage === 'location') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveSubPage(null)} className="p-2 rounded-full hover:bg-olive/5 text-olive transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="serif text-2xl text-olive">{t('manualLocation')}</h2>
        </div>
        <div className="bg-paper rounded-[24px] p-6 border border-olive/10 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-olive/60 font-bold">{t('city')}</label>
            <input 
              type="text" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. London"
              className="w-full bg-warm-bg/50 rounded-xl p-3 border border-olive/5 focus:outline-none focus:ring-2 focus:ring-gold/20 text-olive"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-olive/60 font-bold">{t('country')}</label>
            <input 
              type="text" 
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. United Kingdom"
              className="w-full bg-warm-bg/50 rounded-xl p-3 border border-olive/5 focus:outline-none focus:ring-2 focus:ring-gold/20 text-olive"
            />
          </div>
          {error && <p className={cn("text-[10px] font-bold", error.includes('success') ? "text-green-600" : "text-red-500")}>{error}</p>}
          <div className="flex gap-2">
            <button 
              onClick={handleSetManualLocation}
              disabled={isGeocoding}
              className="flex-1 bg-olive text-paper rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-olive/90 transition-all disabled:opacity-50"
            >
              {isGeocoding ? "Searching..." : t('saveLocation')}
            </button>
            {settings.manualLocation && (
              <button 
                onClick={handleClearManualLocation}
                className="bg-paper text-olive border border-olive/10 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-olive/5 transition-all"
              >
                Clear
              </button>
            )}
          </div>
          {settings.manualLocation && (
            <p className="text-[10px] text-gold font-bold text-center">
              Currently using: {settings.manualLocation.city}, {settings.manualLocation.country}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  if (activeSubPage === 'prayer_adj') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveSubPage(null)} className="p-2 rounded-full hover:bg-olive/5 text-olive transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="serif text-2xl text-olive">{t('nimazTimeAdjustments')}</h2>
        </div>
        <div className="bg-paper rounded-[24px] p-6 border border-olive/10 space-y-6">
          {['fajr', 'sunrise', 'dhuhr', 'sunset', 'maghrib'].map(prayer => (
            <div key={prayer} className="flex justify-between items-center">
              <span className="text-sm font-bold text-olive capitalize">{prayer}</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onUpdateSettings({ ...settings, prayerOffsets: { ...settings.prayerOffsets, [prayer]: (settings.prayerOffsets?.[prayer as keyof typeof settings.prayerOffsets] || 0) - 1 } })}
                  className="w-8 h-8 rounded-full bg-olive/5 flex items-center justify-center text-olive hover:bg-olive/10"
                >-</button>
                <span className="text-sm font-bold w-8 text-center">{settings.prayerOffsets?.[prayer as keyof typeof settings.prayerOffsets] || 0} m</span>
                <button 
                  onClick={() => onUpdateSettings({ ...settings, prayerOffsets: { ...settings.prayerOffsets, [prayer]: (settings.prayerOffsets?.[prayer as keyof typeof settings.prayerOffsets] || 0) + 1 } })}
                  className="w-8 h-8 rounded-full bg-olive/5 flex items-center justify-center text-olive hover:bg-olive/10"
                >+</button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (activeSubPage === 'hijri_adj') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveSubPage(null)} className="p-2 rounded-full hover:bg-olive/5 text-olive transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="serif text-2xl text-olive">{t('hijriAdjustment')}</h2>
        </div>
        <div className="bg-paper rounded-[24px] p-6 border border-olive/10 flex flex-col items-center justify-center space-y-6">
          <p className="text-sm text-olive/80 text-center">Adjust the Hijri date by adding or subtracting days.</p>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onUpdateSettings({ ...settings, hijriOffset: (settings.hijriOffset || 0) - 1 })}
              className="w-12 h-12 rounded-full bg-olive/5 flex items-center justify-center text-olive hover:bg-olive/10 text-2xl"
            >-</button>
            <span className="text-3xl font-bold w-12 text-center text-olive">{settings.hijriOffset || 0}</span>
            <button 
              onClick={() => onUpdateSettings({ ...settings, hijriOffset: (settings.hijriOffset || 0) + 1 })}
              className="w-12 h-12 rounded-full bg-olive/5 flex items-center justify-center text-olive hover:bg-olive/10 text-2xl"
            >+</button>
          </div>
          <p className="text-xs text-gold font-bold uppercase tracking-widest">{t('days')}</p>
        </div>
      </motion.div>
    );
  }

  if (activeSubPage === 'contact') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveSubPage(null)} className="p-2 rounded-full hover:bg-olive/5 text-olive transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="serif text-2xl text-olive">{t('contactUs')}</h2>
        </div>
        <div className="bg-paper rounded-[24px] p-6 border border-olive/10 space-y-6 text-center">
          <p className="text-sm text-olive/80">We would love to hear from you. For any feedback, suggestions, or bug reports, please email us.</p>
          <a 
            href="mailto:iamshia72@gmail.com"
            className="inline-block bg-olive text-paper rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-olive/90 transition-all"
          >
            Email Us
          </a>
        </div>
      </motion.div>
    );
  }

  if (activeSubPage === 'sync_page') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setActiveSubPage(null)} className="p-2 rounded-full hover:bg-olive/5 text-olive transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="serif text-2xl text-olive">Cloud Backup & Sync</h2>
        </div>

        <div className="bg-paper rounded-[24px] p-6 border border-olive/10 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center text-gold">
              <Database size={32} />
            </div>
            <p className="text-sm text-olive/80 select-none">
              Save your settings, Quran reading progress, checklists, customized counters, reminders, and diary journal entries securely in the cloud.
            </p>
          </div>

          {authError && (
            <p className="text-xs text-red-500 font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100">{authError}</p>
          )}

          {!firebaseUser ? (
            <div className="space-y-4 pt-4">
              <p className="text-xs text-olive/50 text-center font-medium">Link your account to backup your data automatically in background.</p>
              <button 
                onClick={handleSignIn}
                disabled={localSyncing}
                className="w-full bg-olive text-paper rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-olive/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={16} />
                {localSyncing ? "Signing In..." : "Sign in with Google"}
              </button>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              <div className="bg-olive/5 p-4 rounded-2xl border border-olive/10 flex items-center gap-4">
                {firebaseUser.photoURL ? (
                  <img src={firebaseUser.photoURL} alt="Profile" className="w-12 h-12 rounded-full border border-gold" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gold text-paper flex items-center justify-center font-bold text-lg">
                    {firebaseUser.displayName?.charAt(0) || "U"}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="text-sm font-bold text-olive truncate">{firebaseUser.displayName}</h4>
                  <p className="text-xs text-olive/60 truncate">{firebaseUser.email}</p>
                </div>
              </div>

              <div className="space-y-3 bg-paper p-4 rounded-2xl border border-olive/5 text-sm">
                <div className="flex justify-between">
                  <span className="text-olive/65">Status:</span>
                  <span className={cn(
                    "font-bold capitalize flex items-center gap-1.5",
                    syncStatus === 'success' ? "text-green-600" :
                    syncStatus === 'syncing' ? "text-gold animate-pulse" :
                    syncStatus === 'error' ? "text-red-500" : "text-olive"
                  )}>
                    {syncStatus === 'success' ? "In Sync" :
                     syncStatus === 'syncing' ? "Syncing..." :
                     syncStatus === 'error' ? "Sync Failed" : "Connected"}
                  </span>
                </div>
                {lastSync && (
                  <div className="flex justify-between">
                    <span className="text-olive/60">Last Backup:</span>
                    <span className="font-medium text-olive/85">
                      {new Date(lastSync).toLocaleDateString()} {new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={onSyncNow}
                  disabled={isSyncing}
                  className="w-full bg-olive text-paper rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-olive/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={16} className={cn(isSyncing && "animate-spin")} />
                  {isSyncing ? "Syncing..." : "Sync / Backup Now"}
                </button>
                <button 
                  onClick={handleSignOut}
                  className="w-full bg-paper text-red-500 border border-red-500/20 rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 space-y-8 pb-32"
    >
      <h2 className="serif text-3xl text-olive">{t('settings')}</h2>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <button onClick={() => setActiveSubPage('location')} className="w-full bg-paper p-4 rounded-2xl border border-olive/10 flex justify-between items-center hover:bg-olive/5 transition-colors">
            <span className="text-sm font-bold text-olive">{t('manualLocation')}</span>
            <ChevronRight size={20} className="text-olive/40" />
          </button>
          <button onClick={() => setActiveSubPage('prayer_adj')} className="w-full bg-paper p-4 rounded-2xl border border-olive/10 flex justify-between items-center hover:bg-olive/5 transition-colors">
            <span className="text-sm font-bold text-olive">{t('prayerAdjustments')}</span>
            <ChevronRight size={20} className="text-olive/40" />
          </button>
          <button onClick={() => setActiveSubPage('hijri_adj')} className="w-full bg-paper p-4 rounded-2xl border border-olive/10 flex justify-between items-center hover:bg-olive/5 transition-colors">
            <span className="text-sm font-bold text-olive">{t('hijriAdjustment')}</span>
            <ChevronRight size={20} className="text-olive/40" />
          </button>
          <button onClick={() => setActiveSubPage('sync_page')} className="w-full bg-paper p-4 rounded-2xl border border-olive/10 flex justify-between items-center hover:bg-olive/5 transition-colors">
            <span className="text-sm font-bold text-olive flex items-center gap-2">
              <Cloud size={16} className="text-gold" />
              Cloud Sync & Backup
            </span>
            <ChevronRight size={20} className="text-olive/40" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs uppercase tracking-widest text-gold font-bold">{t('arabicFontSize')}</h3>
            <span className="text-olive font-bold text-sm bg-olive/5 px-2 py-0.5 rounded-lg">{settings.arabicFontSize || 5}</span>
          </div>
          <div className="bg-paper rounded-2xl p-6 border border-olive/10">
            <input 
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.arabicFontSize || 5}
              onChange={(e) => onUpdateSettings({ ...settings, arabicFontSize: parseInt(e.target.value) })}
              className="w-full h-2 bg-olive/10 rounded-lg appearance-none cursor-pointer accent-olive"
            />
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[10px] text-olive/40 font-bold uppercase">{t('small')}</span>
              <span className="text-[10px] text-olive/40 font-bold uppercase">{t('large')}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-gold font-bold">{t('calculationMethod')}</h3>
          <div className="relative">
            <select
              value={settings.method}
              onChange={(e) => onUpdateSettings({ ...settings, method: e.target.value as any })}
              className="w-full p-4 pr-10 rounded-2xl border border-olive/20 bg-paper text-olive appearance-none focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all font-medium"
            >
              {CALCULATION_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-olive/50">
              <ChevronRight size={20} className="rotate-90" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-gold font-bold">High Latitude Rule</h3>
          <div className="relative">
            <select
              value={settings.highLatitudeRule}
              onChange={(e) => onUpdateSettings({ ...settings, highLatitudeRule: e.target.value as any })}
              className="w-full p-4 pr-10 rounded-2xl border border-olive/20 bg-paper text-olive appearance-none focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all font-medium"
            >
              {(['MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle'] as const).map((rule) => (
                <option key={rule} value={rule}>
                  {rule.replace(/([A-Z])/g, ' $1').trim()}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-olive/50">
              <ChevronRight size={20} className="rotate-90" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-gold font-bold">{t('arabicFont')}</h3>
          <div className="relative">
            <select
              value={settings.arabicFont || 'Amiri Quran'}
              onChange={(e) => onUpdateSettings({ ...settings, arabicFont: e.target.value as any })}
              className="w-full p-4 pr-10 rounded-2xl border border-olive/20 bg-paper text-olive appearance-none focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all font-medium"
            >
              {(['Amiri Quran', 'Lateef', 'Scheherazade New', 'Noto Naskh Arabic'] as const).map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-olive/50">
              <ChevronRight size={20} className="rotate-90" />
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-olive/10">
          <button onClick={() => setActiveSubPage('contact')} className="w-full bg-paper p-4 rounded-2xl border border-olive/10 flex justify-between items-center hover:bg-olive/5 transition-colors">
            <span className="text-sm font-bold text-olive">{t('contactUs')}</span>
            <ChevronRight size={20} className="text-olive/40" />
          </button>
        </div>

        <div className="pt-8 pb-4 text-center space-y-6">
          <div className="flex justify-center gap-4">
            <a href="https://facebook.com/imshia72" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-olive/5 flex items-center justify-center text-olive hover:bg-olive/10 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
            </a>
            <a href="https://instagram.com/imshia72" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-olive/5 flex items-center justify-center text-olive hover:bg-olive/10 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
            </a>
            <a href="https://x.com/imshia72" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-olive/5 flex items-center justify-center text-olive hover:bg-olive/10 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 4.076H5.078z" /></svg>
            </a>
            <a href="https://threads.net/imshia72" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-olive/5 flex items-center justify-center text-olive hover:bg-olive/10 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.823 12.961c-.453.725-1.102 1.085-1.94 1.085-1.127 0-1.929-.766-1.929-1.993 0-1.235.809-2.007 1.941-2.007.82 0 1.471.365 1.928 1.096v.919zm-2.935-3.546c-1.745 0-3.123 1.254-3.123 3.435 0 2.139 1.345 3.427 3.133 3.427 1.21 0 2.105-.54 2.674-1.587h.056l.071.95h2.482V8.013c0-1.847-1.127-2.91-3.102-2.91-1.644 0-2.97.701-3.341 2.026h2.496c.199-.521.504-.705 1.071-.705.759 0 1.109.385 1.109 1.337v.656c-.526-.464-1.228-.701-1.926-.701zm-4.416 2.871c0-3.991 2.991-6.931 7.329-6.931 4.339 0 7.328 2.941 7.328 6.931 0 4.033-2.989 6.932-7.328 6.932-1.487 0-2.822-.333-3.834-.973l.549-1.967c.869.46 1.923.722 3.285.722 3.017 0 5.031-2.015 5.031-4.714 0-2.698-2.014-4.712-5.031-4.712-3.013 0-5.03 2.014-5.03 4.712 0 1.772.83 3.146 2.257 3.906l-.546 1.964c-2.382-1.146-3.59-3.149-3.59-5.97z"/></svg>
            </a>
            <a href="https://youtube.com/@imshia" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-olive/5 flex items-center justify-center text-olive hover:bg-olive/10 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" /></svg>
            </a>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-olive/40">
              © {new Date().getFullYear()}
            </p>
            <p className="font-display text-gold text-sm tracking-[0.25em] font-black">
              I AM SHIA
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


function SalaatMasoomeenView({ settings, onBack, selectedNamaz, onSelectNamaz }: { 
  settings: PrayerSettings, 
  onBack: () => void,
  selectedNamaz: any,
  onSelectNamaz: (namaz: any) => void
}) {
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const t = useTranslation(settings.language);

  const isCurrentTrack = (trackId: string) => currentTrack?.id === trackId;

  const handleToggleAudio = (salat: any) => {
    playTrack({
      id: `salat-${salat.id}`,
      title: salat.title,
      url: salat.audioUrl,
      category: 'Salat of Infallibles'
    });
  };

  if (selectedNamaz && SALAT_MASOOMEEN.find(s => s.id === selectedNamaz.id)) {
    const salatId = `salat-${selectedNamaz.id}`;
    return (
      <div className="p-6 space-y-8 pb-32">
        <button 
          onClick={() => onSelectNamaz(null)}
          className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2"
        >
          ← Back to Salaat of Masoomeen
        </button>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h2 className="serif text-3xl text-olive flex-1">{selectedNamaz.title}</h2>
            {selectedNamaz.audioUrl && (
              <button 
                onClick={() => handleToggleAudio(selectedNamaz)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95",
                  isCurrentTrack(salatId) && isPlaying 
                    ? "bg-gold text-paper" 
                    : "bg-paper text-gold border border-gold/20 hover:bg-gold/5"
                )}
              >
                {isCurrentTrack(salatId) && isPlaying ? <Pause size={24} /> : <Play size={24} className={isCurrentTrack(salatId) && isPlaying ? "" : "ml-1"} />}
              </button>
            )}
          </div>
          
          {/* Main Method if no sections, or Intro if sections exist */}
          {selectedNamaz.method && (
            <div className="bg-olive/5 p-4 rounded-2xl border border-olive/10">
              <h4 className="text-[10px] uppercase tracking-widest text-gold font-bold mb-2">Method</h4>
              <p className="text-sm text-olive/70 leading-relaxed font-medium">{selectedNamaz.method}</p>
            </div>
          )}
        </div>

        <div className="space-y-12">
          {selectedNamaz.sections ? (
            selectedNamaz.sections.map((section: any) => (
              <div key={section.id} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-gold/20" />
                  <h3 className="serif text-2xl text-olive text-center">{section.title}</h3>
                  <div className="h-[1px] flex-1 bg-gold/20" />
                </div>
                
                {section.method && (
                  <div className="bg-olive/5 p-4 rounded-2xl border border-olive/10 mb-6">
                    <h4 className="text-[10px] uppercase tracking-widest text-gold font-bold mb-2">Method</h4>
                    <p className="text-sm text-olive/70 leading-relaxed font-medium">{section.method}</p>
                  </div>
                )}

                <div className="bg-paper rounded-[32px] p-6 border border-olive/10 shadow-sm space-y-8">
                  {section.lines.map((line: any, idx: number) => (
                    <div key={idx} className="space-y-4 text-center">
                      <p 
                        className={cn(getFontSize('text-2xl', settings.arabicFontSize), "leading-relaxed text-olive font-arabic")} 
                        dir="rtl"
                        style={{ 
                          fontFamily: `"${settings.arabicFont || 'Amiri Quran'}", serif`
                        }}
                      >
                        {line.arabic}
                      </p>
                      {line.transliteration && <p className="text-sm text-olive/60 italic px-4">{line.transliteration}</p>}
                      <div className="h-[1px] w-12 bg-olive/10 mx-auto" />
                      <p className="text-sm text-olive/80 font-medium px-4">{line.english}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-paper rounded-[32px] p-6 border border-olive/10 shadow-sm space-y-8">
              {selectedNamaz.lines.map((line: any, idx: number) => (
                <div key={idx} className="space-y-4 text-center">
                  <p 
                    className={cn(getFontSize('text-2xl', settings.arabicFontSize), "leading-relaxed text-olive font-arabic")} 
                    dir="rtl"
                    style={{ 
                      fontFamily: `"${settings.arabicFont || 'Amiri Quran'}", serif`
                    }}
                  >
                    {line.arabic}
                  </p>
                  {line.transliteration && <p className="text-sm text-olive/60 italic px-4">{line.transliteration}</p>}
                  <div className="h-[1px] w-12 bg-olive/10 mx-auto" />
                  <p className="text-sm text-olive/80 font-medium px-4">{line.english}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-8 pb-32"
    >
      <div className="flex flex-col gap-2">
        <button 
          onClick={onBack}
          className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2"
        >
          ← Back to Namaz
        </button>
        <h2 className="serif text-3xl text-olive">{t('salatMasoomeen')}</h2>
        <p className="text-xs text-gold uppercase tracking-widest font-bold">Prayers of the 14 Infallibles</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {SALAT_MASOOMEEN.map((salat) => (
          <button
            key={salat.id}
            onClick={() => onSelectNamaz(salat)}
            className="w-full text-left bg-paper p-5 rounded-[28px] border border-olive/5 shadow-sm hover:shadow-md hover:bg-olive/5 transition-all flex justify-between items-center group"
          >
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] uppercase tracking-widest text-gold font-bold">Infallibles</p>
              </div>
              <h3 className="serif text-xl text-olive group-hover:text-gold transition-colors">{salat.title}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-olive/5 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-paper transition-all">
              <ChevronRight size={20} />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function NamazView({ settings, onBack, onNavigateToSalawaat, selectedNamaz, onSelectNamaz }: { 
  settings: PrayerSettings, 
  onBack: () => void, 
  onNavigateToSalawaat: () => void,
  selectedNamaz: any,
  onSelectNamaz: (namaz: any) => void
}) {
  const [activeSectionTab, setActiveSectionTab] = useState(0);
  const [showSalatMasoomeen, setShowSalatMasoomeen] = useState(false);
  const t = useTranslation(settings.language);

  useEffect(() => {
    setActiveSectionTab(0);
  }, [selectedNamaz?.id]);

  if (showSalatMasoomeen) {
    return (
      <SalaatMasoomeenView 
        settings={settings} 
        onBack={() => setShowSalatMasoomeen(false)} 
        selectedNamaz={selectedNamaz}
        onSelectNamaz={onSelectNamaz}
      />
    );
  }

  const { currentTrack, isPlaying, playTrack } = useAudio();
  const isCurrentTrack = (trackId: string) => currentTrack?.id === trackId;

  const handleToggleAudio = (item: any) => {
    playTrack({
      id: `namaz-${item.id}`,
      title: item.title,
      url: item.audioUrl,
      category: 'Namaz'
    });
  };

  const handleSectionAudio = (section: any) => {
    playTrack({
      id: `namaz-section-${selectedNamaz.id}-${section.title}`,
      title: `${selectedNamaz.title}: ${section.title}`,
      url: section.audioUrl,
      category: 'Namaz'
    });
  };

  if (selectedNamaz) {
    const namazId = `namaz-${selectedNamaz.id}`;
    return (
      <div className="p-6 space-y-8 pb-32">
        <button 
          onClick={() => onSelectNamaz(null)}
          className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2"
        >
          ← Back to Namaz
        </button>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="serif text-3xl text-olive">{selectedNamaz.title}</h2>
              <p className="text-sm text-olive/70 italic leading-relaxed">{selectedNamaz.description}</p>
            </div>
            {selectedNamaz.audioUrl && (
              <button 
                onClick={() => handleToggleAudio(selectedNamaz)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 shrink-0",
                  isCurrentTrack(namazId) && isPlaying 
                    ? "bg-gold text-paper" 
                    : "bg-paper text-gold border border-gold/20 hover:bg-gold/5"
                )}
              >
                {isCurrentTrack(namazId) && isPlaying ? <Pause size={24} /> : <Play size={24} className={isCurrentTrack(namazId) && isPlaying ? "" : "ml-1"} />}
              </button>
            )}
          </div>
        </div>

        {selectedNamaz.sections && selectedNamaz.sections.length > 1 && (
          <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
            {selectedNamaz.sections.map((section: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveSectionTab(idx)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                  activeSectionTab === idx 
                    ? "bg-gold text-paper border-gold" 
                    : "bg-paper text-olive/60 border-olive/10 hover:bg-olive/5"
                )}
              >
                {section.title}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-6">
          {selectedNamaz.lines ? (
            <div className="bg-paper rounded-[32px] p-6 border border-olive/10 shadow-sm space-y-8">
              {selectedNamaz.lines.map((line: any, idx: number) => (
                <div key={idx} className="space-y-4 text-center">
                  <div className="flex justify-center items-center gap-2 mb-2">
                    {line.repeat && line.repeat > 1 && (
                      <span className="bg-gold/10 text-gold text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold/20">
                        {line.repeat}x
                      </span>
                    )}
                  </div>
                  <p 
                    className={cn(getFontSize('text-2xl', settings.arabicFontSize), "leading-relaxed text-olive font-arabic")} 
                    dir="rtl"
                    style={{ fontFamily: `"${settings.arabicFont || 'Amiri Quran'}", serif` }}
                  >
                    {line.arabic}
                  </p>
                  <p className="text-sm text-olive/60 italic px-4">{line.transliteration}</p>
                  <div className="h-[1px] w-12 bg-olive/10 mx-auto" />
                  <p className="text-sm text-olive/80 font-medium px-4">{line.english}</p>
                  {line.note && <p className="text-[10px] text-gold font-bold uppercase">{line.note}</p>}
                </div>
              ))}
            </div>
          ) : selectedNamaz.sections ? (
            <div className="space-y-6">
              {selectedNamaz.sections.map((section: any, idx: number) => {
                if (selectedNamaz.sections.length > 1 && activeSectionTab !== idx) return null;
                
                return (
                  <div key={idx} className="bg-paper rounded-[24px] p-6 border border-olive/10 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="serif text-xl text-olive flex items-center gap-2">
                        {selectedNamaz.sections.length === 1 && (
                          <span className="w-8 h-8 rounded-full bg-gold/10 text-gold text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                        )}
                        {section.title}
                      </h3>
                      {section.audioUrl && (
                        <button 
                          onClick={() => handleSectionAudio(section)}
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0",
                            isCurrentTrack(`namaz-section-${selectedNamaz.id}-${section.title}`) && isPlaying 
                              ? "bg-gold text-paper" 
                              : "bg-paper text-gold border border-gold/20 hover:bg-gold/5"
                          )}
                        >
                          {isCurrentTrack(`namaz-section-${selectedNamaz.id}-${section.title}`) && isPlaying ? <Pause size={20} /> : <Play size={20} className={isCurrentTrack(`namaz-section-${selectedNamaz.id}-${section.title}`) && isPlaying ? "" : "ml-0.5"} />}
                        </button>
                      )}
                    </div>
                    {section.content && <p className="text-sm text-olive/70 leading-relaxed whitespace-pre-wrap">{section.content}</p>}
                    {section.lines && (
                      <div className="pt-4 space-y-6 border-t border-olive/5">
                        {section.lines.map((line: any, lIdx: number) => (
                          <div key={lIdx} className="space-y-3 text-center">
                            {line.label && (
                              <div className="flex justify-center mb-2">
                                <span className="bg-olive/5 text-olive/60 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-olive/10">
                                  {line.label}
                                </span>
                              </div>
                            )}
                            {line.repeat && line.repeat > 1 && (
                              <div className="flex justify-center mb-1">
                                <span className="bg-gold/10 text-gold text-[9px] font-bold px-2 py-0.5 rounded-full border border-gold/20">
                                  {line.repeat}x
                                </span>
                              </div>
                            )}
                            <p 
                              className={cn(getFontSize('text-xl', settings.arabicFontSize), "leading-relaxed text-olive font-arabic")} 
                              dir="rtl"
                              style={{ 
                                fontFamily: `"${settings.arabicFont || 'Amiri Quran'}", serif`
                              }}
                            >
                              {line.arabic}
                            </p>
                            <p className="text-xs text-olive/50 italic px-4">{line.transliteration}</p>
                            <p className="text-xs text-olive/80 font-medium px-4">{line.english}</p>
                            {line.note && <p className="text-[10px] text-gold font-bold uppercase mt-1">{line.note}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-8 pb-32"
    >
      <div className="flex flex-col gap-2">
        <h2 className="serif text-3xl text-olive">{t('namaz')}</h2>
        <p className="text-xs text-gold uppercase tracking-widest font-bold">Prayers & Guidelines</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {NAMAZ.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'salat-masoomeen') {
                setShowSalatMasoomeen(true);
              } else if (item.id === 'salwaat-page') {
                onNavigateToSalawaat();
              } else {
                onSelectNamaz(item);
              }
            }}
            className="w-full text-left bg-paper p-5 rounded-[28px] border border-olive/5 shadow-sm hover:shadow-md hover:bg-olive/5 transition-all flex justify-between items-center group"
          >
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] uppercase tracking-widest text-gold font-bold">Namaz</p>
                {item.audioUrl && <Volume2 size={10} className="text-gold" />}
              </div>
              <h3 className="serif text-xl text-olive group-hover:text-gold transition-colors">{item.title}</h3>
              {item.description && <p className="text-xs text-olive/60 mt-1 line-clamp-1">{item.description}</p>}
            </div>
            <div className="w-10 h-10 rounded-full bg-olive/5 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-paper transition-all">
              <ChevronRight size={20} />
            </div>
          </button>
        ))}
        {/* If not in NAMAZ array already, we can add it manually or update namaz.json */}
      </div>

      <div className="bg-olive/5 rounded-[24px] p-6 border border-olive/10 space-y-4">
        <h4 className="serif text-lg text-olive">Why Namaz?</h4>
        <p className="text-xs text-olive/70 leading-relaxed">
          "The first thing for which a person is held accountable on the Day of Judgment is prayer. If it is correct, the rest of his deeds will be correct; and if it is defective, the rest of his deeds will be defective."
        </p>
        <p className="text-[10px] uppercase tracking-widest text-gold font-bold text-right">— Imam al-Sadiq (as)</p>
      </div>
    </motion.div>
  );
}

function HourlyDuasView({ 
  settings, 
  onSelectDua, 
  goBack 
}: { 
  settings: PrayerSettings, 
  onSelectDua: (dua: Dua | null) => void, 
  goBack: () => void
}) {
  const hourlyDuas = DUAS
    .filter(d => d.category === 'Hourly Duas')
    .sort((a, b) => {
      const matchA = a.id.match(/\d+$/);
      const matchB = b.id.match(/\d+$/);
      const numA = matchA ? parseInt(matchA[0]) : 999;
      const numB = matchB ? parseInt(matchB[0]) : 999;
      return numA - numB;
    });
  const t = useTranslation(settings.language);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex flex-col gap-4">
        <button 
          onClick={goBack}
          className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2"
        >
          ← Back to Duas
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="serif text-2xl font-semibold text-olive">Duas for each Hour</h2>
            <p className="text-xs text-olive/60 uppercase tracking-widest font-bold">Ahlulbayt (as) Hourly Supplications</p>
          </div>
        </div>
      </div>

      <div className="bg-paper rounded-[24px] p-6 border border-olive/10 shadow-sm space-y-3">
        <p className="text-sm text-olive/80 leading-relaxed italic">
          The Imams of guidance (as) have divided the day into twelve hours, dedicating each hour to one of the Twelve Imams (as). 
          They have set out a supplication for each hour, associating it with the intercession of the Imam of that hour.
        </p>
        <p className="text-[10px] uppercase tracking-widest text-gold font-bold">
          Source: Misbah al-Mutahajjid (Shaykh al-Tusi)
        </p>
      </div>

      <div className="grid gap-4">
        {hourlyDuas.map((dua, index) => (
          <button
            key={dua.id}
            onClick={() => onSelectDua(dua)}
            className="w-full text-left bg-paper p-5 rounded-[28px] border border-olive/5 shadow-sm hover:shadow-md hover:bg-olive/5 transition-all flex justify-between items-center group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/5 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-paper font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="serif text-lg text-olive group-hover:text-gold transition-colors leading-tight mb-1">{dua.title}</h3>
                <p className="text-[10px] uppercase tracking-widest text-gold font-bold opacity-60">
                   {dua.description?.includes('dedicated to') ? dua.description.split('dedicated to ')[1].split('(')[0].trim() : ''}
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-warm-bg flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-paper transition-all">
              <ChevronRight size={16} />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function RecommendedSection({ settings, onNavigate, hijriDate, onSelectDua, onSelectZiyarat, onSelectSalawat, onSelectNamaz }: { 
  settings: PrayerSettings, 
  onNavigate: (tab: string) => void, 
  hijriDate: { day: number; month: number },
  onSelectDua: (dua: Dua) => void,
  onSelectZiyarat: (ziyarat: Ziyarat) => void,
  onSelectSalawat: (salawat: any) => void,
  onSelectNamaz: (namaz: any) => void
}) {
  const recommendations = useMemo(() => {
    return getDailyRecommendations(hijriDate, new Date()).filter(item => item.type !== 'event');
  }, [hijriDate]);
  const t = useTranslation(settings.language);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dua': return 'text-gold bg-gold/10';
      case 'ziyarat': return 'text-olive bg-olive/10';
      case 'salawaat': return 'text-red-500 bg-red-500/10';
      case 'namaz': return 'text-blue-500 bg-blue-500/10';
      case 'event': return 'text-paper bg-gold';
      default: return 'text-olive bg-olive/10';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'dua': return t('duas');
      case 'ziyarat': return t('ziyarats');
      case 'salawaat': return t('salawaat');
      case 'namaz': return t('namaz');
      case 'event': return t('events');
      default: return type;
    }
  };

  if (recommendations.length === 0) return null;

  const handleRecommendationClick = (item: Recommendation) => {
    switch (item.type) {
      case 'dua':
        const dua = DUAS.find(d => d.id === item.id);
        if (dua) onSelectDua(dua);
        break;
      case 'ziyarat':
        const ziyarat = ZIYARATS.find(z => z.id === item.id);
        if (ziyarat) onSelectZiyarat(ziyarat);
        break;
      case 'salawaat':
        const salawat = SALAWAAT.find(s => s.id === item.id);
        if (salawat) onSelectSalawat(salawat);
        else onNavigate('salawaat');
        break;
      case 'namaz':
        const namaz = NAMAZ.find(n => n.id === item.id) || SALAT_MASOOMEEN.find(n => n.id === item.id);
        if (namaz) onSelectNamaz(namaz);
        else onNavigate('namaz');
        break;
      case 'event':
        onNavigate('calendar');
        break;
    }
  };

  return (
    <section className="space-y-2">
      <div className="flex justify-between items-center px-2">
        <h3 className="serif text-lg text-olive">{t('recommendedForToday')}</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gold">{format(new Date(), 'EEEE')}</span>
      </div>
      <div className="flex overflow-x-auto gap-3 no-scrollbar -mx-6 px-6 pb-2">
        {recommendations.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRecommendationClick(item)}
            className="min-w-[160px] max-w-[200px] flex-shrink-0 bg-paper p-4 rounded-[20px] border border-olive/10 shadow-sm flex flex-col items-start gap-3 text-left group transition-all hover:shadow-md"
          >
            <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider", getTypeColor(item.type))}>
              {getTypeLabel(item.type)}
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="serif text-base text-olive group-hover:text-gold transition-colors leading-tight line-clamp-2">{item.title}</h4>
              {item.description && <p className="text-[10px] text-olive/50 line-clamp-2 leading-relaxed">{item.description}</p>}
            </div>
            <div className="flex items-center gap-1 text-gold text-[9px] font-bold uppercase tracking-widest mt-1">
              <span>View</span>
              <ChevronRight size={10} />
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

function DuasView({ 
  settings, 
  selectedDua, 
  onSelectDua, 
  bookmarks, 
  toggleBookmark, 
  goBack, 
  onNavigateToItem,
  selectedSectionIndex,
  setSelectedSectionIndex,
  readingProgress,
  handleResume
}: { 
  settings: PrayerSettings, 
  selectedDua?: Dua | null, 
  onSelectDua: (dua: Dua | null) => void, 
  bookmarks: any[], 
  toggleBookmark: (item: any) => void, 
  goBack: () => void, 
  onNavigateToItem: (item: RelatedItem) => void,
  selectedSectionIndex: number,
  setSelectedSectionIndex: (idx: number) => void,
  readingProgress: Record<string, number>,
  handleResume: (id: string) => void
}) {
  const [showHourlyList, setShowHourlyList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const t = useTranslation(settings.language);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const arabicStyle = { fontFamily: `"${settings.arabicFont || 'Amiri Quran'}", serif` };

  const { currentTrack, isPlaying: isPlayingAudio, playTrack } = useAudio();

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleAudio = () => {
    if (!selectedDua) return;
    
    const section = selectedDua.sections?.[selectedSectionIndex];
    const urlToPlay = section?.audioUrl || selectedDua.audioUrl;

    if (!urlToPlay) return;

    if (isPlayingTTS) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
    }

    playTrack({
      id: `dua-${selectedDua.id}-${selectedSectionIndex}`,
      title: section?.title ? `${selectedDua.title} - ${section.title}` : selectedDua.title,
      url: urlToPlay,
      category: 'Dua'
    });
  };

  useEffect(() => {
    setSelectedSectionIndex(0);
  }, [selectedDua?.id]);

  useLayoutEffect(() => {
    if (!selectedDua && listContainerRef.current) {
      setTimeout(() => {
        const savedPos = localStorage.getItem('duas_scroll_pos');
        if (savedPos && listContainerRef.current) {
          listContainerRef.current.scrollTop = parseInt(savedPos);
        }
      }, 100);
    }
  }, [selectedDua]);

  const handleToggleBookmark = (dua: Dua) => {
    toggleBookmark({
      id: `dua-${dua.id}`,
      type: 'dua',
      title: dua.title,
      arabic: ((dua && dua.arabic) || '').substring(0, 50) + '...',
      data: dua
    });
  };

  const handleGoBack = () => {
    if (showHourlyList && !selectedDua) {
      setShowHourlyList(false);
      return;
    }
    goBack();
  };

  const categories = ['All', ...Array.from(new Set(DUAS.filter(d => !d.category?.includes('Hourly')).map(d => d.category))).filter((c): c is string => !!c && c !== 'All').sort()];

  const filteredDuas = DUAS.filter(dua => {
    if (dua.category === 'Hourly Duas') return false; // Hide from main list
    const matchesSearch = (dua.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                          (dua.translation?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                          (dua.category?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesCategory = selectedCategory === 'All' || dua.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  if (selectedDua) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-6 space-y-6"
      >
        <div className="space-y-8 pb-12">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => {
                  onSelectDua(null);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsPlayingTTS(false);
                }}
                className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2"
              >
                ← {showHourlyList ? 'Back to Hourly Duas' : t('backToList')}
              </button>
              <div className="flex gap-2">
                {(selectedDua.audioUrl || selectedDua.sections?.[selectedSectionIndex]?.audioUrl) && (
                  <button 
                    onClick={toggleAudio}
                    className={cn(
                      "p-2 rounded-full transition-all",
                      isPlayingAudio ? "text-paper bg-gold" : "text-gold/40 hover:text-gold hover:bg-gold/5"
                    )}
                    title="Play Audio"
                  >
                    {isPlayingAudio ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                )}
                <button 
                  onClick={() => handleToggleBookmark(selectedDua)}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    bookmarks.some(b => b.id === `dua-${selectedDua.id}`) ? "text-gold bg-gold/10" : "text-olive/10 hover:text-gold hover:bg-gold/5"
                  )}
                >
                  <Bookmark size={20} fill={bookmarks.some(b => b.id === `dua-${selectedDua.id}`) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-olive -mx-6 px-6 py-10 border-y border-olive/10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-paper via-transparent to-transparent"></div>
              <div className="relative z-10 space-y-3">
                <h3 className="serif text-4xl text-paper font-bold">{selectedDua.title}</h3>
                {selectedDua.arabicTitle && (
                  <p className="font-arabic text-3xl text-paper/90 leading-relaxed" dir="rtl">{selectedDua.arabicTitle}</p>
                )}
                {selectedDua.description && (
                  <p className="text-sm text-paper/70 leading-relaxed italic max-w-xs mx-auto">
                    {selectedDua.description}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-8">
              {/* Tab Selector for Duas with Sections */}
              {selectedDua.sections && selectedDua.sections.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 sticky top-0 bg-paper z-20 pt-2 border-b border-olive/5">
                  {selectedDua.sections.map((section, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSectionIndex(idx);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={cn(
                        "px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border shrink-0",
                        selectedSectionIndex === idx 
                          ? "bg-gold text-paper border-gold shadow-lg shadow-gold/20" 
                          : "bg-paper text-gold border-gold/20 hover:border-gold/40"
                      )}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Title Section for current tab if sections exist */}
              {selectedDua.sections && selectedDua.sections[selectedSectionIndex] && (
                <div className="text-center space-y-2 py-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gold/60">Currently Reading</span>
                  <p className="serif text-xl font-bold text-olive">{selectedDua.sections[selectedSectionIndex].title}</p>
                </div>
              )}

              {selectedDua.sections && selectedDua.sections[selectedSectionIndex]?.prelude && (
                <div className="bg-gold/5 border-l-4 border-gold p-4 rounded-r-xl">
                  <p className="text-sm text-olive/80 leading-relaxed whitespace-pre-wrap">
                    {selectedDua.sections[selectedSectionIndex].prelude}
                  </p>
                </div>
              )}

              {/* Resume Button */}
              {(() => {
                const itemId = (selectedDua.sections && selectedDua.sections.length > 0)
                  ? `dua-${selectedDua.id}-${selectedSectionIndex}` 
                  : `dua-${selectedDua.id}`;
                const progress = readingProgress[itemId];
                
                // Calculate total lines to check if finished
                const isBismillah = (txt: string) => {
                  if (!txt) return false;
                  const normalized = txt.replace(/[\u064B-\u065F]/g, "").replace(/ٱ/g, "ا");
                  return normalized.includes("بسم الله الرحمن الرحيم");
                };

                const activeDuaLines = (selectedDua.sections && selectedDua.sections.length > 0)
                  ? selectedDua.sections[selectedSectionIndex].lines 
                  : (selectedDua.lines || []);

                const displayLines = (activeDuaLines[0] && isBismillah(activeDuaLines[0].arabic))
                  ? activeDuaLines.slice(1)
                  : activeDuaLines;
                
                const totalLines = displayLines.length;

                if (progress && progress > 2 && progress < totalLines - 1) {
                  return (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleResume(itemId)}
                      className="w-full py-3 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center gap-2 text-gold font-bold text-xs uppercase tracking-widest hover:bg-gold/20 transition-all mb-4"
                    >
                      <Clock size={16} />
                      Continue from where you left off
                    </motion.button>
                  );
                }
                return null;
              })()}
              {/* Bismillah Header */}
              <div className="text-center py-8 border-b border-olive/10 mb-8">
                <p className={cn(getFontSize('text-4xl'), "font-arabic text-olive opacity-80")} dir="rtl" style={arabicStyle}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                <p className="text-xs text-gold mt-2 uppercase tracking-widest font-bold font-sans">{t('bismillah')}</p>
              </div>

              {selectedDua.lines || (selectedDua.sections && selectedDua.sections[selectedSectionIndex]) ? (
                (() => {
                  const groups: (DuaLine | DuaLine[])[] = [];
                  let currentGroup: DuaLine[] = [];
                  
                  // Filter out Bismillah if it's the first line to avoid double rendering
                  const isBismillah = (txt: string) => {
                    if (!txt) return false;
                    const normalized = txt.replace(/[\u064B-\u065F]/g, "").replace(/ٱ/g, "ا");
                    return normalized.includes("بسم الله الرحمن الرحيم");
                  };

                  const activeDuaLines = selectedDua.sections 
                    ? selectedDua.sections[selectedSectionIndex].lines 
                    : (selectedDua.lines || []);

                  const displayLines = activeDuaLines[0] && isBismillah(activeDuaLines[0].arabic)
                    ? activeDuaLines.slice(1)
                    : activeDuaLines;

                  const linesWithIndex = displayLines.map((line, idx) => ({ ...line, absoluteIndex: idx }));
                  linesWithIndex.forEach(line => {
                    if (line.isSeparator || !line.arabic) {
                      if (currentGroup.length > 0) {
                        groups.push(currentGroup);
                        currentGroup = [];
                      }
                      groups.push(line);
                    } else {
                      currentGroup.push(line);
                    }
                  });
                  if (currentGroup.length > 0) groups.push(currentGroup);

                return groups.map((group, gIdx) => {
                  if (Array.isArray(group)) {
                    return (
                      <div key={`dua-group-${gIdx}-${selectedDua.id}`} className="bg-paper rounded-[32px] p-8 shadow-sm border border-olive/5 space-y-8">
                        {group.map((line, lIdx) => (
                          <div key={`dua-line-${gIdx}-${lIdx}-${selectedDua.id}`} data-line-index={(line as any).absoluteIndex} className="w-full space-y-4 border-b border-olive/5 pb-6 last:border-0 last:pb-0">
                              <p className={cn(getFontSize('text-2xl'), "leading-[2] text-right font-arabic", line.highlight ? "text-emerald-600" : "text-olive")} dir="rtl" style={arabicStyle}>
                                {line.arabic}
                              </p>
                              <div className="space-y-2">
                                {line.transliteration && (
                                  <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-70", line.highlight ? "text-emerald-600/80" : "text-gold")}>
                                    {line.transliteration}
                                  </p>
                                )}
                                <p className={cn("text-sm leading-relaxed italic", line.highlight ? "text-emerald-700 font-medium" : "text-olive/70")}>
                                  {line.english}
                                </p>
                                {settings.language === 'ur' && line.urdu && (
                                  <p className="text-sm text-olive/70 leading-relaxed text-right font-urdu" dir="rtl">
                                    {line.urdu}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                  } else if (group.isSeparator) {
                    return (
                      <div key={`dua-sep-${gIdx}-${selectedDua.id}`} className="relative py-8">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-olive/10"></span>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-paper px-6 text-[11px] font-bold uppercase tracking-[0.3em] text-gold">{group.english}</span>
                          </div>
                        </div>
                      );
                  } else {
                    return (
                      <p key={`dua-text-${gIdx}-${selectedDua.id}`} className="text-sm text-olive/60 leading-relaxed italic px-4">
                          {group.english}
                        </p>
                      );
                    }
                  });
                })()
              ) : (
                <div className="bg-paper rounded-[32px] p-8 shadow-sm border border-olive/5 space-y-8">
                  <p className={cn(getFontSize('text-2xl'), "leading-[2] text-right font-arabic text-olive")} dir="rtl" style={arabicStyle}>
                    {(() => {
                      const bismillah = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
                      const bismillahAlt = "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِیْمِ";
                      let text = selectedDua.arabic || "";
                      if (text.startsWith(bismillah)) return text.replace(bismillah, "").trim();
                      if (text.startsWith(bismillahAlt)) return text.replace(bismillahAlt, "").trim();
                      return text;
                    })()}
                  </p>
                  {selectedDua.transliteration && (
                    <p className="text-[10px] text-gold font-bold uppercase tracking-widest opacity-70 text-center">
                      {selectedDua.transliteration}
                    </p>
                  )}
                  <p className="serif text-lg leading-relaxed text-olive/80">
                    {settings.language === 'ur' && selectedDua.translationUrdu ? selectedDua.translationUrdu : selectedDua.translation}
                  </p>
                </div>
              )}
            </div>
            {selectedDua.footer && (
              <div className="p-6 bg-gold/5 rounded-[24px] border border-gold/10 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gold">Note</h4>
                <p className="text-sm text-olive/80 leading-relaxed whitespace-pre-line">
                  {selectedDua.footer}
                </p>
              </div>
            )}

            {selectedDua.significance && (
              <div className="p-6 bg-olive/5 rounded-[24px] border border-olive/10 space-y-4">
                <h4 className="serif text-xl text-olive font-semibold">Significance of {selectedDua.title}</h4>
                <p className="text-sm text-olive/80 leading-relaxed whitespace-pre-line italic">
                  {selectedDua.significance}
                </p>
              </div>
            )}

            {selectedDua.relatedItems && selectedDua.relatedItems.length > 0 && (
              <div className="mt-8 pt-8 border-t border-olive/10 space-y-4">
                <div className="grid gap-4">
                  {selectedDua.relatedItems.map((item, idx) => (
                    <button 
                      key={`dua-related-${item.id}-${idx}`}
                      onClick={() => onNavigateToItem(item)}
                      className="w-full p-6 bg-paper rounded-[24px] border border-olive/10 flex items-center justify-between group hover:bg-olive/5 transition-all"
                    >
                      <div className="text-left">
                        <h4 className="serif text-xl text-olive">{item.title}</h4>
                      </div>
                      <ChevronRight className="text-olive/20 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (showHourlyList) {
    return (
      <HourlyDuasView 
        settings={settings} 
        onSelectDua={onSelectDua} 
        goBack={() => setShowHourlyList(false)} 
      />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      <div 
        ref={listContainerRef}
          onScroll={() => {
            if (listContainerRef.current) {
              localStorage.setItem('duas_scroll_pos', listContainerRef.current.scrollTop.toString());
            }
          }}
          className="space-y-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-olive/40" size={18} />
            <input
              type="text"
              placeholder="Search duas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-paper rounded-2xl p-3 pl-12 border border-olive/10 focus:outline-none focus:ring-2 focus:ring-gold/20 text-olive placeholder:text-olive/40"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            {categories.map(category => (
              <button
                key={`dua-cat-${category}`}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                  selectedCategory === category 
                    ? "bg-olive text-paper" 
                    : "bg-paper text-olive/60 border border-olive/10 hover:bg-olive/5"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {!searchQuery && selectedCategory === 'All' && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setShowHourlyList(true)}
                className="w-full text-left bg-gradient-to-br from-gold/20 to-gold/5 p-6 rounded-[32px] border border-gold/20 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold group-hover:scale-110 transition-transform shrink-0">
                    <Clock size={28} />
                  </div>
                  <div>
                    <h3 className="serif text-xl font-semibold text-olive group-hover:text-gold transition-colors leading-tight">Duas for each Time period (hour) of day</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold mt-1">Ahlulbayt (as) Hourly Duas</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-paper flex items-center justify-center text-gold shadow-sm group-hover:bg-gold group-hover:text-paper transition-all shrink-0 ml-2">
                  <ChevronRight size={20} />
                </div>
              </motion.button>
            )}

            {filteredDuas.length > 0 ? (
              filteredDuas.map((dua) => (
                <button
                  key={dua.id}
                  onClick={() => onSelectDua(dua)}
                  className="w-full text-left bg-paper p-5 rounded-[28px] border border-olive/5 shadow-sm hover:shadow-md hover:bg-olive/5 transition-all flex justify-between items-center group"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] uppercase tracking-widest text-gold font-bold">{dua.category}</p>
                      {dua.audioUrl && <Volume2 size={10} className="text-gold" />}
                    </div>
                    <h4 className="serif text-xl text-olive">{dua.title}</h4>
                  </div>
                  <ChevronRight className="text-gold group-hover:translate-x-1 transition-transform" size={20} />
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-olive/60">No duas found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
    </motion.div>
  );
}

function CalendarView({ settings }: { settings: PrayerSettings }) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDateEvents, setSelectedDateEvents] = useState<{ date: Date, events: any[] } | null>(null);
  const t = useTranslation(settings.language);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const currentDate = new Date(selectedYear, selectedMonth, 1);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const startHijri = getHijriDateParts(monthStart, settings.hijriOffset);
  const endHijri = getHijriDateParts(monthEnd, settings.hijriOffset);
  const startHijriMonthName = ISLAMIC_MONTHS[startHijri.month - 1];
  const endHijriMonthName = ISLAMIC_MONTHS[endHijri.month - 1];
  const hijriMonthDisplay = startHijri.month === endHijri.month 
    ? startHijriMonthName 
    : `${startHijriMonthName} / ${endHijriMonthName}`;

  const days = eachDayOfInterval({
      start: startDate,
      end: endDate
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const filteredEvents = days.filter(day => isSameMonth(day, monthStart)).flatMap(day => {
    const { month: hMonth, day: hDay } = getHijriDateParts(day, settings.hijriOffset);
    const dayEvents = EVENTS.filter(e => e.hijriMonth === hMonth && e.hijriDay === hDay);
    return dayEvents.map(e => ({ ...e, gregorianDate: day }));
  }).sort((a, b) => a.gregorianDate.getTime() - b.gregorianDate.getTime());

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-8"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="serif text-3xl text-olive">{months[selectedMonth]} {selectedYear}</h2>
            <p className="text-xs text-olive/60 mt-1 font-medium tracking-wide">
              {hijriMonthDisplay} {startHijri.year} AH
            </p>
          </div>
          <button 
            onClick={handleGoToToday}
            className="text-[10px] font-bold uppercase tracking-widest text-gold bg-gold/5 hover:bg-gold/10 px-3 py-2 rounded-full transition-all flex items-center gap-2"
          >
            <Clock size={12} />
            Today
          </button>
        </div>
        
        <div className="flex items-center justify-between bg-paper p-2 rounded-2xl border border-olive/5 shadow-sm">
          <div className="flex items-center gap-1">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-olive/10 text-olive transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-olive/10 text-olive transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-paper border border-olive/10 text-olive rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20"
            >
              {months.map((month, idx) => (
                <option key={month} value={idx}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-paper border border-olive/10 text-olive rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="bg-paper rounded-[32px] p-6 shadow-sm border border-olive/5">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-olive/60 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const { month: hMonth, day: hDay } = getHijriDateParts(day, settings.hijriOffset);
            const dayEvents = EVENTS.filter(e => e.hijriMonth === hMonth && e.hijriDay === hDay);
            
            return (
              <button 
                key={`cal-day-${day.getTime()}-${idx}`} 
                onClick={() => dayEvents.length > 0 && setSelectedDateEvents({ date: day, events: dayEvents })}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center relative rounded-xl transition-colors",
                  isCurrentMonth ? "text-olive hover:bg-olive/5" : "text-olive/30",
                  isSameDay(day, new Date()) && "bg-gold text-paper font-bold shadow-[0_10px_25px_-5px_rgba(186,155,90,0.5),0_8px_10px_-6px_rgba(0,0,0,0.1)] -translate-y-1.5 z-10 scale-105 ring-4 ring-gold/20",
                  dayEvents.length > 0 && "cursor-pointer"
                )}
              >
                <span className="text-sm">{format(day, 'd')}</span>
                <span className="text-[8px] opacity-60">{hDay}</span>
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {dayEvents.map((e, i) => (
                      <div 
                        key={`event-dot-${i}-${e.title}`} 
                        className={cn(
                          "w-1 h-1 rounded-full",
                          e.type === 'Wiladat' ? "bg-green-500" : 
                          e.type === 'Shahadat' ? "bg-red-500" : 
                          e.type === 'Eid' ? "bg-amber-400" : "bg-blue-400"
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events Panel */}
      <AnimatePresence>
        {selectedDateEvents && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-paper border border-olive/10 rounded-[32px] p-6 shadow-sm space-y-6"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="serif text-2xl text-olive">{format(selectedDateEvents.date, 'MMMM do, yyyy')}</h3>
                <p className="text-xs uppercase tracking-widest text-gold font-bold">{getHijriDateString(selectedDateEvents.date, settings.hijriOffset)}</p>
              </div>
              <button 
                onClick={() => setSelectedDateEvents(null)}
                className="p-2 rounded-full hover:bg-olive/10 text-olive transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {selectedDateEvents.events.map((event, idx) => (
                <div key={`event-detail-${idx}-${event.title}`} className="p-4 rounded-2xl bg-olive/5 border border-olive/10 flex items-start gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2 shrink-0",
                    event.type === 'Wiladat' ? "bg-green-500" : 
                    event.type === 'Shahadat' ? "bg-red-500" : 
                    event.type === 'Eid' ? "bg-amber-400" : "bg-blue-400"
                  )} />
                  <div className="space-y-1">
                    <h4 className="serif text-base text-olive leading-snug">{event.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedDateEvents && (
        <div className="space-y-4">
          <h3 className="serif text-lg text-olive">Events this Month</h3>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, idx) => {
              const isToday = isSameDay(event.gregorianDate, new Date());
              return (
                <div key={`month-event-${idx}-${event.title}`} className={cn(
                  "relative pl-6 border-l border-olive/10 pb-4 last:pb-0 transition-all",
                  isToday && "border-gold"
                )}>
                  <div className={cn(
                    "absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full",
                    event.type === 'Wiladat' ? "bg-green-500" : 
                    event.type === 'Shahadat' ? "bg-red-500" : 
                    event.type === 'Eid' ? "bg-amber-400" : "bg-blue-400",
                    isToday && "ring-4 ring-gold/20"
                  )} />
                  <div className={cn(
                    "space-y-1 p-2.5 rounded-xl transition-all",
                    isToday ? "bg-paper border border-gold/30 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] translate-x-1" : "bg-olive/5"
                  )}>
                    <p className="text-[9px] uppercase tracking-wider text-gold font-semibold">
                      {format(event.gregorianDate, 'MMMM do, yyyy')} • {getHijriDateString(event.gregorianDate, settings.hijriOffset)}
                      {isToday && <span className="ml-2 bg-gold text-paper px-1.5 py-0.5 rounded-full text-[7px]">TODAY</span>}
                    </p>
                    <h4 className="serif text-sm font-semibold text-olive leading-snug">{event.title}</h4>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-olive/60 italic">
              No events found for this month.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function TasbihView({ 
  onBack, 
  settings,
  customTasbihs,
  onUpdateCustomTasbihs
}: { 
  onBack: () => void, 
  settings: PrayerSettings,
  customTasbihs: any[],
  onUpdateCustomTasbihs: (tasbihs: any[]) => void
}) {
  const [viewMode, setViewMode] = useState<'list' | 'counter' | 'add'>('list');
  const setCustomTasbihs = onUpdateCustomTasbihs;
  
  const [activeTasbih, setActiveTasbih] = useState<any | null>(null);
  const [count, setCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState(100);
  
  const t = useTranslation(settings.language);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const sequence = [
    { name: 'Allahu Akbar', target: 34, arabic: 'اللّٰهُ أَكْبَر' },
    { name: 'Alhamdulillah', target: 33, arabic: 'ٱلْحَمْدُ لِلَّٰه' },
    { name: 'Subhanallah', target: 33, arabic: 'سُبْحَانَ ٱللَّٰه' },
  ];

  const defaultTasbih = { 
    id: 'default', 
    name: t('defaultTasbihName'), 
    target: 0,
    sequence: true 
  };

  const currentTasbihItem = activeTasbih?.sequence ? sequence[cycle % 3] : activeTasbih;

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playClick = () => {
    try {
      const audioCtx = getAudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const playBeep = () => {
    try {
      const audioCtx = getAudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const handleIncrement = () => {
    if (!activeTasbih) return;
    const target = activeTasbih.sequence ? sequence[cycle % 3].target : activeTasbih.target;
    
    if (count >= target) {
      if (activeTasbih.sequence) {
        if (cycle % 3 === 2) {
          setCount(1);
          setCycle(0);
        } else {
          setCount(1);
          setCycle(prev => prev + 1);
        }
      } else {
        setCount(1);
      }
      playClick();
      if (navigator.vibrate) navigator.vibrate(10);
    } else {
      const nextCount = count + 1;
      setCount(nextCount);
      if (nextCount === target) {
        playBeep();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } else {
        playClick();
        if (navigator.vibrate) navigator.vibrate(10);
      }
    }
  };

  const handleReset = () => {
    setCount(0);
    setCycle(0);
  };

  const saveCustomTasbihs = (list: any) => {
    localStorage.setItem('custom_tasbihs', JSON.stringify(list));
    setCustomTasbihs(list);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      name: newName,
      target: newTarget
    };
    saveCustomTasbihs([...customTasbihs, newItem]);
    setNewName('');
    setNewTarget(100);
    setViewMode('list');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveCustomTasbihs(customTasbihs.filter(t => t.id !== id));
  };

  if (viewMode === 'list') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6 space-y-6 pb-24"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-olive/5 rounded-full transition-all text-olive"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="serif text-3xl text-olive">{t('tasbih')}</h2>
          </div>
          <button 
            onClick={() => setViewMode('add')}
            className="p-3 bg-gold text-paper rounded-full shadow-lg shadow-gold/20 hover:scale-105 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              setActiveTasbih(defaultTasbih);
              setCount(0);
              setCycle(0);
              setViewMode('counter');
            }}
            className="w-full text-left bg-paper p-6 rounded-[32px] border border-olive/5 hover:border-gold/30 transition-all shadow-sm group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-paper transition-all">
                <RefreshCw size={24} />
              </div>
              <ChevronRight className="text-olive/20 group-hover:text-gold transition-all" />
            </div>
            <h3 className="serif text-xl text-olive mb-1">{t('defaultTasbihName')}</h3>
            <p className="text-xs text-olive/40 uppercase tracking-widest">34 • 33 • 33 Counts</p>
          </button>

          {customTasbihs.length > 0 && (
            <div className="pt-4 space-y-4">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">{t('customTasbihs')}</h4>
              <div className="grid grid-cols-1 gap-3">
                {customTasbihs.map(tasbih => (
                  <button
                    key={tasbih.id}
                    onClick={() => {
                      setActiveTasbih(tasbih);
                      setCount(0);
                      setCycle(0);
                      setViewMode('counter');
                    }}
                    className="w-full text-left bg-paper p-5 rounded-[28px] border border-olive/5 hover:border-gold/30 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-olive/5 flex items-center justify-center text-olive/40 group-hover:text-gold group-hover:bg-gold/10 transition-all">
                        <Activity size={20} />
                      </div>
                      <div>
                        <h4 className="serif text-lg text-olive">{tasbih.name}</h4>
                        <p className="text-[10px] text-olive/40 uppercase tracking-widest">{tasbih.target} Counts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleDelete(tasbih.id, e)}
                        className="p-2 text-olive/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight className="text-olive/20" size={16} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (viewMode === 'add') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="p-6 h-full flex flex-col max-w-sm mx-auto space-y-8"
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setViewMode('list')}
            className="p-2 hover:bg-olive/5 rounded-full transition-all text-olive"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="serif text-3xl text-olive">{t('addNewTasbih')}</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-gold font-bold ml-1">{t('tasbihName')}</label>
            <input 
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Salawat"
              className="w-full bg-paper rounded-[20px] p-4 border border-olive/10 focus:ring-2 focus:ring-gold/20 outline-none text-olive"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-gold font-bold ml-1">{t('targetCount')} ({newTarget})</label>
            <input 
              type="range"
              min="1"
              max="1000"
              value={newTarget}
              onChange={(e) => setNewTarget(parseInt(e.target.value))}
              className="w-full accent-gold h-2 bg-olive/10 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-olive/40 font-mono">
              <span>1</span>
              <span>250</span>
              <span>500</span>
              <span>750</span>
              <span>1000</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="w-full py-4 bg-olive text-paper rounded-[20px] font-bold uppercase tracking-widest text-xs hover:bg-olive/90 disabled:opacity-50 transition-all shadow-lg shadow-olive/20"
          >
            {t('saveTasbih')}
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className="w-full py-4 text-olive/60 font-bold uppercase tracking-widest text-xs hover:text-olive transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 h-screen flex flex-col items-center justify-between relative"
    >
      <div className="w-full flex items-center justify-between pt-4">
        <button 
          onClick={() => setViewMode('list')}
          className="p-2 hover:bg-olive/5 rounded-full transition-all text-olive"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center flex-1 pr-10">
          <h2 className="serif text-2xl text-olive">{currentTasbihItem?.name}</h2>
          {activeTasbih?.sequence && (
            <p className="text-[10px] text-olive/60 uppercase tracking-widest">Tasbih Fatima Zehra (sa)</p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center space-y-12 flex-1">
        <div className="text-center">
          {currentTasbihItem?.arabic && (
            <h3 className="text-4xl font-arabic text-olive mb-4" dir="rtl">{currentTasbihItem.arabic}</h3>
          )}
        </div>

        <button 
          onClick={handleIncrement}
          className="w-72 h-72 rounded-full bg-paper border-8 border-olive/5 shadow-2xl flex items-center justify-center active:scale-95 transition-transform relative group"
        >
          <div className="absolute inset-4 rounded-full border border-gold/20 group-active:border-gold/40 transition-colors" />
          <span className="serif text-9xl text-olive font-bold tracking-tight">{count}</span>
          <div className="absolute bottom-16 text-[10px] uppercase tracking-widest text-gold font-bold">{t('tapToCount')}</div>
        </button>
      </div>

      <div className="w-full flex flex-col items-center gap-8 pb-12">
        <div className="flex gap-2">
          {activeTasbih?.sequence ? (
            sequence.map((_, i) => (
              <div 
                key={`tasbih-seq-dot-${i}`}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === cycle % 3 ? "w-12 bg-gold" : 
                  i < cycle % 3 ? "w-8 bg-olive/40" : "w-8 bg-olive/10"
                )}
              />
            ))
          ) : (
            <div className="relative w-48 h-2 bg-olive/5 rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gold"
                initial={{ width: 0 }}
                animate={{ width: `${(count / activeTasbih.target) * 100}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleReset}
            className="p-4 bg-paper rounded-full border border-olive/10 text-olive hover:bg-olive/5 transition-colors shadow-sm"
          >
            <RefreshCw size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const AyahItem = React.memo(({ 
  ayah, 
  idx, 
  translation, 
  readingMode, 
  settings, 
  bookmarks, 
  language, 
  arabicStyle, 
  isActive, 
  activeWordIdx, 
  tappedWordId, 
  onTogglePlayVerse, 
  onToggleBookmark, 
  onSpeakWord,
  surahNumber
}: {
  ayah: any,
  idx: number,
  translation: any,
  readingMode: 'both' | 'arabic' | 'translation',
  settings: PrayerSettings,
  bookmarks: any[],
  language: 'en' | 'ur',
  arabicStyle: any,
  isActive: boolean,
  activeWordIdx: number | null,
  tappedWordId: string | null,
  onTogglePlayVerse: (ayah: any, idx: number) => void,
  onToggleBookmark: (ayah: any) => void,
  onSpeakWord: (surahNum: number, ayahNum: number, wordIdx: number) => void,
  surahNumber: number
}) => {
  const isBookmarked = bookmarks.some(b => b.id === `quran-${surahNumber}-${ayah.numberInSurah}`);

  return (
    <div id={`ayah-${ayah.numberInSurah}`} className="space-y-6 group">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full border border-gold/20 text-gold flex items-center justify-center text-xs font-bold">
            {ayah.numberInSurah}
          </span>
          <button 
            onClick={() => onTogglePlayVerse(ayah, idx)}
            className={cn(
              "p-2 rounded-full transition-all",
              isActive ? "text-gold bg-gold/10" : "text-olive/10 hover:text-gold hover:bg-gold/5"
            )}
          >
            {isActive ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button 
            onClick={() => onToggleBookmark(ayah)}
            className={cn(
              "p-2 rounded-full transition-all",
              isBookmarked ? "text-gold bg-gold/10" : "text-olive/10 hover:text-gold hover:bg-gold/5"
            )}
          >
            <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="h-px flex-1 bg-olive/5 mx-4" />
      </div>

      <div className="space-y-6">
        {(readingMode === 'both' || readingMode === 'arabic') && (
          <p className={cn(getFontSize('text-3xl', settings.arabicFontSize), "leading-[2.5] text-right font-arabic text-olive")} dir="rtl" style={arabicStyle}>
            {ayah.text?.split(' ').map((word: string, wIdx: number) => {
              const isWordTapped = tappedWordId === `${surahNumber}-${ayah.numberInSurah}-${wIdx}`;
              const isAudioActive = isActive && activeWordIdx === wIdx;
              const isHighlighted = isWordTapped || isAudioActive;
              return (
                <React.Fragment key={wIdx}>
                  <span 
                    onClick={() => onSpeakWord(surahNumber, ayah.numberInSurah, wIdx)}
                    className={cn(
                      "cursor-pointer transition-colors inline-block",
                      isHighlighted ? "text-gold bg-olive/10 rounded px-1" : "hover:text-gold"
                    )}
                    title="Tap to pronounce"
                  >
                    {word}
                  </span>
                  {' '}
                </React.Fragment>
              );
            })}
          </p>
        )}
        
        {(readingMode === 'both' || readingMode === 'translation') && (
          <div className="bg-paper/50 p-6 rounded-[32px] border border-olive/5">
            <p className={cn(
              "serif text-lg text-olive/80 leading-relaxed",
              language === 'ur' && "font-arabic text-right text-2xl"
            )} dir={language === 'ur' ? 'rtl' : 'ltr'} style={language === 'ur' ? arabicStyle : undefined}>
              {translation?.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

function QuranView({ 
  settings, 
  selectedSurahNumber, 
  onSelectSurahNumber, 
  targetAyahNumber, 
  onClearTargetAyah, 
  bookmarks, 
  toggleBookmark, 
  goBack,
  surahs = [],
  isLoadingSurahs = false,
  surahsError = null
}: { 
  settings: PrayerSettings, 
  selectedSurahNumber?: number | null, 
  onSelectSurahNumber: (num: number | null) => void, 
  targetAyahNumber?: number | null, 
  onClearTargetAyah?: () => void, 
  bookmarks: any[], 
  toggleBookmark: (item: any) => void, 
  goBack: () => void,
  surahs?: any[],
  isLoadingSurahs?: boolean,
  surahsError?: string | null
}) {
  const [selectedSurah, setSelectedSurah] = useState<any | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!selectedSurah && listContainerRef.current) {
      setTimeout(() => {
        const savedPos = localStorage.getItem('quran_scroll_pos');
        console.log('QuranView: restoring scroll pos', savedPos);
        if (savedPos && listContainerRef.current) {
          listContainerRef.current.scrollTop = parseInt(savedPos);
        }
      }, 100);
    }
  }, [selectedSurah]);
  const [verses, setVerses] = useState<any[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [readingMode, setReadingMode] = useState<'both' | 'arabic' | 'translation'>('both');
  const { currentTrack, isPlaying: isPlayingAudio, currentTime: currentTimeGlobal, duration: durationGlobal, playTrack, stop: stopAudio, seek, setVolume, volume: globalVolume } = useAudio();
  
  const t = useTranslation(settings.language);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [tappedWordId, setTappedWordId] = useState<string | null>(null);
  const playingVerseIndexRef = useRef<number | null>(null);

  // Derive playing state from global player
  const isPlayingSurah = isPlayingAudio && currentTrack?.category === 'Quran';
  const playingVerseIndex = (isPlayingSurah && currentTrack?.id.startsWith('quran-') && verses.length > 0)
    ? verses.findIndex(v => `quran-${v.number}` === currentTrack?.id)
    : null;

  const currentTime = currentTimeGlobal;
  const duration = durationGlobal;

  useEffect(() => {
    if (selectedSurahNumber) {
      if (surahs.length > 0) {
        const s = surahs.find(surah => surah.number === selectedSurahNumber);
        if (s) setSelectedSurah(s);
      } else {
        fetchSurahDetails(selectedSurahNumber, language);
      }
    } else {
      setSelectedSurah(null);
      setVerses([]);
      setTranslations([]);
    }
  }, [selectedSurahNumber, language]);

  const playbackRateRef = useRef(1);
  const versesRef = useRef<any[]>([]);

  const arabicStyle = { fontFamily: `"${settings.arabicFont || 'Amiri Quran'}", serif` };

  useEffect(() => {
    playingVerseIndexRef.current = playingVerseIndex;
  }, [playingVerseIndex]);

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  useEffect(() => {
    if (isPlayingSurah && playingVerseIndex !== null && verses[playingVerseIndex]) {
      const currentAyah = verses[playingVerseIndex];
      const words = currentAyah.text?.split(' ') || [];
      const wordCount = words.length;
      
      if (duration > 0) {
        const wordDuration = duration / wordCount;
        const currentWordIndex = Math.floor(currentTime / wordDuration);
        setActiveWordIndex(Math.min(currentWordIndex, wordCount - 1));
      }
    } else {
      setActiveWordIndex(null);
    }
  }, [currentTime, duration, isPlayingSurah, playingVerseIndex, verses]);

  useEffect(() => {
    if (targetAyahNumber && verses.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`ayah-${targetAyahNumber}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (onClearTargetAyah) {
            onClearTargetAyah();
          }
        }
      }, 100);
    }
  }, [verses, targetAyahNumber, onClearTargetAyah]);

  const playVerseAtIndex = (index: number) => {
    const currentVerses = versesRef.current;
    if (index >= 0 && index < currentVerses.length) {
      const ayah = currentVerses[index];
      
      playTrack({
        id: `quran-${ayah.number}`,
        title: `${selectedSurah.englishName} - Ayah ${ayah.numberInSurah}`,
        url: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`,
        category: 'Quran'
      }, () => {
        // onEnded: skip to next verse
        playVerseAtIndex(index + 1);
      });
    }
  };

  const togglePlaySurah = async (surah: any) => {
    if (currentTrack?.id.startsWith(`quran-`) && isPlayingAudio) {
      // Toggle handled by global player
    } else {
      if (verses.length > 0) {
        playVerseAtIndex(0);
      }
    }
  };

  const togglePlayVerse = async (ayah: any, index: number) => {
    playVerseAtIndex(index);
  };

  const closeAudioPlayer = () => {
    stopAudio();
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const seekAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seek(time);
  };

  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleToggleBookmark = (ayah: any) => {
    const bookmarkData = {
      id: `quran-${selectedSurah.number}-${ayah.numberInSurah}`,
      type: 'quran',
      title: selectedSurah.englishName,
      subtitle: `Verse ${ayah.numberInSurah}`,
      arabic: ayah.text,
      data: {
        ...ayah,
        surahName: selectedSurah.englishName,
        surahNumber: selectedSurah.number,
        translation: translations.find(t => t.numberInSurah === ayah.numberInSurah)?.text
      }
    };
    toggleBookmark(bookmarkData);
  };

  const fetchSurahDetails = async (number: number, lang: 'en' | 'ur' = language) => {
    if (listContainerRef.current) {
      localStorage.setItem('quran_scroll_pos', listContainerRef.current.scrollTop.toString());
    }

    // Check cache first
    const cacheKey = `noor_surah_details_${number}_${lang}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setVerses(parsed.verses);
        setTranslations(parsed.translations);
        setSelectedSurah(parsed.surah);
        setIsLoading(false);
        return;
      } catch (e) {
        console.warn("Failed to parse cached surah details", e);
      }
    }

    setIsLoading(true);
    setFetchError(null);
    try {
      // Parallelize Arabic verses and translation fetching
      const edition = lang === 'en' ? 'en.sahih' : 'ur.ahmedali';
      const [resArabic, resTrans] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${number}`),
        fetch(`https://api.alquran.cloud/v1/surah/${number}/${edition}`)
      ]);

      if (!resArabic.ok) throw new Error("Failed to fetch Arabic verses");
      if (!resTrans.ok) throw new Error("Failed to fetch translation");

      const [dataArabic, dataTrans] = await Promise.all([
        resArabic.json(),
        resTrans.json()
      ]);

      if (dataArabic.code !== 200) throw new Error("Invalid response from Arabic Quran API");
      if (dataTrans.code !== 200) throw new Error("Invalid response from translation API");
      
      let ayahs = dataArabic.data.ayahs;
      if (number !== 1) {
        ayahs = ayahs.map((ayah: any, index: number) => {
          if (index === 0) {
            const bismillah = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ";
            if (ayah.text.startsWith(bismillah)) {
              return { ...ayah, text: ayah.text.replace(bismillah, "").trim() };
            }
          }
          return ayah;
        });
      }
      
      const details = {
        verses: ayahs,
        translations: dataTrans.data.ayahs,
        surah: dataArabic.data
      };

      // Batch state updates
      setVerses(details.verses);
      setTranslations(details.translations);
      setSelectedSurah(details.surah);

      // Save to cache (limit size by only keeping some)
      try {
        localStorage.setItem(cacheKey, JSON.stringify(details));
      } catch (e) {
        // If localStorage is full, clear some old caches
        Object.keys(localStorage)
          .filter(key => key.startsWith('noor_surah_details_'))
          .forEach(key => localStorage.removeItem(key));
        localStorage.setItem(cacheKey, JSON.stringify(details));
      }
    } catch (e) {
      console.error("Error fetching surah details:", e);
      setFetchError(e instanceof Error ? e.message : "Failed to load surah details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSurah) {
      fetchSurahDetails(selectedSurah.number, language);
    }
  }, [selectedSurah?.number, language]);

  const filteredSurahs = surahs.filter(s => 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.includes(searchQuery) ||
    s.number.toString() === searchQuery
  );

  const speakArabicWord = (surahNumber: number, ayahNumber: number, wordIndex: number) => {
    const s = surahNumber.toString().padStart(3, '0');
    const a = ayahNumber.toString().padStart(3, '0');
    const w = (wordIndex + 1).toString().padStart(3, '0');
    const audioUrl = `https://verses.quran.com/wbw/${s}_${a}_${w}.mp3`;
    
    const wordId = `${surahNumber}-${ayahNumber}-${wordIndex}`;
    setTappedWordId(wordId);

    const wordAudio = new Audio(audioUrl);
    wordAudio.onended = () => setTappedWordId(null);
    wordAudio.play().catch(e => {
      console.warn("Failed to play word audio:", e);
      setTappedWordId(null);
    });
  };

  if (selectedSurah) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 bg-paper z-50 overflow-y-auto pb-32"
      >
        {/* Header */}
        <div className="sticky top-0 bg-paper/80 backdrop-blur-md border-b border-olive/5 px-4 py-1.5 flex flex-col z-40">
          {fetchError && (
            <div className="mb-2 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between gap-3">
              <p className="text-[10px] text-red-600 font-medium">{fetchError}</p>
              <button 
                onClick={() => fetchSurahDetails(selectedSurah.number)}
                className="text-[10px] font-bold text-red-700 uppercase tracking-wider underline shrink-0"
              >
                Retry
              </button>
            </div>
          )}
          <div className="flex justify-between items-center">
          <button 
            onClick={() => {
              if (selectedSurah) {
                onSelectSurahNumber(null);
                setSelectedSurah(null);
                if (onClearTargetAyah) onClearTargetAyah();
              } else {
                goBack();
              }
            }}
            className="p-1.5 hover:bg-olive/5 rounded-full transition-all"
          >
            <ChevronLeft size={20} className="text-olive" />
          </button>
          
          <div className="text-center">
            <h2 className="serif text-lg text-olive">{selectedSurah.englishName}</h2>
            <p className="text-[9px] uppercase tracking-widest text-gold font-bold">{selectedSurah.englishNameTranslation}</p>
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex bg-olive/5 rounded-full p-0.5">
              <button 
                onClick={() => setReadingMode('arabic')}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold transition-all",
                  readingMode === 'arabic' ? "bg-olive text-paper" : "text-olive/40"
                )}
                title="Arabic Only"
              >
                AR
              </button>
              <button 
                onClick={() => setReadingMode('both')}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold transition-all",
                  readingMode === 'both' ? "bg-olive text-paper" : "text-olive/40"
                )}
                title="Both"
              >
                ALL
              </button>
              <button 
                onClick={() => setReadingMode('translation')}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold transition-all",
                  readingMode === 'translation' ? "bg-olive text-paper" : "text-olive/40"
                )}
                title="Translation Only"
              >
                TR
              </button>
            </div>
            <div className="flex bg-olive/5 rounded-full p-0.5">
              <button 
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold transition-all",
                  language === 'en' ? "bg-olive text-paper" : "text-olive/40"
                )}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('ur')}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all",
                  language === 'ur' ? "bg-olive text-paper" : "text-olive/40"
                )}
              >
                UR
              </button>
            </div>
          </div>
        </div>
        </div>

        <div className="p-6 space-y-8 max-w-2xl mx-auto">
          {/* Surah Info Card */}
          <div className="bg-olive text-paper p-8 rounded-[40px] text-center space-y-6 shadow-xl shadow-olive/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/10 rounded-full -ml-16 -mb-16 blur-3xl" />
            
            <div className="space-y-2 relative">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Surah {selectedSurah.number}</p>
              <h1 className="serif text-5xl">{selectedSurah.englishName}</h1>
              <div className="flex justify-center items-center gap-4 text-xs opacity-60 uppercase tracking-widest">
                <span>{selectedSurah.revelationType}</span>
                <span className="w-1 h-1 bg-gold rounded-full" />
                <span>{selectedSurah.numberOfAyahs} Verses</span>
              </div>
            </div>

            <div className="pt-4 relative">
              <button 
                onClick={() => togglePlaySurah(selectedSurah)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gold text-paper rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-gold/30"
              >
                {isPlayingSurah && currentTrack?.id.includes(selectedSurah.number.toString()) ? <Pause size={20} /> : <Volume2 size={20} />}
                {isPlayingSurah && currentTrack?.id.includes(selectedSurah.number.toString()) ? "Pause Recitation" : "Play Full Surah"}
              </button>
              <p className="text-[10px] opacity-40 mt-3 italic">Recited by Mishary Rashid Alafasy</p>
            </div>
          </div>

          {/* Bismillah */}
          {selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
            <div className="text-center py-8">
              <p className="text-4xl font-arabic text-olive opacity-80" style={arabicStyle}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              <p className="text-xs text-gold mt-2 uppercase tracking-widest font-bold">{t('bismillah')}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
              <p className="text-xs text-olive/40 uppercase tracking-widest font-bold">Loading Verses...</p>
            </div>
          ) : (
            <div className="space-y-12">
              {verses.map((ayah, idx) => (
                <AyahItem 
                  key={ayah.number}
                  ayah={ayah}
                  idx={idx}
                  translation={translations[idx]}
                  readingMode={readingMode}
                  settings={settings}
                  bookmarks={bookmarks}
                  language={language}
                  arabicStyle={arabicStyle}
                  isActive={isPlayingSurah && playingVerseIndex === idx}
                  activeWordIdx={isPlayingSurah && playingVerseIndex === idx ? activeWordIndex : null}
                  tappedWordId={tappedWordId}
                  onTogglePlayVerse={togglePlayVerse}
                  onToggleBookmark={handleToggleBookmark}
                  onSpeakWord={speakArabicWord}
                  surahNumber={selectedSurah.number}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      ref={listContainerRef}
      onScroll={() => {
        if (listContainerRef.current) {
          localStorage.setItem('quran_scroll_pos', listContainerRef.current.scrollTop.toString());
        }
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6 pb-24"
    >
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="serif text-3xl text-olive">{t('quran')}</h2>
          <p className="text-sm text-olive/60">{t('readAndReflect')}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-olive/30" size={18} />
          <input
            type="text"
            placeholder={t('searchSurahs')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-paper rounded-[20px] p-4 pl-12 border border-olive/5 focus:outline-none focus:ring-2 focus:ring-gold/20 text-olive placeholder:text-olive/30 shadow-sm"
          />
        </div>

        {isLoadingSurahs && surahs.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
          </div>
        ) : (fetchError || surahsError) ? (
          <div className="text-center py-12 px-6">
            <p className="text-red-500 mb-4">{fetchError || surahsError}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSurahs.map((surah) => (
              <button
                key={surah.number}
                onClick={() => onSelectSurahNumber(surah.number)}
                className="flex items-center justify-between p-6 bg-paper rounded-[28px] border border-olive/10 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-5 relative z-10">
                  <span className="w-12 h-12 rounded-2xl bg-gold/5 text-gold flex items-center justify-center text-sm font-bold shadow-inner border border-gold/10 group-hover:bg-gold/10 transition-colors">
                    {surah.number}
                  </span>
                  <div>
                    <h4 className="serif text-xl text-olive group-hover:text-gold transition-colors">{surah.englishName}</h4>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">{surah.englishNameTranslation}</p>
                  </div>
                </div>
                <div className="text-right relative z-10">
                  <p className="font-arabic text-xl text-olive" style={arabicStyle}>{surah.name}</p>
                  <p className="text-[10px] text-olive/40 uppercase tracking-widest">{surah.numberOfAyahs} {t('verses')}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function BookmarksView({ bookmarks, toggleBookmark, onNavigate, setSelectedSurahNumber, setTargetAyahNumber, setSelectedDua, setSelectedZiyarat, setTargetHadith, setSelectedSectionIndex }: { bookmarks: any[], toggleBookmark: (item: any) => void, onNavigate: (tab: string) => void, setSelectedSurahNumber: (num: number) => void, setTargetAyahNumber: (num: number) => void, setSelectedDua: (dua: Dua) => void, setSelectedZiyarat: (ziyarat: Ziyarat) => void, setTargetHadith: (hadith: Hadith) => void, setSelectedSectionIndex: (index: number) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6 pb-24"
    >
      <div className="space-y-2">
        <h2 className="serif text-3xl text-olive">Bookmarks</h2>
        <p className="text-sm text-olive/60">Your saved content</p>
      </div>

      <div className="space-y-6">
        {bookmarks.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-olive/5 rounded-full flex items-center justify-center mx-auto">
              <Bookmark size={32} className="text-olive/20" />
            </div>
            <p className="text-olive/40 text-sm italic">No bookmarks yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookmarks.map((bookmark) => (
              <div 
                key={bookmark.id} 
                className="space-y-4 bg-paper/50 p-6 rounded-[32px] border border-olive/5 relative cursor-pointer hover:bg-olive/5 transition-all"
                onClick={() => {
                  if (bookmark.type === 'quran') {
                    setTargetAyahNumber(bookmark.data.numberInSurah);
                    setSelectedSurahNumber(bookmark.data.surahNumber);
                    onNavigate('quran');
                  } else if (bookmark.type === 'hadith') {
                    setTargetHadith(bookmark.data);
                    onNavigate('home');
                  } else if (bookmark.type === 'dua') {
                    setSelectedDua(bookmark.data);
                    setSelectedSectionIndex(0);
                    onNavigate('duas');
                  } else if (bookmark.type === 'ziyarat') {
                    setSelectedZiyarat(bookmark.data);
                    setSelectedSectionIndex(0);
                    onNavigate('ziyarats');
                  }
                }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-center">
                      <span className="block text-[10px] font-bold text-gold uppercase tracking-widest mb-1">
                        {bookmark.title}
                      </span>
                      {bookmark.subtitle && (
                        <span className="w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center text-[10px] font-bold shrink-0 mx-auto">
                          {bookmark.subtitle.replace('Verse ', '')}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {bookmark.data?.audioUrl && (
                        <div className="p-2 rounded-full text-gold bg-gold/10">
                          <Volume2 size={16} />
                        </div>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(bookmark);
                        }}
                        className="p-2 rounded-full text-gold bg-gold/10 transition-all"
                      >
                        <Bookmark size={16} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                  <p className="text-2xl leading-[2.5] text-right font-arabic text-olive" dir="rtl" style={{ fontFamily: '"Amiri Quran", serif' }}>
                    {bookmark.arabic}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ZiyaratsView({ 
  settings, 
  selectedZiyarat, 
  onSelectZiyarat, 
  bookmarks, 
  toggleBookmark, 
  goBack, 
  onNavigateToItem,
  selectedSectionIndex,
  setSelectedSectionIndex,
  readingProgress,
  handleResume
}: { 
  settings: PrayerSettings, 
  selectedZiyarat: Ziyarat | null, 
  onSelectZiyarat: (ziyarat: Ziyarat | null) => void, 
  bookmarks: any[], 
  toggleBookmark: (item: any) => void, 
  goBack: () => void, 
  onNavigateToItem: (item: RelatedItem) => void,
  selectedSectionIndex: number,
  setSelectedSectionIndex: (idx: number) => void,
  readingProgress: Record<string, number>,
  handleResume: (id: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const t = useTranslation(settings.language);

  useEffect(() => {
    setSelectedSectionIndex(0);
  }, [selectedZiyarat?.id]);

  const categories = ['All', ...Array.from(new Set(ZIYARATS.map(z => z.category))).filter((c): c is string => !!c && c !== 'All').sort()];

  const filteredZiyarats = ZIYARATS.filter(z => {
    const matchesSearch = (z.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                          (z.category?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesCategory = selectedCategory === 'All' || z.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const handleBack = () => {
    if (selectedZiyarat) {
      onSelectZiyarat(null);
    } else {
      goBack();
    }
  };

  const { currentTrack, isPlaying, playTrack } = useAudio();
  const isCurrentTrack = currentTrack?.id === `ziyarat-${selectedZiyarat?.id}-${selectedSectionIndex}`;

  const toggleAudio = () => {
    if (!selectedZiyarat) return;
    const currentAudioUrl = (selectedZiyarat?.sections && selectedZiyarat.sections[selectedSectionIndex]?.audioUrl) || selectedZiyarat?.audioUrl;
    if (!currentAudioUrl) return;
    
    playTrack({
      id: `ziyarat-${selectedZiyarat.id}-${selectedSectionIndex}`,
      title: (selectedZiyarat.sections && selectedZiyarat.sections[selectedSectionIndex]?.title) 
        ? `${selectedZiyarat.title} - ${selectedZiyarat.sections[selectedSectionIndex].title}` 
        : selectedZiyarat.title,
      url: currentAudioUrl,
      category: 'Ziyarat'
    });
  };

  const closeAudioPlayer = () => {
    // Handled by global player
  };

  if (selectedZiyarat) {
    const isBookmarked = bookmarks.some(b => b.id === `ziyarat-${selectedZiyarat.id}`);
    
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col h-full"
      >
        <div className="px-6 py-4 flex flex-col gap-4 border-b border-olive/10 bg-paper/50 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="p-2 rounded-full text-olive hover:bg-olive/10 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
              {((selectedZiyarat.sections && selectedZiyarat.sections[selectedSectionIndex]?.audioUrl) || selectedZiyarat.audioUrl) && (
                <button 
                  onClick={toggleAudio}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    (isCurrentTrack && isPlaying) ? "text-paper bg-olive" : "text-olive/40 hover:text-olive hover:bg-olive/5"
                  )}
                  title="Play Audio"
                >
                  {(isCurrentTrack && isPlaying) ? <Pause size={20} /> : <Play size={20} />}
                </button>
              )}
              <button 
                onClick={() => toggleBookmark({
                  id: `ziyarat-${selectedZiyarat.id}`,
                  type: 'ziyarat',
                  title: selectedZiyarat.title,
                  subtitle: selectedZiyarat.category,
                  data: selectedZiyarat
                })}
                className={cn(
                  "p-2 rounded-full transition-all",
                  isBookmarked ? "text-gold bg-gold/10" : "text-olive/40 hover:text-olive hover:bg-olive/5"
                )}
              >
                <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8 pb-24">
          <div className="bg-olive -mx-6 px-6 py-10 border-y border-olive/10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-paper via-transparent to-transparent"></div>
            <div className="relative z-10 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-paper/60 font-bold">{selectedZiyarat.category}</p>
              <h2 className="serif text-3xl text-paper font-bold">{selectedZiyarat.title}</h2>
              {selectedZiyarat.arabicTitle && (
                <p className="font-arabic text-3xl text-paper/90 leading-relaxed" dir="rtl">{selectedZiyarat.arabicTitle}</p>
              )}
              {selectedZiyarat.description && (
                <p className="text-sm text-paper/70 leading-relaxed italic max-w-xs mx-auto pt-2">
                  {selectedZiyarat.description}
                </p>
              )}
            </div>
          </div>

          {selectedZiyarat.sections && selectedZiyarat.sections.length > 0 && (
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide no-scrollbar">
              {selectedZiyarat.sections.map((section, idx) => (
                <button 
                  key={`ziyarat-section-tab-${idx}-${selectedZiyarat.id}`}
                  onClick={() => setSelectedSectionIndex(idx)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                    selectedSectionIndex === idx 
                      ? "bg-gold text-paper shadow-md" 
                      : "bg-gold/10 text-gold hover:bg-gold/20"
                  )}
                >
                  {section.title}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-8">
            {selectedZiyarat.sections && selectedZiyarat.sections.length > 0 && (
              <div className="border-b border-olive/10 pb-4">
                <h3 className="serif text-2xl text-olive font-bold">
                  {selectedZiyarat.sections[selectedSectionIndex].title}
                </h3>
              </div>
            )}
            {selectedZiyarat.sections && selectedZiyarat.sections[selectedSectionIndex]?.prelude && (
              <div className="bg-gold/5 border-l-4 border-gold p-4 rounded-r-xl">
                <p className="text-sm text-olive/80 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedZiyarat.sections[selectedSectionIndex].prelude}
                </p>
              </div>
            )}
            {!selectedZiyarat.sections && selectedZiyarat.prelude && (
              <div className="bg-gold/5 border-l-4 border-gold p-4 rounded-r-xl">
                <p className="text-sm text-olive/80 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedZiyarat.prelude}
                </p>
              </div>
            )}

            {/* Resume Button */}
            {(() => {
              const itemId = (selectedZiyarat.sections && selectedZiyarat.sections.length > 0)
                ? `ziyarat-${selectedZiyarat.id}-${selectedSectionIndex}`
                : `ziyarat-${selectedZiyarat.id}`;
              const progress = readingProgress[itemId];

              // Calculate total lines to check if finished
              const isBismillah = (txt: string) => {
                if (!txt) return false;
                const normalized = txt.replace(/[\u064B-\u065F]/g, "").replace(/ٱ/g, "ا");
                return normalized.includes("بسم الله الرحمن الرحيم");
              };

              let activeLines: DuaLine[] = [];
              if (selectedZiyarat.sections && selectedZiyarat.sections.length > 0) {
                activeLines = selectedZiyarat.sections[selectedSectionIndex].lines;
              } else if (selectedZiyarat.lines) {
                activeLines = selectedZiyarat.lines;
              }

              const displayLines = (activeLines[0] && isBismillah(activeLines[0].arabic))
                ? activeLines.slice(1)
                : activeLines;

              const totalLines = displayLines.length;

              if (progress && progress > 2 && progress < totalLines - 1) {
                return (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleResume(itemId)}
                    className="w-full py-3 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center gap-2 text-gold font-bold text-xs uppercase tracking-widest hover:bg-gold/20 transition-all mb-4"
                  >
                    <Clock size={16} />
                    Continue from where you left off
                  </motion.button>
                );
              }
              return null;
            })()}

            {selectedZiyarat.sections && selectedZiyarat.sections.length > 0 ? (
              (() => {
                const isBismillah = (txt: string) => {
                  if (!txt) return false;
                  const normalized = txt.replace(/[\u064B-\u065F]/g, "").replace(/ٱ/g, "ا");
                  return normalized.includes("بسم الله الرحمن الرحيم");
                };

                const activeLines = selectedZiyarat.sections[selectedSectionIndex].lines;
                const displayLines = (activeLines[0] && isBismillah(activeLines[0].arabic))
                  ? activeLines.slice(1)
                  : activeLines;

                const groups: (DuaLine | DuaLine[])[] = [];
                let currentGroup: DuaLine[] = [];
                
                const linesWithIndex = displayLines.map((line, idx) => ({ ...line, absoluteIndex: idx }));
                linesWithIndex.forEach(line => {
                  if (line.isSeparator || !line.arabic) {
                    if (currentGroup.length > 0) {
                      groups.push(currentGroup);
                      currentGroup = [];
                    }
                    groups.push({ ...line, isSeparator: true });
                  } else {
                    currentGroup.push(line);
                  }
                });
                if (currentGroup.length > 0) groups.push(currentGroup);

                return groups.map((group, gIdx) => {
                  if (Array.isArray(group)) {
                    return (
                      <div key={`ziyarat-section-group-${gIdx}-${selectedZiyarat.id}`} className="bg-paper rounded-[32px] p-8 shadow-sm border border-olive/5 space-y-8">
                        {group.map((line, lIdx) => (
                          <div key={`ziyarat-section-line-${gIdx}-${lIdx}-${selectedZiyarat.id}`} data-line-index={(line as any).absoluteIndex} className="w-full space-y-4 border-b border-olive/5 pb-6 last:border-0 last:pb-0">
                            <p className={cn(getFontSize('text-3xl'), "leading-[2.5] text-right font-arabic", line.highlight ? "text-emerald-600" : "text-olive")} dir="rtl" style={{ fontFamily: `"${settings.arabicFont}", serif` }}>
                              {line.arabic}
                            </p>
                            <div className="space-y-2">
                              {line.transliteration && (
                                <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-70", line.highlight ? "text-emerald-600/80" : "text-gold")}>
                                  {line.transliteration}
                                </p>
                              )}
                              <p className={cn("text-sm leading-relaxed italic", line.highlight ? "text-emerald-700 font-medium" : "text-olive/70")}>
                                {line.english}
                              </p>
                              {settings.language === 'ur' && line.urdu && (
                                <p className="text-sm text-olive/70 leading-relaxed text-right font-urdu" dir="rtl">
                                  {line.urdu}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else if (group.isSeparator) {
                    return (
                      <div key={`ziyarat-section-sep-${gIdx}-${selectedZiyarat.id}`} className="py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="flex items-center w-full gap-4">
                            <span className="h-px flex-1 bg-gold/20"></span>
                            <span className="serif text-lg text-gold font-bold text-center px-4 leading-tight">
                              {group.english}
                            </span>
                            <span className="h-px flex-1 bg-gold/20"></span>
                          </div>
                          {group.urdu && (
                            <span className="font-urdu text-lg text-olive/60" dir="rtl">
                              {group.urdu}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <p key={`ziyarat-section-text-${gIdx}-${selectedZiyarat.id}`} className="text-sm text-olive/60 leading-relaxed italic px-4">
                        {group.english}
                      </p>
                    );
                  }
                });
              })()
            ) : selectedZiyarat.lines ? (
              (() => {
                const isBismillah = (txt: string) => {
                  if (!txt) return false;
                  const normalized = txt.replace(/[\u064B-\u065F]/g, "").replace(/ٱ/g, "ا");
                  return normalized.includes("بسم الله الرحمن الرحيم");
                };

                const displayLines = (selectedZiyarat.lines[0] && isBismillah(selectedZiyarat.lines[0].arabic))
                  ? selectedZiyarat.lines.slice(1)
                  : selectedZiyarat.lines;

                const groups: (DuaLine | DuaLine[])[] = [];
                let currentGroup: DuaLine[] = [];
                
                const linesWithIndex = displayLines.map((line, idx) => ({ ...line, absoluteIndex: idx }));
                linesWithIndex.forEach(line => {
                  if (line.isSeparator || !line.arabic) {
                    if (currentGroup.length > 0) {
                      groups.push(currentGroup);
                      currentGroup = [];
                    }
                    groups.push(line);
                  } else {
                    currentGroup.push(line);
                  }
                });
                if (currentGroup.length > 0) groups.push(currentGroup);

                return groups.map((group, gIdx) => {
                  if (Array.isArray(group)) {
                    return (
                      <div key={`ziyarat-direct-group-${gIdx}-${selectedZiyarat.id}`} className="bg-paper rounded-[32px] p-8 shadow-sm border border-olive/5 space-y-8">
                        {group.map((line, lIdx) => (
                          <div key={`ziyarat-direct-line-${gIdx}-${lIdx}-${selectedZiyarat.id}`} data-line-index={(line as any).absoluteIndex} className="w-full space-y-4 border-b border-olive/5 pb-6 last:border-0 last:pb-0">
                            <p className={cn(getFontSize('text-3xl'), "leading-[2.5] text-right font-arabic", line.highlight ? "text-emerald-600" : "text-olive")} dir="rtl" style={{ fontFamily: `"${settings.arabicFont}", serif` }}>
                              {line.arabic}
                            </p>
                            <div className="space-y-2">
                              {line.transliteration && (
                                <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-70", line.highlight ? "text-emerald-600/80" : "text-gold")}>
                                  {line.transliteration}
                                </p>
                              )}
                              <p className={cn("text-sm leading-relaxed italic", line.highlight ? "text-emerald-700 font-medium" : "text-olive/70")}>
                                {line.english}
                              </p>
                              {settings.language === 'ur' && line.urdu && (
                                <p className="text-sm text-olive/70 leading-relaxed text-right font-urdu" dir="rtl">
                                  {line.urdu}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else if (group.isSeparator) {
                    return (
                      <div key={`ziyarat-direct-sep-${gIdx}-${selectedZiyarat.id}`} className="relative py-8">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-olive/10"></span>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-paper px-6 text-[11px] font-bold uppercase tracking-[0.3em] text-gold">{group.english}</span>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <p key={`ziyarat-direct-text-${gIdx}-${selectedZiyarat.id}`} className="text-sm text-olive/60 leading-relaxed italic px-4">
                        {group.english}
                      </p>
                    );
                  }
                });
              })()
            ) : (
              <div className="bg-paper rounded-[32px] p-8 shadow-sm border border-olive/5 space-y-8">
                {selectedZiyarat.arabic && (
                  <p className="text-3xl leading-[2.5] text-right font-arabic text-olive" dir="rtl" style={{ fontFamily: `"${settings.arabicFont}", serif` }}>
                    {selectedZiyarat.arabic}
                  </p>
                )}
                {selectedZiyarat.transliteration && (
                  <p className="text-[10px] text-gold font-bold uppercase tracking-widest opacity-70 text-center">
                    {selectedZiyarat.transliteration}
                  </p>
                )}
                {selectedZiyarat.translation && (
                  <p className="text-sm text-olive/70 leading-relaxed italic">
                    {selectedZiyarat.translation}
                  </p>
                )}
                {settings.language === 'ur' && selectedZiyarat.translationUrdu && (
                  <p className="text-sm text-olive/70 leading-relaxed text-right font-urdu" dir="rtl">
                    {selectedZiyarat.translationUrdu}
                  </p>
                )}
              </div>
            )}
          </div>

          {selectedZiyarat.footer && (
            <div className="mt-12 p-6 bg-gold/5 rounded-[24px] border border-gold/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gold">Note</h4>
              <p className="text-sm text-olive/80 leading-relaxed whitespace-pre-line">
                {selectedZiyarat.footer}
              </p>
            </div>
          )}

          {selectedZiyarat.relatedItems && selectedZiyarat.relatedItems.length > 0 && (
            <div className="mt-8 pt-8 border-t border-olive/10 space-y-4">
              <div className="grid gap-4">
                {selectedZiyarat.relatedItems.map((item, rIdx) => (
                  <button 
                    key={`ziyarat-related-${selectedZiyarat.id}-${item.id}-${rIdx}`}
                    onClick={() => onNavigateToItem(item)}
                    className="w-full p-6 bg-paper rounded-[24px] border border-olive/10 flex items-center justify-between group hover:bg-olive/5 transition-all"
                  >
                    <div className="text-left">
                      <h4 className="serif text-xl text-olive">{item.title}</h4>
                    </div>
                    <ChevronRight className="text-olive/20 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0">
          <BookOpen size={24} />
        </div>
        <div>
          <h2 className="serif text-2xl font-semibold text-olive">{t('ziyarats')}</h2>
          <p className="text-xs text-olive/60 uppercase tracking-widest font-bold">Salutations & Visitations</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-olive/40" size={18} />
        <input
          type="text"
          placeholder="Search ziyarats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-paper rounded-2xl p-3 pl-12 border border-olive/10 focus:outline-none focus:ring-2 focus:ring-gold/20 text-olive placeholder:text-olive/40"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
        {categories.map(category => (
          <button
            key={`ziyarat-cat-${category}`}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
              selectedCategory === category 
                ? "bg-olive text-paper" 
                : "bg-paper text-olive/60 border border-olive/10 hover:bg-olive/5"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredZiyarats.map(ziyarat => (
          <button
            key={`ziyarat-item-${ziyarat.id}`}
            onClick={() => onSelectZiyarat(ziyarat)}
            className="w-full text-left bg-paper p-5 rounded-[28px] border border-olive/5 shadow-sm hover:shadow-md hover:bg-olive/5 transition-all flex justify-between items-center group"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] uppercase tracking-widest text-gold font-bold">{ziyarat.category}</p>
                {ziyarat.audioUrl && <Volume2 size={10} className="text-gold" />}
              </div>
              <h3 className="serif text-xl text-olive group-hover:text-gold transition-colors">{ziyarat.title}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-warm-bg flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-paper transition-all">
              <ChevronRight size={20} />
            </div>
          </button>
        ))}
        {filteredZiyarats.length === 0 && (
          <div className="text-center py-20 text-olive/40">
            <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p>No ziyarats found.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function JournalView({ 
  settings, 
  goBack,
  entries,
  onSaveEntries
}: { 
  settings: PrayerSettings, 
  goBack: () => void,
  entries: JournalEntry[],
  onSaveEntries: (entries: JournalEntry[]) => void
}) {
  const t = useTranslation(settings.language);
  const [showBin, setShowBin] = useState(false);
  const [newEntry, setNewEntry] = useState('');

  const saveEntries = onSaveEntries;

  const saveEntry = () => {
    if (!newEntry.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: newEntry.trim()
    };
    const updatedEntries = [entry, ...entries].slice(0, 100);
    saveEntries(updatedEntries);
    setNewEntry('');
  };

  const deleteEntry = (id: string) => {
    const updatedEntries = entries.map(e => e.id === id ? { ...e, deletedAt: new Date().toISOString() } : e);
    saveEntries(updatedEntries);
  };

  const restoreEntry = (id: string) => {
    const updatedEntries = entries.map(e => e.id === id ? { ...e, deletedAt: undefined } : e);
    saveEntries(updatedEntries);
  };

  const permanentlyDelete = (id: string) => {
    const updatedEntries = entries.filter(e => e.id !== id);
    saveEntries(updatedEntries);
  };

  const activeEntries = entries.filter(e => !e.deletedAt);
  const binEntries = entries.filter(e => !!e.deletedAt);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0">
            <PenTool size={24} />
          </div>
          <div>
            <h2 className="serif text-2xl font-semibold text-olive">{t('journal')}</h2>
            <p className="text-xs text-olive/60 uppercase tracking-widest font-bold">
              {showBin ? 'Recently Deleted' : 'Write your journey'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowBin(!showBin)}
          className={cn(
            "p-3 rounded-full transition-all",
            showBin ? "bg-gold text-paper shadow-lg" : "bg-paper text-olive/40 hover:text-gold"
          )}
          title={showBin ? "View Entries" : "View Bin"}
        >
          {showBin ? <List size={20} /> : <History size={20} />}
        </button>
      </div>

      {!showBin && (
        <div className="bg-paper rounded-[24px] p-5 shadow-sm border border-olive/5 space-y-4">
          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="What's on your mind today?"
            className="w-full bg-warm-bg/50 rounded-xl p-4 border border-olive/10 focus:outline-none focus:ring-2 focus:ring-gold/20 text-olive placeholder:text-olive/40 min-h-[120px] resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-olive/40">{activeEntries.length}/100 entries</span>
            <button
              onClick={saveEntry}
              disabled={!newEntry.trim()}
              className="px-6 py-2 bg-olive text-paper rounded-full font-bold uppercase tracking-widest text-xs disabled:opacity-50 transition-opacity"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {showBin && binEntries.length > 0 && (
        <div className="bg-gold/5 border border-gold/10 rounded-2xl p-4 text-[10px] text-gold/80 flex items-center gap-3 mb-4">
          <Clock size={14} className="shrink-0" />
          <p className="font-bold uppercase tracking-wider leading-relaxed">
            Entries in bin will be permanently deleted after 30 days. You can restore them anytime before that.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {(showBin ? binEntries : activeEntries).map(entry => (
          <div key={entry.id} className="bg-paper rounded-[24px] p-5 shadow-sm border border-olive/5 space-y-3 relative group">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-gold font-bold">
                  {format(new Date(entry.date), 'MMM d, yyyy • h:mm a')}
                </span>
                {entry.deletedAt && (
                  <span className="text-[8px] text-gold/60 font-medium uppercase tracking-[0.1em]">
                    Removes in {Math.max(0, 30 - Math.floor((new Date().getTime() - new Date(entry.deletedAt).getTime()) / (24 * 60 * 60 * 1000)))} days
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                {showBin ? (
                  <>
                    <button
                      onClick={() => restoreEntry(entry.id)}
                      className="p-2 bg-olive/5 text-olive/40 hover:text-olive hover:bg-olive/10 rounded-xl transition-all"
                      title="Restore entry"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => permanentlyDelete(entry.id)}
                      className="p-2 bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 rounded-xl transition-all"
                      title="Delete permanently"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-olive/20 hover:text-red-500 transition-colors p-1"
                    title="Move to bin"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-olive/80 whitespace-pre-wrap text-sm leading-relaxed">
              {entry.content}
            </p>
          </div>
        ))}
        
        {((!showBin && activeEntries.length === 0) || (showBin && binEntries.length === 0)) && (
          <div className="text-center py-10 text-olive/40">
            {showBin ? (
              <>
                <History size={48} className="mx-auto mb-4 opacity-10" />
                <p>Bin is empty.</p>
              </>
            ) : (
              <>
                <PenTool size={48} className="mx-auto mb-4 opacity-20" />
                <p>Your journal is empty.</p>
                <p className="text-xs mt-1">Start writing your journey above.</p>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SalawaatView({ settings, onBack, selectedSalawat, onSelectSalawat }: { 
  settings: PrayerSettings, 
  onBack: () => void,
  selectedSalawat: any,
  onSelectSalawat: (salawat: any) => void
}) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const t = useTranslation(settings.language);
  const { currentTrack, isPlaying, togglePlay, playTrack } = useAudio();

  const fridayItems = SALAWAAT.filter(item => item.groupId === 'friday-collection');
  const regularSalawaat = SALAWAAT.filter(item => item.groupId !== 'friday-collection');

  const handleToggleAudio = (item: any) => {
    if (!item.audioUrl) return;
    if (currentTrack?.id === item.id) {
      togglePlay();
    } else {
      playTrack({
        id: item.id,
        title: item.title,
        url: item.audioUrl,
        category: 'Salawaats'
      });
    }
  };

  const renderSalawatDetail = (item: any, isInsideCollection = false) => {
    const isCurrentlyPlaying = currentTrack?.id === item.id && isPlaying;

    return (
      <div className={cn("space-y-8 pb-32", !isInsideCollection && "p-6")}>
        {!isInsideCollection && (
          <div className="flex justify-between items-start">
            <button 
              onClick={() => onSelectSalawat(null)}
              className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2"
            >
              <ChevronLeft size={16} /> {t('back')}
            </button>
            {item.audioUrl && (
              <button
                onClick={() => handleToggleAudio(item)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
                  isCurrentlyPlaying ? "bg-gold text-paper animate-pulse" : "bg-olive text-paper hover:bg-gold"
                )}
              >
                {isCurrentlyPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1 text-center">
            <h2 className="serif text-3xl text-olive">{item.title}</h2>
            <p className="text-sm text-olive/70 italic leading-relaxed max-w-xs mx-auto">{item.description}</p>
            {isInsideCollection && item.audioUrl && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => handleToggleAudio(item)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-2 rounded-full transition-all shadow-sm",
                    isCurrentlyPlaying ? "bg-gold text-paper animate-pulse" : "bg-olive/10 text-olive hover:bg-olive hover:text-paper"
                  )}
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <Pause size={16} fill="currentColor" />
                      <span className="text-xs font-bold uppercase tracking-widest">Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                      <span className="text-xs font-bold uppercase tracking-widest">Listen Audio</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-paper rounded-[40px] p-8 border border-olive/10 shadow-sm space-y-12">
          {item.lines.map((line: any, idx: number) => (
            <div key={idx} className="space-y-6 text-center group">
              <p 
                className={cn(getFontSize('text-3xl', settings.arabicFontSize), "leading-[2.5] text-olive font-arabic transition-all")} 
                dir="rtl"
                style={{ 
                  fontFamily: `"${settings.arabicFont || 'Amiri Quran'}", serif`
                }}
              >
                {line.arabic}
              </p>
              <div className="space-y-3">
                {line.transliteration && (
                  <p className="text-[10px] text-gold font-bold uppercase tracking-widest opacity-60 leading-relaxed px-4">
                    {line.transliteration}
                  </p>
                )}
                {line.english && (
                  <p className="text-base text-olive/90 font-medium px-4 leading-relaxed serif italic">
                    {line.english}
                  </p>
                )}
              </div>
              {idx < item.lines.length - 1 && (
                <div className="flex justify-center items-center gap-4 py-4">
                  <div className="h-[1px] w-12 bg-olive/5" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gold/30" />
                  <div className="h-[1px] w-12 bg-olive/5" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-olive/5 rounded-full border border-olive/10">
            <Heart size={16} className="text-gold" />
            <span className="text-xs text-olive/60 font-medium tracking-wide">Blessings recorded upon recitation</span>
          </div>
        </div>
      </div>
    );
  };

  if (selectedSalawat === 'friday-collection') {
    const activeItem = fridayItems.find(item => item.id === activeTab) || fridayItems[0];

    return (
      <div className="flex flex-col min-h-screen">
        <div className="p-6 pb-2 sticky top-0 bg-paper/95 backdrop-blur-sm z-20">
          <button 
            onClick={() => onSelectSalawat(null)}
            className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4"
          >
            <ChevronLeft size={16} /> {t('back')}
          </button>
          <div className="space-y-1 mb-6">
            <h2 className="serif text-3xl text-olive">Friday Salawaats & Ziyarats</h2>
            <p className="text-[10px] text-gold font-bold uppercase tracking-widest">Special Rites for Friday</p>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
            {fridayItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border",
                  activeTab === item.id || (!activeTab && item.id === fridayItems[0].id)
                    ? "bg-gold border-gold text-paper shadow-md" 
                    : "bg-olive/5 border-olive/10 text-olive/60 hover:bg-olive/10"
                )}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 flex-1">
          {renderSalawatDetail(activeItem, true)}
        </div>
      </div>
    );
  }

  if (selectedSalawat) {
    return renderSalawatDetail(selectedSalawat);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-8 pb-32"
    >
      <div className="flex flex-col gap-2">
        <button 
          onClick={onBack}
          className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2"
        >
          <ChevronLeft size={16} /> {t('back')}
        </button>
        <h2 className="serif text-4xl text-olive tracking-tight">{t('salawaat')}</h2>
        <p className="text-xs text-gold uppercase tracking-widest font-bold opacity-80">Blessings upon the Prophet & his Pure Family</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Friday Collection Card */}
        {fridayItems.length > 0 && (
          <button
            onClick={() => {
              onSelectSalawat('friday-collection');
              setActiveTab(fridayItems[0].id);
            }}
            className="w-full text-left bg-olive p-6 rounded-[32px] shadow-lg hover:shadow-xl transition-all flex justify-between items-center group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform" />
            <div className="relative z-10 text-left">
              <p className="text-[10px] uppercase tracking-widest text-gold font-bold mb-1">Weekly Ritual</p>
              <h3 className="serif text-2xl text-paper">Friday Salawaats & Ziyarats</h3>
              <p className="text-xs text-paper/60 mt-1">Complete collection from Duas.org</p>
              <div className="flex gap-2 mt-4">
                <span className="bg-gold/20 text-gold text-[8px] uppercase tracking-tighter px-2 py-0.5 rounded-full border border-gold/30">6 RITES</span>
                <span className="bg-gold/20 text-gold text-[8px] uppercase tracking-tighter px-2 py-0.5 rounded-full border border-gold/30">AUDIO INCLUDED</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-paper/10 flex items-center justify-center text-paper relative z-10">
              <ChevronRight size={24} />
            </div>
          </button>
        )}

        {regularSalawaat.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectSalawat(item)}
            className="w-full text-left bg-paper p-5 rounded-[28px] border border-olive/5 shadow-sm hover:shadow-md hover:bg-olive/5 transition-all flex justify-between items-center group"
          >
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] uppercase tracking-widest text-gold font-bold">{t('salawaat')}</p>
                {item.audioUrl && <Volume2 size={10} className="text-gold" />}
              </div>
              <h3 className="serif text-xl text-olive group-hover:text-gold transition-colors">{item.title}</h3>
              {item.description && <p className="text-xs text-olive/60 mt-1 line-clamp-1">{item.description}</p>}
            </div>
            <div className="w-10 h-10 rounded-full bg-olive/5 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-paper transition-all">
              <ChevronRight size={20} />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 bg-paper p-8 rounded-[40px] border border-olive/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-gold/50" />
        <div className="space-y-4">
          <Heart className="text-gold opacity-30" size={32} />
          <h4 className="serif text-xl text-olive">The Virtue of Salawat</h4>
          <p className="text-sm text-olive/80 leading-relaxed italic">
            "The most weightiest thing that will be placed on the scale on the Day of Resurrection is the sending of blessings upon Muhammad and his Household."
          </p>
          <div className="flex justify-between items-center pt-2">
            <div className="h-[1px] flex-1 bg-olive/10 mr-4" />
            <p className="text-[10px] uppercase tracking-widest text-gold font-bold whitespace-nowrap">
              — Imam al-Sadiq (as)
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
