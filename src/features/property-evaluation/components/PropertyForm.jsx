
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";
import { LoaderCircle, Calculator } from "lucide-react";

const initialForm = {
    area: "",
    bedrooms: "",
    bathrooms: "",
    age: "",
    parkingSpaces: "",
    neighborhood: "",
    condition: "",
    hasPool: false
};

function PropertyForm({ onEvaluate, isLoading }) {
    const [formData, setFormData] = useState(initialForm);

    function handleChange(field, value) {
        setFormData((previous) => ({
            ...previous,
            [field]: value
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();

        onEvaluate({
            ...formData,
            area: Number(formData.area),
            bedrooms: Number(formData.bedrooms),
            bathrooms: Number(formData.bathrooms),
            age: Number(formData.age),
            parkingSpaces: Number(formData.parkingSpaces)
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Características do imóvel</CardTitle>
                <CardDescription>
                    Informe os dados para realizar a previsão de preço.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid gap-5 sm:grid-cols-2">

                        <div className="space-y-2">
                            <Label htmlFor="area">Área (m²)</Label>
                            <Input
                                id="area"
                                type="number"
                                min="1"
                                placeholder="Ex.: 120"
                                value={formData.area}
                                onChange={(event) =>
                                    handleChange("area", event.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bedrooms">Quartos</Label>
                            <Input
                                id="bedrooms"
                                type="number"
                                min="0"
                                placeholder="Ex.: 3"
                                value={formData.bedrooms}
                                onChange={(event) =>
                                    handleChange("bedrooms", event.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bathrooms">Banheiros</Label>
                            <Input
                                id="bathrooms"
                                type="number"
                                min="0"
                                placeholder="Ex.: 2"
                                value={formData.bathrooms}
                                onChange={(event) =>
                                    handleChange("bathrooms", event.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="age">Idade do imóvel (anos)</Label>
                            <Input
                                id="age"
                                type="number"
                                min="0"
                                placeholder="Ex.: 5"
                                value={formData.age}
                                onChange={(event) =>
                                    handleChange("age", event.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="parkingSpaces">Vagas de garagem</Label>
                            <Input
                                id="parkingSpaces"
                                type="number"
                                min="0"
                                placeholder="Ex.: 2"
                                value={formData.parkingSpaces}
                                onChange={(event) =>
                                    handleChange("parkingSpaces", event.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Bairro</Label>

                            <Select
                                value={formData.neighborhood}
                                onValueChange={(value) =>
                                    handleChange("neighborhood", value)
                                }
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o bairro" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="Centro">Centro</SelectItem>
                                    <SelectItem value="Gleba Palhano">Gleba Palhano</SelectItem>
                                    <SelectItem value="Jardim Aurora">Jardim Aurora</SelectItem>
                                    <SelectItem value="Vila Ipiranga">Vila Ipiranga</SelectItem>
                                    <SelectItem value="Bandeirantes">Bandeirantes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label>Condição do imóvel</Label>

                            <Select
                                value={formData.condition}
                                onValueChange={(value) =>
                                    handleChange("condition", value)
                                }
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a condição" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="Novo">Novo</SelectItem>
                                    <SelectItem value="Bom">Bom</SelectItem>
                                    <SelectItem value="Regular">Regular</SelectItem>
                                    <SelectItem value="Reformado">Reformado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                    </div>

                    <div className="flex items-center gap-3 rounded-lg border p-4">
                        <Checkbox
                            id="hasPool"
                            checked={formData.hasPool}
                            onCheckedChange={(checked) =>
                                handleChange("hasPool", checked === true)
                            }
                        />

                        <div>
                            <Label htmlFor="hasPool">
                                Possui piscina?
                            </Label>

                            <p className="text-xs text-muted-foreground">
                                Informe se o imóvel possui piscina.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <LoaderCircle className="mr-2 size-4 animate-spin" />
                                Analisando imóvel...
                            </>
                        ) : (
                            <>
                                <Calculator className="mr-2 size-4" />
                                Estimar preço do imóvel
                            </>
                        )}
                    </Button>

                </form>
            </CardContent>
        </Card>
    );
}

export default PropertyForm;
