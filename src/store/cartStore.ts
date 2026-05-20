import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';
import type {Cart} from '@/types';
import {fetchCart, updateCartItem} from '@/services/api';

const requestVersions = new Map<string, number>(); // latest version of each item
const syncTimers = new Map<string, ReturnType<typeof setTimeout>>(); // current sync job of each item

const createVersion = (itemId: string) => {
  const requestVersion = (requestVersions.get(itemId) ?? 0) + 1;
  requestVersions.set(itemId, requestVersion);
  return requestVersion;
};

interface CartStoreState {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  // Optimistic updates tracking: itemId -> optimistic quantity
  optimisticUpdates: Map<string, number>;

  // Actions
  initCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  syncQuantity: (
    itemId: string,
    quantity: number,
    requestVersion: number
  ) => Promise<void>;
  getCartSubtotal: () => number;
  getOptimisticCart: () => Cart | null;
}

// debounce sheduled sync to handle rapid clicks
const scheduleSync = (
  itemId: string,
  quantity: number,
  requestVersion: number,
  syncQuantity: CartStoreState['syncQuantity']
) => {
  const existingTimer = syncTimers.get(itemId);

  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    syncQuantity(itemId, quantity, requestVersion);
    syncTimers.delete(itemId);
  }, 400);

  syncTimers.set(itemId, timer);
};

export const useCartStore = create<CartStoreState>()(
  subscribeWithSelector((set, get) => ({
    cart: null,
    isOpen: false,
    isLoading: false,
    error: null,
    optimisticUpdates: new Map(),

    // Initialize cart with API call
    initCart: async () => {
      set({isLoading: true, error: null});
      try {
        const cart = await fetchCart();
        set({cart, isLoading: false});
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to fetch cart';
        set({error: message, isLoading: false});
      }
    },

    // Cart visibility controls
    openCart: () => set({isOpen: true}),
    closeCart: () => set({isOpen: false}),
    toggleCart: () => set((state) => ({isOpen: !state.isOpen})),

    // Update item quantity with optimistic UI
    updateItemQuantity: (itemId: string, quantity: number) => {
      // Validate quantity
      if (quantity < 0) return 0;
      if (quantity === 0) {
        // In a real app, you might want to remove the item
        return 0;
      }

      // update the state instantly
      const requestVersion = createVersion(itemId);
      const newOptimisticUpdates = new Map(get().optimisticUpdates);
      newOptimisticUpdates.set(itemId, quantity);
      set({optimisticUpdates: newOptimisticUpdates});

      // schedule sync automatically
      scheduleSync(itemId, quantity, requestVersion, get().syncQuantity);
    },

    syncQuantity: async (
      itemId: string,
      quantity: number,
      requestVersion: number
    ) => {
      if (requestVersions.get(itemId) !== requestVersion) {
        return;
      }

      try {
        const res = await updateCartItem(itemId, quantity);

        // skip stale response
        if (requestVersions.get(itemId) !== requestVersion) {
          return;
        }

        const latestOptimisticUpdates = get().optimisticUpdates;
        const latestQuantity = latestOptimisticUpdates.get(itemId);
        const optimisticUpdates = new Map(latestOptimisticUpdates);

        if (latestQuantity === quantity) {
          optimisticUpdates.delete(itemId);
        }

        set({cart: res, optimisticUpdates});
      } catch (err) {
        // handle error here
      }
    },

    // Calculate subtotal based on current state (optimistic or real)
    getCartSubtotal: () => {
      const cart = get().getOptimisticCart();
      if (!cart) return 0;

      return cart.items.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
      }, 0);
    },

    // Get cart with optimistic updates applied
    getOptimisticCart: () => {
      const {cart, optimisticUpdates} = get();
      if (!cart) return null;

      if (optimisticUpdates.size === 0) {
        return cart;
      }

      // Create a copy with optimistic updates applied
      const optimisticCart = structuredClone(cart);
      optimisticCart.items = optimisticCart.items.map((item) => {
        const optimisticQty = optimisticUpdates.get(item.id);
        if (optimisticQty !== undefined) {
          return {...item, quantity: optimisticQty};
        }
        return item;
      });

      // Recalculate totals
      optimisticCart.totalItems = optimisticCart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      optimisticCart.totalPrice.amount =
        Math.round(
          optimisticCart.items.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          ) * 100
        ) / 100;

      return optimisticCart;
    }
  }))
);

// Selectors for better performance
export const selectCart = (state: CartStoreState) => state.getOptimisticCart();
export const selectIsOpen = (state: CartStoreState) => state.isOpen;
export const selectIsLoading = (state: CartStoreState) => state.isLoading;
export const selectError = (state: CartStoreState) => state.error;
export const selectSubtotal = (state: CartStoreState) =>
  state.getCartSubtotal();
