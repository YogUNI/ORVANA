import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { ROLE_LABELS } from '../../lib/labels';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { UserPlus, Search } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // State Modal Tambah User Internal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'ADMIN' | 'QUALITY_INSPECTOR' | 'AUDITOR'>('QUALITY_INSPECTOR');
  const [createError, setCreateError] = useState<string | null>(null);

  // Ambil daftar pengguna
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', statusFilter, roleFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (search) params.append('q', search);

      const res: any = await apiClient.get(`/users?${params.toString()}`);
      return res.data || res;
    },
  });

  // Mutasi Ubah Status (Aktifkan / Tangguhkan)
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) => {
      return apiClient.patch(`/users/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // Mutasi Tambah User Internal
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsCreateModalOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateError(null);
    },
    onError: (err: any) => {
      setCreateError(err.message || 'Gagal membuat akun internal.');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    createMutation.mutate({
      name: createName,
      email: createEmail,
      password: createPassword,
      role: createRole,
    });
  };

  const users = data?.data || data || [];

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-gray-900">
            Manajemen Pengguna & Verifikasi
          </h1>
          <p className="text-sm text-gray-500">
            Verifikasi pendaftaran akun lapangan atau kelola staf dinas dan auditor
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Internal</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Menunggu Verifikasi (PENDING)</option>
            <option value="ACTIVE">Aktif (ACTIVE)</option>
            <option value="SUSPENDED">Ditangguhkan (SUSPENDED)</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">Semua Peran</option>
            <option value="KITCHEN_MANAGER">Pengelola Dapur</option>
            <option value="SUPPLIER">Pemasok (Petani/Nelayan)</option>
            <option value="COORDINATOR">Koordinator</option>
            <option value="QUALITY_INSPECTOR">Pengawas Mutu</option>
            <option value="AUDITOR">Auditor Publik</option>
            <option value="ADMIN">Admin Dinas</option>
          </select>
        </div>
      </Card>

      {/* Tabel Pengguna */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-status-danger">
            Gagal memuat data pengguna. Silakan coba kembali.
          </div>
        ) : users.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Tidak ada pengguna"
              description="Tidak ditemukan pengguna dengan kriteria pencarian yang Anda pilih."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Pengguna</th>
                  <th className="px-6 py-3.5">Peran</th>
                  <th className="px-6 py-3.5">Profil/Organisasi</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-gray-700">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {u.supplierProfile?.displayName ||
                        u.coordinatorProfile?.organizationName ||
                        u.kitchens?.[0]?.name ||
                        '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        color={
                          u.status === 'ACTIVE'
                            ? 'success'
                            : u.status === 'PENDING'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {u.status === 'ACTIVE'
                          ? 'Aktif'
                          : u.status === 'PENDING'
                          ? 'Menunggu'
                          : 'Ditangguhkan'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {u.status === 'PENDING' && (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ id: u.id, status: 'ACTIVE' })}
                        >
                          Verifikasi
                        </Button>
                      )}
                      {u.status === 'ACTIVE' && u.role !== 'ADMIN' && (
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({ id: u.id, status: 'SUSPENDED' })
                          }
                          className="text-status-danger hover:bg-red-50"
                        >
                          Tangguhkan
                        </Button>
                      )}
                      {u.status === 'SUSPENDED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ id: u.id, status: 'ACTIVE' })}
                          className="text-status-success hover:bg-emerald-50"
                        >
                          Aktifkan Kembali
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Tambah User Internal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Akun Staf Internal"
      >
        {createError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-status-danger text-sm rounded">
            {createError}
          </div>
        )}
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            placeholder="Pengawas Mutu Demo"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            required
          />
          <Input
            label="Email Akun"
            type="email"
            placeholder="mutu@orvana.test"
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
            required
          />
          <Input
            label="Kata Sandi (min 8 karakter + 1 angka)"
            type="password"
            placeholder="Demo1234!"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            required
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Peran Akun Internal
            </label>
            <select
              className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-gray-300 rounded focus:ring-2 focus:ring-brand focus:outline-none"
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as any)}
            >
              <option value="QUALITY_INSPECTOR">Pengawas Mutu (QUALITY_INSPECTOR)</option>
              <option value="AUDITOR">Auditor Publik (AUDITOR)</option>
              <option value="ADMIN">Admin Dinas (ADMIN)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
            >
              Simpan Akun
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
