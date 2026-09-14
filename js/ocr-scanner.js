/* =========================================================
   Receipt & Screenshot OCR Scanner (Yape, Plin, Tarjetas, POS)
   ========================================================= */

class ReceiptScannerEngine {
  constructor() {
    this.currentScannedData = null;
    this.currentImageBase64 = null;
  }

  async processImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        this.currentImageBase64 = base64;

        try {
          // Send to backend OCR scanner
          const scanned = await window.BudgetAPI.scanReceipt({
            filename: file.name,
            rawText: file.name + ' ' + (file.type || ''),
            imageBase64: base64
          });

          this.currentScannedData = scanned || this.fallbackExtract(file.name);
          resolve(this.currentScannedData);
        } catch (err) {
          console.warn('OCR error, using local fallback:', err);
          this.currentScannedData = this.fallbackExtract(file.name);
          resolve(this.currentScannedData);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  fallbackExtract(filename) {
    const fn = (filename || '').toLowerCase();
    let method = 'Yape';
    let concept = 'Pago de consumo';
    let amount = 28.50;
    let categoryTitle = 'GASTOS ESENCIALES';
    let isAvoidable = false;

    if (fn.includes('plin')) method = 'Plin';
    if (fn.includes('bcp') || fn.includes('tarjeta') || fn.includes('visa')) method = 'Tarjeta';
    if (fn.includes('starbucks') || fn.includes('cine') || fn.includes('cafe')) {
      concept = 'Café / Salida con amigos';
      categoryTitle = 'PLANIFICACIÓN';
      isAvoidable = true;
      amount = 32.00;
    } else if (fn.includes('menu') || fn.includes('almuerzo')) {
      concept = 'Almuerzo diario';
      categoryTitle = 'GASTOS ESENCIALES';
      amount = 22.00;
    } else if (fn.includes('taxi') || fn.includes('uber')) {
      concept = 'Viaje en Taxi';
      categoryTitle = 'GASTOS ESENCIALES';
      amount = 16.00;
    }

    return {
      amount,
      paymentMethod: method,
      concept,
      categoryTitle,
      isAvoidable,
      date: new Date().toISOString()
    };
  }
}

window.receiptScanner = new ReceiptScannerEngine();
