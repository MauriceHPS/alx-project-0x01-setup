import React from "react";
import { UserProps } from "@/interfaces";

const UserCard: React.FC<UserProps> = ({
  id,
  name,
  username,
  email,
  address,
  phone,
  website,
  company,
}) => {
  return (
    <>
      <div
        className="max-w-xl mx-auto my-6 p-6 bg-white rounded-lg shadow-lg hover: 
      shadow-xl transition-shadow duration-300"
      >
        <div className="mb-4">
          <h2 className="text-3xl font-semibold text-gray-500">User Profile</h2>
        </div>
        <p className="text-gray-700 font-bold">Profile no. {id}</p>
        <div className="mt-4 flex flex-col justify-between text-2xl text-gray-600">
          <span>ID: {id}</span>
          <span>Name: {name}</span>
          <span>Username: {username}</span>
          <span>Email: {email}</span>
          <span className="font-bold">Address: </span>
          <div className="m-4 flex flex-col font-sm text-gray-800">
            <span>Street: {address.street}</span>
            <span>Suite: {address.suite}</span>
            <span>City: {address.city}</span>
            <span>Zipcode: {address.zipcode}</span>
            <span className="font-bold">Geo: </span>
            <p className="m-4 flex flex-col text-sm text-indigo-500">
              <span>Lat: {address.geo.lat}</span>
              <span>Lng: {address.geo.lng}</span>
            </p>
          </div>
          <span>Phone: {phone}</span>
          <span className="font-bold">Company: </span>
          <span>Website: {website}</span>
          <p className="m-4 flex flex-col text-sm text-indigo-400">
            <span>Name: {company.name}</span>
            <span>catchPhrase: {company.catchPhrase}</span>
            <span>bs: {company.bs}</span>
          </p>
        </div>
      </div>
    </>
  );
};

export default UserCard;
