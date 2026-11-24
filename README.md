# Carga S05 PHEV ⚡

Calculadora de carga para el Changan Deepal S05 **PHEV** (LFP 18,42 kWh, AC 11 kW, DC 55 kW)
con coste real **PVPC 2.0TD** hora a hora para el cargador Depow (8, 10 y 16 A).

Web: https://tonybeat2-sudo.github.io/carga-s05-phev/

Cada día una tarea automática de GitHub (Actions → «Precios PVPC y publicación») descarga los
precios oficiales de hoy y mañana de Red Eléctrica (API pública REData, sin token) y vuelve a
publicar la web. ESIOS publica los del día siguiente hacia las 20:15; la tarea corre a las
19:40, 20:40 y 23:10 UTC.

Si GitHub pausa la tarea tras 60 días sin actividad, entra en Actions y pulsa *Enable workflow*.

Respaldo opcional: token de ESIOS (pedir a consultasios@ree.es) guardado como secreto `ESIOS_TOKEN`.
