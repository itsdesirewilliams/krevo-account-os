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

export function MoreIcon({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className}>
      <circle cx="6" cy="10" r="1.4" />
      <circle cx="10" cy="10" r="1.4" />
      <circle cx="14" cy="10" r="1.4" />
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

export function PersonIcon({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0z" />
      <path d="M2 17.5c0-2.7 2.5-4.9 5.7-5.6C8.7 11.1 9.8 10.6 11 10.6c1.2 0 2.3.5 3.2 1.3 1 1.2 1.8 2.7 2.3 4.4.1.5.1.9.1 1.4" />
    </svg>
  );
}

export function RocketIcon({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 10a5 5 0 1 1 10 0 5 5 0 0 1-10 0z" />
      <path d="M10 2v3m5.4 4.4L13 11.8M3.6 12.6l2.4 2.4M10 15v5l3-3" />
    </svg>
  );
}

export function PostIcon({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 4h12v2H4zM4 8h12v8H4z" />
    </svg>
  );
}

export const ChevronIcon = ({ size = 12, className, down }: IconProps & { down?: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ transform: down ? "rotate(-90deg)" : "rotate(0)" }}
    aria-hidden="true"
  >
    <path d="M6 8l6 6 6-6" />
  </svg>
);

