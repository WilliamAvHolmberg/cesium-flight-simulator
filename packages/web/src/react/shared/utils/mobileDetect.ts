export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
         ('ontouchstart' in window) ||
         (navigator.maxTouchPoints > 0);
}
