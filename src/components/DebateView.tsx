
import { useState, useEffect } from "react";
import { DebateRound } from "@/components/DebateRound";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/FieldSelector";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { generateDebateRound, generateMockDebateRound, DebateRound as DebateRoundType } from "@/services/geminiApi";

interface DebateViewProps {
  topic: string;
  fields: Field[];
  onBack: () => void;
}

interface DebateData {
  rounds: DebateRoundType[];
  loading: boolean[];
  error: (string | null)[];
  completed: boolean;
}

export const DebateView = ({ topic, fields, onBack }: DebateViewProps) => {
  const [activeFields] = useState(fields.filter(field => field.active));
  const [debates, setDebates] = useState<Record<string, DebateData>>({});
  const [activeTab, setActiveTab] = useState<string>(activeFields[0]?.id || "");
  const { toast } = useToast();
  
  // Initialize debate data structure
  useEffect(() => {
    const initialDebates: Record<string, DebateData> = {};
    activeFields.forEach(field => {
      initialDebates[field.id] = {
        rounds: Array(5).fill({ forArgument: "", againstArgument: "" }),
        loading: Array(5).fill(false),
        error: Array(5).fill(null),
        completed: false
      };
    });
    setDebates(initialDebates);
  }, [activeFields]);

  // Start generating first round for each field
  useEffect(() => {
    activeFields.forEach((field, index) => {
      // Add a delay for API rate limiting, staggered by field index
      setTimeout(() => {
        generateRound(field.id, 0);
      }, index * 10000); // 10 second delay per field
    });
  }, [activeFields]);

  // Function to generate a specific round for a specific field
  const generateRound = async (fieldId: string, roundIndex: number) => {
    const field = activeFields.find(f => f.id === fieldId);
    if (!field) return;
    
    // Set loading state for this specific round
    setDebates(prev => {
      const updatedLoading = [...prev[fieldId].loading];
      updatedLoading[roundIndex] = true;
      
      return {
        ...prev,
        [fieldId]: {
          ...prev[fieldId],
          loading: updatedLoading,
          error: [...prev[fieldId].error]
        }
      };
    });
    
    try {
      // Show toast for the first round of each field
      if (roundIndex === 0) {
        toast({
          title: `Generating ${field.name} debate...`,
          description: "Starting to generate debates with sequential rounds.",
          duration: 3000,
        });
      }
      
      // Get previous rounds for context (except for first round)
      const previousRounds = roundIndex > 0 
        ? debates[fieldId].rounds.slice(0, roundIndex)
        : [];
      
      // Generate the current round
      const roundResult = await generateDebateRound(
        topic, 
        field.name, 
        roundIndex + 1, // Round number (1-indexed)
        previousRounds
      );
      
      // Update the debate state with the new round data
      setDebates(prev => {
        const updatedRounds = [...prev[fieldId].rounds];
        updatedRounds[roundIndex] = roundResult;
        
        const updatedLoading = [...prev[fieldId].loading];
        updatedLoading[roundIndex] = false;
        
        // Check if this was the last round
        const isCompleted = roundIndex === 4;
        
        // If this wasn't the last round, start generating the next round
        if (!isCompleted) {
          setTimeout(() => {
            generateRound(fieldId, roundIndex + 1);
          }, 2000); // Small delay between rounds
        }
        
        return {
          ...prev,
          [fieldId]: {
            ...prev[fieldId],
            rounds: updatedRounds,
            loading: updatedLoading,
            completed: isCompleted
          }
        };
      });
      
      // Show toast when the entire debate is completed
      if (roundIndex === 4) {
        toast({
          title: "Debate completed",
          description: `All rounds for ${field.name} debate have been generated.`,
          duration: 3000,
        });
      }
      
    } catch (error) {
      console.error(`Error generating round ${roundIndex + 1} for ${field.name}:`, error);
      
      // Update error state for this specific round
      setDebates(prev => {
        const updatedError = [...prev[fieldId].error];
        updatedError[roundIndex] = `Failed to generate round ${roundIndex + 1}`;
        
        const updatedLoading = [...prev[fieldId].loading];
        updatedLoading[roundIndex] = false;
        
        // Use mock data for this round
        const updatedRounds = [...prev[fieldId].rounds];
        updatedRounds[roundIndex] = generateMockDebateRound(topic, field.name, roundIndex + 1);
        
        return {
          ...prev,
          [fieldId]: {
            ...prev[fieldId],
            rounds: updatedRounds,
            loading: updatedLoading,
            error: updatedError
          }
        };
      });
      
      toast({
        title: "Error",
        description: `Failed to generate round ${roundIndex + 1} for ${field.name}.`,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleRetryRound = (fieldId: string, roundIndex: number) => {
    generateRound(fieldId, roundIndex);
  };

  const renderDebateRound = (fieldId: string, roundIndex: number) => {
    const debate = debates[fieldId];
    if (!debate) return null;
    
    const round = debate.rounds[roundIndex];
    const isLoading = debate.loading[roundIndex];
    const error = debate.error[roundIndex];
    
    if (isLoading) {
      return (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 border-b border-white/20 pb-2">
            Round {roundIndex + 1}: {roundIndex === 0 ? "Opening Arguments" : "Rebuttals"}
          </h3>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold border-b border-white/20 pb-2">
              Round {roundIndex + 1}: {roundIndex === 0 ? "Opening Arguments" : "Rebuttals"}
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleRetryRound(fieldId, roundIndex)}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Round
            </Button>
          </div>
          <div className="text-destructive mb-4">{error}</div>
          <DebateRound
            roundNumber={roundIndex + 1}
            forArgument={round.forArgument}
            againstArgument={round.againstArgument}
          />
        </div>
      );
    }
    
    // Don't render empty rounds (not yet generated)
    if (!round.forArgument && !round.againstArgument) {
      return null;
    }
    
    return (
      <DebateRound
        key={roundIndex}
        roundNumber={roundIndex + 1}
        forArgument={round.forArgument}
        againstArgument={round.againstArgument}
      />
    );
  };

  const renderDebateContent = (fieldId: string) => {
    const debate = debates[fieldId];
    
    if (!debate) return null;
    
    return (
      <div className="space-y-4">
        {debate.rounds.map((_, index) => renderDebateRound(fieldId, index))}
      </div>
    );
  };

  return (
    <div className="container max-w-5xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          Debate: <span className="text-gold">{topic}</span>
        </h1>
      </div>
      
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="w-full overflow-x-auto flex flex-wrap justify-start">
          {activeFields.map(field => (
            <TabsTrigger
              key={field.id}
              value={field.id}
              className="flex-shrink-0"
            >
              {field.name}
              {debates[field.id]?.loading.some(loading => loading) && (
                <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary"></span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {activeFields.map(field => (
          <TabsContent 
            key={field.id} 
            value={field.id}
            className="mt-8 debate-card p-6 rounded-lg"
          >
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2 mb-6">
              {field.name} Perspective
            </h2>
            {renderDebateContent(field.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
