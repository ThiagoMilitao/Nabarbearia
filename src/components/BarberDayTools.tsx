import { useEffect, useRef, useState } from 'react'
import { Coffee, Plus, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/services/api'
import type { Service } from '@/types'
import { minutesFromNow, money, shopDate, shopTime } from '@/lib/barber-schedule'

type Block = { id: string; starts_at: string; ends_at: string; reason?: string }
type BarberClient = { id: string; display_name: string; phone?: string | null }

export default function BarberDayTools({ date, barberId, busy, editingBlock = null, onClearEdit, onRun }: {
  date: string; barberId: string; busy: boolean
  editingBlock?: Block | null
  onClearEdit?: () => void
  onRun: (action: () => Promise<void>, notice: string) => Promise<boolean>
}) {
  const [mode, setMode] = useState<'walkin' | 'break' | 'edit-break' | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [serviceError, setServiceError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [payment, setPayment] = useState('Presencial')
  const [service, setService] = useState('')
  const [time, setTime] = useState('')
  const [minutes, setMinutes] = useState(15)
  const [reason, setReason] = useState('Pausa')
  const [clientQuery, setClientQuery] = useState('')
  const [clients, setClients] = useState<BarberClient[]>([])
  const [selectedClient, setSelectedClient] = useState<BarberClient | null>(null)
  const key = useRef({ fingerprint: '', id: '' })
  useEffect(() => { setMode(null); setTime(''); onClearEdit?.() }, [date])
  useEffect(() => {
    if (!editingBlock) return
    const diff = Math.round((new Date(editingBlock.ends_at).getTime() - new Date(editingBlock.starts_at).getTime()) / 60000)
    setMode('edit-break')
    setTime(shopTime(new Date(editingBlock.starts_at)))
    setMinutes(diff > 0 ? diff : 15)
    setReason(editingBlock.reason || 'Pausa')
  }, [editingBlock])
  useEffect(() => {
    let active = true
    setServiceError('')
    api.getPublicServices().then((items) => { if (active) setServices(items.filter((item) => item.active !== false)) })
      .catch(() => { if (active) setServiceError('Não foi possível carregar os serviços. Feche e abra o formulário para tentar novamente.') })
    return () => { active = false }
  }, [mode])
  useEffect(() => {
    const query = clientQuery.trim()
    if (mode !== 'walkin' || query.length < 2 || selectedClient) { setClients([]); return }
    let active = true
    const timer = window.setTimeout(() => {
      api.listBarberClients(query).then((items) => { if (active) setClients(items) }).catch(() => { if (active) setClients([]) })
    }, 250)
    return () => { active = false; window.clearTimeout(timer) }
  }, [clientQuery, mode, selectedClient])
  const field = 'h-11 rounded-xl border-gray-200 bg-white text-sm!'
  const resetForm = () => {
    setMode(null); setName(''); setPhone(''); setNote(''); setClientQuery(''); setClients([]); setSelectedClient(null); setReason('Pausa'); key.current = { fingerprint: '', id: '' }; onClearEdit?.()
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const starts = new Date(`${date}T${time}:00-03:00`)
    const now = new Date()
    const tooOldForWalkIn = mode === 'walkin' && starts < new Date(now.getTime() - 15 * 60000)
    const tooEarlyForBlock = mode !== 'walkin' && starts <= now
    if (!Number.isFinite(starts.getTime()) || tooOldForWalkIn || tooEarlyForBlock) {
      await onRun(async () => { throw new Error(mode === 'walkin' ? 'Use Agora ou um horário que não tenha passado há mais de 15 minutos.' : 'Escolha um horário futuro para lançar a pausa.') }, '')
      return
    }
    const action = mode === 'walkin' ? async () => {
      const input = { barber_user_id: barberId, service_id: service, starts_at: starts.toISOString(), client_user_id: selectedClient?.id, client_name: name.trim() || undefined, client_phone: phone.replace(/\D/g, '') || undefined, payment_method: payment, client_note: note.trim() || undefined }
      const fingerprint = JSON.stringify(input)
      if (key.current.fingerprint !== fingerprint) key.current = { fingerprint, id: crypto.randomUUID() }
      await api.createWalkIn(input, key.current.id)
    } : async () => {
      const input = { barber_user_id: barberId, starts_at_utc: starts.toISOString(), ends_at_utc: new Date(starts.getTime() + minutes * 60000).toISOString(), reason: reason.trim() || 'Pausa' }
      if (mode === 'edit-break' && editingBlock) await api.updateOwnBlock(editingBlock.id, input)
      else await api.createOwnBlock(input)
    }
    if (await onRun(action, mode === 'walkin' ? 'Cliente presencial incluído na agenda.' : mode === 'edit-break' ? 'Pausa atualizada na agenda.' : 'Pausa bloqueada na agenda.')) resetForm()
  }
  return <section aria-label="Gestão do dia" className="space-y-3">
    <div className="flex flex-wrap gap-2">
      <Button disabled={busy || date < shopDate()} onClick={() => { setMode(mode === 'walkin' ? null : 'walkin'); setTime(date === shopDate() ? shopTime() : '09:00') }} aria-expanded={mode === 'walkin'} className="min-h-11 flex-1 rounded-xl px-3 text-xs! font-semibold!"><Plus className="size-4" />Cliente Presencial (Encaixe)</Button>
      <Button disabled={busy || date < shopDate()} variant="outline" onClick={() => { setMinutes(60); setReason('Almoço'); setMode('break') }} className="min-h-11 rounded-xl bg-white px-3 text-xs!"><Utensils className="size-3.5" />Almoço (1h)</Button>
      <Button disabled={busy || date < shopDate()} variant="outline" onClick={() => { setMinutes(15); setReason('Pausa'); setMode('break') }} className="min-h-11 rounded-xl bg-white px-3 text-xs!"><Coffee className="size-3.5" />Pausa (15 min)</Button>
    </div>
    {mode && <Card className="gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-0">
      <h2 className="text-sm font-semibold">{mode === 'walkin' ? 'Novo atendimento presencial' : mode === 'edit-break' ? 'Editar pausa' : `Bloquear ${minutes} minutos`}</h2>
      <p className="text-xs text-muted-foreground">{mode === 'walkin' ? 'Preço e duração seguem o serviço escolhido. O encaixe respeita a disponibilidade da agenda.' : 'A pausa impede novas reservas e não pode sobrepor atendimentos confirmados.'}</p>
      <form onSubmit={submit} className="space-y-3">
        <fieldset disabled={busy} className="space-y-3">
          {mode === 'walkin' && <>
            <label className="block space-y-1 text-xs font-semibold">Buscar cliente já cadastrado<Input value={clientQuery} onChange={(e) => { setClientQuery(e.target.value); setSelectedClient(null) }} className={field} placeholder="Nome ou telefone" autoComplete="off" /></label>
            {clients.length > 0 && <div role="listbox" aria-label="Clientes encontrados" className="-mt-2 space-y-1 rounded-xl border border-gray-200 bg-white p-1">{clients.map((client) => <button type="button" role="option" key={client.id} onClick={() => { setSelectedClient(client); setName(client.display_name); setPhone(client.phone ?? ''); setClientQuery(client.display_name); setClients([]) }} className="flex min-h-10 w-full items-center justify-between rounded-lg px-2 text-left text-xs hover:bg-gray-50"><span>{client.display_name}</span><span className="text-gray-400">{client.phone || 'sem telefone'}</span></button>)}</div>}
            <label className="block space-y-1 text-xs font-semibold">Nome do cliente<Input required={!selectedClient} minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="name" /></label>
            <label className="block space-y-1 text-xs font-semibold">WhatsApp (opcional)<Input type="tel" value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} className={field} placeholder="DDD + número" autoComplete="tel" /></label>
            <label className="block space-y-1 text-xs font-semibold">Serviço<select required value={service} onChange={(e) => setService(e.target.value)} className={`w-full ${field}`}><option value="">Selecione um serviço</option>{services.map((item) => <option key={item.id} value={item.id}>{item.name} · {money(item.priceCents)} · {item.durationMinutes} min</option>)}</select></label>
            {serviceError && <p role="alert" className="text-xs text-destructive">{serviceError}</p>}
            <label className="block space-y-1 text-xs font-semibold">Pagamento previsto<select value={payment} onChange={(e) => setPayment(e.target.value)} className={`w-full ${field}`}>{['Presencial', 'Pix', 'Cartão'].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="block space-y-1 text-xs font-semibold">Observação (opcional)<Input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className={field} placeholder="Preferências para este atendimento" /></label>
          </>}
          {mode !== 'walkin' && <label className="block space-y-1 text-xs font-semibold">Motivo<Input value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} className={field} /></label>}
          <label className="block space-y-1 text-xs font-semibold">Horário de início · Brasília<Input required type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} /></label>
          {mode === 'walkin' && date === shopDate() && <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setTime(shopTime())} className="min-h-10 rounded-xl text-xs!">Agora</Button><Button type="button" variant="outline" onClick={() => setTime(minutesFromNow(15))} className="min-h-10 rounded-xl text-xs!">Próximo horário</Button></div>}
          <div className="flex gap-2"><Button type="button" variant="outline" onClick={resetForm} className="min-h-11 rounded-xl text-xs!">Fechar</Button><Button type="submit" className="min-h-11 rounded-xl text-xs!">{busy ? 'Salvando…' : mode === 'walkin' ? 'Adicionar à agenda' : mode === 'edit-break' ? 'Salvar pausa' : 'Confirmar pausa'}</Button></div>
        </fieldset>
      </form>
    </Card>}
  </section>
}
