# SStech Interview - Mini Cart Component

I've done these tasks with Copilot and ChatGPT

## Task1 features

- **Global State Management**: Zustand for efficient, scalable state management
- **Optimistic UI Updates**: Instant UI feedback while API requests process
- **GPU-Accelerated Animations**: Smooth 60fps animations using Framer Motion and will-change CSS
- **Mock REST API**: Realistic API endpoints with configurable delays
- **Dynamic Cart Calculations**: Real-time subtotal and item count updates

## Task 3, 2 review and refeactor the PR

```
import React, {useState, useEffect} from 'react';
import {gsap} from 'gsap';

const HeroProduct = ({productId}) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((response) => response.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      });
  });

  useEffect(() => {
    if (!loading) {
      gsap.fromTo(
        '.hero-card',
        {marginTop: '100px', opacity: 0},
        {marginTop: '0px', opacity: 1, duration: 1.5}
      );
    }
  }, [loading]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="hero-card" style={{width: '100vw', padding: '20px'}}>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <span>${product.price}</span>
      <img src={product.highResImageUrl} alt="Product" />
    </div>
  );
};
export default HeroProduct;

```

### Issue 1

```
useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((response) => response.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      });
  });
```

- This hook will call on every rendering => add dependencies
- There's no clean up, so it will setState even this component is unmounted which leak the memory. Beside, we can abort the api call of previous product if needed => use AbortController to clean up

### Issue 2

```
useEffect(() => {
if (!loading) {
    gsap.fromTo(
    '.hero-card',
    {marginTop: '100px', opacity: 0},
    {marginTop: '0px', opacity: 1, duration: 1.5}
    );
}
}, [loading]);
```

- DOM global search for '.hero-card' which is expensive => use the hook useRef instead
- Change marginTop cause expensive layout reflow => use transform instead
- There's no cleanup animation => use the hook useGSAP instead

### Issue 3

```
if (loading) return <div>Loading...</div>;

return (
<div className="hero-card" style={{width: '100vw', padding: '20px'}}>
    <h1>{product.title}</h1>
    <p>{product.description}</p>
    <span>${product.price}</span>
    <img src={product.highResImageUrl} alt="Product" />
</div>
);
```

- Layout Shift isssue cause by changing from loading state to loaded state => use skeleton same size, layout and reserve space for image (using ratio)
- Images loading is not optimized => preload image for hero product, provide srcSet in case we have multiple screens

### My suggest refactor:

```
import React, {useState, useEffect, useRef} from 'react';
import {gsap} from 'gsap';
import {useGSAP} from '@gsap/react';

const HeroProduct = ({productId}) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProduct = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/products/${productId}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        // handle error here
      } finally {
        setLoading(false);
      }
    };

    loadProduct();

    return () => controller.abort();
  }, [productId]);

  useGSAP(
    () => {
      if (loading) return;
      gsap.fromTo(
        containerRef.current,
        {y: 40, opacity: 0},
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          clearProps: 'transform'
        }
      );
    },
    {dependencies: [loading], scope: containerRef}
  ); // Automatic cleanup on unmount

  if (loading)
    // Pre-allocates exact layout space for skeleton
    return (
      <div
        className="hero-card-skeleton"
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px',
          minHeight: '600px'
        }}
      >
        <div className="hero-card-title" />
        <div className="hero-card-description" />
        <div className="hero-card-price" />
        <div className="hero-card-image" />
      </div>
    );

  return (
    <div
      ref={containerRef}
      className="hero-card"
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        minHeight: '600px' // Matches skeleton height perfectly
      }}
    >
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <span style={{fontSize: '1.25rem', fontWeight: 'bold'}}>
        ${product.price}
      </span>

      <div
        style={{
          width: '100%',
          aspectRatio: '16/9',
          overflow: 'hidden',
          borderRadius: '8px',
          marginTop: '20px'
        }}
      >
        <img
          src={product.highResImageUrl}
          srcSet={`${product.lowResImageUrl || product.highResImageUrl} 480w, ${product.highResImageUrl} 1200w`}
          sizes="(max-width: 1200px) 100vw, 1200px"
          alt={product.title}
          loading="eager"
          fetchPriority="high" // preload image for hero product
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
};

export default HeroProduct;

```
