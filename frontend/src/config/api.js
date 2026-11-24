/**
 * URL base da API do backend.
 *
 * Em outra máquina ou ambiente, defina `VITE_API_URL` no arquivo
 * `frontend/.env` (veja `frontend/.env.example`).
 */
export const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/+$/, "");
