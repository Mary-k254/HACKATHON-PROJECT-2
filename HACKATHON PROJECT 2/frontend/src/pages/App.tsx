

import React from "react";
import { useUser, UserButton } from "@stackframe/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sword, Shield, Trophy, Zap, Users, Target, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function App() {
  const user = useUser();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (user) {
      navigate("/Quests"); // Will be implemented in next task
    } else {
      navigate("/auth/sign-in");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 transform rotate-45 clip-polygon-[polygon(30%_0%,_70%_0%,_100%_30%,_100%_70%,_70%_100%,_30%_100%,_0%_70%,_0%_30%)]" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              RivalQuest
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Pricing Link - Always visible */}
            <Button
              variant="ghost"
              onClick={() => navigate("/pricing")}
              className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 font-semibold"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Champion
            </Button>
            
            {user ? (
              <>
                <Button
                  onClick={handleAuthAction}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold px-6 py-2 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-purple-500/25"
                >
                  <Sword className="w-4 h-4 mr-2" />
                  Go to Your Quests
                </Button>
                <UserButton />
              </>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth/sign-in")}
                  className="text-gray-300 hover:text-cyan-400 hover:bg-purple-900/30"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate("/auth/sign-up")}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold px-6 py-2 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-purple-500/25"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-block p-4 mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-400 to-purple-500 transform rotate-45 clip-polygon-[polygon(25%_0%,_75%_0%,_100%_25%,_100%_75%,_75%_100%,_25%_100%,_0%_75%,_0%_25%)] shadow-2xl shadow-purple-500/50" />
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
            RIVALQUEST
          </h1>

          <p className="text-2xl md:text-3xl font-semibold text-gray-300 mb-8 max-w-2xl mx-auto">
            Your Goals. Your Rival. Your Journey.
          </p>

          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your daily habits into epic quests. Battle your personalized AI rival,
            build unstoppable streaks, and level up your life in this gamified RPG experience.
          </p>

          <Button
            onClick={handleAuthAction}
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold px-12 py-6 text-xl transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-purple-500/40 border border-purple-400/30"
          >
            <Zap className="w-6 h-6 mr-3" />
            {user ? "Continue Your Quest" : "Start Your Quest"}
          </Button>
        </div>

        {/* Value Propositions */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gray-900/80 border-purple-500/30 hover:border-cyan-400/50 transition-all duration-300 backdrop-blur-sm group hover:shadow-xl hover:shadow-purple-500/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Epic Daily Quests</h3>
              <p className="text-gray-400 leading-relaxed">
                Turn boring habits into thrilling RPG quests. Every completion brings you closer to victory.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/80 border-purple-500/30 hover:border-cyan-400/50 transition-all duration-300 backdrop-blur-sm group hover:shadow-xl hover:shadow-purple-500/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Rival Combat</h3>
              <p className="text-gray-400 leading-relaxed">
                Face off against your personalized AI nemesis. They know your weaknesses and will challenge you.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/80 border-purple-500/30 hover:border-cyan-400/50 transition-all duration-300 backdrop-blur-sm group hover:shadow-xl hover:shadow-purple-500/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Heroic Progression</h3>
              <p className="text-gray-400 leading-relaxed">
                Build legendary streaks, unlock achievements, and become the hero of your own story.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border border-purple-500/30 rounded-2xl p-12 backdrop-blur-sm">
            <Shield className="w-16 h-16 mx-auto mb-6 text-cyan-400" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Face Your Rival?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the battle against mediocrity. Your AI rival is waiting to test your commitment to greatness.
            </p>
            <Button
              onClick={handleAuthAction}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold px-12 py-4 text-lg transform hover:scale-105 transition-all duration-300 shadow-xl shadow-purple-500/30"
            >
              {user ? "Enter the Arena" : "Begin the Challenge"}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 bg-black/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-500 transform rotate-45" />
              <span className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                RivalQuest
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 RivalQuest. Your Goals. Your Rival. Your Journey.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
