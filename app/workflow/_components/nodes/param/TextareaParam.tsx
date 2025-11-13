"use client";
import React, { useEffect, useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { ParamProps } from "@/types/appNode";
import { Textarea } from "@/components/ui/textarea";

function TextareaParam({
  param,
  value,
  updateNodeParamValue,
  disabled,
}: ParamProps) {
  const [internalValue, setInternalValue] = useState(value || "");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const id = useId();

  useEffect(() => {
    setInternalValue(value || "");
  }, [value]);

  return (
    <div className="space-y-1 p-1 w-full">
      <Label htmlFor={id} className="text-xs flex">
        {param.name}
        {param.required && <p className="text-red-400 px-2">*</p>}
      </Label>
      <Textarea
        id={id}
        disabled={disabled}
        className={`text-xs min-h-[80px] resize-vertical ${error ? "border-red-400" : ""}`}
        value={internalValue}
        placeholder="Enter text here..."
        onChange={(e) => setInternalValue(e.target.value)}
        onBlur={(e) => {
          const v = e.target.value;
          // Basic client-side validation for Files list
          if (param.name === "Files") {
            const items = (v || "")
              .split(/\n|,/) // split by newline or comma
              .map((s) => s.trim())
              .filter(Boolean);
            if (!items.length) {
              setError("At least one file path is required");
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
      {param.helperText && (
        <p className="text-xs text-muted-foreground">{param.helperText}</p>
      )}
      {info && <p className="text-xs text-muted-foreground">{info}</p>}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

export default TextareaParam;
