import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    router.replace("./setup/welcome"); // Redirect to Welcome Page
  }, []);

  return null; // Nothing to render
}
