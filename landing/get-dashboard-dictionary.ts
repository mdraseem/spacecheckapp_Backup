import 'server-only';

const dictionaries = {
  en: () => import('./dictionaries/dashboard-en.json').then((module) => module.default),
  pl: () => import('./dictionaries/dashboard-pl.json').then((module) => module.default),
};

export const getDashboardDictionary = async (locale: 'en' | 'pl') =>
  dictionaries[locale]?.() ?? dictionaries.en();
