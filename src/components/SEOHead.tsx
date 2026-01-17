import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  noIndex?: boolean;
}

/**
 * SEOHead Component
 * 
 * Gerencia meta tags dinâmicas para SEO e compartilhamento social.
 * Atualiza o document.head com as meta tags apropriadas.
 */
export function SEOHead({
  title = 'Portal da Lembrança',
  description = 'Memoriais digitais para homenagear e preservar a memória de seus entes queridos. Crie páginas memoriais com fotos, biografias e homenagens.',
  image = 'https://portaldalembranca.com.br/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  keywords = [],
  noIndex = false,
}: SEOHeadProps) {
  
  useEffect(() => {
    // Atualizar título
    document.title = title;
    
    // Helper para criar ou atualizar meta tags
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };
    
    // Helper para remover meta tag
    const removeMetaTag = (name: string, property?: boolean) => {
      const attr = property ? 'property' : 'name';
      const meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (meta) meta.remove();
    };
    
    // Meta tags básicas
    setMetaTag('description', description);
    
    // Keywords
    if (keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '));
    }
    
    // Robots
    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }
    
    // Open Graph
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', image, true);
    setMetaTag('og:url', url, true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:site_name', 'Portal da Lembrança', true);
    setMetaTag('og:locale', 'pt_BR', true);
    
    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);
    
    // Article specific
    if (type === 'article' || type === 'profile') {
      if (author) setMetaTag('article:author', author, true);
      if (publishedTime) setMetaTag('article:published_time', publishedTime, true);
      if (modifiedTime) setMetaTag('article:modified_time', modifiedTime, true);
    }
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
    
    // Cleanup function
    return () => {
      // Não removemos as tags no cleanup para evitar flickering
    };
  }, [title, description, image, url, type, author, publishedTime, modifiedTime, keywords, noIndex]);
  
  return null;
}

/**
 * Gera meta tags específicas para um memorial
 */
export function generateMemorialSEO(memorial: {
  fullName: string;
  birthDate: string;
  deathDate: string;
  birthplace: string;
  biography: string;
  mainPhoto?: string;
  slug: string;
  category?: string;
  graveLocation?: string;
}) {
  const birthYear = new Date(memorial.birthDate).getFullYear();
  const deathYear = new Date(memorial.deathDate).getFullYear();
  
  // Extrair primeiro parágrafo da biografia para descrição
  const firstParagraph = memorial.biography.split('\n\n')[0];
  const description = firstParagraph.length > 160 
    ? firstParagraph.substring(0, 157) + '...'
    : firstParagraph;
  
  // Keywords baseadas no memorial
  const keywords = [
    memorial.fullName,
    'memorial',
    'homenagem',
    memorial.birthplace,
    `${birthYear}-${deathYear}`,
    'biografia',
    'história',
  ];
  
  if (memorial.category) {
    keywords.push(memorial.category.toLowerCase());
  }
  
  if (memorial.graveLocation) {
    keywords.push(...memorial.graveLocation.split(',').map(s => s.trim()));
  }
  
  return {
    title: `${memorial.fullName} (${birthYear}-${deathYear}) | Memorial | Portal da Lembrança`,
    description,
    image: memorial.mainPhoto || 'https://portaldalembranca.com.br/og-memorial.jpg',
    url: `https://portaldalembranca.com.br/m/${memorial.slug}`,
    type: 'profile' as const,
    keywords,
  };
}

export default SEOHead;
