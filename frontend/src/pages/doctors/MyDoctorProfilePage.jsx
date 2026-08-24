import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getMyDoctorProfile, createMyDoctorProfile, updateMyDoctorProfile,
  getMySchedule, addScheduleSlot, updateScheduleSlot, deleteScheduleSlot,
} from '../../api/doctor'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const emptyProfileForm = { specialty: '', license_number: '' }
const emptySlotForm = { day_of_week: 'monday', start_time: '', end_time: '' }

export default function MyDoctorProfilePage() {
  const [profile, setProfile] = useState(null)
  const [exists, setExists] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState(emptyProfileForm)
  const [schedule, setSchedule] = useState([])
  const [slotForm, setSlotForm] = useState(emptySlotForm)
  const [editingSlotId, setEditingSlotId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getMyDoctorProfile()
      setProfile(res.data)
      setExists(true)
      setProfileForm({ specialty: res.data.specialty, license_number: res.data.license_number })
      const schedRes = await getMySchedule()
      setSchedule(schedRes.data)
    } catch {
      setExists(false)
      setEditingProfile(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (exists) await updateMyDoctorProfile(profileForm)
      else await createMyDoctorProfile(profileForm)
      setEditingProfile(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile')
    }
  }

  const handleSlotSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editingSlotId) await updateScheduleSlot(editingSlotId, slotForm)
      else await addScheduleSlot(slotForm)
      setSlotForm(emptySlotForm)
      setEditingSlotId(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save schedule slot')
    }
  }

  const startEditSlot = (s) => {
    setEditingSlotId(s.ScheduleId)
    setSlotForm({ day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time })
  }

  const handleDeleteSlot = async (scheduleId) => {
    try {
      await deleteScheduleSlot(scheduleId)
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete slot')
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Doctor Profile</h1>
        <Link to="/doctors" className="text-sm text-blue-600 hover:underline">Back to Doctors</Link>
      </div>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="bg-white rounded-lg shadow p-6 max-w-lg mb-6">
        {!editingProfile && exists && profile ? (
          <>
            <dl className="grid grid-cols-2 gap-4">
              <div><dt className="text-sm text-slate-500">Specialty</dt><dd className="font-medium">{profile.specialty}</dd></div>
              <div><dt className="text-sm text-slate-500">License Number</dt><dd className="font-medium">{profile.license_number}</dd></div>
            </dl>
            <button onClick={() => setEditingProfile(true)} className="mt-4 text-blue-600 text-sm hover:underline">Edit Profile</button>
          </>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {!exists && <p className="text-sm text-slate-500">Create your doctor profile to get started.</p>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
              <input value={profileForm.specialty} onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })} required
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
              <input value={profileForm.license_number} onChange={(e) => setProfileForm({ ...profileForm, license_number: e.target.value })} required
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                {exists ? 'Save Changes' : 'Create Profile'}
              </button>
              {exists && <button type="button" onClick={() => setEditingProfile(false)} className="px-4 py-2 rounded border border-slate-300 text-slate-600 hover:bg-slate-50">Cancel</button>}
            </div>
          </form>
        )}
      </div>
      {exists && (
        <div className="bg-white rounded-lg shadow p-6 max-w-lg">
          <h2 className="font-semibold text-slate-800 mb-3">Weekly Schedule</h2>
          <form onSubmit={handleSlotSubmit} className="flex gap-2 items-end mb-4 flex-wrap">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Day</label>
              <select value={slotForm.day_of_week} onChange={(e) => setSlotForm({ ...slotForm, day_of_week: e.target.value })}
                className="border border-slate-300 rounded px-2 py-1 text-sm capitalize">
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Time</label>
              <input type="time" required value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                className="border border-slate-300 rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">End Time</label>
              <input type="time" required value={slotForm.end_time} onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                className="border border-slate-300 rounded px-2 py-1 text-sm" />
            </div>
            <button type="submit" className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700">
              {editingSlotId ? 'Update Slot' : 'Add Slot'}
            </button>
            {editingSlotId && (
              <button type="button" onClick={() => { setEditingSlotId(null); setSlotForm(emptySlotForm) }} className="text-sm text-slate-500 hover:underline">Cancel</button>
            )}
          </form>
          {schedule.length === 0 ? (
            <p className="text-sm text-slate-400">No schedule slots yet</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {schedule.map((s) => (
                <li key={s.ScheduleId} className="py-2 flex justify-between items-center text-sm">
                  <span className="capitalize font-medium text-slate-700">{s.day_of_week}</span>
                  <span className="text-slate-500">{s.start_time} – {s.end_time}</span>
                  <div className="flex gap-2">
                    <button onClick={() => startEditSlot(s)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDeleteSlot(s.ScheduleId)} className="text-red-600 hover:underline">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}