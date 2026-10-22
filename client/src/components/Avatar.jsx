/*
  Avatar: a colored circle with a person's initials ("Jordan Rivera" -> "JR").
  No photos are uploaded or stored; the color is picked from the name, so the same
  person always gets the same color. Titles like "Ms." or "Dr." are skipped.
  Decorative when the name is written next to it (pass `label` only when it isn't).
*/

import { avatarColor, initialsOf } from '../utils/avatar';

const SIZES = { sm: 32, md: 44, lg: 72, xl: 96 };

function Avatar({ name, size = 'md', label, className = '' }) {
  const pixels = SIZES[size] || SIZES.md;
  return (
    <span
      className={`avatar d-inline-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0 ${className}`}
      style={{
        width: pixels,
        height: pixels,
        fontSize: pixels * 0.4,
        backgroundColor: avatarColor(name),
      }}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
    >
      {initialsOf(name)}
    </span>
  );
}

export default Avatar;
