import { MESSAGE_TARGET_APP, MESSAGE_TARGET_EXTENSION, MESSAGE_TARGET_INJECT, MESSAGE_TO_EXTENSION_ROUTE_MSG } from '@/consts/const'
import PortMessageHandler from './PortMessageHandler'

class InjectMessage {
    port?: chrome.runtime.Port
    portMessageHandler?: PortMessageHandler
    //类实例
    methods?: {
        [key: string]: (params: any, context: MethodContext) => Promise<any>
    }
    // postMessageToApp?: (method: string, payload: PostMessagePayload) => Promise<PostMessageResponse>

    debug = (...args: any[]) => {
        console.debug('[Inject Messaging]', ...args)
    }

    /**
     * @param sendResponse No matter what is returned, this method will definitely be called.
     */
    messageHandler = async (event: MessageData): Promise<MessageResult> => {
        this.debug(`${event.from} => `, JSON.stringify(event))

        // check event target
        if (event.target !== MESSAGE_TARGET_INJECT) return Promise.resolve({
            success: false,
            code: 501,
            message: 'Target Error: ' + event.target,
        })

        const method = this.methods?.[event.method]
        if (method != null) {
            return method(event.params, {
                from: event.from,
                event,
                // sender,
            }).then(data => {
                // debug(`${source} <= `, event.method, JSON.stringify(data))
                return {
                    success: true,
                    code: 200,
                    data,
                }
            }).catch(err => {
                console.error(err)
                let message
                if (err instanceof Error) {
                    message = err.message
                } else if (typeof err === 'string') {
                    message = err
                } else {
                    message = 'error: ' + JSON.stringify(err)
                }
                return {
                    success: false,
                    code: 500,
                    message,
                }
            })
        } else {
            return {
                success: false,
                code: 501,
                message: 'Unknown method: ' + event.method,
            }
        }
    }

    init(methods: {
        [key: string]: (params: any, context: MethodContext) => Promise<any>
    }) {
        this.port = chrome.runtime.connect(import.meta.env.VITE_EXTENSION_ID, {
            name: MESSAGE_TARGET_INJECT,
        })
        this.portMessageHandler = new PortMessageHandler<MessageData, MessageResult>(this.messageHandler, this.port)
        this.portMessageHandler!.startListen()
        this.portMessageHandler!.init('inject')
        this.methods = methods
    }

    sendExtension = async <T = any>(method: string, params?: any): Promise<T> => {
        const messageData: MessageData = {
            from: 'inject',
            target: MESSAGE_TARGET_EXTENSION,
            method,
            params: params ?? {},
        }
        return await this.portMessageHandler!.sendMessage(messageData).then((messageResult) => {
            if (messageResult.success) {
                return messageResult.data as T
            } else {
                throw new Error(messageResult.message)
            }
        })
    }

    sendApp = async <T>(method: string, params: any): Promise<T> => {
        if (method === 'setVideoInfo') {
            console.log('sendApp>>>', method, params)
        }
        return this.sendExtension(MESSAGE_TO_EXTENSION_ROUTE_MSG, {
            target: MESSAGE_TARGET_APP,
            method,
            params,
        })
    }

}

export default InjectMessage