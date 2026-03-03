import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type RidePassenger = {
  user_id: string
  created_at?: string | null
}

type RouteStep = {
  type: 'pickup' | 'dropoff'
  user_id: string
  label: string
}

type ActiveRide = {
  id: string
  price: number
  driver_id: string
}

type DriverEarning = {
  id?: string
  driver_id?: string
  ride_id?: string
  amount: number | string
  platform_fee?: number | string
  created_at?: string | null
}

export default function DriverView() {
  const [requests, setRequests] = useState([])
  const [passengers, setPassengers] = useState<RidePassenger[]>([])
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([])
  const [activeRideId, setActiveRideId] = useState<string | null>(null)
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null)
  const [completedSteps, setCompletedSteps] = useState(0)
  const [driverId, setDriverId] = useState<string | null>(null)
  const [earnings, setEarnings] = useState<DriverEarning[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [todayEarnings, setTodayEarnings] = useState(0)

  useEffect(() => {
    fetchRequests()

    const channel = supabase
      .channel('ride_requests_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_requests'
        },
        (payload) => {
          console.log('New request received!', payload)
          setRequests(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const loadDriverAndEarnings = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) {
        return
      }

      setDriverId(authData.user.id)
      await fetchDriverEarnings(authData.user.id)
    }

    loadDriverAndEarnings()
  }, [])

  const fetchDriverEarnings = async (currentDriverId: string) => {
    const { data: earningsData, error } = await supabase
      .from("driver_earnings")
      .select("*")
      .eq("driver_id", currentDriverId)

    if (error) {
      console.error("Failed to fetch driver earnings:", error)
      return
    }

    const rows = (earningsData || []) as DriverEarning[]
    setEarnings(rows)

    const total = rows.reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0
    )
    setTotalEarnings(total)

    const today = new Date().toDateString()
    const todayTotal = rows
      .filter(row => row.created_at && new Date(row.created_at).toDateString() === today)
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
    setTodayEarnings(todayTotal)
  }

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('status', 'pending')

    setRequests(data || [])
  }

  const acceptRide = async (id: string) => {
    await supabase
      .from('ride_requests')
      .update({ status: 'accepted' })
      .eq('id', id)

    const { data: passengersData, error: passengersError } = await supabase
      .from("ride_passengers")
      .select("user_id, created_at")
      .eq("ride_id", id)
      .order("created_at", { ascending: true })

    const { data: rideDetails, error: rideDetailsError } = await supabase
      .from("rides")
      .select("*")
      .eq("id", id)
      .single()

    if (passengersError) {
      console.error("Failed to fetch passengers for ride:", passengersError)
    } else {
      const orderedPassengers = passengersData || []
      setPassengers(orderedPassengers)
      console.log("Passengers in this ride:", orderedPassengers)

      // Simple rule: pick up everyone first, then drop off in join order.
      const pickupSteps: RouteStep[] = orderedPassengers.map((p, index) => ({
        type: 'pickup',
        user_id: p.user_id,
        label: `Pickup Passenger ${index + 1}`
      }))
      const dropoffSteps: RouteStep[] = orderedPassengers.map((p, index) => ({
        type: 'dropoff',
        user_id: p.user_id,
        label: `Drop Passenger ${index + 1}`
      }))
      setRouteSteps([...pickupSteps, ...dropoffSteps])
      setCompletedSteps(0)
    }

    if (rideDetailsError) {
      console.error("Failed to fetch ride details:", rideDetailsError)
      setActiveRideId(null)
      setActiveRide(null)
    } else {
      setActiveRideId(rideDetails.id)
      setActiveRide(rideDetails)
      console.log("Ride details (pickup/dropoff):", rideDetails)
    }

    setRequests(requests.filter(req => req.id !== id))
  }

  const completeRide = async (ride: ActiveRide) => {
    const driverShare = ride.price * 0.8
    const platformFee = ride.price * 0.2

    const { error: earningsError } = await supabase.from("driver_earnings").insert({
      driver_id: ride.driver_id,
      ride_id: ride.id,
      amount: driverShare,
      platform_fee: platformFee
    })

    if (earningsError) {
      console.error("Failed to save driver earnings:", earningsError)
      return false
    }

    const { error: completionError } = await supabase
      .from("rides")
      .update({
        status: "completed"
      })
      .eq("id", ride.id)

    if (completionError) {
      console.error("Failed to complete ride:", completionError)
      return false
    }

    return true
  }

  const markNextStopComplete = async () => {
    if (routeSteps.length === 0 || completedSteps >= routeSteps.length) return

    const nextCompletedSteps = completedSteps + 1
    setCompletedSteps(nextCompletedSteps)

    if (nextCompletedSteps >= routeSteps.length && activeRide) {
      const isCompleted = await completeRide(activeRide)

      if (!isCompleted) {
        return
      }

      await fetchDriverEarnings(activeRide.driver_id)

      alert("Ride completed")
      setActiveRideId(null)
      setActiveRide(null)
      setPassengers([])
      setRouteSteps([])
      setCompletedSteps(0)
    }
  }

  const updateDriverLocation = async (lat: number, lng: number) => {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) return

    await supabase
      .from('drivers')
      .upsert([
        {
          id: userData.user.id,
          current_lat: lat,
          current_lng: lng,
          is_available: true
        }
      ])
  }

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        updateDriverLocation(
          position.coords.latitude,
          position.coords.longitude
        )
      },
      (error) => console.error(error),
      {
        enableHighAccuracy: true
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Available Rides</h1>
      <div className="mb-4 border p-3 rounded">
        <h2 className="text-xl font-bold">Driver Earnings</h2>
        <p>Total Earnings: GHS {totalEarnings.toFixed(2)}</p>
        <p>Today Earnings: GHS {todayEarnings.toFixed(2)}</p>
        <div className="mt-2">
          <h3>Ride History</h3>
          {earnings.map((earning, index) => (
            <div key={earning.id ?? `${earning.ride_id}-${index}`}>
              Ride {earning.ride_id ?? "N/A"} - GHS {Number(earning.amount ?? 0).toFixed(2)}
            </div>
          ))}
          {earnings.length === 0 && (
            <div>No earnings yet.</div>
          )}
        </div>
      </div>
      <div>
        <h3>Passengers</h3>
        {passengers.map((p, index) => (
          <div key={index}>
            Passenger {index + 1}
          </div>
        ))}
      </div>
      <div>
        <h3>Route Order</h3>
        {routeSteps.map((step, index) => (
          <div key={`${step.type}-${step.user_id}-${index}`}>
            {index + 1}. {step.label}{index < completedSteps ? " (Completed)" : ""}
          </div>
        ))}
        {routeSteps.length > 0 && (
          <button
            onClick={markNextStopComplete}
            className="bg-gray-800 text-white px-4 py-2 rounded mt-2"
          >
            {completedSteps < routeSteps.length
              ? `Mark Stop ${completedSteps + 1} Complete`
              : "All Stops Completed"}
          </button>
        )}
      </div>
      {requests.map((req) => (
        <div key={req.id} className="border p-4 mb-2 rounded">
          <p>Pickup: {req.pickup_lat}, {req.pickup_lng}</p>
          <p>Dropoff: {req.dropoff_lat}, {req.dropoff_lng}</p>
          <button 
            onClick={() => acceptRide(req.id)}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
          >
            Accept
          </button>
        </div>
      ))}
    </div>
  )
}
