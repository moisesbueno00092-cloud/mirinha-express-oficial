"use client";

import { useRef } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ItemFormProps {
  rawInput: string;
  setRawInput: (value: string) => void;
  onItemSubmit: (rawInput: string) => void;
  onOpenBomboniere: () => void;
  isProcessing: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}

export default function ItemForm({ 
    rawInput, 
    setRawInput, 
    onItemSubmit, 
    onOpenBomboniere,
    isProcessing,
    inputRef 
}: ItemFormProps) {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) {
      return;
    }
    onItemSubmit(rawInput);
    inputRef.current?.focus();
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl">Adicionar Novo Item</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ex: R M P ou F 2P 1M TX 8..."
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="h-10 flex-1 sm:h-12 text-base"
            />
            <Button 
                type="button" 
                size="icon" 
                className="w-10 h-10 sm:w-12 sm:h-12" 
                onClick={onOpenBomboniere}
                disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <PlusCircle /> 
              )}
              <span className="sr-only">Adicionar Item de Bomboniere</span>
            </Button>
        </form>
      </CardContent>
    </Card>
  );
}
