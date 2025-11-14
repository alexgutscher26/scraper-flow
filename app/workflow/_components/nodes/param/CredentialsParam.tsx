'use client';
import React, { useId } from 'react';
import { Label } from '@/components/ui/label';
import { ParamProps } from '@/types/appNode';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { GetCredentialsForUser } from '@/actions/credentials/getCredentialsForUser';
import { Badge } from '@/components/ui/badge';
import { Mail, Key, Settings, ShieldCheck } from 'lucide-react';
import { CredentialType, CredentialTypeValue } from '@/schema/credential';

export default function CredentialsParam({ param, value, updateNodeParamValue }: ParamProps) {
  const id = useId();

  const query = useQuery({
    queryKey: ['credentials-for-user'],
    queryFn: () => GetCredentialsForUser(),
    refetchInterval: 10000,
  });
  const getCredentialIcon = (type: CredentialTypeValue) => {
    switch (type) {
      case CredentialType.SMTP_EMAIL:
        return <Mail className="h-4 w-4" />;
      case CredentialType.API_KEY:
        return <Key className="h-4 w-4" />;
      case CredentialType.CUSTOM:
        return <Settings className="h-4 w-4" />;
      default:
        return <ShieldCheck className="h-4 w-4" />;
    }
  };
  const getCredentialTypeLabel = (type: CredentialTypeValue) => {
    switch (type) {
      case CredentialType.SMTP_EMAIL:
        return 'Gmail';
      case CredentialType.API_KEY:
        return 'API Key';
      case CredentialType.CUSTOM:
        return 'Custom';
      default:
        return 'Unknown';
    }
  };
  return (
    <div className="flex w-full flex-col gap-1">
      <Label htmlFor={id} className="flex text-xs">
        {param.name}
        {param.required && <p className="px-2 text-red-400">*</p>}
      </Label>
      <Select defaultValue={value} onValueChange={(value) => updateNodeParamValue(value)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an option" />{' '}
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Credentials</SelectLabel>
              {query.data?.map((credential) => {
                return (
                  <SelectItem key={credential.id} value={credential.id}>
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCredentialIcon(credential.type as CredentialTypeValue)}
                        <span>{credential.name}</span>
                      </div>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {getCredentialTypeLabel(credential.type as CredentialTypeValue)}
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </SelectTrigger>{' '}
      </Select>
      {param.helperText && <p className="px-2 text-xs text-muted-foreground">{param.helperText}</p>}
    </div>
  );
}
