// Cloudflare Pages Function - 실업급여 계산기 결과 공유 동적 OG 태그
// KakaoTalk, Facebook, Twitter 등의 크롤러가 접근할 때 동적 OG 메타 태그 생성

const CRAWLER_PATTERNS = [
  'kakaotalk', 'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'Slackbot', 'TelegramBot', 'WhatsApp', 'Pinterest', 'Google-InspectionTool',
  'Googlebot', 'bingbot', 'Discordbot'
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern.toLowerCase()));
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function generateOGTags(urlParams) {
  const daily = urlParams.get('daily');
  const days = urlParams.get('days');
  const total = urlParams.get('total');

  if (!daily || !days || !total) {
    return null;
  }

  const dailyFormatted = formatNumber(parseInt(daily));
  const totalFormatted = formatNumber(parseInt(total));
  const months = Math.floor(parseInt(days) / 30);

  const shareTitle = `💼 나의 실업급여: 총 ${totalFormatted}원!`;
  const shareDescription = `하루 ${dailyFormatted}원 × ${days}일 (약 ${months}개월)\n당신의 실업급여도 계산해보세요 👉`;

  return {
    title: shareTitle,
    description: shareDescription
  };
}

function injectOGTags(html, ogData) {
  if (!ogData) return html;

  let modifiedHtml = html.replace(/<meta property="og:.*?".*?>/g, '');

  const ogTags = `
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(ogData.title)}">
    <meta property="og:description" content="${escapeHtml(ogData.description)}">
    <meta property="og:url" content="https://unemployment-benefit-calculator.pages.dev/">
    <meta property="og:site_name" content="실업급여 계산기">
    <meta property="og:image" content="https://unemployment-benefit-calculator.pages.dev/og-image.jpg">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(ogData.title)}">
    <meta name="twitter:description" content="${escapeHtml(ogData.description)}">
    <meta name="twitter:image" content="https://unemployment-benefit-calculator.pages.dev/og-image.jpg">
  `;

  modifiedHtml = modifiedHtml.replace('</head>', `${ogTags}\n</head>`);
  return modifiedHtml;
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function onRequest(context) {
  const { request, next } = context;
  const userAgent = request.headers.get('User-Agent') || '';
  const url = new URL(request.url);

  if (!isCrawler(userAgent)) {
    return next();
  }

  const ogData = generateOGTags(url.searchParams);

  if (!ogData) {
    return next();
  }

  const response = await next();

  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  let html = await response.text();
  html = injectOGTags(html, ogData);

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}
