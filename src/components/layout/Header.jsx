
import { Bell, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function Header() {
    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>ImobPredict</span>
                <span>/</span>
                <span className="font-medium text-foreground">
                    Dashboard
                </span>
            </div>

            <div className="flex items-center gap-4">

                <div className="relative hidden sm:block">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />

                    <Input
                        placeholder="Pesquisar..."
                        className="w-56 pl-9"
                    />
                </div>

                <button
                    type="button"
                    aria-label="Notificações"
                    className="relative rounded-md p-2 text-muted-foreground hover:bg-accent"
                >
                    <Bell size={19} />
                </button>

                <Avatar>
                    <AvatarFallback>IM</AvatarFallback>
                </Avatar>

            </div>
        </header>
    );
}

export default Header;
