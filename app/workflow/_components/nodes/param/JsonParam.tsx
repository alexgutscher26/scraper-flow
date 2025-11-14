'use client';
import React, { useEffect, useId, useState } from 'react';
import { Label } from '@/components/ui/label';
import { ParamProps } from '@/types/appNode';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

function JsonParam({ param, value, updateNodeParamValue, disabled }: ParamProps) {
  const [internalValue, setInternalValue] = useState(value || '');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const id = useId();

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const validateJson = (jsonString: string) => {
    if (!jsonString.trim()) {
      setJsonError(null);
      return true;
    }

    try {
      JSON.parse(jsonString);
      setJsonError(null);
      return true;
    } catch (error) {
      setJsonError('Invalid JSON format');
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    validateJson(newValue);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (validateJson(newValue)) {
      updateNodeParamValue(newValue);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(internalValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setInternalValue(formatted);
      updateNodeParamValue(formatted);
      setJsonError(null);
    } catch (error) {
      setJsonError('Cannot format invalid JSON');
    }
  };

  return (
    <div className="w-full space-y-1 p-1">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="flex text-xs">
          {param.name}
          {param.required && <p className="px-2 text-red-400">*</p>}
        </Label>
        {internalValue && !jsonError && (
          <button
            type="button"
            onClick={formatJson}
            className="text-xs text-blue-500 hover:text-blue-700"
            disabled={disabled}
          >
            Format
          </button>
        )}
      </div>
      <Textarea
        id={id}
        disabled={disabled}
        className={`resize-vertical min-h-[120px] font-mono text-xs ${
          jsonError ? 'border-red-500' : ''
        }`}
        value={internalValue}
        placeholder='{"key": "value"}'
        onChange={handleChange}
        onBlur={handleBlur}
        rows={6}
      />
      {jsonError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{jsonError}</AlertDescription>
        </Alert>
      )}
      {param.helperText && <p className="text-xs text-muted-foreground">{param.helperText}</p>}
    </div>
  );
}

export default JsonParam;
