"use client";
import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldEllipsis, Mail, Key, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import CustomDialogHeader from "@/components/CustomDialogHeader";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { CreateCredential } from "@/actions/credentials/createCredential";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createCredentialSchema,
  createCredentialSchemaType,
  CredentialType,
  CredentialTypeValue,
  twoFactorMethod,
} from "@/schema/credential";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  triggerText?: string;
}

export default function CreateCredentialDialog(props: Props) {
  const { triggerText } = props;
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<CredentialTypeValue>(
    CredentialType.SMTP_EMAIL
  );
  const form = useForm<createCredentialSchemaType>({
    resolver: zodResolver(createCredentialSchema),
    defaultValues: {
      name: "",
      description: "",
      credentialData: {
        type: CredentialType.SMTP_EMAIL,
        data: {
          email: "",
          password: "",
        },
      },
    },
  });
  const { mutate, isPending } = useMutation({
    mutationFn: CreateCredential,
    onSuccess: () => {
      toast.success("Credential created successfully", {
        id: "create-credential",
      });
      form.reset({
        name: "",
        description: "",
        credentialData: {
          type: CredentialType.SMTP_EMAIL,
          data: {
            email: "",
            password: "",
          },
        },
      });
      setSelectedType(CredentialType.SMTP_EMAIL);
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create credential", {
        id: "create-credential",
      });
    },
  });

  const onSubmit = useCallback(
    (values: createCredentialSchemaType) => {
      toast.loading("Creating credential...", {
        id: "create-credential",
      });
      mutate(values);
    },
    [mutate]
  );
  const handleTypeChange = (type: CredentialTypeValue) => {
    setSelectedType(type);
    form.setValue("credentialData.type", type);

    // Reset the data with appropriate default values based on type
    switch (type) {
      case CredentialType.SMTP_EMAIL:
        form.setValue("credentialData.data", {
          email: "",
          password: "",
        });
        break;
      case CredentialType.API_KEY:
        form.setValue("credentialData.data", {
          apiKey: "",
          apiSecret: "",
          baseUrl: "",
          headers: {},
        });
        break;
      case CredentialType.TWO_FACTOR:
        form.setValue("credentialData.data", {
          method: twoFactorMethod.TOTP,
          secret: "",
          period: 30,
          digits: 6,
          recoveryCodes: [],
        });
        break;
      case CredentialType.CUSTOM:
        form.setValue("credentialData.data", {
          value: "",
        });
        break;
    }
  };
  const credentialTypes = [
    {
      value: CredentialType.SMTP_EMAIL,
      label: "Gmail Account",
      description: "Connect your Gmail account for sending emails (Gmail only)",
      icon: Mail,
    },
    {
      value: CredentialType.API_KEY,
      label: "API Key",
      description: "API authentication credentials",
      icon: Key,
    },
    {
      value: CredentialType.API_KEY,
      label: "Captcha Provider",
      description: "2Captcha, AntiCaptcha or similar service API key",
      icon: Key,
    },
    {
      value: CredentialType.TWO_FACTOR,
      label: "Two-Factor Authentication",
      description: "TOTP (authenticator), SMS or Email",
      icon: ShieldEllipsis,
    },
    {
      value: CredentialType.CUSTOM,
      label: "Custom",
      description: "Custom credential format",
      icon: Settings,
    },
  ];

  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case CredentialType.SMTP_EMAIL:
        return (
          <div className="space-y-4">
            {" "}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Gmail Only:</strong> Currently only Gmail email accounts
                are supported for SMTP configuration. Please use a Gmail address
                (@gmail.com or @googlemail.com) to send emails.
              </p>
            </div>
            {/* <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Setup Instructions:</strong>
                <br />
                1. Use your Gmail address (@gmail.com)
                <br />
                2. Enable 2-Factor Authentication in your Google Account
                <br />
                3. Generate an App Password (not your regular Gmail password)
                <br />
                4. Use the App Password in the password field below
              </p>
            </div> */}
            <FormField
              control={form.control}
              name="credentialData.data.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gmail Address *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your-email@gmail.com"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value); // Show warning if not a Gmail address
                        if (
                          value &&
                          !value.toLowerCase().includes("@gmail.com") &&
                          !value.toLowerCase().includes("@googlemail.com")
                        ) {
                          // This will be handled by form validation
                        }
                      }}
                    />
                  </FormControl>{" "}
                  <FormDescription>
                    Only Gmail addresses (@gmail.com or @googlemail.com) are
                    supported
                  </FormDescription>
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
                      placeholder="Enter your Gmail App Password (16 characters)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use a Gmail App Password, not your regular password.
                    <a
                      href="https://support.google.com/accounts/answer/185833"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      Learn how to create one
                    </a>
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
                    <Input
                      type="password"
                      placeholder="Your API key (e.g., 2Captcha or AntiCaptcha)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="credentialData.data.apiSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Secret</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Your API secret (optional)"
                      {...field}
                    />
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
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.2captcha.com or provider URL" {...field} />
                  </FormControl>
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
                  <FormLabel>Method *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={twoFactorMethod.TOTP}>Authenticator App (TOTP)</SelectItem>
                      <SelectItem value={twoFactorMethod.SMS}>SMS</SelectItem>
                      <SelectItem value={twoFactorMethod.EMAIL}>Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* TOTP fields */}
            {form.watch("credentialData.data.method") === twoFactorMethod.TOTP && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="credentialData.data.secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TOTP Secret *</FormLabel>
                      <FormControl>
                        <Input placeholder="Base32 secret" {...field} />
                      </FormControl>
                      <FormDescription>Enter the Base32 TOTP secret from your authenticator</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="credentialData.data.period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period (sec)</FormLabel>
                        <FormControl>
                          <Input type="number" min={15} max={60} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="credentialData.data.digits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Digits</FormLabel>
                        <FormControl>
                          <Input type="number" min={6} max={8} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            {/* SMS fields */}
            {form.watch("credentialData.data.method") === twoFactorMethod.SMS && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="credentialData.data.phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+15551234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="credentialData.data.provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <FormControl>
                        <Input placeholder="Twilio or provider name" {...field} />
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
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Provider API key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {/* Email fields */}
            {form.watch("credentialData.data.method") === twoFactorMethod.EMAIL && (
              <FormField
                control={form.control}
                name="credentialData.data.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} />
                    </FormControl>
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
                <FormLabel>Credential Value *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter your custom credential data (JSON format recommended)"
                    className="resize-none min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter custom credential data. For complex structures, use JSON
                  format.
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerText ?? "Create"}</Button>
      </DialogTrigger>
      <DialogContent className="px-0 max-w-2xl max-h-[90vh] overflow-y-auto">
        <CustomDialogHeader icon={ShieldEllipsis} title="Create Credential" />
        <div className="p-6">
          <Form {...form}>
            <form
              className="space-y-6 w-full"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              {/* Basic Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credential Name *</FormLabel>{" "}
                      <FormControl>
                        <Input placeholder="My Gmail Credentials" {...field} />
                      </FormControl>
                      <FormDescription>
                        A unique name to identify this credential
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Credential Type Selection */}
              <div className="space-y-4">
                <div>
                  <FormLabel className="text-base font-medium">
                    Credential Type
                  </FormLabel>
                  <FormDescription>
                    Choose the type of credential you want to create
                  </FormDescription>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {credentialTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Card
                        key={type.value}
                        className={`cursor-pointer border-2 transition-colors ${
                          selectedType === type.value
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-primary/50"
                        }`}
                        onClick={() => handleTypeChange(type.value)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <CardDescription className="text-xs">
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
                <div>
                  <FormLabel className="text-base font-medium">
                    {
                      credentialTypes.find((t) => t.value === selectedType)
                        ?.label
                    }{" "}
                    Details
                  </FormLabel>
                  <FormDescription>
                    Enter the specific details for this credential type
                  </FormDescription>
                </div>
                {renderTypeSpecificFields()}
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {!isPending && "Create Credential"}
                {isPending && <Loader2 className="animate-spin" />}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
