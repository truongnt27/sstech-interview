// Simulate network delay
const API_DELAY = 800;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Initial seed data
const INITIAL_CART = {
  cartId: 'cart_88492',

  totalItems: 3,

  totalPrice: {
    amount: 149.97,
    currency: 'USD'
  },

  items: [
    {
      id: 'item_1',

      quantity: 2,

      product: {
        id: 'prod_101',

        title: 'Wireless Noise-Canceling Headphones',

        price: 49.99,

        thumbnailUrl: 'https://placehold.co/150x150/png?text=Headphones'
      }
    },

    {
      id: 'item_2',

      quantity: 1,

      product: {
        id: 'prod_202',

        title: 'Ergonomic Mouse',

        price: 50.0,

        thumbnailUrl: 'https://placehold.co/150x150/png?text=Mouse'
      }
    }
  ]
};

// simulate in-memory DB
let mockCartDB = structuredClone(INITIAL_CART);

/**
 * GET /api/cart
 */
export async function fetchCart() {
  await delay(API_DELAY);

  return structuredClone(mockCartDB);
}

/**
 * PUT /api/cart/items/{itemId}
 */
export async function updateCartItem(itemId: string, quantity: number) {
  console.log('updateCartItem call for', itemId);

  await delay(API_DELAY);

  const item = mockCartDB.items.find((item) => item.id === itemId);

  if (!item) {
    throw new Error(`Item ${itemId} not found`);
  }

  // mutate in-memory DB
  item.quantity = quantity;

  // recalculate totals
  mockCartDB.totalItems = mockCartDB.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  mockCartDB.totalPrice.amount = mockCartDB.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // round
  mockCartDB.totalPrice.amount =
    Math.round(mockCartDB.totalPrice.amount * 100) / 100;

  // return cloned response
  return structuredClone(mockCartDB);
}
