
export const CARRERAS_UTM = [
  "ingenieria en diseño",
  "civil",
  "mecatronica",
  "mecanica automotriz",
  "fisica",
  "computacion",
  "alimentos",
  "matematicas aplicadas",
] as const;

export type CarreraUTM = (typeof CARRERAS_UTM)[number];
