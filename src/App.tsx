/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ModuleId } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
import ModuleUnderConstruction from './components/ModuleUnderConstruction';
import { Sparkles, Utensils, Star, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('metricas');

  return (
    <div className="min-h-screen bg-elote-cream/40 flex flex-row text-elote-dark antialiased selection:bg-elote-yellow/40 selection:text-elote-dark">
      
      {/* 1. Sidebar Navigation (Visible on Fullscreen Desktop and Tablet, Hidden on Mobile) */}
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />

      {/* 2. Main content container (Fills the remaining width) */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden pb-16 md:pb-0">
        
        {/* 3. Top Header containing La Elotería de Zacatecas branding & Logo */}
        <Header activeModule={activeModule} />

        {/* 4. Active Module Space */}
        <main className="flex-grow flex flex-col justify-center items-center py-10 px-4 md:px-8">
          <div className="w-full max-w-4xl flex-grow flex flex-col justify-center">
            
            {/* Render selected Under Construction module under the same context */}
            <AnimatePresence mode="wait">
              <ModuleUnderConstruction key={activeModule} id={activeModule} />
            </AnimatePresence>

          </div>
        </main>

        {/* 5. Bottom Navigation Bar (Pinned on Mobile viewport, Autohide on Desktop and Tablet) */}
        <MobileBottomNav activeModule={activeModule} setActiveModule={setActiveModule} />

      </div>
    </div>
  );
}

