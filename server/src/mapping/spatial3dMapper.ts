/**
 * 3-D Spatial Obstacle Mapping Engine
 * Transforms ultrasonic ranges (d) and MPU6050 yaw (theta) & pitch (phi) into 3D points
 * Formula (2) from Paper: p = d * [cos(phi)*cos(theta), cos(phi)*sin(theta), sin(phi)]^T
 */

export interface ObstacleCell3D {
  id: string;
  x: number;       // In mm
  y: number;       // In mm
  z: number;       // In mm
  distanceMm: number;
  pitchDeg: number;
  yawDeg: number;
  isAlertRange: boolean; // d < 1.0 m (1000 mm)
  timestamp: number;
}

export class Spatial3DObstacleMapper {
  private pointCloud: ObstacleCell3D[] = [];
  private readonly MAX_POINTS = 59; // Matches 59-cell obstacle map in paper Fig 7 & 16

  constructor() {
    this.seedInitialScan();
  }

  /**
   * Adds an ultrasonic range reading transformed by head orientation
   */
  public addReading(distanceMeters: number, pitchDeg: number, yawDeg: number): ObstacleCell3D {
    const distanceMm = Math.round(distanceMeters * 1000);
    const radYaw = (yawDeg * Math.PI) / 180;
    const radPitch = (pitchDeg * Math.PI) / 180;

    // Equation (2): 3D orientation transform
    const x = Math.round(distanceMm * Math.cos(radPitch) * Math.cos(radYaw));
    const y = Math.round(distanceMm * Math.cos(radPitch) * Math.sin(radYaw));
    const z = Math.round(distanceMm * Math.sin(radPitch));

    const cell: ObstacleCell3D = {
      id: `cell_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x,
      y,
      z,
      distanceMm,
      pitchDeg,
      yawDeg,
      isAlertRange: distanceMeters < 1.0,
      timestamp: Date.now(),
    };

    this.pointCloud.push(cell);
    if (this.pointCloud.length > this.MAX_POINTS) {
      this.pointCloud.shift();
    }

    return cell;
  }

  /**
   * Generates realistic 59-point initial sweep matching head scan in paper
   */
  private seedInitialScan() {
    const now = Date.now();
    for (let i = 0; i < 59; i++) {
      const yawDeg = -45 + (i % 15) * 6 + (Math.random() * 2 - 1);
      const pitchDeg = -15 + Math.floor(i / 15) * 10 + (Math.random() * 2 - 1);
      const distanceMeters = 0.5 + (i % 7) * 0.25 + Math.random() * 0.15;
      
      const distanceMm = Math.round(distanceMeters * 1000);
      const radYaw = (yawDeg * Math.PI) / 180;
      const radPitch = (pitchDeg * Math.PI) / 180;

      const x = Math.round(distanceMm * Math.cos(radPitch) * Math.cos(radYaw));
      const y = Math.round(distanceMm * Math.cos(radPitch) * Math.sin(radYaw));
      const z = Math.round(distanceMm * Math.sin(radPitch));

      this.pointCloud.push({
        id: `seed_cell_${i}`,
        x,
        y,
        z,
        distanceMm,
        pitchDeg,
        yawDeg,
        isAlertRange: distanceMeters < 1.0,
        timestamp: now - (59 - i) * 200,
      });
    }
  }

  public getPointCloud(): ObstacleCell3D[] {
    return this.pointCloud;
  }
}
