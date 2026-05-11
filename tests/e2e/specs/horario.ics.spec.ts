// tests/e2e/specs/horario.ics.spec.ts
//
// CU-06 · Flujo alternativo "Agregar a calendario" — descarga .ics.
// Verifica que el archivo es RFC 5545 mínimamente válido (header,
// VEVENT, DTSTART, DTEND, UID, RRULE, footer).

import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

import { HorarioPage } from "../pages/HorarioPage";

test.describe("CU-06 · Exportación a calendario (.ics)", () => {
  test("descarga .ics conforme a RFC 5545", async ({ page }) => {
    const horario = new HorarioPage(page);
    await horario.goto("/alumno/horario");

    const download = await horario.downloadIcs();
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^horario_.+\.ics$/);

    const path = await download.path();
    expect(path).toBeTruthy();
    const content = await readFile(path!, "utf8");

    // Estructura mínima.
    expect(content).toMatch(/^BEGIN:VCALENDAR/m);
    expect(content).toMatch(/VERSION:2\.0/);
    expect(content).toMatch(/PRODID:-\/\/SIGCI UTM\/\/Horario\/\/ES/);
    expect(content.trim().endsWith("END:VCALENDAR")).toBe(true);

    // Al menos un VEVENT con los campos obligatorios.
    const events = content.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];
    expect(events.length).toBeGreaterThan(0);

    for (const ev of events) {
      expect(ev).toMatch(/UID:[^\s]+@sigci\.utm\.mx/);
      expect(ev).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
      expect(ev).toMatch(/DTSTART;TZID=America\/Mexico_City:\d{8}T\d{6}/);
      expect(ev).toMatch(/DTEND;TZID=America\/Mexico_City:\d{8}T\d{6}/);
      expect(ev).toMatch(/RRULE:FREQ=WEEKLY;BYDAY=(MO|TU|WE|TH|FR|SA);UNTIL=\d{8}T\d{6}Z/);
      expect(ev).toMatch(/SUMMARY:.+/);
      expect(ev).toMatch(/LOCATION:Aula .+/);
    }
  });

  test("texto con comas se escapa en SUMMARY", async ({ page }) => {
    const horario = new HorarioPage(page);
    await horario.goto("/alumno/horario");
    const download = await horario.downloadIcs();
    const content = await readFile((await download.path())!, "utf8");

    // Buscamos cualquier coma fuera de campos estructurales. Heurística:
    // SUMMARY/LOCATION/DESCRIPTION nunca deben contener ',' sin escapar.
    const offenders = content
      .split(/\r?\n/)
      .filter((l) => /^(SUMMARY|LOCATION|DESCRIPTION):/.test(l))
      .filter((l) => /(?<!\\),/.test(l));
    expect(offenders).toEqual([]);
  });
});
