'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const [services, setServices] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<string>('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Cargar servicios guardados en Supabase
  useEffect(() => {
    async function loadServices() {
      const { data, error } = await supabase.from('services').select('*')
      if (!error && data) {
        setServices(data)
        if (data.length > 0) setSelectedService(data[0].id)
      }
    }
    loadServices()
  }, [])

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // 1. Obtener el ID de la barbería
      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('phone', '6623014962')
        .single()

      if (!barbershop) throw new Error('No se encontró la barbería')

      // 2. Registrar o buscar cliente
      let { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', clientPhone)
        .single()

      if (!client) {
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert([{ barbershop_id: barbershop.id, name: clientName, phone: clientPhone }])
          .select('id')
          .single()

        if (clientErr) throw clientErr
        client = newClient
      }

      // 3. Crear la cita
      const startDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`)
      const selectedServiceData = services.find((s) => s.id === selectedService)
      const duration = selectedServiceData ? selectedServiceData.duration_minutes : 30
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000)

      const { error: apptErr } = await supabase.from('appointments').insert([
        {
          barbershop_id: barbershop.id,
          client_id: client.id,
          service_id: selectedService,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'confirmed',
        },
      ])

      if (apptErr) throw apptErr

      setMessage('🎉 ¡Cita agendada con éxito en MB Barbería!')
      setClientName('')
      setClientPhone('')
    } catch (err: any) {
      console.error(err)
      setMessage('❌ Error al agendar la cita. Verifica los datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: '500px', margin: '2rem auto', padding: '1.5rem', fontFamily: 'sans-serif', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2>💈 Agendar Cita - MB Barbería</h2>
      
      {message && <p style={{ fontWeight: 'bold', padding: '0.5rem', background: '#e2e8f0' }}>{message}</p>}

      <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Nombre Completo:</label>
          <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Teléfono (WhatsApp):</label>
          <input type="tel" required value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
        </div>

        <div>
         <label style={{ display: 'block', fontWeight: 'bold' }}>Servicio:</label>
          <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} style={{ width: '100%', padding: '0.5rem', }} required>
            <option value="">Selecciona un servicio</option>
            <option value="Prueba 1">Prueba 1 - $200 </option>
            <option value="Prueba 2">Prueba 2 - $300 </option>
            <option value="Prueba 3">Prueba 3 - $150 </option>
            <option value="Prueba 4">Prueba 4 - $400 </option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Fecha:</label>
          <input type="date" required value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Hora:</label>
          <input type="time" required value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '0.75rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? 'Agendando...' : 'Confirmar Cita'}
        </button>
      </form>
    </main>
  )
}
