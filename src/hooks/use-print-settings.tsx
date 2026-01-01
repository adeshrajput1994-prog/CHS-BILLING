"use client";

import { useState, useEffect } from "react";

export function usePrintSettings() {
  const [printInHindi, setPrintInHindi] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("printInHindi");
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("printInHindi", JSON.stringify(printInHindi));
  }, [printInHindi]);

  return { printInHindi, setPrintInHindi };
}