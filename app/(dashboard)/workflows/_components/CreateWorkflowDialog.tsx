'use client';
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Layers2Icon, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import CustomDialogHeader from '@/components/CustomDialogHeader';
import { createWorkflowSchema, createWorkflowSchemaType } from '@/schema/workflow';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { CreateWorkFlow } from '@/actions/workflows/createWorkflow';
import { CreateWorkflowFromTemplate } from '@/actions/workflows/createWorkflowFromTemplate';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

interface CreateWorkflowDialogProps {
  triggerText?: string;
}

function CreateWorkflowDialog(props: CreateWorkflowDialogProps) {
  const { triggerText } = props;
  const [open, setOpen] = useState(false);
  const form = useForm<createWorkflowSchemaType>({
    resolver: zodResolver(createWorkflowSchema),
    defaultValues: {},
  });

  const { mutate, isPending } = useMutation({
    mutationFn: CreateWorkFlow,
    onSuccess: () => {
      toast.success('Workflow created successfully', {
        id: 'create-workflow-success',
      });
    },
    onError: () => {
      toast.error('Failed to create workflow', {
        id: 'create-workflow-success',
      });
    },
  });
  const onSubmit = useCallback(
    (values: createWorkflowSchemaType) => {
      toast.loading('Creating workflow...', {
        id: 'create-workflow-success',
      });
      mutate(values);
    },
    [mutate]
  );
  const { mutate: createFromTemplate, isPending: isTemplatePending } = useMutation({
    mutationFn: CreateWorkflowFromTemplate,
    onSuccess: () => {
      toast.success('Workflow created successfully', { id: 'create-workflow-success' });
    },
    onError: () => {
      toast.error('Failed to create workflow', { id: 'create-workflow-success' });
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        form.reset();
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button>{triggerText ?? 'Create workflow'}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto px-0">
        <CustomDialogHeader
          icon={Layers2Icon}
          title="Create workflow"
          subtitle="Start building your workflow"
        />
        <div className="p-6">
          <Form {...form}>
            <form className="w-full space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Name
                      <p className="text-sm text-primary">(required)</p>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Choose a descriptive and unique name</FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Description
                      <p className="text-sm text-muted-foreground">(optional)</p>
                    </FormLabel>
                    <FormControl>
                      <Textarea className="resize-none" {...field} />
                    </FormControl>
                    <FormDescription>
                      Provide a broef description of what your workflow does.
                      <br />
                      This is optional but can help you remeber the workflow&apos;s purpose.
                    </FormDescription>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {!isPending && 'Proceed'}
                {isPending && <Loader2 className="animate-spin" />}
              </Button>
            </form>
          </Form>
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Start from a template</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                className="rounded-md border p-4 text-left hover:border-primary/30 hover:shadow-sm"
                disabled={isTemplatePending}
                onClick={() => {
                  toast.loading('Creating workflow...', { id: 'create-workflow-success' });
                  createFromTemplate({
                    name: 'Example HTML',
                    description: 'Fetch page HTML',
                    templateKey: 'example_html',
                  });
                }}
              >
                <div className="font-semibold">Visit and get HTML</div>
                <div className="text-xs text-muted-foreground">
                  Launches browser, navigates to a site, returns page HTML
                </div>
              </button>
              <button
                className="rounded-md border p-4 text-left hover:border-primary/30 hover:shadow-sm"
                disabled={isTemplatePending}
                onClick={() => {
                  toast.loading('Creating workflow...', { id: 'create-workflow-success' });
                  createFromTemplate({
                    name: 'Example Screenshot',
                    description: 'Capture a screenshot',
                    templateKey: 'example_screenshot',
                  });
                }}
              >
                <div className="font-semibold">Visit and take screenshot</div>
                <div className="text-xs text-muted-foreground">
                  Launches browser, captures a screenshot with default settings
                </div>
              </button>
              <button
                className="rounded-md border p-4 text-left hover:border-primary/30 hover:shadow-sm"
                disabled={isTemplatePending}
                onClick={() => {
                  toast.loading('Creating workflow...', { id: 'create-workflow-success' });
                  createFromTemplate({
                    name: 'Comprehensive Capture',
                    description: 'Wait, extract, screenshot, deliver',
                    templateKey: 'comprehensive_capture',
                  });
                }}
              >
                <div className="font-semibold">Comprehensive capture</div>
                <div className="text-xs text-muted-foreground">
                  Launch, wait for content, extract links and text, take screenshot, send to webhook
                </div>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateWorkflowDialog;
