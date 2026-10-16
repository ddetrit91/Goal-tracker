import type { Context } from 'hono';

// Кэш для разрешения IP -> Город
const geoCache = new Map<string, string>();

const TIMEZONE_TO_CITY: Record<string, string> = {
  'Asia/Tashkent': 'Ташкент',
  'Asia/Samarkand': 'Самарканд',
  'Europe/Moscow': 'Москва',
  'Europe/Kaliningrad': 'Калининград',
  'Europe/Samara': 'Самара',
  'Asia/Yekaterinburg': 'Екатеринбург',
  'Asia/Omsk': 'Омск',
  'Asia/Novosibirsk': 'Новосибирск',
  'Asia/Krasnoyarsk': 'Красноярск',
  'Asia/Irkutsk': 'Иркутск',
  'Asia/Yakutsk': 'Якутск',
  'Asia/Vladivostok': 'Владивосток',
  'Europe/Minsk': 'Минск',
  'Asia/Almaty': 'Алматы',
  'Asia/Astana': 'Астана',
  'Asia/Qyzylorda': 'Кызылорда',
  'Asia/Bishkek': 'Бишкек',
  'Asia/Dushanbe': 'Душанбе',
  'Asia/Baku': 'Баку',
  'Asia/Tbilisi': 'Тбилиси',
  'Asia/Yerevan': 'Ереван',
  'Europe/Kyiv': 'Киев',
  'Asia/Dubai': 'Дубай',
  'Asia/Istanbul': 'Стамбул',
  'Europe/London': 'Лондон',
  'Europe/Berlin': 'Берлин',
  'Europe/Paris': 'Париж',
  'America/New_York': 'Нью-Йорк',
  'America/Los_Angeles': 'Лос-Анджелес',
};

const CITY_NAME_RU: Record<string, string> = {
  'tashkent': 'Ташкент',
  'samarkand': 'Самарканд',
  'bukhara': 'Бухара',
  'andijan': 'Андижан',
  'namangan': 'Наманган',
  'fergana': 'Фергана',
  'nukus': 'Нукус',
  'moscow': 'Москва',
  'saint petersburg': 'Санкт-Петербург',
  'almaty': 'Алматы',
  'astana': 'Астана',
  'minsk': 'Минск',
  'bishkek': 'Бишкек',
  'dushanbe': 'Душанбе',
  'baku': 'Баку',
  'tbilisi': 'Тбилиси',
  'yerevan': 'Ереван',
  'kyiv': 'Киев',
  'kiev': 'Киев',
  'dubai': 'Дубай',
  'istanbul': 'Стамбул',
  'london': 'Лондон',
  'berlin': 'Берлин',
  'paris': 'Париж',
  'new york': 'Нью-Йорк',
};

function formatCityName(rawCity: string): string {
  const trimmed = rawCity.trim();
  const lower = trimmed.toLowerCase();
  if (CITY_NAME_RU[lower]) {
    return CITY_NAME_RU[lower];
  }
  return trimmed;
}

export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.') || ip.startsWith('172.31.')) return true;
  return false;
}

export function extractClientIp(c: Context): string {
  const cfIp = c.req.header('cf-connecting-ip');
  const vercelIp = c.req.header('x-vercel-forwarded-for');
  const realIp = c.req.header('x-real-ip');
  const forwardedFor = c.req.header('x-forwarded-for');

  let ip = cfIp || vercelIp || realIp;
  if (!ip && forwardedFor) {
    ip = forwardedFor.split(',')[0].trim();
  }

  if (!ip) {
    try {
      ip = (c.env as any)?.incoming?.socket?.remoteAddress || '127.0.0.1';
    } catch {
      ip = '127.0.0.1';
    }
  }

  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  if (ip === '::1') {
    ip = '127.0.0.1';
  }

  return ip || '127.0.0.1';
}

export async function resolveClientCity(c: Context, ip: string): Promise<string> {
  // 1. Проверяем заголовки Vercel / Cloudflare
  const vercelCity = c.req.header('x-vercel-ip-city');
  if (vercelCity) {
    try {
      const decoded = decodeURIComponent(vercelCity);
      if (decoded && decoded !== 'Unknown') return formatCityName(decoded);
    } catch {
      // ignore
    }
  }

  const cfCity = c.req.header('cf-ipcity');
  if (cfCity && cfCity !== 'Unknown') {
    return formatCityName(cfCity);
  }

  // 2. Проверяем заголовок от клиента (город или таймзона)
  const clientCityHeader = c.req.header('x-client-city');
  if (clientCityHeader) {
    try {
      const decoded = decodeURIComponent(clientCityHeader);
      if (decoded && decoded !== 'Unknown') return formatCityName(decoded);
    } catch {
      return formatCityName(clientCityHeader);
    }
  }

  const clientTz = c.req.header('x-client-timezone');
  if (clientTz && TIMEZONE_TO_CITY[clientTz]) {
    const cityName = TIMEZONE_TO_CITY[clientTz];
    if (isPrivateIp(ip)) {
      return `${cityName} (Локально)`;
    }
    return cityName;
  }

  // 3. Если локальный IP
  if (isPrivateIp(ip)) {
    return 'Локально';
  }

  // 4. Проверяем кэш
  if (geoCache.has(ip)) {
    return geoCache.get(ip)!;
  }

  // 5. Запрос к легковесному GeoIP (ip-api) с таймаутом 1.5 секунды
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,status&lang=ru`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      if (data && data.status === 'success' && data.city) {
        const city = formatCityName(data.city);
        geoCache.set(ip, city);
        return city;
      }
    }
  } catch {
    // В случае оффлайна или ошибки тайм-аута
  }

  return 'Не определен';
}
