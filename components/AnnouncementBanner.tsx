const MESSAGES = [
  'Hitta lokala B2B-leads snabbare',
  'Skapa personliga mailförslag på minuter',
  'Byggt för ansvarsfull B2B-outreach',
  'Gratis att testa under beta',
]

function MessageRow() {
  return (
    <div className="flex items-center shrink-0">
      {MESSAGES.map((msg, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <span className="px-4">{msg}</span>
          <span className="text-slate-600">•</span>
        </span>
      ))}
    </div>
  )
}

export default function AnnouncementBanner() {
  return (
    <div className="bg-slate-900 text-white text-xs font-medium py-2 overflow-hidden">
      <div className="flex w-max animate-marquee">
        <MessageRow />
        <MessageRow />
      </div>
    </div>
  )
}
