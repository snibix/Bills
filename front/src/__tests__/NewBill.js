/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";

// **************Tests de Connexion**********

// Étant donné que je suis connecté en tant qu'employé
describe("Given I am connected as an employee", () => {
  // Quand je suis sur la page NewBill
  describe("When I am on NewBills Page", () => {
    // Alors l'icône de facture dans la mise en page verticale doit être surlignée
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Simuler le localStorage avec un utilisateur de type Employee
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
      window.onNavigate(ROUTES_PATH.NewBill);
      const mailIcon = await waitFor(() => screen.getByTestId("icon-mail"));
      const windowIcon = screen.getByTestId("icon-window");
      const form = screen.getByTestId("form-new-bill");
      expect(form.length).toBe(9);
      expect(mailIcon.classList.contains("active-icon")).toBe(true);
      expect(windowIcon.classList.contains("active-icon")).toBe(false);
    });
  });

  // ***********Tests de Formulaire***************

  // Quand je suis sur la page NewBill
  describe("When I am on NewBill Page", () => {
    // Alors un formulaire devrait être affiché
    test("Then a form should be displayed", () => {
      //  // Afficher l'interface utilisateur de NewBill
      document.body.innerHTML = NewBillUI();

      const form = screen.getByTestId("form-new-bill");
      const type = screen.getAllByTestId("expense-type");
      const name = screen.getAllByTestId("expense-name");
      const date = screen.getAllByTestId("datepicker");
      const amount = screen.getAllByTestId("amount");
      const vat = screen.getAllByTestId("vat");
      const pct = screen.getAllByTestId("pct");
      const commentary = screen.getAllByTestId("commentary");
      const file = screen.getAllByTestId("file");
      const sendButton = document.querySelector("#btn-send-bill");

      // Vérifier que tous les éléments du formulaire sont présents
      expect(form).toBeTruthy();
      expect(type).toBeTruthy();
      expect(name).toBeTruthy();
      expect(date).toBeTruthy();
      expect(amount).toBeTruthy();
      expect(vat).toBeTruthy();
      expect(pct).toBeTruthy();
      expect(commentary).toBeTruthy();
      expect(file).toBeTruthy();
      expect(sendButton).toBeTruthy();
    });
  });

  // ***************Téléchargement de Fichier*****************
  // Bon Format
  // Quand je suis sur la page NewBill et que je veux télécharger une image au bon format
  describe("When I am on NewBill Page and I want upload a good format image", () => {
    // Alors un fichier devrait être téléchargé
    test("Then a file should be uploaded", () => {
      // Simuler le localStorage avec un utilisateur de type Employee
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage,
      });

      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      const file = screen.getByTestId("file");
      file.addEventListener("change", handleChangeFile);

      fireEvent.change(file, {
        target: {
          files: [new File(["image.jpg"], "image.jpg", { type: "image/jpg" })],
        },
      });

      window.alert = jest.fn();
      expect(handleChangeFile).toHaveBeenCalled();
      expect(newBill.formData).not.toBe(null);
      expect(file.files[0].name).toBe("image.jpg");
      expect(file.files[0].type).toBe("image/jpg");
      expect(window.alert).not.toHaveBeenCalled();
    });
  });

  // ***************Mauvais Format************

  // Quand je suis sur la page NewBill et que je veux télécharger une image au mauvais format
  describe("When I am on NewBill Page and I want upload a bad format image", () => {
    // Alors un fichier ne devrait pas être téléchargé
    test("Then a file should not be uploaded", () => {
      // Simuler le localStorage avec un utilisateur de type Employee
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = NewBillUI();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      const file = screen.getByTestId("file");
      file.addEventListener("change", handleChangeFile);

      window.alert = jest.fn();

      fireEvent.change(file, {
        target: {
          files: [new File(["image.pdf"], "image.pdf", { type: "file/pdf" })],
        },
      });

      expect(window.alert).toHaveBeenCalled();
      expect(handleChangeFile).toHaveBeenCalled();
      expect(file.files[0].name).toBe("image.pdf");
      expect(file.files[0].type).toBe("file/pdf");
      expect(newBill.pictureTypeValid).toBe(undefined);
    });
  });

  // *****************Soumission du Formulaire*****************

  // Quand je suis sur la page NewBill et que je clique sur envoyer
  describe("When I am on NewBill Page and I click on send", () => {
    test("Then the handleSubmit function should be called", () => {
      // Simuler le localStorage avec un utilisateur de type Employee
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = NewBillUI();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const store = {
        bills: jest.fn(() => newBill.store),
        create: jest.fn(() => Promise.resolve({})),
        update: jest.fn(() => Promise.reject(new Error("500"))),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage,
      });

      const handleSubmit = jest.fn(() => newBill.handleSubmit);

      newBill.fileName = "preview-facture-free-201801-pdf-1.jpg";
      newBill.fileUrl =
        "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=4df6ed2c-12c8-42a2-b013-346c1346f732";
      newBill.validImage = true;

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});

// **************Tests d'Intégration pour POST************

// Initialisation du test POST
describe("When I am connected as an Employee", () => {
  // Étant donné que je suis sur la page NewBill et que je soumets une nouvelle note de frais
  describe("Given I am on NewBill Page and I submit a new bill", () => {
    // Test pour vérifier que la création d'une nouvelle note de frais via l'API fonctionne correctement
    test("Then it should create a new bill from API", async () => {
      // Espionner la méthode bills du mockStore pour vérifier qu'elle est appelée
      const postSpy = jest.spyOn(mockStore, "bills");
      // Définir les données de la nouvelle note de frais
      const bill = {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
          "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20,
      };
      // Simuler l'appel à l'API pour créer la note de frais
      const postBills = await mockStore.bills().update(bill);
      // Vérifier que la méthode bills a été appelée une fois
      expect(postSpy).toHaveBeenCalledTimes(1);
      // Vérifier que la note de frais retournée est correcte
      expect(postBills).toEqual(bill);
    });

    // Étant donné qu'une erreur survient lors de l'ajout d'une note de frais via l'API
    describe("When an error occurs", () => {
      // Test pour vérifier qu'une erreur 404 est correctement gérée
      test("Add bills with an API and a 404 message error occurs", async () => {
        // Configurer le stockage local avec les informations de l'utilisateur employé
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        // Initialiser l'interface utilisateur de la page NewBill
        document.body.innerHTML = NewBillUI();

        // Fonction de navigation pour changer la vue
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        // Espionner la méthode console.error pour vérifier qu'elle est appelée
        const postSpy = jest.spyOn(console, "error");

        // Créer une instance de NewBill avec un store simulant une erreur 404
        const newBill = new NewBill({
          document,
          onNavigate,
          store: {
            bills: jest.fn(() => newBill.store),
            create: jest.fn(() => Promise.resolve({})),
            update: jest.fn(() => Promise.reject(new Error("404"))),
          },
          localStorage,
        });
        newBill.validImg = true;

        // Obtenir le formulaire et ajouter un écouteur d'événement pour la soumission
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);

        // Simuler la soumission du formulaire
        fireEvent.submit(form);
        // Attendre la fin du traitement asynchrone
        await new Promise(process.nextTick);
        // Vérifier que console.error a été appelée avec l'erreur 404
        expect(postSpy).toHaveBeenCalledWith(new Error("404"));
      });

      // Test pour vérifier qu'une erreur 500 est correctement gérée
      test("Add bills with an API and a 500 message error occurs", async () => {
        // Espionner la méthode console.error pour vérifier qu'elle est appelée
        const postSpy = jest.spyOn(console, "error");

        // Créer une instance de NewBill avec un store simulant une erreur 500
        const newBill = new NewBill({
          document,
          onNavigate,
          store: {
            bills: jest.fn(() => newBill.store),
            create: jest.fn(() => Promise.resolve({})),
            update: jest.fn(() => Promise.reject(new Error("500"))),
          },
          localStorage,
        });

        newBill.validImg = true;

        // Obtenir le formulaire et ajouter un écouteur d'événement pour la soumission
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);

        // Simuler la soumission du formulaire
        fireEvent.submit(form);
        // Attendre la fin du traitement asynchrone
        await new Promise(process.nextTick);
        // Vérifier que console.error a été appelée avec l'erreur 500
        expect(postSpy).toHaveBeenCalledWith(new Error("500"));
      });
    });
  });
});
