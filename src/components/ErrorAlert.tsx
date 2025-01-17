import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ErrorAlertProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const ErrorAlert = ({ isOpen, title, message, onClose }: ErrorAlertProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-ios-card rounded-ios">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-gray-600">{message}</p>
        </div>
        <DialogFooter>
          <Button
            className="w-full bg-ios-blue hover:bg-ios-blue/90 text-white"
            onClick={onClose}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorAlert;