import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export const formatCurrency = (amount) => {
  // Validate and sanitize the amount
  const numAmount = Number(amount);

  // Return formatted zero if amount is invalid
  if (!amount || isNaN(numAmount) || !isFinite(numAmount)) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(0);
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(numAmount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const exportToPDF = (data, title, columns) => {
  const doc = new jsPDF();

  // Set font
  doc.setFont("helvetica", "normal");

  // Title
  doc.setFontSize(16);
  doc.text(title, 20, 20);

  // Date
  doc.setFontSize(10);
  doc.text(`Tanggal: ${formatDate(new Date())}`, 20, 30);

  // Table headers
  let yPos = 50;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");

  columns.forEach((col, index) => {
    doc.text(col.title, 20 + index * 40, yPos);
  });

  // Table data
  yPos += 10;
  doc.setFont("helvetica", "normal");

  data.forEach((row, rowIndex) => {
    if (yPos > 280) {
      doc.addPage();
      yPos = 20;
    }

    columns.forEach((col, colIndex) => {
      let value = row[col.key];
      if (col.format === "currency") {
        value = formatCurrency(value);
      } else if (col.format === "date") {
        value = formatDate(value);
      }

      doc.text(String(value || ""), 20 + colIndex * 40, yPos);
    });

    yPos += 10;
  });

  // Save
  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
};

export const exportToExcel = (data, title, columns) => {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare data for Excel
  const excelData = data.map((row) => {
    const excelRow = {};
    columns.forEach((col) => {
      let value = row[col.key];
      if (col.format === "currency") {
        value = Number(value) || 0;
      } else if (col.format === "date") {
        value = new Date(value);
      }
      excelRow[col.title] = value;
    });
    return excelRow;
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, title);

  // Save file
  XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, "-")}.xlsx`);
};

export const validateInput = {
  required: (value) => !!value || "Field ini wajib diisi",
  email: (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value) || "Format email tidak valid";
  },
  minAmount: (value, min = 1000) => {
    const num = Number(value);
    return num >= min || `Minimal ${formatCurrency(min)}`;
  },
  positiveNumber: (value) => {
    const num = Number(value);
    return num > 0 || "Harus berupa angka positif";
  },
  integer: (value) => {
    const num = Number(value);
    return Number.isInteger(num) || "Harus berupa angka bulat";
  },
};
