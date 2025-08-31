



import React, { useState, useEffect } from "react";
import { useUserGuardContext } from "app/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sword, Shield, Trophy, Zap, Plus, Check, Flame, Target, ArrowLeft, Users, RefreshCw, Crown, Star, Sparkles, Eye, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import brain from "brain";
import type { Quest, CreateQuestRequest, CompleteQuestRequest, Rival, ListQuestsResponse, ListRivalsResponse } from "types";

export default function Quests() {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [rivals, setRivals] = useState<Rival[]>([]);
  const [activeRival, setActiveRival] = useState<Rival | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generatingRival, setGeneratingRival] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [completingQuests, setCompletingQuests] = useState<Set<number>>(new Set());
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // Daily completion tracking state
  const [dailyCompletionsUsed, setDailyCompletionsUsed] = useState(0);
  const [dailyCompletionsLimit, setDailyCompletionsLimit] = useState(5);
  const [isPremium, setIsPremium] = useState(false);
  
  // Rivals tracking state
  const [rivalSlotsUsed, setRivalSlotsUsed] = useState(0);
  const [maxRivalSlots, setMaxRivalSlots] = useState(1);
  const [selectedPersonality, setSelectedPersonality] = useState<string>("competitive");
  
  // Personality types for rival generation
  const personalityTypes = [
    { value: "competitive", label: "Competitive", icon: "⚔️", description: "Aggressive and victory-focused" },
    { value: "encouraging", label: "Encouraging", icon: "🌟", description: "Supportive and motivational" },
    { value: "mystical", label: "Mystical", icon: "🔮", description: "Wise and mysterious" },
    { value: "warrior", label: "Warrior", icon: "🛡️", description: "Honorable and disciplined" },
    { value: "trickster", label: "Trickster", icon: "🃏", description: "Clever and unpredictable" }
  ];
  
  // Load quests and rivals on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load quests and rivals in parallel
      const [questsResponse, rivalsResponse] = await Promise.all([
        brain.list_quests(),
        brain.list_rivals()
      ]);
      
      const questsData: ListQuestsResponse = await questsResponse.json();
      const rivalsData: ListRivalsResponse = await rivalsResponse.json();
      
      setQuests(questsData.quests);
      setDailyCompletionsUsed(questsData.daily_completions_used);
      setDailyCompletionsLimit(questsData.daily_completions_limit);
      setIsPremium(questsData.is_premium);
      
      setRivals(rivalsData.rivals);
      setActiveRival(rivalsData.active_rival);
      setRivalSlotsUsed(rivalsData.slots_used);
      setMaxRivalSlots(rivalsData.max_slots);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load your data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateRival = async (personalityType: string = "competitive") => {
    // Check rival slot limits
    if (rivalSlotsUsed >= maxRivalSlots) {
      setShowUpgradePrompt(true);
      toast.error(`Rival limit reached (${maxRivalSlots}). Upgrade to Champion for multiple rivals!`);
      return;
    }
    
    try {
      setGeneratingRival(true);
      const response = await brain.generate_rival({ personality_type: personalityType });
      
      if (response.status === 403) {
        // Rival limit reached
        setShowUpgradePrompt(true);
        const errorData = await response.json();
        toast.error(errorData.detail || "Rival limit reached. Upgrade to Champion for multiple rivals!");
        return;
      }
      
      const data = await response.json();
      
      // Add new rival to list
      setRivals(prev => [...prev, data.rival]);
      setRivalSlotsUsed(data.slots_used);
      
      // If this is the first rival, set as active
      if (data.rival.is_active) {
        setActiveRival(data.rival);
      }
      
      toast.success(data.message);
    } catch (error: any) {
      console.error("Failed to generate rival:", error);
      if (error.message?.includes("OpenAI API key not configured")) {
        toast.error("OpenAI API key not configured. Please add OPENAI_API_KEY in Settings.");
      } else {
        toast.error("Failed to generate rival. Please try again.");
      }
    } finally {
      setGeneratingRival(false);
    }
  };

  const createQuest = async () => {
    if (!newQuestTitle.trim()) {
      toast.error("Please enter a quest title");
      return;
    }

    try {
      setCreating(true);
      const request: CreateQuestRequest = {
        title: newQuestTitle.trim()
      };
      
      const response = await brain.create_quest(request);
      const data = await response.json();
      
      setQuests(prev => [data.quest, ...prev]);
      setNewQuestTitle("");
      toast.success(data.message);
    } catch (error) {
      console.error("Failed to create quest:", error);
      toast.error("Failed to create quest. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const completeQuest = async (questId: number) => {
    // Check daily completion limit before attempting
    if (!isPremium && dailyCompletionsLimit !== -1 && dailyCompletionsUsed >= dailyCompletionsLimit) {
      setShowUpgradePrompt(true);
      toast.error(`Daily completion limit reached (${dailyCompletionsLimit}/day). Upgrade to Champion for unlimited daily completions!`);
      return;
    }

    try {
      setCompletingQuests(prev => new Set([...prev, questId]));
      
      const request: CompleteQuestRequest = {
        quest_id: questId
      };
      
      const response = await brain.complete_today(request);
      
      if (response.status === 403) {
        // Daily completion limit reached
        setShowUpgradePrompt(true);
        const errorData = await response.json();
        toast.error(errorData.detail || "Daily completion limit reached. Upgrade to Champion for unlimited daily completions!");
        return;
      }
      
      const data = await response.json();
      
      // Update the quest in the list
      setQuests(prev => prev.map(quest => 
        quest.id === questId 
          ? { ...quest, completed_today: true, current_streak: data.quest.current_streak }
          : quest
      ));
      
      // Update daily completion tracking
      setDailyCompletionsUsed(data.daily_completions_used);
      setDailyCompletionsLimit(data.daily_completions_limit);
      
      toast.success(data.message);
    } catch (error: any) {
      console.error("Failed to complete quest:", error);
      const errorMessage = error.message?.includes("already completed") 
        ? "Quest already completed today!"
        : error.message?.includes("Daily completion limit")
        ? error.message
        : "Failed to complete quest. Please try again.";
      toast.error(errorMessage);
    } finally {
      setCompletingQuests(prev => {
        const newSet = new Set(prev);
        newSet.delete(questId);
        return newSet;
      });
    }
  };

  const deleteQuest = async (questId: number) => {
    if (!confirm("Are you sure you want to delete this quest? This action cannot be undone.")) {
      return;
    }

    try {
      await brain.delete_quest({ quest_id: questId });
      setQuests(prev => prev.filter(quest => quest.id !== questId));
      toast.success("Quest deleted successfully");
    } catch (error) {
      console.error("Failed to delete quest:", error);
      toast.error("Failed to delete quest. Please try again.");
    }
  };

  const totalQuests = quests.length;
  const completedToday = quests.filter(q => q.completed_today).length;
  const totalStreaks = quests.reduce((sum, q) => sum + q.current_streak, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="text-gray-300 hover:text-cyan-400 hover:bg-purple-900/30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 transform rotate-45" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Your Quests
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Welcome, <span className="text-cyan-400 font-semibold">{user.displayName || user.primaryEmail}</span></span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* AI Rival Section */}
        <Card className="bg-gray-900/80 border-red-500/30 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center">
                <Sword className="w-5 h-5 mr-2 text-red-400" />
                Your AI Rivals
              </div>
              <Badge className={`${isPremium ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                {rivalSlotsUsed}/{maxRivalSlots} Rival Slots
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Active Rival Display */}
            {activeRival ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                  Active Rival
                </h3>
                <Card className="bg-gray-800/50 border-red-400/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {activeRival.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-lg">{activeRival.name}</h4>
                          <p className="text-gray-300 text-sm">{activeRival.archetype}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                              {personalityTypes.find(p => p.value === activeRival.personality_type)?.icon} {activeRival.personality_type}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                              Level {activeRival.level}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Shield className="w-6 h-6 text-red-400 mx-auto mb-1" />
                        <p className="text-red-400 text-xs font-medium">ACTIVE</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-gray-700/30 rounded border-l-4 border-red-400">
                      <p className="text-gray-300 italic text-sm">"</p>
                      <p className="text-white italic">{activeRival.taunt}</p>
                      <p className="text-gray-300 italic text-sm text-right">"</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="mb-6 text-center py-8">
                <Sword className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No Active Rival</h3>
                <p className="text-gray-500 text-sm">Generate your first AI rival to begin the competition!</p>
              </div>
            )}

            {/* All Rivals List */}
            {rivals.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-cyan-400" />
                  All Rivals ({rivals.length})
                </h3>
                <div className="grid gap-3">
                  {rivals.map((rival) => (
                    <Card key={rival.id} className={`bg-gray-800/30 border-gray-600/30 ${rival.is_active ? 'ring-2 ring-red-400/50' : ''}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              rival.is_active 
                                ? 'bg-gradient-to-br from-red-500 to-purple-600' 
                                : 'bg-gradient-to-br from-gray-500 to-gray-600'
                            }`}>
                              {rival.name.charAt(0)}
                            </div>
                            <div>
                              <h5 className="text-white font-semibold text-sm">{rival.name}</h5>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400 text-xs">{rival.archetype}</span>
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                                  {personalityTypes.find(p => p.value === rival.personality_type)?.icon} {rival.personality_type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={`text-xs ${
                              rival.is_active 
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }`}>
                              {rival.is_active ? 'ACTIVE' : 'READY'}
                            </Badge>
                            <p className="text-gray-400 text-xs mt-1">Lv.{rival.level}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Generate New Rival Section */}
            {rivalSlotsUsed < maxRivalSlots && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
                  Generate New Rival
                </h3>
                
                {/* Personality Type Selection */}
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Choose personality type:</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {personalityTypes.map((personality) => (
                      <Button
                        key={personality.value}
                        variant={selectedPersonality === personality.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPersonality(personality.value)}
                        className={`text-xs h-auto py-2 px-2 ${
                          selectedPersonality === personality.value
                            ? 'bg-purple-500 hover:bg-purple-600 text-white'
                            : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-sm mb-1">{personality.icon}</div>
                          <div className="font-semibold">{personality.label}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    {personalityTypes.find(p => p.value === selectedPersonality)?.description}
                  </p>
                </div>

                <Button 
                  onClick={() => generateRival(selectedPersonality)}
                  disabled={generatingRival}
                  className="w-full bg-gradient-to-r from-purple-500 to-red-500 hover:from-purple-600 hover:to-red-600 text-white font-semibold"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {generatingRival ? "Generating Rival..." : `Generate ${personalityTypes.find(p => p.value === selectedPersonality)?.label} Rival`}
                </Button>
              </div>
            )}

            {/* Upgrade Prompt for More Rivals */}
            {rivalSlotsUsed >= maxRivalSlots && !isPremium && (
              <div className="text-center py-6">
                <Crown className="w-12 h-12 mx-auto text-yellow-400 mb-3" />
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Want More Rivals?</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Upgrade to Champion for up to 5 AI rivals with different personalities!
                </p>
                <Button 
                  onClick={() => navigate('/pricing')}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Champion
                </Button>
              </div>
            )}

            {/* No Rivals Message */}
            {rivals.length === 0 && (
              <div className="text-center py-6">
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-4">
                    AI rivals provide personalized motivation and challenge you to maintain your quest streaks.
                    Each personality type offers a unique competitive experience!
                  </p>
                </div>
                
                {/* Quick Generate Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {personalityTypes.slice(0, 3).map((personality) => (
                    <Button
                      key={personality.value}
                      variant="outline"
                      size="sm"
                      onClick={() => generateRival(personality.value)}
                      disabled={generatingRival}
                      className="text-xs h-auto py-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <div className="text-center">
                        <div className="text-sm mb-1">{personality.icon}</div>
                        <div className="font-semibold">{personality.label}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Dashboard */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900/80 border-cyan-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Target className="w-12 h-12 mx-auto mb-3 text-cyan-400" />
              <div className="text-3xl font-bold text-white mb-1">{totalQuests}</div>
              <div className="text-gray-400">Total Quests</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/80 border-green-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Check className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <div className="text-3xl font-bold text-white mb-1">{completedToday}</div>
              <div className="text-gray-400">Completed Today</div>
              <div className="text-xs text-gray-500 mt-1">
                {isPremium 
                  ? "Unlimited daily completions" 
                  : `${dailyCompletionsUsed}/${dailyCompletionsLimit} daily limit`
                }
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/80 border-orange-500/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Flame className="w-12 h-12 mx-auto mb-3 text-orange-400" />
              <div className="text-3xl font-bold text-white mb-1">{totalStreaks}</div>
              <div className="text-gray-400">Total Streak Days</div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Upgrade Prompt Modal/Banner */}
        {showUpgradePrompt && (
          <Card className="bg-gradient-to-r from-yellow-900/50 to-purple-900/50 border-yellow-400/50 backdrop-blur-sm mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-purple-400"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Crown className="w-6 h-6 mr-2 text-yellow-400" />
                Upgrade to Champion Tier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">
                    You've reached your daily completion limit of {dailyCompletionsLimit}!
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Unlock unlimited daily completions, multiple AI rivals, and premium features for just $2.99/month.
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      Unlimited daily completions
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-purple-400" />
                      Multiple AI rivals
                    </div>
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 mr-1 text-green-400" />
                      Advanced analytics
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline"
                    onClick={() => setShowUpgradePrompt(false)}
                    className="text-gray-400 border-gray-600 hover:bg-gray-800"
                  >
                    Maybe Later
                  </Button>
                  <Button 
                    onClick={() => navigate('/pricing')}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Completion Warning (when close to limit) */}
        {!isPremium && dailyCompletionsLimit !== -1 && dailyCompletionsUsed >= dailyCompletionsLimit - 1 && dailyCompletionsUsed < dailyCompletionsLimit && (
          <Card className="bg-orange-900/30 border-orange-500/40 backdrop-blur-sm mb-8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-orange-400 font-semibold">
                      {dailyCompletionsLimit - dailyCompletionsUsed} daily completion remaining
                    </p>
                    <p className="text-gray-400 text-sm">
                      Upgrade to Champion for unlimited daily completions and premium features
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  View Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create New Quest */}
        <Card className="bg-gray-900/80 border-purple-500/30 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center">
                <Plus className="w-5 h-5 mr-2 text-cyan-400" />
                Create New Quest
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Unlimited Quest Types!
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                placeholder="Enter your daily quest (e.g., 'Exercise for 30 minutes', 'Read 10 pages')"
                value={newQuestTitle}
                onChange={(e) => setNewQuestTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createQuest()}
                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                disabled={creating}
              />
              <Button 
                onClick={createQuest}
                disabled={creating || !newQuestTitle.trim()}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                {creating ? "Creating..." : "Create Quest"}
              </Button>
            </div>
            <p className="text-green-400 text-sm mt-2 flex items-center">
              <Star className="w-4 h-4 mr-1" />
              Create unlimited quest types! Completion limits: {isPremium ? "Unlimited" : `${dailyCompletionsUsed}/${dailyCompletionsLimit} today`}
            </p>
          </CardContent>
        </Card>

        {/* Quests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <p className="text-gray-400 mt-4">Loading your quests...</p>
          </div>
        ) : quests.length === 0 ? (
          <Card className="bg-gray-900/80 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-2xl font-semibold text-white mb-2">No Quests Yet</h3>
              <p className="text-gray-400 mb-6">Create your first daily quest to start your heroic journey!</p>
              <p className="text-sm text-gray-500">Examples: "Exercise for 30 minutes", "Read 10 pages", "Meditate for 5 minutes"</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quests.map((quest) => (
              <Card key={quest.id} className="bg-gray-900/80 border-purple-500/30 hover:border-cyan-400/50 transition-all duration-300 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-xl font-semibold text-white">{quest.title}</h3>
                        {quest.completed_today && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Completed Today
                          </Badge>
                        )}
                        {quest.current_streak > 0 && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            <Flame className="w-3 h-3 mr-1" />
                            {quest.current_streak} day streak
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        Created {new Date(quest.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {!quest.completed_today && (
                        <Button 
                          onClick={() => completeQuest(quest.id)}
                          disabled={completingQuests.has(quest.id)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          {completingQuests.has(quest.id) ? "Completing..." : "Complete Today"}
                        </Button>
                      )}
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteQuest(quest.id)}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-600/30"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Motivational Section */}
        {quests.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border border-purple-500/30 backdrop-blur-sm mt-8">
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {completedToday === totalQuests && totalQuests > 0 
                  ? "All Quests Complete! You are victorious today!" 
                  : completedToday > 0 
                  ? `${completedToday} of ${totalQuests} quests complete! Keep going, hero!`
                  : "Your quests await! Start your journey to greatness."}
              </h3>
              <p className="text-gray-300">
                {totalStreaks > 0 
                  ? `You've built ${totalStreaks} total streak days. Your consistency is your strength!`
                  : "Every great hero starts with a single quest. Today is your day!"}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
