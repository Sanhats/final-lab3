import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import NuevoContacto from "./pages/NuevoContacto"
import EditarContacto from "./pages/EditarContacto"
import EditarPerfil from "./pages/EditarPerfil"
import { AuthProvider } from "./context/AuthContext"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/nuevo-contacto"
                element={
                  <ProtectedRoute>
                    <NuevoContacto />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editar-contacto/:id"
                element={
                  <ProtectedRoute>
                    <EditarContacto />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <EditarPerfil />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  )
}

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token")

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default App
