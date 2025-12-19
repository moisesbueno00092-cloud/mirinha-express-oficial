"use client";

import { useState, useRef } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ItemFormProps {
  onItemSubmit: (rawInput: string) => void;
  isProcessing: boolean;
}

export default function ItemForm({ onItemSubmit, isProcessing }: ItemFormProps) {
  const [rawInput, setRawInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) {
      return;
    }
    onItemSubmit(rawInput);
    setRawInput("");
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
              placeholder="Ex: 2p ou M 12,50 Coca"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              required
              className="h-10 flex-1 sm:h-12 text-base"
            />
            <Button type="submit" size="icon" className="w-10 h-10 sm:w-12 sm:h-12" disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <PlusCircle /> 
              )}
              <span className="sr-only">Adicionar</span>
            </Button>
        </form>
      </CardContent>
    </Card>
  );
}
