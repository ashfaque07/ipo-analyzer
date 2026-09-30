// Modal that shows the % change history for a single trending stock, with one
// row per refresh (time + % change + LTP).

import { ICONS } from '../constants/ui.js'
import Modal from './Modal.jsx'

const fmtNum = (n, d = 2) =>
  n === null || n === undefined || Number.isNaN(n)
    ? '—'
    : Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })

const fmtTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  })
}

export default function TrendingHistoryModal({ stock, onClose }) {
  if (!stock) return null

  // Oldest first (chronological), numbered 1..n.
  const history = stock.history || []

  return (
    <Modal title={`% Change History · ${stock.symbol}`} onClose={onClose}>
      {!history.length ? (
        <p className="info">No history recorded yet for this stock.</p>
      ) : (
        <div className="trending-table-wrap" style={{ marginTop: 14 }}>
            <table className="trending-table" style={{ minWidth: 'auto' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Time</th>
                  <th>Change (%)</th>
                  <th>LTP</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => {
                  const up = (h.percentChange ?? 0) >= 0
                  return (
                    <tr key={h.time || i}>
                      <td className="muted">{i + 1}</td>
                      <td>{fmtTime(h.time)}</td>
                      <td>
                        <span className={up ? 'pos' : 'neg'}>
                          {up ? ICONS.up : ICONS.down} {fmtNum(h.percentChange)}%
                        </span>
                      </td>
                      <td>{fmtNum(h.ltp)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
      )}
    </Modal>
  )
}
