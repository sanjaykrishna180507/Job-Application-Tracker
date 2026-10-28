import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import AppForm from "./pages/AppForm";
import Details from "./pages/Details";

export default function App() {
  return (
    <>
      <header className="navbar">
        <Link to="/" className="brand">📋 Job Tracker</Link>
        <Link to="/add" className="btn light">+ Add Application</Link>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AppForm />} />
          <Route path="/edit/:id" element={<AppForm />} />
          <Route path="/application/:id" element={<Details />} />
        </Routes>
      </main>
    </>
  );
}
