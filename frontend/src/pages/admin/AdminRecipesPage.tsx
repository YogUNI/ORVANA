import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Plus, Edit3, Trash2, Utensils, Search } from 'lucide-react';

interface CommodityOption {
  id: string;
  name: string;
  unit: string;
}

interface RecipeItem {
  id?: string;
  commodityId: string;
  quantityPerPortion: number | string;
  commodity?: CommodityOption;
}

interface Recipe {
  id: string;
  name: string;
  description?: string;
  items: RecipeItem[];
}

export const AdminRecipesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<{ commodityId: string; quantityPerPortion: number }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch commodities untuk dropdown pilihan bahan
  const { data: commodities } = useQuery({
    queryKey: ['commodities-all'],
    queryFn: async () => {
      const res: any = await apiClient.get('/commodities');
      return (res.data || res) as CommodityOption[];
    },
  });

  // Fetch recipes
  const { data: recipes, isLoading, error } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const res: any = await apiClient.get('/recipes');
      return (res.data || res) as Recipe[];
    },
  });

  const openCreateModal = () => {
    setSelectedRecipe(null);
    setName('');
    setDescription('');
    setItems([{ commodityId: commodities?.[0]?.id || '', quantityPerPortion: 0.05 }]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (r: Recipe) => {
    setSelectedRecipe(r);
    setName(r.name);
    setDescription(r.description || '');
    setItems(
      r.items.map((it) => ({
        commodityId: it.commodityId,
        quantityPerPortion: Number(it.quantityPerPortion),
      }))
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    if (!commodities || commodities.length === 0) return;
    setItems([...items, { commodityId: commodities[0].id, quantityPerPortion: 0.05 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (selectedRecipe) {
        // Update header & items
        await apiClient.patch(`/recipes/${selectedRecipe.id}`, { name, description });
        await apiClient.put(`/recipes/${selectedRecipe.id}/items`, { items });
      } else {
        // Create recipe
        const created: any = await apiClient.post('/recipes', { name, description });
        const recipeId = created.data?.id || created.id;
        if (items.length > 0) {
          await apiClient.put(`/recipes/${recipeId}/items`, { items });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(
        err?.response?.data?.error?.message ||
          'Gagal menyimpan resep. Pastikan nama unik dan tidak ada bahan duplikat.'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Nama resep wajib diisi');
      return;
    }
    if (items.length === 0) {
      setFormError('Resep harus memiliki minimal 1 bahan baku komoditas');
      return;
    }

    // Cek duplikasi komoditas
    const commoditySet = new Set<string>();
    for (const item of items) {
      if (commoditySet.has(item.commodityId)) {
        setFormError('Terdapat komoditas yang sama dimasukkan lebih dari sekali');
        return;
      }
      commoditySet.add(item.commodityId);
      if (item.quantityPerPortion <= 0) {
        setFormError('Takaran porsi setiap bahan harus lebih besar dari 0 kg');
        return;
      }
    }

    mutation.mutate();
  };

  const filteredRecipes = recipes?.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">
            Resep Baku Dapur Gizi
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Standar menu gizi dan takaran bahan baku per porsi (kg) untuk kalkulasi otomatis kebutuhan dapur.
          </p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Resep Baku
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <Input
            placeholder="Cari resep menu gizi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-status-danger">
          <p>Terjadi kesalahan saat memuat resep.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['recipes'] })}
          >
            Coba Lagi
          </Button>
        </Card>
      ) : !filteredRecipes || filteredRecipes.length === 0 ? (
        <EmptyState
          title="Belum Ada Resep Baku"
          description="Tambahkan resep standar gizi massal untuk mulai menghitung kebutuhan bahan secara otomatis."
          actionText="Tambah Resep"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecipes.map((r) => (
            <Card key={r.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-brand-soft text-brand">
                      <Utensils className="w-4 h-4" />
                    </span>
                    <h3 className="font-heading font-bold text-gray-900 leading-snug">
                      {r.name}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(r)}
                    title="Ubah Resep"
                  >
                    <Edit3 className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>

                {r.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{r.description}</p>
                )}

                {/* Daftar Bahan Baku */}
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Komposisi Bahan ({r.items?.length || 0} Komoditas):
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {r.items?.map((it) => (
                      <div
                        key={it.id || it.commodityId}
                        className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded"
                      >
                        <span className="font-medium text-gray-800">
                          {it.commodity?.name || 'Komoditas'}
                        </span>
                        <span className="font-mono text-gray-600 font-semibold">
                          {Number(it.quantityPerPortion).toFixed(4)} kg / porsi
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Resep */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRecipe ? 'Ubah Resep Baku & Takaran' : 'Buat Resep Baku Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-status-danger border border-red-200 rounded text-sm">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Nama Resep
            </label>
            <Input
              placeholder="Contoh: R1 Nasi, Lele Goreng, Tumis Bayam, Pisang"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Deskripsi Menu (Opsional)
            </label>
            <Input
              placeholder="Catatan menu gizi, standar sajian..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Rincian Bahan Baku Komoditas */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase">
                Bahan Komoditas (kg per porsi)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="text-xs py-1"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Bahan
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <select
                    value={it.commodityId}
                    onChange={(e) => handleItemChange(idx, 'commodityId', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    {commodities?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.unit})
                      </option>
                    ))}
                  </select>

                  <div className="w-32 flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={it.quantityPerPortion}
                      onChange={(e) =>
                        handleItemChange(idx, 'quantityPerPortion', parseFloat(e.target.value) || 0)
                      }
                      className="text-right py-1"
                      required
                    />
                    <span className="text-xs text-gray-500 font-mono">kg</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-gray-400 hover:text-status-danger transition-colors"
                    title="Hapus baris bahan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={mutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              Simpan Resep
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
