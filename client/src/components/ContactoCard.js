"use client"
import { Link } from "react-router-dom"

const ContactoCard = ({ contacto, isOwner, isAdmin, onTogglePublico, onToggleVisible, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-2">
        {contacto.nombre} {contacto.apellido}
      </h2>

      {contacto.empresa && (
        <p className="text-gray-600 mb-1">
          <span className="font-medium">Empresa:</span> {contacto.empresa}
        </p>
      )}

      {contacto.email && (
        <p className="text-gray-600 mb-1">
          <span className="font-medium">Email:</span> {contacto.email}
        </p>
      )}

      {contacto.telefonos && (
        <p className="text-gray-600 mb-1">
          <span className="font-medium">Teléfono:</span> {contacto.telefonos}
        </p>
      )}

      {contacto.domicilio && (
        <p className="text-gray-600 mb-1">
          <span className="font-medium">Domicilio:</span> {contacto.domicilio}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        {isOwner && (
          <>
            <Link
              to={`/editar-contacto/${contacto._id}`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
            >
              Editar
            </Link>

            <button
              onClick={() => onTogglePublico(contacto._id, contacto.esPublico)}
              className={`${
                contacto.esPublico ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"
              } text-white px-2 py-1 rounded text-sm`}
            >
              {contacto.esPublico ? "Hacer Privado" : "Hacer Público"}
            </button>

            <button
              onClick={() => onDelete(contacto._id)}
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
            >
              Eliminar
            </button>
          </>
        )}

        {isAdmin && contacto.esPublico && (
          <button
            onClick={() => onToggleVisible(contacto._id, contacto.esVisible)}
            className={`${
              contacto.esVisible ? "bg-purple-500 hover:bg-purple-600" : "bg-indigo-500 hover:bg-indigo-600"
            } text-white px-2 py-1 rounded text-sm`}
          >
            {contacto.esVisible ? "Ocultar" : "Mostrar"}
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {contacto.esPublico && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Público</span>}

        {!contacto.esPublico && (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Privado</span>
        )}

        {isAdmin && !contacto.esVisible && contacto.esPublico && (
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Oculto</span>
        )}
      </div>
    </div>
  )
}

export default ContactoCard
