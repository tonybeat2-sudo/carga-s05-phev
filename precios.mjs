// Descarga el PVPC 2.0TD (término de energía, €/MWh) de hoy y mañana y lo guarda en precios.json (€/kWh).
// Fuente 1: API pública REData de Red Eléctrica (sin token).
// Fuente 2 (respaldo): API de ESIOS, indicador 1001, si existe el secreto ESIOS_TOKEN.
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const TZ = "Europe/Madrid";
const fecha = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // AAAA-MM-DD
const hoy = fecha(new Date());
const manana = fecha(new Date(Date.now() + 864e5));

function agrupa(valores) {
  // valores: [{datetime:"2026-11-23T00:00:00.000+01:00", value: 123.4}, ...]
  const dias = {};
  for (const v of valores) {
    const [d, t] = v.datetime.split("T");
    const h = +t.slice(0, 2);
    (dias[d] ||= Array(24).fill(null));
    if (dias[d][h] == null) dias[d][h] = +(v.value / 1000).toFixed(5); // €/MWh -> €/kWh
  }
  return dias;
}

async function redata() {
  const url = `https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real?start_date=${hoy}T00:00&end_date=${manana}T23:59&time_trunc=hour`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`REData HTTP ${r.status}`);
  const j = await r.json();
  const serie = (j.included || []).find((x) => /pvpc/i.test(x?.attributes?.title || x?.type || ""));
  if (!serie) throw new Error("REData: no aparece la serie PVPC");
  return agrupa(serie.attributes.values);
}

async function esios() {
  const token = process.env.ESIOS_TOKEN;
  if (!token) throw new Error("ESIOS: sin token");
  const url = `https://api.esios.ree.es/indicators/1001?start_date=${hoy}T00:00&end_date=${manana}T23:59&time_trunc=hour`;
  const r = await fetch(url, { headers: { Accept: "application/json; application/vnd.esios-api-v1+json", "x-api-key": token } });
  if (!r.ok) throw new Error(`ESIOS HTTP ${r.status}`);
  const j = await r.json();
  const vals = j.indicator.values.filter((v) => !v.geo_id || v.geo_id === 8741); // península
  return agrupa(vals);
}

let dias = null, fuente = "";
for (const [nombre, fn] of [["REData (REE)", redata], ["ESIOS", esios]]) {
  try { dias = await fn(); fuente = nombre; break; } catch (e) { console.warn(e.message); }
}
if (!dias || !Object.keys(dias).length) { console.error("No se han podido descargar precios"); process.exit(1); }

// Conserva días anteriores ya guardados (máx. 7) por si se consulta una carga que empezó ayer
let previo = {};
if (existsSync("precios.json")) { try { previo = JSON.parse(readFileSync("precios.json", "utf8")).dias || {}; } catch {} }
const todos = { ...previo, ...dias };
const claves = Object.keys(todos).sort().slice(-7);
const salida = { actualizado: new Date().toISOString(), fuente, unidad: "€/kWh sin impuestos", dias: Object.fromEntries(claves.map((k) => [k, todos[k]])) };
writeFileSync("precios.json", JSON.stringify(salida, null, 1));
console.log(`OK ${fuente}: ${Object.keys(dias).join(", ")}`);
