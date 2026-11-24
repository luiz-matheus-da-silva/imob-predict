/**
 * Ícone em um quadrado com a cor primária suave.
 * Usado ao lado dos títulos de cards para reforçar a hierarquia.
 */
function IconChip({ icon: Icon }) {
    return (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
        </span>
    );
}

export default IconChip;
