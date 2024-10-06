interface Message<T = any> {
  method: string;
  params: T;
}

interface ExtensionMessage<T = any> extends Message<T> {
}

interface InjectMessage<T = any> extends Message<T> {
}

interface AppMessage<T = any> extends Message<T> {
}





interface ExtensionHandshakeMessage extends ExtensionMessage<{ tabId?: number, tags: string[] }> {
  method: 'HANDSHAKE';
}

interface ExtensionRouteMessage extends ExtensionMessage<{ tags: string[], method: string, params: any }> {
  method: 'ROUTE';
}

type MessagingExtensionMessages = ExtensionHandshakeMessage | ExtensionRouteMessage






interface ExtensionCloseSidePanelMessage extends ExtensionMessage<{}> {
  method: 'CLOSE_SIDE_PANEL';
}

interface ExtensionAddTaskMessage extends ExtensionMessage<{ taskDef: TaskDef }> {
  method: 'ADD_TASK';
}

interface ExtensionGetTaskMessage extends ExtensionMessage<{ taskId: string }> {
  method: 'GET_TASK';
}

interface ExtensionShowFlagMessage extends ExtensionMessage<{ show: boolean }> {
  method: 'SHOW_FLAG';
}

type AllExtensionMessages = ExtensionCloseSidePanelMessage | ExtensionAddTaskMessage | ExtensionGetTaskMessage | ExtensionShowFlagMessage

interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}



type MessageFrom = 'extension' | 'inject' | 'app'

interface MessageData {
  from: MessageFrom
  target: string
  method: string
  params?: any
  [key: string]: any
}

interface MessageResult {
  success: boolean
  code: number
  message?: string
  data?: any
}

interface MethodContext {
  from: MessageFrom
  event: any
  tabId?: number
  // sender?: chrome.runtime.MessageSender | null
}

interface EnvData {
  sidePanel?: boolean
  manualInsert?: boolean //是否手动插入字幕列表
  autoExpand?: boolean
  flagDot?: boolean

  aiType?: 'openai' | 'gemini'
  // openai
  apiKey?: string
  serverUrl?: string
  model?: string
  customModel?: string
  customModelTokens?: number
  // gemini
  geminiApiKey?: string

  translateEnable?: boolean
  language?: string
  hideOnDisableAutoTranslate?: boolean
  transDisplay?: 'target' | 'originPrimary' | 'targetPrimary'
  fetchAmount?: number
  summarizeEnable?: boolean
  summarizeLanguage?: string
  words?: number
  summarizeFloat?: boolean
  theme?: 'system' | 'light' | 'dark'
  fontSize?: 'normal' | 'large'

  // search
  searchEnabled?: boolean
  cnSearchEnabled?: boolean

  // ask
  askEnabled?: boolean

  prompts?: {
    [key: string]: string
  }
}

interface TempData {
  curSummaryType: SummaryType
  downloadType?: string
  compact?: boolean // 是否紧凑视图
  reviewActions?: number // 点击或总结行为达到一定次数后，显示评分（一个视频最多只加1次）
  reviewed?: boolean // 是否点击过评分,undefined: 不显示；true: 已点击；false: 未点击(需要显示)
}

interface TaskDef {
  type: 'chatComplete' | 'geminiChatComplete'
  serverUrl?: string
  data: any
  extra?: any
}

interface Task {
  id: string
  startTime: number
  endTime?: number
  def: TaskDef

  status: 'pending' | 'running' | 'done'
  error?: string
  resp?: any
}

interface TransResult {
  // idx: number
  code?: '200' | '500'
  data?: string
}

type ShowElement = string | JSX.Element | undefined

interface Transcript {
  body: TranscriptItem[]
}

interface TranscriptItem {
  from: number
  to: number
  content: string

  idx: number
}

interface Segment {
  items: TranscriptItem[]
  startIdx: number // 从1开始
  endIdx: number
  text: string
  fold?: boolean
  summaries: {
    [type: string]: Summary
  }
}

interface OverviewItem {
  time: string
  emoji: string
  key: string
}

interface Summary {
  type: SummaryType

  status: SummaryStatus
  error?: string
  content?: any
}

interface AskInfo {
  id: string
  fold?: boolean
  question: string
  status: SummaryStatus
  error?: string
  content?: string
}

type PartialOfAskInfo = Partial<PartOfAskInfo>

/**
 * 概览
 */
interface OverviewSummary extends Summary {
  content?: OverviewItem[]
}

/**
 * 要点
 */
interface KeypointSummary extends Summary {
  content?: string[]
}

/**
 * 总结
 */
interface BriefSummary extends Summary {
  content?: {
    summary: string
  }
}

type SummaryStatus = 'init' | 'pending' | 'done'
type SummaryType = 'overview' | 'keypoint' | 'brief' | 'question'
