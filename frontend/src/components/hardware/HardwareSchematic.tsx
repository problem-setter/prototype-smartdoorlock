import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Fingerprint,
  DoorClosed,
  Zap,
  Volume2,
  Tv,
  Info,
  Layers,
  ChevronDown,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { gsap, useGSAP, GSAP_PRESETS } from '@/lib/gsap';

export interface PinConnection {
  pin: string;
  gpio: string;
  type: 'POWER' | 'GND' | 'UART' | 'I2C' | 'GPIO' | 'PWM';
  voltage: '3.3V' | '5V' | '0V';
  targetComponent: string;
  description: string;
  wireColor: string;
  activeState?: boolean;
}

export interface HardwareComponentInfo {
  id: string;
  name: string;
  category: 'MCU' | 'SENSOR' | 'ACTUATOR' | 'DISPLAY' | 'SECURITY';
  model: string;
  protocol: string;
  voltage: string;
  status: 'ACTIVE' | 'STANDBY' | 'TRIGGERED';
  accentColor: string;
  pastelBg: string;
  borderColor: string;
  icon: React.ReactNode;
  summary: string;
  pins: { pinName: string; espPin: string; func: string; wireColor: string }[];
}

interface HardwareSchematicProps {
  solenoidLocked?: boolean;
  doorOpen?: boolean;
  alarmActive?: boolean;
  focusedRoomName?: string;
  focusedRoomCode?: string;
  className?: string;
}

