import { useNavigate } from "react-router-dom"
import RoleCard from "../components/RoleCard"

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-6">
      <h1 className="text-white text-3xl mb-8">Continue as</h1>

      <div className="w-full max-w-sm space-y-6">
        <RoleCard
          title="Passenger"
          description="Book and manage rides"
          onClick={() => navigate("/passenger")}
        />

        <RoleCard
          title="Driver"
          description="Accept requests and earn"
          onClick={() => navigate("/driver")}
        />
      </div>
    </div>
  )
}
