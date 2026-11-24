import { NavLink } from "react-router-dom";

import GithubIcon from "@/components/shared/GithubIcon";

import {
    LayoutDashboard,
    Calculator,
    History,
    Building2,
    Building,
    BrainCircuit
} from "lucide-react";

// Itens agrupados por contexto de uso.
const navigationGroups = [
    {
        title: "Visão geral",
        items: [
            { title: "Dashboard", path: "/", icon: LayoutDashboard, end: true }
        ]
    },
    {
        title: "Imóveis",
        items: [
            { title: "Cadastro de imóveis", path: "/imoveis", icon: Building },
            { title: "Avaliar imóvel", path: "/avaliar", icon: Calculator }
        ]
    },
    {
        title: "Modelo de IA",
        items: [
            { title: "Treinamento", path: "/treinamento", icon: BrainCircuit },
            { title: "Histórico", path: "/historico", icon: History }
        ]
    }
];

function Sidebar() {
    // Estilo compartilhado para os links de navegação.
    // O React Router identifica automaticamente a rota ativa.
    const getNavLinkClass = ({ isActive }) => {
        return `
            flex items-center gap-3 rounded-lg px-3 py-2.5
            text-sm font-medium transition-colors
            ${
                isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }
        `;
    };

    return (
        <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r bg-sidebar text-sidebar-foreground">

            {/* Identidade visual */}
            <div className="flex h-16 items-center gap-3 border-b px-6">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 size={21} />
                </div>

                <div>
                    <p className="font-heading text-lg font-bold leading-tight tracking-tight">
                        ImobPredict
                    </p>

                    <p className="text-xs text-muted-foreground">
                        Real Estate Intelligence
                    </p>
                </div>
            </div>

            {/* Navegação */}
            <nav
                aria-label="Navegação principal"
                className="flex-1 space-y-6 overflow-y-auto px-4 py-6"
            >
                {navigationGroups.map((group) => (
                    <div key={group.title}>
                        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {group.title}
                        </p>

                        <div className="space-y-1">
                            {group.items.map(({ title, path, icon: Icon, end }) => (
                                <NavLink
                                    key={path}
                                    to={path}
                                    end={end}
                                    className={getNavLinkClass}
                                >
                                    <Icon size={18} />
                                    {title}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Rodapé */}
            <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
                <p className="text-xs leading-snug text-muted-foreground">
                    Desenvolvido por
                    <br />
                    <span className="text-sm font-medium text-foreground">
                        Luiz Matheus
                    </span>
                </p>

                <a
                    href="https://github.com/luiz-matheus-da-silva/imob-predict"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ver o código-fonte no GitHub (abre em nova aba)"
                    title="Código-fonte no GitHub"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <GithubIcon className="size-5" />
                </a>
            </div>

        </aside>
    );
}

export default Sidebar;
