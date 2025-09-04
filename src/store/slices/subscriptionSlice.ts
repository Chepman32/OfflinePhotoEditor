import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SubscriptionState {
  isPremium: boolean;
  subscriptionType: 'monthly' | 'yearly' | 'lifetime' | null;
  expiresAt: number | null; // timestamp
  receipt: string | null;
  isTrialActive: boolean;
  trialEndsAt: number | null;
}

const initialState: SubscriptionState = {
  isPremium: false,
  subscriptionType: null,
  expiresAt: null,
  receipt: null,
  isTrialActive: false,
  trialEndsAt: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setPremiumStatus: (state, action: PayloadAction<boolean>) => {
      state.isPremium = action.payload;
    },
    setSubscription: (state, action: PayloadAction<{
      type: 'monthly' | 'yearly' | 'lifetime';
      expiresAt: number;
      receipt: string;
    }>) => {
      state.isPremium = true;
      state.subscriptionType = action.payload.type;
      state.expiresAt = action.payload.expiresAt;
      state.receipt = action.payload.receipt;
      state.isTrialActive = false;
      state.trialEndsAt = null;
    },
    startTrial: (state, action: PayloadAction<number>) => {
      state.isTrialActive = true;
      state.trialEndsAt = action.payload;
      state.isPremium = true;
    },
    endTrial: (state) => {
      state.isTrialActive = false;
      state.trialEndsAt = null;
      state.isPremium = false;
    },
    cancelSubscription: (state) => {
      state.isPremium = false;
      state.subscriptionType = null;
      state.expiresAt = null;
      state.receipt = null;
    },
    restorePurchase: (state, action: PayloadAction<{
      type: 'monthly' | 'yearly' | 'lifetime';
      expiresAt: number;
      receipt: string;
    }>) => {
      state.isPremium = true;
      state.subscriptionType = action.payload.type;
      state.expiresAt = action.payload.expiresAt;
      state.receipt = action.payload.receipt;
    },
    checkSubscriptionExpiry: (state) => {
      const now = Date.now();
      if (state.expiresAt && now > state.expiresAt) {
        state.isPremium = false;
        state.subscriptionType = null;
        state.expiresAt = null;
        state.receipt = null;
      }
      if (state.isTrialActive && state.trialEndsAt && now > state.trialEndsAt) {
        state.isTrialActive = false;
        state.trialEndsAt = null;
        state.isPremium = false;
      }
    },
  },
});

export const {
  setPremiumStatus,
  setSubscription,
  startTrial,
  endTrial,
  cancelSubscription,
  restorePurchase,
  checkSubscriptionExpiry,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
