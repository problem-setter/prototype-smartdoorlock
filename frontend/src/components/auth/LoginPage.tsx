import React, { useState, useId } from "react";
import { useApp } from "@/context";
import {
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  DoorClosed,
  UserPlus,
  LogIn,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  RegistrationPayload,
  User,
} from "@/types";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

type AuthTab = "login" | "register";

export const LoginPage: React.FC = () => {
  const { users, rooms, login, registerUser } = useApp();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");

  // ── Login State ──
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Registration State ──
  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regShowPassword, setRegShowPassword] = useState<boolean>(false);
  const [regRequestedRooms, setRegRequestedRooms] = useState<string[]>([]);
  const [regDurationPreset, setRegDurationPreset] = useState<"7_DAYS" | "30_DAYS" | "PERMANENT">("7_DAYS");
  const [isSubmittingReg, setIsSubmittingReg] = useState<boolean>(false);
  const [regResult, setRegResult] = useState<{ success: boolean; message: string; user?: User } | null>(null);

  // Form IDs for Accessibility
  const loginEmailInputId = useId();
  const loginPwInputId = useId();
  const regNameId = useId();
  const regEmailId = useId();
  const regPwId = useId();

  // ── Handle Login ──
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!email.trim()) {
      setLoginError("Silakan masukkan email akun Anda.");
      return;
    }

    setIsSubmittingLogin(true);

    try {
      // 1. Attempt real Go backend authentication
      const res = await api.login({ email: email.trim(), password: password.trim() });
      if (res && res.user) {
        setIsSubmittingLogin(false);
        const loginRes = login(res.user);
        if (!loginRes.success && loginRes.message) {
          setLoginError(loginRes.message);
        }
        return;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg && !msg.includes("Failed to fetch") && !msg.includes("NetworkError")) {
        setIsSubmittingLogin(false);
        setLoginError(msg || "Email atau kata sandi tidak sesuai.");
        return;
      }
    }

    // 2. Fallback to local user matching
    const matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() ||
        u.name.toLowerCase().includes(email.trim().toLowerCase())
    );

    setIsSubmittingLogin(false);
    if (matchedUser) {
      const res = login(matchedUser);
      if (!res.success && res.message) {
        setLoginError(res.message);
      }
    } else {
      setLoginError("Kredensial tidak ditemukan pada database sivitas FT UNTAN.");
    }
  };

  // ── Handle Quick Preset Login (1-click demo switcher) ──
  const handleQuickLoginPreset = (presetUser: User) => {
    setLoginError(null);
    const res = login(presetUser);
    if (!res.success && res.message) {
      setLoginError(res.message);
    }
  };

  // ── Handle Self-Registration Submit ──
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegResult(null);

    if (!regName.trim() || !regEmail.trim()) {
      setRegResult({ success: false, message: "Mohon lengkapi nama dan email Anda." });
      return;
    }

    if (regRequestedRooms.length === 0) {
      setRegResult({ success: false, message: "Pilih minimal satu ruangan yang diajukan." });
      return;
    }

    setIsSubmittingReg(true);
    try {
      const now = new Date();
      let validUntil: string | undefined = undefined;

      if (regDurationPreset === "7_DAYS") {
        validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (regDurationPreset === "30_DAYS") {
        validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      const payload: RegistrationPayload = {
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword.trim() || undefined,
        requestedRoomIds: regRequestedRooms,
        validFrom: now.toISOString(),
        validUntil,
      };

      const res = await registerUser(payload);
      setIsSubmittingReg(false);
      setRegResult(res);
    } catch {
      setIsSubmittingReg(false);
      setRegResult({ success: false, message: "Terjadi kesalahan pada sistem pendaftaran." });
    }
  };

  const toggleRegRoom = (roomId: string) => {
    setRegRequestedRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#fafaf9] text-[#1a1a1a] flex flex-col justify-between font-sans selection:bg-[#5645d4]/15 selection:text-[#1a1a1a]">
      {/* ── Top Brand Bar ── */}
      <header className="w-full border-b border-[#e5e3df] bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <BrandLogo size="sm" showSubtitle={true} />
          <span className="text-xs text-[#787671] font-medium hidden sm:inline">
            Fakultas Teknik UNTAN
          </span>
        </div>
      </header>

      {/* ── Main Auth Card Container ── */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
        <div className="w-full max-w-md bg-white border border-[#e5e3df] rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">

          {/* Header Title */}
          <div className="text-center space-y-1">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1a1a1a]">
              Portal Kontrol Akses
            </h1>
            <p className="text-xs sm:text-sm text-[#787671]">
              Laboratorium Fakultas Teknik Universitas Tanjungpura
            </p>
          </div>

          {/* ── Mode Switcher Tabs (Masuk vs Daftar) ── */}
          <div
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#f6f5f4] border border-[#e5e3df]"
            role="tablist"
            aria-label="Pilih Mode Otentikasi"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "login"}
              onClick={() => { setActiveTab("login"); setLoginError(null); }}
              className={cn(
                "py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                activeTab === "login"
                  ? "bg-white text-[#5645d4] shadow-xs border border-[#e5e3df]"
                  : "text-[#5d5b54] hover:text-[#1a1a1a]"
              )}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Masuk</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "register"}
              onClick={() => { setActiveTab("register"); setRegResult(null); }}
              className={cn(
                "py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                activeTab === "register"
                  ? "bg-white text-[#5645d4] shadow-xs border border-[#e5e3df]"
                  : "text-[#5d5b54] hover:text-[#1a1a1a]"
              )}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Daftar</span>
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 1: FORMULIR LOGIN                                      */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <AnimatePresence mode="wait">
            {activeTab === "login" && (
              <motion.div
                key="login-section"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="space-y-4"
              >
                {/* Error Feedback Banner */}
                <AnimatePresence>
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="p-2.5 rounded-lg bg-[#fdf2f2] border border-[#fadad9] text-[#e03131] text-xs flex items-start gap-2"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="flex-1 leading-snug">{loginError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CREDENTIALS FORM */}
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  {/* Email Input */}
                  <div className="space-y-1">
                    <Label htmlFor={loginEmailInputId} className="text-xs font-semibold text-[#1a1a1a]">
                      Email
                    </Label>
                    <Input
                      id={loginEmailInputId}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="superadmin@untan.ac.id"
                      icon={<Mail className="h-3.5 w-3.5 text-[#5d5b54]" />}
                      className="font-mono text-xs sm:text-sm h-10"
                      required
                    />
                  </div>

                  {/* Password / Security PIN Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={loginPwInputId} className="text-xs font-semibold text-[#1a1a1a]">
                        Kata Sandi
                      </Label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-[#5645d4] hover:text-[#4534b3] font-medium cursor-pointer flex items-center gap-1 transition-colors p-0.5 rounded"
                      >
                        {showPassword ? (
                          <>
                            <EyeOff className="h-3 w-3" />
                            <span>Sembunyikan</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>Lihat</span>
                          </>
                        )}
                      </button>
                    </div>
                    <Input
                      id={loginPwInputId}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      icon={<Lock className="h-3.5 w-3.5 text-[#5d5b54]" />}
                      className="font-mono text-xs sm:text-sm h-10"
                      required
                    />
                  </div>

                  {/* Remember Me Switch */}
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="remember-me"
                        size="sm"
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                      />
                      <label
                        htmlFor="remember-me"
                        className="text-xs text-[#5d5b54] cursor-pointer select-none font-normal"
                      >
                        Ingat sesi login
                      </label>
                    </div>
                  </div>

                  {/* Submit Action Button */}
                  <Button
                    type="submit"
                    variant="default"
                    size="default"
                    isLoading={isSubmittingLogin}
                    className="w-full cursor-pointer font-semibold shadow-xs text-xs sm:text-sm h-10 py-2 rounded-lg"
                    rightIcon={<ArrowRight className="h-4 w-4 shrink-0" />}
                  >
                    Masuk
                  </Button>
                </form>

                {/* ── Minimalist Quick Preset Switcher ── */}
                <div className="pt-3 border-t border-[#ede9e4] space-y-1.5">
                  <div className="text-[11px] text-[#787671] text-center font-medium">
                    Akses Cepat Pengujian:
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {users.slice(0, 4).map((u) => {
                      const roleLabel =
                        u.role === "superadmin"
                          ? "Superadmin"
                          : u.role === "admin"
                          ? "Admin"
                          : "User";
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleQuickLoginPreset(u)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#fafaf9] hover:bg-[#f6f5f4] hover:text-[#5645d4] border border-[#e5e3df] text-[#5d5b54] transition-colors cursor-pointer"
                        >
                          {u.name.split(" ")[0]} ({roleLabel})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB 2: FORMULIR PENDAFTARAN DIRI                           */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab === "register" && (
              <motion.div
                key="register-section"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="space-y-3.5"
              >
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">
                    Pengajuan Akses Ruangan
                  </h3>
                  <p className="text-xs text-[#787671]">
                    Isi data diri untuk verifikasi oleh administrator laboratorium.
                  </p>
                </div>

                {/* Registration Result Banner */}
                {regResult && (
                  <div
                    className={cn(
                      "p-3 rounded-lg border text-xs space-y-2",
                      regResult.success
                        ? "bg-[#eefbf1] border-[#c6f1d6] text-[#1aae39]"
                        : "bg-[#fdf2f2] border-[#fadad9] text-[#e03131]"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {regResult.success ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#1aae39]" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#e03131]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-[#1a1a1a]">
                          {regResult.success ? "Permohonan Terkirim" : "Pendaftaran Gagal"}
                        </div>
                        <div className="text-[11px] text-[#37352f] mt-0.5 leading-relaxed">
                          {regResult.message}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setActiveTab("login");
                          setRegResult(null);
                        }}
                        className="text-xs h-8"
                      >
                        Ke Halaman Masuk
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRegResult(null)}
                        className="text-xs h-8"
                      >
                        Daftar Baru
                      </Button>
                    </div>
                  </div>
                )}

                {!regResult?.success && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <Label htmlFor={regNameId} className="text-xs font-semibold text-[#1a1a1a]">
                        Nama Lengkap <span className="text-[#e03131]">*</span>
                      </Label>
                      <Input
                        id={regNameId}
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Nama lengkap sesuai identitas"
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <Label htmlFor={regEmailId} className="text-xs font-semibold text-[#1a1a1a]">
                        Email <span className="text-[#e03131]">*</span>
                      </Label>
                      <Input
                        id={regEmailId}
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="email@untan.ac.id"
                        required
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    {/* Security PIN / Password */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={regPwId} className="text-xs font-semibold text-[#1a1a1a]">
                          Kata Sandi
                        </Label>
                        <button
                          type="button"
                          onClick={() => setRegShowPassword(!regShowPassword)}
                          className="text-[10px] text-[#5645d4] hover:underline cursor-pointer"
                        >
                          {regShowPassword ? "Sembunyikan" : "Tampilkan"}
                        </button>
                      </div>
                      <Input
                        id={regPwId}
                        type={regShowPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Buat kata sandi untuk login"
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    {/* Requested Rooms Checkbox */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                        <DoorClosed className="h-3.5 w-3.5 text-[#5645d4]" />
                        <span>Ruangan yang Diajukan <span className="text-[#e03131]">*</span></span>
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {rooms.map((room) => {
                          const isChecked = regRequestedRooms.includes(room.id);
                          return (
                            <div
                              key={room.id}
                              onClick={() => toggleRegRoom(room.id)}
                              className={cn(
                                "p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all",
                                isChecked
                                  ? "bg-[#e6e0f5] border-[#5645d4]/40 text-[#5645d4] font-medium"
                                  : "bg-white border-[#e5e3df] text-[#5d5b54] hover:bg-[#fafaf9]"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="rounded text-[#5645d4] cursor-pointer"
                              />
                              <span className="truncate">{room.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Estimated Duration Preference */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-[#1a1a1a]">
                        Durasi Akses:
                      </Label>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => setRegDurationPreset("7_DAYS")}
                          className={cn(
                            "py-1.5 px-1.5 rounded-lg text-[11px] font-mono border transition-all cursor-pointer text-center",
                            regDurationPreset === "7_DAYS"
                              ? "bg-[#e6e0f5] text-[#5645d4] border-[#5645d4]/40 font-bold"
                              : "bg-[#fafaf9] text-[#5d5b54] border-[#e5e3df] hover:bg-[#f6f5f4]"
                          )}
                        >
                          7 Hari
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegDurationPreset("30_DAYS")}
                          className={cn(
                            "py-1.5 px-1.5 rounded-lg text-[11px] font-mono border transition-all cursor-pointer text-center",
                            regDurationPreset === "30_DAYS"
                              ? "bg-[#e6e0f5] text-[#5645d4] border-[#5645d4]/40 font-bold"
                              : "bg-[#fafaf9] text-[#5d5b54] border-[#e5e3df] hover:bg-[#f6f5f4]"
                          )}
                        >
                          30 Hari
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegDurationPreset("PERMANENT")}
                          className={cn(
                            "py-1.5 px-1.5 rounded-lg text-[11px] font-mono border transition-all cursor-pointer text-center",
                            regDurationPreset === "PERMANENT"
                              ? "bg-[#e6e0f5] text-[#5645d4] border-[#5645d4]/40 font-bold"
                              : "bg-[#fafaf9] text-[#5d5b54] border-[#e5e3df] hover:bg-[#f6f5f4]"
                          )}
                        >
                          Permanen
                        </button>
                      </div>
                    </div>

                    {/* Submit Registration Button */}
                    <Button
                      type="submit"
                      variant="default"
                      size="default"
                      isLoading={isSubmittingReg}
                      className="w-full cursor-pointer font-semibold shadow-xs mt-2 text-xs sm:text-sm h-10 py-2 rounded-lg"
                      leftIcon={<UserPlus className="h-4 w-4" />}
                    >
                      Kirim Permohonan
                    </Button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Minimalist Clean Footer ── */}
      <footer className="w-full py-4 text-center text-xs text-[#787671] font-sans border-t border-[#e5e3df] bg-white/60">
        &copy; {new Date().getFullYear()} Fakultas Teknik Universitas Tanjungpura
      </footer>
    </div>
  );
};

export default LoginPage;
