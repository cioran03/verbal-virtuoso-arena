
import { useState, useEffect } from "react";
import { DebateRound } from "@/components/DebateRound";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/FieldSelector";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { generateDebateWithGemini, generateMockDebate, DebateRound as DebateRoundType } from "@/services/geminiApi";

interface DebateViewProps {
  topic: string;
  fields: Field[];
  onBack: () => void;
}

interface DebateData {
  rounds: DebateRoundType[];
  loading: boolean;
  error: string | null;
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
        loading: true,
        error: null
      };
    });
    setDebates(initialDebates);
  }, [activeFields]);

  // Generate debate for each field
  useEffect(() => {
    const generateDebate = async (field: Field, index: number) => {
      if (!field.active) return;
      
      try {
        // Add a delay for API rate limiting, staggered by field index
        if (index > 0) {
          // Show toast notification about delay
          toast({
            title: `Generating ${field.name} debate...`,
            description: "There will be a short delay due to API rate limiting (about 10 seconds per field).",
            duration: 5000,
          });
          
          await new Promise(resolve => setTimeout(resolve, index * 10000)); // 10 second delay per field
        }
        
        // Call the Gemini API to generate the debate
        console.log(`Generating debate for ${field.name} on topic: ${topic}`);
        const response = await generateDebateWithGemini(topic, field.name);
        
        setDebates(prev => ({
          ...prev,
          [field.id]: {
            ...response,
            loading: false,
            error: null
          }
        }));
      } catch (error) {
        console.error(`Error generating debate for ${field.name}:`, error);
        
        // Fallback to mock data if API fails
        const mockData = generateMockDebate(topic, field.name);
        
        setDebates(prev => ({
          ...prev,
          [field.id]: {
            ...mockData,
            loading: false,
            error: `Failed to generate debate using AI. Showing placeholder content.`
          }
        }));
        
        toast({
          title: "API Error",
          description: `Could not generate debate for ${field.name}. Showing placeholder content instead.`,
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    // Start generating debates for each field
    activeFields.forEach((field, index) => {
      generateDebate(field, index);
    });
  }, [activeFields, topic, toast]);

  const handleRetry = async (fieldId: string) => {
    const field = activeFields.find(f => f.id === fieldId);
    if (!field) return;
    
    // Set loading state
    setDebates(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        loading: true,
        error: null
      }
    }));
    
    // Retry the API call
    try {
      const response = await generateDebateWithGemini(topic, field.name);
      
      setDebates(prev => ({
        ...prev,
        [fieldId]: {
          ...response,
          loading: false,
          error: null
        }
      }));
      
      toast({
        title: "Success",
        description: `Regenerated debate for ${field.name}.`,
      });
    } catch (error) {
      console.error(`Error retrying debate for ${field.name}:`, error);
      
      // Fallback to mock data
      const mockData = generateMockDebate(topic, field.name);
      
      setDebates(prev => ({
        ...prev,
        [fieldId]: {
          ...mockData,
          loading: false,
          error: `Failed to generate debate. Showing placeholder content.`
        }
      }));
      
      toast({
        title: "Error",
        description: `Failed to regenerate debate for ${field.name}.`,
        variant: "destructive",
      });
    }
  };

  const renderDebateContent = (fieldId: string) => {
    const debate = debates[fieldId];
    
    if (!debate) return null;
    
    if (debate.error) {
      return (
        <div className="text-center py-10">
          <p className="text-destructive mb-2">{debate.error}</p>
          <Button variant="outline" className="mt-4" onClick={() => handleRetry(fieldId)}>Retry</Button>
          <div className="mt-6 border-t border-white/10 pt-6">
            {debate.rounds.map((round, index) => (
              <DebateRound
                key={index}
                roundNumber={index + 1}
                forArgument={round.forArgument}
                againstArgument={round.againstArgument}
              />
            ))}
          </div>
        </div>
      );
    }
    
    if (debate.loading) {
      return (
        <div className="space-y-8">
          {[1, 2, 3, 4, 5].map(round => (
            <div key={round} className="mb-8">
              <h3 className="text-xl font-semibold mb-4 border-b border-white/20 pb-2">
                Round {round}: {round === 1 ? "Opening Arguments" : "Rebuttals"}
              </h3>
              <div className="space-y-6">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {debate.rounds.map((round, index) => (
          <DebateRound
            key={index}
            roundNumber={index + 1}
            forArgument={round.forArgument}
            againstArgument={round.againstArgument}
          />
        ))}
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
              {debates[field.id]?.loading && (
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
