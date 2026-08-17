import { Module, type DynamicModule } from '@nestjs/common';

import type { AppConfig } from './shared/config/app.config';
import { ConfigModule } from './shared/config/config.module';

@Module({})
export class AppModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [ConfigModule.forRoot(config)],
    };
  }
}
