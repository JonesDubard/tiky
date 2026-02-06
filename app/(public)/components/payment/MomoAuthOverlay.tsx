// app/(public)/components/payment/MomoAuthOverlay.tsx
'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Shield, Lock } from 'lucide-react';

interface MomoAuthOverlayProps {
  phoneNumber: string;
  onAuthComplete: () => void;
  onAuthFailed?: () => void;
}

export default function MomoAuthOverlay({ 
  phoneNumber, 
  onAuthComplete,
  onAuthFailed 
}: MomoAuthOverlayProps) {
  const [seconds, setSeconds] = useState(4);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animate dots
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Countdown timer
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          clearInterval(dotInterval);
          onAuthComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(dotInterval);
    };
  }, [onAuthComplete]);

  const maskedPhone = phoneNumber.replace(/(\d{3})(\d{3})(\d{3})/, '$1***$3');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl">
        {/* MoMo Header */}
        <div className="bg-gradient-to-r from-[#C2185B] to-[#E91E63] p-6 text-white">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Smartphone className="w-8 h-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold">MTN MoMo</h2>
              <p className="text-white/90 text-sm">Mobile Money</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Status Indicator */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#C2185B] to-[#E91E63] flex items-center justify-center animate-pulse">
                <Lock className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Authorizing Payment{dots}
            </h3>
            <p className="text-gray-600 mb-4">
              Please check your phone and enter your PIN
            </p>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Request sent to:</p>
              <div className="flex items-center justify-center gap-2">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <p className="text-lg font-bold font-mono">+231 {maskedPhone}</p>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="text-center">
            <div className="inline-flex items-center bg-gray-100 px-6 py-3 rounded-full">
              <span className="text-gray-700 mr-2">Completing in</span>
              <span className="text-2xl font-bold text-[#C2185B]">{seconds}s</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#C2185B] to-[#E91E63] transition-all duration-1000"
                style={{ width: `${(4 - seconds) * 25}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>Request sent</span>
              <span>Awaiting PIN</span>
              <span>Processing</span>
              <span>Complete</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 text-center">
          <p className="text-xs text-gray-600 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Do not share your PIN with anyone
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Powered by MTN Mobile Money • This is a simulation
          </p>
        </div>
      </div>
    </div>
  );
}