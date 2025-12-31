"use client";

import React from "react";

const UtilitiesPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <h1 className="text-4xl font-bold mb-4">Utilities</h1>
      <p className="text-lg text-muted-foreground text-center max-w-md">
        This section will contain various utility tools to help you manage your business more efficiently, such as data import/export or bulk actions.
      </p>
    </div>
  );
};

export default UtilitiesPage;