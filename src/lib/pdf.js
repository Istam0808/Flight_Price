import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDuration, formatPrice, stopsLabel } from '@/lib/utils';

dayjs.locale('ru');

const FONT_BASE_URL = 'https://cdn.jsdelivr.net/gh/googlefonts/roboto@2.138/src/hinted';
const LOGO_URL = '/img/logo.png';
const BRAND_NAME = 'LUMINARA VOYAGE';
const BRAND_YELLOW = [245, 197, 24];
const BRAND_YELLOW_DARK = [212, 168, 15];
const BRAND_TEXT = [26, 22, 8];
const CARRIER_LOGO_MAX_WIDTH = 38;
const CARRIER_LOGO_MAX_HEIGHT = 26;
const CARRIER_LOGO_INSET = 4;
const CARRIER_TEXT_GAP = 10;
const CARRIER_CELL_LEFT_PADDING = CARRIER_LOGO_INSET + CARRIER_LOGO_MAX_WIDTH + CARRIER_TEXT_GAP;
let fontsCache = null;

export async function exportOffersToPdf(results, { from, to, startDate } = {}) {
  const dates = Object.keys(results || {}).sort();
  const allFlights = dates.flatMap((date) => results[date] || []);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  await ensurePdfFonts(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const logo = await loadPdfImage(LOGO_URL);
  const carrierLogoCache = await buildCarrierLogoCache(allFlights);

  const headerBottom = drawCover(doc, pageWidth, allFlights.length, logo);

  let cursorY = headerBottom + 32;

  dates.forEach((date) => {
    const flights = (results[date] || []).sort((a, b) => a.price - b.price);
    if (!flights.length) return;

    if (cursorY > pageHeight - 160) {
      doc.addPage();
      cursorY = 60;
    }

    const minPrice = flights.reduce((min, item) => (item.price < min ? item.price : min), flights[0].price);
    const title = formatSectionTitle(date, flights.length, minPrice);

    doc.setFillColor(245, 247, 255);
    doc.roundedRect(28, cursorY, pageWidth - 56, 28, 5, 5, 'F');
    doc.setTextColor(30, 36, 80);
    doc.setFontSize(11);
    doc.setFont('Roboto', 'bold');
    doc.text(title, 36, cursorY + 18);

    cursorY += 36;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: 28, right: 28 },
      head: [['Авиакомпания', 'Рейс', 'Маршрут', 'Время', 'В пути', 'Пересадки', 'Тариф', 'Багаж', 'Цена']],
      body: flights.map((flight) => [
        flight.carrier_name || flight.carrier_code || '—',
        flight.flight_numbers || '—',
        `${flight.departure_airport || '—'} → ${flight.arrival_airport || '—'}`,
        `${sliceTime(flight.departure_time)} – ${sliceTime(flight.arrival_time)}`,
        getDurationText(flight),
        stopsLabel(flight.stops ?? 0),
        flight.tariff || '—',
        flight.baggage || '—',
        formatPrice(flight.price, flight.currency || 'UZS'),
      ]),
      styles: {
        font: 'Roboto',
        fontSize: 9,
        cellPadding: 5,
        textColor: [40, 40, 40],
        lineColor: [225, 225, 225],
        lineWidth: 0.5,
      },
      headStyles: {
        font: 'Roboto',
        fillColor: BRAND_YELLOW,
        textColor: BRAND_TEXT,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [250, 251, 255],
      },
      bodyStyles: {
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 152 },
        1: { cellWidth: 68 },
        2: { cellWidth: 82 },
        3: { cellWidth: 76 },
        4: { cellWidth: 68 },
        5: { cellWidth: 62 },
        6: { cellWidth: 62 },
        7: { cellWidth: 52 },
        8: { cellWidth: 73, halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.column.index === 0 && data.section === 'body') {
          data.cell.styles.cellPadding = {
            top: 6,
            right: 5,
            bottom: 6,
            left: CARRIER_CELL_LEFT_PADDING,
          };
          data.cell.styles.minCellHeight = CARRIER_LOGO_MAX_HEIGHT + 10;
        }
      },
      didDrawCell: (data) => {
        if (data.column.index === 0 && data.section === 'body') {
          const flight = flights[data.row.index];
          drawCarrierBrand(doc, data.cell, flight, carrierLogoCache);
        }
      },
    });

    cursorY = doc.lastAutoTable.finalY + 18;
  });

  if (!allFlights.length) {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(12);
    doc.setFont('Roboto', 'normal');
    doc.text('Нет данных для экспорта', 40, 170);
  }

  doc.save(buildPdfFileName({ from, to, startDate, carrierCodes: collectCarrierCodes(results) }));
}

