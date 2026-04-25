import React from 'react';
import { cn } from '../utils/index.js';

export const Skeleton = ({ className }) => {
  return (
    <div className={cn("animate-pulse bg-stone-100 rounded-xl", className)}></div>
  );
};

export default Skeleton;
