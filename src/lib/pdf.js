import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPrice } from '@/lib/utils';

export function exportOffersToPdf(results) {
  const dates = Object.keys(results || {}).sort();
  const allFlights = dates.flatMap((date) => results[date] || []);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  drawCover(doc, pageWidth, allFlights.length);

  let cursorY = 122;

  dates.forEach((date) => {
    const flights = (results[date] || []).sort((a, b) => a.price - b.price);
    if (!flights.length) return;

    if (cursorY > pageHeight - 160) {
      doc.addPage();
      cursorY = 60;
    }

    const minPrice = flights.reduce((min, item) => (item.price < min ? item.price : min), flights[0].price);
    const title = `${dayjs(date).format('dddd, D MMMM YYYY')}  |  ${flights.length} offers  |  from ${formatPrice(minPrice, 'UZS')}`;

    doc.setFillColor(245, 247, 255);
    doc.roundedRect(28, cursorY, pageWidth - 56, 26, 5, 5, 'F');
    doc.setTextColor(30, 36, 80);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 36, cursorY + 17);

    cursorY += 34;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: 28, right: 28 },
      head: [['Airline', 'Flight', 'Route', 'Time', 'Duration', 'Stops', 'Fare', 'Baggage', 'Price']],
      body: flights.map((flight) => [
        flight.carrier_name || flight.carrier_code || '-',
        flight.flight_numbers || '-',
        `${flight.departure_airport || '-'} -> ${flight.arrival_airport || '-'}`,
        `${sliceTime(flight.departure_time)} - ${sliceTime(flight.arrival_time)}`,
        flight.duration_text || '-',
        formatStops(flight.stops ?? 0),
        flight.tariff || '-',
        flight.baggage || '-',
        formatPrice(flight.price, flight.currency || 'UZS'),
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 5,
        textColor: [40, 40, 40],
        lineColor: [225, 225, 225],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [39, 63, 154],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [250, 251, 255],
      },
      bodyStyles: {
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 115 },
        1: { cellWidth: 70 },
        2: { cellWidth: 85 },
        3: { cellWidth: 78 },
        4: { cellWidth: 70 },
        5: { cellWidth: 64 },
        6: { cellWidth: 65 },
        7: { cellWidth: 55 },
        8: { cellWidth: 88, halign: 'right' },
      },
    });

    cursorY = doc.lastAutoTable.finalY + 18;
  });

  if (!allFlights.length) {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(12);
    doc.text('No data to export', 40, 170);
  }

  doc.save(`flight-pricelist-${dayjs().format('YYYYMMDD-HHmm')}.pdf`);
}

function drawCover(doc, pageWidth, offersCount) {
  doc.setFillColor(39, 63, 154);
  doc.rect(0, 0, pageWidth, 90, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Flight Price List', 32, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Exported B2B flight offers', 32, 62);

  doc.setFillColor(242, 246, 255);
  doc.roundedRect(pageWidth - 210, 20, 178, 52, 8, 8, 'F');
  doc.setTextColor(30, 36, 80);
  doc.setFontSize(10);
  doc.text(`Generated: ${dayjs().format('DD.MM.YYYY HH:mm')}`, pageWidth - 198, 42);
  doc.text(`Total offers: ${offersCount}`, pageWidth - 198, 58);
}

function sliceTime(time) {
  if (!time) return '--:--';
  return String(time).slice(0, 5);
}

function formatStops(stops) {
  if (stops === 0) return 'Direct';
  if (stops === 1) return '1 stop';
  return `${stops} stops`;
}
