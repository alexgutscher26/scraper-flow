import { GetCredentialsForUser } from '@/actions/credentials/getCredentialsForUser';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { LockKeyholeIcon, Shield, ShieldOff, Mail, Key, Settings } from 'lucide-react';
import React, { Suspense } from 'react';
import CreateCredentialDialog from './_components/CreateCredentialDialog';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import DeleteCredentialDialog from './_components/DeleteCredentialDialog';
import { Badge } from '@/components/ui/badge';
import { CredentialType } from '@/schema/credential';

function CredentialsPage() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold"> Credentials</h1>
          <p className="text-muted-foreground"> Manage your Credentials</p>
        </div>
        <CreateCredentialDialog />
      </div>
      <div className="h-full space-y-8 py-6">
        <Alert title="Coming soon">
          <Shield className="h-4 w-4 stroke-primary" />
          <AlertTitle>Encryption</AlertTitle>
          <AlertDescription>
            All information is securely encrypted. ensuring that your data remains private and
            secure.
          </AlertDescription>
        </Alert>
        <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
          <UserCredentials />
        </Suspense>
      </div>
    </div>
  );
}

export default CredentialsPage;

async function UserCredentials() {
  const credentials = await GetCredentialsForUser();
  if (!credentials) {
    return <div className="flex flex-col space-y-4">Something went wrong</div>;
  }
  if (credentials.length === 0) {
    return (
      <div className="w-full p-4">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center  rounded-full bg-accent">
            <ShieldOff size={40} className="stroke-primary" />
          </div>
          <div className="flex flex-col gap-1 text-center">
            <p className="text-bold">No credentials credits yet</p>
            <p className="text-sm text-muted-foreground">
              Click the button below to add your first credential
            </p>
          </div>
          <CreateCredentialDialog triggerText="Create your first credential" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {credentials.map((credential) => {
        const createdAt = formatDistanceToNow(credential.createdAt, {
          addSuffix: true,
        });

        // Get credential type info for display
        const getCredentialTypeInfo = (type: string) => {
          switch (type) {
            case CredentialType.SMTP_EMAIL:
              return {
                icon: Mail,
                label: 'Gmail Account',
                color: 'bg-blue-100 text-blue-800',
              };
            case CredentialType.API_KEY:
              return {
                icon: Key,
                label: 'API Key',
                color: 'bg-yellow-100 text-yellow-800',
              };
            case CredentialType.CUSTOM:
              return {
                icon: Settings,
                label: 'Custom',
                color: 'bg-gray-100 text-gray-800',
              };
            default:
              return {
                icon: LockKeyholeIcon,
                label: 'Unknown',
                color: 'bg-gray-100 text-gray-800',
              };
          }
        };

        const typeInfo = getCredentialTypeInfo(credential.type || CredentialType.CUSTOM);
        const TypeIcon = typeInfo.icon;

        return (
          <Card key={credential.id} className="flex w-full items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TypeIcon size={20} className="stroke-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{credential.name}</p>
                  <Badge variant="secondary" className={`text-xs ${typeInfo.color}`}>
                    {typeInfo.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Created {createdAt}</span>
                  {credential.description && (
                    <>
                      <span>•</span>
                      <span>{credential.description}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <DeleteCredentialDialog name={credential.name} />
          </Card>
        );
      })}
    </div>
  );
}
