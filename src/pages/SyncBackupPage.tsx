"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, FileText, Store, QrCode } from "lucide-react";

const SyncBackupPage: React.FC = () => {
  return (
    <div className="space-y-8 p-4">
      <h1 className="text-4xl font-bold text-center mb-6">Sync, Share & Backup</h1>
      <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
        Manage data synchronization, share your business data, and configure backup options to keep your information safe and accessible.
        The advanced sharing and online store features described below require a backend database and API integrations to function.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Transaction Sharing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Transaction Sharing</CardTitle>
            <Share2 className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Send Invoices, Estimates, and Payment Reminders directly via WhatsApp, Email, or SMS.
            </CardDescription>
            <Button variant="outline" className="w-full" disabled>
              Share Transactions (Requires Backend)
            </Button>
          </CardContent>
        </Card>

        {/* Report Sharing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Report Sharing</CardTitle>
            <FileText className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Share all 50+ reports (Profit & Loss, Stock Summary, Party Ledger) in PDF or Excel (.xlsx) formats.
            </CardDescription>
            <Button variant="outline" className="w-full" disabled>
              Share Reports (Requires Backend)
            </Button>
          </CardContent>
        </Card>

        {/* Online Store Link */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Online Store Link</CardTitle>
            <Store className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Share your "Online Store" link via social media so customers can view your catalog and place orders directly.
            </CardDescription>
            <Button variant="outline" className="w-full" disabled>
              Manage Online Store (Requires Backend)
            </Button>
          </CardContent>
        </Card>

        {/* Payment Links */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Payment Links</CardTitle>
            <QrCode className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Share UPI QR codes or payment links for easy collection of payments.
            </CardDescription>
            <Button variant="outline" className="w-full" disabled>
              Generate Payment Links (Requires Backend)
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8">
        <p className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          To enable these advanced features, you need to add a backend database to your application.
        </p>
      </div>
    </div>
  );
};

export default SyncBackupPage;