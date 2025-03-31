/**
 * Google Analytics event tracking utilities
 */

// Track a custom event in Google Analytics
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  // Make sure window and gtag are available (client-side only)
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // @ts-ignore - gtag is added by the Google Analytics script
    window.gtag('event', eventName, eventParams);
  }
};

// Specific event for wallet connection
export const trackWalletConnect = (walletName?: string) => {
  trackEvent('click_connect', {
    event_category: 'wallet',
    event_label: walletName || 'unknown',
    value: 1
  });
};
