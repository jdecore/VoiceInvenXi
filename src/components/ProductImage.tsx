import React from 'react'
import { Package } from 'lucide-react'
import styles from './ProductImage.module.css'

interface ProductImageProps {
  src?: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg'
}

const ProductImage = React.memo(function ProductImage({
  src,
  alt,
  size = 'md',
}: ProductImageProps) {
  return (
    <div className={`${styles.container} ${styles[size]}`}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <div className={styles.placeholder}>
          <Package size={40} className={styles.placeholderIcon} />
          <span className={styles.placeholderText}>Sin imagen</span>
        </div>
      )}
    </div>
  )
})

export default ProductImage
