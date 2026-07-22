import React, { useState } from 'react';
import { useApp, DEFAULT_AVATARS } from '../context/AppContext';
import { User, CreditCard, Bell, LogOut, Check, Save, Download, Trash2, Camera } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { sanitizeInput } from '../utils/security';

export const ProfileSettings: React.FC = () => {
  const {
    currentUser,
    collection,
    currency,
    notifications,
    updateProfile,
    setCurrency,
    setNotifications,
    logout,
    exportCollection,
    resetCollection
  } = useApp();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || DEFAULT_AVATARS[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Estados de Crop e Redimensionamento
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleSaveProfile = () => {
    const cleanUsername = sanitizeInput(username);
    if (!cleanUsername) {
      showToast('Nome de usuário inválido.');
      return;
    }
    updateProfile(cleanUsername, avatar);
    setIsEditingProfile(false);
    showToast('Perfil atualizado com sucesso!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropSrc(reader.result as string);
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmCrop = () => {
    if (!cropSrc) return;

    const img = new Image();
    img.src = cropSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 200; // Foto de perfil comprimida em 200x200
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, size, size);

        const imgRatio = img.width / img.height;
        let drawW = size;
        let drawH = size;
        if (imgRatio > 1) {
          drawW = size * imgRatio;
        } else {
          drawH = size / imgRatio;
        }

        drawW *= zoom;
        drawH *= zoom;

        const scaleFactor = size / 192; // visor é 192px na UI
        const dx = (size - drawW) / 2 + panX * scaleFactor;
        const dy = (size - drawH) / 2 + panY * scaleFactor;

        ctx.drawImage(img, dx, dy, drawW, drawH);

        // Compressão em JPEG a 80% de qualidade
        canvas.toBlob(async (blob) => {
          if (!blob) return;

          const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

          if (supabase) {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                // Sincroniza com a política RLS do bucket (user_id/avatar-timestamp.jpg)
                const filePath = `${user.id}/avatar-${Date.now()}.jpg`;

                showToast('Enviando imagem...');

                const { error: uploadError } = await supabase.storage
                  .from('avatars')
                  .upload(filePath, croppedFile, { cacheControl: '3600', upsert: true });

                if (uploadError) {
                  console.error(uploadError);
                  showToast('Erro ao enviar imagem ao Supabase.');
                  return;
                }

                const { data: { publicUrl } } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(filePath);

                setAvatar(publicUrl);
                showToast('Avatar carregado no Supabase!');
              }
            } catch (err) {
              console.error(err);
              showToast('Erro ao salvar imagem no servidor.');
            }
          } else {
            const reader = new FileReader();
            reader.onloadend = () => {
              setAvatar(reader.result as string);
              showToast('Avatar comprimido localmente!');
            };
            reader.readAsDataURL(croppedFile);
          }

          setCropSrc(null);
          setZoom(1.0);
          setPanX(0);
          setPanY(0);
        }, 'image/jpeg', 0.8);
      }
    };
  };

  const handleExport = () => {
    const dataStr = exportCollection();
    navigator.clipboard.writeText(dataStr);
    showToast('Dados de backup copiados para a área de transferência!');
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja apagar TODAS as cartas da sua coleção? Essa ação não pode ser desfeita.')) {
      resetCollection();
      showToast('Coleção apagada com sucesso.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const uniqueSetsCount = new Set(collection.map(item => item.cardDetails.id.split('-')[0])).size;

  return (
    <div className="space-y-6 pb-6 animate-fade-in select-none">
      
      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500/20 font-bold text-xs animate-fade-in text-center max-w-sm">
          <Check size={16} className="bg-white/20 rounded-full p-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. SEÇÃO DE PERFIL E STATUS DO TREINADOR */}
      <section className="flex flex-col items-center bg-surface-container-lowest rounded-3xl p-6 shadow-ambient-lvl1 border border-outline-variant/10">
        <div className="relative w-24 h-24 mb-4">
          <img 
            alt="Trainer Avatar" 
            src={avatar} 
            className="w-full h-full rounded-full object-cover border-4 border-white shadow-md bg-neutral-100"
          />
          <input 
            type="file" 
            accept="image/*" 
            id="avatar-file-input" 
            className="hidden" 
            onChange={handleFileChange}
            disabled={!isEditingProfile}
          />
          {isEditingProfile && (
            <label 
              htmlFor="avatar-file-input" 
              className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center text-white cursor-pointer active:scale-95 transition-transform"
            >
              <Camera size={20} />
              <span className="text-[8px] font-black uppercase mt-1">Galeria</span>
            </label>
          )}
        </div>

        {isEditingProfile ? (
          <div className="w-full max-w-xs flex gap-2 mb-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-grow bg-surface border border-outline-variant/20 rounded-xl px-3 py-1.5 text-xs text-on-surface font-semibold focus:outline-none"
            />
            <button
              onClick={handleSaveProfile}
              className="bg-primary hover:bg-primary-container text-white p-2 rounded-xl transition-all shadow-sm"
            >
              <Save size={16} />
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-extrabold text-on-surface tracking-tight flex items-center gap-1.5">
              {currentUser?.username || 'Trainer Alex'}
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="text-[10px] text-primary hover:underline font-bold"
              >
                (Editar)
              </button>
            </h2>
            <p className="text-[10px] text-on-surface-variant bg-surface-container px-3.5 py-1 rounded-full font-bold uppercase mt-1 tracking-wider">
              {currentUser?.collectorRank || 'Colecionador de Elite'}
            </p>
          </>
        )}

        <div className="flex gap-4 w-full mt-6 justify-center text-center">
          <div className="flex flex-col items-center p-3 bg-surface-container-low rounded-2xl flex-1 border border-outline-variant/5 shadow-sm">
            <span className="text-lg font-extrabold text-primary">
              {collection.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">CARTAS</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-surface-container-low rounded-2xl flex-1 border border-outline-variant/5 shadow-sm">
            <span className="text-lg font-extrabold text-tertiary">{uniqueSetsCount}</span>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">CONJUNTOS</span>
          </div>
        </div>
      </section>

      {/* 2. DETALHES DA CONTA */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-lvl1 border border-outline-variant/10 space-y-4">
        <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
          <User size={18} className="text-primary" />
          Detalhes da Conta
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">E-mail (Cadastro)</label>
            <input 
              type="text" 
              value={currentUser?.email || 'alex.trainer@pokevault.app'} 
              disabled 
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold text-on-surface-variant/80"
            />
          </div>
        </div>
      </section>

      {/* 3. MOEDA E CONVERSÃO */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-lvl1 border border-outline-variant/10 space-y-4">
        <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
          <CreditCard size={18} className="text-amber-500" />
          Moeda de Exibição
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Selecione a moeda padrão para que todos os valores de mercado e lucros da coleção sejam convertidos automaticamente.
        </p>

        <div className="grid grid-cols-4 gap-2">
          {([
            { code: 'BRL', symbol: 'R$' },
            { code: 'USD', symbol: '$' },
            { code: 'EUR', symbol: '€' },
            { code: 'JPY', symbol: '¥' }
          ] as const).map(curr => (
            <button
              key={curr.code}
              onClick={() => setCurrency(curr.code)}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                currency === curr.code
                  ? 'bg-secondary-container text-on-secondary-container border-secondary shadow-md scale-105'
                  : 'bg-surface hover:bg-surface-container-low text-on-surface-variant border-outline-variant/20'
              }`}
            >
              <span className="text-base font-black">{curr.symbol}</span>
              <span className="text-[9px] font-extrabold uppercase mt-0.5">{curr.code}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 4. NOTIFICAÇÕES */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-lvl1 border border-outline-variant/10 space-y-4">
        <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
          <Bell size={18} className="text-tertiary" />
          Configurações de Notificações
        </h3>

        <div className="space-y-2">
          {[
            { 
              key: 'priceAlerts', 
              title: 'Alertas de Preço', 
              desc: 'Notificar quando alguma carta da minha coleção sofrer variações bruscas de preço.' 
            },
            { 
              key: 'newSets', 
              title: 'Novos Conjuntos TCG', 
              desc: 'Ser notificado quando novas coleções de TCG forem catalogadas pela Nintendo.' 
            }
          ].map(opt => (
            <div key={opt.key} className="flex items-center justify-between p-3 bg-surface rounded-2xl border border-outline-variant/10 gap-4">
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-on-surface">{opt.title}</h4>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-snug">{opt.desc}</p>
              </div>
              <label className="relative inline-flex inline-flex items-center cursor-pointer flex-shrink-0">
                <input 
                  type="checkbox"
                  checked={(notifications as any)[opt.key]}
                  onChange={() => {
                    setNotifications({
                      ...notifications,
                      [opt.key]: !(notifications as any)[opt.key]
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* 5. EXPORTAÇÃO DE BACKUPS */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 shadow-ambient-lvl1 border border-outline-variant/10 space-y-4">
        <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
          <Download size={18} className="text-tertiary" />
          Backup JSON
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Copie os dados da sua coleção em formato JSON para salvar como um backup externo.
        </p>
        
        <button
          onClick={handleExport}
          className="w-full bg-primary hover:bg-primary-container text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Download size={14} />
          Copiar Backup JSON
        </button>
      </section>

      {/* 7. BOTÕES DE RESET E LOGOUT */}
      <section className="pt-4 flex flex-col gap-3 max-w-xs mx-auto text-center">
        <button
          onClick={logout}
          className="bg-transparent hover:bg-primary/5 text-primary border border-primary/20 font-bold py-3.5 px-6 rounded-2xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <LogOut size={16} />
          Desconectar Treinador
        </button>

        <button
          onClick={handleReset}
          className="bg-transparent hover:bg-red-50 text-red-600 border border-red-200 font-bold py-3 px-6 rounded-2xl text-[10px] active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
        >
          <Trash2 size={12} />
          Limpar Minha Coleção
        </button>
      </section>

      {/* CROP & COMPRESS MODAL */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-surface-container-lowest rounded-3xl p-5 w-full max-w-sm border border-outline-variant/15 space-y-4 shadow-2xl">
            <div className="text-center">
              <h3 className="font-extrabold text-sm text-on-surface">Ajustar Foto de Perfil</h3>
              <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">Arraste para posicionar e use o slider para zoom</p>
            </div>

            {/* Circular Viewport */}
            <div 
              className="w-48 h-48 rounded-full border-4 border-primary overflow-hidden relative bg-neutral-900 mx-auto shadow-inner cursor-move touch-none"
              onMouseDown={(e) => {
                setIsDragging(true);
                setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
              }}
              onMouseMove={(e) => {
                if (!isDragging) return;
                setPanX(e.clientX - dragStart.x);
                setPanY(e.clientY - dragStart.y);
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  setIsDragging(true);
                  setDragStart({ x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY });
                }
              }}
              onTouchMove={(e) => {
                if (!isDragging || e.touches.length !== 1) return;
                setPanX(e.touches[0].clientX - dragStart.x);
                setPanY(e.touches[0].clientY - dragStart.y);
              }}
              onTouchEnd={() => setIsDragging(false)}
            >
              <img 
                src={cropSrc} 
                alt="Preview" 
                className="absolute origin-center pointer-events-none"
                style={{
                  transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>

            {/* Slider de Zoom */}
            <div className="space-y-1.5 px-2">
              <div className="flex justify-between text-[9px] font-black text-on-surface-variant uppercase tracking-wider">
                <span>Zoom</span>
                <span>{zoom.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="3.0" 
                step="0.1" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-primary bg-surface-container-high rounded-lg h-2"
              />
            </div>

            {/* Ações */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCropSrc(null);
                  setZoom(1.0);
                  setPanX(0);
                  setPanY(0);
                }}
                className="py-3 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-extrabold text-[10px] rounded-2xl transition-all uppercase tracking-wider active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                className="py-3 bg-primary hover:bg-primary-container text-white font-extrabold text-[10px] rounded-2xl shadow-md transition-all uppercase tracking-wider active:scale-[0.98]"
              >
                Recortar & Salvar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
