import { TaskType } from "@/types/TaskType";
import { ExtractTextFromElementTask } from "./ExtractTextFromElement";
import { LaunchBrowserTask } from "./LaunchBrowser";
import { PageToHtmlTask } from "./PageToHtml";
import { WorkflowTask } from "@/types/workflow";
import { FillInputTask } from "./FillInput";
import { TypeInputTask } from "./TypeInput";
import { ClickElementTask } from "./ClickElement";
import { WaitForElementTask } from "./WaitForElement";
import { DeliverViaWebhookTask } from "./DeliverViaWebhook";
import { ExtractDataWithAITask } from "./ExtractDataWithAI";
import { ReadPropertyFromJsonTask } from "./ReadPropertyFromJson";
import { AddPropertyToJsonTask } from "./AddPropertyToJson";
import { NavigateUrlTask } from "./NavigateUrl";
import { ScrollToElementTask } from "./ScrollToElement";
import { TakeScreenshotTask } from "./TakeScreenshot";
import { WaitDelayTask } from "./WaitDelay";
import { ExtractTableDataTask } from "./ExtractTableData";
import { ConditionalLogicTask } from "./ConditionalLogic";
import { DataTransformTask } from "./DataTransform";
import { DownloadFileTask } from "./DownloadFile";
import { SendEmailTask } from "./SendEmail";
import { LoopTask } from "./Loop";
import { FilterDataTask } from "./FilterData";
import { SelectOptionTask } from "./SelectOption";
import { UploadFilesTask } from "./UploadFiles";
import { SolveCaptchaTask } from "./SolveCaptcha";
import { ExtractCssFromPageTask } from "./ExtractCssFromPage";
import { ExtractXPathFromPageTask } from "./ExtractXPathFromPage";
import { InterceptNetworkTask } from "./InterceptNetwork";
import { GraphQLQueryTask } from "./GraphQLQuery";
import { GenerateSelectorTask } from "./GenerateSelector";
import { InfiniteScrollTask } from "./InfiniteScroll";
import { ExtractLinksFromPageTask } from "./ExtractLinksFromPage";
import { SetUserAgentTask } from "./SetUserAgent";
import { WaitForNetworkIdleTask } from "./WaitForNetworkIdle";
import { RestRequestTask } from "./RestRequest";
import { ExtractAttributeFromElementTask } from "./ExtractAttributeFromElement";
import { HoverElementTask } from "./HoverElement";
import { DoubleClickElementTask } from "./DoubleClickElement";
import { DragAndDropTask } from "./DragAndDrop";
import { PressKeyTask } from "./PressKey";
import { SubmitFormTask } from "./SubmitForm";
import { WaitForNavigationTask } from "./WaitForNavigation";
import { WaitForSelectorHiddenTask } from "./WaitForSelectorHidden";
import { ExtractHtmlFromElementTask } from "./ExtractHtmlFromElement";
import { ExtractJsonLdTask } from "./ExtractJsonLd";
import { RegexExtractTask } from "./RegexExtract";
import { SetExtraHeadersTask } from "./SetExtraHeaders";
import { SetViewportSizeTask } from "./SetViewportSize";
import { PaginateNextButtonTask } from "./PaginateNextButton";
import { EvaluateScriptTask } from "./EvaluateScript";

type Registry = {
  [K in TaskType]: WorkflowTask & { type: K };
};

export const TaskRegistry: Registry = {
  LAUNCH_BROWSER: LaunchBrowserTask,
  PAGE_TO_HTML: PageToHtmlTask,
  EXTRACT_TEXT_FROM_ELEMENT: ExtractTextFromElementTask,
  FILL_INPUT: FillInputTask,
  TYPE_INPUT: TypeInputTask,
  CLICK_ELEMENT: ClickElementTask,
  WAIT_FOR_ELEMENT: WaitForElementTask,
  DELIVER_VIA_WEBHOOK: DeliverViaWebhookTask,
  EXTRACT_DATA_WITH_AI: ExtractDataWithAITask,
  READ_PROPERTY_FROM_JSON: ReadPropertyFromJsonTask,
  ADD_PROPERTY_TO_JSON: AddPropertyToJsonTask,
  NAVIGATE_URL: NavigateUrlTask,
  SCROLL_TO_ELEMENT: ScrollToElementTask,
  TAKE_SCREENSHOT: TakeScreenshotTask,
  WAIT_DELAY: WaitDelayTask,
  EXTRACT_TABLE_DATA: ExtractTableDataTask,
  CONDITIONAL_LOGIC: ConditionalLogicTask,
  DATA_TRANSFORM: DataTransformTask,
  DOWNLOAD_FILE: DownloadFileTask,
  SEND_EMAIL: SendEmailTask,
  LOOP: LoopTask,
  FILTER_DATA: FilterDataTask,
  SELECT_OPTION: SelectOptionTask,
  UPLOAD_FILES: UploadFilesTask,
  SOLVE_CAPTCHA: SolveCaptchaTask,
  HOVER_ELEMENT: HoverElementTask,
  DOUBLE_CLICK_ELEMENT: DoubleClickElementTask,
  DRAG_AND_DROP: DragAndDropTask,
  PRESS_KEY: PressKeyTask,
  SUBMIT_FORM: SubmitFormTask,
  EXTRACT_CSS_FROM_PAGE: ExtractCssFromPageTask,
  EXTRACT_XPATH_FROM_PAGE: ExtractXPathFromPageTask,
  EXTRACT_LINKS_FROM_PAGE: ExtractLinksFromPageTask,
  INTERCEPT_NETWORK: InterceptNetworkTask,
  GRAPHQL_QUERY: GraphQLQueryTask,
  GENERATE_SELECTOR_AI: GenerateSelectorTask,
  INFINITE_SCROLL: InfiniteScrollTask,
  SET_USER_AGENT: SetUserAgentTask,
  WAIT_NETWORK_IDLE: WaitForNetworkIdleTask,
  WAIT_FOR_NAVIGATION: WaitForNavigationTask,
  WAIT_FOR_SELECTOR_HIDDEN: WaitForSelectorHiddenTask,
  REST_REQUEST: RestRequestTask,
  EXTRACT_ATTRIBUTE_FROM_ELEMENT: ExtractAttributeFromElementTask,
  EXTRACT_HTML_FROM_ELEMENT: ExtractHtmlFromElementTask,
  EXTRACT_JSONLD: ExtractJsonLdTask,
  REGEX_EXTRACT: RegexExtractTask,
  SET_EXTRA_HEADERS: SetExtraHeadersTask,
  SET_VIEWPORT_SIZE: SetViewportSizeTask,
  PAGINATE_NEXT_BUTTON: PaginateNextButtonTask,
  EVALUATE_SCRIPT: EvaluateScriptTask,
};
