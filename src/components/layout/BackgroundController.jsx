// src/components/layout/BackgroundController.jsx
import { useState, useEffect } from 'react';
import { ParticlesComponent } from '../ui/Particles.jsx';
import { ShootingStars, StaticStars } from '../ui/ShootingStars.jsx';

export default function BackgroundController() {
  const [isDarkMode, setIsDarkMode] = useState(
    () => document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-screen -z-50 bg-slate-100 dark:bg-slate-950">
      {isDarkMode ? (
        <>
          <StaticStars />
          <ShootingStars />
        </>
      ) : (
        <ParticlesComponent id="tsparticles-light" color="#6464FF" />
      )}
    </div>
  );
}