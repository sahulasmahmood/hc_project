
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import AIAgent from "./AIAgent";

const AIAgentToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={handleToggle}
          className="fixed bottom-6 right-6 z-40 bg-medical-500 hover:bg-medical-600 text-white shadow-lg rounded-full w-14 h-14 p-0"
          size="lg"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}
      
      <AIAgent 
        isOpen={isOpen}
        onClose={handleClose}
        onMinimize={handleMinimize}
        isMinimized={isMinimized}
      />
    </>
  );
};

export default AIAgentToggle;
