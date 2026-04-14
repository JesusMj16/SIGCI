'use server'
import {redirect} from "next/navigation";
import Image from "next/image";
import { auth } from "../auth";


export default async function Home() {
  redirect("/(dashboard)");
}
