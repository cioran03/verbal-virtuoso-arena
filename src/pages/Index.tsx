
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FieldSelector, Field } from "@/components/FieldSelector";
import { DebateView } from "@/components/DebateView";
import { motion } from "framer-motion";

const AVAILABLE_FIELDS: Field[] = [
  { 
    id: "philosophy", 
    name: "Philosophy", 
    description: "Ethical considerations, metaphysical aspects, and epistemological perspectives.",
    active: true 
  },
  { 
    id: "sociology", 
    name: "Sociology", 
    description: "Social impact, cultural perspectives, and collective implications.",
    active: true 
  },
  { 
    id: "psychology", 
    name: "Psychology", 
    description: "Individual impact, behavioral factors, and cognitive implications.",
    active: true 
  },
  { 
    id: "science", 
    name: "Science", 
    description: "Scientific evidence, empirical data, and research perspectives.",
    active: true 
  },
  { 
    id: "history", 
    name: "Historical Anecdotes", 
    description: "Historical precedents, past experiences, and lessons from history.",
    active: true 
  },
  { 
    id: "pragmatism", 
    name: "Pragmatism", 
    description: "Practical considerations, real-world applications, and utility.",
    active: true 
  },
  { 
    id: "aesthetics", 
    name: "Aesthetics", 
    description: "Artistic value, beauty, and design considerations.",
    active: false 
  },
  { 
    id: "logic", 
    name: "Logic", 
    description: "Logical structure, fallacies, and formal reasoning.",
    active: false 
  },
  { 
    id: "economics", 
    name: "Economics", 
    description: "Economic impact, cost-benefit analysis, and resource considerations.",
    active: false 
  },
];

const Index = () => {
  const [topic, setTopic] = useState("");
  const [fields, setFields] = useState<Field[]>(AVAILABLE_FIELDS);
  const [isDebateStarted, setIsDebateStarted] = useState(false);
  const [isTopicError, setIsTopicError] = useState(false);

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
    if (isTopicError && e.target.value.trim().length > 0) {
      setIsTopicError(false);
    }
  };

  const handleFieldsChange = (updatedFields: Field[]) => {
    setFields(updatedFields);
  };

  const handleStartDebate = () => {
    if (topic.trim().length === 0) {
      setIsTopicError(true);
      return;
    }
    
    const activeFieldsCount = fields.filter(field => field.active).length;
    if (activeFieldsCount === 0) {
      // Show error or notification that at least one field must be selected
      return;
    }
    
    setIsDebateStarted(true);
  };

  const handleBackToSetup = () => {
    setIsDebateStarted(false);
  };

  if (isDebateStarted) {
    return <DebateView topic={topic} fields={fields} onBack={handleBackToSetup} />;
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-gold">Dialectica</span>: AI-Powered Debate Generator
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Generate comprehensive debates across multiple disciplines, exploring different perspectives on any topic.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-12"
      >
        <Card className="neo-classical-card max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Enter Your Debate Topic</h2>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="E.g., 'Universal Basic Income' or 'Space Exploration'"
                value={topic}
                onChange={handleTopicChange}
                className={`bg-muted/30 border-white/20 ${isTopicError ? 'border-red-500' : ''}`}
              />
              {isTopicError && (
                <p className="text-red-500 text-sm mt-1">Please enter a debate topic</p>
              )}
            </div>
            <Button 
              onClick={handleStartDebate}
              className="w-full bg-primary hover:bg-primary/80"
              disabled={topic.trim().length === 0}
            >
              Continue to Field Selection
            </Button>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold text-center mb-8">Select Fields to Include in Debate</h2>
        <FieldSelector fields={fields} onChange={handleFieldsChange} />
        
        <div className="text-center mt-10">
          <Button 
            onClick={handleStartDebate}
            className="bg-gold text-black hover:bg-gold/80"
            size="lg"
            disabled={topic.trim().length === 0 || fields.filter(f => f.active).length === 0}
          >
            Generate Debate
          </Button>
          
          <p className="text-muted-foreground text-sm mt-4">
            Selected fields: {fields.filter(field => field.active).length}/9
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
