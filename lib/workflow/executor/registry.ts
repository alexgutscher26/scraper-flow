import { ExecutionEnvironment } from "@/types/executor";
import { LaunchBrowserExecutor } from "./LaunchBrowserExecutor";
import { PageToHtmlExecutor } from "./PageToHtmlExecutor";
import { TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { ExtractTextFromElementExecutor } from "./ExtractTextFromElementExecutor";
import { FillInputExecutor } from "./FillInputExecutor";
import { ClickElementExecutor } from "./ClickElementExecutor";
import { WaitForElementExecutor } from "./WaitForElementExecutor";
import { DeliverViaWebhookExecutor } from "./DeliverViaWebhookExecutor";
import { ExtractDataWithAIExecutor } from "./ExtractDataWithAIExecutor";
import { ReadPropertyFromJsonExecutor } from "./ReadPropertyFromJsonExecutor";
import { AddPropertyToJsonExecutor } from "./AddPropertyToJsonExecutor";
import { NavigateUrlExecutor } from "./NavigateUrlExecutor";
import { ScrollToElementExecutor } from "./ScrollToElementExecutor";
// Import the screenshot executor
import { TakeScreenshotExecutor } from "./TakeScreenshotExecutor";
// Import the new enhanced task executors
import { WaitDelayExecutor } from "./WaitDelayExecutor";
import { ExtractTableDataExecutor } from "./ExtractTableDataExecutor";
import { ConditionalLogicExecutor } from "./ConditionalLogicExecutor";
import { DataTransformExecutor } from "./DataTransformExecutor";
import { DownloadFileExecutor } from "./DownloadFileExecutor";
import { SendEmailExecutor } from "./SendEmailExecutor";
import { LoopExecutor } from "./LoopExecutor";
import { FilterDataExecutor } from "./FilterDataExecutor";

type ExecutorFn<T extends WorkflowTask> = (
  environment: ExecutionEnvironment<T>
) => Promise<boolean>;

type RegistryType = {
  [K in TaskType]: ExecutorFn<WorkflowTask & { type: K }>;
};

export const ExecutorRegistry: RegistryType = {
  LAUNCH_BROWSER: LaunchBrowserExecutor,
  PAGE_TO_HTML: PageToHtmlExecutor,
  EXTRACT_TEXT_FROM_ELEMENT: ExtractTextFromElementExecutor,
  FILL_INPUT: FillInputExecutor,
  CLICK_ELEMENT: ClickElementExecutor,
  WAIT_FOR_ELEMENT: WaitForElementExecutor,
  DELIVER_VIA_WEBHOOK: DeliverViaWebhookExecutor,
  EXTRACT_DATA_WITH_AI: ExtractDataWithAIExecutor,
  READ_PROPERTY_FROM_JSON: ReadPropertyFromJsonExecutor,
  ADD_PROPERTY_TO_JSON: AddPropertyToJsonExecutor,
  NAVIGATE_URL: NavigateUrlExecutor,
  SCROLL_TO_ELEMENT: ScrollToElementExecutor,
  TAKE_SCREENSHOT: TakeScreenshotExecutor,
  WAIT_DELAY: WaitDelayExecutor,
  EXTRACT_TABLE_DATA: ExtractTableDataExecutor,
  CONDITIONAL_LOGIC: ConditionalLogicExecutor,
  DATA_TRANSFORM: DataTransformExecutor,
  DOWNLOAD_FILE: DownloadFileExecutor,
  SEND_EMAIL: SendEmailExecutor,
  LOOP: LoopExecutor,
  FILTER_DATA: FilterDataExecutor,
};
