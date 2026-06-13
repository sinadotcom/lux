import { useLux, type Lang } from './state/store.ts';

type Dict = Record<string, string>;

const EN: Dict = {
  'title.tag': 'A city is waiting in the dark',
  'title.sub': 'Reclaim the light',
  'title.begin': 'Begin restoration',
  'title.rules': 'How to play',

  'map.city': 'The city',
  'map.restored': 'restored',
  'map.streak': '{n}-day restoration streak',
  'map.daily': 'Daily city',
  'map.dailyDone': 'Daily city · restored',
  'map.archive': 'Archive',
  'map.rules': 'How to play',
  'map.prompt': 'Select a darkened district to begin its restoration',
  'map.whole': 'The city is whole — every district burns bright',

  'finale.kicker': 'Reclaimed',
  'finale.line':
    'The dark is gone from the map. Every district you touched is awake, and the light moves between them on its own now — the way it did before, the way it was always meant to.',
  'finale.stay': 'Stay with the light',

  'hud.daily': 'Daily city',
  'hud.district': 'District',
  'hud.power': 'Power',
  'hud.overload': 'Grid overload',
  'hud.undo': 'Undo',
  'hud.reset': 'Reset',
  'hud.survey': 'Survey',
  'hud.map': 'City map',

  'cine.restored': 'Power restored',
  'cine.last': 'The last district answers',
  'daily.epigraph': 'Today the grid asks for this district by name.',

  'done.memory': 'Memory recovered · {kind}',
  'done.daily': 'Daily city restored',
  'done.dailyStreak': 'The grid holds. {n} days of light, unbroken.',
  'done.dailyFirst': 'The grid holds. Come back tomorrow — another district will be waiting.',
  'done.dailyTitle': '{name} hums back to life',
  'done.flawless': 'Flawless restoration',
  'done.return': 'Return to the city',
  'done.grandKicker': 'The city is whole',
  'done.grandTitle': 'Every street is lit',
  'done.grandBody':
    'The last district answers the grid, and the dark that held the city for so long finally lets go. From the harbor to the hill, every window is warm. Step back and see what you brought back.',
  'done.grandBtn': 'See the city whole',

  'arch.kicker': 'Progress archive',
  'arch.title': 'Restoration records',
  'arch.map': 'City map',
  'arch.statDistricts': 'Districts restored',
  'arch.statCompletion': 'City completion',
  'arch.statPowered': 'Streets re-powered',
  'arch.statCores': 'Cores installed',
  'arch.statFlawless': 'Flawless restorations',
  'arch.statStreak': 'Daily streak',
  'arch.memories': 'Recovered memories',
  'arch.stillDark': 'Still dark',
  'arch.lockedBody': 'Restore this district to recover what it remembers.',
  'arch.settings': 'Atelier settings',
  'arch.achievements': 'Achievements',
  'arch.achievementsCount': '{n} of {total} earned',
  'arch.bestTime': 'Best {time}',

  'ach.firstLight.t': 'First Light',
  'ach.firstLight.d': 'Restore your first district.',
  'ach.quarter.t': 'Lamplighter',
  'ach.quarter.d': 'Restore six districts.',
  'ach.half.t': 'Half the Sky',
  'ach.half.d': 'Restore twelve districts.',
  'ach.wholeCity.t': 'The Whole City',
  'ach.wholeCity.d': 'Restore every district.',
  'ach.flawlessOne.t': 'Clean Hands',
  'ach.flawlessOne.d': 'Finish a district with no hints or undos.',
  'ach.flawlessFive.t': 'Master Restorer',
  'ach.flawlessFive.d': 'Finish five districts flawlessly.',
  'ach.streakThree.t': 'Habit of Light',
  'ach.streakThree.d': 'Keep a three-day daily streak.',
  'ach.streakSeven.t': 'Keeper of the Grid',
  'ach.streakSeven.d': 'Keep a seven-day daily streak.',
  'ach.dailyTen.t': 'Devoted',
  'ach.dailyTen.d': 'Restore ten daily cities.',

  'set.language': 'Language',
  'set.audio': 'Soundtrack',
  'set.audioHint': 'Generative ambient score and interaction sound',
  'set.motion': 'Reduced motion',
  'set.motionHint': 'Calmer camera, instant transitions',
  'set.particles': 'Reduced effects',
  'set.particlesHint': 'Fewer particles and post-processing, for older devices',
  'set.contrast': 'High-contrast energy',
  'set.contrastHint': 'Marks power with brighter, colour-independent light',

  'common.on': 'On',
  'common.off': 'Off',
  'common.back': 'Back',

  'kind.photograph': 'photograph',
  'kind.sketch': 'sketch',
  'kind.blueprint': 'blueprint',
  'kind.voice log': 'voice log',
  'kind.fragment': 'fragment',

  'rules.title': 'How to play',
  'rules.kicker': 'The rules of light',
  'rules.goal.h': 'The goal',
  'rules.goal.b':
    'Every district is a grid of dark streets and black buildings. Place energy cores so that every street is lit — then the district wakes and its memory returns.',
  'rules.core.h': 'Cores cast light',
  'rules.core.b':
    'Tap a dark street to set a core. It lights its own tile and sends light down its row and column until a building stops it. Tap a core again to remove it.',
  'rules.see.h': 'Cores must not face each other',
  'rules.see.b':
    'Two cores may not stand on the same clear line of street — if one core can see another along a row or column, the grid overloads. You cannot place a core on a tile that is already lit.',
  'rules.clue.h': 'Numbers and X',
  'rules.clue.b':
    'A numbered building needs exactly that many cores on the four tiles touching it (up, down, left, right). An X means no core may touch that building at all.',
  'rules.win.h': 'Restoration',
  'rules.win.b':
    'When every street is lit, every number is satisfied and nothing overloads, power floods the district and the city grows one light brighter.',
  'rules.tools.h': 'Your tools',
  'rules.tools.b':
    'Undo steps back one move. Reset clears every core at once. Survey suggests a next move when you are stuck. Drag to orbit the board, scroll or pinch to zoom.',
};

