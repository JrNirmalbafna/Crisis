import React, { useEffect, useRef } from 'react';

const StarrySky: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Resize
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Star Properties
    const stars: { x: number; y: number; radius: number; vx: number; vy: number; alpha: number; dAlpha: number }[] = [];
    const numStars = Math.floor((width * height) / 1000); // Responsive star count

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.1,
        vx: (Math.random() - 0.5) * 0.1, // Subtle drift
        vy: (Math.random() - 0.5) * 0.1,
        alpha: Math.random(),
        dAlpha: (Math.random() * 0.02) - 0.01 // Twinkle speed
      });
    }

    // Shooting Stars
    const shootingStars: { x: number; y: number; length: number; speed: number; opacity: number; angle: number }[] = [];

    const draw = () => {
      // Clear canvas with a very subtle dark gradient/transparent fade
      ctx.clearRect(0, 0, width, height);
      
      // Update and draw stars
      for (const star of stars) {
        // Move star
        star.x += star.vx;
        star.y += star.vy;

        // Wrap around screen
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        // Twinkle
        star.alpha += star.dAlpha;
        if (star.alpha <= 0.1 || star.alpha >= 1) {
          star.dAlpha = -star.dAlpha;
        }

        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, star.alpha))})`;
        ctx.fill();
      }

      // Randomly spawn shooting stars
      if (Math.random() < 0.005) {
        shootingStars.push({
          x: Math.random() * width,
          y: 0,
          length: Math.random() * 80 + 20,
          speed: Math.random() * 10 + 5,
          opacity: 1,
          angle: Math.PI / 4 // 45 degrees
        });
      }

      // Update and draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x -= ss.speed * Math.cos(ss.angle);
        ss.y += ss.speed * Math.sin(ss.angle);
        ss.opacity -= 0.01;

        if (ss.opacity <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x + ss.length * Math.cos(ss.angle), ss.y - ss.length * Math.sin(ss.angle));
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, ss.opacity)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    };

    const animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    />
  );
};

export default StarrySky;
