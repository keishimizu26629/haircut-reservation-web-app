import { ref, computed, readonly } from 'vue'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: Date
  gender?: string
  profileImageUrl?: string
  createdAt: string
  updatedAt: string
}

export const useCustomers = () => {
  const customers = ref<Customer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 顧客数の統計
  const totalCustomers = computed(() => customers.value.length)

  // 新規顧客（今月）
  const newCustomersThisMonth = computed(() => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return customers.value.filter(customer =>
      new Date(customer.createdAt) >= thisMonth
    ).length
  })

  // 顧客一覧を取得
  const fetchCustomers = async () => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch('/api/customers')

      // モックデータ
      customers.value = [
        {
          id: '1',
          firstName: '太郎',
          lastName: '田中',
          email: 'tanaka@example.com',
          phone: '090-1234-5678',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          firstName: '花子',
          lastName: '佐藤',
          email: 'sato@example.com',
          phone: '090-2345-6789',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日前
          updatedAt: new Date().toISOString()
        }
      ]
    } catch (err: any) {
      error.value = err.message || '顧客の取得に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // 顧客を作成
  const createCustomer = async (customerData: Partial<Customer>) => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch('/api/customers', {
      //   method: 'POST',
      //   body: customerData
      // })

      console.log('Creating customer:', customerData)
      await fetchCustomers() // 再取得
    } catch (err: any) {
      error.value = err.message || '顧客の作成に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // 顧客を更新
  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // const response = await $fetch(`/api/customers/${id}`, {
      //   method: 'PUT',
      //   body: updates
      // })

      console.log('Updating customer:', id, updates)
      await fetchCustomers() // 再取得
    } catch (err: any) {
      error.value = err.message || '顧客の更新に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // 顧客を削除
  const deleteCustomer = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      // TODO: 実際のAPI呼び出しに置き換える
      // await $fetch(`/api/customers/${id}`, {
      //   method: 'DELETE'
      // })

      console.log('Deleting customer:', id)
      await fetchCustomers() // 再取得
    } catch (err: any) {
      error.value = err.message || '顧客の削除に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // 顧客を検索
  const searchCustomers = (query: string) => {
    if (!query.trim()) return customers.value

    const lowerQuery = query.toLowerCase()
    return customers.value.filter(customer =>
      customer.firstName.toLowerCase().includes(lowerQuery) ||
      customer.lastName.toLowerCase().includes(lowerQuery) ||
      customer.email.toLowerCase().includes(lowerQuery) ||
      customer.phone.includes(query)
    )
  }

  return {
    // State
    customers: readonly(customers),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    totalCustomers,
    newCustomersThisMonth,

    // Actions
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,

    // 新規追加: 顧客統計取得
    getCustomerStats: async () => {
      try {
        // TODO: 実際のAPI呼び出しに置き換える
        await fetchCustomers()
        return {
          total: totalCustomers.value,
          newThisMonth: newCustomersThisMonth.value,
          active: customers.value.length // すべてアクティブと仮定
        }
      } catch (error) {
        console.error('顧客統計の取得エラー:', error)
        return { total: 0, newThisMonth: 0, active: 0 }
      }
    }
  }
}
