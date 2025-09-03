/**
 * @typedef {object} RealtimeAPISettings
 * @property {string} [url] - The WebSocket URL to connect to.
 * @property {string} [token] - The authentication token.
 * @property {string} [turnDetection] - The type of turn detection to use.
 * @property {boolean} [debug=false] - Whether to enable debug logging.
 */
export class RealtimeAPI extends RealtimeEventHandler {
    /**
     * Creates a new RealtimeAPI instance.
     * @param {RealtimeAPISettings} [settings={}] - Configuration for the Realtime API.
     */
    constructor({ url, token, turnDetection, debug }?: RealtimeAPISettings);
    defaultUrl: string;
    url: string;
    token: string;
    turnDetection: string;
    debug: boolean;
    /** @type {WebSocket | null} */
    ws: WebSocket | null;
    /**
     * Converts an HTTP/S URL to a WS/S URL.
     * @param {string} url - The input URL.
     * @returns {string} The WebSocket URL.
     * @private
     */
    private getWebSocketUrl;
    /**
     * Checks if the WebSocket is currently connected.
     * @returns {boolean}
     */
    isConnected(): boolean;
    /**
     * Writes WebSocket logs to the console if debug mode is enabled.
     * @param {...any} args - The messages or objects to log.
     */
    log(...args: any[]): void;
    /**
     * Connects to the Realtime API WebSocket server.
     * @returns {Promise<void>} A promise that resolves upon successful connection.
     */
    connect(): Promise<void>;
    /**
     * Handles incoming WebSocket messages.
     * @param {MessageEvent} event - The message event.
     * @private
     */
    private handleMessage;
    /**
     * Handles WebSocket errors.
     * @private
     */
    private handleError;
    /**
     * Handles WebSocket connection closure.
     * @private
     */
    private handleClose;
    /**
     * Disconnects from the Realtime API server.
     */
    disconnect(): void;
    /**
     * Processes a received event and dispatches it locally.
     * @param {string} eventName - The name of the event.
     * @param {object} payload - The event payload.
     */
    receive(eventName: string, payload: object): void;
    /**
     * Sends an event to the WebSocket server.
     * @param {string} eventName - The name of the event.
     * @param {object} [data={}] - The event data.
     */
    send(eventName: string, data?: object): void;
}
export type RealtimeAPISettings = {
    /**
     * - The WebSocket URL to connect to.
     */
    url?: string;
    /**
     * - The authentication token.
     */
    token?: string;
    /**
     * - The type of turn detection to use.
     */
    turnDetection?: string;
    /**
     * - Whether to enable debug logging.
     */
    debug?: boolean;
};
import { RealtimeEventHandler } from './event_handler.js';
//# sourceMappingURL=api.d.ts.map