export interface Product {
  id: string;
  title: string;
  price: number;
  thumbnailUrl?: string;
  description?: string;
  highResImageUrl?: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  cartId: string;
  totalItems: number;
  totalPrice: {
    amount: number;
    currency: string;
  };
  items: CartItem[];
}

export interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  optimisticUpdates: Map<string, number>;
}
