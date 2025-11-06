import HomeClient from '@/components/HomeClient';
import { ClientWrapper } from '@/components/ClientWrapper';
import type { ChannelWithSchedules, Category } from '@/types/channel';
import type { Metadata } from 'next';

interface InitialData {
  holiday: boolean;
  todaySchedules: ChannelWithSchedules[];
  weekSchedules: ChannelWithSchedules[];
  categories: Category[];
  categoriesEnabled: boolean;
}

async function getInitialData(): Promise<InitialData> {
  try {
    // Fetch holiday info
    const holidayPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/holiday`, {
      next: { revalidate: 3600 }
    }).then(res => res.json());

    // Use new optimized endpoints with background live status caching
    const todayPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/channels/with-schedules/today?live_status=true`,
      {
        next: { revalidate: 300 }
      }
    ).then(res => res.json());

    const weekPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/channels/with-schedules/week?live_status=true`,
      {
        next: { revalidate: 300 }
      }
    ).then(res => res.json());

    const categoriesPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categories`,
      {
        next: { revalidate: 3600 } // Categories change less frequently
      }
    ).then(res => res.json());

    const categoriesEnabledPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/config/categories_enabled`,
      {
        next: { revalidate: 0 } // No caching for config - changes should be immediate
      }
    ).then(res => res.text()); // Config endpoint returns plain text

    const [holidayData, todaySchedules, weekSchedules, categories, categoriesEnabledData] = await Promise.all([
      holidayPromise,
      todayPromise,
      weekPromise,
      categoriesPromise,
      categoriesEnabledPromise,
    ]);

    return {
      holiday: !!holidayData.holiday,
      todaySchedules: Array.isArray(todaySchedules) ? todaySchedules : [],
      weekSchedules: Array.isArray(weekSchedules) ? weekSchedules : [],
      categories: Array.isArray(categories) ? categories.sort((a: Category, b: Category) => (a.order || 0) - (b.order || 0)) : [],
      categoriesEnabled: categoriesEnabledData === 'true',
    };
  } catch {
    return {
      holiday: false,
      todaySchedules: [],
      weekSchedules: [],
      categories: [],
      categoriesEnabled: false, // Default to false on error
    };
  }
}

// Helper function to extract unique channels from schedules
function getUniqueChannels(schedules: ChannelWithSchedules[]): Array<{ name: string; url: string }> {
  const channelMap = new Map<string, { name: string; url: string }>();
  
  schedules.forEach(item => {
    const channelName = item.channel.name;
    if (!channelMap.has(channelName)) {
      // Use handle if available, otherwise construct from channel name
      const handle = item.channel.handle;
      const url = handle 
        ? `https://www.youtube.com/@${handle.replace(/^@/, '')}` // Remove @ if present
        : `https://www.youtube.com/@${channelName.toLowerCase().replace(/\s+/g, '')}`;
      channelMap.set(channelName, { name: channelName, url });
    }
  });
  
  return Array.from(channelMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Generate dynamic metadata for SEO
// Note: Next.js automatically deduplicates fetch requests with the same URL and cache options,
// so calling getInitialData() here and in the component won't cause duplicate network requests
export async function generateMetadata(): Promise<Metadata> {
  const initialData = await getInitialData();
  const channels = getUniqueChannels(initialData.todaySchedules);
  
  const channelNames = channels.map(ch => ch.name);
  const channelList = channelNames.length > 0 
    ? channelNames.slice(0, 5).join(', ') + (channelNames.length > 5 ? ' y más' : '')
    : 'Olga, Luzu TV, Bondi';
  
  return {
    title: 'Guía del Streaming - Ver Olga, Luzu, Bondi y más canales en vivo',
    description: `Descubrí qué ver hoy en ${channelList} y otros canales de streaming. Programas, horarios y recomendaciones actualizadas.`,
  };
}

export default async function HomePage() {
  // Next.js will dedupe this fetch call with the one in generateMetadata above
  const initialData = await getInitialData();
  const channels = getUniqueChannels(initialData.todaySchedules);

  // Create JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Guía de Streaming",
    "description": "Programación y horarios de canales y medios de streaming como Olga, Luzu TV, Bondi y más.",
    "itemListElement": channels.map((ch) => ({
      "@type": "Organization",
      "name": ch.name,
      "url": ch.url,
    })),
  };

  return (
    <ClientWrapper>
      {/* Hidden SEO content section */}
      <section className="seo-hidden" aria-hidden="true">
        <h2>Guía de streaming y medios en vivo</h2>
        <p>
          Encontrá la programación completa de los canales y medios de
          streaming más populares como{' '}
          {channels.map((ch, i) => (
            <strong key={i}>
              {ch.name}
              {i < channels.length - 1 ? ', ' : '.'}
            </strong>
          ))}{' '}
          Mirá los horarios, descubrí nuevos programas y enterate de qué se
          está hablando en vivo. Todo el streaming, en un solo lugar.
        </p>
        <p>
          Desde la mañana hasta el prime time, actualizamos la grilla para que
          sepas cuándo ver tus shows favoritos y encuentres algo nuevo para
          dar play. Descubrí qué ver hoy, en La Guía del Streaming.
        </p>
      </section>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HomeClient initialData={initialData} />
    </ClientWrapper>
  );
}