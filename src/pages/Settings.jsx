import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformSettingsApi } from '../api/platformSettingsApi';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Wallet, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CRYPTO_CURRENCIES = [
  { value: 'USDT', label: 'USDT (Tether)' },
  { value: 'USDC', label: 'USDC (USD Coin)' },
  { value: 'BTC', label: 'BTC (Bitcoin)' },
  { value: 'ETH', label: 'ETH (Ethereum)' },
  { value: 'LTC', label: 'LTC (Litecoin)' },
  { value: 'SOL', label: 'SOL (Solana)' }
];

export default function Settings() {
  const [feeWallet, setFeeWallet] = useState('');
  const [feeCurrency, setFeeCurrency] = useState('USDT');
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platformSettings'],
    queryFn: () => platformSettingsApi.get()
  });

  useEffect(() => {
    if (settings) {
      setFeeWallet(settings.fee_wallet_address || '');
      setFeeCurrency(settings.fee_wallet_currency || 'USDT');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await platformSettingsApi.update({
        fee_wallet_address: feeWallet,
        fee_wallet_currency: feeCurrency
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
      toast.success('Settings saved');
    }
  });

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" className="mb-6 text-gray-300 hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="border border-gray-700 bg-gray-800">
          <CardHeader className="bg-gradient-to-br from-purple-950 to-gray-900 border-b border-gray-700">
            <CardTitle className="text-2xl text-gray-100 flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              Platform Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="feeWallet" className="text-gray-300">Fee Wallet Address</Label>
                  <Input
                    id="feeWallet"
                    placeholder="0x..."
                    value={feeWallet}
                    onChange={(e) => setFeeWallet(e.target.value)}
                    className="font-mono text-sm bg-gray-900 border-gray-600 text-gray-100"
                  />
                  <p className="text-xs text-gray-400">
                    All platform fees will be sent to this address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feeCurrency" className="text-gray-300">Fee Cryptocurrency</Label>
                  <Select value={feeCurrency} onValueChange={setFeeCurrency}>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {CRYPTO_CURRENCIES.map(crypto => (
                        <SelectItem key={crypto.value} value={crypto.value} className="text-gray-100 focus:bg-gray-700">
                          {crypto.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={!feeWallet || saveMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}