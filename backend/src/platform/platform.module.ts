import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { SupabaseService } from './supabase.service';

@Module({
  controllers: [PlatformController],
  providers: [PlatformService, SupabaseService],
  exports: [SupabaseService],
})
export class PlatformModule {}


