import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const MarketingLayout = () => {
    return (
        <div className="min-h-screen bg-[#050505] selection:bg-[#00e5ff]/30 selection:text-[#00e5ff]">
            <Header />
            <Outlet />
            <Footer />
        </div>
    );
};

export default MarketingLayout;
