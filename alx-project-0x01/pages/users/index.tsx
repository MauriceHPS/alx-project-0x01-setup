import UserCard from "@/components/common/UserCard";
import UserModal from "@/components/common/UserModal";
import Header from "@/components/layout/Header";
import { UserData, UserProps } from "@/interfaces";
import React, { useState } from "react";

const Users: React.FC<UserProps[]> = ({ userData }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const handleAddUser = (newUser: UserData) => {
    setUser({ ...newUser, id: userData.length + 1 });
  };

  return (
    <>
      <div className="flex flex-col h-screen">
        <Header />
        <main className="p-4">
          <div className="flex justify-between">
            <h1 className="flex text-center text-2xl font-semibold">
              Users Content
            </h1>

            <button
              onClick={() => setModalOpen(true)}
              className="bg-blue-700 px-4 py-2 rounded-full text-white"
            >
              Add User
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {userData?.map(
              (
                {
                  id,
                  name,
                  username,
                  email,
                  address,
                  phone,
                  website,
                  company,
                }: UserProps,
                key: number
              ) => (
                <UserCard
                  id={id}
                  name={name}
                  username={username}
                  email={email}
                  address={address}
                  phone={phone}
                  website={website}
                  company={company}
                  key={key}
                />
              )
            )}
          </div>
        </main>
        {isModalOpen && (
          <UserModal
            onClose={() => setModalOpen(false)}
            onSubmit={handleAddUser}
          />
        )}
      </div>
    </>
  );
};

export async function getStaticProps() {
  const response = await fetch("https://jsonplaceholder.typicode.com/users");
  const userData = await response.json();

  return {
    props: {
      userData,
    },
  };
}

export default Users;
