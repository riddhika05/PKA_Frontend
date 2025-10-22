"use client";

import React from "react";
import CAT from "../assets/CAT.jpg";
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";
import { useNavigate } from "react-router-dom";
export default function ThreeDCardDemo() {
    const navigate=useNavigate();
    const openChatbot=()=>{
          navigate("/chatbot")
    }
  return (
    <CardContainer className="inter-var">
      <CardBody className="bg-gray-200 relative group/card  dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border  ">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-neutral-600 dark:text-white"
        >
          Hello I am Misty - your Personal Knowledge Assistant !
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-500"
        ></CardItem>
        <CardItem translateZ="100" className="w-full mt-4">
          <img
            src={CAT}
            onClick={openChatbot}
            className="h-90 w-full object-cover rounded-xl group-hover/card:shadow-xl"
            alt="thumbnail" 
          />
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}
