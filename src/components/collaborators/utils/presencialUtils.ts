// src/components/collaborators/utils/presencialUtils.ts

// --- HELPER NORMALIZAÇÃO ---
export const normalizeKey = (text: string) => {
  if (!text) return ""
  return text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ")
}

// --- HELPER FORMATAÇÃO ---
export const toTitleCase = (text: string) => {
  if (!text) return ""
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// --- UTILS EXCEL ---
export const findValue = (row: any, keys: string[]) => {
  const rowKeys = Object.keys(row)
  for (const searchKey of keys) {
      const foundKey = rowKeys.find(k => normalizeKey(k) === normalizeKey(searchKey))
      if (foundKey) return row[foundKey]
  }
  return null
}

// --- HELPERS DE DATA ---
export const getFirstDayOfMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}

export const getLastDayOfMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
}