/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
jest.mock("../app/Store", () => mockStore);

//Étant donné que je suis connecté en tant qu'employé
describe("Given I am connected as an employee", () => {
  //Quand je suis sur la page Bills(factures)
  describe("When I am on Bills Page", () => {
    //Ensuite, l'icône de la facture dans la disposition verticale doit être mise en surbrillance
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Simulation des donnée dans le locale storage
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");

      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      // Extraire le contenu HTML de chaque élément trouvé par getAllByText
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);

      // Définir une fonction de comparaison pour trier les dates dans l'ordre anti-chronologique
      const antiChrono = (a, b) => (a < b ? 1 : -1);

      // Créer une copie du tableau `dates` triée selon l'ordre anti-chronologique
      const datesSorted = [...dates].sort(antiChrono);

      // Vérifier que les dates extraites sont égales aux dates triées en ordre anti-chronologique
      expect(dates).toEqual(datesSorted);
    });
  });
});

// --------------------- container/Bill------------------------

//**** */ Test handleClickIconEye  /****** */

// Lorsque je clique sur la premiere icone
describe("When I click on first icon", () => {
  // Alors la modal devrair s'ouvrir
  test("Then modal should open", () => {
    // Simule des données dans le localstorage
    Object.defineProperty(window, localStorage, { value: localStorageMock });

    // Simulation d'un utilisateur de type employé dans le locale storage
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
    const html = BillsUI({ data: bills }); //création de la constante la modale facture de l'employé
    document.body.innerHTML = html;

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    const billsContainer = new Bills({
      document,
      onNavigate,
      localStorage: localStorageMock,
      store: null,
    });

    // MOCK de la modal
    $.fn.modal = jest.fn();

    //MOCK l'icone de click
    const handleClickIconEye = jest.fn(() => {
      billsContainer.handleClickIconEye;
    });

    const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
    firstEyeIcon.addEventListener("click", handleClickIconEye);
    fireEvent.click(firstEyeIcon);

    expect(handleClickIconEye).toHaveBeenCalled();
    expect($.fn.modal).toHaveBeenCalled();
  });
});

//************ */ Test navigation  /*********** */

// Lorsque je clique sur le bouton nouvelle note de frais
describe("When i click the button 'Nouvelle note de frais'", () => {
  // Alors je rediriger vers NewBill
  test("then i redirect to NewBill", () => {
    //J'intègre le chemin d'accès
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    const billsPage = new Bills({
      document,
      onNavigate,
      store: null,
      bills: bills,
      localStorage: window.localStorage,
    });

    // Création constante pour la fonction qui appel la fonction a tester
    const OpenNewBill = jest.fn(billsPage.handleClickNewBill);
    // Boutton "Nouvelle note de frais"
    const btnNewBill = screen.getByTestId("btn-new-bill");

    // Écoute l'event
    btnNewBill.addEventListener("click", OpenNewBill); //écoute évènement
    // Simule un click sur le boutton "Nouvelle note de frais"
    fireEvent.click(btnNewBill);
    // Verification que OpenNewBill a bien été appeler
    expect(OpenNewBill).toHaveBeenCalled();
    // Vérification que je suis bien sur la page "nouvelle note de frais"
    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
  });
});
// *********** / Test d'intégration ""GET BILLS""" / ******

// Quand je demande de récupérer des factures
describe("When I get bills", () => {
  // Alors, il devrait afficher les fectures
  test("Then it should render bills", async () => {
    // Recupération des factures dans le store
    const bills = new Bills({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    const getBills = jest.fn(() => bills.getBills());

    const value = await getBills();

    // getBills doit être appeler
    expect(getBills).toHaveBeenCalled();
    // Test si la longeur du tableau (4 factures du __mocks__ store)
    expect(value.length).toBe(4); //test si la longeur du tableau est a 4 du store.js
  });
});
//********** / Test ERREUR 404 et 500/  ********

// Quand une erreur se produit sur l'API
describe("When an error occurs on API", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills");
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });

  // Ensuite, je récupère les factures dans l'api et cela échoue avec une erreur 404
  test("Then i fetch the invoices in the api and it fails with a 404 error", async () => {
    // Change le comportement pour générer un erreur
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 404"));
        },
      };
    });

    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = screen.getByText(/Erreur 404/);
    expect(message).toBeTruthy();
  });

  // Ensuite, je récupère les factures dans l'api et cela échoue avec une erreur 500
  test("Then i fetch the invoices in the api and it fails with a 500 error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 500"));
        },
      };
    });

    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = screen.getByText(/Erreur 500/);
    expect(message).toBeTruthy();
  });
});
