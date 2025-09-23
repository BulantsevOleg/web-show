import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "../../data/AdminContext";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { token } = useAdmin();
  const loc = useLocation();
  if (!token) {
    return <Navigate to="/admin" replace state={{ from: loc }} />;
  }
  return <>{children}</>;
}

// import React from "react";
// import { Navigate, useLocation } from "react-router-dom";
// import { useAdmin } from "../../data/AdminContext";

// export default function RequireAdmin({ children }: { children: React.ReactNode }) {
//   const { token } = useAdmin();
//   const loc = useLocation();

//   if (!token) {
//     // Неавторизован — отправляем НА ГЛАВНУЮ
//     return <Navigate to="/" replace state={{ from: loc }} />;
//   }
//   return <>{children}</>;
// }

// // // import React from "react";
// // // import { Navigate, useLocation } from "react-router-dom";
// // // import { useAdmin } from "../../data/AdminContext";

// // // export function RequireAdmin({ children }: { children: React.ReactNode }) {
// // //   const { token } = useAdmin();
// // //   const loc = useLocation();
// // //   if (!token) {
// // //     // вместо сообщения — мгновенный редирект на страницу логина
// // //     return <Navigate to="/admin" replace state={{ from: loc }} />;
// // //   }
// // //   return <>{children}</>;
// // // }

// // import React from "react";
// // import { Navigate, useLocation } from "react-router-dom";
// // import { useAdmin } from "../../data/AdminContext";

// // export default function RequireAdmin({ children }: { children: React.ReactNode }) {
// //   const { token } = useAdmin();
// //   const loc = useLocation();

// //   if (!token) {
// //     // раньше было: return <Navigate to="/admin" replace state={{ from: loc }} />
// //     return <Navigate to="/" replace state={{ from: loc }} />;
// //   }
// //   return <>{children}</>;
// // }