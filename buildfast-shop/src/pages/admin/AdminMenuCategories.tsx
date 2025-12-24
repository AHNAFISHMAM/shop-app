import { useState, useEffect } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { toast } from 'react-hot-toast'
import type { Database } from '@/lib/database.types'

type Category = Database['public']['Tables']['menu_categories']['Row']

function AdminMenuCategories() {
  const { supabase } = useSupabase()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('menu_categories').select('*')

    if (error) {
      toast.error(error.message)
      return
    }
    setCategories(data || [])
  }

  return (
    <div className="admin-menu-categories">
      <h1>Menu Categories</h1>
    </div>
  )
}

export default AdminMenuCategories
