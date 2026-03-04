import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/landing")
    }, 1500)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="h-screen flex items-center justify-center bg-[#1f7db3]">
      <h1 className="text-white text-5xl font-bold">Dröp</h1>
    </div>
  )
}
