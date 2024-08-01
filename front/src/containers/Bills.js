import { ROUTES_PATH } from "../constants/routes.js";
import { formatDate, formatStatus } from "../app/format.js";
import Logout from "./Logout.js";

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const buttonNewBill = document.querySelector(
      `button[data-testid="btn-new-bill"]`
    );
    if (buttonNewBill)
      buttonNewBill.addEventListener("click", this.handleClickNewBill);
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
    if (iconEye)
      iconEye.forEach((icon) => {
        icon.addEventListener("click", () => this.handleClickIconEye(icon));
      });
    new Logout({ document, localStorage, onNavigate });
  }

  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH["NewBill"]);
  };

  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url");
    const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
    $("#modaleFile")
      .find(".modal-body")
      .html(
        `<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`
      );
    $("#modaleFile").modal("show");
  };

  getBills = () => {
    if (this.store) {
      //console.log("store", this.store);
      return this.store
        .bills()
        .list()
        .then((snapshot) => {
          // Bug réparé : trie le tableau bills par ordre décroissant de date
          const bills = snapshot
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // trie des factures par date décroissante
            .map((doc) => {
              try {
                return {
                  ...doc,
                  date: formatDate(doc.date), // Formate la date de la facture
                  status: formatStatus(doc.status), // Formate le statut de la facture
                };
              } catch (e) {
                // En cas d'erreur lors du formatage, affiche l'erreur dans la console
                console.log(e, "for", doc);
                // Retourne la facture avec la date non formatée et le statut formaté
                return {
                  ...doc,
                  date: doc.date, // Utilise la date non formatée en cas d'erreur
                  status: formatStatus(doc.status), // Formate le statut de la facture
                };
              }
            });
          return bills;
        });
    }
  };
}
