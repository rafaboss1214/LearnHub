export type CepLocation = {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  latitudeAprox: number | null;
  longitudeAprox: number | null;
};

function coordinate(value: unknown, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export async function lookupCepLocation(value: string): Promise<CepLocation> {
  const cep = value.replace(/\D/g, "");
  if (!/^\d{8}$/.test(cep)) throw new Error("Informe um CEP com 8 dígitos.");

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    const data = await response.json();
    if (!response.ok) throw new Error();
    return {
      cep,
      street: data.street || "",
      neighborhood: data.neighborhood || "",
      city: data.city || "",
      state: data.state || "",
      latitudeAprox: coordinate(data.location?.coordinates?.latitude, -90, 90),
      longitudeAprox: coordinate(data.location?.coordinates?.longitude, -180, 180),
    };
  } catch {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    if (!response.ok || data.erro) throw new Error("Não foi possível localizar este CEP.");
    return {
      cep,
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
      latitudeAprox: null,
      longitudeAprox: null,
    };
  }
}
