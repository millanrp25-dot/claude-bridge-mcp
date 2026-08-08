/**
 * Real `GlassesHost`, backed by `@evenrealities/even_hub_sdk`.
 *
 * Only usable inside the Even App WebView — `isEvenAppWebView()` decides at
 * startup whether to build this or the simulator.
 */

import {
  AppLocationAccuracy,
  CreateStartUpPageContainer,
  DeviceConnectType,
  EventSourceType,
  ListContainerProperty,
  ListItemContainerProperty,
  OsEventTypeList,
  RebuildPageContainer,
  StartUpPageCreateResult,
  TextContainerProperty,
  TextContainerUpgrade,
  waitForEvenAppBridge,
  type EvenAppBridge,
  type EvenHubEvent,
} from '@evenrealities/even_hub_sdk';

import type {
  DeviceState,
  GlassInput,
  GlassesHost,
  GpsFix,
  InputSource,
} from './host.js';
import { validatePage, type Page } from '../ui/page.js';

/** The bridge only exists inside Even App's Flutter WebView. */
export function isEvenAppWebView(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as Record<string, unknown>).flutter_inappwebview ===
      'object'
  );
}

function mapSource(source: EventSourceType | undefined): InputSource {
  switch (source) {
    case EventSourceType.TOUCH_EVENT_FROM_GLASSES_L:
      return 'glassesLeft';
    case EventSourceType.TOUCH_EVENT_FROM_GLASSES_R:
      return 'glassesRight';
    case EventSourceType.TOUCH_EVENT_FROM_RING:
      return 'ring';
    default:
      return 'unknown';
  }
}

/**
 * Collapse the SDK's three event families into one input stream.
 *
 * List and system events both report scrolls and clicks depending on which
 * container has capture, so screens would otherwise have to handle each shape.
 */
export function toGlassInput(event: EvenHubEvent): GlassInput | undefined {
  const { listEvent, sysEvent } = event;

  if (listEvent?.eventType !== undefined) {
    const index = listEvent.currentSelectItemIndex ?? 0;
    switch (listEvent.eventType) {
      case OsEventTypeList.CLICK_EVENT:
        return {
          type: 'listSelect',
          containerId: listEvent.containerID ?? 0,
          index,
          name: listEvent.currentSelectItemName ?? '',
        };
      case OsEventTypeList.SCROLL_TOP_EVENT:
        return { type: 'scrollUp', source: 'unknown' };
      case OsEventTypeList.SCROLL_BOTTOM_EVENT:
        return { type: 'scrollDown', source: 'unknown' };
      case OsEventTypeList.DOUBLE_CLICK_EVENT:
        return { type: 'doubleClick', source: 'unknown' };
      default:
        break;
    }
  }

  if (sysEvent?.eventType !== undefined) {
    const source = mapSource(sysEvent.eventSource);
    switch (sysEvent.eventType) {
      case OsEventTypeList.CLICK_EVENT:
        return { type: 'click', source };
      case OsEventTypeList.DOUBLE_CLICK_EVENT:
        return { type: 'doubleClick', source };
      case OsEventTypeList.SCROLL_TOP_EVENT:
        return { type: 'scrollUp', source };
      case OsEventTypeList.SCROLL_BOTTOM_EVENT:
        return { type: 'scrollDown', source };
      case OsEventTypeList.SYSTEM_EXIT_EVENT:
        return { type: 'exit', reason: 'system' };
      case OsEventTypeList.ABNORMAL_EXIT_EVENT:
        return { type: 'exit', reason: 'abnormal' };
      case OsEventTypeList.FOREGROUND_EXIT_EVENT:
        return { type: 'exit', reason: 'foreground' };
      default:
        break;
    }
  }

  return undefined;
}

/**
 * Convert our page model into SDK containers.
 *
 * z-order is all-or-nothing per the SDK contract, so every container gets a
 * unique index; lists sit behind text so an overlay label stays readable.
 */
