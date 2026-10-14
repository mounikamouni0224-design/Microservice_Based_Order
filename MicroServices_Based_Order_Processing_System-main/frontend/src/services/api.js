import axios from 'axios'

const directUrls = {
  customers: import.meta.env.VITE_CUSTOMER_API_URL || 'http://localhost:8081/api/customers',
  products: import.meta.env.VITE_PRODUCT_API_URL || 'http://localhost:8082/api/products',
  orders: import.meta.env.VITE_ORDER_API_URL || 'http://localhost:8083/api/orders',
  notifications: import.meta.env.VITE_NOTIFICATION_API_URL || 'http://localhost:8084/api/notifications',
}

const proxyUrls = {
  customers: '/api/customers',
  products: '/api/products',
  orders: '/api/orders',
  notifications: '/api/notifications',
}

const environmentKeys = {
  customers: 'VITE_CUSTOMER_API_URL',
  products: 'VITE_PRODUCT_API_URL',
  orders: 'VITE_ORDER_API_URL',
  notifications: 'VITE_NOTIFICATION_API_URL',
}

function createClient(service) {
  const baseURL = import.meta.env.DEV && !import.meta.env[environmentKeys[service]]
    ? proxyUrls[service]
    : directUrls[service]

  const client = axios.create({
    baseURL,
    headers: { Accept: 'application/json' },
    timeout: 10000,
  })

  return {
    async list() {
      const { data } = await client.get('')
      if (!Array.isArray(data)) {
        throw new Error(`${service} service returned an unexpected response.`)
      }
      return data
    },
    async create(record) {
      const { data } = await client.post('', record)
      return data
    },
    async update(id, record) {
      const { data } = await client.put(`/${id}`, record)
      return data
    },
    async remove(id) {
      await client.delete(`/${id}`)
    },
  }
}

export const api = Object.fromEntries(
  Object.keys(directUrls).map((service) => [service, createClient(service)]),
)

export function getApiError(error) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const detail = error.response.data?.message || error.response.data?.detail
      return detail || `The service returned an error (${error.response.status}).`
    }
    if (error.code === 'ECONNABORTED') {
      return 'The service took too long to respond. Try again.'
    }
    return 'Could not connect to the service. Check that it is running and try again.'
  }

  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}
