
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface Argument {
  content: string;
  side: "for" | "against";
}

interface DebateRoundProps {
  roundNumber: number;
  forArgument: string;
  againstArgument: string;
}

export const DebateRound = ({ 
  roundNumber, 
  forArgument, 
  againstArgument 
}: DebateRoundProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h3 className="text-xl font-semibold mb-4 border-b border-white/20 pb-2">
        Round {roundNumber}: {roundNumber === 1 ? "Opening Arguments" : "Rebuttals"}
      </h3>
      
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className={cn("for-argument hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all duration-300")}>
            <h4 className="text-for font-semibold mb-2">For:</h4>
            <div className="text-foreground whitespace-pre-line">
              {forArgument}
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className={cn("against-argument hover:shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-all duration-300")}>
            <h4 className="text-against font-semibold mb-2">Against:</h4>
            <div className="text-foreground whitespace-pre-line">
              {againstArgument}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
