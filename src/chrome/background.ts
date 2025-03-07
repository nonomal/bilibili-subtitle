import {v4} from 'uuid'
import {handleTask, initTaskService, tasksMap} from './taskService'
import { DEFAULT_USE_PORT, STORAGE_ENV} from '@/consts/const'
import { AllExtensionMessages } from '@/message-typings'
import { ExtensionMessaging, TAG_TARGET_INJECT } from '@kky002/kky-message'

const setBadgeOk = async (tabId: number, ok: boolean) => {
  await chrome.action.setBadgeText({
    text: ok ? '✓' : '',
    tabId,
  })
  await chrome.action.setBadgeBackgroundColor({
    color: '#3245e8',
    tabId,
  })
  await chrome.action.setBadgeTextColor({
    color: '#ffffff',
    tabId,
  })
}

const closeSidePanel = async () => {
  chrome.sidePanel.setOptions({
    enabled: false,
  })
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: false,
  })
}

const methods: {
  [K in AllExtensionMessages['method']]: (params: Extract<AllExtensionMessages, { method: K }>['params'], context: MethodContext) => Promise<any>
} = {
  CLOSE_SIDE_PANEL: async (params, context) => {
    closeSidePanel()
  },
  GET_TAB_ID: async (params, context) => {
    return context.tabId
  },
  ADD_TASK: async (params, context) => {
    // 新建任务
    const task: Task = {
      id: v4(),
      startTime: Date.now(),
      status: 'pending',
      def: params.taskDef,
    }
    tasksMap.set(task.id, task)

    // 立即触发任务
    handleTask(task).catch(console.error)

    return task
  },
  GET_TASK: async (params, context) => {
    // 返回任务信息
    const taskId = params.taskId
    const task = tasksMap.get(taskId)
    if (task == null) {
      return {
        code: 'not_found',
      }
    }

    // 检测删除缓存
    if (task.status === 'done') {
      tasksMap.delete(taskId)
    }

    // 返回任务
    return {
      code: 'ok',
      task,
    }
  },
  SHOW_FLAG: async (params, context) => {
    await setBadgeOk(context.tabId!, params.show)
  },
}
// 初始化backgroundMessage
const extensionMessaging = new ExtensionMessaging(DEFAULT_USE_PORT)
extensionMessaging.init(methods)

chrome.runtime.onMessage.addListener((event: any, sender: chrome.runtime.MessageSender, sendResponse: (result: any) => void) => {
  // debug((sender.tab != null) ? `tab ${sender.tab.url ?? ''} => ` : 'extension => ', event)

  // legacy
  if (event.type === 'syncGet') { // sync.get
    chrome.storage.sync.get(event.keys, data => {
      sendResponse(data)
    })
    return true
  } else if (event.type === 'syncSet') { // sync.set
    chrome.storage.sync.set(event.items).catch(console.error)
  } else if (event.type === 'syncRemove') { // sync.remove
    chrome.storage.sync.remove(event.keys).catch(console.error)
  }
})

// 点击扩展图标
chrome.action.onClicked.addListener(async (tab) => {
  chrome.storage.sync.get(STORAGE_ENV, (envDatas) => {
    const envDataStr = envDatas[STORAGE_ENV]
    const envData = envDataStr ? JSON.parse(envDataStr) : {}
    if (envData.sidePanel) {
      chrome.sidePanel.setOptions({
        enabled: true,
        tabId: tab.id!,
        path: '/sidepanel.html?tabId=' + tab.id,
      })
      chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: true,
      })
      chrome.sidePanel.open({
        tabId: tab.id!,
      })
    } else {
      closeSidePanel()
      extensionMessaging.sendMessage(false, tab.id!, TAG_TARGET_INJECT, 'TOGGLE_DISPLAY').catch(console.error)
    }
  })
})

initTaskService()