function toContainers(page: Page): {
  listObject: ListContainerProperty[];
  textObject: TextContainerProperty[];
  containerTotalNum: number;
} {
  validatePage(page);
  let zOrder = 1;

  const listObject = page.lists.map(
    (list) =>
      new ListContainerProperty({
        xPosition: list.x,
        yPosition: list.y,
        width: list.width,
        height: list.height,
        containerID: list.id,
        containerName: list.name,
        zOrderIndex: zOrder++,
        isEventCapture: list.capture ? 1 : 0,
        itemContainer: new ListItemContainerProperty({
          itemCount: list.items.length,
          itemName: list.items,
          isItemSelectBorderEn: list.selectBorder === false ? 0 : 1,
        }),
      }),
  );

  const textObject = page.texts.map(
    (text) =>
      new TextContainerProperty({
        xPosition: text.x,
        yPosition: text.y,
        width: text.width,
        height: text.height,
        containerID: text.id,
        containerName: text.name,
        zOrderIndex: zOrder++,
        content: text.content,
        isEventCapture: text.capture ? 1 : 0,
      }),
  );

  return {
    listObject,
    textObject,
    containerTotalNum: listObject.length + textObject.length,
  };
}

function toGpsFix(location: {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: number;
}): GpsFix {
  const fix: GpsFix = { lat: location.latitude, lng: location.longitude };
  if (location.accuracy !== undefined) fix.accuracy = location.accuracy;
  if (location.altitude !== undefined) fix.elevation = location.altitude;
  if (location.timestamp !== undefined) fix.timestamp = location.timestamp;
  return fix;
}

export class EvenBridgeHost implements GlassesHost {
  private constructor(private readonly bridge: EvenAppBridge) {}

  static async connect(): Promise<EvenBridgeHost> {
    return new EvenBridgeHost(await waitForEvenAppBridge());
  }

  async createPage(page: Page): Promise<boolean> {
    const { listObject, textObject, containerTotalNum } = toContainers(page);
    const result = await this.bridge.createStartUpPageContainer(
      new CreateStartUpPageContainer({ containerTotalNum, listObject, textObject }),
    );
    if (result !== StartUpPageCreateResult.success) {
      console.error('[g2-golf] startup page rejected by device:', result);
    }
    return result === StartUpPageCreateResult.success;
  }

  async rebuildPage(page: Page): Promise<boolean> {
    const { listObject, textObject, containerTotalNum } = toContainers(page);
    return this.bridge.rebuildPageContainer(
      new RebuildPageContainer({ containerTotalNum, listObject, textObject }),
    );
  }

  async updateText(
    containerId: number,
    containerName: string,
    content: string,
  ): Promise<boolean> {
    return this.bridge.textContainerUpgrade(
      new TextContainerUpgrade({ containerID: containerId, containerName, content }),
    );
  }

  async shutDown(exitMode = 0): Promise<boolean> {
    return this.bridge.shutDownPageContainer(exitMode);
  }

  onInput(callback: (input: GlassInput) => void): () => void {
    return this.bridge.onEvenHubEvent((event) => {
      const input = toGlassInput(event);
      if (input) callback(input);
    });
  }

  onDeviceState(callback: (state: DeviceState) => void): () => void {
    return this.bridge.onDeviceStatusChanged((status) => {
      const state: DeviceState = {
        connected: status.connectType === DeviceConnectType.Connected,
      };
      if (status.batteryLevel !== undefined) state.batteryLevel = status.batteryLevel;
      if (status.isWearing !== undefined) state.isWearing = status.isWearing;
      callback(state);
    });
  }

  async getLocation(): Promise<GpsFix | null> {
    const location = await this.bridge.getAppLocation({
      accuracy: AppLocationAccuracy.High,
      timeoutMs: 8000,
    });
    return location ? toGpsFix(location) : null;
  }

  async startLocationUpdates(intervalMs: number): Promise<boolean> {
    return this.bridge.startAppLocationUpdates({
      accuracy: AppLocationAccuracy.High,
      intervalMs,
      // Golf yardages move on every step; filtering by distance would freeze
      // the display while the player shuffles around the ball.
      distanceFilter: 1,
    });
  }

  async stopLocationUpdates(): Promise<boolean> {
    return this.bridge.stopAppLocationUpdates();
  }

  onLocation(callback: (fix: GpsFix) => void): () => void {
    return this.bridge.onAppLocationChanged((location) => callback(toGpsFix(location)));
  }

  async getItem(key: string): Promise<string | null> {
    const value = await this.bridge.getLocalStorage(key);
    return value === '' || value === undefined || value === null ? null : value;
  }

  async setItem(key: string, value: string): Promise<boolean> {
    return this.bridge.setLocalStorage(key, value);
  }
}
