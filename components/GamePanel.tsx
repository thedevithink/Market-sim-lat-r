
import React from 'react';

interface GamePanelProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

const GamePanel: React.FC<GamePanelProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-4 flex-1 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-cyan-400 border-b border-slate-700 pb-2">
        <span className="text-2xl">{icon}</span>
        {title}
      </h2>
      <div className="overflow-y-auto pr-2 flex-grow">
        {children}
      </div>
    </div>
  );
};

export default GamePanel;
