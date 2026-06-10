import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Yomirra',
    short_name: 'Yomirra',
    description: 'A premium manga reader app',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0C10',
    theme_color: '#0B0C10',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
