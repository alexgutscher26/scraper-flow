"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TaskType } from "@/types/TaskType";
import { TaskRegistry } from "@/lib/workflow/task/registry";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoinsIcon, ChevronLeft, ChevronRight } from "lucide-react";
import TooltipWrapper from "@/components/TooltipWrapper";

function TaskMenu() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  if (isCollapsed) {
    return (
      <aside className="w-12 min-w-12 max-w-12 border-r-2 border-separate h-full flex flex-col items-center py-4">
        <TooltipWrapper content="Expand Task Menu">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCollapse}
            className="h-10 w-10 bg-background border-2 border-border shadow-sm hover:bg-accent hover:border-accent-foreground transition-all duration-200 rounded-lg"
          >
            <ChevronRight size={18} className="text-foreground" />
          </Button>
        </TooltipWrapper>
      </aside>
    );
  }
  return (
    <aside className="w-[340px] min-w-[340px] max-w-[340px] border-r-2 border-separate h-full p-2 px-4 overflow-auto relative">
      {/* Collapse button */}
      <div className="absolute top-3 right-3 z-20">
        <TooltipWrapper content="Collapse Task Menu">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCollapse}
            className="h-10 w-10 bg-background border-2 border-border shadow-md hover:bg-accent hover:border-accent-foreground transition-all duration-200 rounded-lg backdrop-blur-sm"
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
            "extraction",
            "interactions",
            "timing",
            "results",
            "storage",
            "advanced",
            "communication",
          ]}
        >
          <AccordionItem value="interactions">
            <AccordionTrigger className="font-bold">
              User interactions
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.NAVIGATE_URL} />
              <TaskMenuBtn taskType={TaskType.FILL_INPUT} />
              <TaskMenuBtn taskType={TaskType.CLICK_ELEMENT} />
              <TaskMenuBtn taskType={TaskType.SCROLL_TO_ELEMENT} />
            </AccordionContent>
          </AccordionItem>{" "}
          <AccordionItem value="extraction">
            <AccordionTrigger className="font-bold">
              Data extraction
            </AccordionTrigger>{" "}
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.PAGE_TO_HTML} />
              <TaskMenuBtn taskType={TaskType.EXTRACT_TEXT_FROM_ELEMENT} />
              <TaskMenuBtn taskType={TaskType.EXTRACT_DATA_WITH_AI} />
              <TaskMenuBtn taskType={TaskType.EXTRACT_TABLE_DATA} />
              <TaskMenuBtn taskType={TaskType.TAKE_SCREENSHOT} />
            </AccordionContent>
          </AccordionItem>{" "}
          <AccordionItem value="storage">
            <AccordionTrigger className="font-bold">
              Data storage
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.READ_PROPERTY_FROM_JSON} />
              <TaskMenuBtn taskType={TaskType.ADD_PROPERTY_TO_JSON} />
              <TaskMenuBtn taskType={TaskType.DOWNLOAD_FILE} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="timing">
            <AccordionTrigger className="font-bold">
              Timing controls
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.WAIT_FOR_ELEMENT} />
              <TaskMenuBtn taskType={TaskType.WAIT_DELAY} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="results">
            <AccordionTrigger className="font-bold">
              Result delivery
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.DELIVER_VIA_WEBHOOK} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="advanced">
            <AccordionTrigger className="font-bold">
              Advanced operations
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              <TaskMenuBtn taskType={TaskType.CONDITIONAL_LOGIC} />
              <TaskMenuBtn taskType={TaskType.DATA_TRANSFORM} />
              <TaskMenuBtn taskType={TaskType.LOOP} />
              <TaskMenuBtn taskType={TaskType.FILTER_DATA} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="communication">
            <AccordionTrigger className="font-bold">
              Communication
            </AccordionTrigger>{" "}
            <AccordionContent className="flex flex-col gap-1">
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
    event.dataTransfer.setData("application/reactflow", type);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <Button
      draggable
      onDragStart={(event) => {
        onDragStart(event, taskType);
      }}
      variant={"secondary"}
      className="flex justify-between items-center gap-2 border w-full"
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
