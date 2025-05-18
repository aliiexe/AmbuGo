"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Roles } from "@/types/globals";
import { useUser } from "@clerk/nextjs";

export default function Register() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<Roles | "">("");
  const [formData, setFormData] = useState({
    // Ambulance fields
    numero_plaque: "",
    nom_conducteur: "",
    capacite: "",

    // Hospital fields
    nom: "",
    adresse: "",
    latitude: "",
    longitude: "",
    capacite_totale: "",
    lits_disponibles: "",
    numero_contact: "",
  });

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as Roles | "");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      role,
      ...formData,
    };

    try {
      const response = await fetch("/api/new-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        router.push("/");
      } else {
        const error = await response.text();
        console.error("Error saving user data:", error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      const userRole = user.publicMetadata?.role as Roles | undefined;
      if (userRole) {
        if (userRole === "ambulance") {
          router.push("/ambulance");
        } else if (userRole === "hopital") {
          router.push("/hopital");
        } else if (userRole === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Complete Your Registration
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Select your role:</label>
          <select
            className="w-full p-2 border rounded"
            value={role}
            onChange={handleRoleChange}
            required
          >
            <option value="">Select a role</option>
            <option value="ambulance">Ambulance</option>
            <option value="hopital">Hospital</option>
          </select>
        </div>

        {role === "ambulance" && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                License Plate Number:
              </label>
              <input
                type="text"
                name="numero_plaque"
                value={formData.numero_plaque}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Driver Name:</label>
              <input
                type="text"
                name="nom_conducteur"
                value={formData.nom_conducteur}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Capacity (patients):
              </label>
              <input
                type="number"
                name="capacite"
                value={formData.capacite}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </>
        )}

        {role === "hopital" && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Hospital Name:</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Address:</label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Latitude:</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Longitude:</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Total Capacity:
              </label>
              <input
                type="number"
                name="capacite_totale"
                value={formData.capacite_totale}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Available Beds:
              </label>
              <input
                type="number"
                name="lits_disponibles"
                value={formData.lits_disponibles}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Contact Number:
              </label>
              <input
                type="text"
                name="numero_contact"
                value={formData.numero_contact}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </>
        )}

        {role && (
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Complete Registration
          </button>
        )}
      </form>
    </div>
  );
}
