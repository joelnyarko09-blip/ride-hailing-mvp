import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Splash from "./pages/Splash"
import Landing from "./pages/Landing"
import PassengerDashboard from "./pages/PassengerDashboard"
import DriverDashboard from "./pages/DriverDashboard"
import AdminPortal from "./pages/AdminPortal"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/passenger" element={<PassengerDashboard />} />
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/admin" element={<AdminPortal />} />
      </Routes>
    </Router>
  )
}

export default App
