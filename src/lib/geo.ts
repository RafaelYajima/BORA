/** Distância aproximada em linha reta entre duas coordenadas (km). */
export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const raio = 6371;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * raio * Math.asin(Math.sqrt(a));
}
