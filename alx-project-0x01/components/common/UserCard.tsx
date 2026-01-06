import { UserProps } from "@/interfaces";
import React from "react";

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
      <div className="max-w-xl mx-auto my-6 p-6 bg-amber-50 rounded-lg shadow-lg hover: shadow-xl transition-shadow duration-300">
        <div className="mb-4">
          <h2 className=" text-2xl font-semibold text-gray-800">User #{id}</h2>
        </div>

        <div className="mt-4 flex flex-col gap-1 justify-between text-gray-950/65">
          <span>ID: {id}</span>
          <span>Name: {name}</span>
          <span>Username: {username}</span>
          <span>
            <strong>Email:</strong> {email}
          </span>

          <span>Street: {address.street}</span>
          <span>Suite: {address.suite}</span>
          <span>City: {address.city}</span>
          <span>Zip Code: {address.zipcode}</span>

          <span>Phone: {phone}</span>

          <span>Latitude: {address.geo.lat}</span>
          <span>Longitude: {address.geo.lng}</span>

          <span>Website: {website}</span>

          <span>Name: {company.name}</span>
          <span>Catch Phrase: {company.catchPhrase}</span>
          <span>BS: {company.bs}</span>
        </div>
      </div>
    </>
  );
};

function Field({ label, value }) {
  return (
    <span className="block">
      <span className="font-bold">{label}:</span> {value}
    </span>
  );
}

export default UserCard;
