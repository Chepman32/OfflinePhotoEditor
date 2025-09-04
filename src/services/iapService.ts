import { Platform } from 'react-native';
import { handleIapError } from '../utils/errorHandler';

// Mock IAP service - in production this would use react-native-iap
class IAPService {
  private static instance: IAPService;
  private isInitialized = false;

  // Product IDs for different subscription tiers
  private readonly PRODUCT_IDS = {
    MONTHLY: 'com.offlinephotoeditor.monthly',
    YEARLY: 'com.offlinephotoeditor.yearly',
    LIFETIME: 'com.offlinephotoeditor.lifetime',
  };

  private constructor() {}

  static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Platform.OS === 'ios') {
        // Initialize iOS IAP
        console.log('Initializing iOS IAP...');
      } else {
        // Initialize Android IAP (Google Play Billing)
        console.log('Initializing Android IAP...');
      }

      this.isInitialized = true;
      console.log('IAP service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      handleIapError({ context: { operation: 'initialize' } });
    }
  }

  async getProducts(): Promise<any[]> {
    try {
      await this.initialize();

      // Mock product data - in production this would fetch from app stores
      const products = [
        {
          productId: this.PRODUCT_IDS.MONTHLY,
          title: 'Monthly Premium',
          description: 'Unlock all premium features with monthly subscription',
          price: '$4.99',
          priceAmount: 4.99,
          currency: 'USD',
          type: 'subscription',
        },
        {
          productId: this.PRODUCT_IDS.YEARLY,
          title: 'Yearly Premium',
          description: 'Unlock all premium features with yearly subscription',
          price: '$39.99',
          priceAmount: 39.99,
          currency: 'USD',
          type: 'subscription',
        },
        {
          productId: this.PRODUCT_IDS.LIFETIME,
          title: 'Lifetime Premium',
          description: 'Unlock all premium features forever',
          price: '$99.99',
          priceAmount: 99.99,
          currency: 'USD',
          type: 'purchase',
        },
      ];

      return products;
    } catch (error) {
      console.error('Failed to get products:', error);
      handleIapError({ context: { operation: 'getProducts' } });
      return [];
    }
  }

  async purchaseProduct(productId: string): Promise<any> {
    try {
      await this.initialize();

      console.log(`Purchasing product: ${productId}`);

      // Simulate purchase process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful purchase
      const purchase = {
        productId,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionDate: Date.now(),
        receipt: `receipt_${Date.now()}`,
        type: productId === this.PRODUCT_IDS.LIFETIME ? 'purchase' : 'subscription',
      };

      console.log('Purchase successful:', purchase);
      return purchase;
    } catch (error) {
      console.error('Purchase failed:', error);
      handleIapError({ context: { operation: 'purchaseProduct', productId } });
      throw error;
    }
  }

  async restorePurchases(): Promise<any[]> {
    try {
      await this.initialize();

      console.log('Restoring purchases...');

      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock restored purchases - empty array means no previous purchases
      const restoredPurchases: any[] = [];

      console.log('Purchase restoration completed');
      return restoredPurchases;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      handleIapError({ context: { operation: 'restorePurchases' } });
      return [];
    }
  }

  async getSubscriptionStatus(productId: string): Promise<any> {
    try {
      await this.initialize();

      // Mock subscription status - in production this would check with app store
      return {
        isActive: false,
        expiryDate: null,
        autoRenew: false,
      };
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return { isActive: false, expiryDate: null, autoRenew: false };
    }
  }

  async cancelSubscription(productId: string): Promise<void> {
    try {
      await this.initialize();

      console.log(`Cancelling subscription: ${productId}`);

      // In production, this would navigate user to app store subscription management
      // For now, just log the action
      console.log('Subscription cancellation initiated - user should be directed to app store');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      handleIapError({ context: { operation: 'cancelSubscription', productId } });
    }
  }

  // Utility methods
  getProductType(productId: string): 'subscription' | 'purchase' {
    return productId === this.PRODUCT_IDS.LIFETIME ? 'purchase' : 'subscription';
  }

  getExpiryDate(productId: string): number | null {
    const type = this.getProductType(productId);
    if (type === 'purchase') return null; // Lifetime purchase never expires

    const now = Date.now();
    switch (productId) {
      case this.PRODUCT_IDS.MONTHLY:
        return now + (30 * 24 * 60 * 60 * 1000); // 30 days
      case this.PRODUCT_IDS.YEARLY:
        return now + (365 * 24 * 60 * 60 * 1000); // 365 days
      default:
        return null;
    }
  }

  formatPrice(price: string, currency: string): string {
    return `${currency} ${price}`;
  }

  // Cleanup method
  async endConnection(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // End iOS IAP connection
        console.log('Ending iOS IAP connection...');
      } else {
        // End Android IAP connection
        console.log('Ending Android IAP connection...');
      }

      this.isInitialized = false;
      console.log('IAP connection ended');
    } catch (error) {
      console.error('Failed to end IAP connection:', error);
    }
  }
}

export const iapService = IAPService.getInstance();
export { IAPService };
