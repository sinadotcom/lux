import type { Lang } from '../state/store.ts';
import { DISTRICT_BY_ID, type District, type MemoryKind } from './districts.ts';

export interface DistrictText {
  name: string;
  epigraph: string;
  memory: { title: string; body: string };
}

/** Turkish narrative for every district. English lives in districts.ts. */
const TR: Record<string, DistrictText> = {
  harbor: {
    name: 'Liman Manzarası',
    epigraph: 'Deniz feneri en son karardı. İlk yeniden o yanabilir.',
    memory: {
      title: '7 No’lu Vapur, son sefer',
      body: 'Su lekeli bir baskı. Yolcular kadrajın dışındaki birine el sallıyor. Arkasında, kurşun kalemle: "Çaydanlığı açık bıraktık. Birinin o sıcaklığa ihtiyacı olacak."',
    },
  },
  museum: {
    name: 'Müze Mahallesi',
    epigraph: 'Mermer her adımı hatırlar. Hatırlayabilmesi için ona ışık ver.',
    memory: {
      title: 'Avlu etüdü, saat 16:00',
      body: 'Kasap kâğıdına kömür kalem. Tavan penceresi on iki kez çizilmiş, her biri farklı havada. Ressam yalnızca güneşli olanı imzalamış.',
    },
  },
  transit: {
    name: 'Aktarma Merkezi',
    epigraph: 'Haritadaki her hat, bir zamanlar evine giden birini anlatırdı.',
    memory: {
      title: 'Peron anonsu, tarihsiz',
      body: '"…21:14 sahil seferi, merdivenlerden koşan bir yolcu için bekletiliyor. Sizi görüyoruz. Acele etmeyin." Kayıt alkışla bitiyor.',
    },
  },
  rooftops: {
    name: 'Çatılar Bölgesi',
    epigraph: 'Şehir bahçelerini göğe en yakın yerde tuttu.',
    memory: {
      title: 'Alacakaranlıkta çamaşır ipleri',
      body: 'İki su kulesi arasında, beyaz çarşaflardan bir dizi son güneşi yakalıyor. Aralarına bir not iliştirilmiş: "Merdivenini ödünç aldım. Pencere kenarında turta var."',
    },
  },
  hillside: {
    name: 'Yamaç Köyü',
    epigraph: 'Merdivenler, fenerler, kapı eşikleri — sabırlı ellerin kurduğu bir kasaba.',
    memory: {
      title: 'Fenerci’nin defteri',
      body: 'Kırk yıllık kayıt, her akşam için bir satır. Son satır, diğerlerinden daha sağlam bir elle: "Hepsi yandı. Rüzgâr güneyden. Güzel bir hayat."',
    },
  },
  observatory: {
    name: 'Gözlemevi',
    epigraph: 'Yıldızlar dürüst kalsın diye mercekleri söndürdüler.',
    memory: {
      title: 'Tahrik mekanizması, 2 No’lu kubbe',
      body: 'İki el tarafından not düşülmüş bir plan. İlki titiz. İkincisi kenara şöyle yazıyor: "40 devirde şarkı söylüyor — dokunmayın."',
    },
  },
  megastructure: {
    name: 'Modernist Megayapı',
    epigraph: 'Bir ilçe büyüklüğünde tek bina. Nazik olmak isteyen beton.',
    memory: {
      title: '14. kat, ortak salon',
      body: 'Mimar her daire kapısını tam on beş derece açık çizmiş. Bir not açıklıyor: "Kapalı kapılar daha iyi fotoğraf olur. Açık olanlar daha iyi yaşanır."',
    },
  },
  research: {
    name: 'Araştırma Tesisi',
    epigraph: 'Sönen son ışıklar. Yeniden yakılması en zor olanlar.',
    memory: {
      title: 'Son kayıt, şebeke operasyonları',
      body: '"Sırayla kapatıyorum. Gücü kim geri getirirse: zor olan asla şebeke değildi. İnsanlar ışığı izler. Hep izlediler." — Kaydın sonu.',
    },
  },
  wharf: {
    name: 'Eski İskele',
    epigraph: 'Halat, tuz ve sabır. Gel-git, insanların kaçırdığı randevulara yetişti.',
    memory: {
      title: 'Ağ tamircileri, sabah vardiyası',
      body: 'Tek bir yırtık ağ üzerinde dört çift el. Kimse kameraya bakmıyor. Kenarda: "Onarılan, beraber onarılırsa yeniden güçlüdür."',
    },
  },
  tidewater: {
    name: 'Gel-git Evleri',
    epigraph: 'Akşamlar içeri girebilsin diye suya yakın, alçak kurulmuş evler.',
    memory: {
      title: 'Yüksek suda kapı eşikleri',
      body: 'Su hizasında çizilmiş bir sıra basamak, her birinde farklı bir sandalye. Ressam sandalyeleri numaralamış ama evleri asla.',
    },
  },
  cannery: {
    name: 'Konserve Fabrikası',
    epigraph: 'Bir yüzyıl boyunca sahili doyurdu. Bırak pencereleri yeniden buğulansın.',
    memory: {
      title: 'Tarih basılı teneke kapak',
      body: 'Yumuşak metale basılmış: bir hasat yılı ve üç baş harf. Biri yemek yerine kapağı saklamış. Nedenini anlıyorsun.',
    },
  },
  gardens: {
    name: 'Su Bahçeleri',
    epigraph: 'Şehrini seven mühendisler ona duvar yerine çeşmeler yaptı.',
    memory: {
      title: 'Çağlayan, üçüncü havuz',
      body: 'Akış hesapları kusursuz, sonra daha gevşek bir el ekliyor: "teneke çatıya yağan yağmur gibi ses çıkarmalı — kulakla ayarla."',
    },
  },
  almshouse: {
    name: 'Düşkünevleri',
    epigraph: 'Küçük odalar, sıcak kapılar. Şehir sözünü burada tuttu.',
    memory: {
      title: 'Kapıcı, akşam turu',
      body: '"On bir numara lambasını yine dokuz numaraya bıraktı. Bir şey demeyeceğim. Bazı hesaplar düzeltilmese daha iyi."',
    },
  },
  foundry: {
    name: 'Dökümhane',
    epigraph: 'Diğer her sokağı aydınlatan direkleri o döktü. En sona kalsa da hak ederek ilk yanan o olsun.',
    memory: {
      title: 'Mevsimin ilk dökümü',
      body: 'Bir kıvılcım duvarı ve irkilmeyen siluetler. Kalıba tebeşirle yazılmış: "Liman yolu için. Ayak altında nazik olsun."',
    },
  },
  conservatory: {
    name: 'Konservatuvar',
    epigraph: 'Yalnızca sesi tutmak için kurulmuş bir salon. Akşamlarını ona geri ver.',
    memory: {
      title: 'Oturma planı, notlanmış',
      body: 'Her koltuk, genellikle orada oturanın adıyla işaretli. Arkalara yakın biri yalnızca şöyle diyor: "boş bırak — ihtiyacı olana."',
    },
  },
  greenhouse: {
    name: 'Cam Seralar',
    epigraph: 'Soğuk camın altında biri yazı bir zamanlayıcıyla yürütüyordu.',
    memory: {
      title: 'Sulama çizelgesi, suyla lekeli',
      body: 'Mürekkebin çoğu akmış ama bir satır sağlam kalmış: "eğrelti otları kaçırılan bir günü affeder. Yine de onlardan özür dile."',
    },
  },
  signal: {
    name: 'Sinyal Tepesi',
    epigraph: 'Açık karanlıktan önceki son fener. Denizciler onun sabrıyla rota tuttu.',
    memory: {
      title: 'Bekçi, nöbeti devrederken',
      body: '"Onu gördüğün gemiler için yakmazsın. Göremediğin tek gemi için yakarsın. Bütün iş bu. İyi geceler."',
    },
  },
  exchange: {
    name: 'Borsa',
    epigraph: 'Tüm şehrin planlarının bağırılıp el sıkışıldığı bir kat.',
    memory: {
      title: 'Büyük salon, akustik etüdü',
      body: 'Sesin salonda nasıl yayıldığını gösteren bir şema; tek bir ok sessiz bir köşeyi işaret ediyor: "anlaşmaların asıl yapıldığı yer."',
    },
  },
  funicular: {
    name: 'Füniküler Tepe',
    epigraph: 'İki vagon, sonsuza dek birbirini geçiyor. Biri inerken öteki hep eve dönüyordu.',
    memory: {
      title: 'Vagonların karşılaşması',
      body: 'Yokuşun ortasında iki araç birbirini geçiyor. Her pencerede bir çocuk ötekine el sallıyor. Alışkın sürücüler de el sallıyor.',
    },
  },
  printworks: {
    name: 'Matbaa',
    epigraph: 'Doksan yıl boyunca sabah baskısını çıkardı. Presler o ritmi özlüyor.',
    memory: {
      title: 'Son ön sayfa, hiç basılmadı',
      body: 'Manşeti boş bırakılmış bir prova ve editöre bir not: "Ana haberi beklet. Şafağa kadar güzel bir şey olacaktır."',
    },
  },
  orchard: {
    name: 'Meyve Bahçesi Setleri',
    epigraph: 'Yamacı meyve için taraçaladılar, manzara için kaldılar.',
    memory: {
      title: 'Tek ağaç, dört mevsim',
      body: 'Aynı elma ağacı ilkbahar, yaz, sonbahar, kışta çizilmiş — ve beşinci kez, çıplak, yalnızca şu altyazıyla: "bekliyor, hepimiz gibi."',
    },
  },
  cathedral: {
    name: 'Katedral Avlusu',
    epigraph: 'Taş danteli ve yüksek pencereler; konuşmayı ışığa bırakmak için yapıldı.',
    memory: {
      title: 'Gül pencere, camlama sırası',
      body: 'Her cam, rengine göre numaralı. Camın berrak olduğu merkezde mimar şöyle yazmış: "bir parça dürüst kalsın."',
    },
  },
  aerodrome: {
    name: 'Havaalanı',
    epigraph: 'Şehrin merhabalarını ve en zor vedalarını ettiği alan.',
    memory: {
      title: 'Kule, son izin',
      body: '"İstediğinde pist ışıkları senin. Her gece biraz daha uzun yaktık onları, ya hâlâ eve dönen biri vardır diye."',
    },
  },
};

/** Localized name/epigraph/memory for a district. */
export function districtText(d: District, lang: Lang): DistrictText {
  if (lang === 'tr' && TR[d.id]) return TR[d.id];
  return { name: d.name, epigraph: d.epigraph, memory: { title: d.memory.title, body: d.memory.body } };
}

export function districtTextById(id: string, lang: Lang): DistrictText | null {
  const d = DISTRICT_BY_ID.get(id);
  return d ? districtText(d, lang) : null;
}

export type { MemoryKind };
