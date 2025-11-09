import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'text-danger-600 bg-danger-50 border-danger-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'badge-critical';
    case 'high':
      return 'badge-high';
    case 'medium':
      return 'badge-medium';
    case 'low':
      return 'badge-low';
    default:
      return 'badge';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function playNotificationSound(): void {
  const audio = new Audio('/notification.mp3');
  audio.volume = 0.5;
  audio.play().catch(() => {
    // Ignore if audio play fails (user hasn't interacted with page yet)
  });
}

export function isWithin24Hours(date: string | Date): boolean {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - parsedDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 24;
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'senior_analyst':
      return 'Senior Analyst';
    case 'analyst':
      return 'Analyst';
    case 'viewer':
      return 'Viewer';
    default:
      return role;
  }
}

export function canUserPerformAction(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    admin: 4,
    senior_analyst: 3,
    analyst: 2,
    viewer: 1,
  };

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy];
}
