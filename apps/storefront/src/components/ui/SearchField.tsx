import { Icon } from '@iconify/react';
import type { InputHTMLAttributes } from 'react';

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  wrapperClassName?: string;
}

export function SearchField({ className = '', wrapperClassName = '', ...props }: SearchFieldProps) {
  return (
    <div className={`search-wrap ${wrapperClassName}`}>
      <Icon icon="mdi:magnify" className="search-icon" aria-hidden />
      <input type="search" className={`input-search ${className}`} {...props} />
    </div>
  );
}
