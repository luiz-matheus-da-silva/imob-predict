/**
 * Cabeçalho padrão das páginas.
 *
 * Cada página tem um único <h1>; títulos de cards e seções usam
 * níveis menores. Mantém o mesmo tamanho, peso e espaçamento em todas as telas.
 */
function PageHeader({ title, description, actions }) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                    {title}
                </h1>

                {description && (
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex shrink-0 flex-wrap gap-2">
                    {actions}
                </div>
            )}
        </header>
    );
}

export default PageHeader;
