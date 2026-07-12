import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Landing } from './pages/Landing';
import { Chat } from './pages/Chat';
import { Insights } from './pages/Insights';

function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // landing, chat, insights

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <Landing onNavigate={setCurrentPage} />
          </motion.div>
        );
      case 'chat':
        return (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <Chat onNavigate={setCurrentPage} />
          </motion.div>
        );
      case 'insights':
        return (
          <motion.div
            key="insights"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <Insights onNavigate={setCurrentPage} />
          </motion.div>
        );
      default:
        return <Landing onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="w-screen h-screen bg-void text-primary relative overflow-hidden font-sans select-none">
      {/* Global Star Twinkle Background */}
      <div className="stars">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-20 animate-pulse"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDuration: Math.random() * 4 + 2 + 's',
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {renderPage()}
      </AnimatePresence>
    </div>
  );
}

export default App;
