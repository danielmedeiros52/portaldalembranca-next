import { useEffect } from 'react';

interface PersonSchema {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: {
    '@type': 'Place';
    name: string;
  };
  description?: string;
  image?: string;
  url?: string;
  sameAs?: string[];
}

interface WebPageSchema {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  isPartOf: {
    '@type': 'WebSite';
    name: string;
    url: string;
  };
}

interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }[];
}

interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
}

type SchemaType = PersonSchema | WebPageSchema | BreadcrumbSchema | OrganizationSchema;

interface StructuredDataProps {
  data: SchemaType | SchemaType[];
}

/**
 * StructuredData Component
 * 
 * Injeta dados estruturados JSON-LD no head do documento
 * para melhorar a indexação pelo Google e outros buscadores.
 */
export function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    const scriptId = 'structured-data-' + JSON.stringify(data).substring(0, 50).replace(/[^a-z0-9]/gi, '');
    
    // Remover script existente se houver
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }
    
    // Criar novo script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [data]);
  
  return null;
}

/**
 * Gera Schema.org Person para um memorial
 */
export function generatePersonSchema(memorial: {
  fullName: string;
  birthDate: string;
  deathDate: string;
  birthplace: string;
  biography: string;
  mainPhoto?: string;
  slug: string;
  category?: string;
}): PersonSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: memorial.fullName,
    birthDate: memorial.birthDate,
    deathDate: memorial.deathDate,
    birthPlace: {
      '@type': 'Place',
      name: memorial.birthplace,
    },
    description: memorial.biography.split('\n\n')[0].substring(0, 300),
    image: memorial.mainPhoto,
    url: `https://portaldalembranca.com.br/m/${memorial.slug}`,
  };
}

/**
 * Gera Schema.org WebPage
 */
export function generateWebPageSchema(
  name: string,
  description: string,
  url: string
): WebPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Portal da Lembrança',
      url: 'https://portaldalembranca.com.br',
    },
  };
}

/**
 * Gera Schema.org BreadcrumbList
 */
export function generateBreadcrumbSchema(
  items: { name: string; url?: string }[]
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Schema.org Organization para o Portal da Lembrança
 */
export const organizationSchema: OrganizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Portal da Lembrança',
  url: 'https://portaldalembranca.com.br',
  logo: 'https://portaldalembranca.com.br/logo.png',
  description: 'Plataforma de memoriais digitais para homenagear e preservar a memória de entes queridos e personalidades históricas.',
  sameAs: [
    'https://www.instagram.com/portaldalembranca',
    'https://www.facebook.com/portaldalembranca',
  ],
};

export default StructuredData;
