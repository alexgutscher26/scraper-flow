'use client';
import React, { useEffect, useId, useState } from 'react';
import { Label } from '@/components/ui/label';
import { ParamProps } from '@/types/appNode';
import { Textarea } from '@/components/ui/textarea';

function TextareaParam({ param, value, updateNodeParamValue, disabled }: ParamProps) {
  const [internalValue, setInternalValue] = useState(value || '');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const id = useId();

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  return (
    <div className="w-full space-y-1 p-1">
      <Label htmlFor={id} className="flex text-xs">
        {param.name}
        {param.required && <p className="px-2 text-red-400">*</p>}
      </Label>
      <Textarea
        id={id}
        disabled={disabled}
        className={`resize-vertical min-h-[80px] text-xs ${error ? 'border-red-400' : ''}`}
        value={internalValue}
        placeholder="Enter text here..."
        onChange={(e) => setInternalValue(e.target.value)}
        onBlur={(e) => {
          const v = e.target.value;
          // Basic client-side validation for Files list
          if (param.name === 'Files') {
            const items = (v || '')
              .split(/\n|,/) // split by newline or comma
              .map((s) => s.trim())
              .filter(Boolean);
            if (!items.length) {
              setError('At least one file path is required');
              setInfo(null);
            } else {
              setError(null);
              setInfo(`${items.length} file(s) listed`);
            }
          } else {
            setError(null);
            setInfo(null);
          }
          updateNodeParamValue(v);
        }}
        rows={4}
      />
      {param.helperText && <p className="text-xs text-muted-foreground">{param.helperText}</p>}
      {info && <p className="text-xs text-muted-foreground">{info}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default TextareaParam;
