"use client"

import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import ContactoCard from "../components/ContactoCard"

const Home = () => {
  const { user } = useContext(AuthContext)
  const [contactosPublicos, setContactosPublicos] = useState([])
  const [misContactos, setMisContactos] = useState([])
  const [todosContactos, setTodosContactos] = useState([])
  const [activeTab, setActiveTab] = useState("publicos")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContactos = async () => {
      try {
        // Obtener contactos públicos
        const resPublicos = await fetch("http://localhost:5000/contacts/public")
        const dataPublicos = await resPublicos.json()
        setContactosPublicos(dataPublicos)

        // Si el usuario está autenticado, obtener sus contactos
        if (user) {
          const token = localStorage.getItem("token")

          const resMisContactos = await fetch("http://localhost:5000/contacts/mis-contactos", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          const dataMisContactos = await resMisContactos.json()
          setMisContactos(dataMisContactos)

          // Si es admin, obtener todos los contactos
          if (user.isAdmin) {
            const resTodosContactos = await fetch("http://localhost:5000/contacts/all", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            const dataTodosContactos = await resTodosContactos.json()
            setTodosContactos(dataTodosContactos)
          }
        }
      } catch (error) {
        console.error("Error al obtener contactos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContactos()
  }, [user])

  const handleTogglePublico = async (id, esPublico) => {
    try {
      const token = localStorage.getItem("token")

      await fetch(`http://localhost:5000/contacts/${id}/publico`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Actualizar estado local
      setMisContactos(
        misContactos.map((contacto) => (contacto._id === id ? { ...contacto, esPublico: !esPublico } : contacto)),
      )

      if (user.isAdmin) {
        setTodosContactos(
          todosContactos.map((contacto) => (contacto._id === id ? { ...contacto, esPublico: !esPublico } : contacto)),
        )
      }
    } catch (error) {
      console.error("Error al cambiar visibilidad:", error)
    }
  }

  const handleToggleVisible = async (id, esVisible) => {
    try {
      const token = localStorage.getItem("token")

      await fetch(`http://localhost:5000/contacts/${id}/visible`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Actualizar estado local
      setTodosContactos(
        todosContactos.map((contacto) => (contacto._id === id ? { ...contacto, esVisible: !esVisible } : contacto)),
      )
    } catch (error) {
      console.error("Error al cambiar visibilidad:", error)
    }
  }

  const handleDeleteContacto = async (id) => {
    try {
      const token = localStorage.getItem("token")

      await fetch(`http://localhost:5000/contacts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Actualizar estado local
      setMisContactos(misContactos.filter((contacto) => contacto._id !== id))

      if (user.isAdmin) {
        setTodosContactos(todosContactos.filter((contacto) => contacto._id !== id))
      }
    } catch (error) {
      console.error("Error al eliminar contacto:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Contactos</h1>
        {user && (
          <Link to="/nuevo-contacto" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Nuevo Contacto
          </Link>
        )}
      </div>

      {user && (
        <div className="mb-6">
          <div className="flex border-b">
            <button
              className={`px-4 py-2 ${activeTab === "publicos" ? "border-b-2 border-blue-500 font-medium" : ""}`}
              onClick={() => setActiveTab("publicos")}
            >
              Contactos Públicos
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "mis-contactos" ? "border-b-2 border-blue-500 font-medium" : ""}`}
              onClick={() => setActiveTab("mis-contactos")}
            >
              Mis Contactos
            </button>
            {user.isAdmin && (
              <button
                className={`px-4 py-2 ${activeTab === "todos" ? "border-b-2 border-blue-500 font-medium" : ""}`}
                onClick={() => setActiveTab("todos")}
              >
                Todos los Contactos
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === "publicos" &&
          (contactosPublicos.length > 0 ? (
            contactosPublicos.map((contacto) => (
              <ContactoCard
                key={contacto._id}
                contacto={contacto}
                isOwner={user && contacto.propietario === user.id}
                isAdmin={user && user.isAdmin}
                onTogglePublico={handleTogglePublico}
                onToggleVisible={handleToggleVisible}
                onDelete={handleDeleteContacto}
              />
            ))
          ) : (
            <p className="col-span-3 text-center py-10">No hay contactos públicos disponibles.</p>
          ))}

        {activeTab === "mis-contactos" &&
          (misContactos.length > 0 ? (
            misContactos.map((contacto) => (
              <ContactoCard
                key={contacto._id}
                contacto={contacto}
                isOwner={true}
                isAdmin={user.isAdmin}
                onTogglePublico={handleTogglePublico}
                onToggleVisible={handleToggleVisible}
                onDelete={handleDeleteContacto}
              />
            ))
          ) : (
            <p className="col-span-3 text-center py-10">No tienes contactos. ¡Crea uno nuevo!</p>
          ))}

        {activeTab === "todos" &&
          user && user.isAdmin &&
          (todosContactos.length > 0 ? (
            todosContactos.map((contacto) => (
              <ContactoCard
                key={contacto._id}
                contacto={contacto}
                isOwner={contacto.propietario === user.id}
                isAdmin={true}
                onTogglePublico={handleTogglePublico}
                onToggleVisible={handleToggleVisible}
                onDelete={handleDeleteContacto}
              />
            ))
          ) : (
            <p className="col-span-3 text-center py-10">No hay contactos disponibles.</p>
          ))}
      </div>
    </div>
  )
}

export default Home
