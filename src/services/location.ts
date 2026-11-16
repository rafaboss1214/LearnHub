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

type AddressParts = Pick<CepLocation, "cep" | "street" | "neighborhood" | "city" | "state">;

async function geocodeAddress(address: AddressParts) {
  const searches = [
    new URLSearchParams({
      format: "jsonv2",
      limit: "1",
      countrycodes: "br",
      street: address.street,
      city: address.city,
      state: address.state,
      postalcode: address.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2"),
    }),
    new URLSearchParams({
      format: "jsonv2",
      limit: "1",
      countrycodes: "br",
      q: [address.street, address.neighborhood, address.city, address.state, "Brasil"].filter(Boolean).join(", "),
    }),
  ];

  for (const search of searches) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${search.toString()}`, {
        headers: { "Accept-Language": "pt-BR", "User-Agent": "LearnHub/1.0 (projeto educacional)" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) continue;
      const [result] = await response.json();
      const latitudeAprox = coordinate(result?.lat, -90, 90);
      const longitudeAprox = coordinate(result?.lon, -180, 180);
      if (latitudeAprox != null && longitudeAprox != null) return { latitudeAprox, longitudeAprox };
    } catch {
      // A ausência de coordenadas é mais segura do que exibir um bairro incorreto.
    }
  }
  return { latitudeAprox: null, longitudeAprox: null };
}

export async function lookupCepLocation(value: string): Promise<CepLocation> {
  const cep = value.replace(/\D/g, "");
  if (!/^\d{8}$/.test(cep)) throw new Error("Informe um CEP com 8 dígitos.");

  let address: AddressParts;
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    const data = await response.json();
    if (!response.ok) throw new Error();
    address = {
      cep,
      street: data.street || "",
      neighborhood: data.neighborhood || "",
      city: data.city || "",
      state: data.state || "",
    };
  } catch {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    if (!response.ok || data.erro) throw new Error("Não foi possível localizar este CEP.");
    address = {
      cep,
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };
  }

  const coordinates = await geocodeAddress(address);
  return { ...address, ...coordinates };
}
