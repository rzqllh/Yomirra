import type { MetadataRoute } from 'next';

const APP_NAME = 'Yomirra';
const APP_SHORT_NAME = 'Yomirra';
const APP_DESCRIPTION =
  'A premium webtoon-first manga reader with offline reading, source extensions, and a cinematic Deep Lagoon interface.';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,

    start_url: '/',
    scope: '/',
    lang: 'en',
    dir: 'ltr',

    display: 'fullscreen',
    display_override: ['window-controls-overlay', 'fullscreen', 'standalone', 'minimal-ui', 'browser'],
    orientation: 'portrait',

    background_color: '#000D0F',
    theme_color: '#000D0F',

    categories: ['books', 'entertainment', 'productivity'],
    prefer_related_applications: false,

    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],

    shortcuts: [
      {
        name: 'Continue Reading',
        short_name: 'Continue',
        description: 'Jump back into your latest manga chapter.',
        url: '/bookmark?tab=history',
        icons: [
          {
            src: '/icons/shortcut-continue.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'My Library',
        short_name: 'Library',
        description: 'Open your saved manga library.',
        url: '/library',
        icons: [
          {
            src: '/icons/shortcut-library.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Downloads',
        short_name: 'Downloads',
        description: 'Manage offline manga chapters.',
        url: '/downloads',
        icons: [
          {
            src: '/icons/shortcut-downloads.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Sources',
        short_name: 'Sources',
        description: 'Browse and manage manga sources.',
        url: '/sources',
        icons: [
          {
            src: '/icons/shortcut-sources.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    ],

    screenshots: [
      {
        src: '/screenshots/mobile-home.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Yomirra home feed on mobile',
      },
      {
        src: '/screenshots/mobile-reader.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Webtoon-first vertical reader',
      },
      {
        src: '/screenshots/desktop-library.png',
        sizes: '1440x900',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Yomirra library on desktop',
      },
    ],
  };
}