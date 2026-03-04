import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { supabase } from "../services/supabase"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export default function PassengerDashboard() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [rideStatus, setRideStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-0.187, 5.6037], // Accra default
      zoom: 13
    })

    // Add user location
    navigator.geolocation.getCurrentPosition((pos) => {
      new mapboxgl.Marker()
        .setLngLat([
          pos.coords.longitude,
          pos.coords.latitude
        ])
        .addTo(map)

      map.flyTo({
        center: [
          pos.coords.longitude,
          pos.coords.latitude
        ],
        zoom: 15
      })
    })

    return () => map.remove()
  }, [])

  const requestRide = async () => {
    setLoading(true)

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { data, error } = await supabase
        .from("rides")
        .insert({
          pickup_lat: pos.coords.latitude,
          pickup_lng: pos.coords.longitude,
          status: "pending"
        })
        .select()
        .single()

      if (error) {
        alert("Error requesting ride")
        console.error(error)
      } else {
        alert("Ride requested successfully!")
      }

      if (data) {
        setRideStatus("pending")

        supabase
          .channel("ride-status")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "rides",
              filter: `id=eq.${data.id}`,
            },
            (payload: any) => {
              setRideStatus(payload.new.status)
            }
          )
          .subscribe()
      }

      setLoading(false)
    })
  }

  return (
    <div className="h-screen bg-[#0F172A] relative">
      <div ref={mapContainer} className="w-full h-full" />
      {rideStatus && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-[#1E293B] px-4 py-2 rounded-xl">
          Status: {rideStatus}
        </div>
      )}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center">
        <button
          onClick={requestRide}
          className="bg-[#229ED9] text-white px-8 py-4 rounded-full shadow-lg"
        >
          {loading ? "Requesting..." : "Request Ride"}
        </button>
      </div>
    </div>
  )
}
