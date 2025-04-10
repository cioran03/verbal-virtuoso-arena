
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type Field = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

interface FieldSelectorProps {
  fields: Field[];
  onChange: (fields: Field[]) => void;
}

export const FieldSelector = ({ fields, onChange }: FieldSelectorProps) => {
  const [selectedFields, setSelectedFields] = useState<Field[]>(fields);

  const toggleField = (id: string) => {
    const updatedFields = selectedFields.map((field) => {
      if (field.id === id) {
        return { ...field, active: !field.active };
      }
      return field;
    });
    
    setSelectedFields(updatedFields);
    onChange(updatedFields);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl mx-auto">
      {selectedFields.map((field) => (
        <Card 
          key={field.id}
          className={cn(
            "neo-classical-card cursor-pointer transition-all duration-300",
            field.active && "border-gold/50"
          )}
          onClick={() => toggleField(field.id)}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className={cn(
              "text-lg font-semibold transition-colors",
              field.active && "text-gold"
            )}>
              {field.name}
            </h3>
            <Switch 
              checked={field.active} 
              onCheckedChange={() => toggleField(field.id)}
            />
          </div>
          <p className="text-sm text-muted-foreground">{field.description}</p>
        </Card>
      ))}
    </div>
  );
};
