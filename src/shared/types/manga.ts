export interface ReaderPreferences {
  imageFit: 'width' | 'contained';
  pageGap: 'none' | 'small' | 'comfortable';
  background: 'black' | 'deepLagoon' | 'mist';
  toolbarBehavior: 'auto-hide' | 'always-visible';
  preloadIntensity: 'light' | 'balanced' | 'aggressive';
  showPageProgress: boolean;
  readingDirection: 'ltr' | 'rtl';
  readingMode: 'vertical' | 'paged';
  keepScreenAwake?: boolean;
}
