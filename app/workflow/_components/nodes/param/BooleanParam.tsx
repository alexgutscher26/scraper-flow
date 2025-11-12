"use client";
import React, { useEffect, useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { ParamProps } from "@/types/appNode";
import { Switch } from "@/components/ui/switch";

function BooleanParam({
  param,
  value,
  updateNodeParamValue,
  disabled,
}: ParamProps) {
  const [internalValue, setInternalValue] = useState(value === "true");
  const id = useId();

  useEffect(() => {
    setInternalValue(value === "true");
  }, [value]);

  const handleChange = (checked: boolean) => {
    setInternalValue(checked);
    updateNodeParamValue(checked.toString());
  };

  return (
    <div className="space-y-1 p-1 w-full">
      <Label htmlFor={id} className="text-xs flex">
        {param.name}
        {param.required && <p className="text-red-400 px-2">*</p>}
      </Label>
      <div className="flex items-center space-x-2">
        <Switch
          id={id}
          checked={internalValue}
          onCheckedChange={handleChange}
          disabled={disabled}
        />
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {internalValue ? "True" : "False"}
        </Label>
      </div>
      {param.helperText && (
        <p className="text-xs text-muted-foreground">{param.helperText}</p>
      )}
    </div>
  );
}

export default BooleanParam;
