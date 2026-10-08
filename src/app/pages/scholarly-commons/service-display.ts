// Pure display helpers shared by the search cards and the service detail page, so a service reads the same on both.

export const ORDER_FULLY_OPEN = 'order_type-fully_open_access';
export const ORDER_REQUIRED = 'order_type-order_required';

// The API labels are long sentences for TRL ("9 - actual system proven in operational environment") and
// verbose for order type, so the design's short forms are used instead.
export function displayLabel(field: string, value: string, apiLabel: string): string {
  switch (field) {
    case 'trl': {
      const level = /^trl-(\d+)/.exec(value)?.[1];
      return level ? `TRL ${level}` : apiLabel;
    }
    case 'order_type':
      if (value === ORDER_FULLY_OPEN) {
        return 'Fully open';
      }
      return value === ORDER_REQUIRED ? 'Order required' : apiLabel;
    default:
      return apiLabel;
  }
}

// Descriptions arrive as HTML. DOMParser builds an inert document (no scripts run, no resources load),
// and textContent decodes entities, so callers can render the result with plain interpolation.
// A space is put before block boundaries first: textContent would otherwise glue "<p>A.</p><p>B</p>" into "A.B".
export function htmlToText(html: string): string {
  const spaced = html.replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, ' $&');
  const text = new DOMParser().parseFromString(spaced, 'text/html').body.textContent ?? '';
  return text.replace(/\s+/g, ' ').trim();
}

export function initialsOf(name: string): string {
  const words = (name ?? '').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (!words.length) {
    return '?';
  }
  const raw = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

// The mock hand-assigned teal/pink; the API has no such field, so alternate by a stable hash of the id
// (same service, same colour on every page and reload).
export function accentFor(id: string): 'teal' | 'pink' {
  let sum = 0;
  for (const char of id ?? '') {
    sum += char.charCodeAt(0);
  }
  return sum % 2 === 0 ? 'teal' : 'pink';
}

// "A, B, C +4": keeps pills readable for services that list many target users or languages.
export function summarizeList(items: string[], max = 3): string {
  return items.length > max ? `${items.slice(0, max).join(', ')} +${items.length - max}` : items.join(', ');
}

// Link targets come from catalogue data, so only web and mailto links are ever rendered as hrefs.
export function safeUrl(value: unknown): string {
  const url = typeof value === 'string' ? value.trim() : '';
  return /^(https?:\/\/|mailto:)/i.test(url) ? url : '';
}

// `logo` is typed as the entity's `URL` class but arrives as a plain string (or null).
export function logoOf(logo: unknown): string | null {
  return typeof logo === 'string' && logo ? logo : null;
}
