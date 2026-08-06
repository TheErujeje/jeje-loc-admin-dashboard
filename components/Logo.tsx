// Renders the LOC mark from a single white/transparent PNG, recolored via
// CSS mask so it takes whatever `text-*` color the caller passes — same
// drop-in behavior as the lucide Trophy icon it replaces.
export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'inline-block',
        backgroundColor: 'currentColor',
        WebkitMaskImage: 'url(/LOC-logo.png)',
        maskImage: 'url(/LOC-logo.png)',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  )
}
