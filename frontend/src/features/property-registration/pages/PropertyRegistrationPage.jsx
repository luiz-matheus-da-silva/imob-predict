import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
    Calculator,
    CircleAlert,
    CheckCircle2,
    House,
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    SearchX,
    Trash2,
    TriangleAlert,
    Ellipsis,
    X
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import SortableHead from "@/components/shared/SortableHead";
import TablePagination from "@/components/shared/TablePagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { usePagination } from "@/hooks/usePagination";
import { useSort } from "@/hooks/useSort";
import { formatRelative } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

import { getEvaluations } from "@/services/evaluations/evaluation.service";
import {
    createProperty,
    deleteProperty,
    getProperties,
    updateProperty
} from "@/services/properties/property.service";

// Categorias iguais às do dataset usado no treinamento.
const NEIGHBORHOODS = [
    "Centro",
    "Jardim América",
    "Jardim Europa",
    "Parque das Flores",
    "Santa Clara",
    "Vila Nova"
];

const CONDITIONS = [
    "Novo",
    "Bom",
    "Regular",
    "Precisa de reforma"
];

const emptyForm = {
    area: "",
    bedrooms: "",
    bathrooms: "",
    age: "",
    parkingSpaces: "",
    neighborhood: "",
    condition: "",
    hasPool: false
};

function toFormData(property) {
    if (!property) return emptyForm;

    return {
        area: String(Number(property.area)),
        bedrooms: String(property.bedrooms),
        bathrooms: String(property.bathrooms),
        age: String(property.age),
        parkingSpaces: String(property.parkingSpaces),
        neighborhood: property.neighborhood,
        condition: property.condition,
        hasPool: property.hasPool
    };
}

const PAGE_SIZE = 10;

// Valor de cada coluna usado na ordenação.
const PROPERTY_SORT = {
    id: (property) => Number(property.id),
    neighborhood: (property) => property.neighborhood,
    area: (property) => Number(property.area),
    bedrooms: (property) => property.bedrooms,
    bathrooms: (property) => property.bathrooms,
    parkingSpaces: (property) => property.parkingSpaces,
    age: (property) => property.age,
    condition: (property) => property.condition,
    hasPool: (property) => Number(property.hasPool),
    lastEstimate: (property) => property.lastEstimate,
    createdAt: (property) => new Date(property.createdAt).getTime()
};

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
});

function formatDate(value) {
    return value ? new Date(value).toLocaleString("pt-BR") : "-";
}

// =====================================================
// FORMULÁRIO (CRIAR E EDITAR)
// =====================================================

function NumberField({ id, label, placeholder, min, step, value, onChange }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>

            <Input
                id={id}
                type="number"
                min={min}
                step={step}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required
            />
        </div>
    );
}

// Entrada em cascata dos blocos do formulário.
function Reveal({ index, children }) {
    return (
        <div
            className="animate-in fade-in slide-in-from-right-4 fill-mode-both duration-500"
            style={{ animationDelay: `${120 + index * 80}ms` }}
        >
            {children}
        </div>
    );
}

function FormSection({ title, children }) {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
            </h3>

            {children}
        </div>
    );
}

