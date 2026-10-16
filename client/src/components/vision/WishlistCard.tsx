// client/src/components/vision/WishlistCard.tsx
import * as React from 'react';
import { ProgressBar } from '@/components/common/ProgressBar';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { Button } from '@/components/common/Button';
import { Target, Wallet, Camera, Trash2 } from 'lucide-react';
import { getVisionImage, saveVisionImage, deleteVisionImage } from '@/utils/imageStorage';
import type { Goal } from '@/types/goal';

interface WishlistCardProps {
  goal: Goal;
  onConvertToGoal?: (goal: Goal) => void;
}

export function WishlistCard({ goal, onConvertToGoal }: WishlistCardProps) {
  const currentAmount = goal.estimatedCost ? (goal.progress / 100) * goal.estimatedCost : 0;
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
          new CustomEvent('show-toast', { detail: { message: 'Фото желания обновлено!' } })
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Удалить фото этого желания?')) {
      await deleteVisionImage(goal.id);
      setImageSrc(null);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-1 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between">
      {/* Скрытый input для выбора файла */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Фото желания в верхней части карточки */}
      {imageSrc ? (
        <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img
            src={imageSrc}
            alt={goal.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Кнопка смены/удаления фото на самом изображении */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
            <button
              type="button"
              onClick={handleDeleteImage}
              className="p-1.5 rounded-full bg-black/50 text-white/90 hover:text-red-400 hover:bg-black/70 transition-colors backdrop-blur-md"
              title="Удалить фото"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors backdrop-blur-md flex items-center gap-1 text-xs px-2.5"
              title="Сменить фото"
            >
              <Camera className="h-3.5 w-3.5" />
              <span className="text-[11px]">Сменить</span>
            </button>
          </div>
        </div>
      ) : (
        /* Фоновая иконка кошелька, если фото нет */
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Wallet className="h-16 w-16 text-slate-900 dark:text-white" />
        </div>
      )}

      <div className="p-5 relative z-10 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-3">
            <CategoryBadge category={goal.category} size="md" />
            
            <div className="flex items-center gap-2">
              {!imageSrc && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-2.5 py-1 rounded-full border border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 dark:border-indigo-800 dark:text-indigo-400 dark:bg-indigo-900/30 flex items-center gap-1 transition-colors"
                  title="Добавить фото желания"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>+ Фото</span>
                </button>
              )}
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full dark:bg-slate-900 dark:text-slate-500">
                Виш-лист
              </span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-white">{goal.title}</h3>
          
          {goal.description && (
            <p className="text-sm text-slate-500 mb-4 line-clamp-2 dark:text-slate-400">{goal.description}</p>
          )}
        </div>

        <div>
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-600 font-medium dark:text-slate-200">
                {currentAmount.toLocaleString('ru-RU')} {goal.currency || 'UZS'}
              </span>
              
              <span className="text-slate-400 dark:text-slate-500">
                из {goal.estimatedCost?.toLocaleString('ru-RU') || 0} {goal.currency || 'UZS'}
              </span>
            </div>
            <ProgressBar progress={goal.progress} size="sm" showLabel={false} />
          </div>

          {onConvertToGoal && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              onClick={() => onConvertToGoal(goal)}
            >
              <Target className="h-4 w-4" />
              Превратить в цель
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}