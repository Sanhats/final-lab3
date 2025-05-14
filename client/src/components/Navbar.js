"use client"

import { useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

const Navbar = () => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Gestión de Contactos
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/perfil" className="hover:underline">
                {user.nombre} {user.apellido}
              </Link>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="bg-blue-500 hover:bg-blue-700 px-3 py-1 rounded">
                Registrar
              </Link>
              <Link to="/login" className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded">
                Ingresar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
