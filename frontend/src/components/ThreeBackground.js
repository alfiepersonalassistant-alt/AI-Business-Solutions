import { useEffect, useRef } from 'react';

export default function ThreeBackground() {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // Create particles
    const particleCount = 80;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 1000,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: Math.random() * 0.5 + 0.2,
        size: Math.random() * 2 + 1
      });
    }

    particlesRef.current = particles;

    const animate = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
      ctx.fillRect(0, 0, width, height);

      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z -= particle.vz;

        // Reset particle when it goes too far
        if (particle.z <= 0) {
          particle.z = 1000;
          particle.x = Math.random() * width;
          particle.y = Math.random() * height;
        }

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // 3D projection
        const perspective = 500;
        const scale = perspective / (perspective + particle.z);
        const x2d = (particle.x - width / 2) * scale + width / 2;
        const y2d = (particle.y - height / 2) * scale + height / 2;
        const size = particle.size * scale;

        // Draw particle with glow
        const alpha = 1 - particle.z / 1000;
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 51, 234, ${alpha * 0.6})`; // Purple accent
        ctx.fill();

        // Draw connections
        particles.forEach((otherParticle, j) => {
          if (i !== j) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
              const otherScale = perspective / (perspective + otherParticle.z);
              const ox2d = (otherParticle.x - width / 2) * otherScale + width / 2;
              const oy2d = (otherParticle.y - height / 2) * otherScale + height / 2;

              ctx.beginPath();
              ctx.moveTo(x2d, y2d);
              ctx.lineTo(ox2d, oy2d);
              ctx.strokeStyle = `rgba(147, 51, 234, ${(1 - distance / 150) * alpha * 0.2})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        });
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
