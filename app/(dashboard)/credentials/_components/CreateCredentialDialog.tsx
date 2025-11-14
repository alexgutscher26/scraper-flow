/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldEllipsis, Mail, Key, Settings, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import CustomDialogHeader from '@/components/CustomDialogHeader';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { CreateCredential } from '@/actions/credentials/createCredential';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  createCredentialSchema,
  createCredentialSchemaType,
  CredentialType,
  CredentialTypeValue,
  twoFactorMethod,
} from '@/schema/credential';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  triggerText?: string;
}

// Type-specific default values
const getDefaultDataForType = (type: CredentialTypeValue) => {
  switch (type) {
    case CredentialType.SMTP_EMAIL:
      return { email: '', password: '' };
    case CredentialType.API_KEY:
      return { apiKey: '', apiSecret: '', baseUrl: '', headers: {} };
    case CredentialType.TWO_FACTOR:
      return { method: twoFactorMethod.TOTP, secret: '', period: 30, digits: 6, recoveryCodes: [] };
    case CredentialType.CUSTOM:
      return { value: '' };
    default:
      return {};
  }
};

export default function CreateCredentialDialog({ triggerText }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<CredentialTypeValue>(CredentialType.SMTP_EMAIL);

  const form = useForm<createCredentialSchemaType>({
    resolver: zodResolver(createCredentialSchema),
    defaultValues: {
      name: '',
      description: '',
      credentialData: {
        type: CredentialType.SMTP_EMAIL,
        data: getDefaultDataForType(CredentialType.SMTP_EMAIL),
      },
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: CreateCredential,
    onSuccess: () => {
      toast.success('Credential created successfully', { id: 'create-credential' });
      handleReset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create credential', { id: 'create-credential' });
    },
  });

  const handleReset = useCallback(() => {
    const defaultType = CredentialType.SMTP_EMAIL;
    form.reset({
      name: '',
      description: '',
      credentialData: {
        type: defaultType,
        data: getDefaultDataForType(defaultType),
      },
    });
    setSelectedType(defaultType);
  }, [form]);

  const onSubmit = useCallback(
    (values: createCredentialSchemaType) => {
      toast.loading('Creating credential...', { id: 'create-credential' });
      mutate(values);
    },
    [mutate]
  );

  const handleTypeChange = useCallback(
    (type: CredentialTypeValue) => {
      setSelectedType(type);
      form.setValue('credentialData.type', type);
      form.setValue('credentialData.data', getDefaultDataForType(type) as any);
    },
    [form]
  );

  const credentialTypes = useMemo(
    () => [
      {
        value: CredentialType.SMTP_EMAIL,
        label: 'Gmail Account',
        description: 'Connect your Gmail account for sending emails',
        icon: Mail,
      },
      {
        value: CredentialType.API_KEY,
        label: 'API Key / Captcha Provider',
        description: 'API authentication (2Captcha, AntiCaptcha, etc.)',
        icon: Key,
      },
      {
        value: CredentialType.TWO_FACTOR,
        label: 'Two-Factor Authentication',
        description: 'TOTP, SMS or Email 2FA',
        icon: ShieldEllipsis,
      },
      {
        value: CredentialType.CUSTOM,
        label: 'Custom Credential',
        description: 'Custom credential format',
        icon: Settings,
      },
    ],
    []
  );

  const currentMethod = form.watch('credentialData.data.method');

  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case CredentialType.SMTP_EMAIL:
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Gmail Only:</strong> Currently only Gmail accounts (@gmail.com or
                @googlemail.com) are supported. You'll need to use an App Password, not your regular
                Gmail password.{' '}
                <a
                  href="https://support.google.com/accounts/answer/185833"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Learn how to create one →
                </a>
              </AlertDescription>
            </Alert>

            <FormField
              control={form.control}
              name="credentialData.data.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gmail Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your-email@gmail.com" {...field} />
                  </FormControl>
                  <FormDescription>Only Gmail addresses are supported</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credentialData.data.password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gmail App Password *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="15-16 character app password"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value.replace(/\s+/g, ''))}
                    />
                  </FormControl>
                  <FormDescription>
                    Use an App Password, not your regular Gmail password
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case CredentialType.API_KEY:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="credentialData.data.apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Your API key" {...field} />
                  </FormControl>
                  <FormDescription>
                    API key from your service provider (e.g., 2Captcha, AntiCaptcha)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credentialData.data.apiSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Secret (Optional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="API secret if required" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credentialData.data.baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    API endpoint URL (e.g., https://api.2captcha.com)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case CredentialType.TWO_FACTOR:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="credentialData.data.method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>2FA Method *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select 2FA method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={twoFactorMethod.TOTP}>Authenticator App (TOTP)</SelectItem>
                      <SelectItem value={twoFactorMethod.SMS}>SMS Verification</SelectItem>
                      <SelectItem value={twoFactorMethod.EMAIL}>Email Verification</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentMethod === twoFactorMethod.TOTP && (
              <>
                <FormField
                  control={form.control}
                  name="credentialData.data.secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TOTP Secret Key *</FormLabel>
                      <FormControl>
                        <Input placeholder="Base32 secret key" {...field} />
                      </FormControl>
                      <FormDescription>
                        The Base32 secret from your authenticator app setup
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="credentialData.data.period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period (seconds)</FormLabel>
                        <FormControl>
                          <Input type="number" min={15} max={60} {...field} />
                        </FormControl>
                        <FormDescription>Usually 30</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="credentialData.data.digits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code Length</FormLabel>
                        <FormControl>
                          <Input type="number" min={6} max={8} {...field} />
                        </FormControl>
                        <FormDescription>Usually 6</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {currentMethod === twoFactorMethod.SMS && (
              <>
                <FormField
                  control={form.control}
                  name="credentialData.data.phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 555 123 4567" {...field} />
                      </FormControl>
                      <FormDescription>Include country code (e.g., +1 for US)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="credentialData.data.provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMS Provider (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Twilio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="credentialData.data.apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider API Key (Optional)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="API key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {currentMethod === twoFactorMethod.EMAIL && (
              <FormField
                control={form.control}
                name="credentialData.data.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormDescription>Email address where 2FA codes are sent</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        );

      case CredentialType.CUSTOM:
        return (
          <FormField
            control={form.control}
            name="credentialData.data.value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credential Data *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='{"key": "value"} or any custom format'
                    className="min-h-[120px] resize-none font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter custom credential data. JSON format recommended for structured data.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(onSubmit)(e);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerText ?? 'Create Credential'}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto px-0">
        <CustomDialogHeader icon={ShieldEllipsis} title="Create Credential" />

        <div className="px-6 pb-6">
          <Form {...form}>
            <div className="space-y-6" onSubmit={handleFormSubmit}>
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credential Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., My Gmail Account" {...field} />
                      </FormControl>
                      <FormDescription>
                        A unique, descriptive name for this credential
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Additional notes about this credential" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Credential Type Selection */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Credential Type</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Select the type of credential you want to store
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {credentialTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.value;

                    return (
                      <Card
                        key={`${type.value}-${type.label}`}
                        className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-muted hover:border-primary/30'
                        }`}
                        onClick={() => handleTypeChange(type.value)}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : ''}`} />
                            {type.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <CardDescription className="text-xs leading-relaxed">
                            {type.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Type-specific Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {credentialTypes.find((t) => t.value === selectedType)?.label} Details
                </h3>
                {renderTypeSpecificFields()}
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={isPending}
                onClick={handleFormSubmit}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Credential'
                )}
              </Button>
            </div>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
