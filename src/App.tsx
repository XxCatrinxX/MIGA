
import { useEffect, useMemo, useState } from 'react'
import {
  createOrder,
  getProducts,
  type Product,
} from './services/mockBackend'
import './App.css'

type CartItem = {
  product: Product
  quantity: number
}

const WHATSAPP_NUMBER = '523311948323'

const money = (amount: number) =>
  amount.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  })

function getWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('Todo')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        setLoading(true)
        setError('')

        setProducts(await getProducts(controller.signal))
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        setError(
          'No pudimos cargar la carta. Inténtalo de nuevo en un momento.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => controller.abort()
  }, [])

  const categories = useMemo(
    () => ['Todo', ...new Set(products.map((product) => product.category))],
    [products],
  )

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        category === 'Todo' || product.category === category

      const term = search.trim().toLowerCase()
      const matchesSearch =
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)

      return matchesCategory && matchesSearch
    })
  }, [products, category, search])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  const cartWhatsAppMessage = [
    'Hola, quiero hacer este pedido en MIGA Café:',
    '',
    ...cart.map(
      ({ product, quantity }) =>
        `${quantity} × ${product.name} — ${money(product.price * quantity)}`,
    ),
    '',
    `Total: ${money(total)}`,
  ].join('\n')

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id,
      )

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...current, { product, quantity: 1 }]
    })
  }

  function changeQuantity(productId: number, amount: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + amount }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  async function submitOrder() {
    if (checkoutLoading) {
      return
    }

    setCheckoutLoading(true)

    try {
      const order = await createOrder(
        cart.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
      )

      setCart([])
      setCartOpen(false)
      window.alert(
        `¡Pedido recibido! Tu folio es #${order.id}. Total: ${money(order.total)}.`,
      )
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Inténtalo de nuevo en un momento.'
      window.alert(`No pudimos confirmar tu pedido. ${message}`)
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="announcement">
        UN BUEN CAFÉ, UNA PAUSA PARA TI
      </div>

      <header className="header">
        <a className="brand" href="#inicio" aria-label="MIGA Café, inicio">
          <span className="brand-mark">M.</span>
          <span className="brand-copy">
            <strong>MIGA</strong>
            <small>CAFÉ DE BARRIO</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Navegación principal">
          <a href="#menu">La carta</a>
          <a href="#nosotros">Nuestro espacio</a>
        </nav>

        <button
          className="cart-button"
          onClick={() => setCartOpen(true)}
          aria-label={`Abrir carrito, ${cartCount} productos`}
        >
          <span>Mi pedido</span>
          <span className="cart-count">{cartCount}</span>
        </button>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" />
              TU PAUSA FAVORITA
            </span>

            <h1>
              Un buen café
              <br />
              sabe <em>a hogar.</em>
            </h1>

            <p>
              Café preparado al momento, algo rico recién horneado
              y un espacio para bajar el ritmo.
            </p>

            <a href="#menu" className="primary-button">
              Explora la carta <span>↗</span>
            </a>

            <div className="hero-note">
              <span className="note-star">✳</span>
              <span>Tu pausa, preparada al momento.</span>
            </div>
          </div>

          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=90"
              alt="Taza de café recién preparado en una cafetería"
            />
            <div className="image-label">
              <span>01 / EL CAFÉ DE LA CASA</span>
              <strong>Un momento para disfrutar.</strong>
            </div>
            <div className="round-stamp">
              <span>CAFÉ</span>
              <span className="stamp-star">✳</span>
              <span>RECIÉN HECHO</span>
            </div>
          </div>
        </section>

        <section className="menu-section" id="menu">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CAFÉ, PAN Y ALGO RICO</span>
              <h2>
                Nuestra carta<span>.</span>
              </h2>
            </div>
            <p>
              Algo calentito, algo recién hecho.
              <br />
              Elige tu favorito para hoy.
            </p>
          </div>

          <div className="menu-controls">
            <div className="categories" aria-label="Filtrar categorías">
              {categories.map((item) => (
                <button
                  key={item}
                  className={`category-button ${
                    category === item ? 'active' : ''
                  }`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Buscar café, pan..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar productos"
              />
            </label>
          </div>

          {loading && (
            <div className="empty-results">
              <h3>Preparando la carta...</h3>
              <p>Estamos buscando algo rico para ti.</p>
            </div>
          )}

          {!loading && error && (
            <div className="empty-results">
              <span>✳</span>
              <h3>No pudimos cargar la carta.</h3>
              <p>{error}</p>
              <button
                className="text-button"
                onClick={() => window.location.reload()}
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <div className="product-image">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="image-placeholder">
                          Imagen próximamente
                        </div>
                      )}

                      {product.tag && (
                        <span className="product-tag">{product.tag}</span>
                      )}

                      <button
                        className="quick-add"
                        onClick={() => addToCart(product)}
                        aria-label={`Agregar ${product.name} al carrito`}
                        title="Agregar al pedido"
                      >
                        +
                      </button>
                    </div>

                    <div className="product-info">
                      <div>
                        <span className="product-category">
                          {product.category}
                        </span>
                        <h3>{product.name}</h3>
                      </div>
                      <strong className="product-price">
                        {money(product.price)}
                      </strong>
                    </div>

                    <p className="product-description">
                      {product.description}
                    </p>

                    <button
                      className="add-button"
                      onClick={() => addToCart(product)}
                    >
                      Agregar al pedido <span>+</span>
                    </button>
                  </article>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="empty-results">
                  <span>✳</span>
                  <h3>
                    {products.length === 0
                      ? 'Todavía no hay productos disponibles.'
                    : 'No encontramos ese producto.'}
                  </h3>
                  <p>
                    {products.length === 0
                      ? 'Agrega productos disponibles desde el backend para mostrarlos aquí.'
                      : 'Prueba otra búsqueda o elige una categoría diferente.'}
                  </p>
                  {products.length > 0 && (
                    <button
                      className="text-button"
                      onClick={() => {
                        setSearch('')
                        setCategory('Todo')
                      }}
                    >
                      Ver toda la carta
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        <section className="philosophy" id="nosotros">
          <span className="philosophy-symbol">M.</span>
          <span className="eyebrow">UN ESPACIO PARA TI</span>
          <h2>
            Una pausa en medio del día.
            <br />
            <em>Hecha a tu gusto.</em>
          </h2>
          <p>
            Café preparado con cariño, pan recién horneado y ese
            rincón acogedor donde siempre se antoja quedarse un ratito más.
          </p>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#inicio">
          <span className="brand-mark">M.</span>
          <span className="brand-copy">
            <strong>MIGA</strong>
            <small>CAFÉ DE BARRIO</small>
          </span>
        </a>
        <span>Un espacio para disfrutar sin prisa.</span>
        <a href="#inicio" className="back-top">
          Volver arriba ↑
        </a>
      </footer>

      <a
        className="whatsapp-float"
        href={getWhatsAppUrl('Hola, quiero conocer la carta de MIGA Café.')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        title="Escríbenos por WhatsApp"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 8.5c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.6l-.5.6c-.2.2-.2.4 0 .6.5.8 1.2 1.5 2 1.9.2.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.3.6-.1.6-.4 1.1-.9 1.4-.5.3-1.1.4-1.7.2-1-.3-2.2-.9-3.3-2-1.1-1-1.8-2.2-2.1-3.2-.2-.7-.1-1.4.5-2.3Z"
            fill="currentColor"
          />
        </svg>
      </a>

      {cartOpen && (
        <div
          className="cart-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCartOpen(false)
            }
          }}
        >
          <aside
            className="cart-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            <div className="cart-header">
              <div>
                <span className="eyebrow">TU SELECCIÓN</span>
                <h2 id="cart-title">
                  Tu pedido<span>.</span>
                </h2>
              </div>
              <button
                className="close-cart"
                onClick={() => setCartOpen(false)}
                aria-label="Cerrar carrito"
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <span>✳</span>
                <h3>Tu próxima pausa empieza aquí.</h3>
                <p>Elige algo rico de la carta para comenzar.</p>
                <button
                  className="primary-button"
                  onClick={() => {
                    setCartOpen(false)
                    document
                      .getElementById('menu')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Explorar la carta <span>↗</span>
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.product.id}>
                      {item.product.image ? (
                        <img src={item.product.image} alt="" />
                      ) : (
                        <div className="image-placeholder">
                          Sin imagen
                        </div>
                      )}

                      <div className="cart-item-info">
                        <h3>{item.product.name}</h3>
                        <span>{money(item.product.price)}</span>
                        <div className="quantity-control">
                          <button
                            onClick={() =>
                              changeQuantity(item.product.id, -1)
                            }
                            aria-label={`Quitar una unidad de ${item.product.name}`}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() =>
                              changeQuantity(item.product.id, 1)
                            }
                            aria-label={`Agregar una unidad de ${item.product.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <strong>
                        {money(item.product.price * item.quantity)}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{money(total)}</strong>
                  </div>
                  <div>
                    <span>Envío</span>
                    <span>Por confirmar</span>
                  </div>
                  <p>
                    El envío se cotizará antes de confirmar tu pedido.
                  </p>
                  <button
                    className="checkout-button"
                    onClick={() => void submitOrder()}
                    disabled={checkoutLoading}
                    aria-busy={checkoutLoading}
                  >
                    {checkoutLoading
                      ? 'Enviando pedido...'
                      : 'Confirmar mi pedido'}
                    {!checkoutLoading && <span>↗</span>}
                  </button>
                  <a
                    className="whatsapp-button cart-whatsapp"
                    href={getWhatsAppUrl(cartWhatsAppMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Enviar pedido por WhatsApp</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

export default App