const TR: Dict = {
  'title.tag': 'Karanlıkta bir şehir bekliyor',
  'title.sub': 'Işığı geri getir',
  'title.begin': 'Restorasyona başla',
  'title.rules': 'Nasıl oynanır',

  'map.city': 'Şehir',
  'map.restored': 'tamamlandı',
  'map.streak': '{n} günlük restorasyon serisi',
  'map.daily': 'Günlük şehir',
  'map.dailyDone': 'Günlük şehir · tamamlandı',
  'map.archive': 'Arşiv',
  'map.rules': 'Nasıl oynanır',
  'map.prompt': 'Restorasyona başlamak için karanlık bir bölge seç',
  'map.whole': 'Şehir bütün — her bölge ışıl ışıl',

  'finale.kicker': 'Geri kazanıldı',
  'finale.line':
    'Karanlık haritadan silindi. Dokunduğun her bölge uyandı ve ışık artık aralarında kendi başına dolaşıyor — eskiden olduğu gibi, hep olması gerektiği gibi.',
  'finale.stay': 'Işıkla kal',

  'hud.daily': 'Günlük şehir',
  'hud.district': 'Bölge',
  'hud.power': 'Güç',
  'hud.overload': 'Şebeke aşırı yüklü',
  'hud.undo': 'Geri al',
  'hud.reset': 'Sıfırla',
  'hud.survey': 'İncele',
  'hud.map': 'Şehir haritası',

  'cine.restored': 'Güç geri geldi',
  'cine.last': 'Son bölge yanıt veriyor',
  'daily.epigraph': 'Bugün şebeke bu bölgeyi adıyla istiyor.',

  'done.memory': 'Anı kurtarıldı · {kind}',
  'done.daily': 'Günlük şehir tamamlandı',
  'done.dailyStreak': 'Şebeke sağlam. {n} gündür ışık, hiç kesilmeden.',
  'done.dailyFirst': 'Şebeke sağlam. Yarın yine gel — başka bir bölge bekliyor olacak.',
  'done.dailyTitle': '{name} yeniden canlanıyor',
  'done.flawless': 'Kusursuz restorasyon',
  'done.return': 'Şehre dön',
  'done.grandKicker': 'Şehir bütün',
  'done.grandTitle': 'Her sokak aydınlık',
  'done.grandBody':
    'Son bölge de şebekeye yanıt veriyor ve şehri bunca zamandır tutan karanlık nihayet bırakıyor. Limandan tepeye, her pencere sıcacık. Bir adım geri çekil ve geri getirdiğin şeye bak.',
  'done.grandBtn': 'Şehri bütün hâliyle gör',

  'arch.kicker': 'İlerleme arşivi',
  'arch.title': 'Restorasyon kayıtları',
  'arch.map': 'Şehir haritası',
  'arch.statDistricts': 'Restore edilen bölgeler',
  'arch.statCompletion': 'Şehir tamamlanma',
  'arch.statPowered': 'Aydınlatılan sokaklar',
  'arch.statCores': 'Kurulan çekirdekler',
  'arch.statFlawless': 'Kusursuz restorasyonlar',
  'arch.statStreak': 'Günlük seri',
  'arch.memories': 'Kurtarılan anılar',
  'arch.stillDark': 'Hâlâ karanlık',
  'arch.lockedBody': 'Hatırladıklarını kurtarmak için bu bölgeyi restore et.',
  'arch.settings': 'Atölye ayarları',
  'arch.achievements': 'Başarımlar',
  'arch.achievementsCount': '{total} başarımdan {n} tanesi',
  'arch.bestTime': 'En iyi {time}',

  'ach.firstLight.t': 'İlk Işık',
  'ach.firstLight.d': 'İlk bölgeni restore et.',
  'ach.quarter.t': 'Fenerci',
  'ach.quarter.d': 'Altı bölge restore et.',
  'ach.half.t': 'Göğün Yarısı',
  'ach.half.d': 'On iki bölge restore et.',
  'ach.wholeCity.t': 'Bütün Şehir',
  'ach.wholeCity.d': 'Her bölgeyi restore et.',
  'ach.flawlessOne.t': 'Temiz Eller',
  'ach.flawlessOne.d': 'Bir bölgeyi ipucu ve geri alma olmadan bitir.',
  'ach.flawlessFive.t': 'Usta Restoratör',
  'ach.flawlessFive.d': 'Beş bölgeyi kusursuz bitir.',
  'ach.streakThree.t': 'Işık Alışkanlığı',
  'ach.streakThree.d': 'Üç günlük seriyi koru.',
  'ach.streakSeven.t': 'Şebeke Bekçisi',
  'ach.streakSeven.d': 'Yedi günlük seriyi koru.',
  'ach.dailyTen.t': 'Sadık',
  'ach.dailyTen.d': 'On günlük şehri restore et.',

  'set.language': 'Dil',
  'set.audio': 'Müzik',
  'set.audioHint': 'Üretken ortam müziği ve etkileşim sesleri',
  'set.motion': 'Azaltılmış hareket',
  'set.motionHint': 'Daha sakin kamera, anında geçişler',
  'set.particles': 'Azaltılmış efektler',
  'set.particlesHint': 'Daha az parçacık ve son işleme, eski cihazlar için',
  'set.contrast': 'Yüksek kontrastlı enerji',
  'set.contrastHint': 'Gücü daha parlak, renkten bağımsız ışıkla gösterir',

  'common.on': 'Açık',
  'common.off': 'Kapalı',
  'common.back': 'Geri',

  'kind.photograph': 'fotoğraf',
  'kind.sketch': 'eskiz',
  'kind.blueprint': 'plan',
  'kind.voice log': 'ses kaydı',
  'kind.fragment': 'parça',

  'rules.title': 'Nasıl oynanır',
  'rules.kicker': 'Işığın kuralları',
  'rules.goal.h': 'Amaç',
  'rules.goal.b':
    'Her bölge, karanlık sokaklardan ve siyah binalardan oluşan bir ızgaradır. Enerji çekirdeklerini öyle yerleştir ki her sokak aydınlansın — o zaman bölge uyanır ve anısı geri döner.',
  'rules.core.h': 'Çekirdekler ışık saçar',
  'rules.core.b':
    'Karanlık bir sokağa dokunarak çekirdek koy. Kendi karesini aydınlatır ve bir bina durdurana kadar ışığı satırı ile sütunu boyunca gönderir. Kaldırmak için çekirdeğe tekrar dokun.',
  'rules.see.h': 'Çekirdekler birbirini görmemeli',
  'rules.see.b':
    'İki çekirdek aynı açık sokak hattında duramaz — biri satır ya da sütun boyunca diğerini görüyorsa şebeke aşırı yüklenir. Zaten aydınlık olan bir kareye çekirdek koyamazsın.',
  'rules.clue.h': 'Sayılar ve X',
  'rules.clue.b':
    'Sayılı bir binanın, ona değen dört karede (üst, alt, sol, sağ) tam o sayı kadar çekirdeğe ihtiyacı vardır. X işareti, o binaya hiçbir çekirdeğin değmemesi gerektiği anlamına gelir.',
  'rules.win.h': 'Restorasyon',
  'rules.win.b':
    'Her sokak aydınlandığında, her sayı karşılandığında ve hiçbir şey aşırı yüklenmediğinde güç bölgeye akar ve şehir bir ışık daha parlaklaşır.',
  'rules.tools.h': 'Araçların',
  'rules.tools.b':
    'Geri al, bir hamle geri gider. Sıfırla, tüm çekirdekleri tek seferde temizler. İncele, takıldığında bir sonraki hamleyi önerir. Sürükleyerek board’u döndür, kaydır ya da kıstırarak yakınlaş.',
};

const TABLES: Record<Lang, Dict> = { en: EN, tr: TR };

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let s = TABLES[lang][key] ?? TABLES.en[key] ?? key;
  if (params) for (const k in params) s = s.replace(`{${k}}`, String(params[k]));
  return s;
}

/** Hook returning a translator bound to the current language setting. */
export function useT() {
  const lang = useLux((s) => s.settings.lang);
  return (key: string, params?: Record<string, string | number>) => translate(lang, key, params);
}