function PropertyForm({ property, onSuccess, onCancel }) {
    const isEditing = Boolean(property);

    const [formData, setFormData] = useState(() => toFormData(property));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    function handleChange(field, value) {
        setFormData((previous) => ({ ...previous, [field]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        // Os selects não participam da validação nativa do navegador.
        if (!formData.neighborhood || !formData.condition) {
            setError("Selecione o bairro e a conservação do imóvel.");
            return;
        }

        setIsSaving(true);

        const payload = {
            area: Number(formData.area),
            bedrooms: Number(formData.bedrooms),
            bathrooms: Number(formData.bathrooms),
            age: Number(formData.age),
            parkingSpaces: Number(formData.parkingSpaces),
            neighborhood: formData.neighborhood,
            condition: formData.condition,
            hasPool: formData.hasPool
        };

        try {
            const saved = isEditing
                ? await updateProperty(property.id, payload)
                : await createProperty(payload);

            onSuccess(saved, isEditing ? "updated" : "created");
        } catch (saveError) {
            setError(saveError.message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
        >
            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">

                <Reveal index={0}>
                    <FormSection title="Dimensões">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <NumberField
                                id="area"
                                label="Área (m²)"
                                placeholder="Ex.: 120"
                                min="1"
                                step="any"
                                value={formData.area}
                                onChange={(value) => handleChange("area", value)}
                            />

                            <NumberField
                                id="age"
                                label="Idade (anos)"
                                placeholder="Ex.: 5"
                                min="0"
                                step="1"
                                value={formData.age}
                                onChange={(value) => handleChange("age", value)}
                            />

                            <NumberField
                                id="bedrooms"
                                label="Quartos"
                                placeholder="Ex.: 3"
                                min="0"
                                step="1"
                                value={formData.bedrooms}
                                onChange={(value) => handleChange("bedrooms", value)}
                            />

                            <NumberField
                                id="bathrooms"
                                label="Banheiros"
                                placeholder="Ex.: 2"
                                min="0"
                                step="1"
                                value={formData.bathrooms}
                                onChange={(value) => handleChange("bathrooms", value)}
                            />

                            <NumberField
                                id="parkingSpaces"
                                label="Vagas de garagem"
                                placeholder="Ex.: 2"
                                min="0"
                                step="1"
                                value={formData.parkingSpaces}
                                onChange={(value) =>
                                    handleChange("parkingSpaces", value)
                                }
                            />
                        </div>
                    </FormSection>
                </Reveal>

                <Reveal index={1}>
                    <FormSection title="Localização e estado">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Bairro</Label>

                                <Select
                                    value={formData.neighborhood}
                                    onValueChange={(value) =>
                                        handleChange("neighborhood", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o bairro" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {NEIGHBORHOODS.map((item) => (
                                            <SelectItem key={item} value={item}>
                                                {item}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Conservação</Label>

                                <Select
                                    value={formData.condition}
                                    onValueChange={(value) =>
                                        handleChange("condition", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o estado de conservação" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {CONDITIONS.map((item) => (
                                            <SelectItem key={item} value={item}>
                                                {item}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </FormSection>
                </Reveal>

                <Reveal index={2}>
                    <FormSection title="Comodidades">
                        <div className="flex items-center gap-3 rounded-lg border p-4 transition-colors has-[[data-checked]]:border-primary/50 has-[[data-checked]]:bg-primary/5">
                            <Checkbox
                                id="hasPool"
                                checked={formData.hasPool}
                                onCheckedChange={(checked) =>
                                    handleChange("hasPool", checked === true)
                                }
                            />

                            <div>
                                <Label htmlFor="hasPool">Possui piscina?</Label>

                                <p className="text-xs text-muted-foreground">
                                    Marque se o imóvel possui piscina.
                                </p>
                            </div>
                        </div>
                    </FormSection>
                </Reveal>

                {error && (
                    <div
                        role="alert"
                        className="flex items-center gap-2 rounded-lg border border-destructive/40 p-3 text-sm text-destructive"
                    >
                        <CircleAlert className="size-4 shrink-0" />
                        {error}
                    </div>
                )}

            </div>

            <SheetFooter className="flex-col-reverse border-t bg-background/80 backdrop-blur sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSaving}
                >
                    Cancelar
                </Button>

                <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <LoaderCircle className="size-4 animate-spin" />
                            Salvando...
                        </>
                    ) : isEditing ? (
                        <>
                            <CheckCircle2 className="size-4" />
                            Salvar alterações
                        </>
                    ) : (
                        <>
                            <Plus className="size-4" />
                            Cadastrar imóvel
                        </>
                    )}
                </Button>
            </SheetFooter>
        </form>
    );
}

// =====================================================
// CONFIRMAÇÃO DE EXCLUSÃO
// =====================================================

function DeletePropertyDialog({ property, onClose, onDeleted }) {
    // O foco inicial fica em "Cancelar": confirmar exige uma ação deliberada.
    const cancelRef = useRef(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    async function handleDelete() {
        setIsDeleting(true);
        setError("");

        try {
            await deleteProperty(property.id);
            onDeleted(property);
        } catch (deleteError) {
            setError(deleteError.message);
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <Dialog
            open={Boolean(property)}
            onOpenChange={(open) => {
                if (!open && !isDeleting) onClose();
            }}
        >
            <DialogContent initialFocus={cancelRef}>
                <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <TriangleAlert className="size-5" />
                    </div>

                    <DialogHeader className="pt-0.5">
                        <DialogTitle>Excluir imóvel #{property?.id}?</DialogTitle>

                        <DialogDescription>
                            O cadastro será removido permanentemente. Esta ação
                            não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {property && (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border bg-muted/50 p-4 text-sm">
                        <div className="col-span-2">
                            <dt className="text-xs text-muted-foreground">Bairro</dt>
                            <dd className="font-medium">{property.neighborhood}</dd>
                        </div>

                        <div>
                            <dt className="text-xs text-muted-foreground">Área</dt>
                            <dd className="font-medium">{Number(property.area)} m²</dd>
                        </div>

                        <div>
                            <dt className="text-xs text-muted-foreground">Conservação</dt>
                            <dd className="font-medium">{property.condition}</dd>
                        </div>

                        <div>
                            <dt className="text-xs text-muted-foreground">Quartos · Banheiros</dt>
                            <dd className="font-medium">
                                {property.bedrooms} · {property.bathrooms}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs text-muted-foreground">Vagas</dt>
                            <dd className="font-medium">{property.parkingSpaces}</dd>
                        </div>
                    </dl>
                )}

                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-2 rounded-lg border border-destructive/40 p-3 text-sm text-destructive"
                    >
                        <CircleAlert className="mt-0.5 size-4 shrink-0" />
                        {error}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        ref={cancelRef}
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <LoaderCircle className="size-4 animate-spin" />
                                Excluindo...
                            </>
                        ) : (
                            <>
                                <Trash2 className="size-4" />
                                Excluir
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// =====================================================
// LISTA DE IMÓVEIS CADASTRADOS
// =====================================================

function PropertyList({
    properties,
    latestEstimates,
    totalCount,
    isLoading,
    error,
    search,
    onSearchChange,
    onRetry,
    onEdit,
    onDelete
}) {
    const isFiltering = search.trim() !== "";

    // A última estimativa entra na linha para poder ser ordenada.
    const rows = useMemo(
        () =>
            properties.map((property) => ({
                ...property,
                lastEstimate:
                    latestEstimates.get(String(property.id))?.predictedPrice ?? null
            })),
        [properties, latestEstimates]
    );

    const { sorted, sort, toggle } = useSort(rows, PROPERTY_SORT);
    const pagination = usePagination(sorted, PAGE_SIZE);
    const { setPage } = pagination;

    // Nova busca ou nova ordenação voltam para a primeira página.
    useEffect(() => {
        setPage(1);
    }, [search, sort, setPage]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1.5">
                        <CardTitle>Imóveis cadastrados</CardTitle>
                        <CardDescription>
                            {isFiltering
                                ? `${properties.length} de ${totalCount} imóveis`
                                : `${totalCount} ${totalCount === 1 ? "imóvel" : "imóveis"} no banco de dados.`}
                        </CardDescription>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search
                            size={16}
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                        />

                        <Input
                            type="search"
                            aria-label="Buscar imóveis"
                            placeholder="Buscar por bairro, estado ou ID"
                            className="pr-9 pl-9"
                            value={search}
                            onChange={(event) => onSearchChange(event.target.value)}
                        />

                        {isFiltering && (
                            <button
                                type="button"
                                aria-label="Limpar busca"
                                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                                onClick={() => onSearchChange("")}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <TableSkeleton rows={5} columns={8} label="Carregando imóveis" />
                ) : error ? (
                    <div className="py-10 text-center">
                        <p className="text-sm text-destructive">{error}</p>

                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={onRetry}
                        >
                            Tentar novamente
                        </Button>
                    </div>
                ) : totalCount === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                            <House className="size-6 text-muted-foreground" />
                        </div>

                        <p className="font-medium">Nenhum imóvel cadastrado</p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Use o botão "Novo imóvel" para cadastrar o primeiro.
                        </p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                        <SearchX className="mb-3 size-8 text-muted-foreground" />

                        <p className="font-medium">Nenhum resultado</p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Nenhum imóvel corresponde a "{search.trim()}".
                        </p>

                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => onSearchChange("")}
                        >
                            Limpar busca
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                    <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHead label="ID" sortKey="id" sort={sort} onSort={toggle} />
                                <SortableHead label="Bairro" sortKey="neighborhood" sort={sort} onSort={toggle} />
                                <SortableHead label="Área" sortKey="area" sort={sort} onSort={toggle} />
                                <SortableHead label="Quartos" sortKey="bedrooms" sort={sort} onSort={toggle} />
                                <SortableHead label="Banheiros" sortKey="bathrooms" sort={sort} onSort={toggle} />
                                <SortableHead label="Vagas" sortKey="parkingSpaces" sort={sort} onSort={toggle} />
                                <SortableHead label="Idade" sortKey="age" sort={sort} onSort={toggle} />
                                <SortableHead label="Conservação" sortKey="condition" sort={sort} onSort={toggle} />
                                <SortableHead label="Piscina" sortKey="hasPool" sort={sort} onSort={toggle} />
                                <SortableHead label="Última estimativa" sortKey="lastEstimate" sort={sort} onSort={toggle} />
                                <SortableHead label="Cadastro" sortKey="createdAt" sort={sort} onSort={toggle} />
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {pagination.pageItems.map((property) => (
                                <TableRow key={property.id}>
                                    <TableCell className="font-medium">
                                        #{property.id}
                                    </TableCell>
                                    <TableCell>{property.neighborhood}</TableCell>
                                    <TableCell>{Number(property.area)} m²</TableCell>
                                    <TableCell>{property.bedrooms}</TableCell>
                                    <TableCell>{property.bathrooms}</TableCell>
                                    <TableCell>{property.parkingSpaces}</TableCell>
                                    <TableCell>{property.age} anos</TableCell>
                                    <TableCell>{property.condition}</TableCell>
                                    <TableCell>
                                        {property.hasPool ? (
                                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                                Sim
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">Não</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {latestEstimates.get(String(property.id)) ? (
                                            <div
                                                title={`Modelo ${latestEstimates.get(String(property.id)).modelVersion} · ${formatDate(latestEstimates.get(String(property.id)).createdAt)}`}
                                            >
                                                <p className="font-medium text-primary">
                                                    {currency.format(latestEstimates.get(String(property.id)).predictedPrice)}
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {formatRelative(latestEstimates.get(String(property.id)).createdAt)}
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">Não avaliado</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {formatDate(property.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                render={<Link to={`/avaliar?imovel=${property.id}`} />}
                                            >
                                                <Calculator className="size-4" />
                                                Avaliar
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    render={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            aria-label={`Mais ações do imóvel ${property.id}`}
                                                        />
                                                    }
                                                >
                                                    <Ellipsis />
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem onClick={() => onEdit(property)}>
                                                        <Pencil />
                                                        Editar
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => onDelete(property)}
                                                    >
                                                        <Trash2 />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>

                    <TablePagination
                        page={pagination.page}
                        pageCount={pagination.pageCount}
                        total={pagination.total}
                        pageSize={pagination.pageSize}
                        onPageChange={pagination.setPage}
                        itemLabel="imóveis"
                    />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// =====================================================
// PÁGINA
// =====================================================

const SUCCESS_MESSAGES = {
    created: (property) => `Imóvel #${property.id} cadastrado com sucesso.`,
    updated: (property) => `Imóvel #${property.id} atualizado com sucesso.`,
    deleted: (property) => `Imóvel #${property.id} excluído.`
};

function PropertyRegistrationPage() {
    const [properties, setProperties] = useState([]);
    const [latestEstimates, setLatestEstimates] = useState(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    // Imóvel em edição; `null` com a sheet aberta significa novo cadastro.
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [propertyToDelete, setPropertyToDelete] = useState(null);

    const [successMessage, setSuccessMessage] = useState("");

    const loadProperties = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");

            // A falha ao buscar avaliações não deve esconder os imóveis.
            const [loadedProperties, evaluations] = await Promise.all([
                getProperties(),
                getEvaluations().catch(() => [])
            ]);

            // A lista vem da mais recente para a mais antiga.
            const latest = new Map();

            for (const evaluation of evaluations) {
                const key = String(evaluation.property.id);

                if (!latest.has(key)) latest.set(key, evaluation);
            }

            setProperties(loadedProperties);
            setLatestEstimates(latest);
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProperties();
    }, [loadProperties]);

    const filteredProperties = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return properties;

        return properties.filter((property) =>
            [
                `#${property.id}`,
                String(property.id),
                property.neighborhood,
                property.condition
            ].some((value) => value.toLowerCase().includes(term))
        );
    }, [properties, search]);

    function openCreate() {
        setSuccessMessage("");
        setEditingProperty(null);
        setIsSheetOpen(true);
    }

    function openEdit(property) {
        setSuccessMessage("");
        setEditingProperty(property);
        setIsSheetOpen(true);
    }

    function handleSaved(property, action) {
        setIsSheetOpen(false);
        setSuccessMessage(SUCCESS_MESSAGES[action](property));
        loadProperties();
    }

    function handleDeleted(property) {
        setPropertyToDelete(null);
        setSuccessMessage(SUCCESS_MESSAGES.deleted(property));
        loadProperties();
    }

    return (
        <div className="space-y-8">

            <PageHeader
                title="Cadastro de imóveis"
                description="Cadastre, edite e exclua imóveis para uso nas avaliações."
                actions={
                    <Button onClick={openCreate}>
                        <Plus className="size-4" />
                        Novo imóvel
                    </Button>
                }
            />

            {successMessage && (
                <div
                    role="status"
                    className="flex items-center gap-2 rounded-lg border border-primary/40 p-3 text-sm text-primary"
                >
                    <CheckCircle2 className="size-4 shrink-0" />

                    <span className="flex-1">{successMessage}</span>

                    <button
                        type="button"
                        aria-label="Fechar mensagem"
                        className="rounded p-1 hover:bg-primary/10"
                        onClick={() => setSuccessMessage("")}
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
                    <SheetHeader className="overflow-hidden border-b bg-gradient-to-br from-primary/15 via-primary/5 to-transparent pr-14">
                        <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                            {editingProperty ? (
                                <Pencil className="size-5" />
                            ) : (
                                <House className="size-5" />
                            )}
                        </div>

                        <SheetTitle className="text-lg font-semibold">
                            {editingProperty
                                ? `Editar imóvel #${editingProperty.id}`
                                : "Novo imóvel"}
                        </SheetTitle>

                        <SheetDescription>
                            {editingProperty
                                ? "Altere as características e salve para atualizar o cadastro."
                                : "Informe as características do imóvel para cadastrá-lo."}
                        </SheetDescription>
                    </SheetHeader>

                    <PropertyForm
                        property={editingProperty}
                        onSuccess={handleSaved}
                        onCancel={() => setIsSheetOpen(false)}
                    />
                </SheetContent>
            </Sheet>

            <DeletePropertyDialog
                key={propertyToDelete?.id ?? "none"}
                property={propertyToDelete}
                onClose={() => setPropertyToDelete(null)}
                onDeleted={handleDeleted}
            />

            <PropertyList
                properties={filteredProperties}
                latestEstimates={latestEstimates}
                totalCount={properties.length}
                isLoading={isLoading}
                error={error}
                search={search}
                onSearchChange={setSearch}
                onRetry={loadProperties}
                onEdit={openEdit}
                onDelete={setPropertyToDelete}
            />

        </div>
    );
}

export default PropertyRegistrationPage;
