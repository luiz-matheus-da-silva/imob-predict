
import {
    LayoutDashboard,
    House,
    History,
    Settings,
    Building2
} from "lucide-react";

function Sidebar() {
    return (
        <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r bg-sidebar text-sidebar-foreground">

            {/* Identidade visual */}
            <div className="flex h-16 items-center gap-3 border-b px-6">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 size={21} />
                </div>

                <div>
                    <h1 className="text-lg font-bold tracking-tight">
                        ImobPredict
                    </h1>

                    <p className="text-xs text-muted-foreground">
                        Real Estate Intelligence
                    </p>
                </div>
            </div>

            {/* Navegação */}
            <div className="flex-1 px-4 py-6">
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Principal
                </p>

                <nav className="space-y-1">

                    <a
                        href="/"
                        className="flex items-center gap-3 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                        <LayoutDashboard size={18} />
                        Dashboard
                    </a>

                    <a
                        href="/avaliar"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                        <House size={18} />
                        Avaliar imóvel
                    </a>

                    <a
                        href="/historico"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                        <History size={18} />
                        Histórico
                    </a>
                </nav>
            </div>

            {/* Rodapé */}
            <div className="border-t p-4">
                <div className="flex items-center gap-3 rounded-lg p-2">
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                        <Settings size={18} />
                    </div>

                    <div>
                        <p className="text-sm font-medium">
                            ImobPredict
                        </p>

                        <p className="text-xs text-muted-foreground">
                            Sistema de previsão
                        </p>
                    </div>
                </div>
            </div>

        </aside>
    );
}

export default Sidebar;
