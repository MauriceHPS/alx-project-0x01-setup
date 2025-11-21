import UserCard from "@/components/common/UserCard";
import Header from "@/components/layout/Header";
import { UserProps } from "@/interfaces";
import React from "react";

const Users: React.FC<UserProps[]> = ({ posts }) => {
  return (
    <>
      <div>
        <Header />
        <main className="p-4">
          <div className="flex justify-between">
            <h1 className="text-3xl font-semibold">User Content</h1>
            <button className="bg-green-200 px-5 py-4 rounded-b-full text-gray-300">
              Add User
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {posts?.map(
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
      </div>
    </>
  );
};

export async function getStaticProps() {
  const response = await fetch("https://jsonplaceholder.typicode.com/users");
  const posts = await response.json();

  return {
    props: {
      posts,
    },
  };
}

export default Users;
