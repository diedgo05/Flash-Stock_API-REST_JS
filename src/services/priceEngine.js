/**
 * Calcula el precio actual de una oferta basándose en el tiempo transcurrido.
 * El precio cae linealmente desde initial_price hasta min_price
 * conforme avanza el tiempo entre start_time y end_time.
 *
 * Ejemplo:
 *   initial_price = $200, min_price = $100
 *   Duración: 60 minutos
 *   A los 30 minutos (50% del tiempo) → precio = $150
 */
const calculateCurrentPrice = (offer) => {
    const now = Date.now();
    const start = new Date(offer.start_time).getTime();
    const end = new Date(offer.end_time).getTime();
  
    // Aún no empieza
    if (now <= start) return parseFloat(offer.initial_price);
  
    // Ya terminó, dar precio mínimo
    if (now >= end) return parseFloat(offer.min_price);
  
    const totalDuration = end - start;
    const elapsed = now - start;
    const progress = elapsed / totalDuration; // 0.0 → 1.0
  
    const initialPrice = parseFloat(offer.initial_price);
    const minPrice = parseFloat(offer.min_price);
    const priceRange = initialPrice - minPrice;
  
    const currentPrice = initialPrice - (priceRange * progress);
  
    // Redondear a 2 decimales, sin bajar del precio mínimo
    return Math.max(parseFloat(currentPrice.toFixed(2)), minPrice);
  };
  
  module.exports = { calculateCurrentPrice };