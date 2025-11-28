import { supabase } from '../lib/supabase'

export const platformSettingsApi = {
  // Get platform settings
  async get() {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .single()

    if (error) {
      // Return default settings if none exist
      if (error.code === 'PGRST116') {
        return {
          fee_wallet_address: null,
          default_crypto_currency: 'USDT',
          default_network: 'polygon',
          platform_fee_percentage: 2.5
        }
      }
      throw error
    }
    return data
  },

  // Update platform settings (admin only)
  async update(updates) {
    const { data, error } = await supabase
      .from('platform_settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
