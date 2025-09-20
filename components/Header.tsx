import React from 'react';
import CalendarIcon from './icons/CalendarIcon';
import MoneyIcon from './icons/MoneyIcon';
import { GameState } from '../types';

interface HeaderProps {
  day: number;
  money: number;
  onEndDay: () => void;
  gameState: GameState;
}

const Header: React.FC<HeaderProps> = ({ day, money, onEndDay, gameState }) => {
  const isButtonDisabled = gameState !== GameState.PLAYING;

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg shadow-lg mb-6 flex justify-between items-center sticky top-4 z-10 border border-slate-700">
      <h1 className="text-2xl font-bold text-cyan-400 tracking-wider">Market Simülatörü</h1>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 bg-slate-700/50 px-4 py-2 rounded-full">
          <CalendarIcon className="text-yellow-400" />
          <span className="font-semibold text-lg">Gün: {day}</span>
        </div>
        <div className="flex items-center space-x-2 bg-slate-700/50 px-4 py-2 rounded-full">
          <MoneyIcon className="text-green-400" />
          <span className="font-semibold text-lg">
            {money === Infinity ? 'Sonsuz ₺' : `${money.toFixed(2)} ₺`}
          </span>
        </div>
        <button
          onClick={onEndDay}
          disabled={isButtonDisabled}
          className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-md disabled:shadow-none"
        >
          Günü Bitir
        </button>
      </div>
    </header>
  );
};

export default Header;