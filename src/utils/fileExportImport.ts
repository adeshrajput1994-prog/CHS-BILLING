"use client";

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { showSuccess, showError } from './toast';

// --- Excel Export/Import Utilities ---

export const exportToExcel = <T extends object>(data: T[], filename: string, sheetName: string = 'Sheet1') => {
  if (!data || data.length === 0) {
    showError("No data to export to Excel.");
    return;
  }
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
    showSuccess(`Data exported to ${filename}.xlsx successfully!`);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    showError("Failed to export data to Excel.");
  }
};

export const importFromExcel = <T extends object>(file: File): Promise<T[] | null> => {
  return new Promise((resolve) => {
    if (!file) {
      showError("No file selected for import.");
      resolve(null);
      return;
    }
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showError("Please select an Excel file (.xlsx or .xls).");
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          showError("Failed to read file data.");
          resolve(null);
          return;
        }
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<T>(worksheet);
        showSuccess("Data imported from Excel successfully!");
        resolve(json);
      } catch (error) {
        console.error("Error importing from Excel:", error);
        showError("Failed to import data from Excel. Please ensure the file format is correct.");
        resolve(null);
      }
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      showError("Error reading the file.");
      resolve(null);
    };
    reader.readAsBinaryString(file);
  });
};

// --- PDF Export Utilities ---

export const exportToPdf = async (elementId: string, filename: string, title: string) => {
  const input = document.getElementById(elementId);
  if (!input) {
    showError("Element not found for PDF export.");
    return;
  }

  try {
    showSuccess("Generating PDF, please wait...");
    const canvas = await html2canvas(input, { scale: 2 }); // Increase scale for better quality
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
    showSuccess(`Data exported to ${filename}.pdf successfully!`);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    showError("Failed to export data to PDF.");
  }
};

// --- JSON Export/Import Utilities for full app data ---

export const exportToJson = (data: Record<string, any>, filename: string) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess(`Data exported to ${filename}.json successfully!`);
  } catch (error) {
    console.error("Error exporting to JSON:", error);
    showError("Failed to export data to JSON.");
  }
};

export const importFromJson = (file: File): Promise<Record<string, any> | null> => {
  return new Promise((resolve) => {
    if (!file) {
      showError("No file selected for import.");
      resolve(null);
      return;
    }
    if (!file.name.endsWith('.json')) {
      showError("Please select a JSON file (.json).");
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          showError("Failed to read file data.");
          resolve(null);
          return;
        }
        const json = JSON.parse(data as string);
        showSuccess("Data imported from JSON successfully!");
        resolve(json);
      } catch (error) {
        console.error("Error importing from JSON:", error);
        showError("Failed to import data from JSON. Please ensure the file format is correct.");
        resolve(null);
      }
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      showError("Error reading the file.");
      resolve(null);
    };
    reader.readAsText(file);
  });
};