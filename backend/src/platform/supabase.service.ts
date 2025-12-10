import { Injectable } from '@nestjs/common';
import { getSupabaseClient, getSupabaseAdminClient } from '../config/supabase.config';

@Injectable()
export class SupabaseService {
  /**
   * Get the regular Supabase client (uses anon key)
   * Use this for client-side operations with RLS policies
   */
  getClient() {
    return getSupabaseClient();
  }

  /**
   * Get the admin Supabase client (uses service role key)
   * Use this for server-side operations that bypass RLS
   */
  getAdminClient() {
    return getSupabaseAdminClient();
  }

  /**
   * Test the Supabase connection
   */
  async testConnection() {
    try {
      const client = this.getClient();
      const { data, error } = await client.from('_test').select('1').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected)
        throw error;
      }
      return { connected: true, message: 'Supabase connection successful' };
    } catch (error) {
      return { 
        connected: false, 
        message: `Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

