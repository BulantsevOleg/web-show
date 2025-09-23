import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);


// import React from "react";
// import ReactDOM from "react-dom/client";
// import { BrowserRouter } from "react-router-dom";
// import { RegistryProvider } from "./data/RegistryProvider";
// import App from "./App";

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <RegistryProvider>
//       <BrowserRouter>
//         <App />
//       </BrowserRouter>
//     </RegistryProvider>
//   </React.StrictMode>
// );

// // import React from "react";
// // import ReactDOM from "react-dom/client";
// // import App from "./App";
// // import "./index.css";

// // console.log("[BOOT] main.tsx loaded");

// // ReactDOM.createRoot(document.getElementById("root")!).render(
// //   <React.StrictMode>
// //     <App />
// //   </React.StrictMode>
// // );


// // // import React from "react";
// // // import { createRoot } from "react-dom/client";
// // // import App from "./App";

// // // import "./index.css";

// // // const el = document.getElementById("root");
// // // if (!el) {
// // //   // защита от пустой страницы, если вдруг нет #root
// // //   const fallback = document.createElement("div");
// // //   fallback.id = "root";
// // //   document.body.appendChild(fallback);
// // // }

// // // createRoot(document.getElementById("root")!).render(
// // //   <React.StrictMode>
// // //     <App />
// // //   </React.StrictMode>
// // // );


