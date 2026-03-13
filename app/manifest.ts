import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LoginBook",
    short_name: "LoginBook",
    description: "Digital logbook with offline entry queue",
    start_url: "/logbooks",
    display: "standalone",
    background_color: "#f3efe6",
    theme_color: "#0e5c51",
    icons: []
  };
}
