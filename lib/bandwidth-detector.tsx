import React, { useState, useEffect } from 'react';

/**
 * Bandwidth Detector for Liberia
 * Monitors connection quality and optimizes asset loading
 */

export type ConnectionType = 'offline' | 'slow-2g' | '2g' | '3g' | '4g';
export type BandwidthProfile = 'low' | 'medium' | 'high';

export interface BandwidthInfo {
  type: ConnectionType;
  downlink: number;      // Mbps
  rtt: number;          // Round trip time (ms)
  saveData: boolean;    // Data saver mode
  profile: BandwidthProfile;
  isLowBandwidth: boolean;
  isSlowConnection: boolean;
  shouldLazyLoad: boolean;
  shouldCompressImages: boolean;
  shouldDisableVideo: boolean;
}

class BandwidthDetector {
  private static instance: BandwidthDetector;
  private listeners: ((info: BandwidthInfo) => void)[] = [];
  private currentInfo: BandwidthInfo | null = null;
  private measurementInProgress = false;

  private constructor() {
    this.initDetection();
  }

  static getInstance(): BandwidthDetector {
    if (!BandwidthDetector.instance) {
      BandwidthDetector.instance = new BandwidthDetector();
    }
    return BandwidthDetector.instance;
  }

  private async initDetection() {
    // Initial detection
    await this.measureBandwidth();
    
    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      connection.addEventListener('change', () => {
        this.measureBandwidth();
      });
    }

    // Listen for online/offline events
    window.addEventListener('online', () => this.measureBandwidth());
    window.addEventListener('offline', () => this.measureBandwidth());
    
    // Listen for save-data preference
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if ('saveData' in connection) {
        connection.addEventListener('change', () => {
          if (connection.saveData !== this.currentInfo?.saveData) {
            this.measureBandwidth();
          }
        });
      }
    }
  }

  private async measureBandwidth(): Promise<BandwidthInfo> {
    if (this.measurementInProgress && this.currentInfo) {
      return this.currentInfo;
    }

    this.measurementInProgress = true;

    // Check if offline
    if (!navigator.onLine) {
      const info: BandwidthInfo = {
        type: 'offline',
        downlink: 0,
        rtt: 0,
        saveData: false,
        profile: 'low',
        isLowBandwidth: true,
        isSlowConnection: true,
        shouldLazyLoad: true,
        shouldCompressImages: true,
        shouldDisableVideo: true
      };
      
      this.updateInfo(info);
      this.measurementInProgress = false;
      return info;
    }

    // Get Network Information API data
    let connectionType: ConnectionType = '4g';
    let downlink = 10;
    let rtt = 50;
    let saveData = false;

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connectionType = connection.effectiveType || '4g';
      downlink = connection.downlink || 10;
      rtt = connection.rtt || 50;
      saveData = connection.saveData || false;
    }

    // Liberia: If Network API not available, run actual speed test
    if (!('connection' in navigator) || downlink === 0) {
      try {
        const speed = await this.measureSpeed();
        downlink = speed;
        connectionType = this.classifyConnection(speed);
        rtt = this.estimateRTT(speed);
      } catch (error) {
        console.warn('Speed test failed, using defaults');
      }
    }

    // Determine bandwidth profile
    const profile = this.getBandwidthProfile(downlink, connectionType);
    
    // Liberia-specific optimizations
    const isLowBandwidth = profile === 'low' || connectionType === '2g' || connectionType === 'slow-2g';
    const isSlowConnection = downlink < 1.5 || ['slow-2g', '2g'].includes(connectionType);

    const info: BandwidthInfo = {
      type: connectionType,
      downlink,
      rtt,
      saveData,
      profile,
      isLowBandwidth,
      isSlowConnection,
      shouldLazyLoad: isLowBandwidth || isSlowConnection,
      shouldCompressImages: isLowBandwidth || downlink < 2,
      shouldDisableVideo: downlink < 0.5 || connectionType === 'slow-2g'
    };

    this.updateInfo(info);
    this.measurementInProgress = false;
    return info;
  }

  private async measureSpeed(): Promise<number> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const imageUrl = `https://via.placeholder.com/100x100?t=${startTime}`;
      const img = new Image();
      
      img.onload = () => {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000; // seconds
        const imageSize = 100 * 100 * 4; // rough estimate: 100x100 RGBA = ~40KB
        const speedMbps = (imageSize * 8) / (duration * 1024 * 1024);
        resolve(Math.min(speedMbps, 10)); // Cap at 10 Mbps
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  private classifyConnection(speedMbps: number): ConnectionType {
    if (speedMbps < 0.1) return 'slow-2g';
    if (speedMbps < 0.5) return '2g';
    if (speedMbps < 1.5) return '3g';
    return '4g';
  }

  private estimateRTT(speedMbps: number): number {
    if (speedMbps < 0.1) return 2000;
    if (speedMbps < 0.5) return 1000;
    if (speedMbps < 1.5) return 300;
    return 100;
  }

  private getBandwidthProfile(downlink: number, type: ConnectionType): BandwidthProfile {
    if (downlink < 0.5 || type === 'slow-2g' || type === '2g') {
      return 'low';
    }
    if (downlink < 2 || type === '3g') {
      return 'medium';
    }
    return 'high';
  }

  private updateInfo(info: BandwidthInfo) {
    this.currentInfo = info;
    this.notifyListeners(info);
    
    // Add data attribute to HTML for CSS optimization
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.bandwidth = info.profile;
      document.documentElement.dataset.connection = info.type;
      document.documentElement.dataset.optimize = info.isLowBandwidth ? 'low' : 'high';
    }
  }

  private notifyListeners(info: BandwidthInfo) {
    this.listeners.forEach(listener => listener(info));
  }

  // Public API
  public async getBandwidthInfo(): Promise<BandwidthInfo> {
    if (this.currentInfo) {
      return this.currentInfo;
    }
    return this.measureBandwidth();
  }

  /** Synchronous getter for current cached info (may be null) */
  public getCurrentInfo(): BandwidthInfo | null {
    return this.currentInfo;
  }

  public subscribe(listener: (info: BandwidthInfo) => void): () => void {
    this.listeners.push(listener);
    
    if (this.currentInfo) {
      listener(this.currentInfo);
    }
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getImageQuality(): number {
    if (!this.currentInfo) return 0.8;
    
    if (this.currentInfo.profile === 'low') return 0.3;
    if (this.currentInfo.profile === 'medium') return 0.6;
    return 0.9;
  }

  public shouldPreload(): boolean {
    return this.currentInfo?.profile === 'high' && !this.currentInfo?.saveData;
  }

  public getLazyLoadOffset(): string {
    if (this.currentInfo?.profile === 'low') {
      return '0px'; // Load immediately when in viewport
    }
    return '200px'; // Preload before entering viewport
  }
}

