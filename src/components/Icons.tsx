/* Small inline SVG icon set (stroke follows currentColor). ASCII-safe. */

interface IconProps {
  size?: number;
  className?: string;
}

export function FolderIcon({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4H7l2 2h7.5A1.5 1.5 0 0 1 18 7.5v7A1.5 1.5 0 0 1 16.5 16h-13A1.5 1.5 0 0 1 2 14.5z" />
    </svg>
  );
}

export function CloseIcon({ size = 12, className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" className={className}>
      <path d="M6 6l8 8M14 6l-8 8" />
    </svg>
  );
}

export function TrashIcon({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 5h14M8 5V3.5A1.5 1.5 0 0 1 9.5 2h1A1.5 1.5 0 0 1 12 3.5V5M5 5l1 10a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9l1-10" />
    </svg>
  );
}

export function CheckIcon({ size = 11, className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 8l3.5 3.5L13 5" />
    </svg>
  );
}

export function PlusIcon({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" className={className}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}
