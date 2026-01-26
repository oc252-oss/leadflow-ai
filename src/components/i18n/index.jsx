import { ptBR } from './pt-BR';

// Default language
const DEFAULT_LANGUAGE = 'pt-BR';

// Available translations
const translations = {
  'pt-BR': ptBR,
  // Future languages can be added here:
  // 'en-US': enUS,
  // 'es-ES': esES,
};

// Current language (can be extended with localStorage or user preferences)
let currentLanguage = DEFAULT_LANGUAGE;

/**
 * Translation function
 * @param {string} key - Translation key (e.g., 'dashboard', 'leads')
 * @param {string} fallback - Optional fallback text if key not found
 * @returns {string} Translated text
 */
export function t(key, fallback = null) {
  const translation = translations[currentLanguage];
  
  if (translation && translation[key]) {
    return translation[key];
  }
  
  // Return fallback or key itself if translation not found
  return fallback || key;
}

/**
 * Get current language
 * @returns {string} Current language code
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Set current language
 * @param {string} language - Language code (e.g., 'pt-BR', 'en-US')
 */
export function setLanguage(language) {
  if (translations[language]) {
    currentLanguage = language;
  } else {
    console.warn(`Language '${language}' not available. Using ${DEFAULT_LANGUAGE}`);
  }
}