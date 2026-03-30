import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, 
  Sun, 
  Book, 
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
  Search,
  Menu,
  X,
  Settings,
  Bell,
  BellOff,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from './lib/utils';
import { getDailyHadith, askReligiousQuestion } from './services/geminiService';
import { getPrayerTimes, CALCULATION_METHODS, geocodeLocation } from './services/prayerService';
import { DUAS, EVENTS } from './constants';
import { Hadith, PrayerTime, Dua, IslamicEvent, PrayerSettings, PrayerReminder } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'duas' | 'calendar' | 'qa' | 'settings' | 'tasbih' | 'qibla' | 'quran'>('home');
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Prayer related state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [prayerSettings, setPrayerSettings] = useState<PrayerSettings>({
    method: 'Tehran',
    madhab: 'Shafi',
    highLatitudeRule: 'MiddleOfTheNight'
  });
  const [reminders, setReminders] = useState<PrayerReminder[]>([
    { id: 'fajr', enabled: false },
    { id: 'dhuhr', enabled: false },
    { id: 'asr', enabled: false },
    { id: 'maghrib', enabled: false },
    { id: 'isha', enabled: false },
  ]);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    getDailyHadith().then(setHadith);
    
    // Request notification permission
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (prayerSettings.manualLocation?.lat && prayerSettings.manualLocation?.lng) {
      setLocation({
        lat: prayerSettings.manualLocation.lat,
        lng: prayerSettings.manualLocation.lng
      });
      setLocationError(null);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
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
      setPrayerTimes(times);
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
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const tabs = [
    { id: 'home', label: 'Home', icon: Moon },
    { id: 'quran', label: 'Quran', icon: Book },
    { id: 'duas', label: 'Duas', icon: Compass }, // Changed icon to Compass for Duas to free up Book for Quran
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'qa', label: 'Ask AI', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-warm-bg shadow-xl">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-olive/10 bg-paper/50 backdrop-blur-md sticky top-0 z-50">
        <div onClick={() => setActiveTab('home')} className="cursor-pointer">
          <h1 className="serif text-3xl font-semibold text-olive tracking-tight">Noor</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">Shia Companion</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "p-2 rounded-full transition-colors",
              activeTab === 'settings' ? "bg-olive/10 text-gold" : "hover:bg-olive/5 text-olive"
            )}
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-olive/5 transition-colors text-olive"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-warm-bg z-40 pt-24 px-8"
          >
            <nav className="flex flex-col gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "serif text-4xl text-left transition-all",
                    activeTab === tab.id ? "text-olive font-bold" : "text-olive/40"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <HomeView 
              hadith={hadith} 
              prayerTimes={prayerTimes} 
              reminders={reminders} 
              onToggleReminder={toggleReminder}
              locationError={locationError}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'duas' && <DuasView />}
          {activeTab === 'quran' && <QuranView />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'qa' && <QAView />}
          {activeTab === 'settings' && (
            <SettingsView 
              settings={prayerSettings} 
              onUpdateSettings={setPrayerSettings} 
            />
          )}
          {activeTab === 'tasbih' && <TasbihView onBack={() => setActiveTab('home')} />}
          {activeTab === 'qibla' && <QiblaView onBack={() => setActiveTab('home')} />}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-paper/80 backdrop-blur-lg border-t border-olive/10 px-6 py-4 flex justify-between items-center z-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                isActive ? "text-gold" : "text-olive/40"
              )}
            >
              <Icon size={isActive ? 24 : 20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="w-1 h-1 rounded-full bg-gold mt-0.5"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

interface HomeViewProps {
  hadith: Hadith | null;
  prayerTimes: PrayerTime[];
  reminders: PrayerReminder[];
  onToggleReminder: (id: string) => void;
  locationError: string | null;
  onNavigate: (tab: 'tasbih' | 'qibla') => void;
}

function HomeView({ hadith, prayerTimes, reminders, onToggleReminder, locationError, onNavigate }: HomeViewProps) {
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const upcoming = prayerTimes
        .filter(pt => pt.id !== 'sunrise')
        .map(pt => {
          const [h, m] = pt.time.split(':').map(Number);
          let ptMinutes = h * 60 + m;
          if (ptMinutes <= nowMinutes) ptMinutes += 24 * 60; // Next day
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
      {/* Date & Location */}
      <section className="text-center space-y-1">
        <h2 className="serif text-2xl text-olive">{format(new Date(), 'EEEE, MMMM do')}</h2>
        <p className="text-xs uppercase tracking-widest text-gold font-medium">10th Ramadan 1447 AH</p>
        {locationError && (
          <div className="flex items-center justify-center gap-1 text-[10px] text-red-500/70 font-medium">
            <MapPin size={10} />
            <span>{locationError}</span>
          </div>
        )}
      </section>

      {/* Next Prayer Countdown */}
      {nextPrayer && (
        <section className="bg-olive text-paper rounded-[32px] p-8 shadow-lg text-center space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">Next Prayer: {nextPrayer.name}</p>
          <h3 className="serif text-5xl font-bold">{countdown}</h3>
          <p className="text-sm opacity-80">until {nextPrayer.time}</p>
        </section>
      )}

      {/* Prayer Times Card */}
      <section className="bg-paper rounded-[32px] p-8 shadow-sm border border-olive/5 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="serif text-xl text-olive">Prayer Times</h3>
          <span className="text-[10px] uppercase tracking-widest text-gold font-bold">Jafari Method</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {prayerTimes.length > 0 ? (
            prayerTimes.map((pt) => {
              const reminder = reminders.find(r => r.id === pt.id);
              const isReminderEnabled = reminder?.enabled;
              
              return (
                <div key={pt.id} className="flex justify-between items-center p-4 rounded-2xl bg-warm-bg/50 border border-olive/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-olive/5 flex items-center justify-center text-gold">
                      {pt.icon === 'Sun' ? <Sun size={16} /> : <Moon size={16} />}
                    </div>
                    <span className="text-sm font-bold text-olive">{pt.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-olive">{pt.time}</span>
                    {pt.id !== 'sunrise' && (
                      <button 
                        onClick={() => onToggleReminder(pt.id)}
                        className={cn(
                          "p-2 rounded-full transition-all",
                          isReminderEnabled ? "bg-gold/10 text-gold" : "bg-olive/5 text-olive/30"
                        )}
                      >
                        {isReminderEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-16 bg-warm-bg/50 rounded-2xl border border-olive/5" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Daily Hadith */}
      <section className="space-y-4">
        <h3 className="serif text-xl text-olive px-2">Daily Wisdom</h3>
        <div className="bg-olive text-paper rounded-[32px] p-8 shadow-lg relative overflow-hidden">
          <Moon className="absolute -right-4 -top-4 text-paper/10" size={120} />
          <div className="relative z-10 space-y-6">
            {hadith ? (
              <>
                <p className="text-xl leading-relaxed text-right font-arabic" dir="rtl">
                  {hadith.arabic}
                </p>
                <p className="serif text-lg italic opacity-90 leading-relaxed">
                  "{hadith.english}"
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">
                  — {hadith.source}
                </p>
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

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate('qibla')}
          className="p-6 bg-paper rounded-[24px] border border-olive/5 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all group"
        >
          <Compass className="text-gold group-hover:scale-110 transition-transform" size={32} />
          <span className="text-xs font-bold uppercase tracking-widest text-olive">Qibla Finder</span>
        </button>
        <button 
          onClick={() => onNavigate('tasbih')}
          className="p-6 bg-paper rounded-[24px] border border-olive/5 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all group"
        >
          <Clock className="text-gold group-hover:scale-110 transition-transform" size={32} />
          <span className="text-xs font-bold uppercase tracking-widest text-olive">Tasbih Counter</span>
        </button>
      </section>
    </motion.div>
  );
}

function SettingsView({ settings, onUpdateSettings }: { settings: PrayerSettings, onUpdateSettings: (s: PrayerSettings) => void }) {
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

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 space-y-8"
    >
      <h2 className="serif text-3xl text-olive">Settings</h2>
      
      <div className="space-y-6">
        {/* Manual Location */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-gold font-bold">Manual Location</h3>
          <div className="bg-paper rounded-[24px] p-6 border border-olive/10 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-olive/60 font-bold">City</label>
              <input 
                type="text" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. London"
                className="w-full bg-warm-bg/50 rounded-xl p-3 border border-olive/5 focus:outline-none focus:ring-2 focus:ring-gold/20 text-olive"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-olive/60 font-bold">Country</label>
              <input 
                type="text" 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United Kingdom"
                className="w-full bg-warm-bg/50 rounded-xl p-3 border border-olive/5 focus:outline-none focus:ring-2 focus:ring-gold/20 text-olive"
              />
            </div>
            {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}
            <div className="flex gap-2">
              <button 
                onClick={handleSetManualLocation}
                disabled={isGeocoding}
                className="flex-1 bg-olive text-paper rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-olive/90 transition-all disabled:opacity-50"
              >
                {isGeocoding ? "Searching..." : "Set Location"}
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
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-gold font-bold">Calculation Method</h3>
          <div className="grid grid-cols-1 gap-2">
            {CALCULATION_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => onUpdateSettings({ ...settings, method: method.id as any })}
                className={cn(
                  "w-full p-4 rounded-2xl border text-left transition-all",
                  settings.method === method.id 
                    ? "bg-olive text-paper border-olive shadow-md" 
                    : "bg-paper text-olive border-olive/10 hover:bg-olive/5"
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{method.name}</span>
                  {settings.method === method.id && <div className="w-2 h-2 rounded-full bg-gold" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-gold font-bold">High Latitude Rule</h3>
          <div className="grid grid-cols-1 gap-2">
            {(['MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle'] as const).map((rule) => (
              <button
                key={rule}
                onClick={() => onUpdateSettings({ ...settings, highLatitudeRule: rule })}
                className={cn(
                  "w-full p-4 rounded-2xl border text-left transition-all",
                  settings.highLatitudeRule === rule 
                    ? "bg-olive text-paper border-olive shadow-md" 
                    : "bg-paper text-olive border-olive/10 hover:bg-olive/5"
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{rule.replace(/([A-Z])/g, ' $1').trim()}</span>
                  {settings.highLatitudeRule === rule && <div className="w-2 h-2 rounded-full bg-gold" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-olive/5 rounded-[24px] border border-olive/10">
        <p className="text-xs text-olive/60 leading-relaxed italic">
          Note: The Tehran method is the standard Shia calculation method. Maghrib is calculated as the time when the redness in the eastern sky disappears after sunset.
        </p>
      </div>
    </motion.div>
  );
}

function DuasView() {
  const [selectedDua, setSelectedDua] = useState<Dua | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      <h2 className="serif text-3xl text-olive">Supplications</h2>
      
      {selectedDua ? (
        <div className="space-y-8 pb-12">
          <button 
            onClick={() => setSelectedDua(null)}
            className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          >
            ← Back to List
          </button>
          <div className="space-y-6">
            <h3 className="serif text-4xl text-olive">{selectedDua.title}</h3>
            <div className="bg-paper rounded-[32px] p-8 shadow-sm border border-olive/5 space-y-8">
              <p className="text-2xl leading-[2] text-right font-arabic text-olive" dir="rtl">
                {selectedDua.arabic}
              </p>
              <div className="h-px bg-olive/10" />
              <p className="serif text-lg leading-relaxed text-olive/80">
                {selectedDua.translation}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {DUAS.map((dua) => (
            <button
              key={dua.id}
              onClick={() => setSelectedDua(dua)}
              className="w-full bg-paper p-6 rounded-[24px] border border-olive/5 flex justify-between items-center hover:bg-olive/5 transition-colors group"
            >
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-widest text-gold font-bold mb-1">{dua.category}</p>
                <h4 className="serif text-xl text-olive">{dua.title}</h4>
              </div>
              <ChevronRight className="text-gold group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CalendarView() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-8"
    >
      <h2 className="serif text-3xl text-olive">Islamic Calendar</h2>
      
      <div className="space-y-6">
        {EVENTS.map((event, idx) => (
          <div key={idx} className="relative pl-8 border-l border-olive/10 pb-8 last:pb-0">
            <div className={cn(
              "absolute -left-[5px] top-0 w-[9px] h-[9px] rounded-full",
              event.type === 'Wiladat' ? "bg-gold" : event.type === 'Shahadat' ? "bg-olive" : "bg-olive/20"
            )} />
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-gold font-bold">
                {format(new Date(event.date), 'MMMM do, yyyy')}
              </p>
              <h4 className="serif text-2xl text-olive leading-tight">{event.title}</h4>
              <p className="text-sm text-olive/60 leading-relaxed">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function QAView() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    try {
      const res = await askReligiousQuestion(question);
      setAnswer(res);
    } catch (e) {
      setAnswer("I'm sorry, I couldn't process your request at the moment. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-8"
    >
      <div className="space-y-2">
        <h2 className="serif text-3xl text-olive">Ask AI</h2>
        <p className="text-sm text-olive/60">Ask questions about Shia jurisprudence, history, or traditions.</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What are the virtues of fasting in Ramadan?"
            className="w-full bg-paper rounded-[24px] p-6 pr-12 border border-olive/10 focus:outline-none focus:ring-2 focus:ring-gold/20 min-h-[120px] text-olive placeholder:text-olive/30"
          />
          <button 
            onClick={handleAsk}
            disabled={isLoading || !question.trim()}
            className="absolute bottom-4 right-4 p-3 bg-olive text-paper rounded-full hover:bg-olive/90 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-paper/30 border-t-paper rounded-full animate-spin" />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>

        {answer && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-paper rounded-[32px] p-8 border border-olive/5 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold font-bold">
              <MessageSquare size={12} />
              <span>AI Response</span>
            </div>
            <div className="serif text-lg text-olive/90 leading-relaxed whitespace-pre-wrap">
              {answer}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function TasbihView({ onBack }: { onBack: () => void }) {
  const [count, setCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const tasbihs = [
    { name: 'SubhanAllah', target: 33 },
    { name: 'Alhamdulillah', target: 33 },
    { name: 'Allahu Akbar', target: 34 },
  ];

  const currentTasbih = tasbihs[cycle % 3];

  const handleIncrement = () => {
    if (count + 1 >= currentTasbih.target) {
      setCount(0);
      setCycle(prev => prev + 1);
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate(100);
    } else {
      setCount(prev => prev + 1);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const handleReset = () => {
    setCount(0);
    setCycle(0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 h-full flex flex-col items-center justify-center space-y-12"
    >
      <div className="text-center space-y-2">
        <button 
          onClick={onBack}
          className="text-gold text-[10px] uppercase tracking-widest font-bold mb-4"
        >
          ← Back to Home
        </button>
        <h2 className="serif text-4xl text-olive">{currentTasbih.name}</h2>
        <p className="text-sm text-olive/60">Cycle {Math.floor(cycle / 3) + 1}</p>
      </div>

      <button 
        onClick={handleIncrement}
        className="w-64 h-64 rounded-full bg-paper border-8 border-olive/5 shadow-2xl flex items-center justify-center active:scale-95 transition-transform relative group"
      >
        <div className="absolute inset-4 rounded-full border border-gold/20 group-active:border-gold/40 transition-colors" />
        <span className="serif text-8xl text-olive font-bold">{count}</span>
        <div className="absolute bottom-12 text-[10px] uppercase tracking-widest text-gold font-bold">Tap to Count</div>
      </button>

      <div className="flex gap-4">
        <button 
          onClick={handleReset}
          className="p-4 bg-paper rounded-full border border-olive/10 text-olive hover:bg-olive/5 transition-colors"
        >
          <RefreshCw size={24} />
        </button>
      </div>
    </motion.div>
  );
}

function QuranView() {
  const [surahs, setSurahs] = useState<any[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<any | null>(null);
  const [verses, setVerses] = useState<any[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [readingMode, setReadingMode] = useState<'both' | 'arabic' | 'translation'>('both');
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isPlayingSurah, setIsPlayingSurah] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audio] = useState(() => new Audio());

  useEffect(() => {
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlayingSurah(false);
      setCurrentTime(0);
    };
    const handleError = (e: any) => {
      console.error("Audio playback error:", e);
      setIsPlayingSurah(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [audio]);

  const togglePlaySurah = async (surahNumber: number) => {
    if (isPlayingSurah) {
      audio.pause();
      setIsPlayingSurah(false);
    } else {
      try {
        // Using the reliable Islamic Network CDN for full surah audio
        const newSrc = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;
        if (audio.src !== newSrc) {
          audio.src = newSrc;
          setCurrentTime(0);
        }
        setIsPlayingSurah(true);
        await audio.play();
      } catch (error) {
        console.error("Failed to play audio:", error);
        setIsPlayingSurah(false);
      }
    }
  };

  const seekAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const savedBookmarks = localStorage.getItem('quran_bookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }

    const fetchSurahs = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        setSurahs(data.data);
      } catch (e) {
        console.error("Error fetching surahs:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurahs();
  }, []);

  const toggleBookmark = (ayah: any) => {
    const isBookmarked = bookmarks.some(b => b.number === ayah.number);
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter(b => b.number !== ayah.number);
    } else {
      const bookmarkData = {
        ...ayah,
        surahName: selectedSurah.englishName,
        surahNumber: selectedSurah.number,
        translation: translations.find(t => t.numberInSurah === ayah.numberInSurah)?.text
      };
      newBookmarks = [...bookmarks, bookmarkData];
    }
    setBookmarks(newBookmarks);
    localStorage.setItem('quran_bookmarks', JSON.stringify(newBookmarks));
  };

  const fetchSurahDetails = async (number: number, lang: 'en' | 'ur' = language) => {
    setIsLoading(true);
    try {
      // Fetch Arabic verses
      const resArabic = await fetch(`https://api.alquran.cloud/v1/surah/${number}`);
      const dataArabic = await resArabic.json();
      setVerses(dataArabic.data.ayahs);

      // Fetch translation
      const edition = lang === 'en' ? 'en.sahih' : 'ur.ahmedali';
      const resTrans = await fetch(`https://api.alquran.cloud/v1/surah/${number}/${edition}`);
      const dataTrans = await resTrans.json();
      setTranslations(dataTrans.data.ayahs);
      
      setSelectedSurah(dataArabic.data);
    } catch (e) {
      console.error("Error fetching surah details:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSurah) {
      fetchSurahDetails(selectedSurah.number, language);
    }
  }, [language]);

  const filteredSurahs = surahs.filter(s => 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.includes(searchQuery) ||
    s.number.toString() === searchQuery
  );

  if (selectedSurah) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 bg-paper z-50 overflow-y-auto pb-32"
      >
        {/* Header */}
        <div className="sticky top-0 bg-paper/80 backdrop-blur-md border-b border-olive/5 p-4 flex justify-between items-center z-40">
          <button 
            onClick={() => setSelectedSurah(null)}
            className="p-2 hover:bg-olive/5 rounded-full transition-all"
          >
            <ChevronLeft size={24} className="text-olive" />
          </button>
          
          <div className="text-center">
            <h2 className="serif text-xl text-olive">{selectedSurah.englishName}</h2>
            <p className="text-[10px] uppercase tracking-widest text-gold font-bold">{selectedSurah.englishNameTranslation}</p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setReadingMode(prev => prev === 'both' ? 'arabic' : prev === 'arabic' ? 'translation' : 'both')}
              className="p-2 hover:bg-olive/5 rounded-full transition-all text-olive/60"
              title="Toggle Reading Mode"
            >
              <Book size={20} />
            </button>
            <div className="flex bg-olive/5 rounded-full p-1">
              <button 
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all",
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
                onClick={() => togglePlaySurah(selectedSurah.number)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gold text-paper rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-gold/30"
              >
                {isPlayingSurah ? <Pause size={20} /> : <Volume2 size={20} />}
                {isPlayingSurah ? "Pause Recitation" : "Play Full Surah"}
              </button>
              <p className="text-[10px] opacity-40 mt-3 italic">Recited by Mishary Rashid Alafasy</p>
            </div>
          </div>

          {/* Bismillah */}
          {selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
            <div className="text-center py-8">
              <p className="text-4xl font-arabic text-olive opacity-80">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              <p className="text-xs text-gold mt-2 uppercase tracking-widest font-bold">In the name of Allah, the Entirely Merciful, the Especially Merciful</p>
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
                <div key={ayah.number} className="space-y-6 group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full border border-gold/20 text-gold flex items-center justify-center text-xs font-bold">
                        {ayah.numberInSurah}
                      </span>
                      <button 
                        onClick={() => toggleBookmark(ayah)}
                        className={cn(
                          "p-2 rounded-full transition-all",
                          bookmarks.some(b => b.number === ayah.number) ? "text-gold bg-gold/10" : "text-olive/10 hover:text-gold hover:bg-gold/5"
                        )}
                      >
                        <Bookmark size={18} fill={bookmarks.some(b => b.number === ayah.number) ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <div className="h-px flex-1 bg-olive/5 mx-4" />
                  </div>

                  <div className="space-y-6">
                    {(readingMode === 'both' || readingMode === 'arabic') && (
                      <p className="text-3xl leading-[2.5] text-right font-arabic text-olive" dir="rtl">
                        {ayah.text}
                      </p>
                    )}
                    
                    {(readingMode === 'both' || readingMode === 'translation') && (
                      <div className="bg-paper/50 p-6 rounded-[32px] border border-olive/5">
                        <p className={cn(
                          "serif text-lg text-olive/80 leading-relaxed",
                          language === 'ur' && "font-arabic text-right text-2xl"
                        )} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                          {translations[idx]?.text}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Audio Player */}
        <AnimatePresence>
          {isPlayingSurah && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-6 left-4 right-4 bg-olive text-paper p-4 rounded-[32px] shadow-2xl z-50 flex flex-col gap-3 border border-paper/10"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                    <Volume2 size={24} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gold">Now Playing</p>
                    <p className="serif text-base">{selectedSurah.englishName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => togglePlaySurah(selectedSurah.number)}
                  className="w-12 h-12 bg-paper/10 rounded-full flex items-center justify-center hover:bg-paper/20 transition-all"
                >
                  <Pause size={24} />
                </button>
              </div>
              
              <div className="space-y-1 px-2">
                <input 
                  type="range"
                  min="0"
                  max={duration && isFinite(duration) ? duration : 100}
                  value={currentTime || 0}
                  onChange={seekAudio}
                  className="w-full h-2 bg-paper/20 rounded-lg cursor-pointer accent-gold"
                />
                <div className="flex justify-between text-[10px] font-mono opacity-60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6 pb-24"
    >
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="serif text-3xl text-olive">The Noble Quran</h2>
          <p className="text-sm text-olive/60">Read and reflect upon the words of Allah.</p>
        </div>
        <div className="flex bg-paper rounded-full p-1 border border-olive/10">
          <button 
            onClick={() => setShowBookmarks(false)}
            className={cn(
              "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
              !showBookmarks ? "bg-olive text-paper" : "text-olive/40"
            )}
          >
            Surahs
          </button>
          <button 
            onClick={() => setShowBookmarks(true)}
            className={cn(
              "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
              showBookmarks ? "bg-olive text-paper" : "text-olive/40"
            )}
          >
            <Bookmark size={12} fill={showBookmarks ? "currentColor" : "none"} />
            Saved
          </button>
        </div>
      </div>

      {!showBookmarks ? (
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-olive/30" size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Surah by name or number..."
              className="w-full bg-paper rounded-full py-4 pl-12 pr-6 border border-olive/10 focus:outline-none focus:ring-2 focus:ring-gold/20 text-olive placeholder:text-olive/30"
            />
          </div>

          {isLoading && surahs.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredSurahs.map((surah) => (
                <button
                  key={surah.number}
                  onClick={() => fetchSurahDetails(surah.number)}
                  className="flex items-center justify-between p-5 bg-paper rounded-[24px] border border-olive/5 hover:bg-olive/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center text-xs font-bold">
                      {surah.number}
                    </span>
                    <div className="text-left">
                      <h4 className="serif text-xl text-olive">{surah.englishName}</h4>
                      <p className="text-[10px] uppercase tracking-widest text-gold font-bold">{surah.englishNameTranslation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-arabic text-lg text-olive">{surah.name}</p>
                    <p className="text-[10px] text-olive/40">{surah.numberOfAyahs} Verses</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {bookmarks.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 bg-olive/5 rounded-full flex items-center justify-center mx-auto">
                <Bookmark size={32} className="text-olive/20" />
              </div>
              <p className="text-olive/40 text-sm italic">No bookmarked verses yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.number} className="space-y-4 bg-paper/50 p-6 rounded-[32px] border border-olive/5 relative">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-center">
                        <span className="block text-[10px] font-bold text-gold uppercase tracking-widest mb-1">
                          {bookmark.surahName}
                        </span>
                        <span className="w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center text-[10px] font-bold shrink-0 mx-auto">
                          {bookmark.numberInSurah}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleBookmark(bookmark)}
                          className="p-2 rounded-full text-gold bg-gold/10 transition-all"
                        >
                          <Bookmark size={16} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                    <p className="text-2xl leading-[2.5] text-right font-arabic text-olive" dir="rtl">
                      {bookmark.text}
                    </p>
                  </div>
                  <div className="h-px bg-olive/5" />
                  <p className="serif text-lg text-olive/80 leading-relaxed">
                    {bookmark.translation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function QiblaView({ onBack }: { onBack: () => void }) {
  const [heading, setHeading] = useState<number | null>(null);
  const [qiblaDir, setQiblaDir] = useState<number>(0);

  useEffect(() => {
    // Qibla calculation (approximate)
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const y = Math.sin(kaabaLng - longitude);
        const x = Math.cos(latitude) * Math.tan(kaabaLat) - Math.sin(latitude) * Math.cos(kaabaLng - longitude);
        const qibla = Math.atan2(y, x) * (180 / Math.PI);
        setQiblaDir(qibla);
      });
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const event = e as any;
      if (event.webkitCompassHeading) {
        setHeading(event.webkitCompassHeading);
      } else if (e.alpha) {
        setHeading(360 - e.alpha);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 h-full flex flex-col items-center justify-center space-y-12"
    >
      <div className="text-center space-y-2">
        <button 
          onClick={onBack}
          className="text-gold text-[10px] uppercase tracking-widest font-bold mb-4"
        >
          ← Back to Home
        </button>
        <h2 className="serif text-4xl text-olive">Qibla Finder</h2>
        <p className="text-sm text-olive/60">Point your phone towards the Kaaba</p>
      </div>

      <div className="relative w-64 h-64">
        <div className="absolute inset-0 rounded-full border-2 border-olive/10" />
        <div className="absolute inset-4 rounded-full border border-olive/5" />
        
        {/* Compass Ring */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: heading ? -heading : 0 }}
        >
          <div className="absolute top-2 text-[10px] font-bold text-olive/40">N</div>
          <div className="absolute bottom-2 text-[10px] font-bold text-olive/40">S</div>
          <div className="absolute left-2 text-[10px] font-bold text-olive/40">W</div>
          <div className="absolute right-2 text-[10px] font-bold text-olive/40">E</div>
        </motion.div>

        {/* Qibla Arrow */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: heading ? qiblaDir - heading : qiblaDir }}
        >
          <div className="w-1 h-32 bg-gold relative">
            <div className="absolute -top-2 -left-1.5 w-4 h-4 bg-gold rotate-45" />
          </div>
        </motion.div>
      </div>

      <div className="p-6 bg-paper rounded-[24px] border border-olive/10 text-center max-w-xs">
        <p className="text-xs text-olive/60 leading-relaxed italic">
          Note: For best results, keep your phone flat and away from magnetic objects.
        </p>
      </div>
    </motion.div>
  );
}