function collectCarrierCodes(results) {
  const codes = new Set();

  Object.values(results || {}).forEach((flights) => {
    (flights || []).forEach((flight) => {
      if (flight.carrier_code) {
        codes.add(String(flight.carrier_code).trim().toUpperCase());
      }
    });
  });

  return Array.from(codes).sort();
}

function buildPdfFileName({ from, to, startDate, carrierCodes = [] } = {}) {
  const normalizedFrom = String(from || '').trim().toUpperCase();
  const normalizedTo = String(to || '').trim().toUpperCase();
  const dateLabel = startDate ? dayjs(startDate).format('DD.MM.YYYY') : dayjs().format('DD.MM.YYYY');
  const carriersPart = carrierCodes.length ? `-${carrierCodes.join('-')}` : '';

  if (normalizedFrom && normalizedTo) {
    return `${normalizedFrom}-${normalizedTo}-${dateLabel}${carriersPart}.pdf`;
  }

  return `flight-pricelist-${dayjs().format('YYYYMMDD-HHmm')}${carriersPart}.pdf`;
}

async function buildCarrierLogoCache(flights) {
  const cache = new Map();
  const logoUrls = new Map();

  (flights || []).forEach((flight) => {
    const code = flight?.carrier_code;
    if (!code || logoUrls.has(code) || !flight.carrier_logo) return;
    logoUrls.set(code, flight.carrier_logo);
  });

  await Promise.all(
    [...logoUrls.entries()].map(async ([code, url]) => {
      try {
        const image = await loadCarrierLogoForPdf(url);

        if (image) {
          cache.set(code, image);
        }
      } catch {
        // skip broken logo, fallback initials will be used
      }
    }),
  );

  return cache;
}

