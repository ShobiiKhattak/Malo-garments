import { STORE } from '../../data/homeContent'

/** Floating chat button (bottom-right) with a soft pulsing ring. */
export default function WhatsAppButton() {
  const href = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(STORE.whatsappMessage)}`
  return (
    <a className="wa-float" href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
      <span className="wa-ring" />
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.3 15l-.3-.18-3.1.82.83-3.02-.2-.31A8.1 8.1 0 0 1 12.04 3.8Zm-3.2 3.9c-.2 0-.5.07-.75.35-.26.28-1 1-1 2.4 0 1.4 1.03 2.77 1.17 2.96.14.2 2 3.2 4.9 4.36 2.4.95 2.9.76 3.42.7.52-.05 1.68-.69 1.92-1.35.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.54-.33-.28-.14-1.68-.83-1.94-.92-.26-.1-.45-.14-.64.14-.19.28-.73.92-.9 1.11-.16.19-.33.21-.61.07-.28-.14-1.2-.44-2.28-1.4-.84-.75-1.41-1.68-1.58-1.96-.16-.28-.02-.44.12-.58.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.63-1.55-.88-2.1-.2-.5-.42-.5-.6-.5Z" /></svg>
    </a>
  )
}
