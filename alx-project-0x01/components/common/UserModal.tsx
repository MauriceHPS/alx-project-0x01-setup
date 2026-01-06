import { UserProps, UserModalProps } from "@/interfaces";
import React, { useState } from "react";

const UserModal: React.FC<UserModalProps> = ({ onClose, onSubmit }) => {
  const [user, setUser] = useState<UserProps>({
    id: 1,
    name: "",
    username: "",
    email: "",
    address: {
      street: "",
      suite: "",
      city: "",
      zipcode: "",
      geo: {
        lat: "",
        lng: "",
      },
    },
    phone: "",
    website: "",
    company: {
      name: "",
      catchPhrase: "",
      bs: "",
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(user);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-600/80 bg-opacity-50 flex justify-center items-center backdrop-brightness-50 p-4">
        <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-bold">Add New User</h2>
          </div>
          <form
            onSubmit={handleSubmit}
            className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* ID */}
            <div className="flex flex-col mb-4 ">
              <label htmlFor="ID" className="text-2xl font-bold block mb-4">
                ID
              </label>
              <input
                type="number"
                id="id"
                name="id"
                value={user.id}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                value={user.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
              />
            </div>

            {/* Name */}
            <div className="mb-4"></div>

            {/* USERNAME */}
            <div className="mb-4">
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Username"
                value={user.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-900/30"
              />
            </div>

            {/* EMAIL */}
            <div className="mb-4">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Email Address"
                value={user.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-900/30"
              />
            </div>

            {/* ADDRESS LABEL */}

            <div className="mb-4  flex flex-col">
              <label htmlFor="Address" className="text-2xl font-bold block">
                Address
              </label>

              <input
                type="text"
                id="street"
                name="street"
                placeholder="Street"
                value={user.address.street}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-900/30"
              />
            </div>

            {/* STREET */}
            <div className="mb-4 "></div>
            {/* SUITE */}
            <div className="mb-4">
              <input
                type="text"
                id="suite"
                name="suite"
                placeholder="Suite"
                value={user.address.suite}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
              />
            </div>

            {/* CITY */}
            <div className="mb-4">
              <input
                type="text"
                id="city"
                name="city"
                placeholder="City"
                value={user.address.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
              />
            </div>
            {/* ZIP CODE */}
            <div className="mb-4">
              <input
                type="text"
                id="zipcode"
                name="zipcode"
                placeholder="Zip code"
                value={user.address.zipcode}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
              />
            </div>

            <label htmlFor="Coordinates" className="text-xl font-extrabold">
              Coordinates
            </label>
            {/* LONGITUDE */}

            <div className="mb-4">
              <input
                type="text"
                id="longitude"
                name="longitude"
                placeholder="Longitude"
                value={user.address.geo.lng}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
              />
            </div>
            {/* LATITUDE */}
            <div className="mb-4">
              <input
                type="text"
                id="latitude"
                name="latitude"
                placeholder="Latitude"
                value={user.address.geo.lat}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
              />
            </div>

            {/* PHONE NO */}
            <div className="mb-4">
              <input
                type="text"
                id="phone"
                name="phone"
                placeholder="Phone number"
                value={user.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
              />
            </div>
            {/* WEBSITE */}
            <div className="mb-4">
              <input
                type="text"
                id="website"
                name="website"
                placeholder="Website"
                value={user.website}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
              />
            </div>

            <label htmlFor="companyName" className="text-2xl font-extralight">
              Company Details
            </label>
            {/* COMPANY NAME */}
            <div className="mb-4">
              <input
                type="text"
                id="companyName"
                name="companyName"
                placeholder="Enter the company name"
                value={user.company.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
              />
            </div>

            {/* CATCHPHRASE */}
            <div className="mb-4">
              <input
                type="text"
                id="catchphrase"
                name="catchphrase"
                placeholder="Enter the catchphrase"
                value={user.company.catchPhrase}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
              />
            </div>

            {/* BS */}
            <div className="mb-4">
              <input
                type="text"
                id="bs"
                name="bs"
                placeholder="Enter your bs"
                value={user.company.bs}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-white bg-orange-600/80 rounded-b-lg hover:bg-red-800/70 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-b-lg hover:bg-indigo-800 transition"
              >
                Add User
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UserModal;