export const HardwareSchematic: React.FC<HardwareSchematicProps> = ({
  solenoidLocked = true,
  doorOpen = false,
  alarmActive = false,
  focusedRoomName,
  focusedRoomCode,
  className,
}) => {
  const [selectedCompId, setSelectedCompId] = useState<string>('mcu');
  const [activeTab, setActiveTab] = useState<'visual' | 'pinout' | 'guide'>('visual');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  // GSAP: Animate circuit current loops and component selection transitions
  useGSAP(
    () => {
      // 1. Animate circuit wiring lines (SVG dashed stroke flow)
      const dataWires = gsap.utils.toArray<SVGPathElement>('.circuit-flow-data');
      if (dataWires.length > 0) {
        gsap.to(dataWires, {
          strokeDashoffset: -40,
          duration: 1.4,
          repeat: -1,
          ease: 'none',
        });
      }

      const powerWires = gsap.utils.toArray<SVGPathElement>('.circuit-flow-power');
      if (powerWires.length > 0) {
        gsap.to(powerWires, {
          strokeDashoffset: -30,
          duration: solenoidLocked ? 2.5 : 0.8,
          repeat: -1,
          ease: 'none',
        });
      }

      const alarmWires = gsap.utils.toArray<SVGPathElement>('.circuit-flow-alarm');
      if (alarmWires.length > 0) {
        if (alarmActive) {
          gsap.to(alarmWires, {
            strokeDashoffset: -20,
            duration: 0.5,
            repeat: -1,
            ease: 'none',
          });
        } else {
          gsap.killTweensOf(alarmWires);
        }
      }
    },
    {
      scope: containerRef,
      dependencies: [solenoidLocked, doorOpen, alarmActive, activeTab, isExpanded],
    }
  );

  // GSAP: Smooth micro-transition when selecting a hardware component
  useGSAP(
    () => {
      if (detailPanelRef.current) {
        gsap.fromTo(
          detailPanelRef.current,
          { opacity: 0.85, y: 3 },
          { opacity: 1, y: 0, duration: GSAP_PRESETS.durationFast, ease: GSAP_PRESETS.easeStandard }
        );
      }
    },
    {
      scope: containerRef,
      dependencies: [selectedCompId],
    }
  );

  const components: HardwareComponentInfo[] = [
    {
      id: 'mcu',
      name: 'ESP32 DevKit V1',
      category: 'MCU',
      model: 'ESP-WROOM-32 (30-Pin)',
      protocol: 'WiFi 802.11 b/g/n + BLE 4.2',
      voltage: '5V IN (Micro-USB) / 3.3V Logic',
      status: 'ACTIVE',
      accentColor: '#5645d4',
      pastelBg: '#e6e0f5',
      borderColor: '#d6b6f6',
      icon: <Cpu className="h-4 w-4" />,
      summary: 'Mikrokontroler Dual-Core Xtensa 240MHz pengendali utama komunikasi MQTT, Web Serial, verifikasi biometrik, dan relay lock.',
      pins: [
        { pinName: 'VIN / 5V', espPin: 'VIN', func: 'Power Input 5V USB', wireColor: '#e03131' },
        { pinName: '3V3', espPin: '3.3V', func: 'Regulated Output 3.3V', wireColor: '#dd5b00' },
        { pinName: 'GND', espPin: 'GND', func: 'Common Ground System', wireColor: '#1a1a1a' },
        { pinName: 'GPIO16 (TX2)', espPin: 'GPIO16', func: 'DY50 UART2 RX ← MCU TX2', wireColor: '#0075de' },
        { pinName: 'GPIO17 (RX2)', espPin: 'GPIO17', func: 'DY50 UART2 TX → MCU RX2', wireColor: '#1aae39' },
        { pinName: 'GPIO14', espPin: 'GPIO14', func: 'MC-38 Magnetic Door Reed Input (INPUT_PULLUP)', wireColor: '#7b3ff2' },
        { pinName: 'GPIO26', espPin: 'GPIO26', func: 'Relay 5V Active HIGH Trigger (Solenoid 12V)', wireColor: '#dd5b00' },
        { pinName: 'GPIO27', espPin: 'GPIO27', func: 'Active Buzzer Alarm (PWM / Tone)', wireColor: '#e03131' },
        { pinName: 'GPIO5', espPin: 'GPIO5', func: 'HC-SR04 Ultrasonic Trig Output', wireColor: '#0075de' },
        { pinName: 'GPIO18', espPin: 'GPIO18', func: 'HC-SR04 Ultrasonic Echo Input', wireColor: '#7b3ff2' },
        { pinName: 'GPIO21 (SDA)', espPin: 'GPIO21', func: 'SSD1306 OLED I2C Serial Data', wireColor: '#2a9d99' },
        { pinName: 'GPIO22 (SCL)', espPin: 'GPIO22', func: 'SSD1306 OLED I2C Serial Clock', wireColor: '#5645d4' },
      ],
    },
    {
      id: 'dy50',
      name: 'DY50 Optical Fingerprint Sensor',
      category: 'SENSOR',
      model: 'DY50 High-Speed Optical Module',
      protocol: 'UART Serial TTL 57600 baud',
      voltage: '3.3V – 5V DC',
      status: 'ACTIVE',
      accentColor: '#5645d4',
      pastelBg: '#e6e0f5',
      borderColor: '#d6b6f6',
      icon: <Fingerprint className="h-4 w-4" />,
      summary: 'Sensor biometrik sidik jari optik DY50 dengan modul DSP pemroses citra berkecepatan tinggi, kapasitas onboard 120+ template, dan verifikasi lokal < 0.2s.',
      pins: [
        { pinName: 'VCC (Merah)', espPin: '3.3V / 5V', func: 'Tegangan kerja 3.3V - 5V', wireColor: '#dd5b00' },
        { pinName: 'GND (Hitam)', espPin: 'GND', func: 'Ground referensi bersama', wireColor: '#1a1a1a' },
        { pinName: 'TX (Kuning/Putih)', espPin: 'GPIO17 (RX2)', func: 'Mengirim paket data verifikasi ke ESP32 RX2', wireColor: '#1aae39' },
        { pinName: 'RX (Hijau/Biru)', espPin: 'GPIO16 (TX2)', func: 'Menerima instruksi enroll/match dari ESP32 TX2', wireColor: '#0075de' },
      ],
    },
    {
      id: 'solenoid',
      name: '12V Solenoid Bolt & Relay',
      category: 'ACTUATOR',
      model: '1-Ch Optocoupler Relay + 12V Solenoid',
      protocol: 'GPIO Digital Output (Active HIGH)',
      voltage: '12V DC External + 5V Relay VCC',
      status: solenoidLocked ? 'ACTIVE' : 'TRIGGERED',
      accentColor: solenoidLocked ? '#1aae39' : '#dd5b00',
      pastelBg: solenoidLocked ? '#d9f3e1' : '#ffe8d4',
      borderColor: solenoidLocked ? '#d2f4d9' : '#fbd6b8',
      icon: <Zap className="h-4 w-4" />,
      summary: 'Aktuator pengunci elektromagnetik 12V 1.5A digerakkan melalui modul relay 5V terisolasi optocoupler (Active HIGH) dengan fail-secure auto-relock 5 detik.',
      pins: [
        { pinName: 'Relay IN', espPin: 'GPIO26', func: 'Active HIGH Signal (3.3V = Unlock, 0V = Lock)', wireColor: '#dd5b00' },
        { pinName: 'Relay VCC', espPin: 'VIN (5V)', func: 'Power kumparan koil relay 5V', wireColor: '#e03131' },
        { pinName: 'Relay GND', espPin: 'GND', func: 'Ground isolator relay', wireColor: '#1a1a1a' },
        { pinName: 'Relay COM & NO', espPin: 'External 12V', func: 'Switching daya solenoid 12V DC', wireColor: '#793400' },
      ],
    },
    {
      id: 'mc38',
      name: 'MC-38 Magnetic Door Sensor',
      category: 'SENSOR',
      model: 'MC-38 Normally Closed (NC)',
      protocol: 'GPIO Digital Input (Internal Pull-Up)',
      voltage: '3.3V Logic Level',
      status: doorOpen ? 'TRIGGERED' : 'ACTIVE',
      accentColor: doorOpen ? '#dd5b00' : '#0075de',
      pastelBg: doorOpen ? '#fef7d6' : '#dcecfa',
      borderColor: doorOpen ? '#f9e79f' : '#bde0fe',
      icon: <DoorClosed className="h-4 w-4" />,
      summary: 'Sensor reed switch magnetik pada kusen pintu. Saat daun pintu rapat, kontak terhubung ke GND (LOW = CLOSED). Saat pintu dibuka, input PULL-UP bernilai HIGH.',
      pins: [
        { pinName: 'Kabel Kontak 1', espPin: 'GPIO14', func: 'Digital Input (INPUT_PULLUP)', wireColor: '#7b3ff2' },
        { pinName: 'Kabel Kontak 2', espPin: 'GND', func: 'Ground Loop Switch', wireColor: '#1a1a1a' },
      ],
    },
    {
      id: 'buzzer',
      name: 'Active Piezo Buzzer 5V',
      category: 'ACTUATOR',
      model: '5V DC Active Buzzer Module',
      protocol: 'GPIO Digital / PWM Alarm Output',
      voltage: '3.3V – 5V DC',
      status: alarmActive ? 'TRIGGERED' : 'STANDBY',
      accentColor: alarmActive ? '#e03131' : '#5d5b54',
      pastelBg: alarmActive ? '#fdf2f2' : '#fafaf9',
      borderColor: alarmActive ? '#fadad9' : '#e5e3df',
      icon: <Volume2 className="h-4 w-4" />,
      summary: 'Buzzer piezoelektrik alarm lokal yang berbunyi saat terjadi pelanggaran akses, verifikasi sidik jari gagal 3x berturut-turut, atau batas durasi pintu terbuka terlampaui.',
      pins: [
        { pinName: 'I/O Pin (+)', espPin: 'GPIO27', func: 'Digital Trigger / PWM Alarm 2.7kHz', wireColor: '#e03131' },
        { pinName: 'GND (-)', espPin: 'GND', func: 'Common Ground', wireColor: '#1a1a1a' },
      ],
    },
    {
      id: 'hcsr04',
      name: 'HC-SR04 Ultrasonic Sensor',
      category: 'SENSOR',
      model: 'HC-SR04 Distance Measurement Module',
      protocol: 'Trigger Pulse / Echo Duration',
      voltage: '5V DC VCC / 3.3V Logic',
      status: 'ACTIVE',
      accentColor: '#0075de',
      pastelBg: '#dcecfa',
      borderColor: '#bde0fe',
      icon: <Radio className="h-4 w-4" />,
      summary: 'Sensor ultrasonik untuk mendeteksi keberadaan pengunjung di depan pintu guna mengaktifkan layar OLED dan iluminasi status secara otomatis.',
      pins: [
        { pinName: 'VCC', espPin: 'VIN (5V)', func: 'Daya operasi 5V', wireColor: '#e03131' },
        { pinName: 'GND', espPin: 'GND', func: 'Common Ground', wireColor: '#1a1a1a' },
        { pinName: 'Trig', espPin: 'GPIO5', func: 'Ultrasonic Trigger Pulse (10µs Output)', wireColor: '#0075de' },
        { pinName: 'Echo', espPin: 'GPIO18', func: 'Ultrasonic Echo Pulse Input (via divider)', wireColor: '#7b3ff2' },
      ],
    },
    {
      id: 'oled',
      name: 'SSD1306 OLED Display (0.96")',
      category: 'DISPLAY',
      model: '128x64 Monochrome I2C OLED',
      protocol: 'I2C (Address: 0x3C, 400kHz)',
      voltage: '3.3V DC',
      status: 'ACTIVE',
      accentColor: '#2a9d99',
      pastelBg: '#d9f3e1',
      borderColor: '#b2e8cc',
      icon: <Tv className="h-4 w-4" />,
      summary: 'Layar tampilan status di pintu untuk menampilkan instruksi pemindaian sidik jari DY50, nama pengguna yang berhasil masuk, jam real-time, dan status kunci.',
      pins: [
        { pinName: 'VCC', espPin: '3.3V', func: 'Daya operasi 3.3V', wireColor: '#dd5b00' },
        { pinName: 'GND', espPin: 'GND', func: 'Common Ground', wireColor: '#1a1a1a' },
        { pinName: 'SDA', espPin: 'GPIO21', func: 'I2C Serial Data line', wireColor: '#2a9d99' },
        { pinName: 'SCL', espPin: 'GPIO22', func: 'I2C Serial Clock line', wireColor: '#5645d4' },
      ],
    },
  ];

  const selectedComp = components.find((c) => c.id === selectedCompId) || components[0];

  return (
    <div ref={containerRef} className={cn('bg-white border border-[#e5e3df] rounded-lg shadow-notion-1 overflow-hidden font-sans', className)}>
      {/* Header Bar */}
      <div className="p-3 sm:p-3.5 border-b border-[#e5e3df] flex items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-7 w-7 rounded-md bg-[#e6e0f5] text-[#5645d4] border border-[#d6b6f6] flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-[#1a1a1a] tracking-tight truncate">
                Skematik &amp; Pinout Hardware ESP32
              </h3>
              {focusedRoomCode ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-medium bg-[#e6e0f5] text-[#5645d4] border border-[#d6b6f6] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5645d4] animate-pulse shrink-0" />
                  Live: {focusedRoomName || focusedRoomCode}
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-mono font-medium bg-[#eefbf1] text-[#1aae39] border border-[#d2f4d9]">
                  <CheckCircle2 className="h-3 w-3" />
                  Sirkuit Terverifikasi
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#5d5b54] truncate">
              Arsitektur perkabelan GPIO mikrokontroler, modul biometrik DY50, sensor MC-38, ultrasonik HC-SR04, &amp; relay solenoid
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* View Tab Switcher */}
          <div className="flex items-center bg-[#fafaf9] p-0.5 rounded-md border border-[#e5e3df] text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer',
                activeTab === 'visual'
                  ? 'bg-white font-semibold text-[#5645d4] shadow-xs'
                  : 'text-[#5d5b54] hover:text-[#1a1a1a]'
              )}
            >
              Visual Skema
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pinout')}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer font-mono',
                activeTab === 'pinout'
                  ? 'bg-white font-semibold text-[#5645d4] shadow-xs'
                  : 'text-[#5d5b54] hover:text-[#1a1a1a]'
              )}
            >
              Tabel GPIO
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0 cursor-pointer text-[#5d5b54] hover:text-[#1a1a1a]"
            aria-label={isExpanded ? 'Sembunyikan skematik' : 'Tampilkan skematik'}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isExpanded ? 'rotate-180' : '')} />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {activeTab === 'visual' ? (
              <div className="p-3 sm:p-4 space-y-4">
                {/* Interactive Component Chip Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {components.map((comp) => {
                    const isSelected = selectedCompId === comp.id;
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => setSelectedCompId(comp.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer shrink-0',
                          isSelected
                            ? 'bg-[#5645d4] text-white border-[#5645d4] shadow-xs'
                            : 'bg-white text-[#37352f] border-[#e5e3df] hover:border-[#d6b6f6] hover:bg-[#fafaf9]'
                        )}
                      >
                        <span className={cn('shrink-0', isSelected ? 'text-white' : 'text-[#5645d4]')}>
                          {comp.icon}
                        </span>
                        <span className="truncate">{comp.name.split(' ')[0]}</span>
                        {comp.status === 'TRIGGERED' && (
                          <span className="w-2 h-2 rounded-full bg-[#dd5b00] animate-ping shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Main Visual Interactive Stage */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                  {/* Left: Circuit Block Diagram Schematic */}
                  <div className="lg:col-span-7 bg-[#0a1530] text-white rounded-lg p-3 sm:p-4 border border-[#1a2a52] relative overflow-hidden shadow-inner font-mono text-xs">
                    {/* Background Tech Grid */}
                    <div
                      className="absolute inset-0 opacity-15 pointer-events-none"
                      style={{
                        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                      }}
                    />

                    {/* Central ESP32 MCU Node */}
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between border-b border-[#1a2a52] pb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-[#5645d4]/30 border border-[#5645d4]/60 text-[#d6b6f6]">
                            <Cpu className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">ESP32 DevKit V1 (30-Pin)</div>
                            <div className="text-[10px] text-[#a4a097]">Sistem Bus GPIO &amp; UART</div>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#1aae39]/20 text-[#86efac] border border-[#1aae39]/30">
                          3.3V Logic Safe
                        </span>
                      </div>

                      {/* Interactive Wiring Graph Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {/* Module 1: DY50 */}
                        <div
                          onClick={() => setSelectedCompId('dy50')}
                          className={cn(
                            'p-2 rounded border cursor-pointer transition-all space-y-1',
                            selectedCompId === 'dy50'
                              ? 'bg-[#5645d4]/30 border-[#5645d4] shadow-xs'
                              : 'bg-[#0f1d3e] border-[#1a2a52] hover:border-[#5645d4]/60'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#d6b6f6] flex items-center gap-1">
                              <Fingerprint className="h-3 w-3" /> DY50 Biometrik
                            </span>
                            <span className="text-[9.5px] px-1 rounded bg-[#5645d4]/40 text-white">UART2</span>
                          </div>
                          <div className="text-[10px] text-[#a4a097] space-y-0.5">
                            <div className="flex justify-between">
                              <span>TX → GPIO17 (RX2)</span>
                              <span className="text-[#86efac]">Data In</span>
                            </div>
                            <div className="flex justify-between">
                              <span>RX ← GPIO16 (TX2)</span>
                              <span className="text-[#86efac]">Data Out</span>
                            </div>
                          </div>
                        </div>

                        {/* Module 2: Solenoid Relay */}
                        <div
                          onClick={() => setSelectedCompId('solenoid')}
                          className={cn(
                            'p-2 rounded border cursor-pointer transition-all space-y-1',
                            selectedCompId === 'solenoid'
                              ? 'bg-[#5645d4]/30 border-[#5645d4] shadow-xs'
                              : 'bg-[#0f1d3e] border-[#1a2a52] hover:border-[#5645d4]/60'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#fbd6b8] flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Solenoid &amp; Relay
                            </span>
                            <span className={cn('text-[9.5px] px-1 rounded', solenoidLocked ? 'bg-[#1aae39]/30 text-[#86efac]' : 'bg-[#dd5b00]/30 text-[#fbd6b8]')}>
                              {solenoidLocked ? 'LOCKED' : 'UNLOCKED'}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#a4a097] space-y-0.5">
                            <div className="flex justify-between">
                              <span>IN ← GPIO26</span>
                              <span className={solenoidLocked ? 'text-[#86efac]' : 'text-[#fbd6b8]'}>
                                {solenoidLocked ? 'LOW (Lock)' : 'HIGH (Unlock)'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Power</span>
                              <span>Ext 12V DC</span>
                            </div>
                          </div>
                        </div>

                        {/* Module 3: MC-38 Sensor */}
                        <div
                          onClick={() => setSelectedCompId('mc38')}
                          className={cn(
                            'p-2 rounded border cursor-pointer transition-all space-y-1',
                            selectedCompId === 'mc38'
                              ? 'bg-[#5645d4]/30 border-[#5645d4] shadow-xs'
                              : 'bg-[#0f1d3e] border-[#1a2a52] hover:border-[#5645d4]/60'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#bde0fe] flex items-center gap-1">
                              <DoorClosed className="h-3 w-3" /> Sensor MC-38
                            </span>
                            <span className={cn('text-[9.5px] px-1 rounded', doorOpen ? 'bg-[#dd5b00]/30 text-[#fbd6b8]' : 'bg-[#1aae39]/30 text-[#86efac]')}>
                              {doorOpen ? 'OPEN' : 'CLOSED'}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#a4a097] space-y-0.5">
                            <div className="flex justify-between">
                              <span>Reed Switch → GPIO14</span>
                              <span className={doorOpen ? 'text-[#fbd6b8]' : 'text-[#86efac]'}>
                                {doorOpen ? 'HIGH (Buka)' : 'LOW (Tutup)'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Pull-Up</span>
                              <span>Internal 45kΩ</span>
                            </div>
                          </div>
                        </div>

                        {/* Module 4: Buzzer Alarm */}
                        <div
                          onClick={() => setSelectedCompId('buzzer')}
                          className={cn(
                            'p-2 rounded border cursor-pointer transition-all space-y-1',
                            selectedCompId === 'buzzer'
                              ? 'bg-[#5645d4]/30 border-[#5645d4] shadow-xs'
                              : 'bg-[#0f1d3e] border-[#1a2a52] hover:border-[#5645d4]/60'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#fadad9] flex items-center gap-1">
                              <Volume2 className="h-3 w-3" /> Piezo Buzzer
                            </span>
                            <span className={cn('text-[9.5px] px-1 rounded', alarmActive ? 'bg-[#e03131]/40 text-[#fca5a5] animate-pulse' : 'bg-[#1a2a52] text-[#a4a097]')}>
                              {alarmActive ? 'ALARM ON' : 'IDLE'}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#a4a097] space-y-0.5">
                            <div className="flex justify-between">
                              <span>Trigger ← GPIO27</span>
                              <span className={alarmActive ? 'text-[#fca5a5]' : 'text-[#a4a097]'}>
                                {alarmActive ? 'PWM 2.7kHz' : 'LOW (Mute)'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Alert Logic</span>
                              <span>Timeout / Tamper</span>
                            </div>
                          </div>
                        </div>

                        {/* Module 5: HC-SR04 Ultrasonic */}
                        <div
                          onClick={() => setSelectedCompId('hcsr04')}
                          className={cn(
                            'p-2 rounded border cursor-pointer transition-all space-y-1 sm:col-span-2',
                            selectedCompId === 'hcsr04'
                              ? 'bg-[#5645d4]/30 border-[#5645d4] shadow-xs'
                              : 'bg-[#0f1d3e] border-[#1a2a52] hover:border-[#5645d4]/60'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#bde0fe] flex items-center gap-1">
                              <Radio className="h-3 w-3" /> HC-SR04 Ultrasonik
                            </span>
                            <span className="text-[9.5px] px-1 rounded bg-[#0075de]/30 text-[#86efac]">PRESENCE</span>
                          </div>
                          <div className="text-[10px] text-[#a4a097] grid grid-cols-2 gap-2">
                            <div className="flex justify-between">
                              <span>Trig ← GPIO5 (Pulse)</span>
                              <span className="text-[#86efac]">10µs Output</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Echo → GPIO18 (In)</span>
                              <span className="text-[#86efac]">Pulse Width</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Power Distribution Footer */}
                      <div className="p-2 rounded bg-[#070f24] border border-[#1a2a52] text-[10.5px] flex items-center justify-between text-[#a4a097]">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1aae39]" />
                          Common Ground Bus (GND Shared)
                        </span>
                        <span>Daya Logika: 3.3V DC</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Selected Component Detailed Specification */}
                  <div className="lg:col-span-5 bg-white border border-[#e5e3df] rounded-lg p-3 sm:p-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-[#e5e3df] pb-2.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: selectedComp.pastelBg,
                            borderColor: selectedComp.borderColor,
                            color: selectedComp.accentColor,
                          }}
                        >
                          {selectedComp.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-[13px] text-[#1a1a1a] truncate">
                            {selectedComp.name}
                          </h4>
                          <p className="text-[11px] text-[#5d5b54] font-mono truncate">
                            {selectedComp.model}
                          </p>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-[#fafaf9] border border-[#e5e3df] text-[#37352f] shrink-0">
                        {selectedComp.category}
                      </span>
                    </div>

                    <p className="text-xs text-[#5d5b54] leading-relaxed">
                      {selectedComp.summary}
                    </p>

                    {/* Quick Specs Matrix */}
                    <div className="rounded-md bg-[#fafaf9] border border-[#e5e3df] p-2 space-y-1.5 text-xs text-[#5d5b54]">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="shrink-0">Protokol Komunikasi</span>
                        <span className="font-mono font-medium text-[#1a1a1a] truncate">{selectedComp.protocol}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="shrink-0">Tegangan Operasional</span>
                        <span className="font-mono font-medium text-[#1a1a1a] truncate">{selectedComp.voltage}</span>
                      </div>
                    </div>

                    {/* Pin Map Table */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-[#1a1a1a] flex items-center gap-1">
                        <Info className="h-3 w-3 text-[#5645d4]" />
                        <span>Koneksi Pin ke ESP32:</span>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {selectedComp.pins.map((pin, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-1.5 rounded bg-[#fafaf9] border border-[#e5e3df] text-[11px] font-mono gap-1"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: pin.wireColor }}
                              />
                              <span className="font-bold text-[#1a1a1a] truncate">{pin.pinName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10.5px] shrink-0">
                              <span className="text-[#5d5b54]">→</span>
                              <span className="font-bold text-[#5645d4]">{pin.espPin}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Tab 2: Full Master GPIO Table */
              <div className="p-3 sm:p-4 overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5e3df] text-[#5d5b54] bg-[#fafaf9]">
                      <th className="py-2 px-2.5 font-semibold text-[11px]">Pin ESP32</th>
                      <th className="py-2 px-2.5 font-semibold text-[11px]">Komponen Target</th>
                      <th className="py-2 px-2.5 font-semibold text-[11px]">Fungsi Logika</th>
                      <th className="py-2 px-2.5 font-semibold text-[11px]">Level Sinyal</th>
                      <th className="py-2 px-2.5 font-semibold text-[11px]">Status Live</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e3df]">
                    <tr className="hover:bg-[#fafaf9]">
                      <td className="py-2 px-2.5 font-bold text-[#5645d4]">GPIO17 (RX2)</td>
                      <td className="py-2 px-2.5 text-[#1a1a1a]">DY50 TX (Pin Kuning/Putih)</td>
                      <td className="py-2 px-2.5 text-[#5d5b54]">Penerima Paket Template Serial UART2</td>
                      <td className="py-2 px-2.5 text-[#37352f]">3.3V TTL (57600 baud)</td>
                      <td className="py-2 px-2.5"><span className="text-[#1aae39] font-semibold">Aktif Standby</span></td>
                    </tr>
                    <tr className="hover:bg-[#fafaf9]">
                      <td className="py-2 px-2.5 font-bold text-[#5645d4]">GPIO16 (TX2)</td>
                      <td className="py-2 px-2.5 text-[#1a1a1a]">DY50 RX (Pin Hijau/Biru)</td>
                      <td className="py-2 px-2.5 text-[#5d5b54]">Pengirim Perintah Enroll / Verify</td>
                      <td className="py-2 px-2.5 text-[#37352f]">3.3V TTL (57600 baud)</td>
                      <td className="py-2 px-2.5"><span className="text-[#1aae39] font-semibold">Aktif Standby</span></td>
                    </tr>
                    <tr className="hover:bg-[#fafaf9]">
                      <td className="py-2 px-2.5 font-bold text-[#dd5b00]">GPIO26</td>
                      <td className="py-2 px-2.5 text-[#1a1a1a]">Modul Relay 5V (Opto-IN)</td>
                      <td className="py-2 px-2.5 text-[#5d5b54]">Trigger Koil Solenoid 12V (Active HIGH)</td>
                      <td className="py-2 px-2.5 text-[#37352f]">0V / 3.3V (Fail-Secure)</td>
                      <td className="py-2 px-2.5">
                        <span className={solenoidLocked ? 'text-[#1aae39] font-semibold' : 'text-[#dd5b00] font-semibold'}>
                          {solenoidLocked ? 'LOW (Terkunci)' : 'HIGH (Terbuka)'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#fafaf9]">
                      <td className="py-2 px-2.5 font-bold text-[#0075de]">GPIO14</td>
                      <td className="py-2 px-2.5 text-[#1a1a1a]">MC-38 Door Reed Switch</td>
                      <td className="py-2 px-2.5 text-[#5d5b54]">Sensor Magnetik Kontak Kusen Pintu</td>
                      <td className="py-2 px-2.5 text-[#37352f]">INPUT_PULLUP</td>
                      <td className="py-2 px-2.5">
                        <span className={doorOpen ? 'text-[#dd5b00] font-semibold' : 'text-[#1aae39] font-semibold'}>
                          {doorOpen ? 'HIGH (Terbuka)' : 'LOW (Tertutup)'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#fafaf9]">
                      <td className="py-2 px-2.5 font-bold text-[#e03131]">GPIO27</td>
                      <td className="py-2 px-2.5 text-[#1a1a1a]">Active Piezo Buzzer 5V</td>
                      <td className="py-2 px-2.5 text-[#5d5b54]">Alarm Audio Timeout / Unauthorized</td>
                      <td className="py-2 px-2.5 text-[#37352f]">Digital / PWM 2.7kHz</td>
                      <td className="py-2 px-2.5">
                        <span className={alarmActive ? 'text-[#e03131] font-semibold' : 'text-[#5d5b54]'}>
                          {alarmActive ? 'ALARM ACTIVE' : 'LOW (Muted)'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#fafaf9]">
                      <td className="py-2 px-2.5 font-bold text-[#0075de]">GPIO5</td>
                      <td className="py-2 px-2.5 text-[#1a1a1a]">HC-SR04 Ultrasonik (Trig)</td>
                      <td className="py-2 px-2.5 text-[#5d5b54]">Ultrasonic Trigger Pulse (10µs Output)</td>
                      <td className="py-2 px-2.5 text-[#37352f]">3.3V Logic Pulse</td>
                      <td className="py-2 px-2.5"><span className="text-[#1aae39] font-semibold">Pulsa 10µs</span></td>
                    </tr>
                    <tr className="hover:bg-[#fafaf9]">
                      <td className="py-2 px-2.5 font-bold text-[#7b3ff2]">GPIO18</td>
                      <td className="py-2 px-2.5 text-[#1a1a1a]">HC-SR04 Ultrasonik (Echo)</td>
                      <td className="py-2 px-2.5 text-[#5d5b54]">Ultrasonic Echo Pulse Input (Presence)</td>
                      <td className="py-2 px-2.5 text-[#37352f]">3.3V Logic Level</td>
                      <td className="py-2 px-2.5"><span className="text-[#1aae39] font-semibold">Aktif Standby</span></td>
                    </tr>
                    <tr className="hover:bg-[#fafaf9]">
                      <td className="py-2 px-2.5 font-bold text-[#2a9d99]">GPIO21 / GPIO22</td>
                      <td className="py-2 px-2.5 text-[#1a1a1a]">SSD1306 OLED (SDA/SCL)</td>
                      <td className="py-2 px-2.5 text-[#5d5b54]">Display Status Pintu &amp; User Prompt</td>
                      <td className="py-2 px-2.5 text-[#37352f]">I2C 400kHz</td>
                      <td className="py-2 px-2.5"><span className="text-[#1aae39] font-semibold">I2C OK (0x3C)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
