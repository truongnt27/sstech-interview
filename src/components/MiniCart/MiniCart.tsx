import React, {useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {useCartStore, selectCart, selectIsOpen} from '@/store/cartStore';
import CartItem from './CartItem';
import styles from './MiniCart.module.css';

export const MiniCart: React.FC = () => {
  const cart = useCartStore(selectCart);
  const isOpen = useCartStore(selectIsOpen);
  const openCart = useCartStore((state) => state.openCart);
  const closeCart = useCartStore((state) => state.closeCart);
  const initCart = useCartStore((state) => state.initCart);
  const subtotal = useCartStore((state) => state.getCartSubtotal());
  const optimisticUpdates = useCartStore((state) => state.optimisticUpdates);

  // Initialize cart on mount
  useEffect(() => {
    initCart();
  }, [initCart]);

  // Check if any items are being updated
  const isUpdating = optimisticUpdates.size > 0;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.backdrop}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.2}}
            onClick={closeCart}
          />
        )}
      </AnimatePresence>

      {/* Mini Cart Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.cartPanel}
            initial={{x: '100%', opacity: 0}}
            animate={{x: 0, opacity: 1}}
            exit={{x: '100%', opacity: 0}}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
          >
            {/* Header */}
            <div className={styles.header}>
              <h2>Shopping Cart</h2>
              <button
                className={styles.closeBtn}
                onClick={closeCart}
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
              {!cart ? (
                <div className={styles.empty}>
                  <p>Loading cart...</p>
                </div>
              ) : cart.items.length === 0 ? (
                <div className={styles.empty}>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className={styles.items}>
                  {cart.items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart && cart.items.length > 0 && (
              <div className={styles.footer}>
                <div className={styles.subtotal}>
                  <span className={styles.label}>Subtotal:</span>
                  <motion.span
                    key={subtotal}
                    initial={{scale: 0.9, opacity: 0}}
                    animate={{scale: 1, opacity: 1}}
                    transition={{duration: 0.15}}
                    className={styles.amount}
                  >
                    ${subtotal.toFixed(2)}
                  </motion.span>
                </div>

                <div className={styles.itemCount}>
                  <motion.span
                    initial={{scale: 0.9}}
                    animate={{scale: 1}}
                    transition={{duration: 0.1}}
                  >
                    {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}
                  </motion.span>
                </div>

                <button className={styles.checkoutBtn} disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Proceed to Checkout'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Toggle Button */}
      <motion.button
        className={styles.cartBtn}
        onClick={openCart}
        disabled={isOpen}
        whileHover={{scale: 1.05}}
        whileTap={{scale: 0.95}}
      >
        <span className={styles.cartIcon}>🛒</span>
        {cart && cart.items.length > 0 && (
          <motion.span
            className={styles.badge}
            initial={{scale: 0}}
            animate={{scale: 1}}
            transition={{type: 'spring', stiffness: 200, damping: 15}}
          >
            {cart.totalItems}
          </motion.span>
        )}
      </motion.button>
    </>
  );
};
