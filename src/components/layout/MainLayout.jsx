
import Sidebar from "./Sidebar";
import Header from "./Header";

function MainLayout({ children }) {
    return (
        <div className="min-h-screen bg-background">

            <Sidebar />

            <div className="md:pl-64">

                <Header />

                <main className="p-6 lg:p-8">
                    {children}
                </main>

            </div>
        </div>
    );
}

export default MainLayout;
