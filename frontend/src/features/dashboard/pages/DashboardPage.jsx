
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";

import {
    Building2,
    TrendingUp,
    DollarSign,
    ChartNoAxesCombined
} from "lucide-react";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const properties = [
    { neighborhood: "Centro", price: 520000 },
    { neighborhood: "Jardim", price: 380000 },
    { neighborhood: "Gleba", price: 750000 },
    { neighborhood: "Aurora", price: 460000 },
    { neighborhood: "Palhano", price: 890000 },
    { neighborhood: "Bandeirantes", price: 310000 }
];

const recentEvaluations = [
    {
        id: 1,
        name: "Apartamento no Centro",
        date: "23/11/2026",
        price: 520000
    },
    {
        id: 2,
        name: "Casa no Jardim Aurora",
        date: "22/11/2026",
        price: 460000
    },
    {
        id: 3,
        name: "Apartamento na Gleba Palhano",
        date: "21/11/2026",
        price: 750000
    }
];

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
});

function StatCard({ title, value, description, icon: Icon }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>

                <Icon size={19} className="text-muted-foreground" />
            </CardHeader>

            <CardContent>
                <div className="text-2xl font-bold">
                    {value}
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

function DashboardPage() {
    return (
        <div className="space-y-8">

            {/* Título */}
            <section>
                <h2 className="text-2xl font-bold tracking-tight">
                    Dashboard
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    Visão geral das avaliações imobiliárias.
                </p>
            </section>

            {/* Indicadores */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <StatCard
                    title="Imóveis analisados"
                    value="300"
                    description="Registros disponíveis no dataset"
                    icon={Building2}
                />

                <StatCard
                    title="Preço médio estimado"
                    value={currency.format(552000)}
                    description="Média demonstrativa"
                    icon={DollarSign}
                />

                <StatCard
                    title="Maior preço estimado"
                    value={currency.format(890000)}
                    description="Maior valor da amostra"
                    icon={TrendingUp}
                />

                <StatCard
                    title="Avaliações recentes"
                    value="3"
                    description="Demonstração de avaliações"
                    icon={ChartNoAxesCombined}
                />

            </section>

            {/* Gráfico */}
            <section>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Distribuição de preços
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            Valores demonstrativos por região.
                        </p>
                    </CardHeader>

                    <CardContent>
                        <div className="h-[320px] w-full">

                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={properties}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: 10,
                                        bottom: 10
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="neighborhood"
                                        tickLine={false}
                                        axisLine={false}
                                        fontSize={12}
                                    />

                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        fontSize={12}
                                        tickFormatter={(value) =>
                                            `R$ ${(value / 1000).toFixed(0)}k`
                                        }
                                    />

                                    <Tooltip
                                        formatter={(value) => [
                                            currency.format(value),
                                            "Preço"
                                        ]}
                                    />

                                    <Bar
                                        dataKey="price"
                                        fill="var(--chart-1)"
                                        radius={[5, 5, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>

                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Avaliações recentes */}
            <section>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Avaliações recentes
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            Últimos imóveis avaliados.
                        </p>
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-4">

                            {recentEvaluations.map((evaluation) => (
                                <div
                                    key={evaluation.id}
                                    className="flex flex-col justify-between gap-2 border-b pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {evaluation.name}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            {evaluation.date}
                                        </p>
                                    </div>

                                    <p className="text-sm font-semibold">
                                        {currency.format(evaluation.price)}
                                    </p>
                                </div>
                            ))}

                        </div>
                    </CardContent>
                </Card>
            </section>

        </div>
    );
}

export default DashboardPage;
