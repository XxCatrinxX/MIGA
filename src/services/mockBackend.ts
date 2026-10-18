export type Product = {
  id: number
  name: string
  description: string
  price: number
  category: string
  image: string
  tag?: string
}

export type OrderItem = {
  productId: number
  quantity: number
}

type MockOrder = {
  id: number
  items: Array<OrderItem & { unitPrice: number }>
  total: number
}

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Latte de la casa',
    description: 'Espresso doble con leche cremosa y un toque de cacao.',
    price: 68,
    category: 'Café',
    image:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85',
    tag: 'Favorito',
  },
  {
    id: 2,
    name: 'Capuchino',
    description: 'Espresso intenso, leche vaporizada y espuma suave.',
    price: 62,
    category: 'Café',
    image:
      'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 3,
    name: 'Cold brew',
    description: 'Café de extracción lenta, servido frío con hielo.',
    price: 65,
    category: 'Café frío',
    image:
      'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=85',
    tag: 'Refrescante',
  },
  {
    id: 4,
    name: 'Croissant de mantequilla',
    description: 'Hojaldre dorado, crujiente por fuera y suave por dentro.',
    price: 48,
    category: 'Panadería',
    image:
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 5,
    name: 'Panqué de plátano',
    description: 'Recién horneado con plátano, nuez y canela.',
    price: 55,
    category: 'Panadería',
    image:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
    tag: 'Hecho en casa',
  },
  {
    id: 6,
    name: 'Chai latte',
    description: 'Té negro con especias, leche vaporizada y miel.',
    price: 64,
    category: 'Té e infusiones',
    image:
      'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=85',
  },
]

const mockOrders: MockOrder[] = []
let nextOrderId = 1001
const simulatedResponseDelay = 350

function waitForResponse(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      signal?.removeEventListener('abort', abortRequest)
      resolve()
    }, simulatedResponseDelay)

    function abortRequest() {
      window.clearTimeout(timeout)
      signal?.removeEventListener('abort', abortRequest)
      reject(new DOMException('La solicitud fue cancelada.', 'AbortError'))
    }

    if (signal?.aborted) {
      abortRequest()
      return
    }

    signal?.addEventListener('abort', abortRequest, { once: true })
  })
}

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  await waitForResponse(signal)

  return mockProducts.map((product) => ({ ...product }))
}

export async function createOrder(
  items: OrderItem[],
): Promise<Pick<MockOrder, 'id' | 'total'>> {
  await waitForResponse()

  if (items.length === 0) {
    throw new Error('Agrega al menos un producto antes de confirmar.')
  }

  const orderItems = items.map((item) => {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error('La cantidad de los productos no es válida.')
    }

    const product = mockProducts.find(({ id }) => id === item.productId)

    if (!product) {
      throw new Error('Uno de los productos ya no está disponible.')
    }

    return { ...item, unitPrice: product.price }
  })

  const total = orderItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  )
  const order = { id: nextOrderId++, items: orderItems, total }

  mockOrders.push(order)

  return { id: order.id, total: order.total }
}
