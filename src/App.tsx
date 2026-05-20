import {MiniCart} from '@/components/MiniCart';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>SStech Interview - Mini Cart Demo</h1>
        <p>Click the cart button in the bottom-left corner to view your cart</p>
      </header>

      <main className="app-main">
        <section className="hero">
          <h2>Welcome to Our Store</h2>
          <p>
            This is a demonstration of a high-performance mini cart component
            with optimistic UI updates. Try updating item quantities to see the
            instant UI updates while the API request is processing.
          </p>
        </section>

        <section className="features">
          <h3>Key Features</h3>
          <ul>
            <li>✓ Global state management with Zustand</li>
            <li>✓ Optimistic UI updates for instant feedback</li>
            <li>✓ GPU-accelerated animations with Framer Motion</li>
            <li>✓ Mock REST API with realistic delays</li>
            <li>✓ Real-time cart subtotal calculation</li>
          </ul>
        </section>
      </main>

      {/* Mini Cart Component */}
      <MiniCart />
    </div>
  );
}

export default App;
