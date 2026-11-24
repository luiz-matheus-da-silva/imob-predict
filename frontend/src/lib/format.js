const relativeTime = new Intl.RelativeTimeFormat("pt-BR", {
    numeric: "auto"
});

/**
 * Tempo decorrido em linguagem natural: "há 5 minutos", "ontem"...
 * Mais fácil de ler que uma data completa.
 */
export function formatRelative(value) {
    const seconds = Math.round((new Date(value) - Date.now()) / 1000);
    const abs = Math.abs(seconds);

    if (abs < 60) return "agora há pouco";
    if (abs < 3600) return relativeTime.format(Math.round(seconds / 60), "minute");
    if (abs < 86400) return relativeTime.format(Math.round(seconds / 3600), "hour");

    return relativeTime.format(Math.round(seconds / 86400), "day");
}
