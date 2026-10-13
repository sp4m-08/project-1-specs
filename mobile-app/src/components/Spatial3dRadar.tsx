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

      // Draw radar rings (Sapphire cyber-medical console aesthetic)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      const maxRadius = Math.min(width, height) / 2 - 30;

      for (let r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 4) * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw axis grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#8CA2C2';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('FRONT (0°)', centerX - 25, centerY - maxRadius - 6);
      ctx.fillText('BACK', centerX - 14, centerY + maxRadius + 14);
      ctx.fillText('LEFT', centerX - maxRadius - 32, centerY + 4);
      ctx.fillText('RIGHT', centerX + maxRadius + 8, centerY + 4);

      // Center sensor origin (Electric Azure #38BDF8)
      ctx.fillStyle = '#38BDF8';
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

        // Color coding: Signal Yellow (#FFCD48) for hazard, Ice Blue (#93C5FD) for proximity, Azure (#38BDF8) for clear
        let color = '#38BDF8';
        if (pt.distanceMm < 800) {
          color = '#FFCD48';
        } else if (pt.distanceMm < 1200) {
          color = '#93C5FD';
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
              <div style={{ ...styles.legendDot, backgroundColor: '#93C5FD' }} />
              <span style={styles.legendText}>Proximity (0.8–1.2m)</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, backgroundColor: '#38BDF8' }} />
              <span style={styles.legendText}>Clear (&gt;1.2m)</span>
            </div>
          </div>
        </div>

        <div style={styles.canvasContainer}>
          <canvas ref={canvasRef} width={460} height={310} style={styles.canvas} />
        </div>

        <div style={styles.metaRow}>
          <div style={styles.metaBadge}>
            <span style={styles.metaLabel}>HEAD ORIENTATION VECTOR:</span>
            <span style={styles.metaValue}>Yaw: {yawDeg}° • Pitch: {pitchDeg}°</span>
          </div>

          <div style={styles.metaBadge}>
            <span style={styles.metaLabel}>ACTIVE TOPOLOGY:</span>
            <span style={styles.metaValue}>{pointCloud.length} Ultrasonic Cells</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  outerWrapper: {
    padding: '0 clamp(14px, 4vw, 20px) 24px clamp(14px, 4vw, 20px)',
  },
  card: {
    backgroundColor: '#0F1D38',
    borderRadius: '20px',
    padding: 'clamp(16px, 4vw, 24px)',
    border: '1px solid rgba(56, 189, 248, 0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.08)',
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
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  legendItem: {
    display: 'flex',
    flexDirection: 'row' as const,
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
    color: '#8CA2C2',
  },
  canvasContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#070D1E',
    borderRadius: '16px',
    border: '1px solid rgba(56, 189, 248, 0.12)',
    width: '100%',
    overflow: 'hidden',
  },
  canvas: {
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
  },
  metaRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '10px',
    borderTop: '1px solid rgba(56, 189, 248, 0.1)',
    paddingTop: '12px',
  },
  metaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0B132B',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(56, 189, 248, 0.15)',
  },
  metaLabel: {
    fontSize: '10px',
    color: '#8CA2C2',
    fontWeight: '500',
    letterSpacing: '0.3px',
  },
  metaValue: {
    fontSize: '11px',
    color: '#38BDF8',
    fontWeight: '600',
    fontFamily: 'JetBrains Mono, monospace',
  },
};
