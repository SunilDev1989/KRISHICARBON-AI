'use client';

/**
 * SkipLink — accessibility component.
 * Renders a visually-hidden link as the very first focusable element on the page.
 * When keyboard users press Tab, this link becomes visible and allows skipping
 * directly to the main content — a WCAG 2.1 SC 2.4.1 requirement.
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-100px',
        left: '0',
        padding: '8px 16px',
        backgroundColor: '#166534',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '14px',
        borderRadius: '0 0 4px 0',
        textDecoration: 'none',
        zIndex: 9999,
        transition: 'top 0.1s',
      }}
      onFocus={e => {
        (e.target as HTMLAnchorElement).style.top = '0';
      }}
      onBlur={e => {
        (e.target as HTMLAnchorElement).style.top = '-100px';
      }}
    >
      Skip to main content
    </a>
  );
}
