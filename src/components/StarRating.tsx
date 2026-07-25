import { useState } from 'react'

interface Props {
  value: number
  onChange: (value: number) => void
  size?: number
  readOnly?: boolean
}

// 五星评分：1-5星
export default function StarRating({ value, onChange, size = 20, readOnly = false }: Props) {
  const [hover, setHover] = useState(0)
  const shown = hover || value

  return (
    <div className={`star-rating${readOnly ? ' readonly' : ''}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className={`star-btn${shown >= star ? ' active' : ''}${hover === star ? ' preview' : ''}`}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange(star)}
          style={{ width: size, height: size }}
          aria-label={`${star}星`}
          disabled={readOnly}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={shown >= star ? '#faad14' : 'none'}
            stroke="#faad14"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  )
}
