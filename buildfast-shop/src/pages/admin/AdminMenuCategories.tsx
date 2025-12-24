import { useState, useEffect } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { toast } from 'react-hot-toast'
import type { Database } from '@/lib/database.types'

type Category = Database['public']['Tables']['menu_categories']['Row']

function AdminMenuCategories() {
  const { supabase } = useSupabase()
  const [categories, setCategories] = useState<Category[]>([])

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('menu_categories').select('*')

    if (error) {
      toast.error(error.message)
      return
    }
    setCategories(data || [])
  }

  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="admin-menu-categories">
      <h1>Menu Categories</h1>
      {/* TODO: Display categories when UI is implemented */}
      {categories.length > 0 && (
        <p className="text-sm text-muted">{categories.length} categories loaded</p>
      )}
    </div>
  )
}

export default AdminMenuCategories
