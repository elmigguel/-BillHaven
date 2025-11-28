import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Receipt, 
  Wallet, 
  Shield, 
  Zap,
  ArrowRight,
  DollarSign,
  Users,
  Globe
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-gray-900"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400">
              Bill Haven
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Betaal rekeningen voor anderen en ontvang cryptocurrency terug. 
            Verdien geld door bills te betalen!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl('PublicBills')}>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6">
                <Globe className="w-5 h-5 mr-2" />
                Bekijk Beschikbare Bills
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl('Dashboard')}>
              <Button size="lg" variant="outline" className="border-purple-600 text-purple-400 hover:bg-purple-950 text-lg px-8 py-6">
                <Receipt className="w-5 h-5 mr-2" />
                Submit een Bill
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-white mb-12">Hoe werkt het?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">1. Submit een Bill</h3>
              <p className="text-gray-400">
                Upload je rekening en geef aan hoeveel crypto je wilt ontvangen
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">2. Iemand Betaalt</h3>
              <p className="text-gray-400">
                Een andere gebruiker betaalt jouw rekening en ontvangt crypto
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">3. Ontvang Crypto</h3>
              <p className="text-gray-400">
                De betaler ontvangt crypto op zijn wallet na verificatie
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-800/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Waarom Bill Haven?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">Veilig & Betrouwbaar</h3>
              <p className="text-sm text-gray-400">Alle transacties worden geverifieerd</p>
            </div>
            <div className="text-center p-6">
              <Zap className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">Snelle Betalingen</h3>
              <p className="text-sm text-gray-400">Direct crypto ontvangen</p>
            </div>
            <div className="text-center p-6">
              <DollarSign className="w-12 h-12 text-pink-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">Lage Fees</h3>
              <p className="text-sm text-gray-400">Competitieve platform kosten</p>
            </div>
            <div className="text-center p-6">
              <Globe className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">Wereldwijd</h3>
              <p className="text-sm text-gray-400">Betaal bills overal ter wereld</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Klaar om te beginnen?</h2>
        <p className="text-gray-400 mb-8">Word lid van duizenden gebruikers die al profiteren van Bill Haven</p>
        <Link to={createPageUrl('PublicBills')}>
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-12 py-6">
            Start Nu
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>© 2024 Bill Haven. Alle rechten voorbehouden.</p>
        </div>
      </footer>
    </div>
  );
}