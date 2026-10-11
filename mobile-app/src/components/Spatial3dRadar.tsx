import React, { useRef, useEffect } from 'react';
import { Layers } from 'lucide-react';
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
      const centerY = height / 2 + 15;

      // Draw radar rings (Sauce Labs dark console aesthetic)
      ctx.strokeStyle = 'rgba(61, 220, 145, 0.15)';
      ctx.lineWidth = 1;
      const maxRadius = Math.min(width, height) / 2 - 30;

      for (let r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 4) * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw axis grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#828786';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('FRONT (0°)', centerX - 25, centerY - maxRadius - 6);
      ctx.fillText('BACK', centerX - 14, centerY + maxRadius + 14);
      ctx.fillText('LEFT', centerX - maxRadius - 32, centerY + 4);
      ctx.fillText('RIGHT', centerX + maxRadius + 8, centerY + 4);

      // Center sensor origin (Neon Pulse #3DDC91)
      ctx.fillStyle = '#3DDC91';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw obstacle point cells
      rotationAngle += 0.005;

      pointCloud.forEach((pt) => {
        const distNorm = Math.min(pt.distanceMm / 2000, 1.0);
        const r = distNorm * maxRadius;
        const angleRad = (pt.yawDeg * Math.PI) / 180 - Math.PI / 2 + rotationAngle;

        const px = centerX + r * Math.cos(angleRad);
        const py = centerY + r * Math.sin(angleRad);

        // Color coding: Signal Yellow (#FFCD48) for close, Neon Pulse (#3DDC91) for clear
        let color = '#3DDC91';
        if (pt.distanceMm < 800) {
          color = '#FFCD48';
        } else if (pt.distanceMm < 1200) {
          color = '#97DDBC';
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, pt.isAlertRange ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();

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
    <div style={styles.outerWrapper}>
      <div className="deep-abyss-card" style={styles.card}>
        <div style={styles.header}>
          <div>
            <span className="eyebrow-label">3D SPATIAL OBSTACLE MAPPING • 59 CELLS</span>
            <h3 style={styles.title}>Kinematic Radar & Volumetric Grid</h3>
          </div>

          <div style={styles.legendCluster}>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, backgroundColor: '#FFCD48' }} />
              <span style={styles.legendText}>Hazard (&lt;0.8m)</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, backgroundColor: '#97DDBC' }} />
              <span style={styles.legendText}>Proximity (0.8–1.2m)</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, backgroundColor: '#3DDC91' }} />
              <span style={styles.legendText}>Clear (&gt;1.2m)</span>
            </div>
          </div>
        </div>

        <div style={styles.canvasContainer}>
          <canvas ref={canvasRef} width={460} height={310} style={styles.canvas} />
        </div>

        <div style={styles.metaRow}>
          <span style={styles.monoSubtext}>
            Spherical Transform: p = d · [cos φ cos θ, cos φ sin θ, sin φ]ᵀ
          </span>
          <span style={styles.monoSubtext}>
            Pitch: {pitchDeg}° • Yaw: {yawDeg}°
          </span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  outerWrapper: {
    padding: '0 20px 24px 20px',
  },
  card: {
    backgroundColor: '#0E1A19',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  header: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  title: {
    fontSize: '17px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
    margin: '4px 0 0 0',
  },
  legendCluster: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  legendText: {
    fontSize: '11px',
    color: '#828786',
    letterSpacing: '-0.08px',
  },
  canvasContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070F0F',
    borderRadius: '16px',
    padding: '12px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  canvas: {
    maxWidth: '100%',
    height: 'auto',
  },
  metaRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '10px',
  },
  monoSubtext: {
    fontSize: '11px',
    color: '#828786',
    fontFamily: 'JetBrains Mono, monospace',
  },
};
