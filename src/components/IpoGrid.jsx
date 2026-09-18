// Grid of IPO cards.

import IpoCard from './IpoCard.jsx'

export default function IpoGrid({ ipos, analyzing, onAnalyze }) {
  return (
    <div className="grid">
      {ipos.map((ipo, idx) => (
        <IpoCard
          key={ipo.id ?? idx}
          ipo={ipo}
          index={idx}
          analyzing={analyzing}
          onAnalyze={onAnalyze}
        />
      ))}
    </div>
  )
}
