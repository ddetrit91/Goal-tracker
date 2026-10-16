import * as React from 'react';
import { Button } from '@/components/common/Button';
import { Sparkles, ArrowRight, Camera, Trash2 } from 'lucide-react';
import { getVisionImage, saveVisionImage, deleteVisionImage } from '@/utils/imageStorage';
import type { Goal } from '@/types/goal';

interface DreamCardProps {
  goal: Goal;
  onStartPlanning?: (goal: Goal) => void;
}

export function DreamCard({ goal, onStartPlanning }: DreamCardProps) {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const loadImage = React.useCallback(async () => {
    const data = await getVisionImage(goal.id);
    setImageSrc(data);
  }, [goal.id]);

  React.useEffect(() => {
    loadImage();
    const handleUpdate = (e: any) => {
      if (e.detail?.goalId === goal.id) {
        loadImage();
      }
    };
    window.addEventListener('vision-image-updated', handleUpdate);
    return () => window.removeEventListener('vision-image-updated', handleUpdate);
  }, [goal.id, loadImage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Сжимаем изображение на клиенте перед сохранением
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

        await saveVisionImage(goal.id, compressedBase64);
        setImageSrc(compressedBase64);
        window.dispatchEvent(
          new CustomEvent('show-toast', { detail: { message: 'Фото мечты обновлено!' } })
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Удалить фото этой мечты?')) {
      await deleteVisionImage(goal.id);
      setImageSrc(null);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 dark:from-indigo-700 dark:to-purple-900 dark:shadow-purple-900/30 min-h-[280px] flex flex-col justify-between">
      {/* Скрытый input для выбора файла */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Фото мечты в качестве фона, если загружено */}
      {imageSrc && (
        <>
          <img
            src={imageSrc}
            alt={goal.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
        </>
      )}

      {/* Декоративный элемент если фото нет */}
      {!imageSrc && (
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl transition-all group-hover:bg-white/20" />
      )}
      
      {/* Контент карточки */}
      <div className="relative z-10 flex flex-col h-full justify-between p-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-6 w-6 text-yellow-300 drop-shadow" />
              <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm">
                Мечта
              </span>
            </div>

            {/* Кнопки управления фото (Загрузить / Удалить) */}
            <div className="flex items-center gap-1.5">
              {imageSrc && (
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="p-1.5 rounded-full bg-black/40 text-white/80 hover:text-red-400 hover:bg-black/60 transition-colors backdrop-blur-md"
                  title="Удалить фото"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-md flex items-center gap-1 text-xs px-2.5"
                title={imageSrc ? "Сменить фото" : "Добавить фото мечты"}
              >
                <Camera className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">{imageSrc ? "Сменить" : "+ Фото"}</span>
              </button>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-2 leading-tight drop-shadow-sm">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-indigo-100 line-clamp-3 mb-4 dark:text-indigo-200 drop-shadow-sm">
              {goal.description}
            </p>
          )}
        </div>

        {onStartPlanning && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-2 bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-md shadow-sm transition-all"
            onClick={() => onStartPlanning(goal)}
          >
            Начать планирование
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}