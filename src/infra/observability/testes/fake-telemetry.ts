import { Telemetry, TelemetryAttributes, TelemetryEventName } from '../telemetry.js'

export class FakeTelemetry extends Telemetry {
  public events: Array<{ name: TelemetryEventName; attributes: TelemetryAttributes }> = []
  public errors: Array<{ error: unknown; attributes?: TelemetryAttributes }> = []

  recordEvent(name: TelemetryEventName, attributes: TelemetryAttributes): void {
    this.events.push({ name, attributes })
  }

  noticeError(error: unknown, attributes?: TelemetryAttributes): void {
    this.errors.push({ error, attributes })
  }
}
