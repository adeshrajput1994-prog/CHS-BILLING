"use client";

import React from "react";

const SettingsPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <h1 className="text-4xl font-bold mb-4">Settings</h1>
      <p className="text-lg text-muted-foreground text-center max-w-md">
        Configure your application settings, personalize your experience, and manage user preferences from this page.
      </p>
    </div>
  );
};

export default SettingsPage;