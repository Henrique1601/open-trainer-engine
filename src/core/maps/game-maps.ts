export interface InteractiveGameMap {
  id: string;
  gameTitle: string;
  coverImage: string;
  mapUrl: string;
  description: string;
  categories: string[];
}

export class GameMapsManager {
  private static maps: InteractiveGameMap[] = [
    {
      id: 'elden-ring',
      gameTitle: 'Elden Ring',
      coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      mapUrl: 'https://mapgenie.io/elden-ring/maps/the-lands-between',
      description: 'Mapa interativo completo de The Lands Between com todos os Chefes, Armas, Cinzas de Guerra, Graças e Masmorras.',
      categories: ['Chefes', 'Armas', 'Graças', 'Talismãs', 'Masmorras']
    },
    {
      id: 'gta-v',
      gameTitle: 'Grand Theft Auto V',
      coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
      mapUrl: 'https://gta-5-map.com',
      description: 'Mapa interativo de Los Santos e Blaine County com colecionáveis, peças de naves espaciais, saltos únicos e propriedades.',
      categories: ['Colecionáveis', 'Propriedades', 'Saltos', 'Missões']
    },
    {
      id: 'cyberpunk-2077',
      gameTitle: 'Cyberpunk 2077',
      coverImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
      mapUrl: 'https://maps.piggyback.com/cyberpunk-2077/maps/night-city',
      description: 'Mapa detalhado de Night City com todos os Contratos, Veículos, Cibernética Lendária, Crimes em Andamento e Tarot.',
      categories: ['Cibernética', 'Veículos', 'Contratos', 'Tarot']
    },
    {
      id: 'rdr2',
      gameTitle: 'Red Dead Redemption 2',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      mapUrl: 'https://rdr2map.com',
      description: 'Mapa do Velho Oeste com animais lendários, armas raras, ossos de dinossauro, tesouros escondidos e peixes lendários.',
      categories: ['Animais Lendários', 'Tesouros', 'Armas', 'Ovos de Páscoa']
    },
    {
      id: 'palworld',
      gameTitle: 'Palworld',
      coverImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
      mapUrl: 'https://palworld.th.gl',
      description: 'Mapa das Ilhas Palpagos com localização de Pals Alfa, Baús Lendários, Estátuas de Poder e Cavernas.',
      categories: ['Pals Alfa', 'Estátuas', 'Baús', 'Teleportes']
    }
  ];

  public static getAllMaps(): InteractiveGameMap[] {
    return this.maps;
  }

  public static getMapById(id: string): InteractiveGameMap | undefined {
    return this.maps.find(m => m.id === id);
  }
}
