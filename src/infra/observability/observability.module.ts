import { Global, Module } from '@nestjs/common'
import { Telemetry } from './telemetry.js'
import { NewRelicTelemetry } from './new-relic-telemetry.js'

@Global()
@Module({
  providers: [{ provide: Telemetry, useFactory: () => new NewRelicTelemetry() }],
  exports: [Telemetry],
})
export class ObservabilityModule { }
