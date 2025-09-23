import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  define: {
    "import.meta.env.VITE_BUCKET_BASE": JSON.stringify(process.env.VITE_BUCKET_BASE),
    "import.meta.env.VITE_SIGN_URL": JSON.stringify(process.env.VITE_SIGN_URL),
    "import.meta.env.VITE_COMMIT_URL": JSON.stringify(process.env.VITE_COMMIT_URL),
    "import.meta.env.VITE_ADMIN_PASSWORD": JSON.stringify(process.env.VITE_ADMIN_PASSWORD),
  },  
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") }
  }
});



// vite.config.ts
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   base: "./",           // для preview и хостинга в бакете
//   plugins: [react()],
// });

