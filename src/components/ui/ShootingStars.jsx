// src/components/ui/ShootingStars.jsx
import React, { useEffect, useState, useRef } from "react";
import { cn } from "../../lib/utils";

const getRandomStartPoint = () => {
  const side = Math.floor(Math.random() * 4);
  const offset = Math.random() * window.innerWidth;
  const yOffset = Math.random() * window.innerHeight;

  switch (side) {
    case 0: return { x: offset, y: -20, angle: 45 + Math.random() * 90 }; // Top
    case 1: return { x: window.innerWidth + 20, y: yOffset, angle: 135 + Math.random() * 90 }; // Right
    case 2: return { x: offset, y: window.innerHeight + 20, angle: 225 + Math.random() * 90 }; // Bottom
    case 3: return { x: -20, y: yOffset, angle: 315 + Math.random() * 90 }; // Left
    default: return { x: 0, y: 0, angle: 45 };
  }
};

export const ShootingStars = ({
  minSpeed = 15, maxSpeed = 35, minDelay = 1000, maxDelay = 3000,
  starColor = "#FFFFFF", trailColor = "rgba(100, 100, 255, 0.4)",
  starWidth = 10, starHeight = 1, className,
}) => {
  const [star, setStar] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    let timeoutId;
    const createStar = () => {
      const { x, y, angle } = getRandomStartPoint();
      const newStar = { id: Date.now(), x, y, angle, scale: 1, speed: Math.random() * (maxSpeed - minSpeed) + minSpeed };
      setStar(newStar);
      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      timeoutId = setTimeout(createStar, randomDelay);
    };
    timeoutId = setTimeout(createStar, Math.random() * (maxDelay - minDelay) + minDelay);
    return () => clearTimeout(timeoutId);
  }, [minSpeed, maxSpeed, minDelay, maxDelay]);

  useEffect(() => {
    let animationFrame;
    const moveStar = () => {
      if (star) {
        setStar((prevStar) => {
          if (!prevStar) return null;
          const newX = prevStar.x + prevStar.speed * Math.cos((prevStar.angle * Math.PI) / 180);
          const newY = prevStar.y + prevStar.speed * Math.sin((prevStar.angle * Math.PI) / 180);
          if (newX < -50 || newX > window.innerWidth + 50 || newY < -50 || newY > window.innerHeight + 50) {
            return null;
          }
          return { ...prevStar, x: newX, y: newY };
        });
      }
      animationFrame = requestAnimationFrame(moveStar);
    };
    animationFrame = requestAnimationFrame(moveStar);
    return () => cancelAnimationFrame(animationFrame);
  }, [star]);

  return (
    <svg ref={svgRef} className={cn("w-full h-full absolute inset-0 -z-10", className)}>
      {star && (
        <rect
          key={star.id} x={star.x} y={star.y} width={starWidth * star.scale} height={starHeight} fill={`url(#gradient-${star.id})`}
          transform={`rotate(${star.angle}, ${star.x + (starWidth * star.scale) / 2}, ${star.y + starHeight / 2})`}
        />
      )}
      <defs>
        {star && (
          <linearGradient id={`gradient-${star.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: starColor, stopOpacity: 1 }} />
          </linearGradient>
        )}
      </defs>
    </svg>
  );
};

export const StaticStars = () => (
  <>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,rgba(0,0,0,0)_80%)]" />
    <div className="stars absolute inset-0 opacity-50" />
  </>
);