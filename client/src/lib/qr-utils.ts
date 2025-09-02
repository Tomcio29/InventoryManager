// QR Code generation utility using the qrcode library
import QRCode from 'qrcode';

export async function generateQRCode(text: string, canvas: HTMLCanvasElement): Promise<void> {
  try {
    // Set canvas size for high quality
    canvas.width = 256;
    canvas.height = 256;

    // Generate real QR code with error correction
    await QRCode.toCanvas(canvas, text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    
    // Fallback: draw error message on canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QR Error', canvas.width / 2, canvas.height / 2);
    }
  }
}

// Generate QR code as data URL for download/print
export async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });
  } catch (error) {
    console.error('Error generating QR code data URL:', error);
    return '';
  }
}