// React Hook for bandwidth detection
export function useBandwidth() {
  const [info, setInfo] = useState<BandwidthInfo | null>(null);
  
  useEffect(() => {
    const detector = BandwidthDetector.getInstance();
    
    detector.getBandwidthInfo().then(setInfo);
    
    const unsubscribe = detector.subscribe(setInfo);
    
    return unsubscribe;
  }, []);
  
  return info;
}

// Liberia: Export optimized image URL (synchronous, uses cached info)
export function getOptimizedImageUrl(url: string, quality?: number): string {
  const detector = BandwidthDetector.getInstance();
  const info = detector.getCurrentInfo();
  
  if (!url) return url;
  
  // Defaults if info not yet available
  const defaultQuality = 0.8;
  const defaultWidth = 1200;
  
  // Add width parameter for responsive images
  const width = info ? (info.profile === 'low' ? 480 : info.profile === 'medium' ? 768 : 1200) : defaultWidth;
  
  // Add quality parameter
  const imgQuality = quality || (info ? detector.getImageQuality() : defaultQuality);
  
  // If using Next.js Image Optimization
  if (url.startsWith('/')) {
    return `${url}?w=${width}&q=${imgQuality * 100}&auto=format`;
  }
  
  // If using external CDN
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&q=${imgQuality * 100}&fm=webp`;
}

// Liberia: Component wrapper for bandwidth-aware rendering
export function BandwidthAwareComponent({ 
  children,
  lowBandwidth,
  highBandwidth
}: {
  children: React.ReactNode;
  lowBandwidth?: React.ReactNode;
  highBandwidth?: React.ReactNode;
}) {
  const info = useBandwidth();
  
  if (!info) return <React.Fragment>{children}</React.Fragment>;
  
  if (info.isLowBandwidth && lowBandwidth) {
    return <React.Fragment>{lowBandwidth}</React.Fragment>;
  }
  
  if (!info.isLowBandwidth && highBandwidth) {
    return <React.Fragment>{highBandwidth}</React.Fragment>;
  }
  
  return <React.Fragment>{children}</React.Fragment>;
}

export default BandwidthDetector;