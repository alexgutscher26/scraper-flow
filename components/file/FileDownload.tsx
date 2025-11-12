"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileIcon } from "lucide-react";

interface FileDownloadProps {
  base64Data: string;
  fileName?: string;
  fileSize?: number;
}

/**
 * Component for displaying file data with a download button
 */
export const FileDownload = ({
  base64Data,
  fileName = "downloaded_file",
  fileSize,
}: FileDownloadProps) => {
  // Get file extension from filename or default to .bin
  const getFileExtension = () => {
    if (fileName.includes(".")) {
      return fileName.split(".").pop() || "bin";
    }
    return "bin";
  };

  // Get MIME type based on file extension
  const getMimeType = () => {
    const extension = getFileExtension().toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      pdf: "application/pdf",
      txt: "text/plain",
      json: "application/json",
      csv: "text/csv",
      xml: "application/xml",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
    };
    return mimeTypes[extension] || "application/octet-stream";
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Calculate approximate file size from base64 if not provided
  const approximateFileSize =
    fileSize || Math.round((base64Data.length * 3) / 4);

  const handleDownload = () => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: getMimeType() });

      // Create download link
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = fileName;

      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      // Fallback to data URL method
      const dataUrl = `data:${getMimeType()};base64,${base64Data}`;
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileIcon className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(approximateFileSize)} •{" "}
                {getFileExtension().toUpperCase()} File
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="shrink-0"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileDownload;
