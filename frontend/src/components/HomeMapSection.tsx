import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Panel, SectionLabel } from "./Ui";

const office: [number, number] = [53.3165, 82.9675];

export default function HomeMapSection() {
  const [zones, setZones] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/map-zones.geojson");
        const gj = (await res.json()) as GeoJsonObject;
        setZones(gj);
      } catch {
        /* no map file */
      }
    })();
  }, []);

  const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return (
    <Panel className="p-0 overflow-hidden">
      <div className="border-b border-line px-6 py-4">
        <SectionLabel>Территория работ</SectionLabel>
        <p className="mt-2 font-display text-xl text-bistre">Павловский район и Алтайский край</p>
        <p className="mt-2 max-w-xl text-sm text-ink/80">
          Условная зона выезда на объект. Конкретный график и маршрут согласуются при заключении договора.
        </p>
      </div>
      <div className="h-[320px] w-full sm:h-[380px]">
        <MapContainer center={office} zoom={10} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {zones && (
            <GeoJSON
              data={zones}
              style={() => ({
                color: "#5c4033",
                weight: 1.5,
                fillColor: "#8b6f56",
                fillOpacity: 0.12,
              })}
            />
          )}
          <Marker position={office} icon={icon}>
            <Popup>
              с. Павловск, ул. Пионерская, 20г
              <br />
              Предварительная запись
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </Panel>
  );
}
