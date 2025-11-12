"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Image from "next/image";

interface ScreenshotDownloadProps {
  dataUrl: string;
  fileName?: string;
}

/**
 * Component for displaying a screenshot with a download button
 */
export const ScreenshotDownload = ({
  dataUrl,
  fileName = "screenshot",
}: ScreenshotDownloadProps) => {
  // Add proper file extension based on image type
  const getFileNameWithExtension = () => {
    const extension = dataUrl.startsWith("data:image/jpeg") ? ".jpg" : ".png";
    return `${fileName}${extension}`;
  };

  const handleDownload = () => {
    // Create an anchor element
    const downloadLink = document.createElement("a");

    // Set the href to the data URL
    downloadLink.href = dataUrl;

    // Set the download attribute with the filename
    downloadLink.download = getFileNameWithExtension();

    // Append the anchor to the body
    document.body.appendChild(downloadLink);

    // Trigger the download
    downloadLink.click();

    // Clean up
    document.body.removeChild(downloadLink);
  };
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative border rounded-lg overflow-hidden shadow-sm">
        {/* 
          We must use the regular img tag here because Next.js Image component
          doesn't support data URLs. This is a specific use case for screenshots
          that are stored as base64 data URLs.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={`Screenshot: ${fileName}`}
          className="max-w-full h-auto"
          style={{ maxHeight: "300px" }}
        />
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-2 right-2 bg-background/80 hover:bg-background"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </div>
    </div>
  );
};

export default ScreenshotDownload;
