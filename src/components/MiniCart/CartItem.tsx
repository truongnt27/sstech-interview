import React from 'react';
import {motion} from 'framer-motion';
import type {CartItem as CartItemType} from '@/types';
import {useCartStore} from '@/store/cartStore';
import styles from './CartItem.module.css';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({item}) => {
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const {product} = item;

  const handleIncrement = () => {
    updateItemQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateItemQuantity(item.id, item.quantity - 1);
    }
  };

  const itemTotal = product.price * item.quantity;

  return (
    <motion.div
      className={styles.cartItem}
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.2}}
      layout
    >
      <div className={styles.thumbnail}>
        <img src={product.thumbnailUrl} alt={product.title} />
      </div>

      <div className={styles.details}>
        <h4 className={styles.title}>{product.title}</h4>
        <p className={styles.price}>${product.price.toFixed(2)}</p>
      </div>

      <div className={styles.quantity}>
        <button
          className={styles.quantityBtn}
          onClick={handleDecrement}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <motion.span
          key={item.quantity}
          initial={{scale: 0.8}}
          animate={{scale: 1}}
          transition={{duration: 0.15}}
          className={styles.quantityValue}
        >
          {item.quantity}
        </motion.span>
        <button
          className={styles.quantityBtn}
          onClick={handleIncrement}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <div className={styles.total}>${itemTotal.toFixed(2)}</div>
    </motion.div>
  );
};

export default React.memo(CartItem);
