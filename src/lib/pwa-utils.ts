// PWA utilities for service worker registration and installation

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAUtils {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Check if app is already installed
    this.checkInstallStatus();
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed');
      this.isInstalled = true;
      this.deferredPrompt = null;
    });
  }

  // Register service worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA: Service Worker registered successfully:', registration);
        this.serviceWorkerRegistration = registration;

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('PWA: New service worker found');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('PWA: New content available, please refresh');
                // You can show a notification to the user here
                this.showUpdateNotification();
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error('PWA: Service Worker registration failed:', error);
        return null;
      }
    } else {
      console.log('PWA: Service Worker not supported');
      return null;
    }
  }

  // Check if app can be installed
  canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  // Show install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('PWA: No install prompt available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        this.deferredPrompt = null;
        return true;
      } else {
        console.log('PWA: User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('PWA: Error showing install prompt:', error);
      return false;
    }
  }

  // Check if app is installed
  private checkInstallStatus() {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('PWA: App is running in standalone mode');
    }

    // Check if running as TWA (Trusted Web Activity)
    if (document.referrer.startsWith('android-app://')) {
      this.isInstalled = true;
      console.log('PWA: App is running as TWA');
    }
  }

  // Get install status
  getInstallStatus(): boolean {
    return this.isInstalled;
  }

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.log('PWA: Persistent storage:', persistent);
        return persistent;
      } catch (error) {
        console.error('PWA: Error requesting persistent storage:', error);
        return false;
      }
    }
    return false;
  }

  // Get storage estimate
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        console.log('PWA: Storage estimate:', estimate);
        return estimate;
      } catch (error) {
        console.error('PWA: Error getting storage estimate:', error);
        return null;
      }
    }
    return null;
  }

  // Show update notification
  private showUpdateNotification() {
    // You can implement a custom notification component here
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Expense Tracker Updated', {
        body: 'A new version is available. Please refresh the page.',
        icon: '/icons/icon-192x192.png'
      });
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        console.log('PWA: Notification permission:', permission);
        return permission;
      } catch (error) {
        console.error('PWA: Error requesting notification permission:', error);
        return 'denied';
      }
    }
    return 'denied';
  }

  // Register for background sync
  async registerBackgroundSync(tag: string): Promise<void> {
    if (this.serviceWorkerRegistration && 'sync' in this.serviceWorkerRegistration) {
      try {
        await (this.serviceWorkerRegistration as any).sync.register(tag);
        console.log('PWA: Background sync registered:', tag);
      } catch (error) {
        console.error('PWA: Error registering background sync:', error);
      }
    }
  }

  // Check if online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Add online/offline event listeners
  addNetworkListeners(
    onOnline: () => void,
    onOffline: () => void
  ): () => void {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }
}

// Create singleton instance
export const pwaUtils = new PWAUtils();
