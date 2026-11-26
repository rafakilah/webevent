import { eventConfig } from '@/config/event'
import { formatRupiah, paymentDeadline } from '@/lib/format'
import { CopyButton } from './copy-button'
import { Deadline } from './deadline'

export function PaymentInstructions({ registeredAt }: { registeredAt: string }) {
  const { ticket, payment } = eventConfig

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
        <div>
          <p className="text-sm text-slate-600">Nominal transfer</p>
          <p className="text-2xl font-extrabold tracking-tight tabular-nums">
            {formatRupiah(ticket.price)}
          </p>
        </div>
        <CopyButton text={String(ticket.price)} label="Salin" />
      </div>

      <ul className="space-y-2">
        {payment.accounts.map((account) => (
          <li
            key={account.accountNumber}
            className="flex items-center justify-between gap-3 rounded-xl p-4 ring-1 ring-slate-200"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">{account.bank}</p>
              <p className="font-mono text-lg tracking-wide tabular-nums">
                {account.accountNumber}
              </p>
              <p className="truncate text-sm text-slate-500">a.n. {account.accountName}</p>
            </div>
            <CopyButton text={account.accountNumber} />
          </li>
        ))}
      </ul>

      <Deadline deadline={paymentDeadline(registeredAt).toISOString()} />

      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
        {payment.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  )
}
