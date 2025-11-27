import { UserData, UserModalProps, Address } from "@/interfaces";
import React, { useState } from "react";

const UserModal: React.FC<UserModalProps> = ({ onClose, onSubmit }) => {
  const [user, setUser] = useState<UserData>({
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
    company: { name: "", catchPhrase: "", bs: "" },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(user);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
        <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Add New User
          </h2>
          <form onSubmit={handleSubmit}>
            {/* ID */}
            <div className="mb-4">
              <label
                htmlFor="id"
                className="block text-gray-700 font-medium mb-2"
              >
                User ID
              </label>
              <input
                type="text"
                id="id"
                name="id"
                value={user.id}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-gray-700 font-medium mb-2"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={user.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* username */}
            <div>
              <label
                htmlFor="username"
                className="block text-gray-700 font-medium mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={user.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* email */}
            <div>
              <label
                htmlFor="email"
                className="block text-gray-700 font-medium mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* address */}
            <p className="font-bold text-2xl">Address</p>

            {/* street */}
            <div>
              <label
                htmlFor="street"
                className="block text-gray-700 font-medium mb-2"
              >
                Street
              </label>
              <input
                type="text"
                id="street"
                name="street"
                value={user.address.street}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* suite */}
            <div>
              <label
                htmlFor="suite"
                className="block text-gray-700 font-medium mb-2"
              >
                Suite
              </label>
              <input
                type="text"
                id="suite"
                name="suite"
                value={user.address.suite}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* city */}
            <div>
              <label
                htmlFor="city"
                className="block text-gray-700 font-medium mb-2"
              >
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={user.address.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* zipcode */}
            <div>
              <label
                htmlFor="zip"
                className="block text-gray-700 font-medium mb-2"
              >
                Zip Code
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={user.address.zipcode}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Geo */}
            <p className="font-bold text-2xl">Geo</p>

            {/* lat */}
            <div>
              <label
                htmlFor="lat"
                className="block text-gray-700 font-medium mb-2"
              >
                Lat
              </label>
              <input
                type="text"
                id="lat"
                name="lat"
                value={user.address.geo.lat}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* lng */}
            <div>
              <label
                htmlFor="lng"
                className="block text-gray-700 font-medium mb-2"
              >
                Lng
              </label>
              <input
                type="text"
                id="lng"
                name="lng"
                value={user.address.geo.lng}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-gray-700 font-medium mb-2"
              >
                Phone
              </label>
              <input
                type="number"
                id="phone"
                name="phone"
                value={user.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* website */}
            <div>
              <label
                htmlFor="website"
                className="block text-gray-700 font-medium mb-2"
              >
                Website
              </label>
              <input
                type="text"
                id="website"
                name="website"
                value={user.website}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* company */}
            <p className="font-bold text-2xl text-center">Company</p>

            {/* name */}

            <div>
              <label
                htmlFor="companyName"
                className="block text-gray-700 font-medium mb-2"
              >
                Name
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={user.company.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* catchphrase */}
            <div>
              <label
                htmlFor="catchphrase"
                className="block text-gray-700 font-medium mb-2"
              >
                Catchphrase
              </label>
              <input
                type="text"
                id="catchphrase"
                name="catchphrase"
                value={user.company.catchPhrase}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* bs */}
            <div>
              <label
                htmlFor="bs"
                className="block text-gray-700 font-medium mb-2"
              >
                BS
              </label>
              <input
                type="text"
                id="bs"
                name="bs"
                value={user.company.bs}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* buttons */}
            <div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
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
