// Skeleton placeholder cards shown while IPOs are loading.

export default function IpoSkeleton({ count = 8 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div className="card skeleton-card" key={idx}>
          <div className="card-head">
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-line" style={{ width: '70%', height: 18 }} />
              <div className="tags">
                <div className="skeleton skeleton-pill" />
                <div className="skeleton skeleton-pill" />
              </div>
            </div>
            <div className="skeleton skeleton-pill" style={{ width: 40 }} />
          </div>

          <div className="gmp-row">
            <div className="skeleton skeleton-line" style={{ width: '40%', height: 14 }} />
          </div>

          <ul className="details">
            {Array.from({ length: 6 }).map((__, i) => (
              <li key={i}>
                <div className="skeleton skeleton-line" style={{ width: '100%', height: 12 }} />
              </li>
            ))}
          </ul>

          <div className="skeleton skeleton-line" style={{ width: '100%', height: 36, borderRadius: 8, marginTop: 4 }} />
        </div>
      ))}
    </div>
  )
}
