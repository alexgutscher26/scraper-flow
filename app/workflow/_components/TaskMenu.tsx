'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TaskType } from '@/types/TaskType';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CoinsIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import TooltipWrapper from '@/components/TooltipWrapper';

/**
 * Renders a collapsible task menu with various task options.
 */
function TaskMenu() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  if (isCollapsed) {
    return (
      <aside className="flex h-full w-12 min-w-12 max-w-12 border-separate flex-col items-center border-r-2 py-4">
        <TooltipWrapper content="Expand Task Menu">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCollapse}
            className="h-10 w-10 rounded-lg border-2 border-border bg-background shadow-sm transition-all duration-200 hover:border-accent-foreground hover:bg-accent"
          >
            <ChevronRight size={18} className="text-foreground" />
          </Button>
        </TooltipWrapper>
      </aside>
    );
  }
  return (
    <aside className="relative h-full w-[340px] min-w-[340px] max-w-[340px] border-separate overflow-auto border-r-2 p-2 px-4">
      {/* Collapse button */}
      <div className="absolute right-3 top-3 z-20">
        <TooltipWrapper content="Collapse Task Menu">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCollapse}
            className="h-10 w-10 rounded-lg border-2 border-border bg-background shadow-md backdrop-blur-sm transition-all duration-200 hover:border-accent-foreground hover:bg-accent"
          >
            <ChevronLeft size={18} className="text-foreground" />
          </Button>
        </TooltipWrapper>
      </div>
      {/* Add padding to prevent content overlap with button */}
      <div className="pt-10">
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={[
            'browser',
            'extraction',
            'interactions',
            'timing',
            'results',
            'storage',
            'advanced',
            'communication',
          ]}
        >
          <AccordionItem value="browser">
            <AccordionTrigger className="font-bold">Browser</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.LAUNCH_BROWSER} />
              <TaskMenuBtn taskType={TaskType.SET_USER_AGENT} />
              <TaskMenuBtn taskType={TaskType.SET_EXTRA_HEADERS} />
              <TaskMenuBtn taskType={TaskType.SET_VIEWPORT_SIZE} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="interactions">
            <AccordionTrigger className="font-bold">User interactions</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.NAVIGATE_URL} />
              <TaskMenuBtn taskType={TaskType.FILL_INPUT} />
              <TaskMenuBtn taskType={TaskType.TYPE_INPUT} />
              <TaskMenuBtn taskType={TaskType.CLICK_ELEMENT} />
              <TaskMenuBtn taskType={TaskType.DOUBLE_CLICK_ELEMENT} />
              <TaskMenuBtn taskType={TaskType.HOVER_ELEMENT} />
              <TaskMenuBtn taskType={TaskType.SCROLL_TO_ELEMENT} />
              <TaskMenuBtn taskType={TaskType.SELECT_OPTION} />
              <TaskMenuBtn taskType={TaskType.UPLOAD_FILES} />
              <TaskMenuBtn taskType={TaskType.DRAG_AND_DROP} />
              <TaskMenuBtn taskType={TaskType.PRESS_KEY} />
              <TaskMenuBtn taskType={TaskType.SUBMIT_FORM} />
              <TaskMenuBtn taskType={TaskType.SOLVE_CAPTCHA} />
            </AccordionContent>
          </AccordionItem>{' '}
          <AccordionItem value="extraction">
            <AccordionTrigger className="font-bold">Data extraction</AccordionTrigger>{' '}
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.PAGE_TO_HTML} />
              <TaskMenuBtn taskType={TaskType.EXTRACT_TEXT_FROM_ELEMENT} />
              <TaskMenuBtn taskType={TaskType.EXTRACT_ATTRIBUTE_FROM_ELEMENT} />
              <TaskMenuBtn taskType={TaskType.EXTRACT_DATA_WITH_AI} />
              <TaskMenuBtn taskType={TaskType.GENERATE_SELECTOR_AI} />
              <TaskMenuBtn taskType={TaskType.EXTRACT_TABLE_DATA} />
              <TaskMenuBtn taskType={TaskType.TAKE_SCREENSHOT} />
              <TaskMenuBtn taskType={TaskType.EXTRACT_CSS_FROM_PAGE} />
              <TaskMenuBtn taskType={TaskType.EXTRACT_XPATH_FROM_PAGE} />
              <TaskMenuBtn taskType={TaskType.EXTRACT_LINKS_FROM_PAGE} />
              <TaskMenuBtn taskType={TaskType.EXTRACT_HTML_FROM_ELEMENT} />
              <TaskMenuBtn taskType={TaskType.EXTRACT_JSONLD} />
              <TaskMenuBtn taskType={TaskType.REGEX_EXTRACT} />
            </AccordionContent>
          </AccordionItem>{' '}
          <AccordionItem value="storage">
            <AccordionTrigger className="font-bold">Data storage</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.READ_PROPERTY_FROM_JSON} />
              <TaskMenuBtn taskType={TaskType.ADD_PROPERTY_TO_JSON} />
              <TaskMenuBtn taskType={TaskType.DOWNLOAD_FILE} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="timing">
            <AccordionTrigger className="font-bold">Timing controls</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.WAIT_FOR_ELEMENT} />
              <TaskMenuBtn taskType={TaskType.WAIT_DELAY} />
              <TaskMenuBtn taskType={TaskType.WAIT_NETWORK_IDLE} />
              <TaskMenuBtn taskType={TaskType.WAIT_FOR_NAVIGATION} />
              <TaskMenuBtn taskType={TaskType.WAIT_FOR_SELECTOR_HIDDEN} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="results">
            <AccordionTrigger className="font-bold">Result delivery</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.DELIVER_VIA_WEBHOOK} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="advanced">
            <AccordionTrigger className="font-bold">Advanced operations</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.CONDITIONAL_LOGIC} />
              <TaskMenuBtn taskType={TaskType.DATA_TRANSFORM} />
              <TaskMenuBtn taskType={TaskType.LOOP} />
              <TaskMenuBtn taskType={TaskType.FILTER_DATA} />
              <TaskMenuBtn taskType={TaskType.INTERCEPT_NETWORK} />
              <TaskMenuBtn taskType={TaskType.GRAPHQL_QUERY} />
              <TaskMenuBtn taskType={TaskType.INFINITE_SCROLL} />
              <TaskMenuBtn taskType={TaskType.PAGINATE_NEXT_BUTTON} />
              <TaskMenuBtn taskType={TaskType.EVALUATE_SCRIPT} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="communication">
            <AccordionTrigger className="font-bold">Communication</AccordionTrigger>{' '}
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.REST_REQUEST} />
              <TaskMenuBtn taskType={TaskType.SEND_EMAIL} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
}

export default TaskMenu;

function TaskMenuBtn({ taskType }: { taskType: TaskType }) {
  const task = TaskRegistry[taskType];
  const onDragStart = (event: React.DragEvent, type: TaskType) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Button
      draggable
      onDragStart={(event) => {
        onDragStart(event, taskType);
      }}
      variant={'secondary'}
      className="flex w-full items-center justify-between gap-2 border"
    >
      <div className="flex gap-2">
        <task.icon size={20} />
        {task.label}
      </div>
      <Badge className="flex items-center gap-2" variant="outline">
        <CoinsIcon size={16} />
        {task.credits}
      </Badge>
    </Button>
  );
}