async function loadCarrierLogoForPdf(src) {
  if (!src) return null;

  try {
    const response = await fetch(src);

    if (response.ok) {
      const blob = await response.blob();

      if (blob.size > 0) {
        const objectUrl = URL.createObjectURL(blob);

        try {
          const image = await rasterizeImageFromUrl(objectUrl);
          if (image) return image;
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }
  } catch {
    // try direct URL below
  }

  return rasterizeImageFromUrl(src);
}

function rasterizeImageFromUrl(src) {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      try {
        const { naturalWidth: width, naturalHeight: height } = image;

        if (!width || !height) {
          resolve(null);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          resolve(null);
          return;
        }

        context.drawImage(image, 0, 0);

        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          format: 'PNG',
          width,
          height,
        });
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function getCarrierInitials(code, name) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (normalizedCode.length >= 2) {
    return normalizedCode.slice(0, 2);
  }

  const normalizedName = String(name || '').trim();
  if (normalizedName.length >= 2) {
    return normalizedName.slice(0, 2).toUpperCase();
  }

  return '—';
}

function drawCarrierBrand(doc, cell, flight, carrierLogoCache) {
  const slotX = cell.x + CARRIER_LOGO_INSET;
  const logo = flight?.carrier_code ? carrierLogoCache.get(flight.carrier_code) : null;

  if (logo) {
    try {
      const size = getContainedImageSize(logo, CARRIER_LOGO_MAX_WIDTH, CARRIER_LOGO_MAX_HEIGHT);
      const x = slotX + (CARRIER_LOGO_MAX_WIDTH - size.width) / 2;
      const y = cell.y + (cell.height - size.height) / 2;
      doc.addImage(logo.dataUrl, logo.format, x, y, size.width, size.height);
      return;
    } catch {
      // fallback below
    }
  }

  drawCarrierFallback(
    doc,
    slotX,
    cell.y + (cell.height - CARRIER_LOGO_MAX_HEIGHT) / 2,
    flight?.carrier_code,
    flight?.carrier_name,
  );
}

function drawCarrierFallback(doc, x, y, code, name) {
  doc.setFillColor(232, 235, 245);
  doc.roundedRect(x, y, CARRIER_LOGO_MAX_HEIGHT, CARRIER_LOGO_MAX_HEIGHT, 3, 3, 'F');
  doc.setTextColor(74, 86, 128);
  doc.setFontSize(9);
  doc.setFont('Roboto', 'bold');
  doc.text(
    getCarrierInitials(code, name),
    x + CARRIER_LOGO_MAX_HEIGHT / 2,
    y + CARRIER_LOGO_MAX_HEIGHT / 2 + 2,
    { align: 'center' },
  );
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(40, 40, 40);
}

async function ensurePdfFonts(doc) {
  if (!fontsCache) {
    const [regular, bold] = await Promise.all([
      fetch(`${FONT_BASE_URL}/Roboto-Regular.ttf`).then((response) => response.arrayBuffer()),
      fetch(`${FONT_BASE_URL}/Roboto-Bold.ttf`).then((response) => response.arrayBuffer()),
    ]);

    fontsCache = {
      regular: arrayBufferToBase64(regular),
      bold: arrayBufferToBase64(bold),
    };
  }

  doc.addFileToVFS('Roboto-Regular.ttf', fontsCache.regular);
  doc.addFileToVFS('Roboto-Bold.ttf', fontsCache.bold);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

async function loadPdfImage(src) {
  try {
    const response = await fetch(src);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    const dimensions = await getImageDimensions(dataUrl);

    return { dataUrl, ...dimensions };
  } catch {
    return null;
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = src;
  });
}

function getContainedImageSize(image, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);

  return {
    width: image.width * ratio,
    height: image.height * ratio,
  };
}

function drawCover(doc, pageWidth, offersCount, logo) {
  const headerHeight = 150;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  doc.setFillColor(...BRAND_YELLOW_DARK);
  doc.rect(0, headerHeight - 3, pageWidth, 3, 'F');

  doc.setTextColor(...BRAND_TEXT);
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(20);

  if (logo) {
    const logoSize = getContainedImageSize(logo, 150, 112);
    doc.addImage(logo.dataUrl, 'PNG', 32, 18, logoSize.width, logoSize.height);
    doc.text('Прайс-лист рейсов', 32 + logoSize.width + 24, 64);
  } else {
    doc.text(BRAND_NAME, 32, 58);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(11);
    doc.text('Прайс-лист рейсов', 32, 78);
  }

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(11);

  doc.setFillColor(255, 252, 235);
  doc.roundedRect(pageWidth - 230, 48, 198, 52, 8, 8, 'F');
  doc.setTextColor(...BRAND_TEXT);
  doc.setFontSize(10);
  doc.text(`Сформирован: ${dayjs().format('DD.MM.YYYY HH:mm')}`, pageWidth - 218, 70);
  doc.text(`Всего предложений: ${offersCount}`, pageWidth - 218, 86);

  return headerHeight;
}

function formatSectionTitle(date, count, minPrice) {
  const dateLabel = capitalize(dayjs(date).format('dddd, D MMMM YYYY'));
  return `${dateLabel}  ·  ${offersLabel(count)}  ·  от ${formatPrice(minPrice, 'UZS')}`;
}

function offersLabel(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return `${count} предложение`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} предложения`;
  return `${count} предложений`;
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getDurationText(flight) {
  if (flight.duration_minutes) {
    return formatDuration(flight.duration_minutes);
  }

  return flight.duration_text || '—';
}

function sliceTime(time) {
  if (!time) return '--:--';
  return String(time).slice(0, 5);
}
