"use client";
import axios from "axios";
import { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  async function onEnter() {
    navigator.geolocation.getCurrentPosition(
      (data) => {
        setLatitude(data.coords.latitude);
        setLongitude(data.coords.longitude);
        console.log(data.coords.latitude, data.coords.longitude);
      },
      (error) => {
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
      }
    );
    if (username && longitude && latitude) {
      const response = await axios.post(`http://localhost:8004/add`, {
        username,
        latitude,
        longitude,
      });
      console.log(response.data);
    }
  }

  return (
    <div className="h-screen w-full flex justify-center items-center">
      <div className="flex flex-col gap-4 items-center justify-center bg-neutral-900 w-lg p-4 rounded-lg">
        <input
          onChange={(e) => {
            setUsername(e.target.value);
          }}
          className="w-full h-14 px-4 bg-black rounded-md text-xl focus:outline-none"
          placeholder="enter your username"
        />
        <button
          onClick={onEnter}
          className="w-full h-14 bg-neutral-200 text-center text-xl rounded-md text-black"
        >
          enter
        </button>
      </div>
    </div>
  );
}
