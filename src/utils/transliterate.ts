export function transliterateArabic(arabic: string): string {
  if (!arabic) return '';
  
  const map: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': '\'',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 't', 'ء': '\'', 'ؤ': '\'', 'ئ': '\'',
    'َ': 'a', 'ِ': 'i', 'ُ': 'u', 'ً': 'an', 'ٍ': 'in', 'ٌ': 'un', 'ْ': '', 'ّ': ''
  };
  
  let result = '';
  for (let i = 0; i < arabic.length; i++) {
    const char = arabic[i];
    if (char === 'ّ' && i > 0) {
      // Shadda: double the previous consonant
      const prevChar = arabic[i - 1];
      if (map[prevChar]) {
        result += map[prevChar];
      }
    } else if (map[char] !== undefined) {
      result += map[char];
    } else {
      result += char;
    }
  }
  
  // Basic cleanup
  result = result.replace(/a+/g, 'a');
  result = result.replace(/i+/g, 'i');
  result = result.replace(/u+/g, 'u');
  result = result.replace(/a'a/g, 'a');
  result = result.replace(/al-/g, 'al-');
  
  return result;
}
