import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './services/supabase'

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
mapboxgl.accessToken = mapboxToken || ''

export default function UserView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null)

  const [pickupLat] = useState(5.6037)
  const [pickupLng] = useState(-0.1870)
  const [stops, setStops] = useState<
    { lat: number; lng: number }[]
  >([])
  const [loading, setLoading] = useState(false)
  const [price, setPrice] = useState<number | null>(null)
  const [driverLocation, setDriverLocation] = useState<any>(null)
  const [rideType, setRideType] = useState("private")
  const [rideStatus, setRideStatus] = useState<string | null>(null)
  const [sharedRideId, setSharedRideId] = useState<string | null>(null)

  const [userData, setUserData] = useState<User | null>(null)
  const arrivalAlertShownRef = useRef(false)

  const addStop = (lat: number, lng: number) => {
    setStops(prev => [...prev, { lat, lng }])
  }

  const mapRideStatus = (status?: string | null) => {
    if (!status) return null

    if (status === "searching" || status === "pending") return "Searching Driver"
    if (status === "accepted" || status === "assigned") return "Driver Assigned"
    if (status === "arriving") return "Driver Arriving"
    if (status === "in_progress") return "Ride In Progress"
    if (status === "completed") return "Completed"

    return status
  }

  const checkDriverArrivalEta = async (driverLat: number, driverLng: number) => {
    if (arrivalAlertShownRef.current) return

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLng},${driverLat};${pickupLng},${pickupLat}?overview=false&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
    const res = await fetch(url)
    const routeData = await res.json()

    if (!res.ok || !routeData.routes?.[0]) {
      return
    }

    const etaMinutes = routeData.routes[0].duration / 60
    if (etaMinutes <= 2) {
      arrivalAlertShownRef.current = true
      alert("Driver is 2 minutes away")
      setRideStatus("Driver Arriving")
    }
  }

  // 🔐 Load authenticated user
  useEffect(() => {
    const loadUser = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Failed to load user:', authError)
        return
      }
      setUserData(authData.user)
    }

    loadUser()
  }, [])

  // 🗺 Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current) return
    if (!mapboxToken) {
      console.error('Missing VITE_MAPBOX_TOKEN in environment')
      return
    }

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-0.1870, 5.6037], // Accra
      zoom: 12
    })

    if (driverLocation) {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new mapboxgl.Marker({ color: "blue" })
          .setLngLat([driverLocation.lng, driverLocation.lat])
          .addTo(mapRef.current)
      } else {
        driverMarkerRef.current.setLngLat([
          driverLocation.lng,
          driverLocation.lat
        ])
      }
    }

    return () => {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove()
        driverMarkerRef.current = null
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !driverLocation) return

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new mapboxgl.Marker({ color: "blue" })
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .addTo(mapRef.current)
    } else {
      driverMarkerRef.current.setLngLat([
        driverLocation.lng,
        driverLocation.lat
      ])
    }
  }, [driverLocation])

  // 🔄 Listen for ride status updates (ONLY for this user)
  useEffect(() => {
    if (!userData) return

    const channel = supabase
      .channel(`user_ride_status_${userData.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_requests',
          filter: `user_id=eq.${userData.id}`
        },
        (payload) => {
          const nextRow = payload.new as any
          const oldRow = payload.old as any
          const status = nextRow?.status ?? oldRow?.status
          const nextStatus = mapRideStatus(status)
          if (nextStatus) {
            setRideStatus(nextStatus)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userData])

  useEffect(() => {
    if (!userData) return

    const channel = supabase
      .channel('driver_location_listener')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers'
        },
        async (payload) => {
          const driverId = payload.new.id

          // Check if this driver is assigned to this user
          const { data: ride } = await supabase
            .from('ride_requests')
            .select('*')
            .eq('user_id', userData.id)
            .in('status', ['assigned', 'accepted', 'in_progress', 'completed'])
            .maybeSingle()

          if (ride && ride.driver_id === driverId) {
            setDriverLocation({
              lat: payload.new.current_lat,
              lng: payload.new.current_lng
            })

            if (ride.status === 'assigned' || ride.status === 'accepted') {
              setRideStatus('Driver Arriving')
              await checkDriverArrivalEta(payload.new.current_lat, payload.new.current_lng)
            } else {
              const nextStatus = mapRideStatus(ride.status)
              if (nextStatus) {
                setRideStatus(nextStatus)
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userData])

  useEffect(() => {
    if (!sharedRideId) return

    const channel = supabase
      .channel(`shared_ride_status_${sharedRideId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${sharedRideId}`
        },
        (payload) => {
          const nextRow = payload.new as any
          const oldRow = payload.old as any
          const status = nextRow?.status ?? oldRow?.status
          const nextStatus = mapRideStatus(status)
          if (nextStatus) {
            setRideStatus(nextStatus)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sharedRideId])

  // 🚗 Create Ride Request
  const startSharedRide = async (rideId: string) => {
    const { error } = await supabase
      .from("rides")
      .update({
        status: "in_progress"
      })
      .eq("id", rideId)
      .eq("status", "searching")

    if (error) {
      console.error("Failed to start shared ride:", error)
    }
  }

  const scheduleSharedRideStartTimeout = (rideId: string) => {
    setTimeout(async () => {
      const { data: ride, error } = await supabase
        .from("rides")
        .select("*")
        .eq("id", rideId)
        .single()

      if (error || !ride) {
        console.error("Timeout check failed:", error)
        return
      }

      if (ride.status === "searching") {
        await startSharedRide(rideId)
      }
    }, 180000)
  }

  const getPointToPointDistance = async (
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ) => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok || !data.routes?.[0]) {
      throw new Error(data?.message || "Failed to calculate route distance")
    }

    return data.routes[0].distance as number
  }

  const findMatchingSharedRide = async (passengerDropoff: { lat: number; lng: number }) => {
    const { data: ridesData, error } = await supabase
      .from("rides")
      .select("*")
      .eq("ride_type", "shared")
      .eq("status", "searching")

    if (error) {
      throw error
    }

    const rides = ridesData || []
    let matchedRide: any = null
    let bestAdditionalDistance = Infinity

    for (const ride of rides) {
      if (
        typeof ride.pickup_lat !== "number" ||
        typeof ride.pickup_lng !== "number" ||
        typeof ride.dropoff_lat !== "number" ||
        typeof ride.dropoff_lng !== "number"
      ) {
        continue
      }

      const originalDistance = await getPointToPointDistance(
        ride.pickup_lat,
        ride.pickup_lng,
        ride.dropoff_lat,
        ride.dropoff_lng
      )

      const detourDistance =
        await getPointToPointDistance(ride.pickup_lat, ride.pickup_lng, pickupLat, pickupLng) +
        await getPointToPointDistance(pickupLat, pickupLng, passengerDropoff.lat, passengerDropoff.lng) +
        await getPointToPointDistance(passengerDropoff.lat, passengerDropoff.lng, ride.dropoff_lat, ride.dropoff_lng)

      const additionalDistance = detourDistance - originalDistance
      const maxAllowedIncrease = originalDistance * 0.2

      if (
        additionalDistance < maxAllowedIncrease &&
        additionalDistance < bestAdditionalDistance
      ) {
        matchedRide = ride
        bestAdditionalDistance = additionalDistance
      }
    }

    return matchedRide
  }

  const createRideRequest = async () => {
    setLoading(true)
    arrivalAlertShownRef.current = false
    try {
      if (!userData) {
        alert("You must be logged in")
        return
      }

      if (stops.length === 0) {
        alert("Add at least one stop before requesting a ride")
        return
      }

      setRideStatus("Searching Driver")

      let route
      try {
        route = await getRoute()
      } catch (error) {
        console.error("Route optimization failed:", error)
        alert("Failed to optimize route")
        return
      }

    const finalStop = route.optimizedStops[route.optimizedStops.length - 1]

    if (!finalStop) {
      alert("Missing final dropoff stop")
      return
    }

    setStops(route.optimizedStops)

    const distanceKm = route.distance / 1000
    const durationMin = route.duration / 60

    // Pricing logic (Ghana example)
    const baseFare = 5
    const perKm = 3
    const perMinute = 0.5

    const calculatedPrice =
      baseFare +
      distanceKm * perKm +
      durationMin * perMinute

    setPrice(calculatedPrice)

    if (rideType === "shared") {
      let matchedRide: any = null

      try {
        matchedRide = await findMatchingSharedRide(finalStop)
      } catch (error) {
        console.error("Shared ride direction matching failed:", error)
      }

      if (matchedRide) {
        const { data: passengers, error: passengersError } = await supabase
          .from("ride_passengers")
          .select("*")
          .eq("ride_id", matchedRide.id)

        if (passengersError) {
          console.error("Passenger count error:", passengersError)
          alert("Failed to check shared ride capacity")
          return
        }

        if ((passengers?.length ?? 0) < 3) {
          const { error: joinError } = await supabase
            .from("ride_passengers")
            .insert({
              ride_id: matchedRide.id,
              user_id: userData.id
            })

          if (joinError) {
            console.error("Join shared ride error:", joinError)
            alert("Failed to join shared ride")
            return
          }

          setSharedRideId(matchedRide.id)
          setRideStatus(mapRideStatus("searching"))

          const { data: updatedPassengers } = await supabase
            .from("ride_passengers")
            .select("*")
            .eq("ride_id", matchedRide.id)

          if ((updatedPassengers?.length ?? 0) >= 3) {
            await startSharedRide(matchedRide.id)
          } else {
            scheduleSharedRideStartTimeout(matchedRide.id)
          }

          alert("Joined shared ride!")
          return
        } else {
          alert("Matched ride is full. Creating new shared ride.")
        }
      }
    }

    if (rideType === "shared") {
      const { data: newRide, error: newRideError } = await supabase
        .from("rides")
        .insert({
          user_id: userData.id,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          dropoff_lat: finalStop.lat,
          dropoff_lng: finalStop.lng,
          ride_type: "shared",
          status: "searching"
        })
        .select()
        .single()

      if (newRideError || !newRide) {
        console.error("Create shared ride error:", newRideError)
        alert("Failed to create shared ride")
        return
      }

      setSharedRideId(newRide.id)
      setRideStatus(mapRideStatus("searching"))

      const { error: firstPassengerError } = await supabase
        .from("ride_passengers")
        .insert({
          ride_id: newRide.id,
          user_id: userData.id
        })

      if (firstPassengerError) {
        console.error("Add first passenger error:", firstPassengerError)
        alert("Failed to add passenger to shared ride")
        return
      }

      const { data: passengers } = await supabase
        .from("ride_passengers")
        .select("*")
        .eq("ride_id", newRide.id)

      if ((passengers?.length ?? 0) >= 3) {
        await startSharedRide(newRide.id)
      } else {
        scheduleSharedRideStartTimeout(newRide.id)
      }

      alert("Shared ride created!")
      return
    }

    const nearestDriver = await findNearestDriver()
    setSharedRideId(null)

    if (!nearestDriver) {
      alert("No drivers available")
      return
    }

    const { data: insertedRide, error: insertError } = await supabase
      .from('ride_requests')
      .insert([
        {
          user_id: userData.id,
          driver_id: nearestDriver.id,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          dropoff_lat: finalStop.lat,
          dropoff_lng: finalStop.lng,
          ride_type: rideType,
          price: calculatedPrice,
          status: "searching"
        }
      ])

      if (insertError) {
        console.error("Ride request error:", insertError)
        alert("Failed to create ride request")
      } else {
        setRideStatus(mapRideStatus("searching"))
        await supabase
          .from('drivers')
          .update({ is_available: false })
          .eq('id', nearestDriver.id)

        console.log("Ride request created:", insertedRide)
        alert("Ride request sent!")
      }
    } catch (error) {
      console.error(error)
      alert("Request failed")
    } finally {
      setLoading(false)
    }
  }

  const getRoute = async () => {
    if (stops.length === 0) {
      throw new Error('At least one stop is required')
    }

    const coordinates = [
      `${pickupLng},${pickupLat}`,
      ...stops.map(stop => `${stop.lng},${stop.lat}`)
    ].join(';')
    const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinates}?source=first&roundtrip=false&geometries=geojson&overview=full&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`

    const res = await fetch(url)
    const routeData = await res.json()

    if (!res.ok || !routeData.trips?.[0]) {
      throw new Error(routeData?.message || 'Unable to optimize trip')
    }

    const optimizedStops = (routeData.waypoints ?? [])
      .filter((waypoint: any) => waypoint.waypoint_index > 0)
      .sort((a: any, b: any) => a.waypoint_index - b.waypoint_index)
      .map((waypoint: any) => ({
        lng: waypoint.location[0],
        lat: waypoint.location[1]
      }))

    return {
      distance: routeData.trips[0].distance,
      duration: routeData.trips[0].duration,
      optimizedStops
    }
  }

  const findNearestDriver = async () => {
    const { data: drivers } = await supabase
      .from('drivers')
      .select('*')
      .eq('is_available', true)

    if (!drivers || drivers.length === 0) {
      return null
    }

    let nearestDriver = null
    let shortestDistance = Infinity

    for (const driver of drivers) {
      const routeUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${driver.current_lng},${driver.current_lat};${pickupLng},${pickupLat}?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`

      const res = await fetch(routeUrl)
      const routeData = await res.json()

      const distance = routeData.routes[0].distance

      if (distance < shortestDistance) {
        shortestDistance = distance
        nearestDriver = driver
      }
    }

    return nearestDriver
  }

  const payForRide = async () => {
    if (!price || !userData) return

    const response = await fetch(
      'https://ihjazjbwkhhaujoxdpss.functions.supabase.co/create-payment',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: price,
          email: userData.email
        })
      }
    )

    const data = await response.json()

    window.location.href = data.data.authorization_url
  }

  const cancelRide = async () => {
    if (!userData) return

    await supabase
      .from("rides")
      .update({ status: "cancelled" })
      .eq("user_id", userData.id)

    setRideStatus("cancelled")
    setSharedRideId(null)
    arrivalAlertShownRef.current = false
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Request a Ride</h2>

      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "500px",
          border: "2px solid black"
        }}
      ></div>

      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={() => setRideType("private")}
          style={{ background: rideType === "private" ? "black" : "gray", color: "white", marginRight: "5px" }}
        >
          Private
        </button>

        <button
          onClick={() => setRideType("shared")}
          style={{ background: rideType === "shared" ? "black" : "gray", color: "white" }}
        >
          Shared (Save 20%)
        </button>
      </div>

      <button
        onClick={createRideRequest}
        disabled={loading}
        className={`bg-blue-600 text-white px-4 py-2 rounded ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'}`}
      >
        {loading ? 'Processing...' : 'Request Ride'}
      </button>

      <button
        onClick={payForRide}
        className="bg-green-600 text-white px-4 py-2 rounded mt-4"
      >
        Pay Now
      </button>

      <button onClick={cancelRide}>
        Cancel Ride
      </button>

      {rideStatus && (
        <div className="mt-4">
          Ride Status: {rideStatus}
        </div>
      )}

      {price && (
        <p className="mt-4 text-lg font-semibold">
          Estimated Price: ₵{price.toFixed(2)}
        </p>
      )}
    </div>
  )
}

