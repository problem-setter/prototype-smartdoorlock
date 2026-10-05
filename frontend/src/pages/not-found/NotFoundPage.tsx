import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-12 space-y-6">
      <div className="flex flex-col items-center space-y-3">
        <div className="p-3 rounded-2xl bg-[#f7f0fd] border border-[#ecd5fb] text-[#5645d4]">
          <BrandLogo size="md" />
        </div>
        <div className="w-12 h-12 rounded-full bg-[#fef2f2] border border-[#fecaca] text-[#ef4444] flex items-center justify-center shadow-xs">
          <ShieldAlert className="h-6 w-6" />
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-mono font-semibold text-[#5645d4] px-2.5 py-1 rounded-full bg-[#f7f0fd] border border-[#ecd5fb]">
          404 - Halaman Tidak Ditemukan
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] tracking-tight">
          Akses Endpoint Tidak Terdaftar
        </h1>
        <p className="text-xs sm:text-sm text-[#787671] leading-relaxed">
          Halaman atau URL rute yang Anda tuju tidak tersedia di sistem otorisasi Smart Door Lock Fakultas Teknik Universitas Tanjungpura.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="cursor-pointer bg-white text-[#1a1a1a] border-[#e5e3df] hover:bg-[#f6f5f4]"
        >
          Kembali
        </Button>
        <Button
          onClick={() => navigate('/rooms')}
          variant="default"
          size="sm"
          leftIcon={<Home className="h-4 w-4" />}
          className="cursor-pointer bg-[#5645d4] hover:bg-[#4534b3] text-white shadow-xs"
        >
          Ke Beranda Ruangan
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
