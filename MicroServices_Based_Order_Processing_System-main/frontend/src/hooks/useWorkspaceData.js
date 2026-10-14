import { useCallback, useEffect, useState } from 'react'
import { api, getApiError } from '../services/api.js'

const resourceNames = ['customers', 'products', 'orders', 'notifications']

export default function useWorkspaceData() {
  const [data, setData] = useState({
    customers: [],
    products: [],
    orders: [],
    notifications: [],
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const results = await Promise.allSettled(
      resourceNames.map(async (resource) => [resource, await api[resource].list()]),
    )
    const nextErrors = {}

    setData((current) => {
      const next = { ...current }
      results.forEach((result, index) => {
        const resource = resourceNames[index]
        if (result.status === 'fulfilled') {
          next[resource] = result.value[1]
        } else {
          nextErrors[resource] = getApiError(result.reason)
        }
      })
      return next
    })
    setErrors(nextErrors)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, errors, loading, refresh, setData }
}
