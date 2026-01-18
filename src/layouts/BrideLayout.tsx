import { Outlet } from "react-router-dom";

export default function BrideLayout() {
    return (
        <div className="min-h-screen bg-white text-black font-serif selection:bg-black selection:text-white">
            {/* Bridal Noir Theme: Clean, White background, Serif Black Text, Minimalist */}

            {/* Header */}
            <header className="py-8 text-center border-b border-gray-100">
                <h1 className="text-3xl tracking-[0.2em] font-light uppercase">L U M I &nbsp; B R I D E</h1>
            </header>

            <main className="w-full">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="py-12 text-center text-xs text-gray-400 font-sans tracking-widest uppercase">
                <p>© {new Date().getFullYear()} Lumi Hub. All rights reserved.</p>
            </footer>
        </div>
    );
}
