

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Trophy, Target, BarChart3 } from 'lucide-react';
import { useUserGuardContext } from 'app/auth';
import brain from 'brain';
import { toast } from 'sonner';

export default function Pricing() {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    if (!user?.primaryEmail) {
      toast.error('Email required for payment');
      return;
    }

    setLoading(plan);
    try {
      const amount = plan === 'monthly' ? 299 : 2499; // $2.99 or $24.99 in cents
      
      const response = await brain.initialize_payment({
        email: user.primaryEmail,
        amount,
        plan: plan,
        callback_url: `${window.location.origin}/quests`
      });
      
      const data = await response.json();
      
      if (data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
      } else {
        toast.error('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error('Payment initialization failed');
    } finally {
      setLoading(null);
    }
  };

  const freeTierFeatures = [
    'Unlimited quest types',
    '5 daily completions per day',
    '1 basic AI rival',
    '7-day streak tracking',
    'Standard dark theme'
  ];

  const premiumFeatures = [
    'Unlimited quest types',
    'Unlimited daily completions',
    'Up to 5 AI rivals with unique personalities',
    'Rival battles & competitions',
    'Advanced rival interactions & challenges',
    '30-day analytics & insights',
    'Custom themes & quest icons',
    'Data export & backup',
    'Priority support'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
              Choose Your Champion Tier
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unlock your full potential with premium features designed for serious habit champions
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-6 w-6 text-blue-400" />
                <CardTitle className="text-2xl text-white">Apprentice</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Perfect for getting started
              </CardDescription>
              <div className="text-4xl font-bold text-white mt-4">
                Free
                <span className="text-lg font-normal text-gray-400">/forever</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {freeTierFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full bg-gray-700 hover:bg-gray-600 text-white" 
                onClick={() => navigate('/quests')}
              >
                Continue as Apprentice
              </Button>
            </CardContent>
          </Card>

          {/* Premium Tier */}
          <Card className="bg-gradient-to-br from-purple-900/50 to-yellow-900/50 border-yellow-400/50 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Badge className="bg-yellow-400 text-black font-bold">
                <Crown className="h-4 w-4 mr-1" />
                RECOMMENDED
              </Badge>
            </div>
            
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <CardTitle className="text-2xl text-white">Champion</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                For serious habit champions
              </CardDescription>
              <div className="space-y-2 mt-4">
                <div className="text-4xl font-bold text-white">
                  $2.99
                  <span className="text-lg font-normal text-gray-400">/month</span>
                </div>
                <div className="text-sm text-yellow-400">
                  or $24.99/year (save 30%)
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="space-y-3 pt-4">
                <Button 
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold" 
                  onClick={() => handleUpgrade('monthly')}
                  disabled={loading === 'monthly'}
                >
                  {loading === 'monthly' ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Upgrade Monthly - $2.99
                    </div>
                  )}
                </Button>
                
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold" 
                  onClick={() => handleUpgrade('yearly')}
                  disabled={loading === 'yearly'}
                >
                  {loading === 'yearly' ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Upgrade Yearly - $24.99
                    </div>
                  )}
                </Button>
                
                <p className="text-xs text-gray-400 text-center">
                  Secure payment powered by Paystack
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center justify-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-400" />
            Why Upgrade to Champion?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Unlimited Daily Completions</h3>
              <p className="text-gray-400 text-sm">
                Break free from the 5-per-day limit. Complete as many quests as you want, every single day.
              </p>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <Trophy className="h-8 w-8 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Multiple AI Rivals</h3>
              <p className="text-gray-400 text-sm">
                Up to 5 AI rivals with unique personalities: competitive, encouraging, mystical, warrior, and trickster.
              </p>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <BarChart3 className="h-8 w-8 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Advanced Competition</h3>
              <p className="text-gray-400 text-sm">
                Rival battles, challenges, and evolving interactions that adapt to your completion patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
