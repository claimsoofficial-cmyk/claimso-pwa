// Real-time synchronization service for agent-dashboard communication

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAgentCreatedProducts } from './agent-integration-service';

import type { Product } from '@/lib/types/common';

export type RealTimeProduct = Product;

export interface SyncStatus {
  lastSync: string;
  productsSynced: number;
  errors: string[];
  isConnected: boolean;
}

class RealTimeSyncService {
  private supabase = createClient();
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: string = new Date().toISOString();
  private isConnected: boolean = false;
  private syncErrors: string[] = [];

  // ==============================================================================
  // INITIALIZATION
  // ==============================================================================

  async initialize(userId: string): Promise<void> {
    try {
      console.log('🔄 Initializing real-time sync for user:', userId);
      
      // Set up real-time subscription for products table
      const subscription = this.supabase
        .channel('products-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            this.handleProductChange(payload);
          }
        )
        .subscribe((status) => {
          this.isConnected = status === 'SUBSCRIBED';
          console.log('📡 Real-time sync status:', status);
        });

      // Start periodic sync with agents
      this.startPeriodicSync(userId);

      console.log('✅ Real-time sync initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize real-time sync:', error);
      this.syncErrors.push(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==============================================================================
  // PERIODIC SYNC
  // ==============================================================================

  private startPeriodicSync(userId: string): void {
    // Sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      await this.syncWithAgents(userId);
    }, 30000);
  }

  private async syncWithAgents(userId: string): Promise<void> {
    try {
      console.log('🔄 Syncing with agents...');
      
      // Get latest products from agents
      const agentProducts = await getAgentCreatedProducts(userId, 50);
      
      if (agentProducts.length > 0) {
        console.log(`📦 Found ${agentProducts.length} products from agents`);
        
        // Update local cache or trigger UI updates
        this.handleAgentProducts(agentProducts);
      }

      this.lastSyncTime = new Date().toISOString();
      this.syncErrors = []; // Clear errors on successful sync
      
    } catch (error) {
      console.error('❌ Sync with agents failed:', error);
      this.syncErrors.push(`Agent sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==============================================================================
  // EVENT HANDLERS
  // ==============================================================================

  private handleProductChange(payload: any): void {
    console.log('📦 Product change detected:', payload);
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        this.handleProductCreated(newRecord);
        break;
      case 'UPDATE':
        this.handleProductUpdated(newRecord, oldRecord);
        break;
      case 'DELETE':
        this.handleProductDeleted(oldRecord);
        break;
    }
  }

  private handleProductCreated(product: RealTimeProduct): void {
    console.log('🆕 New product created:', product.product_name);
    
    // Emit custom event for UI updates
    const event = new CustomEvent('product-created', {
      detail: { product }
    });
    window.dispatchEvent(event);
  }

  private handleProductUpdated(newProduct: RealTimeProduct, oldProduct: RealTimeProduct): void {
    console.log('✏️ Product updated:', newProduct.product_name);
    
    // Emit custom event for UI updates
    const event = new CustomEvent('product-updated', {
      detail: { newProduct, oldProduct }
    });
    window.dispatchEvent(event);
  }

  private handleProductDeleted(product: RealTimeProduct): void {
    console.log('🗑️ Product deleted:', product.product_name);
    
    // Emit custom event for UI updates
    const event = new CustomEvent('product-deleted', {
      detail: { product }
    });
    window.dispatchEvent(event);
  }

  private handleAgentProducts(products: any[]): void {
    console.log('🤖 Agent products received:', products.length);
    
    // Emit custom event for UI updates
    const event = new CustomEvent('agent-products-synced', {
      detail: { products }
    });
    window.dispatchEvent(event);
  }

  // ==============================================================================
  // PUBLIC API
  // ==============================================================================

  getSyncStatus(): SyncStatus {
    return {
      lastSync: this.lastSyncTime,
      productsSynced: 0, // This would be tracked in a real implementation
      errors: this.syncErrors,
      isConnected: this.isConnected
    };
  }

  async forceSync(userId: string): Promise<void> {
    console.log('🔄 Force syncing...');
    await this.syncWithAgents(userId);
  }

  disconnect(): void {
    console.log('🔌 Disconnecting real-time sync...');
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.supabase.removeAllChannels();
    this.isConnected = false;
  }
}

// ==============================================================================
// HOOKS FOR REACT COMPONENTS
// ==============================================================================

export function useRealTimeSync(userId: string) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: new Date().toISOString(),
    productsSynced: 0,
    errors: [],
    isConnected: false
  });

  const [newProducts, setNewProducts] = useState<RealTimeProduct[]>([]);

  useEffect(() => {
    const syncService = new RealTimeSyncService();
    
    // Initialize sync
    syncService.initialize(userId);
    
    // Set up event listeners
    const handleProductCreated = (event: CustomEvent) => {
      setNewProducts(prev => [event.detail.product, ...prev.slice(0, 9)]); // Keep last 10
      setSyncStatus(prev => ({
        ...prev,
        productsSynced: prev.productsSynced + 1
      }));
    };

    const handleProductUpdated = (event: CustomEvent) => {
      // Handle product updates
      console.log('Product updated in UI:', event.detail.newProduct);
    };

    const handleProductDeleted = (event: CustomEvent) => {
      // Handle product deletions
      console.log('Product deleted in UI:', event.detail.product);
    };

    const handleAgentProductsSynced = (event: CustomEvent) => {
      // Handle agent product sync
      console.log('Agent products synced:', event.detail.products);
    };

    // Add event listeners
    window.addEventListener('product-created', handleProductCreated as EventListener);
    window.addEventListener('product-updated', handleProductUpdated as EventListener);
    window.addEventListener('product-deleted', handleProductDeleted as EventListener);
    window.addEventListener('agent-products-synced', handleAgentProductsSynced as EventListener);

    // Update sync status periodically
    const statusInterval = setInterval(() => {
      setSyncStatus(syncService.getSyncStatus());
    }, 5000);

    return () => {
      // Cleanup
      syncService.disconnect();
      clearInterval(statusInterval);
      
      window.removeEventListener('product-created', handleProductCreated as EventListener);
      window.removeEventListener('product-updated', handleProductUpdated as EventListener);
      window.removeEventListener('product-deleted', handleProductDeleted as EventListener);
      window.removeEventListener('agent-products-synced', handleAgentProductsSynced as EventListener);
    };
  }, [userId]);

  return {
    syncStatus,
    newProducts,
    forceSync: () => {
      const syncService = new RealTimeSyncService();
      return syncService.forceSync(userId);
    }
  };
}

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

export function formatSyncStatus(status: SyncStatus): string {
  if (!status.isConnected) return 'Disconnected';
  if (status.errors.length > 0) return 'Error';
  return 'Connected';
}

export function getSyncStatusColor(status: SyncStatus): string {
  if (!status.isConnected) return 'text-red-600';
  if (status.errors.length > 0) return 'text-yellow-600';
  return 'text-green-600';
}

// Export the service class for direct use
export { RealTimeSyncService };
