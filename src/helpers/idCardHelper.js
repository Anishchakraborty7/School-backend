import QRCode from 'qrcode';

// Code-39 character mapping for vector barcode rendering
const code39Map = {
  '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
  '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
  '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
  'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
  'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
  'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
  'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
  'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
  'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
  '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101'
};


export function generateBarcodeSVG(text) {
  // Clean text, replace underscores with hyphens, and pad with start/stop asterisk (*)
  const cleanText = text.replace(/_/g, '-').replace(/[^A-Z0-9\-\.\s\*\+\$\/\%]/gi, '').toUpperCase();
  const upperText = `*${cleanText}*`;
  let bits = '';
  
  for (let i = 0; i < upperText.length; i++) {
    const char = upperText[i];
    const pattern = code39Map[char] || code39Map[' '];
    bits += pattern + '0'; // 0-bit separator between characters
  }

  const height = 45;
  const width = bits.length * 1.5;
  let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;

  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      svg += `<rect x="${i * 1.5}" y="2" width="1.5" height="${height - 4}" fill="#000000"/>`;
    }
  }
  
  svg += `</svg>`;
  return svg;
}

export async function generateQrCodeBase64(text) {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 100,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return '';
  }
}
