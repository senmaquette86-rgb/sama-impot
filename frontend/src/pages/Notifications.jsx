import { useEffect, useState } from "react";
import api from "../api/client";
import { formaterDate } from "../utils/format";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [chargement, setChargement] = useState(true);

  const charger = () =>
    api
      .get("/notifications/")
      .then((res) => setNotifications(res.data.results))
      .finally(() => setChargement(false));

  useEffect(() => {
    charger();
  }, []);

  const toutLire = async () => {
    await api.post("/notifications/tout_lire/");
    charger();
  };

  const marquerLu = async (id) => {
    await api.post(`/notifications/${id}/lire/`);
    charger();
  };

  const nonLues = notifications.filter((n) => !n.lu).length;

  return (
    <div>
      <div className="entete-page">
        <div>
          <h1>Notifications</h1>
          <p className="sous-titre">
            {nonLues > 0 ? `${nonLues} notification(s) non lue(s).` : "Tout est à jour."}
          </p>
        </div>
        {nonLues > 0 && (
          <button className="btn btn-secondaire" onClick={toutLire}>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {chargement ? (
        <p className="chargement">Chargement…</p>
      ) : notifications.length === 0 ? (
        <div className="vide">Aucune notification.</div>
      ) : (
        <div className="liste-notifs">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notif ${n.lu ? "" : "non-lu"}`}
              onClick={() => !n.lu && marquerLu(n.id)}
            >
              <div className={`notif-pastille type-${n.type}`} />
              <div className="notif-corps">
                <div className="notif-entete">
                  <strong>{n.titre}</strong>
                  <span className="secondaire">{formaterDate(n.date_creation)}</span>
                </div>
                <p>{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
