
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  BrainCircuit
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    end: true
  },
  {
    title: "Avaliar imóvel",
    path: "/avaliar",
    icon: ClipboardList
  },
  {
    title: "Treinamento",
    path: "/treinamento",
    icon: BrainCircuit
  }
];

function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-xl font-bold tracking-tight">
          ImobPredict
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          ImobPredict · Sistema de avaliação imobiliária
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
