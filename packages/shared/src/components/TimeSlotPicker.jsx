import React from 'react';
import { cn, formatArabicTime } from '../utils/index.js';
import { Card } from './index.jsx';

export const TimeSlotPicker = ({ 
  slots = [], 
  selectedSlot, 
  onSelect, 
  loading, 
  error 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 bg-stone-100 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-100">
        <p className="text-rose-500 font-bold">{error}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="p-12 text-center bg-stone-50 rounded-[2rem] border-2 border-dashed border-stone-200">
        <div className="text-4xl mb-4 opacity-20">🕒</div>
        <p className="text-stone-400 font-bold">لا توجد مواعيد متاحة في هذا اليوم</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {slots.map((slot, index) => {
        const isSelected = selectedSlot?.startTime === slot.startTime;
        
        return (
          <button
            key={index}
            onClick={() => onSelect(slot)}
            className={cn(
              "h-14 rounded-2xl font-black text-sm transition-all duration-300 border-2",
              isSelected 
                ? "bg-primary border-primary text-white shadow-lg shadow-teal-500/20 scale-[1.02]" 
                : "bg-white border-stone-100 text-stone-600 hover:border-primary hover:text-primary hover:bg-primary/5"
            )}
          >
            {/* We assume the backend sends 'start' in HH:mm format, or we format it */}
            {slot.start}
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlotPicker;
