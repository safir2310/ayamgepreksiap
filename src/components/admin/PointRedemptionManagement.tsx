'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Gift, Plus, Pencil, Trash2, CheckCircle, XCircle, Search, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useStore } from '@/store/useStore'

interface PointRedemption {
  id: string
  name: string
  description: string
  pointsRequired: number
  productId: string | null
  active: boolean
  order: number
  product?: {
    id: string
    name: string
    image: string | null
  }
}

interface Product {
  id: string
  name: string
  image: string | null
}

export function PointRedemptionManagement() {
  const [redemptions, setRedemptions] = useState<PointRedemption[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsRequired: '',
    productId: '',
    order: '0',
    active: true,
  })

  const { token, _hasHydrated } = useStore()

  useEffect(() => {
    if (_hasHydrated) {
      loadRedemptions()
      loadProducts()
    }
  }, [_hasHydrated])

  const loadRedemptions = async () => {
    setIsLoading(true)
    try {
      if (!token) {
        toast.error('Anda belum login. Silakan login dengan PIN admin terlebih dahulu.')
        setIsLoading(false)
        return
      }

      const res = await fetch('/api/admin/point-redemptions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setRedemptions(data.redemptions || [])
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Gagal mengambil data penukaran poin')
      }
    } catch (error) {
      console.error('Error loading redemptions:', error)
      toast.error('Gagal mengambil data penukaran poin')
    } finally {
      setIsLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/admin/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!token) {
        toast.error('Anda belum login. Silakan login dengan PIN admin terlebih dahulu.')
        return
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        pointsRequired: parseInt(formData.pointsRequired),
        productId: formData.productId || null,
        order: parseInt(formData.order),
        active: formData.active,
      }

      const url = editingId
        ? `/api/admin/point-redemptions/${editingId}`
        : '/api/admin/point-redemptions'

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(editingId ? 'Menu penukaran berhasil diupdate!' : 'Menu penukaran berhasil dibuat!')
        setIsModalOpen(false)
        resetForm()
        loadRedemptions()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Gagal menyimpan menu penukaran')
      }
    } catch (error) {
      console.error('Error saving redemption:', error)
      toast.error('Gagal menyimpan menu penukaran')
    }
  }

  const handleEdit = (redemption: PointRedemption) => {
    setEditingId(redemption.id)
    setFormData({
      name: redemption.name,
      description: redemption.description,
      pointsRequired: redemption.pointsRequired.toString(),
      productId: redemption.productId || '',
      order: redemption.order.toString(),
      active: redemption.active,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus menu penukaran ini?')) {
      return
    }

    try {
      if (!token) {
        toast.error('Anda belum login. Silakan login dengan PIN admin terlebih dahulu.')
        return
      }

      const res = await fetch(`/api/admin/point-redemptions/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        toast.success('Menu penukaran berhasil dihapus!')
        loadRedemptions()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Gagal menghapus menu penukaran')
      }
    } catch (error) {
      console.error('Error deleting redemption:', error)
      toast.error('Gagal menghapus menu penukaran')
    }
  }

  const handleToggleActive = async (redemption: PointRedemption) => {
    try {
      if (!token) {
        toast.error('Anda belum login. Silakan login dengan PIN admin terlebih dahulu.')
        return
      }

      const res = await fetch(`/api/admin/point-redemptions/${redemption.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...redemption,
          active: !redemption.active,
        }),
      })

      if (res.ok) {
        toast.success(`Menu penukaran berhasil ${redemption.active ? 'dinonaktifkan' : 'diaktifkan'}!`)
        loadRedemptions()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Gagal mengupdate status')
      }
    } catch (error) {
      console.error('Error toggling active:', error)
      toast.error('Gagal mengupdate status')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      pointsRequired: '',
      productId: '',
      order: '0',
      active: true,
    })
  }

  const filteredRedemptions = redemptions.filter((redemption) =>
    redemption.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelola Penukaran Poin</h2>
          <p className="text-gray-600">Buat dan kelola produk yang dapat ditukar dengan poin</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Baru
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Cari menu penukaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Gift className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Menu</p>
                <p className="text-2xl font-bold text-gray-900">{redemptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aktif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {redemptions.filter((r) => r.active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Non-Aktif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {redemptions.filter((r) => !r.active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Redemptions List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
        </div>
      ) : filteredRedemptions.length === 0 ? (
        <Card className="p-12 text-center">
          <Gift className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Tidak ada menu penukaran ditemukan</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRedemptions.map((redemption, index) => (
            <motion.div
              key={redemption.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white border rounded-lg p-4 hover:shadow-lg transition-all ${
                redemption.active ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white ${
                        redemption.active
                          ? 'bg-gradient-to-br from-red-500 to-orange-500'
                          : 'bg-gray-400'
                      }`}
                    >
                      {redemption.product?.image ? (
                        <img
                          src={redemption.product.image}
                          alt={redemption.product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Gift className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{redemption.name}</h3>
                        {redemption.active ? (
                          <Badge className="bg-green-100 text-green-700">Aktif</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700">Non-Aktif</Badge>
                        )}
                      </div>
                      {redemption.product && (
                        <p className="text-xs text-gray-600">
                          <Package className="h-3 w-3 inline mr-1" />
                          {redemption.product.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">{redemption.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm mt-2">
                    <span className="text-gray-600">
                      <strong>Poin:</strong> {redemption.pointsRequired}
                    </span>
                    <span className="text-gray-600">
                      <strong>Urutan:</strong> {redemption.order}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(redemption)}
                    className={redemption.active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                  >
                    {redemption.active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(redemption)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(redemption.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? '✏️ Edit Menu Penukaran' : '➕ Tambah Menu Penukaran'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nama *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Ayam Geprek Gratis"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi produk..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="pointsRequired">Poin yang Dibutuhkan *</Label>
              <Input
                id="pointsRequired"
                type="number"
                value={formData.pointsRequired}
                onChange={(e) => setFormData({ ...formData, pointsRequired: e.target.value })}
                placeholder="100"
                min="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="productId">Produk (Opsional)</Label>
              <select
                id="productId"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="">Tanpa Produk (Custom Reward)</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="order">Urutan</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                min="0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Aktif (tampil di halaman user)
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              >
                {editingId ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
