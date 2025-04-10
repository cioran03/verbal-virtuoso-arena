
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
  const [currentFieldIndex, setCurrentFieldIndex] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
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
    
    // Start the first field's debate generation
    if (activeFields.length > 0) {
      startDebateGeneration();
    }
  }, [activeFields]);

  // Main function to manage the sequential generation of fields and rounds
  const startDebateGeneration = async () => {
    if (currentFieldIndex >= activeFields.length) {
      return; // All fields processed
    }
    
    const currentField = activeFields[currentFieldIndex];
    
    // Start generating rounds for the current field
    try {
      setIsProcessing(true);
      
      // Generate all rounds for the current field
      for (let round = 0; round < 5; round++) {
        setCurrentRound(round);
        await generateRound(currentField.id, round);
        
        // Small delay between rounds to prevent rate limiting issues
        if (round < 4) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Mark this field as completed
      setDebates(prev => ({
        ...prev,
        [currentField.id]: {
          ...prev[currentField.id],
          completed: true
        }
      }));
      
      // Move to the next field after a 90-second delay (1.5 minutes)
      toast({
        title: `${currentField.name} debate completed`,
        description: `Waiting 90 seconds before starting the next field due to API rate limiting...`,
        duration: 5000,
      });
      
      await new Promise(resolve => setTimeout(resolve, 90000)); // 90 seconds delay
      
      // Proceed to the next field
      setCurrentFieldIndex(prev => prev + 1);
      setCurrentRound(0);
      
      // If there are more fields, continue the process
      if (currentFieldIndex + 1 < activeFields.length) {
        const nextField = activeFields[currentFieldIndex + 1];
        toast({
          title: `Starting ${nextField.name} debate`,
          description: "Generating arguments for the next field...",
          duration: 3000,
        });
        startDebateGeneration();
      } else {
        toast({
          title: "All debates completed",
          description: "All fields have been processed.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error(`Error in debate generation process:`, error);
      toast({
        title: "Error",
        description: `Failed to complete the debate generation process: ${error}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
        
        return {
          ...prev,
          [fieldId]: {
            ...prev[fieldId],
            rounds: updatedRounds,
            loading: updatedLoading
          }
        };
      });
      
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
        <div className="mb-8" key={`${fieldId}-round-${roundIndex}`}>
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
        <div className="mb-8" key={`${fieldId}-round-${roundIndex}`}>
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
        key={`${fieldId}-round-${roundIndex}`}
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

  // Generate progress status text
  const getProgressStatus = () => {
    if (currentFieldIndex >= activeFields.length) {
      return "All debates completed";
    }
    
    const currentField = activeFields[currentFieldIndex];
    return `Generating ${currentField.name} debate - Round ${currentRound + 1}/5`;
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
      
      {isProcessing && (
        <div className="bg-muted/30 p-4 rounded-lg mb-6">
          <p className="text-sm flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary"></span>
            {getProgressStatus()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Processing fields sequentially to avoid API rate limits. Please be patient.
          </p>
        </div>
      )}
      
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
