import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"

interface Ride {
  id: string
  pickup_lat: number
  pickup_lng: number
  status: string
}

export default function DriverDashboard() {
  const [rides, setRides] = useState<Ride[]>([])

  const fetchRides = async () => {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "pending")

    if (!error && data) {
      setRides(data)
    }
  }

  const acceptRide = async (rideId: string) => {
    const { error } = await supabase
      .from("rides")
      .update({
        status: "accepted",
        driver_id: "driver-demo-id"
      })
      .eq("id", rideId)

    if (!error) {
      fetchRides()
      alert("Ride accepted!")
    }
  }

  useEffect(() => {
    fetchRides()

    const channel = supabase
      .channel("rides-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
        },
        () => {
          fetchRides()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6">
      <h1 className="text-2xl mb-6">Pending Rides</h1>

      {rides.length === 0 && (
        <p className="text-gray-400">No pending rides</p>
      )}

      <div className="space-y-4">
        {rides.map((ride) => (
          <div
            key={ride.id}
            className="bg-[#1E293B] p-4 rounded-xl"
          >
            <p>Pickup:</p>
            <p className="text-sm text-gray-400">
              {ride.pickup_lat}, {ride.pickup_lng}
            </p>

            <button
              onClick={() => acceptRide(ride.id)}
              className="mt-3 bg-[#229ED9] px-4 py-2 rounded-lg"
            >
              Accept Ride
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
