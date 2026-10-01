import type { MetadataRoute } from 'next';

const APP_NAME = 'Yomirra';
const APP_SHORT_NAME = 'Yomirra';
const APP_DESCRIPTION =
  'Baca dan kelola komik dari berbagai sumber dalam satu tempat.';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,

    start_url: '/',
    scope: '/',
    lang: 'id',
    dir: 'ltr',

    display: 'fullscreen',
    display_override: ['window-controls-overlay', 'fullscreen', 'standalone', 'minimal-ui', 'browser'],
    orientation: 'portrait',

    background_color: '#000000',
    theme_color: '#000000',

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
        name: 'Lanjut Baca',
        short_name: 'Lanjut',
        description: 'Lanjutkan chapter terakhir yang kamu baca.',
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
        name: 'Rak Buku',
        short_name: 'Rak Buku',
        description: 'Buka bookmark dan bacaan yang kamu simpan.',
        url: '/bookmark',
        icons: [
          {
            src: '/icons/shortcut-library.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Unduhan',
        short_name: 'Unduhan',
        description: 'Kelola chapter yang tersimpan untuk dibaca offline.',
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
        name: 'Sumber',
        short_name: 'Sumber',
        description: 'Pilih sumber untuk menjelajah dan membaca komik.',
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
        label: 'Beranda Yomirra di ponsel',
      },
      {
        src: '/screenshots/mobile-reader.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Pembaca vertikal Yomirra',
      },
      {
        src: '/screenshots/desktop-library.png',
        sizes: '1440x900',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Library Yomirra di desktop',
      },
    ],
  };
}