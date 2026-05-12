import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  onRatingChange,
  size = 24,
  readonly = false
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-2xl">
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const isActive = (hoverRating || rating) >= starValue;
        
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onRatingChange?.(starValue)}
            onMouseEnter={() => !readonly && setHoverRating(starValue)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            className={`transition-all duration-300 transform ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'
            } ${isActive ? 'text-indigo-600' : 'text-slate-200'}`}
          >
            <Star
              size={size}
              className={`${isActive ? 'fill-current shadow-indigo-200' : ''}`}
              strokeWidth={2.5}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
