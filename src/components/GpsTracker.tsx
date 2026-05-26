'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  Navigation, 
  MapPin, 
  Activity, 
  Compass, 
  Trophy, 
  TrendingUp, 
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GpsTrackerProps {
  userId: number;
  onWorkoutSaved: () => Promise<void>;
  onCancel: () => void;
}

export default function GpsTracker({ userId, onWorkoutSaved, onCancel }: GpsTrackerProps) {
  // Estados do Rastreamento
  const [sport, setSport] = useState<'Corrida' | 'Ciclismo' | 'Caminhada'>('Corrida');
  const [status, setStatus] = useState<'idle' | 'tracking' | 'paused' | 'confirming' | 'saving'>('idle');
  const [elapsedTime, setElapsedTime] = useState<number>(0); // segundos
  const [distance, setDistance] = useState<number>(0); // km
  const [elevationGain, setElevationGain] = useState<number>(0); // metros
  const [speed, setSpeed] = useState<number>(0); // m/s
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  // Caminho percorrido
  const [positions, setPositions] = useState<Array<{ lat: number; lng: number; alt: number | null; time: number }>>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [voiceAlerts, setVoiceAlerts] = useState<boolean>(true);
  
  // Para salvar o treino
  const [workoutTitle, setWorkoutTitle] = useState<string>('');
  const [workoutDescription, setWorkoutDescription] = useState<string>('Treino gravado via GPS no app EFITNESS.');

  // Bloqueio de Tela (Unlock Hold state)
  const [isHoldingUnlock, setIsHoldingUnlock] = useState<boolean>(false);
  const [unlockProgress, setUnlockProgress] = useState<number>(0);
  const unlockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const unlockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Referências para o mapa e geolocalização
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number; alt: number | null; time: number } | null>(null);
  const wakeLockRef = useRef<any>(null);
  const lastVoiceKmRef = useRef<number>(0);

  // Efeito para Inicializar o Mapa
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Inicializa o mapa com foco padrão
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([-23.55052, -46.633308], 16); // Centro padrão (SP)

    // Layout Dark Neon (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Controles de zoom no canto inferior direito
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Polyline do Trajeto (Ciano Neon)
    const polyline = L.polyline([], {
      color: '#00f0ff',
      weight: 5,
      opacity: 0.9,
      lineJoin: 'round'
    }).addTo(map);

    // Marcador da Posição Atual (Verde Neon)
    const marker = L.circleMarker([-23.55052, -46.633308], {
      color: '#39ff14',
      fillColor: '#39ff14',
      fillOpacity: 1,
      radius: 6,
      weight: 3
    }).addTo(map);

    mapRef.current = map;
    polylineRef.current = polyline;
    userMarkerRef.current = marker;

    // Tentar obter localização inicial para centralizar o mapa
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 16);
          marker.setLatLng([latitude, longitude]);
        },
        (err) => console.log('Erro ao buscar localização inicial:', err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Efeito de Cronômetro
  useEffect(() => {
    if (status === 'tracking') {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  // Função de Voice Split (SpeechSynthesis)
  const speakAlert = (km: number, paceStr: string) => {
    if (!voiceAlerts || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel(); // Parar áudios anteriores
      const phrase = sport === 'Ciclismo' 
        ? `${km} quilômetros concluídos. Velocidade média de ${paceStr} quilômetros por hora.`
        : `${km} quilômetros concluídos. Ritmo médio de ${paceStr.replace(':', ' e ').replace('/km', '')} por quilômetro.`;
      
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Erro ao reproduzir áudio de voz:', e);
    }
  };

  // Solicitar e liberar o Screen Wake Lock
  const requestWakeLock = async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        const lock = await (navigator.wakeLock as any).request('screen');
        wakeLockRef.current = lock;
        console.log('Screen Wake Lock ativo!');
      } catch (err) {
        console.warn('Falha ao ativar Screen Wake Lock:', err);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Screen Wake Lock liberado.');
      } catch (err) {
        console.error('Erro ao liberar Screen Wake Lock:', err);
      }
    }
  };

  // Cálculo da distância por Haversine (em km)
  const getDistanceBetween = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Processar nova coordenada recebida
  const handleNewPosition = (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy: locAccuracy, altitude, speed: locSpeed } = position.coords;
    
    setAccuracy(locAccuracy);
    if (locSpeed !== null) {
      setSpeed(locSpeed);
    }

    // Filtro de Precisão do GPS (ignorar leituras com margem de erro acima de 25m para evitar glitches)
    if (locAccuracy > 25) {
      console.warn(`Coordenada ignorada devido à baixa precisão (${locAccuracy}m)`);
      return;
    }

    const now = Date.now();
    const newPoint = { lat: latitude, lng: longitude, alt: altitude, time: now };

    if (mapRef.current && userMarkerRef.current) {
      // Atualizar marcador no mapa
      userMarkerRef.current.setLatLng([latitude, longitude]);
      
      // Centralizar o mapa na nova coordenada
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
    }

    if (lastPositionRef.current) {
      const prev = lastPositionRef.current;
      const deltaDist = getDistanceBetween(prev.lat, prev.lng, latitude, longitude);

      // Filtro de velocidade absurda (ex: > 150 km/h) para evitar saltos irreais do GPS
      const deltaTimeHours = (now - prev.time) / (1000 * 3600);
      const estSpeedKmh = deltaDist / (deltaTimeHours || 1);
      if (estSpeedKmh > 150) {
        console.warn(`Movimento impossível detectado: ${estSpeedKmh.toFixed(1)} km/h. Ignorado.`);
        return;
      }

      if (deltaDist > 0.002) { // Registrar apenas se moveu mais de 2 metros
        setDistance((prevDist) => {
          const newDist = prevDist + deltaDist;
          
          // Verificar Split de áudio (a cada 1km completo)
          const currentKm = Math.floor(newDist);
          if (currentKm > lastVoiceKmRef.current && currentKm > 0) {
            lastVoiceKmRef.current = currentKm;
            const currentPaceStr = calculateCurrentPace(elapsedTime, newDist);
            const currentSpeedKmhStr = calculateCurrentSpeedKmh(elapsedTime, newDist);
            speakAlert(currentKm, sport === 'Ciclismo' ? currentSpeedKmhStr : currentPaceStr);
          }
          
          return newDist;
        });

        // Ganho de Elevação acumulado
        if (altitude !== null && prev.alt !== null) {
          const deltaAlt = altitude - prev.alt;
          if (deltaAlt > 0.5) { // Somar se subiu mais de 50cm
            setElevationGain((prevAlt) => prevAlt + deltaAlt);
          }
        }

        // Desenhar trilha no mapa
        if (polylineRef.current) {
          polylineRef.current.addLatLng([latitude, longitude]);
        }

        setPositions((prevPos) => [...prevPos, newPoint]);
        lastPositionRef.current = newPoint;
      }
    } else {
      // Primeira coordenada válida recebida
      lastPositionRef.current = newPoint;
      setPositions([newPoint]);
      
      if (polylineRef.current) {
        polylineRef.current.setLatLngs([[latitude, longitude]]);
      }
    }
  };

  // Iniciar Gravação
  const startTracking = async () => {
    if (!navigator.geolocation) {
      alert('Seu navegador não oferece suporte para GPS/Geolocalização.');
      return;
    }

    try {
      // Solicitar permissão de áudio para voice prompts
      if ('speechSynthesis' in window) {
        const speakTest = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(speakTest);
      }
    } catch (_) {}

    // Solicitar Wake Lock para manter a tela acesa
    await requestWakeLock();

    setStatus('tracking');
    lastPositionRef.current = null;
    lastVoiceKmRef.current = 0;

    // Registrar observador de geolocalização contínua
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleNewPosition,
      (err) => {
        console.error('Erro de GPS:', err);
        let errorMsg = 'Erro ao ler dados de GPS.';
        if (err.code === err.PERMISSION_DENIED) errorMsg = 'Permissão de GPS negada. Por favor, ative a localização nas configurações do navegador.';
        if (err.code === err.POSITION_UNAVAILABLE) errorMsg = 'Sinal de GPS indisponível.';
        if (err.code === err.TIMEOUT) errorMsg = 'Tempo limite do GPS esgotado.';
        alert(errorMsg);
      },
      {
        enableHighAccuracy: true, // Força uso de GPS real em vez de triangulação de torre/wi-fi
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Pausar Gravação
  const pauseTracking = async () => {
    setStatus('paused');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    lastPositionRef.current = null;
    // Liberar Wake Lock para economizar bateria enquanto pausado
    await releaseWakeLock();
  };

  // Retomar Gravação
  const resumeTracking = async () => {
    await requestWakeLock();
    setStatus('tracking');
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleNewPosition,
      (err) => console.error('Erro de GPS:', err),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Cancelar e resetar treino
  const resetTracker = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    await releaseWakeLock();
    setStatus('idle');
    setElapsedTime(0);
    setDistance(0);
    setElevationGain(0);
    setSpeed(0);
    setPositions([]);
    lastPositionRef.current = null;
    lastVoiceKmRef.current = 0;
    
    if (polylineRef.current) {
      polylineRef.current.setLatLngs([]);
    }
  };

  // Solicitar tela de confirmação de salvamento
  const finishTracking = async () => {
    await pauseTracking();
    setStatus('confirming');
    
    // Título inicial sugestivo
    const now = new Date();
    const timeOfDay = now.getHours() < 12 ? 'Manhã' : now.getHours() < 18 ? 'Tarde' : 'Noite';
    setWorkoutTitle(`Treino de ${sport} de ${timeOfDay}`);
  };

  // Salvar treino via POST na API
  const saveWorkout = async () => {
    setStatus('saving');
    
    const formattedDate = new Date().toISOString().split('T')[0];
    const avgPaceStr = calculateCurrentPace(elapsedTime, distance);

    const payload = {
      userId,
      date: formattedDate,
      type: sport,
      title: workoutTitle,
      description: workoutDescription,
      distanceReal: distance.toFixed(2),
      durationReal: elapsedTime,
      paceReal: avgPaceStr,
      elevationGain: elevationGain.toFixed(0),
      syncSource: 'EFITNESS GPS'
    };

    try {
      const res = await fetch('/api/workouts/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (data.success) {
        // Sucesso total
        await onWorkoutSaved();
      } else {
        alert('Erro ao salvar treino: ' + data.error);
        setStatus('confirming');
      }
    } catch (err: any) {
      alert('Falha na comunicação com o servidor: ' + err.message);
      setStatus('confirming');
    }
  };

  // Formatar tempo (HH:MM:SS)
  const formatTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const hStr = hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : '';
    const mStr = `${mins.toString().padStart(2, '0')}:`;
    const sStr = secs.toString().padStart(2, '0');
    
    return `${hStr}${mStr}${sStr}`;
  };

  // Calcular Ritmo (min/km)
  const calculateCurrentPace = (totalSeconds: number, km: number): string => {
    if (km <= 0) return '00:00/km';
    const totalMinutes = totalSeconds / 60;
    const paceDecimal = totalMinutes / km;
    const paceMins = Math.floor(paceDecimal);
    const paceSecs = Math.floor((paceDecimal - paceMins) * 60);
    return `${paceMins}:${paceSecs.toString().padStart(2, '0')}/km`;
  };

  // Calcular Velocidade (km/h)
  const calculateCurrentSpeedKmh = (totalSeconds: number, km: number): string => {
    if (totalSeconds <= 0) return '0.0';
    const hours = totalSeconds / 3600;
    return (km / hours).toFixed(1);
  };

  // Iniciar processo de segurar botão para destravar tela
  const handleUnlockStart = () => {
    setIsHoldingUnlock(true);
    setUnlockProgress(0);
    
    let currentProg = 0;
    unlockIntervalRef.current = setInterval(() => {
      currentProg += 5;
      if (currentProg >= 100) {
        currentProg = 100;
      }
      setUnlockProgress(currentProg);
    }, 100);

    unlockTimerRef.current = setTimeout(() => {
      setIsLocked(false);
      setIsHoldingUnlock(false);
      setUnlockProgress(0);
      if (unlockIntervalRef.current) clearInterval(unlockIntervalRef.current);
    }, 2000);
  };

  // Cancelar destravamento se soltar o botão antes do tempo
  const handleUnlockEnd = () => {
    setIsHoldingUnlock(false);
    setUnlockProgress(0);
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
    if (unlockIntervalRef.current) {
      clearInterval(unlockIntervalRef.current);
      unlockIntervalRef.current = null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', position: 'relative' }}>
      
      {/* 1. OVERLAY DE BLOQUEIO DE TELA (POCKET LOCK) */}
      {isLocked && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '40px 24px',
          color: '#fff'
        }}>
          {/* Top Info */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Lock size={40} style={{ color: 'var(--neon-cyan)', animation: 'pulseGlow 2s infinite' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '12px' }}>Gravando em Segundo Plano</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Tela protegida contra toques acidentais</p>
          </div>

          {/* Grandes Números de Estatísticas de Corrida no Bolso */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
            <div style={{ fontSize: '5rem', fontWeight: 900, fontFamily: 'var(--font-title)', lineHeight: '1', color: '#fff' }}>
              {formatTime(elapsedTime)}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '400px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Distância</span>
                <strong style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--neon-green)' }}>{distance.toFixed(2)} <span style={{ fontSize: '1.2rem' }}>km</span></strong>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>{sport === 'Ciclismo' ? 'Velocidade' : 'Ritmo'}</span>
                <strong style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--neon-cyan)' }}>
                  {sport === 'Ciclismo' ? calculateCurrentSpeedKmh(elapsedTime, distance) : calculateCurrentPace(elapsedTime, distance).replace('/km', '')}
                  <span style={{ fontSize: '1.2rem' }}>{sport === 'Ciclismo' ? ' km/h' : ' /km'}</span>
                </strong>
              </div>
            </div>
          </div>

          {/* Hold to Unlock Button */}
          <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <button
              onMouseDown={handleUnlockStart}
              onMouseUp={handleUnlockEnd}
              onMouseLeave={handleUnlockEnd}
              onTouchStart={handleUnlockStart}
              onTouchEnd={handleUnlockEnd}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {/* Círculo de Carregamento de Desbloqueio */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: `${unlockProgress}%`,
                background: 'var(--neon-cyan)',
                opacity: 0.3,
                transition: 'height 0.1s linear'
              }} />
              <Unlock size={28} style={{ color: isHoldingUnlock ? '#fff' : 'var(--text-secondary)', zIndex: 1 }} />
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              {isHoldingUnlock ? 'Segure firme...' : 'Segure por 2 segundos para liberar'}
            </span>
          </div>
        </div>
      )}

      {/* 2. TELA PRINCIPAL DO GRAVADOR */}
      {status !== 'confirming' && status !== 'saving' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Card */}
          <div className="premium-card animate-slide-up" style={{ 
            background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.8) 0%, rgba(6, 9, 19, 0.8) 100%)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                <Navigation size={20} style={{ color: 'var(--neon-cyan)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Gravar Atividade</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Usa o GPS do celular com bloqueio de tela</p>
              </div>
            </div>
            
            {/* Controles de Voz */}
            <button
              onClick={() => setVoiceAlerts(!voiceAlerts)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                color: voiceAlerts ? 'var(--neon-cyan)' : 'var(--text-muted)'
              }}
            >
              {voiceAlerts ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {voiceAlerts ? 'Voz Ativa' : 'Sem Voz'}
            </button>
          </div>

          {/* Seletor de Modalidade (apenas se inativo) */}
          {status === 'idle' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }} className="animate-slide-up">
              {(['Corrida', 'Ciclismo', 'Caminhada'] as const).map((type) => {
                const isSelected = sport === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSport(type)}
                    style={{
                      background: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'var(--glass-bg)',
                      border: `1px solid ${isSelected ? 'var(--neon-cyan)' : 'var(--glass-border)'}`,
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>
                      {type === 'Corrida' ? '🏃‍♂️' : type === 'Ciclismo' ? '🚴‍♂️' : '🚶‍♂️'}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                      {type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Painel do Dashboard com Números Grandes */}
          <div className="premium-card animate-slide-up" style={{ 
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.9) 0%, rgba(6, 9, 19, 0.9) 100%)',
            borderColor: status === 'tracking' ? 'rgba(0, 240, 255, 0.2)' : 'var(--glass-border)',
            boxShadow: status === 'tracking' ? '0 0 20px rgba(0, 240, 255, 0.05)' : 'none'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tempo Decorrido</span>
              <h1 style={{ fontSize: '4.2rem', fontWeight: 900, fontFamily: 'var(--font-title)', lineHeight: '1.1', color: '#fff', marginTop: '4px' }}>
                {formatTime(elapsedTime)}
              </h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Distância</span>
                <strong style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--neon-green)' }}>
                  {distance.toFixed(2)}
                  <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '4px', color: 'var(--text-secondary)' }}>km</span>
                </strong>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>
                  {sport === 'Ciclismo' ? 'Velocidade' : 'Ritmo'}
                </span>
                <strong style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--neon-cyan)' }}>
                  {sport === 'Ciclismo' ? calculateCurrentSpeedKmh(elapsedTime, distance) : calculateCurrentPace(elapsedTime, distance).replace('/km', '')}
                  <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '4px', color: 'var(--text-secondary)' }}>
                    {sport === 'Ciclismo' ? 'km/h' : '/km'}
                  </span>
                </strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '16px', paddingTop: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Ganho Altura</span>
                <strong style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--neon-orange)' }}>
                  {elevationGain.toFixed(0)}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, marginLeft: '2px', color: 'var(--text-secondary)' }}>m</span>
                </strong>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Precisão GPS</span>
                <strong style={{ fontSize: '1.3rem', fontWeight: 700, color: accuracy && accuracy <= 10 ? 'var(--neon-green)' : accuracy && accuracy <= 25 ? 'var(--neon-orange)' : 'var(--neon-red)' }}>
                  {accuracy !== null ? `±${accuracy.toFixed(0)}m` : 'Buscando...'}
                </strong>
              </div>
            </div>
          </div>

          {/* Mapa do Trajeto */}
          <div className="premium-card animate-slide-up" style={{ padding: '0', overflow: 'hidden', height: '300px', position: 'relative' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
            {status === 'idle' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(6, 9, 19, 0.7)',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <MapPin size={28} style={{ color: 'var(--neon-cyan)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mapa Carregado</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Seu percurso aparecerá aqui após iniciar o treino</span>
              </div>
            )}
          </div>

          {/* Barra de Controles e Ações */}
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            {status === 'idle' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={onCancel}
                  className="tab-btn"
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={startTracking}
                  className="glow-btn"
                  style={{
                    flex: 2,
                    padding: '14px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, var(--neon-cyan) 0%, #00f0ff 100%)',
                    boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
                  }}
                >
                  <Play size={18} fill="#030712" /> INICIAR TREINO
                </button>
              </div>
            )}

            {status === 'tracking' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsLocked(true)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: '#fff',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <Lock size={16} /> Bloquear Tela
                </button>
                <button
                  onClick={pauseTracking}
                  className="glow-btn"
                  style={{
                    flex: 1.5,
                    padding: '14px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, var(--neon-orange) 0%, #e24b00 100%)',
                    boxShadow: '0 0 15px rgba(255, 107, 53, 0.3)',
                    border: 'none',
                    color: '#fff'
                  }}
                >
                  <Pause size={18} fill="#fff" /> PAUSAR
                </button>
              </div>
            )}

            {status === 'paused' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={resumeTracking}
                  className="glow-btn"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, var(--neon-green) 0%, #15d100 100%)',
                    boxShadow: '0 0 15px rgba(57, 255, 20, 0.3)',
                    border: 'none'
                  }}
                >
                  <Play size={18} fill="#030712" /> RETOMAR ATIVIDADE
                </button>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={resetTracker}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <RotateCcw size={14} /> Descartar
                  </button>
                  <button
                    onClick={finishTracking}
                    className="glow-btn"
                    style={{
                      flex: 1.5,
                      padding: '12px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, var(--neon-red) 0%, #d80000 100%)',
                      boxShadow: '0 0 15px rgba(255, 59, 48, 0.3)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  >
                    <Square size={14} fill="#fff" /> CONCLUIR E SALVAR
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 3. TELA DE CONFIRMAÇÃO E SALVAMENTO */
        <div className="premium-card animate-slide-up" style={{ 
          background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.9) 0%, rgba(6, 9, 19, 0.9) 100%)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(57, 255, 20, 0.08)', borderRadius: '50%', marginBottom: '12px' }}>
              <Trophy size={36} style={{ color: 'var(--neon-green)', animation: 'pulseGlow 2s infinite' }} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Treino Concluído! 🎉</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Parabéns pelo esforço! Ajuste os detalhes antes de salvar.</p>
          </div>

          {/* Dados Resumidos */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '12px', 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Distância</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--neon-green)' }}>{distance.toFixed(2)} km</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Tempo</span>
              <strong style={{ fontSize: '1.25rem', color: '#fff' }}>{formatTime(elapsedTime)}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>{sport === 'Ciclismo' ? 'Velocidade Média' : 'Ritmo Médio'}</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--neon-cyan)' }}>
                {sport === 'Ciclismo' 
                  ? `${calculateCurrentSpeedKmh(elapsedTime, distance)} km/h` 
                  : calculateCurrentPace(elapsedTime, distance)}
              </strong>
            </div>
          </div>

          {/* Campos de Formulário */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Título da Atividade</label>
              <input
                type="text"
                className="glass-input"
                value={workoutTitle}
                onChange={(e) => setWorkoutTitle(e.target.value)}
                placeholder="Ex: Minha Corrida Matinal"
                style={{ fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Descrição / Notas do Treino</label>
              <textarea
                className="glass-input"
                rows={3}
                value={workoutDescription}
                onChange={(e) => setWorkoutDescription(e.target.value)}
                placeholder="Como você se sentiu? Adicione notas sobre o percurso..."
                style={{ fontSize: '0.9rem', resize: 'none', height: '80px' }}
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              onClick={() => setStatus('paused')}
              disabled={status === 'saving'}
              className="tab-btn"
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Voltar
            </button>
            <button
              onClick={saveWorkout}
              disabled={status === 'saving'}
              className="glow-btn-lime"
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, var(--neon-green) 0%, #15d100 100%)',
                boxShadow: '0 0 15px rgba(57, 255, 20, 0.3)',
                fontSize: '0.85rem',
                border: 'none'
              }}
            >
              {status === 'saving' ? (
                'Salvando Atividade...'
              ) : (
                <>
                  <Check size={16} /> SALVAR ATIVIDADE
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
