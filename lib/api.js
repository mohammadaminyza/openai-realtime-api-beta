import { RealtimeEventHandler } from './event_handler.js';
import { RealtimeUtils } from './utils.js';

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
  constructor({ url, token, turnDetection, debug = false } = {}) {
    super();
    this.defaultUrl = 'wss://api.openai.com/v1/realtime';
    this.url = url ? this.getWebSocketUrl(url) : this.defaultUrl;
    this.token = token;
    this.turnDetection = turnDetection;
    this.debug = debug;
    /** @type {WebSocket | null} */
    this.ws = null;
  }

  /**
   * Converts an HTTP/S URL to a WS/S URL.
   * @param {string} url - The input URL.
   * @returns {string} The WebSocket URL.
   * @private
   */
  getWebSocketUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
    } catch (error) {
      console.error('Invalid URL provided:', url, error);
      throw new Error(`The provided URL "${url}" is not a valid URL.`);
    }
  }

  /**
   * Checks if the WebSocket is currently connected.
   * @returns {boolean}
   */
  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Writes WebSocket logs to the console if debug mode is enabled.
   * @param {...any} args - The messages or objects to log.
   */
  log(...args) {
    if (!this.debug) return;

    const date = new Date().toISOString();
    const logs = [`[Websocket/${date}]`, ...args].map((arg) =>
      typeof arg === 'object' && arg !== null
        ? JSON.stringify(arg, null, 2)
        : arg,
    );
    console.log(...logs);
  }

  /**
   * Connects to the Realtime API WebSocket server.
   * @returns {Promise<void>} A promise that resolves upon successful connection.
   */
  connect() {
    if (this.isConnected()) {
      return Promise.reject(new Error('WebSocket is already connected.'));
    }

    if (this.ws) {
      return Promise.reject(new Error('WebSocket is already connecting.'));
    }

    return new Promise((resolve, reject) => {
      if (!globalThis.WebSocket) {
        return reject(
          new Error('WebSocket is not supported in this environment.'),
        );
      }

      const connectionUrl = new URL(this.url);
      const params = new URLSearchParams();

      // Append parameters only if they have a value
      if (this.turnDetection)
        params.append('turn_detection_type', this.turnDetection);
      if (this.token) params.append('token', this.token);

      connectionUrl.search = params.toString();

      const ws = new WebSocket(connectionUrl.toString(), [
        'realtime',
        'openai-beta.realtime-v1',
      ]);
      this.ws = ws;

      const onOpen = () => {
        this.log(`Connected to "${this.url}"`);
        // Clean up connection listeners and attach permanent ones
        ws.removeEventListener('error', onErrorDuringConnection);
        ws.addEventListener('message', this.handleMessage.bind(this));
        ws.addEventListener('error', this.handleError.bind(this));
        ws.addEventListener('close', this.handleClose.bind(this));
        resolve();
      };

      const onErrorDuringConnection = (event) => {
        this.log(`Failed to connect to "${this.url}"`, event);
        this.ws = null; // Clear the instance
        reject(new Error(`Could not connect to "${this.url}"`));
      };

      ws.addEventListener('open', onOpen, { once: true });
      ws.addEventListener('error', onErrorDuringConnection, { once: true });
    });
  }

  /**
   * Handles incoming WebSocket messages.
   * @param {MessageEvent} event - The message event.
   * @private
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      this.receive(message.type, message);
    } catch (error) {
      this.log('Error parsing incoming message:', error);
    }
  }

  /**
   * Handles WebSocket errors.
   * @private
   */
  handleError() {
    this.log(`Error, disconnected from "${this.url}"`);
    this.dispatch('close', { error: true });
    this.disconnect();
  }

  /**
   * Handles WebSocket connection closure.
   * @private
   */
  handleClose() {
    this.log(`Disconnected from "${this.url}"`);
    this.dispatch('close', { error: false });
    this.disconnect();
  }

  /**
   * Disconnects from the Realtime API server.
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Processes a received event and dispatches it locally.
   * @param {string} eventName - The name of the event.
   * @param {object} payload - The event payload.
   */
  receive(eventName, payload) {
    this.log('received:', eventName, payload);
    this.dispatch(`server.${eventName}`, payload);
    this.dispatch('server.*', payload);
  }

  /**
   * Sends an event to the WebSocket server.
   * @param {string} eventName - The name of the event.
   * @param {object} [data={}] - The event data.
   */
  send(eventName, data = {}) {
    if (!this.isConnected()) {
      throw new Error('RealtimeAPI is not connected.');
    }
    if (typeof data !== 'object' || data === null) {
      throw new Error('Data must be an object.');
    }

    const event = {
      event_id: RealtimeUtils.generateId('evt_'),
      type: eventName,
      ...data,
    };

    this.dispatch(`client.${eventName}`, event);
    this.dispatch('client.*', event);
    this.log('sent:', eventName, event);
    this.ws.send(JSON.stringify(event));
  }
}
