'use client';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { Download, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DownloadInvoice } from '../downloadInvoice';

function InvoiceBtn({ id }: { id: string }) {
  const [justDownloaded, setJustDownloaded] = useState(false);

  const mutation = useMutation({
    mutationFn: DownloadInvoice,
    onSuccess: (data) => {
      window.location.href = data as string;
      setJustDownloaded(true);
      toast.success('Invoice downloaded successfully', {
        id: 'invoice-download',
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    },
    onError: (error) => {
      toast.error('Failed to download invoice. Please try again later', {
        id: 'invoice-download',
        description: 'If the problem persists, contact support',
      });
    },
  });

  // Reset the success state after 3 seconds
  useEffect(() => {
    if (justDownloaded) {
      const timer = setTimeout(() => setJustDownloaded(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [justDownloaded]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`gap-2 transition-all hover:bg-primary/10 hover:text-primary ${
        justDownloaded ? 'text-green-600 hover:text-green-600' : 'text-muted-foreground'
      }`}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(id)}
    >
      {mutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">Downloading...</span>
        </>
      ) : justDownloaded ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          <span className="hidden sm:inline">Downloaded</span>
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Invoice</span>
          <Download className="h-3.5 w-3.5 opacity-60" />
        </>
      )}
    </Button>
  );
}

export default InvoiceBtn;
