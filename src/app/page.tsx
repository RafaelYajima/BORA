"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      router.replace(data.user ? "/dashboard" : "/login");
    });
  }, [router]);
  return <Spinner />;
}
