import React, { useRef, useEffect } from 'react';
import { Box, Layers, Radio, RefreshCw } from 'lucide-react';
import { ObstacleCell3D } from '../types/telemetry';

interface Spatial3dRadarProps {
  pointCloud: ObstacleCell3D[];
  pitchDeg?: number;
  yawDeg?: number;
}

export const Spatial3dRadar: React.FC<Spatial3dRadarProps> = ({
  pointCloud,
  pitchDeg = 4.2,
  yawDeg = -12.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotationAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2 + 20;

      // Draw radar rings (orientation reference frame: FRONT, BACK, LEFT, RIGHT, UP, DOWN)
      ctx.strokeStyle = 'rgba(79, 172, 254, 0.15)';
      ctx.lineWidth = 1;
      const maxRadius = Math.min(width, height) / 2 - 30;

      for (let r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 4) * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw axis grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px Outfit, sans-serif';
      ctx.fillText('FRONT (0°)', centerX - 25, centerY - maxRadius - 6);
      ctx.fillText('BACK', centerX - 14, centerY + maxRadius + 14);
      ctx.fillText('LEFT', centerX - maxRadius - 32, centerY + 4);
      ctx.fillText('RIGHT', centerX + maxRadius + 8, centerY + 4);

      // Draw origin sensor node (Smart Glasses)
      ctx.fillStyle = '#00F2FE';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = '#00F2FE';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw 59 spatial obstacle points
      rotationAngle += 0.005;

      pointCloud.forEach((pt) => {
        // Project 3D (x, y, z) into 2D canvas with slight rotation
        const distNorm = Math.min(pt.distanceMm / 2000, 1.0); // max 2000mm
        const r = distNorm * maxRadius;

        // Angle theta in radians
        const angleRad = (pt.yawDeg * Math.PI) / 180 - Math.PI / 2 + rotationAngle;

        const px = centerX + r * Math.cos(angleRad);
        const py = centerY + r * Math.sin(angleRad);

        // Color coding by range (Red = Close < 800mm, Amber = 800-1200mm, Blue = Far > 1200mm)
        let color = '#38BDF8';
        if (pt.distanceMm < 800) {
          color = '#EF4444'; // Red = Near-field obstacle (<0.8m)
        } else if (pt.distanceMm < 1200) {
          color = '#F59E0B'; // Amber
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, pt.isAlertRange ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Glow for close points
        if (pt.isAlertRange) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [pointCloud]);

  return (
    <div className="glass-card" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <Layers size={20} color="#00F2FE" style={{ marginRight: 8 }} />
          <div>
            <span style={styles.title}>3-D Spatial Obstacle Map (59 Ultrasonic Cells)</span>
            <span style={styles.subtitle}>
              Orientation Transform: p = d · [cos φ cos θ, cos φ sin θ, sin φ]ᵀ
            </span>
          </div>
        </div>

        <div style={styles.legendRow}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendDot, backgroundColor: '#EF4444' }} />
            <span style={styles.legendText}>Near (&lt;0.8m)</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendDot, backgroundColor: '#F59E0B' }} />
            <span style={styles.legendText}>Mid (0.8-1.2m)</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendDot, backgroundColor: '#38BDF8' }} />
            <span style={styles.legendText}>Far (1.2-2.0m)</span>
          </div>
        </div>
      </div>

      <div style={styles.canvasContainer}>
        <canvas ref={canvasRef} width={460} height={320} style={styles.canvas} />
      </div>

      <div style={styles.metaRow}>
        <span style={styles.metaText}>Active Points: {pointCloud.length} / 59 cells</span>
        <span style={styles.metaText}>Glasses Pitch: {pitchDeg}° | Yaw: {yawDeg}°</span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '18px 20px',
    margin: '0 20px 16px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  header: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
  },
  title: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#F8FAFC',
    display: 'block',
  },
  subtitle: {
    fontSize: '11px',
    color: '#64748B',
    display: 'block',
    fontFamily: 'JetBrains Mono, monospace',
  },
  legendRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '12px',
  },
  legendItem: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '4px',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  canvasContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    padding: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  canvas: {
    maxWidth: '100%',
    height: 'auto',
  },
  metaRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '8px',
  },
  metaText: {
    fontSize: '11px',
    color: '#94A3B8',
    fontFamily: 'JetBrains Mono, monospace',
  },
};
